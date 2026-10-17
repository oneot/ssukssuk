// Minimal static file server that mimics GitHub Pages: directory index,
// 404.html with a 404 status for unknown paths. Used by tests and previews.
//
// Usage: node scripts/serve.mjs <root-dir> <port>
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const [rootArg, portArg] = process.argv.slice(2);
if (!rootArg || !portArg) {
  console.error('Usage: node scripts/serve.mjs <root-dir> <port>');
  process.exit(1);
}
const root = resolve(rootArg);

async function findFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const candidate = normalize(join(root, decoded));
  if (candidate !== root && !candidate.startsWith(root + sep)) return null;
  try {
    const info = await stat(candidate);
    if (info.isFile()) return candidate;
    if (info.isDirectory()) {
      const index = join(candidate, 'index.html');
      if ((await stat(index)).isFile()) return index;
    }
  } catch {
    // Fall through to a 404.
  }
  return null;
}

function send(res, status, file) {
  res.writeHead(status, {
    'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(res);
}

createServer(async (req, res) => {
  const file = await findFile(req.url ?? '/');
  if (file) return send(res, 200, file);
  const notFound = join(root, '404.html');
  try {
    await stat(notFound);
    send(res, 404, notFound);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
  }
}).listen(Number(portArg), '127.0.0.1', () => {
  console.log(`Serving ${root} at http://127.0.0.1:${portArg}/`);
});
