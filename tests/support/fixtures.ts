import { expect, test as base } from '@playwright/test';
import { routeWebFonts } from './web-fonts';

/** Playwright `test` whose pages never reach the network (web fonts are served locally). */
export const test = base.extend({
  context: async ({ context }, use) => {
    await routeWebFonts(context);
    await use(context);
  },
});

export { expect };
