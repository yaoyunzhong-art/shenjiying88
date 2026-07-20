import { randomUUID } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import type {
  BrandAsset,
  BrandAssetType,
  BrandCampaign,
  CampaignStatus,
  BrandSyncRecord,
  SyncStatus,
  BrandOperationsMetrics,
} from './brand-operations.entity'

// ── In-memory stores (Phase-47 骨架阶段,后续替换为 Prisma) ──

const assetStore = new Map<string, BrandAsset>()
const campaignStore = new Map<string, BrandCampaign>()
const syncStore = new Map<string, BrandSyncRecord>()

// ── 导入/导出给测试重置 ──
export function resetBrandOpsStoresForTests(): void {
  assetStore.clear()
  campaignStore.clear()
  syncStore.clear()
}

export const _testonly = { assetStore, campaignStore, syncStore }

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

    return {
      totalAssets: assets.length,
      activeAssets: assets.filter((a) => a.active).length,
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
      totalStoreAssignments: campaigns.reduce((sum, c) => sum + c.storeIds.length, 0),
      syncedStores: syncs.filter((s) => s.status === 'synced').length,
    }
  }

  // ═══════════════════════════════════════════
  //  内部方法
  // ═══════════════════════════════════════════

  private assertDateRangeValid(startDate: string, endDate: string): void {
    if (new Date(startDate) >= new Date(endDate)) {
      throw new Error('Start date must be before end date')
    }
  }

  private assertValidStatusTransition(from: CampaignStatus, to: CampaignStatus): void {
    if (from === to) return
    const validTransitions: Record<CampaignStatus, CampaignStatus[]> = {
      draft: ['active', 'cancelled'],
      active: ['ended', 'cancelled'],
      ended: [],
      cancelled: [],
    }
    const allowed = validTransitions[from]
    if (!allowed || !allowed.includes(to)) {
      throw new Error(`Invalid campaign status transition: ${from} → ${to}`)
    }
  }
}
