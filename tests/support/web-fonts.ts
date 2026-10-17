import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BrowserContext } from '@playwright/test';

// Tests never reach the network. Web-font requests made by the legacy pages are
// answered with byte-identical local copies:
// - Pretendard: npm `pretendard@1.3.9` ships the same dynamic-subset CSS rules
//   and woff2 files that jsDelivr serves for gh/orioncactus/pretendard@v1.3.9.
// - Geist Mono / Instrument Serif: the files Google Fonts serves to iOS,
//   Android and macOS (see scripts/vendor-google-fonts.mjs). Without this, CI
//   on Linux would receive hinted or TTF variants that visitors never see.
const GOOGLE_DIR = 'tests/fixtures/google-fonts';
const PRETENDARD_DIR = 'node_modules/pretendard/dist/web/variable';
const JSDELIVR_PRETENDARD = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/';

const google: { css: string; files: Record<string, string> } = JSON.parse(
  readFileSync(join(GOOGLE_DIR, 'manifest.json'), 'utf8'),
);
const CORS = { 'access-control-allow-origin': '*' };

export async function routeWebFonts(context: BrowserContext): Promise<void> {
  await context.route(/^https?:\/\/(?!127\.0\.0\.1[:/])/, async (route) => {
    const url = route.request().url();

    if (url.startsWith('https://fonts.googleapis.com/css2?')) {
      return route.fulfill({
        headers: { ...CORS, 'content-type': 'text/css; charset=utf-8' },
        body: readFileSync(join(GOOGLE_DIR, 'google-fonts.css')),
      });
    }
    const googleFile = google.files[url];
    if (googleFile) {
      return route.fulfill({
        headers: { ...CORS, 'content-type': 'font/woff2' },
        body: readFileSync(join(GOOGLE_DIR, googleFile)),
      });
    }
    if (url.startsWith(JSDELIVR_PRETENDARD)) {
      const path = url.slice(JSDELIVR_PRETENDARD.length);
      if (path === 'pretendardvariable-dynamic-subset.min.css') {
        return route.fulfill({
          headers: { ...CORS, 'content-type': 'text/css; charset=utf-8' },
          body: readFileSync(join(PRETENDARD_DIR, 'pretendardvariable-dynamic-subset.css')),
        });
      }
      if (/^woff2-dynamic-subset\/PretendardVariable\.subset\.\d+\.woff2$/.test(path)) {
        return route.fulfill({
          headers: { ...CORS, 'content-type': 'font/woff2' },
          body: readFileSync(join(PRETENDARD_DIR, path)),
        });
      }
    }
    return route.abort('blockedbyclient');
  });
}
