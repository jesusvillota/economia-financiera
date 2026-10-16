import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { startPreview } from './preview.mjs';

const index = JSON.parse(readFileSync('dist/search-index.json', 'utf8'));
assert.equal(new Set(index.map((entry) => entry.url)).size, index.length, 'unique search destinations');
for (const [kind, folder] of [['chapter', 'chapters'], ['session', 'sesiones']]) {
  const sources = readdirSync(`src/content/${folder}`).filter((file) => /\.mdx?$/.test(file));
  assert.equal(index.filter((entry) => entry.kind === kind).length, sources.length, `${kind} coverage`);
}
const glossaryHtml = readFileSync('dist/glosario/index.html', 'utf8');
assert.equal(index.filter((entry) => entry.kind === 'glossary').length, (glossaryHtml.match(/class="entry"/g) ?? []).length);
for (const entry of index) {
  assert.ok(entry.title && entry.excerpt && entry.text, `searchable text: ${entry.url}`);
  assert.ok(entry.url.startsWith('/economia-financiera/'));
  const [path, anchor] = entry.url.replace('/economia-financiera/', '').split('#');
  const target = `dist/${path}index.html`;
  assert.ok(existsSync(target), target);
  if (anchor) assert.ok(readFileSync(target, 'utf8').includes(`id="${anchor}"`), anchor);
}
assert.ok(index.find((entry) => entry.url.includes('/chapters/19-duracion/')).headings.length >= 6);
assert.ok(index.find((entry) => entry.kind === 'session').text.length > 1000, 'exercise prose indexed');
console.log(`✓ static index: ${index.length} entries; all chapters, sessions and glossary anchors resolve`);

const server = await startPreview();
let browser;
try {
  browser = await chromium.launch();
  mkdirSync('screenshots', { recursive: true });
  for (const theme of ['dark', 'light']) {
    for (const width of [1280, 360]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await context.addInitScript((value) => localStorage.setItem('theme', value), theme);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
      let requests = 0;
      page.on('request', (request) => { if (request.url().endsWith('/search-index.json')) requests++; });
      const response = await page.goto(`${server.base}chapters/01-interes/`, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      await page.locator('astro-island[component-export="default"][component-url*="SearchBox"]').first()
        .waitFor({ state: 'attached' });
      await page.waitForFunction(() => [...document.querySelectorAll('astro-island[component-url*="SearchBox"]')].every((island) => !island.hasAttribute('ssr')));
      assert.equal(requests, 0, 'index loads only when search is used');
      await page.keyboard.press('/');
      const box = page.getByRole('combobox', { name: 'Buscar en el curso' });
      await box.waitFor({ state: 'visible' });
      assert.ok(await box.evaluate((element) => element === document.activeElement));
      const search = page.locator('.course-search').filter({ has: box });
      const options = search.getByRole('option');
      await box.fill('duración');
      await page.waitForFunction(() => [...document.querySelectorAll('[role="option"]')].some((option) => option.textContent.includes('Duración y riesgo')));
      assert.match(await options.first().textContent(), /Duración y riesgo de tipo de interés/);
      const durationUrl = await options.first().locator('a').getAttribute('href');
      assert.match(durationUrl, /chapters\/19-duracion\/$/);
      await box.fill('DURACION');
      assert.equal(await options.first().locator('a').getAttribute('href'), durationUrl);
      await box.press('ArrowDown');
      assert.equal(await options.first().getAttribute('aria-selected'), 'true');
      await box.press('ArrowDown');
      assert.equal(await options.nth(1).getAttribute('aria-selected'), 'true');
      await box.press('ArrowUp');
      assert.equal(await options.first().getAttribute('aria-selected'), 'true');
      assert.equal(await box.getAttribute('aria-activedescendant'), await options.first().getAttribute('id'));
      if (width === 360) {
        assert.ok(await page.locator('.mobile-nav-panel').evaluate((element) => element.clientHeight > innerHeight * 0.75), 'mobile menu fills viewport');
      }
      assert.ok(await box.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) === element;
      }), 'input remains visible after keyboard navigation');
      assert.ok(await options.first().locator('a').evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
      }), 'first result is visible and clickable');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'page overflow');
      assert.ok(await search.evaluate((element) => element.scrollWidth <= element.clientWidth + 1), 'search overflow');
      await page.screenshot({ path: `screenshots/search-${theme}-${width}.png` });
      await box.press('Enter');
      await page.waitForURL(`**${durationUrl}`);
      await page.waitForLoadState('networkidle');
      await page.waitForFunction(() => [...document.querySelectorAll('astro-island[component-url*="SearchBox"]')].every((island) => !island.hasAttribute('ssr')));
      await page.keyboard.press('/');
      const nextBox = page.getByRole('combobox', { name: 'Buscar en el curso' });
      await nextBox.fill('TIR');
      const nextSearch = page.locator('.course-search').filter({ has: nextBox });
      await nextSearch.getByRole('option').first().waitFor();
      assert.ok(await nextSearch.getByRole('option').count() > 0);
      assert.match(await nextSearch.textContent(), /TIR/);
      await nextBox.press('/');
      assert.equal(await nextBox.inputValue(), 'TIR/', 'slash remains editable within input');
      await nextBox.fill('zzzznohayresultados');
      await nextSearch.getByRole('status').filter({ hasText: 'Sin resultados.' }).waitFor();
      await nextBox.fill('TIR');
      await nextSearch.getByRole('option').first().waitFor();
      await nextBox.press('Escape');
      assert.equal(await nextBox.getAttribute('aria-expanded'), 'false');
      assert.equal(await nextSearch.getByRole('option').count(), 0);
      await nextBox.fill('   ');
      assert.equal(await nextBox.getAttribute('aria-expanded'), 'false');
      const session = index.find((entry) => entry.kind === 'session');
      await nextBox.fill(session.title);
      await nextSearch.getByRole('option').first().waitFor();
      assert.equal(await nextSearch.getByRole('option').first().locator('a').getAttribute('href'), session.url);
      const term = index.find((entry) => entry.kind === 'glossary' && entry.title === 'Sesgo de confirmación');
      await nextBox.fill(term.title);
      assert.equal(await nextSearch.getByRole('option').first().locator('a').getAttribute('href'), term.url);
      await nextSearch.getByRole('option').first().locator('a').click();
      await page.waitForURL(`**${term.url}`);
      await page.waitForLoadState('networkidle');
      assert.ok(await page.locator(`#${term.url.split('#')[1]}`).isVisible(), 'glossary term reached');
      assert.deepEqual(errors, []);
      console.log(`✓ ${theme} ${width}px: duración → chapter 19 first; TIR results; accents, /, arrows, Enter, Esc; no console errors or overflow`);
      await context.close();
    }
  }
} finally {
  await browser?.close();
  await server.stop();
}
