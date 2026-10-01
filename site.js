'use strict';
// Progressive enhancement: navigation and the contact form also work without JS.
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
    if (message && !message.value.trim()) message.value = `Me interesa una solución de ${link.dataset.interest.toLowerCase()} para mi empresa.\n\n`;
  });
});
// Native POST hands delivery and spam verification to FormSubmit. No fake success state.
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  const next = contactForm.querySelector('[name="_next"]');
  if (next && /^https?:$/.test(window.location.protocol)) next.value = new URL('gracias.html', window.location.href.split('#')[0]).href;
}
