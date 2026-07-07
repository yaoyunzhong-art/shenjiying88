import { describe, it, expect, beforeEach, vi } from 'vitest'
import { firstValueFrom, Observable } from 'rxjs'
import { SvipService } from './svip.service'

describe('SvipService', () => {
  let service: SvipService

  beforeEach(() => {
    service = new SvipService()
  })

  // ── createPlan ──
  describe('createPlan', () => {
    it('正例: 成功创建SVIP计划返回完整计划对象', async () => {
      const plan = await firstValueFrom(
        service.createPlan({ name: '黄金会员', price: 199, durationDays: 30, benefits: ['积分翻倍'] }),
      )

      expect(plan).toBeDefined()
      expect(plan.planId).toBeTruthy()
      expect(plan.name).toBe('黄金会员')
      expect(plan.price).toBe(199)
      expect(plan.durationDays).toBe(30)
      expect(plan.benefits).toContain('积分翻倍')
      expect(plan.createdAt).toBeInstanceOf(Date)
    })

    it('正例: 每次创建生成不同planId', async () => {
      const plan1 = await firstValueFrom(
        service.createPlan({ name: 'A', price: 10, durationDays: 1, benefits: [] }),
      )
      const plan2 = await firstValueFrom(
        service.createPlan({ name: 'B', price: 20, durationDays: 2, benefits: [] }),
      )

      expect(plan1.planId).not.toBe(plan2.planId)
    })

    it('边界: 支持零天时长和零元价格', async () => {
      const plan = await firstValueFrom(
        service.createPlan({ name: '免费体验', price: 0, durationDays: 0, benefits: [] }),
      )

      expect(plan.price).toBe(0)
      expect(plan.durationDays).toBe(0)
    })

    it('边界: 支持空benefits数组', async () => {
      const plan = await firstValueFrom(
        service.createPlan({ name: '无权益', price: 1, durationDays: 1, benefits: [] }),
      )

      expect(plan.benefits).toEqual([])
    })
  })

  // ── subscribe ──
  describe('subscribe', () => {
    it('正例: 用户成功订阅有效计划返回订阅对象', async () => {
      const plan = await firstValueFrom(
        service.createPlan({ name: '月度会员', price: 99, durationDays: 30, benefits: ['积分翻倍'] }),
      )

      const sub = await firstValueFrom(service.subscribe('user-001', plan.planId))

      expect(sub).not.toBeNull()
      expect(sub!.userId).toBe('user-001')
      expect(sub!.planId).toBe(plan.planId)
      expect(sub!.status).toBe('active')
      expect(sub!.autoRenew).toBe(true)
      expect(sub!.startAt).toBeInstanceOf(Date)
      expect(sub!.expireAt).toBeInstanceOf(Date)
    })

    it('正例: 订阅时长应正确从计划计算', async () => {
      const plan = await firstValueFrom(
        service.createPlan({ name: '年卡', price: 999, durationDays: 365, benefits: ['积分翻倍'] }),
      )

      const sub = await firstValueFrom(service.subscribe('user-002', plan.planId))

      const diffMs = sub!.expireAt.getTime() - sub!.startAt.getTime()
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
      expect(diffDays).toBe(365)
    })

    it('反例: 重复订阅同一用户返回 null', async () => {
      const plan = await firstValueFrom(
        service.createPlan({ name: '基础', price: 99, durationDays: 30, benefits: [] }),
      )

      await firstValueFrom(service.subscribe('dup-user', plan.planId))
      const duplicate = await firstValueFrom(service.subscribe('dup-user', plan.planId))

      expect(duplicate).toBeNull()
    })

    it('反例: 订阅不存在的计划返回 null', async () => {
      const sub = await firstValueFrom(service.subscribe('user-003', 'ghost-plan'))
      expect(sub).toBeNull()
    })
  })

  // ── cancelSubscription ──
  describe('cancelSubscription', () => {
    it('正例: 成功取消订阅返回已取消的订阅', async () => {
      const plan = await firstValueFrom(
        service.createPlan({ name: '月卡', price: 99, durationDays: 30, benefits: [] }),
      )
      const sub = await firstValueFrom(service.subscribe('cancel-user', plan.planId))

      const cancelled = await firstValueFrom(service.cancelSubscription(sub!.subscriptionId))

      expect(cancelled).not.toBeNull()
      expect(cancelled!.status).toBe('cancelled')
      expect(cancelled!.autoRenew).toBe(false)
    })

    it('反例: 取消不存在的订阅返回 null', async () => {
      const result = await firstValueFrom(service.cancelSubscription('fake-id'))
      expect(result).toBeNull()
    })
  })

  // ── renewSubscription ──
  describe('renewSubscription', () => {
    it('正例: 成功续期延长 expireAt', async () => {
      const plan = await firstValueFrom(
        service.createPlan({ name: '半月卡', price: 59, durationDays: 15, benefits: [] }),
      )
      const sub = await firstValueFrom(service.subscribe('renew-user', plan.planId))
      const originalExpire = sub!.expireAt.getTime()
      const originalStart = sub!.startAt.getTime()

      const renewed = await firstValueFrom(service.renewSubscription(sub!.subscriptionId))

      expect(renewed).not.toBeNull()
      expect(renewed!.status).toBe('active')
      expect(renewed!.expireAt.getTime()).toBeGreaterThan(originalExpire)
      // startAt should remain unchanged
      expect(renewed!.startAt.getTime()).toBe(originalStart)
    })

    it('反例: 续期不存在的订阅返回 null', async () => {
      const result = await firstValueFrom(service.renewSubscription('fake-renew'))
      expect(result).toBeNull()
    })
  })

  // ── checkAndExpire ──
  describe('checkAndExpire', () => {
    it('正例: 无过期订阅返回 0', async () => {
      const plan = await firstValueFrom(
        service.createPlan({ name: 'P', price: 10, durationDays: 365, benefits: [] }),
      )
      await firstValueFrom(service.subscribe('user-check', plan.planId))

      const count = await firstValueFrom(service.checkAndExpire())
      expect(count).toBe(0)
    })
  })

  // ── getSubscription ──
  describe('getSubscription', () => {
    it('正例: 已订阅用户返回正确的订阅', async () => {
      const plan = await firstValueFrom(
        service.createPlan({ name: '至尊', price: 299, durationDays: 90, benefits: ['专属折扣'] }),
      )
      await firstValueFrom(service.subscribe('get-user', plan.planId))

      const sub = await firstValueFrom(service.getSubscription('get-user'))
      expect(sub).not.toBeNull()
      expect(sub!.userId).toBe('get-user')
      expect(sub!.status).toBe('active')
    })

    it('反例: 未订阅用户返回 null', async () => {
      const sub = await firstValueFrom(service.getSubscription('no-sub-user'))
      expect(sub).toBeNull()
    })

    it('反例: 已取消订阅仍可查询（不返回null）', async () => {
      const plan = await firstValueFrom(
        service.createPlan({ name: '测试', price: 1, durationDays: 1, benefits: [] }),
      )
      const sub = await firstValueFrom(service.subscribe('cancel-get-user', plan.planId))
      await firstValueFrom(service.cancelSubscription(sub!.subscriptionId))

      const result = await firstValueFrom(service.getSubscription('cancel-get-user'))
      expect(result).not.toBeNull()
      expect(result!.status).toBe('cancelled')
    })
  })

  // ── useBenefit ──
  describe('useBenefit', () => {
    it('正例: 成功使用可用权益', async () => {
      const plan = await firstValueFrom(
        service.createPlan({ name: '黄金', price: 199, durationDays: 30, benefits: ['积分翻倍'] }),
      )
      const sub = await firstValueFrom(service.subscribe('benefit-user', plan.planId))

      const benefit = await firstValueFrom(service.useBenefit('benefit-user', 'points_multiplier'))

      expect(benefit).not.toBeNull()
      expect(benefit!.type).toBe('points_multiplier')
      expect(benefit!.usedAt).toBeInstanceOf(Date)
    })

    it('反例: 重复使用同一权益返回 null', async () => {
      const plan = await firstValueFrom(
        service.createPlan({ name: '基础', price: 99, durationDays: 30, benefits: ['积分翻倍'] }),
      )
      const sub = await firstValueFrom(service.subscribe('dup-benefit-user', plan.planId))

      await firstValueFrom(service.useBenefit('dup-benefit-user', 'points_multiplier'))
      const second = await firstValueFrom(service.useBenefit('dup-benefit-user', 'points_multiplier'))

      expect(second).toBeNull()
    })

    it('反例: 未订阅用户使用权益返回 null', async () => {
      const benefit = await firstValueFrom(service.useBenefit('no-user', 'free_delivery'))
      expect(benefit).toBeNull()
    })
  })

  // ── getBenefits ──
  describe('getBenefits', () => {
    it('正例: 订阅后应有对应的权益列表', async () => {
      const plan = await firstValueFrom(
        service.createPlan({
          name: '全服务',
          price: 399,
          durationDays: 60,
          benefits: ['积分翻倍', '免费配送', '专属折扣'],
        }),
      )
      const sub = await firstValueFrom(service.subscribe('benefits-list-user', plan.planId))

      const benefits = await firstValueFrom(service.getBenefits(sub!.subscriptionId))

      expect(Array.isArray(benefits)).toBe(true)
      expect(benefits.length).toBe(3)

      const types = benefits.map(b => b.type)
      expect(types).toContain('points_multiplier')
      expect(types).toContain('free_delivery')
      expect(types).toContain('exclusive_discount')
    })

    it('边界: 不存在的订阅返回空数组', async () => {
      const benefits = await firstValueFrom(service.getBenefits('fake-sub'))
      expect(Array.isArray(benefits)).toBe(true)
      expect(benefits.length).toBe(0)
    })
  })
})
