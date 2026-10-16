/**
 * Click-through of chapter 3: each widget's readout must change and equal src/lib/finance.
 * Needs a build (npm run build). Run: npm run clickthrough:van-tir
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { crossoverRate, irr, npv, payback } from '../src/lib/finance/appraisal.ts';
import { flowsPV } from '../src/lib/finance/curves.ts';
import { convencional, dosTir, lento, rapido } from '../src/lib/finance/examples.ts';

const PORT = 4332;
const URL_ = `http://localhost:${PORT}/economia-financiera/chapters/03-van-tir/`;
const num = (v, d = 2) => v.toFixed(d).replace('.', ',');
const pct = (v) => `${num(v * 100, 2)} %`;
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

  // 1. Cash-flow timeline: rate 8 % -> 20 %, then discount button.
  const cf = widgets.nth(0);
  await cf.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const flows = [{ t: 0, amount: -100 }, { t: 2, amount: 40 }, { t: 3, amount: 40 }, { t: 5, amount: 60 }];
  const va0 = await cf.locator('[data-testid=va]').textContent();
  await cf.locator('input[type=range]').fill('0.2');
  const va1 = await cf.locator('[data-testid=va]').textContent();
  ok &&= va0 !== va1;
  check('timeline VA (r = 20 %)', va1, `${num(flowsPV(0.2, flows))} €`);
  await cf.getByRole('button', { name: 'Descontar a t = 0' }).click();
  await page.waitForTimeout(500);
  check('timeline after discounting', await cf.locator('[data-testid=va]').textContent(), `${num(flowsPV(0.2, flows))} €`);

  // 2. NPV profile: slider, then each preset.
  const np = widgets.nth(1);
  await np.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const slider = np.locator('input[type=range]');
  const t = (id) => np.locator(`[data-testid=${id}]`).textContent();
  const v0 = await t('van-0');
  await slider.fill('0.25');
  ok &&= v0 !== (await t('van-0'));
  check('conv VAN (25 %)', await t('van-0'), `${num(npv(0.25, convencional))} €`);
  check('conv TIR', await t('tir-0'), pct(irr(convencional).roots[0]));
  check('conv payback', await t('payback-0'), `${num(payback(convencional))} años`);

  await np.getByRole('radio', { name: 'Rápido y lento' }).click();
  await slider.fill('0.12');
  check('A VAN (12 %)', await t('van-0'), `${num(npv(0.12, rapido))} €`);
  check('B VAN (12 %)', await t('van-1'), `${num(npv(0.12, lento))} €`);
  check('B TIR', await t('tir-1'), pct(irr(lento).roots[0]));
  check('cruce', await t('cruce'), pct(crossoverRate(rapido, lento)));
  await slider.fill('0.05');
  check('A VAN (5 %)', await t('van-0'), `${num(npv(0.05, rapido))} €`);

  await np.getByRole('radio', { name: 'Dos TIR' }).click();
  await slider.fill('0.15');
  check('dos TIR VAN (15 %)', await t('van-0'), `${num(npv(0.15, dosTir))} €`);
  check('dos TIR roots', await t('tir-0'), irr(dosTir).roots.map(pct).join(' y '));
  await browser.close();
} finally {
  server.kill();
}
console.log(ok ? '✓ chapter 3 readouts match src/lib/finance' : '✗ readouts differ');
process.exit(ok ? 0 : 1);
