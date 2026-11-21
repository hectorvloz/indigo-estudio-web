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

/* Visor 360°: cuadros apilados que se funden entre sí según el ángulo. */
export function initSpin(root: HTMLElement) {
  if (root.dataset.ready) return;
  root.dataset.ready = 'true';
  const frames = [...root.querySelectorAll<HTMLImageElement>('[data-spin-frame]')];
  const stage = root.querySelector<HTMLElement>('[data-spin-stage]')!;
  const range = root.querySelector<HTMLInputElement>('[data-spin-range]')!;
  const step = 360 / frames.length;
  let angle = step;
  let playing = root.dataset.autoplay === 'true' && !reducedMotion.matches;
  let visible = false;
  let last = 0;

  const draw = () => {
    const a = ((angle % 360) + 360) % 360;
    const pos = a / step;
    const i = Math.floor(pos) % frames.length;
    const next = (i + 1) % frames.length;
    // Fundido corto entre vistas: la mayor parte del giro muestra un cuadro limpio, sin fantasma.
    const frac = pos - Math.floor(pos);
    const mix = Math.min(1, Math.max(0, (frac - 0.35) / 0.3));
    frames.forEach((frame, k) => { frame.style.opacity = k === i ? '1' : k === next ? String(mix) : '0'; });
    range.value = String(Math.round(a) % 360);
  };
  const stop = () => { playing = false; };
  const loop = (now: number) => {
    if (playing && visible) {
      angle += Math.min(now - last, 50) * 0.022;
      draw();
    }
    last = now;
    if (playing) requestAnimationFrame(loop);
  };

  range.addEventListener('input', () => { stop(); angle = Number(range.value); draw(); });
  let startX = 0; let startAngle = 0; let dragging = false;
  stage.addEventListener('pointerdown', event => {
    dragging = true; stop(); startX = event.clientX; startAngle = angle;
    stage.setPointerCapture(event.pointerId); stage.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove', event => {
    if (!dragging) return;
    angle = startAngle - (event.clientX - startX) * (360 / Math.max(stage.clientWidth * 1.4, 300));
    draw();
  });
  const end = () => { dragging = false; stage.classList.remove('is-dragging'); };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);

  new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    if (visible) frames.forEach(frame => { frame.loading = 'eager'; });
  }, { rootMargin: '200px' }).observe(root);
  draw();
  if (playing) requestAnimationFrame(now => { last = now; loop(now); });
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
  const max = root.querySelector<HTMLSelectElement>('[data-max]')!;
  const sort = root.querySelector<HTMLSelectElement>('[data-sort]')!;
  const detail = root.querySelector<HTMLElement>('[data-detail]')!;
  const media = detail.querySelector<HTMLElement>('[data-media]')!;
  const chat = detail.querySelector<HTMLElement>('[data-chat]')!;
  let type = 'Todos';
  let current: Car | undefined;
  let opener: HTMLElement | null = null;

  const apply = () => {
    const limit = Number(max.value);
    let shown = 0;
    items.forEach(item => {
      const ok = (type === 'Todos' || item.dataset.type === type) && (!limit || Number(item.dataset.price) <= limit);
      item.hidden = !ok;
      if (ok) shown++;
    });
    const key = sort.value;
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
  max.addEventListener('change', apply);
  sort.addEventListener('change', apply);

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

/* Barra fija de reserva en celular: aparece cuando el botón de la portada y el cierre no están a la vista. */
function initSticky() {
  const bar = document.querySelector<HTMLElement>('[data-sticky]');
  const watched = [document.querySelector('.cs-hero'), document.querySelector('.cs-close')].filter(Boolean) as Element[];
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
