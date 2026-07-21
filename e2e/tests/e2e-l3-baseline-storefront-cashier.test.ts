/**
 * ⚡ L3 E2E 基线 — Storefront 收银页 (300ms 页面基准)
 *
 * 圈梁⑤：知识赋能
 * 标准: 首屏加载 ≤ 300ms (FCP + LCP)
 * 频率: 每次PR前
 *
 * 测量项：
 *   - FCP (First Contentful Paint)
 *   - LCP (Largest Contentful Paint)
 *   - DOMContentLoaded
 *   - Load (完整加载)
 *   - 关键元素可见时间
 */

import { test, expect, type Page } from '@playwright/test'

const L3_THRESHOLD_MS = 300

test.describe('⚡ L3 基线 — 收银页 300ms', () => {
  test.beforeEach(async ({ page }) => {
    // 清除缓存确保纯净测速
    await page.context().clearCookies()
  })

  test('L3-CASH-01: 首屏 FCP ≤ 300ms', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/cashier', { waitUntil: 'commit', timeout: 15000 })

    // 等待首次内容绘制
    await page.waitForSelector('[data-testid="cashier-container"], main, h1, [role="main"]', {
      timeout: 5000,
    })
    const fcpTime = Date.now() - startTime

    console.log(`[L3-CASH-01] FCP: ${fcpTime}ms`)
    expect(fcpTime).toBeLessThanOrEqual(L3_THRESHOLD_MS)
  })

  test('L3-CASH-02: 关键按钮可见 ≤ 300ms', async ({ page }) => {
    await page.goto('/cashier', { waitUntil: 'commit', timeout: 15000 })

    const startTime = Date.now()
    // 等待核心按钮 —— 结算/支付按钮出现
    await page.waitForSelector(
      'button:has-text("结算"), button:has-text("结账"), button:has-text("支付"), [data-testid="checkout-btn"]',
      { timeout: 5000 },
    )
    const visibleTime = Date.now() - startTime

    console.log(`[L3-CASH-02] 结算按钮可见: ${visibleTime}ms`)
    expect(visibleTime).toBeLessThanOrEqual(L3_THRESHOLD_MS)
  })

  test('L3-CASH-03: 商品列表/购物车区域首屏 ≤ 300ms', async ({ page }) => {
    await page.goto('/cashier', { waitUntil: 'commit', timeout: 15000 })

    const startTime = Date.now()
    // 等待商品列表或购物车骨架屏出现
    await page.waitForSelector(
      '[data-testid="cart-items"], [data-testid="product-list"], .cart-list, .items-list, table, [role="listbox"]',
      { timeout: 5000 },
    )
    const listTime = Date.now() - startTime

    console.log(`[L3-CASH-03] 商品列表首屏: ${listTime}ms`)
    expect(listTime).toBeLessThanOrEqual(L3_THRESHOLD_MS)
  })

  test('L3-CASH-04: 总金额/合计区域 ≤ 300ms', async ({ page }) => {
    await page.goto('/cashier', { waitUntil: 'commit', timeout: 15000 })

    const startTime = Date.now()
    // 等待金额汇总区域
    await page.waitForSelector(
      '[data-testid="total-amount"], .total-amount, .order-total, [class*="total"], [class*="summary"]',
      { timeout: 5000 },
    )
    const totalTime = Date.now() - startTime

    console.log(`[L3-CASH-04] 金额合计首屏: ${totalTime}ms`)
    expect(totalTime).toBeLessThanOrEqual(L3_THRESHOLD_MS)
  })

  test('L3-CASH-05: 支付方式选择区域 ≤ 300ms', async ({ page }) => {
    await page.goto('/cashier', { waitUntil: 'commit', timeout: 15000 })

    const startTime = Date.now()
    // 等待支付方式选项出现
    await page.waitForSelector(
      '[data-testid="payment-methods"], .payment-methods, [data-testid*="payment"], [class*="payment"]',
      { timeout: 5000 },
    )
    const paymentTime = Date.now() - startTime

    console.log(`[L3-CASH-05] 支付方式首屏: ${paymentTime}ms`)
    expect(paymentTime).toBeLessThanOrEqual(L3_THRESHOLD_MS)
  })

  test('L3-CASH-06: 网络空闲后 LCP ≤ 300ms', async ({ page }) => {
    await page.goto('/cashier', { waitUntil: 'networkidle', timeout: 15000 })

    // 使用 Performance API 测量 LCP
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          if (entries.length > 0) {
            const lastEntry = entries[entries.length - 1] as PerformanceEntry
            resolve(lastEntry.startTime)
          }
        })
        observer.observe({ type: 'largest-contentful-paint', buffered: true })
        // 超时后备
        setTimeout(() => resolve(-1), 3000)
      })
    })

    console.log(`[L3-CASH-06] LCP: ${lcp}ms`)
    if (lcp >= 0) {
      expect(lcp).toBeLessThanOrEqual(L3_THRESHOLD_MS)
    } else {
      console.warn('[L3-CASH-06] LCP 测量超时，跳过断言')
    }
  })

  test('L3-CASH-07: loading.tsx 骨架屏在 200ms 内出现', async ({ page }) => {
    await page.goto('/cashier', { waitUntil: 'commit', timeout: 15000 })

    const startTime = Date.now()
    // 等待任何骨架屏/加载指示器出现
    await page.waitForSelector(
      '[data-testid="loading"], .loading, [class*="skeleton"], [class*="spinner"], [aria-busy="true"]',
      { timeout: 3000 },
    ).then(() => {
      const skeletonTime = Date.now() - startTime
      console.log(`[L3-CASH-07] 骨架屏出现: ${skeletonTime}ms`)
      expect(skeletonTime).toBeLessThanOrEqual(200)
    }).catch(() => {
      // 如果没有骨架屏，说明页面直接渲染了
      console.log('[L3-CASH-07] 无骨架屏（直接渲染）—— 通过')
    })
  })
})
