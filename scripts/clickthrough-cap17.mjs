import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { startPreview } from './preview.mjs';

const server = await startPreview();
const loader = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
let browser;
let comparisons = 0;
const number = (v) => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const euro = (v) => `${number(v)} €`;
try {
  const lib = await loader.ssrLoadModule('/src/lib/finance/bonds.ts');
  const data = await loader.ssrLoadModule('/src/data/bond17.ts');
  browser = await chromium.launch();
  for (const theme of ['dark', 'light']) for (const width of [1280, 360]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript((t) => localStorage.setItem('theme', t), theme);
    const page = await context.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));
    const response = await page.goto(`${server.base}chapters/17-bonos/`, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    assert.deepEqual(await page.locator('h2 .section-tag').allTextContents(),
      ['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    assert.equal(await page.locator('.widget').count(), 1);
    const widget = page.locator('.widget');
    await widget.scrollIntoViewIfNeeded();
    await widget.locator('xpath=ancestor::astro-island[not(@ssr)]').waitFor();
    const sliders = widget.getByRole('slider');
    let state = [4, 3, 5, 0];
    const verify = async () => {
      const [coupon, maturity, y, day] = state;
      const date = data.settlementDate17(day);
      const s = lib.bondAtSettlement({ ...data.chapter17Bond, couponRate: coupon / 100, maturity }, data.previousCoupon17, date, data.nextCoupon17);
      const dirty = lib.priceFromCashFlows(s.flows, y / 100);
      const expected = {
        face: euro(data.chapter17Bond.face), coupon: euro(s.coupon),
        settlement: date.toLocaleDateString('es-ES', { timeZone: 'UTC' }),
        dirty: euro(dirty), accrued: euro(s.accrued), clean: euro(lib.cleanPrice(dirty, s.accrued)),
        ytm: `${number(lib.yieldFromCashFlows(s.flows, dirty) * 100)} %`,
      };
      for (const [id, want] of Object.entries(expected)) {
        await page.waitForFunction(({ id, want }) => document.querySelector(`[data-testid="${id}"]`)?.textContent === want, { id, want });
        assert.equal(await widget.getByTestId(id).textContent(), want);
        comparisons++;
      }
      assert.deepEqual(await sliders.evaluateAll((els) => els.map((el) => Number(el.value))), state);
      assert.deepEqual(await widget.locator('output').allTextContents(), [`${coupon} %`, `${maturity} años`, `${number(y)} %`, String(day)]);
      await widget.locator('.MafsView svg').waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow');
    };
    const move = async (index, value) => {
      await sliders.nth(index).fill(String(value));
      state[index] = value;
      await verify();
    };
    await verify();
    for (const value of [3, 4, 0, 12, 5]) await move(2, value);
    await move(3, 146);
    // Exercise every slider, both endpoints and a middle value, also in combination.
    for (const [index, values] of [[0, [0, 10, 4]], [1, [1, 20, 3]], [3, [0, 364, 146]]]) {
      for (const value of values) await move(index, value);
    }
    await sliders.nth(2).focus();
    await sliders.nth(2).press('Home'); state[2] = 0; await verify();
    await sliders.nth(2).press('ArrowRight'); state[2] = 0.5; await verify();
    await widget.getByRole('button', { name: 'Restablecer', exact: true }).click();
    state = [4, 3, 5, 0]; await verify();
    const quizzes = page.locator('.quiz');
    assert.equal(await quizzes.count(), 3);
    for (let i = 0; i < 3; i++) {
      const quiz = quizzes.nth(i);
      await quiz.scrollIntoViewIfNeeded();
      await quiz.locator('xpath=ancestor::astro-island[not(@ssr)]').waitFor();
      await quiz.getByRole('button').nth(0).click();
      assert.match(await quiz.getByRole('status').textContent(), /No exactamente/);
      await quiz.getByRole('button', { name: 'Inténtalo de nuevo' }).click();
      await quiz.getByRole('button').nth(1).click();
      assert.match(await quiz.getByRole('status').textContent(), /Correcto/);
    }
    const derivation = page.locator('details').filter({ has: page.getByText('Las cuentas de Taller Solar, sin saltos', { exact: true }) });
    await derivation.locator('summary').click();
    assert.equal(await derivation.evaluate((el) => el.open), true);
    assert.equal(await page.locator('.katex-error').count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow');
    assert.deepEqual(errors, []);
    console.log(`✓ ${theme} ${width}px: four sliders, endpoints, keyboard, reset, three quizzes, derivation and six sections`);
    await context.close();
  }
  console.log(`✓ ${comparisons} readouts match bonds.ts; no console, KaTeX or overflow errors`);
} finally {
  await browser?.close();
  await loader.close();
  await server.stop();
}
