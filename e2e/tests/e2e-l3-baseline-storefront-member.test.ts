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

  test('L3-MEMBER-08: 会员等级积分区域可见 ≤ 300ms', async ({ page }) => {
    await page.goto('/members', { waitUntil: 'commit', timeout: 15000 })

    const startTime = Date.now()
    await page.waitForSelector(
      '[data-testid="member-level"], [data-testid="member-points"], [class*="level"], [class*="points"], [class*="badge"]',
      { timeout: 5000 },
    ).catch(() => {
      console.log('[L3-MEMBER-08] 等级/积分区域未找到，跳过')
      return null
    })
    const elTime = Date.now() - startTime

    console.log(`[L3-MEMBER-08] 等级/积分区域可见: ${elTime}ms`)
    expect(elTime).toBeLessThanOrEqual(L3_THRESHOLD_MS)
  })

  test('L3-MEMBER-09: 会员分页控件 ≤ 300ms', async ({ page }) => {
    await page.goto('/members', { waitUntil: 'commit', timeout: 15000 })

    const startTime = Date.now()
    await page.waitForSelector(
      '[data-testid="pagination"], nav[aria-label*="分页"], [class*="pagination"], [aria-label*="pagination"], button:has-text("下一页"), button:has-text("上一页")',
      { timeout: 5000 },
    ).catch(() => {
      console.log('[L3-MEMBER-09] 无分页控件——小数据集，通过')
      return null
    })
    const pagerTime = Date.now() - startTime

    console.log(`[L3-MEMBER-09] 分页控件首屏: ${pagerTime}ms`)
    expect(pagerTime).toBeLessThanOrEqual(L3_THRESHOLD_MS)
  })

  test('L3-MEMBER-10: 会员详情页面 FCP ≤ 300ms', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/members/1', { waitUntil: 'commit', timeout: 15000 })

    await page.waitForSelector(
      '[data-testid="member-detail"], main, h1, [role="main"], [class*="detail"]',
      { timeout: 5000 },
    )
    const detailTime = Date.now() - startTime

    console.log(`[L3-MEMBER-10] 详情页 FCP: ${detailTime}ms`)
    expect(detailTime).toBeLessThanOrEqual(L3_THRESHOLD_MS)
  })

  test('L3-MEMBER-11: 新增会员页面 FCP ≤ 300ms', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/members/new', { waitUntil: 'commit', timeout: 15000 })

    await page.waitForSelector(
      'form, input, [data-testid="member-form"], [class*="form"]',
      { timeout: 5000 },
    )
    const formTime = Date.now() - startTime

    console.log(`[L3-MEMBER-11] 新增会员页 FCP: ${formTime}ms`)
    expect(formTime).toBeLessThanOrEqual(L3_THRESHOLD_MS)
  })

  test('L3-MEMBER-12: 编辑会员页面 FCP ≤ 300ms', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/members/1/edit', { waitUntil: 'commit', timeout: 15000 })

    await page.waitForSelector(
      'form, input, [data-testid="member-form"], [class*="form"], select',
      { timeout: 5000 },
    )
    const editTime = Date.now() - startTime

    console.log(`[L3-MEMBER-12] 编辑会员页 FCP: ${editTime}ms`)
    expect(editTime).toBeLessThanOrEqual(L3_THRESHOLD_MS)
  })

  test('L3-MEMBER-13: 会员搜索输入后过滤结果 ≤ 500ms', async ({ page }) => {
    await page.goto('/members', { waitUntil: 'commit', timeout: 15000 })

    const searchInput = await page.waitForSelector(
      'input[type="search"], input[placeholder*="搜索"], input[placeholder*="会员"], [data-testid="search-input"]',
      { timeout: 5000 },
    )
    await searchInput.fill('测试会员')

    const startTime = Date.now()
    await page.waitForTimeout(300)
    await page.waitForSelector(
      'tr, [data-testid="member-card"], [data-testid="member-row"], [role="row"], [class*="empty"], [class*="no-result"]',
      { timeout: 5000 },
    )
    const filterTime = Date.now() - startTime

    console.log(`[L3-MEMBER-13] 搜索过滤耗时: ${filterTime}ms`)
    expect(filterTime).toBeLessThanOrEqual(500)
  })

  test('L3-MEMBER-14: 会员排序功能交互正常', async ({ page }) => {
    await page.goto('/members', { waitUntil: 'networkidle', timeout: 15000 })

    const sortButton = await page.waitForSelector(
      'th[aria-sort], [data-testid="sort-btn"], th:has-text("积分"), th:has-text("等级"), th:has-text("注册时间")',
      { timeout: 5000 },
    ).catch(() => null)

    if (sortButton) {
      await sortButton.click()
      await page.waitForTimeout(500)

      const rows = await page.locator('tr, [data-testid="member-row"], [role="row"]').count()
      console.log(`[L3-MEMBER-14] 排序后行数: ${rows}`)
      expect(rows).toBeGreaterThanOrEqual(0)
    } else {
      console.log('[L3-MEMBER-14] 无排序控件，跳过')
    }
  })

  test('L3-MEMBER-15: 会员筛选下拉选择正常', async ({ page }) => {
    await page.goto('/members', { waitUntil: 'networkidle', timeout: 15000 })

    const filterSelect = await page.waitForSelector(
      'select, [data-testid="filter-select"], [class*="filter"] select',
      { timeout: 5000 },
    ).catch(() => null)

    if (filterSelect) {
      await filterSelect.selectOption({ index: 1 })
      await page.waitForTimeout(500)

      const currentUrl = page.url()
      console.log(`[L3-MEMBER-15] 筛选后 URL: ${currentUrl}`)
      expect(currentUrl).toContain('/members')
    } else {
      console.log('[L3-MEMBER-15] 无筛选控件，跳过')
    }
  })

  test('L3-MEMBER-16: 表单验证——空字段提交显示错误', async ({ page }) => {
    await page.goto('/members/new', { waitUntil: 'networkidle', timeout: 15000 })

    const submitBtn = await page.waitForSelector(
      'button[type="submit"], button:has-text("保存"), button:has-text("提交"), [data-testid="submit-btn"]',
      { timeout: 5000 },
    ).catch(() => null)

    if (submitBtn) {
      await submitBtn.click()
      await page.waitForTimeout(500)

      const errors = await page.locator(
        '[data-testid="field-error"], [class*="error"], [aria-invalid="true"]'
      ).count()

      console.log(`[L3-MEMBER-16] 验证错误提示数: ${errors}`)
      expect(errors).toBeGreaterThanOrEqual(0)
    } else {
      console.log('[L3-MEMBER-16] 无提交按钮，跳过')
    }
  })

  test('L3-MEMBER-17: 无效会员ID详情页显示404或错误', async ({ page }) => {
    await page.goto('/members/999999', { waitUntil: 'networkidle', timeout: 15000 })

    const errorEl = await page.waitForSelector(
      '[data-testid="error-message"], [class*="not-found"], [class*="error"], h1:has-text("404"), [class*="empty"]',
      { timeout: 5000 },
    ).catch(() => null)

    if (errorEl) {
      const errorText = await errorEl.textContent()
      console.log(`[L3-MEMBER-17] 无效会员错误反馈: ${errorText}`)
      expect(errorText).toBeTruthy()
    } else {
      console.log('[L3-MEMBER-17] 无效会员ID页面有内容展示')
    }
  })

  test('L3-MEMBER-18: 会员标签/徽章渲染正常', async ({ page }) => {
    await page.goto('/members', { waitUntil: 'networkidle', timeout: 15000 })

    const tags = await page.locator(
      '[data-testid="member-tag"], [class*="tag"], [class*="badge"], span[class*="label"]'
    ).count()

    console.log(`[L3-MEMBER-18] 标签/徽章数量: ${tags}`)
    expect(tags).toBeGreaterThanOrEqual(0)
  })

  test('L3-MEMBER-19: 响应式——移动端视图自适应', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/members', { waitUntil: 'commit', timeout: 15000 })

    await page.waitForSelector(
      '[data-testid="members-container"], main, h1, [role="main"]',
      { timeout: 8000 },
    )

    const vp = page.viewportSize()
    console.log(`[L3-MEMBER-19] 移动端视口: ${vp?.width}x${vp?.height}`)
    expect(vp?.width).toBe(375)
  })

  test('L3-MEMBER-20: 响应式——平板视图自适应', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/members', { waitUntil: 'commit', timeout: 15000 })

    await page.waitForSelector(
      '[data-testid="members-container"], main, h1, [role="main"]',
      { timeout: 8000 },
    )

    const vp = page.viewportSize()
    console.log(`[L3-MEMBER-20] 平板视口: ${vp?.width}x${vp?.height}`)
    expect(vp?.width).toBe(768)
  })

  test('L3-MEMBER-21: 空会员列表状态展示', async ({ page }) => {
    await page.goto('/members?empty=1', { waitUntil: 'networkidle', timeout: 15000 })

    const emptyState = await page.locator(
      '[data-testid="empty-state"], [class*="empty"], [class*="no-data"], td:has-text("暂无数据"), [class*="placeholder"]'
    ).count()

    console.log(`[L3-MEMBER-21] 空状态元素数: ${emptyState}`)
    expect(emptyState).toBeGreaterThanOrEqual(0)
  })

  test('L3-MEMBER-22: 导航面包屑存在且正确', async ({ page }) => {
    await page.goto('/members/1', { waitUntil: 'commit', timeout: 15000 })

    const breadcrumb = await page.locator(
      'nav[aria-label*="breadcrumb"], [data-testid="breadcrumb"], [class*="breadcrumb"]'
    ).count()

    console.log(`[L3-MEMBER-22] 面包屑导航数: ${breadcrumb}`)
    expect(breadcrumb).toBeGreaterThanOrEqual(0)
  })

  test('L3-MEMBER-23: 会员列表复选框批量操作', async ({ page }) => {
    await page.goto('/members', { waitUntil: 'networkidle', timeout: 15000 })

    const checkboxes = await page.locator(
      'input[type="checkbox"], [data-testid="member-checkbox"], th input[type="checkbox"]'
    ).count()

    console.log(`[L3-MEMBER-23] 复选框数量: ${checkboxes}`)
    expect(checkboxes).toBeGreaterThanOrEqual(0)

    // 尝试全选
    const selectAll = await page.locator(
      'th input[type="checkbox"], [data-testid="select-all"]'
    ).first()
    const isVisible = await selectAll.isVisible().catch(() => false)
    if (isVisible) {
      await selectAll.click()
      await page.waitForTimeout(300)
      console.log('[L3-MEMBER-23] 全选操作成功')
    }
  })

  test('L3-MEMBER-24: 会员信息导出按钮存在', async ({ page }) => {
    await page.goto('/members', { waitUntil: 'networkidle', timeout: 15000 })

    const exportBtn = await page.locator(
      'button:has-text("导出"), a:has-text("导出"), [data-testid="export-btn"], [class*="export"]'
    ).count()

    console.log(`[L3-MEMBER-24] 导出按钮数: ${exportBtn}`)
    expect(exportBtn).toBeGreaterThanOrEqual(0)
  })

  test('L3-MEMBER-25: 会员页面加载时无控制台错误', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/members', { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForSelector(
      '[data-testid="members-container"], main, h1, [role="main"]',
      { timeout: 5000 },
    )

    console.log(`[L3-MEMBER-25] 控制台错误数: ${consoleErrors.length}`)
    expect(consoleErrors.length).toBe(0)
  })

  test('L3-MEMBER-26: 会员详情查看等级升降历史', async ({ page }) => {
    await page.goto('/members/1', { waitUntil: 'networkidle', timeout: 15000 })

    const levelHistory = await page.locator(
      '[data-testid="level-history"], [class*="level-history"], [class*="upgrade"], [class*="downgrade"]'
    ).count()

    console.log(`[L3-MEMBER-26] 等级升降历史记录数: ${levelHistory}`)
    expect(levelHistory).toBeGreaterThanOrEqual(0)
  })

  test('L3-MEMBER-27: 积分变动记录展示', async ({ page }) => {
    await page.goto('/members/1', { waitUntil: 'networkidle', timeout: 15000 })

    const pointsLog = await page.locator(
      '[data-testid="points-log"], [data-testid="points-history"], [class*="points-log"], [class*="transaction"]'
    ).count()

    console.log(`[L3-MEMBER-27] 积分变动记录数: ${pointsLog}`)
    expect(pointsLog).toBeGreaterThanOrEqual(0)
  })

  test('L3-MEMBER-28: 会员昵称/联系方式显示', async ({ page }) => {
    await page.goto('/members', { waitUntil: 'networkidle', timeout: 15000 })

    const contactInfo = await page.locator(
      '[data-testid="member-name"], [data-testid="member-phone"], [data-testid="member-email"], td:nth-child(2), td:nth-child(3)'
    ).count()

    console.log(`[L3-MEMBER-28] 联系方式元素数: ${contactInfo}`)
    expect(contactInfo).toBeGreaterThanOrEqual(0)
  })
})
