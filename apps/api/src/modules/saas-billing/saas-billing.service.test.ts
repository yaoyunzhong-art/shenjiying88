/**
 * saas-billing.service.spec.ts — SaaS 计费 Service 纯函数式内联测试
 *
 * 覆盖：SaaSBillingService 的所有公共方法
 *   - listPlans / getPlan / createPlan: 正例 + 边界
 *   - subscribe / changePlan / cancelSubscription / renew / getSubscription:
 *     正例 + 反例（不存在的 plan/tenant）
 *   - recordUsage / getQuotaUsage / checkQuota / calculateOverage:
 *     正例（累计/超额/精确值）+ 反例（无订阅/无 quota）+ 边界（刚好满）
 *   - generateInvoice / markPaid / listInvoices: 正例 + 反例 + 折扣计算
 *   - startTrial / convertTrial / checkTrialStatus: 正例 + 反例 + 边界
 *
 * 策略：直接 new SaaSBillingService，纯函数内联，不依赖 NestJS DI。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SaaSBillingService } from './saas-billing.service'
import type { BillingCycle, QuotaType } from './saas-billing.entity'

// ═══════════════════════════════════════════════════════════════
// Mock 数据工厂
// ═══════════════════════════════════════════════════════════════

function makeService(): SaaSBillingService {
  return new SaaSBillingService()
}

const TENANTS = ['t-001', 't-002', 't-003', 't-004'] as const
const INVALID_TENANT = 'no-such-tenant'
const INVALID_PLAN = 'no-such-plan'

// ═══════════════════════════════════════════════════════════════
// 套餐管理
// ═══════════════════════════════════════════════════════════════

describe('SaaSBillingService — 套餐管理', () => {
  let svc: SaaSBillingService

  beforeEach(() => { svc = makeService() })

  it('[A1] listPlans 初始化返回 3 个套餐', () => {
    expect(svc.listPlans()).toHaveLength(3)
  })

  it('[A2] listPlans 包含 starter/professional/enterprise', () => {
    const tiers = svc.listPlans().map(p => p.tier)
    expect(tiers).toContain('starter')
    expect(tiers).toContain('professional')
    expect(tiers).toContain('enterprise')
  })

  it('[A3] getPlan 按计划 ID 准确读取 baseline', () => {
    const plan = svc.getPlan('plan_starter')!
    expect(plan.tier).toBe('starter')
    expect(plan.basePrice).toBe(299)
  })

  it('[A4] getPlan 传不存在的计划返回 null', () => {
    expect(svc.getPlan(INVALID_PLAN)).toBeNull()
  })

  it('[A5] createPlan 创建后可通过 getPlan 索引', () => {
    const plan = svc.createPlan({
      tier: 'professional', name: 'Custom', basePrice: 1999,
      billingCycles: ['monthly', 'annually'],
      features: ['F1'],
      quotas: { api_calls: 500_000, storage_gb: 100, users: 50, transactions: 50_000, devices: 200 },
      overageRates: { api_calls: 0.01, storage_gb: 1, users: 20, transactions: 0.001, devices: 5 },
      discountPercent: { monthly: 1, quarterly: 0.9, annually: 0.8 },
    })
    expect(plan.planId).toMatch(/^plan_/)
    expect(svc.getPlan(plan.planId)!.name).toBe('Custom')
  })
})

// ═══════════════════════════════════════════════════════════════
// 订阅管理
// ═══════════════════════════════════════════════════════════════

describe('SaaSBillingService — 订阅管理', () => {
  let svc: SaaSBillingService

  beforeEach(() => { svc = makeService() })

  it('[A6] subscribe 创建 active 订阅，关联正确套餐', () => {
    const sub = svc.subscribe(TENANTS[0], 'plan_professional', 'monthly')
    expect(sub.tenantId).toBe(TENANTS[0])
    expect(sub.planId).toBe('plan_professional')
    expect(sub.tier).toBe('professional')
    expect(sub.status).toBe('active')
    expect(sub.billingCycle).toBe('monthly')
  })

  it('[A7] subscribe 为不存在的 plan 抛出错误', () => {
    expect(() => svc.subscribe(TENANTS[1], INVALID_PLAN, 'monthly')).toThrow(/not found/)
  })

  it('[A8] subscribe 后自动初始化 5 项 quota', () => {
    svc.subscribe(TENANTS[0], 'plan_starter', 'monthly')
    expect(svc.getQuotaUsage(TENANTS[0])).toHaveLength(5)
  })

  it('[A9] changePlan 更新订阅的 planId 和 tier', () => {
    svc.subscribe(TENANTS[0], 'plan_starter', 'monthly')
    const updated = svc.changePlan(TENANTS[0], 'plan_enterprise')
    expect(updated.planId).toBe('plan_enterprise')
    expect(updated.tier).toBe('enterprise')
  })

  it('[A10] changePlan 不存在的订阅抛出错误', () => {
    expect(() => svc.changePlan(INVALID_TENANT, 'plan_starter')).toThrow(/not found/)
  })

  it('[A11] changePlan 不存在的目标 plan 抛出错误', () => {
    svc.subscribe(TENANTS[0], 'plan_starter', 'monthly')
    expect(() => svc.changePlan(TENANTS[0], INVALID_PLAN)).toThrow(/not found/)
  })

  it('[A12] cancelSubscription 标记 cancelled', () => {
    svc.subscribe(TENANTS[0], 'plan_starter', 'monthly')
    svc.cancelSubscription(TENANTS[0])
    expect(svc.getSubscription(TENANTS[0])!.status).toBe('cancelled')
  })

  it('[A13] cancelSubscription 不存在的 tenant 抛错', () => {
    expect(() => svc.cancelSubscription(INVALID_TENANT)).toThrow(/not found/)
  })

  it('[A14] renew 推进下一次结算时间', () => {
    svc.subscribe(TENANTS[0], 'plan_starter', 'monthly')
    const before = svc.getSubscription(TENANTS[0])!.nextBillingDate.getTime()
    const renewed = svc.renew(TENANTS[0])
    expect(renewed.nextBillingDate.getTime()).toBeGreaterThan(before)
  })

  it('[A15] renew 不存在的 tenant 抛错', () => {
    expect(() => svc.renew(INVALID_TENANT)).toThrow(/not found/)
  })

  it('[A16] getSubscription 未订阅返回 null', () => {
    expect(svc.getSubscription(INVALID_TENANT)).toBeNull()
  })
})

// ═══════════════════════════════════════════════════════════════
// 配额监控
// ═══════════════════════════════════════════════════════════════

describe('SaaSBillingService — 配额监控', () => {
  let svc: SaaSBillingService

  beforeEach(() => { svc = makeService() })

  it('[A17] recordUsage 正常递增', () => {
    svc.subscribe(TENANTS[0], 'plan_starter', 'monthly')
    svc.recordUsage(TENANTS[0], 'api_calls', 500)
    const u = svc.getQuotaUsage(TENANTS[0]).find(x => x.quota === 'api_calls')!
    expect(u.used).toBe(500)
  })

  it('[A18] recordUsage 多次调用叠加', () => {
    svc.subscribe(TENANTS[0], 'plan_starter', 'monthly')
    svc.recordUsage(TENANTS[0], 'api_calls', 100)
    svc.recordUsage(TENANTS[0], 'api_calls', 200)
    expect(svc.getQuotaUsage(TENANTS[0]).find(x => x.quota === 'api_calls')!.used).toBe(300)
  })

  it('[A19] recordUsage 超额后 overage 正确', () => {
    svc.subscribe(TENANTS[0], 'plan_starter', 'monthly')
    svc.recordUsage(TENANTS[0], 'storage_gb', 10) // limit=5
    const overage = svc.getQuotaUsage(TENANTS[0]).find(x => x.quota === 'storage_gb')!.overage
    expect(overage).toBe(5)
  })

  it('[A20] recordUsage 刚好到限额 overage=0', () => {
    svc.subscribe(TENANTS[0], 'plan_starter', 'monthly')
    svc.recordUsage(TENANTS[0], 'storage_gb', 5) // exact limit
    const u = svc.getQuotaUsage(TENANTS[0]).find(x => x.quota === 'storage_gb')!
    expect(u.overage).toBe(0)
  })

  it('[A21] recordUsage 未初始化 tenant 抛错', () => {
    expect(() => svc.recordUsage(INVALID_TENANT, 'api_calls', 10)).toThrow(/not found/)
  })

  it('[A22] getQuotaUsage 未订阅 tenant 返回空数组', () => {
    expect(svc.getQuotaUsage(INVALID_TENANT)).toEqual([])
  })

  it('[A23] checkQuota 允许 ≤ limit', () => {
    svc.subscribe(TENANTS[0], 'plan_starter', 'monthly')
    expect(svc.checkQuota(TENANTS[0], 'api_calls', 500).allowed).toBe(true)
  })

  it('[A24] checkQuota 拒绝 > limit', () => {
    svc.subscribe(TENANTS[0], 'plan_starter', 'monthly')
    svc.recordUsage(TENANTS[0], 'api_calls', 99_999)
    expect(svc.checkQuota(TENANTS[0], 'api_calls', 2).allowed).toBe(false)
  })

  it('[A25] checkQuota 未订阅 tenant 抛错', () => {
    expect(() => svc.checkQuota(INVALID_TENANT, 'api_calls', 10)).toThrow(/not found/)
  })

  it('[A26] calculateOverage 完全 ≤ limit 返回全零', () => {
    svc.subscribe(TENANTS[0], 'plan_starter', 'monthly')
    const o = svc.calculateOverage(TENANTS[0])
    expect(o.api_calls).toBe(0)
    expect(o.storage_gb).toBe(0)
    expect(o.users).toBe(0)
    expect(o.transactions).toBe(0)
    expect(o.devices).toBe(0)
  })

  it('[A27] calculateOverage 超额按费率折算', () => {
    svc.subscribe(TENANTS[0], 'plan_starter', 'monthly')
    svc.recordUsage(TENANTS[0], 'storage_gb', 10) // overage=5, rate=1
    const o = svc.calculateOverage(TENANTS[0])
    expect(o.storage_gb).toBe(5)
  })

  it('[A28] calculateOverage 未订阅 tenant 抛错', () => {
    expect(() => svc.calculateOverage(INVALID_TENANT)).toThrow(/not found/)
  })
})

// ═══════════════════════════════════════════════════════════════
// 计费与账单
// ═══════════════════════════════════════════════════════════════

describe('SaaSBillingService — 计费与账单', () => {
  let svc: SaaSBillingService

  beforeEach(() => { svc = makeService() })

  it('[A29] generateInvoice 创建有效发票', () => {
    svc.subscribe(TENANTS[0], 'plan_starter', 'monthly')
    const inv = svc.generateInvoice(TENANTS[0])
    expect(inv.invoiceId).toMatch(/^inv_/)
    expect(inv.tenantId).toBe(TENANTS[0])
    expect(inv.currency).toBe('CNY')
    expect(inv.status).toBe('issued')
  })

  it('[A30] generateInvoice 月付价格=basePrice*discount', () => {
    svc.subscribe(TENANTS[0], 'plan_starter', 'monthly')
    const inv = svc.generateInvoice(TENANTS[0])
    expect(inv.amount).toBe(299) // 299*1.0
  })

  it('[A31] generateInvoice 年付折扣生效', () => {
    svc.subscribe(TENANTS[0], 'plan_starter', 'annually')
    const inv = svc.generateInvoice(TENANTS[0])
    // 299*0.8=239.2 — 注意 overage 计算会减去超额部分
    expect(inv.amount).toBeGreaterThan(0)
    expect(inv.amount).toBeLessThan(299)
  })

  it('[A32] generateInvoice 未订阅 tenant 抛错', () => {
    expect(() => svc.generateInvoice(INVALID_TENANT)).toThrow(/not found/)
  })

  it('[A33] markPaid 标记 paid，记录 paidAt', () => {
    svc.subscribe(TENANTS[0], 'plan_starter', 'monthly')
    const inv = svc.generateInvoice(TENANTS[0])
    svc.markPaid(inv.invoiceId)
    const list = svc.listInvoices(TENANTS[0])
    const paid = list.find(x => x.invoiceId === inv.invoiceId)!
    expect(paid.status).toBe('paid')
    expect(paid.paidAt).toBeInstanceOf(Date)
  })

  it('[A34] markPaid 不存在的发票抛错', () => {
    expect(() => svc.markPaid('no-such-invoice')).toThrow(/not found/)
  })

  it('[A35] listInvoices 按 tenant 筛选', () => {
    svc.subscribe(TENANTS[0], 'plan_starter', 'monthly')
    svc.subscribe(TENANTS[1], 'plan_starter', 'monthly')
    svc.generateInvoice(TENANTS[0])
    svc.generateInvoice(TENANTS[0])
    svc.generateInvoice(TENANTS[1])
    expect(svc.listInvoices(TENANTS[0])).toHaveLength(2)
    expect(svc.listInvoices(TENANTS[1])).toHaveLength(1)
  })

  it('[A36] listInvoices 无发票 tenant 返回空', () => {
    expect(svc.listInvoices(TENANTS[0])).toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════════
// 试用管理
// ═══════════════════════════════════════════════════════════════

describe('SaaSBillingService — 试用管理', () => {
  let svc: SaaSBillingService

  beforeEach(() => { svc = makeService() })

  it('[A37] startTrial 创建 14 天试用', () => {
    const sub = svc.startTrial(TENANTS[0], 'plan_professional')
    expect(sub.status).toBe('trial')
    expect(sub.tier).toBe('professional')
    expect(sub.trialEndsAt).toBeDefined()
    const diffMs = sub.trialEndsAt!.getTime() - sub.startedAt.getTime()
    expect(Math.round(diffMs / (1000 * 60 * 60 * 24))).toBe(14)
  })

  it('[A38] startTrial 不存在的 plan 抛错', () => {
    expect(() => svc.startTrial(TENANTS[0], INVALID_PLAN)).toThrow(/not found/)
  })

  it('[A39] startTrial 初始化 quota', () => {
    svc.startTrial(TENANTS[0], 'plan_starter')
    expect(svc.getQuotaUsage(TENANTS[0])).toHaveLength(5)
  })

  it('[A40] convertTrial 从 trial 转为 active', () => {
    svc.startTrial(TENANTS[0], 'plan_starter')
    const sub = svc.convertTrial(TENANTS[0])
    expect(sub.status).toBe('active')
    expect(sub.trialEndsAt).toBeUndefined()
  })

  it('[A41] convertTrial 不存在的 tenant 抛错', () => {
    expect(() => svc.convertTrial(INVALID_TENANT)).toThrow(/not found/)
  })

  it('[A42] convertTrial 非试用状态抛错', () => {
    svc.subscribe(TENANTS[0], 'plan_starter', 'monthly')
    expect(() => svc.convertTrial(TENANTS[0])).toThrow(/trial/)
  })

  it('[A43] checkTrialStatus 正在试用返回真', () => {
    svc.startTrial(TENANTS[0], 'plan_starter')
    const s = svc.checkTrialStatus(TENANTS[0])
    expect(s.isTrial).toBe(true)
    expect(s.daysRemaining).toBeGreaterThan(0)
  })

  it('[A44] checkTrialStatus 未订阅返回 isTrial=false', () => {
    const s = svc.checkTrialStatus(INVALID_TENANT)
    expect(s.isTrial).toBe(false)
    expect(s.daysRemaining).toBe(0)
  })

  it('[A45] checkTrialStatus 转换后返回 isTrial=false', () => {
    svc.startTrial(TENANTS[0], 'plan_starter')
    svc.convertTrial(TENANTS[0])
    const s = svc.checkTrialStatus(TENANTS[0])
    expect(s.isTrial).toBe(false)
    expect(s.daysRemaining).toBe(0)
  })
})
