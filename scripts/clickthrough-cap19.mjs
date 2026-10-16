import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { startPreview } from './preview.mjs';

const server = await startPreview();
const loader = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
let browser;
let comparisons = 0;
try {
  const lib = await loader.ssrLoadModule('/src/lib/finance/bonds.ts');
  const num = (x, digits = 2) => x.toFixed(digits).replace('.', ',');
  const signed = (x) => `${x < 0 ? '−' : '+'}${num(Math.abs(x))} €`;
  browser = await chromium.launch();
  for (const theme of ['dark', 'light']) {
    for (const width of [1280, 360]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await context.addInitScript((t) => localStorage.setItem('theme', t), theme);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      const response = await page.goto(`${server.base}chapters/19-duracion/`, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      assert.deepEqual(await page.locator('h2 .section-tag').allTextContents(),
        ['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
      assert.equal(await page.locator('.widget').count(), 1);
      const widget = page.locator('.widget');
      await widget.scrollIntoViewIfNeeded();
      await widget.locator('xpath=ancestor::astro-island[not(@ssr)]').waitFor();
      await widget.locator('svg').waitFor();
      const defaults = { maturity: 5, coupon: 4, yieldPercent: 4, shock: 1 };
      let state = { ...defaults };
      const verify = async () => {
        const bond = { face: 1000, couponRate: state.coupon / 100, maturity: state.maturity };
        const y = state.yieldPercent / 100, shock = state.shock / 100;
        const risk = lib.cashFlowRisk(lib.bondCashFlows(bond), y);
        const price = lib.bondPrice(bond, y + shock), actual = price - risk.price;
        const linear = lib.durationPriceChange(bond, y, shock), quadratic = lib.durationPriceChange(bond, y, shock, true);
        const wants = {
          initial: `${num(risk.price)} €`, macaulay: `${num(risk.macaulay, 3)} años`,
          modified: `${num(risk.modified, 3)} años`, convexity: `${num(risk.convexity, 3)} años²`,
          price: `${num(price)} €`, actual: signed(actual), linear: signed(linear), quadratic: signed(quadratic),
          'linear-error': `${num(Math.abs(linear - actual))} €`,
          'quadratic-error': `${num(Math.abs(quadratic - actual))} €`,
        };
        for (const [id, expected] of Object.entries(wants)) {
          await page.waitForFunction(({ id, expected }) => document.querySelector(`[data-testid="${id}"]`)?.textContent === expected,
            { id, expected }, { timeout: 5000 }).catch(async () => assert.fail(`${id}: saw ${await widget.getByTestId(id).textContent()}, library says ${expected}`));
          comparisons++;
        }
        assert.equal(await page.locator('.katex-error').count(), 0);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'page overflow');
        assert.ok(await widget.evaluate((el) => el.scrollWidth <= el.clientWidth + 1), 'widget overflow');
      };
      const sliders = widget.getByRole('slider');
      const set = async (key, index, value) => {
        await sliders.nth(index).fill(String(value));
        state[key] = value;
        await verify();
      };
      await verify();
      // Every slider, both shocks, zero change, zero coupon, and boundary combinations.
      for (const s of [-1, 0, 2, -2]) await set('shock', 3, s);
      await set('maturity', 0, 15);
      await set('coupon', 1, 0);
      await set('yieldPercent', 2, 2);
      await set('maturity', 0, 1);
      await set('coupon', 1, 10);
      await set('yieldPercent', 2, 10);
      await set('shock', 3, 2);
      await sliders.nth(3).focus();
      await page.keyboard.press('ArrowLeft');
      state.shock = 1.9;
      await verify();
      await widget.getByRole('button', { name: 'Restablecer ejemplo' }).click();
      state = { ...defaults };
      await verify();
      assert.deepEqual(await sliders.evaluateAll((els) => els.map((e) => Number(e.value))), [5, 4, 4, 1]);
      const details = page.locator('details').filter({ has: page.getByText('Por qué la duración modificada mide la pendiente', { exact: true }) });
      await details.locator('summary').click();
      assert.ok(await details.evaluate((el) => el.open));
      const quizzes = page.locator('.quiz');
      assert.equal(await quizzes.count(), 3);
      for (let i = 0; i < 3; i++) {
        const quiz = quizzes.nth(i);
        await quiz.scrollIntoViewIfNeeded();
        await quiz.locator('xpath=ancestor::astro-island[not(@ssr)]').waitFor();
        await quiz.locator('.quiz-option').nth(0).click();
        assert.match(await quiz.getByRole('status').textContent(), /No exactamente/);
        await quiz.getByRole('button', { name: 'Inténtalo de nuevo' }).click();
        await quiz.locator('.quiz-option').nth(1).click();
        assert.match(await quiz.getByRole('status').textContent(), /Correcto/);
      }
      await verify();
      assert.deepEqual(errors, []);
      console.log(`✓ ${theme} ${width}px: all controls, keyboard, reset, three quizzes, derivation, six sections; no console, KaTeX or overflow errors`);
      await context.close();
    }
  }
  console.log(`✓ ${comparisons} readout comparisons against bonds.ts; Chapter 19 click-through passed`);
} finally {
  await browser?.close();
  await loader.close();
  await server.stop();
}
