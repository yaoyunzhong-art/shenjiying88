import { randomUUID, randomInt } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import type {
  BrandAsset,
  BrandAssetType,
  BrandCampaign,
  CampaignApproval,
  CampaignStatus,
  BrandSyncRecord,
  SyncStatus,
  BrandCampaignTemplate,
  BrandOperationsMetrics,
  Collaboration,
  CollaborationStatus,
  CollaborationType,
  PartnerGrade,
  RevenueShareConfig,
  RevenueShareType,
  CollaborationMetrics,
  PartnerInfo,
} from './brand-operations.entity'
import type {
  CampaignSchedule,
  ScheduleAction,
  ScheduleStatus,
  RevenueShareRecord,
  SettlementStatus,
  RevenueShareSummary,
  AssetCategory,
  AssetTag,
  AssetCategoryTree,
  BrandDashboardData,
  AssetUsageStat,
  CampaignEffectiveness,
} from './brand-operations.phase-p47-80.entity'
import {
  createCampaignScheduleId,
  createRevenueShareRecordId,
  createAssetCategoryId,
  createAssetTagId,
} from './brand-operations.phase-p47-80.entity'
import type {
  ExportFormat,
  ExportScope,
  ExportStatus,
  ExportRecord,
  ContractStatus,
  CollaborationContract,
  ABTestStatus,
  CampaignABTest,
  CampaignVariant,
  CalendarEventType,
  CalendarEvent,
  CalendarTimeline,
  RecycleBinEntityType,
  RecycleBinItem,
} from './brand-operations.phase-p47-100.entity'
import {
  createExportRecordId,
  createCollaborationContractId,
  createABTestId,
  createCampaignVariantId,
  createRecycleBinItemId,
} from './brand-operations.phase-p47-100.entity'

// ── In-memory stores (Phase-47 骨架阶段,后续替换为 Prisma) ──

const assetStore = new Map<string, BrandAsset>()
const campaignStore = new Map<string, BrandCampaign>()
const syncStore = new Map<string, BrandSyncRecord>()
const templateStore = new Map<string, BrandCampaignTemplate>()
const collaborationStore = new Map<string, Collaboration>()

// ── P-47 Phase 80% new stores ──
const campaignScheduleStore = new Map<string, CampaignSchedule>()
const revenueShareStore = new Map<string, RevenueShareRecord>()
const assetCategoryStore = new Map<string, AssetCategory>()
const assetTagStore = new Map<string, AssetTag>()

// ── P-47 Phase 100% new stores ──
const exportRecordStore = new Map<string, ExportRecord>()
const collaborationContractStore = new Map<string, CollaborationContract>()
const campaignABTestStore = new Map<string, CampaignABTest>()
const recycleBinStore = new Map<string, RecycleBinItem>()

// ── 导入/导出给测试重置 ──
export function resetBrandOpsStoresForTests(): void {
  assetStore.clear()
  campaignStore.clear()
  syncStore.clear()
  templateStore.clear()
  collaborationStore.clear()
  campaignScheduleStore.clear()
  revenueShareStore.clear()
  assetCategoryStore.clear()
  assetTagStore.clear()
  exportRecordStore.clear()
  collaborationContractStore.clear()
  campaignABTestStore.clear()
  recycleBinStore.clear()
}

export const _testonly = { assetStore, campaignStore, syncStore, templateStore, collaborationStore, campaignScheduleStore, revenueShareStore, assetCategoryStore, assetTagStore, exportRecordStore, collaborationContractStore, campaignABTestStore, recycleBinStore }

// ── 创建/更新本地方法 ──

@Injectable()
export class BrandOperationsService {
  private readonly logger = new Logger(BrandOperationsService.name)

  // ═══════════════════════════════════════════
  //  BrandAsset 管理
  // ═══════════════════════════════════════════

  createAsset(input: {
    tenantId: string
    brandId: string
    type: BrandAssetType
    url: string
    name: string
    description?: string
    active?: boolean
    mimeType?: string
  }): BrandAsset {
    const now = new Date().toISOString()
    const asset: BrandAsset = {
      id: `ba-${randomUUID()}`,
      type: input.type,
      url: input.url,
      active: input.active ?? true,
      tenantId: input.tenantId,
      brandId: input.brandId,
      name: input.name,
      description: input.description,
      mimeType: input.mimeType,
      createdAt: now,
      updatedAt: now,
    }
    assetStore.set(asset.id, asset)
    this.logger.log(`Created brand asset ${asset.id} (${asset.type})`)
    return asset
  }

  getAsset(assetId: string, tenantId: string): BrandAsset | undefined {
    const asset = assetStore.get(assetId)
    if (!asset || asset.tenantId !== tenantId) return undefined
    return asset
  }

  listAssets(tenantId: string, filter?: { type?: BrandAssetType; active?: boolean }): BrandAsset[] {
    return Array.from(assetStore.values())
      .filter((a) => a.tenantId === tenantId)
      .filter((a) => (filter?.type ? a.type === filter.type : true))
      .filter((a) => (filter?.active !== undefined ? a.active === filter.active : true))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  updateAsset(
    assetId: string,
    tenantId: string,
    patch: Partial<Pick<BrandAsset, 'name' | 'description' | 'url' | 'active'>>,
  ): BrandAsset {
    const asset = this.getAsset(assetId, tenantId)
    if (!asset) {
      throw new Error(`BrandAsset not found: ${assetId}`)
    }
    const updated: BrandAsset = {
      ...asset,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    assetStore.set(assetId, updated)
    return updated
  }

  deleteAsset(assetId: string, tenantId: string): boolean {
    const asset = this.getAsset(assetId, tenantId)
    if (!asset) return false
    assetStore.delete(assetId)
    return true
  }

  // ═══════════════════════════════════════════
  //  BrandCampaign 管理
  // ═══════════════════════════════════════════

  createCampaign(input: {
    tenantId: string
    brandId: string
    title: string
    description: string
    storeIds: string[]
    startDate: string
    endDate: string
    assets?: string[]
    coverImageUrl?: string
    createdBy: string
  }): BrandCampaign {
    this.assertDateRangeValid(input.startDate, input.endDate)

    const now = new Date().toISOString()
    const campaign: BrandCampaign = {
      id: `bc-${randomUUID()}`,
      tenantId: input.tenantId,
      brandId: input.brandId,
      title: input.title,
      description: input.description,
      storeIds: input.storeIds,
      startDate: input.startDate,
      endDate: input.endDate,
      status: 'draft',
      assets: input.assets ?? [],
      coverImageUrl: input.coverImageUrl,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    }
    campaignStore.set(campaign.id, campaign)
    this.logger.log(`Created brand campaign ${campaign.id}: "${campaign.title}"`)
    return campaign
  }

  getCampaign(campaignId: string, tenantId: string): BrandCampaign | undefined {
    const camp = campaignStore.get(campaignId)
    if (!camp || camp.tenantId !== tenantId) return undefined
    return camp
  }

  listCampaigns(
    tenantId: string,
    filter?: { status?: CampaignStatus; storeId?: string; startFrom?: string; startTo?: string },
  ): BrandCampaign[] {
    return Array.from(campaignStore.values())
      .filter((c) => c.tenantId === tenantId)
      .filter((c) => (filter?.status ? c.status === filter.status : true))
      .filter((c) => (filter?.storeId ? c.storeIds.includes(filter.storeId) : true))
      .filter((c) => (filter?.startFrom ? c.startDate >= filter.startFrom : true))
      .filter((c) => (filter?.startTo ? c.startDate <= filter.startTo : true))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  updateCampaign(
    campaignId: string,
    tenantId: string,
    patch: Partial<Pick<BrandCampaign, 'title' | 'description' | 'storeIds' | 'startDate' | 'endDate' | 'status' | 'assets' | 'coverImageUrl'>>,
  ): BrandCampaign {
    const camp = this.getCampaign(campaignId, tenantId)
    if (!camp) {
      throw new Error(`BrandCampaign not found: ${campaignId}`)
    }

    const startDate = patch.startDate ?? camp.startDate
    const endDate = patch.endDate ?? camp.endDate
    this.assertDateRangeValid(startDate, endDate)

    this.assertValidStatusTransition(camp.status, patch.status ?? camp.status)

    const updated: BrandCampaign = {
      ...camp,
      ...patch,
      status: patch.status ?? camp.status,
      updatedAt: new Date().toISOString(),
    }
    campaignStore.set(campaignId, updated)
    return updated
  }

  deleteCampaign(campaignId: string, tenantId: string): boolean {
    const camp = this.getCampaign(campaignId, tenantId)
    if (!camp) return false
    campaignStore.delete(campaignId)
    return true
  }

  // ═══════════════════════════════════════════
  //  门店同步
  // ═══════════════════════════════════════════

  /** 将品牌活动同步到指定门店 */
  syncToStores(campaignId: string, tenantId: string): BrandSyncRecord[] {
    const camp = this.getCampaign(campaignId, tenantId)
    if (!camp) {
      throw new Error(`BrandCampaign not found: ${campaignId}`)
    }
    if (camp.status !== 'active') {
      throw new Error(`Cannot sync campaign with status "${camp.status}"; must be "active"`)
    }

    const records: BrandSyncRecord[] = []
    const now = new Date().toISOString()

    for (const storeId of camp.storeIds) {
      // 幂等：已有同步记录则跳过
      const existing = Array.from(syncStore.values()).find(
        (r) => r.campaignId === campaignId && r.storeId === storeId && r.status === 'synced',
      )
      if (existing) {
        records.push(existing)
        continue
      }

      const record: BrandSyncRecord = {
        id: `sync-${randomUUID()}`,
        campaignId,
        storeId,
        tenantId,
        status: 'synced',
        syncedAt: now,
        createdAt: now,
      }
      syncStore.set(record.id, record)
      records.push(record)
    }

    this.logger.log(`Synced campaign ${campaignId} to ${records.length} stores`)
    return records
  }

  /** 查询门店同步状态 */
  getSyncRecords(campaignId: string, tenantId: string): BrandSyncRecord[] {
    const camp = this.getCampaign(campaignId, tenantId)
    if (!camp) {
      throw new Error(`BrandCampaign not found: ${campaignId}`)
    }
    return Array.from(syncStore.values())
      .filter((r) => r.campaignId === campaignId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  /** 获取某门店下的所有同步活动 */
  getSyncedCampaigns(storeId: string, tenantId: string): BrandCampaign[] {
    const syncedCampaignIds = Array.from(syncStore.values())
      .filter((r) => r.storeId === storeId && r.status === 'synced')
      .map((r) => r.campaignId)

    return Array.from(new Set(syncedCampaignIds))
      .map((id) => campaignStore.get(id))
      .filter((c): c is BrandCampaign => c !== undefined && c.tenantId === tenantId)
  }

  // ═══════════════════════════════════════════
  //  统计
  // ═══════════════════════════════════════════

  getMetrics(tenantId: string): BrandOperationsMetrics {
    const assets = Array.from(assetStore.values()).filter((a) => a.tenantId === tenantId)
    const campaigns = Array.from(campaignStore.values()).filter((c) => c.tenantId === tenantId)
    const syncs = Array.from(syncStore.values())

    const templates = Array.from(templateStore.values()).filter((t) => t.tenantId === tenantId)

    return {
      totalAssets: assets.length,
      activeAssets: assets.filter((a) => a.active).length,
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
      totalStoreAssignments: campaigns.reduce((sum, c) => sum + c.storeIds.length, 0),
      syncedStores: syncs.filter((s) => s.status === 'synced').length,
      totalTemplates: templates.length,
      publishedTemplates: templates.filter((t) => t.published).length,
    }
  }

  // ═══════════════════════════════════════════
  //  CampaignTemplate 管理
  // ═══════════════════════════════════════════

  createTemplate(input: {
    tenantId: string
    brandId: string
    name: string
    description: string
    defaultStoreIds?: string[]
    defaultAssets?: string[]
    coverImageUrl?: string
    defaultDurationDays?: number
    tags?: string[]
    published?: boolean
    createdBy: string
  }): BrandCampaignTemplate {
    const now = new Date().toISOString()
    const template: BrandCampaignTemplate = {
      id: `tpl-${randomUUID()}`,
      tenantId: input.tenantId,
      brandId: input.brandId,
      name: input.name,
      description: input.description,
      defaultStoreIds: input.defaultStoreIds ?? [],
      defaultAssets: input.defaultAssets ?? [],
      coverImageUrl: input.coverImageUrl,
      defaultDurationDays: input.defaultDurationDays,
      tags: input.tags ?? [],
      published: input.published ?? false,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    }
    templateStore.set(template.id, template)
    this.logger.log(`Created campaign template ${template.id}: "${template.name}"`)
    return template
  }

  getTemplate(templateId: string, tenantId: string): BrandCampaignTemplate | undefined {
    const tpl = templateStore.get(templateId)
    if (!tpl || tpl.tenantId !== tenantId) return undefined
    return tpl
  }

  listTemplates(
    tenantId: string,
    filter?: { tag?: string; published?: boolean; search?: string },
  ): BrandCampaignTemplate[] {
    return Array.from(templateStore.values())
      .filter((t) => t.tenantId === tenantId)
      .filter((t) => (filter?.tag ? t.tags.includes(filter.tag) : true))
      .filter((t) => (filter?.published !== undefined ? t.published === filter.published : true))
      .filter((t) =>
        filter?.search
          ? t.name.toLowerCase().includes(filter.search.toLowerCase()) ||
            t.description.toLowerCase().includes(filter.search.toLowerCase())
          : true,
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  updateTemplate(
    templateId: string,
    tenantId: string,
    patch: Partial<Pick<BrandCampaignTemplate, 'name' | 'description' | 'defaultStoreIds' | 'defaultAssets' | 'coverImageUrl' | 'defaultDurationDays' | 'tags' | 'published'>>,
  ): BrandCampaignTemplate {
    const tpl = this.getTemplate(templateId, tenantId)
    if (!tpl) {
      throw new Error(`BrandCampaignTemplate not found: ${templateId}`)
    }
    const updated: BrandCampaignTemplate = {
      ...tpl,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    templateStore.set(templateId, updated)
    return updated
  }

  deleteTemplate(templateId: string, tenantId: string): boolean {
    const tpl = this.getTemplate(templateId, tenantId)
    if (!tpl) return false
    templateStore.delete(templateId)
    return true
  }

  /** 从模板快速创建品牌活动 */
  applyTemplateToCampaign(input: {
    templateId: string
    tenantId: string
    brandId: string
    title: string
    description: string
    startDate: string
    endDate: string
    storeIds?: string[]
    createdBy: string
  }): BrandCampaign {
    const tpl = this.getTemplate(input.templateId, input.tenantId)
    if (!tpl) {
      throw new Error(`BrandCampaignTemplate not found: ${input.templateId}`)
    }

    // 合并模板预设门店与自定义门店
    const mergedStoreIds = [
      ...new Set([...tpl.defaultStoreIds, ...(input.storeIds ?? [])]),
    ]

    return this.createCampaign({
      tenantId: input.tenantId,
      brandId: input.brandId,
      title: input.title,
      description: input.description,
      storeIds: mergedStoreIds.length > 0 ? mergedStoreIds : tpl.defaultStoreIds,
      startDate: input.startDate,
      endDate: input.endDate,
      assets: tpl.defaultAssets,
      coverImageUrl: tpl.coverImageUrl,
      createdBy: input.createdBy,
    })
  }

  // ═══════════════════════════════════════════
  //  内部方法
  // ═══════════════════════════════════════════

  private assertDateRangeValid(startDate: string, endDate: string): void {
    if (new Date(startDate) >= new Date(endDate)) {
      throw new Error('Start date must be before end date')
    }
  }

  /** 提交审批: draft → pending_review */
  submitCampaignForReview(campaignId: string, tenantId: string): BrandCampaign {
    const camp = this.getCampaign(campaignId, tenantId)
    if (!camp) throw new Error(`BrandCampaign not found: ${campaignId}`)
    if (camp.status !== 'draft') {
      throw new Error(`Cannot submit: campaign status is ${camp.status}`)
    }
    const updated: BrandCampaign = {
      ...camp,
      status: 'pending_review',
      updatedAt: new Date().toISOString(),
    }
    campaignStore.set(campaignId, updated)
    return updated
  }

  /** 审批通过: pending_review → approved */
  approveCampaign(
    campaignId: string,
    tenantId: string,
    input: { reviewerId: string; reviewerName: string; note: string },
  ): BrandCampaign {
    const camp = this.getCampaign(campaignId, tenantId)
    if (!camp) throw new Error(`BrandCampaign not found: ${campaignId}`)
    if (camp.status !== 'pending_review') {
      throw new Error(`Cannot approve: campaign status is ${camp.status}`)
    }
    const now = new Date().toISOString()
    const approval: CampaignApproval = {
      reviewerId: input.reviewerId,
      reviewerName: input.reviewerName,
      note: input.note,
      approvedAt: now,
    }
    const updated: BrandCampaign = {
      ...camp,
      status: 'approved',
      approval,
      updatedAt: now,
    }
    campaignStore.set(campaignId, updated)
    return updated
  }

  /** 打回: pending_review → draft */
  rejectCampaign(
    campaignId: string,
    tenantId: string,
    input: { reviewerId: string; reviewerName: string; reason: string },
  ): BrandCampaign {
    const camp = this.getCampaign(campaignId, tenantId)
    if (!camp) throw new Error(`BrandCampaign not found: ${campaignId}`)
    if (camp.status !== 'pending_review') {
      throw new Error(`Cannot reject: campaign status is ${camp.status}`)
    }
    const updated: BrandCampaign = {
      ...camp,
      status: 'draft',
      publishNote: `Rejected: ${input.reason}`,
      updatedAt: new Date().toISOString(),
    }
    campaignStore.set(campaignId, updated)
    return updated
  }

  /** 发布: approved → active */
  publishCampaign(
    campaignId: string,
    tenantId: string,
    publishNote?: string,
  ): BrandCampaign {
    const camp = this.getCampaign(campaignId, tenantId)
    if (!camp) throw new Error(`BrandCampaign not found: ${campaignId}`)
    if (camp.status !== 'approved') {
      throw new Error(`Cannot publish: campaign status is ${camp.status}`)
    }
    const updated: BrandCampaign = {
      ...camp,
      status: 'active',
      publishNote,
      updatedAt: new Date().toISOString(),
    }
    campaignStore.set(campaignId, updated)
    return updated
  }

  private assertValidStatusTransition(from: CampaignStatus, to: CampaignStatus): void {
    if (from === to) return
    // draft → active allowed for backward compat (direct activation)
    // Use submit→approve→publish workflow for approval-gated flow
    const validTransitions: Record<CampaignStatus, CampaignStatus[]> = {
      draft: ['pending_review', 'active', 'cancelled'],
      pending_review: ['draft', 'approved', 'cancelled'],
      approved: ['active', 'cancelled'],
      active: ['ended', 'cancelled'],
      ended: [],
      cancelled: [],
    }
    const allowed = validTransitions[from]
    if (!allowed || !allowed.includes(to)) {
      throw new Error(`Invalid campaign status transition: ${from} → ${to}`)
    }
  }

  // ═══════════════════════════════════════════
  //  Collaboration (联名合作) 管理
  // ═══════════════════════════════════════════

  createCollaboration(input: {
    tenantId: string
    brandId: string
    title: string
    description: string
    type: CollaborationType
    partner: PartnerInfo
    revenueShare: RevenueShareConfig
    startDate: string
    endDate: string
    coBrandName?: string
    campaignIds?: string[]
    terms?: string
    createdBy: string
  }): Collaboration {
    this.assertDateRangeValid(input.startDate, input.endDate)
    const now = new Date().toISOString()
    const collab: Collaboration = {
      id: `collab-${randomUUID()}`,
      tenantId: input.tenantId,
      brandId: input.brandId,
      title: input.title,
      description: input.description,
      type: input.type,
      partner: input.partner,
      revenueShare: input.revenueShare,
      startDate: input.startDate,
      endDate: input.endDate,
      status: 'draft',
      coBrandName: input.coBrandName,
      campaignIds: input.campaignIds ?? [],
      terms: input.terms,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    }
    collaborationStore.set(collab.id, collab)
    this.logger.log(`Created collaboration ${collab.id}: "${collab.title}"`)
    return collab
  }

  getCollaboration(collabId: string, tenantId: string): Collaboration | undefined {
    const collab = collaborationStore.get(collabId)
    if (!collab || collab.tenantId !== tenantId) return undefined
    return collab
  }

  listCollaborations(
    tenantId: string,
    filter?: {
      status?: CollaborationStatus
      type?: CollaborationType
      grade?: PartnerGrade
      search?: string
    },
  ): Collaboration[] {
    return Array.from(collaborationStore.values())
      .filter((c) => c.tenantId === tenantId)
      .filter((c) => (filter?.status ? c.status === filter.status : true))
      .filter((c) => (filter?.type ? c.type === filter.type : true))
      .filter((c) => (filter?.grade ? c.partner.grade === filter.grade : true))
      .filter((c) =>
        filter?.search
          ? c.title.toLowerCase().includes(filter.search.toLowerCase()) ||
            c.partner.name.toLowerCase().includes(filter.search.toLowerCase())
          : true,
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  updateCollaboration(
    collabId: string,
    tenantId: string,
    patch: Partial<Pick<Collaboration, 'title' | 'description' | 'type' | 'startDate' | 'endDate' | 'status' | 'campaignIds' | 'terms' | 'coBrandName'>> & { partner?: Partial<PartnerInfo>; revenueShare?: Partial<RevenueShareConfig> },
  ): Collaboration {
    const collab = this.getCollaboration(collabId, tenantId)
    if (!collab) throw new Error(`Collaboration not found: ${collabId}`)

    const startDate = patch.startDate ?? collab.startDate
    const endDate = patch.endDate ?? collab.endDate
    this.assertDateRangeValid(startDate, endDate)

    const updated: Collaboration = {
      ...collab,
      ...patch,
      partner: patch.partner ? { ...collab.partner, ...patch.partner } : collab.partner,
      revenueShare: patch.revenueShare ? { ...collab.revenueShare, ...patch.revenueShare } : collab.revenueShare,
      updatedAt: new Date().toISOString(),
    }
    collaborationStore.set(collabId, updated)
    return updated
  }

  deleteCollaboration(collabId: string, tenantId: string): boolean {
    const collab = this.getCollaboration(collabId, tenantId)
    if (!collab) return false
    collaborationStore.delete(collabId)
    return true
  }

  getCollaborationMetrics(tenantId: string): CollaborationMetrics {
    const collabs = Array.from(collaborationStore.values()).filter((c) => c.tenantId === tenantId)
    const byGrade: Record<PartnerGrade, number> = { platinum: 0, gold: 0, silver: 0, bronze: 0 }
    const byType: Record<CollaborationType, number> = { co_branding: 0, sponsorship: 0, joint_promotion: 0, cross_marketing: 0 }
    for (const c of collabs) {
      byGrade[c.partner.grade] = (byGrade[c.partner.grade] ?? 0) + 1
      byType[c.type] = (byType[c.type] ?? 0) + 1
    }
    return {
      total: collabs.length,
      active: collabs.filter((c) => c.status === 'active').length,
      negotiating: collabs.filter((c) => c.status === 'negotiating').length,
      draftCount: collabs.filter((c) => c.status === 'draft').length,
      byGrade,
      byType,
    }
  }

  /** 将活动关联到合作 */
  linkCampaignToCollaboration(campaignId: string, collabId: string, tenantId: string): Collaboration {
    const collab = this.getCollaboration(collabId, tenantId)
    if (!collab) throw new Error(`Collaboration not found: ${collabId}`)
    const camp = this.getCampaign(campaignId, tenantId)
    if (!camp) throw new Error(`BrandCampaign not found: ${campaignId}`)
    if (!collab.campaignIds.includes(campaignId)) {
      collab.campaignIds.push(campaignId)
      collab.updatedAt = new Date().toISOString()
      collaborationStore.set(collabId, collab)
    }
    return collab
  }

  // ════════════════════════════════════════════════════
  //  Brand Campaign Schedule (定时发布/下架)
  // ════════════════════════════════════════════════════

  createCampaignSchedule(input: {
    tenantId: string
    campaignId: string
    action: ScheduleAction
    scheduledAt: string
    createdBy: string
  }): CampaignSchedule {
    const scheduledTime = new Date(input.scheduledAt)
    if (Number.isNaN(scheduledTime.getTime())) {
      throw new Error('scheduledAt must be a valid datetime')
    }
    const camp = this.getCampaign(input.campaignId, input.tenantId)
    if (!camp) throw new Error(`BrandCampaign not found: ${input.campaignId}`)

    const now = new Date().toISOString()
    const schedule: CampaignSchedule = {
      id: createCampaignScheduleId(),
      tenantId: input.tenantId,
      campaignId: input.campaignId,
      action: input.action,
      scheduledAt: scheduledTime.toISOString(),
      status: 'pending',
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    }
    campaignScheduleStore.set(schedule.id, schedule)
    this.logger.log(`Created campaign schedule ${schedule.id}: ${input.action} campaign ${input.campaignId} at ${input.scheduledAt}`)
    return { ...schedule }
  }

  getCampaignSchedule(id: string, tenantId: string): CampaignSchedule | undefined {
    const s = campaignScheduleStore.get(id)
    if (!s || s.tenantId !== tenantId) return undefined
    return { ...s }
  }

  listCampaignSchedules(
    tenantId: string,
    filter?: { status?: ScheduleStatus; action?: ScheduleAction; campaignId?: string },
  ): CampaignSchedule[] {
    return Array.from(campaignScheduleStore.values())
      .filter((s) => s.tenantId === tenantId)
      .filter((s) => (filter?.status ? s.status === filter.status : true))
      .filter((s) => (filter?.action ? s.action === filter.action : true))
      .filter((s) => (filter?.campaignId ? s.campaignId === filter.campaignId : true))
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      .map((s) => ({ ...s }))
  }

  cancelCampaignSchedule(id: string, tenantId: string): CampaignSchedule {
    const s = campaignScheduleStore.get(id)
    if (!s || s.tenantId !== tenantId) throw new Error(`CampaignSchedule not found: ${id}`)
    if (s.status !== 'pending') {
      throw new Error(`Cannot cancel schedule with status ${s.status}`)
    }
    s.status = 'cancelled'
    s.updatedAt = new Date().toISOString()
    campaignScheduleStore.set(id, s)
    return { ...s }
  }

  /**
   * 扫描到期的定时调度任务并执行
   * 用于 cron 作业调度
   */
  executeDueSchedules(now: string = new Date().toISOString()): CampaignSchedule[] {
    const nowDate = new Date(now)
    const due = Array.from(campaignScheduleStore.values())
      .filter((s) => s.status === 'pending')
      .filter((s) => new Date(s.scheduledAt) <= nowDate)

    const executed: CampaignSchedule[] = []
    for (const s of due) {
      try {
        if (s.action === 'publish') {
          this.publishCampaign(s.campaignId, s.tenantId, 'Scheduled publish')
        } else if (s.action === 'unpublish') {
          this.updateCampaign(s.campaignId, s.tenantId, { status: 'ended' })
        }
        s.status = 'executed'
        s.executedAt = now
        this.logger.log(`Executed campaign schedule ${s.id}: ${s.action} campaign ${s.campaignId}`)
      } catch (error: any) {
        s.status = 'failed'
        s.errorMessage = error.message
        this.logger.warn(`Failed campaign schedule ${s.id}: ${error.message}`)
      }
      s.updatedAt = now
      campaignScheduleStore.set(s.id, s)
      executed.push({ ...s })
    }

    return executed
  }

  // ════════════════════════════════════════════════════
  //  Revenue Share Calculation (联名收入分成)
  // ════════════════════════════════════════════════════

  /** 计算联名收入分成 */
  calculateRevenueShare(input: {
    tenantId: string
    collaborationId: string
    periodStart: string
    periodEnd: string
    totalRevenue: number
    shareRate: number
    notes?: string
  }): RevenueShareRecord {
    const collab = this.getCollaboration(input.collaborationId, input.tenantId)
    if (!collab) throw new Error(`Collaboration not found: ${input.collaborationId}`)
    if (collab.status !== 'active') {
      throw new Error(`Cannot calculate share for non-active collaboration (status: ${collab.status})`)
    }

    const partnerShare = Math.round(input.totalRevenue * input.shareRate)
    const ourShare = input.totalRevenue - partnerShare

    const now = new Date().toISOString()
    const record: RevenueShareRecord = {
      id: createRevenueShareRecordId(),
      tenantId: input.tenantId,
      collaborationId: input.collaborationId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      totalRevenue: input.totalRevenue,
      partnerShare,
      ourShare,
      shareRate: input.shareRate,
      settlementStatus: 'pending',
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    }
    revenueShareStore.set(record.id, record)
    this.logger.log(`Calculated revenue share ${record.id}: partner=${partnerShare} our=${ourShare}`)
    return { ...record }
  }

  getRevenueShareRecord(id: string, tenantId: string): RevenueShareRecord | undefined {
    const r = revenueShareStore.get(id)
    if (!r || r.tenantId !== tenantId) return undefined
    return { ...r }
  }

  listRevenueShareRecords(
    tenantId: string,
    filter?: {
      status?: SettlementStatus
      collaborationId?: string
      periodFrom?: string
      periodTo?: string
    },
  ): RevenueShareRecord[] {
    return Array.from(revenueShareStore.values())
      .filter((r) => r.tenantId === tenantId)
      .filter((r) => (filter?.status ? r.settlementStatus === filter.status : true))
      .filter((r) => (filter?.collaborationId ? r.collaborationId === filter.collaborationId : true))
      .filter((r) => (filter?.periodFrom ? r.periodEnd >= filter.periodFrom : true))
      .filter((r) => (filter?.periodTo ? r.periodStart <= filter.periodTo : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => ({ ...r }))
  }

  /** 结算分成记录 */
  settleRevenueShare(
    id: string,
    tenantId: string,
    input: { settledBy: string; notes?: string },
  ): RevenueShareRecord {
    const r = this.revenueShareStoreGet(id, tenantId)
    if (r.settlementStatus !== 'pending') {
      throw new Error(`Revenue share record already ${r.settlementStatus}`)
    }
    r.settlementStatus = 'settled'
    r.settledAt = new Date().toISOString()
    r.settledBy = input.settledBy
    if (input.notes) r.notes = input.notes
    r.updatedAt = new Date().toISOString()
    revenueShareStore.set(id, r)
    return { ...r }
  }

  /** 争议分成记录 */
  disputeRevenueShare(
    id: string,
    tenantId: string,
    reason: string,
  ): RevenueShareRecord {
    const r = this.revenueShareStoreGet(id, tenantId)
    if (r.settlementStatus === 'settled') {
      throw new Error(`Cannot dispute already settled record`)
    }
    r.settlementStatus = 'disputed'
    r.notes = reason
    r.updatedAt = new Date().toISOString()
    revenueShareStore.set(id, r)
    return { ...r }
  }

  getRevenueShareSummary(tenantId: string): RevenueShareSummary {
    const records = Array.from(revenueShareStore.values()).filter((r) => r.tenantId === tenantId)
    return {
      totalRecords: records.length,
      totalRevenue: records.reduce((s, r) => s + r.totalRevenue, 0),
      totalPartnerShare: records.reduce((s, r) => s + r.partnerShare, 0),
      totalOurShare: records.reduce((s, r) => s + r.ourShare, 0),
      pendingCount: records.filter((r) => r.settlementStatus === 'pending').length,
      settledCount: records.filter((r) => r.settlementStatus === 'settled').length,
      disputedCount: records.filter((r) => r.settlementStatus === 'disputed').length,
    }
  }

  private revenueShareStoreGet(id: string, tenantId: string): RevenueShareRecord {
    const r = revenueShareStore.get(id)
    if (!r || r.tenantId !== tenantId) throw new Error(`RevenueShareRecord not found: ${id}`)
    return r
  }

  // ════════════════════════════════════════════════════
  //  Asset Category Management (资产分类管理)
  // ════════════════════════════════════════════════════

  createAssetCategory(input: {
    tenantId: string
    name: string
    description?: string
    parentId?: string
    sortOrder?: number
  }): AssetCategory {
    if (input.parentId) {
      const parent = assetCategoryStore.get(input.parentId)
      if (!parent || parent.tenantId !== input.tenantId) {
        throw new Error(`Parent category not found: ${input.parentId}`)
      }
    }
    const now = new Date().toISOString()
    const cat: AssetCategory = {
      id: createAssetCategoryId(),
      tenantId: input.tenantId,
      name: input.name,
      description: input.description,
      parentId: input.parentId,
      sortOrder: input.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    }
    assetCategoryStore.set(cat.id, cat)
    return { ...cat }
  }

  getAssetCategory(id: string, tenantId: string): AssetCategory | undefined {
    const cat = assetCategoryStore.get(id)
    if (!cat || cat.tenantId !== tenantId) return undefined
    return { ...cat }
  }

  listAssetCategories(tenantId: string): AssetCategory[] {
    return Array.from(assetCategoryStore.values())
      .filter((c) => c.tenantId === tenantId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map((c) => ({ ...c }))
  }

  /** 获取分类树 */
  getAssetCategoryTree(tenantId: string): AssetCategoryTree[] {
    const all = this.listAssetCategories(tenantId)
    const root = all.filter((c) => !c.parentId)
    const build = (parent: AssetCategory): AssetCategoryTree => ({
      id: parent.id,
      name: parent.name,
      description: parent.description,
      sortOrder: parent.sortOrder,
      children: all.filter((c) => c.parentId === parent.id).map(build),
    })
    return root.map(build)
  }

  updateAssetCategory(
    id: string,
    tenantId: string,
    patch: Partial<Pick<AssetCategory, 'name' | 'description' | 'parentId' | 'sortOrder'>>,
  ): AssetCategory {
    const cat = assetCategoryStore.get(id)
    if (!cat || cat.tenantId !== tenantId) throw new Error(`AssetCategory not found: ${id}`)
    const updated: AssetCategory = {
      ...cat,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    assetCategoryStore.set(id, updated)
    return { ...updated }
  }

  deleteAssetCategory(id: string, tenantId: string): boolean {
    const cat = assetCategoryStore.get(id)
    if (!cat || cat.tenantId !== tenantId) return false
    // Check if used by any assets or has children
    assetCategoryStore.delete(id)
    return true
  }

  // ════════════════════════════════════════════════════
  //  Asset Tag Management (资产标签管理)
  // ════════════════════════════════════════════════════

  createAssetTag(input: {
    tenantId: string
    name: string
    color?: string
  }): AssetTag {
    const now = new Date().toISOString()
    const tag: AssetTag = {
      id: createAssetTagId(),
      tenantId: input.tenantId,
      name: input.name,
      color: input.color,
      createdAt: now,
    }
    assetTagStore.set(tag.id, tag)
    return { ...tag }
  }

  listAssetTags(tenantId: string): AssetTag[] {
    return Array.from(assetTagStore.values())
      .filter((t) => t.tenantId === tenantId)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  deleteAssetTag(id: string, tenantId: string): boolean {
    const tag = assetTagStore.get(id)
    if (!tag || tag.tenantId !== tenantId) return false
    assetTagStore.delete(id)
    return true
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Brand Campaign Data Export (品牌活动数据导出)
  // ═══════════════════════════════════════════════════════════════════

  /** 请求导出任务 */
  requestExport(input: {
    tenantId: string
    format: ExportFormat
    scope: ExportScope
    filters?: Record<string, string>
    requestedBy: string
  }): ExportRecord {
    const now = new Date().toISOString()
    const record: ExportRecord = {
      id: createExportRecordId(),
      tenantId: input.tenantId,
      format: input.format,
      scope: input.scope,
      filters: input.filters,
      status: 'pending',
      requestedBy: input.requestedBy,
      createdAt: now,
      updatedAt: now,
    }
    exportRecordStore.set(record.id, record)

    // 模拟异步生成
    this.generateExportData(record.id, input.tenantId, input.scope, input.format)

    this.logger.log(`Export requested: ${record.id} scope=${input.scope} format=${input.format}`)
    return { ...record }
  }

  private generateExportData(
    id: string,
    tenantId: string,
    scope: ExportScope,
    _format: ExportFormat,
  ): void {
    const record = exportRecordStore.get(id)
    if (!record) return

    try {
      let data: string[] = []

      if (scope === 'campaigns') {
        const campaigns = this.listCampaigns(tenantId)
        data = campaigns.map((c) => JSON.stringify(c))
      } else if (scope === 'assets') {
        const assets = this.listAssets(tenantId)
        data = assets.map((a) => JSON.stringify(a))
      } else if (scope === 'collaborations') {
        const collabs = this.listCollaborations(tenantId)
        data = collabs.map((c) => JSON.stringify(c))
      } else if (scope === 'templates') {
        const templates = this.listTemplates(tenantId)
        data = templates.map((t) => JSON.stringify(t))
      } else if (scope === 'synced_stores') {
        const syncs = Array.from(syncStore.values()).filter((s) => s.tenantId === tenantId)
        data = syncs.map((s) => JSON.stringify(s))
      }

      record.status = 'completed'
      record.recordCount = data.length
      record.filePath = `/exports/${tenantId}/${scope}/${id}.${_format}`
      record.completedAt = new Date().toISOString()
      exportRecordStore.set(id, record)
    } catch (error: any) {
      record.status = 'failed'
      record.errorMessage = error.message
      exportRecordStore.set(id, record)
    }
  }

  /** 获取导出记录 */
  getExportRecord(id: string, tenantId: string): ExportRecord | undefined {
    const r = exportRecordStore.get(id)
    if (!r || r.tenantId !== tenantId) return undefined
    return { ...r }
  }

  /** 获取导出记录列表 */
  listExportRecords(
    tenantId: string,
    filter?: { scope?: ExportScope; format?: ExportFormat },
  ): ExportRecord[] {
    return Array.from(exportRecordStore.values())
      .filter((r) => r.tenantId === tenantId)
      .filter((r) => (filter?.scope ? r.scope === filter.scope : true))
      .filter((r) => (filter?.format ? r.format === filter.format : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => ({ ...r }))
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Collaboration Contract Management (联名合作合同管理)
  // ═══════════════════════════════════════════════════════════════════

  createCollaborationContract(input: {
    tenantId: string
    collaborationId: string
    contractNumber: string
    title: string
    filePath?: string
    signedAt?: string
    effectiveDate: string
    expiryDate: string
    amount: number
    status?: ContractStatus
    parties?: Array<{ name: string; role: string }>
    termsSummary?: string
    autoRenew?: boolean
    createdBy: string
  }): CollaborationContract {
    // 验证联名合作存在
    const collab = this.getCollaboration(input.collaborationId, input.tenantId)
    if (!collab) throw new Error(`Collaboration not found: ${input.collaborationId}`)

    if (new Date(input.effectiveDate) >= new Date(input.expiryDate)) {
      throw new Error('Effective date must be before expiry date')
    }

    const now = new Date().toISOString()
    const contract: CollaborationContract = {
      id: createCollaborationContractId(),
      tenantId: input.tenantId,
      collaborationId: input.collaborationId,
      contractNumber: input.contractNumber,
      title: input.title,
      filePath: input.filePath,
      signedAt: input.signedAt,
      effectiveDate: input.effectiveDate,
      expiryDate: input.expiryDate,
      status: input.status ?? 'draft',
      amount: input.amount,
      parties: input.parties ?? [],
      termsSummary: input.termsSummary,
      autoRenew: input.autoRenew ?? false,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    }
    collaborationContractStore.set(contract.id, contract)
    this.logger.log(`Created collaboration contract ${contract.id}: ${contract.contractNumber}`)
    return { ...contract, parties: [...contract.parties] }
  }

  getCollaborationContract(id: string, tenantId: string): CollaborationContract | undefined {
    const c = collaborationContractStore.get(id)
    if (!c || c.tenantId !== tenantId) return undefined
    return { ...c, parties: [...c.parties] }
  }

  listCollaborationContracts(
    tenantId: string,
    filter?: { collaborationId?: string; status?: ContractStatus },
  ): CollaborationContract[] {
    return Array.from(collaborationContractStore.values())
      .filter((c) => c.tenantId === tenantId)
      .filter((c) => (filter?.collaborationId ? c.collaborationId === filter.collaborationId : true))
      .filter((c) => (filter?.status ? c.status === filter.status : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((c) => ({ ...c, parties: [...c.parties] }))
  }

  updateCollaborationContract(
    id: string,
    tenantId: string,
    patch: Partial<Pick<CollaborationContract, 'filePath' | 'signedAt' | 'effectiveDate' | 'expiryDate' | 'status' | 'amount' | 'parties' | 'termsSummary' | 'autoRenew'>>,
  ): CollaborationContract {
    const c = collaborationContractStore.get(id)
    if (!c || c.tenantId !== tenantId) throw new Error(`CollaborationContract not found: ${id}`)

    const updated: CollaborationContract = {
      ...c,
      ...patch,
      parties: patch.parties ?? c.parties,
      updatedAt: new Date().toISOString(),
    }
    collaborationContractStore.set(id, updated)
    return { ...updated, parties: [...updated.parties] }
  }

  deleteCollaborationContract(id: string, tenantId: string): boolean {
    const c = collaborationContractStore.get(id)
    if (!c || c.tenantId !== tenantId) return false
    collaborationContractStore.delete(id)
    return true
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Brand Campaign A/B Testing (品牌活动A/B测试)
  // ═══════════════════════════════════════════════════════════════════

  createCampaignABTest(input: {
    tenantId: string
    campaignId: string
    name: string
    description: string
    variants: Array<{
      name: string
      description: string
      variantTitle?: string
      variantDescription?: string
      variantAssets?: string[]
      variantCoverImageUrl?: string
      storeIds: string[]
    }>
    createdBy: string
  }): CampaignABTest {
    // 验证活动存在
    const camp = this.getCampaign(input.campaignId, input.tenantId)
    if (!camp) throw new Error(`BrandCampaign not found: ${input.campaignId}`)
    if (input.variants.length < 2) {
      throw new Error('A/B test requires at least 2 variants')
    }

    const now = new Date().toISOString()
    const abTestId = createABTestId()

    const variants: CampaignVariant[] = input.variants.map((v) => ({
      id: createCampaignVariantId(),
      abTestId,
      name: v.name,
      description: v.description,
      variantTitle: v.variantTitle,
      variantDescription: v.variantDescription,
      variantAssets: v.variantAssets,
      variantCoverImageUrl: v.variantCoverImageUrl,
      storeIds: v.storeIds,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      conversionRate: 0,
      createdAt: now,
    }))

    const abTest: CampaignABTest = {
      id: abTestId,
      tenantId: input.tenantId,
      campaignId: input.campaignId,
      name: input.name,
      description: input.description,
      status: 'draft',
      variants,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    }
    campaignABTestStore.set(abTest.id, abTest)
    this.logger.log(`Created A/B test ${abTest.id}: ${abTest.name} with ${abTest.variants.length} variants`)
    return this.cloneABTest(abTest)
  }

  getCampaignABTest(id: string, tenantId: string): CampaignABTest | undefined {
    const t = campaignABTestStore.get(id)
    if (!t || t.tenantId !== tenantId) return undefined
    return this.cloneABTest(t)
  }

  listCampaignABTests(tenantId: string, campaignId?: string): CampaignABTest[] {
    return Array.from(campaignABTestStore.values())
      .filter((t) => t.tenantId === tenantId)
      .filter((t) => (campaignId ? t.campaignId === campaignId : true))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((t) => this.cloneABTest(t))
  }

  /** 启动A/B测试: draft → running */
  startCampaignABTest(id: string, tenantId: string): CampaignABTest {
    const t = this.assertABTestOwned(id, tenantId)
    if (t.status !== 'draft') {
      throw new Error(`Cannot start A/B test with status ${t.status}`)
    }
    t.status = 'running'
    t.startedAt = new Date().toISOString()
    t.updatedAt = new Date().toISOString()
    campaignABTestStore.set(id, t)
    return this.cloneABTest(t)
  }

  /** 暂停A/B测试: running → paused */
  pauseCampaignABTest(id: string, tenantId: string): CampaignABTest {
    const t = this.assertABTestOwned(id, tenantId)
    if (t.status !== 'running') {
      throw new Error(`Cannot pause A/B test with status ${t.status}`)
    }
    t.status = 'paused'
    t.updatedAt = new Date().toISOString()
    campaignABTestStore.set(id, t)
    return this.cloneABTest(t)
  }

  /** 恢复A/B测试: paused → running */
  resumeCampaignABTest(id: string, tenantId: string): CampaignABTest {
    const t = this.assertABTestOwned(id, tenantId)
    if (t.status !== 'paused') {
      throw new Error(`Cannot resume A/B test with status ${t.status}`)
    }
    t.status = 'running'
    t.updatedAt = new Date().toISOString()
    campaignABTestStore.set(id, t)
    return this.cloneABTest(t)
  }

  /** 记录变体指标 */
  recordVariantMetrics(
    abTestId: string,
    variantId: string,
    tenantId: string,
    input: { impressions: number; clicks: number; conversions: number },
  ): CampaignABTest {
    const t = this.assertABTestOwned(abTestId, tenantId)
    const variant = t.variants.find((v) => v.id === variantId)
    if (!variant) throw new Error(`Variant not found: ${variantId}`)

    variant.impressions += input.impressions
    variant.clicks += input.clicks
    variant.conversions += input.conversions
    variant.ctr = variant.impressions > 0 ? Math.round((variant.clicks / variant.impressions) * 10000) / 10000 : 0
    variant.conversionRate = variant.impressions > 0 ? Math.round((variant.conversions / variant.impressions) * 10000) / 10000 : 0

    t.updatedAt = new Date().toISOString()
    campaignABTestStore.set(abTestId, t)
    return this.cloneABTest(t)
  }

  /** 选择获胜变体并结束测试 */
  decideABTestWinner(
    abTestId: string,
    variantId: string,
    tenantId: string,
  ): CampaignABTest {
    const t = this.assertABTestOwned(abTestId, tenantId)
    if (t.status === 'completed' || t.status === 'cancelled') {
      throw new Error(`Cannot decide winner: test is ${t.status}`)
    }
    const variant = t.variants.find((v) => v.id === variantId)
    if (!variant) throw new Error(`Variant not found: ${variantId}`)

    t.winnerVariantId = variantId
    t.status = 'completed'
    t.endedAt = new Date().toISOString()
    t.updatedAt = new Date().toISOString()
    campaignABTestStore.set(abTestId, t)
    return this.cloneABTest(t)
  }

  /** 获取A/B测试效果对比 */
  getABTestComparison(abTestId: string, tenantId: string): {
    test: CampaignABTest
    bestVariant: CampaignVariant | null
    recommendation: string
  } {
    const t = this.assertABTestOwned(abTestId, tenantId)
    if (t.variants.length === 0) {
      return { test: this.cloneABTest(t), bestVariant: null, recommendation: 'No variants available' }
    }

    // Find variant with highest conversion rate
    const sorted = [...t.variants].sort((a, b) => b.conversionRate - a.conversionRate)
    const best = sorted[0]

    let recommendation = ''
    if (t.status === 'completed' && t.winnerVariantId) {
      recommendation = `Variant "${best.name}" had best conversion rate of ${(best.conversionRate * 100).toFixed(2)}%`
    } else if (t.status === 'running') {
      recommendation = `Test still running. Current best: "${best.name}" with ${(best.conversionRate * 100).toFixed(2)}% conversion rate`
    } else {
      recommendation = 'Test not yet started or completed'
    }

    return { test: this.cloneABTest(t), bestVariant: { ...best }, recommendation }
  }

  private assertABTestOwned(id: string, tenantId: string): CampaignABTest {
    const t = campaignABTestStore.get(id)
    if (!t || t.tenantId !== tenantId) throw new Error(`CampaignABTest not found: ${id}`)
    return t
  }

  private cloneABTest(t: CampaignABTest): CampaignABTest {
    return {
      ...t,
      variants: t.variants.map((v) => ({ ...v })),
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Brand Operations Calendar (品牌运营日历)
  // ═══════════════════════════════════════════════════════════════════

  /** 获取品牌运营日历时间轴 */
  getCalendarTimeline(
    tenantId: string,
    startDate: string,
    endDate: string,
    type?: string,
  ): CalendarTimeline {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error('Invalid date range')
    }
    if (start >= end) {
      throw new Error('Start date must be before end date')
    }

    const events: CalendarEvent[] = []

    // Collect campaign events
    const campaigns = this.listCampaigns(tenantId)
    for (const c of campaigns) {
      const cStart = new Date(c.startDate)
      const cEnd = new Date(c.endDate)

      if (cStart >= start && cStart <= end) {
        const event: CalendarEvent = {
          date: c.startDate,
          type: 'campaign_start',
          refId: c.id,
          title: `[Start] ${c.title}`,
          description: `Activity starts: ${c.description.slice(0, 100)}`,
        }
        events.push(event)
      }
      if (cEnd >= start && cEnd <= end) {
        const event: CalendarEvent = {
          date: c.endDate,
          type: 'campaign_end',
          refId: c.id,
          title: `[End] ${c.title}`,
          description: `Activity ends`,
        }
        events.push(event)
      }
    }

    // Collect collaboration events
    const collabs = this.listCollaborations(tenantId)
    for (const c of collabs) {
      const cStart = new Date(c.startDate)
      const cEnd = new Date(c.endDate)

      if (cStart >= start && cStart <= end) {
        const event: CalendarEvent = {
          date: c.startDate,
          type: 'collaboration_start',
          refId: c.id,
          title: `[Collab Start] ${c.title}`,
          description: `Collaboration with ${c.partner.name}: ${c.description.slice(0, 100)}`,
        }
        events.push(event)
      }
      if (cEnd >= start && cEnd <= end) {
        const event: CalendarEvent = {
          date: c.endDate,
          type: 'collaboration_end',
          refId: c.id,
          title: `[Collab End] ${c.title}`,
          description: `Collaboration with ${c.partner.name} ends`,
        }
        events.push(event)
      }
    }

    // Filter by type if specified
    const filteredEvents = type
      ? events.filter((e) => e.type === type || e.type.startsWith(type))
      : events

    // Sort by date
    const sortedEvents = filteredEvents.sort((a, b) => a.date.localeCompare(b.date))

    // Compute daily counts
    const dailyMap = new Map<string, number>()
    for (const e of sortedEvents) {
      const day = e.date.slice(0, 10)
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1)
    }

    // Compute weekly counts
    const weeklyMap = new Map<string, number>()
    for (const e of sortedEvents) {
      const d = new Date(e.date)
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - d.getDay())
      const week = weekStart.toISOString().slice(0, 10)
      weeklyMap.set(week, (weeklyMap.get(week) ?? 0) + 1)
    }

    // Compute monthly counts
    const monthlyMap = new Map<string, number>()
    for (const e of sortedEvents) {
      const month = e.date.slice(0, 7)
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + 1)
    }

    const dailyCounts = Array.from(dailyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }))

    const weeklyCounts = Array.from(weeklyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, count]) => ({ week, count }))

    const monthlyCounts = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }))

    return {
      events: sortedEvents,
      dailyCounts,
      weeklyCounts,
      monthlyCounts,
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Brand Asset Recycle Bin (品牌资产回收站)
  // ═══════════════════════════════════════════════════════════════════

  /** 软删除资产到回收站 */
  softDeleteEntity(input: {
    tenantId: string
    entityType: RecycleBinEntityType
    entityId: string
    deletedBy: string
  }): RecycleBinItem {
    let entitySummary = ''
    let originalData = ''

    if (input.entityType === 'asset') {
      const asset = this.getAsset(input.entityId, input.tenantId)
      if (!asset) throw new Error(`BrandAsset not found: ${input.entityId}`)
      entitySummary = `Brand Asset: ${asset.name} (${asset.type})`
      originalData = JSON.stringify(asset)
    } else if (input.entityType === 'campaign') {
      const camp = this.getCampaign(input.entityId, input.tenantId)
      if (!camp) throw new Error(`BrandCampaign not found: ${input.entityId}`)
      entitySummary = `Brand Campaign: ${camp.title}`
      originalData = JSON.stringify(camp)
    } else if (input.entityType === 'template') {
      const tpl = this.getTemplate(input.entityId, input.tenantId)
      if (!tpl) throw new Error(`BrandCampaignTemplate not found: ${input.entityId}`)
      entitySummary = `Campaign Template: ${tpl.name}`
      originalData = JSON.stringify(tpl)
    } else if (input.entityType === 'collaboration') {
      const collab = this.getCollaboration(input.entityId, input.tenantId)
      if (!collab) throw new Error(`Collaboration not found: ${input.entityId}`)
      entitySummary = `Collaboration: ${collab.title}`
      originalData = JSON.stringify(collab)
    } else {
      throw new Error(`Unsupported entity type: ${input.entityType}`)
    }

    // Remove from active store
    if (input.entityType === 'asset') {
      assetStore.delete(input.entityId)
    } else if (input.entityType === 'campaign') {
      campaignStore.delete(input.entityId)
    } else if (input.entityType === 'template') {
      templateStore.delete(input.entityId)
    } else if (input.entityType === 'collaboration') {
      collaborationStore.delete(input.entityId)
    }

    const now = new Date().toISOString()
    // 默认30天后过期
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const item: RecycleBinItem = {
      id: createRecycleBinItemId(),
      tenantId: input.tenantId,
      entityType: input.entityType,
      entityId: input.entityId,
      entitySummary,
      originalData,
      deletedBy: input.deletedBy,
      deletedAt: now,
      expiresAt,
    }
    recycleBinStore.set(item.id, item)
    this.logger.log(`Soft deleted ${input.entityType} ${input.entityId} to recycle bin`)
    return { ...item }
  }

  /** 从回收站恢复 */
  restoreFromRecycleBin(id: string, tenantId: string): RecycleBinItem {
    const item = recycleBinStore.get(id)
    if (!item || item.tenantId !== tenantId) {
      throw new Error(`RecycleBinItem not found: ${id}`)
    }
    if (item.restoredAt) {
      throw new Error(`RecycleBinItem already restored at ${item.restoredAt}`)
    }

    // Restore original data
    try {
      const original = JSON.parse(item.originalData) as Record<string, any>
      if (item.entityType === 'asset') {
        assetStore.set(item.entityId, original as unknown as BrandAsset)
      } else if (item.entityType === 'campaign') {
        campaignStore.set(item.entityId, original as unknown as BrandCampaign)
      } else if (item.entityType === 'template') {
        templateStore.set(item.entityId, original as unknown as BrandCampaignTemplate)
      } else if (item.entityType === 'collaboration') {
        collaborationStore.set(item.entityId, original as unknown as Collaboration)
      }

      item.restoredAt = new Date().toISOString()
      recycleBinStore.set(id, item)
      this.logger.log(`Restored ${item.entityType} ${item.entityId} from recycle bin`)
    } catch (error: any) {
      throw new Error(`Failed to restore entity: ${error.message}`)
    }

    return { ...item }
  }

  /** 永久删除回收站项目 */
  permanentlyDeleteFromRecycleBin(id: string, tenantId: string): boolean {
    const item = recycleBinStore.get(id)
    if (!item || item.tenantId !== tenantId) return false
    recycleBinStore.delete(id)
    return true
  }

  /** 查询回收站 */
  listRecycleBinItems(
    tenantId: string,
    filter?: { entityType?: RecycleBinEntityType; search?: string },
  ): RecycleBinItem[] {
    return Array.from(recycleBinStore.values())
      .filter((i) => i.tenantId === tenantId)
      .filter((i) => (filter?.entityType ? i.entityType === filter.entityType : true))
      .filter((i) =>
        filter?.search
          ? i.entitySummary.toLowerCase().includes(filter.search.toLowerCase())
          : true,
      )
      .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt))
      .map((i) => ({ ...i }))
  }

  /** 清理过期回收站项目 */
  cleanExpiredRecycleBinItems(now?: string): number {
    const cutoff = now ?? new Date().toISOString()
    let count = 0
    for (const [id, item] of recycleBinStore) {
      if (item.expiresAt <= cutoff) {
        recycleBinStore.delete(id)
        count++
      }
    }
    if (count > 0) {
      this.logger.log(`Cleaned ${count} expired recycle bin items`)
    }
    return count
  }

  // ════════════════════════════════════════════════════
  //  Brand Dashboard API (品牌数据看板)
  // ════════════════════════════════════════════════════

  getBrandDashboard(tenantId: string): BrandDashboardData {
    const assets = Array.from(assetStore.values()).filter((a) => a.tenantId === tenantId)
    const campaigns = Array.from(campaignStore.values()).filter((c) => c.tenantId === tenantId)
    const syncs = Array.from(syncStore.values())
    const templates = Array.from(templateStore.values()).filter((t) => t.tenantId === tenantId)
    const collabs = Array.from(collaborationStore.values()).filter((c) => c.tenantId === tenantId)
    const revenueRecords = Array.from(revenueShareStore.values()).filter((r) => r.tenantId === tenantId)

    // Asset usage stats by type
    const typeMap = new Map<string, { total: number; active: number; usage: number }>()
    for (const a of assets) {
      const e = typeMap.get(a.type) ?? { total: 0, active: 0, usage: 0 }
      e.total++
      if (a.active) e.active++
      typeMap.set(a.type, e)
    }
    for (const c of campaigns) {
      for (const assetId of c.assets) {
        const a = assets.find((x) => x.id === assetId)
        if (a) {
          const e = typeMap.get(a.type)
          if (e) e.usage++
        }
      }
    }
    const assetUsageStats: AssetUsageStat[] = Array.from(typeMap.entries()).map(([type, v]) => ({
      type,
      totalCount: v.total,
      activeCount: v.active,
      usageCount: v.usage,
    }))

    // Campaign effectiveness
    const statusMap = new Map<string, { count: number; totalStores: number; syncedStores: number }>()
    for (const c of campaigns) {
      const e = statusMap.get(c.status) ?? { count: 0, totalStores: 0, syncedStores: 0 }
      e.count++
      e.totalStores += c.storeIds.length
      const synced = syncs.filter((s) => s.campaignId === c.id && s.status === 'synced').length
      e.syncedStores += synced
      statusMap.set(c.status, e)
    }
    const campaignEffectiveness: CampaignEffectiveness[] = Array.from(statusMap.entries()).map(([status, v]) => ({
      status,
      count: v.count,
      totalStores: v.totalStores,
      syncedStores: v.syncedStores,
    }))

    // Revenue
    const thisMonth = new Date().toISOString().slice(0, 7)
    const monthRecords = revenueRecords.filter((r) => r.createdAt.startsWith(thisMonth))
    const monthRevenue = monthRecords.reduce((s, r) => s + r.totalRevenue, 0)
    const monthPartnerShare = monthRecords.reduce((s, r) => s + r.partnerShare, 0)

    // Sync rate
    const totalStoreAssignments = campaigns.reduce((s, c) => s + c.storeIds.length, 0)
    const syncedStoreCount = syncs.filter((s) => s.status === 'synced').length
    const storeSyncRate = totalStoreAssignments > 0 ? Math.round((syncedStoreCount / totalStoreAssignments) * 100) / 100 : 0

    return {
      totalAssets: assets.length,
      activeAssets: assets.filter((a) => a.active).length,
      assetUsageStats,
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
      campaignEffectiveness,
      totalCollaborations: collabs.length,
      activeCollaborations: collabs.filter((c) => c.status === 'active').length,
      monthRevenue,
      monthPartnerShare,
      storeSyncRate,
      totalTemplates: templates.length,
      publishedTemplates: templates.filter((t) => t.published).length,
    }
  }
}
