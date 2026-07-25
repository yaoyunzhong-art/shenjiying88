/**
 * Brand Operations Prisma Store
 *
 * 将 InMemory Map store 替换为 Prisma 持久化。
 * 策略: 启动时预加载DB数据到内存Map, 读写查内存, 写时同步写回DB。
 * 这样服务层接口完全不变（保持同步方法）。
 */

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { BrandAsset } from './brand-operations.entity'
import type { BrandCampaign } from './brand-operations.entity'
import type { BrandCampaignTemplate } from './brand-operations.entity'
import type { Collaboration } from './brand-operations.entity'
import type { CampaignSchedule } from './brand-operations.phase-p47-80.entity'
import type { RevenueShareRecord } from './brand-operations.phase-p47-80.entity'
import type { AssetCategory } from './brand-operations.phase-p47-80.entity'
import type { AssetTag } from './brand-operations.phase-p47-80.entity'
import type { ExportRecord } from './brand-operations.phase-p47-100.entity'
import type { CollaborationContract } from './brand-operations.phase-p47-100.entity'
import type { CampaignABTest } from './brand-operations.phase-p47-100.entity'
import type { RecycleBinItem } from './brand-operations.phase-p47-100.entity'
import type { BrandChannel } from './brand-operations.channel-kpi.entity'
import type { BrandKPI } from './brand-operations.channel-kpi.entity'
import type { BrandSyncRecord } from './brand-operations.entity'

@Injectable()
export class BrandOperationsPrismaStore implements OnApplicationBootstrap {
  private readonly logger = new Logger(BrandOperationsPrismaStore.name)

  // 内存缓存（同现有同步接口兼容）
  readonly assetStore = new Map<string, BrandAsset>()
  readonly campaignStore = new Map<string, BrandCampaign>()
  readonly syncStore = new Map<string, BrandSyncRecord>()
  readonly templateStore = new Map<string, BrandCampaignTemplate>()
  readonly collaborationStore = new Map<string, Collaboration>()
  readonly campaignScheduleStore = new Map<string, CampaignSchedule>()
  readonly revenueShareStore = new Map<string, RevenueShareRecord>()
  readonly assetCategoryStore = new Map<string, AssetCategory>()
  readonly assetTagStore = new Map<string, AssetTag>()
  readonly exportRecordStore = new Map<string, ExportRecord>()
  readonly collaborationContractStore = new Map<string, CollaborationContract>()
  readonly campaignABTestStore = new Map<string, CampaignABTest>()
  readonly recycleBinStore = new Map<string, RecycleBinItem>()
  readonly brandChannelStore = new Map<string, BrandChannel>()
  readonly brandKPIStore = new Map<string, BrandKPI>()

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.loadAllData()
    this.logger.log('Brand operations data loaded from database')
  }

  /**
   * 启动时全量加载所有数据到内存
   */
  async loadAllData(): Promise<void> {
    const assets = await this.prisma.brandAsset.findMany()
    for (const a of assets) this.assetStore.set(a.id, a as unknown as BrandAsset)

    const campaigns = await this.prisma.brandCampaign.findMany()
    for (const c of campaigns) this.campaignStore.set(c.id, c as unknown as BrandCampaign)

    const templates = await this.prisma.brandCampaignTemplate.findMany()
    for (const t of templates) this.templateStore.set(t.id, t as unknown as BrandCampaignTemplate)

    const collabs = await this.prisma.collaboration.findMany()
    for (const c of collabs) this.collaborationStore.set(c.id, c as unknown as Collaboration)

    const chs = await this.prisma.brandChannel.findMany()
    for (const ch of chs) this.brandChannelStore.set(ch.id, ch as unknown as BrandChannel)

    const kpis = await this.prisma.brandKPI.findMany()
    for (const k of kpis) this.brandKPIStore.set(k.id, k as unknown as BrandKPI)

    const bins = await this.prisma.recycleBinItem.findMany()
    for (const b of bins) this.recycleBinStore.set(b.id, b as unknown as RecycleBinItem)

    const contracts = await this.prisma.collaborationContract.findMany()
    for (const c of contracts) this.collaborationContractStore.set(c.id, c as unknown as CollaborationContract)

    const abtests = await this.prisma.campaignABTest.findMany()
    for (const a of abtests) this.campaignABTestStore.set(a.id, a as unknown as CampaignABTest)

    const exports = await this.prisma.exportRecord.findMany()
    for (const e of exports) this.exportRecordStore.set(e.id, e as unknown as ExportRecord)

    const schedules = await this.prisma.campaignSchedule.findMany()
    for (const s of schedules) this.campaignScheduleStore.set(s.id, s as unknown as CampaignSchedule)
  }

  /**
   * 持久化资产到数据库（写时同步）
   */
  async persistAsset(id: string): Promise<void> {
    const entity = this.assetStore.get(id)
    if (!entity) return
    await this.prisma.brandAsset.upsert({
      where: { id },
      create: entity as any,
      update: entity as any,
    })
  }

  async persistCampaign(id: string): Promise<void> {
    const entity = this.campaignStore.get(id)
    if (!entity) return
    await this.prisma.brandCampaign.upsert({
      where: { id },
      create: entity as any,
      update: entity as any,
    })
  }

  async persistTemplate(id: string): Promise<void> {
    const entity = this.templateStore.get(id)
    if (!entity) return
    await this.prisma.brandCampaignTemplate.upsert({
      where: { id },
      create: entity as any,
      update: entity as any,
    })
  }

  async persistCollaboration(id: string): Promise<void> {
    const entity = this.collaborationStore.get(id)
    if (!entity) return
    await this.prisma.collaboration.upsert({
      where: { id },
      create: entity as any,
      update: entity as any,
    })
  }

  async persistChannel(id: string): Promise<void> {
    const entity = this.brandChannelStore.get(id)
    if (!entity) return
    await this.prisma.brandChannel.upsert({
      where: { id },
      create: entity as any,
      update: entity as any,
    })
  }

  async persistKPI(id: string): Promise<void> {
    const entity = this.brandKPIStore.get(id)
    if (!entity) return
    await this.prisma.brandKPI.upsert({
      where: { id },
      create: entity as any,
      update: entity as any,
    })
  }

  async persistRecycleBin(id: string): Promise<void> {
    const entity = this.recycleBinStore.get(id)
    if (!entity) return
    await this.prisma.recycleBinItem.upsert({
      where: { id },
      create: entity as any,
      update: entity as any,
    })
  }

  async persistExportRecord(id: string): Promise<void> {
    const entity = this.exportRecordStore.get(id)
    if (!entity) return
    await this.prisma.exportRecord.upsert({
      where: { id },
      create: entity as any,
      update: entity as any,
    })
  }

  async persistCampaignSchedule(id: string): Promise<void> {
    const entity = this.campaignScheduleStore.get(id)
    if (!entity) return
    await this.prisma.campaignSchedule.upsert({
      where: { id },
      create: entity as any,
      update: entity as any,
    })
  }

  /**
   * 重置所有数据（用于测试）
   */
  resetAll(): void {
    this.assetStore.clear()
    this.campaignStore.clear()
    this.syncStore.clear()
    this.templateStore.clear()
    this.collaborationStore.clear()
    this.campaignScheduleStore.clear()
    this.revenueShareStore.clear()
    this.assetCategoryStore.clear()
    this.assetTagStore.clear()
    this.exportRecordStore.clear()
    this.collaborationContractStore.clear()
    this.campaignABTestStore.clear()
    this.recycleBinStore.clear()
    this.brandChannelStore.clear()
    this.brandKPIStore.clear()
  }
}
