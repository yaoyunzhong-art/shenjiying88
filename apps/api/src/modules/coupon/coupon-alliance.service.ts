// coupon-alliance.service.ts · T108-1 联盟券服务
// 落地: P0-8 跨商户关联 / P1-18 未关联订单补录 / P2-12 用户行为分析

import { Injectable, Logger } from '@nestjs/common';

// ─── Types ────────────────────────────────────────────────────────────────

export interface AlliancePlanParams {
  planId: string
  name: string
  partnerIds: string[]
  rules: AlliancePlanRule[]
  validFrom: Date
  validTo: Date
}

export interface AlliancePlanRule {
  stepFrom: number
  stepTo: number
  discount: number
  couponId?: string
}

export type AlliancePlanStatus = 'draft' | 'active' | 'paused' | 'expired'

export interface AlliancePlan {
  planId: string
  name: string
  partnerIds: string[]
  rules: AlliancePlanRule[]
  validFrom: Date
  validTo: Date
  status: AlliancePlanStatus
  createdAt: Date
  updatedAt: Date
}

export interface DiscountEvaluation {
  rule: AlliancePlanRule
  discount: number
  orderAmount: number
}

export interface CouponRedemptionRecord {
  couponId: string
  orderId: string
  memberId: string
  redeemedAt: Date
}

export type DistributionTrigger =
  | 'on_register'
  | 'on_consume'
  | 'on_birthday'
  | 'on_level_up'
  | 'manual'

export interface MemberSegment {
  segmentId: string
  name: string
  memberIds: string[]
}

// ─── AllianceCouponPlan ────────────────────────────────────────────────────

@Injectable()
export class AllianceCouponPlan {
  private readonly logger = new Logger(AllianceCouponPlan.name)
  private readonly plans = new Map<string, AlliancePlan>()

  createPlan(params: AlliancePlanParams): AlliancePlan {
    // 校验 partnerIds 非空
    if (!params.partnerIds || params.partnerIds.length === 0) {
      throw new AlliancePlanError('INVALID_PARTNER_IDS', 'partnerIds cannot be empty')
    }

    // 校验 partnerIds 不包含空字符串
    if (params.partnerIds.some((id) => !id || id.trim() === '')) {
      throw new AlliancePlanError('INVALID_PARTNER_IDS', 'partnerIds cannot contain empty strings')
    }

    // 校验日期范围
    if (params.validFrom >= params.validTo) {
      throw new AlliancePlanError('INVALID_DATE_RANGE', 'validFrom must be before validTo')
    }

    // 校验 rules 非空且阶梯连续
    if (!params.rules || params.rules.length === 0) {
      throw new AlliancePlanError('INVALID_RULES', 'rules cannot be empty')
    }

    const sortedRules = [...params.rules].sort((a, b) => a.stepFrom - b.stepFrom)
    for (let i = 0; i < sortedRules.length; i++) {
      const rule = sortedRules[i]
      if (rule.stepFrom >= rule.stepTo) {
        throw new AlliancePlanError('INVALID_RULES', `rule stepFrom ${rule.stepFrom} >= stepTo ${rule.stepTo}`)
      }
      if (i > 0 && rule.stepFrom > sortedRules[i - 1].stepTo + 1) {
        throw new AlliancePlanError('INVALID_RULES', `rule gap detected at index ${i}: gap between ${sortedRules[i - 1].stepTo} and ${rule.stepFrom}`)
      }
    }

    const plan: AlliancePlan = {
      planId: params.planId,
      name: params.name,
      partnerIds: params.partnerIds,
      rules: sortedRules,
      validFrom: params.validFrom,
      validTo: params.validTo,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.plans.set(plan.planId, plan)
    this.logger.log(`Plan created: ${plan.planId} partners=[${plan.partnerIds.join(', ')}]`)
    return plan
  }

  activatePlan(planId: string): AlliancePlan {
    const plan = this.plans.get(planId)
    if (!plan) {
      throw new AlliancePlanError('PLAN_NOT_FOUND', `plan ${planId} not found`)
    }
    if (plan.status === 'active') {
      throw new AlliancePlanError('ALREADY_ACTIVE', `plan ${planId} already active`)
    }
    plan.status = 'active'
    plan.updatedAt = new Date()
    this.logger.log(`Plan activated: ${planId}`)
    return plan
  }

  pausePlan(planId: string): AlliancePlan {
    const plan = this.plans.get(planId)
    if (!plan) {
      throw new AlliancePlanError('PLAN_NOT_FOUND', `plan ${planId} not found`)
    }
    if (plan.status !== 'active') {
      throw new AlliancePlanError('NOT_ACTIVE', `plan ${planId} is not active (status=${plan.status})`)
    }
    plan.status = 'paused'
    plan.updatedAt = new Date()
    this.logger.log(`Plan paused: ${planId}`)
    return plan
  }

  getPlan(planId: string): AlliancePlan | undefined {
    return this.plans.get(planId)
  }

  listByPartner(partnerId: string): AlliancePlan[] {
    return Array.from(this.plans.values()).filter((p) => p.partnerIds.includes(partnerId))
  }
}

// ─── AlliancePlanError ─────────────────────────────────────────────────────

export class AlliancePlanError extends Error {
  constructor(
    public readonly code: 'INVALID_PARTNER_IDS' | 'INVALID_DATE_RANGE' | 'INVALID_RULES' | 'PLAN_NOT_FOUND' | 'ALREADY_ACTIVE' | 'NOT_ACTIVE',
    message: string,
  ) {
    super(message)
    this.name = 'AlliancePlanError'
  }
}

// ─── SteppedDiscountEngine ─────────────────────────────────────────────────

@Injectable()
export class SteppedDiscountEngine {
  private readonly logger = new Logger(SteppedDiscountEngine.name)

  /**
   * 满减阶梯规则（默认配置）
   * 满 100 减 10 / 满 200 减 25 / 满 500 减 70
   */
  readonly defaultRules: AlliancePlanRule[] = [
    { stepFrom: 100, stepTo: 199, discount: 10 },
    { stepFrom: 200, stepTo: 499, discount: 25 },
    { stepFrom: 500, stepTo: Infinity, discount: 70 },
  ]

  /**
   * evaluate - 计算订单适用优惠
   * @param orderAmount 订单金额
   * @param rules 阶梯规则（默认使用 defaultRules）
   * @returns 最优规则匹配结果，无匹配返回 null
   */
  evaluate(orderAmount: number, rules: AlliancePlanRule[] = this.defaultRules): DiscountEvaluation | null {
    if (orderAmount < 0) {
      throw new SteppedDiscountError('INVALID_ORDER_AMOUNT', 'orderAmount cannot be negative')
    }

    // 找出所有满足条件的规则（多规则可能同时满足）
    const matched = rules
      .filter((r) => orderAmount >= r.stepFrom && orderAmount <= r.stepTo)
      .sort((a, b) => b.discount - a.discount) // 按优惠金额降序，选最优

    if (matched.length === 0) {
      return null
    }

    const bestRule = matched[0]
    this.logger.debug(`evaluate(${orderAmount}) -> rule [${bestRule.stepFrom}-${bestRule.stepTo}] discount=${bestRule.discount}`)
    return {
      rule: bestRule,
      discount: bestRule.discount,
      orderAmount,
    }
  }

  /**
   * apply - 核销联盟优惠券
   * @param couponId 优惠券ID
   * @param orderId 订单ID
   * @param memberId 会员ID
   * @returns 核销记录
   */
  apply(couponId: string, orderId: string, memberId: string): CouponRedemptionRecord {
    if (!couponId || !orderId || !memberId) {
      throw new SteppedDiscountError('INVALID_PARAMS', 'couponId, orderId and memberId are required')
    }

    const record: CouponRedemptionRecord = {
      couponId,
      orderId,
      memberId,
      redeemedAt: new Date(),
    }

    this.logger.log(`Coupon applied: coupon=${couponId} order=${orderId} member=${memberId}`)
    return record
  }
}

// ─── SteppedDiscountError ──────────────────────────────────────────────────

export class SteppedDiscountError extends Error {
  constructor(
    public readonly code: 'INVALID_ORDER_AMOUNT' | 'INVALID_PARAMS',
    message: string,
  ) {
    super(message)
    this.name = 'SteppedDiscountError'
  }
}

// ─── CouponDistributionEngine ──────────────────────────────────────────────

@Injectable()
export class CouponDistributionEngine {
  private readonly logger = new Logger(CouponDistributionEngine.name)

  private readonly distributions = new Map<string, { couponId: string; memberId: string; reason: string; distributedAt: Date }>()

  /**
   * distributeToMember - 发放给单个会员
   */
  distributeToMember(couponId: string, memberId: string, reason: string): { distributed: boolean; memberId: string; couponId: string } {
    if (!couponId || !memberId) {
      throw new DistributionError('INVALID_PARAMS', 'couponId and memberId are required')
    }

    const key = `${couponId}:${memberId}`
    if (this.distributions.has(key)) {
      this.logger.warn(`Already distributed: ${key}`)
      return { distributed: false, memberId, couponId }
    }

    this.distributions.set(key, {
      couponId,
      memberId,
      reason,
      distributedAt: new Date(),
    })

    this.logger.log(`Distributed to member: coupon=${couponId} member=${memberId} reason=${reason}`)
    return { distributed: true, memberId, couponId }
  }

  /**
   * distributeToSegment - 发放给会员段
   */
  distributeToSegment(segmentId: string, couponId: string, reason: string, members: MemberSegment['memberIds'] = []): { distributed: number; segmentId: string; couponId: string } {
    if (!segmentId || !couponId) {
      throw new DistributionError('INVALID_PARAMS', 'segmentId and couponId are required')
    }

    // 模拟从 segment 获取实际 memberIds
    const memberIds = members.length > 0 ? members : this.getMockMembersBySegment(segmentId)

    let count = 0
    for (const memberId of memberIds) {
      const key = `${couponId}:${memberId}`
      if (!this.distributions.has(key)) {
        this.distributions.set(key, {
          couponId,
          memberId,
          reason,
          distributedAt: new Date(),
        })
        count++
      }
    }

    this.logger.log(`Distributed to segment: segment=${segmentId} coupon=${couponId} count=${count}`)
    return { distributed: count, segmentId, couponId }
  }

  /**
   * distributeToAll - 发放给所有会员
   */
  distributeToAll(couponId: string, reason: string, allMemberIds: string[] = []): { distributed: number; couponId: string } {
    if (!couponId) {
      throw new DistributionError('INVALID_PARAMS', 'couponId is required')
    }

    // 模拟所有会员 ID（如果没有传入）
    const memberIds = allMemberIds.length > 0 ? allMemberIds : this.getMockAllMembers()

    let count = 0
    for (const memberId of memberIds) {
      const key = `${couponId}:${memberId}`
      if (!this.distributions.has(key)) {
        this.distributions.set(key, {
          couponId,
          memberId,
          reason,
          distributedAt: new Date(),
        })
        count++
      }
    }

    this.logger.log(`Distributed to all: coupon=${couponId} count=${count}`)
    return { distributed: count, couponId }
  }

  /**
   * autoIssueByRule - 按规则自动发放
   * trigger 类型: on_register / on_consume / on_birthday / on_level_up / manual
   */
  autoIssueByRule(couponId: string, trigger: DistributionTrigger, context: Record<string, any> = {}): { issued: boolean; trigger: DistributionTrigger; couponId: string } {
    const handlers: Record<DistributionTrigger, () => boolean> = {
      on_register: () => {
        const memberId = context.memberId
        if (!memberId) return false
        this.distributeToMember(couponId, memberId, `trigger:${trigger}`)
        return true
      },
      on_consume: () => {
        const memberId = context.memberId
        const orderAmount = context.orderAmount ?? 0
        if (!memberId) return false
        // 消费满 100 才发券
        if (orderAmount >= 100) {
          this.distributeToMember(couponId, memberId, `trigger:${trigger}`)
          return true
        }
        return false
      },
      on_birthday: () => {
        const memberId = context.memberId
        if (!memberId) return false
        this.distributeToMember(couponId, memberId, `trigger:${trigger}`)
        return true
      },
      on_level_up: () => {
        const memberId = context.memberId
        if (!memberId) return false
        this.distributeToMember(couponId, memberId, `trigger:${trigger}`)
        return true
      },
      manual: () => {
        return false
      },
    }

    const handler = handlers[trigger]
    if (!handler) {
      throw new DistributionError('UNKNOWN_TRIGGER', `Unknown trigger: ${trigger}`)
    }

    const issued = handler()
    this.logger.log(`autoIssueByRule: coupon=${couponId} trigger=${trigger} issued=${issued}`)
    return { issued, trigger, couponId }
  }

  // ─── Mock helpers ────────────────────────────────────────────────────────

  private getMockMembersBySegment(segmentId: string): string[] {
    const segmentMembers: Record<string, string[]> = {
      'seg-vip': ['m-vip-1', 'm-vip-2', 'm-vip-3'],
      'seg-svip': ['m-svip-1', 'm-svip-2'],
      'seg-new': ['m-new-1', 'm-new-2', 'm-new-3', 'm-new-4'],
    }
    return segmentMembers[segmentId] ?? []
  }

  private getMockAllMembers(): string[] {
    return [
      'm-001', 'm-002', 'm-003', 'm-004', 'm-005',
      'm-006', 'm-007', 'm-008', 'm-009', 'm-010',
    ]
  }

  // 用于测试：获取已发放记录数
  getDistributionCount(): number {
    return this.distributions.size
  }

  // 用于测试：清除所有发放记录
  clearDistributions(): void {
    this.distributions.clear()
  }
}

// ─── DistributionError ─────────────────────────────────────────────────────

export class DistributionError extends Error {
  constructor(
    public readonly code: 'INVALID_PARAMS' | 'UNKNOWN_TRIGGER',
    message: string,
  ) {
    super(message)
    this.name = 'DistributionError'
  }
}
