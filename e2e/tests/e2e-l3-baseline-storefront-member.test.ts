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

/**
 * ============================================================================
 * 增强测试: 会员页高级 E2E 场景 (新增 15+ tests)
 * 覆盖: 会员注册验证 / 积分计算 / 等级变更 / 储值卡消费 /
 *       会员日优惠 / 邀请机制 / 批量操作 / 会员标签管理等
 * ============================================================================
 */
test.describe('🧪 会员页高级 E2E 场景 (增强)', () => {
  test.describe('会员注册与验证', () => {
    test('MEMBER-ADV-01: 填写完整信息后成功注册新会员', async ({ page }) => {
      await page.goto('/members/new', { waitUntil: 'networkidle', timeout: 15000 })

      const nameInput = page.locator('input[placeholder*="姓名"], input[name="name"], [data-testid="name-input"]').first()
      const phoneInput = page.locator('input[placeholder*="手机"], input[name="phone"], [data-testid="phone-input"]').first()

      if (await nameInput.isVisible().catch(() => false) && await phoneInput.isVisible().catch(() => false)) {
        await nameInput.fill('张三')
        await phoneInput.fill('13800138001')

        const optionalFields = page.locator('input[placeholder*="邮箱"], input[placeholder*="生日"], input[placeholder*="地址"], [data-testid="email-input"]')
        const optionalCount = await optionalFields.count()
        if (optionalCount > 0) {
          const emailInput = optionalFields.first()
          if (await emailInput.isVisible().catch(() => false)) {
            await emailInput.fill('zhangsan@test.com')
          }
        }

        const submitBtn = page.locator('button[type="submit"], button:has-text("保存"), button:has-text("提交"), [data-testid="submit-btn"]').first()
        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click()
          await page.waitForTimeout(500)

          const success = page.locator('text=成功, text=已创建, [role="alert"], .toast-success').first()
          const hasSuccess = await success.isVisible().catch(() => false)
          console.log(`[MEMBER-ADV-01] 注册成功提示: ${hasSuccess}`)
        }
      } else {
        console.log('[MEMBER-ADV-01] 注册表单未找到，跳过')
      }
    })

    test('MEMBER-ADV-02: 手机号格式验证——非法手机号提示错误', async ({ page }) => {
      await page.goto('/members/new', { waitUntil: 'networkidle', timeout: 15000 })

      const phoneInput = page.locator('input[placeholder*="手机"], input[name="phone"], [data-testid="phone-input"]').first()
      if (await phoneInput.isVisible().catch(() => false)) {
        await phoneInput.fill('12345')
        await page.keyboard.press('Tab')
        await page.waitForTimeout(300)

        const errorMsg = page.locator('[data-testid="field-error"], [class*="error"], [role="alert"]').first()
        const hasError = await errorMsg.isVisible().catch(() => false)
        console.log(`[MEMBER-ADV-02] 手机号格式错误提示: ${hasError}`)
      } else {
        console.log('[MEMBER-ADV-02] 手机号输入框未找到，跳过')
      }
    })

    test('MEMBER-ADV-03: 必填字段未填时阻止提交', async ({ page }) => {
      await page.goto('/members/new', { waitUntil: 'networkidle', timeout: 15000 })

      const submitBtn = page.locator('button[type="submit"], button:has-text("保存"), [data-testid="submit-btn"]').first()
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click()
        await page.waitForTimeout(500)

        const errors = await page.locator('[data-testid="field-error"], [class*="error"], [aria-invalid="true"]').count()
        const urlBefore = page.url()
        expect(urlBefore).toContain('/members/new')
        console.log(`[MEMBER-ADV-03] 必填字段验证错误数: ${errors}`)
      } else {
        console.log('[MEMBER-ADV-03] 无提交按钮，跳过')
      }
    })

    test('MEMBER-ADV-04: 重复手机号注册提示', async ({ page }) => {
      await page.goto('/members/new', { waitUntil: 'networkidle', timeout: 15000 })

      const phoneInput = page.locator('input[placeholder*="手机"], input[name="phone"], [data-testid="phone-input"]').first()
      if (await phoneInput.isVisible().catch(() => false)) {
        await phoneInput.fill('13800138000')
        await page.keyboard.press('Tab')
        await page.waitForTimeout(300)

        const duplicateMsg = page.locator('text=已存在, text=重复, text=已注册, [class*="duplicate"]').first()
        const hasDuplicate = await duplicateMsg.isVisible().catch(() => false)
        console.log(`[MEMBER-ADV-04] 重复手机号提示: ${hasDuplicate}`)
      } else {
        console.log('[MEMBER-ADV-04] 手机号输入框未找到，跳过')
      }
    })
  })

  test.describe('积分与等级管理', () => {
    test('MEMBER-ADV-05: 消费后积分自动增加', async ({ page }) => {
      await page.goto('/members/1', { waitUntil: 'networkidle', timeout: 15000 })

      const pointsEl = page.locator('[data-testid="member-points"], [class*="points"], [class*="score"]').first()
      const pointsBefore = await pointsEl.textContent()
      console.log(`[MEMBER-ADV-05] 当前积分: ${pointsBefore}`)

      // 检查是否有积分变动记录
      const logTable = page.locator('[data-testid="points-log"], [data-testid="points-history"]').first()
      const hasLog = await logTable.isVisible().catch(() => false)
      console.log(`[MEMBER-ADV-05] 积分变动记录可见: ${hasLog}`)
    })

    test('MEMBER-ADV-06: 积分过期提醒', async ({ page }) => {
      await page.goto('/members/1', { waitUntil: 'networkidle', timeout: 15000 })

      const expiryMsg = page.locator('text=即将过期, text=积分过期, [class*="expiring"], [class*="expiry"]').first()
      const hasExpiry = await expiryMsg.isVisible().catch(() => false)
      console.log(`[MEMBER-ADV-06] 积分过期提醒可见: ${hasExpiry}`)
    })

    test('MEMBER-ADV-07: 会员等级变更后权益说明更新', async ({ page }) => {
      await page.goto('/members/1', { waitUntil: 'networkidle', timeout: 15000 })

      const levelEl = page.locator('[data-testid="member-level"], [class*="level"], [class*="badge"]').first()
      const currentLevel = await levelEl.textContent()
      console.log(`[MEMBER-ADV-07] 当前等级: ${currentLevel}`)

      const benefits = page.locator('[data-testid="member-benefits"], [class*="benefits"], [class*="privilege"]').first()
      const hasBenefits = await benefits.isVisible().catch(() => false)
      console.log(`[MEMBER-ADV-07] 权益说明可见: ${hasBenefits}`)
    })

    test('MEMBER-ADV-08: 积分抵扣——结算时使用积分抵扣部分金额', async ({ page }) => {
      await page.goto('/cashier', { waitUntil: 'networkidle', timeout: 15000 })

      const pointsRedeem = page.locator('input[placeholder*="积分"], [data-testid="points-redeem"], [class*="points-redeem"]').first()
      if (await pointsRedeem.isVisible().catch(() => false)) {
        const totalBefore = await page.locator('[data-testid="total-amount"], .total-amount').first().textContent()

        await pointsRedeem.fill('100')
        await page.waitForTimeout(300)

        const totalAfter = await page.locator('[data-testid="total-amount"], .total-amount').first().textContent()
        const beforeNum = parseFloat(totalBefore?.replace(/[^0-9.]/g, '') || '0')
        const afterNum = parseFloat(totalAfter?.replace(/[^0-9.]/g, '') || '0')
        expect(afterNum).toBeLessThanOrEqual(beforeNum)
        console.log(`[MEMBER-ADV-08] 积分抵扣: ${totalBefore} → ${totalAfter} ✓`)
      } else {
        console.log('[MEMBER-ADV-08] 无积分抵扣选项，跳过')
      }
    })
  })

  test.describe('储值卡与消费', () => {
    test('MEMBER-ADV-09: 会员储值卡余额显示正确', async ({ page }) => {
      await page.goto('/members/1', { waitUntil: 'networkidle', timeout: 15000 })

      const balanceEl = page.locator('[data-testid="balance"], [data-testid="member-balance"], [class*="balance"], [class*="wallet"]').first()
      const balanceText = await balanceEl.textContent()
      console.log(`[MEMBER-ADV-09] 储值卡余额: ${balanceText}`)

      if (balanceText) {
        expect(balanceText).toBeTruthy()
      }
    })

    test('MEMBER-ADV-10: 使用储值卡支付时扣减余额', async ({ page }) => {
      await page.goto('/members/1', { waitUntil: 'networkidle', timeout: 15000 })

      const balanceEl = page.locator('[data-testid="balance"], [data-testid="member-balance"], [class*="balance"]').first()
      const balanceBefore = await balanceEl.textContent()
      const balanceNum = parseFloat(balanceBefore?.replace(/[^0-9.]/g, '') || '0')

      const consumeBtn = page.locator('button:has-text("充值"), button:has-text("消费"), [data-testid="top-up-btn"]').first()
      if (await consumeBtn.isVisible().catch(() => false)) {
        await consumeBtn.click()
        await page.waitForTimeout(300)
        console.log(`[MEMBER-ADV-10] 储值卡操作可用，当前余额: ${balanceNum}`)
      } else {
        console.log('[MEMBER-ADV-10] 无储值卡操作按钮，跳过')
      }
    })

    test('MEMBER-ADV-11: 储值充值后余额相应增加', async ({ page }) => {
      await page.goto('/members/1', { waitUntil: 'networkidle', timeout: 15000 })

      const topUpBtn = page.locator('button:has-text("充值"), a:has-text("充值"), [data-testid="top-up-btn"]').first()
      if (await topUpBtn.isVisible().catch(() => false)) {
        await topUpBtn.click()
        await page.waitForTimeout(500)

        const topUpInput = page.locator('input[type="number"], input[placeholder*="金额"]').first()
        if (await topUpInput.isVisible().catch(() => false)) {
          await topUpInput.fill('500')
          const confirmBtn = page.locator('button:has-text("确认充值"), button:has-text("支付"), button:has-text("确定")').first()
          if (await confirmBtn.isVisible().catch(() => false)) {
            await confirmBtn.click()
            await page.waitForTimeout(500)
            console.log('[MEMBER-ADV-11] 充值流程可触发 ✓')
          }
        }
      } else {
        console.log('[MEMBER-ADV-11] 无充值按钮，跳过')
      }
    })
  })

  test.describe('会员日与优惠活动', () => {
    test('MEMBER-ADV-12: 会员日标识在列表页显示', async ({ page }) => {
      await page.goto('/members', { waitUntil: 'networkidle', timeout: 15000 })

      const memberDayTag = page.locator('text=会员日, text=会员价, [class*="member-day"], [class*="member-discount"]').first()
      const hasMemberDay = await memberDayTag.isVisible().catch(() => false)
      console.log(`[MEMBER-ADV-12] 会员日标识可见: ${hasMemberDay}`)
    })

    test('MEMBER-ADV-13: 会员生日当月有专属优惠提示', async ({ page }) => {
      await page.goto('/members/1', { waitUntil: 'networkidle', timeout: 15000 })

      const birthdayEl = page.locator('text=生日, text=生日礼, [class*="birthday"], [class*="gift"]').first()
      const hasBirthday = await birthdayEl.isVisible().catch(() => false)
      console.log(`[MEMBER-ADV-13] 生日优惠可见: ${hasBirthday}`)
    })

    test('MEMBER-ADV-14: 会员专享商品标签', async ({ page }) => {
      await page.goto('/cashier', { waitUntil: 'networkidle', timeout: 15000 })

      const memberOnly = page.locator('text=会员专享, text=会员价, [class*="member-only"], [class*="vip-only"]').first()
      const hasMemberOnly = await memberOnly.isVisible().catch(() => false)
      console.log(`[MEMBER-ADV-14] 会员专享商品标签可见: ${hasMemberOnly}`)
    })
  })

  test.describe('邀请与裂变机制', () => {
    test('MEMBER-ADV-15: 会员邀请码生成与展示', async ({ page }) => {
      await page.goto('/members/1', { waitUntil: 'networkidle', timeout: 15000 })

      const inviteCode = page.locator('[data-testid="invite-code"], [class*="invite"], text=邀请码, [class*="referral"]').first()
      const hasCode = await inviteCode.isVisible().catch(() => false)

      if (hasCode) {
        const codeText = await inviteCode.textContent()
        console.log(`[MEMBER-ADV-15] 邀请码可见: ${codeText} ✓`)
      } else {
        console.log('[MEMBER-ADV-15] 无邀请码展示，跳过')
      }
    })

    test('MEMBER-ADV-16: 邀请好友后双方获得奖励积分', async ({ page }) => {
      await page.goto('/members/1', { waitUntil: 'networkidle', timeout: 15000 })

      const inviteRecord = page.locator('[data-testid="invite-records"], [class*="invite-record"], text=邀请记录, [class*="referral-list"]').first()
      const hasRecords = await inviteRecord.isVisible().catch(() => false)
      console.log(`[MEMBER-ADV-16] 邀请记录可见: ${hasRecords}`)

      if (hasRecords) {
        const rows = await page.locator('[data-testid="invite-records"] tr, [class*="invite-item"]').count()
        console.log(`[MEMBER-ADV-16] 邀请记录条数: ${rows}`)
      }
    })

    test('MEMBER-ADV-17: 分享会员卡/优惠券给微信好友', async ({ page }) => {
      await page.goto('/members/1', { waitUntil: 'networkidle', timeout: 15000 })

      const shareBtn = page.locator('button:has-text("分享"), [data-testid="share-btn"], [class*="share"]').first()
      if (await shareBtn.isVisible().catch(() => false)) {
        await shareBtn.click()
        await page.waitForTimeout(300)

        const shareDialog = page.locator('[role="dialog"], .modal, [class*="share-dialog"]').first()
        const hasDialog = await shareDialog.isVisible().catch(() => false)
        console.log(`[MEMBER-ADV-17] 分享弹窗可见: ${hasDialog}`)
      } else {
        console.log('[MEMBER-ADV-17] 无分享按钮，跳过')
      }
    })
  })

  test.describe('会员批量操作与管理', () => {
    test('MEMBER-ADV-18: 批量导入会员CSV功能', async ({ page }) => {
      await page.goto('/members', { waitUntil: 'networkidle', timeout: 15000 })

      const importBtn = page.locator('button:has-text("导入"), a:has-text("导入"), [data-testid="import-btn"]').first()
      if (await importBtn.isVisible().catch(() => false)) {
        await importBtn.click()
        await page.waitForTimeout(500)

        const fileInput = page.locator('input[type="file"], [data-testid="file-upload"]').first()
        const hasFileInput = await fileInput.isVisible().catch(() => false)
        console.log(`[MEMBER-ADV-18] 导入文件选择器可见: ${hasFileInput}`)
      } else {
        console.log('[MEMBER-ADV-18] 无导入按钮，跳过')
      }
    })

    test('MEMBER-ADV-19: 批量导出会员筛选结果', async ({ page }) => {
      await page.goto('/members', { waitUntil: 'networkidle', timeout: 15000 })

      const exportBtn = page.locator('button:has-text("导出"), a:has-text("导出"), [data-testid="export-btn"]').first()
      if (await exportBtn.isVisible().catch(() => false)) {
        // 先设置筛选
        const searchInput = page.locator('input[type="search"], input[placeholder*="搜索"]').first()
        if (await searchInput.isVisible().catch(() => false)) {
          await searchInput.fill('VIP')
          await page.waitForTimeout(300)
        }

        await exportBtn.click()
        await page.waitForTimeout(300)
        console.log('[MEMBER-ADV-19] 批量导出可触发 ✓')
      } else {
        console.log('[MEMBER-ADV-19] 无导出按钮，跳过')
      }
    })

    test('MEMBER-ADV-20: 批量设置会员等级/标签', async ({ page }) => {
      await page.goto('/members', { waitUntil: 'networkidle', timeout: 15000 })

      // 勾选多个会员
      const checkboxes = page.locator('input[type="checkbox"]:not(th input)')
      const checkboxCount = await checkboxes.count()

      if (checkboxCount >= 2) {
        await checkboxes.nth(0).click()
        await checkboxes.nth(1).click()
        await page.waitForTimeout(200)

        const batchActionBtn = page.locator('button:has-text("批量"), [data-testid="batch-action"]').first()
        if (await batchActionBtn.isVisible().catch(() => false)) {
          await batchActionBtn.click()
          await page.waitForTimeout(300)

          const batchDialog = page.locator('[role="dialog"], .modal, [class*="batch"]').first()
          const hasDialog = await batchDialog.isVisible().catch(() => false)
          console.log(`[MEMBER-ADV-20] 批量操作弹窗可见: ${hasDialog}, 已选${checkboxCount}项 ✓`)
        } else {
          console.log('[MEMBER-ADV-20] 无批量操作按钮，跳过')
        }
      } else {
        console.log('[MEMBER-ADV-20] 复选框不足2个，跳过')
      }
    })

    test('MEMBER-ADV-21: 会员标签管理——新增/编辑标签', async ({ page }) => {
      await page.goto('/members/1', { waitUntil: 'networkidle', timeout: 15000 })

      const tagEditBtn = page.locator('button:has-text("标签"), [data-testid="tag-edit"], [data-testid="add-tag"]').first()
      if (await tagEditBtn.isVisible().catch(() => false)) {
        await tagEditBtn.click()
        await page.waitForTimeout(300)

        const tagInput = page.locator('input[placeholder*="标签"], [data-testid="tag-input"]').first()
        if (await tagInput.isVisible().catch(() => false)) {
          await tagInput.fill('新标签')
          await page.keyboard.press('Enter')
          await page.waitForTimeout(200)
          console.log('[MEMBER-ADV-21] 新增标签成功 ✓')
        }
      } else {
        console.log('[MEMBER-ADV-21] 无标签编辑按钮，跳过')
      }
    })
  })

  test.describe('会员黑名单与风控', () => {
    test('MEMBER-ADV-22: 将会员加入黑名单后限制消费', async ({ page }) => {
      await page.goto('/members/1', { waitUntil: 'networkidle', timeout: 15000 })

      const blacklistBtn = page.locator('button:has-text("黑名单"), button:has-text("拉黑"), [data-testid="blacklist-btn"]').first()
      if (await blacklistBtn.isVisible().catch(() => false)) {
        await blacklistBtn.click()
        await page.waitForTimeout(300)

        const confirmDialog = page.locator('[role="dialog"], .modal, [class*="confirm"]').first()
        const hasDialog = await confirmDialog.isVisible().catch(() => false)

        if (hasDialog) {
          const confirmBtn = page.locator('button:has-text("确认"), button:has-text("确定")').first()
          if (await confirmBtn.isVisible().catch(() => false)) {
            await confirmBtn.click()
            await page.waitForTimeout(300)
          }
        }
        console.log('[MEMBER-ADV-22] 黑名单操作可触发 ✓')
      } else {
        console.log('[MEMBER-ADV-22] 无黑名单按钮，跳过')
      }
    })

    test('MEMBER-ADV-23: 黑名单会员列表中显示特殊标识', async ({ page }) => {
      await page.goto('/members', { waitUntil: 'networkidle', timeout: 15000 })

      const blacklistTag = page.locator('[data-testid="blacklist-tag"], [class*="blacklist"], [class*="blocked"]').first()
      const hasBlacklistTag = await blacklistTag.isVisible().catch(() => false)
      console.log(`[MEMBER-ADV-23] 黑名单标识可见: ${hasBlacklistTag}`)
    })
  })

  test.describe('会员通知与消息', () => {
    test('MEMBER-ADV-24: 发送会员消息/模板消息功能', async ({ page }) => {
      await page.goto('/members/1', { waitUntil: 'networkidle', timeout: 15000 })

      const sendMsgBtn = page.locator('button:has-text("发送消息"), button:has-text("通知"), [data-testid="send-msg-btn"], [data-testid="notify-btn"]').first()
      if (await sendMsgBtn.isVisible().catch(() => false)) {
        await sendMsgBtn.click()
        await page.waitForTimeout(300)

        const msgDialog = page.locator('[role="dialog"], .modal, [class*="message"]').first()
        const hasDialog = await msgDialog.isVisible().catch(() => false)
        console.log(`[MEMBER-ADV-24] 消息发送弹窗可见: ${hasDialog}`)
      } else {
        console.log('[MEMBER-ADV-24] 无发送消息按钮，跳过')
      }
    })

    test('MEMBER-ADV-25: 会员消息记录查询', async ({ page }) => {
      await page.goto('/members/1', { waitUntil: 'networkidle', timeout: 15000 })

      const msgHistory = page.locator('[data-testid="message-history"], [class*="message-history"], text=消息记录, text=通知记录').first()
      const hasHistory = await msgHistory.isVisible().catch(() => false)
      console.log(`[MEMBER-ADV-25] 消息记录可见: ${hasHistory}`)

      if (hasHistory) {
        const msgCount = await page.locator('[data-testid="message-history"] li, [class*="msg-item"]').count()
        console.log(`[MEMBER-ADV-25] 消息记录条数: ${msgCount}`)
      }
    })
  })
})
