// Post-build checks on dist/:
// - public URLs that must keep working (OG image, logo, favicons, robots, ...)
// - every internal link, asset reference and #fragment resolves, and every
//   image in _astro/ is used
// - JSON-LD parses
// - no image carries EXIF/XMP metadata (photos show children; GPS must never ship)
// - fonts are self-hosted and the trimmed Pretendard slices cover every character
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, posix, relative } from 'node:path';
import { FACES_PLACEHOLDER, PRELOAD_PLACEHOLDER, renderedCharacters } from '../integrations/pretendard-slices.mjs';

const DIST = 'dist';
const ORIGIN = 'https://ssukssuk.org';
const errors = [];

const REQUIRED = [
  'index.html',
  '404.html',
  'CNAME',
  'robots.txt',
  'sitemap.xml',
  'favicon.ico',
  'assets/img/og-image.jpg',
  'assets/img/logo.svg',
  'assets/img/favicon.svg',
  'assets/img/favicon-32.png',
  'assets/img/apple-touch-icon.png',
];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

for (const file of REQUIRED) {
  if (!existsSync(join(DIST, file))) errors.push(`missing public file /${file}`);
}
if (existsSync(join(DIST, 'CNAME')) && readFileSync(join(DIST, 'CNAME'), 'utf8').trim() !== 'ssukssuk.org') {
  errors.push('CNAME must contain ssukssuk.org');
}

const files = walk(DIST);
const pages = files.filter((file) => file.endsWith('.html'));
const referenced = new Set();
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|avif|gif|svg)$/i;
const idsByPage = new Map();
const idsOf = (page) => {
  if (!idsByPage.has(page)) {
    const html = readFileSync(page, 'utf8');
    idsByPage.set(page, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idsByPage.get(page);
};

function urlsIn(html) {
  const urls = [];
  for (const m of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) urls.push(m[1]);
  for (const m of html.matchAll(/<meta\s[^>]*>/g)) {
    if (/(?:property|name)="(?:og:image|og:url|twitter:image)"/.test(m[0]))
      urls.push(/content="([^"]*)"/.exec(m[0])?.[1]);
  }
  for (const m of html.matchAll(/\s(?:srcset|imagesrcset)="([^"]*)"/g)) {
    for (const candidate of m[1].split(',')) urls.push(candidate.trim().split(/\s+/)[0]);
  }
  for (const m of html.matchAll(/url\(["']?([^"')]+)["']?\)/g)) urls.push(m[1]);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      for (const key of ['url', 'logo', 'image']) if (typeof data[key] === 'string') urls.push(data[key]);
    } catch (error) {
      errors.push(`invalid JSON-LD: ${error.message}`);
    }
  }
  return urls;
}

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const pageUrl = `/${relative(DIST, page).split('\\').join('/')}`;
  for (const raw of urlsIn(html)) {
    if (!raw || /^(tel:|mailto:|data:|javascript:)/.test(raw)) continue;
    let url = raw;
    if (url.startsWith(ORIGIN)) url = url.slice(ORIGIN.length) || '/';
    else if (/^[a-z]+:/i.test(url) || url.startsWith('//')) continue;

    const [pathAndQuery, fragment] = url.split('#');
    const path = pathAndQuery.split('?')[0];
    let target = page;
    if (path) {
      const resolved = path.startsWith('/') ? path : posix.join(posix.dirname(pageUrl), path);
      referenced.add(decodeURIComponent(resolved));
      let file = join(DIST, decodeURIComponent(resolved));
      if (resolved.endsWith('/')) file = join(file, 'index.html');
      if (!existsSync(file) || statSync(file).isDirectory()) {
        errors.push(`${pageUrl}: broken reference ${raw}`);
        continue;
      }
      target = file;
    }
    if (fragment && target.endsWith('.html') && !idsOf(target).has(fragment)) {
      errors.push(`${pageUrl}: missing #${fragment} (${raw})`);
    }
  }
}

// --- unused images ----------------------------------------------------------
// Astro ships an imported image file that no page ends up using (a photo left
// in src/assets after it was removed from the content files, for example).
for (const css of files.filter((file) => file.endsWith('.css'))) {
  for (const m of readFileSync(css, 'utf8').matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    if (m[1].startsWith('/')) referenced.add(m[1]);
  }
}
for (const file of files) {
  const url = `/${relative(DIST, file).split('\\').join('/')}`;
  if (url.startsWith('/_astro/') && IMAGE_EXTENSIONS.test(url) && !referenced.has(url)) {
    errors.push(`${url} is not used by any page (delete its source file from src/assets, or use it)`);
  }
}

// --- image metadata -------------------------------------------------------
const ascii = (buf, start, length) => buf.toString('latin1', start, start + length);

function jpegMetadata(buf) {
  let offset = 2;
  while (offset + 4 <= buf.length && buf[offset] === 0xff) {
    const marker = buf[offset + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const length = buf.readUInt16BE(offset + 2);
    const payload = ascii(buf, offset + 4, Math.min(length - 2, 64));
    if (marker === 0xe1 && payload.startsWith('Exif\0')) return 'EXIF';
    if (marker === 0xe1 && payload.startsWith('http://ns.adobe.com/xap/')) return 'XMP';
    if (marker === 0xed) return 'IPTC/Photoshop';
    offset += 2 + length;
  }
  return null;
}

function pngMetadata(buf) {
  let offset = 8;
  while (offset + 8 <= buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = ascii(buf, offset + 4, 4);
    if (type === 'eXIf') return 'EXIF';
    if (['iTXt', 'tEXt', 'zTXt'].includes(type) && ascii(buf, offset + 8, 17) === 'XML:com.adobe.xmp') return 'XMP';
    offset += 12 + length;
  }
  return null;
}

function webpMetadata(buf) {
  let offset = 12;
  while (offset + 8 <= buf.length) {
    const type = ascii(buf, offset, 4);
    const length = buf.readUInt32LE(offset + 4);
    if (type === 'EXIF') return 'EXIF';
    if (type === 'XMP ') return 'XMP';
    offset += 8 + length + (length % 2);
  }
  return null;
}

function avifMetadata(buf) {
  // EXIF/XMP live in items declared in the leading `meta` box.
  const head = buf.subarray(0, Math.min(buf.length, 4096)).toString('latin1');
  if (/infe[\s\S]{4,12}Exif/.test(head)) return 'EXIF';
  if (head.includes('application/rdf+xml')) return 'XMP';
  return null;
}

const readers = {
  '.jpg': jpegMetadata,
  '.jpeg': jpegMetadata,
  '.png': pngMetadata,
  '.webp': webpMetadata,
  '.avif': avifMetadata,
};
let images = 0;
for (const file of files) {
  const reader = readers[extname(file).toLowerCase()];
  if (!reader) continue;
  images++;
  const found = reader(readFileSync(file));
  if (found) errors.push(`${relative(DIST, file)} contains ${found} metadata`);
}

// --- fonts ----------------------------------------------------------------
// Fonts are self-hosted, and the trimmed Pretendard slices must cover every
// character a page can render (otherwise the 2 MB full font is fetched).
const FONT_HOSTS = /fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net/;
for (const file of files.filter((f) => /\.(html|css|js)$/.test(f))) {
  const text = readFileSync(file, 'utf8');
  if (FONT_HOSTS.test(text)) errors.push(`${relative(DIST, file)} still references a third-party font host`);
  if (text.includes(FACES_PLACEHOLDER) || text.includes(PRELOAD_PLACEHOLDER)) {
    errors.push(`${relative(DIST, file)} has an unfilled Pretendard placeholder`);
  }
}
const parseRange = (range) =>
  range.split(',').map((part) => {
    const [from, to = from] = part.trim().replace(/^U\+/i, '').split('-');
    return [parseInt(from, 16), parseInt(to, 16)];
  });
for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const ranges = [
    ...html.matchAll(/@font-face\{font-family:"Pretendard Variable";[^}]*unicode-range:([^;}]+)/g),
  ].flatMap((m) => parseRange(m[1]));
  if (!ranges.length) errors.push(`${relative(DIST, page)}: no trimmed Pretendard faces`);
  const missing = [...renderedCharacters(html)].filter((char) => {
    const code = char.codePointAt(0);
    return !ranges.some(([from, to]) => code >= from && code <= to);
  });
  if (missing.length) errors.push(`${relative(DIST, page)}: no trimmed Pretendard face covers ${missing.join('')}`);
}

if (errors.length) {
  console.error(`dist check failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`dist check passed: ${pages.length} pages, ${images} images, ${REQUIRED.length} public URLs`);
