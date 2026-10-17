// Post-build checks on dist/:
// - public URLs that must keep working (OG image, logo, favicons, robots, ...)
// - every internal link, asset reference and #fragment resolves
// - JSON-LD parses
// - no image carries EXIF/XMP metadata (photos show children; GPS must never ship)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, posix, relative } from 'node:path';

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

if (errors.length) {
  console.error(`dist check failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`dist check passed: ${pages.length} pages, ${images} images, ${REQUIRED.length} public URLs`);
