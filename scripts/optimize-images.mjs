import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const asset = (name) => fileURLToPath(new URL(`../assets/${name}`, import.meta.url));

/*
  cropTop (fracción de la altura) sube al deportista en las tarjetas de
  programas: la mitad inferior de la tarjeta queda tapada por el icono y el
  texto. Los fondos grandes (method: portada y metodología; pool: sede) van
  detrás de degradados oscuros, así que toleran menos ancho y calidad.
*/
const images = [
  { name: 'program-kids', width: 720, cropTop: 0.22 },
  { name: 'program-adults', width: 720, cropTop: 0.26 },
  { name: 'program-artistic', width: 720 },
  { name: 'program-multifunctional', width: 720, cropTop: 0.35 },
  { name: 'program-rehab', width: 720, cropTop: 0.15 },
  { name: 'team', width: 820 },
  { name: 'method', width: 1600, quality: 72 },
  { name: 'pool', width: 1600, quality: 72 }
];

/*
  Las fuentes son opcionales: assets/ publica los .webp y los originales
  (assets/<nombre>.png|jpg|jpeg) pueden no estar en el repositorio. Lo que
  no exista se conserva como está.
*/
const pending = images
  .map(({ name, width, cropTop = 0, quality = 82 }) => ({
    output: `${name}.webp`,
    width,
    cropTop,
    quality,
    source: ['png', 'jpg', 'jpeg'].map((ext) => asset(`${name}.${ext}`)).find(existsSync)
  }))
  .filter(({ source }) => source);

const cropFromTop = async (source, fraction) => {
  const image = sharp(source).rotate();
  if (!fraction) return image;
  const { info } = await image.clone().raw().toBuffer({ resolveWithObject: true });
  const top = Math.round(info.height * fraction);
  return image.extract({ left: 0, top, width: info.width, height: info.height - top });
};

await Promise.all(pending.map(async ({ source, output, width, cropTop, quality }) =>
  (await cropFromTop(source, cropTop))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 5 })
    .toFile(asset(output))
));

/*
  Miniaturas de la galería de reels. Se recortan a 9:16, el formato de la
  tarjeta. La fuente es opcional: si assets/reel-N.(png|jpg|jpeg) no existe,
  se conserva el .webp que ya esté publicado.
*/
const reelSources = [1, 2, 3, 4, 5, 6]
  .map((index) => ({
    index,
    source: ['png', 'jpg', 'jpeg'].map((ext) => asset(`reel-${index}.${ext}`)).find(existsSync)
  }))
  .filter(({ source }) => source);

await Promise.all(reelSources.map(({ index, source }) =>
  sharp(source)
    .resize({ width: 450, height: 800, fit: 'cover', position: 'centre' })
    .sharpen({ sigma: 0.8 })
    .webp({ quality: 80, effort: 5 })
    .toFile(asset(`reel-${index}.webp`))
));

console.log(`Optimized ${pending.length} images and ${reelSources.length} reel posters.`);
