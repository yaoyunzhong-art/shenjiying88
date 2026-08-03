import { describe, it, expect, beforeEach } from 'vitest'
import { CampaignPerformanceService } from './campaign-performance.service'
import { CampaignType, CampaignStatus } from './campaign-performance.entity'

describe('CampaignPerformanceService', () => {
  let service: CampaignPerformanceService

  beforeEach(() => {
    service = new CampaignPerformanceService()
    service.resetStoresForTests()
  })

  // ── 活动列表查询 ──

  describe('listCampaigns', () => {
    it('returns all seeded campaigns without filters', () => {
      const list = service.listCampaigns()
      expect(list.length).toBeGreaterThanOrEqual(10)
    })

    it('filters by storeId', () => {
      const list = service.listCampaigns({ storeId: 'store-001' })
      expect(list.every(r => r.storeId === 'store-001')).toBe(true)
    })

    it('filters by campaignType', () => {
      const list = service.listCampaigns({ campaignType: CampaignType.Discount })
      expect(list.every(r => r.type === CampaignType.Discount)).toBe(true)
    })

    it('filters by status', () => {
      const list = service.listCampaigns({ status: CampaignStatus.Completed })
      expect(list.every(r => r.status === CampaignStatus.Completed)).toBe(true)
    })

    it('filters by date range', () => {
      const list = service.listCampaigns({ startDate: '2026-07-01', endDate: '2026-07-31' })
      expect(list.every(r => r.startDate >= '2026-07-01' && r.endDate <= '2026-07-31')).toBe(true)
    })

    it('returns results sorted by startDate descending', () => {
      const list = service.listCampaigns()
      for (let i = 1; i < list.length; i++) {
        expect(list[i - 1].startDate.localeCompare(list[i].startDate)).toBeGreaterThanOrEqual(0)
      }
    })
  })

  // ── 单条详情 ──

  describe('getCampaign', () => {
    it('returns a campaign by id', () => {
      const list = service.listCampaigns()
      const campaign = service.getCampaign(list[0].id)
      expect(campaign).toBeDefined()
      expect(campaign!.id).toBe(list[0].id)
    })

    it('returns undefined for unknown id', () => {
      expect(service.getCampaign('nonexistent')).toBeUndefined()
    })
  })

  // ── 活动效果汇总 ──

  describe('getSummary', () => {
    it('returns summary with aggregated metrics', () => {
      const summary = service.getSummary()
      expect(summary.totalCampaigns).toBeGreaterThanOrEqual(10)
      expect(summary.totalBudget).toBeGreaterThan(0)
      expect(summary.totalCost).toBeGreaterThan(0)
      expect(summary.totalRevenue).toBeGreaterThan(0)
      expect(summary.avgROI).toBeGreaterThan(0)
    })

    it('filters summary by storeId', () => {
      const summary = service.getSummary({ storeId: 'store-001' })
      expect(summary.totalCampaigns).toBeGreaterThanOrEqual(2) // 2 campaigns in store-001
    })

    it('filters summary by status', () => {
      const summary = service.getSummary({ status: CampaignStatus.Active })
      expect(summary.totalCampaigns).toBeGreaterThanOrEqual(3) // active campaigns
    })
  })

  // ── 创建活动记录 ──

  describe('createCampaign', () => {
    it('creates a new campaign with Planned status', () => {
      const record = service.createCampaign({
        name: '测试活动',
        type: CampaignType.Discount,
        startDate: '2026-08-01',
        endDate: '2026-08-15',
        budget: 10000,
        cost: 0,
        participants: 0,
        newMembers: 0,
        revenue: 0,
        satisfaction: 0,
      })
      expect(record.id).toMatch(/^campaign-/)
      expect(record.name).toBe('测试活动')
      expect(record.status).toBe(CampaignStatus.Planned)
      expect(record.storeId).toBe('store-default')
    })
  })

  // ── resetStoresForTests ──

  describe('resetStoresForTests', () => {
    it('clears internal store so next listCampaigns triggers fresh seed', () => {
      expect(service.listCampaigns().length).toBeGreaterThan(0)
      service.resetStoresForTests()
      // After reset, next listCampaigns re-seeds from scratch
      const list = service.listCampaigns()
      expect(list.length).toBeGreaterThanOrEqual(10)
    })

    it('allows re-seeding after reset', () => {
      service.resetStoresForTests()
      const list = service.listCampaigns() // triggers seed
      expect(list.length).toBeGreaterThanOrEqual(10)
    })
  })
})
