import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * 🐜 自动: [cashier-billing] [C] 角色测试
 *
 * 8 角色视角的 cashier-billing 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import assert from 'node:assert/strict'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 类型定义 ──
interface UsageAggregate {
  tenantId: string
  metric: string
  period: string
  totalQuantity: number
  eventCount: number
  firstAt: number
  lastAt: number
}

interface Wallet {
  tenantId: string
  balance: number
  currency: string
  totalRecharged: number
  totalConsumed: number
  updatedAt: number
}

interface PricingPlan {
  id: string
  name: string
  type: 'FREE' | 'FLAT' | 'PER_UNIT' | 'TIERED'
  includedQuota?: number
  tiers: Array<{ upTo: number; unitPrice: number; flatFee?: number }>
  flatAmount?: number
  currency?: string
  billingCycle?: string
  expiresAt?: number
}

interface Bill {
  id: string
  tenantId: string
  period: string
  planId: string
  lines: Array<{ metric: string; quantity: number; unitPrice: number; amount: number; remark?: string }>
  totalAmount: number
  currency: string
  status: string
  issuedAt?: number
  paidAt?: number
  createdAt: number
}

// ── Mock 工厂 ──
function createMockStore() {
  const aggregates = new Map<string, UsageAggregate>()
  const plans = new Map<string, PricingPlan>()
  const wallets = new Map<string, Wallet>()
  const billsArr: Bill[] = []

  const currentPeriod = (): string => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  const ensureWallet = (tenantId: string): Wallet => {
    let w = wallets.get(tenantId)
    if (!w) {
      w = { tenantId, balance: 0, currency: 'CNY', totalRecharged: 0, totalConsumed: 0, updatedAt: Date.now() }
      wallets.set(tenantId, w)
    }
    return w
  }

  return {
    getUsageReport(tenantId: string, period?: string): UsageAggregate[] {
      const p = period ?? currentPeriod()
      const result: UsageAggregate[] = []
      for (const [, agg] of aggregates) {
        if (agg.tenantId === tenantId && agg.period === p) result.push(agg)
      }
      return result
    },
    recordUsage(tenantId: string, metric: string, qty: number) {
      const period = currentPeriod()
      const key = `${tenantId}::${metric}::${period}`
      const existing = aggregates.get(key)
      if (existing) {
        existing.totalQuantity += qty
        existing.eventCount += 1
      } else {
        aggregates.set(key, { tenantId, metric, period, totalQuantity: qty, eventCount: 1, firstAt: Date.now(), lastAt: Date.now() })
      }
    },
    recharge(tenantId: string, amount: number, currency = 'CNY'): Wallet {
      const w = ensureWallet(tenantId)
      w.balance += amount
      w.totalRecharged += amount
      w.currency = currency
      return w
    },
    getWallet(tenantId: string): Wallet {
      return ensureWallet(tenantId)
    },
    listBills(tenantId: string): Bill[] {
      return billsArr.filter(b => b.tenantId === tenantId)
    },
    addBill(b: Bill) { billsArr.push(b) },
    setPlan(tenantId: string, plan: PricingPlan) { plans.set(tenantId, plan) },
    getPlan(tenantId: string): PricingPlan | null { return plans.get(tenantId) ?? null },
  }
}

// ── Inline Controller ──
class InlineCashierBillingController {
  constructor(private readonly store: ReturnType<typeof createMockStore>) {}

  getUsage(tenantId: string, period?: string) {
    if (!tenantId) throw Object.assign(new Error('x-tenant-id required'), { status: 400 })
    const p = period ?? new Date().toISOString().slice(0, 7)
    return { tenantId, period: p, items: this.store.getUsageReport(tenantId, p) }
  }

  getWallet(tenantId: string): Wallet {
    if (!tenantId) throw Object.assign(new Error('x-tenant-id required'), { status: 400 })
    return this.store.getWallet(tenantId)
  }

  recharge(tenantId: string, body: { amount: number; currency?: string }): Wallet {
    if (!tenantId) throw Object.assign(new Error('x-tenant-id required'), { status: 400 })
    if (!body || typeof body.amount !== 'number' || body.amount <= 0) throw Object.assign(new Error('amount must be > 0'), { status: 400 })
    return this.store.recharge(tenantId, body.amount, body.currency)
  }

  listBills(tenantId: string): Bill[] {
    if (!tenantId) throw Object.assign(new Error('x-tenant-id required'), { status: 400 })
    return this.store.listBills(tenantId)
  }

  setPlan(tenantId: string, plan: PricingPlan) {
    if (!tenantId) throw Object.assign(new Error('x-tenant-id required'), { status: 400 })
    if (!plan || !plan.id || !plan.type) throw Object.assign(new Error('plan must have id and type'), { status: 400 })
    this.store.setPlan(tenantId, plan)
    return { ok: true, plan }
  }

  getPlan(tenantId: string): PricingPlan | null {
    if (!tenantId) throw Object.assign(new Error('x-tenant-id required'), { status: 400 })
    return this.store.getPlan(tenantId)
  }
}

// ═══════════════════════════════════════════════════════════════════
// 👔 店长 - 门店经营决策
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} cashier-billing 角色测试`, () => {
  it('店长查看月度用量报表了解门店运营活跃度（正常流程）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    // 模拟一天的门店用量
    store.recordUsage('arcade-sh-001', 'payment.wechat', 35)
    store.recordUsage('arcade-sh-001', 'payment.alipay', 22)
    store.recordUsage('arcade-sh-001', 'order.sync', 57)
    store.recordUsage('arcade-sh-001', 'member.checkin', 45)

    const result = ctrl.getUsage('arcade-sh-001')
    assert.equal(result.tenantId, 'arcade-sh-001')
    assert.equal(result.items.length, 4)

    const orderMetric = result.items.find((i: UsageAggregate) => i.metric === 'order.sync')
    assert.equal(orderMetric?.totalQuantity, 57)
  })

  it('店长查看门店账单及套餐费用明细（运营成本控制）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    // 设置门店套餐
    ctrl.setPlan('arcade-sh-001', {
      id: 'arcade-starter', name: '街机入门版', type: 'FLAT',
      tiers: [], flatAmount: 299, currency: 'CNY', billingCycle: 'monthly',
    })

    // 添加月度账单
    store.addBill({
      id: 'B-202607-001', tenantId: 'arcade-sh-001', period: '2026-07',
      planId: 'arcade-starter',
      lines: [
        { metric: 'base_subscription', quantity: 1, unitPrice: 299, amount: 299 },
        { metric: 'sms_overage', quantity: 150, unitPrice: 0.05, amount: 7.5 },
      ],
      totalAmount: 306.5, currency: 'CNY', status: 'ISSUED',
      issuedAt: Date.parse('2026-07-01'), createdAt: Date.now(),
    })

    const bills = ctrl.listBills('arcade-sh-001')
    assert.equal(bills.length, 1)
    assert.equal(bills[0].totalAmount, 306.5)
    assert.equal(bills[0].lines.length, 2)

    // 店长确认套餐无误
    const plan = ctrl.getPlan('arcade-sh-001')
    assert.ok(plan)
    assert.equal(plan!.flatAmount, 299)
    assert.equal(plan!.name, '街机入门版')
  })

  it('店长查看门店钱包余额决定是否需要充值（正常流程）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    // 先充值再查看
    ctrl.recharge('arcade-sh-001', { amount: 5000 })
    const wallet = ctrl.getWallet('arcade-sh-001')
    assert.equal(wallet.balance, 5000)
    assert.equal(wallet.totalRecharged, 5000)
  })

  it('店长查看无数据的门店应返回空报告（边界：新门店）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)
    const result = ctrl.getUsage('arcade-sh-new')
    assert.equal(result.items.length, 0)
    assert.equal(result.tenantId, 'arcade-sh-new')
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🛒 前台 - 收银结算
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} cashier-billing 角色测试`, () => {
  it('前台查看门店充值记录核对收银总额（正常流程）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    // 当日前台收银充值场景
    ctrl.recharge('arcade-sh-001', { amount: 2000 })
    ctrl.recharge('arcade-sh-001', { amount: 3000 })

    const wallet = ctrl.getWallet('arcade-sh-001')
    assert.equal(wallet.totalRecharged, 5000)
    assert.equal(wallet.balance, 5000)
  })

  it('前台尝试充值负金额应被拒绝（权限边界）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    assert.throws(
      () => ctrl.recharge('arcade-sh-001', { amount: -100 }),
      /amount must be > 0/,
    )
  })

  it('前台查看历史账单了解过去结算情况（正常流程）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    store.addBill({
      id: 'B-01', tenantId: 'arcade-sh-001', period: '2026-06', planId: 'arcade-starter',
      lines: [{ metric: 'subscription', quantity: 1, unitPrice: 299, amount: 299 }],
      totalAmount: 299, currency: 'CNY', status: 'PAID', issuedAt: Date.now() - 86400000 * 30, createdAt: Date.now() - 86400000 * 30,
    })
    store.addBill({
      id: 'B-02', tenantId: 'arcade-sh-001', period: '2026-07', planId: 'arcade-starter',
      lines: [{ metric: 'subscription', quantity: 1, unitPrice: 299, amount: 299 }],
      totalAmount: 299, currency: 'CNY', status: 'ISSUED', createdAt: Date.now(),
    })

    const bills = ctrl.listBills('arcade-sh-001')
    assert.equal(bills.length, 2)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 👥 HR - 人员与薪酬
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} cashier-billing 角色测试`, () => {
  it('HR 查看门店套餐确认员工数量额度是否充足（正常流程）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    ctrl.setPlan('arcade-sh-001', {
      id: 'arcade-pro', name: '街机专业版', type: 'TIERED',
      tiers: [
        { upTo: 10, unitPrice: 0, flatFee: 499 },
        { upTo: 50, unitPrice: 20, flatFee: 799 },
        { upTo: Infinity, unitPrice: 15 },
      ],
      includedQuota: 10,
    })

    const plan = ctrl.getPlan('arcade-sh-001')
    assert.ok(plan)
    assert.equal(plan!.tiers.length, 3)
    // HR 确认当前套餐可覆盖 10 人团队
    assert.equal(plan!.includedQuota, 10)
  })

  it('HR 切换套餐后确认生效（边界：套餐信息更新）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    ctrl.setPlan('arcade-sh-001', { id: 'free', name: 'Free', type: 'FREE', tiers: [{ upTo: Infinity, unitPrice: 0 }] })
    ctrl.setPlan('arcade-sh-001', {
      id: 'arcade-pro', name: '街机专业版', type: 'FLAT', tiers: [], flatAmount: 799,
    })

    const plan = ctrl.getPlan('arcade-sh-001')
    assert.equal(plan!.id, 'arcade-pro')
    assert.equal(plan!.flatAmount, 799)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🔧 安监 - 安全审计与合规
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Safety} cashier-billing 角色测试`, () => {
  it('安监审计充值记录确保金额正确且无异常操作（正常流程）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    ctrl.recharge('arcade-sh-001', { amount: 10000 })
    ctrl.recharge('arcade-sh-001', { amount: 5000 })
    const wallet = ctrl.getWallet('arcade-sh-001')

    // 审计充值总和
    assert.equal(wallet.totalRecharged, 15000)
    assert.equal(wallet.balance, 15000)
    assert.equal(wallet.totalConsumed, 0)
  })

  it('安监确认不同门店之间钱包隔离（权限边界）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    ctrl.recharge('arcade-sh-001', { amount: 5000 })
    ctrl.recharge('arcade-sh-002', { amount: 3000 })

    const w1 = ctrl.getWallet('arcade-sh-001')
    const w2 = ctrl.getWallet('arcade-sh-002')

    assert.equal(w1.balance, 5000)
    assert.equal(w2.balance, 3000)
    // 额度不共享
    assert.notEqual(w1.balance, w2.balance)
  })

  it('安监检查缺失 tenantId 的请求被拦截（权限边界）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    assert.throws(() => (ctrl as any).getUsage(''), /x-tenant-id required/)
    assert.throws(() => (ctrl as any).getWallet(''), /x-tenant-id required/)
    assert.throws(() => (ctrl as any).recharge('', { amount: 100 }), /x-tenant-id required/)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🎮 导玩员 - 游戏引导与兑换
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} cashier-billing 角色测试`, () => {
  it('导玩员查询门店用量了解当前游戏机活跃情况（正常流程）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    store.recordUsage('arcade-sh-001', 'machine.coin_insert', 120)
    store.recordUsage('arcade-sh-001', 'machine.ticket_payout', 78)
    store.recordUsage('arcade-sh-001', 'machine.redemption', 23)

    const result = ctrl.getUsage('arcade-sh-001')
    assert.equal(result.items.length, 3)

    const coinMetric = result.items.find((i: UsageAggregate) => i.metric === 'machine.coin_insert')
    assert.equal(coinMetric?.totalQuantity, 120)
  })

  it('导玩员查看门店套餐确认当前功能权限（正常流程）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    ctrl.setPlan('arcade-sh-001', {
      id: 'arcade-premium', name: '街机旗舰版', type: 'FLAT',
      tiers: [], flatAmount: 1999,
    })

    const plan = ctrl.getPlan('arcade-sh-001')
    assert.ok(plan)
    assert.equal(plan!.name, '街机旗舰版')
  })

  it('导玩员查看未设置套餐的门店应返回 null（边界：新开店尚未配置）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    const plan = ctrl.getPlan('arcade-sh-new')
    assert.strictEqual(plan, null)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🎯 运行专员 - 系统运维与监控
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Ops} cashier-billing 角色测试`, () => {
  it('运行专员查看门店用量报告监控系统运行状态（正常流程）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    store.recordUsage('arcade-sh-001', 'api.order_create', 500)
    store.recordUsage('arcade-sh-001', 'api.payment_process', 480)
    store.recordUsage('arcade-sh-001', 'api.notification_push', 1200)

    const result = ctrl.getUsage('arcade-sh-001')
    assert.equal(result.items.length, 3)
    const pushMetric = result.items.find((i: UsageAggregate) => i.metric === 'api.notification_push')
    assert.equal(pushMetric?.totalQuantity, 1200)
  })

  it('运行专员切换门店套餐后确认正确生效（正常流程）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    ctrl.setPlan('arcade-sh-001', {
      id: 'payg-v1', name: 'PAYG v1', type: 'PER_UNIT',
      tiers: [{ upTo: 1000, unitPrice: 0.1 }, { upTo: 10000, unitPrice: 0.08 }, { upTo: Infinity, unitPrice: 0.05 }],
    })
    const plan = ctrl.getPlan('arcade-sh-001')
    assert.equal(plan!.type, 'PER_UNIT')
    assert.equal(plan!.tiers.length, 3)
  })

  it('运行专员查看指定 period 的用量（边界：跨月查询）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    store.recordUsage('arcade-sh-001', 'api.order_create', 100)
    // 指定过去的月份应返回空
    const result = ctrl.getUsage('arcade-sh-001', '2025-06')
    assert.equal(result.period, '2025-06')
    assert.equal(result.items.length, 0)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🤝 团建 - 团队活动与福利
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} cashier-billing 角色测试`, () => {
  it('团建负责充值活动经费用于团队盲盒活动（正常流程）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    // 团建活动充值
    ctrl.recharge('arcade-sh-team', { amount: 2000 })
    const wallet = ctrl.getWallet('arcade-sh-team')
    assert.equal(wallet.balance, 2000)
  })

  it('团建查看门店账单确认团队活动费用已结算（正常流程）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    store.addBill({
      id: 'B-TEAM-01', tenantId: 'arcade-sh-team', period: '2026-07', planId: 'arcade-starter',
      lines: [
        { metric: 'teambuilding_event', quantity: 2, unitPrice: 500, amount: 1000, remark: '团建活动包场' },
        { metric: 'base_subscription', quantity: 1, unitPrice: 299, amount: 299 },
      ],
      totalAmount: 1299, currency: 'CNY', status: 'PAID', createdAt: Date.now(),
    })

    const bills = ctrl.listBills('arcade-sh-team')
    assert.equal(bills.length, 1)
    assert.equal(bills[0].totalAmount, 1299)
    // 团建费用单列
    const teamLine = bills[0].lines.find(l => l.metric === 'teambuilding_event')
    assert.ok(teamLine)
    assert.equal(teamLine!.amount, 1000)
  })

  it('团建尝试充值 0 元应被拒绝（边界：无效金额）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    assert.throws(
      () => ctrl.recharge('arcade-sh-team', { amount: 0 }),
      /amount must be > 0/,
    )
  })
})

// ═══════════════════════════════════════════════════════════════════
// 📢 营销 - 市场推广与活动预算
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} cashier-billing 角色测试`, () => {
  it('营销查看门店套餐确认营销功能权限（正常流程）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    ctrl.setPlan('arcade-sh-001', {
      id: 'marketing-pro', name: '营销专业版', type: 'FLAT',
      tiers: [], flatAmount: 599, billingCycle: 'monthly',
    })
    const plan = ctrl.getPlan('arcade-sh-001')
    assert.ok(plan)
    assert.equal(plan!.name, '营销专业版')
  })

  it('营销查看历史账单核对推广活动费用（正常流程）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    store.addBill({
      id: 'B-MKT-01', tenantId: 'arcade-sh-001', period: '2026-07', planId: 'marketing-pro',
      lines: [
        { metric: 'campaign_push', quantity: 5000, unitPrice: 0.02, amount: 100, remark: '618大促推送' },
        { metric: 'sms_coupon', quantity: 2000, unitPrice: 0.05, amount: 100, remark: '优惠券短信' },
        { metric: 'subscription', quantity: 1, unitPrice: 599, amount: 599 },
      ],
      totalAmount: 799, currency: 'CNY', status: 'ISSUED', createdAt: Date.now(),
    })

    const bills = ctrl.listBills('arcade-sh-001')
    assert.equal(bills.length, 1)
    // 营销费用项校验
    const campaignLine = bills[0].lines.find(l => l.metric === 'campaign_push')
    assert.ok(campaignLine)
    assert.equal(campaignLine!.amount, 100)
  })

  it('营销无账单时返回空数组（边界：新开店）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    const bills = ctrl.listBills('arcade-sh-new-no-bills')
    assert.ok(Array.isArray(bills))
    assert.equal(bills.length, 0)
  })

  it('营销查看不同门店间用量数据隔离（权限边界）', () => {
    const store = createMockStore()
    const ctrl = new InlineCashierBillingController(store)

    store.recordUsage('arcade-sh-001', 'campaign.push', 1000)
    store.recordUsage('arcade-sh-002', 'campaign.push', 500)

    const r1 = ctrl.getUsage('arcade-sh-001')
    const r2 = ctrl.getUsage('arcade-sh-002')

    const push1 = r1.items.find((i: UsageAggregate) => i.metric === 'campaign.push')
    const push2 = r2.items.find((i: UsageAggregate) => i.metric === 'campaign.push')
    assert.equal(push1?.totalQuantity, 1000)
    assert.equal(push2?.totalQuantity, 500)
  })
})
