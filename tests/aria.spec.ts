import { SITES, designLock, type Side } from './support/env';
import { expect, test } from './support/fixtures';

// Design lock for assistive technology: the accessibility tree (roles, names,
// text, link targets) must match the baseline, like the pixels do.
const PAGES = [
  { name: 'home, desktop', path: '/', viewport: { width: 1440, height: 900 } },
  { name: 'home, mobile', path: '/', viewport: { width: 390, height: 844 } },
  { name: '404', path: '/404.html', viewport: { width: 390, height: 844 } },
];

test.use({ reducedMotion: 'reduce' });

// Asset URLs may change (hashed, re-encoded files); everything else in the
// accessibility tree, including link targets, must stay the same.
const normalise = (snapshot: string) => snapshot.replace(/(\/url: )\S+\.(?:webp|avif|jpe?g|png|svg)\b/g, '$1<image>');

for (const { name, path, viewport } of PAGES) {
  test(`accessibility tree matches the baseline: ${name}`, async ({ page }, testInfo) => {
    const snapshots: Partial<Record<Side, string>> = {};
    for (const side of ['baseline', 'target'] as const) {
      await page.setViewportSize(viewport);
      await page.goto(SITES[side] + path);
      snapshots[side] = normalise(await page.locator('body').ariaSnapshot());
    }
    if (designLock === 'report' && snapshots.target !== snapshots.baseline) {
      testInfo.annotations.push({ type: 'design change', description: 'accessibility tree differs from the baseline' });
      return;
    }
    expect(snapshots.target).toBe(snapshots.baseline);
  });
}
