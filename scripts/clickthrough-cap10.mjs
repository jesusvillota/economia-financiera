import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startPreview } from './preview.mjs';
import { createServer } from 'vite';

const pct = (value) => `${(value * 100).toFixed(2).replace('.', ',')} %`;
const decimal = (value) => value.toFixed(2).replace('.', ',');
const labels = { fair: 'Sobre la SML', underpriced: 'Infravalorado según CAPM', overpriced: 'Sobrevalorado según CAPM' };
const server = await startPreview();
const loader = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' });
let browser;
let comparisons = 0;
try {
  const { mispricing, securityMarketLine } = await loader.ssrLoadModule('/src/lib/finance/capm.ts');
  browser = await chromium.launch();
  for (const theme of ['dark', 'light']) for (const width of [1280, 360]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript((value) => localStorage.setItem('theme', value), theme);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    const response = await page.goto(`${server.base}chapters/10-capm/`, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    assert.deepEqual(await page.locator('h2 .section-tag').allTextContents(),
      ['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    const widgets = page.locator('.widget');
    assert.equal(await widgets.count(), 2);
    for (let index = 0; index < 2; index++) {
      const widget = widgets.nth(index);
      await widget.scrollIntoViewIfNeeded();
      await widget.locator('svg').waitFor();
      const sliders = widget.getByRole('slider');
      assert.equal(await sliders.count(), 4);
      const inputs = [0.02, 0.08, 1.5, 0.13];
      const verify = async (name) => {
        const [rf, market, assetBeta, forecast] = inputs;
        const expected = [['market-required', pct(securityMarketLine(rf, market, 1))]];
        for (const [id, b, r] of [['A', assetBeta, forecast], ['B', 0.5, 0.03]]) {
          const result = mispricing(r, rf, market, b);
          expected.push([`${id}-beta`, decimal(b)], [`${id}-forecast`, pct(r)],
            [`${id}-required`, pct(result.requiredReturn)], [`${id}-pricing`, labels[result.pricing]],
            [`${id}-alpha`, `${result.alpha > 1e-12 ? '+' : ''}${decimal(Math.abs(result.alpha) < 1e-12 ? 0 : result.alpha * 100)} pp`]);
        }
        for (const [id, want] of expected) {
          await widget.getByTestId(id).filter({ hasText: want }).waitFor();
          assert.equal(await widget.getByTestId(id).textContent(), want);
          comparisons++;
        }
        // Both segment endpoints and every dot must stay inside the plotting range.
        for (const b of [-0.5, 2]) assert.ok(securityMarketLine(rf, market, b) >= -0.1 && securityMarketLine(rf, market, b) <= 0.26);
        console.log(`✓ ${theme} ${width}px widget ${index + 1}: ${name} matches capm.ts`);
      };
      const set = async (i, value) => {
        await sliders.nth(i).fill(String(value));
        inputs[i] = value;
      };
      await verify('default');
      for (const [i, value] of [[0, 0.04], [1, 0.12], [2, -0.5], [3, -0.02], [2, 2], [3, 0.2]]) {
        await set(i, value);
        await verify(`slider ${i + 1} = ${value}`);
      }
      await sliders.nth(2).focus();
      await sliders.nth(2).press('ArrowLeft');
      inputs[2] = 1.9;
      await verify('keyboard');
      await widget.getByRole('button', { name: 'Restablecer ejemplo' }).click();
      inputs.splice(0, 4, 0.02, 0.08, 1.5, 0.13);
      await verify('reset');
      await set(3, 0.11);
      await verify('zero alpha');
      await set(3, 0.03);
      await verify('negative alpha');
      await widget.getByRole('button', { name: 'Restablecer ejemplo' }).click();
      inputs.splice(0, 4, 0.02, 0.08, 1.5, 0.13);
      await set(1, 0.1);
      await verify('playground market 10 %');
      // Check each extreme for every slider, including nonnegative rate and negative beta.
      for (const [i, values] of [[0, [0, 0.05]], [1, [0.06, 0.12]], [2, [-0.5, 2]], [3, [-0.02, 0.2]]]) {
        for (const value of values) { await set(i, value); await verify(`boundary ${i + 1} = ${value}`); }
      }
      // Moving this widget must not change the other island.
      if (index === 1) assert.equal(await widgets.nth(0).getByTestId('A-beta').textContent(), '2,00');
    }
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
    await page.locator('details').evaluateAll((items) => items.forEach((el) => { el.open = true; }));
    assert.equal(await page.locator('.katex-error').count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow');
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(`✓ ${comparisons} library comparisons; both widgets, every slider, boundaries, reset, keyboard, quizzes and six-section order pass; no console, KaTeX or overflow errors`);
} finally {
  await browser?.close();
  await loader.close();
  await server.stop();
}
