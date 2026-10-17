// Phase 1 build: publish the hand-written static site unchanged so the
// GitHub Actions deploy pipeline and the test harness can be put in place
// before the Astro migration.
import { cpSync, rmSync } from 'node:fs';

const FILES = ['index.html', '404.html', 'assets', 'favicon.ico', 'robots.txt', 'sitemap.xml', 'CNAME'];

rmSync('dist', { recursive: true, force: true });
for (const file of FILES) cpSync(file, `dist/${file}`, { recursive: true });
console.log(`Copied ${FILES.length} entries to dist/`);
