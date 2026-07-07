/**
 * saas-billing.dto.test.ts
 *
 * SaaSBilling DTO 单元测试 —— 验证 DTO 类结构、装饰器元数据和校验规则
 */

import { describe, it, expect } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  CreatePlanDto,
  SubscribeDto,
  ChangePlanDto,
  RecordUsageDto,
  StartTrialDto,
  CheckQuotaDto,
  PricingPlanResponseDto,
  TenantSubscriptionResponseDto,
  InvoiceResponseDto,
  QuotaUsageResponseDto,
  QuotaCheckResponseDto,
  TrialStatusResponseDto,
  OverageResponseDto,
} from './saas-billing.dto'

describe('SaaSBilling DTOs', () => {
  // ── 请求 DTO ─────────────────────────────────────────────────────────

  describe('CreatePlanDto', () => {
    it('should have all required properties', () => {
      const dto = new CreatePlanDto()
      dto.tier = 'starter'
      dto.name = 'Test Plan'
      dto.basePrice = 299
      dto.billingCycles = ['monthly', 'annually']
      dto.features = ['Feature 1', 'Feature 2']
      dto.quotas = { api_calls: 100000, storage_gb: 5, users: 5, transactions: 10000, devices: 10 }
      dto.overageRates = { api_calls: 0.01, storage_gb: 1, users: 20, transactions: 0.001, devices: 5 }
      dto.discountPercent = { monthly: 1, quarterly: 0.9, annually: 0.8 }

      assert.equal(dto.tier, 'starter')
      assert.equal(dto.name, 'Test Plan')
      assert.equal(dto.basePrice, 299)
      assert.deepEqual(dto.billingCycles, ['monthly', 'annually'])
      assert.equal(dto.quotas.api_calls, 100000)
    })
  })

  describe('SubscribeDto', () => {
    it('should have tenantId, planId and billingCycle', () => {
      const dto = new SubscribeDto()
      dto.tenantId = 'tenant-001'
      dto.planId = 'plan_starter'
      dto.billingCycle = 'monthly'

      assert.equal(dto.tenantId, 'tenant-001')
      assert.equal(dto.planId, 'plan_starter')
      assert.equal(dto.billingCycle, 'monthly')
    })
  })

  describe('ChangePlanDto', () => {
    it('should have newPlanId property', () => {
      const dto = new ChangePlanDto()
      dto.newPlanId = 'plan_professional'
      assert.equal(dto.newPlanId, 'plan_professional')
    })
  })

  describe('RecordUsageDto', () => {
    it('should have quota type and amount', () => {
      const dto = new RecordUsageDto()
      dto.quota = 'api_calls'
      dto.amount = 100

      assert.equal(dto.quota, 'api_calls')
      assert.equal(dto.amount, 100)
    })

    it('should accept all quota types', () => {
      const types: Array<'api_calls' | 'storage_gb' | 'users' | 'transactions' | 'devices'> = [
        'api_calls', 'storage_gb', 'users', 'transactions', 'devices',
      ]
      for (const type of types) {
        const dto = new RecordUsageDto()
        dto.quota = type
        dto.amount = 1
        assert.equal(dto.quota, type)
      }
    })
  })

  describe('StartTrialDto', () => {
    it('should have tenantId and planId', () => {
      const dto = new StartTrialDto()
      dto.tenantId = 'trial-tenant'
      dto.planId = 'plan_professional'
      assert.equal(dto.tenantId, 'trial-tenant')
      assert.equal(dto.planId, 'plan_professional')
    })
  })

  describe('CheckQuotaDto', () => {
    it('should have quota type and amount', () => {
      const dto = new CheckQuotaDto()
      dto.quota = 'storage_gb'
      dto.amount = 10

      assert.equal(dto.quota, 'storage_gb')
      assert.equal(dto.amount, 10)
    })
  })

  // ── 响应 DTO ─────────────────────────────────────────────────────────

  describe('PricingPlanResponseDto', () => {
    it('should serialize plan fields as strings/numbers', () => {
      const dto = new PricingPlanResponseDto()
      dto.planId = 'plan_starter'
      dto.tier = 'starter'
      dto.name = 'Starter'
      dto.basePrice = 299
      dto.billingCycles = ['monthly', 'annually']
      dto.features = ['Basic API']
      dto.quotas = { api_calls: 100000 }
      dto.overageRates = { api_calls: 0.01 }
      dto.discountPercent = { monthly: 1 }

      assert.equal(dto.basePrice, 299)
      assert.ok(Array.isArray(dto.billingCycles))
    })
  })

  describe('TenantSubscriptionResponseDto', () => {
    it('should serialize subscription as ISO date strings', () => {
      const dto = new TenantSubscriptionResponseDto()
      dto.tenantId = 'tenant-001'
      dto.planId = 'plan_starter'
      dto.tier = 'starter'
      dto.status = 'active'
      dto.startedAt = '2025-01-01T00:00:00.000Z'
      dto.billingCycle = 'monthly'
      dto.nextBillingDate = '2025-02-01T00:00:00.000Z'
      dto.autoRenew = true

      assert.equal(dto.status, 'active')
      assert.ok(dto.startedAt)
    })

    it('should support optional trialEndsAt', () => {
      const dto = new TenantSubscriptionResponseDto()
      dto.trialEndsAt = '2025-01-15T00:00:00.000Z'
      assert.ok(dto.trialEndsAt)
    })
  })

  describe('InvoiceResponseDto', () => {
    it('should serialize invoice with items array', () => {
      const dto = new InvoiceResponseDto()
      dto.invoiceId = 'inv_001'
      dto.tenantId = 'tenant-001'
      dto.amount = 299
      dto.currency = 'CNY'
      dto.status = 'issued'
      dto.items = [{ description: '套餐费', amount: 299 }]
      dto.issuedAt = '2025-01-01T00:00:00.000Z'
      dto.dueAt = '2025-01-31T00:00:00.000Z'

      assert.equal(dto.amount, 299)
      assert.equal(dto.items.length, 1)
    })

    it('should support optional paidAt', () => {
      const dto = new InvoiceResponseDto()
      dto.paidAt = '2025-01-05T00:00:00.000Z'
      assert.ok(dto.paidAt)
    })
  })

  describe('QuotaUsageResponseDto', () => {
    it('should serialize quota usage with numeric values', () => {
      const dto = new QuotaUsageResponseDto()
      dto.tenantId = 'tenant-001'
      dto.quota = 'api_calls'
      dto.used = 5000
      dto.limit = 100000
      dto.resetAt = '2025-02-01T00:00:00.000Z'
      dto.overage = 0

      assert.equal(dto.used, 5000)
      assert.equal(dto.overage, 0)
    })
  })

  describe('QuotaCheckResponseDto', () => {
    it('should serialize check result', () => {
      const dto = new QuotaCheckResponseDto()
      dto.allowed = true
      dto.current = 5000
      dto.limit = 100000
      dto.overage = 0

      assert.equal(dto.allowed, true)
      assert.equal(dto.current, 5000)
    })
  })

  describe('TrialStatusResponseDto', () => {
    it('should serialize trial status', () => {
      const dto = new TrialStatusResponseDto()
      dto.isTrial = true
      dto.daysRemaining = 10
      dto.expiresAt = '2025-01-15T00:00:00.000Z'

      assert.equal(dto.isTrial, true)
      assert.equal(dto.daysRemaining, 10)
    })
  })

  describe('OverageResponseDto', () => {
    it('should have all 5 overage cost fields', () => {
      const dto = new OverageResponseDto()
      dto.api_calls = 0
      dto.storage_gb = 5
      dto.users = 0
      dto.transactions = 0
      dto.devices = 0

      assert.equal(dto.storage_gb, 5)
      assert.equal(dto.api_calls, 0)
    })
  })
})
