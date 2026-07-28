/**
 * campaign-performance.service.spec.ts — 活动效果评估服务 V23 全覆盖测试
 *
 * 覆盖:
 *   - listCampaigns (无筛选/按类型/按状态/按日期)
 *   - getCampaign (存在/不存在)
 *   - getSummary
 *   - createCampaign
 *   - resetStoresForTests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CampaignPerformanceService } from './campaign-performance.service'
import { CampaignType, CampaignStatus } from './campaign-performance.entity'

describe('CampaignPerformanceService', () => {
  let service: CampaignPerformanceService

  beforeEach(() => {
    service = new CampaignPerformanceService()
    service.resetStoresForTests()
  })

  // ── listCampaigns ────────────────────────────────────────────────────────

  describe('listCampaigns', () => {
    it('正例: 无筛选应返回所有活动', () => {
      const list = service.listCampaigns()
      expect(list.length).toBeGreaterThan(0)
      list.forEach(r => {
        expect(r.id).toBeTruthy()
        expect(r.name).toBeTruthy()
      })
    })

    it('正例: 按活动类型筛选应返回对应类型', () => {
      const discount = service.listCampaigns({ campaignType: CampaignType.Discount })
      discount.forEach(r => expect(r.type).toBe(CampaignType.Discount))
    })

    it('正例: 按状态筛选应返回对应状态', () => {
      const active = service.listCampaigns({ status: CampaignStatus.Active })
      active.forEach(r => expect(r.status).toBe(CampaignStatus.Active))
    })

    it('正例: 按日期筛选应返回范围内活动', () => {
      const filtered = service.listCampaigns({ startDate: '2026-06-01', endDate: '2026-06-30' })
      filtered.forEach(r => {
        expect(r.startDate >= '2026-06-01').toBe(true)
        expect(r.endDate <= '2026-06-30').toBe(true)
      })
    })

    it('边缘: 无匹配应返回空数组', () => {
      const list = service.listCampaigns({ storeId: 'nonexistent-store' })
      expect(list).toHaveLength(0)
    })
  })

  // ── getCampaign ──────────────────────────────────────────────────────────

  describe('getCampaign', () => {
    it('正例: 按 ID 获取应返回活动详情', () => {
      const all = service.listCampaigns()
      const found = service.getCampaign(all[0].id)
      expect(found).toBeTruthy()
      expect(found!.id).toBe(all[0].id)
    })

    it('异常: 不存在的 ID 应返回 undefined', () => {
      const found = service.getCampaign('nonexistent-id')
      expect(found).toBeUndefined()
    })
  })

  // ── getSummary ───────────────────────────────────────────────────────────

  describe('getSummary', () => {
    it('正例: 应返回汇总统计', () => {
      const summary = service.getSummary()
      expect(summary.totalCampaigns).toBeGreaterThan(0)
      expect(summary.totalBudget).toBeGreaterThan(0)
      expect(summary.avgROI).toBeGreaterThanOrEqual(0)
    })

    it('正例: 筛选后统计只含匹配活动', () => {
      const summary = service.getSummary({ campaignType: CampaignType.Vip })
      expect(summary.totalCampaigns).toBeGreaterThan(0)
      expect(summary.totalCampaigns).toBeLessThan(service.getSummary().totalCampaigns)
    })
  })

  // ── createCampaign ───────────────────────────────────────────────────────

  describe('createCampaign', () => {
    it('正例: 创建新活动应返回 Planned 状态', () => {
      const c = service.createCampaign({
        name: '测试活动', type: CampaignType.Discount,
        startDate: '2026-08-01', endDate: '2026-08-31',
        budget: 50000, cost: 0, participants: 0, newMembers: 0,
        revenue: 0, satisfaction: 0,
      })
      expect(c.id).toMatch(/^campaign-/)
      expect(c.status).toBe(CampaignStatus.Planned)
      expect(c.name).toBe('测试活动')
    })
  })

  // ── reset ────────────────────────────────────────────────────────────────

  describe('resetStoresForTests', () => {
    it('正例: 重置后列表应为空，再调用又会填充', () => {
      service.resetStoresForTests()
      expect(service.listCampaigns()).toHaveLength(0)
      // 再次访问会重新 seed
      const list = service.listCampaigns()
      expect(list.length).toBeGreaterThan(0)
    })
  })
})
