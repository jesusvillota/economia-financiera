/** Built gallery integration check: controls and dragging must agree with portfolio.ts. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startPreview } from './preview.mjs';
import { createServer } from 'vite';

const num = (value, digits = 2) => value.toFixed(digits).replace('.', ',');
const pct = value => `${num(value * 100)} %`;
const server = await startPreview();
// Vite resolves the library's TypeScript imports exactly as it does for the widget.
const loader = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' });
let browser;
try {
  const { covarianceFromCorrelations, frontierPoint, globalMinimumVariance } = await loader.ssrLoadModule('/src/lib/finance/portfolio.ts');
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(`${server.base}dev/widgets/`, { waitUntil: 'networkidle' });
  let assertions = 0;
  for (const n of [2, 3]) {
    const widget = page.locator('.widget').filter({ has: page.getByText(`Frontera eficiente: ${n === 2 ? 'dos' : 'tres'} activos`, { exact: true }) });
    await widget.scrollIntoViewIfNeeded();
    await widget.locator('.MafsView').waitFor();
    const returns = [0.08, 0.16, 0.11].slice(0, n);
    const sigmas = [0.2, 0.1, 0.15].slice(0, n);
    const rhoSlider = widget.getByRole('slider', { name: /Correlación/ });
    const targetSlider = widget.getByRole('slider', { name: 'Rentabilidad de la cartera', exact: true });
    const toggle = widget.getByRole('checkbox', { name: 'Permitir ventas en corto' });
    async function verify(rho, shortSales, target) {
      const covariance = covarianceFromCorrelations(sigmas,
        returns.map((_, i) => returns.map((_, j) => i === j ? 1 : i < 2 && j < 2 ? rho : 0)));
      const selected = frontierPoint(returns, covariance, target, !shortSales);
      const minimum = globalMinimumVariance(returns, covariance, !shortSales);
      const expected = {
        'frontier-return': pct(selected.expectedReturn),
        'frontier-sigma': pct(selected.sigma),
        'frontier-variance': num(selected.variance, 6),
        'frontier-min-return': pct(minimum.expectedReturn),
        'frontier-min-sigma': pct(minimum.sigma),
      };
      returns.forEach((_, i) => {
        expected[`frontier-weight-${i}`] = pct(selected.weights[i]);
        expected[`frontier-min-weight-${i}`] = pct(minimum.weights[i]);
      });
      for (const [id, want] of Object.entries(expected)) {
        await page.waitForFunction(({ id, want, title }) => {
          const figure = [...document.querySelectorAll('.widget')].find(element => element.querySelector('figcaption')?.textContent === title);
          return figure?.querySelector(`[data-testid="${id}"]`)?.textContent === want;
        }, { id, want, title: `Frontera eficiente: ${n === 2 ? 'dos' : 'tres'} activos` });
        assert.equal(await widget.getByTestId(id).textContent(), want);
        assertions++;
      }
      console.log(`✓ ${n} assets: rho=${rho}, short sales=${shortSales}, target=${target.toFixed(6)}; all readouts match portfolio.ts`);
    }
    await verify(0.2, false, 0.12);
    for (const rho of [-1, 0, 0.95, 1]) {
      await rhoSlider.fill(String(rho));
      for (const shortSales of [false, true]) {
        await toggle.setChecked(shortSales);
        await targetSlider.fill(shortSales ? '0.18' : '0.13');
        await verify(rho, shortSales, shortSales ? 0.18 : 0.13);
      }
    }
    // An infeasible long-only target is clamped immediately when short sales are disabled.
    await toggle.uncheck();
    await verify(1, false, 0.16);
    await rhoSlider.fill('0.2');
    await targetSlider.fill('0.12');
    await verify(0.2, false, 0.12);
    const handle = widget.getByTestId('frontier-portfolio').locator('[tabindex="0"]');
    // Keep the point clear of the fixed page header after editing the controls below it.
    await handle.evaluate(element => element.scrollIntoView({ block: 'center' }));
    const box = await handle.boundingBox();
    assert.ok(box, 'draggable portfolio point is visible');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 30, { steps: 8 });
    await page.mouse.up();
    await page.waitForFunction(title => {
      const figure = [...document.querySelectorAll('.widget')].find(element => element.querySelector('figcaption')?.textContent === title);
      return figure?.querySelector('[data-testid="frontier-return"]')?.textContent !== '12,00 %';
    }, `Frontera eficiente: ${n === 2 ? 'dos' : 'tres'} activos`);
    const draggedTarget = Number(await targetSlider.inputValue());
    // The readouts retain the exact dragged value; range inputs may round their DOM value to step.
    const displayedReturn = await widget.getByTestId('frontier-return').textContent();
    assert.notEqual(displayedReturn, pct(0.12), 'drag changes portfolio return');
    assert.ok(draggedTarget > 0.12, 'drag up increases target');
    await targetSlider.fill('0.14');
    await verify(0.2, false, 0.14);
    await targetSlider.focus();
    await page.keyboard.press('ArrowLeft');
    await verify(0.2, false, 0.139);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'no overflow at 360px');
    console.log(`✓ ${n} assets: drag, keyboard control, toggle clamping and 360px layout`);
  }
  assert.deepEqual(errors, [], 'no browser errors');
  console.log(`✓ frontier click-through: ${assertions} readout assertions match portfolio.ts`);
} finally {
  await browser?.close();
  await loader.close();
  await server.stop();
}
