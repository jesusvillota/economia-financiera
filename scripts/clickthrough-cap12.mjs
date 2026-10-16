import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startPreview } from './preview.mjs';
import { createServer } from 'vite';

const server = await startPreview();
const loader = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' });
let browser;
let comparisons = 0;
try {
  const { venues, examples, score, shuffledExamples } = await loader.ssrLoadModule('/src/data/venues.ts');
  const label = Object.fromEntries(venues.map((v) => [v.id, v.label]));
  browser = await chromium.launch();
  for (const theme of ['dark', 'light']) {
    for (const width of [1280, 360]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await context.addInitScript((value) => localStorage.setItem('theme', value), theme);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      const response = await page.goto(`${server.base}chapters/12-estructura-mercado/`, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      assert.deepEqual(await page.locator('h2 .section-tag').allTextContents(),
        ['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
      assert.equal(await page.locator('.widget').count(), 1);
      const widget = page.locator('.widget');
      await widget.scrollIntoViewIfNeeded();
      // The sorter is server-rendered; wait until its island hydrates before using the selects.
      await page.locator('astro-island:not([ssr]) .widget').waitFor();

      let seed = 0;
      let answers = {};
      const verify = async (name) => {
        const order = shuffledExamples(seed);
        const items = widget.locator('li[data-testid^="item-"]');
        assert.deepEqual(await items.evaluateAll((els) => els.map((el) => el.dataset.testid)), order.map((e) => `item-${e.id}`));
        const expected = [
          ['answered', `${Object.keys(answers).length} de ${examples.length}`],
          ['correct', `${score(answers)} de ${examples.length}`],
        ];
        for (const v of venues) {
          const chips = order.map((e, i) => [e, i + 1]).filter(([e]) => answers[e.id] === v.id)
            .map(([e, n]) => `${n}${e.answer === v.id ? ' ✓' : ' ✗'}`).join('');
          expected.push([`chips-${v.id}`, chips]);
        }
        for (const [id, want] of expected) {
          await page.waitForFunction(({ id, want }) => document.querySelector(`[data-testid="${id}"]`)?.textContent === want, { id, want }, { timeout: 5000 })
            .catch(async () => assert.fail(`${name}: ${id} shows "${await widget.getByTestId(id).textContent()}", library says "${want}"`));
          comparisons++;
        }
        for (const e of examples) {
          const feedback = widget.getByTestId(`feedback-${e.id}`);
          if (!answers[e.id]) { assert.equal(await feedback.count(), 0); continue; }
          const text = await feedback.textContent();
          assert.ok(text.startsWith(answers[e.id] === e.answer ? `Correcto. ${e.why}` : 'No exactamente.'), `${e.id}: ${text}`);
          comparisons++;
        }
        console.log(`✓ ${theme} ${width}px: ${name} matches venues.ts`);
      };
      const pick = async (id, venue) => {
        await widget.getByTestId(`item-${id}`).locator('select').selectOption(venue);
        if (venue) answers[id] = venue; else delete answers[id];
      };

      await verify('defaults');
      // Two deliberate mistakes first, then fix them: score follows the key.
      await pick('banco-minorista', 'otc');
      await pick('bono-puntual', 'si');
      await verify('internalizer and one-off OTC swapped');
      for (const e of examples) await pick(e.id, e.answer);
      await verify('all correct');
      await pick('bloque', 'smn');
      await pick('swap', '');
      await verify('one wrong, one cleared');
      await widget.getByRole('button', { name: 'Borrar respuestas' }).click();
      answers = {};
      await verify('cleared');
      assert.ok(await widget.getByRole('button', { name: 'Borrar respuestas' }).isDisabled());
      for (const s of [1, 2]) {
        await widget.getByRole('button', { name: 'Nuevo orden' }).click();
        seed = s;
        await verify(`reshuffle seed ${s}`);
      }
      // Answer every tile with the first venue in the list via the keyboard-usable native select.
      for (const e of shuffledExamples(seed)) await pick(e.id, venues[0].id);
      await verify(`all "${label[venues[0].id]}" after reshuffle`);
      await widget.getByRole('button', { name: 'Nuevo orden' }).click();
      seed = 3;
      answers = {};
      await verify('reshuffle resets answers');

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
  console.log(`✓ ${comparisons} readout comparisons against venues.ts; every select, both buttons, reshuffles, quizzes and six sections pass; no console, KaTeX or overflow errors`);
} finally {
  await browser?.close();
  await loader.close();
  await server.stop();
}
