/** One vertical slide per gesture, then ordinary document scrolling. */
export function initVerticalSlideshow() {
  const slideshow = document.querySelector<HTMLElement>('[data-vertical-slideshow]');
  const isHome = document.body.dataset.home === 'true';
  if (!isHome && !slideshow) return;

  const slides = isHome
    ? [...document.querySelectorAll<HTMLElement>('[data-scene]:not([data-flow-scroll])')]
    : [...slideshow!.querySelectorAll<HTMLElement>('[data-slideshow-slide]')];
  const flow = (isHome ? document : slideshow!).querySelector<HTMLElement>('[data-flow-scroll]');
  if (!slides.length || !flow) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const gesturePause = 40;
  const transitionTime = 320;
  let animation = 0;
  let moving = false;
  let gestureUsed = false;
  let gestureTimer = 0;
  let lastWheelAmount = 0;
  let touchStart: { x: number; y: number } | null = null;
  let touchStartedInFlow = false;

  // The slideshow owns its animation; CSS smooth scrolling would animate each frame again.
  document.documentElement.style.scrollBehavior = 'auto';

  const topOf = (element: HTMLElement) => element.getBoundingClientRect().top + scrollY;
  const flowTop = () => topOf(flow);
  const instant = (top: number) => window.scrollTo({ top, behavior: 'instant' });

  function noteGesture() {
    clearTimeout(gestureTimer);
    gestureTimer = window.setTimeout(() => { gestureUsed = false; }, gesturePause);
  }

  function moveTo(top: number) {
    cancelAnimationFrame(animation);
    const start = scrollY;
    const end = Math.max(0, Math.min(top, document.documentElement.scrollHeight - innerHeight));
    if (reducedMotion.matches || Math.abs(end - start) < 2) {
      instant(end);
      moving = false;
      return;
    }
    moving = true;
    const began = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - began) / transitionTime);
      const eased = 1 - Math.pow(1 - progress, 3);
      instant(start + (end - start) * eased);
      if (progress < 1) animation = requestAnimationFrame(tick);
      else {
        animation = 0;
        moving = false;
      }
    };
    animation = requestAnimationFrame(tick);
  }

  function slideAt(position: number) {
    let index = 0;
    for (let i = 1; i < slides.length; i++) {
      if (topOf(slides[i]) > position + 3) break;
      index = i;
    }
    return index;
  }

  function advance(direction: number) {
    const flowStart = flowTop();
    const inFlow = scrollY >= flowStart - 3;
    if (inFlow && direction > 0) return false;
    if (inFlow && scrollY > flowStart + 3) return false;
    if (moving || gestureUsed) return true;

    gestureUsed = true;
    const index = inFlow ? slides.length : slideAt(scrollY);
    if (inFlow) {
      moveTo(topOf(slides[slides.length - 1]));
    } else if (direction > 0) {
      moveTo(index === slides.length - 1 ? flowStart : topOf(slides[index + 1]));
    } else {
      if (index > 0) moveTo(topOf(slides[index - 1]));
    }
    return true;
  }

  function wheelPixels(event: WheelEvent) {
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 18;
    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * innerHeight;
    return event.deltaY;
  }

  // Navigation links take over immediately, even during a slide transition.
  document.addEventListener('click', event => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!link || new URL(link.href).pathname !== location.pathname) return;
    cancelAnimationFrame(animation);
    animation = 0;
    moving = false;
    gestureUsed = false;
  }, true);

  document.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey || document.querySelector('dialog[open]')) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if ((event.target as Element).closest('input,textarea,select,[data-native-scroll]')) return;
    const amount = wheelPixels(event);
    const direction = Math.sign(amount);
    if (!direction) return;

    const previousMagnitude = Math.abs(lastWheelAmount);
    const currentMagnitude = Math.abs(amount);
    const deliberateRestart = !moving && gestureUsed && currentMagnitude >= 80 &&
      currentMagnitude >= Math.max(120, previousMagnitude * 1.8);
    if (deliberateRestart) gestureUsed = false;
    lastWheelAmount = amount;

    const boundary = flowTop();
    // An upward wheel that would cross from native scrolling into the showcase
    // enters the last slide directly. No dead stop at the Services boundary.
    if (!moving && scrollY > boundary + 3) {
      if (direction > 0 || scrollY + amount > boundary + 3) return;
      event.preventDefault();
      gestureUsed = false;
      moveTo(topOf(slides[slides.length - 1]));
      noteGesture();
      return;
    }

    const shouldCapture = moving || scrollY < boundary - 3 || (direction < 0 && scrollY <= boundary + 3);
    if (!shouldCapture) return;
    event.preventDefault();
    advance(direction);
    noteGesture();
  }, { passive: false });

  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || document.querySelector('dialog[open]')) return;
    if ((event.target as Element).closest('input,textarea,select,button,summary,[contenteditable]')) return;
    const direction = ['ArrowDown', 'PageDown'].includes(event.key) ? 1 : ['ArrowUp', 'PageUp'].includes(event.key) ? -1 : 0;
    if (!direction) return;
    const boundary = flowTop();
    if (scrollY > boundary + 3) {
      if (direction > 0 || (event.key === 'ArrowUp' && scrollY - 40 > boundary) ||
        (event.key === 'PageUp' && scrollY - innerHeight > boundary)) return;
      event.preventDefault();
      gestureUsed = false;
      moveTo(topOf(slides[slides.length - 1]));
      noteGesture();
      return;
    }
    if (scrollY >= boundary - 3 && direction > 0) return;
    event.preventDefault();
    if (moving) return;
    gestureUsed = false;
    advance(direction);
    noteGesture();
  });

  document.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) return;
    touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    touchStartedInFlow = scrollY >= flowTop() - 3;
  }, { passive: true });

  document.addEventListener('touchmove', event => {
    if (!touchStart || event.touches.length !== 1 || document.querySelector('dialog[open]')) return;
    const dx = event.touches[0].clientX - touchStart.x;
    const dy = event.touches[0].clientY - touchStart.y;
    if (Math.abs(dy) <= Math.abs(dx)) return;
    if (scrollY < flowTop() - 3 || (scrollY <= flowTop() + 3 && dy > 0)) event.preventDefault();
  }, { passive: false });

  document.addEventListener('touchend', event => {
    if (!touchStart) return;
    const dx = (event.changedTouches[0]?.clientX ?? touchStart.x) - touchStart.x;
    const dy = (event.changedTouches[0]?.clientY ?? touchStart.y) - touchStart.y;
    touchStart = null;
    if (Math.abs(dy) < 45 || Math.abs(dy) < Math.abs(dx) * 1.2) return;
    const direction = dy < 0 ? 1 : -1;
    if (touchStartedInFlow && direction < 0 && scrollY <= flowTop() + 45) {
      gestureUsed = false;
      moveTo(topOf(slides[slides.length - 1]));
      noteGesture();
      return;
    }
    if (scrollY < flowTop() - 3 || (direction < 0 && scrollY <= flowTop() + 3)) {
      advance(direction);
      noteGesture();
    }
  }, { passive: true });
}
