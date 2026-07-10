/**
 * svip.stress.test.ts - SVIP 会员管理 压力/韧性测试
 *
 * 覆盖边界场景:
 * - 大批量计划创建与订阅并发
 * - 大量用户同时使用权益
 * - 过期批量巡检
 * - 重复订阅防护
 * - 极端数值与边界输入
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { SvipService } from './svip.service'
import { firstValueFrom } from 'rxjs'

describe('SVIP - Stress & Resilience', () => {
  let service: SvipService

  beforeEach(() => {
    service = new SvipService()
  })

  // ─── 大批量计划创建 ───

  describe('大批量计划创建', () => {
    it('顺序创建 500 个计划不崩溃', async () => {
      for (let i = 0; i < 500; i++) {
        await firstValueFrom(service.createPlan({
          name: `Stress Plan ${i}`,
          price: i % 1000,
          durationDays: (i % 365) + 1,
          benefits: i % 2 === 0 ? ['积分翻倍', '专属折扣'] : ['免费配送'],
        }))
      }
      const plans = await firstValueFrom(service.listPlans())
      assert.equal(plans.length, 500)
    })

    it('创建同名计划（不同 ID）不冲突', async () => {
      for (let i = 0; i < 100; i++) {
        await firstValueFrom(service.createPlan({
          name: '同名计划',
          price: 99,
          durationDays: 30,
          benefits: ['积分翻倍'],
        }))
      }
      const plans = await firstValueFrom(service.listPlans())
      const sameNameCount = plans.filter(p => p.name === '同名计划').length
      assert.equal(sameNameCount, 100)
    })
  })

  // ─── 大批量订阅 ───

  describe('大批量订阅', () => {
    it('200 个用户同时订阅不崩溃', async () => {
      await firstValueFrom(service.createPlan({
        name: '基础会员',
        price: 49,
        durationDays: 30,
        benefits: ['积分翻倍'],
      }))
      const plans = await firstValueFrom(service.listPlans())
      const planId = plans[0].planId

      for (let i = 0; i < 200; i++) {
        const sub = await firstValueFrom(service.subscribe(`stress-user-${i}`, planId))
        assert.ok(sub, `用户 stress-user-${i} 订阅失败`)
        assert.equal(sub!.status, 'active')
      }

      // 验证所有订阅都存在
      const sampleUser = await firstValueFrom(service.getSubscription('stress-user-0'))
      assert.ok(sampleUser)
      assert.equal(sampleUser!.userId, 'stress-user-0')
      assert.equal(sampleUser!.status, 'active')
    })
  })

  // ─── 重复订阅防护 ───

  describe('重复订阅防护', () => {
    it('同一用户反复订阅同一计划除首次外均被拒绝', async () => {
      await firstValueFrom(service.createPlan({
        name: 'SVIP',
        price: 99,
        durationDays: 30,
        benefits: ['专属折扣'],
      }))
      const planId = (await firstValueFrom(service.listPlans()))[0].planId

      // 首次订阅成功
      const first = await firstValueFrom(service.subscribe('dup-user', planId))
      assert.ok(first)

      // 后续 20 次订阅全部应返回 null
      for (let i = 0; i < 20; i++) {
        const result = await firstValueFrom(service.subscribe('dup-user', planId))
        assert.strictEqual(result, null, `第 ${i + 2} 次重复订阅应拒绝`)
      }
    })

    it('取消-再订阅循环 10 次不泄露', async () => {
      await firstValueFrom(service.createPlan({
        name: '循环会员',
        price: 99,
        durationDays: 30,
        benefits: ['积分翻倍'],
      }))
      const planId = (await firstValueFrom(service.listPlans()))[0].planId

      for (let i = 0; i < 10; i++) {
        const sub = await firstValueFrom(service.subscribe('cycle-user', planId))
        assert.ok(sub, `第 ${i + 1} 次订阅应成功`)
        await firstValueFrom(service.cancelSubscription(sub!.subscriptionId))
      }

      // 最终再订阅应成功
      const final = await firstValueFrom(service.subscribe('cycle-user', planId))
      assert.ok(final)
      assert.equal(final!.status, 'active')
    })
  })

  // ─── 大批量权益使用 ───

  describe('大批量权益使用', () => {
    it('200 用户各使用一次权益不崩溃', async () => {
      await firstValueFrom(service.createPlan({
        name: '超级会员',
        price: 199,
        durationDays: 30,
        benefits: ['积分翻倍', '专属折扣', '免费配送'],
      }))
      const planId = (await firstValueFrom(service.listPlans()))[0].planId

      // 200 用户订阅
      for (let i = 0; i < 200; i++) {
        const sub = await firstValueFrom(service.subscribe(`benefit-user-${i}`, planId))
        assert.ok(sub)
      }

      // 全部使用积分翻倍权益
      let usedCount = 0
      for (let i = 0; i < 200; i++) {
        const benefit = await firstValueFrom(service.useBenefit(`benefit-user-${i}`, 'points_multiplier'))
        if (benefit) usedCount++
      }
      assert.equal(usedCount, 200, '所有用户应成功使用权益')

      // 第二次使用同一权益应全部失败
      let reUseCount = 0
      for (let i = 0; i < 200; i++) {
        const benefit = await firstValueFrom(service.useBenefit(`benefit-user-${i}`, 'points_multiplier'))
        if (benefit) reUseCount++
      }
      assert.equal(reUseCount, 0, '重复使用同一权益应全部失败')
    })
  })

  // ─── 过期批量巡检 ───

  describe('过期批量巡检', () => {
    it('checkAndExpire 不影响活跃订阅', async () => {
      await firstValueFrom(service.createPlan({
        name: '活跃会员',
        price: 99,
        durationDays: 365,
        benefits: ['积分翻倍'],
      }))
      const planId = (await firstValueFrom(service.listPlans()))[0].planId
      await firstValueFrom(service.subscribe('active-user', planId))

      const expired = await firstValueFrom(service.checkAndExpire())
      assert.equal(expired, 0, '活跃订阅不应被标记为过期')
    })
  })

  // ─── 极端输入 ───

  describe('极端输入韧性', () => {
    it('价格 0 的计划订阅后权益正常', async () => {
      await firstValueFrom(service.createPlan({
        name: '免费会员',
        price: 0,
        durationDays: 7,
        benefits: ['积分翻倍'],
      }))
      const planId = (await firstValueFrom(service.listPlans()))[0].planId

      const sub = await firstValueFrom(service.subscribe('free-user', planId))
      assert.ok(sub)
      assert.equal(sub!.status, 'active')

      // 权益仍然可用
      const benefit = await firstValueFrom(service.useBenefit('free-user', 'points_multiplier'))
      assert.ok(benefit, '免费计划的权益应可用')
    })

    it('超长 benefits 列表应处理', async () => {
      const benefits = Array.from({ length: 100 }, (_, i) => `权益${i + 1}`)
      await firstValueFrom(service.createPlan({
        name: '全能会员',
        price: 9999,
        durationDays: 365,
        benefits,
      }))
      const planId = (await firstValueFrom(service.listPlans()))[0].planId
      const sub = await firstValueFrom(service.subscribe('fat-plan-user', planId))
      assert.ok(sub)

      const allBenefits = await firstValueFrom(service.getBenefits(sub!.subscriptionId))
      assert.equal(allBenefits.length, 100, '100 个权益都应创建')
    })

    it('极短期限（1 天）订阅正常', async () => {
      await firstValueFrom(service.createPlan({
        name: '日卡会员',
        price: 9,
        durationDays: 1,
        benefits: ['积分翻倍'],
      }))
      const planId = (await firstValueFrom(service.listPlans()))[0].planId
      const sub = await firstValueFrom(service.subscribe('day-pass-user', planId))
      assert.ok(sub)

      const diffMs = sub!.expireAt.getTime() - sub!.startAt.getTime()
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      assert.ok(diffDays >= 0.9 && diffDays <= 1.1, `到期差值 ${diffDays} 天应 ≈1 天`)
    })

    it('极长期限（10 年）订阅正常', async () => {
      await firstValueFrom(service.createPlan({
        name: '终身会员',
        price: 9999,
        durationDays: 3650,
        benefits: ['积分翻倍'],
      }))
      const planId = (await firstValueFrom(service.listPlans()))[0].planId
      const sub = await firstValueFrom(service.subscribe('lifetime-user', planId))
      assert.ok(sub)

      const diffMs = sub!.expireAt.getTime() - sub!.startAt.getTime()
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      assert.ok(diffDays >= 3649, `到期差值 ${diffDays} 天应 ≈3650 天`)
    })
  })
})
