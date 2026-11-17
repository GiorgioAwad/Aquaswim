# Galería de reels de Instagram

Fecha: 2026-08-20
Estado: aprobado

## Problema

La landing cuenta la propuesta de Aquaswim con texto y fotografía fija. Falta
la prueba visual del día a día: entrenamientos, técnica y equipo en movimiento.
Ese material ya existe y se publica en Instagram (`@cdaquaswim`).

## Restricción de partida

El sitio es estático (Vite, sin backend). Traer el feed del perfil de forma
automática exige cuenta Business, app de Meta, token de 60 días renovable y una
función servidor que lo custodie: infraestructura que este proyecto no tiene.
La *Basic Display API* que permitía algo más simple la cerró Meta en diciembre
de 2024. Raspar el perfil queda descartado por términos de uso y fragilidad.

El embed por publicación individual, en cambio, no necesita token ni cuenta de
desarrollador.

## Decisión

Selección curada con fachada. El equipo elige los reels; cada tarjeta muestra
una miniatura propia y solo al hacer clic se carga el embed de Instagram.

Se descartaron:

- **Widget de terceros** (Elfsight, Behold): automático, pero de pago, con
  script externo, cookies y marca de agua en el plan gratuito.
- **Feed propio con la API de Meta**: automático y sin terceros, pero exige el
  backend y el mantenimiento de token que el proyecto no justifica hoy.

## Diseño

### Ubicación y estructura

Sección `#videos` entre `#equipo` y `.official-resources`. Reutiliza el
esqueleto de Programas: `.section-heading reveal` seguido de una grilla.

`.reel-grid` presenta tarjetas verticales 9:16 — el formato nativo del reel.
Tres columnas en escritorio, dos hasta 1020px, carrusel con `scroll-snap` en
móvil para no producir una columna interminable.

Cada tarjeta es un `<button class="reel-trigger" data-reel="CODIGO">` con
miniatura a sangre, degradado, botón de reproducción y pie con antetítulo y
título. Hereda `.reveal`, así que entra con el mismo movimiento que el resto de
la página: `motion.css` y `motion.js` no cambian.

### Reproducción

Un único `<dialog>` al final del `body`. Al pulsar una tarjeta, `reels.js` crea
el `<iframe>` con `instagram.com/reel/CODIGO/embed` y llama a `showModal()`. Al
cerrar, destruye el iframe para que el video no siga sonando.

`<dialog>` nativo aporta atrapado de foco, cierre con `Esc` y fondo inerte sin
librerías. Se cierra además con el botón de aspa y con clic en el fondo.

El modal incluye un enlace **"Ábrelo en Instagram"**. No es decorativo: el
embed puede fallar por bloqueadores de rastreo, cambios de Meta o si el reel se
borra o pasa a privado. Es la salida garantizada.

### Datos y mantenimiento

Los datos viven en el marcado, no en un archivo de configuración. Cambiar un
video son tres campos dentro de un `<article>`: la imagen, el `data-reel` y el
título. El código del reel es el segmento de su URL:
`instagram.com/reel/DbUTPzYRWLS/` → `DbUTPzYRWLS`.

Las miniaturas se colocan como `assets/reel-N.png|jpg` y `npm run
optimize:images` las convierte a `.webp`. El script omite las que no existan,
de modo que no se rompe si una falta.

### Archivos

| Archivo | Cambio |
|---|---|
| `index.html` | Sección `#videos`, `<dialog>`, símbolo `icon-play`, enlace en el pie |
| `styles.css` | Bloque `.reels` y sus reglas responsivas |
| `reels.js` | Módulo nuevo: apertura y cierre del modal |
| `scripts/optimize-images.mjs` | Miniaturas opcionales de reels |
| `README.md` | Estructura y procedimiento de cambio de video |

La lógica va en `reels.js` y no en `script.js` para sostener la separación que
ya documenta el README: navegación, contadores y formulario por un lado; la
galería por otro.

## Contenido inicial

| Código | Antetítulo | Título |
|---|---|---|
| `DbUTPzYRWLS` | Entrenamiento | Serie de la mañana |
| `DbcEFM1xUcc` | Técnica | Deslizamiento bajo el agua |
| `DbraFfZpRNR` | Constancia | Un día a la vez |

El título describe el video en vez de repetir el subtítulo quemado en él: si
ambos dicen lo mismo, la tarjeta gasta dos líneas en un solo dato.

## Pendiente para producción

- Mejorar la resolución de las miniaturas cuando haya capturas a pantalla completa.
- Al redactar la política de privacidad, declarar que el embed de Instagram
  instala cookies de terceros cuando la persona abre un video.
- Revisar periódicamente que los tres reels sigan públicos.
