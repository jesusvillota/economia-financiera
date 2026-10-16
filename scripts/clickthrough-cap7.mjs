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
  const lib = await loader.ssrLoadModule('/src/lib/finance/portfolio.ts');
  browser = await chromium.launch();
  for (const theme of ['dark', 'light']) for (const width of [1280, 360]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addInitScript(value => localStorage.setItem('theme', value), theme);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const response = await page.goto(`${server.base}chapters/07-dos-activos/`, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    assert.deepEqual(await page.locator('h2 .section-tag').allTextContents(),
      ['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    assert.equal(await page.locator('.widget').count(), 2);
    const frontier = page.locator('.widget').nth(0);
    const worked = page.locator('.widget').nth(1);
    const matrix = rho => lib.covarianceFromCorrelations([0.1, 0.2], [[1, rho], [rho, 1]]);
    async function compare(widget, expected) {
      for (const [id, want] of Object.entries(expected)) {
        await widget.getByTestId(id).filter({ hasText: want }).waitFor();
        assert.equal(await widget.getByTestId(id).textContent(), want, id);
        comparisons++;
      }
    }
    async function verifyFrontier(rho, shorts, target) {
      const selected = lib.frontierPoint([0.06, 0.12], matrix(rho), target, !shorts);
      const minimum = lib.globalMinimumVariance([0.06, 0.12], matrix(rho), !shorts);
      const expected = {
        'frontier-return': pct(selected.expectedReturn), 'frontier-sigma': pct(selected.sigma),
        'frontier-variance': num(selected.variance, 6),
        'frontier-min-return': pct(minimum.expectedReturn), 'frontier-min-sigma': pct(minimum.sigma),
      };
      for (let i = 0; i < 2; i++) {
        expected[`frontier-weight-${i}`] = pct(selected.weights[i]);
        expected[`frontier-min-weight-${i}`] = pct(minimum.weights[i]);
      }
      await compare(frontier, expected);
    }
    await frontier.scrollIntoViewIfNeeded();
    await frontier.locator('.MafsView').waitFor();
    const rhoControl = frontier.getByRole('slider', { name: /Correlación/ });
    const targetControl = frontier.getByRole('slider', { name: 'Rentabilidad de la cartera', exact: true });
    const toggle = frontier.getByRole('checkbox');
    await verifyFrontier(0.25, false, 0.09);
    for (const rho of [-1, 0, 0.25, 0.95, 1]) {
      await rhoControl.fill(String(rho));
      for (const shorts of [false, true]) {
        await toggle.setChecked(shorts);
        await targetControl.fill(shorts ? '0.14' : '0.09');
        await verifyFrontier(rho, shorts, shorts ? 0.14 : 0.09);
      }
    }
    await toggle.uncheck();
    await verifyFrontier(1, false, 0.12);
    await rhoControl.fill('0.25');
    await targetControl.fill('0.09');
    await targetControl.focus();
    await targetControl.press('ArrowRight');
    await verifyFrontier(0.25, false, 0.091);
    const handle = frontier.getByTestId('frontier-portfolio').locator('[tabindex="0"]');
    await handle.evaluate(element => element.scrollIntoView({ block: 'center' }));
    const box = await handle.boundingBox();
    assert.ok(box);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 25, { steps: 8 });
    await page.mouse.up();
    assert.ok(Number(await targetControl.inputValue()) > 0.091, 'drag up changes target');
    await targetControl.fill('0.1');
    await verifyFrontier(0.25, false, 0.1);

    await worked.scrollIntoViewIfNeeded();
    await worked.locator('.MafsView').waitFor();
    const weightControl = worked.getByRole('slider', { name: 'Peso de A', exact: true });
    const workedRho = worked.getByRole('slider', { name: /Correlación/ });
    async function verifyWorked(weight, rho) {
      const variance = lib.twoAssetVariance(weight, 0.1, 0.2, rho);
      await compare(worked, {
        'worked-weight-b': pct(1 - weight),
        'worked-return': pct(lib.twoAssetReturn(weight, 0.06, 0.12)),
        'worked-covariance': num(matrix(rho)[0][1], 6),
        'worked-variance': num(variance, 6), 'worked-sigma': pct(Math.sqrt(variance)),
      });
    }
    await verifyWorked(0.5, 0.25);
    for (const rho of [-1, 0, 0.25, 1]) {
      await workedRho.fill(String(rho));
      for (const weight of [0, 0.5, 0.88, 1]) {
        await weightControl.fill(String(weight));
        await verifyWorked(weight, rho);
      }
    }
    await weightControl.focus();
    await weightControl.press('ArrowLeft');
    await verifyWorked(0.99, 1);
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
    await page.locator('details').evaluateAll(elements => elements.forEach(element => element.open = true));
    assert.equal(await page.locator('.katex-error').count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no overflow');
    assert.deepEqual(errors, []);
    console.log(`✓ ${theme} ${width}px: both widgets, all sliders, toggle, drag, keyboard, quizzes and six sections; no console/KaTeX/overflow errors`);
    await context.close();
  }
  console.log(`✓ cap7 click-through: ${comparisons} readouts match portfolio.ts`);
} finally {
  await browser?.close();
  await loader.close();
  await server.stop();
}
