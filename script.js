const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
const navLinks = [...document.querySelectorAll('.main-nav a')];
const sections = [...document.querySelectorAll('main section[id], header[id]')];

const closeMenu = () => {
  nav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir menú');
  document.body.classList.remove('menu-open');
};

menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
  nav.classList.toggle('open', !isOpen);
  document.body.classList.toggle('menu-open', !isOpen);
});

navLinks.forEach((link) => link.addEventListener('click', closeMenu));

const onScroll = () => {
  header.classList.toggle('scrolled', window.scrollY > 35);
  const current = [...sections].reverse().find((section) => window.scrollY >= section.offsetTop - 180);
  if (!current) return;
  navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${current.id}`));
};

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// El sistema de reveal vive en motion.js.

const formatNumber = (number) => new Intl.NumberFormat('es-CO').format(number);
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const element = entry.target;
    const target = Number(element.dataset.count);
    const prefix = element.dataset.prefix || '';
    const duration = 1300;
    const started = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = `${prefix}${formatNumber(Math.round(target * eased))}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    countObserver.unobserve(element);
  });
}, { threshold: 1 });

document.querySelectorAll('[data-count]').forEach((element) => countObserver.observe(element));

const form = document.querySelector('.signup-form');
const status = document.querySelector('.form-status');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.checkValidity()) {
    form.reportValidity();
    status.textContent = 'Selecciona el programa que quieres consultar.';
    return;
  }
  const formUrl = form.elements.program.value;
  const newWindow = window.open(formUrl, '_blank', 'noopener,noreferrer');
  status.textContent = newWindow
    ? 'Formulario oficial abierto en una pestaña nueva.'
    : 'Tu navegador bloqueó la nueva pestaña. Permite ventanas emergentes e inténtalo de nuevo.';
});

document.querySelector('#year').textContent = new Date().getFullYear();
