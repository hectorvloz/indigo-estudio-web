import { test as base, expect } from '@playwright/test';

/**
 * La landing de asesoría activa la medición sin mostrar el aviso de cookies y sin guardar una aceptación.
 * Se bloquean las llamadas reales a Meta y Google para no enviar eventos durante las pruebas.
 */
const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(/connect\.facebook\.net|facebook\.com\/tr|googletagmanager\.com/, route => route.abort());
    await use(page);
  },
});

test('landing de asesoría: medición activa, sin aviso y sin guardar aceptación', async ({ page, context }) => {
  await page.goto('/asesoria/');
  await expect(page.locator('html')).toHaveAttribute('data-cookie-marketing', 'true');
  await page.waitForTimeout(700);
  await expect(page.locator('[data-cookie-notice]')).toBeHidden();
  await expect(page.locator('.booking-cookie-note')).toContainText('cookies de medición y publicidad');
  const cookies = await context.cookies();
  expect(cookies.find(cookie => cookie.name === 'indigo_cookie_consent')).toBeUndefined();
});

test('al salir de la landing, el resto del sitio sí muestra el aviso', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/privacidad/');
  await expect(page.locator('[data-cookie-notice]')).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-cookie-marketing', 'true');
});

test('un rechazo guardado se respeta en la landing', async ({ page, context, baseURL }) => {
  const consent = { version: 1, necessary: true, analytics: false, marketing: false, updatedAt: '2026-01-01T00:00:00.000Z' };
  await context.addCookies([{ name: 'indigo_cookie_consent', value: encodeURIComponent(JSON.stringify(consent)), url: baseURL ?? 'http://localhost:4321', sameSite: 'Lax' }]);
  await page.goto('/asesoria/');
  await expect(page.locator('html')).toHaveAttribute('data-cookie-marketing', 'false');
});

test('la señal Global Privacy Control mantiene apagada la publicidad en la landing', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'globalPrivacyControl', { get: () => true }));
  await page.goto('/asesoria/');
  await expect(page.locator('html')).toHaveAttribute('data-cookie-marketing', 'false');
  await expect(page.locator('html')).toHaveAttribute('data-cookie-analytics', 'true');
});
