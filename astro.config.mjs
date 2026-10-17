// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ssukssuk.org',
  // Whitespace follows JSX rules (Astro 7's default, also what prettier-plugin-astro
  // formats for): line breaks next to tags are dropped, spaces within a line are
  // kept, and {' '} keeps a space that a line break would otherwise remove.
  compressHTML: 'jsx',
  // Component-scoped styles must not out-rank the global stylesheet (no +1 specificity).
  scopedStyleStrategy: 'where',
  build: {
    // Always link stylesheets: Astro emits inlined <style> before linked ones,
    // which would reverse the cascade order between small and large files.
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // Phase 2 ships the original stylesheet untouched.
      cssMinify: false,
    },
  },
});
