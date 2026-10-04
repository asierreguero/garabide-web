'use strict';
// Accessible navigation and localized contact feedback.
document.documentElement.classList.add('js-enabled');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navigation');
if (menuButton && navigation) {
  menuButton.hidden = false;
  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
  });
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu(); menuButton.focus();
    }
  });
  window.matchMedia('(max-width: 800px)').addEventListener('change', closeMenu);
}
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
document.querySelectorAll('[data-interest]').forEach(link => {
  link.addEventListener('click', () => {
    const message = document.querySelector('#mensaje');
    if (message && !message.value.trim()) message.value = document.documentElement.lang === "eu" ? `${link.dataset.interest}: nire enpresarako irtenbide bat interesatzen zait.\n\n` : `Me interesa una solución de ${link.dataset.interest.toLowerCase()} para mi empresa.\n\n`;
  });
});

let turnstileLoader;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  if (!turnstileLoader) turnstileLoader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = resolve;
    script.onerror = () => { turnstileLoader = undefined; script.remove(); reject(new Error('captcha')); };
    document.head.appendChild(script);
  });
  return turnstileLoader;
}
document.querySelectorAll('.contact-form').forEach(contactForm => {
  const newsletter = contactForm.classList.contains('newsletter-form');
  const eu = document.documentElement.lang === 'eu';
  const status = contactForm.querySelector('.form-status');
  const button = contactForm.querySelector('.submit-button');
  const originalButton = button.innerHTML;
  let pending = false;
  let widgetId;
  let widgetSize;
  let token = '';
  let loading = false;
  const captcha = contactForm.querySelector('.contact-captcha');
  const captchaStatus = contactForm.querySelector('.captcha-status');
  const captchaMessage = eu ? 'Osatu segurtasun-egiaztapena bidali aurretik.' : 'Completa la verificación de seguridad antes de enviar.';
  const captchaError = () => {
    token = '';
    captchaStatus.textContent = eu ? 'Egiaztapena ez dago prest. Saiatu berriro edo idatzi info@garabide.com helbidera.' : 'La verificación no está lista. Vuelve a intentarlo o escribe a info@garabide.com.';
  };
  const renderCaptcha = () => {
    if (widgetId !== undefined || !window.turnstile) return;
    widgetSize = captcha.clientWidth < 300 ? 'compact' : 'flexible';
    widgetId = window.turnstile.render(captcha, {
      sitekey: captcha.dataset.sitekey, action: newsletter ? 'newsletter' : 'contact', theme: 'light', size: widgetSize, language: eu ? 'auto' : 'es',
      callback: value => { token = value; captchaStatus.textContent = eu ? 'Segurtasun-egiaztapena osatuta.' : 'Verificación de seguridad completada.'; },
      'expired-callback': () => { token = ''; captchaStatus.textContent = captchaMessage; },
      'error-callback': () => { captchaError(); return true; },
      'timeout-callback': captchaError
    });
    if (!token) captchaStatus.textContent = captchaMessage;
  };
  const loadCaptcha = () => {
    if (window.turnstile) { renderCaptcha(); return; }
    if (loading) return;
    loading = true;
    captchaStatus.textContent = eu ? 'Segurtasun-egiaztapena kargatzen…' : 'Cargando verificación de seguridad…';
    loadTurnstile().then(renderCaptcha).catch(() => { loading = false; captchaError(); });
  };
  // Load the security service only when someone starts using the contact form.
  contactForm.addEventListener('focusin', loadCaptcha);
  window.addEventListener('resize', () => {
    if (pending || widgetId === undefined || !window.turnstile) return;
    if ((captcha.clientWidth < 300 ? 'compact' : 'flexible') === widgetSize) return;
    window.turnstile.remove(widgetId); widgetId = undefined; token = ''; renderCaptcha();
  });
  button.disabled = false;
  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !contactForm.reportValidity()) return;
    if (!token) {
      loadCaptcha(); status.hidden = false; status.textContent = captchaMessage; status.focus(); return;
    }
    pending = true; button.disabled = true;
    button.textContent = eu ? 'Bidaltzen…' : 'Enviando…';
    status.hidden = false;
    status.textContent = eu ? 'Zure eskaera bidaltzen ari gara.' : 'Estamos enviando tu solicitud.';
    const form = new FormData(contactForm);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(contactForm.action, {
        method: 'POST', headers: {'Content-Type':'application/json'}, signal:controller.signal,
        body: JSON.stringify(newsletter
          ? {email:form.get('email'),website:form.get('website'),consent:form.has('newsletter-consent'),consentVersion:'2026-10-04.v1',lang:eu?'eu':'es',turnstileToken:token}
          : {nombre:form.get('nombre'),empresa:form.get('empresa'),email:form.get('email'),mensaje:form.get('mensaje'),website:form.get('website'),privacidad:form.has('privacidad'),lang:eu?'eu':'es',turnstileToken:token})
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true || result.code !== (newsletter ? 'registered' : 'sent')) {
        throw new Error(result.code === 'captcha' ? 'captcha' : response.status === 429 ? 'rate' : response.status === 400 ? 'invalid' : 'unavailable');
      }
      status.textContent = newsletter
        ? (eu ? 'Eskerrik asko! Zure eskaera jaso dugu. Oraindik ez dugu buletinik edo baieztapen-mezurik bidaltzen. Zure eskaera kentzeko, idatzi info@garabide.com helbidera.' : '¡Gracias! Hemos recibido tu solicitud. Todavía no enviamos boletines ni correos de confirmación. Para retirar tu solicitud, escribe a info@garabide.com.')
        : (eu ? 'Eskerrik asko! Zure kontsulta bidali da. Posta elektronikoz erantzungo dizugu.' : '¡Gracias! Tu consulta se ha enviado. Te responderemos por correo electrónico.');
      contactForm.reset();
    } catch (error) {
      status.textContent = error.message === 'captcha' ? captchaMessage : error.message === 'rate'
        ? (eu ? 'Bidalketa gehiegi jarraian. Itxaron minutu bat eta saiatu berriro.' : 'Demasiados envíos seguidos. Espera un minuto y vuelve a intentarlo.')
        : error.message === 'invalid'
        ? (eu ? 'Berrikusi eremuak eta pribatutasunaren onarpena.' : 'Revisa los campos y la aceptación de privacidad.')
        : (eu ? 'Ezin izan dugu bidalketa baieztatu. Zure testua mantendu dugu. Saiatu geroago edo idatzi info@garabide.com helbidera.' : 'No hemos podido confirmar el envío. Hemos conservado tu texto. Inténtalo más tarde o escribe a info@garabide.com.');
    } finally {
      clearTimeout(timer); pending = false; button.disabled = false; button.innerHTML = originalButton; status.focus();
      token = '';
      if (widgetId !== undefined && window.turnstile) window.turnstile.reset(widgetId);
    }
  });
});
