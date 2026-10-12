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
  window.matchMedia('(max-width: 1100px)').addEventListener('change', closeMenu);
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
  const demo = contactForm.classList.contains('demo-form');
  const quote = contactForm.classList.contains('product-quote-form');
  const product = demo || quote;
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
  const consent = contactForm.querySelector(newsletter ? '[name="newsletter-consent"]' : '[name="privacidad"]');
  const captchaBlock = contactForm.querySelector('.captcha-block');
  captchaBlock.hidden = !consent.checked;
  const captchaMessage = eu ? 'Osatu segurtasun-egiaztapena bidali aurretik.' : 'Completa la verificación de seguridad antes de enviar.';
  const captchaError = () => {
    token = '';
    captchaStatus.textContent = eu ? 'Egiaztapena ez dago prest. Saiatu berriro edo idatzi info@garabide.com helbidera.' : 'La verificación no está lista. Vuelve a intentarlo o escribe a info@garabide.com.';
  };
  const renderCaptcha = () => {
    if (!consent.checked || widgetId !== undefined || !window.turnstile) return;
    widgetSize = captcha.clientWidth < 300 ? 'compact' : 'flexible';
    widgetId = window.turnstile.render(captcha, {
      sitekey: captcha.dataset.sitekey, action: demo ? 'demo_download' : quote ? 'timetable_quote' : newsletter ? 'newsletter' : 'contact', theme: 'light', size: widgetSize, language: eu ? 'auto' : 'es',
      callback: value => {
        if (!consent.checked) return;
        token = value;
        captchaStatus.textContent = product
          ? (eu ? 'Egiaztapena osatuta. Jarraitzeko, sakatu eskaeraren botoia.' : 'Verificación completada. Pulsa el botón de solicitud para continuar.')
          : newsletter
          ? (eu ? 'Egiaztapena osatuta. Alta eskatzeko, sakatu «Izena eman».' : 'Verificación completada. Pulsa «Quiero apuntarme» para solicitar el alta.')
          : (eu ? 'Egiaztapena osatuta. Kontsulta ez da oraindik bidali: sakatu «Bidali kontsulta».' : 'Verificación completada. Tu consulta aún no se ha enviado: pulsa «Enviar consulta».');
      },
      'expired-callback': () => { token = ''; captchaStatus.textContent = captchaMessage; },
      'error-callback': () => { captchaError(); return true; },
      'timeout-callback': captchaError
    });
    if (!token) captchaStatus.textContent = captchaMessage;
  };
  const loadCaptcha = () => {
    if (!consent.checked) return;
    captchaBlock.hidden = false;
    if (window.turnstile) { renderCaptcha(); return; }
    if (loading) return;
    loading = true;
    captchaStatus.textContent = eu ? 'Segurtasun-egiaztapena kargatzen…' : 'Cargando verificación de seguridad…';
    loadTurnstile().then(renderCaptcha).catch(() => { loading = false; captchaError(); });
  };
  // Consent precedes verification; verification never means the form was sent.
  const syncConsent = () => {
    captchaBlock.hidden = !consent.checked;
    if (consent.checked) { loadCaptcha(); return; }
    token = '';
    if (widgetId !== undefined && window.turnstile) window.turnstile.remove(widgetId);
    widgetId = undefined;
  };
  consent.addEventListener('change', syncConsent);
  if (consent.checked) loadCaptcha();
  window.addEventListener('resize', () => {
    if (pending || !consent.checked || widgetId === undefined || !window.turnstile) return;
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
        body: JSON.stringify(product
          ? {empresa:form.get('empresa'),email:form.get('email'),telefono:form.get('telefono'),mensaje:form.get('mensaje') || '',website:form.get('website'),privacidad:form.has('privacidad'),consentVersion:'2026-10-13.v1',lang:eu?'eu':'es',turnstileToken:token}
          : newsletter
          ? {email:form.get('email'),website:form.get('website'),consent:form.has('newsletter-consent'),consentVersion:'2026-10-04.v1',lang:eu?'eu':'es',turnstileToken:token}
          : {nombre:form.get('nombre'),empresa:form.get('empresa'),email:form.get('email'),mensaje:form.get('mensaje'),website:form.get('website'),privacidad:form.has('privacidad'),lang:eu?'eu':'es',turnstileToken:token})
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true || result.code !== (demo ? 'download-ready' : newsletter ? 'registered' : 'sent')) {
        throw new Error(result.code === 'captcha' ? 'captcha' : response.status === 429 ? 'rate' : response.status === 400 ? 'invalid' : 'unavailable');
      }
      if (demo) {
        if (!/^https:\/\/contacto\.garabide\.com\/products\/timetable\/file\/[a-f0-9]{64}$/.test(result.downloadUrl || '')) throw new Error('unavailable');
        const downloadLink = contactForm.querySelector('.demo-download-link');
        downloadLink.href = result.downloadUrl;
        downloadLink.hidden = false;
        contactForm.querySelector('.download-result').hidden = false;
      }
      status.textContent = demo
        ? (eu ? 'Zure eskaera jaso dugu. Erabili beheko botoia instalatzailea deskargatzeko. Estekak 45 minutu iraungo du.' : 'Hemos recibido tus datos. Usa el botón de abajo para descargar el instalador. El enlace estará disponible durante 45 minutos.')
        : quote
        ? (eu ? 'Eskerrik asko! Aurrekontu-eskaera jaso dugu. Emandako datuen bidez jarriko gara zurekin harremanetan.' : '¡Gracias! Hemos recibido tu solicitud de presupuesto. Contactaremos contigo a través de los datos que nos has indicado.')
        : newsletter
        ? (eu ? 'Eskerrik asko! Zure alta-eskaera prozesatu dugu. Ez da posta elektronikoz baieztatu behar. Baja emateko, idatzi info@garabide.com helbidera.' : '¡Gracias! Hemos procesado tu solicitud de alta. No necesitas confirmarla por email. Para darte de baja, escribe a info@garabide.com.')
        : (eu ? 'Eskerrik asko! Zure kontsulta bidali da. Posta elektronikoz erantzungo dizugu.' : '¡Gracias! Tu consulta se ha enviado. Te responderemos por correo electrónico.');
      contactForm.reset();
      syncConsent();
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
