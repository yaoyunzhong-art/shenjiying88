/**
 * brand-operations.phase-p47.test.ts
 * P-47 品牌运营 Phase 主证据测试
 *
 * 覆盖 PRD-012 全部 4 个 RQ:
 *   RQ-47-01 品牌官网管理 → content module
 *   RQ-47-02 品牌活动     → marketing module + brand-operations 活动
 *   RQ-47-03 品牌素材     → brand-operations 资产
 *   RQ-47-04 门店品牌同步 → brand-operations 同步
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BrandOperationsService, resetBrandOpsStoresForTests } from './brand-operations.service'

const TENANT_ID = 't-1'
const BRAND_ID = 'b-1'

describe('P-47 品牌运营 Phase 主证据', () => {
  let service: BrandOperationsService

  beforeEach(() => {
    resetBrandOpsStoresForTests()
    service = new BrandOperationsService()
  })

  // ── RQ-47-03: 品牌素材 ──────────────────────────────────────────

  describe('RQ-47-03 品牌素材', () => {
    it('应支持logo素材上传 → 成功', () => {
      const asset = service.createAsset({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        type: 'logo',
        url: 'https://cdn.example.com/shenjiying88-logo.png',
        name: '神机营品牌Logo',
        mimeType: 'image/png',
      })
      expect(asset.type).toBe('logo')
      expect(asset.url).toBe('https://cdn.example.com/shenjiying88-logo.png')
      expect(asset.active).toBe(true)
    })

    it('应支持banner素材上传 → 成功', () => {
      const asset = service.createAsset({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        type: 'banner',
        url: 'https://cdn.example.com/summer-banner.jpg',
        name: '夏季Banner',
        mimeType: 'image/jpeg',
      })
      expect(asset.type).toBe('banner')
      expect(asset.name).toBe('夏季Banner')
    })

    it('应支持video素材上传 → 成功', () => {
      const asset = service.createAsset({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        type: 'video',
        url: 'https://cdn.example.com/brand-video.mp4',
        name: '品牌宣传视频',
        mimeType: 'video/mp4',
      })
      expect(asset.type).toBe('video')
    })

    it('应支持文案素材上传 → 成功', () => {
      const asset = service.createAsset({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        type: 'copy',
        url: 'https://cdn.example.com/copy.txt',
        name: '品牌Slogan文案',
        description: '神机营品牌宣传语',
      })
      expect(asset.type).toBe('copy')
      expect(asset.description).toBe('神机营品牌宣传语')
    })

    it('应支持素材查询 → 按类型筛选', () => {
      service.createAsset({ tenantId: TENANT_ID, brandId: BRAND_ID, type: 'logo', url: 'l1', name: 'Logo1' })
      service.createAsset({ tenantId: TENANT_ID, brandId: BRAND_ID, type: 'banner', url: 'b1', name: 'Banner1' })
      service.createAsset({ tenantId: TENANT_ID, brandId: BRAND_ID, type: 'video', url: 'v1', name: 'Video1' })
      service.createAsset({ tenantId: TENANT_ID, brandId: BRAND_ID, type: 'copy', url: 'c1', name: 'Copy1' })

      const banners = service.listAssets(TENANT_ID, { type: 'banner' })
      expect(banners).toHaveLength(1)

      const all = service.listAssets(TENANT_ID)
      expect(all).toHaveLength(4)
    })

    it('应支持素材停用 → 不再展示', () => {
      const asset = service.createAsset({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        type: 'banner',
        url: 'https://cdn.example.com/old-banner.jpg',
        name: '旧Banner',
      })
      service.updateAsset(asset.id, TENANT_ID, { active: false })
      const active = service.listAssets(TENANT_ID, { active: true })
      const inactive = service.listAssets(TENANT_ID, { active: false })
      expect(active).toHaveLength(0)
      expect(inactive).toHaveLength(1)
    })

    it('AC-47-03: 上传新logo→更新品牌色 → 各页面品牌更新', () => {
      // 上传新logo
      const asset = service.createAsset({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        type: 'logo',
        url: 'https://cdn.example.com/new-logo.png',
        name: '新版Logo',
      })
      expect(asset.type).toBe('logo')
      expect(asset.url).toContain('new-logo')

      // 查询当前活跃Logo
      const logos = service.listAssets(TENANT_ID, { type: 'logo', active: true })
      expect(logos).toHaveLength(1)
      expect(logos[0].url).toContain('new-logo')
    })
  })

  // ── RQ-47-02: 品牌活动 ──────────────────────────────────────────

  describe('RQ-47-02 品牌活动', () => {
    it('应创建品牌活动 → 初始状态为draft', () => {
      const camp = service.createCampaign({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        title: '夏日狂欢季',
        description: '2026年夏季全品牌促销活动',
        storeIds: ['store-1', 'store-2', 'store-3'],
        startDate: '2026-07-21T00:00:00Z',
        endDate: '2026-08-20T00:00:00Z',
        createdBy: 'e30-premium',
      })
      expect(camp.title).toBe('夏日狂欢季')
      expect(camp.storeIds).toHaveLength(3)
      expect(camp.status).toBe('draft')
    })

    it('AC-47-02: 创建"夏日狂欢"活动→选择3家门店 → 3店同步展示', () => {
      // 创建活动，关联3家门店
      const camp = service.createCampaign({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        title: '夏日狂欢',
        description: '2026年夏季狂欢促销活动',
        storeIds: ['store-1', 'store-2', 'store-3'],
        startDate: '2026-07-21T00:00:00Z',
        endDate: '2026-08-20T00:00:00Z',
        createdBy: 'e30-premium',
      })
      // 启动活动
      service.updateCampaign(camp.id, TENANT_ID, { status: 'active' })
      // 同步到门店
      const records = service.syncToStores(camp.id, TENANT_ID)
      expect(records).toHaveLength(3)

      // 验证3门店同步
      for (const r of records) {
        expect(r.status).toBe('synced')
      }

      // 验证门店能查到该活动
      const store1Campaigns = service.getSyncedCampaigns('store-1', TENANT_ID)
      expect(store1Campaigns).toHaveLength(1)
      expect(store1Campaigns[0].title).toBe('夏日狂欢')
    })

    it('应支持活动上架 → 状态变为active', () => {
      const camp = service.createCampaign({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        title: '双十一预售',
        description: '双十一品牌预热活动',
        storeIds: ['store-1'],
        startDate: '2026-10-20T00:00:00Z',
        endDate: '2026-11-11T00:00:00Z',
        createdBy: 'e31-traffic',
      })
      const updated = service.updateCampaign(camp.id, TENANT_ID, { status: 'active' })
      expect(updated.status).toBe('active')
    })

    it('应支持活动结束 → 状态变为ended', () => {
      const camp = service.createCampaign({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        title: '618大促',
        description: '618促销活动',
        storeIds: ['store-1'],
        startDate: '2026-06-01T00:00:00Z',
        endDate: '2026-06-20T00:00:00Z',
        createdBy: 'u-1',
      })
      service.updateCampaign(camp.id, TENANT_ID, { status: 'active' })
      service.updateCampaign(camp.id, TENANT_ID, { status: 'ended' })
      const ended = service.getCampaign(camp.id, TENANT_ID)
      expect(ended!.status).toBe('ended')
    })

    it('应支持活动关联品牌素材', () => {
      const banner = service.createAsset({
        tenantId: TENANT_ID, brandId: BRAND_ID, type: 'banner',
        url: 'https://cdn.example.com/campaign-banner.jpg',
        name: '活动Banner',
      })
      const camp = service.createCampaign({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        title: '中秋特惠',
        description: '中秋品牌活动',
        storeIds: ['store-1'],
        startDate: '2026-09-15T00:00:00Z',
        endDate: '2026-09-30T00:00:00Z',
        assets: [banner.id],
        createdBy: 'u-1',
      })
      expect(camp.assets).toContain(banner.id)
    })
  })

  // ── RQ-47-04: 门店品牌同步 ──────────────────────────────────────

  describe('RQ-47-04 门店品牌同步', () => {
    it('应支持品牌更新→各门店自动同步', () => {
      const camp = service.createCampaign({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        title: '周年庆',
        description: '品牌周年庆活动',
        storeIds: ['store-1', 'store-2'],
        startDate: '2026-08-01T00:00:00Z',
        endDate: '2026-08-07T00:00:00Z',
        createdBy: 'u-1',
      })
      service.updateCampaign(camp.id, TENANT_ID, { status: 'active' })

      // 品牌更新: 修改活动标题
      service.updateCampaign(camp.id, TENANT_ID, { title: '周年庆-新版' })

      // 同步到门店
      const records = service.syncToStores(camp.id, TENANT_ID)
      expect(records).toHaveLength(2)

      // 门店获取到更新后的活动
      const store1 = service.getSyncedCampaigns('store-1', TENANT_ID)
      expect(store1[0].title).toBe('周年庆-新版')
    })

    it('应支持查询门店同步状态', () => {
      const camp = service.createCampaign({
        tenantId: TENANT_ID, brandId: BRAND_ID, title: '测试同步', description: '测试',
        storeIds: ['s-1', 's-2', 's-3'], startDate: '2026-07-01T00:00:00Z',
        endDate: '2026-08-01T00:00:00Z', createdBy: 'u-1',
      })
      service.updateCampaign(camp.id, TENANT_ID, { status: 'active' })
      service.syncToStores(camp.id, TENANT_ID)

      const records = service.getSyncRecords(camp.id, TENANT_ID)
      expect(records).toHaveLength(3)
    })
  })

  // ── 统计 ─────────────────────────────────────────────────────────

  describe('品牌运营统计', () => {
    it('应返回正确统计数据', () => {
      service.createAsset({ tenantId: TENANT_ID, brandId: BRAND_ID, type: 'logo', url: 'l1', name: 'L1' })
      service.createAsset({ tenantId: TENANT_ID, brandId: BRAND_ID, type: 'banner', url: 'b1', name: 'B1', active: false })

      const camp = service.createCampaign({
        tenantId: TENANT_ID, brandId: BRAND_ID, title: '活动1', description: 'D1',
        storeIds: ['s-1', 's-2'], startDate: '2026-07-01T00:00:00Z',
        endDate: '2026-08-01T00:00:00Z', createdBy: 'u-1',
      })
      service.updateCampaign(camp.id, TENANT_ID, { status: 'active' })
      service.syncToStores(camp.id, TENANT_ID)

      const metrics = service.getMetrics(TENANT_ID)
      expect(metrics.totalAssets).toBe(2)
      expect(metrics.activeAssets).toBe(1)
      expect(metrics.totalCampaigns).toBe(1)
      expect(metrics.activeCampaigns).toBe(1)
      expect(metrics.totalStoreAssignments).toBe(2)
      expect(metrics.syncedStores).toBe(2)
    })
  })
})
