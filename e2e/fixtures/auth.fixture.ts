/**
 * TC31: E2E测试Fixture - 认证相关
 * Sprint 2 Day 21
 */

import { test as base, Page, BrowserContext } from '@playwright/test'
import { LicensePage } from '../pages/license.page'
import { TEST_USERS, API_ENDPOINTS } from './test-data'

// 扩展测试类型
interface TestFixtures {
  // 页面对象
  licensePage: LicensePage

  // 认证相关
  adminPage: Page
  tenantPage: Page
  storePage: Page

  // 认证状态
  authenticatedContext: BrowserContext
}

/**
 * 基础测试fixture
 */
export const test = base.extend<TestFixtures>({
  /**
   * License页面对象
   */
  licensePage: async ({ page }, use) => {
    const licensePage = new LicensePage(page)
    await use(licensePage)
  },

  /**
   * 管理员认证页面
   */
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    // 执行登录
    await login(page, TEST_USERS.admin)

    await use(page)

    // 清理
    await context.close()
  },

  /**
   * 租户认证页面
   */
  tenantPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await login(page, TEST_USERS.tenant)

    await use(page)

    await context.close()
  },

  /**
   * 门店认证页面
   */
  storePage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await login(page, TEST_USERS.store)

    await use(page)

    await context.close()
  },
})

/**
 * 登录辅助函数
 */
async function login(page: Page, user: typeof TEST_USERS.admin): Promise<void> {
  await page.goto(`${API_ENDPOINTS.base}/login`)

  // 填写登录表单
  await page.fill('[data-testid="login-username"]', user.username)
  await page.fill('[data-testid="login-password"]', user.password)

  // 提交登录
  await page.click('[data-testid="login-submit"]')

  // 等待登录成功
  await page.waitForURL(/\/(admin|dashboard)/, { timeout: 10000 })
}

/**
 * 登出辅助函数
 */
export async function logout(page: Page): Promise<void> {
  await page.click('[data-testid="user-menu"]')
  await page.click('[data-testid="logout-btn"]')
  await page.waitForURL('/login', { timeout: 10000 })
}

/**
 * 设置本地存储认证令牌
 */
export async function setAuthToken(page: Page, token: string): Promise<void> {
  await page.evaluate((t) => {
    localStorage.setItem('auth_token', t)
  }, token)
}

/**
 * 清除认证状态
 */
export async function clearAuth(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
    sessionStorage.clear()
  })
}

// 导出expect
export { expect } from '@playwright/test'