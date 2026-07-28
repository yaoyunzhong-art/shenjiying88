import { describe, it, expect, beforeEach } from 'vitest'
import { AiProfileService } from './ai-profile.service'

describe('AiProfileService', () => {
  let service: AiProfileService

  beforeEach(() => {
    service = new AiProfileService()
    service.reset()
  })

  // ── BS-0189: 用户画像聚合 ──

  describe('createOrUpdateProfile', () => {
    const baseDto = {
      userId: 'user-001',
      storeId: 'store-001',
      tenantId: 'tenant-001',
      baseInfo: {
        name: '张三',
        gender: 'male' as const,
        ageGroup: '26_35' as const,
        level: 'vip' as const,
        interests: ['抓娃娃', '盲盒'],
        consumptionHabbit: 'experience' as const,
      },
      activityMetrics: {
        totalVisits: 25,
        avgStayMinutes: 45,
        peakHourRate: 0.7,
        preferredTime: 'evening' as const,
        preferredDays: ['Saturday', 'Sunday'],
      },
      engagementMetrics: {
        pushOpenRate: 0.45,
        pushClickRate: 0.15,
        messageReadRate: 0.35,
        couponRedeemRate: 0.25,
        socialShareRate: 0.1,
      },
      consumptionMetrics: {
        totalSpent: 5000,
        avgOrderAmount: 120,
        totalOrders: 42,
        lastVisitDays: 5,
        preferredCategories: ['抓娃娃', '盲盒'],
      },
      tags: ['高价值', '活跃'],
    }

    it('should create a new profile with generated id', () => {
      const profile = service.createOrUpdateProfile(baseDto)
      expect(profile.id).toMatch(/^profile-/)
      expect(profile.userId).toBe('user-001')
      expect(profile.createdAt).toBeInstanceOf(Date)
      expect(profile.updatedAt).toBeInstanceOf(Date)
      expect(profile.baseInfo.name).toBe('张三')
    })

    it('should update an existing profile preserving createdAt', () => {
      const first = service.createOrUpdateProfile(baseDto)
      const updateDto = { ...baseDto, id: first.id, baseInfo: { ...baseDto.baseInfo, name: '张三（更新）' } }
      const second = service.createOrUpdateProfile(updateDto)
      expect(second.id).toBe(first.id)
      expect(second.createdAt).toEqual(first.createdAt)
      expect(second.updatedAt.getTime()).toBeGreaterThanOrEqual(first.updatedAt.getTime())
      expect(second.baseInfo.name).toBe('张三（更新）')
    })
  })

  describe('getProfile / getProfileByUserId / listProfiles', () => {
    beforeEach(() => {
      service.createOrUpdateProfile({
        userId: 'user-001', storeId: 'store-001', tenantId: 't1',
        baseInfo: { name: 'A', gender: 'male', ageGroup: '26_35', level: 'vip', interests: [], consumptionHabbit: 'value' },
        activityMetrics: { totalVisits: 10, avgStayMinutes: 30, peakHourRate: 0.5, preferredTime: 'afternoon', preferredDays: ['Saturday'] },
        engagementMetrics: { pushOpenRate: 0.3, pushClickRate: 0.1, messageReadRate: 0.2, couponRedeemRate: 0.1, socialShareRate: 0 },
        consumptionMetrics: { totalSpent: 1000, avgOrderAmount: 50, totalOrders: 20, lastVisitDays: 3, preferredCategories: [] },
        tags: [],
      })
      service.createOrUpdateProfile({
        userId: 'user-002', storeId: 'store-002', tenantId: 't1',
        baseInfo: { name: 'B', gender: 'female', ageGroup: '18_25', level: 'regular', interests: [], consumptionHabbit: 'value' },
        activityMetrics: { totalVisits: 5, avgStayMinutes: 20, peakHourRate: 0.3, preferredTime: 'morning', preferredDays: ['Monday'] },
        engagementMetrics: { pushOpenRate: 0.2, pushClickRate: 0.05, messageReadRate: 0.1, couponRedeemRate: 0.05, socialShareRate: 0 },
        consumptionMetrics: { totalSpent: 500, avgOrderAmount: 30, totalOrders: 15, lastVisitDays: 10, preferredCategories: [] },
        tags: [],
      })
    })

    it('getProfile returns profile by id', () => {
      const all = service.listProfiles()
      const p = service.getProfile(all[0].id)
      expect(p).toBeDefined()
      expect(p!.userId).toBe(all[0].userId)
    })

    it('getProfile returns undefined for unknown id', () => {
      expect(service.getProfile('nonexistent')).toBeUndefined()
    })

    it('getProfileByUserId returns correct profile', () => {
      const p = service.getProfileByUserId('user-002')
      expect(p).toBeDefined()
      expect(p!.baseInfo.name).toBe('B')
    })

    it('getProfileByUserId returns undefined for unknown user', () => {
      expect(service.getProfileByUserId('unknown')).toBeUndefined()
    })

    it('listProfiles returns all profiles', () => {
      expect(service.listProfiles()).toHaveLength(2)
    })

    it('listProfiles filters by storeId', () => {
      const store1 = service.listProfiles('store-001')
      expect(store1).toHaveLength(1)
      expect(store1[0].userId).toBe('user-001')
    })
  })

  describe('getSegmentUsers', () => {
    beforeEach(() => {
      service.createOrUpdateProfile({
        userId: 'u1', storeId: 's1', tenantId: 't1',
        baseInfo: { name: 'A', gender: 'male', ageGroup: '26_35', level: 'vip', interests: ['盲盒', '赛车'], consumptionHabbit: 'experience' },
        activityMetrics: { totalVisits: 10, avgStayMinutes: 30, peakHourRate: 0.5, preferredTime: 'afternoon', preferredDays: ['Saturday'] },
        engagementMetrics: { pushOpenRate: 0.3, pushClickRate: 0.1, messageReadRate: 0.2, couponRedeemRate: 0.1, socialShareRate: 0 },
        consumptionMetrics: { totalSpent: 1000, avgOrderAmount: 50, totalOrders: 20, lastVisitDays: 3, preferredCategories: [] },
        tags: ['高价值', '活跃'],
      })
      service.createOrUpdateProfile({
        userId: 'u2', storeId: 's1', tenantId: 't1',
        baseInfo: { name: 'B', gender: 'female', ageGroup: '18_25', level: 'regular', interests: ['抓娃娃'], consumptionHabbit: 'value' },
        activityMetrics: { totalVisits: 5, avgStayMinutes: 20, peakHourRate: 0.3, preferredTime: 'morning', preferredDays: ['Monday'] },
        engagementMetrics: { pushOpenRate: 0.2, pushClickRate: 0.05, messageReadRate: 0.1, couponRedeemRate: 0.05, socialShareRate: 0 },
        consumptionMetrics: { totalSpent: 500, avgOrderAmount: 30, totalOrders: 15, lastVisitDays: 10, preferredCategories: [] },
        tags: ['新客'],
      })
    })

    it('matches profiles by tag name', () => {
      const result = service.getSegmentUsers(['高价值'])
      expect(result).toHaveLength(1)
      expect(result[0].userId).toBe('u1')
    })

    it('matches profiles by interest', () => {
      const result = service.getSegmentUsers(['抓娃娃'])
      expect(result).toHaveLength(1)
      expect(result[0].userId).toBe('u2')
    })

    it('returns empty when no match', () => {
      expect(service.getSegmentUsers(['nonexistent'])).toHaveLength(0)
    })
  })

  // ── BS-0190: 营销时机推荐 ──

  describe('calculateTiming', () => {
    it('returns undefined when user profile not found', () => {
      expect(service.calculateTiming('unknown')).toBeUndefined()
    })

    it('returns timing recommendation for existing user', () => {
      service.createOrUpdateProfile({
        userId: 'u1', storeId: 's1', tenantId: 't1',
        baseInfo: { name: 'A', gender: 'male', ageGroup: '26_35', level: 'vip', interests: [], consumptionHabbit: 'experience' },
        activityMetrics: { totalVisits: 25, avgStayMinutes: 60, peakHourRate: 0.7, preferredTime: 'evening', preferredDays: ['Saturday', 'Sunday'] },
        engagementMetrics: { pushOpenRate: 0.45, pushClickRate: 0.15, messageReadRate: 0.35, couponRedeemRate: 0.25, socialShareRate: 0.1 },
        consumptionMetrics: { totalSpent: 5000, avgOrderAmount: 120, totalOrders: 42, lastVisitDays: 35, preferredCategories: [] },
        tags: [],
      })
      const timing = service.calculateTiming('u1')
      expect(timing).toBeDefined()
      expect(timing!.userId).toBe('u1')
      expect(timing!.bestTime).toBe('evening')
      expect(timing!.recommendedChannels).toContain('push')
      expect(timing!.recommendedChannels).toContain('in_app')
      expect(timing!.personalPreference.preferWeekend).toBe(true)
      expect(timing!.personalPreference.preferEvening).toBe(true)
    })
  })

  describe('getTiming', () => {
    it('returns undefined when no timing stored', () => {
      expect(service.getTiming('unknown')).toBeUndefined()
    })

    it('returns stored timing after calculateTiming', () => {
      service.createOrUpdateProfile({
        userId: 'u1', storeId: 's1', tenantId: 't1',
        baseInfo: { name: 'A', gender: 'male', ageGroup: '26_35', level: 'vip', interests: [], consumptionHabbit: 'value' },
        activityMetrics: { totalVisits: 15, avgStayMinutes: 40, peakHourRate: 0.5, preferredTime: 'afternoon', preferredDays: ['Saturday'] },
        engagementMetrics: { pushOpenRate: 0.3, pushClickRate: 0.1, messageReadRate: 0.2, couponRedeemRate: 0.1, socialShareRate: 0 },
        consumptionMetrics: { totalSpent: 1000, avgOrderAmount: 50, totalOrders: 20, lastVisitDays: 3, preferredCategories: [] },
        tags: [],
      })
      service.calculateTiming('u1')
      const timing = service.getTiming('u1')
      expect(timing).toBeDefined()
      expect(timing!.confidenceScore).toBeGreaterThanOrEqual(0.5)
    })
  })

  // ── BS-0191: 营销内容推荐 ──

  describe('generateContentRecommendations', () => {
    it('returns empty array when profile not found', () => {
      expect(service.generateContentRecommendations('unknown')).toEqual([])
    })

    it('generates recommendations based on user profile', () => {
      service.createOrUpdateProfile({
        userId: 'u1', storeId: 's1', tenantId: 't1',
        baseInfo: { name: 'A', gender: 'male', ageGroup: '26_35', level: 'vip', interests: ['盲盒', '抓娃娃'], consumptionHabbit: 'experience' },
        activityMetrics: { totalVisits: 20, avgStayMinutes: 50, peakHourRate: 0.6, preferredTime: 'evening', preferredDays: ['Saturday'] },
        engagementMetrics: { pushOpenRate: 0.4, pushClickRate: 0.12, messageReadRate: 0.3, couponRedeemRate: 0.2, socialShareRate: 0.05 },
        consumptionMetrics: { totalSpent: 3000, avgOrderAmount: 30, totalOrders: 100, lastVisitDays: 25, preferredCategories: [] },
        tags: ['低客单'],
      })
      const recs = service.generateContentRecommendations('u1', 3)
      expect(recs.length).toBeLessThanOrEqual(3)
      // VIP + 盲盒兴趣 + low order => at least some recs
      expect(recs.length).toBeGreaterThan(0)
      expect(recs[0].userId).toBe('u1')
      expect(recs[0].relevanceScore).toBeGreaterThanOrEqual(0)
    })

    it('limits results to the specified number', () => {
      service.createOrUpdateProfile({
        userId: 'u2', storeId: 's1', tenantId: 't1',
        baseInfo: { name: 'B', gender: 'female', ageGroup: '18_25', level: 'vip', interests: ['赛车', '篮球'], consumptionHabbit: 'social' },
        activityMetrics: { totalVisits: 30, avgStayMinutes: 70, peakHourRate: 0.8, preferredTime: 'evening', preferredDays: ['Saturday', 'Sunday'] },
        engagementMetrics: { pushOpenRate: 0.5, pushClickRate: 0.2, messageReadRate: 0.4, couponRedeemRate: 0.3, socialShareRate: 0.2 },
        consumptionMetrics: { totalSpent: 10000, avgOrderAmount: 200, totalOrders: 50, lastVisitDays: 2, preferredCategories: [] },
        tags: ['高价值'],
      })
      const recs = service.generateContentRecommendations('u2', 2)
      expect(recs.length).toBe(2)
    })
  })

  // ── BS-0192: 营销活动策划 ──

  describe('createCampaign / getCampaign / listCampaigns', () => {
    it('creates a campaign with draft status', () => {
      const c = service.createCampaign({
        campaignName: '测试活动',
        targetSegments: ['高价值'],
        timing: { bestTime: 'afternoon' },
        channels: ['push', 'in_app'],
        contentTitles: ['推送A'],
        targetAudience: 500,
      })
      expect(c.id).toMatch(/^campaign-/)
      expect(c.status).toBe('draft')
      expect(c.campaignName).toBe('测试活动')
    })

    it('getCampaign returns undefined for unknown id', () => {
      expect(service.getCampaign('not-found')).toBeUndefined()
    })

    it('listCampaigns lists all campaigns', () => {
      service.createCampaign({
        campaignName: 'A', targetSegments: [], timing: {}, channels: ['push'], contentTitles: [], targetAudience: 0,
      })
      service.createCampaign({
        campaignName: 'B', targetSegments: [], timing: {}, channels: ['sms'], contentTitles: [], targetAudience: 0,
      })
      expect(service.listCampaigns()).toHaveLength(2)
    })

    it('listCampaigns filters by status', () => {
      service.createCampaign({
        campaignName: 'A', targetSegments: [], timing: {}, channels: ['push'], contentTitles: [], targetAudience: 0,
      })
      const drafts = service.listCampaigns('draft')
      const actives = service.listCampaigns('active')
      expect(drafts).toHaveLength(1)
      expect(actives).toHaveLength(0)
    })
  })

  describe('launchCampaign / completeCampaign', () => {
    it('launchCampaign sets status to active', () => {
      const c = service.createCampaign({
        campaignName: 'Test', targetSegments: [], timing: {}, channels: ['push'], contentTitles: [], targetAudience: 0,
      })
      const launched = service.launchCampaign(c.id)
      expect(launched!.status).toBe('active')
    })

    it('launchCampaign returns undefined for unknown id', () => {
      expect(service.launchCampaign('not-found')).toBeUndefined()
    })

    it('completeCampaign sets metrics and completed status', () => {
      const c = service.createCampaign({
        campaignName: 'Test', targetSegments: [], timing: {}, channels: ['push'], contentTitles: [], targetAudience: 0,
      })
      service.launchCampaign(c.id)
      const completed = service.completeCampaign(c.id, { reachRate: 0.8, conversionRate: 0.3, actualROI: 2.5 })
      expect(completed!.status).toBe('completed')
      expect(completed!.metrics.reachRate).toBe(0.8)
      expect(completed!.metrics.actualROI).toBe(2.5)
    })

    it('completeCampaign returns undefined for unknown id', () => {
      expect(service.completeCampaign('nope', { reachRate: 0, conversionRate: 0, actualROI: 0 })).toBeUndefined()
    })
  })

  // ── BS-0193: 周报 ──

  describe('generateWeeklyReport / getWeeklyReport', () => {
    it('generates a weekly report with stats', () => {
      service.createOrUpdateProfile({
        userId: 'u1', storeId: 's1', tenantId: 't1',
        baseInfo: { name: 'A', gender: 'male', ageGroup: '26_35', level: 'regular', interests: [], consumptionHabbit: 'value' },
        activityMetrics: { totalVisits: 5, avgStayMinutes: 20, peakHourRate: 0.3, preferredTime: 'morning', preferredDays: ['Monday'] },
        engagementMetrics: { pushOpenRate: 0.2, pushClickRate: 0.05, messageReadRate: 0.1, couponRedeemRate: 0.05, socialShareRate: 0 },
        consumptionMetrics: { totalSpent: 100, avgOrderAmount: 20, totalOrders: 5, lastVisitDays: 2, preferredCategories: [] },
        tags: [],
      })
      const report = service.generateWeeklyReport('s1')
      expect(report.storeId).toBe('s1')
      expect(report.id).toMatch(/^report-s1-/)
      expect(report.stats.totalUsers).toBe(1)
      expect(report.stats.activeUsers).toBe(1)
      expect(report.recommendations).toHaveLength(3)
    })

    it('getWeeklyReport returns undefined when no report for today', () => {
      expect(service.getWeeklyReport('nonexistent')).toBeUndefined()
    })

    it('generateWeeklyReport handles empty store', () => {
      const report = service.generateWeeklyReport('empty-store')
      expect(report.stats.totalUsers).toBe(0)
      expect(report.stats.activeUsers).toBe(0)
    })
  })

  describe('reset', () => {
    it('clears all stores', () => {
      service.createOrUpdateProfile({
        userId: 'u1', storeId: 's1', tenantId: 't1',
        baseInfo: { name: 'A', gender: 'male', ageGroup: '26_35', level: 'regular', interests: [], consumptionHabbit: 'value' },
        activityMetrics: { totalVisits: 1, avgStayMinutes: 10, peakHourRate: 0.1, preferredTime: 'morning', preferredDays: ['Monday'] },
        engagementMetrics: { pushOpenRate: 0, pushClickRate: 0, messageReadRate: 0, couponRedeemRate: 0, socialShareRate: 0 },
        consumptionMetrics: { totalSpent: 0, avgOrderAmount: 0, totalOrders: 0, lastVisitDays: 0, preferredCategories: [] },
        tags: [],
      })
      expect(service.listProfiles()).toHaveLength(1)
      service.reset()
      expect(service.listProfiles()).toHaveLength(0)
    })
  })
})
