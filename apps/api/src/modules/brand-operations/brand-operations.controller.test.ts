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
  })
})
