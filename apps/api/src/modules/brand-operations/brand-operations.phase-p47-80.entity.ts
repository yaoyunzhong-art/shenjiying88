/**
 * brand-operations.phase-p47-80.entity.ts
 * P-47 品牌运营 Phase 80% 新增实体
 *
 * 新增功能:
 * 1. 品牌活动定时发布/下架调度 (CampaignSchedule)
 * 2. 联名收入分成计算 (RevenueShareRecord)
 * 3. 品牌资产分类管理 (AssetCategory, AssetTag)
 * 4. 品牌数据看板 (BrandDashboardData)
 */

import { randomUUID } from 'node:crypto'

// ═══════════════════════════════════════════
// 1. 品牌活动定时发布/下架调度
// ═══════════════════════════════════════════

export type ScheduleAction = 'publish' | 'unpublish'
export type ScheduleStatus = 'pending' | 'executed' | 'failed' | 'cancelled'

export interface CampaignSchedule {
  id: string
  tenantId: string
  campaignId: string
  action: ScheduleAction
  scheduledAt: string
  status: ScheduleStatus
  executedAt?: string
  errorMessage?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ═══════════════════════════════════════════
// 2. 联名收入分成计算
// ═══════════════════════════════════════════

export type SettlementStatus = 'pending' | 'settled' | 'disputed'

export interface RevenueShareRecord {
  id: string
  tenantId: string
  collaborationId: string
  periodStart: string
  periodEnd: string
  totalRevenue: number        // 总收入（分）
  partnerShare: number        // 联名方分成（分）
  ourShare: number            // 我方分成（分）
  shareRate: number           // 实际分成比例
  settlementStatus: SettlementStatus
  settledAt?: string
  settledBy?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface RevenueShareSummary {
  totalRecords: number
  totalRevenue: number
  totalPartnerShare: number
  totalOurShare: number
  pendingCount: number
  settledCount: number
  disputedCount: number
}

// ═══════════════════════════════════════════
// 3. 品牌资产分类管理
// ═══════════════════════════════════════════

export interface AssetCategory {
  id: string
  tenantId: string
  name: string
  description?: string
  parentId?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface AssetTag {
  id: string
  tenantId: string
  name: string
  color?: string
  createdAt: string
}

export interface AssetCategoryTree {
  id: string
  name: string
  description?: string
  sortOrder: number
  children: AssetCategoryTree[]
}

// ═══════════════════════════════════════════
// 4. 品牌数据看板
// ═══════════════════════════════════════════

export interface AssetUsageStat {
  type: string
  totalCount: number
  activeCount: number
  usageCount: number // 被活动引用的次数
}

export interface CampaignEffectiveness {
  status: string
  count: number
  totalStores: number
  syncedStores: number
}

export interface BrandDashboardData {
  /** 资产概况 */
  totalAssets: number
  activeAssets: number
  assetUsageStats: AssetUsageStat[]
  /** 活动概况 */
  totalCampaigns: number
  activeCampaigns: number
  campaignEffectiveness: CampaignEffectiveness[]
  /** 联名合作概况 */
  totalCollaborations: number
  activeCollaborations: number
  monthRevenue: number
  monthPartnerShare: number
  /** 门店同步率 */
  storeSyncRate: number
  /** 模板使用情况 */
  totalTemplates: number
  publishedTemplates: number
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

export function createCampaignScheduleId(): string {
  return `cs-${randomUUID()}`
}

export function createRevenueShareRecordId(): string {
  return `rs-${randomUUID()}`
}

export function createAssetCategoryId(): string {
  return `acat-${randomUUID()}`
}

export function createAssetTagId(): string {
  return `atag-${randomUUID()}`
}
