// Downloads the Geist Mono / Instrument Serif files that Google Fonts serves to
// iOS, Android and macOS browsers (unhinted woff2) and records the original CSS.
// Linux/Windows Chrome get hinted files and Linux WebKit gets TTFs, so we pin
// the user agent to keep the exact binaries most visitors already render.
//
// Usage: node scripts/vendor-google-fonts.mjs <out-dir>
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&family=Instrument+Serif:ital@1&display=swap';
const USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

const outDir = process.argv[2];
if (!outDir) {
  console.error('Usage: node scripts/vendor-google-fonts.mjs <out-dir>');
  process.exit(1);
}

const css = await (await fetch(CSS_URL, { headers: { 'user-agent': USER_AGENT } })).text();
const blocks = [...css.matchAll(/\/\* ([\w-]+) \*\/\s*@font-face \{([^}]+)\}/g)];
if (!blocks.length) throw new Error('No @font-face blocks found');

const files = {};
for (const [, subset, body] of blocks) {
  const family = /font-family: '([^']+)'/.exec(body)[1];
  const style = /font-style: (\w+)/.exec(body)[1];
  const url = /url\((https:[^)]+)\)/.exec(body)[1];
  const name = [family.toLowerCase().replace(/\s+/g, '-'), style === 'italic' ? 'italic' : '', subset]
    .filter(Boolean)
    .join('-');
  files[url] = `${name}.woff2`;
}

await mkdir(outDir, { recursive: true });
for (const [url, file] of Object.entries(files)) {
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await writeFile(join(outDir, file), Buffer.from(await res.arrayBuffer()));
}
await writeFile(join(outDir, 'google-fonts.css'), css);
await writeFile(join(outDir, 'manifest.json'), `${JSON.stringify({ css: CSS_URL, files }, null, 2)}\n`);
console.log(`Saved ${Object.keys(files).length} files to ${outDir}`);
