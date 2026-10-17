import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { SITES, type Side } from './support/env';
import { expect, test } from './support/fixtures';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

interface State {
  name: string;
  path: string;
  viewport: { width: number; height: number };
  prepare?: (page: Page) => Promise<void>;
}

const STATES: State[] = [
  { name: 'home, desktop', path: '/', viewport: { width: 1440, height: 900 } },
  { name: 'home, mobile', path: '/', viewport: { width: 390, height: 844 } },
  {
    name: 'mobile menu open',
    path: '/',
    viewport: { width: 390, height: 844 },
    prepare: async (page) => {
      await page.locator('.nav-toggle').click();
      await expect(page.locator('body')).toHaveClass(/menu-open/);
    },
  },
  {
    name: 'lightbox open',
    path: '/',
    viewport: { width: 1440, height: 900 },
    prepare: async (page) => {
      await page.locator('[data-lightbox]').first().click();
      await expect(page.locator('#lightbox')).toHaveAttribute('open', '');
    },
  },
  { name: '404', path: '/404.html', viewport: { width: 390, height: 844 } },
];

test.use({ reducedMotion: 'reduce' });

async function open(page: Page, side: Side, state: State) {
  await page.setViewportSize(state.viewport);
  await page.goto(SITES[side] + state.path);
  await state.prepare?.(page);
}

const describe = (violations: { id: string; nodes: { target: unknown[] }[] }[]) =>
  violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);

for (const state of STATES) {
  test(`no WCAG A/AA violations: ${state.name}`, async ({ page }) => {
    await open(page, 'target', state);
    const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    expect(describe(violations)).toEqual([]);
  });

  test(`no axe issues beyond the baseline: ${state.name}`, async ({ page }) => {
    const ids: Record<Side, string[]> = { baseline: [], target: [] };
    for (const side of ['baseline', 'target'] as const) {
      await open(page, side, state);
      const { violations } = await new AxeBuilder({ page }).analyze();
      ids[side] = violations.map((v) => v.id).sort();
    }
    expect(ids.target.filter((id) => !ids.baseline.includes(id))).toEqual([]);
  });
}
