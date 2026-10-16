/** Exercise every chapter-8 control against the actual portfolio library in all four visual modes. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { startPreview } from './preview.mjs';

const num = (value, digits = 2) => value.toFixed(digits).replace('.', ',');
const pct = value => `${num(value * 100)} %`;
const server = await startPreview();
const loader = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' });
let browser;
let comparisons = 0;
try {
  const { covarianceFromCorrelations, portfolioReturn, portfolioVariance, frontierPoint, globalMinimumVariance } =
    await loader.ssrLoadModule('/src/lib/finance/portfolio.ts');
  const returns = [0.06, 0.10, 0.14];
  const covariance = rho => covarianceFromCorrelations([0.12, 0.20, 0.28], [[1, rho, 0], [rho, 1, 0], [0, 0, 1]]);
  browser = await chromium.launch();
  for (const theme of ['dark', 'light']) for (const width of [1280, 360]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addInitScript(value => localStorage.setItem('theme', value), theme);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const response = await page.goto(`${server.base}chapters/08-markowitz/`, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    assert.deepEqual(await page.locator('h2 .section-tag').allTextContents(),
      ['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    const mix = page.locator('.widget').filter({ has: page.getByText('Tu mezcla de tres activos', { exact: true }) });
    const curve = page.locator('.widget').filter({ has: page.getByText('La frontera de tres activos', { exact: true }) });
    await mix.scrollIntoViewIfNeeded();
    await mix.locator('.MafsView').waitFor();
    async function readouts(widget, values) {
      for (const [id, want] of Object.entries(values)) {
        const locator = widget.getByTestId(id);
        await page.waitForFunction(({ element, want }) => element.textContent === want,
          { element: await locator.elementHandle(), want });
        assert.equal(await locator.textContent(), want, id);
        comparisons++;
      }
    }
    async function verifyMix(a, b) {
      const weights = [a, (1 - a) * b, (1 - a) * (1 - b)];
      const variance = portfolioVariance(weights, covariance(0.2));
      await readouts(mix, {
        ...Object.fromEntries(weights.map((w, i) => [`mix-weight-${i}`, pct(w)])),
        'mix-return': pct(portfolioReturn(weights, returns)),
        'mix-sigma': pct(Math.sqrt(variance)), 'mix-variance': num(variance, 6),
      });
    }
    const weightA = mix.getByRole('slider', { name: 'Peso de A', exact: true });
    const shareB = mix.getByRole('slider', { name: 'Parte del resto para B', exact: true });
    await verifyMix(0.5, 0.5);
    for (const [a, b] of [[0.25, 0.5], [0, 0], [0, 1], [1, 0.3], [0.4, 0.7], [0.5, 0.5]]) {
      await weightA.fill(String(a)); await shareB.fill(String(b));
      await verifyMix(a, b);
    }
    await weightA.focus(); await page.keyboard.press('ArrowRight');
    await verifyMix(0.51, 0.5);
    await shareB.focus(); await page.keyboard.press('ArrowLeft');
    await verifyMix(0.51, 0.49);

    await curve.scrollIntoViewIfNeeded();
    await curve.locator('.MafsView').waitFor();
    const rhoSlider = curve.getByRole('slider', { name: /Correlación/ });
    const targetSlider = curve.getByRole('slider', { name: 'Rentabilidad de la cartera', exact: true });
    const toggle = curve.getByRole('checkbox', { name: 'Permitir ventas en corto' });
    async function verifyCurve(rho, shortSales, target) {
      const selected = frontierPoint(returns, covariance(rho), target, !shortSales);
      const minimum = globalMinimumVariance(returns, covariance(rho), !shortSales);
      await readouts(curve, {
        'frontier-return': pct(selected.expectedReturn), 'frontier-sigma': pct(selected.sigma),
        'frontier-variance': num(selected.variance, 6),
        'frontier-min-return': pct(minimum.expectedReturn), 'frontier-min-sigma': pct(minimum.sigma),
        ...Object.fromEntries(selected.weights.map((w, i) => [`frontier-weight-${i}`, pct(w)])),
        ...Object.fromEntries(minimum.weights.map((w, i) => [`frontier-min-weight-${i}`, pct(w)])),
      });
    }
    await verifyCurve(0.2, false, 0.09);
    for (const rho of [-1, 0, 0.2, 0.95, 1]) {
      await rhoSlider.fill(String(rho));
      for (const shorts of [false, true]) {
        await toggle.setChecked(shorts);
        for (const target of shorts ? [0.07, 0.09, 0.18] : [0.07, 0.09, 0.14]) {
          await targetSlider.fill(String(target));
          await verifyCurve(rho, shorts, target);
        }
      }
    }
    await toggle.uncheck(); await verifyCurve(1, false, 0.14);
    await rhoSlider.fill('0.2'); await targetSlider.fill('0.09');
    await verifyCurve(0.2, false, 0.09);
    const handle = curve.getByTestId('frontier-portfolio').locator('[tabindex="0"]');
    await handle.evaluate(element => element.scrollIntoView({ block: 'center' }));
    const box = await handle.boundingBox();
    assert.ok(box, 'draggable frontier point exists');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 30, { steps: 8 });
    await page.mouse.up();
    assert.notEqual(await curve.getByTestId('frontier-return').textContent(), pct(0.09), 'drag changes the return');
    await targetSlider.fill('0.1'); await verifyCurve(0.2, false, 0.10);
    await targetSlider.focus(); await page.keyboard.press('ArrowLeft');
    await verifyCurve(0.2, false, 0.099);

    const quizzes = page.locator('.quiz');
    assert.equal(await quizzes.count(), 3);
    for (let i = 0; i < 3; i++) {
      const quiz = quizzes.nth(i);
      await quiz.scrollIntoViewIfNeeded();
      await quiz.getByRole('button').nth([0, 1, 2][i]).click();
      assert.match(await quiz.textContent(), /Correcto/);
    }
    assert.equal(await page.locator('.katex-error').count(), 0, 'no KaTeX errors');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'no overflow');
    assert.deepEqual(errors, [], 'no console or page errors');
    console.log(`✓ chapter 8 ${theme} ${width}px: six sections, both widgets, sliders, shorts, drag, keyboard and quizzes`);
    await context.close();
  }
  console.log(`✓ cap8 click-through: ${comparisons} readouts match portfolio.ts`);
} finally {
  await browser?.close();
  await loader.close();
  await server.stop();
}
