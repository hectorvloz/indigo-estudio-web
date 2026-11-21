import { track } from './cookies';

type Car = {
  ref: string; make: string; model: string; version: string; type: string; year: number; km: number; price: number;
  city: string; transmission: string; fuel: string; engine: string; color: string; photo: string; spin?: boolean;
};

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const pesos = (value: number) => `$${value.toLocaleString('es-CO')}`;
const kms = (value: number) => `${value.toLocaleString('es-CO')} km`;

/* Los botones de reserva llevan a /asesoria/ con el origen de la visita (UTM de la campaña de WhatsApp, por ejemplo). */
function keepCampaign() {
  const incoming = new URLSearchParams(location.search);
  document.querySelectorAll<HTMLAnchorElement>('[data-booking]').forEach(link => {
    const target = new URL(link.href);
    incoming.forEach((value, key) => { if (/^(utm_|fbclid$)/.test(key)) target.searchParams.set(key, value); });
    target.searchParams.set('utm_campaign', incoming.get('utm_campaign') || 'consignatarias');
    link.href = target.toString();
    link.addEventListener('click', () => track('ConsignatariasAsesoria'));
  });
}

/* Visor 360°: ocho vistas reales. Se arrastra con inercia y siempre descansa en una vista limpia. */
export function initSpin(root: HTMLElement) {
  if (root.dataset.ready) return;
  root.dataset.ready = 'true';
  const frames = [...root.querySelectorAll<HTMLImageElement>('[data-spin-frame]')];
  const stage = root.querySelector<HTMLElement>('[data-spin-stage]')!;
  const thumbs = [...root.querySelectorAll<HTMLButtonElement>('[data-spin-view]')];
  const hint = root.querySelector<HTMLElement>('[data-spin-hint]');
  const full = root.querySelector<HTMLButtonElement>('[data-spin-full]');
  const count = frames.length;
  const names = thumbs.map(thumb => thumb.querySelector('span')?.textContent ?? '');
  let pos = Number(root.dataset.start ?? 0); // posición continua en vistas (no en grados)
  let raf = 0;
  let autoplay = root.dataset.autoplay === 'true' && !reducedMotion.matches;
  let autoTimer = 0;
  let visible = false;

  const wrap = (value: number) => ((value % count) + count) % count;
  const draw = () => {
    const p = wrap(pos);
    const i = Math.floor(p) % count;
    const next = (i + 1) % count;
    // Fundido corto: casi todo el recorrido muestra un cuadro limpio.
    const mix = Math.min(1, Math.max(0, (p - Math.floor(p) - 0.3) / 0.4));
    frames.forEach((frame, k) => { frame.style.opacity = k === i ? '1' : k === next ? String(mix) : '0'; });
    const nearest = Math.round(p) % count;
    thumbs.forEach((thumb, k) => thumb.setAttribute('aria-pressed', String(k === nearest)));
    stage.setAttribute('aria-valuenow', String(Math.round(p * (360 / count)) % 360));
    stage.setAttribute('aria-valuetext', names[nearest] ?? '');
  };
  const cancel = () => { cancelAnimationFrame(raf); raf = 0; };
  const tween = (target: number, ms = 520) => {
    cancel();
    if (reducedMotion.matches) { pos = target; draw(); return; }
    const from = pos; const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - t, 3);
      pos = from + (target - from) * e; draw();
      if (t < 1) raf = requestAnimationFrame(step); else raf = 0;
    };
    raf = requestAnimationFrame(step);
  };
  const goTo = (view: number) => {
    const current = wrap(pos);
    let delta = view - current;
    if (delta > count / 2) delta -= count;
    if (delta < -count / 2) delta += count;
    tween(pos + delta);
  };
  const interact = () => {
    autoplay = false; window.clearTimeout(autoTimer);
    hint?.classList.add('is-gone');
  };

  // Arrastre con inercia; al soltar se acomoda en la vista más cercana.
  let dragging = false; let lastX = 0; let lastT = 0; let velocity = 0;
  const perPixel = () => count / Math.max(stage.clientWidth * 1.15, 320);
  stage.addEventListener('pointerdown', event => {
    interact(); cancel();
    dragging = true; lastX = event.clientX; lastT = performance.now(); velocity = 0;
    stage.setPointerCapture(event.pointerId); stage.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove', event => {
    if (!dragging) return;
    const now = performance.now();
    const delta = -(event.clientX - lastX) * perPixel();
    velocity = delta / Math.max(now - lastT, 1);
    pos += delta; lastX = event.clientX; lastT = now; draw();
  });
  const release = () => {
    if (!dragging) return;
    dragging = false; stage.classList.remove('is-dragging');
    const glide = Math.max(-1.5, Math.min(1.5, velocity * 220));
    tween(Math.round(pos + glide), 420 + Math.abs(glide) * 260);
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);

  stage.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault(); interact();
    goTo(wrap(Math.round(pos) + (event.key === 'ArrowRight' ? 1 : -1)));
  });
  thumbs.forEach((thumb, i) => thumb.addEventListener('click', () => { interact(); goTo(i); }));

  full?.addEventListener('click', event => {
    event.stopPropagation(); interact();
    if (document.fullscreenElement) document.exitFullscreen();
    else root.requestFullscreen?.().catch(() => undefined);
  });
  full?.addEventListener('pointerdown', event => event.stopPropagation());

  // Giro automático tipo tornamesa: pasa de una vista a la otra con una pausa en cada una.
  const tick = () => {
    if (!autoplay) return;
    if (visible && !document.hidden) tween(Math.round(pos) + 1, 700);
    autoTimer = window.setTimeout(tick, 1900);
  };

  new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    if (visible) frames.forEach(frame => { frame.loading = 'eager'; });
  }, { rootMargin: '200px' }).observe(root);
  draw();
  if (autoplay) autoTimer = window.setTimeout(tick, 1600);
}

/* Desplegable propio (en lugar del menú nativo), con teclado: flechas, Enter, Escape. */
function initDropdown(root: HTMLElement, onChange: () => void) {
  const button = root.querySelector<HTMLButtonElement>('.fa-dd-btn')!;
  const list = root.querySelector<HTMLElement>('[role=listbox]')!;
  const label = root.querySelector<HTMLElement>('[data-dd-value]')!;
  const options = [...list.querySelectorAll<HTMLElement>('[role=option]')];
  let active = 0;
  const highlight = (i: number) => {
    active = (i + options.length) % options.length;
    options.forEach((option, k) => option.classList.toggle('is-active', k === active));
  };
  const open = () => {
    list.hidden = false; button.setAttribute('aria-expanded', 'true');
    highlight(Math.max(0, options.findIndex(o => o.getAttribute('aria-selected') === 'true')));
    list.focus();
    document.addEventListener('pointerdown', outside);
  };
  const close = (focus = true) => {
    list.hidden = true; button.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', outside);
    if (focus) button.focus();
  };
  const outside = (event: PointerEvent) => { if (!root.contains(event.target as Node)) close(false); };
  const choose = (i: number) => {
    const option = options[i];
    options.forEach(o => o.setAttribute('aria-selected', String(o === option)));
    root.dataset.value = option.dataset.value;
    label.textContent = option.textContent;
    close();
    onChange();
  };
  button.addEventListener('click', () => list.hidden ? open() : close());
  button.addEventListener('keydown', event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open(); } });
  options.forEach((option, i) => {
    option.addEventListener('pointermove', () => highlight(i));
    option.addEventListener('click', () => choose(i));
  });
  list.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') { event.preventDefault(); highlight(active + 1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); highlight(active - 1); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(active); }
    else if (event.key === 'Escape' || event.key === 'Tab') close(event.key === 'Escape');
  });
}

function initCatalog(root: HTMLElement) {
  const cars: Car[] = JSON.parse(document.getElementById('demo-cars')!.textContent || '[]');
  const base = root.dataset.images!;
  const list = root.querySelector<HTMLElement>('[data-list]')!;
  const grid = root.querySelector<HTMLElement>('[data-grid]')!;
  const items = [...grid.querySelectorAll<HTMLElement>('[data-car]')];
  const count = root.querySelector<HTMLElement>('[data-count]')!;
  const empty = root.querySelector<HTMLElement>('[data-empty]')!;
  const chips = [...root.querySelectorAll<HTMLButtonElement>('.fa-chip')];
  const max = root.querySelector<HTMLElement>('[data-dd=max]')!;
  const sort = root.querySelector<HTMLElement>('[data-dd=sort]')!;
  const detail = root.querySelector<HTMLElement>('[data-detail]')!;
  const media = detail.querySelector<HTMLElement>('[data-media]')!;
  const chat = detail.querySelector<HTMLElement>('[data-chat]')!;
  let type = 'Todos';
  let current: Car | undefined;
  let opener: HTMLElement | null = null;

  const apply = () => {
    const limit = Number(max.dataset.value);
    let shown = 0;
    items.forEach(item => {
      const ok = (type === 'Todos' || item.dataset.type === type) && (!limit || Number(item.dataset.price) <= limit);
      item.hidden = !ok;
      if (ok) shown++;
    });
    const key = sort.dataset.value;
    const value = (item: HTMLElement) => key === 'price-asc' ? Number(item.dataset.price) : key === 'price-desc' ? -Number(item.dataset.price) : key === 'km' ? Number(item.dataset.km) : Number(item.dataset.order);
    [...items].sort((a, b) => value(a) - value(b)).forEach(item => grid.append(item));
    count.textContent = shown === 1 ? '1 carro con ese filtro' : `${shown} carros${type === 'Todos' && !limit ? ' en Pereira y Bucaramanga' : ' con ese filtro'}`;
    empty.hidden = shown > 0;
  };

  chips.forEach(chip => chip.addEventListener('click', () => {
    type = chip.dataset.type!;
    chips.forEach(other => other.setAttribute('aria-pressed', String(other === chip)));
    apply();
  }));
  initDropdown(max, apply);
  initDropdown(sort, apply);

  const open = (car: Car) => {
    current = car;
    const name = `${car.make} ${car.model}`;
    detail.querySelector('[data-d-ref]')!.textContent = `Ref. ${car.ref} · ${car.city}`;
    detail.querySelector('[data-d-name]')!.textContent = `${name} ${car.year}`;
    detail.querySelector('[data-d-version]')!.textContent = car.version;
    detail.querySelector('[data-d-price]')!.textContent = pesos(car.price);
    const specs: [string, string][] = [['Año', String(car.year)], ['Kilometraje', kms(car.km)], ['Transmisión', car.transmission], ['Combustible', car.fuel], ['Motor', car.engine], ['Color', car.color], ['Tipo', car.type], ['Ciudad', car.city]];
    detail.querySelector('[data-d-specs]')!.replaceChildren(...specs.map(([term, value]) => {
      const wrap = document.createElement('div');
      wrap.append(Object.assign(document.createElement('dt'), { textContent: term }), Object.assign(document.createElement('dd'), { textContent: value }));
      return wrap;
    }));
    if (car.spin) {
      const template = document.getElementById('spin-template') as HTMLTemplateElement;
      media.replaceChildren(template.content.cloneNode(true));
      initSpin(media.querySelector<HTMLElement>('[data-spin]')!);
    } else {
      const img = Object.assign(document.createElement('img'), { src: `${base}${car.photo}`, alt: `${name} ${car.year}, color ${car.color.toLowerCase()}`, width: 900, height: 600 });
      media.replaceChildren(img);
    }
    chat.hidden = true;
    list.hidden = true;
    detail.hidden = false;
    detail.focus({ preventScroll: true });
    root.closest('.browser')?.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
    track('ConsignatariasDemoFicha', { content_name: name });
  };
  const close = () => {
    detail.hidden = true;
    list.hidden = false;
    media.replaceChildren();
    opener?.focus({ preventScroll: true });
  };

  grid.addEventListener('click', event => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-open]');
    const car = button && cars.find(c => c.ref === button.dataset.open);
    if (!car) return;
    opener = button;
    open(car);
  });
  detail.querySelector('[data-close]')!.addEventListener('click', close);
  detail.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  detail.querySelector('[data-whatsapp]')!.addEventListener('click', () => {
    if (!current) return;
    detail.querySelector('[data-chat-text]')!.textContent = `Hola Faro Autos, me interesa el ${current.make} ${current.model} ${current.version} ${current.year} de ${pesos(current.price)} (ref. ${current.ref}), que está en ${current.city}. ¿Sigue disponible?`;
    chat.hidden = false;
    track('ConsignatariasDemoWhatsApp');
  });
}

/* Barra fija de reserva en celular: visible siempre, salvo cuando el cierre (que tiene sus propios botones) está a la vista. */
function initSticky() {
  const bar = document.querySelector<HTMLElement>('[data-sticky]');
  const watched = [document.querySelector('.cs-close-foot')].filter(Boolean) as Element[];
  if (!bar || !watched.length) return;
  const visible = new Set<Element>();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
    bar.classList.toggle('is-on', visible.size === 0);
  });
  watched.forEach(el => observer.observe(el));
}

keepCampaign();
initSticky();
document.querySelectorAll<HTMLAnchorElement>('[data-wa]').forEach(link => link.addEventListener('click', () => track('ConsignatariasWhatsApp')));
document.querySelectorAll<HTMLElement>('.cs-spin [data-spin]').forEach(initSpin);
const catalog = document.querySelector<HTMLElement>('[data-catalog]');
if (catalog) initCatalog(catalog);
