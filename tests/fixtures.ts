import { test as base, expect } from '@playwright/test';

/**
 * Pruebas con el aviso de cookies ya respondido (solo cookies necesarias).
 * Así el aviso no tapa botones ni captura la rueda del mouse, y no se cargan
 * etiquetas de medición durante las pruebas.
 */
export const test = base.extend({
  context: async ({ context, baseURL }, use) => {
    const consent = { version: 1, necessary: true, analytics: false, marketing: false, updatedAt: '2026-01-01T00:00:00.000Z' };
    await context.addCookies([{
      name: 'indigo_cookie_consent',
      value: encodeURIComponent(JSON.stringify(consent)),
      url: baseURL ?? 'http://localhost:4321',
      sameSite: 'Lax',
    }]);
    await use(context);
  },
});

export { expect };
