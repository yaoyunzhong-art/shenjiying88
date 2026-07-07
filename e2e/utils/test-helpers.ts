/**
 * TC31: E2E测试工具函数
 * Sprint 2 Day 21
 */

import { Page, Locator, Response, expect } from '@playwright/test'
import { TIMEOUTS } from '../fixtures/test-data'

/**
 * 等待指定时间
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 重试操作直到成功
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number
    delay?: number
    shouldRetry?: (error: Error) => boolean
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, shouldRetry = () => true } = options

  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxAttempts || !shouldRetry(lastError)) {
        throw lastError
      }

      await sleep(delay)
    }
  }

  throw lastError!
}

/**
 * 等待元素存在（可见或隐藏）
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options: {
    state?: 'visible' | 'hidden' | 'attached' | 'detached'
    timeout?: number
  } = {}
): Promise<Locator> {
  const { state = 'visible', timeout = TIMEOUTS.medium } = options
  const locator = page.locator(selector).first()
  await locator.waitFor({ state, timeout })
  return locator
}

/**
 * 滚动到元素
 */
export async function scrollToElement(
  page: Page,
  selector: string
): Promise<void> {
  await page.evaluate((sel) => {
    const element = document.querySelector(sel)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, selector)
  await sleep(300)
}

/**
 * 等待API响应并验证状态
 */
export async function waitForAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  options: {
    timeout?: number
    expectedStatus?: number
  } = {}
): Promise<Response> {
  const { timeout = TIMEOUTS.api, expectedStatus = 200 } = options

  const response = await page.waitForResponse(
    (res) => {
      const url = res.url()
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern)
      }
      return urlPattern.test(url)
    },
    { timeout }
  )

  if (expectedStatus) {
    expect(response.status()).toBe(expectedStatus)
  }

  return response
}

/**
 * 填充表单字段
 */
export async function fillFormFields(
  page: Page,
  fields: Record<string, string>
): Promise<void> {
  for (const [selector, value] of Object.entries(fields)) {
    const locator = page.locator(selector).first()
    await locator.fill(value)
  }
}

/**
 * 验证表单错误
 */
export async function expectFormError(
  page: Page,
  fieldSelector: string,
  expectedError: string
): Promise<void> {
  const errorSelector = `${fieldSelector} ~ [data-testid="field-error"]`
  const errorMessage = await page.locator(errorSelector).textContent()
  expect(errorMessage).toContain(expectedError)
}

/**
 * 模拟网络条件
 */
export async function simulateNetworkConditions(
  page: Page,
  conditions: 'fast' | 'slow' | 'offline'
): Promise<void> {
  const contexts = {
    fast: { downloadThroughput: 100 * 1024 * 1024 / 8, uploadThroughput: 100 * 1024 * 1024 / 8, latency: 0 },
    slow: { downloadThroughput: 100 * 1024 / 8, uploadThroughput: 100 * 1024 / 8, latency: 200 },
    offline: { offline: true },
  }

  // @ts-ignore - CDP session
  const client = await page.context().newCDPSession(page)
  await client.send('Network.emulateNetworkConditions', contexts[conditions])
}

/**
 * 生成测试数据
 */
export function generateTestData(prefix: string): {
  id: string
  name: string
  email: string
  timestamp: number
} {
  const timestamp = Date.now()
  return {
    id: `${prefix}-${timestamp}`,
    name: `Test ${prefix} ${timestamp}`,
    email: `test-${prefix}-${timestamp}@example.com`,
    timestamp,
  }
}

/**
 * 清理测试数据
 */
export async function cleanupTestData(
  page: Page,
  selector: string
): Promise<void> {
  const elements = await page.locator(selector).all()
  for (const element of elements) {
    if (await element.isVisible().catch(() => false)) {
      await element.click()
      await page.waitForTimeout(500)
    }
  }
}