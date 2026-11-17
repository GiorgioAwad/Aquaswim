/* =========================================================
   Aquaswim — motion.js
   Orquesta el sistema de movimiento "Profundidad": reveal,
   parallax y burbujas del hero. Las interacciones de puntero
   sobre las tarjetas son CSS puro.

   No conoce la logica de negocio de script.js. Se comunica
   con motion.css unicamente a traves de custom properties
   (--px, --py, --sy, --shift, --progress, --delay) y de la
   clase is-visible.
   ========================================================= */

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const compact = matchMedia('(max-width: 1020px)');

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (from, to, amount) => from + (to - from) * amount;

/* ---------------------------------------------------------
   Programador de fotogramas
   Un solo bucle rAF para toda la pagina. Cada trabajo
   devuelve true si necesita otro fotograma; cuando ninguno
   lo pide, el bucle se detiene.
   --------------------------------------------------------- */

const jobs = new Set();
let frameId = null;

const runFrame = () => {
  frameId = null;
  let pending = false;
  jobs.forEach((job) => {
    if (job()) pending = true;
  });
  if (pending) schedule();
};

const schedule = () => {
  if (frameId === null) frameId = requestAnimationFrame(runFrame);
};

const addJob = (job) => {
  jobs.add(job);
  schedule();
};

/* ---------------------------------------------------------
   Barra de progreso de scroll
   --------------------------------------------------------- */

const initScrollProgress = () => {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.prepend(bar);

  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? clamp(window.scrollY / scrollable, 0, 1) : 0;
    bar.style.setProperty('--progress', progress.toFixed(4));
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
};

/* ---------------------------------------------------------
   Reveal
   Asigna la variante por defecto segun el tipo de elemento y
   calcula el escalonado por posicion entre hermanos.
   --------------------------------------------------------- */

const REVEAL_VARIANTS = [
  ['.program-card', 'rise-in'],
  ['.identity-card', 'scale-in'],
  ['.coach-portrait', 'scale-in'],
];

const initReveal = () => {
  const elements = [...document.querySelectorAll('.reveal')];

  elements.forEach((element) => {
    if (!element.dataset.reveal) {
      const match = REVEAL_VARIANTS.find(([selector]) => element.matches(selector));
      if (match) element.dataset.reveal = match[1];
    }

    // Escalonado: posicion entre los hermanos que tambien revelan.
    if (!element.style.getPropertyValue('--delay')) {
      const siblings = [...(element.parentElement?.children ?? [])].filter((node) =>
        node.classList.contains('reveal'));
      const index = siblings.indexOf(element);
      if (index > 0) element.style.setProperty('--delay', `${Math.min(index * 90, 420)}ms`);
    }
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.13, rootMargin: '0px 0px -40px 0px' });

  elements.forEach((element) => observer.observe(element));
};

/* ---------------------------------------------------------
   Titulo del hero: cada linea se descubre al cargar
   --------------------------------------------------------- */

const initTitleReveal = () => {
  document.querySelectorAll('h1 .line').forEach((line, index) => {
    line.style.setProperty('--line-delay', `${180 + index * 130}ms`);
  });
  requestAnimationFrame(() => document.body.classList.add('is-loaded'));
};

/* ---------------------------------------------------------
   Burbujas del hero
   --------------------------------------------------------- */

const initBubbles = (hero) => {
  const container = hero.querySelector('.bubbles');
  if (!container || compact.matches) return;

  const fragment = document.createDocumentFragment();

  for (let index = 0; index < 18; index += 1) {
    const bubble = document.createElement('span');
    const size = 4 + Math.random() * 13;
    bubble.className = 'bubble';
    bubble.style.setProperty('--x', `${Math.random() * 100}%`);
    bubble.style.setProperty('--size', `${size.toFixed(1)}px`);
    bubble.style.setProperty('--drift', `${(Math.random() * 90 - 45).toFixed(0)}px`);
    bubble.style.setProperty('--dur', `${(11 + Math.random() * 13).toFixed(1)}s`);
    bubble.style.setProperty('--delay', `${(Math.random() * -22).toFixed(1)}s`);
    bubble.style.setProperty('--peak', (0.25 + Math.random() * 0.45).toFixed(2));
    fragment.append(bubble);
  }

  container.append(fragment);
};

/* ---------------------------------------------------------
   Hero: puntero y scroll
   --------------------------------------------------------- */

const initHero = () => {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  initBubbles(hero);

  // Parallax de scroll: se aplica tambien sin cursor.
  const onScroll = () => {
    const offset = clamp(window.scrollY, 0, hero.offsetHeight);
    hero.style.setProperty('--sy', offset.toFixed(1));
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!finePointer.matches) return;

  const pointer = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };

  hero.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect();
    pointer.x = clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2, -1, 1);
    pointer.y = clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2, -1, 1);
    schedule();
  });

  hero.addEventListener('pointerleave', () => {
    pointer.x = 0;
    pointer.y = 0;
    schedule();
  });

  addJob(() => {
    current.x = lerp(current.x, pointer.x, 0.08);
    current.y = lerp(current.y, pointer.y, 0.08);

    const settled =
      Math.abs(current.x - pointer.x) < 0.001 &&
      Math.abs(current.y - pointer.y) < 0.001;

    if (settled) {
      current.x = pointer.x;
      current.y = pointer.y;
    }

    hero.style.setProperty('--px', current.x.toFixed(4));
    hero.style.setProperty('--py', current.y.toFixed(4));

    return !settled;
  });
};

/* ---------------------------------------------------------
   Parallax interno de imagenes
   data-parallax lleva la velocidad. Solo se calcula para los
   elementos que estan en pantalla.
   --------------------------------------------------------- */

const initParallax = () => {
  const elements = [...document.querySelectorAll('[data-parallax]')];
  if (!elements.length || compact.matches) return;

  const active = new Set();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) active.add(entry.target);
      else {
        active.delete(entry.target);
        entry.target.style.setProperty('--shift', '0px');
      }
    });
    schedule();
  }, { rootMargin: '15% 0px' });

  elements.forEach((element) => observer.observe(element));

  let pending = true;
  window.addEventListener('scroll', () => { pending = true; schedule(); }, { passive: true });
  window.addEventListener('resize', () => { pending = true; schedule(); });

  addJob(() => {
    if (!pending) return false;
    pending = false;

    const middle = window.innerHeight / 2;
    active.forEach((element) => {
      const box = element.getBoundingClientRect();
      const speed = Number(element.dataset.parallax) || 0.12;
      const distance = (box.top + box.height / 2) - middle;
      element.style.setProperty('--shift', `${(distance * speed).toFixed(1)}px`);
    });

    return false;
  });
};

/* ---------------------------------------------------------
   Arranque
   --------------------------------------------------------- */

initReveal();

if (!reducedMotion.matches) {
  initScrollProgress();
  initTitleReveal();
  initHero();
  initParallax();
} else {
  document.body.classList.add('is-loaded');
}
