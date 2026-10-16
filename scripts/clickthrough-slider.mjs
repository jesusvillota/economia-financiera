/**
 * Click-through: each GrowthCurves widget of chapter 1 must change its readout when the sliders move,
 * and the values must equal src/lib/finance. Needs a build (npm run build). Run: npm run clickthrough
 */
import { startPreview } from './preview.mjs';
import { chromium } from 'playwright';
import { compoundGrowth, doublingTime, simpleGrowth } from '../src/lib/finance/curves.ts';

const server = await startPreview();
const URL_ = `${server.base}chapters/01-interes/`;
const fmt = (v) => v.toFixed(2).replace('.', ',');
let ok = true;
try {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(URL_, { waitUntil: 'networkidle' });
  const widgets = page.locator('.widget');
  if ((await widgets.count()) !== 2) { ok = false; console.log('✗ expected 2 widgets'); }
  // Both widgets: defaults r = 8 %, n = 20, k = 1; then r = 5 %, n = 40, k = 12.
  for (let w = 0; w < 2; w++) {
    const g = widgets.nth(w);
    await g.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800); // client:visible hydration
    const sliders = g.locator('input[type=range]');
    const before = await g.locator('[data-testid=compound]').textContent();
    check(`#${w + 1} inicial`, before, fmt(compoundGrowth(100, 0.08, 1, 20)));
    await sliders.nth(0).fill('0.05');
    await sliders.nth(1).fill('40');
    await sliders.nth(2).fill('12');
    const after = await g.locator('[data-testid=compound]').textContent();
    ok &&= before !== after;
    check(`#${w + 1} compuesto`, after, fmt(compoundGrowth(100, 0.05, 12, 40)));
    check(`#${w + 1} simple`, await g.locator('[data-testid=simple]').textContent(), fmt(simpleGrowth(100, 0.05, 40)));
    check(`#${w + 1} duplicar`, await g.locator('[data-testid=doubling]').textContent(), `${doublingTime(0.05, 12).toFixed(1).replace('.', ',')} años`);
  }
  await browser.close();
} finally {
  await server.stop();
}
function check(name, got, want) {
  const pass = got.replace(/\s/g, ' ').startsWith(want);
  ok &&= pass;
  console.log(`${pass ? '✓' : '✗'} ${name}: ${got} (expected ${want})`);
}
console.log(ok ? '✓ sliders change the readouts as expected' : '✗ click-through failed');
process.exit(ok ? 0 : 1);
