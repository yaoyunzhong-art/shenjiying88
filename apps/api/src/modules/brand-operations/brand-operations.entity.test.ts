import { describe, it, expect } from 'vitest'
import type {
  BrandAsset,
  BrandAssetType,
  BrandCampaign,
  CampaignStatus,
  BrandSyncRecord,
  SyncStatus,
  BrandOperationsMetrics,
} from './brand-operations.entity'

describe('BrandOperations Entity Types', () => {
  describe('BrandAsset', () => {
    it('should create a minimal BrandAsset', () => {
      const asset: BrandAsset = {
        id: 'ba-1',
        type: 'logo',
        url: 'https://cdn.example.com/logo.png',
        active: true,
        tenantId: 't-1',
        brandId: 'b-1',
        name: '品牌Logo',
        createdAt: '2026-07-20T00:00:00Z',
        updatedAt: '2026-07-20T00:00:00Z',
      }
      expect(asset.type).toBe('logo')
      expect(asset.active).toBe(true)
      expect(asset.description).toBeUndefined()
      expect(asset.mimeType).toBeUndefined()
    })

    it('should support all asset types', () => {
      const types: BrandAssetType[] = ['logo', 'banner', 'video', 'copy']
      expect(types).toHaveLength(4)
    })

    it('should create a full BrandAsset with all fields', () => {
      const asset: BrandAsset = {
        id: 'ba-2',
        type: 'banner',
        url: 'https://cdn.example.com/banner.jpg',
        active: true,
        tenantId: 't-1',
        brandId: 'b-1',
        name: '首页Banner',
        description: '2026夏季促销Banner',
        fileSizeBytes: 2048576,
        mimeType: 'image/jpeg',
        createdAt: '2026-07-20T00:00:00Z',
        updatedAt: '2026-07-20T00:00:00Z',
      }
      expect(asset.type).toBe('banner')
      expect(asset.description).toBe('2026夏季促销Banner')
      expect(asset.fileSizeBytes).toBe(2048576)
      expect(asset.mimeType).toBe('image/jpeg')
    })
  })

  describe('BrandCampaign', () => {
    it('should create a BrandCampaign', () => {
      const camp: BrandCampaign = {
        id: 'bc-1',
        tenantId: 't-1',
        brandId: 'b-1',
        title: '夏日狂欢',
        description: '2026夏季品牌活动',
        storeIds: ['s-1', 's-2'],
        startDate: '2026-07-01T00:00:00Z',
        endDate: '2026-08-31T00:00:00Z',
        status: 'draft',
        assets: [],
        createdBy: 'user-1',
        createdAt: '2026-07-20T00:00:00Z',
        updatedAt: '2026-07-20T00:00:00Z',
      }
      expect(camp.title).toBe('夏日狂欢')
      expect(camp.storeIds).toHaveLength(2)
      expect(camp.status).toBe('draft')
      expect(camp.coverImageUrl).toBeUndefined()
    })

    it('should support all campaign statuses', () => {
      const statuses: CampaignStatus[] = ['draft', 'active', 'ended', 'cancelled']
      expect(statuses).toHaveLength(4)
    })

    it('should create a BrandCampaign with assets and cover image', () => {
      const camp: BrandCampaign = {
        id: 'bc-2',
        tenantId: 't-1',
        brandId: 'b-1',
        title: '618大促',
        description: '618全品牌促销活动',
        storeIds: ['s-1', 's-2', 's-3'],
        startDate: '2026-06-01T00:00:00Z',
        endDate: '2026-06-20T00:00:00Z',
        status: 'active',
        assets: ['ba-1', 'ba-2'],
        coverImageUrl: 'https://cdn.example.com/cover.jpg',
        createdBy: 'user-2',
        createdAt: '2026-05-20T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z',
      }
      expect(camp.assets).toHaveLength(2)
      expect(camp.coverImageUrl).toBe('https://cdn.example.com/cover.jpg')
      expect(camp.status).toBe('active')
    })
  })

  describe('BrandSyncRecord', () => {
    it('should create a sync record', () => {
      const record: BrandSyncRecord = {
        id: 'sync-1',
        campaignId: 'bc-1',
        storeId: 's-1',
        status: 'synced',
        syncedAt: '2026-07-20T00:00:00Z',
        createdAt: '2026-07-20T00:00:00Z',
      }
      expect(record.status).toBe('synced')
      expect(record.errorMessage).toBeUndefined()
    })

    it('should create a failed sync record', () => {
      const record: BrandSyncRecord = {
        id: 'sync-2',
        campaignId: 'bc-1',
        storeId: 's-5',
        status: 'failed',
        errorMessage: 'Store unavailable',
        createdAt: '2026-07-20T00:00:00Z',
      }
      expect(record.status).toBe('failed')
      expect(record.errorMessage).toBe('Store unavailable')
      expect(record.syncedAt).toBeUndefined()
    })

    it('should support all sync statuses', () => {
      const statuses: SyncStatus[] = ['pending', 'synced', 'failed']
      expect(statuses).toHaveLength(3)
    })
  })

  describe('BrandOperationsMetrics', () => {
    it('should create metrics', () => {
      const metrics: BrandOperationsMetrics = {
        totalAssets: 10,
        activeAssets: 8,
        totalCampaigns: 5,
        activeCampaigns: 3,
        totalStoreAssignments: 12,
        syncedStores: 9,
      }
      expect(metrics.totalAssets).toBe(10)
      expect(metrics.activeCampaigns).toBe(3)
      expect(metrics.syncedStores).toBe(9)
    })
  })
})
