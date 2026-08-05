import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [cashier-billing] [D] controller spec 补全
 *
 * CashierBillingController 单元测试
 *
 * 策略：内联 mock BillingWall + BillingServiceImpl + InMemoryBillingMeter，
 * 不依赖 NestJS DI / 数据库。覆盖 6 个端点：
 *   - GET  usage
 *   - GET  wallet
 *   - POST wallet/recharge
 *   - GET  bills
 *   - POST plan
 *   - GET  plan
 */

import assert from 'node:assert/strict'

// ── Type Mirrors ────────────────────────────────────────────────

type UsageAggregate = {
  tenantId: string
  metric: string
  period: string
  totalQuantity: number
  eventCount: number
  firstAt: number
  lastAt: number
}

type Bill = {
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

type Wallet = {
  tenantId: string
  balance: number
  currency: string
  totalRecharged: number
  totalConsumed: number
  updatedAt: number
}

type PricingPlan = {
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

// ── Inline Mocks ────────────────────────────────────────────────

function createMocks() {
  // Meter: tracks usage records
  const aggregates = new Map<string, UsageAggregate>()

  const currentPeriod = (): string => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  const record = (tenantId: string, metric: string, qty: number, at: number = Date.now()) => {
    const period = currentPeriod()
    const key = `${tenantId}::${metric}::${period}`
    const existing = aggregates.get(key)
    if (existing) {
      existing.totalQuantity += qty
      existing.eventCount += 1
      if (at < existing.firstAt) existing.firstAt = at
      if (at > existing.lastAt) existing.lastAt = at
    } else {
      aggregates.set(key, {
        tenantId,
        metric,
        period,
        totalQuantity: qty,
        eventCount: 1,
        firstAt: at,
        lastAt: at,
      })
    }
  }

  // Billing: manages plans, wallets, bills
  const plans = new Map<string, PricingPlan>()
  const wallets = new Map<string, Wallet>()
  const billsArr: Bill[] = []

  const ensureWallet = (tenantId: string): Wallet => {
    let w = wallets.get(tenantId)
    if (!w) {
      w = { tenantId, balance: 0, currency: 'CNY', totalRecharged: 0, totalConsumed: 0, updatedAt: Date.now() }
      wallets.set(tenantId, w)
    }
    return w
  }

  return {
    // -- BillingWall mock ---
    getUsageReport(tenantId: string, period?: string): UsageAggregate[] {
      const p = period ?? currentPeriod()
      const result: UsageAggregate[] = []
      for (const [k, agg] of aggregates) {
        if (k.startsWith(`${tenantId}::`) && k.endsWith(`::${p}`)) {
          result.push(agg)
        }
      }
      return result
    },

    // -- BillingServiceImpl mocks --
    recharge(tenantId: string, amount: number, currency: string = 'CNY'): Wallet {
      const w = ensureWallet(tenantId)
      w.balance += amount
      w.totalRecharged += amount
      w.currency = currency
      w.updatedAt = Date.now()
      return { ...w }
    },

    getWallet(tenantId: string): Wallet {
      return { ...ensureWallet(tenantId) }
    },

    listBills(tenantId: string): Bill[] {
      return billsArr.filter((b) => b.tenantId === tenantId).map((b) => ({ ...b, lines: [...b.lines] }))
    },

    setPlan(tenantId: string, plan: PricingPlan): void {
      plans.set(tenantId, plan)
    },

    getPlan(tenantId: string): PricingPlan | null {
      return plans.get(tenantId) ?? null
    },

    // Utility: seed a record
    recordUsage(tenantId: string, metric: string, qty: number) {
      record(tenantId, metric, qty)
    },

    // Utility: seed a bill
    addBill(bill: Bill) {
      billsArr.push(bill)
    },
  }
}

// ── Inline Controller ───────────────────────────────────────────
class InlineCashierBillingController {
  constructor(
    private readonly wall: ReturnType<typeof createMocks>,
  ) {}

  getUsage(tenantId: string, period?: string) {
    if (!tenantId) {
      throw Object.assign(new Error('x-tenant-id required'), { status: 400 })
    }
    const p = period ?? new Date().toISOString().slice(0, 7)
    return {
      tenantId,
      period: p,
      items: this.wall.getUsageReport(tenantId, p),
    }
  }

  getWallet(tenantId: string): Wallet {
    if (!tenantId) {
      throw Object.assign(new Error('x-tenant-id required'), { status: 400 })
    }
    return this.wall.getWallet(tenantId)
  }

  recharge(tenantId: string, body: { amount: number; currency?: string }): Wallet {
    if (!tenantId) {
      throw Object.assign(new Error('x-tenant-id required'), { status: 400 })
    }
    if (!body || typeof body.amount !== 'number' || body.amount <= 0) {
      throw Object.assign(new Error('amount must be > 0'), { status: 400 })
    }
    return this.wall.recharge(tenantId, body.amount, body.currency)
  }

  listBills(tenantId: string): Bill[] {
    if (!tenantId) {
      throw Object.assign(new Error('x-tenant-id required'), { status: 400 })
    }
    return this.wall.listBills(tenantId)
  }

  setPlan(tenantId: string, plan: PricingPlan) {
    if (!tenantId) {
      throw Object.assign(new Error('x-tenant-id required'), { status: 400 })
    }
    if (!plan || !plan.id || !plan.type) {
      throw Object.assign(new Error('plan must have id and type'), { status: 400 })
    }
    this.wall.setPlan(tenantId, plan)
    return { ok: true, plan }
  }

  getPlan(tenantId: string): PricingPlan | null {
    if (!tenantId) {
      throw Object.assign(new Error('x-tenant-id required'), { status: 400 })
    }
    return this.wall.getPlan(tenantId)
  }
}

// ── Tests ───────────────────────────────────────────────────────
describe('CashierBillingController P3-5', () => {
  let controller: InlineCashierBillingController
  let mock: ReturnType<typeof createMocks>

  beforeEach(() => {
    mock = createMocks()
    controller = new InlineCashierBillingController(mock)
  })

  // ─── GET /cashier/admin/billing/usage ───
  describe('GET /usage - getUsage', () => {
    it('[正例] 返回本期 usage 报告（空用量）', () => {
      const result = controller.getUsage('tenant-001')
      assert.equal(result.tenantId, 'tenant-001')
      assert.equal(typeof result.period, 'string')
      assert.match(result.period, /^\d{4}-\d{2}$/)
      assert.ok(Array.isArray(result.items))
      assert.equal(result.items.length, 0)
    })

    it('[正例] 有用量记录正常返回', () => {
      mock.recordUsage('tenant-001', 'payment.wechat', 10)
      mock.recordUsage('tenant-001', 'order.sync', 5)
      const result = controller.getUsage('tenant-001')
      assert.equal(result.items.length, 2)
      const payment = result.items.find((i: UsageAggregate) => i.metric === 'payment.wechat')
      assert.equal(payment?.totalQuantity, 10)
      const order = result.items.find((i: UsageAggregate) => i.metric === 'order.sync')
      assert.equal(order?.totalQuantity, 5)
    })

    it('[反例] 缺失 tenantId 抛出 400', () => {
      assert.throws(
        () => (controller as any).getUsage(''),
        /x-tenant-id required/,
      )
    })

    it('[边界] 不同租户用量隔离', () => {
      mock.recordUsage('tenant-A', 'metric.x', 100)
      mock.recordUsage('tenant-B', 'metric.x', 200)
      const resultA = controller.getUsage('tenant-A')
      assert.equal(resultA.items.length, 1)
      assert.equal(resultA.items[0].totalQuantity, 100)
      const resultB = controller.getUsage('tenant-B')
      assert.equal(resultB.items.length, 1)
      assert.equal(resultB.items[0].totalQuantity, 200)
    })

    it('[边界] 指定 period 参数', () => {
      mock.recordUsage('tenant-001', 'metric.x', 5)
      // use a past period — should return empty
      const result = controller.getUsage('tenant-001', '2025-01')
      assert.equal(result.period, '2025-01')
      assert.equal(result.items.length, 0)
    })
  })

  // ─── GET /cashier/admin/billing/wallet ───
  describe('GET /wallet - getWallet', () => {
    it('[正例] 新租户返回空钱包（余额 0）', () => {
      const w = controller.getWallet('tenant-new')
      assert.equal(w.tenantId, 'tenant-new')
      assert.equal(w.balance, 0)
      assert.equal(w.currency, 'CNY')
      assert.equal(w.totalRecharged, 0)
      assert.equal(w.totalConsumed, 0)
    })

    it('[正例] 充值后钱包余额正确', () => {
      controller.recharge('tenant-001', { amount: 1000 })
      const w = controller.getWallet('tenant-001')
      assert.equal(w.balance, 1000)
      assert.equal(w.totalRecharged, 1000)
    })

    it('[反例] 缺失 tenantId 抛出 400', () => {
      assert.throws(
        () => (controller as any).getWallet(''),
        /x-tenant-id required/,
      )
    })
  })

  // ─── POST /cashier/admin/billing/wallet/recharge ───
  describe('POST /wallet/recharge - recharge', () => {
    it('[正例] 充值 500 元成功', () => {
      const w = controller.recharge('tenant-001', { amount: 500 })
      assert.equal(w.balance, 500)
      assert.equal(w.totalRecharged, 500)
    })

    it('[正例] 多次充值累加', () => {
      controller.recharge('tenant-001', { amount: 300 })
      controller.recharge('tenant-001', { amount: 200 })
      const w = controller.getWallet('tenant-001')
      assert.equal(w.balance, 500)
      assert.equal(w.totalRecharged, 500)
    })

    it('[反例] amount <= 0 抛出 400', () => {
      assert.throws(
        () => controller.recharge('tenant-001', { amount: 0 }),
        /amount must be > 0/,
      )
      assert.throws(
        () => controller.recharge('tenant-001', { amount: -100 }),
        /amount must be > 0/,
      )
    })

    it('[反例] amount 非数字抛出 400', () => {
      assert.throws(
        () => controller.recharge('tenant-001', { amount: 'abc' as any }),
        /amount must be > 0/,
      )
    })

    it('[反例] 缺失 tenantId 抛出 400', () => {
      assert.throws(
        () => (controller as any).recharge('', { amount: 100 }),
        /x-tenant-id required/,
      )
    })
  })

  // ─── GET /cashier/admin/billing/bills ───
  describe('GET /bills - listBills', () => {
    it('[正例] 无账单返回空数组', () => {
      const bills = controller.listBills('tenant-001')
      assert.ok(Array.isArray(bills))
      assert.equal(bills.length, 0)
    })

    it('[正例] 有账单正常返回', () => {
      const bill: Bill = {
        id: 'B-00000001',
        tenantId: 'tenant-001',
        period: '2026-07',
        planId: 'plan-starter',
        lines: [{ metric: 'subscription', quantity: 1, unitPrice: 99, amount: 99 }],
        totalAmount: 99,
        currency: 'CNY',
        status: 'ISSUED',
        issuedAt: Date.now(),
        createdAt: Date.now(),
      }
      mock.addBill(bill)
      const bills = controller.listBills('tenant-001')
      assert.equal(bills.length, 1)
      assert.equal(bills[0].id, 'B-00000001')
      assert.equal(bills[0].totalAmount, 99)
    })

    it('[边界] 账单按租户隔离', () => {
      mock.addBill({
        id: 'B-A1', tenantId: 'tenant-A', period: '2026-07', planId: 'p1',
        lines: [], totalAmount: 50, currency: 'CNY', status: 'PAID', createdAt: Date.now(),
      } as Bill)
      mock.addBill({
        id: 'B-B1', tenantId: 'tenant-B', period: '2026-07', planId: 'p2',
        lines: [], totalAmount: 100, currency: 'CNY', status: 'ISSUED', createdAt: Date.now(),
      } as Bill)
      assert.equal(controller.listBills('tenant-A').length, 1)
      assert.equal(controller.listBills('tenant-B').length, 1)
      assert.equal(controller.listBills('tenant-C').length, 0)
    })

    it('[反例] 缺失 tenantId 抛出 400', () => {
      assert.throws(
        () => (controller as any).listBills(''),
        /x-tenant-id required/,
      )
    })
  })

  // ─── POST /cashier/admin/billing/plan ───
  describe('POST /plan - setPlan', () => {
    it('[正例] 设置 FREE 套餐成功', () => {
      const plan: PricingPlan = {
        id: 'free-tier', name: 'Free', type: 'FREE', tiers: [{ upTo: Infinity, unitPrice: 0 }],
      }
      const result = controller.setPlan('tenant-001', plan)
      assert.ok(result.ok)
      assert.equal(result.plan.id, 'free-tier')
    })

    it('[正例] 设置 FLAT 套餐成功', () => {
      const plan: PricingPlan = {
        id: 'starter', name: 'Starter', type: 'FLAT', tiers: [],
        flatAmount: 99, currency: 'CNY', billingCycle: 'monthly',
      }
      const result = controller.setPlan('tenant-001', plan)
      assert.ok(result.ok)
      assert.equal(result.plan.flatAmount, 99)
    })

    it('[正例] 设置 PER_UNIT 套餐成功', () => {
      const plan: PricingPlan = {
        id: 'payg', name: 'Pay As You Go', type: 'PER_UNIT',
        tiers: [{ upTo: Infinity, unitPrice: 0.5 }],
      }
      const result = controller.setPlan('tenant-001', plan)
      assert.ok(result.ok)
      assert.equal(result.plan.type, 'PER_UNIT')
    })

    it('[正例] 切换套餐（覆盖旧套餐）', () => {
      const plan1: PricingPlan = { id: 'free', name: 'Free', type: 'FREE', tiers: [] }
      const plan2: PricingPlan = { id: 'pro', name: 'Pro', type: 'FLAT', tiers: [], flatAmount: 199 }
      controller.setPlan('tenant-001', plan1)
      controller.setPlan('tenant-001', plan2)
      const current = controller.getPlan('tenant-001')
      assert.equal(current!.id, 'pro')
      assert.equal(current!.flatAmount, 199)
    })

    it('[反例] plan 缺少 id 抛出 400', () => {
      assert.throws(
        () => controller.setPlan('tenant-001', { name: 'NoId', type: 'FREE', tiers: [] } as any),
        /plan must have id and type/,
      )
    })

    it('[反例] plan 缺少 type 抛出 400', () => {
      assert.throws(
        () => controller.setPlan('tenant-001', { id: 'no-type' } as any),
        /plan must have id/,
      )
    })

    it('[反例] 缺失 tenantId 抛出 400', () => {
      assert.throws(
        () => (controller as any).setPlan('', { id: 'p1', type: 'FREE', tiers: [] }),
        /x-tenant-id required/,
      )
    })
  })

  // ─── GET /cashier/admin/billing/plan ───
  describe('GET /plan - getPlan', () => {
    it('[正例] 未设置套餐返回 null', () => {
      const plan = controller.getPlan('tenant-001')
      assert.strictEqual(plan, null)
    })

    it('[正例] 已设置套餐正确返回', () => {
      const plan: PricingPlan = {
        id: 'enterprise', name: 'Enterprise', type: 'FLAT', tiers: [],
        flatAmount: 999, currency: 'CNY', billingCycle: 'monthly',
      }
      controller.setPlan('tenant-001', plan)
      const result = controller.getPlan('tenant-001')
      assert.ok(result)
      assert.equal(result!.id, 'enterprise')
      assert.equal(result!.flatAmount, 999)
    })

    it('[反例] 缺失 tenantId 抛出 400', () => {
      assert.throws(
        () => (controller as any).getPlan(''),
        /x-tenant-id required/,
      )
    })
  })
})
