/**
 * svip.service.spec.ts
 *
 * 纯内联函数式 — 不 import 生产代码
 * ≥18 项: 枚举+类型, mock 数据工厂, 内联业务逻辑纯函数
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ── 1. 枚举 + 类型定义 ──────────────────────────────────────────────────────

type SVIPStatus = 'active' | 'expired' | 'cancelled'
type SVIPBenefitType = 'points_multiplier' | 'free_delivery' | 'exclusive_discount'

interface SVIPPlan {
  planId: string
  name: string
  price: number
  durationDays: number
  benefits: string[]
  createdAt: Date
}

interface SVIPSubscription {
  subscriptionId: string
  userId: string
  planId: string
  status: SVIPStatus
  startAt: Date
  expireAt: Date
  autoRenew: boolean
  createdAt: Date
}

interface SVIPBenefit {
  benefitId: string
  subscriptionId: string
  type: SVIPBenefitType
  usedAt?: Date
  expiresAt?: Date
}

interface CreatePlanInput {
  name: string
  price: number
  durationDays: number
  benefits: string[]
}

// ── 2. Mock 数据工厂 ────────────────────────────────────────────────────────

function makeCreatePlanInput(overrides: Partial<CreatePlanInput> = {}): CreatePlanInput {
  return {
    name: '黄金会员',
    price: 199,
    durationDays: 30,
    benefits: ['积分翻倍'],
    ...overrides,
  }
}

function makePlan(overrides: Partial<SVIPPlan> = {}): SVIPPlan {
  return {
    planId: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: '黄金会员',
    price: 199,
    durationDays: 30,
    benefits: ['积分翻倍'],
    createdAt: new Date(),
    ...overrides,
  }
}

function makeSubscription(overrides: Partial<SVIPSubscription> = {}): SVIPSubscription {
  const now = new Date()
  return {
    subscriptionId: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: 'user-001',
    planId: 'plan-001',
    status: 'active',
    startAt: now,
    expireAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    autoRenew: true,
    createdAt: now,
    ...overrides,
  }
}

// ── 3. 纯内联工厂函数 — 替代 SvipService ────────────────────────────────────

function createSvipService() {
  const plans = new Map<string, SVIPPlan>()
  const subscriptions = new Map<string, SVIPSubscription>()
  const benefits = new Map<string, SVIPBenefit[]>()
  const userSubscriptions = new Map<string, string>()

  function genId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  function createPlan(input: CreatePlanInput): SVIPPlan {
    const planId = genId()
    const plan: SVIPPlan = {
      planId,
      name: input.name,
      price: input.price,
      durationDays: input.durationDays,
      benefits: input.benefits,
      createdAt: new Date(),
    }
    plans.set(planId, plan)
    return plan
  }

  function benefitNameToType(name: string): SVIPBenefitType {
    const map: Record<string, SVIPBenefitType> = {
      '积分翻倍': 'points_multiplier',
      '免费配送': 'free_delivery',
      '专属折扣': 'exclusive_discount',
    }
    return map[name] ?? 'points_multiplier'
  }

  function createBenefitsForSubscription(subscriptionId: string, benefitNames: string[], expiresAt: Date): SVIPBenefit[] {
    return benefitNames.map(name => ({
      benefitId: genId(),
      subscriptionId,
      type: benefitNameToType(name),
      expiresAt,
    }))
  }

  function subscribe(userId: string, planId: string): SVIPSubscription | null {
    const plan = plans.get(planId)
    if (!plan) return null

    const existingSubId = userSubscriptions.get(userId)
    if (existingSubId) {
      const existing = subscriptions.get(existingSubId)
      if (existing && existing.status === 'active') return null
    }

    const subscriptionId = genId()
    const now = new Date()
    const expireAt = new Date(now)
    expireAt.setDate(expireAt.getDate() + plan.durationDays)

    const subscription: SVIPSubscription = {
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

    const subBenefits = createBenefitsForSubscription(subscriptionId, plan.benefits, expireAt)
    benefits.set(subscriptionId, subBenefits)
    return subscription
  }

  function cancelSubscription(subscriptionId: string): SVIPSubscription | null {
    const sub = subscriptions.get(subscriptionId)
    if (!sub) return null
    sub.status = 'cancelled'
    sub.autoRenew = false
    subscriptions.set(subscriptionId, sub)
    return sub
  }

  function renewSubscription(subscriptionId: string): SVIPSubscription | null {
    const sub = subscriptions.get(subscriptionId)
    if (!sub) return null
    const plan = plans.get(sub.planId)
    if (!plan) return null
    const newExpire = new Date(sub.expireAt)
    newExpire.setDate(newExpire.getDate() + plan.durationDays)
    sub.expireAt = newExpire
    sub.status = 'active'
    sub.autoRenew = true
    subscriptions.set(subscriptionId, sub)
    return sub
  }

  function checkAndExpire(): number {
    const now = new Date()
    let expiredCount = 0
    subscriptions.forEach(sub => {
      if (sub.status === 'active' && sub.expireAt < now) {
        sub.status = 'expired'
        subscriptions.set(sub.subscriptionId, sub)
        expiredCount++
      }
    })
    return expiredCount
  }

  function getSubscription(userId: string): SVIPSubscription | null {
    const subId = userSubscriptions.get(userId)
    if (!subId) return null
    const sub = subscriptions.get(subId)
    if (!sub) return null
    if (sub.status === 'active' && sub.expireAt < new Date()) {
      sub.status = 'expired'
      subscriptions.set(subId, sub)
    }
    return sub
  }

  function useBenefit(userId: string, benefitType: SVIPBenefitType): SVIPBenefit | null {
    const subId = userSubscriptions.get(userId)
    if (!subId) return null
    const sub = subscriptions.get(subId)
    if (!sub || sub.status !== 'active') return null
    const userBenefits = benefits.get(subId) ?? []
    const benefit = userBenefits.find(b => b.type === benefitType && !b.usedAt)
    if (!benefit) return null
    benefit.usedAt = new Date()
    benefits.set(subId, userBenefits)
    return benefit
  }

  function getBenefits(subscriptionId: string): SVIPBenefit[] {
    return benefits.get(subscriptionId) ?? []
  }

  return { createPlan, subscribe, cancelSubscription, renewSubscription, checkAndExpire, getSubscription, useBenefit, getBenefits, plans, subscriptions, benefits, userSubscriptions }
}

// ── 4. Tests (≥18) ─────────────────────────────────────────────────────────

describe('SvipService (内联纯函数)', () => {
  let svc: ReturnType<typeof createSvipService>

  beforeEach(() => {
    svc = createSvipService()
  })

  // ── createPlan ──
  describe('createPlan', () => {
    it('正例: 成功创建SVIP计划返回完整计划对象', () => {
      const input = makeCreatePlanInput({ name: '黄金会员', price: 199, durationDays: 30, benefits: ['积分翻倍'] })
      const plan = svc.createPlan(input)
      expect(plan.planId).toBeTruthy()
      expect(plan.name).toBe('黄金会员')
      expect(plan.price).toBe(199)
      expect(plan.durationDays).toBe(30)
      expect(plan.benefits).toContain('积分翻倍')
      expect(plan.createdAt).toBeInstanceOf(Date)
    })

    it('正例: 每次创建生成不同 planId', () => {
      const p1 = svc.createPlan(makeCreatePlanInput({ name: 'A' }))
      const p2 = svc.createPlan(makeCreatePlanInput({ name: 'B' }))
      expect(p1.planId).not.toBe(p2.planId)
    })

    it('边界: 支持零天时长和零元价格', () => {
      const plan = svc.createPlan(makeCreatePlanInput({ price: 0, durationDays: 0 }))
      expect(plan.price).toBe(0)
      expect(plan.durationDays).toBe(0)
    })

    it('边界: 支持空benefits数组', () => {
      const plan = svc.createPlan(makeCreatePlanInput({ benefits: [] }))
      expect(plan.benefits).toEqual([])
    })
  })

  // ── subscribe ──
  describe('subscribe', () => {
    it('正例: 用户成功订阅有效计划返回订阅对象', () => {
      const plan = svc.createPlan(makeCreatePlanInput({ name: '月度会员', price: 99, durationDays: 30 }))
      const sub = svc.subscribe('user-001', plan.planId)
      expect(sub).not.toBeNull()
      expect(sub!.userId).toBe('user-001')
      expect(sub!.planId).toBe(plan.planId)
      expect(sub!.status).toBe('active')
      expect(sub!.autoRenew).toBe(true)
      expect(sub!.startAt).toBeInstanceOf(Date)
      expect(sub!.expireAt).toBeInstanceOf(Date)
    })

    it('正例: 订阅时长应正确从计划计算', () => {
      const plan = svc.createPlan(makeCreatePlanInput({ name: '年卡', price: 999, durationDays: 365 }))
      const sub = svc.subscribe('user-002', plan.planId)
      const diffMs = sub!.expireAt.getTime() - sub!.startAt.getTime()
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
      expect(diffDays).toBe(365)
    })

    it('反例: 重复订阅同一活跃用户返回 null', () => {
      const plan = svc.createPlan(makeCreatePlanInput({ name: '基础', durationDays: 30 }))
      svc.subscribe('dup-user', plan.planId)
      const duplicate = svc.subscribe('dup-user', plan.planId)
      expect(duplicate).toBeNull()
    })

    it('反例: 订阅不存在的计划返回 null', () => {
      const sub = svc.subscribe('user-003', 'ghost-plan')
      expect(sub).toBeNull()
    })
  })

  // ── cancelSubscription ──
  describe('cancelSubscription', () => {
    it('正例: 成功取消订阅返回已取消的订阅', () => {
      const plan = svc.createPlan(makeCreatePlanInput({ name: '月卡', durationDays: 30 }))
      const sub = svc.subscribe('cancel-user', plan.planId)
      const cancelled = svc.cancelSubscription(sub!.subscriptionId)
      expect(cancelled).not.toBeNull()
      expect(cancelled!.status).toBe('cancelled')
      expect(cancelled!.autoRenew).toBe(false)
    })

    it('反例: 取消不存在的订阅返回 null', () => {
      expect(svc.cancelSubscription('fake-id')).toBeNull()
    })
  })

  // ── renewSubscription ──
  describe('renewSubscription', () => {
    it('正例: 成功续期延长 expireAt', () => {
      const plan = svc.createPlan(makeCreatePlanInput({ name: '半月卡', durationDays: 15 }))
      const sub = svc.subscribe('renew-user', plan.planId)
      const originalExpire = sub!.expireAt.getTime()
      const renewed = svc.renewSubscription(sub!.subscriptionId)
      expect(renewed).not.toBeNull()
      expect(renewed!.status).toBe('active')
      expect(renewed!.expireAt.getTime()).toBeGreaterThan(originalExpire)
    })

    it('反例: 续期不存在的订阅返回 null', () => {
      expect(svc.renewSubscription('fake-renew')).toBeNull()
    })
  })

  // ── checkAndExpire ──
  describe('checkAndExpire', () => {
    it('正例: 无过期订阅返回 0', () => {
      const plan = svc.createPlan(makeCreatePlanInput({ durationDays: 365 }))
      svc.subscribe('user-check', plan.planId)
      expect(svc.checkAndExpire()).toBe(0)
    })
  })

  // ── getSubscription ──
  describe('getSubscription', () => {
    it('正例: 已订阅用户返回正确的订阅', () => {
      const plan = svc.createPlan(makeCreatePlanInput({ name: '至尊', price: 299, durationDays: 90 }))
      svc.subscribe('get-user', plan.planId)
      const sub = svc.getSubscription('get-user')
      expect(sub).not.toBeNull()
      expect(sub!.userId).toBe('get-user')
      expect(sub!.status).toBe('active')
    })

    it('反例: 未订阅用户返回 null', () => {
      expect(svc.getSubscription('no-sub-user')).toBeNull()
    })

    it('反例: 已取消订阅仍可查询', () => {
      const plan = svc.createPlan(makeCreatePlanInput({ durationDays: 1 }))
      const sub = svc.subscribe('cancel-get', plan.planId)
      svc.cancelSubscription(sub!.subscriptionId)
      const result = svc.getSubscription('cancel-get')
      expect(result).not.toBeNull()
      expect(result!.status).toBe('cancelled')
    })
  })

  // ── useBenefit ──
  describe('useBenefit', () => {
    it('正例: 成功使用可用权益', () => {
      const plan = svc.createPlan(makeCreatePlanInput({ benefits: ['积分翻倍'] }))
      const sub = svc.subscribe('benefit-user', plan.planId)
      const benefit = svc.useBenefit('benefit-user', 'points_multiplier')
      expect(benefit).not.toBeNull()
      expect(benefit!.type).toBe('points_multiplier')
      expect(benefit!.usedAt).toBeInstanceOf(Date)
    })

    it('反例: 重复使用同一权益返回 null', () => {
      const plan = svc.createPlan(makeCreatePlanInput({ benefits: ['积分翻倍'] }))
      svc.subscribe('dup-benefit', plan.planId)
      svc.useBenefit('dup-benefit', 'points_multiplier')
      const second = svc.useBenefit('dup-benefit', 'points_multiplier')
      expect(second).toBeNull()
    })

    it('反例: 未订阅用户返回 null', () => {
      expect(svc.useBenefit('no-user', 'free_delivery')).toBeNull()
    })
  })

  // ── getBenefits ──
  describe('getBenefits', () => {
    it('正例: 订阅后应有对应的权益列表', () => {
      const plan = svc.createPlan(makeCreatePlanInput({ benefits: ['积分翻倍', '免费配送', '专属折扣'] }))
      const sub = svc.subscribe('benefits-list-user', plan.planId)
      const subBenefits = svc.getBenefits(sub!.subscriptionId)
      expect(Array.isArray(subBenefits)).toBe(true)
      expect(subBenefits.length).toBe(3)
      const types = subBenefits.map(b => b.type)
      expect(types).toContain('points_multiplier')
      expect(types).toContain('free_delivery')
      expect(types).toContain('exclusive_discount')
    })

    it('边界: 不存在的订阅返回空数组', () => {
      const subBenefits = svc.getBenefits('fake-sub')
      expect(Array.isArray(subBenefits)).toBe(true)
      expect(subBenefits.length).toBe(0)
    })
  })
})
