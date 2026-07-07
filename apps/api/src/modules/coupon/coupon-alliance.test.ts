import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * coupon-alliance.test.ts · T108-1 联盟券服务单元测试
 *
 * 验证:
 *   1. AllianceCouponPlan    联盟券计划（创建/激活/暂停/查询）
 *   2. SteppedDiscountEngine  满减阶梯引擎（evaluate / apply）
 *   3. CouponDistributionEngine 发放引擎（单会员/分段/全量/自动触发）
 *
 * 覆盖 28 个测试用例
 */

import {
  AllianceCouponPlan,
  AlliancePlanParams,
  SteppedDiscountEngine,
  CouponDistributionEngine,
  AlliancePlanRule,
  DistributionTrigger,
} from './coupon-alliance.service'

// ─── Shared Test Data ───────────────────────────────────────────────────────

const validRules: AlliancePlanRule[] = [
  { stepFrom: 100, stepTo: 199, discount: 10 },
  { stepFrom: 200, stepTo: 499, discount: 25 },
  { stepFrom: 500, stepTo: Infinity, discount: 70 },
]

const futureFrom = new Date('2027-01-01T00:00:00Z')
const futureTo = new Date('2027-12-31T23:59:59Z')
const pastFrom = new Date('2025-01-01T00:00:00Z')
const pastTo = new Date('2025-12-31T23:59:59Z')

// ─── AllianceCouponPlan Tests ──────────────────────────────────────────────

describe('AllianceCouponPlan', () => {
  let service: AllianceCouponPlan

  beforeEach(() => {
    service = new AllianceCouponPlan()
  })

  // ── 创建计划 ────────────────────────────────────────────────────────────

  describe('createPlan', () => {
    it('T1: 合法参数创建联盟券计划成功', () => {
      const params: AlliancePlanParams = {
        planId: 'plan-001',
        name: '暑期联盟券',
        partnerIds: ['partner-A', 'partner-B'],
        rules: validRules,
        validFrom: futureFrom,
        validTo: futureTo,
      }

      const plan = service.createPlan(params)

      expect(plan.planId).toBe('plan-001')
      expect(plan.name).toBe('暑期联盟券')
      expect(plan.partnerIds).toEqual(['partner-A', 'partner-B'])
      expect(plan.rules).toHaveLength(3)
      expect(plan.status).toBe('draft')
      expect(plan.createdAt).toBeInstanceOf(Date)
    })

    it('T2: 空 partnerIds 抛出 INVALID_PARTNER_IDS', () => {
      const params: AlliancePlanParams = {
        planId: 'plan-002',
        name: '测试计划',
        partnerIds: [],
        rules: validRules,
        validFrom: futureFrom,
        validTo: futureTo,
      }

      expect(() => service.createPlan(params)).toThrow()
      try {
        service.createPlan(params)
      } catch (err: any) {
        expect(err.code).toBe('INVALID_PARTNER_IDS')
      }
    })

    it('T3: 无效伙伴ID（空字符串）抛出 INVALID_PARTNER_IDS', () => {
      const params: AlliancePlanParams = {
        planId: 'plan-003',
        name: '测试计划',
        partnerIds: ['partner-A', ''],
        rules: validRules,
        validFrom: futureFrom,
        validTo: futureTo,
      }

      expect(() => service.createPlan(params)).toThrow()
    })

    it('T4: validFrom >= validTo 抛出 INVALID_DATE_RANGE', () => {
      const params: AlliancePlanParams = {
        planId: 'plan-004',
        name: '测试计划',
        partnerIds: ['partner-A'],
        rules: validRules,
        validFrom: futureTo,
        validTo: futureFrom,
      }

      expect(() => service.createPlan(params)).toThrow()
      try {
        service.createPlan(params)
      } catch (err: any) {
        expect(err.code).toBe('INVALID_DATE_RANGE')
      }
    })

    it('T5: 日期范围颠倒（相同日期）抛出 INVALID_DATE_RANGE', () => {
      const sameDate = new Date('2027-06-01T00:00:00Z')
      const params: AlliancePlanParams = {
        planId: 'plan-005',
        name: '测试计划',
        partnerIds: ['partner-A'],
        rules: validRules,
        validFrom: sameDate,
        validTo: sameDate,
      }

      expect(() => service.createPlan(params)).toThrow()
    })

    it('T6: 阶梯 rule stepFrom >= stepTo 抛出 INVALID_RULES', () => {
      const invalidRules: AlliancePlanRule[] = [
        { stepFrom: 200, stepTo: 100, discount: 10 },
      ]
      const params: AlliancePlanParams = {
        planId: 'plan-006',
        name: '测试计划',
        partnerIds: ['partner-A'],
        rules: invalidRules,
        validFrom: futureFrom,
        validTo: futureTo,
      }

      expect(() => service.createPlan(params)).toThrow()
      try {
        service.createPlan(params)
      } catch (err: any) {
        expect(err.code).toBe('INVALID_RULES')
      }
    })

    it('T7: 阶梯有间隙（不连续）抛出 INVALID_RULES', () => {
      const gapRules: AlliancePlanRule[] = [
        { stepFrom: 100, stepTo: 199, discount: 10 },
        { stepFrom: 300, stepTo: 499, discount: 25 }, // 缺少 200-299
      ]
      const params: AlliancePlanParams = {
        planId: 'plan-007',
        name: '测试计划',
        partnerIds: ['partner-A'],
        rules: gapRules,
        validFrom: futureFrom,
        validTo: futureTo,
      }

      expect(() => service.createPlan(params)).toThrow()
    })

    it('T8: 空 rules 抛出 INVALID_RULES', () => {
      const params: AlliancePlanParams = {
        planId: 'plan-008',
        name: '测试计划',
        partnerIds: ['partner-A'],
        rules: [],
        validFrom: futureFrom,
        validTo: futureTo,
      }

      expect(() => service.createPlan(params)).toThrow()
    })
  })

  // ── 激活/暂停 ────────────────────────────────────────────────────────────

  describe('activatePlan / pausePlan', () => {
    it('T9: 激活 draft 计划成功', () => {
      const plan = service.createPlan({
        planId: 'plan-009',
        name: '测试',
        partnerIds: ['p-A'],
        rules: validRules,
        validFrom: futureFrom,
        validTo: futureTo,
      })

      const activated = service.activatePlan('plan-009')
      expect(activated.status).toBe('active')
    })

    it('T10: 重复激活已激活计划抛出 ALREADY_ACTIVE', () => {
      service.createPlan({
        planId: 'plan-010',
        name: '测试',
        partnerIds: ['p-A'],
        rules: validRules,
        validFrom: futureFrom,
        validTo: futureTo,
      })
      service.activatePlan('plan-010')

      expect(() => service.activatePlan('plan-010')).toThrow()
      try {
        service.activatePlan('plan-010')
      } catch (err: any) {
        expect(err.code).toBe('ALREADY_ACTIVE')
      }
    })

    it('T11: 暂停已激活计划成功', () => {
      service.createPlan({
        planId: 'plan-011',
        name: '测试',
        partnerIds: ['p-A'],
        rules: validRules,
        validFrom: futureFrom,
        validTo: futureTo,
      })
      service.activatePlan('plan-011')

      const paused = service.pausePlan('plan-011')
      expect(paused.status).toBe('paused')
    })

    it('T12: 暂停 draft 计划抛出 NOT_ACTIVE', () => {
      service.createPlan({
        planId: 'plan-012',
        name: '测试',
        partnerIds: ['p-A'],
        rules: validRules,
        validFrom: futureFrom,
        validTo: futureTo,
      })

      expect(() => service.pausePlan('plan-012')).toThrow()
      try {
        service.pausePlan('plan-012')
      } catch (err: any) {
        expect(err.code).toBe('NOT_ACTIVE')
      }
    })

    it('T13: getPlan 返回 plan 详情', () => {
      service.createPlan({
        planId: 'plan-013',
        name: '详情测试',
        partnerIds: ['p-A', 'p-B'],
        rules: validRules,
        validFrom: futureFrom,
        validTo: futureTo,
      })

      const plan = service.getPlan('plan-013')
      expect(plan).toBeDefined()
      expect(plan?.name).toBe('详情测试')
      expect(plan?.partnerIds).toHaveLength(2)
    })

    it('T14: listByPartner 返回伙伴关联的计划', () => {
      service.createPlan({
        planId: 'plan-014-a',
        name: '计划A',
        partnerIds: ['partner-X', 'partner-Y'],
        rules: validRules,
        validFrom: futureFrom,
        validTo: futureTo,
      })
      service.createPlan({
        planId: 'plan-014-b',
        name: '计划B',
        partnerIds: ['partner-Y', 'partner-Z'],
        rules: validRules,
        validFrom: futureFrom,
        validTo: futureTo,
      })

      const plans = service.listByPartner('partner-Y')
      expect(plans).toHaveLength(2)
      expect(plans.map((p) => p.planId)).toContain('plan-014-a')
      expect(plans.map((p) => p.planId)).toContain('plan-014-b')
    })
  })
})

// ─── SteppedDiscountEngine Tests ────────────────────────────────────────────

describe('SteppedDiscountEngine', () => {
  let engine: SteppedDiscountEngine

  beforeEach(() => {
    engine = new SteppedDiscountEngine()
  })

  describe('evaluate', () => {
    it('T15: 100元以下无优惠', () => {
      const result = engine.evaluate(50)
      expect(result).toBeNull()
    })

    it('T16: 100元（边界）适用第一个阶梯', () => {
      const result = engine.evaluate(100)
      expect(result).not.toBeNull()
      expect(result!.discount).toBe(10)
      expect(result!.rule.stepFrom).toBe(100)
    })

    it('T17: 150元适用第一个阶梯', () => {
      const result = engine.evaluate(150)
      expect(result).not.toBeNull()
      expect(result!.discount).toBe(10)
    })

    it('T18: 199元适用第一个阶梯（上限）', () => {
      const result = engine.evaluate(199)
      expect(result).not.toBeNull()
      expect(result!.discount).toBe(10)
    })

    it('T19: 200元（边界）适用第二个阶梯', () => {
      const result = engine.evaluate(200)
      expect(result).not.toBeNull()
      expect(result!.discount).toBe(25)
    })

    it('T20: 350元适用第二个阶梯', () => {
      const result = engine.evaluate(350)
      expect(result).not.toBeNull()
      expect(result!.discount).toBe(25)
    })

    it('T21: 499元适用第二个阶梯（上限）', () => {
      const result = engine.evaluate(499)
      expect(result).not.toBeNull()
      expect(result!.discount).toBe(25)
    })

    it('T22: 500元（边界）适用最高阶梯', () => {
      const result = engine.evaluate(500)
      expect(result).not.toBeNull()
      expect(result!.discount).toBe(70)
    })

    it('T23: 1000元适用最高阶梯', () => {
      const result = engine.evaluate(1000)
      expect(result).not.toBeNull()
      expect(result!.discount).toBe(70)
    })

    it('T24: 阶梯交集时选择最优（最大优惠）', () => {
      // 自定义规则：两个阶梯都满足同一订单金额
      const overlappingRules: AlliancePlanRule[] = [
        { stepFrom: 100, stepTo: 500, discount: 5 },
        { stepFrom: 100, stepTo: 500, discount: 15 },
      ]
      const result = engine.evaluate(300, overlappingRules)
      expect(result).not.toBeNull()
      expect(result!.discount).toBe(15) // 选最大优惠
    })

    it('T25: 订单金额为负数抛出异常', () => {
      expect(() => engine.evaluate(-50)).toThrow()
    })

    it('T26: apply 核销记录包含正确字段', () => {
      const record = engine.apply('coupon-001', 'order-001', 'member-001')

      expect(record.couponId).toBe('coupon-001')
      expect(record.orderId).toBe('order-001')
      expect(record.memberId).toBe('member-001')
      expect(record.redeemedAt).toBeInstanceOf(Date)
    })

    it('T27: apply 参数缺失抛出异常', () => {
      expect(() => engine.apply('', 'order-001', 'member-001')).toThrow()
      expect(() => engine.apply('coupon-001', '', 'member-001')).toThrow()
      expect(() => engine.apply('coupon-001', 'order-001', '')).toThrow()
    })
  })
})

// ─── CouponDistributionEngine Tests ────────────────────────────────────────

describe('CouponDistributionEngine', () => {
  let engine: CouponDistributionEngine

  beforeEach(() => {
    engine = new CouponDistributionEngine()
    engine.clearDistributions()
  })

  describe('distributeToMember', () => {
    it('T28: 单会员发放计数正确', () => {
      const result = engine.distributeToMember('coupon-A', 'member-001', 'manual')
      expect(result.distributed).toBe(true)
      expect(engine.getDistributionCount()).toBe(1)
    })

    it('T29: 重复发放同一会员返回 distributed=false', () => {
      engine.distributeToMember('coupon-A', 'member-001', 'manual')
      const result = engine.distributeToMember('coupon-A', 'member-001', 'manual')
      expect(result.distributed).toBe(false)
      expect(engine.getDistributionCount()).toBe(1)
    })

    it('T30: 不同会员各自独立计数', () => {
      engine.distributeToMember('coupon-A', 'member-001', 'manual')
      engine.distributeToMember('coupon-A', 'member-002', 'manual')
      engine.distributeToMember('coupon-B', 'member-003', 'manual')
      expect(engine.getDistributionCount()).toBe(3)
    })
  })

  describe('distributeToSegment', () => {
    it('T31: 分段发放计数正确', () => {
      const result = engine.distributeToSegment('seg-vip', 'coupon-S', 'vip-event', ['m-vip-1', 'm-vip-2'])
      expect(result.distributed).toBe(2)
      expect(result.segmentId).toBe('seg-vip')
    })

    it('T32: 分段内重复发放不重复计数', () => {
      engine.distributeToSegment('seg-vip', 'coupon-S', 'vip-event', ['m-vip-1', 'm-vip-2'])
      engine.distributeToSegment('seg-vip', 'coupon-S', 'vip-event', ['m-vip-1', 'm-vip-2', 'm-vip-3'])
      expect(engine.getDistributionCount()).toBe(3) // 唯一 member
    })
  })

  describe('distributeToAll', () => {
    it('T33: 全量发放计数正确', () => {
      const result = engine.distributeToAll('coupon-all', 'anniversary', ['m-001', 'm-002', 'm-003'])
      expect(result.distributed).toBe(3)
    })

    it('T34: 全量发放去重', () => {
      engine.distributeToAll('coupon-all', 'anniversary', ['m-001', 'm-002'])
      engine.distributeToAll('coupon-all', 'anniversary', ['m-002', 'm-003'])
      expect(engine.getDistributionCount()).toBe(3)
    })
  })

  describe('autoIssueByRule', () => {
    it('T35: on_register 触发正确发放', () => {
      const result = engine.autoIssueByRule('coupon-R', 'on_register', { memberId: 'm-new-1' })
      expect(result.issued).toBe(true)
      expect(result.trigger).toBe('on_register')
    })

    it('T36: on_consume 触发（满100）正确发放', () => {
      const result = engine.autoIssueByRule('coupon-C', 'on_consume', { memberId: 'm-001', orderAmount: 200 })
      expect(result.issued).toBe(true)
    })

    it('T37: on_consume 触发（不满100）不发放', () => {
      const result = engine.autoIssueByRule('coupon-C', 'on_consume', { memberId: 'm-001', orderAmount: 50 })
      expect(result.issued).toBe(false)
    })

    it('T38: on_birthday 触发正确发放', () => {
      const result = engine.autoIssueByRule('coupon-B', 'on_birthday', { memberId: 'm-bday-1' })
      expect(result.issued).toBe(true)
    })

    it('T39: on_level_up 触发正确发放', () => {
      const result = engine.autoIssueByRule('coupon-L', 'on_level_up', { memberId: 'm-lv-1' })
      expect(result.issued).toBe(true)
    })

    it('T40: manual 触发不自动发放', () => {
      const result = engine.autoIssueByRule('coupon-M', 'manual', { memberId: 'm-001' })
      expect(result.issued).toBe(false)
    })

    it('T41: 缺少 memberId 不发放', () => {
      const result = engine.autoIssueByRule('coupon-X', 'on_register', {})
      expect(result.issued).toBe(false)
    })

    it('T42: 未知 trigger 抛出异常', () => {
      expect(() =>
        engine.autoIssueByRule('coupon-X', 'on_invalid_trigger' as DistributionTrigger, { memberId: 'm-001' }),
      ).toThrow()
    })
  })
})
