import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { startPreview } from './preview.mjs';

const server = await startPreview();
const loader = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
let browser;
let comparisons = 0;
const num = v => v.toFixed(2).replace('.', ',');
const pct = v => `${num(v * 100)} %`;
const euros = v => `${num(v)} €`;
const initial = [0.02, 0.03, 0.04, 0.045, 0.05];
try {
  const lib = await loader.ssrLoadModule('/src/lib/finance/bonds.ts');
  browser = await chromium.launch();
  for (const theme of ['dark', 'light']) for (const width of [1280, 360]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript(t => localStorage.setItem('theme', t), theme);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const response = await page.goto(`${server.base}chapters/18-estructura-temporal/`, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    assert.deepEqual(await page.locator('h2 .section-tag').allTextContents(),
      ['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    assert.equal(await page.locator('.widget').count(), 1);
    const widget = page.locator('.widget');
    await widget.scrollIntoViewIfNeeded();
    await widget.locator('xpath=ancestor::astro-island[not(@ssr)]').waitFor();
    await widget.locator('.MafsView').waitFor();
    const sliders = widget.locator('input[type="range"]');
    assert.equal(await sliders.count(), 6);
    let rates = [...initial], coupon = 0.05, maturity = 3, start = 1, length = 2;
    const verify = async () => {
      const curve = rates.map((rate, i) => ({ t: i + 1, rate }));
      const bond = { face: 1000, couponRate: coupon, maturity };
      const wanted = {
        ...Object.fromEntries(curve.map((_, i) => [`forward-${i}`, pct(lib.forwardRate(curve, i, 1))])),
        'selected-forward': pct(lib.forwardRate(curve, start, length)),
        'zero-price': euros(lib.bondPriceFromSpots({ ...bond, couponRate: 0 }, curve)),
        'bond-price': euros(lib.bondPriceFromSpots(bond, curve)),
      };
      for (const [id, expected] of Object.entries(wanted)) {
        await page.waitForFunction(({ id, expected }) => document.querySelector(`[data-testid="${id}"]`)?.textContent === expected,
          { id, expected }, { timeout: 5000 }).catch(async () => assert.fail(`${id}: saw ${await widget.getByTestId(id).textContent()}, expected ${expected}`));
        comparisons++;
      }
      assert.deepEqual(await sliders.evaluateAll(els => els.map(el => Number(el.value))), [...rates, coupon]);
      for (let i = 0; i < 5; i++) assert.equal(Number(await widget.getByTestId(`spot-point-${i}`).getAttribute('data-rate')), rates[i]);
      assert.equal(Number(await widget.getByLabel('Vencimiento del bono (años)').inputValue()), maturity);
      assert.equal(Number(await widget.getByLabel('Inicio del forward (años)').inputValue()), start);
      assert.equal(Number(await widget.getByLabel('Duración del forward (años)').inputValue()), length);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow');
    };
    const move = async (i, v) => {
      await sliders.nth(i).fill(String(v));
      if (i === 5) coupon = v; else rates[i] = v;
      await verify();
    };
    const reset = async () => {
      await widget.getByRole('button', { name: 'Restablecer ejemplo' }).click();
      rates = [...initial]; coupon = 0.05; maturity = 3; start = 1; length = 2;
      await verify();
    };
    await verify();
    // Every spot and coupon input, including negative spots and extreme forwards.
    for (let i = 0; i < 6; i++) {
      for (const v of i === 5 ? [0, 0.1, 0.05] : [-0.02, 0.08, initial[i]]) await move(i, v);
    }
    // Flat curve and keyboard accessibility for each native range input.
    for (let i = 0; i < 5; i++) await move(i, 0.03);
    for (let i = 0; i < 6; i++) {
      await sliders.nth(i).focus();
      await sliders.nth(i).press('Home');
      if (i === 5) coupon = 0; else rates[i] = -0.02;
      await verify();
    }
    await reset();
    // Drag all five plot points, independently of slider events. Constraining preserves the date.
    for (let i = 0; i < 5; i++) {
      await widget.locator('.MafsView').scrollIntoViewIfNeeded();
      const point = widget.getByTestId(`spot-point-${i}`).locator('.mafs-movable-point-point');
      const box = await point.boundingBox();
      assert.ok(box);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 25, { steps: 8 });
      await page.mouse.up();
      await page.waitForFunction(({ i, old }) => Number(document.querySelector(`[data-testid="spot-point-${i}"]`)?.getAttribute('data-rate')) !== old,
        { i, old: rates[i] }, { timeout: 3000 });
      const observed = Number(await sliders.nth(i).inputValue());
      assert.ok(observed > rates[i], `point ${i} moved upward`);
      rates[i] = observed;
      await verify();
      await reset();
    }
    // All bond maturities, and all valid forward intervals; crossing the horizon clamps duration.
    for (maturity = 1; maturity <= 5; maturity++) {
      await widget.getByLabel('Vencimiento del bono (años)').selectOption(String(maturity));
      await verify();
    }
    maturity = 5;
    for (start = 0; start < 5; start++) {
      await widget.getByLabel('Inicio del forward (años)').selectOption(String(start));
      length = Math.min(length, 5 - start);
      await verify();
      for (let k = 1; k <= 5 - start; k++) {
        length = k;
        await widget.getByLabel('Duración del forward (años)').selectOption(String(length));
        await verify();
      }
    }
    await reset();
    await widget.getByLabel('Duración del forward (años)').selectOption('4'); length = 4;
    await verify();
    await widget.getByLabel('Inicio del forward (años)').selectOption('4'); start = 4; length = 1;
    await verify();
    await reset();
    const details = page.locator('details').filter({ has: page.getByText('Cómo obtener spots de bonos con cupones', { exact: true }) });
    await details.locator('summary').click();
    assert.ok(await details.evaluate(el => el.open));
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
    assert.deepEqual(errors, []);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    console.log(`✓ ${theme} ${width}px: five drags, six sliders + keyboard, all bond/forward intervals, reset, details, three quizzes; no console, KaTeX or overflow errors`);
    await context.close();
  }
  console.log(`✓ ${comparisons} readout comparisons against bonds.ts; Chapter 18 click-through passed`);
} finally {
  await browser?.close();
  await loader.close();
  await server.stop();
}
