# Movimiento en plano

Fecha: 2026-08-21
Estado: implementado
Sustituye la parte de interacción de puntero de
`2026-08-18-landing-motion-3d-design.md`. El resto de ese diseño —reveal,
parallax del héroe, cáusticas y burbujas— sigue vigente.

## Problema

Las tarjetas giraban siguiendo el cursor. `motion.js` escribía la posición
relativa del puntero en `--tx/--ty` y el CSS la convertía en `rotateX` y
`rotateY` de hasta 6°, con el icono, el texto y el botón despegándose en Z y un
reflejo especular persiguiendo al cursor. El efecto se leía como un giro de la
tarjeta, no como una respuesta al hover.

Valores, identidad, pilares y enlaces de recursos no giraban, pero se acercaban
al espectador con `translateZ` bajo una perspectiva, y ese acercamiento también
deforma la tarjeta.

## Decisión

Todo el movimiento de tarjetas ocurre en el plano. Se conserva y se refuerza la
entrada al hacer scroll, que es lo que da vida a la página al recorrerla.

## Diseño

### Hover

Elevación de 10 px, zoom lento de la foto, borde turquesa, sombra profunda y un
barrido diagonal que cruza la tarjeta una sola vez, con el mismo recurso que ya
usaban los botones. El icono escala y el bloque de texto sube 4 px.

En valores e identidad, cada `translateZ` pasa a `translateY`; en pilares, a
`translateX`, y el icono deja de rotar 8° para solo escalar.

Desaparece `initCardTilt` de `motion.js`: 48 líneas, un listener de
`pointermove`, el cacheo de rectángulos y cuatro custom properties. Las
tarjetas ya no llevan JavaScript.

### Entrada al hacer scroll

La variante `depth-in` era 3D: entraba rotada 7° y 90 px hundida. La sustituye
`rise-in`, que sube 40 px sin rotación — un recorrido más largo que el reveal
genérico, para que la entrada se note más, no menos.

### La transición vive en el estado revelado

`rise-in` no surtía efecto hasta corregir esto. `.reveal` declaraba la
transición en el **estado oculto**, así que la variante que `motion.js` asigna
después del primer pintado (28 px → 40 px) se convertía ella misma en una
animación pendiente que no llegaba a asentarse: la entrada arrancaba desde el
valor equivocado.

La transición pasa a `.reveal.is-visible`, en `styles.css` y en `motion.css`.
El estado oculto queda estático y la entrada sigue animándose, porque una
transición usa las propiedades del estilo posterior al cambio.

Las tarjetas que llevan a la vez `.reveal` y hover propio necesitan repetir
`.is-visible` en su selector de transición: `.reveal.is-visible` empata en
especificidad, y sin esa repetición el hover heredaría los 700 ms de la entrada
y se arrastraría.

## Verificación

`scripts/visual-check.mjs` comprueba, tras pasar el cursor por una tarjeta de
programa, de valores, de identidad y de video, que su `transform` calculado no
sea una matriz 3D con rotación o profundidad, y que no sea `none` — una tarjeta
que no responde al hover también es un fallo.

La comprobación desactiva `prefers-reduced-motion` mientras mide y lo repone
después: el arnés corre con movimiento reducido, y ahí la página suprime los
transforms a propósito.
