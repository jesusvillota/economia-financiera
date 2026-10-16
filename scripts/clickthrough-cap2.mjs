/**
 * Click-through of the widgets of chapter 2: the annuity builder and the cash-flow timeline.
 * Readouts must change and equal src/lib/finance. Needs a build. Run: npm run clickthrough:cap2
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { annuityClosedPV, annuitySumPV, perpetuityClosedPV } from '../src/lib/finance/annuities.ts';
import { flowsPV } from '../src/lib/finance/curves.ts';

const PORT = 4332;
const URL_ = `http://localhost:${PORT}/economia-financiera/chapters/02-valor-actual/`;
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

  // Cash-flow timeline (discount mode): moving r changes VA; the button discounts.
  const cf = widgets.nth(0);
  await cf.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const va0 = await cf.locator('[data-testid=va]').textContent();
  await cf.locator('input[type=range]').fill('0.2');
  const va1 = await cf.locator('[data-testid=va]').textContent();
  ok &&= va0 !== va1;
  const flows = [{ t: 0, amount: -100 }, { t: 2, amount: 40 }, { t: 3, amount: 40 }, { t: 5, amount: 60 }];
  check('timeline VA (r = 20 %)', va1, fmt(flowsPV(0.2, flows)));
  await cf.getByRole('button', { name: /Descontar/ }).click();
  ok &&= (await cf.getByRole('button', { name: /Volver/ }).count()) === 1;

  // Annuity builder: defaults A = 100, r = 5 %, n = 10, g = 0, ordinary.
  const ab = widgets.nth(1);
  await ab.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const read = (id) => ab.locator(`[data-testid=${id}]`).textContent();
  check('constructor VA (defecto)', await read('va'), fmt(annuityClosedPV(100, 0.05, 0, 10, false)));
  check('constructor suma (defecto)', await read('suma'), fmt(annuitySumPV(100, 0.05, 0, 10, false)));
  check('constructor perpetuidad (defecto)', await read('perp'), fmt(perpetuityClosedPV(100, 0.05, 0, false)));
  const before = await read('va');
  await ab.getByRole('radio', { name: 'Inicio de año' }).click();
  check('prepagable', await read('va'), fmt(annuityClosedPV(100, 0.05, 0, 10, true)));
  ok &&= before !== (await read('va'));
  const sliders = ab.locator('input[type=range]');
  await sliders.nth(1).fill('0.1'); // r = 10 %
  await sliders.nth(2).fill('15'); // n = 15
  await sliders.nth(3).fill('0.05'); // g = 5 %
  check('creciente prepagable VA', await read('va'), fmt(annuityClosedPV(100, 0.1, 0.05, 15, true)));
  check('creciente prepagable suma', await read('suma'), fmt(annuitySumPV(100, 0.1, 0.05, 15, true)));
  check('perpetuidad creciente', await read('perp'), fmt(perpetuityClosedPV(100, 0.1, 0.05, true)));
  await sliders.nth(3).fill('0.1'); // g = r
  check('perpetuidad con r = g', await read('perp'), 'r');
  await browser.close();
} finally {
  server.kill();
}
console.log(ok ? '✓ readouts change and match src/lib/finance' : '✗ readouts differ');
process.exit(ok ? 0 : 1);
