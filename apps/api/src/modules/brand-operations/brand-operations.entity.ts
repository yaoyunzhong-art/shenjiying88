/**
 * brand-operations.entity.ts - P-47 品牌运营实体
 *
 * 按 PRD-012 数据模型定义:
 *   BrandAsset (logo/banner/video/copy)
 *   BrandCampaign (品牌活动 → 门店同步展示)
 */

import { randomUUID } from 'node:crypto'

// ── 资产类型 ─────────────────────────────────────────────────────────────────

export type BrandAssetType = 'logo' | 'banner' | 'video' | 'copy'

export interface BrandAsset {
  id: string
  type: BrandAssetType
  url: string
  active: boolean
  tenantId: string
  brandId: string
  name: string
  description?: string
  fileSizeBytes?: number
  mimeType?: string
  createdAt: string
  updatedAt: string
}

// ── 品牌活动 ─────────────────────────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'active' | 'ended' | 'cancelled'

export interface BrandCampaign {
  id: string
  tenantId: string
  brandId: string
  title: string
  description: string
  storeIds: string[]
  startDate: string
  endDate: string
  status: CampaignStatus
  assets: string[]       // BrandAsset.id[]
  coverImageUrl?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ── 门店同步记录 ────────────────────────────────────────────────────────────

export type SyncStatus = 'pending' | 'synced' | 'failed'

export interface BrandSyncRecord {
  id: string
  campaignId: string
  storeId: string
  status: SyncStatus
  errorMessage?: string
  syncedAt?: string
  createdAt: string
}

// ── 品牌运营统计 ────────────────────────────────────────────────────────────

// ── 活动模板 ────────────────────────────────────────────────────────────────

export interface BrandCampaignTemplate {
  id: string
  tenantId: string
  brandId: string
  name: string
  description: string
  /** 模板预设门店列表 */
  defaultStoreIds: string[]
  /** 模板预设素材列表 */
  defaultAssets: string[]
  /** 模板预设封面图 */
  coverImageUrl?: string
  /** 默认活动时长（天数） */
  defaultDurationDays?: number
  /** 模板标签 */
  tags: string[]
  /** 是否已发布 */
  published: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ── 品牌运营统计 ────────────────────────────────────────────────────────────

export interface BrandOperationsMetrics {
  totalAssets: number
  activeAssets: number
  totalCampaigns: number
  activeCampaigns: number
  totalStoreAssignments: number
  syncedStores: number
  totalTemplates: number
  publishedTemplates: number
}
