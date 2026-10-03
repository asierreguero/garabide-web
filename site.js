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

const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  const eu = document.documentElement.lang === 'eu';
  const status = contactForm.querySelector('.form-status');
  const button = contactForm.querySelector('.submit-button');
  const originalButton = button.innerHTML;
  let pending = false;
  let widgetId;
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
    widgetId = window.turnstile.render(captcha, {
      sitekey: captcha.dataset.sitekey, action: 'contact', theme: 'light', size: 'flexible', language: eu ? 'auto' : 'es',
      callback: value => { token = value; captchaStatus.textContent = eu ? 'Segurtasun-egiaztapena osatuta.' : 'Verificación de seguridad completada.'; },
      'expired-callback': () => { token = ''; captchaStatus.textContent = captchaMessage; },
      'error-callback': () => { captchaError(); return true; },
      'timeout-callback': captchaError
    });
  };
  const loadCaptcha = () => {
    if (window.turnstile) { renderCaptcha(); return; }
    if (loading) return;
    loading = true;
    captchaStatus.textContent = eu ? 'Segurtasun-egiaztapena kargatzen…' : 'Cargando verificación de seguridad…';
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = renderCaptcha;
    script.onerror = () => { loading = false; script.remove(); captchaError(); };
    document.head.appendChild(script);
  };
  // Load the security service only when someone starts using the contact form.
  contactForm.addEventListener('focusin', loadCaptcha);
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
    status.textContent = eu ? 'Zure kontsulta bidaltzen ari gara.' : 'Estamos enviando tu consulta.';
    const form = new FormData(contactForm);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(contactForm.action, {
        method: 'POST', headers: {'Content-Type':'application/json'}, signal:controller.signal,
        body: JSON.stringify({nombre:form.get('nombre'),empresa:form.get('empresa'),email:form.get('email'),mensaje:form.get('mensaje'),website:form.get('website'),privacidad:form.has('privacidad'),lang:eu?'eu':'es',turnstileToken:token})
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true || result.code !== 'sent') {
        throw new Error(result.code === 'captcha' ? 'captcha' : response.status === 429 ? 'rate' : response.status === 400 ? 'invalid' : 'unavailable');
      }
      status.textContent = eu ? 'Eskerrik asko! Zure kontsulta bidali da. Posta elektronikoz erantzungo dizugu.' : '¡Gracias! Tu consulta se ha enviado. Te responderemos por correo electrónico.';
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
}
