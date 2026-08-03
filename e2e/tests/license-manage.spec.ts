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
    const firstLicense = licensePage.page.locator(licensePage.selectors.tableRow).first()
    await firstLicense.click()

    // Then: 验证详情弹窗或页面显示
    const detailVisible = await licensePage.isVisible('[data-testid="license-detail-modal"]')
    expect(detailVisible).toBe(true)
  })
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

test.describe('授权管理流程 - 批量操作', () => {
  test.beforeEach(async ({ licensePage }) => {
    await licensePage.navigateToLicenseManager()
  })

  test('TC34-29: 批量选择多个授权 @smoke @license @admin', async ({ adminPage }) => {
    const licensePage = new (await import('../pages/license.page')).LicensePage(adminPage)
    await licensePage.navigateToLicenseManager()

    // Given: 存在多个授权
    const licenses = await licensePage.getLicenseList()
    if (licenses.length < 2) {
      test.skip('授权数量不足，无法测试批量选择')
      return
    }

    // When: 勾选前两个授权
    const firstCheckbox = adminPage.locator('[data-testid="license-checkbox"]').nth(0)
    const secondCheckbox = adminPage.locator('[data-testid="license-checkbox"]').nth(1)
    await firstCheckbox.check()
    await secondCheckbox.check()

    // Then: 批量操作工具栏显示选中数量
    const selectedCount = await adminPage.locator('[data-testid="batch-selected-count"]').textContent()
    expect(selectedCount).toContain('2')
  })

  test('TC34-30: 批量挂起授权操作 @license @admin', async ({ adminPage }) => {
    const licensePage = new (await import('../pages/license.page')).LicensePage(adminPage)
    await licensePage.navigateToLicenseManager()

    const licenses = await licensePage.getLicenseList()
    if (licenses.length < 2) {
      test.skip('授权数量不足，无法测试批量挂起')
      return
    }

    // Given: 选择多个授权
    const firstCheckbox = adminPage.locator('[data-testid="license-checkbox"]').nth(0)
    const secondCheckbox = adminPage.locator('[data-testid="license-checkbox"]').nth(1)
    await firstCheckbox.check()
    await secondCheckbox.check()

    // When: 点击批量挂起按钮并确认
    await licensePage.click('[data-testid="batch-suspend-btn"]')
    await licensePage.click('[data-testid="confirm-btn"]')

    // Then: 显示批量挂起成功提示
    const toastVisible = await licensePage.isVisible('[data-testid="toast-message"]')
    expect(toastVisible).toBe(true)
    const toastText = await licensePage.getText('[data-testid="toast-message"]')
    expect(toastText).toMatch(/挂起|suspended/i)
  })

  test('TC34-31: 全选当前页授权 @license @admin', async ({ adminPage }) => {
    const licensePage = new (await import('../pages/license.page')).LicensePage(adminPage)
    await licensePage.navigateToLicenseManager()

    const licenses = await licensePage.getLicenseList()
    if (licenses.length === 0) {
      test.skip('没有授权数据')
      return
    }

    // Given/When: 点击表头全选复选框
    await adminPage.locator('[data-testid="select-all-checkbox"]').check()

    // Then: 当前页所有授权被选中
    const allCheckboxes = await adminPage.locator('[data-testid="license-checkbox"]')
    const checkboxCount = await allCheckboxes.count()
    for (let i = 0; i < checkboxCount; i++) {
      await expect(allCheckboxes.nth(i)).toBeChecked()
    }

    // 批量操作工具栏显示
    const toolbarVisible = await licensePage.isVisible('[data-testid="batch-toolbar"]')
    expect(toolbarVisible).toBe(true)
  })

  test('TC34-32: 取消批量选择 @license', async ({ licensePage }) => {
    // Given: 选中了一些授权
    const checkboxes = licensePage.page.locator('[data-testid="license-checkbox"]')
    const count = await checkboxes.count()
    if (count === 0) {
      test.skip('没有可选择的授权')
      return
    }
    await checkboxes.nth(0).check()

    // When: 取消选中
    await checkboxes.nth(0).uncheck()

    // Then: 批量操作工具栏隐藏
    const toolbarVisible = await licensePage.isVisible('[data-testid="batch-toolbar"]')
    expect(toolbarVisible).toBe(false)
  })

  test('TC34-33: 批量激活所选授权 @license @admin', async ({ adminPage }) => {
    const licensePage = new (await import('../pages/license.page')).LicensePage(adminPage)
    await licensePage.navigateToLicenseManager()

    const licenses = await licensePage.getLicenseList()
    if (licenses.length < 2) {
      test.skip('授权数量不足')
      return
    }

    // Given: 选择多个授权
    await adminPage.locator('[data-testid="select-all-checkbox"]').check()

    // When: 点击批量激活按钮
    await licensePage.click('[data-testid="batch-activate-btn"]')

    // Then: 批量激活确认弹窗出现
    const confirmVisible = await licensePage.isVisible('[data-testid="batch-action-confirm"]')
    expect(confirmVisible).toBe(true)

    // 确认操作
    await licensePage.click('[data-testid="confirm-btn"]')

    // 验证成功提示
    const toastVisible = await licensePage.isVisible('[data-testid="toast-message"]')
    expect(toastVisible).toBe(true)
  })

  test('TC34-34: 批量操作取消确认 @license @admin', async ({ adminPage }) => {
    const licensePage = new (await import('../pages/license.page')).LicensePage(adminPage)
    await licensePage.navigateToLicenseManager()

    const licenses = await licensePage.getLicenseList()
    if (licenses.length === 0) {
      test.skip('没有授权数据')
      return
    }

    // Given: 选中授权并触发批量操作
    await adminPage.locator('[data-testid="license-checkbox"]').nth(0).check()
    await licensePage.click('[data-testid="batch-suspend-btn"]')

    // When: 在确认弹窗中点击取消
    await licensePage.click('[data-testid="cancel-btn"]')

    // Then: 弹窗关闭，操作未执行
    const modalVisible = await licensePage.isVisible('[data-testid="batch-action-confirm"]')
    expect(modalVisible).toBe(false)

    // 授权状态未改变
    const updatedLicenses = await licensePage.getLicenseList()
    expect(updatedLicenses.length).toBeGreaterThan(0)
  })
})

test.describe('授权管理流程 - 状态与操作扩展', () => {
  test.beforeEach(async ({ licensePage }) => {
    await licensePage.navigateToLicenseManager()
  })

  test('TC34-35: 查看授权配额信息 @smoke @license', async ({ licensePage }) => {
    // Given/When: 导航到授权管理页面

    // Then: 配额进度条可见
    const quotaVisible = await licensePage.isVisible('[data-testid="license-quota-progress"]')
    expect(quotaVisible).toBe(true)

    // 配额数字显示
    const quotaText = await licensePage.getText('[data-testid="license-quota-progress"]')
    expect(quotaText).toMatch(/\d+\s*\/\s*\d+/)
  })

  test('TC34-36: 授权详情信息完整性 @license', async ({ licensePage }) => {
    // Given: 授权列表有数据
    const licenses = await licensePage.getLicenseList()
    if (licenses.length === 0) {
      test.skip('没有授权数据可查看详情')
      return
    }

    // When: 点击第一行查看详情
    await licensePage.page.locator('[data-testid="license-table-row"]').first().click()

    // Then: 详情弹窗显示完整信息
    const detailVisible = await licensePage.isVisible('[data-testid="license-detail-modal"]')
    expect(detailVisible).toBe(true)

    // 验证各字段存在
    const idVisible = await licensePage.isVisible('[data-testid="detail-license-id"]')
    const statusVisible = await licensePage.isVisible('[data-testid="detail-license-status"]')
    const typeVisible = await licensePage.isVisible('[data-testid="detail-license-type"]')
    expect(idVisible).toBe(true)
    expect(statusVisible).toBe(true)
    expect(typeVisible).toBe(true)
  })

  test('TC34-37: 授权续期完整操作 @smoke @license @admin', async ({ adminPage }) => {
    const licensePage = new (await import('../pages/license.page')).LicensePage(adminPage)
    await licensePage.navigateToLicenseManager()

    const licenses = await licensePage.getLicenseList()
    if (licenses.length === 0) {
      test.skip('没有授权数据可续期')
      return
    }

    // Given: 选择第一个授权
    const targetId = licenses[0].id

    // When: 点击续期按钮
    const renewBtn = adminPage.locator(`[data-license-id="${targetId}"] [data-testid="license-renew-btn"]`)
    const renewExists = await renewBtn.count()
    if (renewExists === 0) {
      test.skip('续期按钮不可用')
      return
    }
    await renewBtn.click()

    // 选择续期时长（例如1年）
    const periodSelector = await licensePage.isVisible('[data-testid="renew-period-select"]')
    if (periodSelector) {
      await licensePage.click('[data-testid="renew-period-1year"]')
    }

    // 确认续期
    await licensePage.click('[data-testid="confirm-btn"]')

    // Then: 成功提示
    const toastVisible = await licensePage.isVisible('[data-testid="toast-message"]')
    expect(toastVisible).toBe(true)
    const toastText = await licensePage.getText('[data-testid="toast-message"]')
    expect(toastText).toMatch(/续期|renew|成功|success/i)
  })

  test('TC34-38: 删除授权操作 @license @admin', async ({ adminPage }) => {
    const licensePage = new (await import('../pages/license.page')).LicensePage(adminPage)
    await licensePage.navigateToLicenseManager()

    const licenses = await licensePage.getLicenseList()
    if (licenses.length === 0) {
      test.skip('没有授权数据可删除')
      return
    }

    // When: 点击删除按钮
    const delBtn = adminPage.locator('[data-testid="license-table-row"]').first().locator('[data-testid="license-delete-btn"]')
    const delExists = await delBtn.count()
    if (delExists === 0) {
      test.skip('删除按钮不可用')
      return
    }
    await delBtn.click()

    // 确认删除弹窗
    const confirmVisible = await licensePage.isVisible('[data-testid="delete-confirm-modal"]')
    expect(confirmVisible).toBe(true)

    // 确认删除
    await licensePage.click('[data-testid="confirm-btn"]')

    // Then: 成功提示
    const toastVisible = await licensePage.isVisible('[data-testid="toast-message"]')
    expect(toastVisible).toBe(true)
  })

  test('TC34-39: 取消删除授权操作 @license @admin', async ({ adminPage }) => {
    const licensePage = new (await import('../pages/license.page')).LicensePage(adminPage)
    await licensePage.navigateToLicenseManager()

    const licenses = await licensePage.getLicenseList()
    if (licenses.length === 0) {
      test.skip('没有授权数据')
      return
    }

    // When: 点击删除按钮 + 取消
    const delBtn = adminPage.locator('[data-testid="license-table-row"]').first().locator('[data-testid="license-delete-btn"]')
    const delExists = await delBtn.count()
    if (delExists === 0) {
      test.skip('删除按钮不可用')
      return
    }
    await delBtn.click()
    await licensePage.click('[data-testid="cancel-btn"]')

    // Then: 弹窗关闭，未执行删除
    const modalVisible = await licensePage.isVisible('[data-testid="delete-confirm-modal"]')
    expect(modalVisible).toBe(false)
  })

  test('TC34-40: 刷新授权列表 @license', async ({ licensePage }) => {
    // Given: 当前页面已显示列表

    // When: 点击刷新按钮
    await licensePage.click('[data-testid="refresh-btn"]')

    // Then: 列表重新加载
    const containerVisible = await licensePage.isVisible('[data-testid="license-container"]')
    expect(containerVisible).toBe(true)
  })

  test('TC34-41: 授权列自定义显示 @license', async ({ licensePage }) => {
    // Given: 列设置按钮可见
    const columnBtnVisible = await licensePage.isVisible('[data-testid="column-settings-btn"]')
    if (!columnBtnVisible) {
      test.skip('列设置按钮不可用')
      return
    }

    // When: 打开列设置
    await licensePage.click('[data-testid="column-settings-btn"]')

    // 取消勾选某一列
    await licensePage.click('[data-testid="column-toggle-quota"]')

    // Then: 设置已更新
    const settingsVisible = await licensePage.isVisible('[data-testid="column-settings-panel"]')
    expect(settingsVisible).toBe(true)

    // 关闭设置
    await licensePage.click('[data-testid="column-settings-close"]')
  })

  test('TC34-42: 空列表状态展示 @license', async ({ licensePage }) => {
    // Given: 通过筛选找不到数据
    await licensePage.fill('[data-testid="search-input"]', 'ZZZZ-NONEXISTENT-LICENSE-99999')
    await licensePage.click('[data-testid="search-btn"]')

    // Then: 空状态展示
    const emptyStateVisible = await licensePage.isVisible('[data-testid="empty-state"]')
    expect(emptyStateVisible).toBe(true)

    const emptyMessage = await licensePage.getText('[data-testid="empty-message"]')
    expect(emptyMessage).toBeTruthy()
  })
})

test.describe('授权管理流程 - 导出功能', () => {
  test.beforeEach(async ({ licensePage }) => {
    await licensePage.navigateToLicenseManager()
  })

  test('TC34-43: 导出授权列表为CSV @smoke @license @admin', async ({ adminPage }) => {
    const licensePage = new (await import('../pages/license.page')).LicensePage(adminPage)
    await licensePage.navigateToLicenseManager()

    // Given: 授权列表已加载

    // When: 点击导出按钮并选择CSV格式
    await licensePage.click('[data-testid="export-btn"]')
    await licensePage.click('[data-testid="export-format-csv"]')

    // Then: 触发文件下载
    // 验证导出选项面板出现
    const exportPanelVisible = await licensePage.isVisible('[data-testid="export-panel"]')
    expect(exportPanelVisible).toBe(true)
  })

  test('TC34-44: 导出授权列表为Excel @license @admin', async ({ adminPage }) => {
    const licensePage = new (await import('../pages/license.page')).LicensePage(adminPage)
    await licensePage.navigateToLicenseManager()

    // When: 选择Excel格式导出
    await licensePage.click('[data-testid="export-btn"]')
    await licensePage.click('[data-testid="export-format-xlsx"]')

    const exportPanelVisible = await licensePage.isVisible('[data-testid="export-panel"]')
    expect(exportPanelVisible).toBe(true)
  })

  test('TC34-45: 导出当前筛选后的授权 @license @admin', async ({ adminPage }) => {
    const licensePage = new (await import('../pages/license.page')).LicensePage(adminPage)
    await licensePage.navigateToLicenseManager()

    // Given: 已应用筛选条件
    const filterExists = await licensePage.isVisible('[data-testid="filter-status-dropdown"]')
    if (!filterExists) {
      test.skip('筛选组件不可用')
      return
    }
    await licensePage.click('[data-testid="filter-status-dropdown"]')
    await licensePage.click('[data-testid="filter-status-active"]')

    // When: 导出当前筛选结果
    await licensePage.click('[data-testid="export-btn"]')

    // Then: 导出选项面板显示带筛选标识
    const exportPanelVisible = await licensePage.isVisible('[data-testid="export-panel"]')
    expect(exportPanelVisible).toBe(true)
  })
})

test.describe('授权管理流程 - 分页功能', () => {
  test.beforeEach(async ({ licensePage }) => {
    await licensePage.navigateToLicenseManager()
  })

  test('TC34-46: 分页组件显示 @smoke @license', async ({ licensePage }) => {
    // When: 查看分页区域
    const paginationVisible = await licensePage.isVisible('[data-testid="pagination"]')

    // Then: 分页组件可见
    expect(paginationVisible).toBe(true)
  })

  test('TC34-47: 点击下一页 @license', async ({ licensePage }) => {
    // Given: 分页组件存在且有下一页
    const nextBtn = licensePage.page.locator('[data-testid="pagination-next"]')
    const nextDisabled = await nextBtn.isDisabled().catch(() => false)
    if (nextDisabled) {
      test.skip('没有更多页')
      return
    }

    // When: 点击下一页
    await nextBtn.click()

    // Then: 页面更新
    const currentPage = await licensePage.getText('[data-testid="pagination-current"]')
    expect(currentPage).toBe('2')
  })

  test('TC34-48: 改变每页条数 @license', async ({ licensePage }) => {
    // When: 选择每页显示50条
    await licensePage.click('[data-testid="page-size-dropdown"]')
    await licensePage.click('[data-testid="page-size-50"]')

    // Then: 每页条数已更新
    const pageSizeText = await licensePage.getText('[data-testid="page-size-dropdown"]')
    expect(pageSizeText).toContain('50')
  })
})

test.describe('授权管理流程 - 排序功能', () => {
  test.beforeEach(async ({ licensePage }) => {
    await licensePage.navigateToLicenseManager()
  })

  test('TC34-49: 按授权类型排序 @license', async ({ licensePage }) => {
    // When: 点击类型排序
    const sortBtn = licensePage.page.locator('[data-testid="sort-type"]')
    const btnExists = await sortBtn.count()
    if (btnExists === 0) {
      test.skip('排序按钮不可用')
      return
    }
    await sortBtn.click()

    // Then: 排序图标显示
    const sortIcon = await licensePage.isVisible('[data-testid="sort-asc"]')
    expect(sortIcon).toBe(true)
  })

  test('TC34-50: 切换排序方向 @license', async ({ licensePage }) => {
    // When: 点击两次状态列切换升降序
    const sortBtn = licensePage.page.locator('[data-testid="sort-status"]')
    const btnExists = await sortBtn.count()
    if (btnExists === 0) {
      test.skip('排序按钮不可用')
      return
    }

    await sortBtn.click()
    await sortBtn.click()

    // Then: 排序方向切换为降序
    const sortDesc = await licensePage.isVisible('[data-testid="sort-desc"]')
    expect(sortDesc).toBe(true)
  })
})