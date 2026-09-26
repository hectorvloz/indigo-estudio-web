import { test, expect } from '@playwright/test';

test('las imágenes de proyecto se abren y recorren en el visor', async ({ page }) => {
  await page.goto('/proyectos/belven/');

  const imageButtons = page.locator('[data-project-image]');
  await expect(imageButtons).toHaveCount(3);

  await imageButtons.first().click();
  const lightbox = page.locator('#project-lightbox');
  await expect(lightbox).toBeVisible();
  await expect(lightbox.locator('img')).toHaveAttribute('src', /belven-01\.webp$/);
  await expect(page.locator('body')).toHaveClass(/lightbox-open/);

  await page.keyboard.press('ArrowRight');
  await expect(lightbox.locator('img')).toHaveAttribute('src', /belven-02\.webp$/);
  await expect(lightbox.locator('[data-lightbox-count]')).toHaveText('02 / 03');

  await page.keyboard.press('Escape');
  await expect(lightbox).not.toBeVisible();
  await expect(page.locator('body')).not.toHaveClass(/lightbox-open/);
  await expect(imageButtons.first()).toBeFocused();
});
