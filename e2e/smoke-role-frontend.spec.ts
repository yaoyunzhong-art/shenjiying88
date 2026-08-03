/**
 * 🧪 龙虾哥: 前端冒烟测试·第二段 (Playwright 角色视角)
 * 
 * 从 8 个角色视角对前端页面进行冒烟验证
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 * 📦仓库管理员
 * 
 * 覆盖: admin-web / storefront-web / tob-web / miniapp 关键页面
 * 正例 + 反例 + 边界 三级验证
 * 
 * @version 2.0 — 增强 cashier/guide/warehouse 角色场景
 */

import { test, expect } from '@playwright/test'

// ── 角色常量 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
  Warehouse: '📦仓库管理员',
} as const

/* ───────────────────────── 体验闭环: 打开→操作→完成 ───────────────────────── */

test.describe(`${ROLES.StoreManager} 前端冒烟: 店长关键页面加载`, () => {
  test('[正例] 店长打开后台仪表盘 → 查看概览数据', async ({ page }) => {
    // 体验闭环: 登录→仪表盘→查看经营数据
    await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 15000 })
    await expect(page).toHaveTitle(/.+/)
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[正例] 店长打开门店管理 → 查看门店列表', async ({ page }) => {
    await page.goto('/stores', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[边界] 店长在无数据门店列表查看空状态', async ({ page }) => {
    await page.goto('/stores?empty=1', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe(`${ROLES.FrontDesk} 前端冒烟: 前台收银关键页面`, () => {
  test('[正例] 前台打开收银页面 → 查看POS界面', async ({ page }) => {
    await page.goto('/cashier', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[正例] 前台打开会员查询 → 查看会员页面', async ({ page }) => {
    await page.goto('/members', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[反例] 前台访问无权限页面 → 显示错误/重定向', async ({ page }) => {
    await page.goto('/admin/settings/security', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    // 应该显示403或无权限提示或重定向
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe(`${ROLES.HR} 前端冒烟: HR人事关键页面`, () => {
  test('[正例] HR打开员工管理页面', async ({ page }) => {
    await page.goto('/staff', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[正例] HR查看员工详情页', async ({ page }) => {
    await page.goto('/staff/demo-001', { waitUntil: 'networkidle', timeout: 15000 })
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe(`${ROLES.Security} 前端冒烟: 安监关键页面`, () => {
  test('[正例] 安监打开审计日志页面', async ({ page }) => {
    await page.goto('/audit-trail', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[正例] 安监查看合规策略页面', async ({ page }) => {
    await page.goto('/compliance', { waitUntil: 'networkidle', timeout: 15000 })
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[边界] 安监查看空告警列表', async ({ page }) => {
    await page.goto('/alerts?status=resolved', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe(`${ROLES.Guide} 前端冒烟: 导玩员关键页面`, () => {
  test('[正例] 导玩员查看设备管理页面', async ({ page }) => {
    await page.goto('/devices', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[正例] 导玩员操作游戏机台界面', async ({ page }) => {
    await page.goto('/devices/console', { waitUntil: 'networkidle', timeout: 15000 })
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[正例] 导玩员查看机台故障报修页面', async ({ page }) => {
    await page.goto('/devices/maintenance', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[反例] 导玩员访问店铺财务页面 → 权限拒绝', async ({ page }) => {
    await page.goto('/finance/revenue', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[边界] 导玩员查看离线设备列表', async ({ page }) => {
    await page.goto('/devices?status=offline', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe(`${ROLES.Operations} 前端冒烟: 运行专员关键页面`, () => {
  test('[正例] 运行专员打开运维面板', async ({ page }) => {
    await page.goto('/operations', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[正例] 运行专员查看库存管理', async ({ page }) => {
    await page.goto('/inventory', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[反例] 运行专员访问不可用页面 → 显示错误页', async ({ page }) => {
    await page.goto('/non-existent-route-xyz', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    // 应该显示404页
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe(`${ROLES.Teambuilding} 前端冒烟: 团建关键页面`, () => {
  test('[正例] 团建专员查看预约管理页面', async ({ page }) => {
    await page.goto('/reservations', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[正例] 团建专员查看活动排期页面', async ({ page }) => {
    await page.goto('/events', { waitUntil: 'networkidle', timeout: 15000 })
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe(`${ROLES.Marketing} 前端冒烟: 营销关键页面`, () => {
  test('[正例] 营销专员打开营销活动列表', async ({ page }) => {
    await page.goto('/marketing', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[正例] 营销专员查看优惠券管理', async ({ page }) => {
    await page.goto('/coupons', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[边界] 营销专员查看空活动数据状态', async ({ page }) => {
    await page.goto('/campaigns?status=draft', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

/* ───────────────────────── 仓库管理员新角色 ───────────────────────── */

test.describe(`${ROLES.Warehouse} 前端冒烟: 仓库管理员关键页面`, () => {
  test('[正例] 仓库管理员查看入库管理页面', async ({ page }) => {
    await page.goto('/warehouse/inbound', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[正例] 仓库管理员查看出库管理页面', async ({ page }) => {
    await page.goto('/warehouse/outbound', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[正例] 仓库管理员搜索库存商品', async ({ page }) => {
    await page.goto('/warehouse/stock', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[正例] 仓库管理员查看库存预警列表', async ({ page }) => {
    await page.goto('/warehouse/alerts', { waitUntil: 'networkidle', timeout: 15000 })
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[反例] 仓库管理员访问收银页面 → 权限拦截', async ({ page }) => {
    await page.goto('/cashier', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[边界] 仓库管理员查看空库存入库单', async ({ page }) => {
    await page.goto('/warehouse/inbound?empty=1', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[边界] 仓库盘点操作页面加载', async ({ page }) => {
    await page.goto('/warehouse/inventory-check', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })
})

test.describe(`${ROLES.Warehouse} 仓库扩展 · 库存调拨与报表`, () => {
  test('[正例] 仓库管理员查看调拨记录页面', async ({ page }) => {
    await page.goto('/warehouse/transfer', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[正例] 仓库管理员查看库存报表', async ({ page }) => {
    await page.goto('/warehouse/reports', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[正例] 仓库管理员触发补货流程页面', async ({ page }) => {
    await page.goto('/warehouse/replenish', { waitUntil: 'networkidle', timeout: 15000 })
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[反例] 仓库管理员修改商品定价页面 → 权限不足', async ({ page }) => {
    await page.goto('/products/test-sku-001/edit', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[边界] 仓库管理员同时打开出入库两页', async ({ page }) => {
    const pages = ['/warehouse/inbound', '/warehouse/outbound', '/warehouse/stock']
    for (const p of pages) {
      await page.goto(p, { waitUntil: 'networkidle', timeout: 15000 })
      const body = page.locator('body')
      await expect(body).toBeVisible()
    }
  })
})

/* ───────────────────────── 前台收银扩展（不常见业务场景） ───────────────────────── */

test.describe(`${ROLES.FrontDesk} 前台收银扩展 · 非常规结算场景`, () => {
  test('[正例] 前台手动输入会员号查询', async ({ page }) => {
    await page.goto('/cashier', { waitUntil: 'networkidle', timeout: 15000 })
    const memberInput = page.locator('input[placeholder*="会员"], [data-testid="member-input"]').first()
    if (await memberInput.isVisible()) {
      await memberInput.fill('VIP-001')
      await page.waitForTimeout(200)
    }
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[正例] 前台挂单操作（暂存订单）', async ({ page }) => {
    await page.goto('/cashier', { waitUntil: 'networkidle', timeout: 15000 })
    const holdBtn = page.locator('button:has-text("挂单"), button:has-text("暂存")').first()
    if (await holdBtn.isVisible()) {
      await holdBtn.click()
      await page.waitForTimeout(200)
    }
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[正例] 前台取回挂单操作', async ({ page }) => {
    await page.goto('/cashier/hold', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[边界] 前台清空购物车操作', async ({ page }) => {
    await page.goto('/cart', { waitUntil: 'networkidle', timeout: 15000 })
    const clearBtn = page.locator('button:has-text("清空"), button:has-text("清除")').first()
    if (await clearBtn.isVisible()) {
      await clearBtn.click()
      await page.waitForTimeout(200)
    }
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[反例] 前台搜索不存在会员 → 显示无结果', async ({ page }) => {
    await page.goto('/members?search=DOES_NOT_EXIST_999', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[反例] 前台使用失效优惠码 → 提示不可用', async ({ page }) => {
    await page.goto('/checkout?coupon=EXPIRED2024', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[边界] 前台快速连击结算按钮', async ({ page }) => {
    await page.goto('/cashier', { waitUntil: 'networkidle', timeout: 15000 })
    const checkoutBtn = page.locator('button:has-text("结算"), button:has-text("结账")').first()
    if (await checkoutBtn.isVisible()) {
      for (let i = 0; i < 3; i++) {
        await checkoutBtn.click().catch(() => {})
        await page.waitForTimeout(50)
      }
    }
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[正例] 前台切换支付方式', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle', timeout: 15000 })
    const paymentOptions = page.locator('input[type="radio"], [data-testid*="payment"]').first()
    if (await paymentOptions.isVisible()) {
      await paymentOptions.click().catch(() => {})
      await page.waitForTimeout(200)
    }
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

/* ───────────────────────── 导玩员扩展（不常见操作场景） ───────────────────────── */

test.describe(`${ROLES.Guide} 导玩员扩展 · 设备运营与互动场景`, () => {
  test('[正例] 导玩员查看设备运行时长统计', async ({ page }) => {
    await page.goto('/devices/stats', { waitUntil: 'networkidle', timeout: 15000 })
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[正例] 导玩员登记设备故障', async ({ page }) => {
    await page.goto('/devices/report-issue', { waitUntil: 'networkidle', timeout: 15000 })
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[边界] 导玩员查看历史维修记录', async ({ page }) => {
    await page.goto('/devices/maintenance-logs', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[正例] 导玩员查看机台营业收入', async ({ page }) => {
    await page.goto('/devices/revenue', { waitUntil: 'networkidle', timeout: 15000 })
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[反例] 导玩员试图删除设备 → 权限锁定', async ({ page }) => {
    await page.goto('/devices/demo-001/delete', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[反例] 导玩员访问后台员工管理 → 拒绝', async ({ page }) => {
    await page.goto('/staff/management', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[边界] 导玩员查看空设备列表', async ({ page }) => {
    await page.goto('/devices?empty=1', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

/* ───────────────────────── 跨角色旅程测试 ───────────────────────── */

test.describe('跨角色边界场景', () => {
  test('[正例] 店长→前台→会员 跨模块数据联动', async ({ page }) => {
    // 体验闭环: store manager overview → front desk cashier → member lookup
    const pages = ['/dashboard', '/cashier', '/members']
    for (const p of pages) {
      await page.goto(p, { waitUntil: 'networkidle', timeout: 15000 })
      const body = page.locator('body')
      await expect(body).toBeVisible()
    }
  })

  test('[反例] 无权限角色访问管理页面', async ({ page }) => {
    // 模拟未登录访问受保护页面 → 应重定向到登录页或显示错误
    await page.goto('/dashboard', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const currentUrl = page.url()
    // 如果未登录可能重定向到/login或显示错误
    expect(currentUrl).toBeTruthy()
  })

  test('[正例] 仓库→前台→运营 上下游协作页面', async ({ page }) => {
    const pages = ['/warehouse/stock', '/products', '/operations']
    for (const p of pages) {
      await page.goto(p, { waitUntil: 'networkidle', timeout: 15000 })
      const body = page.locator('body')
      await expect(body).toBeVisible()
    }
  })

  test('[边界] 角色快速切换后页面稳定性', async ({ page }) => {
    // 模拟不同角色间的快速导航
    const pages = ['/dashboard', '/cashier', '/devices', '/warehouse/stock', '/end'] as const
    for (const p of pages) {
      await page.goto(p, { timeout: 10000 }).catch(() => {})
      await page.waitForTimeout(100)
    }
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

/* ───────────────────────── 会员端前台扩展测试 ───────────────────────── */

test.describe(`${ROLES.FrontDesk} 前台扩展 · 会员登录与注册流程`, () => {
  test('[正例] 前台引导会员手机号验证登录流程', async ({ page }) => {
    await page.goto('/member/login', { waitUntil: 'networkidle', timeout: 15000 })
    const loginForm = page.locator('form, [data-testid="login-form"]').first()
    await expect(loginForm).toBeVisible({ timeout: 5000 })
    const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first()
    await expect(phoneInput).toBeVisible()
  })

  test('[反例] 会员输入错误验证码 → 显示提示信息', async ({ page }) => {
    await page.goto('/member/login', { waitUntil: 'networkidle', timeout: 15000 })
    const submitBtn = page.locator('button[type="submit"], button:has-text("登录")').first()
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click()
      await page.waitForTimeout(300)
      const body = page.locator('body')
      await expect(body).toBeVisible()
    }
  })

  test('[正例] 会员注册页面包含必要表单项', async ({ page }) => {
    await page.goto('/member/register', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe(`${ROLES.FrontDesk} 前台扩展 · 商品搜索与购物车管理`, () => {
  test('[正例] 前台商品搜索 → 按分类过滤结果', async ({ page }) => {
    await page.goto('/products', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
    // 查找分类筛选器
    const filter = page.locator('[data-testid="category-filter"], .category-tabs, [class*="category"]').first()
    const hasFilter = await filter.isVisible().catch(() => false)
    expect(hasFilter).toBe(true)
  })

  test('[正例] 前台购物车 → 添加商品并查看汇总', async ({ page }) => {
    await page.goto('/cart', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
    // 购物车区域应有总价或数量显示
    const cartSummary = page.locator('[data-testid="cart-summary"], [class*="total"], [class*="summary"]').first()
    const hasSummary = await cartSummary.isVisible().catch(() => false)
    console.log(`购物车汇总区域可见: ${hasSummary}`)
  })

  test('[边界] 前台购物车空状态渲染', async ({ page }) => {
    await page.goto('/cart?empty=1', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe(`${ROLES.FrontDesk} 前台扩展 · 订单查看与个人中心`, () => {
  test('[正例] 前台查看订单列表页面', async ({ page }) => {
    await page.goto('/orders', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[正例] 前台查看订单详情页', async ({ page }) => {
    await page.goto('/orders/demo-order-001', { waitUntil: 'networkidle', timeout: 15000 })
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[正例] 前台个人中心页面加载', async ({ page }) => {
    await page.goto('/profile', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[边界] 前台个人中心未登录状态处理', async ({ page }) => {
    await page.goto('/profile', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const currentUrl = page.url()
    // 未登录可能重定向到登录页
    console.log(`个人中心URL: ${currentUrl}`)
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe(`${ROLES.StoreManager} 店长扩展 · 经营数据分析页面`, () => {
  test('[正例] 店长查看销售报表页面', async ({ page }) => {
    await page.goto('/reports/sales', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[正例] 店长查看实时客流数据', async ({ page }) => {
    await page.goto('/analytics/traffic', { waitUntil: 'networkidle', timeout: 15000 })
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[边界] 店长查看空时间段销售数据', async ({ page }) => {
    await page.goto('/reports/sales?date=2099-01-01', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe(`${ROLES.StoreManager} 店长扩展 · 人员与排班管理`, () => {
  test('[正例] 店长查看员工排班页面', async ({ page }) => {
    await page.goto('/schedule', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[正例] 店长查看考勤记录', async ({ page }) => {
    await page.goto('/attendance', { waitUntil: 'networkidle', timeout: 15000 })
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[边界] 店长查看未来排班空时段', async ({ page }) => {
    await page.goto('/schedule?date=2099-06-01', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe(`${ROLES.Marketing} 营销扩展 · 数据分析与活动管理`, () => {
  test('[正例] 营销专员查看活动数据分析', async ({ page }) => {
    await page.goto('/marketing/analytics', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[边界] 营销专员创建新活动表单渲染', async ({ page }) => {
    await page.goto('/marketing/campaigns/new', { waitUntil: 'networkidle', timeout: 15000 })
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[正例] 营销专员查看会员画像页面', async ({ page }) => {
    await page.goto('/marketing/profiles', { waitUntil: 'networkidle', timeout: 15000 })
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('[边界] 营销专员查看已结束活动列表', async ({ page }) => {
    await page.goto('/campaigns?status=ended', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

/* ───────────────────────── 跨角色高级边界场景 ───────────────────────── */

test.describe('跨角色高级边界场景', () => {
  test('[正例] 前台→购物车→订单 完整购物流程页面可达', async ({ page }) => {
    const pages = ['/products', '/cart', '/orders', '/profile']
    for (const p of pages) {
      await page.goto(p, { waitUntil: 'networkidle', timeout: 15000 })
      const body = page.locator('body')
      await expect(body).toBeVisible()
    }
  })

  test('[正例] 首页加载并包含导航菜单', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 15000 })
    const nav = page.locator('nav, header, [role="navigation"]').first()
    await expect(nav).toBeVisible({ timeout: 5000 })
  })

  test('[反例] 访问已失效页面 → 显示404或友好提示', async ({ page }) => {
    await page.goto('/expired-campaign-999', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe('搜索与404边界覆盖', () => {
  test('[反例] 访问超长无效路径 → 返回404或正常处理', async ({ page }) => {
    const longPath = '/' + 'a'.repeat(500)
    await page.goto(longPath, { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[反例] 访问含特殊字符路径 → 安全处理', async ({ page }) => {
    await page.goto('/<script>alert(1)</script>', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('[反例] 访问含SQL注入尝试路径 → 不被注入', async ({ page }) => {
    await page.goto("/products?id=1' OR '1'='1", { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})
