// Self-hosted Pretendard, trimmed to the characters the site actually uses.
//
// The CDN stylesheet this replaces splits Pretendard Variable 1.3.9 into 92
// slices, each its own @font-face with a unicode-range. Kerning only applies
// between characters of the same slice, so merging the used characters into
// one file would move glyphs. Instead, each slice that the pages use is
// trimmed to the characters found on them and declared with the same family
// name, weight range and font-display, keeping the slice boundaries (and the
// rendering) exactly as before. The full font is declared first as the
// fallback for any character outside the trimmed files.
//
// Small text is rasterised with font-wide parameters measured from reference
// glyphs: macOS (CoreText, in both Chromium and WebKit) looks up the glyphs
// named "X" and "o", and FreeType's autohinter reads Latin letters through
// the cmap. So the Latin slice always keeps all printable ASCII, and the
// trimmed files keep their glyph names (HarfBuzz would otherwise write a
// format 3 `post` table); without either, text below ~20px renders
// differently from the CDN files.
//
// The layout emits placeholders; after the build this integration reads every
// page, writes the trimmed slices, and fills the placeholders in.
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

export const FACES_PLACEHOLDER = '/*__PRETENDARD_SLICES__*/';
export const PRELOAD_PLACEHOLDER = '__PRETENDARD_PRELOAD__';

const PRETENDARD = fileURLToPath(new URL('../node_modules/pretendard/dist/web/variable/', import.meta.url));

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' };
const decode = (text) =>
  text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    if (code[0] !== '#') return ENTITIES[code.toLowerCase()] ?? match;
    return String.fromCodePoint(
      code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : Number(code.slice(1)),
    );
  });

/**
 * Characters a page can render: body text, image alt text and lightbox captions
 * (`attributes: false` leaves out the last two, which only show on demand).
 * Printable ASCII is always included, for script-made text such as "2 / 6" and
 * for the Latin reference glyphs described at the top of this file.
 */
export function renderedCharacters(html, { attributes = true } = {}) {
  const body = html.slice(html.indexOf('<body')).replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '');
  const shownOnDemand = attributes ? [...body.matchAll(/\s(?:alt|data-caption)="([^"]*)"/g)].map((m) => m[1]) : [];
  const text = decode(body.replace(/<[^>]*>/g, '')) + decode(shownOnDemand.join(''));
  const chars = new Set([...text].filter((char) => char.codePointAt(0) >= 0x20));
  for (let code = 0x20; code < 0x7f; code++) chars.add(String.fromCharCode(code));
  return chars;
}

/** [0x20, 0x21, 0xac00] → "U+20-21, U+AC00" */
export function toUnicodeRange(codePoints) {
  const sorted = [...new Set(codePoints)].sort((a, b) => a - b);
  const ranges = [];
  for (const code of sorted) {
    const last = ranges.at(-1);
    if (last && code === last[1] + 1) last[1] = code;
    else ranges.push([code, code]);
  }
  const hex = (code) => code.toString(16).toUpperCase();
  return ranges.map(([start, end]) => (start === end ? `U+${hex(start)}` : `U+${hex(start)}-${hex(end)}`)).join(', ');
}

/** The CDN's slices in stylesheet order: [{ file, ranges: [[from, to], …] }] */
async function readSlices() {
  const css = await readFile(join(PRETENDARD, 'pretendardvariable-dynamic-subset.css'), 'utf8');
  return [...css.matchAll(/url\(\.\/(woff2-dynamic-subset\/[^)]+\.woff2)\)[^}]*?unicode-range:\s*([^;}]+)/g)].map(
    ([, file, range]) => ({
      file,
      ranges: range.split(',').map((part) => {
        const [from, to = from] = part.trim().replace(/^U\+/i, '').split('-');
        return [parseInt(from, 16), parseInt(to, 16)];
      }),
    }),
  );
}

export default function pretendardSlices() {
  return {
    name: 'pretendard-slices',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const pages = (await readdir(root, { recursive: true })).filter((file) => file.endsWith('.html'));
        const htmls = await Promise.all(pages.map((file) => readFile(join(root, file), 'utf8')));

        const chars = new Set(htmls.flatMap((html) => [...renderedCharacters(html)]));

        // Like the browser, the last declared slice whose range holds a character renders it.
        const slices = (await readSlices()).reverse();
        const used = new Map();
        for (const char of chars) {
          const code = char.codePointAt(0);
          const slice = slices.find(({ ranges }) => ranges.some(([from, to]) => code >= from && code <= to));
          if (slice) used.set(slice, [...(used.get(slice) ?? []), char]);
        }

        const faces = [];
        let bytes = 0;
        // Back to stylesheet order so the trimmed faces are declared in the CDN's order.
        for (const slice of [...used.keys()].reverse()) {
          const sliceChars = used.get(slice);
          const font = await subsetFont(await readFile(join(PRETENDARD, slice.file)), sliceChars.join(''), {
            targetFormat: 'woff2',
            glyphNames: true,
          });
          const number = /subset\.(\d+)\./.exec(slice.file)[1];
          const hash = createHash('sha256').update(font).digest('base64url').slice(0, 8);
          const url = `/_astro/pretendard-${number}.${hash}.woff2`;
          await writeFile(join(root, url), font);
          bytes += font.length;
          faces.push({
            url,
            chars: sliceChars,
            range: toUnicodeRange(sliceChars.map((char) => char.codePointAt(0))),
          });
        }

        const css = faces
          .map(
            ({ url, range }) =>
              `@font-face{font-family:"Pretendard Variable";font-style:normal;font-weight:45 920;font-display:swap;src:url(${url}) format("woff2-variations");unicode-range:${range}}`,
          )
          .join('');
        // Each page preloads only the slices its visible text needs.
        const preloads = (html) => {
          const chars = renderedCharacters(html, { attributes: false });
          return faces
            .filter((face) => face.chars.some((char) => chars.has(char)))
            .map(({ url }) => `<link rel="preload" href="${url}" as="font" type="font/woff2" crossorigin>`)
            .join('');
        };
        const preloadTag = new RegExp(`<link[^>]*${PRELOAD_PLACEHOLDER}[^>]*>`);

        await Promise.all(
          pages.map((page, i) => {
            if (!htmls[i].includes(FACES_PLACEHOLDER) || !preloadTag.test(htmls[i])) {
              throw new Error(`${page}: Pretendard placeholders not found`);
            }
            const html = htmls[i].replace(FACES_PLACEHOLDER, css).replace(preloadTag, preloads(htmls[i]));
            return writeFile(join(root, page), html);
          }),
        );
        logger.info(
          `Pretendard: ${chars.size} characters in ${faces.length} trimmed slices, ${(bytes / 1024).toFixed(1)} KiB`,
        );
      },
    },
  };
}
