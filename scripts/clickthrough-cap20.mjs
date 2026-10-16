import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { startPreview } from './preview.mjs';

const server = await startPreview();
const loader = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
let browser;
let comparisons = 0;
try {
  const lib = await loader.ssrLoadModule('/src/lib/finance/derivatives.ts');
  const num = (x) => x.toFixed(2).replace('.', ',');
  browser = await chromium.launch();
  for (const theme of ['dark', 'light']) {
    for (const width of [1280, 360]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await context.addInitScript((value) => localStorage.setItem('theme', value), theme);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      const response = await page.goto(`${server.base}chapters/20-forwards-futuros/`, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      assert.deepEqual(await page.locator('h2 .section-tag').allTextContents(),
        ['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
      assert.equal(await page.locator('.widget').count(), 2);
      const expectReadout = async (id, expected) => {
        await page.waitForFunction(({ id, expected }) => document.querySelector(`[data-testid="${id}"]`)?.textContent === expected,
          { id, expected }, { timeout: 5000 }).catch(async () => assert.fail(`${id}: saw ${await page.getByTestId(id).textContent()}, library says ${expected}`));
        comparisons++;
      };
      const forward = page.locator('.widget').nth(0);
      await forward.scrollIntoViewIfNeeded();
      await forward.locator('xpath=ancestor::astro-island[not(@ssr)]').waitFor();
      let f = { spot: 50, delivery: 48, rate: 4, remaining: 1.5, position: 'long' };
      const verifyForward = async () => {
        const wants = {
          'forward-price': lib.forwardPrice(f.spot, f.rate / 100, f.remaining),
          'forward-discount': f.delivery * lib.discountFactor(f.rate / 100, f.remaining),
          'forward-value': lib.forwardValue(f.spot, f.delivery, f.rate / 100, f.remaining, f.position),
          'forward-payoff': lib.forwardPayoff(f.spot, f.delivery, f.position),
        };
        for (const [id, want] of Object.entries(wants)) await expectReadout(id, `${num(want)} €`);
        assert.equal(await forward.locator('.MafsView').count(), 1);
      };
      await verifyForward();
      for (const [index, key, values] of [[0, 'spot', [20, 80, 45, 50]], [1, 'delivery', [20, 80, 48]], [2, 'rate', [0, 10, 4]], [3, 'remaining', [0, 2, 0.25, 1.5]]]) {
        for (const value of values) {
          await forward.locator('input').nth(index).fill(String(value));
          f[key] = value;
          await verifyForward();
        }
      }
      for (const [name, position] of [['Corta: vender', 'short'], ['Larga: comprar', 'long']]) {
        await forward.getByRole('radio', { name }).click();
        f.position = position;
        await verifyForward();
      }
      await forward.locator('input').first().focus();
      await page.keyboard.press('Home');
      f.spot = 20;
      await verifyForward();
      await forward.getByRole('button', { name: 'Restablecer forward' }).click();
      f = { spot: 50, delivery: 48, rate: 4, remaining: 1.5, position: 'long' };
      await verifyForward();
      assert.deepEqual(await forward.locator('input').evaluateAll((els) => els.map((e) => Number(e.value))), [50, 48, 4, 1.5]);

      const futures = page.locator('.widget').nth(1);
      await futures.scrollIntoViewIfNeeded();
      await futures.locator('xpath=ancestor::astro-island[not(@ssr)]').waitFor();
      let s = { seed: 2710, position: 'short', contracts: 2, maintenance: 120, day: 2 };
      const verifyFutures = async () => {
        const prices = lib.seededFuturesPrices(s.seed);
        const account = lib.futuresMarginAccount({ prices, position: s.position, contracts: s.contracts, multiplier: 10, initialMargin: 200, maintenanceMargin: s.maintenance });
        const row = account.days[s.day - 1];
        await expectReadout('futures-seed', String(s.seed));
        const wants = { 'futures-price': row.price, 'futures-variation': row.variationMargin, 'futures-before': row.balanceBeforeCall,
          'futures-call': row.marginCall, 'futures-balance': row.balance, 'futures-gain': account.totalGain };
        for (const [id, want] of Object.entries(wants)) await expectReadout(id, `${num(want)} €`);
        const expectedRows = account.days.map((d) => [String(d.day), ...[d.price, d.variationMargin, d.balanceBeforeCall, d.marginCall, d.balance].map(num)]);
        await page.waitForFunction((want) => JSON.stringify([...document.querySelectorAll('[data-testid="futures-table"] tbody tr')].map((tr) => [...tr.cells].map((td) => td.textContent))) === JSON.stringify(want), expectedRows);
        comparisons += 24;
        assert.equal(await futures.locator('.MafsView').count(), 1);
      };
      await verifyFutures();
      for (const [index, key, values] of [[2, 'day', [1, 2, 3, 4]], [0, 'contracts', [1, 4, 2]], [1, 'maintenance', [0, 200, 140, 120]]]) {
        for (const value of values) {
          await futures.locator('input').nth(index).fill(String(value));
          s[key] = value;
          await verifyFutures();
        }
      }
      for (const [name, position] of [['Larga', 'long'], ['Corta', 'short']]) {
        await futures.getByRole('radio', { name, exact: true }).click();
        s.position = position;
        await verifyFutures();
      }
      for (let i = 0; i < 3; i++) {
        await futures.getByRole('button', { name: 'Otra trayectoria' }).click();
        s.seed++;
        await verifyFutures();
      }
      await futures.locator('input').first().focus();
      await page.keyboard.press('Home');
      s.contracts = 1;
      await verifyFutures();
      await futures.getByRole('button', { name: 'Restablecer futuros' }).click();
      s = { seed: 2710, position: 'short', contracts: 2, maintenance: 120, day: 2 };
      await verifyFutures();
      assert.deepEqual(await futures.locator('input').evaluateAll((els) => els.map((e) => Number(e.value))), [2, 120, 2]);

      const quizzes = page.locator('.quiz');
      assert.equal(await quizzes.count(), 3);
      for (const [i, answer] of [1, 2, 1].entries()) {
        const quiz = quizzes.nth(i);
        await quiz.scrollIntoViewIfNeeded();
        await quiz.locator('xpath=ancestor::astro-island[not(@ssr)]').waitFor();
        await quiz.getByRole('button').nth(0).click();
        assert.match(await quiz.getByRole('status').textContent(), /No exactamente/);
        await quiz.getByRole('button', { name: 'Inténtalo de nuevo' }).click();
        await quiz.getByRole('button').nth(answer).click();
        assert.match(await quiz.getByRole('status').textContent(), /Correcto/);
      }
      assert.equal(await page.locator('.katex-error').count(), 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow');
      assert.deepEqual(errors, []);
      console.log(`✓ ${theme} ${width}px: all controls, table, keyboard, resets, three quizzes and six sections; no console, KaTeX or overflow errors`);
      await context.close();
    }
  }
  console.log(`✓ ${comparisons} readout/table comparisons against derivatives.ts; Chapter 20 click-through passed`);
} finally {
  await browser?.close();
  await loader.close();
  await server.stop();
}
