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
  const model = await loader.ssrLoadModule('/src/data/optionStrategies.ts');
  const num = x => (Object.is(x, -0) ? 0 : x).toFixed(2).replace('.', ',');
  browser = await chromium.launch();
  for (const theme of ['dark', 'light']) for (const width of [1280, 360]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript(value => localStorage.setItem('theme', value), theme);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const response = await page.goto(`${server.base}chapters/21-opciones/`, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    assert.deepEqual(await page.locator('h2 .section-tag').allTextContents(),
      ['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    assert.equal(await page.locator('.widget').count(), 1);
    const widget = page.locator('.widget');
    await widget.scrollIntoViewIfNeeded();
    await widget.locator('xpath=ancestor::astro-island[not(@ssr)]').waitFor();
    let state = { ...model.optionDefaults };
    let strategy = 'call';
    const verify = async () => {
      const legs = model.optionStrategyLegs(strategy, state);
      const zeros = lib.breakevens(legs);
      const wants = {
        'option-cost': `${num(lib.strategyCost(legs))} €`,
        'option-payoff': `${num(lib.strategyPayoff(legs, state.spot))} €`,
        'option-profit': `${num(lib.strategyProfit(legs, state.spot))} €`,
        'option-zeros': zeros.points.length ? zeros.points.map(num).join('; ') + ' €' : 'Ninguno',
        'option-intervals': zeros.intervals.length ? zeros.intervals.map(i => `[${num(i.from)}; ${i.to === null ? '∞' : num(i.to)}] €`).join('; ') : 'Ninguno',
      };
      for (const [id, expected] of Object.entries(wants)) {
        await page.waitForFunction(({ id, expected }) => document.querySelector(`[data-testid="${id}"]`)?.textContent === expected,
          { id, expected }, { timeout: 5000 }).catch(async () => assert.fail(`${strategy}/${id}: saw ${await widget.getByTestId(id).textContent()}, library says ${expected}`));
        comparisons++;
      }
      const expectedLegs = legs.map(l => l.type === 'stock' ? `${l.quantity} acción · compra ${num(l.entryPrice)} €`
        : `${l.quantity} ${l.type} · K ${num(l.strike)} € · prima ${num(l.premium)} €`);
      assert.deepEqual((await widget.getByTestId('option-legs').locator('li').allTextContents()).map(t => t.trim()), expectedLegs);
      assert.equal(await widget.locator('.MafsView').count(), 1);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `overflow: ${strategy}`);
    };
    const keys = ['strike', 'width', 'call', 'put', 'outer', 'spot'];
    const move = async (key, value) => {
      await widget.locator('input[type="range"]').nth(keys.indexOf(key)).fill(String(value));
      state[key] = value;
      await verify();
    };
    await verify();
    for (const option of model.optionStrategies) {
      await widget.getByRole('button', { name: 'Restablecer ejemplo' }).click();
      state = { ...model.optionDefaults };
      strategy = option.value;
      await widget.locator('select').selectOption(strategy);
      await verify();
      for (const value of [0, 100, 200]) await move('spot', value);
      for (const [key, values] of [['strike', [80, 120]], ['width', [10, 40]], ['call', [0, 12]], ['put', [0, 12]], ['outer', [0, 6]]]) {
        for (const value of values) await move(key, value);
      }
      console.log(`✓ ${theme} ${width}px: ${strategy}, all slider limits and signed legs match derivatives.ts`);
    }
    // Exercise finite and unbounded flat-zero intervals in the browser.
    strategy = 'bull';
    await widget.locator('select').selectOption(strategy);
    await move('width', 10);
    await move('call', 10);
    await move('outer', 0);
    assert.match(await widget.getByTestId('option-intervals').textContent(), /∞/);
    await move('call', 0);
    assert.match(await widget.getByTestId('option-intervals').textContent(), /0,00/);
    // Keyboard operation and reset must update both controls and readouts.
    await widget.locator('input').first().focus();
    await page.keyboard.press('Home');
    state.strike = 80;
    await verify();
    await widget.getByRole('button', { name: 'Restablecer ejemplo' }).click();
    strategy = 'call'; state = { ...model.optionDefaults };
    await verify();
    assert.equal(await widget.locator('select').inputValue(), 'call');
    assert.deepEqual(await widget.locator('input').evaluateAll(els => els.map(e => Number(e.value))), keys.map(k => state[k]));
    assert.equal(await page.locator('.quiz').count(), 3);
    for (const [i, correct] of [1, 2, 0].entries()) {
      const quiz = page.locator('.quiz').nth(i);
      await quiz.scrollIntoViewIfNeeded();
      await quiz.locator('xpath=ancestor::astro-island[not(@ssr)]').waitFor();
      await quiz.getByRole('button').nth((correct + 1) % 3).click();
      assert.match(await quiz.getByRole('status').textContent(), /No exactamente/);
      await quiz.getByRole('button', { name: 'Inténtalo de nuevo' }).click();
      await quiz.getByRole('button').nth(correct).click();
      assert.match(await quiz.getByRole('status').textContent(), /Correcto/);
    }
    assert.equal(await page.locator('.katex-error').count(), 0);
    assert.deepEqual(errors, []);
    console.log(`✓ ${theme} ${width}px: six sections, three quizzes, keyboard, reset, zero intervals; no console, KaTeX or overflow errors`);
    await context.close();
  }
  console.log(`✓ ${comparisons} readout comparisons against derivatives.ts; Chapter 21 click-through passed`);
} finally {
  await browser?.close();
  await loader.close();
  await server.stop();
}
