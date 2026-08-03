/**
 * brand-operations controller 单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { BrandOperationsController } from './brand-operations.controller'
import { BrandOperationsService, resetBrandOpsStoresForTests } from './brand-operations.service'

describe('BrandOperationsController', () => {
  let controller: BrandOperationsController
  let service: BrandOperationsService

  beforeEach(() => {
    resetBrandOpsStoresForTests()
    service = new BrandOperationsService()
    controller = new BrandOperationsController(service)
  })

  // ── BrandAsset CRUD ──────────────────────────────────────────────────

  describe('POST /brand-operations/assets (createAsset)', () => {
    it('正例: 创建品牌素材成功', () => {
      const result = controller.createAsset({
        type: 'logo' as any,
        url: 'https://cdn.example.com/logo.png',
        name: '品牌Logo',
      })

      expect(result.id).toMatch(/^ba-/)
      expect(result.type).toBe('logo')
      expect(result.active).toBe(true)
    })
  })

  describe('GET /brand-operations/assets (listAssets)', () => {
    it('正例: 列出所有素材', () => {
      controller.createAsset({ type: 'logo' as any, url: 'l1', name: 'Logo' })
      controller.createAsset({ type: 'banner' as any, url: 'b1', name: 'Banner' })

      const assets = controller.listAssets(undefined, undefined)
      expect(assets).toHaveLength(2)
    })

    it('正例: 按类型筛选素材', () => {
      controller.createAsset({ type: 'logo' as any, url: 'l1', name: 'Logo' })
      controller.createAsset({ type: 'banner' as any, url: 'b1', name: 'Banner' })

      const logos = controller.listAssets('logo', undefined)
      expect(logos).toHaveLength(1)
      expect(logos[0].type).toBe('logo')
    })
  })

  describe('GET /brand-operations/assets/:assetId (getAsset)', () => {
    it('正例: 按ID查询素材', () => {
      const created = controller.createAsset({ type: 'logo' as any, url: 'l1', name: 'Logo' })
      const found = controller.getAsset(created.id)
      expect(found!.id).toBe(created.id)
    })

    it('反例: 不存在的素材', () => {
      const found = controller.getAsset('nonexistent')
      expect(found).toBeUndefined()
    })
  })

  describe('PATCH /brand-operations/assets/:assetId (updateAsset)', () => {
    it('正例: 更新素材名称', () => {
      const created = controller.createAsset({ type: 'logo' as any, url: 'l1', name: '旧名字' })
      const updated = controller.updateAsset(created.id, { name: '新名字' })
      expect(updated.name).toBe('新名字')
    })
  })

  describe('DELETE /brand-operations/assets/:assetId (deleteAsset)', () => {
    it('正例: 删除素材', () => {
      const created = controller.createAsset({ type: 'logo' as any, url: 'l1', name: 'Logo' })
      const result = controller.deleteAsset(created.id)
      expect(result.success).toBe(true)
    })

    it('反例: 删除不存在的素材', () => {
      const result = controller.deleteAsset('nonexistent')
      expect(result.success).toBe(false)
    })
  })

  // ── BrandCampaign CRUD ──────────────────────────────────────────────

  describe('POST /brand-operations/campaigns (createCampaign)', () => {
    it('正例: 创建品牌活动成功', () => {
      const result = controller.createCampaign({
        title: '夏日狂欢',
        description: '夏季促销活动',
        storeIds: ['s-1', 's-2'],
        startDate: '2026-07-01T00:00:00Z',
        endDate: '2026-08-01T00:00:00Z',
        createdBy: 'user-1',
      })

      expect(result.id).toMatch(/^bc-/)
      expect(result.title).toBe('夏日狂欢')
      expect(result.status).toBe('draft')
    })
  })

  describe('GET /brand-operations/campaigns (listCampaigns)', () => {
    it('正例: 列出活动', () => {
      controller.createCampaign({
        title: 'C1', description: 'D1', storeIds: ['s-1'],
        startDate: '2026-07-01T00:00:00Z', endDate: '2026-08-01T00:00:00Z', createdBy: 'u-1',
      })
      controller.createCampaign({
        title: 'C2', description: 'D2', storeIds: ['s-2'],
        startDate: '2026-08-01T00:00:00Z', endDate: '2026-09-01T00:00:00Z', createdBy: 'u-1',
      })

      const campaigns = controller.listCampaigns({} as any)
      expect(campaigns).toHaveLength(2)
    })
  })

  describe('PATCH /brand-operations/campaigns/:campaignId (updateCampaign)', () => {
    it('正例: 激活活动', () => {
      const created = controller.createCampaign({
        title: 'Test', description: 'D', storeIds: ['s-1'],
        startDate: '2026-07-01T00:00:00Z', endDate: '2026-08-01T00:00:00Z', createdBy: 'u-1',
      })
      const updated = controller.updateCampaign(created.id, { status: 'active' as any })
      expect(updated.status).toBe('active')
    })
  })

  // ── 门店同步 ────────────────────────────────────────────────────────

  describe('POST /brand-operations/campaigns/:campaignId/sync', () => {
    it('正例: 同步活动到门店', () => {
      const created = controller.createCampaign({
        title: 'Sync', description: 'Sync', storeIds: ['s-1', 's-2'],
        startDate: '2026-07-01T00:00:00Z', endDate: '2026-08-01T00:00:00Z', createdBy: 'u-1',
      })
      controller.updateCampaign(created.id, { status: 'active' as any })
      const records = controller.syncToStores(created.id)
      expect(records).toHaveLength(2)
    })
  })

  // ── 统计 ────────────────────────────────────────────────────────────

  describe('GET /brand-operations/metrics', () => {
    it('正例: 返回统计数据', () => {
      const metrics = controller.getMetrics()
      expect(metrics).toHaveProperty('totalAssets')
      expect(metrics).toHaveProperty('activeCampaigns')
    })
  
  // ═══════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════
  //  高级功能端点 (使用 as any 绕过 DTO 类型校验)
  // ═══════════════════════════════════════════════════

  describe('GET /brand-operations/dashboard', () => {
    it('正例: 返回品牌看板数据', () => {
      const dashboard = controller.getDashboard()
      expect(dashboard).toBeDefined()
      expect(typeof dashboard).toBe('object')
    })
  })

  describe('GET /brand-operations/calendar/timeline', () => {
    it('正例: 返回品牌活动日历', () => {
      const timeline = controller.getCalendarTimeline({
        startDate: '2026-07-01T00:00:00Z',
        endDate: '2026-08-01T00:00:00Z',
      } as any)
      expect(timeline).toHaveProperty('events')
      expect(timeline).toHaveProperty('dailyCounts')
    })
  })

  describe('POST /brand-operations/campaigns/:campaignId/submit', () => {
    it('正例: 提交审批', () => {
      const created = controller.createCampaign({
        title: '审批测试', description: 'D', storeIds: ['s-1'],
        startDate: '2026-07-01T00:00:00Z', endDate: '2026-08-01T00:00:00Z', createdBy: 'u-1',
      } as any)
      const submitted = controller.submitCampaign(created.id)
      expect(submitted.status).toBe('pending_review')
    })
  })

  describe('POST /brand-operations/campaigns/:campaignId/approve', () => {
    it('正例: 审批通过', () => {
      const created = controller.createCampaign({
        title: '审批通过测试', description: 'D', storeIds: ['s-1'],
        startDate: '2026-07-01T00:00:00Z', endDate: '2026-08-01T00:00:00Z', createdBy: 'u-1',
      } as any)
      controller.submitCampaign(created.id)
      const approved = controller.approveCampaign(created.id, {
        reviewerId: 'u-admin', reviewerName: '管理员', note: '同意',
      })
      expect(approved.status).toBe('approved')
    })
  })

  describe('POST /brand-operations/campaigns/:campaignId/publish', () => {
    it('正例: 发布活动全流程', () => {
      const created = controller.createCampaign({
        title: '发布测试', description: 'D', storeIds: ['s-1'],
        startDate: '2026-07-01T00:00:00Z', endDate: '2026-08-01T00:00:00Z', createdBy: 'u-1',
      } as any)
      controller.submitCampaign(created.id)
      controller.approveCampaign(created.id, { reviewerId: 'u-admin', reviewerName: '管理员', note: '同意' })
      const published = controller.publishCampaign(created.id, { note: '发布!' } as any)
      expect(published.status).toBe('active')
    })
  })

  describe('GET /brand-operations/collaborations/metrics', () => {
    it('正例: 返回联名统计', () => {
      const metrics = controller.getCollaborationMetrics()
      expect(metrics).toHaveProperty('total')
      expect(metrics).toHaveProperty('active')
    })
  })

  describe('POST /brand-operations/recycle-bin/soft-delete', () => {
    it('正例: 软删除素材到回收站', () => {
      const asset = controller.createAsset({ type: 'logo' as any, url: 'l1', name: 'Logo' } as any)
      const binItem = controller.softDeleteEntity({
        entityType: 'asset', entityId: asset.id, deletedBy: 'u-1',
      } as any)
      expect(binItem.id).toMatch(/^rb-/)
    })
  })

  describe('POST /brand-operations/kpis', () => {
    it('正例: 创建品牌KPI', () => {
      const kpi = controller.createBrandKPI({
        name: '曝光量', category: 'exposure' as any, period: 'monthly' as any,
        periodStart: '2026-07-01', periodEnd: '2026-07-31',
        targetValue: 100000, createdBy: 'u-1',
      } as any)
      expect(kpi.id).toMatch(/^kpi-/)
    })
  })

  describe('GET /brand-operations/kpis/summary', () => {
    it('正例: 返回KPI汇总', () => {
      const summary = controller.getBrandKPISummary()
      expect(summary).toHaveProperty('totalKpis')
    })
  })
  })
})
