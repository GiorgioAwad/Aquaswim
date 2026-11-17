# Aquaswim Landing

Landing responsive de Corporación Deportiva Aquaswim, construida con HTML, CSS y JavaScript y preparada para desplegarse como sitio estático.

## Desarrollo local

```bash
npm install
npm run dev
```

## Producción

```bash
npm run build
npm run preview
```

## Despliegue

El sitio está publicado en Vercel (equipo FDNDA, proyecto `aquaswim`) en
https://www.corporacionaquaswim.com. Cada push a `main` en
`GiorgioAwad/Aquaswim` publica una nueva versión de producción.

- **DNS** (Squarespace Domains): registros `A` para `@` y `www` hacia
  `76.76.21.21`. Los registros MX, SPF, DMARC y DKIM son del correo de Google
  Workspace y no deben modificarse.
- **`vercel.json`**: redirige el dominio sin `www` a `www` y las rutas antiguas
  del sitio de Google Sites (`/inicio`, `/quiénes-somos`, `/servicios/...`,
  `/inscripciones`, `/pagos`, `/dian`, `/blog`, `/ranking`) a la nueva página.
- **SEO**: metadatos y datos estructurados (`SportsClub`) en `index.html`;
  `robots.txt`, `sitemap.xml`, imagen para redes y logo en `public/`. Al
  publicar cambios de contenido importantes, actualizar `lastmod` en
  `public/sitemap.xml`.

## Estructura

| Archivo | Responsabilidad |
|---|---|
| `styles.css` | Layout, color, tipografía y componentes |
| `motion.css` | Sistema de movimiento: reveal, hover en plano, cáusticas y burbujas |
| `script.js` | Navegación, contadores, formulario |
| `motion.js` | Bucle rAF único, parallax y orquestación del reveal |
| `reels.js` | Galería de Instagram: apertura y cierre del video en modal |

`motion.js` no conoce la lógica de `script.js`. Se comunica con `motion.css`
solo a través de custom properties (`--px`, `--py`, `--sy`, `--shift`,
`--progress`, `--delay`) y de la clase `is-visible`.

Las tarjetas no llevan JavaScript: su hover es CSS puro y se mueve en el plano:
elevación, zoom y un barrido de luz, sin rotación ni profundidad. El único
efecto que sigue al cursor es el parallax del héroe.

Los efectos de cursor solo se registran en dispositivos con puntero fino y
`prefers-reduced-motion: reduce` los desactiva por completo. El diseño del
sistema está en `docs/superpowers/specs/`.

## Galería de videos

La sección `#videos` muestra reels elegidos a mano. El embed de Instagram se
carga solo cuando alguien abre un video, no al cargar la página.

Para cambiar un video, edita su `<article class="reel-card">` en `index.html`:

1. `data-reel`: el código de la URL del reel.
   `instagram.com/reel/DbUTPzYRWLS/` → `DbUTPzYRWLS`.
2. `data-reel-title`, `aria-label` y el texto de `.reel-copy`: antetítulo y título.
3. La miniatura: deja la portada en `assets/reel-N.png` (o `.jpg`) y ejecuta
   `npm run optimize:images`, que la recorta a 9:16 y genera `reel-N.webp`.

Las miniaturas actuales vienen de capturas de 388 px de ancho, así que se ven
algo blandas en pantallas de alta densidad y el recorte a 9:16 les quita un
tercio del ancho. Una captura del reel a pantalla completa (~1080 px, ya en
9:16) las mejora sin tocar código: basta reemplazar el .png y volver a
ejecutar `npm run optimize:images`.

## Antes de publicar

- Verificar periódicamente que los cinco formularios oficiales de Google y los enlaces de redes sociales continúen activos.
- Confirmar cifras, dirección, programas, textos institucionales y derechos de uso de marca.
- Agregar enlaces reales de redes sociales, políticas de privacidad y tratamiento de datos.
- Declarar en la política de privacidad que el embed de Instagram instala cookies de terceros al abrir un video.
- Verificar que los reels enlazados sigan públicos.
- Completar analítica, dominio y metadatos sociales definitivos.

Los recursos fotográficos de `assets/` fueron generados específicamente para este prototipo.
