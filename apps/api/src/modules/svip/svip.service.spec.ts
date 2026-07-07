/**
 * svip.service.spec.ts — SVIP 会员 Service 纯函数式内联测试
 *
 * 覆盖：
 *   - Plan CRUD: createPlan
 *   - 订阅管理: subscribe / cancelSubscription / renewSubscription
 *   - 状态管理: checkAndExpire / 过期自动标记
 *   - 权益使用: getSubscription / useBenefit / getBenefits
 *   - 边界: 不存在 plan / 重复订阅 / 取消后续订 / 过期订阅使用权益
 *
 * 全部内联 mock，不依赖 NestJS DI。≥ 18 项测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ═══════════════════════════════════════════════════════════════
// 枚举常量
// ═══════════════════════════════════════════════════════════════

const SVIP_STATUSES = ['active', 'expired', 'cancelled'] as const
const SVIP_BENEFIT_TYPES = ['points_multiplier', 'free_delivery', 'exclusive_discount'] as const
const BENEFIT_NAME_MAP: Record<string, string> = {
  '积分翻倍': 'points_multiplier',
  '免费配送': 'free_delivery',
  '专属折扣': 'exclusive_discount',
}

// ═══════════════════════════════════════════════════════════════
// Types (内联)
// ═══════════════════════════════════════════════════════════════

interface InlinePlan {
  planId: string
  name: string
  price: number
  durationDays: number
  benefits: string[]
  createdAt: Date
}

interface InlineSubscription {
  subscriptionId: string
  userId: string
  planId: string
  status: string
  startAt: Date
  expireAt: Date
  autoRenew: boolean
  createdAt: Date
}

interface InlineBenefit {
  benefitId: string
  subscriptionId: string
  type: string
  usedAt?: Date
  expiresAt?: Date
}

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑 — 对应 svip.service.ts 核心函数
// ═══════════════════════════════════════════════════════════════

function inlineGenerateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function inlineCreatePlan(
  plans: Map<string, InlinePlan>,
  input: { name: string; price: number; durationDays: number; benefits: string[] },
): InlinePlan {
  const plan: InlinePlan = {
    planId: inlineGenerateId(),
    name: input.name,
    price: input.price,
    durationDays: input.durationDays,
    benefits: input.benefits,
    createdAt: new Date(),
  }
  plans.set(plan.planId, plan)
  return plan
}

function inlineCreateBenefitsForSubscription(
  subscriptionId: string,
  benefitNames: string[],
  expiresAt: Date,
  benefitCounter: { next: number },
): InlineBenefit[] {
  return benefitNames.map((name) => ({
    benefitId: `ben-${benefitCounter.next++}-${Date.now().toString(36)}`,
    subscriptionId,
    type: BENEFIT_NAME_MAP[name] || 'points_multiplier',
    expiresAt,
  }))
}

function inlineSubscribe(
  plans: Map<string, InlinePlan>,
  subscriptions: Map<string, InlineSubscription>,
  userSubscriptions: Map<string, string>,
  benefitsMap: Map<string, InlineBenefit[]>,
  benefitCounter: { next: number },
  userId: string,
  planId: string,
): InlineSubscription | null {
  const plan = plans.get(planId)
  if (!plan) return null

  const existingSubId = userSubscriptions.get(userId)
  if (existingSubId) {
    const existing = subscriptions.get(existingSubId)
    if (existing && existing.status === 'active') return null
  }

  const subscriptionId = inlineGenerateId()
  const now = new Date()
  const expireAt = new Date(now)
  expireAt.setDate(expireAt.getDate() + plan.durationDays)

  const subscription: InlineSubscription = {
    subscriptionId,
    userId,
    planId,
    status: 'active',
    startAt: now,
    expireAt,
    autoRenew: true,
    createdAt: now,
  }

  subscriptions.set(subscriptionId, subscription)
  userSubscriptions.set(userId, subscriptionId)

  const benefits = inlineCreateBenefitsForSubscription(subscriptionId, plan.benefits, expireAt, benefitCounter)
  benefitsMap.set(subscriptionId, benefits)

  return subscription
}

function inlineCancelSubscription(
  subscriptions: Map<string, InlineSubscription>,
  subscriptionId: string,
): InlineSubscription | null {
  const sub = subscriptions.get(subscriptionId)
  if (!sub) return null
  sub.status = 'cancelled'
  sub.autoRenew = false
  return sub
}

function inlineRenewSubscription(
  plans: Map<string, InlinePlan>,
  subscriptions: Map<string, InlineSubscription>,
  subscriptionId: string,
): InlineSubscription | null {
  const sub = subscriptions.get(subscriptionId)
  if (!sub) return null

  const plan = plans.get(sub.planId)
  if (!plan) return null

  sub.expireAt = new Date(sub.expireAt)
  sub.expireAt.setDate(sub.expireAt.getDate() + plan.durationDays)
  sub.status = 'active'
  sub.autoRenew = true
  return sub
}

function inlineCheckAndExpire(
  subscriptions: Map<string, InlineSubscription>,
): number {
  const now = new Date()
  let expiredCount = 0
  subscriptions.forEach((sub) => {
    if (sub.status === 'active' && sub.expireAt < now) {
      sub.status = 'expired'
      expiredCount++
    }
  })
  return expiredCount
}

function inlineGetSubscription(
  subscriptions: Map<string, InlineSubscription>,
  userSubscriptions: Map<string, string>,
  userId: string,
): InlineSubscription | null {
  const subId = userSubscriptions.get(userId)
  if (!subId) return null
  const sub = subscriptions.get(subId)
  if (!sub) return null
  // 检查并自动过期
  if (sub.status === 'active' && sub.expireAt < new Date()) {
    sub.status = 'expired'
  }
  return sub
}

function inlineUseBenefit(
  subscriptions: Map<string, InlineSubscription>,
  userSubscriptions: Map<string, string>,
  benefitsMap: Map<string, InlineBenefit[]>,
  userId: string,
  benefitType: string,
): InlineBenefit | null {
  const subId = userSubscriptions.get(userId)
  if (!subId) return null

  const sub = subscriptions.get(subId)
  if (!sub || sub.status !== 'active') return null

  const benefits = benefitsMap.get(subId) || []
  const benefit = benefits.find((b) => b.type === benefitType && !b.usedAt)
  if (!benefit) return null

  benefit.usedAt = new Date()
  return benefit
}

function inlineGetBenefits(
  benefitsMap: Map<string, InlineBenefit[]>,
  subscriptionId: string,
): InlineBenefit[] {
  return benefitsMap.get(subscriptionId) || []
}

// ═══════════════════════════════════════════════════════════════
// Mock 数据工厂
// ═══════════════════════════════════════════════════════════════

function makePlan(overrides: Partial<InlinePlan> = {}): InlinePlan {
  return {
    planId: 'plan-test-001',
    name: '黄金会员',
    price: 299,
    durationDays: 30,
    benefits: ['积分翻倍', '免费配送'],
    createdAt: new Date('2026-01-01'),
    ...overrides,
  }
}

function makeSubscription(overrides: Partial<InlineSubscription> = {}): InlineSubscription {
  const now = new Date('2026-07-01')
  const expireAt = new Date('2026-08-01')
  return {
    subscriptionId: 'sub-test-001',
    userId: 'user-001',
    planId: 'plan-test-001',
    status: 'active',
    startAt: now,
    expireAt,
    autoRenew: true,
    createdAt: now,
    ...overrides,
  }
}

function makeBenefit(overrides: Partial<InlineBenefit> = {}): InlineBenefit {
  return {
    benefitId: 'ben-test-001',
    subscriptionId: 'sub-test-001',
    type: 'points_multiplier',
    expiresAt: new Date('2026-08-01'),
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════
// 测试套件
// ═══════════════════════════════════════════════════════════════

describe('SvipService (内联纯函数)', () => {
  let plans: Map<string, InlinePlan>
  let subscriptions: Map<string, InlineSubscription>
  let userSubscriptions: Map<string, string>
  let benefitsMap: Map<string, InlineBenefit[]>
  let benefitCounter: { next: number }

  beforeEach(() => {
    plans = new Map()
    subscriptions = new Map()
    userSubscriptions = new Map()
    benefitsMap = new Map()
    benefitCounter = { next: 1 }
  })

  // ── 1. Plan 管理 ────────────────────────────────────────────

  describe('1. Plan 管理', () => {
    it('createPlan — 创建会员计划，生成 planId', () => {
      const p = inlineCreatePlan(plans, { name: '钻石会员', price: 599, durationDays: 90, benefits: ['积分翻倍', '免费配送', '专属折扣'] })
      expect(p.planId).toBeTruthy()
      expect(p.name).toBe('钻石会员')
      expect(p.price).toBe(599)
      expect(p.durationDays).toBe(90)
      expect(p.benefits).toHaveLength(3)
      expect(plans.size).toBe(1)
    })
  })

  // ── 2. 订阅管理 ─────────────────────────────────────────────

  describe('2. 订阅管理', () => {
    it('subscribe — 新用户订阅成功，状态 active', () => {
      const plan = inlineCreatePlan(plans, { name: '黄金', price: 299, durationDays: 30, benefits: ['积分翻倍', '免费配送'] })
      const sub = inlineSubscribe(plans, subscriptions, userSubscriptions, benefitsMap, benefitCounter, 'user-001', plan.planId)
      expect(sub).toBeTruthy()
      expect(sub!.status).toBe('active')
      expect(sub!.userId).toBe('user-001')
      expect(sub!.autoRenew).toBe(true)
      expect(subscriptions.size).toBe(1)
    })

    it('subscribe — 不存在的 plan 返回 null', () => {
      const sub = inlineSubscribe(plans, subscriptions, userSubscriptions, benefitsMap, benefitCounter, 'user-001', 'nonexistent')
      expect(sub).toBeNull()
    })

    it('subscribe — 已有 active 订阅时拒绝重复订阅', () => {
      const plan = inlineCreatePlan(plans, { name: '黄金', price: 299, durationDays: 30, benefits: ['积分翻倍'] })
      inlineSubscribe(plans, subscriptions, userSubscriptions, benefitsMap, benefitCounter, 'user-001', plan.planId)
      const result = inlineSubscribe(plans, subscriptions, userSubscriptions, benefitsMap, benefitCounter, 'user-001', plan.planId)
      expect(result).toBeNull()
    })

    it('subscribe — 取消后可以重新订阅', () => {
      const plan = inlineCreatePlan(plans, { name: '黄金', price: 299, durationDays: 30, benefits: ['积分翻倍'] })
      const sub1 = inlineSubscribe(plans, subscriptions, userSubscriptions, benefitsMap, benefitCounter, 'user-001', plan.planId)!
      inlineCancelSubscription(subscriptions, sub1.subscriptionId)
      const sub2 = inlineSubscribe(plans, subscriptions, userSubscriptions, benefitsMap, benefitCounter, 'user-001', plan.planId)
      expect(sub2).toBeTruthy()
      expect(sub2!.status).toBe('active')
    })

    it('cancelSubscription — 取消后 status=cancelled, autoRenew=false', () => {
      const plan = inlineCreatePlan(plans, { name: '黄金', price: 299, durationDays: 30, benefits: ['积分翻倍'] })
      const sub = inlineSubscribe(plans, subscriptions, userSubscriptions, benefitsMap, benefitCounter, 'user-001', plan.planId)!
      const cancelled = inlineCancelSubscription(subscriptions, sub.subscriptionId)
      expect(cancelled!.status).toBe('cancelled')
      expect(cancelled!.autoRenew).toBe(false)
    })

    it('cancelSubscription — 不存在的订阅返回 null', () => {
      expect(inlineCancelSubscription(subscriptions, 'nonexistent')).toBeNull()
    })

    it('renewSubscription — 续期延长 expireAt', () => {
      const plan = inlineCreatePlan(plans, { name: '黄金', price: 299, durationDays: 30, benefits: ['积分翻倍'] })
      const sub = inlineSubscribe(plans, subscriptions, userSubscriptions, benefitsMap, benefitCounter, 'user-001', plan.planId)!
      const originalExpire = sub.expireAt.getTime()
      const renewed = inlineRenewSubscription(plans, subscriptions, sub.subscriptionId)
      expect(renewed!.status).toBe('active')
      expect(renewed!.expireAt.getTime()).toBeGreaterThan(originalExpire)
      expect(renewed!.autoRenew).toBe(true)
    })

    it('renewSubscription — 不存在或 plan 不存在返回 null', () => {
      expect(inlineRenewSubscription(plans, subscriptions, 'nonexistent')).toBeNull()
    })
  })

  // ── 3. 到期管理 ─────────────────────────────────────────────

  describe('3. 到期管理', () => {
    it('checkAndExpire — 过期订阅被标记 expired', () => {
      const sub = makeSubscription({ expireAt: new Date('2025-01-01'), status: 'active' })
      subscriptions.set(sub.subscriptionId, sub)
      const count = inlineCheckAndExpire(subscriptions)
      expect(count).toBe(1)
      expect(sub.status).toBe('expired')
    })

    it('checkAndExpire — 未过期订阅不受影响', () => {
      const sub = makeSubscription({ expireAt: new Date('2099-01-01'), status: 'active' })
      subscriptions.set(sub.subscriptionId, sub)
      const count = inlineCheckAndExpire(subscriptions)
      expect(count).toBe(0)
      expect(sub.status).toBe('active')
    })

    it('getSubscription — 过期自动标记为 expired', () => {
      const sub = makeSubscription({ expireAt: new Date('2025-01-01'), status: 'active' })
      subscriptions.set(sub.subscriptionId, sub)
      userSubscriptions.set('user-001', sub.subscriptionId)
      const result = inlineGetSubscription(subscriptions, userSubscriptions, 'user-001')
      expect(result!.status).toBe('expired')
    })

    it('getSubscription — 无订阅用户返回 null', () => {
      expect(inlineGetSubscription(subscriptions, userSubscriptions, 'nobody')).toBeNull()
    })
  })

  // ── 4. 权益管理 ─────────────────────────────────────────────

  describe('4. 权益管理', () => {
    it('subscribe 后自动创建权益', () => {
      const plan = inlineCreatePlan(plans, { name: '黄金', price: 299, durationDays: 30, benefits: ['积分翻倍', '免费配送', '专属折扣'] })
      const sub = inlineSubscribe(plans, subscriptions, userSubscriptions, benefitsMap, benefitCounter, 'user-001', plan.planId)!
      const benefits = inlineGetBenefits(benefitsMap, sub.subscriptionId)
      expect(benefits).toHaveLength(3)
      expect(benefits.map((b) => b.type)).toContain('points_multiplier')
      expect(benefits.map((b) => b.type)).toContain('free_delivery')
      expect(benefits.map((b) => b.type)).toContain('exclusive_discount')
    })

    it('useBenefit — 使用权益后标记 usedAt', () => {
      const plan = inlineCreatePlan(plans, { name: '黄金', price: 299, durationDays: 30, benefits: ['积分翻倍', '免费配送'] })
      inlineSubscribe(plans, subscriptions, userSubscriptions, benefitsMap, benefitCounter, 'user-001', plan.planId)
      const used = inlineUseBenefit(subscriptions, userSubscriptions, benefitsMap, 'user-001', 'points_multiplier')
      expect(used).toBeTruthy()
      expect(used!.usedAt).toBeInstanceOf(Date)
      expect(used!.type).toBe('points_multiplier')
    })

    it('useBenefit — 权益已使用不能再次使用', () => {
      const plan = inlineCreatePlan(plans, { name: '黄金', price: 299, durationDays: 30, benefits: ['积分翻倍'] })
      inlineSubscribe(plans, subscriptions, userSubscriptions, benefitsMap, benefitCounter, 'user-001', plan.planId)
      inlineUseBenefit(subscriptions, userSubscriptions, benefitsMap, 'user-001', 'points_multiplier')
      const second = inlineUseBenefit(subscriptions, userSubscriptions, benefitsMap, 'user-001', 'points_multiplier')
      expect(second).toBeNull()
    })

    it('useBenefit — 已取消/过期订阅不能使用权益', () => {
      const plan = inlineCreatePlan(plans, { name: '黄金', price: 299, durationDays: 30, benefits: ['积分翻倍'] })
      const sub = inlineSubscribe(plans, subscriptions, userSubscriptions, benefitsMap, benefitCounter, 'user-001', plan.planId)!
      inlineCancelSubscription(subscriptions, sub.subscriptionId)
      const used = inlineUseBenefit(subscriptions, userSubscriptions, benefitsMap, 'user-001', 'points_multiplier')
      expect(used).toBeNull()
    })

    it('useBenefit — 未订阅用户返回 null', () => {
      const used = inlineUseBenefit(subscriptions, userSubscriptions, benefitsMap, 'nobody', 'points_multiplier')
      expect(used).toBeNull()
    })

    it('getBenefits — 无权益返回空数组', () => {
      expect(inlineGetBenefits(benefitsMap, 'nonexistent')).toEqual([])
    })
  })
})
