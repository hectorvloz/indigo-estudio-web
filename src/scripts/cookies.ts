type Consent = { version: 1; necessary: true; analytics: boolean; marketing: boolean; updatedAt: string };

const COOKIE_NAME = 'indigo_cookie_consent';
const SIX_MONTHS = 60 * 60 * 24 * 180;
const GA_ID = import.meta.env.PUBLIC_GA_MEASUREMENT_ID as string | undefined;
const GOOGLE_ADS_ID = import.meta.env.PUBLIC_GOOGLE_ADS_ID as string | undefined;
type ConsentWindow = Window & { dataLayer?: unknown[][]; gtag?: (...args: unknown[]) => void };
const getCookie = (name: string) => document.cookie.split('; ').find(row => row.startsWith(`${name}=`))?.slice(name.length + 1) || null;

function readConsent(): Consent | null {
  try {
    const raw = getCookie(COOKIE_NAME);
    if (!raw) return null;
    const parsed = JSON.parse(decodeURIComponent(raw)) as Consent;
    return parsed.version === 1 && parsed.necessary === true ? parsed : null;
  } catch { return null; }
}

function storeConsent(analytics: boolean, marketing: boolean): Consent {
  const consent: Consent = { version: 1, necessary: true, analytics, marketing, updatedAt: new Date().toISOString() };
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(consent))}; Max-Age=${SIX_MONTHS}; Path=/; SameSite=Lax${secure}`;
  return consent;
}

function removeKnownOptionalCookies(analyticsAllowed: boolean, marketingAllowed: boolean) {
  const analyticsCookies = [/^_ga/, /^_gid$/, /^_gat/];
  const marketingCookies = [/^_fbp$/, /^_gcl_/];
  document.cookie.split(';').forEach(part => {
    const name = part.split('=')[0]?.trim();
    const shouldDelete = name && ((!analyticsAllowed && analyticsCookies.some(pattern => pattern.test(name))) || (!marketingAllowed && marketingCookies.some(pattern => pattern.test(name))));
    if (shouldDelete) document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
  });
}

function updateGoogleConsent(consent: Consent) {
  const consentWindow = window as ConsentWindow;
  consentWindow.dataLayer ||= [];
  consentWindow.gtag ||= (...args: unknown[]) => { consentWindow.dataLayer!.push(args); };
  consentWindow.gtag('consent', 'update', {
    analytics_storage: consent.analytics ? 'granted' : 'denied',
    ad_storage: consent.marketing ? 'granted' : 'denied',
    ad_user_data: consent.marketing ? 'granted' : 'denied',
    ad_personalization: consent.marketing ? 'granted' : 'denied',
  });
  const firstId = consent.analytics && GA_ID ? GA_ID : consent.marketing && GOOGLE_ADS_ID ? GOOGLE_ADS_ID : null;
  if (!firstId || document.querySelector('[data-google-tag]')) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(firstId)}`;
  script.dataset.googleTag = 'true';
  document.head.append(script);
  consentWindow.gtag('js', new Date());
  if (consent.analytics && GA_ID) consentWindow.gtag('config', GA_ID, { anonymize_ip: true });
  if (consent.marketing && GOOGLE_ADS_ID) consentWindow.gtag('config', GOOGLE_ADS_ID);
}

function applyConsent(consent: Consent) {
  document.documentElement.dataset.cookieAnalytics = String(consent.analytics);
  document.documentElement.dataset.cookieMarketing = String(consent.marketing);
  removeKnownOptionalCookies(consent.analytics, consent.marketing);
  updateGoogleConsent(consent);
  window.dispatchEvent(new CustomEvent('indigo:cookie-consent', { detail: consent }));
}

export function initCookieConsent(intro: HTMLDialogElement | null, reducedMotion: MediaQueryList) {
  const notice = document.querySelector<HTMLElement>('[data-cookie-notice]');
  const dialog = document.querySelector<HTMLDialogElement>('[data-cookie-dialog]');
  if (!notice || !dialog) return;

  const analytics = dialog.querySelector<HTMLInputElement>('[data-cookie-analytics]')!;
  const marketing = dialog.querySelector<HTMLInputElement>('[data-cookie-marketing]')!;
  const privacySignal = Boolean((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) || navigator.doNotTrack === '1';
  let consent = readConsent();
  const consentWindow = window as ConsentWindow;
  consentWindow.dataLayer ||= [];
  consentWindow.gtag ||= (...args: unknown[]) => { consentWindow.dataLayer!.push(args); };
  consentWindow.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 });

  const syncControls = () => {
    analytics.checked = consent?.analytics ?? false;
    marketing.checked = privacySignal ? false : (consent?.marketing ?? false);
    marketing.disabled = privacySignal;
    dialog.querySelector<HTMLElement>('[data-cookie-gpc-note]')!.hidden = !privacySignal;
    notice.querySelector<HTMLElement>('[data-cookie-signal]')!.hidden = !privacySignal;
  };
  const hideNotice = () => {
    notice.classList.add('is-leaving');
    window.setTimeout(() => { notice.hidden = true; notice.classList.remove('is-leaving'); }, reducedMotion.matches ? 0 : 350);
  };
  const save = (allowAnalytics: boolean, allowMarketing: boolean) => {
    consent = storeConsent(allowAnalytics, privacySignal ? false : allowMarketing);
    applyConsent(consent);
    hideNotice();
    if (dialog.open) dialog.close();
  };
  const reveal = () => window.setTimeout(() => { notice.hidden = false; }, reducedMotion.matches ? 0 : 450);
  const openSettings = () => { syncControls(); notice.hidden = true; dialog.showModal(); };

  syncControls();
  if (consent) {
    if (privacySignal && consent.marketing) consent = storeConsent(consent.analytics, false);
    applyConsent(consent);
  }
  else if (intro?.open) intro.addEventListener('close', reveal, { once: true });
  else reveal();

  document.querySelectorAll<HTMLButtonElement>('[data-cookie-settings],[data-cookie-configure]').forEach(button => button.addEventListener('click', openSettings));
  document.querySelectorAll<HTMLButtonElement>('[data-cookie-reject]').forEach(button => button.addEventListener('click', () => save(false, false)));
  notice.querySelector<HTMLButtonElement>('[data-cookie-accept]')?.addEventListener('click', () => save(true, true));
  dialog.querySelector<HTMLButtonElement>('[data-cookie-save]')?.addEventListener('click', () => save(analytics.checked, marketing.checked));
  dialog.querySelector<HTMLButtonElement>('[data-cookie-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { if (!consent) reveal(); });
}
