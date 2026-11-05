import { track } from './cookies';

type Slot = { time: string; free: boolean };
type Day = { date: string; times: Slot[] };
const TZ = 'America/Bogota';

const form = document.querySelector<HTMLFormElement>('#booking-form');
if (form) initBooking(form);

function initBooking(form: HTMLFormElement) {
  const endpoint = form.dataset.endpoint!;
  const steps = [...form.querySelectorAll<HTMLElement>('[data-step]')];
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const count = document.querySelector<HTMLElement>('[data-step-count]')!;
  const bar = document.querySelector<HTMLElement>('[data-progress-bar]')!;
  const daysBox = form.querySelector<HTMLElement>('[data-days]')!;
  const timesBox = form.querySelector<HTMLElement>('[data-times]')!;
  const loading = form.querySelector<HTMLElement>('[data-slots-loading]')!;
  let current = 1;
  let days: Day[] = [];
  let day = '';
  let time = '';
  let slotsLoaded = false;

  const at = (date: string, hhmm: string) => new Date(`${date}T${hhmm}:00-05:00`);
    const timeLabel = (date: string, hhmm: string) => new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit', timeZone: TZ }).format(at(date, hhmm));
  const say = (message: string) => { status.textContent = message; };

  function show(step: number, move = true) {
    current = step;
    steps.forEach(el => {
      const active = Number(el.dataset.step) === step;
      el.hidden = !active;
      el.classList.toggle('is-entering', active && move);
    });
    count.textContent = step <= 3 ? `Paso ${step} de 3` : 'Agendado';
    form.closest('.booking')?.classList.toggle('is-done', step === 4);
    bar.style.width = `${Math.min(step, 3) / 3 * 100}%`;
    say('');
    if (move) {
      steps.find(el => Number(el.dataset.step) === step)?.querySelector<HTMLElement>('h1,h2')?.focus({ preventScroll: true });
    }
    if (step === 2 && !slotsLoaded) loadSlots();
  }

  function valid(step: number) {
    const fields = [...steps[step - 1].querySelectorAll<HTMLInputElement>('input:not([name=website]):not([name=day]):not([name=time])')];
    for (const field of fields) {
      if (!field.checkValidity()) { field.reportValidity(); field.focus(); return false; }
    }
    if (step === 2 && (!day || !time)) { say('Escoge un día y una hora.'); return false; }
    return true;
  }

  async function loadSlots() {
    loading.hidden = false;
    loading.textContent = 'Buscando horarios libres…';
    try {
      days = import.meta.env.DEV ? mockDays() : await fetch(`${endpoint}slots.php`, { headers: { Accept: 'application/json' } }).then(async res => {
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'error');
        return data.days as Day[];
      });
      slotsLoaded = true;
      if (!days.length) { loading.textContent = 'Esta semana se llenó. Escríbenos por WhatsApp y te buscamos un espacio.'; return; }
      loading.hidden = true;
      renderDays();
    } catch {
      loading.innerHTML = `No pudimos cargar la agenda. <a href="https://wa.me/${form.dataset.whatsapp}" target="_blank" rel="noopener">Escríbenos por WhatsApp</a> o intenta de nuevo.`;
    }
  }

  function chip(name: string, value: string, content: Node[], checked: boolean, onPick: () => void, disabled = false) {
    const wrap = document.createElement('label');
    wrap.className = 'booking-chip';
    const input = Object.assign(document.createElement('input'), { type: 'radio', name, value, checked, disabled });
    const face = document.createElement('span');
    face.append(...content);
    input.addEventListener('change', onPick);
    wrap.append(input, face);
    return wrap;
  }
  const part = (cls: string, text: string) => Object.assign(document.createElement('i'), { className: cls, textContent: text });
  const fmt = (date: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-CO', { ...opts, timeZone: TZ }).format(at(date, '12:00')).replace('.', '');

  function renderDays() {
    daysBox.replaceChildren(...days.map(d => {
      const free = d.times.filter(t => t.free).length;
      return chip('day', d.date, [part('d-week', fmt(d.date, { weekday: 'short' })), part('d-num', fmt(d.date, { day: 'numeric' })), part('d-month', fmt(d.date, { month: 'short' })), part('d-free', free === 1 ? 'Queda 1' : `${free} libres`)], d.date === day, () => { day = d.date; time = ''; renderTimes(); });
    }));
    daysBox.closest('.booking-days')?.classList.add('is-day');
    if (!day) { day = days[0].date; (daysBox.querySelector('input') as HTMLInputElement).checked = true; }
    renderTimes();
  }

  function renderTimes() {
    const times = days.find(d => d.date === day)?.times ?? [];
    timesBox.replaceChildren(...times.map(t => {
      const node = chip('time', t.time, [document.createTextNode(timeLabel(day, t.time))], t.time === time, () => { time = t.time; say(''); track('AsesoriaHorario', { day, time }); }, !t.free);
      if (!t.free) node.title = 'No disponible';
      return node;
    }));
  }

  const next = () => {
    if (!valid(current)) return;
    if (current === 1) track('AsesoriaDatos');
    show(current + 1);
  };
  form.querySelectorAll<HTMLButtonElement>('[data-next]').forEach(button => button.addEventListener('click', next));
  form.querySelectorAll<HTMLButtonElement>('[data-back]').forEach(button => button.addEventListener('click', () => show(current - 1)));

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (current < 3) { next(); return; }
    if (!valid(3)) return;
    const data = new FormData(form);
    const params = new URLSearchParams(location.search);
    const source = Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid'].filter(k => params.get(k)).map(k => [k, params.get(k)!]));
    const payload = {
      name: data.get('name'), email: data.get('email'), phone: `${data.get('dial')} ${String(data.get('phone')).trim()}`, website: data.get('website'),
      consent: data.get('consent') === 'on', date: day, time,
      brand: data.get('brand'), webType: data.get('webType'), source,
    };
    const submit = form.querySelector<HTMLButtonElement>('.booking-submit')!;
    submit.disabled = true;
    say('Agendando tu asesoría…');
    try {
      const result = import.meta.env.DEV ? { ok: true, meet: 'https://meet.google.com/' } : await fetch(`${endpoint}book.php`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload),
      }).then(async res => {
        const json = await res.json();
        if (!res.ok || !json.ok) {
          if (res.status === 409) { slotsLoaded = false; time = ''; }
          throw new Error(json.error || 'No pudimos agendar.');
        }
        return json;
      });
      const first = String(payload.name).trim().split(/\s+/)[0];
      const set = (sel: string, text: string) => { form.querySelector<HTMLElement>(sel)!.textContent = text; };
      set('[data-done-name]', first.charAt(0).toLocaleUpperCase('es-CO') + first.slice(1));
      set('[data-done-email]', String(payload.email));
      set('[data-done-week]', fmt(day, { weekday: 'short' }));
      set('[data-done-day]', fmt(day, { day: 'numeric' }));
      set('[data-done-month]', fmt(day, { month: 'short' }));
      set('[data-done-time]', timeLabel(day, time));
      const meet = form.querySelector<HTMLAnchorElement>('[data-done-meet]')!;
      if (result.meet) { meet.href = result.meet; meet.hidden = false; }
      track('Schedule', { content_name: 'Asesoría web gratis', content_category: String(payload.webType) }, true);
      track('Lead', { content_name: 'Asesoría web gratis' }, true);
      show(4);
      confetti(document.querySelector<HTMLCanvasElement>('[data-confetti]'));
    } catch (error) {
      say(error instanceof Error ? error.message : 'No pudimos agendar. Intenta de nuevo.');
      if (!slotsLoaded) { show(2); }
    } finally {
      submit.disabled = false;
    }
  });

  const policy = document.querySelector<HTMLDialogElement>('[data-policy]');
  const consent = form.querySelector<HTMLInputElement>('[name=consent]')!;
  form.querySelector<HTMLAnchorElement>('[data-policy-open]')?.addEventListener('click', event => {
    if (!policy) return;
    event.preventDefault();
    policy.showModal();
  });
  policy?.querySelector('[data-policy-close]')?.addEventListener('click', () => policy.close());
  policy?.querySelector('[data-policy-accept]')?.addEventListener('click', () => { consent.checked = true; policy.close(); consent.focus(); });
  policy?.addEventListener('click', event => { if (event.target === policy) policy.close(); });

  form.querySelector('[data-gift]')?.addEventListener('click', () => track('ReclamarRegalo'));

  const dial = form.querySelector<HTMLSelectElement>('[data-dial]');
  dial?.addEventListener('change', () => {
    const option = dial.selectedOptions[0];
    form.querySelector<HTMLImageElement>('[data-dial-flag]')!.src = `${dial.dataset.flags}${option.dataset.flag}.svg`;
    form.querySelector<HTMLElement>('[data-dial-code]')!.textContent = option.value;
    form.querySelector<HTMLInputElement>('[name=phone]')?.focus();
  });

  show(1, false);
}

function mockDays(): Day[] {
  const out: Day[] = [];
  const d = new Date();
  while (out.length < 8) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const all = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
    out.push({ date, times: all.map((time, i) => ({ time, free: !['09:00', '12:00', '12:30', '16:30'].includes(time) && (i * 7 + out.length * 3) % 5 !== 0 })) });
  }
  return out;
}

/** Lluvia corta de confeti con los colores de la marca. */
function confetti(canvas: HTMLCanvasElement | null) {
  if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d')!;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = canvas.width = innerWidth * dpr;
  const h = canvas.height = innerHeight * dpr;
  const colors = ['#f1c844', '#f5f1ea', '#ffffff', '#d9a92c'];
  const pieces = Array.from({ length: 140 }, () => ({
    x: w * (0.2 + Math.random() * 0.6), y: h * 0.35,
    vx: (Math.random() - 0.5) * 22 * dpr, vy: (-10 - Math.random() * 16) * dpr,
    size: (5 + Math.random() * 7) * dpr, rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)], round: Math.random() < 0.3,
  }));
  const start = performance.now();
  canvas.hidden = false;
  const frame = (now: number) => {
    const t = now - start;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - 1800) / 900);
    for (const p of pieces) {
      p.vy += 0.45 * dpr; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (t < 2700) requestAnimationFrame(frame); else { ctx.clearRect(0, 0, w, h); canvas.hidden = true; }
  };
  requestAnimationFrame(frame);
}
