/**
 * Phase-2 photo registry: the photos are still the hand-made WebP files in
 * public/assets/img/photos (800px and 1440px wide). Content files refer to a
 * photo by name (e.g. `horse.webp`).
 */
const legacyPhotos = {
  'music.webp': { width: 800, height: 600 },
  'horse.webp': { width: 800, height: 600 },
  'party.webp': { width: 800, height: 451 },
  'vr.webp': { width: 800, height: 600 },
  'simulator.webp': { width: 800, height: 600 },
  'digital.webp': { width: 800, height: 600 },
} as const;

export type PhotoName = keyof typeof legacyPhotos;
export const photoNames = Object.keys(legacyPhotos) as [PhotoName, ...PhotoName[]];

export function photo(name: PhotoName) {
  const stem = name.replace(/\.webp$/, '');
  return {
    ...legacyPhotos[name],
    small: `/assets/img/photos/${stem}-800.webp`,
    large: `/assets/img/photos/${stem}-1440.webp`,
  };
}
