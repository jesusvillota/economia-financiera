/** Audit every built HTML page, including hydrated widgets, in both themes and sizes. */
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
import { startPreview } from './preview.mjs';

function pages(directory = 'dist', prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${prefix}${entry.name}`;
    if (entry.isDirectory()) return pages(join(directory, entry.name), `${path}/`);
    return entry.name.endsWith('.html') ? [path.replace(/index\.html$/, '')] : [];
  }).sort();
}

const routes = pages();
assert.ok(routes.length, 'Build the site before running npm run a11y');
const axePath = createRequire(import.meta.url).resolve('axe-core/axe.min.js');
const server = await startPreview();
let browser;
let serious = 0;
let critical = 0;
let scans = 0;
try {
  browser = await chromium.launch();
  for (const theme of ['dark', 'light']) {
    for (const width of [360, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await context.addInitScript((value) => localStorage.setItem('theme', value), theme);
      for (const route of routes) {
        const page = await context.newPage();
        const response = await page.goto(server.base + route, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200, route);
        // client:visible islands must be mounted before axe sees their controls and plots.
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 600) {
            window.scrollTo(0, y);
            await new Promise((resolve) => setTimeout(resolve, 30));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForFunction(() => [...document.querySelectorAll('astro-island[client]')]
          .every((island) => !island.hasAttribute('ssr')));
        await page.evaluate(() => document.fonts.ready);
        await page.addScriptTag({ path: axePath });
        const { violations } = await page.evaluate(() => window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
        }));
        const failures = violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
        for (const violation of failures) {
          if (violation.impact === 'serious') serious += violation.nodes.length;
          else critical += violation.nodes.length;
          console.error(`${violation.impact}: ${violation.id} (${violation.nodes.length})`);
          for (const node of violation.nodes) console.error(`  ${node.target.join(' ')}: ${node.failureSummary}`);
        }
        scans++;
        console.log(`${failures.length ? '✗' : '✓'} /${route} ${theme} ${width}px`);
        await page.close();
      }
      await context.close();
    }
  }
} finally {
  await browser?.close();
  await server.stop();
}
console.log(`Pages checked: ${routes.length}; axe scans: ${scans}; serious violations: ${serious}; critical violations: ${critical}`);
if (serious || critical) process.exitCode = 1;
