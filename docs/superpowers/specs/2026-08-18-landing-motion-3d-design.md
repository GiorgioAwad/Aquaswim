# Aquaswim Landing — Sistema visual "Profundidad"

Fecha: 2026-08-18
Estado: aprobado

## Objetivo

Elevar el impacto visual de la landing con movimiento suave y profundidad 3D, sin
cambiar identidad de marca, estructura ni textos, y sin añadir dependencias.

## Decisiones tomadas

| Decisión | Elección |
|---|---|
| Técnica 3D | Solo CSS 3D (`perspective` + `preserve-3d`), sin librerías |
| Alcance | Conservar identidad; añadir capas de movimiento y profundidad |
| Rendimiento | Equilibrado: efectos completos en escritorio, degradados en móvil |

Se descartó Three.js/WebGL por peso (~150KB) y por no ser necesario para el nivel
de impacto buscado.

## Concepto

La página se comporta como agua vista desde dentro: capas a distintas
profundidades, luz que se filtra, objetos suspendidos que reaccionan al cursor y
al scroll. El movimiento es un sistema coherente, no efectos sueltos.

## Arquitectura de archivos

Se mantiene HTML/CSS/JS vanilla con Vite. Se separan responsabilidades:

| Archivo | Responsabilidad | Estado |
|---|---|---|
| `styles.css` | Layout, color, tipografía, componentes | Existente, se toca lo mínimo |
| `motion.css` | Tokens de movimiento, reveal, 3D, keyframes | Nuevo |
| `script.js` | Navegación, contadores, formulario, año | Existente, sin cambios de responsabilidad |
| `motion.js` | Bucle rAF, tilt, parallax, orquestación de reveal | Nuevo |

Contrato entre módulos: `motion.js` no conoce la lógica de negocio de `script.js`.
Se comunica con `motion.css` únicamente a través de custom properties
(`--mx`, `--my`, `--tilt-x`, `--tilt-y`, `--parallax`, `--progress`) y de la clase
`is-visible`. Esto permite cambiar el CSS sin tocar el JS y viceversa.

## Componentes

### 1. Sistema base de movimiento

Tokens en `:root` dentro de `motion.css`:

- `--ease-out-expo: cubic-bezier(.16, 1, .3, 1)` para entradas.
- `--ease-spring: cubic-bezier(.34, 1.56, .64, 1)` para hovers.
- Escala de duración: `--dur-fast: 180ms`, `--dur-base: 380ms`, `--dur-slow: 700ms`.

El `.reveal` actual (fade + `translateY(24px)`) se amplía con variantes aplicadas
por atributo `data-reveal`:

| Variante | Efecto |
|---|---|
| `fade-up` | Comportamiento actual, es el valor por defecto |
| `scale-in` | Entra desde `scale(.94)` |
| `clip-reveal` | Se descubre de abajo hacia arriba con `clip-path`; para títulos |
| `depth-in` | Entra desde `translateZ(-80px) rotateX(6deg)` |

El escalonado (stagger) se calcula en JS por índice dentro del contenedor padre y
se escribe en `--delay`. Se elimina la necesidad de `style="--delay: Nms"` en el
HTML.

### 2. Hero — parallax 3D multicapa

Contenedor con `perspective: 1200px` y `transform-style: preserve-3d`.

| Capa | Profundidad | Comportamiento |
|---|---|---|
| Gradiente de fondo | `translateZ(-120px)` | Desplazamiento mínimo |
| Imagen del nadador | `translateZ(-40px)` | Parallax medio con scroll |
| Cáusticas de luz | `translateZ(0)` | Dos capas de gradientes con `blur` y `mix-blend-mode: overlay`, deriva lenta infinita |
| Burbujas | `translateZ(60px)` | 18 partículas CSS que suben con drift y opacidad variable |
| Texto y CTAs | `translateZ(90px)` | Mayor desplazamiento, refuerza la profundidad |

El bloque inclina `rotateX`/`rotateY` con un máximo de 4° siguiendo el cursor.
El `<h1>` entra con `clip-reveal` línea por línea al cargar la página.

### 3. Tarjetas de programas — tilt 3D

Las cinco tarjetas usan `preserve-3d`. En hover:

- Inclinación de hasta 6° según la posición del cursor sobre la tarjeta.
- Imagen, ícono y botón a distinta `translateZ`, de modo que se separan
  visualmente entre sí. No es una imagen que se inclina: es una caja con
  contenido a distintas profundidades.
- Brillo especular (`radial-gradient` posicionado con `--mx`/`--my`).
- Borde con gradiente aqua que se enciende.
- Entrada escalonada con la variante `depth-in`.

### 4. Resto de secciones

- **Stats:** parallax de scroll sobre la tarjeta; cada stat entra escalonado.
- **Valores, identidad y pilares:** lift 3D suave en hover; el número índice se
  mueve en paralaje dentro de la tarjeta.
- **Coach y Sede:** reveal por `clip-path`; parallax interno donde la foto se
  desplaza más lento que su contenedor.
- **Globales:** barra de progreso de scroll; header con blur progresivo; barrido
  de brillo en botones; subrayado animado en la navegación.

## Rendimiento y accesibilidad

- Toda interacción de cursor va tras `@media (hover: hover) and (pointer: fine)`.
  En móvil el JS de tilt no se registra.
- Un único bucle `requestAnimationFrame` compartido entre mouse y scroll. Sin
  listeners por tarjeta: delegación desde el contenedor.
- El bucle rAF solo corre cuando hay trabajo pendiente; se detiene en reposo.
- Móvil: burbujas reducidas, parallax de scroll limitado al hero.
- `prefers-reduced-motion: reduce` desactiva transformaciones y deja todo el
  contenido visible y legible.
- `will-change` se aplica de forma puntual y se retira al terminar la animación.
- Sin cambios en el HTML semántico, roles ARIA, foco ni orden de tabulación.

## Criterios de éxito

1. La landing conserva colores, tipografías, textos y estructura actuales.
2. El hero muestra profundidad perceptible al mover el cursor y al hacer scroll.
3. Las tarjetas de programas responden al cursor con separación de capas visible.
4. No se añade ninguna dependencia a `package.json`.
5. Con `prefers-reduced-motion: reduce` la página es plenamente usable y estática.
6. En móvil no se ejecuta lógica de tilt ni parallax fuera del hero.
7. `npm run build` completa sin errores.

## Fuera de alcance

- Rediseño de paleta, tipografía o composición.
- Cambios en textos, enlaces de formularios o datos institucionales.
- WebGL, Three.js o cualquier librería de terceros.

## Cambios durante la implementación

Dos puntos del diseño se corrigieron al chocar con el comportamiento real del
navegador. Se documentan porque ambos son trampas fáciles de repetir.

### El degradado del hero no puede rotar

La escena del hero se planteó como un único bloque rotatorio. Al inclinarse, las
esquinas de `.hero-shade` se desplazaban hacia dentro y dejaban al descubierto la
foto sin sombrear: una costura visible en la esquina superior derecha.

La solución fue partir la escena en dos, con el degradado fijo entre ambas:
capas de fondo → `.hero-shade` (sin rotar, cubre siempre de borde a borde) →
cáusticas y burbujas. Las capas delanteras no tienen bordes duros, así que pueden
rotar sin producir costuras. Las capas de fondo llevan un sangrado del 16 %
vertical y 11 % horizontal, muy por encima del desplazamiento máximo que produce
la rotación.

### Se retira la variante `clip-reveal`

Un `clip-path` que oculta el elemento deja su rectángulo de intersección en cero,
de modo que el `IntersectionObserver` que debía revelarlo no dispara nunca. Los
encabezados de sección quedaban invisibles de forma permanente.

En lugar de sustituir el recorte por una máscara, se retiró la variante: el
barrido línea a línea queda como momento exclusivo del `<h1>` del hero, que no
depende del observador (se dispara al cargar) y resuelve el recorte con
`overflow` en un envoltorio por línea. Los encabezados usan la entrada estándar.
Menos código, sin el fallo, y el efecto del hero gana peso al no repetirse.

### La tarjeta de estadísticas por debajo de 790px

`.reveal.is-visible` fijaba `transform` y anulaba el desplazamiento de −66px con
el que la tarjeta se monta sobre el hero. El reveal se reescribió para componerse
con ese desplazamiento en lugar de perderlo.

Eso destapó un segundo conflicto: por debajo de 790px `styles.css` anula el
desplazamiento (`transform: none`) porque la tarjeta pasa a fluir debajo del
hero, y las reglas de reveal, más específicas, lo pisaban y hacían que la tarjeta
tapase el botón del hero. El bloque que lo restaura va al final de `motion.css` a
propósito, para ganar también cuando coincide con movimiento reducido.
