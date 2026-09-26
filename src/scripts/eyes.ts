export function initCharacterEyes() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll<HTMLElement>('.character-eyes').forEach(face => {
    const surface = face.closest<HTMLElement>('[data-eyes-surface],.hero');
    if (!surface) return;
    let frame = 0;
    let x = 0, y = 0;
    let manualClosed = false;
    let blinkTimer = 0;
    const blinkSteps = new Set<number>();
    const clearBlinkSteps = () => {
      clearTimeout(blinkTimer);
      blinkSteps.forEach(step => clearTimeout(step));
      blinkSteps.clear();
    };
    const scheduleBlink = () => {
      if (!face.hasAttribute('data-auto-blink') || reduced.matches || document.hidden) return;
      clearTimeout(blinkTimer);
      blinkTimer = window.setTimeout(singleBlink, 1100 + Math.random() * 1000);
    };
    const blinkStep = (delay: number, closed: boolean, done = false) => {
      const step = window.setTimeout(() => {
        blinkSteps.delete(step);
        if (!manualClosed) face.classList.toggle('eyes-closed', closed);
        if (done) scheduleBlink();
      }, delay);
      blinkSteps.add(step);
    };
    function singleBlink() {
      if (manualClosed || reduced.matches || document.hidden) { scheduleBlink(); return; }
      face.classList.add('eyes-closed');
      blinkStep(180, false, true);
    }
    const reset = () => {
      cancelAnimationFrame(frame); frame = 0;
      face.style.setProperty('--gaze-x', '0px');
      face.style.setProperty('--gaze-y', '0px');
      face.style.setProperty('--brow-turn', '0deg');
      manualClosed = false;
      face.classList.remove('eyes-closed');
    };
    surface.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || reduced.matches) return;
      x = event.clientX; y = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const box = face.getBoundingClientRect();
        const dx = x - box.left - box.width / 2;
        const dy = y - box.top - box.height / 2;
        const distance = Math.max(160, Math.hypot(dx, dy));
        face.style.setProperty('--gaze-x', `${dx / distance * 12}px`);
        face.style.setProperty('--gaze-y', `${dy / distance * 9}px`);
        face.style.setProperty('--brow-turn', `${dx / distance * 5}deg`);
        frame = 0;
      });
    }, { passive: true });
    face.addEventListener('pointerenter', () => { manualClosed = true; face.classList.add('eyes-closed'); });
    face.addEventListener('pointerleave', () => { manualClosed = false; face.classList.remove('eyes-closed'); });
    face.addEventListener('pointerdown', () => { manualClosed = true; face.classList.add('eyes-closed'); });
    face.addEventListener('pointerup', event => {
      if (event.pointerType !== 'mouse') { manualClosed = false; face.classList.remove('eyes-closed'); }
    });
    face.addEventListener('pointercancel', reset);
    surface.addEventListener('pointerleave', reset);
    window.addEventListener('blur', () => { clearBlinkSteps(); reset(); });
    window.addEventListener('focus', scheduleBlink);
    reduced.addEventListener('change', () => { clearBlinkSteps(); reset(); scheduleBlink(); });
    scheduleBlink();
  });
}
