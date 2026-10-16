import assert from 'node:assert/strict';

export async function checkSkipLink(page) {
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Saltar al contenido' });
  assert.ok(await skip.evaluate((element) => element === document.activeElement), 'skip link is first');
  assert.ok(await skip.evaluate((element) => element.getBoundingClientRect().left >= 0), 'skip link visible');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.activeElement?.id === 'main');
}

/** Shared controls get browser checks in every audited theme/viewport combination. */
export async function checkInteractions(page, width, audit) {
  const slider = page.getByRole('slider').first();
  await slider.focus();
  const before = Number(await slider.inputValue());
  await slider.press('ArrowRight');
  assert.ok(Number(await slider.inputValue()) > before, 'slider responds to keyboard');
  assert.ok(await slider.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2
      && rect.top >= 61 && rect.bottom <= innerHeight;
  }), 'focused slider has a visible ring and is clear of the sticky header');

  const radios = page.getByRole('radiogroup').first().getByRole('radio');
  const count = await radios.count();
  await radios.first().focus();
  for (const [key, index] of [['ArrowRight', 1], ['Home', 0], ['ArrowLeft', count - 1], ['Home', 0], ['End', count - 1]]) {
    await page.keyboard.press(key);
    assert.equal(await radios.nth(index).getAttribute('aria-checked'), 'true', `radio ${key} selects`);
    assert.ok(await radios.nth(index).evaluate((element) => element === document.activeElement), `radio ${key} focuses`);
    assert.equal(await radios.evaluateAll((elements) => elements.filter((element) => element.tabIndex === 0).length), 1);
  }

  // Exercise visible answered-quiz states too: dimmed options must remain readable.
  for (const quiz of await page.locator('.quiz:has(.quiz-option)').all()) {
    await quiz.locator('.quiz-option').first().click();
  }
  await audit(page, 'answered quizzes');

  // These widgets use useTweened. A reduced-motion action must schedule no tween frames.
  await page.evaluate(() => {
    const original = window.requestAnimationFrame.bind(window);
    window.__a11yFrames = 0;
    window.requestAnimationFrame = (callback) => { window.__a11yFrames++; return original(callback); };
  });
  await page.getByRole('button', { name: 'Descontar a t = 0', exact: true }).click();
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => window.__a11yFrames), 0, 'reduced motion skips JS tween frames');
  assert.ok(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches));

  await page.keyboard.press('/');
  const search = page.getByRole('combobox', { name: 'Buscar en el curso' });
  await search.fill('duración');
  await page.getByRole('option').first().waitFor();
  await search.press('ArrowDown');
  const active = await search.getAttribute('aria-activedescendant');
  assert.equal(await page.locator(`[id="${active}"]`).getAttribute('aria-selected'), 'true');
  await audit(page, 'search results and navigation');
  await search.press('Escape');
  assert.equal(await search.getAttribute('aria-expanded'), 'false');
  if (width === 360) {
    const menu = page.locator('.mobile-nav');
    await search.press('Escape');
    assert.equal(await menu.getAttribute('open'), null, 'Escape closes menu');
    assert.ok(await menu.locator('summary').evaluate((element) => element === document.activeElement));
    await page.keyboard.press('Enter');
    const lastLink = menu.locator('a').last();
    await lastLink.focus();
    await page.keyboard.press('Tab');
    assert.equal(await menu.getAttribute('open'), null, 'Tab closes menu before focus leaves overlay');
    assert.ok(await page.locator('.theme-toggle').evaluate((element) => element === document.activeElement));
  }
  console.log('✓ keyboard: skip link, focus ring, slider, radio keys, search, menu; reduced motion: no tween frames');
}
