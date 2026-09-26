/** Local letter deformation for elastic headings; the browser cursor stays native. */
export function initPointerEffects() {
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let active: HTMLElement | null = null;
  let frame = 0;
  let dirty = false;
  let targetX = 0, targetY = 0;
  const enabled = () => fine.matches && !reduced.matches;

  function resetLetters() {
    active?.querySelectorAll<HTMLElement>('.elastic-glyph').forEach(glyph => glyph.style.removeProperty('transform'));
    active = null;
  }

  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    resetLetters();
  }

  function render() {
    if (dirty && active) {
      const letters = [...active.querySelectorAll<HTMLElement>('.elastic-letter')].map(letter => ({
        glyph: letter.firstElementChild as HTMLElement,
        rect: letter.getBoundingClientRect(),
      }));
      for (const { glyph, rect } of letters) {
        const dx = targetX - (rect.left + rect.width / 2);
        const dy = targetY - (rect.top + rect.height / 2);
        const radius = Math.max(85, rect.height * .85);
        const strength = Math.max(0, 1 - Math.hypot(dx, dy * .6) / radius);
        const lift = Math.min(20, rect.height * .13) * strength;
        glyph.style.transform = strength > 0
          ? `translateY(${-lift}px) scale(${1 - strength * .09},${1 + strength * .2}) skewX(${dx / radius * strength * -12}deg)`
          : '';
      }
      dirty = false;
    }
    frame = 0;
  }

  document.addEventListener('pointermove', event => {
    if (!enabled() || event.pointerType !== 'mouse') return;
    const target = event.target as Element;
    if (target.closest('input,textarea,select,.portfolio-viewport')) { reset(); return; }
    targetX = event.clientX;
    targetY = event.clientY;
    const text = target.closest<HTMLElement>('[data-elastic]');
    if (text !== active) { resetLetters(); active = text; }
    dirty = true;
    if (!frame) frame = requestAnimationFrame(render);
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', reset);
  document.addEventListener('scroll', reset, { passive: true, capture: true });
  document.addEventListener('keydown', reset);
  window.addEventListener('blur', reset);
  fine.addEventListener('change', reset);
  reduced.addEventListener('change', reset);
}
