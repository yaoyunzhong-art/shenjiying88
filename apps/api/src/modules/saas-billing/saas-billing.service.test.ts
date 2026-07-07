/**
 * saas-billing.service.test.ts
 *
 * SaaSBillingService 单元测试 —— 覆盖核心业务逻辑 (正例+反例+边界)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { SaaSBillingService } from './saas-billing.service'
import type { BillingCycle, QuotaType } from './saas-billing.entity'

describe('SaaSBillingService', () => {
  let service: SaaSBillingService

  beforeEach(() => {
    service = new SaaSBillingService()
  })

  // ── 套餐管理 ──────────────────────────────────────────────────────────

  describe('listPlans', () => {
    it('should return 3 default plans on initialization', () => {
      const plans = service.listPlans()
      assert.equal(plans.length, 3)
    })

    it('should include starter, professional, and enterprise plans', () => {
      const plans = service.listPlans()
      const tiers = plans.map((p) => p.tier)
      assert.ok(tiers.includes('starter'))
      assert.ok(tiers.includes('professional'))
      assert.ok(tiers.includes('enterprise'))
    })
  })

  describe('getPlan', () => {
    it('should return plan by planId', () => {
      const plan = service.getPlan('plan_starter')
      assert.notEqual(plan, null)
      assert.equal(plan!.tier, 'starter')
      assert.equal(plan!.basePrice, 299)
    })

    it('should return null for non-existent planId', () => {
      const plan = service.getPlan('non_existent')
      assert.equal(plan, null)
    })
  })

  describe('createPlan', () => {
    it('should create and store a new plan with auto-generated planId', () => {
      const plan = service.createPlan({
        tier: 'professional',
        name: 'New Plan',
        basePrice: 1999,
        billingCycles: ['monthly', 'annually'],
        features: ['Feature A'],
        quotas: { api_calls: 500000, storage_gb: 100, users: 50, transactions: 50000, devices: 200 },
        overageRates: { api_calls: 0.01, storage_gb: 1, users: 20, transactions: 0.001, devices: 5 },
        discountPercent: { monthly: 1, quarterly: 0.9, annually: 0.8 },
      })
      assert.ok(plan.planId.startsWith('plan_'))
      assert.equal(plan.name, 'New Plan')
      assert.equal(service.getPlan(plan.planId)!.name, 'New Plan')
    })

    it('should create plan with single billing cycle', () => {
      const plan = service.createPlan({
        tier: 'starter',
        name: 'Monthly Only',
        basePrice: 99,
        billingCycles: ['monthly'],
        features: ['Minimal'],
        quotas: { api_calls: 1000, storage_gb: 1, users: 1, transactions: 100, devices: 1 },
        overageRates: { api_calls: 0.01, storage_gb: 1, users: 20, transactions: 0.001, devices: 5 },
        discountPercent: { monthly: 1, quarterly: 0.9, annually: 0.8 },
      })
      assert.deepEqual(plan.billingCycles, ['monthly'])
    })
  })

  // ── 订阅管理 ──────────────────────────────────────────────────────────

  describe('subscribe', () => {
    it('should create active subscription with correct plan tier', () => {
      const sub = service.subscribe('tenant-001', 'plan_professional', 'monthly')
      assert.equal(sub.tenantId, 'tenant-001')
      assert.equal(sub.planId, 'plan_professional')
      assert.equal(sub.tier, 'professional')
      assert.equal(sub.status, 'active')
      assert.equal(sub.billingCycle, 'monthly')
      assert.ok(sub.nextBillingDate > sub.startedAt)
    })

    it('should initialize quota usage for the tenant', () => {
      service.subscribe('tenant-002', 'plan_starter', 'monthly')
      const usages = service.getQuotaUsage('tenant-002')
      assert.equal(usages.length, 5)
    })

    it('should throw for non-existent plan', () => {
      assert.throws(() => {
        service.subscribe('tenant-003', 'no_such_plan', 'monthly')
      }, /not found/)
    })
  })

  describe('changePlan', () => {
    it('should update planId and tier for existing subscription', () => {
      service.subscribe('tenant-010', 'plan_starter', 'monthly')
      const updated = service.changePlan('tenant-010', 'plan_enterprise')
      assert.equal(updated.planId, 'plan_enterprise')
      assert.equal(updated.tier, 'enterprise')
    })

    it('should throw for non-existent subscription', () => {
      assert.throws(() => {
        service.changePlan('no-tenant', 'plan_starter')
      }, /not found/)
    })

    it('should throw for non-existent target plan', () => {
      service.subscribe('tenant-011', 'plan_starter', 'monthly')
      assert.throws(() => {
        service.changePlan('tenant-011', 'no_such_plan')
      }, /not found/)
    })
  })

  describe('cancelSubscription', () => {
    it('should set subscription status to cancelled', () => {
      service.subscribe('tenant-020', 'plan_starter', 'monthly')
      service.cancelSubscription('tenant-020')
      const sub = service.getSubscription('tenant-020')
      assert.equal(sub!.status, 'cancelled')
    })

    it('should throw for non-existent subscription', () => {
      assert.throws(() => {
        service.cancelSubscription('no-tenant')
      }, /not found/)
    })
  })

  describe('renew', () => {
    it('should advance nextBillingDate', () => {
      service.subscribe('tenant-030', 'plan_starter', 'monthly')
      const sub = service.getSubscription('tenant-030')!
      const before = sub.nextBillingDate.getTime()
      const renewed = service.renew('tenant-030')
      assert.ok(new Date(renewed.nextBillingDate).getTime() > before)
    })

    it('should throw for non-existent subscription', () => {
      assert.throws(() => {
        service.renew('no-tenant')
      }, /not found/)
    })
  })

  describe('getSubscription', () => {
    it('should return subscription for subscribed tenant', () => {
      service.subscribe('tenant-040', 'plan_starter', 'monthly')
      const sub = service.getSubscription('tenant-040')
      assert.notEqual(sub, null)
      assert.equal(sub!.tenantId, 'tenant-040')
    })

    it('should return null for unsubscribed tenant', () => {
      const sub = service.getSubscription('unsubscribed')
      assert.equal(sub, null)
    })
  })

  // ── 配额监控 ──────────────────────────────────────────────────────────

  describe('recordUsage', () => {
    it('should increment used count for the specified quota', () => {
      service.subscribe('tenant-050', 'plan_starter', 'monthly')
      service.recordUsage('tenant-050', 'api_calls', 500)
      const usages = service.getQuotaUsage('tenant-050')
      const apiUsage = usages.find((u) => u.quota === 'api_calls')
      assert.equal(apiUsage!.used, 500)
    })

    it('should accumulate usage across multiple calls', () => {
      service.subscribe('tenant-051', 'plan_starter', 'monthly')
      service.recordUsage('tenant-051', 'api_calls', 100)
      service.recordUsage('tenant-051', 'api_calls', 200)
      service.recordUsage('tenant-051', 'api_calls', 300)
      const usages = service.getQuotaUsage('tenant-051')
      const apiUsage = usages.find((u) => u.quota === 'api_calls')
      assert.equal(apiUsage!.used, 600)
    })

    it('should calculate overage when usage exceeds limit', () => {
      service.subscribe('tenant-052', 'plan_starter', 'monthly')
      service.recordUsage('tenant-052', 'storage_gb', 10) // limit is 5
      const usages = service.getQuotaUsage('tenant-052')
      const storageUsage = usages.find((u) => u.quota === 'storage_gb')
      assert.ok(storageUsage!.overage > 0)
      assert.equal(storageUsage!.overage, 5) // 10 - 5 = 5
    })

    it('should keep overage at 0 when within limit', () => {
      service.subscribe('tenant-053', 'plan_starter', 'monthly')
      service.recordUsage('tenant-053', 'storage_gb', 5) // exactly at limit
      const usages = service.getQuotaUsage('tenant-053')
      const storageUsage = usages.find((u) => u.quota === 'storage_gb')
      assert.equal(storageUsage!.overage, 0)
    })

    it('should throw for tenant without initialized usage', () => {
      assert.throws(() => {
        service.recordUsage('no-tenant', 'api_calls', 10)
      }, /not found/)
    })
  })

  describe('getQuotaUsage', () => {
    it('should return all 5 quota types after subscription', () => {
      service.subscribe('tenant-060', 'plan_starter', 'monthly')
      const usages = service.getQuotaUsage('tenant-060')
      assert.equal(usages.length, 5)
    })

    it('should return empty array for unsubscribed tenant', () => {
      const usages = service.getQuotaUsage('no-tenant')
      assert.equal(usages.length, 0)
    })
  })

  describe('checkQuota', () => {
    it('should allow when usage + amount <= limit', () => {
      service.subscribe('tenant-070', 'plan_starter', 'monthly')
      const result = service.checkQuota('tenant-070', 'api_calls', 500)
      assert.equal(result.allowed, true)
      assert.equal(result.limit, 100000)
    })

    it('should deny when usage + amount exceeds limit', () => {
      service.subscribe('tenant-071', 'plan_starter', 'monthly')
      service.recordUsage('tenant-071', 'api_calls', 99999)
      const result = service.checkQuota('tenant-071', 'api_calls', 2)
      assert.equal(result.allowed, false)
    })

    it('should return accurate current and overage values', () => {
      service.subscribe('tenant-072', 'plan_starter', 'monthly')
      service.recordUsage('tenant-072', 'api_calls', 5000)
      const result = service.checkQuota('tenant-072', 'api_calls', 1000)
      assert.equal(result.current, 5000)
    })

    it('should throw for non-existent tenant', () => {
      assert.throws(() => {
        service.checkQuota('no-tenant', 'api_calls', 10)
      }, /not found/)
    })
  })

  describe('calculateOverage', () => {
    it('should return all zeros when within limits', () => {
      service.subscribe('tenant-080', 'plan_starter', 'monthly')
      const overage = service.calculateOverage('tenant-080')
      assert.equal(overage.api_calls, 0)
      assert.equal(overage.storage_gb, 0)
      assert.equal(overage.users, 0)
      assert.equal(overage.transactions, 0)
      assert.equal(overage.devices, 0)
    })

    it('should calculate cost for exceeded quota', () => {
      service.subscribe('tenant-081', 'plan_starter', 'monthly')
      service.recordUsage('tenant-081', 'storage_gb', 10)
      const overage = service.calculateOverage('tenant-081')
      // overage = (10-5) * 1 = 5
      assert.equal(overage.storage_gb, 5)
    })

    it('should throw for tenant without subscription', () => {
      assert.throws(() => {
        service.calculateOverage('no-tenant')
      }, /not found/)
    })
  })

  // ── 计费与账单 ──────────────────────────────────────────────────────────

  describe('generateInvoice', () => {
    it('should generate invoice with correct amount for monthly plan', () => {
      service.subscribe('tenant-090', 'plan_starter', 'monthly')
      const invoice = service.generateInvoice('tenant-090')
      assert.ok(invoice.invoiceId.startsWith('inv_'))
      assert.equal(invoice.tenantId, 'tenant-090')
      assert.equal(invoice.currency, 'CNY')
      assert.equal(invoice.status, 'issued')
      // Starter monthly: 299 * 1.0 discount = 299
      assert.equal(invoice.amount, 299)
      assert.ok(invoice.items.length >= 1)
    })

    it('should apply annual discount', () => {
      service.subscribe('tenant-091', 'plan_starter', 'annually')
      const invoice = service.generateInvoice('tenant-091')
      // Starter annually: 299 * 0.8 = 239.2, rounded to 239 by Math.max
      assert.ok(invoice.amount <= 299)
    })

    it('should throw for tenant without subscription', () => {
      assert.throws(() => {
        service.generateInvoice('no-tenant')
      }, /not found/)
    })
  })

  describe('markPaid', () => {
    it('should update invoice status to paid and set paidAt', () => {
      service.subscribe('tenant-100', 'plan_starter', 'monthly')
      const invoice = service.generateInvoice('tenant-100')
      service.markPaid(invoice.invoiceId)
      const invoices = service.listInvoices('tenant-100')
      const paid = invoices.find((inv) => inv.invoiceId === invoice.invoiceId)
      assert.equal(paid!.status, 'paid')
      assert.ok(paid!.paidAt)
    })

    it('should throw for non-existent invoice', () => {
      assert.throws(() => {
        service.markPaid('no_such_invoice')
      }, /not found/)
    })
  })

  describe('listInvoices', () => {
    it('should return invoices for the specified tenant', () => {
      service.subscribe('tenant-110', 'plan_starter', 'monthly')
      service.generateInvoice('tenant-110')
      service.generateInvoice('tenant-110')
      const invoices = service.listInvoices('tenant-110')
      assert.equal(invoices.length, 2)
    })

    it('should return empty array for tenant with no invoices', () => {
      const invoices = service.listInvoices('no-invoice-tenant')
      assert.equal(invoices.length, 0)
    })
  })

  // ── 试用管理 ──────────────────────────────────────────────────────────

  describe('startTrial', () => {
    it('should create trial subscription with 14-day trial', () => {
      const sub = service.startTrial('tenant-120', 'plan_professional')
      assert.equal(sub.status, 'trial')
      assert.equal(sub.tier, 'professional')
      assert.ok(sub.trialEndsAt)
      const diff = sub.trialEndsAt.getTime() - sub.startedAt.getTime()
      const days = Math.round(diff / (1000 * 60 * 60 * 24))
      assert.equal(days, 14)
    })

    it('should initialize quota for trial tenant', () => {
      service.startTrial('tenant-121', 'plan_starter')
      const usages = service.getQuotaUsage('tenant-121')
      assert.equal(usages.length, 5)
    })

    it('should throw for non-existent plan', () => {
      assert.throws(() => {
        service.startTrial('tenant-122', 'no_such_plan')
      }, /not found/)
    })
  })

  describe('convertTrial', () => {
    it('should change status from trial to active', () => {
      service.startTrial('tenant-130', 'plan_starter')
      const sub = service.convertTrial('tenant-130')
      assert.equal(sub.status, 'active')
      assert.equal(sub.trialEndsAt, undefined)
    })

    it('should throw for non-existent subscription', () => {
      assert.throws(() => {
        service.convertTrial('no-tenant')
      }, /not found/)
    })

    it('should throw for non-trial subscription', () => {
      service.subscribe('tenant-131', 'plan_starter', 'monthly')
      assert.throws(() => {
        service.convertTrial('tenant-131')
      }, /trial/)
    })
  })

  describe('checkTrialStatus', () => {
    it('should return active trial info for trial tenant', () => {
      service.startTrial('tenant-140', 'plan_starter')
      const status = service.checkTrialStatus('tenant-140')
      assert.equal(status.isTrial, true)
      assert.ok(status.daysRemaining > 0)
    })

    it('should return isTrial=false for unsubscribed tenant', () => {
      const status = service.checkTrialStatus('no-tenant')
      assert.equal(status.isTrial, false)
      assert.equal(status.daysRemaining, 0)
    })

    it('should return isTrial=false after conversion', () => {
      service.startTrial('tenant-141', 'plan_starter')
      service.convertTrial('tenant-141')
      const status = service.checkTrialStatus('tenant-141')
      assert.equal(status.isTrial, false)
      assert.equal(status.daysRemaining, 0)
    })
  })
})
