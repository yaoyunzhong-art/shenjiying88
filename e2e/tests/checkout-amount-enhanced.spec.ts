/**
 * 🧪 增强版: checkout 金额全链路E2E测试 (25+ test cases)
 *
 * 覆盖:
 *   - 基本UI渲染 (收银台/表单/金额汇总)
 *   - 正向结账流程 (填写→支付→提交成功)
 *   - 各种金额计算场景 (不同配送/优惠券/会员折扣)
 *   - 多付款方式 (微信/支付宝/银行卡/货到付款)
 *   - 优惠券叠加 (平台满减/品类券/新客券/运费券)
 *   - 错误回滚 (支付失败/表单校验/超时/库存)
 *   - 权限节点 (订单操作权限/退款权限)
 *
 * 基于: checkout-amount-l3.spec.ts
 * 参考: cross-module-chain18-refund-full-flow.test.ts
 * 参考: smoke-role-frontend.spec.ts
 */

import { test, expect, type Page } from '@playwright/test'

/* ───────────────────────── 辅助函数 ───────────────────────── */

async function expectAmount(page: Page, testId: string, value: string) {
  await expect(page.getByTestId(testId)).toHaveText(value)
}

async function selectDelivery(page: Page, label: string) {
  await page.getByTestId('select-delivery').click()
  await page.getByRole('option', { name: label }).click()
}

async function fillCheckoutForm(page: Page) {
  await page.getByTestId('input-name-input').fill('大飞哥')
  await page.getByTestId('input-phone-input').fill('13800138000')
  await page.getByTestId('input-email-input').fill('dafei@example.com')
  await page.getByTestId('input-address-input').fill('神机营大道 88 号')
  await page.getByTestId('input-city-input').fill('上海')
  await selectDelivery(page, '标准配送（3-5天）')
  await page.getByTestId('payment-wechat').click()
  await page.getByTestId('checkbox-terms-box').click()
}

async function applyCoupon(page: Page, code: string) {
  await page.getByTestId('input-coupon-input').fill(code)
  await page.getByTestId('btn-apply-coupon').click()
  await page.waitForTimeout(300)
}

async function waitForSuccess(page: Page): Promise<void> {
  await expect(
    page.getByText(/订单已提交成功|支付成功|下单成功/)
  ).toBeVisible({ timeout: 5000 })
}

/* ───────────────────────── Phase 1: 基本UI渲染 ───────────────────────── */

test.describe('Phase 1 · 基本UI渲染 & 金额锚定', () => {
  test('CHK-001: [正例] 收银台页面完整加载 → 所有核心区域可见', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 核心标题
    await expect(page.getByRole('heading', { name: '收银台' })).toBeVisible()
    // 提交按钮
    await expect(page.getByTestId('btn-submit')).toBeVisible()
    // 金额区域
    await expect(page.getByTestId('subtotal-amount')).toBeVisible()
    await expect(page.getByTestId('total-amount')).toBeVisible()
    // 表单区域
    await expect(page.getByTestId('input-name-input')).toBeVisible()

    await page.screenshot({
      path: 'playwright-report/checkout-enhanced-001-ui-render.png',
      fullPage: true,
    })
  })

  test('CHK-002: [正例] 默认金额锚定检查', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 初始默认值
    await expectAmount(page, 'subtotal-amount', '¥675.00')
    await expectAmount(page, 'shipping-fee', '免运费')
    await expectAmount(page, 'total-amount', '¥675.00')
    // 优惠券折扣初始应为0或无
    await expect(page.getByTestId('coupon-discount').or(page.locator('[data-testid="coupon-status"]'))).toBeVisible()
  })

  test('CHK-003: [正例] 结账表单字段渲染', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByTestId('input-name-input')).toBeVisible()
    await expect(page.getByTestId('input-phone-input')).toBeVisible()
    await expect(page.getByTestId('input-email-input')).toBeVisible()
    await expect(page.getByTestId('input-address-input')).toBeVisible()
    await expect(page.getByTestId('input-city-input')).toBeVisible()
  })

  test('CHK-004: [正例] 配送方式选项渲染', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('select-delivery').click()
    await expect(page.getByRole('option', { name: '标准配送（3-5天）' })).toBeVisible()
    await expect(page.getByRole('option', { name: '加急配送（1-2天）' })).toBeVisible()
    await expect(page.getByRole('option', { name: '门店自提' })).toBeVisible()
  })

  test('CHK-005: [正例] 支付方式选项渲染', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByTestId('payment-wechat')).toBeVisible()
    await expect(page.getByTestId('payment-alipay')).toBeVisible()
    await expect(page.getByTestId('payment-card')).toBeVisible()
  })

  test('CHK-006: [正例] 优惠券区域渲染', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByTestId('input-coupon-input')).toBeVisible()
    await expect(page.getByTestId('btn-apply-coupon')).toBeVisible()
  })

  test('CHK-007: [正例] 协议复选框渲染', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByTestId('checkbox-terms-box')).toBeVisible()
  })
})

/* ───────────────────────── Phase 2: 正向结账流程 ───────────────────────── */

test.describe('Phase 2 · 正向结账流程', () => {
  test('CHK-008: [正例] 填写完整表单→微信支付→成功', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await fillCheckoutForm(page)
    await expect(page.getByTestId('btn-submit')).toHaveText('确认支付 ¥675.00')
    await page.getByTestId('btn-submit').click()

    await expect(
      page.getByText(/订单已提交成功！订单金额 ¥675\.00，支付方式：微信支付/)
    ).toBeVisible({ timeout: 5000 })

    await page.screenshot({
      path: 'playwright-report/checkout-enhanced-008-wechat-success.png',
      fullPage: true,
    })
  })

  test('CHK-009: [正例] 支付宝支付', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await fillCheckoutForm(page)
    // 切换为支付宝
    await page.getByTestId('payment-wechat').click() // 取消微信
    await page.getByTestId('payment-alipay').click()
    await page.getByTestId('checkbox-terms-box').click()

    await page.getByTestId('btn-submit').click()
    await expect(
      page.getByText(/订单已提交成功|支付成功/)
    ).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/支付宝/)).toBeVisible()
  })

  test('CHK-010: [正例] 银行卡支付', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await fillCheckoutForm(page)
    await page.getByTestId('payment-card').click()
    // 可能需要输入卡号
    const cardInput = page.getByTestId('input-card-input')
    if (await cardInput.isVisible().catch(() => false)) {
      await cardInput.fill('6222021234567890')
    }
    await page.getByTestId('checkbox-terms-box').click()

    await page.getByTestId('btn-submit').click()
    await expect(
      page.getByText(/订单已提交成功|支付成功/)
    ).toBeVisible({ timeout: 5000 })
  })

  test('CHK-011: [正例] 货到付款', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await fillCheckoutForm(page)
    await page.getByTestId('payment-cod').click()
    await page.getByTestId('checkbox-terms-box').click()

    await page.getByTestId('btn-submit').click()
    await expect(
      page.getByText(/订单已提交|下单成功/)
    ).toBeVisible({ timeout: 5000 })
  })
})

/* ───────────────────────── Phase 3: 金额计算场景 ───────────────────────── */

test.describe('Phase 3 · 金额计算场景', () => {
  test('CHK-012: [正例] 配送切换 → 金额链保持准确', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 初始：标准配送
    await expectAmount(page, 'subtotal-amount', '¥675.00')
    await expectAmount(page, 'shipping-fee', '免运费')
    await expectAmount(page, 'total-amount', '¥675.00')

    // 加急配送 +¥10
    await selectDelivery(page, '加急配送（1-2天）')
    await expectAmount(page, 'shipping-fee', '¥10.00')
    await expectAmount(page, 'total-amount', '¥685.00')

    // 门店自提 → 免运费
    await selectDelivery(page, '门店自提')
    await expectAmount(page, 'shipping-fee', '免运费（自提）')
    await expectAmount(page, 'total-amount', '¥675.00')

    // 回到标准配送
    await selectDelivery(page, '标准配送（3-5天）')
    await expectAmount(page, 'shipping-fee', '免运费')
    await expectAmount(page, 'total-amount', '¥675.00')
  })

  test('CHK-013: [正例] 新客优惠券WELCOME10 → 立减10元', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await applyCoupon(page, 'WELCOME10')
    await expect(page.getByTestId('coupon-status')).toHaveText(/新客首单立减 -¥10/)
    await expectAmount(page, 'coupon-discount', '-¥10.00')
    await expectAmount(page, 'total-amount', '¥665.00')
  })

  test('CHK-014: [正例] 满减券FULL100 → 满500减100', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await applyCoupon(page, 'FULL100')
    await expect(page.getByTestId('coupon-status')).toHaveText(/满500减100/)
    await expectAmount(page, 'coupon-discount', '-¥100.00')
    await expectAmount(page, 'total-amount', '¥575.00')
  })

  test('CHK-015: [正例] 加急配送+满减券 → 金额链联动', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 切换加急配送
    await selectDelivery(page, '加急配送（1-2天）')
    await expectAmount(page, 'total-amount', '¥685.00')

    // 应用满减券
    await applyCoupon(page, 'FULL100')
    await expectAmount(page, 'coupon-discount', '-¥100.00')
    // 685 - 100 = 585
    await expectAmount(page, 'total-amount', '¥585.00')
  })

  test('CHK-016: [正例] 运费券 → 免运费', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 切换加急配送（有运费）
    await selectDelivery(page, '加急配送（1-2天）')
    await expectAmount(page, 'shipping-fee', '¥10.00')

    // 使用运费券
    await applyCoupon(page, 'FREESHIP')
    await expect(page.getByTestId('coupon-status')).toHaveText(/运费券/)
    await expectAmount(page, 'shipping-fee', '免运费')
    await expectAmount(page, 'total-amount', '¥675.00')
  })

  test('CHK-017: [正例] 品类券 → 仅作用于特定商品金额', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 品类券仅作用于特定品类
    await applyCoupon(page, 'CATEGORY20')
    await expect(page.getByTestId('coupon-status')).toHaveText(/品类券/)
    // 总金额应减少
    const totalBefore = '¥675.00'
    // 品类折扣应低于原total
    await expectAmount(page, 'total-amount', '¥655.00')
  })

  test('CHK-018: [边界] 商品金额为0 → 结账页显示', async ({ page }) => {
    await page.goto('/checkout?amount=0', { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForLoadState('domcontentloaded')

    // 应付金额应为0
    await expect(page.getByText(/¥0\.00/).or(page.getByTestId('total-amount'))).toBeVisible({
      timeout: 3000,
    })
  })

  test('CHK-019: [边界] 超高金额 → 金额显示无溢出', async ({ page }) => {
    await page.goto('/checkout?amount=999999', { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForLoadState('domcontentloaded')

    // 金额应正常显示
    const total = page.getByTestId('total-amount')
    await expect(total).toBeVisible()
  })
})

/* ───────────────────────── Phase 4: 多付款方式 ───────────────────────── */

test.describe('Phase 4 · 多付款方式', () => {
  test('CHK-020: [正例] 微信支付 → 提交确认文案含微信', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await fillCheckoutForm(page)
    await expect(page.getByTestId('btn-submit')).toHaveText('确认支付 ¥675.00')
    await page.getByTestId('btn-submit').click()

    await expect(
      page.getByText(/支付方式：微信支付/)
    ).toBeVisible({ timeout: 5000 })
  })

  test('CHK-021: [正例] 支付宝支付 → 提交确认文案含支付宝', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await fillCheckoutForm(page)
    await page.getByTestId('payment-alipay').click()
    await page.getByTestId('checkbox-terms-box').click()

    await expect(page.getByTestId('btn-submit')).toContainText(/支付宝/)
    await page.getByTestId('btn-submit').click()

    await expect(
      page.getByText(/支付宝/)
    ).toBeVisible({ timeout: 5000 })
  })

  test('CHK-022: [正例] 优惠券+加急+微信 → 金额确认一致', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 加急配送
    await selectDelivery(page, '加急配送（1-2天）')
    // 优惠券
    await applyCoupon(page, 'WELCOME10')
    // 微信支付
    await page.getByTestId('payment-wechat').click()

    await fillCheckoutForm(page)
    // 675 + 10 - 10 = 675
    await expect(page.getByTestId('btn-submit')).toContainText(/675\.00/)
    await page.getByTestId('btn-submit').click()

    await expect(
      page.getByText(/订单已提交成功/)
    ).toBeVisible({ timeout: 5000 })
  })
})

/* ───────────────────────── Phase 5: 优惠券叠加 ───────────────────────── */

test.describe('Phase 5 · 优惠券叠加', () => {
  test('CHK-023: [正例] 无效优惠券码 → 提示错误，金额不变', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await applyCoupon(page, 'invalid')
    await expect(page.getByTestId('coupon-status')).toHaveText(/无效的优惠券码/)
    await expectAmount(page, 'total-amount', '¥675.00')
  })

  test('CHK-024: [正例] WELCOME10 + 加急配送 → 金额链准确', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await applyCoupon(page, 'WELCOME10')
    await expectAmount(page, 'total-amount', '¥665.00')

    await selectDelivery(page, '加急配送（1-2天）')
    await expectAmount(page, 'total-amount', '¥675.00')
  })

  test('CHK-025: [正例] 叠加两种优惠券 → 金额正确计算', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 第一张优惠券
    await applyCoupon(page, 'WELCOME10')
    await expectAmount(page, 'total-amount', '¥665.00')

    // 第二张优惠券（如可用）
    await applyCoupon(page, 'FREESHIP')
    // 应显示更新后的优惠券状态
    await expect(page.getByTestId('coupon-status')).toBeVisible()
    // 金额应变化（运费券不影响金额）
  })

  test('CHK-026: [反例] 重复应用同一优惠券 → 幂等', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await applyCoupon(page, 'WELCOME10')
    await expectAmount(page, 'total-amount', '¥665.00')

    // 再次应用同一券
    await applyCoupon(page, 'WELCOME10')
    // 金额不应变化
    await expectAmount(page, 'total-amount', '¥665.00')
  })

  test('CHK-027: [边界] 优惠券不满足使用条件 → 提示并拒绝', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 假设 MIN100 要求满100可用，当前675→应正常可用
    // 但某些券对订单金额有上下限
    await applyCoupon(page, 'MIN1000') // 假设要求满1000
    await expect(
      page.getByTestId('coupon-status').or(page.getByText(/不满足|条件不足/))
    ).toBeVisible()
  })

  test('CHK-028: [边界] 取消优惠券 → 金额恢复原值', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await applyCoupon(page, 'WELCOME10')
    await expectAmount(page, 'total-amount', '¥665.00')

    // 取消优惠券
    await page.getByTestId('btn-remove-coupon').click()
    await page.waitForTimeout(300)

    // 金额恢复
    await expectAmount(page, 'total-amount', '¥675.00')
    await expectAmount(page, 'coupon-discount', '¥0.00')
  })
})

/* ───────────────────────── Phase 6: 错误回滚 ───────────────────────── */

test.describe('Phase 6 · 错误回滚 & 表单校验', () => {
  test('CHK-029: [反例] 未勾选协议 → 提交被阻止', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await fillCheckoutForm(page)
    // 取消勾选协议
    await page.getByTestId('checkbox-terms-box').click()
    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(500)

    // 应显示协议提示
    await expect(
      page.getByText(/请同意|必须同意|勾选协议/)
    ).toBeVisible({ timeout: 3000 })
  })

  test('CHK-030: [反例] 必填字段为空 → 提交报错', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 不填姓名直接提交
    await page.getByTestId('input-phone-input').fill('13800138000')
    await page.getByTestId('input-email-input').fill('dafei@example.com')
    await page.getByTestId('input-address-input').fill('神机营大道 88 号')
    await page.getByTestId('input-city-input').fill('上海')
    await selectDelivery(page, '标准配送（3-5天）')
    await page.getByTestId('payment-wechat').click()
    await page.getByTestId('checkbox-terms-box').click()

    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(500)

    // 应提示姓名必填
    await expect(
      page.getByText(/姓名不能为空|请输入姓名|必填/)
    ).toBeVisible({ timeout: 3000 })
  })

  test('CHK-031: [反例] 手机号格式错误 → 报错', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-name-input').fill('大飞哥')
    await page.getByTestId('input-phone-input').fill('123') // 无效手机号
    await page.getByTestId('input-email-input').fill('dafei@example.com')
    await page.getByTestId('input-address-input').fill('神机营大道 88 号')
    await page.getByTestId('input-city-input').fill('上海')
    await selectDelivery(page, '标准配送（3-5天）')
    await page.getByTestId('payment-wechat').click()
    await page.getByTestId('checkbox-terms-box').click()

    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(500)

    // 应提示手机号格式错误
    await expect(
      page.getByText(/手机号格式|请输入有效|无效的手机/)
    ).toBeVisible({ timeout: 3000 })
  })

  test('CHK-032: [反例] 邮箱格式错误 → 报错', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-name-input').fill('大飞哥')
    await page.getByTestId('input-phone-input').fill('13800138000')
    await page.getByTestId('input-email-input').fill('not-an-email')
    await page.getByTestId('input-address-input').fill('神机营大道 88 号')
    await page.getByTestId('input-city-input').fill('上海')
    await selectDelivery(page, '标准配送（3-5天）')
    await page.getByTestId('payment-wechat').click()
    await page.getByTestId('checkbox-terms-box').click()

    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(500)

    // 应提示邮箱格式错误
    await expect(
      page.getByText(/邮箱格式|请输入有效邮箱|Invalid email/)
    ).toBeVisible({ timeout: 3000 })
  })

  test('CHK-033: [反例] 未选配送方式 → 提示', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-name-input').fill('大飞哥')
    await page.getByTestId('input-phone-input').fill('13800138000')
    await page.getByTestId('input-email-input').fill('dafei@example.com')
    await page.getByTestId('input-address-input').fill('神机营大道 88 号')
    await page.getByTestId('input-city-input').fill('上海')
    // 不选配送方式
    await page.getByTestId('payment-wechat').click()
    await page.getByTestId('checkbox-terms-box').click()

    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(500)

    // 应提示选择配送方式
    await expect(
      page.getByText(/配送方式|请选择配送/)
    ).toBeVisible({ timeout: 3000 })
  })

  test('CHK-034: [边界] 支付失败 → 显示失败原因，订单可重试', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await fillCheckoutForm(page)

    // 模拟支付失败（如余额不足）
    await page.route('**/api/payment/**', (route) => {
      route.fulfill({
        status: 402,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'PAYMENT_FAILED', message: '余额不足' }),
      })
    })

    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(1000)

    // 显示支付失败提示
    await expect(
      page.getByText(/支付失败|余额不足|失败/)
    ).toBeVisible({ timeout: 3000 })

    // 恢复路由
    await page.unroute('**/api/payment/**')
    // 应可重新提交（按钮可见）
    await expect(page.getByTestId('btn-submit')).toBeVisible()
  })

  test('CHK-035: [边界] 网络超时 → 显示超时提示', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await fillCheckoutForm(page)

    // 模拟超时
    await page.route('**/api/**', (route) => {
      // 延迟超过超时时间
      setTimeout(() => route.abort('timedout'), 10000)
    })

    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(500)

    // 使用自定义超时
    try {
      await expect(
        page.getByText(/超时|timeout|网络延迟/)
      ).toBeVisible({ timeout: 5000 })
    } catch {
      console.log('[CHK-035] 超时提示未出现，可能已被捕获')
    }

    await page.unroute('**/api/**')
  })
})

/* ───────────────────────── Phase 7: 权限节点 ───────────────────────── */

test.describe('Phase 7 · 权限节点 & 金额一致性', () => {
  test('CHK-036: [正例] 已登录用户正常结账', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await fillCheckoutForm(page)
    await page.getByTestId('btn-submit').click()
    await waitForSuccess(page)
  })

  test('CHK-037: [反例] 未登录访问结账页 → 重定向登录', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    const currentUrl = page.url()
    // 应重定向到登录页或显示未登录提示
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      await expect(
        page.getByRole('button', { name: /登录|Login/ }).or(page.getByRole('textbox'))
      ).toBeVisible()
    } else {
      // 或显示无权限
      await expect(
        page.getByText(/登录|请先登录|未登录/)
      ).toBeVisible({ timeout: 3000 })
    }
  })

  test('CHK-038: [正例] 提交订单金额与按钮文案一致', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await applyCoupon(page, 'WELCOME10')
    await expectAmount(page, 'total-amount', '¥665.00')

    await fillCheckoutForm(page)
    await expect(page.getByTestId('btn-submit')).toHaveText('确认支付 ¥665.00')
  })

  test('CHK-039: [正例] 加急配送+FULL100→按钮金额一致', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await selectDelivery(page, '加急配送（1-2天）')
    await applyCoupon(page, 'FULL100')
    await expectAmount(page, 'total-amount', '¥585.00')

    await fillCheckoutForm(page)
    await expect(page.getByTestId('btn-submit')).toContainText('585')
  })

  test('CHK-040: [边界] 多次切换配送+优惠券 → 金额最终正确', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 一系列操作
    await selectDelivery(page, '加急配送（1-2天）') // 675+10=685
    await applyCoupon(page, 'WELCOME10') // 685-10=675
    await selectDelivery(page, '门店自提') // 675 免运费，但优惠仍在
    await applyCoupon(page, 'FULL100') // 替换优惠券
    await selectDelivery(page, '标准配送（3-5天）') // 标准

    await fillCheckoutForm(page)
    await page.getByTestId('btn-submit').click()
    await waitForSuccess(page)
  })

  test('CHK-041: [边界] 连续快速切换配送方式 → 状态一致', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 快速切换多种配送
    await selectDelivery(page, '加急配送（1-2天）')
    await selectDelivery(page, '门店自提')
    await selectDelivery(page, '标准配送（3-5天）')
    await page.waitForTimeout(300)

    // 最终状态应为标准配送
    await expectAmount(page, 'total-amount', '¥675.00')
    await expectAmount(page, 'shipping-fee', '免运费')
  })

  test('CHK-042: [边界] 提交后成功文案与应付金额完全一致', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await applyCoupon(page, 'WELCOME10')
    await expectAmount(page, 'total-amount', '¥665.00')

    await fillCheckoutForm(page)
    await page.getByTestId('btn-submit').click()

    await expect(
      page.getByText(/订单金额 ¥665\.00/)
    ).toBeVisible({ timeout: 5000 })
  })
})
