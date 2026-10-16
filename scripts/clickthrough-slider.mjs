/**
 * Click-through: moving the placeholder chapter's slider must change its readout.
 * Needs a build (npm run build). Run: npm run clickthrough
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4330;
const URL_ = `http://localhost:${PORT}/economia-financiera/chapters/00-ejemplo/`;
const server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--port', String(PORT), '--ignore-lock'], { stdio: 'ignore' });
let ok = false;
try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(URL_)).ok) break; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(URL_, { waitUntil: 'networkidle' });
  const slider = page.locator('.widget input[type=range]');
  await slider.scrollIntoViewIfNeeded();
  const readout = page.locator('[data-testid=vf]');
  const before = await readout.textContent();
  await slider.fill('0.15');
  const after = await readout.textContent();
  console.log(`readout: ${before} -> ${after}`);
  ok = before !== after && after.startsWith('404.56');
  await browser.close();
} finally {
  server.kill();
}
console.log(ok ? '✓ slider changes the readout' : '✗ slider did not change the readout');
process.exit(ok ? 0 : 1);
