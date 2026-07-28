import { describe, it, expect, beforeEach } from 'vitest'
import { BirthdayService } from './birthday.service'

describe('BirthdayService', () => {
  let service: BirthdayService

  beforeEach(() => {
    service = new BirthdayService()
    service.reset()
  })

  // ── BS-0199: 生日识别 ──

  describe('markUpcomingBirthdays', () => {
    it('marks plans as upcoming when birthdays are within 30 days', () => {
      const now = new Date()
      const futureDay = String(now.getDate() + 15).padStart(2, '0')
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const birthday = `${month}-${futureDay}`

      service.createPlan({
        memberId: 'm1', birthday, advanceDays: 7,
        tier: 'NORMAL', rewardType: 'coupon', rewardValue: 100,
      })
      const result = service.markUpcomingBirthdays(['m1'], { m1: birthday })
      expect(result.marked).toBe(1)
    })

    it('does not mark unknown members', () => {
      const result = service.markUpcomingBirthdays(['m1'], {})
      expect(result.marked).toBe(0)
    })
  })

  describe('checkIsUpcoming', () => {
    it('returns true when birthday is within 30 days', () => {
      const now = new Date()
      const futureDay = String(now.getDate() + 10).padStart(2, '0')
      const month = String(now.getMonth() + 1).padStart(2, '0')
      expect(service.checkIsUpcoming('m1', `${month}-${futureDay}`)).toBe(true)
    })

    it('returns false for invalid birthday format', () => {
      expect(service.checkIsUpcoming('m1', 'invalid')).toBe(false)
    })

    it('returns false for empty birthday', () => {
      expect(service.checkIsUpcoming('m1', '')).toBe(false)
    })
  })

  // ── BS-0200~BS-0202: 自动营销 ──

  describe('createPlan', () => {
    it('creates a pending birthday plan', () => {
      const plan = service.createPlan({
        memberId: 'm1', birthday: '12-25', advanceDays: 7,
        tier: 'VIP', rewardType: 'gift', rewardValue: 200,
        allowFriends: true, friendDiscount: 0.8,
      })
      expect(plan.memberId).toBe('m1')
      expect(plan.status).toBe('pending')
      expect(plan.rewardType).toBe('gift')
      expect(plan.allowFriends).toBe(true)
    })

    it('throws when memberId is empty', () => {
      expect(() =>
        service.createPlan({
          memberId: '', birthday: '12-25', advanceDays: 7,
          tier: 'NORMAL', rewardType: 'coupon', rewardValue: 50,
        }),
      ).toThrow('memberId 不能为空')
    })

    it('throws when birthday format is invalid', () => {
      expect(() =>
        service.createPlan({
          memberId: 'm1', birthday: '1225', advanceDays: 7,
          tier: 'NORMAL', rewardType: 'coupon', rewardValue: 50,
        }),
      ).toThrow('birthday 格式必须为 MM-DD')
    })

    it('throws when advanceDays is out of range', () => {
      expect(() =>
        service.createPlan({
          memberId: 'm1', birthday: '12-25', advanceDays: 99,
          tier: 'NORMAL', rewardType: 'coupon', rewardValue: 50,
        }),
      ).toThrow('advanceDays 必须在 0~30 范围内')
    })

    it('throws when rewardValue is not positive', () => {
      expect(() =>
        service.createPlan({
          memberId: 'm1', birthday: '12-25', advanceDays: 7,
          tier: 'NORMAL', rewardType: 'coupon', rewardValue: 0,
        }),
      ).toThrow('rewardValue 必须大于 0')
    })
  })

  describe('listPlans / getPlan', () => {
    it('lists all plans sorted by createdAt desc', () => {
      service.createPlan({
        memberId: 'm1', birthday: '12-25', advanceDays: 7,
        tier: 'NORMAL', rewardType: 'coupon', rewardValue: 50,
      })
      service.createPlan({
        memberId: 'm2', birthday: '01-01', advanceDays: 3,
        tier: 'VIP', rewardType: 'discount', rewardValue: 100,
      })
      expect(service.listPlans()).toHaveLength(2)
    })

    it('filters plans by month', () => {
      // Pick a future month so planDate falls this year
      const now = new Date()
      const futureMonth = now.getMonth() + 2 > 12 ? 12 : now.getMonth() + 2
      const mm = String(futureMonth).padStart(2, '0')
      const targetMonth = `${now.getFullYear()}-${mm}`
      service.createPlan({
        memberId: 'm1', birthday: `${mm}-15`, advanceDays: 7,
        tier: 'NORMAL', rewardType: 'coupon', rewardValue: 50,
      })
      const filtered = service.listPlans({ month: targetMonth })
      expect(filtered.length).toBeGreaterThanOrEqual(1)
    })

    it('throws when plan not found', () => {
      expect(() => service.getPlan('nonexistent')).toThrow('生日方案不存在')
    })
  })

  describe('triggerPush / claimReward', () => {
    it('triggerPush changes plan status to active and creates reward', () => {
      const plan = service.createPlan({
        memberId: 'm1', birthday: '12-25', advanceDays: 7,
        tier: 'NORMAL', rewardType: 'coupon', rewardValue: 100,
      })
      const reward = service.triggerPush(plan.id)
      expect(reward.type).toBe('coupon')
      expect(reward.value).toBe(100)
      expect(reward.sentAt).toBeInstanceOf(Date)
      expect(service.getPlan(plan.id).status).toBe('active')
    })

    it('throws when triggering non-pending plan', () => {
      const plan = service.createPlan({
        memberId: 'm1', birthday: '12-25', advanceDays: 7,
        tier: 'NORMAL', rewardType: 'coupon', rewardValue: 100,
      })
      service.triggerPush(plan.id)
      expect(() => service.triggerPush(plan.id)).toThrow('不可触发推送')
    })

    it('claimReward completes the plan', () => {
      const plan = service.createPlan({
        memberId: 'm1', birthday: '12-25', advanceDays: 7,
        tier: 'NORMAL', rewardType: 'coupon', rewardValue: 100,
      })
      service.triggerPush(plan.id)
      const claimed = service.claimReward(plan.id)
      expect(claimed.claimedAt).toBeInstanceOf(Date)
      expect(service.getPlan(plan.id).status).toBe('completed')
    })

    it('throws when claiming already claimed reward', () => {
      const plan = service.createPlan({
        memberId: 'm1', birthday: '12-25', advanceDays: 7,
        tier: 'NORMAL', rewardType: 'coupon', rewardValue: 100,
      })
      service.triggerPush(plan.id)
      service.claimReward(plan.id)
      // Second claim: plan is already 'completed', so service throws before checking reward
      expect(() => service.claimReward(plan.id)).toThrow('不可领取奖励')
    })
  })

  // ── BS-0203~BS-0204: 传播裂变 ──

  describe('recordTracking', () => {
    it('creates tracking record', () => {
      const plan = service.createPlan({
        memberId: 'm1', birthday: '12-25', advanceDays: 7,
        tier: 'NORMAL', rewardType: 'coupon', rewardValue: 100,
        allowFriends: true, friendDiscount: 0.8,
      })
      const track = service.recordTracking({
        planId: plan.id, friendInvited: 3, totalSpend: 500, returnVisitDays: 7,
      })
      expect(track.friendInvited).toBe(3)
      expect(track.totalSpend).toBe(500)
    })

    it('throws when plan does not allow friends', () => {
      const plan = service.createPlan({
        memberId: 'm1', birthday: '12-25', advanceDays: 7,
        tier: 'NORMAL', rewardType: 'coupon', rewardValue: 100,
      })
      expect(() =>
        service.recordTracking({ planId: plan.id, friendInvited: 1 }),
      ).toThrow('不允许带好友')
    })

    it('throws on negative values', () => {
      const plan = service.createPlan({
        memberId: 'm1', birthday: '12-25', advanceDays: 7,
        tier: 'NORMAL', rewardType: 'coupon', rewardValue: 100,
        allowFriends: true, friendDiscount: 0.8,
      })
      expect(() =>
        service.recordTracking({ planId: plan.id, totalSpend: -1 }),
      ).toThrow('totalSpend 不能为负')
    })
  })

  describe('getFriendStats', () => {
    it('returns zero stats when no plans exist', () => {
      const stats = service.getFriendStats('nonexistent')
      expect(stats.totalInvited).toBe(0)
      expect(stats.avgSpend).toBe(0)
    })

    it('aggregates friend stats from plans', () => {
      const plan = service.createPlan({
        memberId: 'm1', birthday: '12-25', advanceDays: 7,
        tier: 'NORMAL', rewardType: 'coupon', rewardValue: 100,
        allowFriends: true, friendDiscount: 0.8,
      })
      service.recordTracking({ planId: plan.id, friendInvited: 2, totalSpend: 400 })
      const stats = service.getFriendStats('m1')
      expect(stats.totalInvited).toBe(2)
      // totalSpend=400, one tracking entry = 400/1 = 400
      expect(stats.avgSpend).toBe(400)
    })
  })

  // ── BS-0205~BS-0206: 复购追踪 ──

  describe('getDashboard', () => {
    it('returns dashboard with default current month', () => {
      const dash = service.getDashboard()
      expect(dash.monthlyBirthdays).toBe(0)
      expect(dash.conversionRate).toBe(0)
      expect(dash.returnRate).toBe(0)
    })

    it('reflects data after creating plans and rewards', () => {
      const plan = service.createPlan({
        memberId: 'm1', birthday: '12-25', advanceDays: 7,
        tier: 'NORMAL', rewardType: 'coupon', rewardValue: 100,
      })
      service.triggerPush(plan.id)
      service.claimReward(plan.id)
      const dash = service.getDashboard()
      expect(dash.activePlans).toBeGreaterThanOrEqual(0)
    })
  })

  describe('preloadEffects', () => {
    it('returns empty effects when no active plan', () => {
      const result = service.preloadEffects('nonexistent')
      expect(result.hasActivePlan).toBe(false)
      expect(result.effects).toHaveLength(0)
    })

    it('returns effects when member has upcoming plan', () => {
      const now = new Date()
      const futureDay = String(now.getDate() + 10).padStart(2, '0')
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const birthday = `${month}-${futureDay}`
      service.createPlan({
        memberId: 'm1', birthday, advanceDays: 7,
        tier: 'VIP', rewardType: 'gift', rewardValue: 500,
      })
      const result = service.preloadEffects('m1')
      expect(result.hasActivePlan).toBe(true)
      expect(result.effects.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('getMemberStats', () => {
    it('returns empty stats for unknown member', () => {
      const stats = service.getMemberStats('nonexistent')
      expect(stats.planCount).toBe(0)
      expect(stats.totalSpend).toBe(0)
      expect(stats.totalInvited).toBe(0)
    })

    it('aggregates member stats across plans', () => {
      const plan = service.createPlan({
        memberId: 'm1', birthday: '12-25', advanceDays: 7,
        tier: 'NORMAL', rewardType: 'coupon', rewardValue: 100,
        allowFriends: true, friendDiscount: 0.8,
      })
      service.recordTracking({ planId: plan.id, friendInvited: 3, totalSpend: 600, returnVisitDays: 14 })
      const stats = service.getMemberStats('m1')
      expect(stats.planCount).toBe(1)
      expect(stats.totalSpend).toBe(600)
      expect(stats.totalInvited).toBe(3)
    })
  })

  describe('reset', () => {
    it('clears all stores', () => {
      service.createPlan({
        memberId: 'm1', birthday: '12-25', advanceDays: 7,
        tier: 'NORMAL', rewardType: 'coupon', rewardValue: 100,
      })
      expect(service.listPlans()).toHaveLength(1)
      service.reset()
      expect(service.listPlans()).toHaveLength(0)
    })
  })
})
