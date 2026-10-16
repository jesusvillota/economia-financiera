/** PS3 browser acceptance: fully solve source Ex1, then verify a seeded variant. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startPreview } from './preview.mjs';
const server = await startPreview();
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const response = await page.goto(`${server.base}sesiones/03-carteras-y-capm/`, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200);
  assert.equal(await page.locator('h1').textContent(), 'Carteras y CAPM');
  assert.equal(await page.locator('.ses-exercise').count(), 9);
  const ex = page.locator('.ses-exercise').first();
  await ex.locator('input').first().waitFor();
  assert.equal(await ex.locator('.ses-hints li').count(), 0);
  for (let i = 1; i <= 3; i++) {
    await ex.getByRole('button', { name: new RegExp(`^Pista ${i}`) }).click();
    assert.equal(await ex.locator('.ses-hints li').count(), i);
  }
  console.log('✓ Three hints revealed in order');
  const forms = ex.locator('.ses-answer');
  await forms.first().locator('input').fill('999');
  await forms.first().getByRole('button', { name: 'Comprobar' }).click();
  assert.match(await forms.first().getByTestId('feedback').textContent(), /No es correcto/);
  console.log('✓ Wrong answer rejected');
  // Independent source-data answers: mean; five risks; min weight, mean and risk.
  const sigma = (w, a, b, rho) => Math.sqrt((w*a)**2 + ((1-w)*b)**2 + 2*w*(1-w)*a*b*rho);
  const w = (15**2 - .3*18*15) / (18**2 + 15**2 - 2*.3*18*15);
  const answers = [10, ...[1,.5,0,-.5,-1].map(r => sigma(.5,18,15,r)), w*100, w*12+(1-w)*8, sigma(w,18,15,.3)];
  assert.equal(await forms.count(), answers.length);
  for (let i = 0; i < answers.length; i++) {
    const form = forms.nth(i);
    await form.locator('input').fill(answers[i].toFixed(4).replace('.', ','));
    await form.getByRole('button', { name: 'Comprobar' }).click();
    assert.match(await form.getByTestId('feedback').textContent(), /^Correcto/);
  }
  // Progress storage is verified using the visible counter, independent of storage keys.
  assert.match(await page.locator('.eyebrow').textContent(), /1 de 9 resueltos/);
  console.log('✓ All nine answers accepted; exercise marked solved');
  await ex.getByRole('button', { name: /Ver la solución/ }).click();
  while (await ex.getByRole('button', { name: 'Siguiente paso', exact: true }).count()) await ex.getByRole('button', { name: 'Siguiente paso', exact: true }).click();
  assert.equal(await ex.locator('.ses-steps li').count(), 4);
  assert.doesNotMatch(await ex.locator('.ses-steps').textContent(), /\{\{/);
  console.log('✓ Full stepwise solution renders');
  const before = await ex.locator('.ses-params dd').allTextContents();
  await ex.getByRole('button', { name: 'Nueva variante' }).click();
  assert.notDeepEqual(await ex.locator('.ses-params dd').allTextContents(), before);
  assert.equal(await ex.getByTestId('feedback').count(), 0);
  assert.equal(await ex.locator('.ses-hints li').count(), 0);
  assert.equal(await ex.locator('.ses-steps li').count(), 0);
  const param = async id => Number((await ex.getByTestId(`param-${id}`).textContent()).replace(/[^\d,.-]/g, '').replace(',', '.'));
  const target = (await param('w')) / 100 * await param('a') + (1 - await param('w') / 100) * await param('b');
  await forms.first().locator('input').fill(target.toFixed(4).replace('.', ','));
  await forms.first().getByRole('button', { name: 'Comprobar' }).click();
  assert.match(await forms.first().getByTestId('feedback').textContent(), /^Correcto/);
  console.log('✓ New variant resets help and checks recomputed answers');
  const slider = page.getByRole('slider', { name: 'Correlación', exact: true });
  await slider.scrollIntoViewIfNeeded();
  await page.locator('.MafsView').first().waitFor();
  await slider.fill('-1');
  await page.getByTestId('ps3-risk').filter({ hasText: '1,50' }).waitFor();
  await slider.fill('1');
  await page.getByTestId('ps3-risk').filter({ hasText: '16,50' }).waitFor();
  assert.equal(await page.locator('.katex-error').count(), 0);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  assert.deepEqual(errors, []);
  console.log('✓ Correlation graph, maths and 360 px layout are clean');
} finally {
  await browser?.close();
  await server.stop();
}
