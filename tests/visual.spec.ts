import { expect, test, type Browser, type Locator, type Page, type TestInfo } from '@playwright/test';
import { record, strictDiff, tolerantDiff } from './support/compare';
import { SIDES, SITES, baseline, designLock, type Side } from './support/env';
import { legacyExpectedChanges } from './support/expected-changes';
import { nextFrames, openPage } from './support/page';

// Design lock: every capture of the new build must match the baseline exactly.
const VIEWPORTS = [360, 390, 768, 1024, 1440];
const SECTIONS: Record<string, string> = {
  hero: '.hero',
  trust: '.trust',
  about: '#about',
  programs: '#programs',
  guide: '#guide',
  moments: '#moments',
  contact: '#contact',
  footer: '.site-footer',
};
const expected = baseline.legacy ? legacyExpectedChanges : { doodleVeins: false, reencodedPhotos: false };

/** Elements whose pixels depend on photo data: the photos and the glass that blurs them. */
const PHOTO_REGIONS = ['.leaf-frame', '.hero-circle', '.float-badge', '.prog-photo', '.tile', '.mohw img'];
/** Largest share of perceptibly different pixels allowed in a re-encoded photo capture. */
const PHOTO_TOLERANCE = 0.02;

/** An element, the whole viewport, or a viewport region (captured without scrolling). */
type Target = Locator | 'viewport' | { x: number; y: number; width: number; height: number };
interface ShotOptions {
  mask?: string[];
  expectChange?: string;
}
type Shoot = (name: string, target: Target, options?: ShotOptions) => Promise<void>;
interface Capture {
  strict: Buffer;
  photo?: Buffer;
  options: ShotOptions;
}

async function capture(page: Page, target: Target, options: ShotOptions): Promise<Capture> {
  // For whole-viewport captures, wait until two consecutive screenshots match:
  // WebKit can paint an icon in a just-revealed menu a frame late. (Element
  // screenshots are taken once; repeating them can scroll the page in WebKit.)
  const take = async (maskSelectors: string[]) => {
    const opts = {
      animations: 'disabled' as const,
      caret: 'hide' as const,
      mask: maskSelectors.map((selector) => page.locator(selector)),
      maskColor: '#ff00ff',
    };
    const shoot = () =>
      target === 'viewport'
        ? page.screenshot(opts)
        : 'screenshot' in target
          ? target.screenshot(opts)
          : page.screenshot({ ...opts, clip: target });
    let previous = await shoot();
    if (target !== 'viewport') return previous;
    for (let attempt = 0; attempt < 10; attempt++) {
      await nextFrames(page);
      const next = await shoot();
      if (next.equals(previous)) return next;
      previous = next;
    }
    throw new Error('The page kept changing between screenshots');
  };
  const mask = options.mask ?? [];
  if (!expected.reencodedPhotos || options.expectChange) return { strict: await take(mask), options };
  return { strict: await take([...PHOTO_REGIONS, ...mask]), photo: await take(mask), options };
}

async function compareSides(
  browser: Browser,
  testInfo: TestInfo,
  viewport: { width: number; height?: number },
  path: string,
  script: (page: Page, shoot: Shoot) => Promise<void>,
) {
  const shots = { baseline: new Map<string, Capture>(), target: new Map<string, Capture>() };
  for (const side of SIDES as Side[]) {
    const { context, page } = await openPage(browser, SITES[side] + path, viewport);
    try {
      await script(page, async (name, target, options = {}) => {
        shots[side].set(name, await capture(page, target, options));
      });
    } finally {
      await context.close();
    }
  }

  const failures: string[] = [];
  for (const [name, base] of shots.baseline) {
    const next = shots.target.get(name)!;
    const common = { project: testInfo.project.name, width: viewport.width, name };
    const change = base.options.expectChange;

    const strict = strictDiff(base.strict, next.strict);
    const strictResult = record(
      {
        ...common,
        mode: 'strict',
        size: strict.size,
        diffPixels: strict.diffPixels,
        total: strict.total,
        sizeMismatch: strict.sizeMismatch,
        expectedChange: change,
      },
      { baseline: base.strict, target: next.strict, diff: strict.diffPng },
      strict.diffPixels !== 0 || Boolean(change),
    );
    if (strict.sizeMismatch) failures.push(`${name}: size ${strict.sizeMismatch}`);
    else if (change && strictResult.diffPixels === 0) failures.push(`${name}: expected change "${change}" not found`);
    else if (!change && strict.diffPixels > 0) failures.push(`${name}: ${strict.diffPixels}px differ`);

    if (base.photo && next.photo) {
      const photo = tolerantDiff(base.photo, next.photo);
      const photoResult = record(
        {
          ...common,
          mode: 'tolerant',
          size: photo.size,
          diffPixels: photo.diffPixels,
          total: photo.total,
          sizeMismatch: photo.sizeMismatch,
        },
        { baseline: base.photo, target: next.photo, diff: photo.diffPng },
        true,
      );
      if (photo.sizeMismatch) failures.push(`${name} (photos): size ${photo.sizeMismatch}`);
      else if (photoResult.ratio > PHOTO_TOLERANCE)
        failures.push(`${name} (photos): ${(photoResult.ratio * 100).toFixed(2)}% perceptibly different`);
    }
  }
  if (designLock === 'report' && failures.length) {
    testInfo.annotations.push({ type: 'design change', description: failures.join('\n') });
    return;
  }
  expect(failures, failures.join('\n')).toEqual([]);
}

for (const width of VIEWPORTS) {
  test.describe(`${width}px`, () => {
    test('index sections', async ({ browser }, testInfo) => {
      await compareSides(browser, testInfo, { width }, '/', async (page, shoot) => {
        for (const [name, selector] of Object.entries(SECTIONS)) {
          const section = page.locator(selector).first();
          await section.scrollIntoViewIfNeeded();
          await nextFrames(page);
          await shoot(name, section);
        }
      });
    });

    test('header after scrolling', async ({ browser }, testInfo) => {
      await compareSides(browser, testInfo, { width }, '/', async (page, shoot) => {
        await page.evaluate(() => window.scrollTo(0, document.getElementById('about')!.offsetTop));
        await expect(page.locator('.site-header')).toHaveClass(/is-scrolled/);
        await expect(page.locator('.site-nav a[href="#about"]')).toHaveClass(/is-active/);
        await nextFrames(page);
        // A viewport region: an element screenshot of the sticky header would scroll the page.
        await shoot('header-scrolled', (await page.locator('.site-header').boundingBox())!);
      });
    });

    if (width < 1024) {
      test('mobile menu open', async ({ browser }, testInfo) => {
        await compareSides(browser, testInfo, { width }, '/', async (page, shoot) => {
          await page.locator('.nav-toggle').click();
          await expect(page.locator('body')).toHaveClass(/menu-open/);
          await page.mouse.move(0, 0);
          await nextFrames(page);
          await shoot('menu-open', 'viewport');
        });
      });
    }

    test('lightbox', async ({ browser }, testInfo) => {
      await compareSides(browser, testInfo, { width }, '/', async (page, shoot) => {
        // Re-encoded thumbnails would show through the blurred backdrop; hide them so the
        // dialog itself (which shows the unchanged full-size photo) is compared exactly.
        if (expected.reencodedPhotos)
          await page.addStyleTag({ content: 'main img { visibility: hidden !important; }' });
        const tile = page.locator('[data-lightbox]').first();
        await tile.scrollIntoViewIfNeeded();
        // Have the full-size photo decoded before the dialog first paints. Whether it
        // arrives before or after that paint changes how Chromium anti-aliases its
        // rounded corners, which would make captures depend on network timing.
        await page.evaluate(
          async (href) => {
            const img = new Image();
            img.src = href;
            await img.decode();
            (window as unknown as { keepAlive: HTMLImageElement }).keepAlive = img;
          },
          (await tile.getAttribute('href'))!,
        );
        await tile.click();
        await expect(page.locator('#lightbox')).toHaveAttribute('open', '');
        await page.locator('#lightbox img').evaluate((img: HTMLImageElement) => img.decode());
        await page.mouse.move(0, 0);
        await nextFrames(page);
        await shoot('lightbox', 'viewport');
      });
    });

    test('hover states', async ({ browser }, testInfo) => {
      // A tall viewport keeps each hovered area on screen so capturing it never scrolls.
      await compareSides(browser, testInfo, { width, height: 2000 }, '/', async (page, shoot) => {
        const states: [string, string, string][] = [
          ['about-hover-card', '.about-grid', '.floor-card[data-room="5"]'],
          ['about-hover-room', '.about-grid', '.room[data-room="6b"]'],
          ['program-hover', '.prog-therapy', '.prog-card--icon'],
          ['tile-hover', '.collage', '.tile.t-vr'],
        ];
        for (const [name, area, hovered] of states) {
          await page.mouse.move(0, 0);
          const region = page.locator(area);
          await region.evaluate((el) => el.scrollIntoView({ block: 'center' }));
          await nextFrames(page);
          await page.locator(hovered).first().hover();
          await nextFrames(page);
          // WebKit may composite a scaled (hovered) tile and paint its photo, or its
          // neighbour's, with different filtering from run to run. The hover itself
          // (scale, shadow, chip) is still compared; only the photo pixels are masked.
          const unstable = name === 'tile-hover' && browser.browserType().name() === 'webkit';
          await shoot(name, region, { mask: unstable ? ['.tile img'] : [] });
        }
      });
    });

    test('404 page', async ({ browser }, testInfo) => {
      await compareSides(browser, testInfo, { width }, '/404.html', async (page, shoot) => {
        const doodleMask = expected.doodleVeins ? ['.nf .doodle'] : [];
        await shoot('404-viewport', 'viewport', { mask: doodleMask });
        await shoot('404-grass', page.locator('.nf-grass'));
        if (expected.doodleVeins) {
          await shoot('404-doodle', page.locator('.nf .doodle'), { expectChange: 'i-doodle leaf veins' });
        }
      });
    });
  });
}
