import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startPreview } from './preview.mjs';
import { createServer } from 'vite';

const pct = (v) => `${(v * 100).toFixed(2).replace(/^-0\.00$/, '0.00').replace('.', ',')} %`;
const days = [-2, -1, 0, 1, 2];
const market = [-0.01, 0.005, 0.01, -0.005, 0];
const observed = [-0.013, 0.009, 0.028, -0.007, 0.001];
const server = await startPreview();
const loader = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' });
let browser;
let comparisons = 0;
try {
  const { randomWalkPrices, trendPrices, logReturns, simpleReturns, autocorrelation, varianceRatio, momentumBacktest } = await loader.ssrLoadModule('/src/lib/finance/efficiency.ts');
  const { marketModelReturn, marketModelAbnormalReturns, cumulativeAbnormalReturn } = await loader.ssrLoadModule('/src/lib/finance/eventStudy.ts');
  browser = await chromium.launch();
  for (const theme of ['dark', 'light']) {
    for (const width of [1280, 360]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await context.addInitScript((value) => localStorage.setItem('theme', value), theme);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      const response = await page.goto(`${server.base}chapters/15-eficiencia/`, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      assert.deepEqual(await page.locator('h2 .section-tag').allTextContents(),
        ['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
      assert.equal(await page.locator('.widget').count(), 2);
      const demo = page.locator('.widget').nth(0);
      await demo.scrollIntoViewIfNeeded();
      await demo.locator('svg').waitFor();
      const inputs = demo.getByRole('slider');
      assert.equal(await inputs.count(), 4);
      const simulation = { seed: 42, mode: 'walk', phi: 0.5, q: 5, lookback: 5, cost: 0.001 };
      const decimal = (v) => v.toFixed(3).replace('.', ',');
      const checkDemo = async () => {
        const options = { p0: 100, drift: 0.0005, sigma: 0.02, steps: 120, seed: simulation.seed };
        const prices = simulation.mode === 'walk' ? randomWalkPrices(options) : trendPrices({ ...options, phi: simulation.phi });
        const returns = logReturns(prices);
        const backtest = momentumBacktest(simpleReturns(prices), simulation.lookback, simulation.cost);
        const values = {
          seed: String(simulation.seed), price: prices.at(-1).toFixed(2).replace('.', ','),
          acf: decimal(autocorrelation(returns)), vr: decimal(varianceRatio(returns, simulation.q)),
          trades: String(backtest.trades), momentum: decimal(backtest.strategyWealth), hold: decimal(backtest.buyAndHoldWealth),
        };
        for (const [id, want] of Object.entries(values)) {
          await page.waitForFunction(({ id, want }) => document.querySelector(`[data-testid="${id}"]`)?.textContent === want, { id, want });
          assert.equal(await demo.getByTestId(id).textContent(), want);
          comparisons++;
        }
        assert.deepEqual(await inputs.evaluateAll(els => els.map(el => Number(el.value))),
          [simulation.phi, simulation.q, simulation.lookback, simulation.cost]);
      };
      await checkDemo();
      await demo.getByRole('radio', { name: 'Persistencia', exact: true }).click();
      simulation.mode = 'trend';
      await checkDemo();
      for (const [index, key, values] of [[0, 'phi', [0, 0.8, 0.5]], [1, 'q', [2, 10]], [2, 'lookback', [1, 20]], [3, 'cost', [0, 0.01]]]) {
        for (const value of values) {
          await inputs.nth(index).fill(String(value));
          simulation[key] = value;
          await checkDemo();
        }
      }
      await demo.getByRole('button', { name: 'Otra trayectoria' }).click();
      simulation.seed++;
      await checkDemo();
      await demo.getByRole('radio', { name: 'Paseo', exact: true }).click();
      simulation.mode = 'walk';
      await checkDemo();
      await demo.getByRole('button', { name: 'Restablecer', exact: true }).click();
      Object.assign(simulation, { seed: 42, mode: 'walk', phi: 0.5, q: 5, lookback: 5, cost: 0.001 });
      await checkDemo();
      await inputs.nth(1).focus();
      await inputs.nth(1).press('ArrowRight');
      simulation.q = 6;
      await checkDemo();
      console.log(`✓ ${theme} ${width}px: both simulated series, all controls, bounds, seeds, reset and keyboard match efficiency.ts`);
      const widget = page.locator('.widget').nth(1);
      await widget.scrollIntoViewIfNeeded();
      await widget.locator('svg').waitFor();
      const sliders = widget.getByRole('slider');
      assert.equal(await sliders.count(), 4);
      const state = { beta: 1.2, intercept: 0.001, start: -2, end: 2 };
      const verify = async (name) => {
        const ar = marketModelAbnormalReturns(observed, market, state.intercept, state.beta);
        const first = days.indexOf(state.start);
        const last = days.indexOf(state.end);
        const expected = [
          ['normal', pct(marketModelReturn(market[2], state.intercept, state.beta))],
          ['ar-zero', pct(ar[2])],
          ['window', `[${state.start}, ${state.end}]`],
          ['car', pct(cumulativeAbnormalReturn(ar, first, last))],
          ...ar.map((v, i) => [`ar-${i}`, pct(v)]),
          ...ar.map((_, i) => [`cumulative-${i}`, i < first || i > last ? '—' : pct(cumulativeAbnormalReturn(ar, first, i))]),
        ];
        for (const [id, want] of expected) {
          await page.waitForFunction(({ id, want }) => document.querySelector(`[data-testid="${id}"]`)?.textContent === want, { id, want });
          assert.equal(await widget.getByTestId(id).textContent(), want);
          comparisons++;
        }
        assert.deepEqual(await sliders.evaluateAll((els) => els.map((el) => Number(el.value))),
          [state.beta, state.intercept, state.start, state.end]);
        assert.ok(await widget.locator('circle').count() >= last - first + 1, 'selected CAR points render');
        console.log(`✓ ${theme} ${width}px: ${name} matches eventStudy.ts`);
      };
      const move = async (index, key, value) => {
        await sliders.nth(index).fill(String(value));
        state[key] = value;
        if (key === 'start') state.end = Math.max(value, state.end);
        if (key === 'end') state.start = Math.min(value, state.start);
        await verify(`${key} = ${value}`);
      };
      await verify('defaults');
      await move(2, 'start', -1);
      await move(3, 'end', 1);
      await move(2, 'start', 0);
      await move(3, 'end', 0);
      await move(0, 'beta', 0.8);
      await move(1, 'intercept', 0.002);
      for (const value of [0, 2]) await move(0, 'beta', value);
      for (const value of [-0.002, 0.004]) await move(1, 'intercept', value);
      await move(2, 'start', 2); // Crossing moves the other endpoint to preserve a valid window.
      await move(3, 'end', -2);
      await move(3, 'end', 2);
      await sliders.nth(2).focus();
      await sliders.nth(2).press('ArrowRight');
      state.start = -1;
      await verify('keyboard changes start');
      await move(0, 'beta', 1.2);
      await move(1, 'intercept', 0.001);
      await move(2, 'start', 1);
      await verify('post-announcement window');

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
      await page.locator('details').evaluateAll((els) => els.forEach((el) => el.open = true));
      assert.equal(await page.locator('.katex-error').count(), 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow');
      assert.deepEqual(errors, []);
      await context.close();
    }
  }
  console.log(`✓ ${comparisons} library readout comparisons; both widgets, all eight sliders, bounds, crossed windows, seeds, reset, keyboard, quizzes and six sections pass; no console, KaTeX or overflow errors`);
} finally {
  await browser?.close();
  await loader.close();
  await server.stop();
}
