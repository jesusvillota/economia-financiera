/**
 * Click-through of ps1 exercise 1: hints, wrong answer, right answer, solution steps.
 * Needs a build (npm run build). Run: node scripts/clickthrough-sesion01.mjs
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4332;
const URL_ = `http://localhost:${PORT}/economia-financiera/sesiones/01-interes-y-rentas/`;
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
  await browser.close();
} finally {
  server.kill();
}
process.exit(failed ? 1 : 0);
