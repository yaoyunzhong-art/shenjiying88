import { expect, test, type Page } from '@playwright/test'

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

test.describe('PLAN-REV-C1 · checkout 金额链 L3', () => {
  test('配送与优惠券切换时金额链保持准确', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByRole('heading', { name: '收银台' })).toBeVisible()
    await expect(page.getByTestId('btn-submit')).toBeVisible()

    await expectAmount(page, 'subtotal-amount', '¥675.00')
    await expectAmount(page, 'shipping-fee', '免运费')
    await expectAmount(page, 'total-amount', '¥675.00')

    await selectDelivery(page, '加急配送（1-2天）')
    await expectAmount(page, 'shipping-fee', '¥10.00')
    await expectAmount(page, 'total-amount', '¥685.00')

    await selectDelivery(page, '门店自提')
    await expectAmount(page, 'shipping-fee', '免运费（自提）')
    await expectAmount(page, 'total-amount', '¥675.00')

    await page.getByTestId('input-coupon-input').fill('invalid')
    await page.getByTestId('btn-apply-coupon').click()
    await expect(page.getByTestId('coupon-status')).toHaveText(/无效的优惠券码/)
    await expectAmount(page, 'total-amount', '¥675.00')

    await page.getByTestId('input-coupon-input').fill('WELCOME10')
    await page.getByTestId('btn-apply-coupon').click()
    await expect(page.getByTestId('coupon-status')).toHaveText(/新客首单立减 -¥10/)
    await expectAmount(page, 'coupon-discount', '-¥10.00')
    await expectAmount(page, 'total-amount', '¥665.00')
  })

  test('提交订单时成功文案与应付金额一致', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 30000 })

    await page.getByTestId('input-coupon-input').fill('WELCOME10')
    await page.getByTestId('btn-apply-coupon').click()
    await expectAmount(page, 'total-amount', '¥665.00')

    await fillCheckoutForm(page)
    await expect(page.getByTestId('btn-submit')).toHaveText('确认支付 ¥665.00')
    await page.getByTestId('btn-submit').click()

    await expect(page.getByText(/订单已提交成功！订单金额 ¥665\.00，支付方式：微信支付/)).toBeVisible({
      timeout: 5000,
    })
    await page.screenshot({
      path: 'playwright-report/c1-checkout-amount-success.png',
      fullPage: true,
    })
  })
})
