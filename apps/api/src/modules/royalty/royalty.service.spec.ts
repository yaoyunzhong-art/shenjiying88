/**
 * royalty.service.spec.ts - RoyaltyService 单元测试 (V2)
 *
 * 15+ tests covering:
 * - create/find/update/delete royalty rules
 * - calculate royalty (RevenueShare / FixedAmount / Tiered)
 * - calculation queries and bulk settlement
 * - error/edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { RoyaltyService, type CreateRoyaltyRuleInput } from './royalty.service'
import { RoyaltyType, RoyaltyStatus } from './royalty.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

const TENANT: RequestTenantContext = { tenantId: 'tenant-test' }
const ANOTHER_TENANT: RequestTenantContext = { tenantId: 'tenant-other' }

function makeService(): RoyaltyService {
  RoyaltyService._resetStoreForTest()
  return new RoyaltyService()
}

function makeRuleInput(overrides: Partial<CreateRoyaltyRuleInput> = {}): CreateRoyaltyRuleInput {
  return {
    tenantContext: TENANT,
    brandId: 'brand-001',
    name: '测试分润规则',
    royaltyType: RoyaltyType.RevenueShare,
    rate: 10,
    fixedAmount: 0,
    effectiveDate: '2026-01-01T00:00:00Z',
    description: '测试用规则',
    ...overrides,
  }
}

describe('RoyaltyService', () => {
  let svc: RoyaltyService

  beforeEach(() => {
    svc = makeService()
  })

  // ─── 1. 规则 CRUD ─────────────────────────────

  describe('createRule / findRuleById', () => {
    it('创建 RevenueShare 规则成功', () => {
      const rule = svc.createRule(makeRuleInput())
      expect(rule.ruleId).toBeTruthy()
      expect(rule.royaltyType).toBe(RoyaltyType.RevenueShare)
      expect(rule.rate).toBe(10)
      expect(rule.status).toBe(RoyaltyStatus.Active)
    })

    it('创建 FixedAmount 规则成功', () => {
      const rule = svc.createRule(makeRuleInput({
        royaltyType: RoyaltyType.FixedAmount,
        rate: 0,
        fixedAmount: 50000,
      }))
      expect(rule.royaltyType).toBe(RoyaltyType.FixedAmount)
      expect(rule.fixedAmount).toBe(50000)
    })

    it('创建 Tiered 规则成功', () => {
      const rule = svc.createRule(makeRuleInput({
        royaltyType: RoyaltyType.Tiered,
        rate: 5,
        tierConfig: JSON.stringify([{ min: 0, max: 100000, rate: 5 }, { min: 100000, max: -1, rate: 8 }]),
      }))
      expect(rule.royaltyType).toBe(RoyaltyType.Tiered)
      expect(rule.tierConfig).toBeTruthy()
    })

    it('findRuleById 跨租户隔离', () => {
      const rule = svc.createRule(makeRuleInput())
      expect(svc.findRuleById(rule.ruleId, 'tenant-test')).toBeDefined()
      expect(svc.findRuleById(rule.ruleId, 'tenant-other')).toBeUndefined()
    })

    it('RevenueShare rate 为 0 时抛错', () => {
      expect(() => svc.createRule(makeRuleInput({ royaltyType: RoyaltyType.RevenueShare, rate: 0 }))).toThrow()
    })

    it('FixedAmount fixedAmount ≤ 0 时抛错', () => {
      expect(() => svc.createRule(makeRuleInput({ royaltyType: RoyaltyType.FixedAmount, rate: 0, fixedAmount: 0 }))).toThrow()
    })

    it('rate 超出范围抛错', () => {
      expect(() => svc.createRule(makeRuleInput({ rate: 101 }))).toThrow()
      expect(() => svc.createRule(makeRuleInput({ rate: -1 }))).toThrow()
    })

    it('expirationDate 早于 effectiveDate 抛错', () => {
      expect(() => svc.createRule(makeRuleInput({ effectiveDate: '2026-06-01', expirationDate: '2026-01-01' }))).toThrow()
    })
  })

  // ─── 2. 规则查询/更新/删除 ─────────────────────

  describe('findAllRules / updateRule / deleteRule', () => {
    it('findAllRules 返回租户下所有规则', () => {
      svc.createRule(makeRuleInput({ name: '规则A' }))
      svc.createRule(makeRuleInput({ name: '规则B' }))
      svc.createRule(makeRuleInput({ tenantContext: ANOTHER_TENANT, brandId: 'other-brand', name: '其他租户' }))
      const rules = svc.findAllRules('tenant-test')
      expect(rules.length).toBe(2)
    })

    it('findAllRules 按 brandId 过滤', () => {
      svc.createRule(makeRuleInput({ brandId: 'brand-A' }))
      svc.createRule(makeRuleInput({ brandId: 'brand-B' }))
      expect(svc.findAllRules('tenant-test', { brandId: 'brand-A' }).length).toBe(1)
    })

    it('findAllRules 按 status 过滤', () => {
      const rule = svc.createRule(makeRuleInput())
      svc.updateRule(rule.ruleId, 'tenant-test', { status: RoyaltyStatus.Inactive })
      expect(svc.findAllRules('tenant-test', { status: RoyaltyStatus.Inactive }).length).toBe(1)
      expect(svc.findAllRules('tenant-test', { status: RoyaltyStatus.Active }).length).toBe(0)
    })

    it('updateRule 修改名称和描述', () => {
      const rule = svc.createRule(makeRuleInput())
      const updated = svc.updateRule(rule.ruleId, 'tenant-test', { name: '新名称', description: '新描述' })
      expect(updated.name).toBe('新名称')
      expect(updated.description).toBe('新描述')
    })

    it('updateRule 跨租户抛错', () => {
      const rule = svc.createRule(makeRuleInput())
      expect(() => svc.updateRule(rule.ruleId, 'tenant-other', { name: 'hack' })).toThrow()
    })

    it('deleteRule 删除成功', () => {
      const rule = svc.createRule(makeRuleInput())
      svc.deleteRule(rule.ruleId, 'tenant-test')
      expect(svc.findRuleById(rule.ruleId, 'tenant-test')).toBeUndefined()
    })

    it('deleteRule 跨租户抛错', () => {
      const rule = svc.createRule(makeRuleInput())
      expect(() => svc.deleteRule(rule.ruleId, 'tenant-other')).toThrow()
    })
  })

  // ─── 3. 分润计算 ──────────────────────────────

  describe('calculate', () => {
    it('RevenueShare 按比例计算', () => {
      svc.createRule(makeRuleInput({ royaltyType: RoyaltyType.RevenueShare, rate: 10 }))
      const calc = svc.calculate({ brandId: 'brand-001', orderId: 'order-001', orderAmount: 500000 }, 'tenant-test')
      expect(calc.royaltyAmount).toBe(50000) // 500000 * 10%
      expect(calc.appliedRate).toBe(10)
    })

    it('FixedAmount 返回固定金额', () => {
      svc.createRule(makeRuleInput({ royaltyType: RoyaltyType.FixedAmount, rate: 0, fixedAmount: 30000 }))
      const calc = svc.calculate({ brandId: 'brand-001', orderId: 'order-002', orderAmount: 100000 }, 'tenant-test')
      expect(calc.royaltyAmount).toBe(30000)
    })

    it('Tiered 匹配第一阶梯', () => {
      svc.createRule(makeRuleInput({
        royaltyType: RoyaltyType.Tiered,
        rate: 5,
        tierConfig: JSON.stringify([{ min: 0, max: 100000, rate: 5 }, { min: 100000, max: -1, rate: 8 }]),
      }))
      const calc = svc.calculate({ brandId: 'brand-001', orderId: 'order-003', orderAmount: 50000 }, 'tenant-test')
      expect(calc.royaltyAmount).toBe(2500) // 50000 * 5%
    })

    it('Tiered 匹配第二阶梯', () => {
      svc.createRule(makeRuleInput({
        royaltyType: RoyaltyType.Tiered,
        rate: 5,
        tierConfig: JSON.stringify([{ min: 0, max: 100000, rate: 5 }, { min: 100000, max: -1, rate: 8 }]),
      }))
      const calc = svc.calculate({ brandId: 'brand-001', orderId: 'order-004', orderAmount: 200000 }, 'tenant-test')
      expect(calc.royaltyAmount).toBe(16000) // 200000 * 8%
    })

    it('指定 ruleId 精确匹配', () => {
      const rule = svc.createRule(makeRuleInput({ name: '专属规则', royaltyType: RoyaltyType.FixedAmount, rate: 0, fixedAmount: 99999 }))
      svc.createRule(makeRuleInput({ name: '通用规则' }))
      const calc = svc.calculate({ brandId: 'brand-001', orderId: 'order-005', orderAmount: 100000, ruleId: rule.ruleId }, 'tenant-test')
      expect(calc.royaltyAmount).toBe(99999)
    })

    it('无匹配规则抛错', () => {
      expect(() => svc.calculate({ brandId: 'brand-no-rule', orderId: 'order-x', orderAmount: 100000 }, 'tenant-test')).toThrow()
    })
  })

  // ─── 4. 计算结果查询与结算 ──────────────────────

  describe('findAllCalculations / settleCalculations', () => {
    it('findAllCalculations 返回所有计算结果', () => {
      svc.createRule(makeRuleInput())
      svc.calculate({ brandId: 'brand-001', orderId: 'o1', orderAmount: 100000 }, 'tenant-test')
      svc.calculate({ brandId: 'brand-001', orderId: 'o2', orderAmount: 200000 }, 'tenant-test')
      expect(svc.findAllCalculations('tenant-test').length).toBe(2)
    })

    it('settleCalculations 批量结算成功', () => {
      svc.createRule(makeRuleInput())
      const c1 = svc.calculate({ brandId: 'brand-001', orderId: 'o1', orderAmount: 100000 }, 'tenant-test')
      const c2 = svc.calculate({ brandId: 'brand-001', orderId: 'o2', orderAmount: 200000 }, 'tenant-test')
      const count = svc.settleCalculations([c1.calculationId, c2.calculationId], 'tenant-test')
      expect(count).toBe(2)
      const settled = svc.findAllCalculations('tenant-test', { settled: true })
      expect(settled.length).toBe(2)
    })

    it('重复结算抛错', () => {
      svc.createRule(makeRuleInput())
      const c = svc.calculate({ brandId: 'brand-001', orderId: 'o1', orderAmount: 100000 }, 'tenant-test')
      svc.settleCalculations([c.calculationId], 'tenant-test')
      expect(() => svc.settleCalculations([c.calculationId], 'tenant-test')).toThrow()
    })

    it('findAllCalculations 按 settled 过滤', () => {
      svc.createRule(makeRuleInput())
      const c1 = svc.calculate({ brandId: 'brand-001', orderId: 'o1', orderAmount: 100000 }, 'tenant-test')
      svc.calculate({ brandId: 'brand-001', orderId: 'o2', orderAmount: 200000 }, 'tenant-test')
      svc.settleCalculations([c1.calculationId], 'tenant-test')
      const settled = svc.findAllCalculations('tenant-test', { settled: true })
      expect(settled.length).toBe(1)
    })
  })
})
