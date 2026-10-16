import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startPreview } from './preview.mjs';
import { expectedReturn, scenarioVariance, scenarioStandardDeviation } from '../src/lib/finance/risk.ts';

const pct = (value) => `${(value * 100).toFixed(2).replace('.', ',')} %`;
const server = await startPreview();
let browser;
let comparisons = 0;
try {
  browser = await chromium.launch();
  for (const theme of ['dark', 'light']) {
    for (const width of [1280, 360]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.addInitScript((value) => localStorage.setItem('theme', value), theme);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      const response = await page.goto(`${server.base}chapters/06-rentabilidad-riesgo/`, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      assert.deepEqual(await page.locator('h2 .section-tag').allTextContents(),
        ['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
      assert.equal(await page.locator('.widget').count(), 1);
      const widget = page.locator('.widget');
      await widget.scrollIntoViewIfNeeded();
      await widget.locator('svg').waitFor();
      const sliders = widget.getByRole('slider');
      assert.equal(await sliders.count(), 3);

      const verify = async (returns, probabilities, name) => {
        for (const [id, want] of [
          ['mean', pct(expectedReturn(returns, probabilities))],
          ['sigma', pct(scenarioStandardDeviation(returns, probabilities))],
          ['variance', scenarioVariance(returns, probabilities).toFixed(4).replace('.', ',')],
          ...probabilities.map((p, i) => [`probability-${i}`, pct(p)]),
        ]) {
          await page.waitForFunction(({ id, want }) =>
            document.querySelector(`[data-testid="${id}"]`)?.textContent === want, { id, want });
          assert.equal(await widget.getByTestId(id).textContent(), want);
          comparisons++;
        }
        console.log(`✓ ${theme} ${width}px: ${name} matches risk.ts`);
      };

      const returns = [-0.1, 0.06, 0.22];
      const central = [0.25, 0.5, 0.25];
      await verify(returns, central, 'default');
      for (const [value, probabilities] of [
        ['adverse', [0.5, 0.25, 0.25]], ['optimistic', [0.25, 0.25, 0.5]], ['balanced', central],
      ]) {
        await widget.getByLabel('Probabilidades', { exact: true }).selectOption(value);
        await verify(returns, probabilities, value);
      }
      for (const [i, value] of [[0, -0.3], [1, 0.4], [2, -0.2]]) {
        await sliders.nth(i).fill(String(value));
        returns[i] = value;
        await verify(returns, central, `slider ${i + 1}`);
      }
      // Keyboard input exercises the native controls, including a negative-to-positive change.
      await sliders.nth(0).focus();
      await sliders.nth(0).press('ArrowRight');
      returns[0] = -0.29;
      await verify(returns, central, 'keyboard');
      for (let i = 0; i < 3; i++) await sliders.nth(i).fill('0.06');
      await verify([0.06, 0.06, 0.06], central, 'zero volatility');

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
      // Also render formulas inside the collapsed appendix and variance derivation.
      await page.locator('details').evaluateAll((elements) => elements.forEach((el) => el.open = true));
      assert.equal(await page.locator('.katex-error').count(), 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow');
      assert.deepEqual(errors, []);
      await context.close();
    }
  }
  console.log(`✓ ${comparisons} readout comparisons; all controls, keyboard, quizzes and section order pass; no console, KaTeX or overflow errors`);
} finally {
  await browser?.close();
  await server.stop();
}
