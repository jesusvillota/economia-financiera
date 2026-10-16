/**
 * Click-through: moving the rate slider on /dev/widgets must give readouts equal to src/lib/finance.
 * Needs a build (npm run build). Run: npm run clickthrough:widgets
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { flowsFV, flowsPV, compoundGrowth, doublingTime, simpleGrowth } from '../src/lib/finance/curves.ts';

const PORT = 4331;
const URL_ = `http://localhost:${PORT}/economia-financiera/dev/widgets/`;
const fmt = (v) => v.toFixed(2).replace('.', ',');
const server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--port', String(PORT), '--ignore-lock'], { stdio: 'ignore' });
let ok = true;
const check = (name, got, want) => {
  const pass = got.replace(/\s/g, ' ').startsWith(want);
  ok &&= pass;
  console.log(`${pass ? '✓' : '✗'} ${name}: ${got} (expected ${want})`);
};
try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(URL_)).ok) break; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(URL_, { waitUntil: 'networkidle' });
  const widgets = page.locator('.widget');

  // Cash-flow timeline: default flows, r moved to 12 %.
  const flows = [{ t: 0, amount: -100 }, { t: 2, amount: 40 }, { t: 3, amount: 40 }, { t: 5, amount: 60 }];
  const cf = widgets.nth(0);
  await cf.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800); // client:visible hydration
  const va0 = await cf.locator('[data-testid=va]').textContent();
  await cf.locator('input[type=range]').fill('0.12');
  const va1 = await cf.locator('[data-testid=va]').textContent();
  ok &&= va0 !== va1;
  check('VA', va1, fmt(flowsPV(0.12, flows)));
  check('VF', await cf.locator('[data-testid=vf]').textContent(), fmt(flowsFV(0.12, flows, 5)));

  // Growth curves: r = 10 %, n = 20, k = 1 (defaults except r).
  const gc = widgets.nth(1);
  await gc.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800); // client:visible hydration
  await gc.locator('input[type=range]').first().fill('0.1');
  check('simple', await gc.locator('[data-testid=simple]').textContent(), fmt(simpleGrowth(100, 0.1, 20)));
  check('compuesto', await gc.locator('[data-testid=compound]').textContent(), fmt(compoundGrowth(100, 0.1, 1, 20)));
  check('duplicar', await gc.locator('[data-testid=doubling]').textContent(), `${doublingTime(0.1, 1).toFixed(1).replace('.', ',')} años`);
  await browser.close();
} finally {
  server.kill();
}
console.log(ok ? '✓ readouts match src/lib/finance' : '✗ readouts differ');
process.exit(ok ? 0 : 1);
