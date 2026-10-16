import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { startPreview } from './preview.mjs';

const server = await startPreview();
const loader = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' });
let browser;
let comparisons = 0;
const number = (v) => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const euro = (v) => `${number(v)} €`;
try {
  const lib = await loader.ssrLoadModule('/src/lib/finance/markets.ts');
  const { chapter14IPO: e } = await loader.ssrLoadModule('/src/data/ipo.ts');
  browser = await chromium.launch();
  for (const theme of ['dark', 'light']) {
    for (const width of [1280, 360]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await context.addInitScript((t) => localStorage.setItem('theme', t), theme);
      const page = await context.newPage();
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', (err) => errors.push(err.message));
      const response = await page.goto(`${server.base}chapters/14-opv/`, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      assert.deepEqual(await page.locator('h2 .section-tag').allTextContents(),
        ['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
      assert.equal(await page.locator('.widget').count(), 1);
      const widget = page.locator('.widget');
      await widget.scrollIntoViewIfNeeded();
      await page.locator('astro-island:not([ssr]) .widget').waitFor();
      const priceSlider = widget.getByRole('slider', { name: 'Precio de oferta', exact: true });
      const closeSlider = widget.getByRole('slider', { name: 'Cierre hipotético del primer día', exact: true });
      const set = async (slider, value) => {
        // Use keyboard events so the test follows the same change path as a reader.
        await slider.focus();
        await slider.press('Home');
        const minimum = Number(await slider.getAttribute('min'));
        for (let v = minimum; v < value; v++) await slider.press('ArrowRight');
      };
      const verify = async (price, close) => {
        assert.equal(Number(await priceSlider.inputValue()), price);
        assert.equal(Number(await closeSlider.inputValue()), close);
        const demand = lib.ipoDemandAtPrice(e.demand, price);
        const covered = demand >= e.shares;
        const p = lib.ipoProceeds(covered ? e.shares : 0, price, e.feeRate);
        const u = lib.underpricing(e.shares, price, close);
        const ceiling = lib.bookBuildingPrice(e.demand, e.shares);
        const expected = {
          demand: String(demand), supply: String(e.shares),
          covered: covered ? 'Cubierta' : 'No cubierta: sin venta',
          ceiling: euro(ceiling), gross: euro(p.gross), fees: euro(p.fees), net: euro(p.net),
          'initial-return': covered ? `${number(u.initialReturn * 100)} %` : 'No procede',
          'money-left': covered ? euro(u.moneyLeft) : 'No procede',
        };
        for (const [id, want] of Object.entries(expected)) {
          await page.waitForFunction(({ id, want }) => document.querySelector(`[data-testid="${id}"]`)?.textContent === want,
            { id, want }, { timeout: 5000 });
          assert.equal(await widget.getByTestId(id).textContent(), want);
          comparisons++;
        }
        const outputs = await widget.locator('output').allTextContents();
        assert.deepEqual(outputs, [euro(price), euro(close)]);
        await widget.locator('.MafsView svg').waitFor();
      };
      await verify(16, 20);
      // Every offered price, including between demand steps and uncovered states.
      for (let price = 12; price <= 20; price++) {
        await set(priceSlider, price);
        await verify(price, 20);
      }
      await widget.getByRole('button', { name: 'Precio que cubre la oferta', exact: true }).click();
      await verify(16, 20);
      // Negative, zero and positive returns, and both close-slider endpoints.
      for (const close of [12, 16, 24]) {
        await set(closeSlider, close);
        await verify(16, close);
      }
      await set(priceSlider, 18);
      await verify(18, 24);
      await widget.getByRole('button', { name: 'Restablecer', exact: true }).click();
      await verify(16, 20);

      const quizzes = page.locator('.quiz');
      assert.equal(await quizzes.count(), 3);
      for (const [i, answer] of [1, 2, 1].entries()) {
        const quiz = quizzes.nth(i);
        await quiz.scrollIntoViewIfNeeded();
        await quiz.getByRole('button').nth(0).click();
        assert.match(await quiz.getByRole('status').textContent(), /No exactamente/);
        await quiz.getByRole('button', { name: 'Inténtalo de nuevo' }).click();
        await quiz.getByRole('button').nth(answer).click();
        assert.match(await quiz.getByRole('status').textContent(), /Correcto/);
      }
      await page.locator('details').evaluateAll((els) => els.forEach((el) => el.open = true));
      assert.equal(await page.locator('.katex-error').count(), 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow');
      assert.deepEqual(errors, []);
      console.log(`✓ ${theme} ${width}px: sliders, both buttons, covered/uncovered offers, negative/zero/positive returns, quizzes and six sections`);
      await context.close();
    }
  }
  console.log(`✓ ${comparisons} readouts match markets.ts; no console, KaTeX or overflow errors`);
} finally {
  await browser?.close();
  await loader.close();
  await server.stop();
}
