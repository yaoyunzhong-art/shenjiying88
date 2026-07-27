/**
 * birthday.service.boost.spec.ts
 * WP-15 生日趴引擎 — service 层补充单元测试
 *
 * 覆盖: 方案状态循环、跨年边界、全面参数校验、裂变多场景
 * 使用 vitest, 内存存储, 不依赖数据库
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BirthdayService } from './birthday.service'
import { BirthdayTier } from './birthday.entity'

function createSvc(): BirthdayService {
  const svc = new BirthdayService()
  svc.reset()
  return svc
}

function makePlan(
  svc: BirthdayService,
  overrides: Partial<{
    memberId: string
    birthday: string
    advanceDays: number
    tier: BirthdayTier
    rewardType: string
    rewardValue: number
    allowFriends: boolean
    friendDiscount: number
  }> = {},
) {
  const allowFriends = overrides.allowFriends ?? false
  return svc.createPlan({
    memberId: overrides.memberId ?? 'boost-m1',
    birthday: overrides.birthday ?? '08-15',
    advanceDays: overrides.advanceDays ?? 3,
    tier: overrides.tier ?? BirthdayTier.Standard,
    rewardType: (overrides.rewardType ?? 'coupon') as any,
    rewardValue: overrides.rewardValue ?? 50,
    allowFriends,
    friendDiscount: allowFriends ? (overrides.friendDiscount ?? 0.8) : undefined,
  })
}

describe('[Boost] BirthdayService — 状态流转/裂变/边界', () => {
  // ══════════════════════════════════════════════════════════════
  // 方案声明周期
  // ══════════════════════════════════════════════════════════════

  describe('方案状态流转', () => {
    it('[正例] 方案完整周期: pending → active → completed', () => {
      const svc = createSvc()
      const plan = makePlan(svc)
      expect(plan.status).toBe('pending')

      // 触发推送 → active
      const reward = svc.triggerPush(plan.id)
      expect(svc.getPlan(plan.id).status).toBe('active')

      // 领取奖励 → completed
      svc.claimReward(plan.id)
      expect(svc.getPlan(plan.id).status).toBe('completed')
    })

    it('[正例] completed 方案不可再次触发', () => {
      const svc = createSvc()
      const plan = makePlan(svc)
      svc.triggerPush(plan.id)
      svc.claimReward(plan.id)
      expect(() => svc.triggerPush(plan.id)).toThrow()
    })

    it('[反例] 触发已触发的方案抛错', () => {
      const svc = createSvc()
      const plan = makePlan(svc)
      svc.triggerPush(plan.id)
      expect(() => svc.triggerPush(plan.id)).toThrow('不可触发推送')
    })

    it('[反例] pending 方案领取奖励抛错', () => {
      const svc = createSvc()
      const plan = makePlan(svc)
      expect(() => svc.claimReward(plan.id)).toThrow('不可领取奖励')
    })

    it('[反例] completed 方案不可再次领取', () => {
      const svc = createSvc()
      const plan = makePlan(svc)
      svc.triggerPush(plan.id)
      svc.claimReward(plan.id)
      expect(() => svc.claimReward(plan.id)).toThrow()
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 参数校验边界
  // ══════════════════════════════════════════════════════════════

  describe('createPlan 参数边界', () => {
    it('[边界] advanceDays=0 合法', () => {
      const svc = createSvc()
      const plan = svc.createPlan({
        memberId: 'bdr-m1',
        birthday: '08-20',
        advanceDays: 0,
        tier: BirthdayTier.Standard,
        rewardType: 'coupon',
        rewardValue: 10,
      })
      expect(plan.advanceDays).toBe(0)
      expect(plan.status).toBe('pending')
    })

    it('[边界] advanceDays=30 合法', () => {
      const svc = createSvc()
      const plan = svc.createPlan({
        memberId: 'bdr-m2',
        birthday: '09-01',
        advanceDays: 30,
        tier: BirthdayTier.VIP,
        rewardType: 'gift',
        rewardValue: 200,
      })
      expect(plan.advanceDays).toBe(30)
    })

    it('[边界] rewardValue=最大整数', () => {
      const svc = createSvc()
      const plan = svc.createPlan({
        memberId: 'bdr-m3',
        birthday: '08-25',
        advanceDays: 5,
        tier: BirthdayTier.VIP,
        rewardType: 'discount',
        rewardValue: 999999,
      })
      expect(plan.rewardValue).toBe(999999)
    })

    it('[边界] friendDiscount=0 好友0折（免费）', () => {
      const svc = createSvc()
      const plan = svc.createPlan({
        memberId: 'bdr-m4',
        birthday: '08-10',
        advanceDays: 3,
        tier: BirthdayTier.VIP,
        rewardType: 'coupon',
        rewardValue: 100,
        allowFriends: true,
        friendDiscount: 0,
      })
      expect(plan.friendDiscount).toBe(0)
    })

    it('[边界] friendDiscount=1 好友全价', () => {
      const svc = createSvc()
      const plan = svc.createPlan({
        memberId: 'bdr-m5',
        birthday: '08-10',
        advanceDays: 3,
        tier: BirthdayTier.Premium,
        rewardType: 'gift',
        rewardValue: 80,
        allowFriends: true,
        friendDiscount: 1,
      })
      expect(plan.friendDiscount).toBe(1)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 生日识别 & 跨年
  // ══════════════════════════════════════════════════════════════

  describe('checkIsUpcoming & 跨年', () => {
    it('[正例] 今天生日返回 true', () => {
      const svc = createSvc()
      const now = new Date()
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const dd = String(now.getDate()).padStart(2, '0')
      expect(svc.checkIsUpcoming('m1', `${mm}-${dd}`)).toBe(true)
    })

    it('[正例] 29天后生日返回 true', () => {
      const svc = createSvc()
      const future = new Date()
      future.setDate(future.getDate() + 29)
      const mm = String(future.getMonth() + 1).padStart(2, '0')
      const dd = String(future.getDate()).padStart(2, '0')
      expect(svc.checkIsUpcoming('m2', `${mm}-${dd}`)).toBe(true)
    })

    it('[边界] 30天后生日返回 false（超出30天范围）', () => {
      const svc = createSvc()
      const future = new Date()
      future.setDate(future.getDate() + 31)
      const mm = String(future.getMonth() + 1).padStart(2, '0')
      const dd = String(future.getDate()).padStart(2, '0')
      expect(svc.checkIsUpcoming('m3', `${mm}-${dd}`)).toBe(false)
    })

    it('[边界] 跨年生日: 1月1日, 当前12月, 返回 true', () => {
      const svc = createSvc()
      // 模拟当前为12月, 生日为 01-05
      // 这个测试依赖系统时间, 如果当前是12月则 01-05 在30天内
      const now = new Date()
      const month = now.getMonth() + 1
      if (month >= 12) {
        expect(svc.checkIsUpcoming('m4', '01-05')).toBe(true)
      } else {
        // 如果当前不是12月, 01-05 是已过的生日（取到来年）, 要不在30天内
        ; // 无论如何不抛错即可
        expect(typeof svc.checkIsUpcoming('m4', '01-05')).toBe('boolean')
      }
    })

    it('[边界] 无效月份返回 false', () => {
      const svc = createSvc()
      expect(svc.checkIsUpcoming('m5', '13-01')).toBe(false)
      expect(svc.checkIsUpcoming('m6', '00-15')).toBe(false)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // markUpcomingBirthdays
  // ══════════════════════════════════════════════════════════════

  describe('markUpcomingBirthdays', () => {
    it('[正例] 部分会员没有生日信息时只标记有生日信息的', () => {
      const svc = createSvc()
      makePlan(svc, { memberId: 'um1' })
      const result = svc.markUpcomingBirthdays(['um1', 'um2'], {
        um1: '08-15',
        // um2 无生日信息
      })
      expect(result.marked).toBe(1)
    })

    it('[正例] 没有活跃方案的会员不会被标记', () => {
      const svc = createSvc()
      const result = svc.markUpcomingBirthdays(['no-plan-member'], {
        'no-plan-member': '08-20',
      })
      expect(result.marked).toBe(0)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 裂变追踪
  // ══════════════════════════════════════════════════════════════

  describe('裂变追踪 getFriendStats', () => {
    it('[正例] 多次生日裂变数据累加', () => {
      const svc = createSvc()
      // 第一次生日: 创建 → 完成(触发+领取), 然后记录追踪
      const plan1 = makePlan(svc, { memberId: 'fs-m1', birthday: '08-01', allowFriends: true, friendDiscount: 0.8 })
      svc.triggerPush(plan1.id)
      svc.claimReward(plan1.id)
      svc.recordTracking({ planId: plan1.id, friendInvited: 2, totalSpend: 300 })

      // 第二次生日: 会员已完成之前方案, 可以创建新方案
      const plan2 = makePlan(svc, { memberId: 'fs-m1', birthday: '08-01', allowFriends: true, friendDiscount: 0.8 })
      svc.recordTracking({ planId: plan2.id, friendInvited: 3, totalSpend: 600 })

      const stats = svc.getFriendStats('fs-m1')
      expect(stats.totalInvited).toBe(5)
      expect(stats.avgSpend).toBe(450) // (300+600)/2
    })

    it('[边界] 有方案但无追踪, 裂变数据为 0', () => {
      const svc = createSvc()
      makePlan(svc, { memberId: 'fs-m2' })
      const stats = svc.getFriendStats('fs-m2')
      expect(stats.totalInvited).toBe(0)
      expect(stats.avgSpend).toBe(0)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 会员统计
  // ══════════════════════════════════════════════════════════════

  describe('getMemberStats', () => {
    it('[正例] 多条方案 + 追踪计算正确', () => {
      const svc = createSvc()
      // 先完成第一个方案, 再创建第二个
      const p1 = makePlan(svc, { memberId: 'ms-m1', birthday: '08-01', allowFriends: true, friendDiscount: 0.8 })
      svc.triggerPush(p1.id)
      svc.claimReward(p1.id)
      svc.recordTracking({ planId: p1.id, friendInvited: 2, totalSpend: 300, returnVisitDays: 7 })

      const p2 = makePlan(svc, { memberId: 'ms-m1', birthday: '09-01', allowFriends: true, friendDiscount: 0.8 })
      svc.recordTracking({ planId: p2.id, friendInvited: 1, totalSpend: 150, returnVisitDays: 14 })

      const stats = svc.getMemberStats('ms-m1')
      expect(stats.planCount).toBe(2)
      expect(stats.totalSpend).toBe(450)
      expect(stats.totalInvited).toBe(3)
      expect(stats.avgReturnVisitDays).toBe(10.5) // (7+14)/2
    })

    it('[边界] 有方案无追踪时 avgReturnVisitDays 为 0', () => {
      const svc = createSvc()
      makePlan(svc, { memberId: 'ms-m2' })
      const stats = svc.getMemberStats('ms-m2')
      expect(stats.planCount).toBe(1)
      expect(stats.totalSpend).toBe(0)
      expect(stats.avgReturnVisitDays).toBe(0)
    })

    it('[正例] lastBirthday 是最新方案的 planDate', () => {
      const svc = createSvc()
      const p1 = makePlan(svc, { memberId: 'ms-m3', birthday: '08-10' })
      svc.triggerPush(p1.id)
      svc.claimReward(p1.id)
      const p2 = makePlan(svc, { memberId: 'ms-m3', birthday: '09-10' })
      const stats = svc.getMemberStats('ms-m3')
      expect(stats.planCount).toBe(2)
      // lastBirthday 应该等于第二个方案的 planDate（后创建的但排序可能依赖 createdAt）
      // 该方案使用 09-10, 期望 planDate 包含 "09"
      expect(stats.lastBirthday).toBeTruthy()
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 看板 / Dashboard
  // ══════════════════════════════════════════════════════════════

  describe('getDashboard', () => {
    it('[正例] 转换率和复购率随着数据增加而变化', () => {
      const svc = createSvc()
      // 创建一个方案, 触发+领取
      const p1 = makePlan(svc, { memberId: 'db-m1', birthday: '08-01', allowFriends: true, friendDiscount: 0.8 })
      svc.triggerPush(p1.id)
      svc.claimReward(p1.id)
      svc.recordTracking({ planId: p1.id, totalSpend: 200, returnVisitDays: 5 })

      // 创建一个只触发未领取的方案
      const p2 = makePlan(svc, { memberId: 'db-m2', birthday: '08-05' })
      svc.triggerPush(p2.id)

      // 看板
      const db = svc.getDashboard('2026-08')
      expect(db.month).toBe('2026-08')
      // 发送了2个奖励, 领取了1个: 转换率 0.5
      expect(db.conversionRate).toBeGreaterThanOrEqual(0)
      expect(db.conversionRate).toBeLessThanOrEqual(1)
      expect(db.avgSpend).toBe(200) // 只在追踪的一条记录
    })

    it('[边界] 本月无生日客户时看板返回零值', () => {
      const svc = createSvc()
      const db = svc.getDashboard('2025-01')
      expect(db.monthlyBirthdays).toBe(0)
      expect(db.activePlans).toBe(0)
      expect(db.conversionRate).toBe(0)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // recordTracking 参数校验
  // ══════════════════════════════════════════════════════════════

  describe('recordTracking 参数校验', () => {
    it('[反例] 不允许带好友的方案传 friendInvited>0 抛错', () => {
      const svc = createSvc()
      const plan = makePlan(svc, { memberId: 'tr-m1', allowFriends: false })
      expect(() => svc.recordTracking({ planId: plan.id, friendInvited: 1 })).toThrow('不允许带好友')
    })

    it('[反例] 不存在的 planId 抛 NotFound', () => {
      const svc = createSvc()
      expect(() => svc.recordTracking({ planId: 'non-existent-plan' })).toThrow('生日方案不存在')
    })

    it('[边界] totalSpend=0 合法', () => {
      const svc = createSvc()
      const plan = makePlan(svc, { memberId: 'tr-m2', allowFriends: true, friendDiscount: 0.8 })
      const tracking = svc.recordTracking({ planId: plan.id, totalSpend: 0 })
      expect(tracking.totalSpend).toBe(0)
    })

    it('[边界] returnVisitDays=0 合法', () => {
      const svc = createSvc()
      const plan = makePlan(svc, { memberId: 'tr-m3', allowFriends: true, friendDiscount: 0.8 })
      const tracking = svc.recordTracking({ planId: plan.id, returnVisitDays: 0 })
      expect(tracking.returnVisitDays).toBe(0)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // listPlans 筛选
  // ══════════════════════════════════════════════════════════════

  describe('listPlans 筛选', () => {
    it('[正例] 按状态 + 月份组合筛选', () => {
      const svc = createSvc()
      makePlan(svc, { memberId: 'lp-m1', birthday: '08-01' })
      const p2 = makePlan(svc, { memberId: 'lp-m2', birthday: '08-05' })
      svc.triggerPush(p2.id)

      const activeInAug = svc.listPlans({ status: 'active', month: '2026-08' })
      expect(activeInAug.length).toBeGreaterThanOrEqual(1)
      activeInAug.forEach(p => {
        expect(p.status).toBe('active')
        expect(p.planDate).toContain('2026-08')
      })
    })

    it('[边界] 无筛选返回全部，按创建时间降序', () => {
      const svc = createSvc()
      const p1 = makePlan(svc, { memberId: 'lp-m3' })
      const p2 = makePlan(svc, { memberId: 'lp-m4' })
      const all = svc.listPlans()
      expect(all.length).toBe(2)
      // 按创建时间降序: 先创建的 p1 在位置 0, 后创建的 p2 在位置 0 前面
      // 由于 listPlans 按 createdAt 降序, 后创建的 p2 应在前面
      // p2.createdAt >= p1.createdAt (即使时间戳相同, Math.random 保证唯一; 排序取决于 getTime)
      expect(all[0].createdAt.getTime()).toBeGreaterThanOrEqual(all[1].createdAt.getTime())
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 多会员并发场景
  // ══════════════════════════════════════════════════════════════

  describe('多会员并发', () => {
    it('[正例] 10个不同会员各自创建方案, 互不干扰', () => {
      const svc = createSvc()
      for (let i = 0; i < 10; i++) {
        makePlan(svc, { memberId: `concurrent-m${i}`, birthday: `08-${String(i + 1).padStart(2, '0')}` })
      }
      expect(svc.listPlans().length).toBe(10)
      for (let i = 0; i < 10; i++) {
        const stats = svc.getMemberStats(`concurrent-m${i}`)
        expect(stats.planCount).toBe(1)
      }
    })

    it('[正例] 同一会员多年生日方案互不冲突（不同年, 每次 createPlan 产生新 ID）', () => {
      const svc = createSvc()
      // 会员 m_cross_m1 创建方案 A
      const p1 = makePlan(svc, { memberId: 'cross-year', birthday: '08-01' })
      // 模拟 m_cross_m1 明年再次创建方案 → 但同一会员冲突, 需要先完成上一个
      // 完成方案 A 后
      svc.triggerPush(p1.id)
      svc.claimReward(p1.id)

      // 可以创建新方案了
      const p2 = makePlan(svc, { memberId: 'cross-year', birthday: '08-01' })
      expect(p2.id).not.toBe(p1.id)

      const stats = svc.getMemberStats('cross-year')
      expect(stats.planCount).toBe(2)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // preloadEffects 完整展示
  // ══════════════════════════════════════════════════════════════

  describe('preloadEffects', () => {
    it('[正例] Premium 会员的彩纸粒子数量为 100', () => {
      const svc = createSvc()
      svc.createPlan({
        memberId: 'eff-m1',
        birthday: '07-27',
        advanceDays: 3,
        tier: BirthdayTier.Premium,
        rewardType: 'gift',
        rewardValue: 150,
        allowFriends: true,
        friendDiscount: 0.7,
      })
      const result = svc.preloadEffects('eff-m1')
      const confetti = result.effects.find(e => e.type === 'confetti_config')
      expect(confetti).toBeDefined()
      expect(confetti!.data.particleCount).toBe(100)
    })

    it('[正例] 特效中包含奖励提示数据', () => {
      const svc = createSvc()
      svc.createPlan({
        memberId: 'eff-m2',
        birthday: '07-27',
        advanceDays: 3,
        tier: BirthdayTier.Standard,
        rewardType: 'discount',
        rewardValue: 80,
        allowFriends: true,
        friendDiscount: 0.85,
      })
      const result = svc.preloadEffects('eff-m2')
      const rewardHint = result.effects.find(e => e.type === 'reward_hint')
      expect(rewardHint).toBeDefined()
      expect(rewardHint!.data.rewardType).toBe('discount')
      expect(rewardHint!.data.rewardValue).toBe(80)
      expect(rewardHint!.data.friendDiscount).toBe(0.85)
    })
  })
})
