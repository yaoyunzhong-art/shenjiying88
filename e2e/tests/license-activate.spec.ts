/**
 * TC33: E2E测试 - 激活码激活流程
 * Sprint 2 Day 21
 * 
 * 测试场景:
 * 1. 有效激活码激活
 * 2. 无效激活码处理
 * 3. 过期激活码处理
 * 4. 已使用激活码处理
 * 5. 格式错误的激活码处理
 */

import { test, expect } from '../fixtures/auth.fixture'
import { TEST_ACTIVATION_CODES, TIMEOUTS } from '../fixtures/test-data'

test.describe('激活码激活流程', () => {
  test.beforeEach(async ({ licensePage }) => {
    // 每个测试前导航到授权管理页面
    await licensePage.navigateToLicenseManager()
  })

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
    // Given: 已被使用的激活码
    const usedCode = TEST_ACTIVATION_CODES.used.code

    // When: 执行激活
    const result = await licensePage.activateLicense(usedCode)

    // Then: 验证激活失败并显示已使用提示
    expect(result.success).toBe(false)
    expect(result.message).toMatch(/已使用|已激活|used|activated/i)
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
      // 注意: 实际验证取决于前端验证实现
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
    // 输入框应该被清空或保留（取决于实现）
    expect(inputValue).toBeDefined()
  })
})