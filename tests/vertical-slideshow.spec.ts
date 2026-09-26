import { test, expect } from '@playwright/test';

const sceneTop = (page: import('@playwright/test').Page, id: string) =>
  page.locator(id).evaluate(element => Math.abs(element.getBoundingClientRect().top));

test('una ráfaga de rueda avanza solo una escena y el siguiente gesto responde', async ({ page }) => {
  await page.goto('/#inicio');
  await page.mouse.move(700, 500);
  for (let i = 0; i < 8; i++) await page.mouse.wheel(0, 700);
  await expect.poll(() => sceneTop(page, '#que-mas')).toBeLessThan(3);
  expect(await sceneTop(page, '#magia')).toBeGreaterThan(500);

  await page.waitForTimeout(850);
  await page.mouse.wheel(0, 700);
  await expect.poll(() => sceneTop(page, '#magia')).toBeLessThan(3);
});

test('un gesto no salta dos escenas y el siguiente responde al terminar', async ({ page }) => {
  await page.goto('/#inicio');
  await page.mouse.move(700, 500);
  for (let impulse = 0; impulse < 8; impulse++) {
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(20);
  }
  await expect.poll(() => sceneTop(page, '#que-mas')).toBeLessThan(3);
  expect(await sceneTop(page, '#magia')).toBeGreaterThan(500);

  await page.waitForTimeout(50);
  await page.mouse.wheel(0, 700);
  await expect.poll(() => sceneTop(page, '#magia')).toBeLessThan(3);
});

test('el portafolio sale en un gesto y el scroll libre vuelve al slideshow al subir', async ({ page }) => {
  await page.goto('/#proyectos');
  await page.mouse.move(700, 500);
  await page.mouse.wheel(0, 700);
  await expect.poll(() => sceneTop(page, '#servicios')).toBeLessThan(3);

  await page.waitForTimeout(850);
  const boundary = await page.locator('#servicios').evaluate(element => element.getBoundingClientRect().top + scrollY);
  await page.mouse.wheel(0, 450);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(boundary + 100);
  const nativePosition = await page.evaluate(() => scrollY);
  expect(nativePosition).toBeGreaterThan(boundary + 100);

  await page.mouse.wheel(0, -700);
  await expect.poll(() => sceneTop(page, '#proyectos')).toBeLessThan(3);
  await page.waitForTimeout(700);
  await page.mouse.wheel(0, -700);
  await expect.poll(() => sceneTop(page, '#magia')).toBeLessThan(3);
});

test('el trackpad horizontal recorre el portafolio un proyecto por gesto', async ({ page }) => {
  await page.goto('/#proyectos');
  const portfolio = page.locator('[data-project-carousel]');
  await page.mouse.move(700, 500);
  await page.mouse.wheel(650, 0);
  await expect(portfolio).toHaveAttribute('data-carousel-index', '1');

  for (let impulse = 0; impulse < 6; impulse++) await page.mouse.wheel(120, 0);
  await expect(portfolio).toHaveAttribute('data-carousel-index', '1');

  await page.waitForTimeout(90);
  await page.mouse.wheel(650, 0);
  await expect(portfolio).toHaveAttribute('data-carousel-index', '2');

  await page.waitForTimeout(90);
  await page.mouse.wheel(-650, 0);
  await expect(portfolio).toHaveAttribute('data-carousel-index', '1');
});
