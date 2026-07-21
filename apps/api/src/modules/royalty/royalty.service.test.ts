import { describe, it, expect, beforeEach, assert } from 'vitest'
import 'reflect-metadata'
import { RoyaltyService } from './royalty.service'
import { RoyaltyType, RoyaltyStatus } from './royalty.entity'

// ── 辅助工厂 ──

function createContext(tenantId = 't-royalty-01', brandId = 'b-royalty-01', storeId = 's-001') {
  return { tenantId, brandId, storeId }
}

const testEffectiveDate = '2026-07-01T00:00:00.000Z'
const testExpirationDate = '2027-06-30T23:59:59.000Z'
const testFutureDate = '2026-09-01T00:00:00.000Z'

function createDefaultRuleInput(overrides: Record<string, any> = {}) {
  return {
    tenantContext: createContext(),
    brandId: 'b-nike',
    name: 'Nike 联名分润规则',
    royaltyType: RoyaltyType.RevenueShare,
    rate: 30,
    fixedAmount: 0,
    effectiveDate: testEffectiveDate,
    ...overrides,
  }
}

// ── Service 正例 ──

describe('RoyaltyService 正例', () => {
  beforeEach(() => {
    RoyaltyService._resetStoreForTest()
  })

  it('createRule 创建 RevenueShare 分润规则', () => {
    const service = new RoyaltyService()
    const rule = service.createRule(createDefaultRuleInput())

    assert.ok(rule.ruleId.startsWith('royalty-'))
    assert.equal(rule.name, 'Nike 联名分润规则')
    assert.equal(rule.royaltyType, RoyaltyType.RevenueShare)
    assert.equal(rule.rate, 30)
    assert.equal(rule.status, RoyaltyStatus.Active)
    assert.equal(rule.brandId, 'b-nike')
  })

  it('createRule 创建 FixedAmount 分润规则', () => {
    const service = new RoyaltyService()
    const rule = service.createRule({
      ...createDefaultRuleInput({ royaltyType: RoyaltyType.FixedAmount, rate: 0, fixedAmount: 50000, name: '固定金额分润' }),
      royaltyType: RoyaltyType.FixedAmount,
      rate: 0,
      fixedAmount: 50000,
      name: '固定金额分润',
    })

    assert.equal(rule.royaltyType, RoyaltyType.FixedAmount)
    assert.equal(rule.fixedAmount, 50000)
    assert.equal(rule.rate, 0)
  })

  it('createRule 关联联名项目', () => {
    const service = new RoyaltyService()
    const rule = service.createRule(createDefaultRuleInput({ collabProjectId: 'collab-summer-2026' }))

    assert.equal(rule.collabProjectId, 'collab-summer-2026')
  })

  it('findRuleById 找到有效规则返回规则详情', () => {
    const service = new RoyaltyService()
    const created = service.createRule(createDefaultRuleInput({ name: '查找测试规则' }))

    const found = service.findRuleById(created.ruleId, 't-royalty-01')

    assert.ok(found)
    assert.equal(found.name, '查找测试规则')
    assert.equal(found.ruleId, created.ruleId)
  })

  it('findAllRules 返回规则列表并支持品牌过滤', () => {
    const service = new RoyaltyService()
    const ctx = createContext()
    service.createRule(createDefaultRuleInput({ brandId: 'b-nike', name: 'Nike规则' }))
    service.createRule(createDefaultRuleInput({ brandId: 'b-nike', name: 'Nike规则2' }))
    service.createRule(createDefaultRuleInput({ brandId: 'b-adidas', name: 'Adidas规则', tenantContext: ctx }))

    const allRules = service.findAllRules('t-royalty-01')
    assert.equal(allRules.length, 3)

    const nikeRules = service.findAllRules('t-royalty-01', { brandId: 'b-nike' })
    assert.equal(nikeRules.length, 2)
    assert.ok(nikeRules.every((r) => r.brandId === 'b-nike'))
  })

  it('updateRule 更新分润规则字段', () => {
    const service = new RoyaltyService()
    const created = service.createRule(createDefaultRuleInput({ rate: 30 }))

    const updated = service.updateRule(created.ruleId, 't-royalty-01', { rate: 40, name: '已更新规则' })

    assert.equal(updated.rate, 40)
    assert.equal(updated.name, '已更新规则')
    assert.ok(new Date(updated.updatedAt).getTime() >= new Date(created.updatedAt).getTime())
  })

  it('deleteRule 删除分润规则', () => {
    const service = new RoyaltyService()
    const created = service.createRule(createDefaultRuleInput())

    service.deleteRule(created.ruleId, 't-royalty-01')

    const found = service.findRuleById(created.ruleId, 't-royalty-01')
    assert.equal(found, undefined)
  })

  it('calculate RevenueShare 分润计算正确', () => {
    const service = new RoyaltyService()
    service.createRule(createDefaultRuleInput({ brandId: 'b-nike', rate: 30 }))

    const calc = service.calculate(
      { brandId: 'b-nike', orderId: 'order-001', orderAmount: 100000 },
      't-royalty-01',
    )

    assert.equal(calc.orderAmount, 100000)
    assert.equal(calc.royaltyAmount, 30000) // 100000 * 30 / 100
    assert.equal(calc.appliedRate, 30)
    assert.equal(calc.appliedType, RoyaltyType.RevenueShare)
    assert.equal(calc.settled, false)
    assert.equal(calc.brandId, 'b-nike')
    assert.equal(calc.orderId, 'order-001')
  })

  it('calculate FixedAmount 分润计算正确', () => {
    const service = new RoyaltyService()
    service.createRule(createDefaultRuleInput({
      brandId: 'b-nike',
      royaltyType: RoyaltyType.FixedAmount,
      rate: 0,
      fixedAmount: 50000,
      name: '固定金额规则',
    }))

    const calc = service.calculate(
      { brandId: 'b-nike', orderId: 'order-002', orderAmount: 200000 },
      't-royalty-01',
    )

    assert.equal(calc.royaltyAmount, 50000)
    assert.equal(calc.appliedType, RoyaltyType.FixedAmount)
  })

  it('findAllCalculations 返回计算结果并支持过滤', () => {
    const service = new RoyaltyService()
    service.createRule(createDefaultRuleInput({ brandId: 'b-nike', rate: 20 }))

    const calc1 = service.calculate({ brandId: 'b-nike', orderId: 'o-1', orderAmount: 50000 }, 't-royalty-01')
    const calc2 = service.calculate({ brandId: 'b-nike', orderId: 'o-2', orderAmount: 100000 }, 't-royalty-01')

    const all = service.findAllCalculations('t-royalty-01')
    assert.equal(all.length, 2)

    const settledOnly = service.findAllCalculations('t-royalty-01', { settled: false })
    assert.equal(settledOnly.length, 2)
  })

  it('settleCalculations 批量结算分润', () => {
    const service = new RoyaltyService()
    service.createRule(createDefaultRuleInput({ brandId: 'b-nike', rate: 15 }))

    const calc1 = service.calculate({ brandId: 'b-nike', orderId: 'o-1', orderAmount: 100000 }, 't-royalty-01')
    const calc2 = service.calculate({ brandId: 'b-nike', orderId: 'o-2', orderAmount: 200000 }, 't-royalty-01')

    const settledCount = service.settleCalculations([calc1.calculationId, calc2.calculationId], 't-royalty-01')

    assert.equal(settledCount, 2)

    const c1 = service.findCalculationById(calc1.calculationId, 't-royalty-01')
    const c2 = service.findCalculationById(calc2.calculationId, 't-royalty-01')
    assert.ok(c1?.settled)
    assert.ok(c1?.settledAt)
    assert.ok(c2?.settled)
    assert.ok(c2?.settledAt)
  })

  it('findCalculationById 找到有效计算结果', () => {
    const service = new RoyaltyService()
    service.createRule(createDefaultRuleInput({ brandId: 'b-nike', rate: 10 }))

    const calc = service.calculate({ brandId: 'b-nike', orderId: 'o-find', orderAmount: 99999 }, 't-royalty-01')

    const found = service.findCalculationById(calc.calculationId, 't-royalty-01')
    assert.ok(found)
    assert.equal(found.calculationId, calc.calculationId)
    // 99999 * 10 / 100 = 9999.9 → Math.round = 10000
    assert.equal(found.royaltyAmount, 10000)
  })
})

// ── Service 反例 ──

describe('RoyaltyService 反例', () => {
  beforeEach(() => {
    RoyaltyService._resetStoreForTest()
  })

  it('createRule 拒绝分润率超过 100', () => {
    const service = new RoyaltyService()

    assert.throws(
      () => service.createRule(createDefaultRuleInput({ rate: 150 })),
      /between 0 and 100/,
    )
  })

  it('createRule 拒绝 RevenueShare 分润率为 0', () => {
    const service = new RoyaltyService()

    assert.throws(
      () => service.createRule(createDefaultRuleInput({ royaltyType: RoyaltyType.RevenueShare, rate: 0 })),
      /rate greater than 0/,
    )
  })

  it('createRule 拒绝 FixedAmount 金额为 0', () => {
    const service = new RoyaltyService()

    assert.throws(
      () => service.createRule(createDefaultRuleInput({
        royaltyType: RoyaltyType.FixedAmount,
        rate: 0,
        fixedAmount: 0,
        name: '零金额固定分润',
      })),
      /positive fixed amount/,
    )
  })

  it('createRule 拒绝过期时间早于生效时间', () => {
    const service = new RoyaltyService()

    assert.throws(
      () => service.createRule(createDefaultRuleInput({
        effectiveDate: '2027-01-01T00:00:00.000Z',
        expirationDate: '2026-06-01T00:00:00.000Z',
      })),
      /must be after/,
    )
  })

  it('findRuleById 跨租户不可见', () => {
    const service = new RoyaltyService()
    const created = service.createRule(createDefaultRuleInput())

    const found = service.findRuleById(created.ruleId, 't-royalty-other')
    assert.equal(found, undefined)
  })

  it('updateRule 不存在的规则抛出异常', () => {
    const service = new RoyaltyService()

    assert.throws(
      () => service.updateRule('royalty-nonexistent', 't-royalty-01', { name: '更新' }),
      /not found/,
    )
  })

  it('deleteRule 跨租户不可删除', () => {
    const service = new RoyaltyService()
    const created = service.createRule(createDefaultRuleInput())

    assert.throws(
      () => service.deleteRule(created.ruleId, 't-royalty-other'),
      /not found/,
    )

    // 原租户仍可找到
    const found = service.findRuleById(created.ruleId, 't-royalty-01')
    assert.ok(found)
  })

  it('calculate 没有匹配规则抛出异常', () => {
    const service = new RoyaltyService()

    assert.throws(
      () => service.calculate({ brandId: 'b-nonexistent', orderId: 'o-1', orderAmount: 100000 }, 't-royalty-01'),
      /No active royalty rule found/,
    )
  })

  it('settleCalculations 重复结算抛出异常', () => {
    const service = new RoyaltyService()
    service.createRule(createDefaultRuleInput({ brandId: 'b-nike', rate: 10 }))

    const calc = service.calculate({ brandId: 'b-nike', orderId: 'o-1', orderAmount: 50000 }, 't-royalty-01')

    service.settleCalculations([calc.calculationId], 't-royalty-01')

    assert.throws(
      () => service.settleCalculations([calc.calculationId], 't-royalty-01'),
      /already settled/,
    )
  })
})

// ── Service 边界值 ──

describe('RoyaltyService 边界值', () => {
  beforeEach(() => {
    RoyaltyService._resetStoreForTest()
  })

  it('createRule 分润率 0 和 100 为合法边界值', () => {
    const service = new RoyaltyService()

    const rule0 = service.createRule(createDefaultRuleInput({
      royaltyType: RoyaltyType.FixedAmount,
      rate: 0,
      fixedAmount: 10000,
      name: '零比例规则',
    }))
    assert.equal(rule0.rate, 0)

    const rule100 = service.createRule(createDefaultRuleInput({
      brandId: 'b-adidas',
      rate: 100,
      name: '最大比例规则',
    }))
    assert.equal(rule100.rate, 100)
  })

  it('calculate 订单金额为 0 返回分润 0', () => {
    const service = new RoyaltyService()
    service.createRule(createDefaultRuleInput({ brandId: 'b-nike', rate: 30 }))

    const calc = service.calculate({ brandId: 'b-nike', orderId: 'o-zero', orderAmount: 0 }, 't-royalty-01')

    assert.equal(calc.orderAmount, 0)
    assert.equal(calc.royaltyAmount, 0) // 0 * 30 / 100 = 0
  })

  it('calculate 极小金额分润向下取整', () => {
    const service = new RoyaltyService()
    service.createRule(createDefaultRuleInput({ brandId: 'b-nike', rate: 30 }))

    // 30% of 1 = 0.3 → round 0
    const calc = service.calculate({ brandId: 'b-nike', orderId: 'o-small', orderAmount: 1 }, 't-royalty-01')

    assert.equal(calc.royaltyAmount, 0)
  })

  it('calculate 指定 ruleId 计算', () => {
    const service = new RoyaltyService()
    const rule = service.createRule(createDefaultRuleInput({ brandId: 'b-nike', rate: 25 }))

    const calc = service.calculate(
      { brandId: 'b-nike', orderId: 'o-ruleid', orderAmount: 100000, ruleId: rule.ruleId },
      't-royalty-01',
    )

    assert.equal(calc.ruleId, rule.ruleId)
    assert.equal(calc.royaltyAmount, 25000)
  })

  it('calculate 指定 collabProjectId 匹配项目级规则', () => {
    const service = new RoyaltyService()
    // 品牌级规则 20%
    service.createRule(createDefaultRuleInput({ brandId: 'b-nike', rate: 20, name: '品牌规则' }))
    // 项目级规则 35%
    service.createRule(createDefaultRuleInput({
      brandId: 'b-nike',
      rate: 35,
      collabProjectId: 'collab-summer',
      name: '项目规则',
    }))

    const calc = service.calculate(
      { brandId: 'b-nike', orderId: 'o-collab', orderAmount: 100000, collabProjectId: 'collab-summer' },
      't-royalty-01',
    )

    // 应该匹配项目级规则
    assert.equal(calc.royaltyAmount, 35000) // 100000 * 35 / 100
  })

  it('findAllRules 空租户返回空列表', () => {
    const service = new RoyaltyService()

    const rules = service.findAllRules('t-empty')
    assert.equal(rules.length, 0)
  })

  it('findAllCalculations 空结果返回空数组', () => {
    const service = new RoyaltyService()

    const calcs = service.findAllCalculations('t-empty')
    assert.ok(Array.isArray(calcs))
    assert.equal(calcs.length, 0)
  })
})
