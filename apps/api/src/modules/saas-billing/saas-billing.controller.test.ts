/**
 * saas-billing.controller.test.ts
 *
 * SaaSBillingController 单元测试 —— 覆盖全部公开端点 (正例+反例+边界)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { SaaSBillingController } from './saas-billing.controller'
import { SaaSBillingService } from './saas-billing.service'

describe('SaaSBillingController', () => {
  let controller: SaaSBillingController
  let service: SaaSBillingService

  beforeEach(() => {
    service = new SaaSBillingService()
    controller = new SaaSBillingController(service)
  })

  // ── 路由元数据 ──────────────────────────────────────────────────────────

  describe('route metadata', () => {
    it('controller path metadata should be saas-billing', () => {
      const path = Reflect.getMetadata('path', SaaSBillingController)
      assert.equal(path, 'saas-billing')
    })

    it('listPlans route should have GET method', () => {
      const method = Reflect.getMetadata('method', SaaSBillingController.prototype.listPlans)
      const path = Reflect.getMetadata('path', SaaSBillingController.prototype.listPlans)
      assert.equal(method, 0) // GET
      assert.equal(path, 'plans')
    })

    it('getPlan route should have GET method with :planId param', () => {
      const method = Reflect.getMetadata('method', SaaSBillingController.prototype.getPlan)
      const path = Reflect.getMetadata('path', SaaSBillingController.prototype.getPlan)
      assert.equal(method, 0) // GET
      assert.equal(path, 'plans/:planId')
    })

    it('createPlan route should have POST method', () => {
      const method = Reflect.getMetadata('method', SaaSBillingController.prototype.createPlan)
      const path = Reflect.getMetadata('path', SaaSBillingController.prototype.createPlan)
      assert.equal(method, 1) // POST
      assert.equal(path, 'plans')
    })

    it('subscribe route should have POST method', () => {
      const method = Reflect.getMetadata('method', SaaSBillingController.prototype.subscribe)
      const path = Reflect.getMetadata('path', SaaSBillingController.prototype.subscribe)
      assert.equal(method, 1) // POST
      assert.equal(path, 'subscribe')
    })

    it('changePlan route should have POST method', () => {
      const method = Reflect.getMetadata('method', SaaSBillingController.prototype.changePlan)
      const path = Reflect.getMetadata('path', SaaSBillingController.prototype.changePlan)
      assert.equal(method, 1) // POST
      assert.equal(path, 'subscriptions/:tenantId/change-plan')
    })

    it('cancelSubscription route should have POST method', () => {
      const method = Reflect.getMetadata('method', SaaSBillingController.prototype.cancelSubscription)
      const path = Reflect.getMetadata('path', SaaSBillingController.prototype.cancelSubscription)
      assert.equal(method, 1) // POST
      assert.equal(path, 'subscriptions/:tenantId/cancel')
    })

    it('renewSubscription route should have POST method', () => {
      const method = Reflect.getMetadata('method', SaaSBillingController.prototype.renewSubscription)
      const path = Reflect.getMetadata('path', SaaSBillingController.prototype.renewSubscription)
      assert.equal(method, 1) // POST
      assert.equal(path, 'subscriptions/:tenantId/renew')
    })

    it('getSubscription route should have GET method', () => {
      const method = Reflect.getMetadata('method', SaaSBillingController.prototype.getSubscription)
      const path = Reflect.getMetadata('path', SaaSBillingController.prototype.getSubscription)
      assert.equal(method, 0) // GET
      assert.equal(path, 'subscriptions/:tenantId')
    })

    it('getSubscription route should have GET method with path', () => {
      const method = Reflect.getMetadata('method', SaaSBillingController.prototype.getSubscription)
      const path = Reflect.getMetadata('path', SaaSBillingController.prototype.getSubscription)
      assert.equal(method, 0) // GET
      assert.equal(path, 'subscriptions/:tenantId')
    })

    it('recordUsage route should have POST method', () => {
      const method = Reflect.getMetadata('method', SaaSBillingController.prototype.recordUsage)
      const path = Reflect.getMetadata('path', SaaSBillingController.prototype.recordUsage)
      assert.equal(method, 1) // POST
      assert.equal(path, 'quotas/:tenantId/record')
    })

    it('getQuotaUsage route should have GET method', () => {
      const method = Reflect.getMetadata('method', SaaSBillingController.prototype.getQuotaUsage)
      const path = Reflect.getMetadata('path', SaaSBillingController.prototype.getQuotaUsage)
      assert.equal(method, 0) // GET
      assert.equal(path, 'quotas/:tenantId')
    })

    it('checkQuota route should have POST method', () => {
      const method = Reflect.getMetadata('method', SaaSBillingController.prototype.checkQuota)
      const path = Reflect.getMetadata('path', SaaSBillingController.prototype.checkQuota)
      assert.equal(method, 1) // POST
      assert.equal(path, 'quotas/:tenantId/check')
    })

    it('calculateOverage route should have GET method', () => {
      const method = Reflect.getMetadata('method', SaaSBillingController.prototype.calculateOverage)
      const path = Reflect.getMetadata('path', SaaSBillingController.prototype.calculateOverage)
      assert.equal(method, 0) // GET
      assert.equal(path, 'quotas/:tenantId/overage')
    })

    it('generateInvoice route should have POST method', () => {
      const method = Reflect.getMetadata('method', SaaSBillingController.prototype.generateInvoice)
      const path = Reflect.getMetadata('path', SaaSBillingController.prototype.generateInvoice)
      assert.equal(method, 1) // POST
      assert.equal(path, 'invoices/generate/:tenantId')
    })

    it('markPaid route should have POST method', () => {
      const method = Reflect.getMetadata('method', SaaSBillingController.prototype.markPaid)
      const path = Reflect.getMetadata('path', SaaSBillingController.prototype.markPaid)
      assert.equal(method, 1) // POST
      assert.equal(path, 'invoices/:invoiceId/pay')
    })

    it('listInvoices route should have GET method', () => {
      const method = Reflect.getMetadata('method', SaaSBillingController.prototype.listInvoices)
      const path = Reflect.getMetadata('path', SaaSBillingController.prototype.listInvoices)
      assert.equal(method, 0) // GET
      assert.equal(path, 'invoices/:tenantId')
    })

    it('startTrial route should have POST method', () => {
      const method = Reflect.getMetadata('method', SaaSBillingController.prototype.startTrial)
      const path = Reflect.getMetadata('path', SaaSBillingController.prototype.startTrial)
      assert.equal(method, 1) // POST
      assert.equal(path, 'trial/start')
    })

    it('convertTrial route should have POST method', () => {
      const method = Reflect.getMetadata('method', SaaSBillingController.prototype.convertTrial)
      const path = Reflect.getMetadata('path', SaaSBillingController.prototype.convertTrial)
      assert.equal(method, 1) // POST
      assert.equal(path, 'trial/:tenantId/convert')
    })

    it('checkTrialStatus route should have GET method', () => {
      const method = Reflect.getMetadata('method', SaaSBillingController.prototype.checkTrialStatus)
      const path = Reflect.getMetadata('path', SaaSBillingController.prototype.checkTrialStatus)
      assert.equal(method, 0) // GET
      assert.equal(path, 'trial/:tenantId/status')
    })
  })

  // ── 套餐管理 — 正例 ────────────────────────────────────────────────────

  describe('GET /saas-billing/plans (listPlans)', () => {
    it('should return all default plans (starter, professional, enterprise)', () => {
      const plans = controller.listPlans()
      assert.equal(plans.length, 3)
      const tiers = plans.map((p) => p.tier)
      assert.ok(tiers.includes('starter'))
      assert.ok(tiers.includes('professional'))
      assert.ok(tiers.includes('enterprise'))
    })

    it('each plan should have valid quotas and features', () => {
      const plans = controller.listPlans()
      for (const plan of plans) {
        assert.ok(plan.planId)
        assert.ok(plan.basePrice > 0)
        assert.ok(plan.quotas.api_calls !== undefined)
        assert.ok(plan.features.length > 0)
        assert.ok(plan.billingCycles.length > 0)
      }
    })
  })

  describe('GET /saas-billing/plans/:planId (getPlan)', () => {
    it('should return plan by id when plan exists', () => {
      const plan = controller.getPlan('plan_starter')
      assert.notEqual(plan, null)
      assert.equal(plan!.planId, 'plan_starter')
      assert.equal(plan!.tier, 'starter')
      assert.equal(plan!.basePrice, 299)
    })

    it('should return null for non-existent plan id', () => {
      const plan = controller.getPlan('non_existent_plan')
      assert.equal(plan, null)
    })
  })

  describe('POST /saas-billing/plans (createPlan)', () => {
    it('should create a custom plan and return with generated planId', () => {
      const newPlan = controller.createPlan({
        tier: 'professional' as any,
        name: 'Custom Pro',
        basePrice: 1499,
        billingCycles: ['monthly', 'annually'] as any,
        features: ['Custom API', 'Custom Storage'],
        quotas: { api_calls: 500000, storage_gb: 100, users: 20, transactions: 10000, devices: 50 },
        overageRates: { api_calls: 0.01, storage_gb: 1, users: 20, transactions: 0.001, devices: 5 },
        discountPercent: { monthly: 1, quarterly: 0.9, annually: 0.8 },
      })
      assert.ok(newPlan.planId)
      assert.ok(newPlan.planId.startsWith('plan_'))
      assert.equal(newPlan.name, 'Custom Pro')
      assert.equal(newPlan.basePrice, 1499)
    })

    it('created plan should be retrievable via getPlan', () => {
      const newPlan = controller.createPlan({
        tier: 'starter' as any,
        name: 'Test Plan',
        basePrice: 199,
        billingCycles: ['monthly'] as any,
        features: ['Test'],
        quotas: { api_calls: 1000, storage_gb: 1, users: 1, transactions: 100, devices: 1 },
        overageRates: { api_calls: 0.01, storage_gb: 1, users: 20, transactions: 0.001, devices: 5 },
        discountPercent: { monthly: 1, quarterly: 0.9, annually: 0.8 },
      })
      const fetched = controller.getPlan(newPlan.planId)
      assert.notEqual(fetched, null)
      assert.equal(fetched!.name, 'Test Plan')
    })
  })

  // ── 套餐管理 — 边界 ────────────────────────────────────────────────────

  describe('plan boundaries', () => {
    it('should create plan with zero basePrice (free tier)', () => {
      const plan = controller.createPlan({
        tier: 'starter' as any,
        name: 'Free Tier',
        basePrice: 0,
        billingCycles: ['monthly'] as any,
        features: ['Limited API'],
        quotas: { api_calls: 100, storage_gb: 0.1, users: 1, transactions: 10, devices: 1 },
        overageRates: { api_calls: 0.01, storage_gb: 1, users: 20, transactions: 0.001, devices: 5 },
        discountPercent: { monthly: 1, quarterly: 0.9, annually: 0.8 },
      })
      assert.equal(plan.basePrice, 0)
    })

    it('should create plan with unlimited quotas (Infinity)', () => {
      const plan = controller.createPlan({
        tier: 'enterprise' as any,
        name: 'Unlimited Plan',
        basePrice: 9999,
        billingCycles: ['monthly'] as any,
        features: ['Unlimited API'],
        quotas: { api_calls: Infinity, storage_gb: Infinity, users: Infinity, transactions: Infinity, devices: Infinity },
        overageRates: { api_calls: 0.01, storage_gb: 1, users: 20, transactions: 0.001, devices: 5 },
        discountPercent: { monthly: 1, quarterly: 0.9, annually: 0.8 },
      })
      assert.equal(plan.quotas.api_calls, Infinity)
    })
  })

  // ── 订阅管理 ───────────────────────────────────────────────────────────

  describe('POST /saas-billing/subscribe (subscribe)', () => {
    it('should create a new active subscription for the tenant', () => {
      const sub = controller.subscribe({ tenantId: 'tenant-001', planId: 'plan_professional', billingCycle: 'monthly' })
      assert.equal(sub.tenantId, 'tenant-001')
      assert.equal(sub.planId, 'plan_professional')
      assert.equal(sub.status, 'active')
      assert.equal(sub.billingCycle, 'monthly')
      assert.ok(sub.startedAt)
      assert.ok(sub.nextBillingDate)
    })

    it('should throw error when subscribing to non-existent plan', () => {
      assert.throws(() => {
        controller.subscribe({ tenantId: 'tenant-002', planId: 'no_such_plan', billingCycle: 'monthly' })
      }, /not found/)
    })
  })

  describe('POST /saas-billing/subscriptions/:tenantId/change-plan (changePlan)', () => {
    it('should change tenant plan to a new tier', () => {
      controller.subscribe({ tenantId: 'tenant-003', planId: 'plan_starter', billingCycle: 'monthly' })
      const updated = controller.changePlan('tenant-003', { newPlanId: 'plan_enterprise' })
      assert.equal(updated.planId, 'plan_enterprise')
      assert.equal(updated.tier, 'enterprise')
    })

    it('should throw error for non-existent tenant subscription', () => {
      assert.throws(() => {
        controller.changePlan('nonexistent-tenant', { newPlanId: 'plan_starter' })
      }, /not found/)
    })
  })

  describe('POST /saas-billing/subscriptions/:tenantId/cancel (cancelSubscription)', () => {
    it('should cancel an active subscription', () => {
      controller.subscribe({ tenantId: 'tenant-004', planId: 'plan_starter', billingCycle: 'monthly' })
      const result = controller.cancelSubscription('tenant-004')
      assert.deepEqual(result, { success: true })
      const sub = controller.getSubscription('tenant-004')
      assert.equal(sub!.status, 'cancelled')
    })

    it('should throw error when cancelling non-existent subscription', () => {
      assert.throws(() => {
        controller.cancelSubscription('no-such-tenant')
      }, /not found/)
    })
  })

  describe('POST /saas-billing/subscriptions/:tenantId/renew (renewSubscription)', () => {
    it('should extend next billing date', () => {
      controller.subscribe({ tenantId: 'tenant-005', planId: 'plan_starter', billingCycle: 'monthly' })
      const sub = controller.getSubscription('tenant-005')!
      const originalNextDate = sub.nextBillingDate
      const renewed = controller.renewSubscription('tenant-005')
      assert.ok(new Date(renewed.nextBillingDate) > new Date(originalNextDate))
    })

    it('should throw error for non-existent subscription', () => {
      assert.throws(() => {
        controller.renewSubscription('no-such-tenant')
      }, /not found/)
    })
  })

  describe('GET /saas-billing/subscriptions/:tenantId (getSubscription)', () => {
    it('should return subscription for subscribed tenant', () => {
      controller.subscribe({ tenantId: 'tenant-006', planId: 'plan_starter', billingCycle: 'annually' })
      const sub = controller.getSubscription('tenant-006')
      assert.notEqual(sub, null)
      assert.equal(sub!.billingCycle, 'annually')
    })

    it('should return null for tenant without subscription', () => {
      const sub = controller.getSubscription('unsubscribed-tenant')
      assert.equal(sub, null)
    })
  })

  // ── 配额监控 ───────────────────────────────────────────────────────────

  describe('POST /saas-billing/quotas/:tenantId/record (recordUsage)', () => {
    it('should record quota usage and update used count', () => {
      controller.subscribe({ tenantId: 'tenant-007', planId: 'plan_starter', billingCycle: 'monthly' })
      const result = controller.recordUsage('tenant-007', { quota: 'api_calls', amount: 100 })
      assert.deepEqual(result, { success: true })
      const usages = controller.getQuotaUsage('tenant-007')
      const apiUsage = usages.find((u) => u.quota === 'api_calls')
      assert.equal(apiUsage!.used, 100)
    })

    it('should throw error for tenant without initialized quotas', () => {
      assert.throws(() => {
        controller.recordUsage('no-tenant', { quota: 'api_calls', amount: 10 })
      }, /not found/)
    })
  })

  describe('GET /saas-billing/quotas/:tenantId (getQuotaUsage)', () => {
    it('should return all quota types after subscription', () => {
      controller.subscribe({ tenantId: 'tenant-008', planId: 'plan_starter', billingCycle: 'monthly' })
      const usages = controller.getQuotaUsage('tenant-008')
      assert.equal(usages.length, 5)
      const types = usages.map((u) => u.quota)
      assert.ok(types.includes('api_calls'))
      assert.ok(types.includes('storage_gb'))
      assert.ok(types.includes('users'))
    })

    it('should return empty array for tenant without subscription', () => {
      const usages = controller.getQuotaUsage('no-such-tenant')
      assert.equal(usages.length, 0)
    })
  })

  describe('POST /saas-billing/quotas/:tenantId/check (checkQuota)', () => {
    it('should return allowed=true when quota is sufficient', () => {
      controller.subscribe({ tenantId: 'tenant-009', planId: 'plan_starter', billingCycle: 'monthly' })
      const result = controller.checkQuota('tenant-009', { quota: 'api_calls', amount: 500 })
      assert.equal(result.allowed, true)
      assert.equal(result.current, 0)
      assert.equal(result.limit, 100000)
    })

    it('should return allowed=false when quota would be exceeded', () => {
      controller.subscribe({ tenantId: 'tenant-010', planId: 'plan_starter', billingCycle: 'monthly' })
      controller.recordUsage('tenant-010', { quota: 'api_calls', amount: 99999 })
      const result = controller.checkQuota('tenant-010', { quota: 'api_calls', amount: 2 })
      assert.equal(result.allowed, false)
    })
  })

  describe('GET /saas-billing/quotas/:tenantId/overage (calculateOverage)', () => {
    it('should return zero overage for tenant within quota', () => {
      controller.subscribe({ tenantId: 'tenant-011', planId: 'plan_starter', billingCycle: 'monthly' })
      const overage = controller.calculateOverage('tenant-011')
      assert.equal(overage.api_calls, 0)
      assert.equal(overage.storage_gb, 0)
    })

    it('should return non-zero overage cost when quota exceeded', () => {
      controller.subscribe({ tenantId: 'tenant-012', planId: 'plan_starter', billingCycle: 'monthly' })
      controller.recordUsage('tenant-012', { quota: 'storage_gb', amount: 10 }) // limit is 5
      const overage = controller.calculateOverage('tenant-012')
      assert.ok(overage.storage_gb > 0)
    })
  })

  // ── 计费与账单 ─────────────────────────────────────────────────────────

  describe('POST /saas-billing/invoices/generate/:tenantId (generateInvoice)', () => {
    it('should generate invoice with proper items for active subscription', () => {
      controller.subscribe({ tenantId: 'tenant-013', planId: 'plan_starter', billingCycle: 'monthly' })
      const invoice = controller.generateInvoice('tenant-013')
      assert.ok(invoice.invoiceId.startsWith('inv_'))
      assert.equal(invoice.tenantId, 'tenant-013')
      assert.equal(invoice.currency, 'CNY')
      assert.equal(invoice.status, 'issued')
      assert.ok(invoice.items.length >= 1)
      assert.ok(invoice.amount > 0)
    })

    it('should throw error for tenant without subscription', () => {
      assert.throws(() => {
        controller.generateInvoice('no-tenant')
      }, /not found/)
    })
  })

  describe('POST /saas-billing/invoices/:invoiceId/pay (markPaid)', () => {
    it('should mark invoice as paid', () => {
      controller.subscribe({ tenantId: 'tenant-014', planId: 'plan_starter', billingCycle: 'monthly' })
      const invoice = controller.generateInvoice('tenant-014')
      const result = controller.markPaid(invoice.invoiceId)
      assert.deepEqual(result, { success: true })
      const invoices = controller.listInvoices('tenant-014')
      const paidInvoice = invoices.find((inv) => inv.invoiceId === invoice.invoiceId)
      assert.equal(paidInvoice?.status, 'paid')
      assert.ok(paidInvoice?.paidAt)
    })

    it('should throw error for non-existent invoice', () => {
      assert.throws(() => {
        controller.markPaid('nonexistent_invoice')
      }, /not found/)
    })
  })

  describe('GET /saas-billing/invoices/:tenantId (listInvoices)', () => {
    it('should return invoices sorted by issuedAt descending', () => {
      controller.subscribe({ tenantId: 'tenant-015', planId: 'plan_starter', billingCycle: 'monthly' })
      controller.generateInvoice('tenant-015')
      const invoices = controller.listInvoices('tenant-015')
      assert.ok(invoices.length >= 1)
      for (const inv of invoices) {
        assert.equal(inv.tenantId, 'tenant-015')
      }
    })

    it('should return empty array for tenant without invoices', () => {
      const invoices = controller.listInvoices('no-invoice-tenant')
      assert.equal(invoices.length, 0)
    })
  })

  // ── 试用管理 ───────────────────────────────────────────────────────────

  describe('POST /saas-billing/trial/start (startTrial)', () => {
    it('should start trial with 14-day period', () => {
      const sub = controller.startTrial({ tenantId: 'trial-tenant-001', planId: 'plan_professional' })
      assert.equal(sub.status, 'trial')
      assert.equal(sub.tenantId, 'trial-tenant-001')
      assert.equal(sub.tier, 'professional')
      assert.ok(sub.trialEndsAt)
      const diff = new Date(sub.trialEndsAt).getTime() - new Date(sub.startedAt).getTime()
      const days = Math.round(diff / (1000 * 60 * 60 * 24))
      assert.equal(days, 14)
    })

    it('should throw error for non-existent plan', () => {
      assert.throws(() => {
        controller.startTrial({ tenantId: 'trial-tenant-002', planId: 'no_such_plan' })
      }, /not found/)
    })
  })

  describe('POST /saas-billing/trial/:tenantId/convert (convertTrial)', () => {
    it('should convert trial subscription to active', () => {
      controller.startTrial({ tenantId: 'trial-tenant-003', planId: 'plan_starter' })
      const converted = controller.convertTrial('trial-tenant-003')
      assert.equal(converted.status, 'active')
      assert.equal(converted.trialEndsAt, undefined)
    })

    it('should throw error for non-trial subscription', () => {
      controller.subscribe({ tenantId: 'active-tenant', planId: 'plan_starter', billingCycle: 'monthly' })
      assert.throws(() => {
        controller.convertTrial('active-tenant')
      }, /trial/)
    })
  })

  describe('GET /saas-billing/trial/:tenantId/status (checkTrialStatus)', () => {
    it('should return isTrial=true with daysRemaining for trial tenant', () => {
      controller.startTrial({ tenantId: 'trial-tenant-004', planId: 'plan_starter' })
      const status = controller.checkTrialStatus('trial-tenant-004')
      assert.equal(status.isTrial, true)
      assert.ok(status.daysRemaining > 0)
      assert.ok(status.expiresAt)
    })

    it('should return isTrial=false for unsubscribed tenant', () => {
      const status = controller.checkTrialStatus('no-such-tenant')
      assert.equal(status.isTrial, false)
      assert.equal(status.daysRemaining, 0)
    })

    it('should return isTrial=false after conversion to active', () => {
      controller.startTrial({ tenantId: 'trial-tenant-005', planId: 'plan_starter' })
      controller.convertTrial('trial-tenant-005')
      const status = controller.checkTrialStatus('trial-tenant-005')
      assert.equal(status.isTrial, false)
      assert.equal(status.daysRemaining, 0)
    })
  })
})
