import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { startPreview } from './preview.mjs';

const euros = n => `${n.toFixed(2).replace('.', ',')} €`;
const pct = n => `${(100 * n).toFixed(2).replace('.', ',')} %`;
const server = await startPreview();
const loader = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' });
let browser;
let comparisons = 0;
try {
  const lib = await loader.ssrLoadModule('/src/lib/finance/markets.ts');
  const { tradingBook: book, tradingAccount: a, tradingFees: fees } = await loader.ssrLoadModule('/src/data/trading.ts');
  browser = await chromium.launch();
  for (const theme of ['dark', 'light']) for (const width of [1280, 360]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript(t => localStorage.setItem('theme', t), theme);
    const page = await context.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(e.message));
    assert.equal((await page.goto(`${server.base}chapters/13-negociacion/`, { waitUntil: 'networkidle' })).status(), 200);
    assert.deepEqual(await page.locator('h2 .section-tag').allTextContents(), ['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    assert.equal(await page.locator('.widget').count(), 2);
    const order = page.locator('.widget').nth(0);
    await order.scrollIntoViewIfNeeded();
    await page.locator('astro-island:not([ssr]) .widget').first().waitFor();
    const check = async (widget, values) => {
      for (const [id, want] of values) {
        await page.waitForFunction(({ id, want }) => document.querySelector(`[data-testid="${id}"]`)?.textContent === String(want), { id, want });
        assert.equal(await widget.getByTestId(id).textContent(), String(want));
        comparisons++;
      }
    };
    const execute = async (side, kind, size, limit = 40) => {
      await order.getByRole('radio', { name: side === 'buy' ? 'Comprar' : 'Vender', exact: true }).click();
      await order.getByRole('radio', { name: kind === 'market' ? 'A mercado' : 'Limitada', exact: true }).click();
      await order.getByRole('slider', { name: 'Cantidad de acciones' }).fill(String(size));
      if (kind === 'limit') await order.getByRole('slider', { name: 'Precio límite (€)' }).fill(String(limit));
      await order.getByRole('button', { name: 'Enviar orden', exact: true }).click();
      const expected = kind === 'market' ? lib.marketOrder(book, side, size) : lib.limitOrder(book, side, size, limit);
      await check(order, [['filled', expected.filled], ['unfilled', expected.unfilled], ['average', expected.filled ? euros(expected.avgPrice) : '—'],
        ['total', euros(expected.total)], ['fee', euros(expected.filled ? lib.commission(expected.total, fees.rate, fees.minimum) : 0)],
        ['implicit', euros(expected.filled ? lib.implicitCost(side, expected.filled, expected.avgPrice, lib.quote(book).mid).euros : 0)]]);
      assert.deepEqual(await order.locator('ul').evaluateAll(els => els.map(el => [...el.querySelectorAll('li')].map(li => li.textContent))),
        [expected.book.bids, expected.book.asks].map(levels => levels.length ? levels.map(l => `${euros(l.price)} · ${l.size} acc.`) : ['Sin órdenes']));
    };
    for (const side of ['buy', 'sell']) {
      for (const size of [50, 150, 500]) await execute(side, 'market', size);
      for (const limit of [36, 38, 39, 40, 41, 43]) await execute(side, 'limit', 150, limit);
    }
    await order.getByRole('button', { name: 'Restablecer', exact: true }).click();
    assert.equal(await order.getByTestId('filled').count(), 0);
    assert.equal(await order.getByRole('slider').inputValue(), '150');
    assert.equal(await order.getByRole('radio', { name: 'Comprar', exact: true }).getAttribute('aria-checked'), 'true');

    const account = page.locator('.widget').nth(1);
    await account.scrollIntoViewIfNeeded();
    await account.locator('svg').waitFor();
    const verifyAccount = async (mode, price) => {
      const long = lib.marginPurchase(a.shares, a.initialPrice, a.loan, price, a.loanRate);
      const short = lib.shortSale(a.shares, a.initialPrice, a.initialShortMargin, price, a.dividend);
      const current = mode === 'long' ? long : short;
      const threshold = mode === 'long' ? lib.marginCallPriceLong(a.shares, long.debt, a.maintenance) : lib.marginCallPriceShort(a.shares, short.assets, a.maintenance);
      await check(account, [['initial', euros(mode === 'long' ? long.initialEquity : short.initialMargin)],
        ['debt-assets', euros(mode === 'long' ? long.debt : short.assets)], ['equity', euros(current.equity)], ['margin', pct(current.marginPct)],
        ['return', pct(mode === 'long' ? long.returnOnEquity : short.returnOnMargin)], ['threshold', euros(threshold)],
        ['call', lib.isMarginCall(current.marginPct, a.maintenance) ? 'Llamada de margen' : 'Sin llamada']]);
    };
    await verifyAccount('long', 40);
    for (const mode of ['long', 'short']) {
      await account.getByRole('radio', { name: mode === 'long' ? 'Compra al margen' : 'Venta en corto' }).click();
      for (const price of [10, 29.9, 30, 30.1, 40, 45.3, 45.4, 55, 100]) {
        await account.getByRole('slider').fill(String(price));
        await verifyAccount(mode, price);
      }
    }
    await account.getByRole('slider').focus();
    await account.getByRole('slider').press('ArrowLeft');
    await verifyAccount('short', 99.9);
    await account.getByRole('button', { name: 'Restablecer cuenta' }).click();
    await verifyAccount('long', 40);
    assert.equal(await account.getByRole('slider').inputValue(), '40');

    const quizzes = page.locator('.quiz');
    assert.equal(await quizzes.count(), 3);
    for (const [i, correct] of [1, 1, 2].entries()) {
      const quiz = quizzes.nth(i);
      await quiz.scrollIntoViewIfNeeded();
      await quiz.getByRole('button').first().click();
      assert.match(await quiz.getByRole('status').textContent(), /No exactamente/);
      await quiz.getByRole('button', { name: 'Inténtalo de nuevo' }).click();
      await quiz.getByRole('button').nth(correct).click();
      assert.match(await quiz.getByRole('status').textContent(), /Correcto/);
    }
    await page.locator('details').evaluateAll(els => els.forEach(el => el.open = true));
    assert.equal(await page.locator('.katex-error').count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.deepEqual(errors, []);
    console.log(`✓ ${theme} ${width}px: orders, limits, remaining book, margin thresholds, keyboard, resets and quizzes match markets.ts`);
    await context.close();
  }
  console.log(`✓ ${comparisons} readouts compared with markets.ts; six sections in order; no console, KaTeX or overflow errors`);
} finally {
  await browser?.close();
  await loader.close();
  await server.stop();
}
