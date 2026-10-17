/**
 * Photos: one file per photo in src/assets/photos, at the largest size there
 * is. Content files refer to a photo by its file name (e.g. `horse.webp`).
 *
 * The build makes AVIF and WebP copies at the widths each spot needs, without
 * camera metadata (location included). The lightbox opens a 1440px WebP: the
 * file itself when it already is a clean one, otherwise a converted copy.
 */
import type { ImageMetadata, ImageOutputFormat } from 'astro';
import { getImage } from 'astro:assets';
import sharp from 'sharp';

const files = import.meta.glob<ImageMetadata>('../assets/photos/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
});
const photos = new Map(Object.entries(files).map(([path, image]) => [path.split('/').pop()!, image]));

export const photoNames = [...photos.keys()] as [string, ...string[]];

export function photo(name: string): ImageMetadata {
  const image = photos.get(name);
  if (!image) throw new Error(`Unknown photo "${name}" (expected a file in src/assets/photos)`);
  return image;
}

/** Widths made for photos shown across the page (programs, gallery). */
export const PHOTO_WIDTHS = [360, 540, 720, 1080, 1440];

/** Options shared by every responsive photo: AVIF first, WebP for older Safari. */
export const pictureFormats: { formats: ImageOutputFormat[]; fallbackFormat: ImageOutputFormat } = {
  formats: ['avif'],
  fallbackFormat: 'webp',
};

const LIGHTBOX_WIDTH = 1440;

/** The full-size photo the gallery opens (also the link target without JavaScript). */
export async function lightboxPhoto(image: ImageMetadata): Promise<string> {
  // Inspect the file itself: reading the imported image's fields would make
  // Astro ship the original file even when only a converted copy is used.
  const file = (image as ImageMetadata & { fsPath: string }).fsPath;
  const { format, width = 0, exif, xmp, iptc } = await sharp(file).metadata();
  if (format === 'webp' && width <= LIGHTBOX_WIDTH && !exif && !xmp && !iptc) return image.src;
  const { src } = await getImage({ src: image, width: Math.min(width, LIGHTBOX_WIDTH), format: 'webp' });
  return src;
}

/** The hero photo, shared by its <picture> and the preload hint in the page head. */
export const hero = {
  image: photo('hero-outdoor.jpg'),
  widths: [360, 540, 720, 900, 1080],
  sizes: '(min-width: 1024px) 500px, (min-width: 768px) 440px, 72vw',
};

/** The hero's preload hint: the AVIF copies the <picture> offers first. */
export async function heroPreload() {
  const avif = await getImage({ src: hero.image, widths: hero.widths, sizes: hero.sizes, format: 'avif' });
  return { href: avif.src, srcset: avif.srcSet.attribute, sizes: hero.sizes };
}
