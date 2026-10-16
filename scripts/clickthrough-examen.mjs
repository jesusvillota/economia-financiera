/** Final-exam browser acceptance against the built page, with independent cash-flow sums. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startPreview } from './preview.mjs';
const server = await startPreview();
let browser;
const sum = (a, beta, gamma, m, k, t) => {
  let value = 0;
  for (let j = 0; j < 20_000; j++) value += Math.exp(Math.log(a) + j / m * Math.log1p(beta / 100) - k * (t + j / m) * Math.log1p(gamma / 100));
  return value;
};
try {
  browser = await chromium.launch();
  for (const theme of ['dark', 'light']) for (const width of [1280, 360]) {
    const context = await browser.newContext({ viewport: { width, height: 800 } });
    await context.addInitScript(t => localStorage.setItem('theme', t), theme);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(server.base, { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: 'Examen final: práctica por dificultad', exact: true }).click();
    await page.waitForURL('**/sesiones/examen-final/');
    assert.equal(await page.locator('h1').textContent(), 'Examen final: práctica por dificultad');
    assert.equal(await page.locator('.ses-exercise').count(), 8);
    const levels = await page.locator('.ses-level').allTextContents();
    assert.deepEqual(levels.map(t => Number(t.match(/\d/)[0])), [1, 1, 2, 2, 2, 3, 3, 3]);
    assert.match(await page.locator('.eyebrow').textContent(), /Preparación del examen final/);
    const ex = page.locator('.ses-exercise').filter({ has: page.locator('#examen-final-rentas') });
    const forms = ex.locator('.ses-answer');
    await forms.first().locator('input').waitFor();
    assert.equal(await ex.locator('.ses-hints li').count(), 0);
    for (let i = 1; i <= 3; i++) {
      await ex.getByRole('button', { name: new RegExp(`^Pista ${i}`) }).click();
      assert.equal(await ex.locator('.ses-hints li').count(), i);
    }
    await forms.first().locator('input').fill('1');
    await forms.first().getByRole('button', { name: 'Comprobar' }).click();
    assert.match(await forms.first().getByTestId('feedback').textContent(), /^No es correcto/);
    await forms.nth(1).locator('input').fill('0');
    await forms.nth(1).getByRole('button', { name: 'Comprobar' }).click();
    assert.match(await forms.nth(1).getByTestId('feedback').textContent(), /^No es correcto/);
    const param = async id => Number((await ex.getByTestId(`param-${id}`).textContent()).replace(/[^\d,.-]/g, '').replace(',', '.'));
    const solve = async () => {
      const [a, beta, gamma, m, k, t] = await Promise.all(['a', 'beta', 'gamma', 'm', 'k', 't'].map(param));
      const target = sum(a, beta, gamma, m, k, t);
      const options = [
        a / ((1 + gamma / 100) ** (k / m) - (1 + beta / 100) ** (1 / m)),
        a / (((1 + gamma / 100) ** (k / m) - (1 + beta / 100) ** (1 / m)) * (1 + gamma / 100) ** (k * (t - 1 / m))),
        a / (((1 + gamma / 100) ** ((k - 1) / m) - (1 + beta / 100) ** (1 / m)) * (1 + gamma / 100) ** ((k - 1) * (t - 1 / m))),
      ];
      const matching = options.map((v, i) => ({ v, i })).filter(o => Math.abs(o.v / target - 1) < 1e-9);
      assert.equal(matching.length, 1);
      for (const [i, value] of [matching[0].i + 1, target].entries()) {
        await forms.nth(i).locator('input').fill(value.toFixed(4).replace('.', ','));
        await forms.nth(i).getByRole('button', { name: 'Comprobar' }).click();
        assert.match(await forms.nth(i).getByTestId('feedback').textContent(), /^Correcto/);
      }
    };
    await solve();
    assert.match(await page.locator('.eyebrow').textContent(), /1 de 8 resueltos/);
    await ex.getByRole('button', { name: /Ver la solución/ }).click();
    while (await ex.getByRole('button', { name: 'Siguiente paso', exact: true }).count()) await ex.getByRole('button', { name: 'Siguiente paso', exact: true }).click();
    assert.equal(await ex.locator('.ses-steps li').count(), 4);
    assert.doesNotMatch(await ex.locator('.ses-steps').textContent(), /\{\{/);
    const before = await ex.locator('.ses-params dd').allTextContents();
    await ex.getByRole('button', { name: 'Nueva variante' }).click();
    assert.notDeepEqual(await ex.locator('.ses-params dd').allTextContents(), before);
    assert.equal(await ex.getByTestId('feedback').count(), 0);
    assert.equal(await ex.locator('.ses-hints li').count(), 0);
    assert.equal(await ex.locator('.ses-steps li').count(), 0);
    await solve();
    assert.equal(await page.locator('.katex-error').count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.deepEqual(errors, []);
    console.log(`✓ ${theme} ${width}px: landing link, ordered difficulty, hints, wrong/right answers, solution and seeded variant`);
    await context.close();
  }
  console.log('✓ Rentas solved by summing 20,000 payments; no console, KaTeX or overflow errors');
} finally {
  await browser?.close();
  await server.stop();
}
