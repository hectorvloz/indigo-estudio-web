import { test, expect } from '@playwright/test';

test('cursor en la intro y deformación que vuelve a su posición', async ({ page }) => {
  await page.goto('/');
  const letter = page.locator('#intro .elastic-letter').nth(2);
  const glyph = letter.locator('.elastic-glyph');
  await expect(page.locator('#intro')).toBeVisible();
  await expect(page.locator('#intro-title')).toHaveCSS('outline-style', 'none');
  await letter.hover();
  await expect(page.locator('#intro > .cursor-halo')).toHaveClass(/visible/);
  await expect.poll(() => glyph.evaluate(el => getComputedStyle(el).transform)).not.toBe('none');
  await page.screenshot({ path: 'artifacts/revision/intro-elastica.png' });
  await page.mouse.move(30, 140);
  await expect.poll(() => glyph.evaluate(el => getComputedStyle(el).transform)).toBe('none');
  await page.getByRole('button', { name: 'Entrar sin audio' }).click();
  await expect(page.locator('#intro')).not.toBeVisible();
  await page.locator('#hero-title .elastic-letter').nth(3).hover();
  await expect(page.locator('body > .cursor-halo')).toHaveClass(/visible/);
  await page.mouse.wheel(0, 900);
  await expect(page.locator('html')).toHaveClass(/custom-pointer/);
  await expect(page.locator('body > .cursor-halo')).toHaveClass(/visible/);
  await page.waitForTimeout(360);
  await page.locator('.menu-toggle').click();
  await page.locator('.menu-word .elastic-letter').first().hover();
  await expect(page.locator('#mega-menu > .cursor-halo')).toHaveClass(/visible/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.menu-toggle')).toBeFocused();
  await expect(page.locator('html')).not.toHaveClass(/custom-pointer/);
});

test('controles transparentes en reposo y al pasar el cursor', async ({ page }) => {
  await page.goto('/');
  const enter = page.getByRole('button', { name: 'Entrar', exact: true });
  await enter.hover();
  expect(await enter.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  await page.getByRole('button', { name: 'Entrar sin audio' }).click();
  await expect(page.locator('#intro')).not.toBeVisible();
  await expect(page.locator('.hero-line').first()).toHaveCSS('transform', /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  const menu = page.locator('.menu-toggle');
  await menu.hover();
  const style = await menu.evaluate(el => {
    const css = getComputedStyle(el);
    return [css.backgroundColor, css.borderTopWidth];
  });
  expect(style).toEqual(['rgba(0, 0, 0, 0)', '0px']);
  await page.screenshot({ path: 'artifacts/revision/portada-minimalista.png' });
  await expect(menu).toHaveAccessibleName('Abrir menú');
  await expect(menu).toContainText('MENU');
  expect(await menu.locator('.menu-icon').evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThanOrEqual(40);
  await menu.click();
  const close = page.getByRole('button', { name: 'Cerrar menú' });
  await expect(close).toHaveText('');
  await expect(close).toHaveCSS('outline-style', 'none');
  await expect(close.locator('svg')).toBeVisible();
  await page.screenshot({ path: 'artifacts/revision/menu-iconos.png', animations: 'disabled' });
  await close.click();
  await expect(page.locator('#mega-menu')).not.toBeVisible();
});

test('movimiento reducido desactiva cursor y letras elásticas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const letter = page.locator('#intro .elastic-letter').first();
  await letter.hover();
  await expect(page.locator('.cursor-halo')).not.toBeVisible();
  expect(await letter.locator('.elastic-glyph').evaluate(el => getComputedStyle(el).transform)).toBe('none');
});
