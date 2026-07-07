/**
 * TC31: E2E Page Object Model - Base Page
 * Sprint 2 Day 21
 */

import { Page, Locator, expect, Response } from '@playwright/test'
import { TIMEOUTS, API_ENDPOINTS } from '../fixtures/test-data'

export interface PageOptions {
  baseURL?: string
  timeout?: number
}

export abstract class BasePage {
  readonly page: Page
  readonly baseURL: string
  readonly defaultTimeout: number

  constructor(page: Page, options: PageOptions = {}) {
    this.page = page
    this.baseURL = options.baseURL || API_ENDPOINTS.base
    this.defaultTimeout = options.timeout || TIMEOUTS.medium
  }

  /**
   * 导航到指定路径
   */
  async goto(path: string, options?: { waitFor?: string }): Promise<void> {
    const url = `${this.baseURL}${path}`
    await this.page.goto(url, { waitUntil: 'networkidle' })

    if (options?.waitFor) {
      await this.waitForSelector(options.waitFor)
    }
  }

  /**
   * 等待元素可见
   */
  async waitForSelector(selector: string, timeout?: number): Promise<Locator> {
    const locator = this.page.locator(selector).first()
    await locator.waitFor({ state: 'visible', timeout: timeout || this.defaultTimeout })
    return locator
  }

  /**
   * 等待元素隐藏
   */
  async waitForHidden(selector: string, timeout?: number): Promise<void> {
    const locator = this.page.locator(selector).first()
    await locator.waitFor({ state: 'hidden', timeout: timeout || this.defaultTimeout })
  }

  /**
   * 点击元素
   */
  async click(selector: string, options?: { force?: boolean; waitForNavigation?: boolean }): Promise<void> {
    const locator = await this.waitForSelector(selector)
    
    if (options?.waitForNavigation) {
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle' }),
        locator.click({ force: options?.force }),
      ])
    } else {
      await locator.click({ force: options?.force })
    }
  }

  /**
   * 填写输入框
   */
  async fill(selector: string, value: string, options?: { clearFirst?: boolean }): Promise<void> {
    const locator = await this.waitForSelector(selector)
    
    if (options?.clearFirst !== false) {
      await locator.clear()
    }
    
    await locator.fill(value)
  }

  /**
   * 获取元素文本
   */
  async getText(selector: string): Promise<string> {
    const locator = await this.waitForSelector(selector)
    return await locator.textContent() || ''
  }

  /**
   * 检查元素是否存在
   */
  async isVisible(selector: string, timeout?: number): Promise<boolean> {
    try {
      const locator = this.page.locator(selector).first()
      await locator.waitFor({ state: 'visible', timeout: timeout || 2000 })
      return true
    } catch {
      return false
    }
  }

  /**
   * 等待API响应
   */
  async waitForAPIResponse(urlPattern: string, timeout?: number): Promise<Response> {
    return await this.page.waitForResponse(
      response => response.url().includes(urlPattern),
      { timeout: timeout || TIMEOUTS.api }
    )
  }

  /**
   * 等待加载完成
   */
  async waitForLoadingComplete(selector: string = '[data-testid="loading-spinner"]'): Promise<void> {
    try {
      await this.waitForHidden(selector, 5000)
    } catch {
      // 忽略超时，可能加载已完成
    }
  }

  /**
   * 截图
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `./playwright-report/screenshots/${name}.png`,
      fullPage: true,
    })
  }

  /**
   * 获取当前URL
   */
  getCurrentUrl(): string {
    return this.page.url()
  }

  /**
   * 验证当前路径
   */
  async expectPath(path: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`${path.replace(/\//g, '\\/')}$`))
  }
}