import { sound } from './sound';
import { initVerticalSlideshow } from './scroll';
import { initCharacterEyes } from './eyes';
import { initPointerEffects } from './pointer';
import { initPortfolioCarousel } from './portfolio';
import { initCookieConsent } from './cookies';
const $ = <T extends Element>(selector: string) => document.querySelector<T>(selector);
const $$ = <T extends Element>(selector: string) => [...document.querySelectorAll<T>(selector)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const storage = {
  get(key: string) { try { return sessionStorage.getItem(key); } catch { return null; } },
  set(key: string, value: string) { try { sessionStorage.setItem(key, value); } catch { /* private mode */ } },
};
const menu = $<HTMLDialogElement>('#mega-menu')!;
const menuButton = $<HTMLButtonElement>('.menu-toggle')!;
const brief = $<HTMLDialogElement>('#brief-dialog')!;
let returnFocus: HTMLElement | null = null;
function closeDialog(dialog: HTMLDialogElement) { dialog.close(); returnFocus?.focus({ preventScroll: true }); }
function openDialog(dialog: HTMLDialogElement, trigger: HTMLElement) { returnFocus = trigger; dialog.showModal(); }
menuButton.addEventListener('click', () => { openDialog(menu, menuButton); menuButton.setAttribute('aria-expanded', 'true'); sound.play('menu'); });
menu.addEventListener('close', () => menuButton.setAttribute('aria-expanded', 'false'));
$<HTMLButtonElement>('.menu-close')!.addEventListener('click', () => closeDialog(menu));
$$<HTMLAnchorElement>('.mega-links a').forEach(link => {
  link.addEventListener('click', () => { menu.close(); sound.play('move'); });
  link.addEventListener('pointerenter', () => sound.play('move'));
});
$$<HTMLButtonElement>('[data-brief]').forEach(button => button.addEventListener('click', () => openDialog(brief, button)));
$<HTMLButtonElement>('.brief-close')!.addEventListener('click', () => closeDialog(brief));
brief.addEventListener('click', event => { if (event.target === brief) { const rect = brief.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(brief); } });
const form = $<HTMLFormElement>('#brief-form')!;
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const idea = String(data.get('idea') || '').trim();
  const status = $<HTMLParagraphElement>('#brief-status')!;
  if (!name || !idea) { status.textContent = 'Cuéntanos tu nombre y una idea antes de continuar.'; return; }
  const message = `¡Hola, Indigo! Soy ${name}.\nMe interesa: ${data.get('service')}.\nMi idea: ${idea}`;
  const destination = `https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(message)}`;
  status.replaceChildren();
  const fallback = document.createElement('a'); fallback.href = destination; fallback.target = '_blank'; fallback.rel = 'noopener noreferrer'; fallback.textContent = 'Mensaje preparado. Abrir WhatsApp'; fallback.style.textDecoration = 'underline'; status.append(fallback);
  window.open(destination, '_blank', 'noopener,noreferrer');
});
const soundButton = $<HTMLButtonElement>('.sound-toggle')!;
async function setSound(value: boolean) {
  const active = await sound.toggle(value);
  soundButton.setAttribute('aria-pressed', String(active));
  soundButton.setAttribute('aria-label', active ? 'Silenciar sonido' : 'Activar sonido');
  $<HTMLSpanElement>('.sound-text')!.textContent = active ? 'Sonido sí' : 'Sonido no';
  storage.set('indigo-sound', active ? 'yes' : 'no');
  if (active) sound.play('enter');
}
soundButton.addEventListener('click', () => void setSound(!sound.enabled));
// Restore a yes preference only with a new user gesture, never autoplay on reload.
if (storage.get('indigo-sound') === 'yes') document.addEventListener('pointerdown', event => {
  if (!(event.target as Element).closest('.sound-toggle, [data-enter]') && !sound.enabled) void setSound(true);
}, { once: true });
const intro = $<HTMLDialogElement>('#intro');
if (intro && !storage.get('indigo-entered') && !location.hash) {
  intro.showModal();
  const revealIntro = () => {
    const delay = reduced.matches ? 0 : 1150;
    window.setTimeout(() => {
      intro.classList.add('is-ready');
      intro.querySelectorAll<HTMLButtonElement>('[data-enter]').forEach(button => { button.disabled = false; });
      intro.querySelector<HTMLElement>('#intro-title')?.focus({ preventScroll: true });
    }, delay);
  };
  if (document.readyState === 'complete') revealIntro();
  else window.addEventListener('load', revealIntro, { once: true });
  intro.addEventListener('cancel', event => {
    event.preventDefault();
    if (intro.classList.contains('is-ready')) void enter(false);
  });
} else document.body.classList.add('intro-done');

initCookieConsent(intro, reduced);
let entering = false;
async function enter(withSound: boolean) {
  if (!intro || entering) return;
  entering = true;
  if (withSound) await setSound(true);
  else { storage.set('indigo-sound', 'no'); await sound.toggle(false); }
  storage.set('indigo-entered', 'yes');
  intro.classList.add('leaving');
  setTimeout(() => { intro.close(); document.body.classList.add('intro-done'); $<HTMLAnchorElement>('.brand')?.focus({ preventScroll: true }); }, reduced.matches ? 0 : 620);
}
$$<HTMLButtonElement>('[data-enter]').forEach(button => button.addEventListener('click', () => void enter(button.dataset.enter === 'sound')));
const scenes = $$<HTMLElement>('[data-scene]');
const sceneNav = $<HTMLElement>('.scene-nav');
const dots = $$<HTMLAnchorElement>('.scene-nav a');
let activeSceneIndex = 0;
function activate(index: number) {
  const scene = scenes[index]; if (!scene) return;
  document.body.classList.toggle('is-dark', scene.dataset.theme === 'dark');
  if (sceneNav && index !== activeSceneIndex) {
    sceneNav.classList.remove('is-dropping', 'is-rising');
    void sceneNav.offsetWidth;
    sceneNav.style.setProperty('--scene-index', String(index));
    sceneNav.classList.add(index > activeSceneIndex ? 'is-dropping' : 'is-rising');
    activeSceneIndex = index;
  }
  dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
  const section = ['que-mas','magia'].includes(scene.id) ? 'estudio' : scene.id;
  $$<HTMLAnchorElement>('[data-menu-item]').forEach(link => link.setAttribute('aria-current', String(link.dataset.menuItem === section)));
  scene.classList.add('is-visible');
}
if (scenes.length) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const scene = entry.target as HTMLElement;
      if (entry.isIntersecting) activate(scenes.indexOf(scene));
      else if (scene.classList.contains('story-scene')) scene.classList.remove('is-visible');
    });
  }, { rootMargin: '-38% 0px -38% 0px', threshold: 0 });
  scenes.forEach(scene => observer.observe(scene)); activate(0);
}
$$<HTMLAnchorElement>('a[href*="#"]').forEach(link => link.addEventListener('click', event => {
  const target = new URL(link.href);
  if (target.pathname !== location.pathname || !target.hash) return;
  const section = document.getElementById(decodeURIComponent(target.hash.slice(1))); if (!section) return;
  event.preventDefault(); history.pushState(null, '', target.hash);
  section.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth' });
  section.setAttribute('tabindex', '-1'); section.focus({ preventScroll: true });
}));
$$<HTMLButtonElement>('[data-filter]').forEach(button => button.addEventListener('click', () => {
  $$<HTMLButtonElement>('[data-filter]').forEach(item => { const selected = item === button; item.classList.toggle('active', selected); item.setAttribute('aria-pressed', String(selected)); });
  let count = 0; $$<HTMLElement>('[data-category]').forEach(card => { card.hidden = button.dataset.filter !== 'Todos' && card.dataset.category !== button.dataset.filter; if (!card.hidden) count++; });
  $<HTMLElement>('#filter-status')!.textContent = `${count} ${count === 1 ? 'proyecto' : 'proyectos'}`;
}));
const reveals = $$<HTMLElement>('[data-reveal]');
if (reveals.length) {
  if (reduced.matches) reveals.forEach(element => element.classList.add('is-revealed'));
  else {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      (entry.target as HTMLElement).classList.add('is-revealed');
      revealObserver.unobserve(entry.target);
    }), { threshold: .14 });
    reveals.forEach(element => revealObserver.observe(element));
  }
}
const themedSections = $$<HTMLElement>('[data-page-theme]');
if (themedSections.length) {
  const themeObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) document.body.classList.toggle('is-dark', (entry.target as HTMLElement).dataset.pageTheme === 'dark');
  }), { rootMargin: '-26% 0px -73% 0px', threshold: 0 });
  themedSections.forEach(section => themeObserver.observe(section));
}
const servicePanels = $$<HTMLElement>('[data-service-panel]');
const activateServicePanel = (panel: HTMLElement | null) => {
  servicePanels.forEach(item => {
    const active = item === panel;
    item.classList.toggle('is-active', active);
    item.querySelector('button')?.setAttribute('aria-expanded', String(active));
  });
};
servicePanels.forEach(panel => {
  panel.querySelector('button')?.addEventListener('click', () => {
    const opening = !panel.classList.contains('is-active');
    activateServicePanel(opening ? panel : null);
    if (opening) panel.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'nearest', inline: 'center' });
  });
  panel.addEventListener('pointerenter', () => {
    if (matchMedia('(hover: hover)').matches) activateServicePanel(panel);
  });
});
$<HTMLElement>('.services-type-board')?.addEventListener('pointerleave', () => {
  if (matchMedia('(hover: hover)').matches) activateServicePanel(null);
});
const projectLightbox = $<HTMLDialogElement>('#project-lightbox');
if (projectLightbox) {
  const imageButtons = $$<HTMLButtonElement>('[data-project-image]');
  const lightboxImage = projectLightbox.querySelector<HTMLImageElement>('[data-lightbox-image]')!;
  const lightboxCaption = projectLightbox.querySelector<HTMLElement>('[data-lightbox-caption]')!;
  const lightboxCount = projectLightbox.querySelector<HTMLElement>('[data-lightbox-count]')!;
  let currentImage = 0;
  let lightboxTrigger: HTMLButtonElement | null = null;
  const showProjectImage = (index: number) => {
    currentImage = (index + imageButtons.length) % imageButtons.length;
    const button = imageButtons[currentImage];
    lightboxImage.src = button.dataset.lightboxSrc || '';
    lightboxImage.alt = button.dataset.lightboxAlt || '';
    lightboxCaption.textContent = lightboxImage.alt;
    lightboxCount.textContent = `${String(currentImage + 1).padStart(2, '0')} / ${String(imageButtons.length).padStart(2, '0')}`;
  };
  imageButtons.forEach((button, index) => button.addEventListener('click', () => {
    lightboxTrigger = button;
    showProjectImage(index);
    document.body.classList.add('lightbox-open');
    projectLightbox.showModal();
    projectLightbox.querySelector<HTMLButtonElement>('[data-lightbox-close]')?.focus({ preventScroll: true });
  }));
  projectLightbox.querySelector<HTMLButtonElement>('[data-lightbox-close]')?.addEventListener('click', () => projectLightbox.close());
  projectLightbox.querySelector<HTMLButtonElement>('[data-lightbox-prev]')?.addEventListener('click', () => showProjectImage(currentImage - 1));
  projectLightbox.querySelector<HTMLButtonElement>('[data-lightbox-next]')?.addEventListener('click', () => showProjectImage(currentImage + 1));
  projectLightbox.addEventListener('click', event => { if (event.target === projectLightbox) projectLightbox.close(); });
  projectLightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); showProjectImage(currentImage - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showProjectImage(currentImage + 1); }
  });
  projectLightbox.addEventListener('close', () => {
    document.body.classList.remove('lightbox-open');
    lightboxTrigger?.focus({ preventScroll: true });
  });
}
initPointerEffects();
initPortfolioCarousel();
initVerticalSlideshow();
initCharacterEyes();
document.addEventListener('visibilitychange', () => { if (document.hidden && sound.enabled) { void sound.toggle(false).then(() => { soundButton.setAttribute('aria-pressed', 'false'); soundButton.setAttribute('aria-label', 'Activar sonido'); $<HTMLSpanElement>('.sound-text')!.textContent = 'Sonido no'; }); } });
