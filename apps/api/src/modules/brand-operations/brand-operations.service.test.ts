import { describe, it, expect, beforeEach } from 'vitest'
import { BrandOperationsService, resetBrandOpsStoresForTests } from './brand-operations.service'
import type { BrandAsset, BrandCampaign } from './brand-operations.entity'

describe('BrandOperationsService', () => {
  let service: BrandOperationsService

  beforeEach(() => {
    resetBrandOpsStoresForTests()
    service = new BrandOperationsService()
  })

  const TENANT_ID = 't-1'
  const BRAND_ID = 'b-1'

  describe('createAsset', () => {
    it('should create a brand asset', () => {
      const asset = service.createAsset({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        type: 'logo',
        url: 'https://cdn.example.com/logo.png',
        name: '品牌Logo',
      })
      expect(asset.id).toMatch(/^ba-/)
      expect(asset.type).toBe('logo')
      expect(asset.active).toBe(true)
      expect(asset.createdAt).toBeTruthy()
    })

    it('should allow creating inactive asset', () => {
      const asset = service.createAsset({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        type: 'banner',
        url: 'https://cdn.example.com/banner.jpg',
        name: '旧Banner',
        active: false,
      })
      expect(asset.active).toBe(false)
    })

    it('should support all asset types', () => {
      const types: Array<'logo' | 'banner' | 'video' | 'copy'> = ['logo', 'banner', 'video', 'copy']
      for (const type of types) {
        const asset = service.createAsset({
          tenantId: TENANT_ID,
          brandId: BRAND_ID,
          type,
          url: `https://cdn.example.com/${type}`,
          name: `${type} asset`,
        })
        expect(asset.type).toBe(type)
      }
    })
  })

  describe('getAsset / listAssets', () => {
    it('should get asset by id', () => {
      const created = service.createAsset({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        type: 'logo',
        url: 'https://cdn.example.com/logo.png',
        name: '品牌Logo',
      })
      const found = service.getAsset(created.id, TENANT_ID)
      expect(found).toBeDefined()
      expect(found!.id).toBe(created.id)
    })

    it('should return undefined for non-existent asset', () => {
      const found = service.getAsset('nonexistent', TENANT_ID)
      expect(found).toBeUndefined()
    })

    it('should not return asset from different tenant', () => {
      const created = service.createAsset({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        type: 'logo',
        url: 'https://cdn.example.com/logo.png',
        name: '品牌Logo',
      })
      const found = service.getAsset(created.id, 'other-tenant')
      expect(found).toBeUndefined()
    })

    it('should list all assets for tenant', () => {
      service.createAsset({ tenantId: TENANT_ID, brandId: BRAND_ID, type: 'logo', url: 'logo1', name: 'Logo1' })
      service.createAsset({ tenantId: TENANT_ID, brandId: BRAND_ID, type: 'banner', url: 'banner1', name: 'Banner1' })
      service.createAsset({ tenantId: 'other-tenant', brandId: BRAND_ID, type: 'logo', url: 'other', name: 'Other' })

      const assets = service.listAssets(TENANT_ID)
      expect(assets).toHaveLength(2)
    })

    it('should filter assets by type', () => {
      service.createAsset({ tenantId: TENANT_ID, brandId: BRAND_ID, type: 'logo', url: 'logo1', name: 'Logo1' })
      service.createAsset({ tenantId: TENANT_ID, brandId: BRAND_ID, type: 'banner', url: 'banner1', name: 'Banner1' })
      service.createAsset({ tenantId: TENANT_ID, brandId: BRAND_ID, type: 'video', url: 'video1', name: 'Video1' })

      const logos = service.listAssets(TENANT_ID, { type: 'logo' })
      expect(logos).toHaveLength(1)
      expect(logos[0].type).toBe('logo')
    })

    it('should filter assets by active status', () => {
      service.createAsset({ tenantId: TENANT_ID, brandId: BRAND_ID, type: 'logo', url: 'logo1', name: 'Logo1', active: true })
      service.createAsset({ tenantId: TENANT_ID, brandId: BRAND_ID, type: 'banner', url: 'banner1', name: 'Banner1', active: false })

      const active = service.listAssets(TENANT_ID, { active: true })
      expect(active).toHaveLength(1)
      expect(active[0].type).toBe('logo')
    })
  })

  describe('updateAsset', () => {
    it('should update asset fields', () => {
      const created = service.createAsset({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        type: 'logo',
        url: 'https://cdn.example.com/old.png',
        name: '旧Logo',
      })
      const updated = service.updateAsset(created.id, TENANT_ID, {
        name: '新Logo',
        url: 'https://cdn.example.com/new.png',
      })
      expect(updated.name).toBe('新Logo')
      expect(updated.url).toBe('https://cdn.example.com/new.png')
      expect(updated.type).toBe('logo') // unchanged
      expect(updated.name).toBe('新Logo')
    })

    it('should deactivate asset', () => {
      const created = service.createAsset({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        type: 'logo',
        url: 'https://cdn.example.com/logo.png',
        name: '品牌Logo',
      })
      service.updateAsset(created.id, TENANT_ID, { active: false })
      const assets = service.listAssets(TENANT_ID, { active: false })
      expect(assets).toHaveLength(1)
    })

    it('should throw for non-existent asset', () => {
      expect(() => service.updateAsset('nonexistent', TENANT_ID, { name: 'New' })).toThrow('BrandAsset not found')
    })
  })

  describe('deleteAsset', () => {
    it('should delete asset', () => {
      const created = service.createAsset({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        type: 'logo',
        url: 'https://cdn.example.com/logo.png',
        name: '品牌Logo',
      })
      const result = service.deleteAsset(created.id, TENANT_ID)
      expect(result).toBe(true)
      expect(service.getAsset(created.id, TENANT_ID)).toBeUndefined()
    })

    it('should return false for non-existent', () => {
      const result = service.deleteAsset('nonexistent', TENANT_ID)
      expect(result).toBe(false)
    })
  })

  describe('createCampaign', () => {
    it('should create a brand campaign', () => {
      const camp = service.createCampaign({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        title: '夏日狂欢',
        description: '2026夏季促销',
        storeIds: ['s-1', 's-2'],
        startDate: '2026-07-01T00:00:00Z',
        endDate: '2026-08-31T00:00:00Z',
        createdBy: 'user-1',
      })
      expect(camp.id).toMatch(/^bc-/)
      expect(camp.title).toBe('夏日狂欢')
      expect(camp.status).toBe('draft')
      expect(camp.storeIds).toEqual(['s-1', 's-2'])
    })

    it('should reject invalid date range', () => {
      expect(() =>
        service.createCampaign({
          tenantId: TENANT_ID,
          brandId: BRAND_ID,
          title: 'Invalid',
          description: 'End before start',
          storeIds: ['s-1'],
          startDate: '2026-08-01T00:00:00Z',
          endDate: '2026-07-01T00:00:00Z',
          createdBy: 'user-1',
        }),
      ).toThrow('Start date must be before end date')
    })

    it('should create campaign with assets reference', () => {
      const asset = service.createAsset({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        type: 'banner',
        url: 'https://cdn.example.com/banner.jpg',
        name: '活动Banner',
      })
      const camp = service.createCampaign({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        title: '618大促',
        description: '618全品牌活动',
        storeIds: ['s-1'],
        startDate: '2026-06-01T00:00:00Z',
        endDate: '2026-06-20T00:00:00Z',
        assets: [asset.id],
        coverImageUrl: 'https://cdn.example.com/cover.jpg',
        createdBy: 'user-1',
      })
      expect(camp.assets).toEqual([asset.id])
      expect(camp.coverImageUrl).toBe('https://cdn.example.com/cover.jpg')
    })
  })

  describe('getCampaign / listCampaigns', () => {
    it('should get campaign by id', () => {
      const created = service.createCampaign({
        tenantId: TENANT_ID,
        brandId: BRAND_ID,
        title: 'Test',
        description: 'Desc',
        storeIds: ['s-1'],
        startDate: '2026-07-01T00:00:00Z',
        endDate: '2026-08-01T00:00:00Z',
        createdBy: 'user-1',
      })
      const found = service.getCampaign(created.id, TENANT_ID)
      expect(found).toBeDefined()
      expect(found!.title).toBe('Test')
    })

    it('should list campaigns with filters', () => {
      service.createCampaign({
        tenantId: TENANT_ID, brandId: BRAND_ID, title: 'A', description: 'A', storeIds: ['s-1'],
        startDate: '2026-07-01T00:00:00Z', endDate: '2026-07-10T00:00:00Z', createdBy: 'u-1',
      })
      service.createCampaign({
        tenantId: TENANT_ID, brandId: BRAND_ID, title: 'B', description: 'B', storeIds: ['s-2'],
        startDate: '2026-08-01T00:00:00Z', endDate: '2026-08-10T00:00:00Z', createdBy: 'u-1',
      })

      const all = service.listCampaigns(TENANT_ID)
      expect(all).toHaveLength(2)

      const filtered = service.listCampaigns(TENANT_ID, { storeId: 's-1' })
      expect(filtered).toHaveLength(1)
    })
  })

  describe('updateCampaign', () => {
    it('should update campaign fields', () => {
      const created = service.createCampaign({
        tenantId: TENANT_ID, brandId: BRAND_ID, title: 'Old', description: 'Old desc',
        storeIds: ['s-1'], startDate: '2026-07-01T00:00:00Z', endDate: '2026-08-01T00:00:00Z',
        createdBy: 'u-1',
      })
      const updated = service.updateCampaign(created.id, TENANT_ID, { title: 'New Title' })
      expect(updated.title).toBe('New Title')
      expect(updated.description).toBe('Old desc')
    })

    it('should activate campaign', () => {
      const created = service.createCampaign({
        tenantId: TENANT_ID, brandId: BRAND_ID, title: 'Go Live', description: 'Desc',
        storeIds: ['s-1'], startDate: '2026-07-01T00:00:00Z', endDate: '2026-08-01T00:00:00Z',
        createdBy: 'u-1',
      })
      const updated = service.updateCampaign(created.id, TENANT_ID, { status: 'active' })
      expect(updated.status).toBe('active')
    })

    it('should reject invalid status transition', () => {
      const created = service.createCampaign({
        tenantId: TENANT_ID, brandId: BRAND_ID, title: 'Test', description: 'Desc',
        storeIds: ['s-1'], startDate: '2026-07-01T00:00:00Z', endDate: '2026-08-01T00:00:00Z',
        createdBy: 'u-1',
      })
      expect(() => service.updateCampaign(created.id, TENANT_ID, { status: 'ended' })).toThrow(
        'Invalid campaign status transition: draft → ended',
      )
    })

    it('should reject invalid date range on update', () => {
      const created = service.createCampaign({
        tenantId: TENANT_ID, brandId: BRAND_ID, title: 'Test', description: 'Desc',
        storeIds: ['s-1'], startDate: '2026-07-01T00:00:00Z', endDate: '2026-08-01T00:00:00Z',
        createdBy: 'u-1',
      })
      expect(() =>
        service.updateCampaign(created.id, TENANT_ID, { endDate: '2026-06-01T00:00:00Z' }),
      ).toThrow('Start date must be before end date')
    })
  })

  describe('deleteCampaign', () => {
    it('should delete campaign', () => {
      const created = service.createCampaign({
        tenantId: TENANT_ID, brandId: BRAND_ID, title: 'Test', description: 'Desc',
        storeIds: ['s-1'], startDate: '2026-07-01T00:00:00Z', endDate: '2026-08-01T00:00:00Z',
        createdBy: 'u-1',
      })
      expect(service.deleteCampaign(created.id, TENANT_ID)).toBe(true)
      expect(service.getCampaign(created.id, TENANT_ID)).toBeUndefined()
    })

    it('should return false for non-existent', () => {
      expect(service.deleteCampaign('nonexistent', TENANT_ID)).toBe(false)
    })
  })

  describe('门店同步', () => {
    it('should sync campaign to all assigned stores', () => {
      const camp = service.createCampaign({
        tenantId: TENANT_ID, brandId: BRAND_ID, title: 'Sync Test', description: 'Desc',
        storeIds: ['s-1', 's-2', 's-3'],
        startDate: '2026-07-01T00:00:00Z', endDate: '2026-08-01T00:00:00Z',
        createdBy: 'u-1',
      })
      service.updateCampaign(camp.id, TENANT_ID, { status: 'active' })

      const records = service.syncToStores(camp.id, TENANT_ID)
      expect(records).toHaveLength(3)
      for (const r of records) {
        expect(r.status).toBe('synced')
        expect(r.syncedAt).toBeTruthy()
      }
    })

    it('should not sync non-active campaign', () => {
      const camp = service.createCampaign({
        tenantId: TENANT_ID, brandId: BRAND_ID, title: 'Draft', description: 'Desc',
        storeIds: ['s-1'], startDate: '2026-07-01T00:00:00Z', endDate: '2026-08-01T00:00:00Z',
        createdBy: 'u-1',
      })
      expect(() => service.syncToStores(camp.id, TENANT_ID)).toThrow('Cannot sync campaign with status "draft"')
    })

    it('should be idempotent on resync', () => {
      const camp = service.createCampaign({
        tenantId: TENANT_ID, brandId: BRAND_ID, title: 'Resync', description: 'Desc',
        storeIds: ['s-1'],
        startDate: '2026-07-01T00:00:00Z', endDate: '2026-08-01T00:00:00Z',
        createdBy: 'u-1',
      })
      service.updateCampaign(camp.id, TENANT_ID, { status: 'active' })
      const first = service.syncToStores(camp.id, TENANT_ID)
      const second = service.syncToStores(camp.id, TENANT_ID)
      // Should still report the original sync (idempotent)
      expect(second).toHaveLength(1)
      expect(second[0].id).toBe(first[0].id)
    })

    it('should get synced campaigns for store', () => {
      const c1 = service.createCampaign({
        tenantId: TENANT_ID, brandId: BRAND_ID, title: 'C1', description: 'D1',
        storeIds: ['s-1'], startDate: '2026-07-01T00:00:00Z', endDate: '2026-08-01T00:00:00Z',
        createdBy: 'u-1',
      })
      const c2 = service.createCampaign({
        tenantId: TENANT_ID, brandId: BRAND_ID, title: 'C2', description: 'D2',
        storeIds: ['s-1'], startDate: '2026-07-01T00:00:00Z', endDate: '2026-08-01T00:00:00Z',
        createdBy: 'u-1',
      })
      service.updateCampaign(c1.id, TENANT_ID, { status: 'active' })
      service.updateCampaign(c2.id, TENANT_ID, { status: 'active' })
      service.syncToStores(c1.id, TENANT_ID)
      service.syncToStores(c2.id, TENANT_ID)

      const synced = service.getSyncedCampaigns('s-1', TENANT_ID)
      expect(synced).toHaveLength(2)
    })
  })

  describe('getMetrics', () => {
    it('should return metrics for tenant', () => {
      service.createAsset({ tenantId: TENANT_ID, brandId: BRAND_ID, type: 'logo', url: 'l1', name: 'L1' })
      service.createAsset({ tenantId: TENANT_ID, brandId: BRAND_ID, type: 'banner', url: 'b1', name: 'B1', active: false })

      const camp = service.createCampaign({
        tenantId: TENANT_ID, brandId: BRAND_ID, title: 'C', description: 'D',
        storeIds: ['s-1', 's-2'], startDate: '2026-07-01T00:00:00Z', endDate: '2026-08-01T00:00:00Z',
        createdBy: 'u-1',
      })
      service.updateCampaign(camp.id, TENANT_ID, { status: 'active' })
      service.syncToStores(camp.id, TENANT_ID)

      // Create another tenant asset — should not count
      service.createAsset({ tenantId: 'other', brandId: BRAND_ID, type: 'logo', url: 'other', name: 'Other' })

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
