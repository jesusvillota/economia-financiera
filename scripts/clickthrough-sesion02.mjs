/** Built PS2: hints, wrong/right answers, seeded variants and all 45 numeric fields. */
import { startPreview } from './preview.mjs';
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { parse } from 'yaml';
import * as lib from '../src/lib/sesion02.ts';

const fm = parse(readFileSync('src/content/sesiones/02-acciones-empresas-riesgo.mdx', 'utf8').split('---')[1]);
const server = await startPreview();
let browser;
let failures = 0;
const check = (name, ok) => { console.log(`${ok ? '✓' : '✗'} ${name}`); if (!ok) failures++; };
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const response = await page.goto(`${server.base}sesiones/02-acciones-empresas-riesgo/`, { waitUntil: 'networkidle' });
  check('PS2 route renders all eight exercises', response.ok() && await page.locator('.ses-exercise').count() === 8);
  const first = page.locator('.ses-exercise').first();
  await first.locator('input').first().waitFor();
  check('hints and solution start hidden', await first.locator('.ses-hints li, .ses-steps li').count() === 0);
  for (let i = 1; i <= 3; i++) {
    await first.getByRole('button', { name: `Pista ${i} de 3`, exact: true }).click();
    check(`hint ${i} reveals in order`, await first.locator('.ses-hints li').count() === i);
  }
  const form = first.locator('.ses-answer').first();
  await form.locator('input').fill('34'); // resale price without discounting or dividends
  await form.getByRole('button', { name: 'Comprobar', exact: true }).click();
  check('wrong answer rejected', (await form.getByTestId('feedback').textContent()).includes('No es correcto'));
  await form.locator('input').fill('30,65');
  await form.getByRole('button', { name: 'Comprobar', exact: true }).click();
  check('correct Spanish decimal answer accepted', (await form.getByTestId('feedback').textContent()).includes('Correcto.'));

  for (const [index, exercise] of fm.exercises.entries()) {
    const card = page.locator('.ses-exercise').nth(index);
    for (const [i, answer] of exercise.answers.entries()) {
      const form = card.locator('.ses-answer').nth(i);
      await form.locator('input').fill(String(answer.value).replace('.', ','));
      await form.getByRole('button', { name: 'Comprobar', exact: true }).click();
      check(`${exercise.id}.${answer.id}: canonical answer accepted`, (await form.getByTestId('feedback').textContent()).includes('Correcto.'));
    }
    await card.getByRole('button', { name: 'Ver la solución paso a paso', exact: true }).click();
    for (let i = 1; i < exercise.steps.length; i++) await card.getByRole('button', { name: 'Siguiente paso', exact: true }).click();
    check(`${exercise.id}: every solution step resolves`, await card.locator('.ses-steps li').count() === exercise.steps.length && !(await card.locator('.ses-steps').textContent()).includes('{{'));
  }
  check('canonical solutions have no KaTeX errors or phone overflow', await page.locator('.katex-error').count() === 0 && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  // Inspect expanded content in both themes and widths, including long solution formulas.
  mkdirSync('screenshots', { recursive: true });
  for (const theme of ['dark', 'light']) for (const width of [375, 1280]) {
    await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
    await page.setViewportSize({ width, height: 900 });
    check(`expanded ${theme} ${width}px has no overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await first.screenshot({ path: `screenshots/ps2-expanded-${theme}-${width}.png` });
  }
  await page.setViewportSize({ width: 375, height: 800 });
  for (const [index, exercise] of fm.exercises.entries()) {
    const card = page.locator('.ses-exercise').nth(index);
    const before = await card.locator('.ses-params dd').allTextContents();
    await card.getByRole('button', { name: 'Nueva variante', exact: true }).click();
    const after = await card.locator('.ses-params dd').allTextContents();
    check(`${exercise.id}: variant changes data and resets progress in the card`, before.join('|') !== after.join('|') && await card.getByTestId('feedback').count() === 0 && await card.locator('.ses-hints li, .ses-steps li').count() === 0);
    const values = {};
    for (const parameter of exercise.parameters) values[parameter.id] = Number((await card.getByTestId(`param-${parameter.id}`).textContent()).replace(/[^\d,.-]/g, '').replace(',', '.'));
    for (const [i, answer] of exercise.answers.entries()) {
      const target = lib[answer.lib.fn](...answer.lib.args.map(id => values[id]));
      const form = card.locator('.ses-answer').nth(i);
      await form.locator('input').fill(String(target).replace('.', ','));
      await form.getByRole('button', { name: 'Comprobar', exact: true }).click();
      check(`${exercise.id}.${answer.id}: seeded answer accepted`, (await form.getByTestId('feedback').textContent()).includes('Correcto.'));
    }
    await card.getByRole('button', { name: 'Ver la solución paso a paso', exact: true }).click();
    for (let i = 1; i < exercise.steps.length; i++) await card.getByRole('button', { name: 'Siguiente paso', exact: true }).click();
    check(`${exercise.id}: seeded solution resolves`, !(await card.locator('.ses-steps').textContent()).includes('{{'));
  }
  check('all rendered math and browser console are clean', await page.locator('.katex-error').count() === 0 && errors.length === 0);
  if (errors.length) console.error(errors.join('\n'));
} finally {
  await browser?.close();
  await server.stop();
}
process.exitCode = failures ? 1 : 0;
