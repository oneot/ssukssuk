// Makes src/assets/photos/hero-circle.webp, the small round photo in the hero.
//
// The circle used to show the whole 800px horse photo, cropped by the browser
// with `object-fit: cover; object-position: 42% 50%`. This cuts out exactly
// that square once, so visitors download only the part they see.
//
// Usage: node scripts/make-hero-circle.mjs   (after replacing horse.webp)
import sharp from 'sharp';

const SOURCE = 'src/assets/photos/horse.webp';
const OUTPUT = 'src/assets/photos/hero-circle.webp';
const POSITION = { x: 0.42, y: 0.5 };
// Twice the largest circle (about 170px wide on desktop) plus room for 3x screens.
const SIZE = 540;

const { width, height } = await sharp(SOURCE).metadata();
const side = Math.min(width, height);
await sharp(SOURCE)
  .extract({
    left: Math.round((width - side) * POSITION.x),
    top: Math.round((height - side) * POSITION.y),
    width: side,
    height: side,
  })
  .resize(SIZE, SIZE, { kernel: 'lanczos3' })
  // High quality: this is a source file; the build makes the compressed copies.
  .webp({ quality: 95 })
  .toFile(OUTPUT);
console.log(`${OUTPUT}: ${SIZE}x${SIZE} from ${SOURCE} (${width}x${height})`);
