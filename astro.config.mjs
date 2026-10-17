// @ts-check
import { defineConfig } from 'astro/config';
import browserslist from 'browserslist';
import { browserslistToTargets } from 'lightningcss';
import pretendardSlices from './integrations/pretendard-slices.mjs';

// .browserslistrc drives both Lightning CSS steps: transforming the source
// (nesting, vendor prefixes) and minifying the bundle. Vite's minify step
// reads esbuild-style targets, so the same list is converted for it.
const targets = browserslistToTargets(browserslist());
const esbuildNames = { chrome: 'chrome', edge: 'edge', firefox: 'firefox', ios_saf: 'ios', safari: 'safari' };
const cssTarget = Object.entries(targets).flatMap(([browser, version]) =>
  browser in esbuildNames
    ? [`${esbuildNames[/** @type {keyof typeof esbuildNames} */ (browser)]}${version >> 16}.${(version >> 8) & 0xff}`]
    : [],
);

export default defineConfig({
  site: 'https://ssukssuk.org',
  integrations: [pretendardSlices()],
  // Whitespace follows JSX rules (Astro 7's default, also what prettier-plugin-astro
  // formats for): line breaks next to tags are dropped, spaces within a line are
  // kept, and {' '} keeps a space that a line break would otherwise remove.
  compressHTML: 'jsx',
  // Component-scoped styles must not out-rank the global stylesheet (no +1 specificity).
  scopedStyleStrategy: 'where',
  // Photo encoding. AVIF q60 rather than sharp's default 50: in the design-lock
  // comparison against the old WebP files, q50 → q70 barely changed the result
  // (the remaining differences come from resizing), so q60 buys some headroom
  // for detail at a modest size cost. WebP is the fallback for Safari 15.
  // Transformed images are cached in node_modules/.astro; clear it after changing these.
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        avif: { quality: 60 },
        webp: { quality: 80 },
      },
    },
  },
  build: {
    // Always link stylesheets: Astro emits inlined <style> before linked ones.
    inlineStylesheets: 'never',
  },
  vite: {
    css: {
      transformer: 'lightningcss',
      lightningcss: { targets },
    },
    build: {
      cssMinify: 'lightningcss',
      cssTarget,
    },
  },
});
