import { randomUUID } from 'node:crypto'
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

// ── In-memory stores (Phase-47 骨架阶段,后续替换为 Prisma) ──

const assetStore = new Map<string, BrandAsset>()
const campaignStore = new Map<string, BrandCampaign>()
const syncStore = new Map<string, BrandSyncRecord>()
const templateStore = new Map<string, BrandCampaignTemplate>()
const collaborationStore = new Map<string, Collaboration>()

// ── 导入/导出给测试重置 ──
export function resetBrandOpsStoresForTests(): void {
  assetStore.clear()
  campaignStore.clear()
  syncStore.clear()
  templateStore.clear()
  collaborationStore.clear()
}

export const _testonly = { assetStore, campaignStore, syncStore, templateStore, collaborationStore }

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
}
