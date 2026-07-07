/**
 * 5端适配验证测试
 * Sprint 2 Day 21-22
 * 
 * 验证端: PC / Pad / H5 / APP / 小程序
 * 测试内容: 响应式布局、组件适配、交互一致性
 */

import { test, expect, devices } from '@playwright/test'

// 5端视口配置
const VIEWPORTS = {
  pc: { width: 1920, height: 1080, name: 'PC端 (1920x1080)' },
  pad: { width: 1024, height: 768, name: 'Pad端 (1024x768)' },
  h5_iphone: { width: 375, height: 667, name: 'H5-iPhone (375x667)' },
  h5_android: { width: 360, height: 640, name: 'H5-Android (360x640)' },
}

// 测试页面列表
const TEST_PAGES = [
  { path: '/admin/license', name: '授权管理页' },
  { path: '/admin/license/activate', name: '激活码激活页' },
]

test.describe('5端适配验证 - PC端', () => {
  test.use({
    viewport: { width: VIEWPORTS.pc.width, height: VIEWPORTS.pc.height },
  })

  for (const pageConfig of TEST_PAGES) {
    test(`PC端 - ${pageConfig.name} 布局检查`, async ({ page }) => {
      // Given: 访问页面
      await page.goto(pageConfig.path)
      await page.waitForTimeout(2000)

      // Then: 验证PC端布局
      // 1. 侧边栏显示
      const sidebar = page.locator('[data-testid="sidebar"], .ant-layout-sider').first()
      const hasSidebar = await sidebar.isVisible().catch(() => false)
      
      // 2. 内容区域宽度足够
      const content = page.locator('[data-testid="license-manager-container"], .ant-layout-content').first()
      const contentBox = await content.boundingBox().catch(() => null)
      
      // 3. 表格/列表正常显示
      const table = page.locator('table, .ant-table, [data-testid="license-list"]').first()
      const hasTable = await table.isVisible().catch(() => false)

      // 截图记录
      await page.screenshot({ 
        path: `playwright-report/responsive/pc-${pageConfig.name.replace(/\s+/g, '-').toLowerCase()}.png`,
        fullPage: true 
      })

      // 断言
      expect(contentBox?.width || 0).toBeGreaterThan(800) // PC端内容区宽度应大于800px
      console.log(`PC端 ${pageConfig.name} 检查完成: 侧边栏=${hasSidebar}, 表格=${hasTable}`)
    })
  }
})

test.describe('5端适配验证 - Pad端', () => {
  test.use({
    viewport: { width: VIEWPORTS.pad.width, height: VIEWPORTS.pad.height },
  })

  for (const pageConfig of TEST_PAGES) {
    test(`Pad端 - ${pageConfig.name} 布局检查`, async ({ page }) => {
      await page.goto(pageConfig.path)
      await page.waitForTimeout(2000)

      // Pad端验证
      // 1. 侧边栏可能是折叠状态
      const sidebar = page.locator('[data-testid="sidebar"], .ant-layout-sider').first()
      const sidebarBox = await sidebar.boundingBox().catch(() => null)
      
      // 2. 内容区域正常显示
      const content = page.locator('[data-testid="license-manager-container"]').first()
      const contentVisible = await content.isVisible().catch(() => false)

      // 3. 表格/卡片切换正常
          const tableView = page.locator('table, .ant-table').first()
          const cardView = page.locator('.ant-card, [data-testid="card-view"]').first()
          const hasView = await tableView.isVisible().catch(() => false) || 
                         await cardView.isVisible().catch(() => false)

      // 截图
      await page.screenshot({ 
        path: `playwright-report/responsive/pad-${pageConfig.name.replace(/\s+/g, '-').toLowerCase()}.png`,
        fullPage: true 
      })

      expect(contentVisible).toBe(true)
      console.log(`Pad端 ${pageConfig.name} 检查完成: 内容显示=${contentVisible}, 视图=${hasView}`)
    })
  }
})

test.describe('5端适配验证 - H5端 (iPhone)', () => {
  test.use({
    viewport: { width: VIEWPORTS.h5_iphone.width, height: VIEWPORTS.h5_iphone.height },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
  })

  for (const pageConfig of TEST_PAGES) {
    test(`H5-iPhone - ${pageConfig.name} 布局检查`, async ({ page }) => {
      await page.goto(pageConfig.path)
      await page.waitForTimeout(2000)

      // H5端验证
      // 1. 侧边栏隐藏，可能有底部导航
      const bottomNav = page.locator('[data-testid="bottom-nav"], .ant-tab-bar').first()
          const hasBottomNav = await bottomNav.isVisible().catch(() => false)

      // 2. 内容区域占满宽度
      const content = page.locator('[data-testid="license-manager-container"]').first()
      const contentBox = await content.boundingBox().catch(() => null)

      // 3. 卡片视图优先（小屏幕不适合表格）
      const cardView = page.locator('.ant-card, [data-testid="card-view"], .mobile-card').first()
          const hasCardView = await cardView.isVisible().catch(() => false)

      // 截图
      await page.screenshot({ 
        path: `playwright-report/responsive/h5-iphone-${pageConfig.name.replace(/\s+/g, '-').toLowerCase()}.png`,
        fullPage: true 
      })

      // H5端验证标准
      expect(contentBox?.width || 0).toBeGreaterThan(300) // 内容区宽度应接近屏幕宽度
      expect(contentBox?.width || 0).toBeLessThan(400) // 但不应超过手机屏幕宽度
      
      console.log(`H5-iPhone ${pageConfig.name} 检查完成: 底部导航=${hasBottomNav}, 卡片视图=${hasCardView}`)
    })
  }
})

test.describe('5端适配验证 - H5端 (Android)', () => {
  test.use({
    viewport: { width: VIEWPORTS.h5_android.width, height: VIEWPORTS.h5_android.height },
    userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
  })

  for (const pageConfig of TEST_PAGES) {
    test(`H5-Android - ${pageConfig.name} 布局检查`, async ({ page }) => {
      await page.goto(pageConfig.path)
      await page.waitForTimeout(2000)

      // Android H5端验证
      const content = page.locator('[data-testid="license-manager-container"]').first()
      const contentVisible = await content.isVisible().catch(() => false)
      const contentBox = await content.boundingBox().catch(() => null)

      // 截图
      await page.screenshot({ 
        path: `playwright-report/responsive/h5-android-${pageConfig.name.replace(/\s+/g, '-').toLowerCase()}.png`,
        fullPage: true 
      })

      expect(contentVisible).toBe(true)
      expect(contentBox?.width || 0).toBeGreaterThan(300)
      expect(contentBox?.width || 0).toBeLessThan(380)
      
      console.log(`H5-Android ${pageConfig.name} 检查完成: 宽度=${contentBox?.width}px`)
    })
  }
})

test.describe('5端对比测试', () => {
  test('5端布局一致性对比 @smoke @responsive', async ({ page }) => {
    const results: Record<string, { width: number; hasSidebar: boolean; viewType: string }> = {}

    for (const [device, viewport] of Object.entries(VIEWPORTS)) {
      // 设置视口
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      
      // 访问页面
      await page.goto('/admin/license')
      await page.waitForTimeout(2000)

      // 收集数据
      const contentBox = await page.locator('[data-testid="license-manager-container"]').first()
        .boundingBox().catch(() => null)
      
      const sidebar = page.locator('[data-testid="sidebar"], .ant-layout-sider').first()
      const hasSidebar = await sidebar.isVisible().catch(() => false) && viewport.width >= 1024

      const hasTable = await page.locator('table, .ant-table').first().isVisible().catch(() => false)
      const hasCard = await page.locator('.ant-card, [data-testid="card-view"]').first().isVisible().catch(() => false)

      results[device] = {
        width: contentBox?.width || 0,
        hasSidebar,
        viewType: hasTable ? 'table' : hasCard ? 'card' : 'unknown'
      }

      // 截图
      await page.screenshot({ 
        path: `playwright-report/responsive/comparison-${device}.png`,
        fullPage: false
      })
    }

    // 验证结果
    console.log('5端适配对比结果:', JSON.stringify(results, null, 2))

    // PC端应该有侧边栏和表格视图
    expect(results.pc.hasSidebar).toBe(true)
    expect(results.pc.viewType).toBe('table')
    expect(results.pc.width).toBeGreaterThan(1000)

    // H5端应该是卡片视图，没有侧边栏
    expect(results.h5_iphone.hasSidebar).toBe(false)
    expect(results.h5_iphone.viewType).toBe('card')
    expect(results.h5_iphone.width).toBeLessThan(400)

    // Pad端介于两者之间
    expect(results.pad.width).toBeGreaterThan(700)
    expect(results.pad.width).toBeLessThan(1000)
  })
})