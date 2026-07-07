import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import {
  InMemoryBillingMeter,
  DefaultPricingEngine,
  BillingServiceImpl
} from './billing.service'
import { BillingWall, BillingQuotaExceededError } from './billing-wall'
import type { PricingPlan } from './billing.port'

/**
 * P3-4 计费模块 6 子套件测试
 *
 *   1. InMemoryBillingMeter: record + aggregate + period
 *   2. DefaultPricingEngine: FREE / FLAT / PER_UNIT / TIERED
 *   3. BillingService: 钱包 (recharge / deduct) + 套餐管理
 *   4. BillingService: 出账 (settle)
 *   5. BillingWall: guard + recordUsage + batchGuard
 *   6. 集成: NO_PLAN / QUOTA_EXCEEDED / INSUFFICIENT_BALANCE 拒付
 */

// ──────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────

const buildStack = () => {
  const meter = new InMemoryBillingMeter()
  const engine = new DefaultPricingEngine()
  const billing = new BillingServiceImpl(meter, engine)
  const wall = new BillingWall(billing, meter)
  return { meter, engine, billing, wall }
}

const NOW = Date.UTC(2026, 6, 3, 12, 0, 0) // 2026-07-03

const PER_UNIT_PLAN: PricingPlan = {
  id: 'p-perunit',
  name: 'PAY AS YOU GO',
  type: 'PER_UNIT',
  includedQuota: 10,
  tiers: [{ upTo: 100_000, unitPrice: 0.5 }],
  currency: 'CNY',
  billingCycle: 'monthly',
  effectiveAt: 0
}

const TIERED_PLAN: PricingPlan = {
  id: 'p-tiered',
  name: 'VOLUME TIER',
  type: 'TIERED',
  includedQuota: 100,
  tiers: [
    { upTo: 500, unitPrice: 0.3 },
    { upTo: 5000, unitPrice: 0.2 },
    { upTo: 1_000_000, unitPrice: 0.1 }
  ],
  currency: 'CNY',
  billingCycle: 'monthly',
  effectiveAt: 0
}

const FLAT_PLAN: PricingPlan = {
  id: 'p-flat',
  name: 'PRO MONTHLY',
  type: 'FLAT',
  flatAmount: 99,
  tiers: [],
  currency: 'CNY',
  billingCycle: 'monthly',
  effectiveAt: 0
}

// ═══════════════════════════════════════════════════════════════
// 1. InMemoryBillingMeter
// ═══════════════════════════════════════════════════════════════

describe('InMemoryBillingMeter · 计量器', () => {
  it('1.1 record 单条: 累计 + 事件数 + 时间范围', () => {
    const m = new InMemoryBillingMeter()
    m.record({ tenantId: 't1', metric: 'wechat', quantity: 1, at: NOW })
    m.record({ tenantId: 't1', metric: 'wechat', quantity: 3, at: NOW + 1000 })
    const u = m.getUsage('t1', 'wechat', m.currentPeriod(NOW))
    assert.equal(u.totalQuantity, 4)
    assert.equal(u.eventCount, 2)
    assert.equal(u.firstAt, NOW)
    assert.equal(u.lastAt, NOW + 1000)
  })

  it('1.2 recordBatch 批量', () => {
    const m = new InMemoryBillingMeter()
    m.recordBatch([
      { tenantId: 't', metric: 'a', quantity: 1, at: NOW },
      { tenantId: 't', metric: 'a', quantity: 2, at: NOW },
      { tenantId: 't', metric: 'b', quantity: 5, at: NOW }
    ])
    assert.equal(m.getUsage('t', 'a', m.currentPeriod(NOW)).totalQuantity, 3)
    assert.equal(m.getUsage('t', 'b', m.currentPeriod(NOW)).totalQuantity, 5)
  })

  it('1.3 多租户/多 metric/多 period 隔离', () => {
    const m = new InMemoryBillingMeter()
    m.record({ tenantId: 'tA', metric: 'wechat', quantity: 1, at: NOW })
    m.record({ tenantId: 'tB', metric: 'wechat', quantity: 5, at: NOW })
    m.record({ tenantId: 'tA', metric: 'alipay', quantity: 10, at: NOW })
    assert.equal(m.getUsage('tA', 'wechat', m.currentPeriod(NOW)).totalQuantity, 1)
    assert.equal(m.getUsage('tB', 'wechat', m.currentPeriod(NOW)).totalQuantity, 5)
    assert.equal(m.getUsage('tA', 'alipay', m.currentPeriod(NOW)).totalQuantity, 10)
  })

  it('1.4 currentPeriod: YYYY-MM', () => {
    const m = new InMemoryBillingMeter()
    assert.equal(m.currentPeriod(NOW), '2026-07')
  })

  it('1.5 getUsage 未记录: 返回 0 聚合', () => {
    const m = new InMemoryBillingMeter()
    const u = m.getUsage('t', 'nope', '2026-07')
    assert.equal(u.totalQuantity, 0)
    assert.equal(u.eventCount, 0)
  })

  it('1.6 getAllUsage: 返回该 tenant 该 period 全部 metric', () => {
    const m = new InMemoryBillingMeter()
    m.record({ tenantId: 't', metric: 'a', quantity: 1, at: NOW })
    m.record({ tenantId: 't', metric: 'b', quantity: 2, at: NOW })
    m.record({ tenantId: 't', metric: 'c', quantity: 3, at: NOW })
    const all = m.getAllUsage('t', m.currentPeriod(NOW))
    assert.equal(all.length, 3)
  })

  it('1.7 reset(tenant, period): 清空指定 period', () => {
    const m = new InMemoryBillingMeter()
    m.record({ tenantId: 't', metric: 'a', quantity: 1, at: NOW })
    m.reset('t', m.currentPeriod(NOW))
    assert.equal(m.getUsage('t', 'a', m.currentPeriod(NOW)).totalQuantity, 0)
  })

  it('1.8 reset(tenant): 清空所有 period', () => {
    const m = new InMemoryBillingMeter()
    m.record({ tenantId: 't', metric: 'a', quantity: 1, at: NOW })
    m.reset('t')
    assert.equal(m.getUsage('t', 'a', m.currentPeriod(NOW)).totalQuantity, 0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 2. DefaultPricingEngine
// ═══════════════════════════════════════════════════════════════

describe('DefaultPricingEngine · 计价引擎', () => {
  const e = new DefaultPricingEngine()

  it('2.1 FREE: amount = 0', () => {
    const r = e.calculate({ plan: { ...PER_UNIT_PLAN, type: 'FREE' }, metric: 'x', currentUsage: 0, delta: 100 })
    assert.equal(r.amount, 0)
  })

  it('2.2 FLAT: charge 时不扣费 (月底统一扣)', () => {
    const r = e.calculate({ plan: FLAT_PLAN, metric: 'x', currentUsage: 0, delta: 100 })
    assert.equal(r.amount, 0)
    assert.ok(r.breakdown.includes('FLAT'))
  })

  it('2.3 PER_UNIT: 在 includedQuota 内免费', () => {
    const r = e.calculate({ plan: PER_UNIT_PLAN, metric: 'x', currentUsage: 0, delta: 5 })
    assert.equal(r.amount, 0)
  })

  it('2.4 PER_UNIT: 超出 includedQuota 按单价', () => {
    const r = e.calculate({ plan: PER_UNIT_PLAN, metric: 'x', currentUsage: 8, delta: 10 })
    // currentUsage=8, delta=10, total=18, chargeable=18-10=8, amount=8*0.5=4
    assert.equal(r.amount, 4)
  })

  it('2.5 TIERED: 全在 includedQuota 内免费', () => {
    const r = e.calculate({ plan: TIERED_PLAN, metric: 'x', currentUsage: 0, delta: 50 })
    assert.equal(r.amount, 0)
  })

  it('2.6 TIERED: 跨 1 档', () => {
    // currentUsage=80, delta=30, total=110
    // startChargeable = max(80, 100) = 100
    // endChargeable = max(110, 100) = 110
    // tier[0] upTo=500, qty=110-100=10, unitPrice=0.3, amount=3
    const r = e.calculate({ plan: TIERED_PLAN, metric: 'x', currentUsage: 80, delta: 30 })
    assert.equal(r.amount, 3)
  })

  it('2.7 TIERED: 跨 2 档', () => {
    // currentUsage=400, delta=200, total=600
    // startChargeable = max(400, 100) = 400
    // endChargeable = 600
    // tier[0] upTo=500: 500-400=100, * 0.3 = 30
    // tier[1] upTo=5000: 600-500=100, * 0.2 = 20
    // total = 50
    const r = e.calculate({ plan: TIERED_PLAN, metric: 'x', currentUsage: 400, delta: 200 })
    assert.equal(r.amount, 50)
    assert.equal(r.tierIndex, 1)
  })

  it('2.8 TIERED: 跨 3 档 (大用量)', () => {
    // currentUsage=0, delta=6000, total=6000
    // startChargeable = 100, endChargeable = 6000
    // tier[0]: 500-100=400 * 0.3 = 120
    // tier[1]: 5000-500=4500 * 0.2 = 900
    // tier[2]: 6000-5000=1000 * 0.1 = 100
    // total = 1120
    const r = e.calculate({ plan: TIERED_PLAN, metric: 'x', currentUsage: 0, delta: 6000 })
    assert.equal(r.amount, 1120)
    assert.equal(r.tierIndex, 2)
  })
})

// ═══════════════════════════════════════════════════════════════
// 3. BillingService 钱包 + 套餐
// ═══════════════════════════════════════════════════════════════

describe('BillingService · 钱包 + 套餐', () => {
  it('3.1 setPlan / getPlan', () => {
    const { billing } = buildStack()
    billing.setPlan('t1', PER_UNIT_PLAN)
    const p = billing.getPlan('t1')
    assert.equal(p?.id, 'p-perunit')
  })

  it('3.2 recharge: 累加余额 + 累计充值', () => {
    const { billing } = buildStack()
    billing.recharge('t1', 100)
    billing.recharge('t1', 50)
    const w = billing.getWallet('t1')
    assert.equal(w.balance, 150)
    assert.equal(w.totalRecharged, 150)
  })

  it('3.3 deduct: 扣减余额 + 累计消费', () => {
    const { billing } = buildStack()
    billing.recharge('t1', 100)
    billing.deduct('t1', 30)
    const w = billing.getWallet('t1')
    assert.equal(w.balance, 70)
    assert.equal(w.totalConsumed, 30)
  })

  it('3.4 getWallet 未充值: 返回 0 钱包', () => {
    const { billing } = buildStack()
    const w = billing.getWallet('nope')
    assert.equal(w.balance, 0)
  })

  it('3.5 recharge 货币默认 CNY', () => {
    const { billing } = buildStack()
    billing.recharge('t1', 100)
    assert.equal(billing.getWallet('t1').currency, 'CNY')
  })

  it('3.6 recharge 自定义货币', () => {
    const { billing } = buildStack()
    billing.recharge('t1', 100, 'USD')
    assert.equal(billing.getWallet('t1').currency, 'USD')
  })
})

// ═══════════════════════════════════════════════════════════════
// 4. 出账
// ═══════════════════════════════════════════════════════════════

describe('BillingService · 出账 (settle)', () => {
  it('4.1 PER_UNIT 出账: 包含 includedQuota', () => {
    const { billing, meter } = buildStack()
    billing.setPlan('t1', PER_UNIT_PLAN)
    // 用 50 次 (超出 quota 10, chargeable=40, fee=20)
    for (let i = 0; i < 50; i++) {
      meter.record({ tenantId: 't1', metric: 'wechat', quantity: 1, at: NOW })
    }
    billing.recharge('t1', 100)
    const bill = billing.settle('t1', meter.currentPeriod(NOW))
    assert.equal(bill.status, 'ISSUED')
    assert.equal(bill.totalAmount, 20)
    assert.equal(bill.lines.length, 1)
    assert.equal(bill.lines[0].metric, 'wechat')
    assert.equal(bill.lines[0].quantity, 50)
  })

  it('4.2 FLAT 出账: 固定月费', () => {
    const { billing, meter } = buildStack()
    billing.setPlan('t1', FLAT_PLAN)
    billing.recharge('t1', 200)
    const bill = billing.settle('t1', meter.currentPeriod(NOW))
    assert.equal(bill.totalAmount, 99)
    assert.equal(bill.lines[0].metric, 'subscription')
  })

  it('4.3 出账后: 钱包自动扣费', () => {
    const { billing, meter } = buildStack()
    billing.setPlan('t1', FLAT_PLAN)
    billing.recharge('t1', 200)
    billing.settle('t1', meter.currentPeriod(NOW))
    assert.equal(billing.getWallet('t1').balance, 200 - 99)
  })

  it('4.4 未设置套餐: 出账 total=0', () => {
    const { billing, meter } = buildStack()
    const bill = billing.settle('t1', meter.currentPeriod(NOW))
    assert.equal(bill.totalAmount, 0)
    assert.equal(bill.planId, 'NONE')
  })

  it('4.5 getBill / listBills', () => {
    const { billing, meter } = buildStack()
    billing.setPlan('t1', FLAT_PLAN)
    billing.recharge('t1', 200)
    const bill = billing.settle('t1', meter.currentPeriod(NOW))
    const fetched = billing.getBill(bill.id)
    assert.equal(fetched?.id, bill.id)
    const list = billing.listBills('t1')
    assert.equal(list.length, 1)
  })

  it('4.6 TIERED 出账: 跨档计费', () => {
    const { billing, meter } = buildStack()
    billing.setPlan('t1', TIERED_PLAN)
    billing.recharge('t1', 10000)
    // 600 次, quota 100, chargeable 跨 2 档: 100→500 (qty 400 * 0.3 = 120) + 500→600 (qty 100 * 0.2 = 20) = 140
    for (let i = 0; i < 600; i++) {
      meter.record({ tenantId: 't1', metric: 'wechat', quantity: 1, at: NOW })
    }
    const bill = billing.settle('t1', meter.currentPeriod(NOW))
    assert.equal(bill.totalAmount, 140)
  })
})

// ═══════════════════════════════════════════════════════════════
// 5. BillingWall
// ═══════════════════════════════════════════════════════════════

describe('BillingWall · 业务侧入口', () => {
  it('5.1 guard: 余额充足 → 放行', () => {
    const { wall, billing } = buildStack()
    billing.setPlan('t1', FLAT_PLAN)
    billing.recharge('t1', 200)
    const d = wall.guard('t1', 'payment.wechat')
    assert.equal(d.allowed, true)
    assert.equal(d.estimatedCost, 99)
  })

  it('5.2 guard: 无套餐 → NO_PLAN 拒绝', () => {
    const { wall } = buildStack()
    const d = wall.guard('t1', 'payment.wechat')
    assert.equal(d.allowed, false)
    assert.equal(d.reason, 'NO_PLAN')
  })

  it('5.3 guard: PER_UNIT 套餐, 余额不足 → INSUFFICIENT_BALANCE', () => {
    const { wall, billing } = buildStack()
    billing.setPlan('t1', PER_UNIT_PLAN)
    // 用光 quota 之后, 余额 0 → 拒绝
    const d = wall.guard('t1', 'wechat', 20) // 20 > quota 10, 需要 0.5*10=5
    assert.equal(d.allowed, false)
    assert.equal(d.reason, 'INSUFFICIENT_BALANCE')
  })

  it('5.4 guard: PER_UNIT 超硬上限 → QUOTA_EXCEEDED', () => {
    const { wall, billing } = buildStack()
    billing.setPlan('t1', { ...PER_UNIT_PLAN, tiers: [{ upTo: 100, unitPrice: 0.5 }] })
    billing.recharge('t1', 10000)
    // 先消耗 95
    for (let i = 0; i < 95; i++) {
      wall.recordUsage('t1', 'wechat', 1, NOW)
    }
    // 再调 20 → total=115 > 100
    const d = wall.guard('t1', 'wechat', 20)
    assert.equal(d.allowed, false)
    assert.equal(d.reason, 'QUOTA_EXCEEDED')
  })

  it('5.5 guard: FREE 套餐 → 永远放行', () => {
    const { wall, billing } = buildStack()
    billing.setPlan('t1', { ...PER_UNIT_PLAN, type: 'FREE' })
    const d = wall.guard('t1', 'wechat', 1_000_000)
    assert.equal(d.allowed, true)
  })

  it('5.6 guard: PLAN_EXPIRED', () => {
    const { wall, billing } = buildStack()
    billing.setPlan('t1', { ...PER_UNIT_PLAN, expiresAt: NOW - 1000 })
    const d = wall.guard('t1', 'wechat')
    assert.equal(d.allowed, false)
    assert.equal(d.reason, 'PLAN_EXPIRED')
  })

  it('5.7 recordUsage: 自动扣费 + 累加 usage', () => {
    const { wall, billing, meter } = buildStack()
    billing.setPlan('t1', FLAT_PLAN)
    billing.recharge('t1', 200)
    // FLAT 套餐 recordUsage 实际不扣 (FLAT 月底统一扣)
    wall.recordUsage('t1', 'wechat', 10, NOW)
    const u = meter.getUsage('t1', 'wechat', meter.currentPeriod(NOW))
    assert.equal(u.totalQuantity, 10)
  })

  it('5.8 recordUsage PER_UNIT: 累加 usage + 扣费', () => {
    const { wall, billing, meter } = buildStack()
    billing.setPlan('t1', PER_UNIT_PLAN)
    billing.recharge('t1', 100)
    wall.recordUsage('t1', 'wechat', 30, NOW) // currentUsage=0, total=30, chargeable=20, fee=10
    wall.recordUsage('t1', 'wechat', 30, NOW) // currentUsage=30, total=60, chargeable=50, fee=25
    const u = meter.getUsage('t1', 'wechat', meter.currentPeriod(NOW))
    assert.equal(u.totalQuantity, 60)
    // 余额 = 100 - 10 - 25 = 65
    assert.equal(billing.getWallet('t1').balance, 65)
  })

  it('5.9 batchGuard: 任一失败 → 全部拒绝', () => {
    const { wall, billing } = buildStack()
    billing.setPlan('t1', FLAT_PLAN)
    // 没钱 → FLAT 拒付
    const d = wall.batchGuard('t1', [
      { metric: 'wechat' },
      { metric: 'alipay' }
    ])
    assert.equal(d.allowed, false)
    assert.equal(d.reason, 'INSUFFICIENT_BALANCE')
    assert.ok(d.message?.includes('batch'))
  })

  it('5.10 batchGuard: 全部通过', () => {
    const { wall, billing } = buildStack()
    billing.setPlan('t1', { ...PER_UNIT_PLAN, type: 'FREE' })
    const d = wall.batchGuard('t1', [
      { metric: 'wechat', quantity: 100 },
      { metric: 'alipay', quantity: 50 }
    ])
    assert.equal(d.allowed, true)
  })

  it('5.11 getUsageReport: 列出本期所有 metric', () => {
    const { wall } = buildStack()
    wall.recordUsage('t1', 'wechat', 5, NOW)
    wall.recordUsage('t1', 'alipay', 3, NOW)
    const report = wall.getUsageReport('t1')
    assert.equal(report.length, 2)
  })

  it('5.12 getPricingPlan: 返回当前套餐', () => {
    const { wall, billing } = buildStack()
    billing.setPlan('t1', PER_UNIT_PLAN)
    const p = wall.getPricingPlan('t1')
    assert.equal(p?.id, 'p-perunit')
  })

  it('5.13 settle: 出账', () => {
    const { wall, billing, meter } = buildStack()
    billing.setPlan('t1', FLAT_PLAN)
    billing.recharge('t1', 200)
    const bill = wall.settle('t1', meter.currentPeriod(NOW))
    assert.equal(bill.totalAmount, 99)
  })
})

// ═══════════════════════════════════════════════════════════════
// 6. BillingQuotaExceededError
// ═══════════════════════════════════════════════════════════════

describe('BillingQuotaExceededError', () => {
  it('6.1 构造携带 decision 信息', () => {
    const d: import('./billing.port').BillingWallDecision = {
      allowed: false,
      reason: 'QUOTA_EXCEEDED',
      message: 'exceeded'
    }
    const e = new BillingQuotaExceededError(d)
    assert.equal(e.reason, 'QUOTA_EXCEEDED')
    assert.equal(e.decision.message, 'exceeded')
    assert.match(e.message, /Billing wall denied/)
  })
})
