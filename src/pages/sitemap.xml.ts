import { execFileSync } from 'node:child_process';
import type { APIRoute } from 'astro';

// Every page except the 404 page, discovered from src/pages.
const pages = Object.keys(import.meta.glob('./**/*.astro'))
  .filter((path) => !path.endsWith('/404.astro'))
  .map((path) =>
    path
      .replace(/^\.\//, '')
      .replace(/(^|\/)index\.astro$/, '$1')
      .replace(/\.astro$/, '/'),
  );

/** Date of the latest commit, so lastmod follows content changes rather than build time. */
function lastModified(): string | undefined {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs'], { encoding: 'utf8' }).trim() || undefined;
  } catch {
    return undefined;
  }
}

export const GET: APIRoute = ({ site }) => {
  const lastmod = lastModified();
  const urls = pages
    .map((path) => new URL(path, site).href)
    .map((loc) => `  <url>\n    <loc>${loc}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}  </url>`);
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
