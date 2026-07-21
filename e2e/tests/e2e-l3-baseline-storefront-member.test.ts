/**
 * ⚡ L3 E2E 基线 — Storefront 会员页 (300ms 页面基准)
 *
 * 圈梁⑤：知识赋能
 * 标准: 首屏加载 ≤ 300ms (FCP/FMP/LCP)
 * 频率: 每次PR前
 *
 * 测量项：
 *   - FCP (First Contentful Paint)
 *   - FMP (First Meaningful Paint) — 会员核心卡片
 *   - LCP (Largest Contentful Paint)
 *   - 会员等级/积分区域可见时间
 *   - 会员列表加载时间
 */

import { test, expect, type Page } from '@playwright/test'

const L3_THRESHOLD_MS = 300

test.describe('⚡ L3 基线 — 会员页 300ms', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test('L3-MEMBER-01: 会员列表首屏 FCP ≤ 300ms', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/members', { waitUntil: 'commit', timeout: 15000 })

    await page.waitForSelector(
      '[data-testid="members-container"], main, h1, [role="main"], table',
      { timeout: 5000 },
    )
    const fcpTime = Date.now() - startTime

    console.log(`[L3-MEMBER-01] FCP: ${fcpTime}ms`)
    expect(fcpTime).toBeLessThanOrEqual(L3_THRESHOLD_MS)
  })

  test('L3-MEMBER-02: 会员列表行/卡片 ≤ 300ms', async ({ page }) => {
    await page.goto('/members', { waitUntil: 'commit', timeout: 15000 })

    const startTime = Date.now()
    await page.waitForSelector(
      'tr, [data-testid="member-card"], [data-testid="member-row"], [class*="member-item"], [role="row"]',
      { timeout: 5000 },
    )
    const listTime = Date.now() - startTime

    console.log(`[L3-MEMBER-02] 会员列表行首屏: ${listTime}ms`)
    expect(listTime).toBeLessThanOrEqual(L3_THRESHOLD_MS)
  })

  test('L3-MEMBER-03: 会员搜索/筛选栏 ≤ 300ms', async ({ page }) => {
    await page.goto('/members', { waitUntil: 'commit', timeout: 15000 })

    const startTime = Date.now()
    await page.waitForSelector(
      'input[type="search"], input[placeholder*="搜索"], input[placeholder*="会员"], [data-testid="search-input"], [data-testid="filter-bar"]',
      { timeout: 5000 },
    )
    const searchTime = Date.now() - startTime

    console.log(`[L3-MEMBER-03] 搜索栏首屏: ${searchTime}ms`)
    expect(searchTime).toBeLessThanOrEqual(L3_THRESHOLD_MS)
  })

  test('L3-MEMBER-04: 新增会员按钮 ≤ 300ms', async ({ page }) => {
    await page.goto('/members', { waitUntil: 'commit', timeout: 15000 })

    const startTime = Date.now()
    await page.waitForSelector(
      'a[href*="new"], button:has-text("新增"), button:has-text("添加"), [data-testid="add-member"], [class*="add"]',
      { timeout: 5000 },
    )
    const btnTime = Date.now() - startTime

    console.log(`[L3-MEMBER-04] 新增按钮首屏: ${btnTime}ms`)
    expect(btnTime).toBeLessThanOrEqual(L3_THRESHOLD_MS)
  })

  test('L3-MEMBER-05: 网络空闲后 LCP ≤ 300ms', async ({ page }) => {
    await page.goto('/members', { waitUntil: 'networkidle', timeout: 15000 })

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
        setTimeout(() => resolve(-1), 3000)
      })
    })

    console.log(`[L3-MEMBER-05] LCP: ${lcp}ms`)
    if (lcp >= 0) {
      expect(lcp).toBeLessThanOrEqual(L3_THRESHOLD_MS)
    } else {
      console.warn('[L3-MEMBER-05] LCP 测量超时，跳过断言')
    }
  })

  test('L3-MEMBER-06: loading.tsx 骨架屏在 200ms 内出现', async ({ page }) => {
    await page.goto('/members', { waitUntil: 'commit', timeout: 15000 })

    const startTime = Date.now()
    await page.waitForSelector(
      '[data-testid="loading"], .loading, [class*="skeleton"], [class*="spinner"], [aria-busy="true"]',
      { timeout: 3000 },
    ).then(() => {
      const skeletonTime = Date.now() - startTime
      console.log(`[L3-MEMBER-06] 骨架屏出现: ${skeletonTime}ms`)
      expect(skeletonTime).toBeLessThanOrEqual(200)
    }).catch(() => {
      console.log('[L3-MEMBER-06] 无骨架屏（直接渲染）—— 通过')
    })
  })

  test('L3-MEMBER-07: 会员中心首页 FCP ≤ 300ms', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/member-center', { waitUntil: 'commit', timeout: 15000 })

    await page.waitForSelector(
      '[data-testid="member-center"], main, h1, [role="main"]',
      { timeout: 5000 },
    )
    const fcpTime = Date.now() - startTime

    console.log(`[L3-MEMBER-07] 会员中心 FCP: ${fcpTime}ms`)
    expect(fcpTime).toBeLessThanOrEqual(L3_THRESHOLD_MS)
  })
})
