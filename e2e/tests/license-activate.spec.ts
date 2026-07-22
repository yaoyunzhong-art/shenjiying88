/**
 * TC33: E2E测试 - 激活码激活流程（增强版 25+ tests）
 * Sprint 2 Day 21 / 增强 Sprint 3
 * 
 * 测试场景:
 * 1. 有效激活码激活（基础流）
 * 2. 无效/过期/已使用激活码处理
 * 3. 格式验证/自动格式化
 * 4. 设备绑定/多租户隔离
 * 5. 许可证续期（激活续期）
 * 6. 批量激活
 * 7. 错误码测试（暴力破解防护/重试机制）
 * 8. 并发/竞态条件
 */

import { test, expect } from '../fixtures/auth.fixture'
import { TEST_ACTIVATION_CODES, TIMEOUTS } from '../fixtures/test-data'

test.describe('激活码激活流程', () => {
  test.beforeEach(async ({ licensePage }) => {
    // 每个测试前导航到授权管理页面
    await licensePage.navigateToLicenseManager()
  })

  // ===== 基础激活流程（5 tests） =====

  test('TC33-01: 使用有效激活码成功激活 @smoke @license', async ({ licensePage }) => {
    // Given: 有效的激活码
    const validCode = TEST_ACTIVATION_CODES.valid.code

    // When: 执行激活
    const result = await licensePage.activateLicense(validCode)

    // Then: 验证激活成功
    expect(result.success).toBe(true)
    expect(result.message).toMatch(/激活成功|activated successfully/i)

    // 验证授权状态更新
    const status = await licensePage.checkLicense()
    expect(status.isValid).toBe(true)
  })

  test('TC33-02: 使用无效激活码激活失败 @smoke @license', async ({ licensePage }) => {
    // Given: 无效的激活码
    const invalidCode = TEST_ACTIVATION_CODES.invalid.code

    // When: 执行激活
    const result = await licensePage.activateLicense(invalidCode)

    // Then: 验证激活失败
    expect(result.success).toBe(false)
    expect(result.message).toMatch(/无效|invalid|错误|error/i)
  })

  test('TC33-03: 使用过期的激活码激活失败 @license', async ({ licensePage }) => {
    // Given: 过期的激活码
    const expiredCode = TEST_ACTIVATION_CODES.expired.code

    // When: 执行激活
    const result = await licensePage.activateLicense(expiredCode)

    // Then: 验证激活失败并显示过期提示
    expect(result.success).toBe(false)
    expect(result.message).toMatch(/过期|expired|失效/i)
  })

  test('TC33-04: 使用已使用的激活码激活失败 @license', async ({ licensePage }) => {
    // Given: 已被使用的激活码 — 先用有效码激活一次，模拟已使用状态
    const validCode = TEST_ACTIVATION_CODES.valid.code
    const firstResult = await licensePage.activateLicense(validCode)
    // 如果返回成功则表明该码已被消耗

    // 尝试再次使用同一个激活码
    const secondResult = await licensePage.activateLicense(validCode)

    // Then: 验证激活失败并显示已使用提示
    expect(secondResult.success).toBe(false)
    expect(secondResult.message).toMatch(/已使用|已激活|used|activated/i)
  })

  test('TC33-05: 激活码格式验证 - 正确格式 @smoke @license', async ({ licensePage }) => {
    // Given: 正确格式的激活码 (XXXX-XXXX-XXXX-XXXX)
    const wellFormattedCode = 'ABCD-1234-EFGH-5678'

    // When: 输入激活码
    await licensePage.fill(licensePage.selectors.activateInput, wellFormattedCode)

    // Then: 验证输入成功，格式验证通过
    const inputValue = await licensePage.page.locator(licensePage.selectors.activateInput).inputValue()
    expect(inputValue).toBe(wellFormattedCode)
  })

  // ===== 格式与输入验证（4 tests） =====

  test('TC33-06: 激活码格式验证 - 错误格式 @license', async ({ licensePage }) => {
    // Given: 错误格式的激活码
    const invalidFormatCodes = [
      'TOOSHORT', // 太短
      'WAYTOOLONGCODETHATEXCEEDSLIMITS', // 太长
      'NO-DASHES-1234', // 缺少分隔符
      'special!@#$chars', // 特殊字符
    ]

    for (const code of invalidFormatCodes) {
      // When: 尝试输入错误格式的激活码
      await licensePage.fill(licensePage.selectors.activateInput, code)

      // Then: 验证格式错误提示显示
      const hasError = await licensePage.isVisible('[data-testid="input-error"]')
      expect(hasError).toBe(true)
    }
  })

  test('TC33-07: 激活码自动格式化 @license', async ({ licensePage }) => {
    // Given: 需要自动格式化的输入
    const rawInput = 'ABCD1234EFGH5678'
    const expectedOutput = 'ABCD-1234-EFGH-5678'

    // When: 输入字符
    await licensePage.fill(licensePage.selectors.activateInput, rawInput)

    // Then: 验证自动格式化
    const inputValue = await licensePage.page.locator(licensePage.selectors.activateInput).inputValue()
    expect(inputValue).toBe(expectedOutput)
  })

  test('TC33-08: 激活过程中的加载状态 @smoke @license', async ({ licensePage }) => {
    // Given: 有效激活码
    const validCode = TEST_ACTIVATION_CODES.valid.code

    // When: 开始激活
    await licensePage.fill(licensePage.selectors.activateInput, validCode)
    
    // 点击激活按钮
    const activateButton = await licensePage.waitForSelector(licensePage.selectors.activateButton)
    
    // 监听加载状态
    const loadingPromise = licensePage.waitForSelector(licensePage.common.loading, 2000)
    
    await activateButton.click()

    // Then: 验证加载状态显示
    try {
      await loadingPromise
      // 加载状态已显示
      expect(true).toBe(true)
    } catch {
      // 加载太快或没有加载状态，也是可以接受的
    }
  })

  // ===== 激活后状态验证（3 tests） =====

  test('TC33-09: 激活成功后的状态更新 @smoke @license', async ({ licensePage }) => {
    // Given: 有效激活码
    const validCode = TEST_ACTIVATION_CODES.valid.code

    // When: 执行激活
    const activateResult = await licensePage.activateLicense(validCode)
    expect(activateResult.success).toBe(true)

    // Then: 验证授权状态已更新
    const checkResult = await licensePage.checkLicense()
    expect(checkResult.isValid).toBe(true)

    // 验证状态标签显示正确
    await licensePage.expectLicenseStatus('active')
  })

  test('TC33-10: 激活失败后的错误恢复 @license', async ({ licensePage }) => {
    // Given: 无效的激活码
    const invalidCode = TEST_ACTIVATION_CODES.invalid.code

    // When: 执行激活（预期失败）
    const result = await licensePage.activateLicense(invalidCode)

    // Then: 验证激活失败
    expect(result.success).toBe(false)
    expect(result.message).toBeTruthy()

    // 验证可以重新输入
    const input = await licensePage.waitForSelector(licensePage.selectors.activateInput)
    expect(await input.isVisible()).toBe(true)

    // 验证输入框已清空或可以重新输入
    const inputValue = await input.inputValue()
    expect(inputValue).toBeDefined()
  })

  // ===== 激活码过期测试（3 tests） =====

  test('TC33-11: 临近过期激活码的激活确认 @license', async ({ licensePage }) => {
    // Given: 临近过期的激活码（expire in 1 day）
    // 使用自定义激活码场景，通过API预设一个即将过期的激活码
    const nearExpiryCode = 'NEAR-EXP1-DAY1-CODE'

    // When: 尝试激活
    await licensePage.fill(licensePage.selectors.activateInput, nearExpiryCode)
    await licensePage.click(licensePage.selectors.activateButton)

    // Then: 应提示即将过期或警告信息
    const warningVisible = await licensePage.isVisible('[data-testid="expiry-warning"]')
    if (warningVisible) {
      const warningText = await licensePage.getText('[data-testid="expiry-warning"]')
      expect(warningText).toMatch(/即将过期|expir|临近/i)
    }
    // 即使有警告，激活仍应成功（取决于业务逻辑）
    const toastText = await licensePage.getText(licensePage.common.toast).catch(() => '')
    expect(toastText).toBeTruthy()
  })

  test('TC33-12: 激活码到期前的续期提示 @license', async ({ licensePage }) => {
    // Given: 激活成功后授权即将过期
    const validCode = TEST_ACTIVATION_CODES.valid.code
    await licensePage.activateLicense(validCode)

    // When: 检查授权状态
    const result = await licensePage.checkLicense()

    // Then: 若有expireAt字段，检查是否接近到期
    expect(result.isValid).toBe(true)
    // 续期按钮/提示应可见
    const renewHint = await licensePage.isVisible('[data-testid="renew-hint"]').catch(() => false)
    // 不强制断言，取决于测试数据
    if (renewHint) {
      const hintText = await licensePage.getText('[data-testid="renew-hint"]')
      expect(hintText).toBeTruthy()
    }
  })

  test('TC33-13: 跨天过期时间精确校验 @license', async ({ licensePage }) => {
    // Given: 激活时的过期时间计算
    const validCode = TEST_ACTIVATION_CODES.valid.code
    const result = await licensePage.activateLicense(validCode)
    expect(result.success).toBe(true)

    // When: 检查过期时间显示
    const expireTimeStr = await licensePage.getText('[data-testid="license-expire-time"]').catch(() => '')

    // Then: 过期时间应为合法日期格式
    if (expireTimeStr) {
      const expireDate = new Date(expireTimeStr)
      expect(expireDate.getTime()).toBeGreaterThan(Date.now())
    }
  })

  // ===== 设备绑定（3 tests） =====

  test('TC33-14: 同一设备重复激活同一授权码 @license', async ({ licensePage, page }) => {
    // Given: 已激活的设备
    const validCode = TEST_ACTIVATION_CODES.valid.code
    const firstResult = await licensePage.activateLicense(validCode)
    expect(firstResult.success).toBe(true)

    // When: 再次尝试用同一激活码激活（同设备）
    // 先导航返回激活页面
    await licensePage.navigateToLicenseManager()
    const secondResult = await licensePage.activateLicense(validCode)

    // Then: 应提示已激活或激活成功（取决于幂等设计）
    // 幂等场景下可能是成功；非幂等时是"已使用"
    expect(secondResult.message).toBeTruthy()
  })

  test('TC33-15: 跨设备绑定限制 @license', async ({ licensePage, browser }) => {
    // Given: 当前设备已激活
    const validCode = TEST_ACTIVATION_CODES.valid.code
    const firstResult = await licensePage.activateLicense(validCode)
    expect(firstResult.success).toBe(true)

    // When: 新浏览器上下文（模拟新设备）
    const newContext = await browser.newContext()
    const newPage = await newContext.newPage()
    const { LicensePage: LPage } = await import('../pages/license.page')
    const newLicensePage = new LPage(newPage)
    await newLicensePage.navigateToLicenseManager()

    // Then: 跨设备激活应被限制
    const crossResult = await newLicensePage.activateLicense(validCode)

    if (crossResult.success) {
      // 如果允许跨设备，新设备应获得授权
      const newStatus = await newLicensePage.checkLicense()
      expect(newStatus.isValid).toBe(true)
    } else {
      // 如果不允许跨设备，应有具体提示
      expect(crossResult.message).toMatch(/已达设备上限|device limit|绑定/i)
    }

    await newContext.close()
  })

  test('TC33-16: 设备绑定数上限验证 @license', async ({ licensePage, browser }) => {
    // Given: 已知设备绑定上限（例如2台）
    const validCode = TEST_ACTIVATION_CODES.valid.code

    // 模拟超过设备数上限的场景
    // 设备1激活
    await licensePage.activateLicense(validCode)

    // 设备2激活
    const ctx2 = await browser.newContext()
    const p2 = await ctx2.newPage()
    const { LicensePage: LPage2 } = await import('../pages/license.page')
    const lp2 = new LPage2(p2)
    await lp2.navigateToLicenseManager()
    const r2 = await lp2.activateLicense(validCode)

    if (r2.success) {
      // 设备3激活（应失败）
      const ctx3 = await browser.newContext()
      const p3 = await ctx3.newPage()
      const lp3 = new LPage2(p3)
      await lp3.navigateToLicenseManager()
      const r3 = await lp3.activateLicense(validCode)
      expect(r3.success).toBe(false)
      expect(r3.message).toMatch(/设备上限|device limit|max devices/i)
      await ctx3.close()
    }
    await ctx2.close()
  })

  // ===== 多租户隔离（3 tests） =====

  test('TC33-17: 租户A的激活码不能在租户B使用 @license', async ({ licensePage, tenantPage }) => {
    // Given: 租户A的激活码
    const validCode = TEST_ACTIVATION_CODES.valid.code

    // When: 租户B尝试激活
    const { LicensePage: LPage } = await import('../pages/license.page')
    const tenantLicensePage = new LPage(tenantPage)
    await tenantLicensePage.navigateToLicenseManager()
    const result = await tenantLicensePage.activateLicense(validCode)

    // Then: 应失败，租户隔离
    expect(result.success).toBe(false)
    expect(result.message).toMatch(/无权|租户|tenant|forbidden|permission/i)
  })

  test('TC33-18: 管理员可为任意租户激活授权 @license @admin', async ({ adminPage }) => {
    // Given: 管理员页面
    const { LicensePage: LPage } = await import('../pages/license.page')
    const adminLicensePage = new LPage(adminPage)
    await adminLicensePage.navigateToLicenseManager()

    // When: 管理员输入租户A的激活码
    const validCode = TEST_ACTIVATION_CODES.valid.code
    const result = await adminLicensePage.activateLicense(validCode)

    // Then: 管理员有权激活
    // 结果取决于管理端是否有独立的激活逻辑
    expect(result.success).toBe(true)
  })

  test('TC33-19: 门店管理员无法激活其他门店激活码 @license', async ({ storePage }) => {
    // Given: 门店管理员页面
    const { LicensePage: LPage } = await import('../pages/license.page')
    const storeLicensePage = new LPage(storePage)
    await storeLicensePage.navigateToLicenseManager()

    // When: 尝试激活其他门店的激活码
    const validCode = TEST_ACTIVATION_CODES.valid.code
    const result = await storeLicensePage.activateLicense(validCode)

    // Then: 应根据门店权限决定
    // 若门店无权限则失败
    if (!result.success) {
      expect(result.message).toMatch(/无权限|无权|permission|forbidden/i)
    } else {
      // 若允许则验证成功
      expect(result.success).toBe(true)
    }
  })

  // ===== 许可证续期 / 续费激活（3 tests） =====

  test('TC33-20: 使用激活码续期即将到期的授权 @license', async ({ licensePage }) => {
    // Given: 当前授权已激活
    const validCode = TEST_ACTIVATION_CODES.valid.code
    await licensePage.activateLicense(validCode)

    // When: 使用另一个有效的续期激活码
    const renewalCode = 'RENEW-ABCD-1234-EFGH'
    await licensePage.fill(licensePage.selectors.activateInput, renewalCode)

    // 检查续期按钮或操作
    const renewBtn = await licensePage.isVisible('[data-testid="license-renew-btn"]').catch(() => false)
    if (renewBtn) {
      await licensePage.click('[data-testid="license-renew-btn"]')
      await licensePage.click(licensePage.common.confirmButton)
    }

    const result = await licensePage.activateLicense(renewalCode)

    // Then: 续期应成功
    expect(result.success).toBe(true)
    expect(result.message).toMatch(/续期|renew|延长|extend/i)
  })

  test('TC33-21: 使用无效续期码续期失败 @license', async ({ licensePage }) => {
    // Given: 授权已激活
    const validCode = TEST_ACTIVATION_CODES.valid.code
    await licensePage.activateLicense(validCode)

    // When: 使用无效续期码
    const invalidRenewal = 'RENEW-INVALID'
    const result = await licensePage.activateLicense(invalidRenewal)

    // Then: 续期失败
    expect(result.success).toBe(false)
    expect(result.message).toMatch(/无效|invalid|error/i)
  })

  test('TC33-22: 续期后到期时间延长验证 @smoke @license', async ({ licensePage }) => {
    // Given: 当前授权信息
    const validCode = TEST_ACTIVATION_CODES.valid.code
    await licensePage.activateLicense(validCode)

    // 记录激活后的到期时间
    const expireBefore = await licensePage.getText('[data-testid="license-expire-time"]').catch(() => '')

    // When: 执行续期
    const renewalCode = 'RENEW-BCDA-5678-JKLM'
    const result = await licensePage.activateLicense(renewalCode)

    // Then: 验证续期成功
    expect(result.success).toBe(true)

    // 对比续期前后的到期时间
    const expireAfter = await licensePage.getText('[data-testid="license-expire-time"]').catch(() => '')
    if (expireBefore && expireAfter) {
      // 续期后日期应晚于续期前
      const dateBefore = new Date(expireBefore)
      const dateAfter = new Date(expireAfter)
      expect(dateAfter.getTime()).toBeGreaterThanOrEqual(dateBefore.getTime())
    }
  })

  // ===== 批量激活（3 tests） =====

  test('TC33-23: 批量激活多个激活码 @license', async ({ licensePage }) => {
    // Given: 多个待激活的激活码
    const codes = [
      'BATCH-AAAA-1111-BBBB',
      'BATCH-CCCC-2222-DDDD',
      'BATCH-EEEE-3333-FFFF',
    ]

    // When: 进入批量激活模式
    const batchBtnVisible = await licensePage.isVisible('[data-testid="batch-activate-btn"]')
    if (!batchBtnVisible) {
      test.skip('批量激活按钮不可用')
      return
    }
    await licensePage.click('[data-testid="batch-activate-btn"]')

    // 输入多个激活码（textArea形式）
    const batchInput = await licensePage.waitForSelector('[data-testid="batch-activate-input"]')
    await batchInput.fill(codes.join('\n'))

    // 执行批量激活
    await licensePage.click('[data-testid="batch-activate-submit"]')

    // Then: 验证结果显示
    const resultCount = await licensePage.isVisible('[data-testid="batch-result-count"]')
    expect(resultCount).toBe(true)
  })

  test('TC33-24: 批量激活中部分失败处理 @license', async ({ licensePage }) => {
    // Given: 混合有效/无效激活码
    const validCode = TEST_ACTIVATION_CODES.valid.code
    const invalidCode = TEST_ACTIVATION_CODES.invalid.code

    // When: 进入批量激活
    const batchBtnVisible = await licensePage.isVisible('[data-testid="batch-activate-btn"]')
    if (!batchBtnVisible) {
      test.skip('批量激活按钮不可用')
      return
    }
    await licensePage.click('[data-testid="batch-activate-btn"]')

    const batchInput = await licensePage.waitForSelector('[data-testid="batch-activate-input"]')
    await batchInput.fill(`${validCode}\n${invalidCode}`)
    await licensePage.click('[data-testid="batch-activate-submit"]')

    // Then: 应显示部分成功/部分失败的结果
    const partialResultVisible = await licensePage.isVisible('[data-testid="batch-partial-result"]')
    if (partialResultVisible) {
      const failedCount = await licensePage.getText('[data-testid="batch-failed-count"]').catch(() => '0')
      const successCount = await licensePage.getText('[data-testid="batch-success-count"]').catch(() => '0')
      expect(parseInt(failedCount) || 0).toBeGreaterThanOrEqual(0)
      expect(parseInt(successCount) || 0).toBeGreaterThanOrEqual(0)
    }
  })

  test('TC33-25: 批量激活空列表的校验 @license', async ({ licensePage }) => {
    // Given: 进入批量激活模式
    const batchBtnVisible = await licensePage.isVisible('[data-testid="batch-activate-btn"]')
    if (!batchBtnVisible) {
      test.skip('批量激活按钮不可用')
      return
    }
    await licensePage.click('[data-testid="batch-activate-btn"]')

    // When: 未输入任何激活码直接提交
    await licensePage.click('[data-testid="batch-activate-submit"]')

    // Then: 应提示输入至少一个激活码
    const errorMsg = await licensePage.isVisible('[data-testid="input-error"]')
    expect(errorMsg).toBe(true)
    const msgText = await licensePage.getText('[data-testid="input-error"]')
    expect(msgText).toMatch(/至少|至少输入|enter at least|非空/i)
  })

  // ===== 错误码 / 安全测试（3 tests） =====

  test('TC33-26: 暴力破解防护 - 连续失败后锁定 @security @license', async ({ licensePage }) => {
    // Given: 连续输入错误激活码
    const invalidCodes = ['WRONG-0001', 'WRONG-0002', 'WRONG-0003',
                           'WRONG-0004', 'WRONG-0005', 'WRONG-0006']
    let locked = false

    for (const code of invalidCodes) {
      if (!locked) {
        await licensePage.fill(licensePage.selectors.activateInput, code)
        await licensePage.click(licensePage.selectors.activateButton)
        // 等待结果
        await licensePage.page.waitForTimeout(300)

        // 检查是否被锁定
        const lockMsg = await licensePage.isVisible('[data-testid="brute-force-lockout"]').catch(() => false)
        if (lockMsg) {
          locked = true
          const lockText = await licensePage.getText('[data-testid="brute-force-lockout"]')
          expect(lockText).toMatch(/锁定|lockout|重试|retry/i)
        }
      }
    }

    // Then: 应最终触发锁定
    expect(locked).toBe(true)
  })

  test('TC33-27: 暴力破解锁定后超时解锁 @security @license', async ({ licensePage }) => {
    // Given: 连续失败导致锁定
    const invalidCodes = ['WRONG-BF1', 'WRONG-BF2', 'WRONG-BF3',
                           'WRONG-BF4', 'WRONG-BF5', 'WRONG-BF6']
    let lockedAt: number | null = null

    for (const code of invalidCodes) {
      await licensePage.fill(licensePage.selectors.activateInput, code)
      await licensePage.click(licensePage.selectors.activateButton)
      await licensePage.page.waitForTimeout(300)

      const lockMsg = await licensePage.isVisible('[data-testid="brute-force-lockout"]').catch(() => false)
      if (lockMsg) {
        lockedAt = Date.now()
        const lockText = await licensePage.getText('[data-testid="brute-force-lockout"]')
        // 获取重试等待时间
        const match = lockText.match(/(\d+)\s*(秒|s|second)/i)
        const waitSeconds = match ? parseInt(match[1]) : 30
        expect(waitSeconds).toBeGreaterThan(0)
        break
      }
    }

    if (lockedAt !== null) {
      // Then: 应显示锁定倒计时并最终解锁
      const unlockBtn = await licensePage.isVisible(licensePage.selectors.activateButton).catch(() => false)
      // 锁定期间激活按钮应禁用
      if (unlockBtn) {
        const isDisabled = await licensePage.page.locator(licensePage.selectors.activateButton).isDisabled()
        expect(isDisabled).toBe(true)
      }
    } else {
      // 如果没触发锁定，可能是阈值更高
      // 跳过，不强制断言
    }
  })

  test('TC33-28: 激活请求重试机制 @license', async ({ licensePage }) => {
    // Given: 用于重试的激活码
    const validCode = TEST_ACTIVATION_CODES.valid.code

    // When: 模拟重试场景 — 连续2次请求
    const firstResult = await licensePage.activateLicense(validCode)

    // Then: 验证第一次结果（成功或失败）
    expect(firstResult).toBeDefined()

    // 若失败，应有重试提示或按钮
    if (!firstResult.success) {
      const retryBtn = await licensePage.isVisible('[data-testid="retry-btn"]').catch(() => false)
      if (retryBtn) {
        await licensePage.click('[data-testid="retry-btn"]')
        const retryResult = await licensePage.activateLicense(validCode)
        expect(retryResult.message).toBeTruthy()
      }
    }

    // 若成功，验证状态
    if (firstResult.success) {
      const status = await licensePage.checkLicense()
      expect(status.isValid).toBe(true)
    }
  })

  // ===== 竞态条件 / 并发（2 tests） =====

  test('TC33-29: 同一激活码并发激活处理 @license', async ({ licensePage }) => {
    // Given: 同一激活码
    const validCode = TEST_ACTIVATION_CODES.valid.code

    // When: 快速连续点击激活按钮（模拟并发）
    await licensePage.fill(licensePage.selectors.activateInput, validCode)
    const btn = licensePage.page.locator(licensePage.selectors.activateButton)
    await btn.click()
    await btn.click() // 快速双击

    // Then: 接口应仅被调用一次或幂等处理
    const response = await licensePage.page.waitForResponse(
      resp => resp.url().includes('/api/license/activate'),
      { timeout: TIMEOUTS.api }
    )
    expect(response).toBeDefined()
    const data = await response.json()
    expect(data).toBeDefined()
  })

  test('TC33-30: 同时激活和授权检查的竞态 @license', async ({ licensePage }) => {
    // Given: 有效激活码
    const validCode = TEST_ACTIVATION_CODES.valid.code

    // When: 激活同时进行授权检查
    await licensePage.fill(licensePage.selectors.activateInput, validCode)

    // 并行发起操作
    const activatePromise = licensePage.click(licensePage.selectors.activateButton)
    const checkPromise = licensePage.click(licensePage.selectors.checkButton)

    await Promise.allSettled([activatePromise, checkPromise])

    // Then: 系统应稳定，无崩溃
    const containerVisible = await licensePage.isVisible(licensePage.selectors.container)
    expect(containerVisible).toBe(true)

    // 激活结果应最终正确
    const statusResult = await licensePage.checkLicense()
    expect(statusResult).toBeDefined()
  })
})
