/**
 * @font-face rules for Geist Mono and Instrument Serif, served from this site.
 *
 * They are Google Fonts' own rules and files, recorded by
 * scripts/vendor-google-fonts.mjs: the CSS Google sends to iOS, Android and
 * macOS browsers (same unicode-range subsets, weights and font-display), with
 * each fonts.gstatic.com URL pointing at the identical local file instead.
 */
import manifest from '../assets/fonts/google/manifest.json';
import css from '../assets/fonts/google/google-fonts.css?raw';

const files = import.meta.glob<string>('../assets/fonts/google/*.woff2', {
  eager: true,
  query: '?url',
  import: 'default',
});
const localUrl = Object.fromEntries(Object.entries(files).map(([path, url]) => [path.split('/').pop()!, url]));
const remoteToFile: Record<string, string> = manifest.files;

export const googleFontFaces = css
  .replace(/\/\*[^*]*\*\//g, '')
  .replace(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g, (_, remote: string) => {
    const url = localUrl[remoteToFile[remote]];
    if (!url) throw new Error(`No local copy of ${remote}. Run scripts/vendor-google-fonts.mjs.`);
    return `url(${url})`;
  })
  .replace(/\s+/g, ' ')
  .trim();
