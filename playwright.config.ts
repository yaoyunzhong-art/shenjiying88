/**
 * TC31: Playwright E2E Test Configuration
 * Sprint 2 Day 21 - E2E测试环境配置
 * 
 * 覆盖端: PC / Pad / H5 / APP / Mini-program (多项目适配)
 */

import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright 全局配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 测试目录
  testDir: './e2e',

  // 测试文件匹配模式
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],

  // 完全并行执行
  fullyParallel: true,

  // CI环境下禁止only测试
  forbidOnly: !!process.env.CI,

  // 重试策略
  retries: process.env.CI ? 2 : 1,

  // 并行worker数
  workers: process.env.CI ? 1 : 4,

  // 测试超时 (ms)
  timeout: 60000,

  // 期望超时 (ms)
  expect: {
    timeout: 10000,
  },

  // 报告器配置
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
    ['junit', { outputFile: 'playwright-report/junit.xml' }],
  ],

  // 全局测试配置
  use: {
    // 基础URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // 浏览器上下文配置
    browserName: 'chromium',

    // 视口大小 (PC端默认)
    viewport: { width: 1920, height: 1080 },

    // 设备缩放
    deviceScaleFactor: 1,

    // 是否以无头模式运行
    headless: !!process.env.CI,

    // 自动截图策略
    screenshot: 'only-on-failure',

    // 追踪配置
    trace: 'on-first-retry',

    // 视频录制
    video: {
      mode: 'retain-on-failure',
      size: { width: 1920, height: 1080 },
    },

    // 动作超时
    actionTimeout: 15000,

    // 导航超时
    navigationTimeout: 30000,

    // 测试标识
    testIdAttribute: 'data-testid',

    // 本地存储和Cookie
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  },

  // 多项目配置 (5端适配)
  projects: [
    // PC端 - Chromium
    {
      name: 'pc-chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1920, height: 1080 },
      },
    },

    // PC端 - Firefox
    {
      name: 'pc-firefox',
      use: {
        browserName: 'firefox',
        viewport: { width: 1920, height: 1080 },
      },
    },

    // PC端 - WebKit
    {
      name: 'pc-webkit',
      use: {
        browserName: 'webkit',
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Pad端
    {
      name: 'pad',
      use: {
        browserName: 'chromium',
        viewport: { width: 1024, height: 768 },
        ...devices['iPad (gen 7)'],
      },
    },

    // H5端 - iPhone
    {
      name: 'h5-iphone',
      use: {
        browserName: 'chromium',
        ...devices['iPhone 14'],
      },
    },

    // H5端 - Android
    {
      name: 'h5-android',
      use: {
        browserName: 'chromium',
        ...devices['Pixel 7'],
      },
    },
  ],

  // 本地开发服务器配置
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})