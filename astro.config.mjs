// @ts-check
import { defineConfig } from 'astro/config';
import browserslist from 'browserslist';
import { browserslistToTargets } from 'lightningcss';

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
  // Whitespace follows JSX rules (Astro 7's default, also what prettier-plugin-astro
  // formats for): line breaks next to tags are dropped, spaces within a line are
  // kept, and {' '} keeps a space that a line break would otherwise remove.
  compressHTML: 'jsx',
  // Component-scoped styles must not out-rank the global stylesheet (no +1 specificity).
  scopedStyleStrategy: 'where',
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
