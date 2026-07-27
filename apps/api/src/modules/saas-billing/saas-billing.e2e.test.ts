/**
 * saas-billing.e2e.test.ts — SaaS 计费模块端到端测试
 *
 * 链路: Controller → Service（无 HTTP，直接调用控制器方法）
 *
 * 覆盖:
 *   正例: 套餐浏览、订阅、配额使用、超额、账单生成、支付、续费
 *   反例: 非法套餐、未订阅操作、状态异常
 *   边界: 无限配额、零超额、零折扣、超大使用量
 *   时序: 试用到期、续费周期、取消后状态
 *   组合: 完整生命周期、多租户隔离、变更套餐后计费
 */

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { SaaSBillingController } from './saas-billing.controller'
import { SaaSBillingService } from './saas-billing.service'

function buildController(): SaaSBillingController {
  const service = new SaaSBillingService()
  return new SaaSBillingController(service)
}

describe('SaaSBilling Module E2E', () => {
  let controller: SaaSBillingController

  beforeEach(() => {
    controller = buildController()
  })

  // ══════════════════════════════════════════════════════════════════
  // 正例: 套餐管理 & 订阅生命周期 (≥8)
  // ══════════════════════════════════════════════════════════════════
  describe('正例 — 套餐浏览与订阅', () => {
    it('浏览套餐列表返回 3 个默认套餐', () => {
      const plans = controller.listPlans()
      assert.equal(plans.length, 3)
      const tiers = plans.map((p) => p.tier)
      assert(tiers.includes('starter'))
      assert(tiers.includes('professional'))
      assert(tiers.includes('enterprise'))
    })

    it('获取指定套餐详情', () => {
      const plan = controller.getPlan('plan_starter')
      assert(plan !== null)
      assert.equal(plan!.tier, 'starter')
      assert.equal(plan!.basePrice, 299)
      assert.equal(plan!.quotas.api_calls, 100000)
    })

    it('订阅 Professional 月付套餐成功', () => {
      const sub = controller.subscribe({
        tenantId: 'e2e-tenant-001',
        planId: 'plan_professional',
        billingCycle: 'monthly',
      })
      assert.equal(sub.status, 'active')
      assert.equal(sub.planId, 'plan_professional')
      assert.equal(sub.tier, 'professional')
      assert.equal(sub.billingCycle, 'monthly')
      assert(sub.autoRenew === true)
      assert(sub.nextBillingDate > new Date())
    })

    it('订阅后查询订阅信息', () => {
      controller.subscribe({
        tenantId: 'e2e-tenant-get',
        planId: 'plan_starter',
        billingCycle: 'annually',
      })
      const fetched = controller.getSubscription('e2e-tenant-get')
      assert(fetched !== null)
      assert.equal(fetched!.tenantId, 'e2e-tenant-get')
      assert.equal(fetched!.status, 'active')
      assert.equal(fetched!.billingCycle, 'annually')
    })

    it('记录配额使用后使用量正确累加', () => {
      controller.subscribe({
        tenantId: 'e2e-tenant-usage',
        planId: 'plan_starter',
        billingCycle: 'monthly',
      })
      controller.recordUsage('e2e-tenant-usage', { quota: 'api_calls', amount: 5000 })
      controller.recordUsage('e2e-tenant-usage', { quota: 'api_calls', amount: 3000 })
      const quotas = controller.getQuotaUsage('e2e-tenant-usage')
      const apiCalls = quotas.find((q) => q.quota === 'api_calls')!
      assert.equal(apiCalls.used, 8000)
    })

    it('配额检查: 未超限时 allowed=true', () => {
      controller.subscribe({
        tenantId: 'e2e-tenant-check',
        planId: 'plan_starter',
        billingCycle: 'monthly',
      })
      controller.recordUsage('e2e-tenant-check', { quota: 'api_calls', amount: 500 })
      const result = controller.checkQuota('e2e-tenant-check', {
        quota: 'api_calls',
        amount: 1000,
      })
      assert(result.allowed === true)
      assert.equal(result.current, 500)
      assert.equal(result.limit, 100000)
    })

    it('超额计算: 超出配额后正确计算费用', () => {
      controller.subscribe({
        tenantId: 'e2e-tenant-overage',
        planId: 'plan_starter',
        billingCycle: 'monthly',
      })
      // Starter: api_calls limit = 100000, overage rate = 0.01
      // 使用 105000 => 超额 5000 => 费用 5000 * 0.01 = 50
      controller.recordUsage('e2e-tenant-overage', { quota: 'api_calls', amount: 105000 })
      const overage = controller.calculateOverage('e2e-tenant-overage')
      assert.equal(overage.api_calls, 50)
    })

    it('生成账单并标记已支付', () => {
      controller.subscribe({
        tenantId: 'e2e-tenant-invoice',
        planId: 'plan_professional',
        billingCycle: 'monthly',
      })
      const invoice = controller.generateInvoice('e2e-tenant-invoice')
      assert.equal(invoice.status, 'issued')
      assert.equal(invoice.currency, 'CNY')
      assert(invoice.invoiceId.startsWith('inv_'))
      assert(invoice.amount > 0)

      const payResult = controller.markPaid(invoice.invoiceId)
      assert.deepEqual(payResult, { success: true })

      const invoices = controller.listInvoices('e2e-tenant-invoice')
      assert.equal(invoices.length, 1)
      assert.equal(invoices[0].status, 'paid')
    })

    it('订阅按年付享折扣计入账单', () => {
      controller.subscribe({
        tenantId: 'e2e-tenant-discount',
        planId: 'plan_professional',
        billingCycle: 'annually',
      })
      const invoice = controller.generateInvoice('e2e-tenant-discount')
      // Professional basePrice=999, annually discount=0.8 => 999 * 0.8 = 799.2
      assert.equal(invoice.amount, 799.2)
      assert(invoice.items.length >= 1)
    })
  })

  // ══════════════════════════════════════════════════════════════════
  // 正例: 试用 → 转正 → 变更 → 续费 (附加正例)
  // ══════════════════════════════════════════════════════════════════
  describe('正例 — 试用与套餐变更', () => {
    it('开始试用后状态为 trial', () => {
      const trial = controller.startTrial({
        tenantId: 'e2e-tenant-trial-1',
        planId: 'plan_starter',
      })
      assert.equal(trial.status, 'trial')
      assert(trial.trialEndsAt !== undefined)
      assert(trial.startedAt !== undefined)
    })

    it('检查试用状态返回正确信息', () => {
      controller.startTrial({
        tenantId: 'e2e-tenant-trial-status',
        planId: 'plan_starter',
      })
      const status = controller.checkTrialStatus('e2e-tenant-trial-status')
      assert(status.isTrial === true)
      assert(status.daysRemaining > 0)
      assert(status.daysRemaining <= 14)
    })

    it('试用转正后状态变为 active', () => {
      controller.startTrial({
        tenantId: 'e2e-tenant-convert',
        planId: 'plan_starter',
      })
      const active = controller.convertTrial('e2e-tenant-convert')
      assert.equal(active.status, 'active')
      assert(active.trialEndsAt === undefined)
    })

    it('变更套餐后 planId 更新', () => {
      controller.subscribe({
        tenantId: 'e2e-tenant-change',
        planId: 'plan_starter',
        billingCycle: 'monthly',
      })
      const changed = controller.changePlan('e2e-tenant-change', {
        newPlanId: 'plan_professional',
      })
      assert.equal(changed.planId, 'plan_professional')
      assert.equal(changed.tier, 'professional')
    })

    it('续费后下次账单日期延后', () => {
      controller.subscribe({
        tenantId: 'e2e-tenant-renew',
        planId: 'plan_starter',
        billingCycle: 'monthly',
      })
      const orig = controller.getSubscription('e2e-tenant-renew')!
      const renewed = controller.renewSubscription('e2e-tenant-renew')
      assert(renewed.nextBillingDate > orig.nextBillingDate)
      assert.equal(renewed.status, 'active')
    })

    it('取消订阅后状态为 cancelled', () => {
      controller.subscribe({
        tenantId: 'e2e-tenant-cancel',
        planId: 'plan_starter',
        billingCycle: 'monthly',
      })
      controller.cancelSubscription('e2e-tenant-cancel')
      const after = controller.getSubscription('e2e-tenant-cancel')!
      assert.equal(after.status, 'cancelled')
    })

    it('创建自定义套餐后成功查询', () => {
      const custom = controller.createPlan({
        tier: 'enterprise',
        name: 'E2E Custom',
        basePrice: 1999,
        billingCycles: ['monthly', 'annually'],
        features: ['定制功能'],
        quotas: {
          api_calls: 5000000,
          storage_gb: 200,
          users: 200,
          transactions: 999999999,
          devices: 500,
        },
        overageRates: {
          api_calls: 0.008,
          storage_gb: 0.8,
          users: 15,
          transactions: 0.0008,
          devices: 4,
        },
        discountPercent: {
          monthly: 1,
          quarterly: 0.88,
          annually: 0.78,
        },
      })
      assert(custom.planId.startsWith('plan_'))

      const fetched = controller.getPlan(custom.planId)
      assert(fetched !== null)
      assert.equal(fetched!.name, 'E2E Custom')
    })
  })

  // ══════════════════════════════════════════════════════════════════
  // 反例: 非法操作与错误输入 (≥5)
  // ══════════════════════════════════════════════════════════════════
  describe('反例 — 错误输入与非法操作', () => {
    it('订阅不存在的套餐应抛出错误', () => {
      assert.throws(
        () =>
          controller.subscribe({
            tenantId: 'err-tenant',
            planId: 'plan_nonexistent',
            billingCycle: 'monthly',
          }),
        /Plan plan_nonexistent not found/,
      )
    })

    it('未订阅租户查询配额返回空数组', () => {
      const quotas = controller.getQuotaUsage('nonexistent-tenant')
      assert.deepEqual(quotas, [])
    })

    it('未订阅租户取消订阅应抛出错误', () => {
      assert.throws(() => controller.cancelSubscription('nonexistent-tenant'))
    })

    it('非试用状态尝试转正应抛出错误', () => {
      controller.subscribe({
        tenantId: 'err-not-trial',
        planId: 'plan_starter',
        billingCycle: 'monthly',
      })
      assert.throws(
        () => controller.convertTrial('err-not-trial'),
        /Only trial subscriptions can be converted/,
      )
    })

    it('未订阅租户生成账单应抛出错误', () => {
      assert.throws(() => controller.generateInvoice('no-sub-tenant'))
    })

    it('不存在的套餐查询返回 null', () => {
      const plan = controller.getPlan('non_existent_plan')
      assert.equal(plan, null)
    })

    it('不存在的 invoice 支付应抛出错误', () => {
      assert.throws(() => controller.markPaid('non_existent_invoice'))
    })

    it('未订阅租户续费应抛出错误', () => {
      assert.throws(() => controller.renewSubscription('never-subscribed'))
    })
  })

  // ══════════════════════════════════════════════════════════════════
  // 边界: 阈值与极限值 (≥5)
  // ══════════════════════════════════════════════════════════════════
  describe('边界 — 阈值与极限值', () => {
    it('Enterprise 套餐含无限配额 (Infinity)', () => {
      const plan = controller.getPlan('plan_enterprise')!
      assert.equal(plan.quotas.api_calls, Infinity)
      assert.equal(plan.quotas.transactions, Infinity)
      assert.equal(plan.quotas.users, Infinity)
      assert.equal(plan.quotas.devices, Infinity)
    })

    it('Enterprise 无限配额检查始终返回 allowed', () => {
      controller.subscribe({
        tenantId: 'e2e-unlimited',
        planId: 'plan_enterprise',
        billingCycle: 'monthly',
      })
      controller.recordUsage('e2e-unlimited', { quota: 'api_calls', amount: 999999999 })
      const result = controller.checkQuota('e2e-unlimited', {
        quota: 'api_calls',
        amount: 999999999,
      })
      assert(result.allowed === true)
      assert.equal(result.overage, 0)
    })

    it('Enterprise 无限配额不产生超额费用', () => {
      controller.subscribe({
        tenantId: 'e2e-unlimited-overage',
        planId: 'plan_enterprise',
        billingCycle: 'monthly',
      })
      controller.recordUsage('e2e-unlimited-overage', { quota: 'api_calls', amount: 999999999 })
      const overage = controller.calculateOverage('e2e-unlimited-overage')
      assert.equal(overage.api_calls, 0)
      assert.equal(overage.storage_gb, 0)
      assert.equal(overage.users, 0)
    })

    it('完全不使用配额时超额为 0', () => {
      controller.subscribe({
        tenantId: 'e2e-zero-overage',
        planId: 'plan_starter',
        billingCycle: 'monthly',
      })
      const overage = controller.calculateOverage('e2e-zero-overage')
      assert.equal(overage.api_calls, 0)
      assert.equal(overage.storage_gb, 0)
      assert.equal(overage.users, 0)
      assert.equal(overage.devices, 0)
      assert.equal(overage.transactions, 0)
    })

    it('超大量使用后超额费用累加正确', () => {
      controller.subscribe({
        tenantId: 'e2e-heavy-overage',
        planId: 'plan_starter',
        billingCycle: 'monthly',
      })
      // Starter: api_calls = 100000, storage_gb = 5
      // api_calls: 使用 150000 => 超额 50000 * 0.01 = 500
      // storage_gb: 使用 10 => 超额 5 * 1 = 5
      controller.recordUsage('e2e-heavy-overage', { quota: 'api_calls', amount: 150000 })
      controller.recordUsage('e2e-heavy-overage', { quota: 'storage_gb', amount: 10 })
      const overage = controller.calculateOverage('e2e-heavy-overage')
      assert.equal(overage.api_calls, 500)
      assert.equal(overage.storage_gb, 5)
    })

    it('订购季度付享受正确折扣', () => {
      controller.subscribe({
        tenantId: 'e2e-quarterly',
        planId: 'plan_starter',
        billingCycle: 'quarterly',
      })
      const invoice = controller.generateInvoice('e2e-quarterly')
      // Starter basePrice=299, quarterly discount=0.9 => 299 * 0.9 = 269.1
      assert.equal(invoice.amount, 269.1)
    })

    it('超额抵扣后账单金额不低于 0', () => {
      controller.subscribe({
        tenantId: 'e2e-min-bill',
        planId: 'plan_starter',
        billingCycle: 'monthly',
      })
      // Starter: basePrice=299, 超额抵扣最多不超过 basePrice
      // 大量超额: api_calls 超额超过 299 元 => 最终金额应为 0 (Math.max(0, baseAmount - totalOverage))
      controller.recordUsage('e2e-min-bill', { quota: 'api_calls', amount: 100000 + 100000 })
      const invoice = controller.generateInvoice('e2e-min-bill')
      // baseAmount = 299 * 1 = 299, overage api_calls = 100000 * 0.01 = 1000 > 299
      // 但 overage 仅使用 - plan.limit = 100000 超出部分 = 100000, 实际 overage usage = 200000
      // recordUsage: used = 200000, limit = 100000, overage = 100000, 超额费用 = 100000 * 0.01 = 1000
      // baseAmount - totalOverage = 299 - 1000 = -701, Math.max(0, -701) = 0
      assert.equal(invoice.amount, 0)
    })
  })

  // ══════════════════════════════════════════════════════════════════
  // 时序: 试用 / 续费 / 取消 (≥3)
  // ══════════════════════════════════════════════════════════════════
  describe('时序 — 试用、续费与生命周期', () => {
    it('试用结束后检查状态 (不超期)', () => {
      controller.startTrial({
        tenantId: 'e2e-trial-timing',
        planId: 'plan_starter',
      })
      const status = controller.checkTrialStatus('e2e-trial-timing')
      assert(status.isTrial === true)
      assert(status.daysRemaining >= 0)
      assert(status.daysRemaining <= 14)
    })

    it('取消订阅后生成账单应抛出错误', () => {
      controller.subscribe({
        tenantId: 'e2e-cancel-billing',
        planId: 'plan_starter',
        billingCycle: 'monthly',
      })
      controller.cancelSubscription('e2e-cancel-billing')
      assert.throws(() => controller.generateInvoice('e2e-cancel-billing'))
    })

    it('续费后 nextBillingDate 延后正确 (月付 +30 天)', () => {
      controller.subscribe({
        tenantId: 'e2e-renew-timing',
        planId: 'plan_professional',
        billingCycle: 'monthly',
      })
      const before = controller.getSubscription('e2e-renew-timing')!
      const origNext = before.nextBillingDate.getTime()
      controller.renewSubscription('e2e-renew-timing')
      const after = controller.getSubscription('e2e-renew-timing')!
      // 月付延后 1 个月, 至少差 28 天
      const diffDays = (after.nextBillingDate.getTime() - origNext) / (1000 * 60 * 60 * 24)
      assert(diffDays >= 28)
      assert(diffDays <= 32)
    })

    it('试用期间可以正常记录配额使用', () => {
      controller.startTrial({
        tenantId: 'e2e-trial-usage',
        planId: 'plan_professional',
      })
      controller.recordUsage('e2e-trial-usage', { quota: 'api_calls', amount: 50000 })
      const quotas = controller.getQuotaUsage('e2e-trial-usage')
      assert(quotas.length > 0)
      const apiCalls = quotas.find((q) => q.quota === 'api_calls')!
      assert.equal(apiCalls.used, 50000)
    })
  })

  // ══════════════════════════════════════════════════════════════════
  // 组合场景: 多租户 / 多操作 (≥4)
  // ══════════════════════════════════════════════════════════════════
  describe('组合场景 — 多租户与完整链路', () => {
    it('两个租户相互独立互不干扰', () => {
      controller.subscribe({
        tenantId: 'tenant-a',
        planId: 'plan_starter',
        billingCycle: 'monthly',
      })
      controller.subscribe({
        tenantId: 'tenant-b',
        planId: 'plan_professional',
        billingCycle: 'annually',
      })

      controller.recordUsage('tenant-a', { quota: 'api_calls', amount: 10000 })
      controller.recordUsage('tenant-b', { quota: 'api_calls', amount: 500000 })

      const quotaA = controller.getQuotaUsage('tenant-a')
      const quotaB = controller.getQuotaUsage('tenant-b')

      assert.equal(quotaA.find((q) => q.quota === 'api_calls')!.used, 10000)
      assert.equal(quotaB.find((q) => q.quota === 'api_calls')!.used, 500000)

      const invoiceA = controller.generateInvoice('tenant-a')
      assert.equal(invoiceA.tenantId, 'tenant-a')

      const invoiceB = controller.generateInvoice('tenant-b')
      assert.equal(invoiceB.tenantId, 'tenant-b')
      assert(invoiceA.invoiceId !== invoiceB.invoiceId)
    })

    it('同一租户: 试用 → 转正 → 变更 → 续费 → 取消', () => {
      // 1. 试用
      const trial = controller.startTrial({
        tenantId: 'tenant-full-lifecycle',
        planId: 'plan_starter',
      })
      assert.equal(trial.status, 'trial')

      // 2. 转正
      const active = controller.convertTrial('tenant-full-lifecycle')
      assert.equal(active.status, 'active')

      // 3. 变更为高级套餐
      const changed = controller.changePlan('tenant-full-lifecycle', {
        newPlanId: 'plan_enterprise',
      })
      assert.equal(changed.tier, 'enterprise')

      // 4. 续费
      const renewed = controller.renewSubscription('tenant-full-lifecycle')
      assert.equal(renewed.status, 'active')

      // 5. 取消
      controller.cancelSubscription('tenant-full-lifecycle')
      const final = controller.getSubscription('tenant-full-lifecycle')!
      assert.equal(final.status, 'cancelled')
    })

    it('一人订多套餐 (通过不同 tenantId 模拟)', () => {
      controller.subscribe({
        tenantId: 'multi-plan-a',
        planId: 'plan_starter',
        billingCycle: 'monthly',
      })
      controller.subscribe({
        tenantId: 'multi-plan-b',
        planId: 'plan_enterprise',
        billingCycle: 'annually',
      })

      const subA = controller.getSubscription('multi-plan-a')!
      const subB = controller.getSubscription('multi-plan-b')!
      assert.equal(subA.planId, 'plan_starter')
      assert.equal(subB.planId, 'plan_enterprise')
      assert.equal(subA.billingCycle, 'monthly')
      assert.equal(subB.billingCycle, 'annually')
    })

    it('使用超额后生成账单显示超额抵扣明细', () => {
      controller.subscribe({
        tenantId: 'tenant-overage-detail',
        planId: 'plan_starter',
        billingCycle: 'monthly',
      })
      // api_calls 超额 5000, storage_gb 超额 3
      controller.recordUsage('tenant-overage-detail', { quota: 'api_calls', amount: 105000 })
      controller.recordUsage('tenant-overage-detail', { quota: 'storage_gb', amount: 8 })
      const invoice = controller.generateInvoice('tenant-overage-detail')
      // baseAmount = 299 * 1 = 299
      // api_calls overage = 5000 * 0.01 = 50
      // storage_gb overage = 3 * 1 = 3
      // total = 299 - 50 - 3 = 246
      assert.equal(invoice.amount, 246)
      // items 应包含抵扣明细
      const deductionItems = invoice.items.filter((item) => item.amount < 0)
      assert.equal(deductionItems.length, 2)
    })

    it('同一租户多次生成账单, 账单列表返回多个', () => {
      controller.subscribe({
        tenantId: 'tenant-multi-invoice',
        planId: 'plan_starter',
        billingCycle: 'monthly',
      })
      controller.generateInvoice('tenant-multi-invoice')
      controller.generateInvoice('tenant-multi-invoice')
      const invoices = controller.listInvoices('tenant-multi-invoice')
      assert.equal(invoices.length, 2)
      // 按时间倒序
      assert(invoices[0].issuedAt >= invoices[1].issuedAt)
    })
  })
})
