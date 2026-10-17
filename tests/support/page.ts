import type { Browser, BrowserContextOptions, Page } from '@playwright/test';
import { routeWebFonts } from './web-fonts';

/**
 * Opens a page the way the design-lock harness was validated to be
 * deterministic: reduced motion, every image loaded eagerly and decoded
 * synchronously, and web fonts settled before anything is captured.
 */
export async function openPage(
  browser: Browser,
  url: string,
  { width, height = 900, ...options }: { width: number; height?: number } & BrowserContextOptions,
) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    ...options,
  });
  await routeWebFonts(context);
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  // Scrolling is not visual, but a smooth scroll still running when a capture is
  // taken moves the content. WebKit can keep `scroll-behavior: smooth` under load.
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
  if (browser.browserType().name() === 'webkit') {
    // WebKit paints a scaled image at low quality when it was painted at another
    // size in the last 500ms and repaints it sharply later, so a capture can land
    // on either. `optimizeQuality` opts out of that heuristic (always the settled,
    // sharp result that visitors end up seeing).
    await page.addStyleTag({ content: 'img { image-rendering: optimizeQuality !important; }' });
  }
  await page.mouse.move(0, 0);
  await settle(page);
  return { context, page };
}

export async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const images = [...document.images];
    for (const img of images) {
      img.loading = 'eager';
      img.decoding = 'sync';
    }
    await Promise.all(
      images.map((img) =>
        (img.complete
          ? img.decode()
          : new Promise((resolve) => {
              img.onload = img.onerror = resolve;
            })
        ).catch(() => {}),
      ),
    );
    await document.fonts.ready;
  });
  await nextFrames(page);
}

export function nextFrames(page: Page): Promise<void> {
  return page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
}
