import { test, expect } from '@playwright/test';

test('capturas para revisión visual', async ({ page }) => {
  test.skip(!process.env.VISUAL, 'Capturas bajo demanda.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto('/');
    if (await page.locator('#intro').isVisible()) {
      await page.screenshot({ path: `artifacts/revision/${width}-intro.png` });
      await page.getByRole('button', { name: 'Entrar sin audio' }).click();
    }
    for (const scene of ['inicio', 'proyectos', 'servicios', 'estudio', 'contacto']) {
      await page.goto(`/#${scene}`);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator(`.scene-nav a[href="#${scene}"]`)).toHaveAttribute('aria-current', 'true');
      await page.screenshot({ path: `artifacts/revision/${width}-${scene}.png` });
    }
    await page.locator('.menu-toggle').click();
    await page.locator('[data-menu-item="proyectos"]').hover();
    await page.screenshot({ path: `artifacts/revision/${width}-menu.png` });
    await page.goto('/proyectos/');
    await page.screenshot({ path: `artifacts/revision/${width}-archivo.png`, fullPage: true });
  }
});
