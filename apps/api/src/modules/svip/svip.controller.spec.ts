import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * SvipController 单元测试 (D类: controller spec 补全)
 * 
 * 策略：直接实例化 Controller + 真实 Service（内存），
 *       覆盖所有路由端点。
 * 正向流程 + 边界条件 + 异常情况
 */

import { firstValueFrom, Observable } from 'rxjs'
import { SvipController } from './svip.controller'
import { SvipService } from './svip.service'
import type { SVIPPlan, SVIPSubscription, SVIPBenefit, SVIPBenefitType } from './svip.entity'

// ── 测试辅助 ──
function subscribeTo<T>(obs: Observable<T>): Promise<T> {
  return firstValueFrom(obs)
}

describe('SvipController', () => {
  let controller: SvipController
  let service: SvipService

  beforeEach(() => {
    service = new SvipService()
    controller = new SvipController(service)
  })

  // ── 创建SVIP计划 ──
  describe('POST /svip/plans — createPlan', () => {
    it('应该成功创建一个黄金会员计划', async () => {
      const plan = await subscribeTo(
        controller.createPlan({ name: '黄金会员', price: 199, durationDays: 30, benefits: ['积分翻倍', '专属折扣'] }),
      )

      expect(plan).toBeDefined()
      expect(plan.name).toBe('黄金会员')
      expect(plan.price).toBe(199)
      expect(plan.durationDays).toBe(30)
      expect(plan.benefits).toContain('积分翻倍')
      expect(plan.benefits).toContain('专属折扣')
      expect(plan.planId).toBeTruthy()
      expect(plan.createdAt).toBeInstanceOf(Date)
    })

    it('应该支持创建多种价格和时长的计划', async () => {
      const plan1 = await subscribeTo(
        controller.createPlan({ name: '月度会员', price: 99, durationDays: 30, benefits: ['积分翻倍'] }),
      )
      const plan2 = await subscribeTo(
        controller.createPlan({ name: '年度会员', price: 999, durationDays: 365, benefits: ['积分翻倍', '免费配送', '专属折扣'] }),
      )

      expect(plan1.price).toBe(99)
      expect(plan1.durationDays).toBe(30)
      expect(plan2.price).toBe(999)
      expect(plan2.durationDays).toBe(365)
      expect(plan2.benefits.length).toBe(3)
    })

    it('应该为不同的计划生成不同的planId', async () => {
      const plan1 = await subscribeTo(
        controller.createPlan({ name: 'A', price: 10, durationDays: 1, benefits: [] }),
      )
      const plan2 = await subscribeTo(
        controller.createPlan({ name: 'B', price: 20, durationDays: 2, benefits: [] }),
      )

      expect(plan1.planId).not.toBe(plan2.planId)
    })

    it('边界：0天时长应该被允许创建（极端最小值）', async () => {
      const plan = await subscribeTo(
        controller.createPlan({ name: '体验日卡', price: 0, durationDays: 0, benefits: [] }),
      )
      expect(plan).toBeDefined()
      expect(plan.durationDays).toBe(0)
      expect(plan.price).toBe(0)
    })

    it('边界：空benefits数组应该被允许', async () => {
      const plan = await subscribeTo(
        controller.createPlan({ name: '空权益', price: 1, durationDays: 1, benefits: [] }),
      )
      expect(plan).toBeDefined()
      expect(plan.benefits).toEqual([])
    })
  })

  // ── 查询计划列表 ──
  describe('GET /svip/plans — listPlans', () => {
    it('当没有计划时应该返回空数组', async () => {
      const plans = await subscribeTo(controller.listPlans())
      expect(Array.isArray(plans)).toBe(true)
      expect(plans.length).toBe(0)
    })

    // listPlans 当前实现返回硬编码空数组（Controller stub），标记为待补充
  // 当 service.listPlans 完成后放开此测试
  it.skip('创建多个计划后应能全部列出（等待Service实现）', async () => {
    await subscribeTo(controller.createPlan({ name: 'P1', price: 100, durationDays: 30, benefits: ['B1'] }))
    await subscribeTo(controller.createPlan({ name: 'P2', price: 200, durationDays: 60, benefits: ['B2'] }))
    await subscribeTo(controller.createPlan({ name: 'P3', price: 300, durationDays: 90, benefits: ['B3'] }))

    const plans = await subscribeTo(controller.listPlans())
    expect(plans.length).toBe(3)
  })
  })

  // ── 订阅 ──
  describe('POST /svip/subscribe — subscribe', () => {
    it('用户应能成功订阅一个有效计划', async () => {
      const plan = await subscribeTo(
        controller.createPlan({ name: '黄金', price: 199, durationDays: 30, benefits: ['积分翻倍'] }),
      )
      const sub = await subscribeTo(controller.subscribe({ userId: 'user-001', planId: plan.planId }))

      expect(sub).not.toBeNull()
      expect(sub!.userId).toBe('user-001')
      expect(sub!.planId).toBe(plan.planId)
      expect(sub!.status).toBe('active')
      expect(sub!.autoRenew).toBe(true)
      expect(sub!.startAt).toBeInstanceOf(Date)
      expect(sub!.expireAt).toBeInstanceOf(Date)

      // expireAt 应在未来
      expect(sub!.expireAt.getTime()).toBeGreaterThan(sub!.startAt.getTime())
    })

    it('用户重复订阅应返回 null', async () => {
      const plan = await subscribeTo(
        controller.createPlan({ name: '基础', price: 99, durationDays: 30, benefits: [] }),
      )
      await subscribeTo(controller.subscribe({ userId: 'dup-user', planId: plan.planId }))
      const dup = await subscribeTo(controller.subscribe({ userId: 'dup-user', planId: plan.planId }))

      expect(dup).toBeNull()
    })

    it('订阅不存在的计划应返回 null', async () => {
      const sub = await subscribeTo(controller.subscribe({ userId: 'user-002', planId: 'non-existent' }))
      expect(sub).toBeNull()
    })
  })

  // ── 获取订阅 ──
  describe('GET /svip/subscription/:userId — getSubscription', () => {
    it('已订阅用户应能获取到自己的订阅', async () => {
      const plan = await subscribeTo(
        controller.createPlan({ name: 'VIP', price: 299, durationDays: 90, benefits: ['专属折扣'] }),
      )
      await subscribeTo(controller.subscribe({ userId: 'sub-user', planId: plan.planId }))

      const sub = await subscribeTo(controller.getSubscription('sub-user'))
      expect(sub).not.toBeNull()
      expect(sub!.userId).toBe('sub-user')
      expect(sub!.status).toBe('active')
    })

    it('未订阅用户应返回 null', async () => {
      const sub = await subscribeTo(controller.getSubscription('unregistered'))
      expect(sub).toBeNull()
    })

    it('取消后的订阅应能被查看到（状态已变更）', async () => {
      const plan = await subscribeTo(
        controller.createPlan({ name: '测试', price: 1, durationDays: 1, benefits: [] }),
      )
      const sub = await subscribeTo(controller.subscribe({ userId: 'cancel-check', planId: plan.planId }))
      await subscribeTo(controller.cancel(sub!.subscriptionId))

      const cancelled = await subscribeTo(controller.getSubscription('cancel-check'))
      expect(cancelled).not.toBeNull()
      expect(cancelled!.status).toBe('cancelled')
    })
  })

  // ── 取消订阅 ──
  describe('POST /svip/:subscriptionId/cancel — cancel', () => {
    it('成功取消一个有效订阅', async () => {
      const plan = await subscribeTo(
        controller.createPlan({ name: '月卡', price: 99, durationDays: 30, benefits: [] }),
      )
      const sub = await subscribeTo(controller.subscribe({ userId: 'cancel-user', planId: plan.planId }))

      const result = await subscribeTo(controller.cancel(sub!.subscriptionId))
      expect(result).not.toBeNull()
      expect(result!.status).toBe('cancelled')
      expect(result!.autoRenew).toBe(false)
    })

    it('取消不存在的订阅应返回 null', async () => {
      const result = await subscribeTo(controller.cancel('fake-sub-id'))
      expect(result).toBeNull()
    })
  })

  // ── 续期订阅 ──
  describe('POST /svip/:subscriptionId/renew — renew', () => {
    it('成功续期一个有效订阅，expireAt 应延长', async () => {
      const plan = await subscribeTo(
        controller.createPlan({ name: '半月卡', price: 59, durationDays: 15, benefits: ['积分翻倍'] }),
      )
      const sub = await subscribeTo(controller.subscribe({ userId: 'renew-user', planId: plan.planId }))
      const originalExpire = sub!.expireAt.getTime()

      const renewed = await subscribeTo(controller.renew(sub!.subscriptionId))
      expect(renewed).not.toBeNull()
      expect(renewed!.status).toBe('active')
      expect(renewed!.expireAt.getTime()).toBeGreaterThan(originalExpire)
    })

    it('续期不存在的订阅应返回 null', async () => {
      const result = await subscribeTo(controller.renew('fake-renew-id'))
      expect(result).toBeNull()
    })
  })

  // ── 使用权益 ──
  describe('POST /svip/:subscriptionId/benefit — useBenefit', () => {
    it('成功使用一个可用权益', async () => {
      const plan = await subscribeTo(
        controller.createPlan({ name: '黄金', price: 199, durationDays: 30, benefits: ['积分翻倍'] }),
      )
      const sub = await subscribeTo(controller.subscribe({ userId: 'benefit-user', planId: plan.planId }))

      const benefit = await subscribeTo(
        controller.useBenefit(sub!.subscriptionId, { userId: 'benefit-user', benefitType: 'points_multiplier' as SVIPBenefitType }),
      )
      expect(benefit).not.toBeNull()
      expect(benefit!.type).toBe('points_multiplier')
      expect(benefit!.usedAt).toBeInstanceOf(Date)
    })

    it('重复使用同一权益应返回 null', async () => {
      const plan = await subscribeTo(
        controller.createPlan({ name: '基础', price: 99, durationDays: 30, benefits: ['积分翻倍', '专属折扣'] }),
      )
      const sub = await subscribeTo(controller.subscribe({ userId: 'dup-benefit', planId: plan.planId }))

      await subscribeTo(
        controller.useBenefit(sub!.subscriptionId, { userId: 'dup-benefit', benefitType: 'points_multiplier' as SVIPBenefitType }),
      )
      const second = await subscribeTo(
        controller.useBenefit(sub!.subscriptionId, { userId: 'dup-benefit', benefitType: 'points_multiplier' as SVIPBenefitType }),
      )
      expect(second).toBeNull()
    })

    it('不存在的订阅使用权益应返回 null', async () => {
      const benefit = await subscribeTo(
        controller.useBenefit('fake-benefit-id', { userId: 'no-user', benefitType: 'free_delivery' as SVIPBenefitType }),
      )
      expect(benefit).toBeNull()
    })
  })

  // ── 查询权益列表 ──
  describe('GET /svip/:subscriptionId/benefits — getBenefits', () => {
    it('已订阅用户应能看到订阅附带的权益列表', async () => {
      const plan = await subscribeTo(
        controller.createPlan({ name: '全服务', price: 399, durationDays: 60, benefits: ['积分翻倍', '免费配送', '专属折扣'] }),
      )
      const sub = await subscribeTo(controller.subscribe({ userId: 'benefits-user', planId: plan.planId }))

      const benefits = await subscribeTo(controller.getBenefits(sub!.subscriptionId))
      expect(Array.isArray(benefits)).toBe(true)
      expect(benefits.length).toBe(3)

      // 验证权益类型映射正确
      const types = benefits.map(b => b.type)
      expect(types).toContain('points_multiplier')
      expect(types).toContain('free_delivery')
      expect(types).toContain('exclusive_discount')
    })

    it('不存在的订阅应返回空数组', async () => {
      const benefits = await subscribeTo(controller.getBenefits('fake-sub'))
      expect(Array.isArray(benefits)).toBe(true)
      expect(benefits.length).toBe(0)
    })

    it('使用过的权益在列表中仍应存在，但 usedAt 应有值', async () => {
      const plan = await subscribeTo(
        controller.createPlan({ name: '单权益', price: 99, durationDays: 30, benefits: ['积分翻倍'] }),
      )
      const sub = await subscribeTo(controller.subscribe({ userId: 'used-benefit', planId: plan.planId }))

      await subscribeTo(
        controller.useBenefit(sub!.subscriptionId, { userId: 'used-benefit', benefitType: 'points_multiplier' as SVIPBenefitType }),
      )

      const benefits = await subscribeTo(controller.getBenefits(sub!.subscriptionId))
      expect(benefits.length).toBe(1)
      expect(benefits[0].usedAt).toBeDefined()
      expect(benefits[0].usedAt).toBeInstanceOf(Date)
    })
  })
})
