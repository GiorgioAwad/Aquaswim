/*
  Galería de reels de Instagram.

  Estrategia de fachada: la tarjeta es una miniatura propia y el embed de
  Instagram solo se crea cuando la persona pide el video. Al cerrar, el iframe
  se destruye para que el reel no siga sonando en segundo plano.

  El dato de cada video vive en el marcado (data-reel). Este módulo no conoce
  la lógica de script.js ni la de motion.js.
*/

const dialog = document.querySelector('#reel-dialog');
const frame = dialog?.querySelector('.reel-dialog-frame');
const fallback = dialog?.querySelector('.reel-dialog-link');
const closeButton = dialog?.querySelector('.reel-dialog-close');
const triggers = [...document.querySelectorAll('.reel-trigger[data-reel]')];

if (dialog && frame && fallback && closeButton && triggers.length) {
  const openReel = (trigger) => {
    const code = trigger.dataset.reel;
    if (!code) return;
    const url = `https://www.instagram.com/reel/${code}/`;
    const iframe = document.createElement('iframe');
    iframe.src = `${url}embed/`;
    iframe.title = trigger.dataset.reelTitle
      ? `Video de Instagram: ${trigger.dataset.reelTitle}`
      : 'Video de Instagram';
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.setAttribute('scrolling', 'no');
    frame.replaceChildren(iframe);
    fallback.href = url;
    document.body.classList.add('reel-open');
    dialog.showModal();
  };

  triggers.forEach((trigger) => trigger.addEventListener('click', () => openReel(trigger)));

  // Al cerrar (aspa, Esc o clic en el fondo) se descarta el iframe.
  dialog.addEventListener('close', () => {
    frame.replaceChildren();
    document.body.classList.remove('reel-open');
  });

  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}
