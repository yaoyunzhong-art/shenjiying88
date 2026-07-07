import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'reflect-metadata'
import { firstValueFrom, Observable } from 'rxjs'
import { SvipController } from './svip.controller'
import { SvipService } from './svip.service'
import assert from 'node:assert/strict'

describe('SvipController', () => {
  let controller: SvipController
  let service: SvipService

  beforeEach(() => {
    service = new SvipService()
    controller = new SvipController(service)
  })

  // ──────────────────────────────
  // Route metadata
  // ──────────────────────────────
  describe('route metadata', () => {
    it('controller path metadata should be svip', () => {
      const path = Reflect.getMetadata('path', SvipController)
      assert.equal(path, 'svip')
    })

    it('createPlan route should have POST method and plans path', () => {
      const method = Reflect.getMetadata('method', SvipController.prototype.createPlan)
      const path = Reflect.getMetadata('path', SvipController.prototype.createPlan)
      assert.equal(method, 1) // POST
      assert.equal(path, 'plans')
    })

    it('listPlans route should have GET method and plans path', () => {
      const method = Reflect.getMetadata('method', SvipController.prototype.listPlans)
      const path = Reflect.getMetadata('path', SvipController.prototype.listPlans)
      assert.equal(method, 0) // GET
      assert.equal(path, 'plans')
    })

    it('subscribe route should have POST method and subscribe path', () => {
      const method = Reflect.getMetadata('method', SvipController.prototype.subscribe)
      const path = Reflect.getMetadata('path', SvipController.prototype.subscribe)
      assert.equal(method, 1) // POST
      assert.equal(path, 'subscribe')
    })

    it('getSubscription route should have GET method', () => {
      const method = Reflect.getMetadata('method', SvipController.prototype.getSubscription)
      const path = Reflect.getMetadata('path', SvipController.prototype.getSubscription)
      assert.equal(method, 0) // GET
      assert.equal(path, 'subscription/:userId')
    })

    it('cancel route should have POST method', () => {
      const method = Reflect.getMetadata('method', SvipController.prototype.cancel)
      const path = Reflect.getMetadata('path', SvipController.prototype.cancel)
      assert.equal(method, 1) // POST
      assert.equal(path, ':subscriptionId/cancel')
    })

    it('renew route should have POST method', () => {
      const method = Reflect.getMetadata('method', SvipController.prototype.renew)
      const path = Reflect.getMetadata('path', SvipController.prototype.renew)
      assert.equal(method, 1) // POST
      assert.equal(path, ':subscriptionId/renew')
    })

    it('useBenefit route should have POST method', () => {
      const method = Reflect.getMetadata('method', SvipController.prototype.useBenefit)
      const path = Reflect.getMetadata('path', SvipController.prototype.useBenefit)
      assert.equal(method, 1) // POST
      assert.equal(path, ':subscriptionId/benefit')
    })

    it('getBenefits route should have GET method', () => {
      const method = Reflect.getMetadata('method', SvipController.prototype.getBenefits)
      const path = Reflect.getMetadata('path', SvipController.prototype.getBenefits)
      assert.equal(method, 0) // GET
      assert.equal(path, ':subscriptionId/benefits')
    })
  })

  // ──────────────────────────────
  // Positive test cases
  // ──────────────────────────────
  describe('POST /svip/plans — createPlan', () => {
    it('正例: 店长创建SVIP计划返回完整计划对象', async () => {
      const plan = await firstValueFrom(
        controller.createPlan({
          name: '铂金会员',
          price: 299,
          durationDays: 30,
          benefits: ['积分翻倍', '专属折扣'],
        }),
      )
      expect(plan.name).toBe('铂金会员')
      expect(plan.price).toBe(299)
      expect(plan.durationDays).toBe(30)
      expect(plan.benefits).toEqual(['积分翻倍', '专属折扣'])
      expect(plan.planId).toBeDefined()
      expect(plan.createdAt).toBeInstanceOf(Date)
    })

    it('边界: 价格为0的免费计划可创建', async () => {
      const plan = await firstValueFrom(
        controller.createPlan({ name: '免费体验', price: 0, durationDays: 7, benefits: ['积分翻倍'] }),
      )
      expect(plan.price).toBe(0)
      expect(plan.durationDays).toBe(7)
    })
  })

  describe('GET /svip/plans — listPlans', () => {
    it('正例: 返回计划列表（默认空数组）', async () => {
      const plans = await firstValueFrom(controller.listPlans())
      expect(Array.isArray(plans)).toBe(true)
      expect(plans.length).toBe(0)
    })
  })

  describe('POST /svip/subscribe — 订阅', () => {
    it('正例: 用户订阅SVIP计划成功', async () => {
      const plan = await firstValueFrom(
        controller.createPlan({ name: '黄金会员', price: 199, durationDays: 30, benefits: ['积分翻倍'] }),
      )
      const sub = await firstValueFrom(controller.subscribe({ userId: 'user-001', planId: plan.planId }))
      expect(sub).not.toBeNull()
      expect(sub!.userId).toBe('user-001')
      expect(sub!.planId).toBe(plan.planId)
      expect(sub!.status).toBe('active')
    })

    it('反例: 订阅不存在的计划返回 null', async () => {
      const sub = await firstValueFrom(controller.subscribe({ userId: 'user-002', planId: 'non-existent' }))
      expect(sub).toBeNull()
    })
  })

  describe('GET /svip/subscription/:userId — 获取订阅', () => {
    it('正例: 获取已订阅用户的订阅信息', async () => {
      const plan = await firstValueFrom(
        controller.createPlan({ name: '钻石会员', price: 499, durationDays: 90, benefits: ['积分翻倍'] }),
      )
      const sub = await firstValueFrom(controller.subscribe({ userId: 'user-010', planId: plan.planId }))
      expect(sub).not.toBeNull()

      const result = await firstValueFrom(controller.getSubscription('user-010'))
      expect(result).not.toBeNull()
      expect(result!.userId).toBe('user-010')
      expect(result!.status).toBe('active')
    })

    it('反例: 未订阅用户返回 null', async () => {
      const result = await firstValueFrom(controller.getSubscription('nonexistent'))
      expect(result).toBeNull()
    })
  })

  describe('POST /svip/:subscriptionId/cancel — 取消订阅', () => {
    it('正例: 取消活跃订阅后状态变为 cancelled', async () => {
      const plan = await firstValueFrom(
        controller.createPlan({ name: '周卡', price: 49, durationDays: 7, benefits: ['积分翻倍'] }),
      )
      const sub = await firstValueFrom(controller.subscribe({ userId: 'user-020', planId: plan.planId }))
      expect(sub).not.toBeNull()

      const cancelled = await firstValueFrom(controller.cancel(sub!.subscriptionId))
      expect(cancelled!.status).toBe('cancelled')
      expect(cancelled!.autoRenew).toBe(false)
    })

    it('反例: 取消不存在的订阅返回 null', async () => {
      const result = await firstValueFrom(controller.cancel('nonexistent-sub'))
      expect(result).toBeNull()
    })
  })

  describe('POST /svip/:subscriptionId/renew — 续费', () => {
    it('正例: 续费订阅延长有效期', async () => {
      const plan = await firstValueFrom(
        controller.createPlan({ name: '月卡', price: 99, durationDays: 30, benefits: ['积分翻倍'] }),
      )
      const sub = await firstValueFrom(controller.subscribe({ userId: 'user-030', planId: plan.planId }))
      expect(sub).not.toBeNull()

      const originalExpire = sub!.expireAt.getTime()
      const renewed = await firstValueFrom(controller.renew(sub!.subscriptionId))
      expect(renewed!.expireAt.getTime()).toBeGreaterThan(originalExpire)
      expect(renewed!.status).toBe('active')
    })

    it('反例: 续费不存在的订阅返回 null', async () => {
      const result = await firstValueFrom(controller.renew('nonexistent-sub'))
      expect(result).toBeNull()
    })
  })

  describe('POST /svip/:subscriptionId/benefit — 使用权益', () => {
    it('正例: 使用积分翻倍权益成功', async () => {
      const plan = await firstValueFrom(
        controller.createPlan({ name: '白金会员', price: 399, durationDays: 30, benefits: ['积分翻倍'] }),
      )
      const sub = await firstValueFrom(controller.subscribe({ userId: 'user-040', planId: plan.planId }))
      expect(sub).not.toBeNull()

      const benefit = await firstValueFrom(
        controller.useBenefit(sub!.subscriptionId, { userId: 'user-040', benefitType: 'points_multiplier' }),
      )
      expect(benefit).not.toBeNull()
      expect(benefit!.type).toBe('points_multiplier')
      expect(benefit!.usedAt).toBeInstanceOf(Date)
    })

    it('反例: 重复使用已用权益返回 null', async () => {
      const plan = await firstValueFrom(
        controller.createPlan({ name: '白金会员', price: 399, durationDays: 30, benefits: ['积分翻倍'] }),
      )
      const sub = await firstValueFrom(controller.subscribe({ userId: 'user-041', planId: plan.planId }))
      expect(sub).not.toBeNull()

      const firstUse = await firstValueFrom(
        controller.useBenefit(sub!.subscriptionId, { userId: 'user-041', benefitType: 'points_multiplier' }),
      )
      expect(firstUse).not.toBeNull()

      const secondUse = await firstValueFrom(
        controller.useBenefit(sub!.subscriptionId, { userId: 'user-041', benefitType: 'points_multiplier' }),
      )
      expect(secondUse).toBeNull()
    })

    it('边界: 未订阅用户使用权益返回 null', async () => {
      const result = await firstValueFrom(
        controller.useBenefit('nonexistent-sub', { userId: 'no-user', benefitType: 'free_delivery' }),
      )
      expect(result).toBeNull()
    })
  })

  describe('GET /svip/:subscriptionId/benefits — 获取权益', () => {
    it('正例: 获取已订阅用户的权益列表', async () => {
      const plan = await firstValueFrom(
        controller.createPlan({
          name: 'SVIP年卡',
          price: 2999,
          durationDays: 365,
          benefits: ['积分翻倍', '免费配送', '专属折扣'],
        }),
      )
      const sub = await firstValueFrom(controller.subscribe({ userId: 'user-050', planId: plan.planId }))
      expect(sub).not.toBeNull()

      const benefits = await firstValueFrom(controller.getBenefits(sub!.subscriptionId))
      expect(Array.isArray(benefits)).toBe(true)
      expect(benefits.length).toBe(3)
      expect(benefits.map((b) => b.type)).toContain('points_multiplier')
      expect(benefits.map((b) => b.type)).toContain('free_delivery')
      expect(benefits.map((b) => b.type)).toContain('exclusive_discount')
    })

    it('边界: 不存在的订阅返回空数组', async () => {
      const benefits = await firstValueFrom(controller.getBenefits('nonexistent-sub'))
      expect(Array.isArray(benefits)).toBe(true)
      expect(benefits.length).toBe(0)
    })
  })
})
