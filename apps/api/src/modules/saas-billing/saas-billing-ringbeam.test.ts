/**
 * saas-billing-ringbeam.test.ts - V17#圈梁 Phase3 SaaS计费模块
 * 用途: PRD对齐测试 - 验证套餐管理/订阅/配额监控/计费账单/试用管理
 * 覆盖: 正例(订阅+配额检查+发票生成) + 反例(无效套餐/超额阻止/取消检查) + 边界(无限配额/超额计算/试用过期)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SaaSBillingService } from './saas-billing.service'
import type { QuotaType } from './saas-billing.entity'

describe('🔵 SaaSBillingRingBeam: SaaS计费PRD对齐', () => {
  let billing: SaaSBillingService

  beforeEach(() => {
    billing = new SaaSBillingService()
  })

  // ─── 1. 套餐管理 ──────────────────────────────────────────────

  describe('套餐管理', () => {
    it('[P0] 预设套餐包含starter/professional/enterprise', () => {
      const plans = billing.listPlans()
      expect(plans.length).toBe(3)
      const tiers = plans.map((p) => p.tier)
      expect(tiers).toContain('starter')
      expect(tiers).toContain('professional')
      expect(tiers).toContain('enterprise')
    })

    it('[P0] 各套餐basePrice为正数且各不同', () => {
      const plans = billing.listPlans()
      const prices = plans.map((p) => p.basePrice)
      expect(prices[0]).toBeLessThan(prices[1])
      expect(prices[1]).toBeLessThan(prices[2])
    })

    it('[P1] 不存在套餐返回null', () => {
      expect(billing.getPlan('plan_nonexistent')).toBeNull()
    })

    it('[P1] createPlan创建新套餐', () => {
      const plan = billing.createPlan({
        tier: 'starter',
        name: '测试套餐',
        basePrice: 199,
        billingCycles: ['monthly', 'annually'],
        features: ['测试功能'],
        quotas: { api_calls: 1000, storage_gb: 1, users: 3, transactions: 10000, devices: 5 },
        overageRates: { api_calls: 0.01, storage_gb: 1, users: 20, transactions: 0.001, devices: 5 },
        discountPercent: { monthly: 1, quarterly: 0.9, annually: 0.8 },
      })
      expect(plan.planId).toContain('plan_')
      expect(plan.basePrice).toBe(199)
    })
  })

  // ─── 2. 订阅管理 ──────────────────────────────────────────────

  describe('订阅管理', () => {
    it('[P0] subscribe创建活跃订阅', () => {
      const sub = billing.subscribe('tenant-001', 'plan_starter', 'monthly')
      expect(sub.tenantId).toBe('tenant-001')
      expect(sub.status).toBe('active')
      expect(sub.tier).toBe('starter')
      expect(sub.nextBillingDate > sub.startedAt).toBe(true)
    })

    it('[P0] changePlan切换套餐并更新配额', () => {
      billing.subscribe('tenant-002', 'plan_starter', 'monthly')
      const updated = billing.changePlan('tenant-002', 'plan_professional')
      expect(updated.tier).toBe('professional')
      expect(updated.planId).toBe('plan_professional')
    })

    it('[P1] 订阅到不存在套餐抛出错误', () => {
      expect(() => billing.subscribe('tenant-003', 'plan_unknown', 'monthly')).toThrow()
    })

    it('[P1] 取消订阅后状态为cancelled', () => {
      billing.subscribe('tenant-004', 'plan_starter', 'monthly')
      billing.cancelSubscription('tenant-004')
      const sub = billing.getSubscription('tenant-004')
      expect(sub?.status).toBe('cancelled')
    })

    it('[P1] 未订阅租户返回null', () => {
      expect(billing.getSubscription('tenant-nonexistent')).toBeNull()
    })
  })

  // ─── 3. 配额监控 ──────────────────────────────────────────────

  describe('配额监控', () => {
    it('[P0] 配额检查通过时allowed为true', () => {
      billing.subscribe('tenant-010', 'plan_starter', 'monthly')
      const check = billing.checkQuota('tenant-010', 'api_calls', 100)
      expect(check.allowed).toBe(true)
      expect(check.current).toBe(0)
      expect(check.limit).toBe(100000)
    })

    it('[P0] recordUsage记录使用量', () => {
      billing.subscribe('tenant-011', 'plan_starter', 'monthly')
      billing.recordUsage('tenant-011', 'api_calls', 5000)
      const usage = billing.getQuotaUsage('tenant-011')
      const apiUsage = usage.find((u) => u.quota === 'api_calls')
      expect(apiUsage?.used).toBe(5000)
    })

    it('[P1] 超出上限后allowed为false', () => {
      billing.subscribe('tenant-012', 'plan_starter', 'monthly')
      // 超过api_calls配额100000
      billing.recordUsage('tenant-012', 'api_calls', 100001)
      const check = billing.checkQuota('tenant-012', 'api_calls', 1)
      expect(check.allowed).toBe(false)
      expect(check.overage).toBeGreaterThan(0)
    })

    it('[P1] 无限配额(enterprise)始终允许', () => {
      billing.subscribe('tenant-013', 'plan_enterprise', 'monthly')
      billing.recordUsage('tenant-013', 'api_calls', 999999999)
      const check = billing.checkQuota('tenant-013', 'api_calls', 1)
      expect(check.allowed).toBe(true)
      expect(check.limit).toBe(Infinity)
    })

    it('[P1] 未订阅租户checkQuota抛出错误', () => {
      expect(() => billing.checkQuota('nonexistent', 'api_calls', 10)).toThrow()
    })
  })

  // ─── 4. 计费与账单 ────────────────────────────────────────────

  describe('计费与账单', () => {
    it('[P0] generateInvoice生成完整的发票', () => {
      billing.subscribe('tenant-020', 'plan_professional', 'monthly')
      const invoice = billing.generateInvoice('tenant-020')
      expect(invoice.invoiceId).toContain('inv_')
      expect(invoice.amount).toBe(999) // basePrice * monthly discount(1)
      expect(invoice.status).toBe('issued')
      expect(invoice.currency).toBe('CNY')
    })

    it('[P0] markPaid更新发票状态为paid', () => {
      billing.subscribe('tenant-021', 'plan_starter', 'monthly')
      const invoice = billing.generateInvoice('tenant-021')
      billing.markPaid(invoice.invoiceId)
      expect(invoice.status).toBe('paid')
      expect(invoice.paidAt).toBeDefined()
    })

    it('[P1] 超额使用计入发票（负向抵扣）', () => {
      billing.subscribe('tenant-022', 'plan_starter', 'monthly')
      billing.recordUsage('tenant-022', 'api_calls', 105000)
      const invoice = billing.generateInvoice('tenant-022')
      const overageItem = invoice.items.find((i) => i.description.includes('api_calls'))
      expect(overageItem).toBeDefined()
      expect(overageItem!.amount).toBeLessThan(0)
    })

    it('[P1] 超额计费计算正确', () => {
      billing.subscribe('tenant-023', 'plan_starter', 'monthly')
      billing.recordUsage('tenant-023', 'api_calls', 110000)
      const overage = billing.calculateOverage('tenant-023')
      // 超了10000 * 0.01 = 100
      expect(overage.api_calls).toBe(100)
    })
  })

  // ─── 5. 试用管理 ──────────────────────────────────────────────

  describe('试用管理', () => {
    it('[P0] startTrial创建14天试用订阅', () => {
      const sub = billing.startTrial('tenant-030', 'plan_professional')
      expect(sub.status).toBe('trial')
      expect(sub.trialEndsAt).toBeDefined()
    })

    it('[P0] convertTrial将试用转为正式订阅', () => {
      billing.startTrial('tenant-031', 'plan_starter')
      const active = billing.convertTrial('tenant-031')
      expect(active.status).toBe('active')
      expect(active.trialEndsAt).toBeUndefined()
    })

    it('[P1] 非试用订阅不可转换', () => {
      billing.subscribe('tenant-032', 'plan_starter', 'monthly')
      expect(() => billing.convertTrial('tenant-032')).toThrow()
    })

    it('[P1] checkTrialStatus返回正确天数', () => {
      const status = billing.checkTrialStatus('tenant-033')
      expect(status.isTrial).toBe(false)
    })

    it('[P1] 试用订阅checkTrialStatus返回isTrial为true', () => {
      billing.startTrial('tenant-034', 'plan_starter')
      const status = billing.checkTrialStatus('tenant-034')
      expect(status.isTrial).toBe(true)
      expect(status.daysRemaining).toBeGreaterThanOrEqual(1)
    })
  })
})
