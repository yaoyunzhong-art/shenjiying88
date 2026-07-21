import { describe, it, expect, beforeEach, assert } from 'vitest'
import 'reflect-metadata'
import { RoyaltyController } from './royalty.controller'
import { RoyaltyType, RoyaltyStatus } from './royalty.entity'
import { RoyaltyService } from './royalty.service'

// ── 辅助工厂 ──

function createContext(tenantId = 't-royalty-01', brandId = 'b-royalty-01', storeId = 's-001') {
  return { tenantId, brandId, storeId }
}

type AnyFn = (...args: any[]) => any

interface MockServiceOverrides {
  createRule?: AnyFn
  findAllRules?: AnyFn
  findRuleById?: AnyFn
  updateRule?: AnyFn
  deleteRule?: AnyFn
  calculate?: AnyFn
  findAllCalculations?: AnyFn
  findCalculationById?: AnyFn
  settleCalculations?: AnyFn
}

function makeController(overrides: MockServiceOverrides = {}) {
  const service = {
    createRule: overrides.createRule ?? ((input: any) => ({
      ruleId: 'royalty-default',
      tenantContext: input.tenantContext,
      tenantId: input.tenantContext.tenantId,
      brandId: input.brandId,
      collabProjectId: input.collabProjectId,
      name: input.name,
      royaltyType: input.royaltyType,
      rate: input.rate,
      fixedAmount: input.fixedAmount,
      tierConfig: input.tierConfig,
      status: RoyaltyStatus.Active,
      effectiveDate: input.effectiveDate,
      expirationDate: input.expirationDate,
      description: input.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    findAllRules: overrides.findAllRules ?? (() => []),
    findRuleById: overrides.findRuleById ?? (() => undefined),
    updateRule: overrides.updateRule ?? (() => ({ ruleId: 'royalty-updated', status: RoyaltyStatus.Active })),
    deleteRule: overrides.deleteRule ?? (() => undefined),
    calculate: overrides.calculate ?? ((_input: any, _tenantId: string) => ({
      calculationId: 'calc-default',
      ruleId: 'royalty-default',
      brandId: 'b-nike',
      orderId: 'order-001',
      orderAmount: 100000,
      appliedRate: 30,
      appliedType: RoyaltyType.RevenueShare,
      royaltyAmount: 30000,
      calculatedAt: new Date().toISOString(),
      settled: false,
    })),
    findAllCalculations: overrides.findAllCalculations ?? (() => []),
    findCalculationById: overrides.findCalculationById ?? (() => undefined),
    settleCalculations: overrides.settleCalculations ?? ((_ids: string[], _tid: string) => 2),
  }
  return new RoyaltyController(service as any)
}

const testEffectiveDate = '2026-07-01T00:00:00.000Z'
const testExpirationDate = '2027-06-30T23:59:59.000Z'

// ── Controller 正例 ──

describe('RoyaltyController 正例', () => {
  beforeEach(() => {
    RoyaltyService._resetStoreForTest()
  })

  it('createRule 返回创建成功的分润规则', () => {
    const controller = makeController()
    const result = controller.createRule(createContext(), {
      brandId: 'b-nike',
      name: 'Nike 分润规则',
      royaltyType: RoyaltyType.RevenueShare,
      rate: 30,
      fixedAmount: 0,
      effectiveDate: testEffectiveDate,
    })

    assert.equal(result.name, 'Nike 分润规则')
    assert.equal(result.brandId, 'b-nike')
    assert.equal(result.royaltyType, RoyaltyType.RevenueShare)
    assert.equal(result.rate, 30)
    assert.equal(result.status, RoyaltyStatus.Active)
  })

  it('createRule 携带可选字段返回完整结构', () => {
    const controller = makeController()
    const result = controller.createRule(createContext(), {
      brandId: 'b-nike',
      collabProjectId: 'collab-summer',
      name: '完整分润规则',
      royaltyType: RoyaltyType.FixedAmount,
      rate: 0,
      fixedAmount: 50000,
      effectiveDate: testEffectiveDate,
      expirationDate: testExpirationDate,
      description: '2026夏季联名分润',
    })

    assert.equal(result.brandId, 'b-nike')
    assert.equal(result.collabProjectId, 'collab-summer')
    assert.equal(result.royaltyType, RoyaltyType.FixedAmount)
    assert.equal(result.fixedAmount, 50000)
    assert.equal(result.description, '2026夏季联名分润')
  })

  it('findAllRules 返回规则列表', () => {
    const mockRules = [
      { ruleId: 'r-1', brandId: 'b-1', name: '规则A', royaltyType: RoyaltyType.RevenueShare, rate: 20, fixedAmount: 0, status: RoyaltyStatus.Active, effectiveDate: testEffectiveDate, createdAt: '2026-07-21T00:00:00.000Z', updatedAt: '2026-07-21T00:00:00.000Z' },
      { ruleId: 'r-2', brandId: 'b-2', name: '规则B', royaltyType: RoyaltyType.FixedAmount, rate: 0, fixedAmount: 30000, status: RoyaltyStatus.Active, effectiveDate: testEffectiveDate, createdAt: '2026-07-20T00:00:00.000Z', updatedAt: '2026-07-20T00:00:00.000Z' },
    ]
    const controller = makeController({ findAllRules: () => mockRules })

    const result = controller.findAllRules(createContext())

    assert.equal(result.length, 2)
    assert.equal(result[0].ruleId, 'r-1')
  })

  it('findAllRules 支持品牌过滤', () => {
    const allRules = [
      { ruleId: 'r-1', brandId: 'b-nike', name: 'Nike规则', royaltyType: RoyaltyType.RevenueShare, rate: 30, fixedAmount: 0, status: RoyaltyStatus.Active, effectiveDate: testEffectiveDate, createdAt: '2026-07-21T00:00:00.000Z', updatedAt: '2026-07-21T00:00:00.000Z' },
      { ruleId: 'r-2', brandId: 'b-adidas', name: 'Adidas规则', royaltyType: RoyaltyType.RevenueShare, rate: 25, fixedAmount: 0, status: RoyaltyStatus.Active, effectiveDate: testEffectiveDate, createdAt: '2026-07-20T00:00:00.000Z', updatedAt: '2026-07-20T00:00:00.000Z' },
    ]
    let capturedFilter: any
    const controller = makeController({
      findAllRules: (_tenantId: string, filter: any) => {
        capturedFilter = filter
        return allRules.filter((r) => !filter?.brandId || r.brandId === filter.brandId)
      },
    })

    const result = controller.findAllRules(createContext(), { brandId: 'b-nike' } as any)

    assert.equal(result.length, 1)
    assert.equal(result[0].brandId, 'b-nike')
    assert.deepEqual(capturedFilter, { brandId: 'b-nike' })
  })

  it('findRuleById 找到有效规则返回规则详情', () => {
    const mockRule = {
      ruleId: 'r-find',
      brandId: 'b-3',
      name: '查找规则',
      royaltyType: RoyaltyType.RevenueShare,
      rate: 25,
      fixedAmount: 0,
      status: RoyaltyStatus.Active,
      effectiveDate: testEffectiveDate,
      createdAt: '2026-07-21T00:00:00.000Z',
      updatedAt: '2026-07-21T00:00:00.000Z',
    }
    const controller = makeController({ findRuleById: () => mockRule })

    const result = controller.findRuleById(createContext(), 'r-find')

    assert.ok(result)
    assert.equal(result.ruleId, 'r-find')
    assert.equal(result.name, '查找规则')
    assert.equal(result.rate, 25)
  })

  it('updateRule 更新规则返回更新后规则', () => {
    const updatedRule = {
      ruleId: 'r-update',
      brandId: 'b-3',
      name: '已更新规则',
      royaltyType: RoyaltyType.RevenueShare,
      rate: 40,
      fixedAmount: 0,
      status: RoyaltyStatus.Active,
      effectiveDate: testEffectiveDate,
      createdAt: '2026-07-21T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
    }
    let capturedInput: any
    const controller = makeController({
      updateRule: (_id: string, _tid: string, input: any) => {
        capturedInput = input
        return updatedRule
      },
    })

    const result = controller.updateRule(createContext(), 'r-update', {
      name: '已更新规则',
      rate: 40,
    })

    assert.equal(result.name, '已更新规则')
    assert.equal(result.rate, 40)
    assert.equal(capturedInput.name, '已更新规则')
    assert.equal(capturedInput.rate, 40)
  })

  it('deleteRule 删除成功', () => {
    let deletedId: string | undefined
    const controller = makeController({
      deleteRule: (ruleId: string) => {
        deletedId = ruleId
      },
    })

    const result = controller.deleteRule(createContext(), 'r-delete')

    assert.ok(result.success)
    assert.equal(result.ruleId, 'r-delete')
    assert.equal(deletedId, 'r-delete')
  })

  it('calculate 返回分润计算结果', () => {
    const controller = makeController()
    const result = controller.calculate(createContext(), {
      brandId: 'b-nike',
      orderId: 'order-001',
      orderAmount: 100000,
    })

    assert.ok(result.calculationId)
    assert.equal(result.brandId, 'b-nike')
    assert.equal(result.orderId, 'order-001')
    assert.equal(result.orderAmount, 100000)
    assert.equal(result.royaltyAmount, 30000)
    assert.equal(result.settled, false)
  })

  it('calculate 携带可选字段', () => {
    let capturedInput: any
    const controller = makeController({
      calculate: (input: any, _tid: string) => {
        capturedInput = input
        return {
          calculationId: 'calc-test',
          brandId: input.brandId,
          ruleId: input.ruleId ?? 'royalty-default',
          orderId: input.orderId,
          orderAmount: input.orderAmount,
          appliedRate: 30,
          appliedType: RoyaltyType.RevenueShare,
          royaltyAmount: Math.round(input.orderAmount * 30 / 100),
          calculatedAt: new Date().toISOString(),
          settled: false,
        }
      },
    })
    const result = controller.calculate(createContext(), {
      brandId: 'b-nike',
      orderId: 'order-002',
      orderAmount: 50000,
      ruleId: 'royalty-default',
      collabProjectId: 'collab-summer',
      description: '测试计算',
    })

    assert.equal(result.orderAmount, 50000)
    assert.equal(capturedInput.ruleId, 'royalty-default')
    assert.equal(capturedInput.collabProjectId, 'collab-summer')
    assert.equal(capturedInput.description, '测试计算')
  })

  it('findAllCalculations 返回计算结果列表', () => {
    const mockCalcs = [
      { calculationId: 'c-1', brandId: 'b-nike', ruleId: 'r-1', orderId: 'o-1', orderAmount: 100000, appliedRate: 30, appliedType: RoyaltyType.RevenueShare, royaltyAmount: 30000, calculatedAt: '2026-07-21T00:00:00.000Z', settled: false },
      { calculationId: 'c-2', brandId: 'b-nike', ruleId: 'r-1', orderId: 'o-2', orderAmount: 50000, appliedRate: 30, appliedType: RoyaltyType.RevenueShare, royaltyAmount: 15000, calculatedAt: '2026-07-20T00:00:00.000Z', settled: true, settledAt: '2026-07-21T00:00:00.000Z' },
    ]
    const controller = makeController({ findAllCalculations: () => mockCalcs })

    const result = controller.findAllCalculations(createContext())

    assert.equal(result.length, 2)
    assert.equal(result[0].calculationId, 'c-1')
  })

  it('findCalculationById 找到有效结算结果', () => {
    const mockCalc = {
      calculationId: 'c-find',
      brandId: 'b-nike',
      ruleId: 'r-1',
      orderId: 'o-1',
      orderAmount: 100000,
      appliedRate: 30,
      appliedType: RoyaltyType.RevenueShare,
      royaltyAmount: 30000,
      calculatedAt: '2026-07-21T00:00:00.000Z',
      settled: false,
    }
    const controller = makeController({ findCalculationById: () => mockCalc })

    const result = controller.findCalculationById(createContext(), 'c-find')

    assert.ok(result)
    assert.equal(result.calculationId, 'c-find')
    assert.equal(result.royaltyAmount, 30000)
  })

  it('settle 批量结算返回成功', () => {
    const controller = makeController({ settleCalculations: () => 3 })

    const result = controller.settle(createContext(), { calculationIds: ['c-1', 'c-2', 'c-3'] })

    assert.ok(result.success)
    assert.equal(result.settledCount, 3)
  })
})

// ── Controller 反例 ──

describe('RoyaltyController 反例', () => {
  it('createRule 拒绝分润率超过 100', () => {
    const controller = makeController({
      createRule: () => {
        throw new Error('Royalty rate must be between 0 and 100')
      },
    })

    assert.throws(
      () => controller.createRule(createContext(), {
        brandId: 'b-nike',
        name: '无效分润',
        royaltyType: RoyaltyType.RevenueShare,
        rate: 150,
        fixedAmount: 0,
        effectiveDate: testEffectiveDate,
      }),
      /between 0 and 100/,
    )
  })

  it('createRule 拒绝 RevenueShare 分润率为 0', () => {
    const controller = makeController({
      createRule: () => {
        throw new Error('Revenue share royalty must have a rate greater than 0')
      },
    })

    assert.throws(
      () => controller.createRule(createContext(), {
        brandId: 'b-nike',
        name: '零比例分润',
        royaltyType: RoyaltyType.RevenueShare,
        rate: 0,
        fixedAmount: 0,
        effectiveDate: testEffectiveDate,
      }),
      /rate greater than 0/,
    )
  })

  it('deleteRule 删除不存在规则抛出异常', () => {
    const controller = makeController({
      deleteRule: () => {
        throw new Error('Royalty rule not found: nonexistent')
      },
    })

    assert.throws(
      () => controller.deleteRule(createContext(), 'nonexistent'),
      /not found/,
    )
  })

  it('findRuleById 找不到返回 null', () => {
    const controller = makeController({ findRuleById: () => undefined })

    const result = controller.findRuleById(createContext(), 'nonexistent')

    assert.equal(result, null)
  })

  it('calculate 没有匹配规则抛出异常', () => {
    const controller = makeController({
      calculate: () => {
        throw new Error('No active royalty rule found')
      },
    })

    assert.throws(
      () => controller.calculate(createContext(), {
        brandId: 'b-nonexistent',
        orderId: 'o-1',
        orderAmount: 100000,
      }),
      /No active royalty rule found/,
    )
  })
})

// ── Controller 边界值 ──

describe('RoyaltyController 边界值', () => {
  it('createRule 分润率 0 和 100 为合法边界', () => {
    const controller = makeController()
    const r0 = controller.createRule(createContext(), {
      brandId: 'b-zero',
      name: '零比例规则',
      royaltyType: RoyaltyType.FixedAmount,
      rate: 0,
      fixedAmount: 10000,
      effectiveDate: testEffectiveDate,
    })
    const r100 = controller.createRule(createContext('t-2'), {
      brandId: 'b-max',
      name: '最大比例规则',
      royaltyType: RoyaltyType.RevenueShare,
      rate: 100,
      fixedAmount: 0,
      effectiveDate: testEffectiveDate,
    })

    assert.equal(r0.rate, 0)
    assert.equal(r100.rate, 100)
  })

  it('findAllRules 空列表返回空数组', () => {
    const controller = makeController({ findAllRules: () => [] })

    const result = controller.findAllRules(createContext())

    assert.ok(Array.isArray(result))
    assert.equal(result.length, 0)
  })

  it('findAllCalculations 空列表返回空数组', () => {
    const controller = makeController({ findAllCalculations: () => [] })

    const result = controller.findAllCalculations(createContext())

    assert.ok(Array.isArray(result))
    assert.equal(result.length, 0)
  })

  it('findCalculationById 找不到返回 null', () => {
    const controller = makeController({ findCalculationById: () => undefined })

    const result = controller.findCalculationById(createContext(), 'nonexistent')

    assert.equal(result, null)
  })
})
