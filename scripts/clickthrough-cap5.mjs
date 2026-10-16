/** Built chapter: change every control, compare visible readouts to valuation.ts, exercise warnings and quizzes. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startPreview } from './preview.mjs';
import { discountedCashFlow, enterpriseToEquity, pricePerShare, terminalValue, wacc } from '../src/lib/finance/valuation.ts';

const euro = (v) => `${v.toFixed(2).replace('.', ',')} €`;
const pct = (v) => `${(v * 100).toFixed(1).replace('.', ',')} %`;
const server = await startPreview();
let browser;
try {
  browser = await chromium.launch();
  for (const viewport of [{ width: 1280, height: 900 }, { width: 360, height: 800 }]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    const response = await page.goto(`${server.base}chapters/05-empresa-wacc/`, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    assert.deepEqual(await page.locator('h2 .section-tag').allTextContents(), [
      'Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen',
    ]);
    const widget = page.locator('.widget');
    await widget.scrollIntoViewIfNeeded();
    await widget.locator('svg').waitFor();
    const state = { flows: [80, 90, 100], ke: 0.12, g: 0.02, debt: 300, cash: 50 };
    const read = (id) => widget.getByTestId(id);
    const expectText = async (id, want) => {
      await page.waitForFunction(({ id, want }) => document.querySelector(`[data-testid="${id}"]`)?.textContent === want, { id, want });
      assert.equal(await read(id).textContent(), want);
    };
    const verify = async () => {
      const r = wacc(60, 40, state.ke, 0.06, 0.25);
      await expectText('wacc', pct(r));
      for (let i = 0; i < 3; i++) {
        await expectText(`pv${i + 1}`, euro(discountedCashFlow(state.flows.map((v, j) => i === j ? v : 0), r)));
      }
      await expectText('cash', euro(state.cash));
      await expectText('debt', euro(state.debt));
      if (r <= state.g) {
        for (const id of ['terminal', 'terminal-pv', 'enterprise', 'equity', 'price']) await expectText(id, 'No converge');
        assert.match(await widget.textContent(), /Necesitas WACC mayor que g/);
      } else {
        const tv = terminalValue(state.flows[2], r, state.g);
        const ev = discountedCashFlow(state.flows, r, tv);
        const equity = enterpriseToEquity(ev, state.debt, state.cash);
        await expectText('terminal', euro(tv));
        await expectText('terminal-pv', euro(discountedCashFlow([0, 0, 0], r, tv)));
        await expectText('enterprise', euro(ev));
        await expectText('equity', euro(equity));
        await expectText('price', euro(pricePerShare(equity, 100)));
      }
    };
    await verify();
    const changes = [
      ['FCFF año 1 (€)', '120', () => { state.flows[0] = 120; }],
      ['FCFF año 2 (€)', '140', () => { state.flows[1] = 140; }],
      ['FCFF año 3 (€)', '160', () => { state.flows[2] = 160; }],
      [/Coste propio/, '0.16', () => { state.ke = 0.16; }],
      [/Crecimiento terminal/, '0.04', () => { state.g = 0.04; }],
      ['Deuda actual (€)', '500', () => { state.debt = 500; }],
      ['Caja excedente (€)', '100', () => { state.cash = 100; }],
    ];
    for (const [label, next, update] of changes) {
      const before = await read('price').textContent();
      await widget.getByRole('slider', { name: label, exact: typeof label === 'string' }).fill(next);
      update();
      await verify();
      assert.notEqual(await read('price').textContent(), before);
    }
    // Real keyboard input changes a control, then test non-convergent and negative residual states.
    const first = widget.getByRole('slider', { name: 'FCFF año 1 (€)', exact: true });
    await first.focus();
    await first.press('ArrowRight');
    state.flows[0] = 130;
    await verify();
    await widget.getByRole('slider', { name: /Coste propio/ }).fill('0.06'); state.ke = 0.06;
    await widget.getByRole('slider', { name: /Crecimiento terminal/ }).fill('0.06'); state.g = 0.06;
    await verify();
    await widget.getByRole('slider', { name: /Crecimiento terminal/ }).fill('0'); state.g = 0;
    await widget.getByRole('slider', { name: /Coste propio/ }).fill('0.2'); state.ke = 0.2;
    await widget.getByRole('slider', { name: 'Deuda actual (€)', exact: true }).fill('2000'); state.debt = 2000;
    await verify();
    assert.match(await widget.textContent(), /residual negativo/);
    for (const [index, answer] of [1, 0, 2].entries()) {
      const quiz = page.locator('.quiz').nth(index);
      await quiz.scrollIntoViewIfNeeded();
      await quiz.getByRole('button').nth(answer).click();
      assert.match(await quiz.getByRole('status').textContent(), /Correcto/);
    }
    assert.equal(await page.locator('.katex-error').count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.deepEqual(errors, []);
    console.log(`✓ ${viewport.width}px: six sections; all 7 sliders + keyboard; readouts match valuation.ts; warnings and 3 quizzes clean`);
    await page.close();
  }
} finally {
  await browser?.close();
  await server.stop();
}
console.log('✓ Chapter 5 click-through passed');
