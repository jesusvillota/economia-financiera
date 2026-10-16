import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { startPreview } from './preview.mjs';

const num = (value, digits = 2) => value.toFixed(digits).replace('.', ',');
const pct = value => `${num(value * 100)} %`;
const server = await startPreview();
const loader = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
let browser;
let comparisons = 0;
try {
  const { riskFreeMix, sharpeRatio, tangentPortfolio } = await loader.ssrLoadModule('/src/lib/finance/capm.ts');
  const { covarianceFromCorrelations, frontierPoint, globalMinimumVariance } = await loader.ssrLoadModule('/src/lib/finance/portfolio.ts');
  browser = await chromium.launch();
  for (const theme of ['dark', 'light']) for (const width of [1280, 360]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addInitScript(value => localStorage.setItem('theme', value), theme);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const response = await page.goto(`${server.base}chapters/09-activo-libre-riesgo/`, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    assert.deepEqual(await page.locator('h2 .section-tag').allTextContents(),
      ['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    assert.equal(await page.locator('.widget').count(), 1);
    const widget = page.locator('.widget');
    await widget.scrollIntoViewIfNeeded();
    await widget.locator('.MafsView').waitFor();
    const rhoSlider = widget.getByRole('slider', { name: /Correlación/ });
    const targetSlider = widget.getByRole('slider', { name: 'Rentabilidad de la cartera', exact: true });
    const weightSlider = widget.getByRole('slider', { name: 'Peso del fondo con riesgo', exact: true });
    const shorts = widget.getByRole('checkbox');
    assert.equal(await widget.getByRole('slider').count(), 3);
    async function verify(name) {
      const rho = Number(await rhoSlider.inputValue());
      const target = Number(await widget.getByTestId('frontier-portfolio').getAttribute('data-target'));
      const weight = Number(await widget.getByTestId('cal-portfolio').getAttribute('data-weight'));
      const covariance = covarianceFromCorrelations([0.1, 0.2], [[1, rho], [rho, 1]]);
      const selected = frontierPoint([0.08, 0.14], covariance, target, !await shorts.isChecked());
      const minimum = globalMinimumVariance([0.08, 0.14], covariance, !await shorts.isChecked());
      const mix = riskFreeMix(0.02, selected.expectedReturn, selected.sigma, weight);
      let t = null;
      if (Math.abs(rho) < 1) t = tangentPortfolio([0.08, 0.14], covariance, 0.02);
      const expected = {
        'frontier-return': pct(selected.expectedReturn), 'frontier-sigma': pct(selected.sigma),
        'frontier-variance': num(selected.variance, 6), 'frontier-min-return': pct(minimum.expectedReturn),
        'frontier-min-sigma': pct(minimum.sigma),
        'cal-weight': pct(weight), 'cal-cash': pct(mix.riskFreeWeight),
        'cal-return': pct(mix.expectedReturn), 'cal-sigma': pct(mix.sigma), 'cal-variance': num(mix.variance, 6),
        'cal-sharpe': selected.sigma > 1e-10 ? num(sharpeRatio(selected.expectedReturn, 0.02, selected.sigma), 4) : 'No definido',
        'tangent-return': t ? pct(t.expectedReturn) : 'No definida',
        'tangent-sigma': t ? pct(t.sigma) : 'No definida', 'tangent-sharpe': t ? num(t.sharpe, 4) : 'No definida',
      };
      for (let i = 0; i < 2; i++) {
        expected[`frontier-weight-${i}`] = pct(selected.weights[i]);
        expected[`frontier-min-weight-${i}`] = pct(minimum.weights[i]);
        expected[`tangent-weight-${i}`] = t ? pct(t.weights[i]) : 'No definida';
      }
      for (const [id, want] of Object.entries(expected)) {
        await page.waitForFunction(({ id, want }) => document.querySelector(`[data-testid="${id}"]`)?.textContent === want, { id, want });
        assert.equal(await widget.getByTestId(id).textContent(), want);
        comparisons++;
      }
      console.log(`✓ ${theme} ${width}px: ${name}; readouts match capm.ts and portfolio.ts`);
    }
    await verify('default');
    await widget.screenshot({ path: `screenshots/cap9-widget-${theme}-${width}.png` });
    for (const weight of [0, 1, 1.5, 0.5]) {
      await weightSlider.fill(String(weight));
      await verify(`fund weight ${weight}`);
    }
    await weightSlider.focus();
    await weightSlider.press('ArrowRight');
    assert.equal(Number(await weightSlider.inputValue()), 0.51);
    await verify('allocation keyboard');
    for (const rho of [-0.5, 0.5, 0.95, -1, 1, 0]) {
      await rhoSlider.fill(String(rho));
      await verify(`correlation ${rho}`);
    }
    await targetSlider.fill('0.17');
    await verify('short-sale fund');
    await shorts.uncheck();
    assert.equal(Number(await targetSlider.inputValue()), 0.14);
    await verify('long-only clamp');
    await targetSlider.fill('0.08');
    await weightSlider.fill('0.5');
    await verify('half in A');
    await targetSlider.fill('0.13');
    await verify('different risky fund');
    await targetSlider.focus();
    await targetSlider.press('ArrowLeft');
    await verify('fund keyboard');
    for (const [id, attribute, dx, dy] of [
      ['cal-portfolio', 'data-weight', 18, 0], ['frontier-portfolio', 'data-target', 0, -18],
    ]) {
      const group = widget.getByTestId(id);
      const before = Number(await group.getAttribute(attribute));
      const handle = group.locator('[tabindex="0"]');
      await handle.evaluate(element => element.scrollIntoView({ block: 'center' }));
      const box = await handle.boundingBox();
      assert.ok(box);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, { steps: 8 });
      await page.mouse.up();
      await page.waitForFunction(({ id, attribute, before }) => Number(document.querySelector(`[data-testid="${id}"]`)?.getAttribute(attribute)) > before, { id, attribute, before });
      await verify(`${id} drag`);
    }
    const quizzes = page.locator('.quiz');
    assert.equal(await quizzes.count(), 3);
    for (const [i, correct] of [1, 2, 1].entries()) {
      const quiz = quizzes.nth(i);
      await quiz.scrollIntoViewIfNeeded();
      await quiz.getByRole('button').nth(0).click();
      assert.match(await quiz.getByRole('status').textContent(), /No exactamente/);
      await quiz.getByRole('button', { name: 'Inténtalo de nuevo' }).click();
      await quiz.getByRole('button').nth(correct).click();
      assert.match(await quiz.getByRole('status').textContent(), /Correcto/);
    }
    assert.equal(await page.locator('.katex-error').count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow');
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(`✓ ${comparisons} library readout comparisons; all controls, both drags, quizzes and six sections pass; no console, KaTeX or overflow errors`);
} finally {
  await browser?.close();
  await loader.close();
  await server.stop();
}
