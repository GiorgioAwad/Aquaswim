import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
});

const checks = [
  { name: 'desktop', viewport: { width: 1440, height: 1000 } },
  { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
];

for (const check of checks) {
  const context = await browser.newContext({
    viewport: check.viewport,
    isMobile: check.isMobile || false,
    hasTouch: check.hasTouch || false,
    deviceScaleFactor: 1,
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  // El embed de la galería es de terceros: se bloquea para que la
  // verificación no dependa de la red de Instagram.
  await page.route('**://*.instagram.com/**', (route) => route.abort());
  const errors = [];
  const isExternal = (text) => text.includes('instagram.com');
  page.on('response', (response) => {
    if (response.status() >= 400 && !isExternal(response.url())) errors.push(`${response.status()} ${response.url()}`);
  });
  page.on('console', (message) => {
    if (message.type() === 'error' && !isExternal(message.text())) errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `preview-${check.name}.png`, fullPage: false });
  if (check.name === 'desktop') {
    await page.locator('.programs').screenshot({ path: 'preview-programs.png' });
    await page.locator('.institutional').screenshot({ path: 'preview-institutional.png' });
    await page.locator('.signup').screenshot({ path: 'preview-inscriptions.png' });
    await page.locator('.reels').screenshot({ path: 'preview-videos.png' });
    await page.locator('.values-section').screenshot({ path: 'preview-values.png' });
    await page.locator('.method').screenshot({ path: 'preview-method.png' });
    await page.locator('.coach-section').screenshot({ path: 'preview-team.png' });
  }

  await page.locator('.site-footer').screenshot({ path: 'preview-footer-' + check.name + '.png' });

  if (check.name === 'mobile') {
    for (const [name, selector] of [['values', '.values-section'], ['method', '.method'], ['team', '.coach-section']]) {
      await page.locator(selector).screenshot({ path: 'preview-' + name + '-mobile.png' });
    }
    await page.locator('.menu-toggle').click();
    if (!(await page.locator('.main-nav').getAttribute('class')).includes('open')) {
      throw new Error('Mobile navigation did not open.');
    }
    await page.locator('.menu-toggle').click();
  }

  const programLinks = page.locator('.program-action');
  if (await programLinks.count() !== 5) {
    throw new Error(`${check.name}: expected 5 official program links.`);
  }
  const invalidProgramLinks = await programLinks.evaluateAll((links) => links.filter((link) => !link.href.includes('docs.google.com/forms')).length);
  if (invalidProgramLinks) throw new Error(`${check.name}: invalid program form links.`);

  const reelTriggers = page.locator('.reel-trigger');
  if (await reelTriggers.count() < 3) {
    throw new Error(`${check.name}: expected at least 3 reel cards.`);
  }
  const reelDialog = page.locator('#reel-dialog');
  await reelTriggers.first().click();
  if (!(await reelDialog.evaluate((node) => node.open))) {
    throw new Error(`${check.name}: reel dialog did not open.`);
  }
  const reelCode = await reelTriggers.first().getAttribute('data-reel');
  const reelSrc = await reelDialog.locator('iframe').getAttribute('src');
  if (reelSrc !== `https://www.instagram.com/reel/${reelCode}/embed/`) {
    throw new Error(`${check.name}: unexpected reel embed source (${reelSrc}).`);
  }
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#reel-dialog iframe'));

  // El hover de las tarjetas debe moverse solo en el plano: una
  // matriz 3D con rotacion o profundidad delata que volvio el tilt.
  // El contexto corre con movimiento reducido, que suprime los
  // transforms a proposito, asi que aqui se desactiva y se repone.
  const flatHover = async (label, selector) => {
    const card = page.locator(selector).first();
    await page.mouse.move(0, 0);
    await card.scrollIntoViewIfNeeded();
    await card.hover();
    await page.waitForTimeout(600);
    const transform = await card.evaluate((node) => getComputedStyle(node).transform);
    if (transform === 'none') {
      throw new Error(`${check.name}: ${label} does not react to hover.`);
    }
    if (transform.startsWith('matrix3d')) {
      const m = transform.slice(9, -1).split(',').map(Number);
      const flat = [2, 6, 8, 9, 11, 14].every((i) => Math.abs(m[i]) < 0.001) && Math.abs(m[10] - 1) < 0.001;
      if (!flat) throw new Error(`${check.name}: ${label} rotates or moves in depth (${transform}).`);
    }
  };

  if (check.name === 'desktop') {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await flatHover('program card', '.program-card');
    await flatHover('identity card', '.identity-card');
    await flatHover('reel card', '.reel-trigger');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.mouse.move(0, 0);
  }

  const backToTop = async (label, selector) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);
    await page.locator(selector).click();
    try {
      await page.waitForFunction(() => window.scrollY === 0, null, { timeout: 3000 });
    } catch {
      const stuck = await page.evaluate(() => Math.round(window.scrollY));
      throw new Error(`${check.name}: ${label} did not return to the top (scrollY ${stuck}).`);
    }
  };

  await backToTop('header logo', '.site-header .brand');
  await backToTop('footer logo', 'footer .brand');
  if (check.name === 'desktop') await backToTop('nav home link', '.main-nav a[href="#inicio"]');

  await page.locator('.objectives summary').click();
  if (!(await page.locator('.objectives').getAttribute('open')) && !(await page.locator('.objectives').evaluate((node) => node.open))) {
    throw new Error(`${check.name}: objectives detail did not open.`);
  }

  const bodyWidth = await page.locator('body').evaluate((node) => ({ scroll: node.scrollWidth, client: node.clientWidth }));
  if (bodyWidth.scroll > bodyWidth.client) {
    throw new Error(`${check.name}: horizontal overflow (${bodyWidth.scroll}px > ${bodyWidth.client}px).`);
  }
  if (errors.length) throw new Error(`${check.name}: console errors: ${errors.join(' | ')}`);
  console.log(`${check.name}: OK (${check.viewport.width}x${check.viewport.height})`);
  await context.close();
}

await browser.close();
