import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { startPreview } from './preview.mjs';

const server = await startPreview();
const loader = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
let browser;
let comparisons = 0;
try {
  const lib = await loader.ssrLoadModule('/src/lib/finance/efficiency.ts');
  const { biasExamples, biasScore } = await loader.ssrLoadModule('/src/data/biases.ts');
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
      const response = await page.goto(`${server.base}chapters/16-conductuales/`, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      assert.deepEqual(await page.locator('h2 .section-tag').allTextContents(),
        ['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
      assert.equal(await page.locator('.widget').count(), 2);
      const explorer = page.locator('.widget').nth(0);
      await explorer.scrollIntoViewIfNeeded();
      await explorer.locator('input').first().waitFor();
      await explorer.locator('xpath=ancestor::astro-island[not(@ssr)]').waitFor();
      let state = { lambda: 2, gain: 150, loss: 100, probability: 0.5, weighting: 'linear' };
      const expectReadout = async (widget, id, expected) => {
        await page.waitForFunction(({ id, expected }) => document.querySelector(`[data-testid="${id}"]`)?.textContent === expected,
          { id, expected }, { timeout: 5000 }).catch(async () => assert.fail(`${id}: saw ${await widget.getByTestId(id).textContent()}, library says ${expected}`));
        comparisons++;
      };
      const verify = async () => {
        const p = { ...lib.TK1992, lambda: state.lambda, gamma: state.weighting === 'linear' ? 1 : lib.TK1992.gamma };
        const outcomes = [state.gain, -state.loss];
        const probabilities = [state.probability, 1 - state.probability];
        const value = lib.gambleProspectValue(outcomes, probabilities, p);
        const wants = {
          'value-gain': num(lib.prospectValue(100, p)),
          'value-loss': num(lib.prospectValue(-100, p)),
          expected: `${num(lib.gambleExpectedValue(outcomes, probabilities))} €`,
          prospect: num(value),
          'weight-gain': num(lib.probabilityWeight(probabilities[0], p)),
          'weight-loss': num(lib.probabilityWeight(probabilities[1], p)),
          reference: num(lib.prospectValue(0, p)),
          preference: value > 0 ? 'Apostar' : value < 0 ? 'No apostar' : 'Indiferente',
        };
        for (const [id, want] of Object.entries(wants)) await expectReadout(explorer, id, want);
        assert.equal(await explorer.locator('.MafsView').count(), 1);
      };
      const move = async (index, key, value) => {
        const slider = explorer.locator('input[type="range"]').nth(index);
        await slider.fill(String(value));
        state[key] = value;
        await verify();
      };
      await verify();
      for (const v of [1, 3, 2.25]) await move(0, 'lambda', v);
      for (const v of [0, 200, 150]) await move(1, 'gain', v);
      for (const v of [0, 200, 100]) await move(2, 'loss', v);
      for (const v of [0, 1, 0.05, 0.95, 0.5]) await move(3, 'probability', v);
      await explorer.locator('select').selectOption('weighted');
      state.weighting = 'weighted';
      await verify();
      for (const v of [0, 1, 0.05, 0.95]) await move(3, 'probability', v);
      // Keyboard input also changes the live readouts.
      await explorer.locator('input').first().focus();
      await page.keyboard.press('Home');
      state.lambda = 1;
      await verify();
      await explorer.getByRole('button', { name: 'Restablecer ejemplo' }).click();
      state = { lambda: 2, gain: 150, loss: 100, probability: 0.5, weighting: 'linear' };
      await verify();
      assert.deepEqual(await explorer.locator('input').evaluateAll((els) => els.map((e) => Number(e.value))), [2, 150, 100, 0.5]);
      assert.equal(await explorer.locator('select').inputValue(), 'linear');
      console.log(`✓ ${theme} ${width}px: all explorer controls match efficiency.ts`);

      const classifier = page.locator('.widget').nth(1);
      await classifier.scrollIntoViewIfNeeded();
      await classifier.locator('xpath=ancestor::astro-island[not(@ssr)]').waitFor();
      let answers = {};
      const score = () => expectReadout(classifier, 'bias-score', `${biasScore(answers)} de ${biasExamples.length}`);
      await score();
      for (const e of biasExamples) {
        const item = classifier.getByTestId(`bias-${e.id}`);
        await item.locator('select').selectOption(e.answer === 'anclaje' ? 'confianza' : 'anclaje');
        answers[e.id] = e.answer === 'anclaje' ? 'confianza' : 'anclaje';
        assert.match(await item.getByRole('status').textContent(), /No exactamente/);
        await score();
        await item.locator('select').selectOption(e.answer);
        answers[e.id] = e.answer;
        assert.equal(await item.getByRole('status').textContent(), `Correcto. ${e.why}`);
        await score();
      }
      await classifier.getByTestId(`bias-${biasExamples[0].id}`).locator('select').selectOption('');
      delete answers[biasExamples[0].id];
      await score();
      await classifier.getByRole('button', { name: 'Borrar respuestas' }).click();
      answers = {};
      await score();
      assert.ok(await classifier.getByRole('button').isDisabled());
      assert.deepEqual(await classifier.locator('select').evaluateAll((els) => els.map((e) => e.value)), ['', '', '', '', '']);
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
      const details = page.locator('details').filter({ has: page.getByText('La ponderación opcional de probabilidades', { exact: true }) });
      await details.locator('summary').click();
      assert.ok(await details.evaluate((el) => el.open));
      assert.equal(await page.locator('.katex-error').count(), 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow');
      assert.deepEqual(errors, []);
      console.log(`✓ ${theme} ${width}px: bias controls, three quizzes, details and six sections; no console, KaTeX or overflow errors`);
      await context.close();
    }
  }
  console.log(`✓ ${comparisons} readout comparisons against efficiency.ts and biases.ts; Chapter 16 click-through passed`);
} finally {
  await browser?.close();
  await loader.close();
  await server.stop();
}
