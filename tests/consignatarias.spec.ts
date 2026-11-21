import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

test('landing de consignatarias: oferta, reserva con campaña y accesibilidad', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/consignatarias/?utm_source=whatsapp&utm_content=pereira');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vitrina web para tu consignataria.');
  await expect(page.locator('.cs-hero .cs-offer-new')).toContainText('$1.000.000');
  await expect(page.locator('.cs-hero .cs-offer-old s')).toHaveText('$1.980.000');
  await expect(page.locator('main')).not.toContainText('tres carros');
  const booking = page.locator('.cs-hero [data-booking]');
  const href = new URL(await booking.getAttribute('href') ?? '', 'http://x');
  expect(href.pathname).toMatch(/\/asesoria\/$/);
  expect(href.searchParams.get('utm_source')).toBe('whatsapp');
  expect(href.searchParams.get('utm_content')).toBe('pereira');
  expect(href.searchParams.get('utm_campaign')).toBe('consignatarias');
  const results = await new AxeBuilder({ page }).include('main').analyze();
  expect(results.violations.filter(v => ['critical', 'serious'].includes(v.impact ?? ''))).toEqual([]);
});

test('demo: filtros, ficha con 360° y mensaje de WhatsApp', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/consignatarias/#demo');
  const cards = page.locator('[data-grid] > li:not([hidden])');
  await expect(cards).toHaveCount(8);
  await page.getByRole('button', { name: 'Pickup', exact: true }).click();
  await expect(cards).toHaveCount(1);
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  await page.locator('[data-max]').selectOption('60000000');
  await expect(cards).toHaveCount(1);
  await page.locator('[data-max]').selectOption('0');
  await page.locator('[data-sort]').selectOption('price-asc');
  await expect(cards.first()).toContainText('Kia Picanto');

  await page.getByRole('button', { name: /Ver Toyota Land Cruiser Prado 2020/ }).click();
  const detail = page.locator('[data-detail]');
  await expect(detail).toBeVisible();
  await expect(detail.locator('[data-d-price]')).toHaveText('$219.900.000');
  await expect(detail.locator('[data-d-specs]')).toContainText('72.000 km');
  const range = detail.locator('[data-spin-range]');
  await range.fill('180');
  await expect.poll(() => detail.locator('[data-spin-frame]').nth(4).evaluate(img => getComputedStyle(img).opacity)).toBe('1');
  await detail.getByRole('button', { name: 'Consultar por WhatsApp' }).click();
  await expect(detail.locator('[data-chat-text]')).toContainText('ref. FA-0142');
  await detail.getByRole('button', { name: '← Volver al catálogo' }).click();
  await expect(page.locator('[data-list]')).toBeVisible();
});

test('preguntas en acordeón', async ({ page }) => {
  await page.goto('/consignatarias/');
  const items = page.locator('.cs-faq-item');
  await expect(items).toHaveCount(6);
  await expect(items.first()).toHaveAttribute('open', '');
  await items.nth(2).locator('summary').click();
  await expect(items.nth(2).locator('p')).toBeVisible();
});

test('landing de consignatarias en celular sin desbordes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/consignatarias/');
  await expect(page.locator('.cs-hero [data-booking]')).toBeInViewport();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.locator('[data-sticky]')).not.toHaveClass(/is-on/);
  await page.locator('#demo').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-sticky]')).toHaveClass(/is-on/);
});
