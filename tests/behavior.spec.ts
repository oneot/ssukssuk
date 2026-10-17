import type { Page } from '@playwright/test';
import { SIDES, SITES } from './support/env';
import { expect, test } from './support/fixtures';

// Behaviour lock: the same expectations run against the baseline site and the
// new build, so the new code is held to exactly what the old code did.

const scrollTo = (page: Page, top: number) =>
  page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top);

async function openLightbox(page: Page, index: number) {
  const tile = page.locator('[data-lightbox]').nth(index);
  await tile.click();
  await expect(page.locator('#lightbox')).toHaveAttribute('open', '');
  return tile;
}

for (const side of SIDES) {
  test.describe(side, () => {
    test.use({ baseURL: SITES[side] });

    test('header switches to its scrolled style away from the top', async ({ page }) => {
      await page.goto('/');
      const header = page.locator('.site-header');
      await expect(header).not.toHaveClass(/is-scrolled/);
      await scrollTo(page, 400);
      await expect(header).toHaveClass(/is-scrolled/);
      await scrollTo(page, 0);
      await expect(header).not.toHaveClass(/is-scrolled/);
    });

    test.describe('mobile menu', () => {
      test.use({ viewport: { width: 390, height: 844 } });

      test('the toggle opens and closes the menu', async ({ page }) => {
        await page.goto('/');
        const toggle = page.locator('.nav-toggle');
        const nav = page.locator('#site-nav');
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(toggle).toHaveAttribute('aria-label', '메뉴 열기');
        await expect(nav).toBeHidden();

        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(toggle).toHaveAttribute('aria-label', '메뉴 닫기');
        await expect(page.locator('body')).toHaveClass(/menu-open/);
        await expect(nav).toBeVisible();

        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(toggle).toHaveAttribute('aria-label', '메뉴 열기');
        await expect(page.locator('body')).not.toHaveClass(/menu-open/);
      });

      test('Escape closes the menu and returns focus to the toggle', async ({ page }) => {
        await page.goto('/');
        await page.locator('.nav-toggle').click();
        await page.locator('#site-nav a').first().focus();
        await page.keyboard.press('Escape');
        await expect(page.locator('body')).not.toHaveClass(/menu-open/);
        await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-expanded', 'false');
        await expect(page.locator('.nav-toggle')).toBeFocused();
      });

      test('Escape leaves focus alone while the menu is closed', async ({ page }) => {
        await page.goto('/');
        await page.locator('.hero .btn--ghost').focus();
        await page.keyboard.press('Escape');
        await expect(page.locator('.hero .btn--ghost')).toBeFocused();
      });

      test('choosing a menu link closes the menu', async ({ page }) => {
        await page.goto('/');
        await page.locator('.nav-toggle').click();
        await page.locator('#site-nav a[href="#programs"]').click();
        await expect(page.locator('body')).not.toHaveClass(/menu-open/);
        await expect(page).toHaveURL(/#programs$/);
      });

      test('growing to desktop width closes the menu', async ({ page }) => {
        await page.goto('/');
        await page.locator('.nav-toggle').click();
        await expect(page.locator('body')).toHaveClass(/menu-open/);
        await page.setViewportSize({ width: 1280, height: 844 });
        await expect(page.locator('body')).not.toHaveClass(/menu-open/);
        await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-expanded', 'false');
      });
    });

    test.describe('scrollspy', () => {
      test.use({ viewport: { width: 1440, height: 900 } });

      test('marks the menu item of the section in the middle of the screen', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.site-nav a.is-active')).toHaveCount(0);
        for (const id of ['about', 'programs', 'guide', 'moments', 'contact']) {
          await page.evaluate((target) => document.getElementById(target)!.scrollIntoView({ behavior: 'instant' }), id);
          await expect(page.locator(`.site-nav a[href="#${id}"]`)).toHaveClass(/is-active/);
          await expect(page.locator('.site-nav a.is-active')).toHaveCount(1);
        }
      });
    });

    test.describe('reveal on scroll', () => {
      test('content fades in as it reaches the viewport', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('html')).toHaveClass(/\bjs\b/);
        const card = page.locator('.contact-card');
        await expect(card).not.toHaveClass(/is-in/);
        await card.scrollIntoViewIfNeeded();
        await expect(card).toHaveClass(/is-in/);
        await expect(page.locator('.stem')).not.toHaveClass(/is-in/);
      });

      test.describe('with reduced motion', () => {
        test.use({ reducedMotion: 'reduce' });

        test('everything is shown at once', async ({ page }) => {
          await page.goto('/');
          const pending = page.locator('[data-reveal]:not(.is-in)');
          await expect(page.locator('[data-reveal]')).not.toHaveCount(0);
          await expect(pending).toHaveCount(0);
        });
      });
    });

    test.describe('gallery lightbox', () => {
      test('opens the chosen photo with its description, caption and position', async ({ page }) => {
        await page.goto('/');
        const tiles = page.locator('[data-lightbox]');
        await expect(tiles).toHaveCount(6);
        const tile = tiles.nth(1);
        const href = (await tile.getAttribute('href'))!;
        const caption = (await tile.getAttribute('data-caption'))!;
        const alt = (await tile.locator('img').getAttribute('alt'))!;

        await openLightbox(page, 1);
        const dialog = page.locator('#lightbox');
        await expect(dialog.locator('img')).toHaveAttribute('src', href);
        await expect(dialog.locator('img')).toHaveAttribute('alt', alt);
        await expect(dialog.locator('.lb-caption')).toHaveText(caption);
        await expect(dialog.locator('.lb-count')).toHaveText('2 / 6');
      });

      test('arrow keys move between photos and wrap around', async ({ page }) => {
        await page.goto('/');
        await openLightbox(page, 0);
        const count = page.locator('#lightbox .lb-count');
        await expect(count).toHaveText('1 / 6');
        await page.keyboard.press('ArrowRight');
        await expect(count).toHaveText('2 / 6');
        await page.keyboard.press('ArrowLeft');
        await expect(count).toHaveText('1 / 6');
        await page.keyboard.press('ArrowLeft');
        await expect(count).toHaveText('6 / 6');
        await page.keyboard.press('ArrowRight');
        await expect(count).toHaveText('1 / 6');
      });

      test('buttons move between photos; closing returns focus to the photo shown', async ({ page }) => {
        await page.goto('/');
        await openLightbox(page, 2);
        const dialog = page.locator('#lightbox');
        await dialog.locator('.lb-next').click();
        await expect(dialog.locator('.lb-count')).toHaveText('4 / 6');
        await dialog.locator('.lb-prev').click();
        await expect(dialog.locator('.lb-count')).toHaveText('3 / 6');
        await dialog.locator('.lb-next').click();
        await dialog.locator('.lb-close').click();
        await expect(dialog).not.toHaveAttribute('open');
        await expect(page.locator('[data-lightbox]').nth(3)).toBeFocused();
      });

      test('Escape closes and returns focus to the photo shown', async ({ page }) => {
        await page.goto('/');
        await openLightbox(page, 0);
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Escape');
        await expect(page.locator('#lightbox')).not.toHaveAttribute('open');
        await expect(page.locator('[data-lightbox]').nth(2)).toBeFocused();
      });

      test('clicking the backdrop closes the dialog', async ({ page }) => {
        await page.goto('/');
        await openLightbox(page, 4);
        await page.mouse.click(4, 4);
        await expect(page.locator('#lightbox')).not.toHaveAttribute('open');
        await expect(page.locator('[data-lightbox]').nth(4)).toBeFocused();
      });

      test.describe('on a touch screen', () => {
        test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

        test('swiping moves between photos', async ({ page }) => {
          await page.goto('/');
          await openLightbox(page, 0);
          const swipe = (fromX: number, toX: number) =>
            page.evaluate(
              ([start, end]) => {
                const dialog = document.getElementById('lightbox')!;
                // WebKit does not allow constructing Touch objects, so send plain
                // events that carry the touch data the handler reads.
                const fire = (type: string, x: number) => {
                  const event = new Event(type, { bubbles: true });
                  Object.defineProperty(event, 'changedTouches', { value: [{ clientX: x, clientY: 400 }] });
                  dialog.dispatchEvent(event);
                };
                fire('touchstart', start);
                fire('touchend', end);
              },
              [fromX, toX],
            );
          const count = page.locator('#lightbox .lb-count');
          await swipe(300, 100);
          await expect(count).toHaveText('2 / 6');
          await swipe(100, 300);
          await expect(count).toHaveText('1 / 6');
          await swipe(200, 170);
          await expect(count).toHaveText('1 / 6');
        });
      });
    });

    test.describe('without JavaScript', () => {
      test.use({ javaScriptEnabled: false });

      test('gallery photos are plain links to the full image', async ({ page }) => {
        await page.goto('/');
        const tile = page.locator('[data-lightbox]').first();
        const url = new URL((await tile.getAttribute('href'))!, page.url()).href;
        const response = await page.request.get(url);
        expect(response.ok()).toBe(true);
        expect(response.headers()['content-type']).toMatch(/^image\//);
        await tile.click();
        await expect(page).toHaveURL(url);
      });

      test('content stays visible without the reveal script', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('html')).not.toHaveClass(/\bjs\b/);
        const opacity = await page.locator('.contact-card').evaluate((el) => getComputedStyle(el).opacity);
        expect(opacity).toBe('1');
      });
    });
  });
}
