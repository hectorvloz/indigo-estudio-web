import { test, expect } from '@playwright/test';

test('scroll por secciones hacia presentación y MagIA', async ({ page }) => {
  await page.goto('/#inicio');
  await page.mouse.move(600,700);
  await page.mouse.wheel(0,900);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(895);
  await expect(page.locator('.scene-nav a[href="#que-mas"]')).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('#hello-title')).toContainText('¡Quiubo, pues! Somos un estudio creativo diferente:');
  await expect.poll(() => page.locator('#que-mas').evaluate(el => Math.abs(el.getBoundingClientRect().top))).toBeLessThan(2);
  await page.screenshot({path:'artifacts/revision/presentacion.png'});
  await page.waitForTimeout(360);
  await page.mouse.wheel(0,900);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(1795);
  await expect(page.locator('.scene-nav a[href="#magia"]')).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('.magic-ai')).toHaveText('IA');
  await expect(page.locator('.magic-ai')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(page.locator('#magic-title')).toContainText('Vea, hacemos marcas, diseño y experiencias.');
  await expect(page.locator('#magic-title br')).toHaveCount(0);
  await expect(page.locator('#magia')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#magia')).toHaveCSS('background-color', 'rgb(5, 5, 5)');
  await expect(page.locator('#magia')).toHaveCSS('color', 'rgb(241, 200, 68)');
  await expect(page.locator('body')).toHaveClass(/is-dark/);
  await expect(page.locator('.site-header .brand img')).toHaveCSS('filter', 'invert(1)');
  await page.screenshot({path:'artifacts/revision/magia.png'});
  await page.locator('.menu-toggle').click();
  const before = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0,400);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await page.keyboard.press('Escape');
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/#magia');
  await expect(page.locator('.scene-nav a[href="#magia"]')).toHaveAttribute('aria-current', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({path:'artifacts/revision/magia-movil.png'});
});

test('un gesto fuerte de trackpad se detiene en la siguiente sección', async ({ page }) => {
  await page.goto('/#inicio');
  await expect(page.locator('html')).toHaveCSS('scroll-snap-type', 'none');
  await page.mouse.move(600, 700);
  for (let impulse = 0; impulse < 20; impulse++) {
    await page.mouse.wheel(0, 5000);
    await page.waitForTimeout(50);
  }
  await expect.poll(() => page.locator('#que-mas').evaluate(element => Math.abs(element.getBoundingClientRect().top))).toBeLessThan(4);
  await page.mouse.wheel(0, 5000);
  await expect.poll(() => page.locator('#que-mas').evaluate(element => Math.abs(element.getBoundingClientRect().top))).toBeLessThan(4);
  await page.waitForTimeout(360);
  await page.mouse.wheel(0, 5000);
  await expect.poll(() => page.locator('#magia').evaluate(element => Math.abs(element.getBoundingClientRect().top))).toBeLessThan(4);
});

test('el portafolio recorre un proyecto por gesto antes de continuar', async ({ page }) => {
  await page.goto('/#proyectos');
  const portfolio = page.locator('[data-project-carousel]');
  await expect(portfolio).toHaveCount(1);
  await expect(portfolio.locator('[data-carousel-slide]')).toHaveCount(3);
  await expect(portfolio).toHaveAttribute('data-carousel-index', '0');

  const sectionTop = await portfolio.evaluate(element => element.getBoundingClientRect().top);
  await page.mouse.wheel(0, 900);
  await expect(portfolio).toHaveAttribute('data-carousel-index', '1');
  expect(Math.abs(await portfolio.evaluate(element => element.getBoundingClientRect().top) - sectionTop)).toBeLessThan(4);

  await page.waitForTimeout(230);
  await page.mouse.wheel(0, 900);
  await expect(portfolio).toHaveAttribute('data-carousel-index', '2');

  await page.waitForTimeout(230);
  await page.mouse.wheel(0, 900);
  await expect.poll(() => page.locator('#servicios').evaluate(element => Math.abs(element.getBoundingClientRect().top))).toBeLessThan(4);
});

test('las frases simples quedan amplias, laterales y sin contenido secundario', async ({ page }) => {
  await page.goto('/#que-mas');
  await expect(page.locator('#que-mas .story-eyebrow, #que-mas .story-bottom')).toHaveCount(0);
  await expect(page.locator('#que-mas .story-label')).toHaveText('02 / QUIÉNES SOMOS');
  await expect(page.locator('#hello-title')).toHaveCSS('text-align', 'left');
  await expect.poll(() => page.locator('#hello-title').evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThan(54);
  await page.goto('/#magia');
  await expect(page.locator('#magia .story-intro, #magia .magic-footer, #magia .magic-note')).toHaveCount(0);
  await expect(page.locator('#magia .story-label')).toHaveText('03 / CÓMO LO HACEMOS');
  await expect(page.locator('#magic-title')).toHaveCSS('text-align', 'left');
  await expect(page.locator('#magic-title br')).toHaveCount(0);
  await expect(page.locator('.magic-ai')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect.poll(() => page.locator('#magic-title').evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThan(54);
});

test('la frase de presentación conserva un tamaño legible en móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#que-mas');
  await expect.poll(() => page.locator('#que-mas').evaluate(element => Math.abs(element.getBoundingClientRect().top))).toBeLessThan(4);
  await expect(page.locator('#hello-title')).toHaveCSS('text-align', 'left');
  const copyBox = await page.locator('#que-mas .hello-copy').boundingBox();
  expect(copyBox).not.toBeNull();
  expect(copyBox!.x).toBeLessThan(40);
  const lines = await page.locator('#hello-title').evaluate(element => {
    const style = getComputedStyle(element);
    return element.getBoundingClientRect().height / Number.parseFloat(style.lineHeight);
  });
  expect(lines).toBeGreaterThan(4.5);
  expect(lines).toBeLessThan(7.2);
  await expect(page.locator('#hello-title')).toContainText('diferente: vos');
  await page.screenshot({ path: 'artifacts/revision/presentacion-movil.png' });
  await page.goto('/#magia');
  await expect.poll(() => page.locator('#magia').evaluate(element => Math.abs(element.getBoundingClientRect().top))).toBeLessThan(4);
  await expect(page.locator('#magic-title')).toHaveCSS('text-align', 'left');
  await expect.poll(() => page.locator('#magic-title').evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThan(28);
  await page.screenshot({ path: 'artifacts/revision/magia-movil.png' });
});

test('un gesto accidental inmediato se ignora y el siguiente avance responde', async ({ page }) => {
  await page.goto('/#que-mas');
  await expect.poll(() => page.locator('#que-mas').evaluate(element => Math.abs(element.getBoundingClientRect().top))).toBeLessThan(4);
  await page.mouse.move(500, 450);
  await page.mouse.wheel(0, -900);
  await expect.poll(() => page.evaluate(() => scrollY), { timeout: 900 }).toBeLessThan(10);

  await page.waitForTimeout(360);
  await page.evaluate(() => document.querySelector('#que-mas')?.scrollIntoView());
  await expect.poll(() => page.locator('#que-mas').evaluate(element => Math.abs(element.getBoundingClientRect().top))).toBeLessThan(4);
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(90);
  await page.mouse.wheel(0, 900);
  await expect.poll(() => page.locator('#magia').evaluate(element => Math.abs(element.getBoundingClientRect().top)), { timeout: 900 }).toBeLessThan(4);
  await page.waitForTimeout(360);
  await page.mouse.wheel(0, 900);
  await expect.poll(() => page.evaluate(() => scrollY), { timeout: 1200 }).toBeGreaterThan(2400);
});

test('los textos repiten su entrada al volver a la sección', async ({ page }) => {
  await page.goto('/#que-mas');
  await expect(page.locator('#que-mas')).toHaveClass(/is-visible/);
  await expect(page.locator('#que-mas .story-copy')).toHaveCSS('animation-name', 'scene-copy');
  await page.evaluate(() => document.querySelector('#magia')?.scrollIntoView());
  await expect(page.locator('#magia')).toHaveClass(/is-visible/);
  await expect(page.locator('#que-mas')).not.toHaveClass(/is-visible/);
  await expect(page.locator('#que-mas .story-copy')).toHaveCSS('opacity', '0');
  await page.evaluate(() => document.querySelector('#que-mas')?.scrollIntoView());
  await expect(page.locator('#que-mas')).toHaveClass(/is-visible/);
  await expect(page.locator('#que-mas .story-copy')).toHaveCSS('animation-name', 'scene-copy');
});
