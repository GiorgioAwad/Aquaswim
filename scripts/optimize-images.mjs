import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const asset = (name) => fileURLToPath(new URL(`../assets/${name}`, import.meta.url));

const images = [
  ['hero-swimmer.png', 'hero-swimmer.webp', 1920],
  ['program-kids.png', 'program-kids.webp', 720],
  ['program-adults.png', 'program-adults.webp', 720],
  ['program-artistic.png', 'program-artistic.webp', 720],
  ['program-rehab.png', 'program-rehab.webp', 720],
  ['coach.png', 'coach.webp', 820],
  ['pool.png', 'pool.webp', 1920]
];

/*
  Las fuentes son opcionales: assets/ publica los .webp y los originales
  pueden no estar en el repositorio. Lo que no exista se conserva como está.
*/
const pending = images.filter(([input]) => existsSync(asset(input)));

await Promise.all(pending.map(([input, output, width]) =>
  sharp(asset(input))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
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
