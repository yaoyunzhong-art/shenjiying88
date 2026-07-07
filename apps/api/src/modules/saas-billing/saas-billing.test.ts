import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { SaaSBillingService } from './saas-billing.service'

describe('SaaSBillingService', () => {
  let service: SaaSBillingService

  beforeEach(() => {
    service = new SaaSBillingService()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── 套餐管理 Tests ──────────────────────────────────────────────────────

  describe('Plan Management', () => {
    it('should list default plans', () => {
      const plans = service.listPlans()
      expect(plans).toHaveLength(3)
      expect(plans.map((p) => p.tier)).toEqual(['starter', 'professional', 'enterprise'])
    })

    it('should get plan by id', () => {
      const plan = service.getPlan('plan_starter')
      expect(plan).not.toBeNull()
      expect(plan!.name).toBe('Starter')
      expect(plan!.basePrice).toBe(299)
    })

    it('should return null for non-existent plan', () => {
      const plan = service.getPlan('non_existent')
      expect(plan).toBeNull()
    })

    it('should create a new plan', () => {
      const newPlan = service.createPlan({
        tier: 'professional',
        name: 'Custom Plan',
        basePrice: 599,
        billingCycles: ['monthly'],
        features: ['Custom Feature'],
        quotas: {
          api_calls: 500000,
          storage_gb: 20,
          users: 20,
          transactions: Infinity,
          devices: 50,
        },
        overageRates: {
          api_calls: 0.01,
          storage_gb: 1,
          users: 20,
          transactions: 0.001,
          devices: 5,
        },
        discountPercent: {
          monthly: 1,
          quarterly: 0.9,
          annually: 0.8,
        },
      })

      expect(newPlan.planId).toBeTruthy()
      expect(newPlan.name).toBe('Custom Plan')
      expect(newPlan.basePrice).toBe(599)
    })

    it('should get created plan by id', () => {
      const newPlan = service.createPlan({
        tier: 'starter',
        name: 'Test Plan',
        basePrice: 199,
        billingCycles: ['monthly'],
        features: [],
        quotas: {
          api_calls: 50000,
          storage_gb: 2,
          users: 2,
          transactions: Infinity,
          devices: 5,
        },
        overageRates: {
          api_calls: 0.01,
          storage_gb: 1,
          users: 20,
          transactions: 0.001,
          devices: 5,
        },
        discountPercent: {
          monthly: 1,
          quarterly: 0.9,
          annually: 0.8,
        },
      })

      const retrieved = service.getPlan(newPlan.planId)
      expect(retrieved).not.toBeNull()
      expect(retrieved!.name).toBe('Test Plan')
    })
  })

  // ── 订阅管理 Tests ──────────────────────────────────────────────────────

  describe('Subscription Management', () => {
    it('should subscribe to a plan', () => {
      const subscription = service.subscribe('tenant_1', 'plan_starter', 'monthly')

      expect(subscription.tenantId).toBe('tenant_1')
      expect(subscription.planId).toBe('plan_starter')
      expect(subscription.tier).toBe('starter')
      expect(subscription.status).toBe('active')
      expect(subscription.billingCycle).toBe('monthly')
      expect(subscription.autoRenew).toBe(true)
    })

    it('should get subscription after subscribe', () => {
      service.subscribe('tenant_1', 'plan_starter', 'monthly')
      const subscription = service.getSubscription('tenant_1')

      expect(subscription).not.toBeNull()
      expect(subscription!.tenantId).toBe('tenant_1')
    })

    it('should throw error for non-existent plan when subscribing', () => {
      expect(() => {
        service.subscribe('tenant_1', 'non_existent_plan', 'monthly')
      }).toThrow('Plan non_existent_plan not found')
    })

    it('should upgrade plan', () => {
      service.subscribe('tenant_1', 'plan_starter', 'monthly')
      const upgraded = service.changePlan('tenant_1', 'plan_professional')

      expect(upgraded.planId).toBe('plan_professional')
      expect(upgraded.tier).toBe('professional')
    })

    it('should throw error when changing plan without subscription', () => {
      expect(() => {
        service.changePlan('tenant_non_existent', 'plan_professional')
      }).toThrow('Subscription for tenant tenant_non_existent not found')
    })

    it('should cancel subscription', () => {
      service.subscribe('tenant_1', 'plan_starter', 'monthly')
      service.cancelSubscription('tenant_1')

      const subscription = service.getSubscription('tenant_1')
      expect(subscription!.status).toBe('cancelled')
    })

    it('should renew subscription and update nextBillingDate', () => {
      const beforeRenew = new Date('2025-01-15')
      service.subscribe('tenant_1', 'plan_starter', 'monthly')

      const subscription = service.getSubscription('tenant_1')!
      const beforeDate = subscription.nextBillingDate

      vi.advanceTimersByTime(1000 * 60 * 60 * 24 * 30)
      const renewed = service.renew('tenant_1')

      expect(renewed.nextBillingDate.getTime()).toBeGreaterThan(beforeDate.getTime())
    })

    it('should initialize quota usage after subscription', () => {
      service.subscribe('tenant_1', 'plan_starter', 'monthly')
      const usage = service.getQuotaUsage('tenant_1')

      expect(usage).toHaveLength(5)
      const apiUsage = usage.find((u) => u.quota === 'api_calls')
      expect(apiUsage!.limit).toBe(100000)
      expect(apiUsage!.used).toBe(0)
    })
  })

  // ── 配额监控 Tests ──────────────────────────────────────────────────────

  describe('Quota Monitoring', () => {
    beforeEach(() => {
      service.subscribe('tenant_1', 'plan_starter', 'monthly')
    })

    it('should record usage', () => {
      service.recordUsage('tenant_1', 'api_calls', 5000)
      const usage = service.getQuotaUsage('tenant_1')
      const apiUsage = usage.find((u) => u.quota === 'api_calls')

      expect(apiUsage!.used).toBe(5000)
      expect(apiUsage!.overage).toBe(0)
    })

    it('should calculate overage when usage exceeds limit', () => {
      service.recordUsage('tenant_1', 'api_calls', 150000)
      const usage = service.getQuotaUsage('tenant_1')
      const apiUsage = usage.find((u) => u.quota === 'api_calls')

      expect(apiUsage!.overage).toBe(50000)
    })

    it('should check quota and allow when under limit', () => {
      service.recordUsage('tenant_1', 'api_calls', 5000)
      const result = service.checkQuota('tenant_1', 'api_calls', 5000)

      expect(result.allowed).toBe(true)
      expect(result.current).toBe(5000)
      expect(result.limit).toBe(100000)
      expect(result.overage).toBe(0)
    })

    it('should check quota and deny when would exceed limit', () => {
      service.recordUsage('tenant_1', 'api_calls', 95000)
      const result = service.checkQuota('tenant_1', 'api_calls', 10000)

      expect(result.allowed).toBe(false)
      expect(result.current).toBe(95000)
    })

    it('should calculate overage costs', () => {
      service.recordUsage('tenant_1', 'api_calls', 150000)
      const overage = service.calculateOverage('tenant_1')

      expect(overage.api_calls).toBe(50000 * 0.01)
      expect(overage.storage_gb).toBe(0)
    })

    it('should calculate multiple overage types', () => {
      service.recordUsage('tenant_1', 'api_calls', 150000)
      service.recordUsage('tenant_1', 'users', 8)
      const overage = service.calculateOverage('tenant_1')

      expect(overage.api_calls).toBe(50000 * 0.01)
      expect(overage.users).toBe(3 * 20)
    })
  })

  // ── 计费与账单 Tests ────────────────────────────────────────────────────

  describe('Billing & Invoices', () => {
    beforeEach(() => {
      service.subscribe('tenant_1', 'plan_starter', 'monthly')
    })

    it('should generate invoice with correct base amount', () => {
      const invoice = service.generateInvoice('tenant_1')

      expect(invoice.invoiceId).toBeTruthy()
      expect(invoice.tenantId).toBe('tenant_1')
      expect(invoice.currency).toBe('CNY')
      expect(invoice.status).toBe('issued')
      expect(invoice.amount).toBe(299)
      expect(invoice.items).toHaveLength(1)
    })

    it('should generate invoice with overage deduction', () => {
      service.recordUsage('tenant_1', 'api_calls', 110000)
      service.recordUsage('tenant_1', 'users', 7)

      const invoice = service.generateInvoice('tenant_1')

      const baseAmount = 299
      const apiOverage = 10000 * 0.01
      const usersOverage = 2 * 20
      const expectedAmount = baseAmount - apiOverage - usersOverage

      expect(invoice.amount).toBeCloseTo(expectedAmount)
      expect(invoice.items).toHaveLength(3)
    })

    it('should apply quarterly discount (10% off)', () => {
      service.cancelSubscription('tenant_1')
      service.subscribe('tenant_1', 'plan_starter', 'quarterly')

      const invoice = service.generateInvoice('tenant_1')
      expect(invoice.amount).toBeCloseTo(299 * 0.9)
    })

    it('should apply annual discount (20% off)', () => {
      service.cancelSubscription('tenant_1')
      service.subscribe('tenant_1', 'plan_starter', 'annually')

      const invoice = service.generateInvoice('tenant_1')
      expect(invoice.amount).toBeCloseTo(299 * 0.8)
    })

    it('should mark invoice as paid', () => {
      const invoice = service.generateInvoice('tenant_1')
      service.markPaid(invoice.invoiceId)

      const updated = service.listInvoices('tenant_1')[0]
      expect(updated.status).toBe('paid')
      expect(updated.paidAt).toBeInstanceOf(Date)
    })

    it('should list invoices for tenant', () => {
      service.generateInvoice('tenant_1')
      service.generateInvoice('tenant_1')

      const invoices = service.listInvoices('tenant_1')
      expect(invoices).toHaveLength(2)
    })
  })

  // ── 试用管理 Tests ──────────────────────────────────────────────────────

  describe('Trial Management', () => {
    it('should start trial', () => {
      const subscription = service.startTrial('tenant_1', 'plan_professional')

      expect(subscription.status).toBe('trial')
      expect(subscription.tier).toBe('professional')
      expect(subscription.trialEndsAt).toBeInstanceOf(Date)
      expect(subscription.trialEndsAt!.getTime()).toBe(
        new Date('2025-01-29').getTime(),
      )
    })

    it('should check trial status', () => {
      service.startTrial('tenant_1', 'plan_professional')

      const status = service.checkTrialStatus('tenant_1')

      expect(status.isTrial).toBe(true)
      expect(status.daysRemaining).toBe(14)
    })

    it('should return correct days remaining after time passes', () => {
      service.startTrial('tenant_1', 'plan_professional')
      vi.advanceTimersByTime(1000 * 60 * 60 * 24 * 5)

      const status = service.checkTrialStatus('tenant_1')
      expect(status.daysRemaining).toBe(9)
    })

    it('should convert trial to active subscription', () => {
      service.startTrial('tenant_1', 'plan_professional')
      const converted = service.convertTrial('tenant_1')

      expect(converted.status).toBe('active')
      expect(converted.trialEndsAt).toBeUndefined()
    })

    it('should throw error when converting non-trial subscription', () => {
      service.subscribe('tenant_1', 'plan_professional', 'monthly')

      expect(() => {
        service.convertTrial('tenant_1')
      }).toThrow('Only trial subscriptions can be converted')
    })

    it('should return not in trial for non-existent tenant', () => {
      const status = service.checkTrialStatus('tenant_non_existent')
      expect(status.isTrial).toBe(false)
      expect(status.daysRemaining).toBe(0)
    })

    it('should initialize quota usage on trial start', () => {
      service.startTrial('tenant_1', 'plan_starter')
      const usage = service.getQuotaUsage('tenant_1')

      expect(usage).toHaveLength(5)
    })
  })
})
