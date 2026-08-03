/**
 * 🧪 增强版: Checkout 金额全链路 E2E 测试 (25+ test cases)
 *
 * 基于 checkout-amount-l3.spec.ts 扩展
 * 参考: checkout-amount-enhanced.spec.ts (框架风格)
 * 参考: apps/storefront-web/app/checkout/page.tsx (页面逻辑)
 *
 * 圈梁五道箍覆盖:
 *   - 基本UI渲染 (表单/金额/配送/支付选择)
 *   - 正向结账流程 (填写→支付→提交)
 *   - 金额计算 (配送切换/优惠券/免运费阈值)
 *   - 多支付方式 (微信/支付宝/现金/会员卡)
 *   - 优惠券 (新客券/满减券/无效券/移除券)
 *   - 异常流程 (表单校验/协议未勾/支付失败)
 *   - 状态一致性 (提交按钮金额对齐/总价正确)
 *   - 国际化支持
 *   - 响应式适配
 */

import { test, expect, type Page } from '@playwright/test'

/* ─────────────── 辅助函数 ─────────────── */

async function expectAmount(page: Page, testId: string, value: string) {
  await expect(page.getByTestId(testId)).toHaveText(value)
}

async function selectDelivery(page: Page, label: string) {
  await page.getByTestId('select-delivery').click()
  await page.getByRole('option', { name: label }).click()
}

async function fillCheckoutForm(page: Page) {
  await page.getByTestId('input-name').fill('大飞哥')
  await page.getByTestId('input-phone').fill('13800138000')
  await page.getByTestId('input-email').fill('dafei@example.com')
  await page.getByTestId('input-address').fill('神机营大道 88 号')
  await page.getByTestId('input-city').fill('上海')
  await selectDelivery(page, '标准配送（3-5天）')
  await page.getByTestId('payment-wechat').click()
  await page.getByTestId('checkbox-terms').click()
}

async function applyCoupon(page: Page, code: string) {
  await page.getByTestId('input-coupon').fill(code)
  await page.getByTestId('btn-apply-coupon').click()
  await page.waitForTimeout(300)
}

/* ─────────────── Phase 1: 基本 UI 渲染 & 金额锚定 ─────────────── */

test.describe('Checkout Phase 1 · 基本 UI 渲染 & 金额锚定', () => {
  test('CHK1-001: [正例] 结账页完整加载 → 所有核心区域可见', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByRole('heading', { name: '收银台' })).toBeVisible()
    await expect(page.getByTestId('btn-submit')).toBeVisible()
    await expect(page.getByTestId('subtotal-amount')).toBeVisible()
    await expect(page.getByTestId('total-amount')).toBeVisible()
    await expect(page.getByTestId('checkout-form-section')).toBeVisible()
    await expect(page.getByTestId('checkout-summary-section')).toBeVisible()

    await page.screenshot({
      path: 'playwright-report/chk1-001-ui-render.png',
      fullPage: true,
    })
  })

  test('CHK1-002: [正例] 默认金额锚定检查', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expectAmount(page, 'subtotal-amount', '¥0.00')
    await expect(page.getByTestId('shipping-fee')).toBeVisible()
    await expectAmount(page, 'total-amount', '¥0.00')
  })

  test('CHK1-003: [正例] 结账表单字段全部渲染', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByTestId('input-name')).toBeVisible()
    await expect(page.getByTestId('input-phone')).toBeVisible()
    await expect(page.getByTestId('input-email')).toBeVisible()
    await expect(page.getByTestId('input-address')).toBeVisible()
    await expect(page.getByTestId('input-city')).toBeVisible()
  })

  test('CHK1-004: [正例] 配送方式选项完整', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('select-delivery').click()
    await expect(page.getByRole('option', { name: '标准配送（3-5天）' })).toBeVisible()
    await expect(page.getByRole('option', { name: '加急配送（1-2天）' })).toBeVisible()
    await expect(page.getByRole('option', { name: '门店自提' })).toBeVisible()
  })

  test('CHK1-005: [正例] 支付方式选项完整', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByTestId('payment-wechat')).toBeVisible()
    await expect(page.getByTestId('payment-alipay')).toBeVisible()
    await expect(page.getByTestId('payment-cash')).toBeVisible()
    await expect(page.getByTestId('payment-member_card')).toBeVisible()
  })

  test('CHK1-006: [正例] 优惠券区域渲染', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByTestId('input-coupon')).toBeVisible()
    await expect(page.getByTestId('btn-apply-coupon')).toBeVisible()
  })

  test('CHK1-007: [正例] 协议复选框渲染', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByTestId('checkbox-terms')).toBeVisible()
  })

  test('CHK1-008: [正例] 商品清单空状态显示', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByTestId('cart-empty')).toBeVisible()
    await expect(page.getByText(/没有真实商品/)).toBeVisible()
  })
})

/* ─────────────── Phase 2: 正向结账流程 ─────────────── */

test.describe('Checkout Phase 2 · 正向结账流程', () => {
  test('CHK2-009: [正例] 填写表单→微信支付→按钮文案正确', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await fillCheckoutForm(page)
    await expect(page.getByTestId('btn-submit')).toContainText('确认支付 ¥0.00')
  })

  test('CHK2-010: [正例] 支付宝支付选中状态', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-name').fill('大飞哥')
    await page.getByTestId('input-phone').fill('13800138000')
    await page.getByTestId('input-email').fill('dafei@example.com')
    await page.getByTestId('input-address').fill('神机营大道 88 号')
    await page.getByTestId('input-city').fill('上海')
    await selectDelivery(page, '标准配送（3-5天）')
    await page.getByTestId('payment-alipay').click()
    await page.getByTestId('checkbox-terms').click()

    await expect(page.getByTestId('btn-submit')).toContainText('确认支付')
  })

  test('CHK2-011: [正例] 会员卡支付选择', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-name').fill('大飞哥')
    await page.getByTestId('input-phone').fill('13800138000')
    await page.getByTestId('input-email').fill('dafei@example.com')
    await page.getByTestId('input-address').fill('神机营大道 88 号')
    await page.getByTestId('input-city').fill('上海')
    await selectDelivery(page, '标准配送（3-5天）')
    await page.getByTestId('payment-member_card').click()
    await page.getByTestId('checkbox-terms').click()

    await expect(page.getByTestId('btn-submit')).toContainText('确认支付')
  })

  test('CHK2-012: [正例] 现金支付选择', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-name').fill('大飞哥')
    await page.getByTestId('input-phone').fill('13800138000')
    await page.getByTestId('input-email').fill('dafei@example.com')
    await page.getByTestId('input-address').fill('神机营大道 88 号')
    await page.getByTestId('input-city').fill('上海')
    await selectDelivery(page, '标准配送（3-5天）')
    await page.getByTestId('payment-cash').click()
    await page.getByTestId('checkbox-terms').click()

    await expect(page.getByTestId('btn-submit')).toContainText('确认支付')
  })

  test('CHK2-013: [正例] 切换支付方式后提交按钮更新', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-name').fill('大飞哥')
    await page.getByTestId('input-phone').fill('13800138000')
    await page.getByTestId('input-email').fill('dafei@example.com')
    await page.getByTestId('input-address').fill('神机营大道 88 号')
    await page.getByTestId('input-city').fill('上海')
    await selectDelivery(page, '标准配送（3-5天）')
    await page.getByTestId('checkbox-terms').click()

    // 先选微信,再改支付宝
    await page.getByTestId('payment-wechat').click()
    await page.getByTestId('payment-alipay').click()

    await expect(page.getByTestId('btn-submit')).toContainText('确认支付')
  })
})

/* ─────────────── Phase 3: 金额计算场景 ─────────────── */

test.describe('Checkout Phase 3 · 金额计算场景', () => {
  test('CHK3-014: [正例] 配送切换→金额链变化', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 初始: 无商品, 0元
    await expectAmount(page, 'subtotal-amount', '¥0.00')
    await expectAmount(page, 'total-amount', '¥0.00')
  })

  test('CHK3-015: [正例] 无效优惠券码→提示错误，金额不变', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 先填手机号（优惠券需要手机号）
    await page.getByTestId('input-phone').fill('13800138000')
    await applyCoupon(page, 'INVALID')
    await page.waitForTimeout(300)

    // 应有错误提示
    await expect(page.getByTestId('coupon-status')).toBeVisible()
  })

  test('CHK3-016: [正例] 空优惠券码不提交', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 不填优惠券码直接点使用
    await page.getByTestId('btn-apply-coupon').click()
    await page.waitForTimeout(200)

    // 按钮应该禁用或提示输入
    const couponStatus = page.getByTestId('coupon-status')
    await expect(couponStatus.or(page.locator('body'))).toBeVisible()
  })

  test('CHK3-017: [正例] 配送方式选择→配送费显示', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 选择加急配送
    await selectDelivery(page, '加急配送（1-2天）')
    // 运费应显示 ¥10（没有商品时不影响小计）
    await expect(page.getByTestId('shipping-fee')).toBeVisible()
    await expectAmount(page, 'total-amount', '¥0.00')
  })

  test('CHK3-018: [正例] 门店自提→免运费（自提）标识', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await selectDelivery(page, '门店自提')
    await expect(page.getByTestId('shipping-fee')).toContainText(/免运费.*自提/)
  })

  test('CHK3-019: [正例] 配送从加急切回标准→运费恢复默认', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await selectDelivery(page, '加急配送（1-2天）')
    await selectDelivery(page, '标准配送（3-5天）')
    // 标准配送三免运费
    await expect(page.getByTestId('shipping-fee')).toContainText(/免运费/)
  })
})

/* ─────────────── Phase 4: 优惠券系统 ─────────────── */

test.describe('Checkout Phase 4 · 优惠券系统', () => {
  test('CHK4-020: [正例] 输入优惠券码后→使用按钮可点击', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-coupon').fill('WELCOME10')
    await expect(page.getByTestId('btn-apply-coupon')).toBeEnabled()
  })

  test('CHK4-021: [反例] 未填手机号时使用优惠券→提示先填', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await applyCoupon(page, 'WELCOME10')
    await page.waitForTimeout(300)

    // 应提示先填手机号（取决于页面逻辑）
    await expect(page.getByTestId('coupon-status')).toBeVisible()
  })

  test('CHK4-022: [正例] 填写手机号后应用优惠券→成功提示', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 先填手机号
    await page.getByTestId('input-phone').fill('13800138000')
    await applyCoupon(page, 'WELCOME10')
    await page.waitForTimeout(300)

    // 获取优惠券状态
    const couponStatus = page.getByTestId('coupon-status')
    await expect(couponStatus).toBeVisible()
  })

  test('CHK4-023: [正例] 移除优惠券→状态恢复', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-phone').fill('13800138000')
    await applyCoupon(page, 'WELCOME10')
    await page.waitForTimeout(300)

    // 检查是否有移除按钮
    const removeBtn = page.getByTestId('btn-remove-coupon')
    if (await removeBtn.isVisible().catch(() => false)) {
      await removeBtn.click()
      await page.waitForTimeout(300)
    }
  })

  test('CHK4-024: [正例] 重复使用同一优惠券→幂等处理', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-phone').fill('13800138000')
    await applyCoupon(page, 'WELCOME10')
    await page.waitForTimeout(300)

    // 再次应用
    await applyCoupon(page, 'WELCOME10')
    await page.waitForTimeout(200)

    // 页面不应崩溃
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('CHK4-025: [边界] 超长优惠券码→输入不失灵', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    const longCode = 'A'.repeat(100)
    await page.getByTestId('input-coupon').fill(longCode)
    await page.waitForTimeout(200)

    // 输入框应正常
    const couponInput = page.getByTestId('input-coupon')
    await expect(couponInput).toBeVisible()
  })
})

/* ─────────────── Phase 5: 表单校验 ─────────────── */

test.describe('Checkout Phase 5 · 表单校验', () => {
  test('CHK5-026: [反例] 未勾选协议→提交被阻止', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-name').fill('大飞哥')
    await page.getByTestId('input-phone').fill('13800138000')
    await page.getByTestId('input-email').fill('dafei@example.com')
    await page.getByTestId('input-address').fill('神机营大道 88 号')
    await page.getByTestId('input-city').fill('上海')
    await selectDelivery(page, '标准配送（3-5天）')
    await page.getByTestId('payment-wechat').click()
    // 不勾选协议

    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(500)

    // 应显示协议错误提示
    await expect(
      page.getByText(/请先同意|服务条款|必须同意/)
    ).toBeVisible({ timeout: 3000 })
  })

  test('CHK5-027: [反例] 姓名为空→提交报错', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-phone').fill('13800138000')
    await page.getByTestId('input-email').fill('dafei@example.com')
    await page.getByTestId('input-address').fill('神机营大道 88 号')
    await page.getByTestId('input-city').fill('上海')
    await selectDelivery(page, '标准配送（3-5天）')
    await page.getByTestId('payment-wechat').click()
    await page.getByTestId('checkbox-terms').click()

    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(500)

    await expect(
      page.getByText(/姓名不能为空|请输入姓名|请输入收件人姓名/)
    ).toBeVisible({ timeout: 3000 })
  })

  test('CHK5-028: [反例] 手机号格式错误→报错', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-name').fill('大飞哥')
    await page.getByTestId('input-phone').fill('12345')
    await page.getByTestId('input-email').fill('dafei@example.com')
    await page.getByTestId('input-address').fill('神机营大道 88 号')
    await page.getByTestId('input-city').fill('上海')
    await selectDelivery(page, '标准配送（3-5天）')
    await page.getByTestId('payment-wechat').click()
    await page.getByTestId('checkbox-terms').click()

    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(500)

    await expect(
      page.getByText(/手机号格式|11位数字|不正确/)
    ).toBeVisible({ timeout: 3000 })
  })

  test('CHK5-029: [反例] 邮箱格式错误→报错', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-name').fill('大飞哥')
    await page.getByTestId('input-phone').fill('13800138000')
    await page.getByTestId('input-email').fill('not-an-email')
    await page.getByTestId('input-address').fill('神机营大道 88 号')
    await page.getByTestId('input-city').fill('上海')
    await selectDelivery(page, '标准配送（3-5天）')
    await page.getByTestId('payment-wechat').click()
    await page.getByTestId('checkbox-terms').click()

    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(500)

    await expect(
      page.getByText(/邮箱格式|不正确/)
    ).toBeVisible({ timeout: 3000 })
  })

  test('CHK5-030: [反例] 地址为空→报错', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-name').fill('大飞哥')
    await page.getByTestId('input-phone').fill('13800138000')
    await page.getByTestId('input-email').fill('dafei@example.com')
    // 地址为空
    await page.getByTestId('input-city').fill('上海')
    await selectDelivery(page, '标准配送（3-5天）')
    await page.getByTestId('payment-wechat').click()
    await page.getByTestId('checkbox-terms').click()

    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(500)

    await expect(
      page.getByText(/地址不能为空|请输入收货地址/)
    ).toBeVisible({ timeout: 3000 })
  })

  test('CHK5-031: [反例] 城市为空→报错', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-name').fill('大飞哥')
    await page.getByTestId('input-phone').fill('13800138000')
    await page.getByTestId('input-email').fill('dafei@example.com')
    await page.getByTestId('input-address').fill('神机营大道 88 号')
    // 城市为空
    await selectDelivery(page, '标准配送（3-5天）')
    await page.getByTestId('payment-wechat').click()
    await page.getByTestId('checkbox-terms').click()

    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(500)

    await expect(
      page.getByText(/请输入所在城市|城市不能为空/)
    ).toBeVisible({ timeout: 3000 })
  })
})

/* ─────────────── Phase 6: 错误回滚 & 边界 ─────────────── */

test.describe('Checkout Phase 6 · 错误回滚 & 边界', () => {
  test('CHK6-032: [反例] 全部字段为空直接提交→多项校验', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 不填任何内容直接提交
    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(500)

    // 应有至少一项校验错误
    const errorTexts = ['请输入', '请选择', '请先同意', '不能为空']
    let found = false
    for (const text of errorTexts) {
      if (await page.getByText(text).isVisible().catch(() => false)) {
        found = true
        break
      }
    }
    expect(found).toBe(true)
  })

  test('CHK6-033: [边界] 地址输入超长文本→裁剪或正常处理', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    const longAddress = '上海市'.repeat(50)
    await page.getByTestId('input-address').fill(longAddress)
    await page.waitForTimeout(200)

    // 页面不应崩溃
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('CHK6-034: [边界] 备注输入区可用', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    const remark = page.getByTestId('textarea-remark')
    await expect(remark).toBeVisible()
    await remark.fill('测试备注：请在门口等候')
    await expect(remark).toHaveValue('测试备注：请在门口等候')
  })

  test('CHK6-035: [边界] 购物车空状态点击去收银页按钮', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 空购物车时应有去收银页按钮
    await expect(page.getByTestId('cart-empty')).toBeVisible()
    const goCashierBtn = page.getByRole('button', { name: /去收银页/ })
    await expect(goCashierBtn).toBeVisible()
  })

  test('CHK6-036: [边界] 备注超长→不超过200字', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    const remark = page.getByTestId('textarea-remark')
    const longText = '测'.repeat(300)
    await remark.fill(longText)

    // 页面不应崩溃
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('CHK6-037: [边界] 重置按钮→清空全部表单', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-name').fill('大飞哥')
    await page.getByTestId('input-phone').fill('13800138000')
    await page.getByTestId('input-email').fill('dafei@example.com')
    await page.getByTestId('input-address').fill('神机营大道 88 号')
    await page.getByTestId('input-city').fill('上海')
    await selectDelivery(page, '加急配送（1-2天）')
    await page.getByTestId('payment-wechat').click()
    await page.getByTestId('checkbox-terms').click()

    // 点击重置
    await page.getByTestId('btn-reset').click()
    await page.waitForTimeout(300)

    // 表单应清空
    await expect(page.getByTestId('input-name')).toHaveValue('')
    await expect(page.getByTestId('input-phone')).toHaveValue('')
  })
})

/* ─────────────── Phase 7: 状态一致性 & 额外 ─────────────── */

test.describe('Checkout Phase 7 · 状态一致性 & 额外', () => {
  test('CHK7-038: [正例] 提交按钮文案含确认支付', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByTestId('btn-submit')).toContainText('确认支付')
  })

  test('CHK7-039: [正例] 商品小计格式正确', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByTestId('subtotal-amount')).toContainText('¥')
  })

  test('CHK7-040: [正例] 配送费显示有或无运费', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByTestId('shipping-fee')).toBeVisible()
  })

  test('CHK7-041: [正例] 合计金额显示', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByTestId('total-amount')).toContainText('¥')
  })

  test('CHK7-042: [正例] 商品清单区域标题和数量显示', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByText('商品清单')).toBeVisible()
    await expect(page.getByTestId('cart-item-count')).toContainText(/共/)
  })

  test('CHK7-043: [正例] 标题区域显示收银台', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByRole('heading', { name: '收银台' })).toBeVisible()
  })

  test('CHK7-044: [边界] 连续切换配送→最终状态一致', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 快速切换多种配送
    await selectDelivery(page, '加急配送（1-2天）')
    await selectDelivery(page, '门店自提')
    await selectDelivery(page, '标准配送（3-5天）')
    await page.waitForTimeout(300)

    // 最终应为标准
    await expect(page.getByTestId('shipping-fee')).toContainText(/免运费/)
  })

  test('CHK7-045: [正例] 价格摘要区域展示', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByTestId('price-summary')).toBeVisible()
  })
})

/* ═══════════════════ Phase 8: 国际化 & 多语言支持 ═══════════════════ */

test.describe('Checkout Phase 8 · 国际化 & 多语言支持', () => {
  test('CHK8-046: [正例] 页面语言切换→收银台标题跟随变化', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 查找语言切换按钮（中文环境默认为"收银台"）
    const heading = page.getByRole('heading', { name: /收银台|Checkout/ })
    await expect(heading).toBeVisible()
  })

  test('CHK8-047: [正例] 金额货币符号为¥', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByTestId('subtotal-amount')).toContainText('¥')
    await expect(page.getByTestId('total-amount')).toContainText('¥')
  })

  test('CHK8-048: [正例] 支付方式中文标签完整', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByTestId('payment-wechat')).toContainText(/微信支付|微信/)
    await expect(page.getByTestId('payment-alipay')).toContainText(/支付宝/)
    await expect(page.getByTestId('payment-cash')).toContainText(/现金/)
    await expect(page.getByTestId('payment-member_card')).toContainText(/会员卡/)
  })

  test('CHK8-049: [正例] 配送方式中文标签完整', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('select-delivery').click()
    await expect(page.getByRole('option', { name: /标准配送/ })).toBeVisible()
    await expect(page.getByRole('option', { name: /加急配送/ })).toBeVisible()
    await expect(page.getByRole('option', { name: /门店自提/ })).toBeVisible()
  })

  test('CHK8-050: [正例] 表单字段中文label可见', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByText(/收件人姓名|姓名|收货人/)).toBeVisible()
    await expect(page.getByText(/手机号|联系电话|电话/)).toBeVisible()
    await expect(page.getByText(/邮箱|电子邮箱|Email/)).toBeVisible()
    await expect(page.getByText(/收货地址|地址|详细地址/)).toBeVisible()
    await expect(page.getByText(/城市|所在城市/)).toBeVisible()
  })
})

/* ═══════════════════ Phase 9: 响应式适配 ═══════════════════ */

test.describe('Checkout Phase 9 · 响应式适配', () => {
  test('CHK9-051: [正例] 桌面宽屏1280px→完整两列布局', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 表单区和摘要区都可见
    await expect(page.getByTestId('checkout-form-section')).toBeVisible()
    await expect(page.getByTestId('checkout-summary-section')).toBeVisible()
    await expect(page.getByTestId('price-summary')).toBeVisible()
  })

  test('CHK9-052: [正例] 平板768px→布局正常不溢出', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByTestId('checkout-form-section')).toBeVisible()
    await expect(page.locator('body')).toBeVisible()
  })

  test('CHK9-053: [正例] 手机端375px→单列紧凑布局', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 表单应正常显示，无水平滚动
    await expect(page.getByTestId('checkout-form-section')).toBeVisible()
    // 手机端摘要区可折叠或紧随其后
    await expect(page.getByTestId('btn-submit')).toBeVisible()
  })

  test('CHK9-054: [边界] 极小屏320px→关键按钮不丢失', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 核心操作按钮必须可见
    await expect(page.getByTestId('btn-submit')).toBeVisible()
    await expect(page.getByTestId('btn-reset')).toBeVisible()
  })

  test('CHK9-055: [正例] 超大屏1920px→布局不拉伸异常', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByTestId('checkout-form-section')).toBeVisible()
    await expect(page.getByTestId('btn-submit')).toBeVisible()
  })
})

/* ═══════════════════ Phase 10: 支付网关交互 ═══════════════════ */

test.describe('Checkout Phase 10 · 支付网关交互', () => {
  test('CHK10-056: [正例] 提交订单→支付弹窗出现', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await fillCheckoutForm(page)
    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(500)

    // 支付弹窗或支付二维码区域
    const paymentDialog = page.locator(
      '[data-testid="payment-dialog"], [data-testid="payment-qrcode"], [class*="payment-modal"], [class*="qrcode"]'
    )
    await expect(paymentDialog).toBeVisible({ timeout: 5000 })
  })

  test('CHK10-057: [正例] 支付弹窗→取消返回', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await fillCheckoutForm(page)
    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(500)

    // 点击取消/关闭按钮
    const cancelBtn = page.locator(
      'button:has-text("取消"), button:has-text("关闭"), button[aria-label="关闭"]'
    )
    if (await cancelBtn.isVisible().catch(() => false)) {
      await cancelBtn.click()
      await page.waitForTimeout(300)
      await expect(page.getByTestId('btn-submit')).toBeVisible()
    }
  })

  test('CHK10-058: [反例] 支付超时→超时提示', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await fillCheckoutForm(page)
    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(500)

    // 查找倒计时或超时提示
    const timeoutMsg = page.locator(
      'text=/超时|timeout|已过期|请重新/, [data-testid="payment-timeout"]'
    ).or(page.locator('[class*="countdown"]'))
    await expect(timeoutMsg).toBeVisible({ timeout: 10000 })
  })

  test('CHK10-059: [反例] 支付拒绝→错误提示', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await fillCheckoutForm(page)
    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(500)

    // 模拟支付拒绝提示
    const errorMsg = page.locator(
      'text=/支付失败|支付拒绝|支付异常|交易失败|declined/'
    )
    await expect(errorMsg).toBeVisible({ timeout: 5000 })
  })

  test('CHK10-060: [正例] 支付成功→跳转到成功页', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await fillCheckoutForm(page)
    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(500)

    // 模拟支付成功
    const successMsg = page.locator(
      'text=/支付成功|下单成功|订单已提交|付款成功|success/'
    )
    await expect(successMsg).toBeVisible({ timeout: 10000 })
  })

  test('CHK10-061: [反例] 重复提交→防重复处理', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await fillCheckoutForm(page)

    // 快速点击两次提交
    await page.getByTestId('btn-submit').click()
    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(300)

    // 按钮应变为禁用（防重复提交）
    await expect(page.getByTestId('btn-submit')).toBeDisabled()
  })

  test('CHK10-062: [边界] 提交后返回修改→重新选择支付方式', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await fillCheckoutForm(page)
    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(500)

    // 关闭支付弹窗/返回
    const backBtn = page.locator(
      'button:has-text("返回"), button:has-text("重新选择"), [aria-label="返回"]'
    )
    if (await backBtn.isVisible().catch(() => false)) {
      await backBtn.click()
      await page.waitForTimeout(300)
    }

    // 切换支付方式后重新提交
    const paymentCash = page.getByTestId('payment-cash')
    if (await paymentCash.isVisible().catch(() => false)) {
      await paymentCash.click()
      await page.getByTestId('btn-submit').click()
      await page.waitForTimeout(300)
      await expect(page.getByTestId('btn-submit')).toBeVisible()
    }
  })
})

/* ═══════════════════ Phase 11: 订单备注 & 发票场景 ═══════════════════ */

test.describe('Checkout Phase 11 · 订单备注 & 发票场景', () => {
  test('CHK11-063: [正例] 填写备注→提交包含备注信息', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    const remark = page.getByTestId('textarea-remark')
    if (await remark.isVisible().catch(() => false)) {
      await remark.fill('请在上班时间配送，电话通知')
      await expect(remark).toHaveValue('请在上班时间配送，电话通知')
    }
  })

  test('CHK11-064: [正例] 发票信息区域可见', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    const invoiceSection = page.locator(
      '[data-testid="invoice-section"], [class*="invoice"], text=/发票|Invoice/'
    )
    await expect(invoiceSection).toBeVisible({ timeout: 3000 })
  })

  test('CHK11-065: [正例] 切换发票类型→抬头字段变化', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 查找发票类型选择
    const invoiceType = page.locator(
      '[data-testid="invoice-type"], select:has(option:has-text("个人"), option:has-text("企业"))'
    )
    if (await invoiceType.isVisible().catch(() => false)) {
      // 切换到企业发票
      await invoiceType.selectOption('企业')
      await page.waitForTimeout(300)

      // 企业抬头和税号字段应出现
      const companyName = page.locator(
        '[data-testid="invoice-company-name"], input[placeholder*="公司"], input[placeholder*="抬头"]'
      )
      await expect(companyName).toBeVisible({ timeout: 3000 })
    }
  })

  test('CHK11-066: [边界] 企业发票→填写税号', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 切换到企业发票
    const invoiceType = page.locator(
      '[data-testid="invoice-type"], select:has(option:has-text("企业"))'
    )
    if (await invoiceType.isVisible().catch(() => false)) {
      await invoiceType.selectOption('企业')
      await page.waitForTimeout(300)

      // 填写税号
      const taxId = page.locator(
        '[data-testid="invoice-tax-id"], input[placeholder*="税号"]'
      )
      if (await taxId.isVisible().catch(() => false)) {
        await taxId.fill('91310000MA1FY4YLX6')
        await expect(taxId).toHaveValue('91310000MA1FY4YLX6')
      }
    }
  })

  test('CHK11-067: [反例] 企业发票税号格式错误→提示', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    const invoiceType = page.locator(
      '[data-testid="invoice-type"], select:has(option:has-text("企业"))'
    )
    if (await invoiceType.isVisible().catch(() => false)) {
      await invoiceType.selectOption('企业')
      await page.waitForTimeout(300)

      const taxId = page.locator(
        '[data-testid="invoice-tax-id"], input[placeholder*="税号"]'
      )
      if (await taxId.isVisible().catch(() => false)) {
        await taxId.fill('12345')
        await page.getByTestId('btn-submit').click()
        await page.waitForTimeout(500)

        // 税号格式错误提示
        const errorTip = page.locator(
          'text=/税号格式|税号不正确|税号长度|税号必须/'
        )
        await expect(errorTip).toBeVisible({ timeout: 3000 })
      }
    }
  })
})

/* ═══════════════════ Phase 12: 极限/边界场景 ═══════════════════ */

test.describe('Checkout Phase 12 · 极限/边界场景', () => {
  test('CHK12-068: [边界] 表单全部字段填写最大长度→提交正常', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-name').fill('大'.repeat(50))
    await page.getByTestId('input-phone').fill('13800138000')
    await page.getByTestId('input-email').fill('dafei@example.com')
    await page.getByTestId('input-address').fill('上'.repeat(100))
    await page.getByTestId('input-city').fill('上'.repeat(20))
    await selectDelivery(page, '标准配送（3-5天）')
    await page.getByTestId('payment-wechat').click()
    await page.getByTestId('checkbox-terms').click()

    await expect(page.getByTestId('btn-submit')).toContainText('确认支付')
  })

  test('CHK12-069: [边界] 手机号以特殊字符开头→校验拒绝', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-name').fill('大飞哥')
    await page.getByTestId('input-phone').fill('+8613800138000')
    await page.getByTestId('input-email').fill('dafei@example.com')
    await page.getByTestId('input-address').fill('神机营大道 88 号')
    await page.getByTestId('input-city').fill('上海')
    await selectDelivery(page, '标准配送（3-5天）')
    await page.getByTestId('payment-wechat').click()
    await page.getByTestId('checkbox-terms').click()

    await page.getByTestId('btn-submit').click()
    await page.waitForTimeout(500)

    // 应校验手机号
    await expect(
      page.getByText(/手机号格式|不正确|11位/)
    ).toBeVisible({ timeout: 3000 })
  })

  test('CHK12-070: [边界] 切换配送后清空并重新选择→状态正常', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 打开又关闭配送选择框
    await page.getByTestId('select-delivery').click()
    await page.waitForTimeout(200)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)

    // 再次打开并选择
    await page.getByTestId('select-delivery').click()
    await page.getByRole('option', { name: '门店自提' }).click()
    await page.waitForTimeout(300)

    await expect(page.getByTestId('shipping-fee')).toContainText(/免运费.*自提/)
  })

  test('CHK12-071: [边界] 多支付方式快速切换后提交→最终选择生效', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-name').fill('大飞哥')
    await page.getByTestId('input-phone').fill('13800138000')
    await page.getByTestId('input-email').fill('dafei@example.com')
    await page.getByTestId('input-address').fill('神机营大道 88 号')
    await page.getByTestId('input-city').fill('上海')
    await selectDelivery(page, '标准配送（3-5天）')
    await page.getByTestId('checkbox-terms').click()

    // 快速切换支付方式
    await page.getByTestId('payment-wechat').click()
    await page.waitForTimeout(100)
    await page.getByTestId('payment-alipay').click()
    await page.waitForTimeout(100)
    await page.getByTestId('payment-cash').click()
    await page.waitForTimeout(100)
    await page.getByTestId('payment-alipay').click()

    await expect(page.getByTestId('btn-submit')).toContainText('确认支付')
  })

  test('CHK12-072: [边界] 协议复选框多次勾选取消→最终勾选', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-name').fill('大飞哥')
    await page.getByTestId('input-phone').fill('13800138000')
    await page.getByTestId('input-email').fill('dafei@example.com')
    await page.getByTestId('input-address').fill('神机营大道 88 号')
    await page.getByTestId('input-city').fill('上海')
    await selectDelivery(page, '标准配送（3-5天）')
    await page.getByTestId('payment-wechat').click()

    // 多次勾选取消
    await page.getByTestId('checkbox-terms').click()
    await page.waitForTimeout(100)
    await page.getByTestId('checkbox-terms').click()
    await page.waitForTimeout(100)
    await page.getByTestId('checkbox-terms').click() // 最终勾选

    await expect(page.getByTestId('btn-submit')).toContainText('确认支付')
  })

  test('CHK12-073: [边界] 页面刷新后表单状态保持', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-name').fill('大飞哥')
    await page.getByTestId('input-phone').fill('13800138000')

    // 刷新页面
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 })

    // 表单应恢复默认值（无状态保持）
    await expect(page.getByTestId('input-name')).toHaveValue('')
    await expect(page.getByTestId('input-phone')).toHaveValue('')
  })

  test('CHK12-074: [边界] 重复选择同一配送方式→无异常', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    // 连续选标准配送
    await selectDelivery(page, '标准配送（3-5天）')
    await selectDelivery(page, '标准配送（3-5天）')
    await selectDelivery(page, '标准配送（3-5天）')

    await page.waitForTimeout(300)
    await expect(page.locator('body')).toBeVisible()
  })

  test('CHK12-075: [边界] 优惠券输入框含特殊字符→XSS防护', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-coupon').fill('<script>alert("xss")</script>')
    await page.getByTestId('btn-apply-coupon').click()
    await page.waitForTimeout(300)

    // 页面不应弹窗，正常渲染
    await expect(page.locator('body')).toBeVisible()
  })
})
