import { test, expect } from '@playwright/test'

test.describe('PLAN-REV-B1 · POS/Pad 最小收银链', () => {
  test('前台收银员完成选品 -> 会员识别 -> 微信支付成功', async ({ page }) => {
    await page.goto('/cashier', { waitUntil: 'networkidle', timeout: 30000 })

    await expect(page.getByRole('heading', { name: /商品选择/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: /已选清单/ })).toBeVisible()

    await page.getByLabel('搜索商品').fill('射击')
    await expect(page.getByText('射击体验', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: '+ 加入购物车' }).first().click()
    await expect(page.getByText(/已添加「射击体验」到已选清单/)).toBeVisible()
    await expect(page.getByText('1 件')).toBeVisible()
    await expect(page.getByText('应付')).toBeVisible()
    await expect(page.getByRole('button', { name: /结算 ¥30\.00/ })).toBeVisible()

    await page.getByLabel('会员手机号').fill('13800138001')
    await page.getByRole('button', { name: '查询' }).click()
    await expect(
      page.getByText('✅ 欢迎 张三！🏅 黄金会员，积分 2560 分')
    ).toBeVisible()
    await expect(page.getByText(/金卡会员享9折优惠/)).toBeVisible()
    await expect(page.getByRole('button', { name: /结算 ¥27\.00/ })).toBeVisible()

    await page.getByRole('button', { name: '微信扫码' }).click()
    await expect(page.getByText('请使用微信扫码支付')).toBeVisible()
    await expect(page.getByText('[二维码]')).toBeVisible()

    await page.getByRole('button', { name: /结算 ¥27\.00/ }).click()
    await expect(page.getByText(/支付成功！金额 ¥27\.00，方式：微信扫码/)).toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByRole('button', { name: '✅ 支付成功' })).toBeVisible()
    await expect(page.getByRole('button', { name: '🔄 新订单' })).toBeVisible()
    await page.screenshot({
      path: 'playwright-report/b1-cashier-minimal-success.png',
      fullPage: true,
    })
  })
})
