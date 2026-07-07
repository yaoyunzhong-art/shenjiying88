import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * svip.e2e.test.ts
 *
 * SVIP 会员管理 E2E 集成测试 —— 覆盖完整生命周期
 *
 * 测试场景:
 * 1. 创建计划 → 订阅 → 查看权益 → 使用权益 → 取消订阅 → 续期
 * 2. 同名用户重复订阅拒绝
 * 3. 不存在的计划拒绝订阅
 * 4. 权益重复使用拒绝
 */

import { firstValueFrom } from 'rxjs'
import { SvipController } from './svip.controller'
import { SvipService } from './svip.service'
import type { SVIPPlan, SVIPSubscription, SVIPBenefit, SVIPBenefitType } from './svip.entity'

describe('SVIP 会员 E2E 集成测试', () => {
  let controller: SvipController
  let service: SvipService

  beforeEach(() => {
    service = new SvipService()
    controller = new SvipController(service)
  })

  // ── 完整用户生命周期流程 ──
  describe('完整用户生命周期', () => {
    it('✔️ 创建计划 → 订阅 → 查看权益 → 使用权益 → 取消 → 续期', async () => {
      // 1. 创建计划
      const plan = await firstValueFrom(
        controller.createPlan({ name: '月度会员', price: 99, durationDays: 30, benefits: ['积分翻倍', '免费配送'] }),
      )
      expect(plan).toBeDefined()
      expect(plan.planId).toBeTruthy()

      // 2. 订阅
      const sub = await firstValueFrom(controller.subscribe({ userId: 'e2e-user', planId: plan.planId }))
      expect(sub).not.toBeNull()
      expect(sub!.userId).toBe('e2e-user')
      expect(sub!.status).toBe('active')
      expect(sub!.autoRenew).toBe(true)
      expect(sub!.startAt).toBeInstanceOf(Date)
      expect(sub!.expireAt).toBeInstanceOf(Date)

      // 验证 expireAt 是 startAt + durationDays
      const diffMs = sub!.expireAt.getTime() - sub!.startAt.getTime()
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
      expect(diffDays).toBe(30)

      // 3. 查看权益
      const benefits1 = await firstValueFrom(controller.getBenefits(sub!.subscriptionId))
      expect(benefits1.length).toBe(2)
      const benefitTypes1 = benefits1.map(b => b.type)
      expect(benefitTypes1).toContain('points_multiplier')
      expect(benefitTypes1).toContain('free_delivery')

      // 4. 使用权益
      const used = await firstValueFrom(
        controller.useBenefit(sub!.subscriptionId, { userId: 'e2e-user', benefitType: 'points_multiplier' as SVIPBenefitType }),
      )
      expect(used).not.toBeNull()
      expect(used!.type).toBe('points_multiplier')
      expect(used!.usedAt).toBeInstanceOf(Date)

      // 验证使用后权益列表中 usedAt 有值
      const benefits2 = await firstValueFrom(controller.getBenefits(sub!.subscriptionId))
      const pointsBenefit = benefits2.find(b => b.type === 'points_multiplier')
      expect(pointsBenefit).toBeDefined()
      expect(pointsBenefit!.usedAt).toBeInstanceOf(Date)

      // 5. 取消订阅
      const cancelled = await firstValueFrom(controller.cancel(sub!.subscriptionId))
      expect(cancelled).not.toBeNull()
      expect(cancelled!.status).toBe('cancelled')
      expect(cancelled!.autoRenew).toBe(false)

      // 6. 续期
      const renewed = await firstValueFrom(controller.renew(sub!.subscriptionId))
      expect(renewed).not.toBeNull()
      expect(renewed!.status).toBe('active')
      // expireAt should be >= original (same-ms flakiness allowed)
      expect(renewed!.expireAt.getTime()).toBeGreaterThanOrEqual(sub!.expireAt.getTime())
    })
  })

  // ── 多计划管理 ──
  describe('多计划管理', () => {
    it('✔️ 创建多个计划并验证每个独立的 planId', async () => {
      const plans = await Promise.all([
        firstValueFrom(controller.createPlan({ name: '基础', price: 99, durationDays: 30, benefits: ['积分翻倍'] })),
        firstValueFrom(controller.createPlan({ name: '高级', price: 299, durationDays: 90, benefits: ['积分翻倍', '免费配送'] })),
        firstValueFrom(controller.createPlan({ name: '旗舰', price: 999, durationDays: 365, benefits: ['积分翻倍', '免费配送', '专属折扣'] })),
      ])

      // 所有 planId 互不相同
      const ids = plans.map(p => p.planId)
      expect(new Set(ids).size).toBe(3)

      // 价格逐级递增
      expect(plans[0].price).toBe(99)
      expect(plans[1].price).toBe(299)
      expect(plans[2].price).toBe(999)
    })
  })

  // ── 边界与异常 ──
  describe('边界与异常', () => {
    it('⚠️ 重复订阅同用户返回 null', async () => {
      const plan = await firstValueFrom(
        controller.createPlan({ name: '基础', price: 99, durationDays: 30, benefits: [] }),
      )

      const sub1 = await firstValueFrom(controller.subscribe({ userId: 'dup-user', planId: plan.planId }))
      expect(sub1).not.toBeNull()

      const sub2 = await firstValueFrom(controller.subscribe({ userId: 'dup-user', planId: plan.planId }))
      expect(sub2).toBeNull()
    })

    it('⚠️ 订阅不存在的计划返回 null', async () => {
      const sub = await firstValueFrom(
        controller.subscribe({ userId: 'ghost-user', planId: 'non-existent' }),
      )
      expect(sub).toBeNull()
    })

    it('⚠️ 权益重复使用返回 null', async () => {
      const plan = await firstValueFrom(
        controller.createPlan({ name: '单权益', price: 99, durationDays: 30, benefits: ['积分翻倍'] }),
      )
      const sub = await firstValueFrom(controller.subscribe({ userId: 'dup-benefit', planId: plan.planId }))

      const firstUse = await firstValueFrom(
        controller.useBenefit(sub!.subscriptionId, { userId: 'dup-benefit', benefitType: 'points_multiplier' as SVIPBenefitType }),
      )
      expect(firstUse).not.toBeNull()

      const secondUse = await firstValueFrom(
        controller.useBenefit(sub!.subscriptionId, { userId: 'dup-benefit', benefitType: 'points_multiplier' as SVIPBenefitType }),
      )
      expect(secondUse).toBeNull()
    })

    it('⚠️ 取消不存在的订阅返回 null', async () => {
      const result = await firstValueFrom(controller.cancel('fake-sub'))
      expect(result).toBeNull()
    })

    it('⚠️ 获取未注册用户的订阅返回 null', async () => {
      const sub = await firstValueFrom(controller.getSubscription('no-such-user'))
      expect(sub).toBeNull()
    })
  })

  // ── 并发安全 ──
  describe('并发场景', () => {
    it('✔️ 多个用户同时订阅同一计划均应成功', async () => {
      const plan = await firstValueFrom(
        controller.createPlan({ name: '热门', price: 199, durationDays: 30, benefits: ['积分翻倍'] }),
      )

      const users = Array.from({ length: 5 }, (_, i) => `concurrent-user-${i + 1}`)

      const results = await Promise.all(
        users.map(uid => firstValueFrom(controller.subscribe({ userId: uid, planId: plan.planId }))),
      )

      results.forEach((sub, i) => {
        expect(sub).not.toBeNull()
        expect(sub!.userId).toBe(users[i])
        expect(sub!.status).toBe('active')
      })
    })

    it('✔️ 多用户使用不同权益类型互不干扰', async () => {
      const plan = await firstValueFrom(
        controller.createPlan({
          name: '全服务',
          price: 399,
          durationDays: 60,
          benefits: ['积分翻倍', '免费配送', '专属折扣'],
        }),
      )

      const users = ['user-a', 'user-b', 'user-c']
      const types: SVIPBenefitType[] = ['points_multiplier', 'free_delivery', 'exclusive_discount']

      // 全部订阅
      const subs = await Promise.all(
        users.map(uid => firstValueFrom(controller.subscribe({ userId: uid, planId: plan.planId }))),
      )

      // 各用不同权益
      const uses = await Promise.all(
        subs.map((sub, i) =>
          firstValueFrom(
            controller.useBenefit(sub!.subscriptionId, { userId: users[i], benefitType: types[i] }),
          ),
        ),
      )

      uses.forEach((benefit, i) => {
        expect(benefit).not.toBeNull()
        expect(benefit!.type).toBe(types[i])
      })
    })
  })

  // ── 时间相关 ──
  describe('时间处理', () => {
    it('✔️ 订阅 expireAt 应在未来且时间差正确', async () => {
      const plan = await firstValueFrom(
        controller.createPlan({ name: '季度卡', price: 599, durationDays: 90, benefits: ['积分翻倍'] }),
      )
      const sub = await firstValueFrom(controller.subscribe({ userId: 'time-user', planId: plan.planId }))

      const now = Date.now()
      expect(sub!.expireAt.getTime()).toBeGreaterThan(now)
      expect(sub!.startAt.getTime()).toBeLessThanOrEqual(now)

      // 约 90 天
      const diffMs = sub!.expireAt.getTime() - sub!.startAt.getTime()
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
      expect(diffDays).toBe(90)
    })

    it('✔️ 续期后 expireAt 应延长一个计划周期', async () => {
      const plan = await firstValueFrom(
        controller.createPlan({ name: '月卡', price: 99, durationDays: 30, benefits: [] }),
      )
      const sub = await firstValueFrom(controller.subscribe({ userId: 'renew-time', planId: plan.planId }))
      const originalExpire = sub!.expireAt.getTime()

      const renewed = await firstValueFrom(controller.renew(sub!.subscriptionId))
      const renewedExpire = renewed!.expireAt.getTime()

      // 续期后应延长约 30 天
      const addedMs = renewedExpire - originalExpire
      const addedDays = Math.round(addedMs / (1000 * 60 * 60 * 24))
      expect(addedDays).toBe(30)
    })
  })
})
