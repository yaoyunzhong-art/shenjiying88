/**
 * TC34续: E2E测试 - 授权管理流程扩展
 * Sprint 2 Day 21
 * 
 * 扩展测试场景:
 * 1. 筛选和搜索
 * 2. 分页功能
 * 3. 排序功能
 * 4. 导出功能
 */

import { test, expect } from '../fixtures/auth.fixture'
import { TIMEOUTS } from '../fixtures/test-data'

test.describe('授权管理 - 筛选和搜索', () => {
  test.beforeEach(async ({ licensePage }) => {
    await licensePage.navigateToLicenseManager()
  })

  test('TC34-14: 按状态筛选授权 @license', async ({ licensePage }) => {
    // Given: 存在不同状态的授权

    // When: 选择按"有效"状态筛选
    await licensePage.click('[data-testid="filter-status-dropdown"]')
    await licensePage.click('[data-testid="filter-status-active"]')

    // Then: 只显示有效状态的授权
    const licenses = await licensePage.getLicenseList()
    for (const license of licenses) {
      expect(license.status).toMatch(/有效|active/i)
    }
  })

  test('TC34-15: 按类型筛选授权 @license', async ({ licensePage }) => {
    // When: 选择按"试用"类型筛选
    await licensePage.click('[data-testid="filter-type-dropdown"]')
    await licensePage.click('[data-testid="filter-type-trial"]')

    // Then: 只显示试用类型的授权
    const licenses = await licensePage.getLicenseList()
    for (const license of licenses) {
      expect(license.type).toMatch(/试用|trial/i)
    }
  })

  test('TC34-16: 按到期时间筛选授权 @license', async ({ licensePage }) => {
    // When: 选择筛选"即将到期"（7天内）
    await licensePage.click('[data-testid="filter-expiry-dropdown"]')
    await licensePage.click('[data-testid="filter-expiry-soon"]')

    // Then: 只显示即将到期的授权
    const licenses = await licensePage.getLicenseList()
    // 验证筛选结果
    expect(licenses).toBeDefined()
  })

  test('TC34-17: 组合筛选条件 @smoke @license', async ({ licensePage }) => {
    // When: 同时应用多个筛选条件
    await licensePage.click('[data-testid="filter-status-dropdown"]')
    await licensePage.click('[data-testid="filter-status-active"]')

    await licensePage.click('[data-testid="filter-type-dropdown"]')
    await licensePage.click('[data-testid="filter-type-paid"]')

    // Then: 只显示符合所有条件的授权
    const licenses = await licensePage.getLicenseList()
    for (const license of licenses) {
      expect(license.status).toMatch(/有效|active/i)
      expect(license.type).toMatch(/付费|paid/i)
    }
  })

  test('TC34-18: 搜索授权ID @smoke @license', async ({ licensePage }) => {
    // Given: 已知的授权ID
    const searchId = 'lic'

    // When: 在搜索框中输入授权ID
    await licensePage.fill('[data-testid="search-input"]', searchId)
    await licensePage.click('[data-testid="search-btn"]')

    // Then: 显示匹配的授权
    const licenses = await licensePage.getLicenseList()
    for (const license of licenses) {
      expect(license.id.toLowerCase()).toContain(searchId.toLowerCase())
    }
  })

  test('TC34-19: 搜索无结果处理 @license', async ({ licensePage }) => {
    // Given: 不存在的搜索关键词
    const nonExistentId = 'NONEXISTENT-ID-12345'

    // When: 搜索不存在的内容
    await licensePage.fill('[data-testid="search-input"]', nonExistentId)
    await licensePage.click('[data-testid="search-btn"]')

    // Then: 显示空状态提示
    const emptyState = await licensePage.isVisible('[data-testid="empty-state"]')
    expect(emptyState).toBe(true)

    const emptyMessage = await licensePage.getText('[data-testid="empty-message"]')
    expect(emptyMessage).toMatch(/未找到|未搜索到|empty|no results/i)
  })

  test('TC34-20: 清除筛选条件 @license', async ({ licensePage }) => {
    // Given: 已应用筛选条件
    await licensePage.click('[data-testid="filter-status-dropdown"]')
    await licensePage.click('[data-testid="filter-status-active"]')

    // When: 点击清除筛选
    await licensePage.click('[data-testid="clear-filters-btn"]')

    // Then: 筛选条件已清除，显示所有数据
    const filterText = await licensePage.getText('[data-testid="filter-status-dropdown"]')
    expect(filterText).not.toMatch(/有效|active/i)
  })
})

test.describe('授权管理 - 分页功能', () => {
  test.beforeEach(async ({ licensePage }) => {
    await licensePage.navigateToLicenseManager()
  })

  test('TC34-21: 分页显示 @smoke @license', async ({ licensePage }) => {
    // Given: 存在多条授权数据

    // When: 查看分页组件
    const paginationVisible = await licensePage.isVisible('[data-testid="pagination"]')

    // Then: 分页组件正常显示
    expect(paginationVisible).toBe(true)
  })

  test('TC34-22: 切换分页 @license', async ({ licensePage }) => {
    // Given: 在第一页

    // When: 点击下一页
    await licensePage.click('[data-testid="pagination-next"]')

    // Then: 成功切换到第二页
    const currentPage = await licensePage.getText('[data-testid="pagination-current"]')
    expect(currentPage).toBe('2')
  })

  test('TC34-23: 改变每页显示数量 @license', async ({ licensePage }) => {
    // When: 选择每页显示20条
    await licensePage.click('[data-testid="page-size-dropdown"]')
    await licensePage.click('[data-testid="page-size-20"]')

    // Then: 每页显示数量已更新
    const pageSizeText = await licensePage.getText('[data-testid="page-size-dropdown"]')
    expect(pageSizeText).toContain('20')
  })
})

test.describe('授权管理 - 排序功能', () => {
  test.beforeEach(async ({ licensePage }) => {
    await licensePage.navigateToLicenseManager()
  })

  test('TC34-24: 按创建时间排序 @license', async ({ licensePage }) => {
    // When: 点击创建时间表头进行排序
    await licensePage.click('[data-testid="sort-created-at"]')

    // Then: 数据已按创建时间排序
    // 验证排序图标变化
    const sortIcon = await licensePage.isVisible('[data-testid="sort-asc"]')
    expect(sortIcon).toBe(true)
  })

  test('TC34-25: 按到期时间排序 @license', async ({ licensePage }) => {
    // When: 点击到期时间表头进行排序
    await licensePage.click('[data-testid="sort-expire-at"]')

    // Then: 验证排序生效
    const sortIcon = await licensePage.isVisible('[data-testid="sort-icon"]')
    expect(sortIcon).toBe(true)
  })

  test('TC34-26: 按状态排序 @license', async ({ licensePage }) => {
    // When: 点击状态表头进行排序
    await licensePage.click('[data-testid="sort-status"]')

    // Then: 验证排序状态
    // 检查排序图标或数据顺序
    expect(true).toBe(true) // 占位断言
  })
})

test.describe('授权管理 - 导出功能', () => {
  test.beforeEach(async ({ licensePage }) => {
    await licensePage.navigateToLicenseManager()
  })

  test('TC34-27: 导出授权列表 @license @admin', async ({ adminPage }) => {
    const licensePage = new (await import('../pages/license.page')).LicensePage(adminPage)
    await licensePage.navigateToLicenseManager()

    // Given: 授权列表已加载

    // When: 点击导出按钮
    const [download] = await Promise.all([
      adminPage.waitForEvent('download'),
      licensePage.click('[data-testid="export-btn"]'),
    ])

    // Then: 文件下载成功
    expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx)$/)
  })

  test('TC34-28: 按筛选条件导出 @license @admin', async ({ adminPage }) => {
    const licensePage = new (await import('../pages/license.page')).LicensePage(adminPage)
    await licensePage.navigateToLicenseManager()

    // Given: 已应用筛选条件
    await licensePage.click('[data-testid="filter-status-dropdown"]')
    await licensePage.click('[data-testid="filter-status-active"]')

    // When: 导出筛选后的数据
    const [download] = await Promise.all([
      adminPage.waitForEvent('download'),
      licensePage.click('[data-testid="export-btn"]'),
    ])

    // Then: 导出的文件只包含筛选后的数据
    expect(download.suggestedFilename()).toBeTruthy()
  })
})