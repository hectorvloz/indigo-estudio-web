import { test, expect } from '@playwright/test';

test('ojos siguen al mouse, cierran al entrar y abren al salir', async ({ page }) => {
  await page.goto('/#inicio');
  const face = page.locator('.hero .character-eyes');
  await expect(face).toBeVisible();
  await expect(page.locator('.hero .star')).toHaveCount(0);
  await expect(page.locator('.hero-line').first()).toHaveCSS('transform', /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  await page.mouse.move(100, 250);
  await expect.poll(() => face.evaluate(el => parseFloat((el as HTMLElement).style.getPropertyValue('--gaze-x')))).toBeLessThan(0);
  await page.screenshot({ path: 'artifacts/revision/ojos-portada.png' });
  await face.hover();
  await expect(face).toHaveClass(/eyes-closed/);
  await expect(face.locator('.character-lids')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: 'artifacts/revision/ojos-cerrados.png' });
  await page.mouse.move(100, 250);
  await expect(face).not.toHaveClass(/eyes-closed/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.mouse.move(200, 300);
  await expect.poll(() => face.evaluate(el => (el as HTMLElement).style.getPropertyValue('--gaze-x'))).toBe('0px');
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({ path: 'artifacts/revision/ojos-movil.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test('los ojos del inicio hacen un parpadeo lento y periódico', async ({ page }) => {
  await page.goto('/#inicio');
  const face = page.locator('.hero .character-eyes');
  await expect(face).toHaveAttribute('data-auto-blink', 'single');
  const closures = await face.evaluate(element => new Promise<number>(resolve => {
    let count = 0;
    const observer = new MutationObserver(() => {
      if (element.classList.contains('eyes-closed')) count += 1;
      if (count === 1) { observer.disconnect(); resolve(count); }
    });
    observer.observe(element, { attributes: true, attributeFilter: ['class'] });
    setTimeout(() => { observer.disconnect(); resolve(count); }, 3200);
  }));
  expect(closures).toBe(1);
});

test('personaje de saludo aparece abajo y sigue el cursor', async ({ page }) => {
  await page.goto('/#que-mas');
  const character = page.locator('#que-mas .greeting-character');
  const face = character.locator('.character-eyes');
  await expect(character).toBeVisible();
  await expect(character.locator('.greeting-arm')).toHaveCount(1);
  await expect(character.locator('.character-brows')).toHaveCount(0);
  await expect(character.locator('.greeting-body')).toHaveAttribute('fill', '#F1C844');
  await expect(character).toHaveCSS('bottom', '-250px');
  await expect(character.locator('.character-eye').first()).toHaveAttribute('cy', '155');
  await expect(character.locator('.character-eye').nth(1)).toHaveAttribute('cy', '145');
  await expect(character.locator('.character-eye').first()).toHaveAttribute('rx', '12.56');
  await expect(character.locator('.character-eye').nth(1)).toHaveAttribute('rx', '12.56');
  await expect(character.locator('.character-eye').first()).toHaveAttribute('ry', '21.69');
  await expect(character.locator('.character-eye').nth(1)).toHaveAttribute('ry', '21.69');
  await expect(character.locator('.greeting-limbs')).toHaveCSS('animation-name', 'greeting-arm-wave');
  await face.hover({ position: { x: 145, y: 175 } });
  await expect(face).toHaveClass(/eyes-closed/);
  await expect(character.locator('.character-eye').first()).toHaveCSS('opacity', '0');
  await expect(character.locator('.greeting-lids')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: 'artifacts/revision/personaje-ojos-cerrados.png' });
  await page.locator('#que-mas').hover({ position: { x: 40, y: 300 } });
  await expect(face).not.toHaveClass(/eyes-closed/);
  await expect.poll(() => face.evaluate(element => Number.parseFloat((element as HTMLElement).style.getPropertyValue('--gaze-x')))).toBeLessThan(0);
  const eyes = character.locator('.character-eye');
  await expect(eyes).toHaveCount(2);
  for (let index = 0; index < 2; index += 1) {
    const eye = await eyes.nth(index).boundingBox();
    expect(eye).not.toBeNull();
    expect(eye!.y).toBeGreaterThan(0);
    expect(eye!.y + eye!.height).toBeLessThan(900);
  }
  const box = await character.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeGreaterThan(800);
  await page.screenshot({ path: 'artifacts/revision/personaje-saludando.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#que-mas');
  await expect(character).toBeVisible();
  await expect(character).toHaveCSS('bottom', '-180px');
  for (let index = 0; index < 2; index += 1) {
    const eye = await eyes.nth(index).boundingBox();
    expect(eye).not.toBeNull();
    expect(eye!.y).toBeGreaterThan(0);
    expect(eye!.y + eye!.height).toBeLessThan(844);
  }
  await page.screenshot({ path: 'artifacts/revision/personaje-saludando-movil.png' });
});
