/**
 * 🐜 自动: [saas-billing] [D] E2E 测试补全
 *
 * SaaS 计费模块端到端测试：
 * 套餐浏览 → 试用 → 订阅 → 配额使用 → 超额 → 变更套餐 → 续费 → 账单 → 支付
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { SaaSBillingModule } from './saas-billing.module'
import { SaaSBillingController } from './saas-billing.controller'

describe('SaaSBilling Module E2E', () => {
  let controller: SaaSBillingController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SaaSBillingModule],
    }).compile()
    controller = module.get<SaaSBillingController>(SaaSBillingController)
  })

  // ═══════════════════════════════════════════════════════════
  // 正例: 完整订阅生命周期
  // ═══════════════════════════════════════════════════════════
  it('should complete full subscription lifecycle (list → subscribe → use → overage → invoice → pay)', () => {
    // 1. 浏览套餐
    const plans = controller.listPlans()
    expect(plans.length).toBe(3)
    const proPlan = plans.find(p => p.tier === 'professional')
    expect(proPlan).toBeDefined()
    expect(proPlan!.basePrice).toBe(999)

    // 2. 订阅
    const sub = controller.subscribe({
      tenantId: 'e2e-tenant-001',
      planId: proPlan!.planId,
      billingCycle: 'monthly',
    })
    expect(sub.status).toBe('active')
    expect(sub.planId).toBe(proPlan!.planId)
    expect(sub.billingCycle).toBe('monthly')

    // 3. 查询订阅
    const fetched = controller.getSubscription('e2e-tenant-001')
    expect(fetched).not.toBeNull()
    expect(fetched!.tenantId).toBe('e2e-tenant-001')

    // 4. 记录配额使用
    const usageResult = controller.recordUsage('e2e-tenant-001', {
      quota: 'api_calls',
      amount: 5000,
    })
    expect(usageResult).toEqual({ success: true })

    // 5. 检查配额
    const quotaCheck = controller.checkQuota('e2e-tenant-001', {
      quota: 'api_calls',
      amount: 1000,
    })
    expect(quotaCheck.allowed).toBe(true)
    expect(quotaCheck.current).toBe(5000)
    expect(quotaCheck.limit).toBe(1000000)

    // 6. 查看配额使用
    const quotas = controller.getQuotaUsage('e2e-tenant-001')
    expect(quotas.length).toBeGreaterThan(0)
    expect(quotas.find(q => q.quota === 'api_calls')!.used).toBe(5000)

    // 7. 超额使用
    controller.recordUsage('e2e-tenant-001', {
      quota: 'api_calls',
      amount: 996000,
    })

    const overageCheck = controller.checkQuota('e2e-tenant-001', {
      quota: 'api_calls',
      amount: 1,
    })
    expect(overageCheck.allowed).toBe(false)

    const overage = controller.calculateOverage('e2e-tenant-001')
    // 超额 1000, 费率 0.01 => 10
    expect(overage.api_calls).toBe(10)

    // 8. 生成账单
    const invoice = controller.generateInvoice('e2e-tenant-001')
    expect(invoice.status).toBe('issued')
    expect(invoice.currency).toBe('CNY')
    // Professional 月付 999, 超额抵扣 10 => 989
    expect(invoice.amount).toBe(989)

    // 9. 支付
    const payResult = controller.markPaid(invoice.invoiceId)
    expect(payResult).toEqual({ success: true })

    // 10. 确认账单列表
    const invoices = controller.listInvoices('e2e-tenant-001')
    expect(invoices.length).toBe(1)
    expect(invoices[0].status).toBe('paid')
  })

  // ═══════════════════════════════════════════════════════════
  // 正例: 试用 → 转正 → 变更套餐 → 续费
  // ═══════════════════════════════════════════════════════════
  it('should handle trial → convert → change plan → renew', () => {
    // 1. 开始试用
    const trial = controller.startTrial({
      tenantId: 'e2e-tenant-002',
      planId: 'plan_starter',
    })
    expect(trial.status).toBe('trial')
    expect(trial.trialEndsAt).toBeDefined()

    // 2. 检查试用状态
    const status = controller.checkTrialStatus('e2e-tenant-002')
    expect(status.isTrial).toBe(true)
    expect(status.daysRemaining).toBeGreaterThan(0)

    // 3. 转正
    const active = controller.convertTrial('e2e-tenant-002')
    expect(active.status).toBe('active')

    // 4. 变更套餐 (Starter → Professional)
    const changed = controller.changePlan('e2e-tenant-002', {
      newPlanId: 'plan_professional',
    })
    expect(changed.planId).toBe('plan_professional')
    expect(changed.tier).toBe('professional')

    // 5. 续费
    const renewed = controller.renewSubscription('e2e-tenant-002')
    expect(renewed.status).toBe('active')

    // 6. 取消订阅
    controller.cancelSubscription('e2e-tenant-002')
    const afterCancel = controller.getSubscription('e2e-tenant-002')
    expect(afterCancel!.status).toBe('cancelled')
  })

  // ═══════════════════════════════════════════════════════════
  // 正例: 创建自定义套餐 → 订阅 → 账单
  // ═══════════════════════════════════════════════════════════
  it('should create custom plan and subscribe to it', () => {
    const customPlan = controller.createPlan({
      tier: 'enterprise',
      name: 'E2E 定制套餐',
      basePrice: 1999,
      billingCycles: ['monthly', 'annually'],
      features: ['定制功能'],
      quotas: {
        api_calls: 5000000,
        storage_gb: 200,
        users: 200,
        transactions: Infinity,
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

    expect(customPlan.planId).toBeDefined()

    // 订阅自定义套餐
    const sub = controller.subscribe({
      tenantId: 'e2e-tenant-003',
      planId: customPlan.planId,
      billingCycle: 'annually',
    })
    expect(sub.status).toBe('active')

    // 生成账单验证折扣生效
    const invoice = controller.generateInvoice('e2e-tenant-003')
    // 1999 * 0.78 = 1559.22
    expect(invoice.amount).toBe(1559.22)
  })

  // ═══════════════════════════════════════════════════════════
  // 反例: 非法操作
  // ═══════════════════════════════════════════════════════════
  it('should throw errors for invalid operations', () => {
    // 订阅不存在的套餐
    expect(() =>
      controller.subscribe({
        tenantId: 'e2e-tenant-err',
        planId: 'plan_nonexistent',
        billingCycle: 'monthly',
      }),
    ).toThrow(/Plan plan_nonexistent not found/)

    // 未订阅租户查询配额
    const quotas = controller.getQuotaUsage('e2e-tenant-notfound')
    expect(quotas).toEqual([])

    // 未订阅租户取消订阅
    expect(() => controller.cancelSubscription('e2e-tenant-notfound')).toThrow()

    // 非试用状态尝试转正
    controller.subscribe({
      tenantId: 'e2e-tenant-err',
      planId: 'plan_starter',
      billingCycle: 'monthly',
    })
    expect(() => controller.convertTrial('e2e-tenant-err')).toThrow(
      /Only trial subscriptions can be converted/,
    )

    // 未订阅租户生成账单
    expect(() => controller.generateInvoice('e2e-tenant-no-sub')).toThrow()

    // 查询不存在的套餐
    const plan = controller.getPlan('non_existent_plan')
    expect(plan).toBeNull()
  })
})
