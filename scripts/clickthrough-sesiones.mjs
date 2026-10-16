/**
 * Click-through of the fixture problem session. Needs a build (npm run build).
 * Run: node scripts/clickthrough-sesiones.mjs
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4331;
const URL_ = `http://localhost:${PORT}/economia-financiera/sesiones/00-ejemplo/`;
const server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--port', String(PORT), '--ignore-lock'], { stdio: 'ignore' });
let failed = 0;
const check = (name, cond) => { console.log(`${cond ? '✓' : '✗'} ${name}`); if (!cond) failed++; };
try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(URL_)).ok) break; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
  await page.goto(URL_, { waitUntil: 'networkidle' });
  const input = page.locator('.ses-answer input');
  const feedback = page.locator('[data-testid=feedback]');
  const submit = page.getByRole('button', { name: 'Comprobar' });
  const params = async () => (await page.locator('.ses-params dd').allTextContents()).join('|');
  await input.waitFor();

  await input.fill('1');
  await submit.click();
  check('wrong answer gives negative feedback', (await feedback.textContent()).includes('No es correcto') && (await feedback.getAttribute('class')).includes('wrong'));
  await input.fill('1628,89');
  await submit.click();
  check('right answer gives positive feedback', (await feedback.textContent()).includes('Correcto') && (await feedback.getAttribute('class')).includes('right'));

  const hints = page.locator('.ses-hints li');
  check('no hint before asking', (await hints.count()) === 0);
  await page.getByRole('button', { name: /^Pista 1/ }).click();
  const h1 = await hints.allTextContents();
  check('hint 1 revealed', h1.length === 1);
  await page.getByRole('button', { name: /^Pista 2/ }).click();
  const h2 = await hints.allTextContents();
  check('hint 2 appended after hint 1', h2.length === 2 && h2[0] === h1[0]);
  check('hint ladder ends', (await page.getByRole('button', { name: /^Pista/ }).count()) === 0);

  const steps = page.locator('.ses-steps li');
  await page.getByRole('button', { name: /Ver la solución/ }).click();
  const first = await steps.allTextContents();
  await page.getByRole('button', { name: 'Siguiente paso' }).click();
  const second = await steps.allTextContents();
  check('solution steps reveal in order', first.length === 1 && second.length === 2 && second[0] === first[0] && second[1].startsWith('Sustituir'));

  const before = await params();
  const ok0 = await feedback.count();
  await page.getByRole('button', { name: 'Nueva variante' }).click();
  const after = await params();
  check(`Nueva variante changes numbers (${before} -> ${after})`, before !== after);
  check('variant resets feedback', ok0 === 1 && (await feedback.count()) === 0);
  // Recompute the expected answer from the shown numbers: va * (1+r)^t.
  const [va, r, t] = (await page.locator('.ses-params dd').allTextContents()).map((s) => Number(s.replace(/[^\d,]/g, '').replace(',', '.')));
  const vf = va * (1 + r) ** t;
  await input.fill(String(vf.toFixed(2)).replace('.', ','));
  await submit.click();
  check(`checker matches the new variant (${vf.toFixed(2)})`, (await feedback.textContent()).includes('Correcto'));
  await input.fill('1628,89');
  await submit.click();
  check('old answer is now rejected', (await feedback.textContent()).includes('No es correcto'));
  await browser.close();
} finally {
  server.kill();
}
process.exit(failed ? 1 : 0);
