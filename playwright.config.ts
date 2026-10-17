import { defineConfig } from '@playwright/test';

// Flags from the validated screenshot recipe: identical colour handling and
// rasterisation from run to run.
const deterministicChromium = [
  '--force-color-profile=srgb',
  '--disable-lcd-text',
  '--disable-partial-raster',
  '--disable-gpu-rasterization',
  '--hide-scrollbars',
];

export default defineConfig({
  testDir: 'tests',
  globalSetup: './tests/support/global-setup.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  workers: process.env.CI ? 2 : undefined,
  timeout: 180_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['list'], ['github'], ['html', { open: 'never' }]] : [['list']],
  use: { trace: 'retain-on-failure' },
  projects: [
    // One retry: WebKit occasionally applies a scroll a frame late, and a real
    // regression fails both attempts. Every capture of the passing attempt is exact.
    {
      name: 'visual-chromium',
      testMatch: /(visual|aria)\.spec\.ts/,
      retries: 1,
      use: { browserName: 'chromium', launchOptions: { args: deterministicChromium } },
    },
    { name: 'visual-webkit', testMatch: /(visual|aria)\.spec\.ts/, retries: 1, use: { browserName: 'webkit' } },
    {
      name: 'e2e-chromium',
      testMatch: /(behavior|a11y)\.spec\.ts/,
      retries: process.env.CI ? 1 : 0,
      use: { browserName: 'chromium' },
    },
    {
      name: 'e2e-webkit',
      testMatch: /(behavior|a11y)\.spec\.ts/,
      retries: process.env.CI ? 1 : 0,
      use: { browserName: 'webkit' },
    },
  ],
  webServer: [
    {
      command: 'node scripts/serve.mjs .baseline/site 4301',
      url: 'http://127.0.0.1:4301/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'node scripts/serve.mjs dist 4302',
      url: 'http://127.0.0.1:4302/',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
