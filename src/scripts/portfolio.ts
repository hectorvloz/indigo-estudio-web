const STEP_EVENT = 'indigo:portfolio-step';

export function setPortfolioIndex(section: HTMLElement, index: number) {
  section.dispatchEvent(new CustomEvent(STEP_EVENT, { detail: { index } }));
}

export function requestPortfolioStep(section: HTMLElement, direction: number) {
  const slides = section.querySelectorAll<HTMLElement>('[data-carousel-slide]');
  const index = Number(section.dataset.carouselIndex || 0);
  const next = Math.max(0, Math.min(slides.length - 1, index + direction));
  if (next === index) return false;
  setPortfolioIndex(section, next);
  return true;
}

export function initPortfolioCarousel() {
  const section = document.querySelector<HTMLElement>('[data-project-carousel]');
  if (!section) return;
  const track = section.querySelector<HTMLElement>('[data-carousel-track]');
  const slides = [...section.querySelectorAll<HTMLElement>('[data-carousel-slide]')];
  const current = section.querySelector<HTMLElement>('[data-carousel-current]');
  const progress = section.querySelector<HTMLElement>('[data-carousel-progress]');
  if (!track || !slides.length) return;
  const carousel = section;
  const carouselTrack = track;
  const viewport = section.querySelector<HTMLElement>('.portfolio-viewport');

  let index = 0;
  function positionTrack() {
    const first = slides[0];
    const active = slides[index];
    carouselTrack.style.transform = `translate3d(${first.offsetLeft - active.offsetLeft}px, 0, 0)`;
  }

  function select(next: number) {
    index = Math.max(0, Math.min(slides.length - 1, next));
    carousel.dataset.carouselIndex = String(index);
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      slide.classList.toggle('is-active', active);
      slide.querySelector<HTMLAnchorElement>('.portfolio-card-link')?.setAttribute('tabindex', active ? '0' : '-1');
    });
    if (current) current.textContent = String(index + 1).padStart(2, '0');
    if (progress) progress.style.transform = `translateX(${index * 100}%)`;
    positionTrack();
  }

  section.addEventListener(STEP_EVENT, event => select((event as CustomEvent<{ index: number }>).detail.index));
  window.addEventListener('resize', positionTrack, { passive: true });

  let touchX = 0;
  let touchY = 0;
  section.addEventListener('touchstart', event => {
    touchX = event.changedTouches[0]?.clientX ?? 0;
    touchY = event.changedTouches[0]?.clientY ?? 0;
  }, { passive: true });
  section.addEventListener('touchend', event => {
    const x = event.changedTouches[0]?.clientX ?? touchX;
    const y = event.changedTouches[0]?.clientY ?? touchY;
    const deltaX = x - touchX;
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(y - touchY)) requestPortfolioStep(section, deltaX < 0 ? 1 : -1);
  }, { passive: true });

  let horizontalGestureUsed = false;
  let horizontalGestureTimer = 0;
  section.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 12) return;
    event.preventDefault();
    clearTimeout(horizontalGestureTimer);
    horizontalGestureTimer = window.setTimeout(() => { horizontalGestureUsed = false; }, 70);
    if (horizontalGestureUsed) return;
    horizontalGestureUsed = true;
    requestPortfolioStep(section, Math.sign(event.deltaX));
  }, { passive: false });

  if (viewport) {
    let pointerId = -1;
    let dragStartX = 0;
    let dragDelta = 0;
    let dragged = false;
    let suppressClickUntil = 0;
    const offsetFor = (slideIndex: number) => slides[0].offsetLeft - slides[slideIndex].offsetLeft;

    viewport.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      pointerId = event.pointerId;
      dragStartX = event.clientX;
      dragDelta = 0;
      dragged = false;
      viewport.setPointerCapture(pointerId);
      viewport.classList.add('is-dragging');
      carouselTrack.classList.add('is-dragging');
    });
    viewport.addEventListener('pointermove', event => {
      if (event.pointerId !== pointerId) return;
      dragDelta = event.clientX - dragStartX;
      if (Math.abs(dragDelta) > 6) {
        dragged = true;
        suppressClickUntil = Infinity;
        event.preventDefault();
      }
      carouselTrack.style.transform = `translate3d(${offsetFor(index) + dragDelta}px,0,0)`;
    });
    const finishDrag = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      viewport.classList.remove('is-dragging');
      carouselTrack.classList.remove('is-dragging');
      if (Math.abs(dragDelta) > 60) select(index + (dragDelta < 0 ? 1 : -1));
      else positionTrack();
      if (dragged) suppressClickUntil = performance.now() + 600;
      pointerId = -1;
    };
    viewport.addEventListener('pointerup', finishDrag);
    viewport.addEventListener('pointercancel', finishDrag);
    viewport.addEventListener('dragstart', event => event.preventDefault());
    viewport.addEventListener('click', event => {
      if (performance.now() >= suppressClickUntil) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClickUntil = 0;
    }, true);
  }

  select(0);
}
