import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './apps/admin-web/app/__e2e__',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 2,
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm dev --filter=@m5/admin-web',
      port: 3002,
      timeout: 60 * 1000,
      reuseExistingServer: true,
    },
    {
      command: 'pnpm dev --filter=@m5/api',
      port: 3000,
      timeout: 60 * 1000,
      reuseExistingServer: true,
    },
  ],
});
