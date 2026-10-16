/** Chapter 4: exercise every control and compare the rendered values with valuation.ts. */
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { startPreview } from './preview.mjs';
import { gordonPrice } from '../src/lib/finance/valuation.ts';

const euro = (v) => `${v.toFixed(2).replace('.', ',')} €`;
mkdirSync('screenshots', { recursive: true });
const server = await startPreview();
let browser;
try {
  browser = await chromium.launch();
  for (const theme of ['dark', 'light']) {
    for (const viewport of [{ width: 1280, height: 900 }, { width: 360, height: 800 }]) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      await context.addInitScript((t) => localStorage.setItem('theme', t), theme);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      const response = await page.goto(`${server.base}chapters/04-dividendos/`, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      assert.deepEqual(await page.locator('h2 .section-tag').allTextContents(),
        ['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
      const widget = page.getByTestId('dividend-widget');
      await widget.scrollIntoViewIfNeeded();
      await widget.locator('input[type=range]').first().waitFor();
      await page.waitForFunction(() => document.querySelector('[data-testid=dividend-widget] .MafsView'));
      const sliders = widget.getByRole('slider');
      assert.equal(await sliders.count(), 3);
      const check = async (d, r, g) => {
        const expected = r > g ? euro(gordonPrice(d, r, g)) : 'No converge';
        await page.waitForFunction((want) => document.querySelector('[data-testid=price]')?.textContent === want, expected);
        assert.equal(await widget.getByTestId('price').textContent(), expected);
        assert.equal(await widget.getByTestId('zero-growth').textContent(), euro(gordonPrice(d, r, 0)));
        assert.equal(await widget.getByTestId('warning').count(), r > g ? 0 : 1);
        assert.equal(await page.locator('.katex-error').count(), 0);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      };
      await check(3, 0.1, 0.04);
      await sliders.nth(0).fill('4.5');
      await check(4.5, 0.1, 0.04);
      await sliders.nth(1).fill('0.12');
      await check(4.5, 0.12, 0.04);
      await sliders.nth(2).fill('0.06');
      await check(4.5, 0.12, 0.06);
      await sliders.nth(2).fill('0');
      await check(4.5, 0.12, 0);
      await sliders.nth(2).fill('-0.02');
      await check(4.5, 0.12, -0.02);
      await sliders.nth(2).fill('0.12');
      await check(4.5, 0.12, 0.12);
      await sliders.nth(1).fill('0.1');
      await check(4.5, 0.1, 0.12);
      await sliders.nth(2).fill('0.095');
      await check(4.5, 0.1, 0.095); // near the asymptote
      await sliders.nth(2).fill('0.04');
      await sliders.nth(0).focus();
      await page.keyboard.press('ArrowRight');
      await check(5, 0.1, 0.04); // keyboard accessibility and recovery after invalid state
      const quizzes = page.locator('.quiz');
      assert.equal(await quizzes.count(), 3);
      for (const [i, answer] of [0, 1, 1].entries()) {
        const quiz = quizzes.nth(i);
        await quiz.scrollIntoViewIfNeeded();
        await quiz.getByRole('button').nth((answer + 1) % 3).click();
        assert.match(await quiz.getByRole('status').textContent(), /No exactamente/);
        await quiz.getByRole('button', { name: 'Inténtalo de nuevo' }).click();
        await quiz.getByRole('button').nth(answer).click();
        assert.match(await quiz.getByRole('status').textContent(), /Correcto/);
      }
      await page.getByText('Cómo se obtiene la fórmula', { exact: true }).click();
      assert.equal(await page.locator('details[open]').filter({ hasText: 'Cómo se obtiene la fórmula' }).count(), 1);
      assert.equal(await page.locator('.katex-error').count(), 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: `screenshots/cap4-interacted-${theme}-${viewport.width}.png`, fullPage: true });
      assert.deepEqual(errors, []);
      console.log(`✓ ${theme} ${viewport.width}px: six sections; all three sliders; zero/negative growth; r = g; r < g; recovery; keyboard; three quizzes and derivation; readouts match valuation.ts; no console/KaTeX/overflow errors`);
      await context.close();
    }
  }
} finally {
  await browser?.close();
  await server.stop();
}
console.log('✓ Chapter 4 click-through passed');
