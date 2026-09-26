import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('intro, sonido voluntario y preferencia durante la visita', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#intro')).toBeVisible();
  await page.getByRole('button', { name: 'Entrar sin audio' }).click();
  await expect(page.locator('#intro')).not.toBeVisible();
  await expect(page.locator('.sound-toggle')).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(page.locator('#intro')).not.toBeVisible();
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await page.getByRole('button', { name: 'Activar sonido' }).click();
  await expect(page.locator('.sound-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Silenciar sonido' }).click();
  await expect(page.locator('.sound-toggle')).toHaveAttribute('aria-pressed', 'false');
});

test('mega menú, Escape, foco y navegación por escenas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#inicio');
  const toggle = page.locator('.menu-toggle');
  await expect(toggle).toContainText('MENU');
  await expect(toggle.locator('.menu-icon')).toBeVisible();
  await expect.poll(() => toggle.locator('.menu-label').evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(40);
  await expect(page.locator('button .arrow, a .arrow')).toHaveCount(0);
  await toggle.click();
  await expect(page.locator('#mega-menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page.locator('[data-menu-item="servicios"]').click();
  await expect(page).toHaveURL(/#servicios$/);
  await expect(page.locator('#mega-menu')).not.toBeVisible();
  await expect(page.locator('#servicios')).toBeFocused();
  await expect(page.locator('.scene-nav a[href="#servicios"]')).toHaveAttribute('aria-current', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.scene-nav a[href="#estudio"]')).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('body')).toHaveClass(/is-dark/);
});

test('acciones de texto usan el resaltado irregular global', async ({ page }) => {
  await page.goto('/#estudio');
  const action = page.locator('#estudio .small-link');
  await action.focus();
  await expect.poll(() => action.evaluate(element => getComputedStyle(element, '::before').opacity)).toBe('1');
  await expect(action).not.toContainText('↗');
  await page.goto('/#contacto');
  const email = page.locator('.contact-email');
  const emailBox = await email.boundingBox();
  expect(emailBox).not.toBeNull();
  expect(emailBox!.width).toBeLessThan(700);
  await expect(page.locator('.text-button')).toHaveCSS('border-bottom-width', '0px');
});

test('filtros y páginas de proyecto', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto('/proyectos/');
  await page.getByRole('button', { name: 'Digital', exact: true }).click();
  await expect(page.locator('.archive-card:visible')).toHaveCount(1);
  await expect(page.locator('#filter-status')).toHaveText('1 proyecto');
  await page.locator('.archive-card:visible a').click();
  await expect(page).toHaveURL(/proyectos\/materia\/$/);
  await expect(page.locator('h1')).toContainText('Materia');
  await page.locator('.next-project').click();
  await expect(page).toHaveURL(/proyectos\/indigo\/$/);
  expect(errors).toEqual([]);
});

test('formulario valida y prepara WhatsApp sin enviar mensajes', async ({ page, context }) => {
  await context.route('https://wa.me/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<p>Destino de prueba</p>' }));
  await page.goto('/#contacto');
  await page.getByRole('button', { name: 'HAGÁMOSLE' }).click();
  await page.getByRole('button', { name: 'Seguir en WhatsApp' }).click();
  await expect(page.locator('input[name=name]')).toBeFocused();
  await page.getByLabel('Tu nombre').fill('Ana & Luis');
  await page.getByLabel('¿Qué necesitas?').selectOption('Identidad de marca');
  await page.getByLabel('La idea, en pocas palabras').fill('Café, diseño & una web.');
  const popupPromise = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Seguir en WhatsApp' }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  const destination = new URL(popup.url());
  expect(destination.pathname).toBe('/573192099069');
  expect(destination.searchParams.get('text')).toContain('Ana & Luis');
  expect(destination.searchParams.get('text')).toContain('Café, diseño & una web.');
  await popup.close();
  await expect(page.locator('#brief-status a')).toBeVisible();
});

for (const width of [320, 768, 1024, 1440]) {
  test(`diseño sin desbordamiento a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const path of ['/#inicio', '/proyectos/', '/proyectos/indigo/']) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
    await page.locator('.menu-toggle').click();
    const menu = page.locator('#mega-menu');
    await expect(menu).toBeVisible();
    expect(await menu.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  });
}

test('texto contorneado y accesibilidad de portada, menú y formulario', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#inicio');
  const stroke = await page.locator('.outline-type').evaluate(el => getComputedStyle(el).webkitTextStrokeColor);
  expect(stroke).not.toBe('rgba(0, 0, 0, 0)');
  const home = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(home.violations).toEqual([]);
  await page.locator('.menu-toggle').click();
  const menu = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(menu.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await page.goto('/#contacto');
  await page.getByRole('button', { name: 'HAGÁMOSLE' }).click();
  const form = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(form.violations).toEqual([]);
});
