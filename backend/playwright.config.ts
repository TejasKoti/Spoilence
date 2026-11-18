import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '../tests/e2e',
  outputDir: '../tests/results/browser',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { headless: true, trace: 'off', screenshot: 'off', video: 'off' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
