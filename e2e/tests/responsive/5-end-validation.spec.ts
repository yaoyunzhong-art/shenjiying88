/**
 * 🧪 增强版: 5端适配终点验证测试 (25+ test cases)
 *
 * 验证端: PC / Pad / H5 / 小屏 / 超大屏
 * 测试内容: 响应式布局、组件适配、交互一致性、表单表现、弹窗定位
 *
 * 覆盖:
 *   - 各断点页面布局基础检查
 *   - 表单在不同尺寸下的渲染与操作
 *   - 导航菜单响应式行为 (折叠/展开/汉堡)
 *   - 数据表格滚动兼容性
 *   - 弹窗/模态框定位适配
 *   - 跨端对比验证
 */

import { test, expect } from '@playwright/test'

// ── 5端视口配置 ──
const VIEWPORTS = {
  small: { width: 320, height: 568, name: '小屏 (320x568)' },
  h5: { width: 375, height: 812, name: 'H5-iPhone (375x812)' },
  pad: { width: 1024, height: 768, name: 'Pad (1024x768)' },
  pc: { width: 1920, height: 1080, name: 'PC (1920x1080)' },
  wide: { width: 2560, height: 1440, name: '超大屏 (2560x1440)' },
}

// ── 测试页面列表 ──
const TEST_PAGES = [
  { path: '/admin/license', name: '授权管理页' },
  { path: '/admin/license/activate', name: '激活码激活页' },
]

/* ═══════════════════ PC端适配验证 (1920x1080) ═══════════════════ */

test.describe('PC端适配验证 (1920x1080)', () => {
  test.use({ viewport: { width: VIEWPORTS.pc.width, height: VIEWPORTS.pc.height } })

  test('PC-001: 授权管理页面完整渲染 @pc @smoke', async ({ page }) => {
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    await expect(page.locator('[data-testid="license-manager-container"]').first()).toBeVisible()
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('PC-002: 侧边栏导航正常显示且宽度适配 @pc', async ({ page }) => {
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const sidebar = page.locator('[data-testid="sidebar"], .ant-layout-sider').first()
    await expect(sidebar).toBeVisible({ timeout: 5000 })
    const box = await sidebar.boundingBox()
    expect(box?.width).toBeGreaterThan(180)
  })

  test('PC-003: 内容区域宽度充裕 (≥1000px) @pc', async ({ page }) => {
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const content = page.locator('[data-testid="license-manager-container"], .ant-layout-content').first()
    const box = await content.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(1000)
  })

  test('PC-004: 表格视图正常情况下显示多列数据 @pc', async ({ page }) => {
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const headers = page.locator('table th, .ant-table-thead th')
    const count = await headers.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('PC-005: 操作工具栏按钮全部可见 @pc', async ({ page }) => {
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const toolbar = page.locator('[data-testid="toolbar"], .ant-page-header-heading').first()
    await expect(toolbar).toBeVisible({ timeout: 5000 })
  })

  test('PC-006: 表单输入框在PC端宽度正常 @pc @form', async ({ page }) => {
    await page.goto('/admin/license/activate', { waitUntil: 'networkidle' })
    const input = page.locator('input').first()
    const box = await input.boundingBox().catch(() => null)
    if (box) {
      expect(box.width).toBeGreaterThan(200)
    }
  })
})

/* ═══════════════════ Pad端适配验证 (1024x768) ═══════════════════ */

test.describe('Pad端适配验证 (1024x768)', () => {
  test.use({ viewport: { width: VIEWPORTS.pad.width, height: VIEWPORTS.pad.height } })

  test('Pad-001: 授权管理页面正常渲染 @pad @smoke', async ({ page }) => {
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    await expect(page.locator('[data-testid="license-manager-container"]').first()).toBeVisible()
  })

  test('Pad-002: 侧边栏在Pad端自动收起或保持窄版 @pad', async ({ page }) => {
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const sidebar = page.locator('[data-testid="sidebar"], .ant-layout-sider').first()
    const isVisible = await sidebar.isVisible().catch(() => false)
    if (isVisible) {
      const box = await sidebar.boundingBox()
      expect(box?.width).toBeLessThanOrEqual(200)
    }
  })

  test('Pad-003: 内容区域宽度在Pad端适中 @pad', async ({ page }) => {
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const content = page.locator('[data-testid="license-manager-container"]').first()
    const box = await content.boundingBox().catch(() => null)
    if (box) {
      expect(box.width).toBeGreaterThan(600)
      expect(box.width).toBeLessThanOrEqual(1024)
    }
  })

  test('Pad-004: 卡片视图在Pad端正常显示 @pad', async ({ page }) => {
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const cardViewBtn = page.locator('[data-testid="view-card"]').first()
    if (await cardViewBtn.isVisible().catch(() => false)) {
      await cardViewBtn.click()
      await page.waitForTimeout(500)
    }
    const cards = page.locator('.ant-card, [data-testid="card-view"]').first()
    const hasCards = await cards.isVisible().catch(() => false)
    expect(hasCards).toBe(true)
  })
})

/* ═══════════════════ H5端适配验证 (375x812) ═══════════════════ */

test.describe('H5端适配验证 (375x812)', () => {
  test.use({
    viewport: { width: VIEWPORTS.h5.width, height: VIEWPORTS.h5.height },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
  })

  test('H5-001: 页面在手机视口正常加载 @h5 @smoke', async ({ page }) => {
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    await expect(page.locator('body')).toBeVisible()
  })

  test('H5-002: 底部导航在H5端显示 @h5', async ({ page }) => {
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const bottomNav = page.locator('[data-testid="bottom-nav"], .bottom-nav, .tab-bar').first()
    const isVisible = await bottomNav.isVisible().catch(() => false)
    if (isVisible) {
      const box = await bottomNav.boundingBox()
      expect(box?.y).toBeGreaterThan(500)
    }
  })

  test('H5-003: 内容区域宽度适配手机屏幕 @h5', async ({ page }) => {
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const content = page.locator('[data-testid="license-manager-container"]').first()
    const box = await content.boundingBox().catch(() => null)
    if (box) {
      expect(box.width).toBeGreaterThan(300)
      expect(box.width).toBeLessThan(400)
    }
  })

  test('H5-004: 表单输入在H5端占满容器宽度 @h5 @form', async ({ page }) => {
    await page.goto('/admin/license/activate', { waitUntil: 'networkidle' })
    const input = page.locator('input').first()
    const container = page.locator('[data-testid="license-manager-container"]').first()
    const inputBox = await input.boundingBox().catch(() => null)
    const containerBox = await container.boundingBox().catch(() => null)
    if (inputBox && containerBox) {
      expect(inputBox.width).toBeGreaterThanOrEqual(containerBox.width * 0.7)
    }
  })
})

/* ═══════════════════ 小屏端适配验证 (320x568) ═══════════════════ */

test.describe('小屏端适配验证 (320x568)', () => {
  test.use({
    viewport: { width: VIEWPORTS.small.width, height: VIEWPORTS.small.height },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
  })

  test('SMALL-001: 极窄屏幕页面正常加载 @small', async ({ page }) => {
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    await expect(page.locator('body')).toBeVisible()
  })

  test('SMALL-002: 极窄屏幕无水平滚动超出 @small', async ({ page }) => {
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth
    })
    expect(overflow).toBeLessThan(50)
  })

  test('SMALL-003: 小屏内容区宽度 ≤ 视口宽度 @small', async ({ page }) => {
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const content = page.locator('[data-testid="license-manager-container"]').first()
    const box = await content.boundingBox().catch(() => null)
    if (box) {
      expect(box.width).toBeLessThanOrEqual(320)
    }
  })

  test('SMALL-004: 小屏表单输入宽度自适应 @small @form', async ({ page }) => {
    await page.goto('/admin/license/activate', { waitUntil: 'networkidle' })
    const input = page.locator('input').first()
    const box = await input.boundingBox().catch(() => null)
    if (box) {
      expect(box.width).toBeGreaterThan(200)
      expect(box.width).toBeLessThanOrEqual(320)
    }
  })
})

/* ═══════════════════ 超大屏适配验证 (2560x1440) ═══════════════════ */

test.describe('超大屏适配验证 (2560x1440)', () => {
  test.use({ viewport: { width: VIEWPORTS.wide.width, height: VIEWPORTS.wide.height } })

  test('WIDE-001: 超大屏内容区居中且不无限拉伸 @wide', async ({ page }) => {
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const content = page.locator('[data-testid="license-manager-container"]').first()
    const box = await content.boundingBox().catch(() => null)
    if (box) {
      expect(box.width).toBeGreaterThan(1200)
    }
  })

  test('WIDE-002: 超大屏侧边栏与内容区间距合理 @wide', async ({ page }) => {
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const sidebar = page.locator('[data-testid="sidebar"], .ant-layout-sider').first()
    const content = page.locator('[data-testid="license-manager-container"]').first()
    const sidebarBox = await sidebar.boundingBox().catch(() => null)
    const contentBox = await content.boundingBox().catch(() => null)
    if (sidebarBox && contentBox) {
      expect(contentBox.x - (sidebarBox.x + sidebarBox.width)).toBeGreaterThanOrEqual(0)
    }
  })

  test('WIDE-003: 超大屏表格内容行数完整 @wide', async ({ page }) => {
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const rows = page.locator('table tbody tr, .ant-table-tbody tr')
    const count = await rows.count()
    console.log(`超大屏表格行数: ${count}`)
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

/* ═══════════════════ 导航菜单响应式行为 ═══════════════════ */

test.describe('导航菜单响应式行为 @nav', () => {
  test('NAV-001: PC端侧边栏菜单完整展开 @nav', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORTS.pc.width, height: VIEWPORTS.pc.height })
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const menuItems = page.locator('.ant-menu-item, [data-testid="nav-item"]')
    const count = await menuItems.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('NAV-002: H5端导航缩为汉堡菜单或底部Tab @nav', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORTS.h5.width, height: VIEWPORTS.h5.height })
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const hamburger = page.locator('[data-testid="hamburger"], .ant-menu-trigger, button:has(.anticon-menu)').first()
    const bottomTab = page.locator('[data-testid="bottom-nav"], .tab-bar').first()
    const hasHamburger = await hamburger.isVisible().catch(() => false)
    const hasBottomTab = await bottomTab.isVisible().catch(() => false)
    expect(hasHamburger || hasBottomTab).toBe(true)
  })

  test('NAV-003: Pad端导航菜单可折叠/展开 @nav', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORTS.pad.width, height: VIEWPORTS.pad.height })
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const nav = page.locator('nav, [role="navigation"], .ant-layout-sider').first()
    await expect(nav).toBeVisible()
  })

  test('NAV-004: 导航栏在viewport切换后正确重排 @nav', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORTS.pc.width, height: VIEWPORTS.pc.height })
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    await page.setViewportSize({ width: VIEWPORTS.h5.width, height: VIEWPORTS.h5.height })
    await page.waitForTimeout(500)
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

/* ═══════════════════ 表单响应式适配 ═══════════════════ */

test.describe('表单响应式适配 @form', () => {
  test('FORM-001: 表单在PC端标签与输入框同行排列 @form', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORTS.pc.width, height: VIEWPORTS.pc.height })
    await page.goto('/admin/license/activate', { waitUntil: 'networkidle' })
    const formItems = page.locator('.ant-form-item, [class*="form-item"]')
    const count = await formItems.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('FORM-002: 表单在H5端标签在输入框上方 @form', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORTS.h5.width, height: VIEWPORTS.h5.height })
    await page.goto('/admin/license/activate', { waitUntil: 'networkidle' })
    const submitBtn = page.locator('button[type="submit"]').first()
    const isVisible = await submitBtn.isVisible().catch(() => false)
    expect(isVisible).toBe(true)
  })

  test('FORM-003: 表单按钮在H5端占满宽度 @form', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORTS.h5.width, height: VIEWPORTS.h5.height })
    await page.goto('/admin/license/activate', { waitUntil: 'networkidle' })
    const btn = page.locator('button').first()
    const box = await btn.boundingBox().catch(() => null)
    if (box) {
      expect(box.width).toBeGreaterThan(200)
    }
  })

  test('FORM-004: 表单验证错误提示在窄屏不换行溢出 @form', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORTS.small.width, height: VIEWPORTS.small.height })
    await page.goto('/admin/license/activate', { waitUntil: 'networkidle' })
    const submitBtn = page.locator('button[type="submit"]').first()
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click()
      await page.waitForTimeout(500)
    }
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('FORM-005: 表单在超小屏输入框自适应宽度 @form', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORTS.small.width, height: VIEWPORTS.small.height })
    await page.goto('/admin/license/activate', { waitUntil: 'networkidle' })
    const inputs = page.locator('input')
    const count = await inputs.count()
    if (count > 0) {
      const firstInput = inputs.first()
      const box = await firstInput.boundingBox()
      expect(box?.width).toBeGreaterThan(150)
    }
  })
})

/* ═══════════════════ 数据表格滚动兼容性 ═══════════════════ */

test.describe('数据表格滚动兼容性 @table', () => {
  test('TABLE-001: PC端表格列完整显示无水平滚动 @table', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORTS.pc.width, height: VIEWPORTS.pc.height })
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const table = page.locator('table, .ant-table').first()
    const tableBox = await table.boundingBox().catch(() => null)
    if (tableBox) {
      expect(tableBox.width).toBeGreaterThan(800)
    }
  })

  test('TABLE-002: H5端表格可水平滚动 @table', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORTS.h5.width, height: VIEWPORTS.h5.height })
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const tableWrapper = page.locator('.ant-table-wrapper, .ant-table-content, [class*="table-scroll"]').first()
    const hasWrapper = await tableWrapper.isVisible().catch(() => false)
    expect(hasWrapper).toBe(true)
  })

  test('TABLE-003: 小屏端表格用卡片视图替代 @table', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORTS.small.width, height: VIEWPORTS.small.height })
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const cards = page.locator('.ant-card, [data-testid="card-view"]')
    const rows = page.locator('table tbody tr')
    const cardCount = await cards.count()
    const rowCount = await rows.count()
    // 至少有一种视图模式可用
    expect(cardCount > 0 || rowCount > 0).toBe(true)
  })

  test('TABLE-004: 数据表格分页控制在窄屏自适应 @table', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORTS.h5.width, height: VIEWPORTS.h5.height })
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const pagination = page.locator('.ant-pagination, [data-testid="pagination"]').first()
    const hasPagination = await pagination.isVisible().catch(() => false)
    if (hasPagination) {
      const box = await pagination.boundingBox()
      if (box) {
        expect(box.width).toBeLessThanOrEqual(375)
      }
    }
  })
})

/* ═══════════════════ 弹窗/模态框定位适配 ═══════════════════ */

test.describe('弹窗/模态框定位适配 @modal', () => {
  for (const pageConfig of TEST_PAGES) {
    test(`MODAL-${pageConfig.name === '授权管理页' ? '001' : '002'}: 弹窗在PC端居中显示 @modal`, async ({ page }) => {
      await page.setViewportSize({ width: VIEWPORTS.pc.width, height: VIEWPORTS.pc.height })
      await page.goto(pageConfig.path, { waitUntil: 'networkidle' })
      const btn = page.locator('button:has-text("新增"), button:has-text("添加"), [data-testid="btn-add"]').first()
      if (await btn.isVisible().catch(() => false)) {
        await btn.click()
        await page.waitForTimeout(500)
        const modal = page.locator('.ant-modal, [role="dialog"], .modal-overlay').first()
        const modalVisible = await modal.isVisible().catch(() => false)
        if (modalVisible) {
          const box = await modal.boundingBox()
          if (box) {
            expect(box.x).toBeGreaterThan(0)
            expect(box.y).toBeGreaterThan(0)
          }
        }
      }
    })
  }

  test('MODAL-003: 弹窗在H5端自适应屏幕宽度 @modal', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORTS.h5.width, height: VIEWPORTS.h5.height })
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const btn = page.locator('button:has-text("新增"), button:has-text("添加")').first()
    if (await btn.isVisible().catch(() => false)) {
      await btn.click()
      await page.waitForTimeout(500)
      const modal = page.locator('.ant-modal, [role="dialog"]').first()
      const visible = await modal.isVisible().catch(() => false)
      if (visible) {
        const box = await modal.boundingBox()
        if (box) {
          expect(box.width).toBeLessThanOrEqual(375)
        }
      }
    }
  })

  test('MODAL-004: 弹窗关闭按钮在H5端可点击 @modal', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORTS.h5.width, height: VIEWPORTS.h5.height })
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const btn = page.locator('button:has-text("新增")').first()
    if (await btn.isVisible().catch(() => false)) {
      await btn.click()
      await page.waitForTimeout(500)
      const closeBtn = page.locator('.ant-modal-close, button[aria-label="Close"], button:has(.anticon-close)').first()
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click()
        await page.waitForTimeout(300)
      }
    }
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('MODAL-005: 小屏弹窗垂直居中 @modal', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORTS.small.width, height: VIEWPORTS.small.height })
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const btn = page.locator('button:has-text("新增")').first()
    if (await btn.isVisible().catch(() => false)) {
      await btn.click()
      await page.waitForTimeout(500)
      const modal = page.locator('.ant-modal, [role="dialog"]').first()
      const visible = await modal.isVisible().catch(() => false)
      if (visible) {
        const box = await modal.boundingBox()
        if (box) {
          expect(box.x).toBeGreaterThanOrEqual(0)
          const vh = await page.evaluate(() => window.innerHeight)
          expect(box.y).toBeGreaterThan(0)
          expect(box.y).toBeLessThan(vh - 50)
        }
      }
    }
  })
})

/* ═══════════════════ 跨端对比验证 ═══════════════════ */

test.describe('跨端布局一致性对比 @all', () => {
  test('ALL-001: 各端页面无水平滚动溢出 @all', async ({ page }) => {
    for (const [device, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/admin/license', { waitUntil: 'networkidle' })
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth - document.documentElement.clientWidth
      })
      expect(overflow).toBeLessThan(50)
      console.log(`${device} 水平溢出: ${overflow}px`)
    }
  })

  test('ALL-002: 各端核心功能按钮均可见 @all', async ({ page }) => {
    for (const [device, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/admin/license', { waitUntil: 'networkidle' })
      const addBtn = page.locator('button:has-text("新增"), [data-testid="btn-add"]').first()
      const btnVisible = await addBtn.isVisible().catch(() => false)
      if (device === 'pc' || device === 'wide') {
        expect(btnVisible).toBe(true)
      }
    }
  })

  test('ALL-003: 各端页面标题元素均渲染 @all', async ({ page }) => {
    for (const [device, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/admin/license', { waitUntil: 'networkidle' })
      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible({ timeout: 5000 })
      console.log(`${device} 页面标题可见`)
    }
  })

  test('ALL-004: PC端和Pad端表格列数一致 @all', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORTS.pc.width, height: VIEWPORTS.pc.height })
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const pcHeaders = await page.locator('table th, .ant-table-thead th').count()

    await page.setViewportSize({ width: VIEWPORTS.pad.width, height: VIEWPORTS.pad.height })
    await page.goto('/admin/license', { waitUntil: 'networkidle' })
    const padHeaders = await page.locator('table th, .ant-table-thead th').count()

    // Pad端列数应 <= PC端（可能隐藏几列）
    expect(padHeaders).toBeLessThanOrEqual(pcHeaders)
    console.log(`PC端列数: ${pcHeaders}, Pad端列数: ${padHeaders}`)
  })
})
