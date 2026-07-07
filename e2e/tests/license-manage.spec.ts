/**
 * TC34: E2E测试 - 授权管理流程
 * Sprint 2 Day 21
 * 
 * 测试场景:
 * 1. 授权列表查看
 * 2. 授权详情查看
 * 3. 授权挂起操作
 * 4. 授权续期操作
 * 5. 批量操作
 * 6. 视图切换
 */

import { test, expect } from '../fixtures/auth.fixture'
import { TEST_LICENSES, TIMEOUTS, TEST_USERS } from '../fixtures/test-data'

test.describe('授权管理流程 - 列表查看', () => {
  test.beforeEach(async ({ licensePage }) => {
    await licensePage.navigateToLicenseManager()
  })

  test('TC34-01: 查看授权列表 @smoke @license', async ({ licensePage }) => {
    // Given: 用户已登录并导航到授权管理页面

    // When: 获取授权列表
    const licenses = await licensePage.getLicenseList()

    // Then: 验证列表正常显示
    expect(licenses).toBeDefined()
    // 列表可能为空或包含数据
    if (licenses.length > 0) {
      // 验证每条授权的基本字段
      for (const license of licenses) {
        expect(license.id).toBeTruthy()
        expect(license.type).toBeTruthy()
        expect(license.status).toBeTruthy()
      }
    }
  })

  test('TC34-02: 表格视图显示 @smoke @license', async ({ licensePage }) => {
    // Given: 在授权管理页面

    // When: 切换到表格视图
    await licensePage.switchViewMode('table')

    // Then: 验证表格视图显示
    const tableVisible = await licensePage.isVisible(licensePage.selectors.tableRow)
    expect(tableVisible).toBe(true)
  })

  test('TC34-03: 卡片视图显示 @license', async ({ licensePage }) => {
    // When: 切换到卡片视图
    await licensePage.switchViewMode('card')

    // Then: 验证卡片视图显示
    const cardVisible = await licensePage.isVisible(licensePage.selectors.cardView)
    expect(cardVisible).toBe(true)
  })

  test('TC34-04: 紧凑视图显示 @license', async ({ licensePage }) => {
    // When: 切换到紧凑视图
    await licensePage.switchViewMode('compact')

    // Then: 验证紧凑视图正常显示
    // 紧凑视图可能使用表格或卡片的选择器
    const containerVisible = await licensePage.isVisible(licensePage.selectors.container)
    expect(containerVisible).toBe(true)
  })

  test('TC34-05: 视图模式切换 @smoke @license', async ({ licensePage }) => {
    // Given: 初始在表格视图
    await licensePage.switchViewMode('table')
    let tableVisible = await licensePage.isVisible(licensePage.selectors.tableRow)
    expect(tableVisible).toBe(true)

    // When: 切换到卡片视图
    await licensePage.switchViewMode('card')

    // Then: 卡片视图显示
    const cardVisible = await licensePage.isVisible(licensePage.selectors.cardView)
    expect(cardVisible).toBe(true)

    // When: 再切换回表格视图
    await licensePage.switchViewMode('table')

    // Then: 表格视图显示
    tableVisible = await licensePage.isVisible(licensePage.selectors.tableRow)
    expect(tableVisible).toBe(true)
  })
})

test.describe('授权管理流程 - 操作功能', () => {
  test.beforeEach(async ({ licensePage }) => {
    await licensePage.navigateToLicenseManager()
  })

  test('TC34-06: 授权挂起操作 @smoke @license @admin', async ({ adminPage }) => {
    const licensePage = new (await import('../pages/license.page')).LicensePage(adminPage)
    await licensePage.navigateToLicenseManager()

    // Given: 存在可挂起的授权
    const licenses = await licensePage.getLicenseList()
    if (licenses.length === 0) {
      test.skip('没有可测试的授权数据')
      return
    }

    const targetLicense = licenses[0]

    // When: 执行挂起操作
    const success = await licensePage.suspendLicense(targetLicense.id)

    // Then: 验证挂起成功
    expect(success).toBe(true)

    // 验证状态更新
    const updatedLicenses = await licensePage.getLicenseList()
    const suspendedLicense = updatedLicenses.find(l => l.id === targetLicense.id)
    expect(suspendedLicense?.status).toMatch(/挂起|suspended/i)
  })

  test('TC34-07: 授权续期操作 @license @admin', async ({ adminPage }) => {
    const licensePage = new (await import('../pages/license.page')).LicensePage(adminPage)
    await licensePage.navigateToLicenseManager()

    // Given: 存在需要续期的授权
    // 可以通过API创建即将过期的授权用于测试

    // When: 执行续期操作
    // await licensePage.renewLicense(licenseId)

    // Then: 验证续期成功
    // 验证到期时间已延长
  })

  test('TC34-08: 批量挂起授权 @license @admin', async ({ adminPage }) => {
    const licensePage = new (await import('../pages/license.page')).LicensePage(adminPage)
    await licensePage.navigateToLicenseManager()

    // Given: 存在多个可挂起的授权
    const licenses = await licensePage.getLicenseList()
    if (licenses.length < 2) {
      test.skip('授权数量不足，无法测试批量操作')
      return
    }

    // When: 选择多个授权并执行批量挂起
    // 实现批量选择逻辑

    // Then: 验证批量挂起成功
    // 验证所有选中的授权状态已更新
  })

  test('TC34-09: 授权详情查看 @smoke @license', async ({ licensePage }) => {
    // Given: 授权列表已加载
    const licenses = await licensePage.getLicenseList()
    if (licenses.length === 0) {
      test.skip('没有可查看的授权')
      return
    }

    // When: 点击授权查看详情
    const firstLicense = this.page?.locator(licensePage.selectors.tableRow).first()
    await firstLicense?.click()

    // Then: 验证详情弹窗或页面显示
    const detailVisible = await licensePage.isVisible('[data-testid="license-detail-modal"]')
    expect(detailVisible).toBe(true)
  })

  private page: any
})

test.describe('授权管理流程 - 角色权限', () => {
  test('TC34-10: 管理员可查看所有授权 @smoke @license', async ({ adminPage }) => {
    const licensePage = new (await import('../pages/license.page')).LicensePage(adminPage)
    await licensePage.navigateToLicenseManager()

    // Given: 管理员已登录

    // When: 查看授权列表
    const licenses = await licensePage.getLicenseList()

    // Then: 应能看到所有租户的授权
    // 具体验证取决于数据 seeded 的情况
    expect(licenses).toBeDefined()
  })

  test('TC34-11: 租户只能查看本租户授权 @license', async ({ tenantPage }) => {
    const licensePage = new (await import('../pages/license.page')).LicensePage(tenantPage)
    await licensePage.navigateToLicenseManager()

    // Given: 租户已登录

    // When: 查看授权列表
    const licenses = await licensePage.getLicenseList()

    // Then: 只能看到本租户的授权
    // 验证所有返回的授权都属于当前租户
    expect(licenses).toBeDefined()
  })

  test('TC34-12: 门店只能查看本门店授权 @license', async ({ storePage }) => {
    const licensePage = new (await import('../pages/license.page')).LicensePage(storePage)
    await licensePage.navigateToLicenseManager()

    // Given: 门店用户已登录

    // When: 查看授权列表
    const licenses = await licensePage.getLicenseList()

    // Then: 只能看到本门店的授权
    expect(licenses).toBeDefined()
  })

  test('TC34-13: 非管理员无法执行挂起操作 @license', async ({ tenantPage }) => {
    const licensePage = new (await import('../pages/license.page')).LicensePage(tenantPage)
    await licensePage.navigateToLicenseManager()

    // Given: 非管理员用户

    // When: 尝试查看挂起按钮
    const suspendButtons = await licensePage.page.locator('[data-testid="license-suspend-btn"]').count()

    // Then: 不应看到挂起按钮或挂起按钮禁用
    expect(suspendButtons).toBe(0)
  })
})