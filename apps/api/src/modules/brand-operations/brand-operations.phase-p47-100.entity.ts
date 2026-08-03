/**
 * brand-operations.phase-p47-100.entity.ts
 * P-47 品牌运营 Phase 100% 新增实体
 *
 * 新增功能:
 * 1. 品牌活动数据导出 (ExportRecord)
 * 2. 联名合作合同管理 (CollaborationContract)
 * 3. 品牌活动A/B测试 (CampaignABTest, CampaignVariant)
 * 4. 品牌运营日历 (CalendarEvent)
 * 5. 品牌资产回收站 (RecycleBinItem)
 */

import { randomUUID } from 'node:crypto'

// ═══════════════════════════════════════════
// 1. 品牌活动数据导出
// ═══════════════════════════════════════════

export type ExportFormat = 'csv' | 'xlsx'
export type ExportScope = 'campaigns' | 'assets' | 'collaborations' | 'templates' | 'synced_stores'
export type ExportStatus = 'pending' | 'completed' | 'failed'

export interface ExportRecord {
  id: string
  tenantId: string
  format: ExportFormat
  scope: ExportScope
  filters?: Record<string, string>
  status: ExportStatus
  /** 导出文件路径（生成后填写） */
  filePath?: string
  /** 导出记录数 */
  recordCount?: number
  /** 错误信息 */
  errorMessage?: string
  requestedBy: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

// ═══════════════════════════════════════════
// 2. 联名合作合同管理
// ═══════════════════════════════════════════

export type ContractStatus = 'draft' | 'signed' | 'active' | 'expired' | 'terminated'

export interface CollaborationContract {
  id: string
  tenantId: string
  collaborationId: string
  /** 合同编号 */
  contractNumber: string
  /** 合同名称 */
  title: string
  /** 合同附件文件路径 */
  filePath?: string
  /** 合同签署日期 */
  signedAt?: string
  /** 合同生效日期 */
  effectiveDate: string
  /** 合同到期日期 */
  expiryDate: string
  /** 合同状态 */
  status: ContractStatus
  /** 合同金额（分） */
  amount: number
  /** 签署方 */
  parties: Array<{ name: string; role: string }>
  /** 合同条款摘要 */
  termsSummary?: string
  /** 自动续约 */
  autoRenew: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ═══════════════════════════════════════════
// 3. 品牌活动A/B测试
// ═══════════════════════════════════════════

export type ABTestStatus = 'draft' | 'running' | 'paused' | 'completed' | 'cancelled'

export interface CampaignABTest {
  id: string
  tenantId: string
  campaignId: string
  name: string
  description: string
  status: ABTestStatus
  /** A/B测试变量列表 */
  variants: CampaignVariant[]
  /** 获胜变量ID（测试结束后选择） */
  winnerVariantId?: string
  /** 测试开始时间 */
  startedAt?: string
  /** 测试结束时间 */
  endedAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CampaignVariant {
  id: string
  abTestId: string
  name: string
  description: string
  /** 变体标题（覆盖Campaign title） */
  variantTitle?: string
  /** 变体描述（覆盖Campaign description） */
  variantDescription?: string
  /** 变体素材列表 */
  variantAssets?: string[]
  /** 变体封面图 */
  variantCoverImageUrl?: string
  /** 展示门店列表 */
  storeIds: string[]
  /** 曝光量 */
  impressions: number
  /** 点击量 */
  clicks: number
  /** 转化量（门店同步/核销数） */
  conversions: number
  /** CTR = clicks / impressions */
  ctr: number
  /** 转化率 = conversions / impressions */
  conversionRate: number
  createdAt: string
}

// ═══════════════════════════════════════════
// 4. 品牌运营日历
// ═══════════════════════════════════════════

export type CalendarEventType = 'campaign_start' | 'campaign_end' | 'collaboration_start' | 'collaboration_end'

export interface CalendarEvent {
  date: string
  type: CalendarEventType
  /** 关联的活动/合作ID */
  refId: string
  title: string
  description?: string
}

export interface CalendarTimeline {
  /** 时间段内事件列表 */
  events: CalendarEvent[]
  /** 按日统计 */
  dailyCounts: Array<{ date: string; count: number }>
  /** 按周统计 */
  weeklyCounts: Array<{ week: string; count: number }>
  /** 按月统计 */
  monthlyCounts: Array<{ month: string; count: number }>
}

// ═══════════════════════════════════════════
// 5. 品牌资产回收站
// ═══════════════════════════════════════════

export type RecycleBinEntityType = 'asset' | 'campaign' | 'template' | 'collaboration'

export interface RecycleBinItem {
  id: string
  tenantId: string
  entityType: RecycleBinEntityType
  entityId: string
  /** 删除前实体描述（用于恢复提示） */
  entitySummary: string
  /** 原始实体JSON（用于完整恢复） */
  originalData: string
  deletedBy: string
  deletedAt: string
  /** 过期时间（自动清理） */
  expiresAt: string
  restoredAt?: string
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

export function createExportRecordId(): string {
  return `export-${randomUUID()}`
}

export function createCollaborationContractId(): string {
  return `ccont-${randomUUID()}`
}

export function createABTestId(): string {
  return `abtest-${randomUUID()}`
}

export function createCampaignVariantId(): string {
  return `variant-${randomUUID()}`
}

export function createRecycleBinItemId(): string {
  return `rb-${randomUUID()}`
}

// ── P-47 新增: BrandChannel ID ────────────────────────────────────────

export function createBrandChannelId(): string {
  return `chan-${randomUUID()}`
}

export function createBrandKPIId(): string {
  return `kpi-${randomUUID()}`
}
