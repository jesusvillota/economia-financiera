/**
 * Click-through of ps1 exercise 1: hints, wrong answer, right answer, solution steps.
 * Needs a build (npm run build). Run: node scripts/clickthrough-sesion01.mjs
 */
import { startPreview } from './preview.mjs';
import { chromium } from 'playwright';

const server = await startPreview();
const URL_ = `${server.base}sesiones/01-interes-y-rentas/`;
let failed = 0;
const check = (name, cond) => { console.log(`${cond ? '✓' : '✗'} ${name}`); if (!cond) failed++; };
try {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
  await page.goto(URL_, { waitUntil: 'networkidle' });
  const ex = page.locator('.ses-exercise').first();
  const input = ex.locator('.ses-answer input').first(); // 1a: capital final
  const feedback = ex.locator('[data-testid=feedback]').first();
  const submit = ex.getByRole('button', { name: 'Comprobar' }).first();
  await input.waitFor();

  const hints = ex.locator('.ses-hints li');
  check('no hint before asking', (await hints.count()) === 0);
  await ex.getByRole('button', { name: /^Pista 1/ }).click();
  await ex.getByRole('button', { name: /^Pista 2/ }).click();
  check('two hints revealed in order', (await hints.count()) === 2);

  await input.fill('150000'); // forgot the interest
  await submit.click();
  check('wrong answer rejected', (await feedback.textContent()).includes('No es correcto'));
  await input.fill('181.500,00'); // 150000 * (1 + 0,06 * 3,5)
  await submit.click();
  check('right answer accepted', (await feedback.textContent()).includes('Correcto'));

  await ex.getByRole('button', { name: /Ver la solución/ }).click();
  const step = await ex.locator('.ses-steps li').first().textContent();
  check('first solution step shows the answer', step.includes('181500'));

  const before = await ex.locator('.ses-params dd').allTextContents();
  await ex.getByRole('button', { name: 'Nueva variante' }).click();
  const after = await ex.locator('.ses-params dd').allTextContents();
  check('new variant changes parameters', before.join('|') !== after.join('|'));
  check('new variant resets feedback, hints and steps',
    await feedback.count() === 0 && await hints.count() === 0 && await ex.locator('.ses-steps li').count() === 0);
  const param = async (id) => Number((await ex.getByTestId(`param-${id}`).textContent()).replace(/[^\d,.-]/g, '').replace(',', '.'));
  const target = await param('c0') * (1 + await param('i') / 100 * await param('t'));
  await input.fill(target.toFixed(2).replace('.', ','));
  await submit.click();
  check('checker uses the new variant', (await feedback.textContent()).includes('Correcto'));
  await ex.getByRole('button', { name: /Ver la solución/ }).click();
  check('solution uses the new variant answer', (await ex.locator('.ses-steps li').first().textContent()).includes(String(Number(target.toFixed(2))).replace('.', ',')));

  for (const slug of ['01-interes', '02-valor-actual', '03-van-tir']) {
    const href = `/economia-financiera/chapters/${slug}/`;
    const forward = page.getByRole('navigation', { name: 'Capítulos de esta sesión' }).locator(`a[href="${href}"]`);
    await forward.click();
    check(`ps1 → ${slug} resolves`, new URL(page.url()).pathname === href && await page.locator('h1').count() === 1);
    await page.getByRole('navigation', { name: 'Sesiones para practicar' }).getByRole('link', { name: 'Interés y rentas', exact: true }).click();
    check(`${slug} → ps1 resolves`, page.url() === URL_ && await page.locator('h1').textContent() === 'Interés y rentas');
  }
  await browser.close();
} finally {
  await server.stop();
}
process.exit(failed ? 1 : 0);
