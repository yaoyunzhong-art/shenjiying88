import { describe, it, expect, beforeEach } from 'vitest'
import { AllianceDashboardService } from './alliance-dashboard.service'

describe('AllianceDashboardService — 联盟看板 (BS-0227~BS-0228)', () => {
  let service: AllianceDashboardService

  beforeEach(() => {
    service = new AllianceDashboardService()
  })

  describe('getOverview', () => {
    it('should return a valid overview', () => {
      const overview = service.getOverview(8, 10, 2)

      expect(overview.totalPartners).toBe(10)
      expect(overview.activePartners).toBe(8)
      expect(overview.newPartnersThisMonth).toBe(2)
      expect(overview.totalTransactionAmount).toBeGreaterThan(0)
      expect(overview.totalCouponsIssued).toBeGreaterThan(0)
    })

    it('should return zero values for empty data set', () => {
      service.clearAll()
      const overview = service.getOverview(0, 0, 0)
      expect(overview.totalPartners).toBe(0)
      expect(overview.totalTransactionAmount).toBe(0)
      expect(overview.totalCouponsIssued).toBe(0)
    })
  })

  describe('getGradeDistribution', () => {
    it('should calculate correct ratios', () => {
      const gradeCounts = new Map([['S', 2], ['A', 3], ['B', 4], ['C', 1]])
      const distribution = service.getGradeDistribution(gradeCounts)

      expect(distribution).toHaveLength(4)
      const sGrade = distribution.find((d) => d.grade === 'S')
      expect(sGrade).toBeDefined()
      expect(sGrade!.count).toBe(2)
      expect(sGrade!.label).toBe('战略伙伴')
      // 2 out of 10 = 20%
      expect(sGrade!.ratio).toBe(20)
    })
  })

  describe('getMonthlyTrend', () => {
    it('should return monthly trend data', () => {
      const trend = service.getMonthlyTrend(3)

      expect(trend).toHaveLength(3)
      for (const t of trend) {
        expect(t.month).toMatch(/^\d{4}-\d{2}$/)
        expect(t.transactionAmount).toBeGreaterThanOrEqual(0)
        expect(t.customerCount).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('getActivityOverview', () => {
    it('should return activity overview data', () => {
      const activity = service.getActivityOverview()
      expect(activity.totalActivities).toBeGreaterThan(0)
      expect(activity.activeActivities).toBeGreaterThan(0)
      expect(activity.conversionRate).toBeGreaterThan(0)
    })
  })

  describe('getPartnerRanking', () => {
    it('should return ranked partners', () => {
      const nameMap = new Map([['partner-demo-S', '战略伙伴A'], ['partner-demo-A', '核心伙伴B']])
      const ranking = service.getPartnerRanking(nameMap)

      expect(ranking.length).toBeGreaterThanOrEqual(2)
      // Highest revenue should be rank 1
      expect(ranking[0].rank).toBe(1)
    })
  })

  describe('getPartnerDashboard', () => {
    it('should return partner dashboard with correct metrics', () => {
      const dashboard = service.getPartnerDashboard('partner-demo-S', '战略伙伴A', 'S')

      expect(dashboard.partnerId).toBe('partner-demo-S')
      expect(dashboard.partnerName).toBe('战略伙伴A')
      expect(dashboard.grade).toBe('S')
      expect(dashboard.revenueShareRatio).toBe(0.08)
      expect(dashboard.totalRevenue).toBeGreaterThan(0)
      expect(dashboard.healthScore).toBeGreaterThan(0)
    })

    it('should return empty data for unknown partner', () => {
      const dashboard = service.getPartnerDashboard('unknown', 'Unknown', 'C')

      expect(dashboard.partnerId).toBe('unknown')
      expect(dashboard.totalRevenue).toBe(0)
      expect(dashboard.revenueShareRatio).toBe(0.02)
    })
  })

  describe('setPartnerMetrics', () => {
    it('should allow injecting custom metrics', () => {
      service.setPartnerMetrics('partner-test', {
        totalRevenue: 50000000,
        monthlyRevenue: 8000000,
        customerCount: 5000,
        healthScore: 85,
        grade: 'A',
      })

      const dashboard = service.getPartnerDashboard('partner-test', 'Test Partner', 'A')
      expect(dashboard.totalRevenue).toBe(50000000)
      expect(dashboard.monthlyRevenue).toBe(8000000)
      expect(dashboard.customerCount).toBe(5000)
      expect(dashboard.healthScore).toBe(85)
    })
  })
})
