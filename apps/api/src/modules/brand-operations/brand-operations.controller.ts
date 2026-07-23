import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'
import { BrandOperationsService } from './brand-operations.service'
import {
  CreateBrandAssetDto,
  UpdateBrandAssetDto,
  CreateBrandCampaignDto,
  UpdateBrandCampaignDto,
  QueryBrandCampaignDto,
  ApproveCampaignDto,
  RejectCampaignDto,
  PublishCampaignDto,
  CreateBrandCampaignTemplateDto,
  UpdateBrandCampaignTemplateDto,
  QueryBrandCampaignTemplateDto,
  ApplyTemplateToCampaignDto,
  CreateCollaborationDto,
  UpdateCollaborationDto,
  QueryCollaborationDto,
} from './brand-operations.dto'
import {
  CreateCampaignScheduleDto,
  CancelCampaignScheduleDto,
  CreateRevenueShareRecordDto,
  SettleRevenueShareDto,
  QueryRevenueShareDto,
  CreateAssetCategoryDto,
  UpdateAssetCategoryDto,
  CreateAssetTagDto,
  ScheduleActionEnum,
} from './brand-operations.phase-p47-80.dto'
import {
  CreateExportRecordDto,
  QueryExportRecordDto,
  CreateCollaborationContractDto,
  UpdateCollaborationContractDto,
  QueryCollaborationContractDto,
  CreateCampaignABTestDto,
  RecordVariantMetricsDto,
  DecideABTestWinnerDto,
  QueryCalendarTimelineDto,
  QueryRecycleBinDto,
} from './brand-operations.phase-p47-100.dto'
import type {
  BrandAsset,
  BrandCampaign,
  BrandSyncRecord,
  BrandCampaignTemplate,
  BrandOperationsMetrics,
  Collaboration,
  CollaborationMetrics,
  CollaborationType,
} from './brand-operations.entity'
import type {
  CampaignSchedule,
  RevenueShareRecord,
  RevenueShareSummary,
  AssetCategory,
  AssetTag,
  AssetCategoryTree,
  BrandDashboardData,
  ScheduleAction,
  ScheduleStatus,
  SettlementStatus,
} from './brand-operations.phase-p47-80.entity'
import type {
  ExportRecord,
  CollaborationContract,
  CampaignABTest,
  RecycleBinEntityType,
  CalendarTimeline,
  RecycleBinItem,
} from './brand-operations.phase-p47-100.entity'

// 当前 Phase-47 骨架阶段使用硬编码 tenant/brand; 上线后替换为真实租户上下文
const MOCK_TENANT_ID = 'tenant-1'
const MOCK_BRAND_ID = 'brand-1'

@UseGuards(TenantGuard)
@Controller('brand-operations')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class BrandOperationsController {
  constructor(private readonly service: BrandOperationsService) {}

  // ═══════════════════════════════════════════
  //  BrandAsset CRUD
  // ═══════════════════════════════════════════

  @Post('assets')
  createAsset(@Body() body: CreateBrandAssetDto): BrandAsset {
    return this.service.createAsset({
      tenantId: MOCK_TENANT_ID,
      brandId: MOCK_BRAND_ID,
      type: body.type,
      url: body.url,
      name: body.name,
      description: body.description,
      active: body.active,
      mimeType: body.mimeType,
    })
  }

  @Get('assets')
  listAssets(
    @Query('type') type?: string,
    @Query('active') active?: string,
  ): BrandAsset[] {
    const activeFilter = active !== undefined ? active === 'true' : undefined
    return this.service.listAssets(MOCK_TENANT_ID, {
      type: type as BrandAsset['type'] | undefined,
      active: activeFilter,
    })
  }

  @Get('assets/:assetId')
  getAsset(@Param('assetId') assetId: string): BrandAsset | undefined {
    return this.service.getAsset(assetId, MOCK_TENANT_ID)
  }

  @Patch('assets/:assetId')
  updateAsset(
    @Param('assetId') assetId: string,
    @Body() body: UpdateBrandAssetDto,
  ): BrandAsset {
    return this.service.updateAsset(assetId, MOCK_TENANT_ID, body)
  }

  @Delete('assets/:assetId')
  deleteAsset(@Param('assetId') assetId: string): { success: boolean } {
    const result = this.service.deleteAsset(assetId, MOCK_TENANT_ID)
    return { success: result }
  }

  // ═══════════════════════════════════════════
  //  活动审批发布流
  // ═══════════════════════════════════════════

  @Post('campaigns/:campaignId/submit')
  submitCampaign(@Param('campaignId') campaignId: string): BrandCampaign {
    return this.service.submitCampaignForReview(campaignId, MOCK_TENANT_ID)
  }

  @Post('campaigns/:campaignId/approve')
  approveCampaign(
    @Param('campaignId') campaignId: string,
    @Body() body: ApproveCampaignDto,
  ): BrandCampaign {
    return this.service.approveCampaign(campaignId, MOCK_TENANT_ID, body)
  }

  @Post('campaigns/:campaignId/reject')
  rejectCampaign(
    @Param('campaignId') campaignId: string,
    @Body() body: RejectCampaignDto,
  ): BrandCampaign {
    return this.service.rejectCampaign(campaignId, MOCK_TENANT_ID, body)
  }

  @Post('campaigns/:campaignId/publish')
  publishCampaign(
    @Param('campaignId') campaignId: string,
    @Body() body: PublishCampaignDto,
  ): BrandCampaign {
    return this.service.publishCampaign(campaignId, MOCK_TENANT_ID, body.publishNote)
  }

  // ═══════════════════════════════════════════
  //  BrandCampaign CRUD
  // ═══════════════════════════════════════════

  @Post('campaigns')
  createCampaign(@Body() body: CreateBrandCampaignDto): BrandCampaign {
    return this.service.createCampaign({
      tenantId: MOCK_TENANT_ID,
      brandId: MOCK_BRAND_ID,
      title: body.title,
      description: body.description,
      storeIds: body.storeIds,
      startDate: body.startDate,
      endDate: body.endDate,
      assets: body.assets,
      coverImageUrl: body.coverImageUrl,
      createdBy: body.createdBy,
    })
  }

  @Get('campaigns')
  listCampaigns(@Query() query: QueryBrandCampaignDto): BrandCampaign[] {
    return this.service.listCampaigns(MOCK_TENANT_ID, {
      status: query.status,
      storeId: query.storeId,
      startFrom: query.startFrom,
      startTo: query.startTo,
    })
  }

  @Get('campaigns/:campaignId')
  getCampaign(@Param('campaignId') campaignId: string): BrandCampaign | undefined {
    return this.service.getCampaign(campaignId, MOCK_TENANT_ID)
  }

  @Patch('campaigns/:campaignId')
  updateCampaign(
    @Param('campaignId') campaignId: string,
    @Body() body: UpdateBrandCampaignDto,
  ): BrandCampaign {
    return this.service.updateCampaign(campaignId, MOCK_TENANT_ID, body)
  }

  @Delete('campaigns/:campaignId')
  deleteCampaign(@Param('campaignId') campaignId: string): { success: boolean } {
    const result = this.service.deleteCampaign(campaignId, MOCK_TENANT_ID)
    return { success: result }
  }

  // ═══════════════════════════════════════════
  //  门店同步
  // ═══════════════════════════════════════════

  @Post('campaigns/:campaignId/sync')
  syncToStores(@Param('campaignId') campaignId: string): BrandSyncRecord[] {
    return this.service.syncToStores(campaignId, MOCK_TENANT_ID)
  }

  @Get('campaigns/:campaignId/sync')
  getSyncRecords(@Param('campaignId') campaignId: string): BrandSyncRecord[] {
    return this.service.getSyncRecords(campaignId, MOCK_TENANT_ID)
  }

  @Get('stores/:storeId/campaigns')
  getSyncedCampaigns(@Param('storeId') storeId: string): BrandCampaign[] {
    return this.service.getSyncedCampaigns(storeId, MOCK_TENANT_ID)
  }

  // ═══════════════════════════════════════════
  //  CampaignTemplate CRUD
  // ═══════════════════════════════════════════

  @Post('templates')
  createTemplate(@Body() body: CreateBrandCampaignTemplateDto): BrandCampaignTemplate {
    return this.service.createTemplate({
      tenantId: MOCK_TENANT_ID,
      brandId: MOCK_BRAND_ID,
      name: body.name,
      description: body.description,
      defaultStoreIds: body.defaultStoreIds,
      defaultAssets: body.defaultAssets,
      coverImageUrl: body.coverImageUrl,
      defaultDurationDays: body.defaultDurationDays,
      tags: body.tags,
      published: body.published,
      createdBy: MOCK_TENANT_ID,
    })
  }

  @Get('templates')
  listTemplates(@Query() query: QueryBrandCampaignTemplateDto): BrandCampaignTemplate[] {
    return this.service.listTemplates(MOCK_TENANT_ID, {
      tag: query.tag,
      published: query.published,
      search: query.search,
    })
  }

  @Get('templates/:templateId')
  getTemplate(@Param('templateId') templateId: string): BrandCampaignTemplate | undefined {
    return this.service.getTemplate(templateId, MOCK_TENANT_ID)
  }

  @Patch('templates/:templateId')
  updateTemplate(
    @Param('templateId') templateId: string,
    @Body() body: UpdateBrandCampaignTemplateDto,
  ): BrandCampaignTemplate {
    return this.service.updateTemplate(templateId, MOCK_TENANT_ID, body)
  }

  @Delete('templates/:templateId')
  deleteTemplate(@Param('templateId') templateId: string): { success: boolean } {
    const result = this.service.deleteTemplate(templateId, MOCK_TENANT_ID)
    return { success: result }
  }

  // ═══════════════════════════════════════════
  //  从模板创建活动
  // ═══════════════════════════════════════════

  @Post('templates/:templateId/apply')
  applyTemplate(
    @Param('templateId') templateId: string,
    @Body() body: ApplyTemplateToCampaignDto,
  ): BrandCampaign {
    return this.service.applyTemplateToCampaign({
      templateId,
      tenantId: MOCK_TENANT_ID,
      brandId: MOCK_BRAND_ID,
      title: body.title,
      description: body.description,
      startDate: body.startDate,
      endDate: body.endDate,
      storeIds: body.storeIds,
      createdBy: body.createdBy,
    })
  }

  // ═══════════════════════════════════════════
  //  Collaboration (联名合作) CRUD
  // ═══════════════════════════════════════════

  @Post('collaborations')
  createCollaboration(@Body() body: CreateCollaborationDto): Collaboration {
    return this.service.createCollaboration({
      tenantId: MOCK_TENANT_ID,
      brandId: MOCK_BRAND_ID,
      title: body.title,
      description: body.description,
      type: body.type as Collaboration['type'],
      partner: {
        name: body.partnerName,
        contactName: body.partnerContactName,
        contactPhone: body.partnerContactPhone,
        contactEmail: body.partnerContactEmail,
        grade: body.partnerGrade as Collaboration['partner']['grade'],
      },
      revenueShare: {
        type: body.revenueShareType as Collaboration['revenueShare']['type'],
        rate: body.revenueShareRate,
        fixedAmount: body.revenueShareFixedAmount,
        description: body.revenueShareDescription,
      },
      startDate: body.startDate,
      endDate: body.endDate,
      coBrandName: body.coBrandName,
      campaignIds: body.campaignIds,
      terms: body.terms,
      createdBy: MOCK_TENANT_ID,
    })
  }

  @Get('collaborations')
  listCollaborations(@Query() query: QueryCollaborationDto): Collaboration[] {
    return this.service.listCollaborations(MOCK_TENANT_ID, {
      status: query.status as Collaboration['status'] | undefined,
      type: query.type as Collaboration['type'] | undefined,
      grade: query.grade as Collaboration['partner']['grade'] | undefined,
      search: query.search,
    })
  }

  @Get('collaborations/:collabId')
  getCollaboration(@Param('collabId') collabId: string): Collaboration | undefined {
    return this.service.getCollaboration(collabId, MOCK_TENANT_ID)
  }

  @Patch('collaborations/:collabId')
  updateCollaboration(
    @Param('collabId') collabId: string,
    @Body() body: UpdateCollaborationDto,
  ): Collaboration {
    const patch: any = {}
    if (body.title !== undefined) patch.title = body.title
    if (body.description !== undefined) patch.description = body.description
    if (body.type !== undefined) patch.type = body.type
    if (body.status !== undefined) patch.status = body.status
    if (body.startDate !== undefined) patch.startDate = body.startDate
    if (body.endDate !== undefined) patch.endDate = body.endDate
    if (body.campaignIds !== undefined) patch.campaignIds = body.campaignIds
    if (body.terms !== undefined) patch.terms = body.terms
    if (body.coBrandName !== undefined) patch.coBrandName = body.coBrandName

    // Partner partial
    const partnerPatch: any = {}
    if (body.partnerContactName !== undefined) partnerPatch.contactName = body.partnerContactName
    if (body.partnerContactPhone !== undefined) partnerPatch.contactPhone = body.partnerContactPhone
    if (body.partnerContactEmail !== undefined) partnerPatch.contactEmail = body.partnerContactEmail
    if (body.partnerGrade !== undefined) partnerPatch.grade = body.partnerGrade
    if (Object.keys(partnerPatch).length > 0) patch.partner = partnerPatch

    // Revenue share partial
    const rsPatch: any = {}
    if (body.revenueShareType !== undefined) rsPatch.type = body.revenueShareType
    if (body.revenueShareRate !== undefined) rsPatch.rate = body.revenueShareRate
    if (body.revenueShareFixedAmount !== undefined) rsPatch.fixedAmount = body.revenueShareFixedAmount
    if (body.revenueShareDescription !== undefined) rsPatch.description = body.revenueShareDescription
    if (Object.keys(rsPatch).length > 0) patch.revenueShare = rsPatch

    return this.service.updateCollaboration(collabId, MOCK_TENANT_ID, patch)
  }

  @Delete('collaborations/:collabId')
  deleteCollaboration(@Param('collabId') collabId: string): { success: boolean } {
    const result = this.service.deleteCollaboration(collabId, MOCK_TENANT_ID)
    return { success: result }
  }

  @Get('collaborations/:campaignId/metrics')
  getCollaborationMetrics(): CollaborationMetrics {
    return this.service.getCollaborationMetrics(MOCK_TENANT_ID)
  }

  @Post('collaborations/:collabId/link/:campaignId')
  linkCampaignToCollaboration(
    @Param('collabId') collabId: string,
    @Param('campaignId') campaignId: string,
  ): Collaboration {
    return this.service.linkCampaignToCollaboration(campaignId, collabId, MOCK_TENANT_ID)
  }

  // ═══════════════════════════════════════════
  //  统计
  // ═══════════════════════════════════════════

  @Get('metrics')
  getMetrics(): BrandOperationsMetrics {
    return this.service.getMetrics(MOCK_TENANT_ID)
  }

  // ════════════════════════════════════════════════════════
  //  品牌活动定时发布/下架调度 (CampaignSchedule)
  // ════════════════════════════════════════════════════════

  @Post('campaign-schedules')
  createCampaignSchedule(@Body() body: CreateCampaignScheduleDto): CampaignSchedule {
    return this.service.createCampaignSchedule({
      tenantId: MOCK_TENANT_ID,
      campaignId: body.campaignId,
      action: body.action as ScheduleAction,
      scheduledAt: body.scheduledAt,
      createdBy: MOCK_TENANT_ID,
    })
  }

  @Get('campaign-schedules')
  listCampaignSchedules(
    @Query('status') status?: string,
    @Query('action') action?: string,
    @Query('campaignId') campaignId?: string,
  ): CampaignSchedule[] {
    return this.service.listCampaignSchedules(MOCK_TENANT_ID, {
      status: status as ScheduleStatus,
      action: action as ScheduleAction,
      campaignId,
    })
  }

  @Get('campaign-schedules/:id')
  getCampaignSchedule(@Param('id') id: string): CampaignSchedule | undefined {
    return this.service.getCampaignSchedule(id, MOCK_TENANT_ID)
  }

  @Post('campaign-schedules/:id/cancel')
  cancelCampaignSchedule(@Param('id') id: string): CampaignSchedule {
    return this.service.cancelCampaignSchedule(id, MOCK_TENANT_ID)
  }

  @Post('campaign-schedules/sweep')
  executeDueSchedules(@Body() body: { now?: string }): CampaignSchedule[] {
    return this.service.executeDueSchedules(body.now)
  }

  // ════════════════════════════════════════════════════════
  //  联名收入分成 (Revenue Share)
  // ════════════════════════════════════════════════════════

  @Post('revenue-shares/calculate')
  calculateRevenueShare(@Body() body: CreateRevenueShareRecordDto): RevenueShareRecord {
    return this.service.calculateRevenueShare({
      tenantId: MOCK_TENANT_ID,
      collaborationId: body.collaborationId,
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      totalRevenue: body.totalRevenue,
      shareRate: body.shareRate,
      notes: body.notes,
    })
  }

  @Get('revenue-shares')
  listRevenueShares(@Query() query: QueryRevenueShareDto): RevenueShareRecord[] {
    return this.service.listRevenueShareRecords(MOCK_TENANT_ID, {
      status: query.status as SettlementStatus,
      collaborationId: query.collaborationId,
      periodFrom: query.periodFrom,
      periodTo: query.periodTo,
    })
  }

  @Get('revenue-shares/:id')
  getRevenueShare(@Param('id') id: string): RevenueShareRecord | undefined {
    return this.service.getRevenueShareRecord(id, MOCK_TENANT_ID)
  }

  @Post('revenue-shares/:id/settle')
  settleRevenueShare(
    @Param('id') id: string,
    @Body() body: SettleRevenueShareDto,
  ): RevenueShareRecord {
    return this.service.settleRevenueShare(id, MOCK_TENANT_ID, body)
  }

  @Post('revenue-shares/:id/dispute')
  disputeRevenueShare(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ): RevenueShareRecord {
    return this.service.disputeRevenueShare(id, MOCK_TENANT_ID, body.reason)
  }

  @Get('revenue-shares/summary')
  getRevenueShareSummary(): RevenueShareSummary {
    return this.service.getRevenueShareSummary(MOCK_TENANT_ID)
  }

  // ════════════════════════════════════════════════════════
  //  资产分类管理 (Asset Categories)
  // ════════════════════════════════════════════════════════

  @Post('asset-categories')
  createAssetCategory(@Body() body: CreateAssetCategoryDto): AssetCategory {
    return this.service.createAssetCategory({
      tenantId: MOCK_TENANT_ID,
      name: body.name,
      description: body.description,
      parentId: body.parentId,
      sortOrder: body.sortOrder,
    })
  }

  @Get('asset-categories')
  listAssetCategories(): AssetCategory[] {
    return this.service.listAssetCategories(MOCK_TENANT_ID)
  }

  @Get('asset-categories/tree')
  getAssetCategoryTree(): AssetCategoryTree[] {
    return this.service.getAssetCategoryTree(MOCK_TENANT_ID)
  }

  @Get('asset-categories/:id')
  getAssetCategory(@Param('id') id: string): AssetCategory | undefined {
    return this.service.getAssetCategory(id, MOCK_TENANT_ID)
  }

  @Patch('asset-categories/:id')
  updateAssetCategory(
    @Param('id') id: string,
    @Body() body: UpdateAssetCategoryDto,
  ): AssetCategory {
    return this.service.updateAssetCategory(id, MOCK_TENANT_ID, body)
  }

  @Delete('asset-categories/:id')
  deleteAssetCategory(@Param('id') id: string): { success: boolean } {
    const result = this.service.deleteAssetCategory(id, MOCK_TENANT_ID)
    return { success: result }
  }

  // ════════════════════════════════════════════════════════
  //  资产标签管理 (Asset Tags)
  // ════════════════════════════════════════════════════════

  @Post('asset-tags')
  createAssetTag(@Body() body: CreateAssetTagDto): AssetTag {
    return this.service.createAssetTag({
      tenantId: MOCK_TENANT_ID,
      name: body.name,
      color: body.color,
    })
  }

  @Get('asset-tags')
  listAssetTags(): AssetTag[] {
    return this.service.listAssetTags(MOCK_TENANT_ID)
  }

  @Delete('asset-tags/:id')
  deleteAssetTag(@Param('id') id: string): { success: boolean } {
    const result = this.service.deleteAssetTag(id, MOCK_TENANT_ID)
    return { success: result }
  }

  // ════════════════════════════════════════════════════════
  //  品牌数据看板 (Dashboard)
  // ════════════════════════════════════════════════════════

  @Get('dashboard')
  getDashboard(): BrandDashboardData {
    return this.service.getBrandDashboard(MOCK_TENANT_ID)
  }

  // ════════════════════════════════════════════════════════
  //  品牌活动数据导出 (Export) - P-47 100%
  // ════════════════════════════════════════════════════════

  @Post('exports')
  requestExport(@Body() body: CreateExportRecordDto): ExportRecord {
    return this.service.requestExport({
      tenantId: MOCK_TENANT_ID,
      format: body.format,
      scope: body.scope,
      filters: body.filters,
      requestedBy: body.requestedBy,
    })
  }

  @Get('exports')
  listExportRecords(@Query() query: QueryExportRecordDto): ExportRecord[] {
    return this.service.listExportRecords(MOCK_TENANT_ID, {
      scope: query.scope,
      format: query.format,
    })
  }

  @Get('exports/:id')
  getExportRecord(@Param('id') id: string): ExportRecord | undefined {
    return this.service.getExportRecord(id, MOCK_TENANT_ID)
  }

  // ════════════════════════════════════════════════════════
  //  联名合作合同管理 (Collaboration Contract) - P-47 100%
  // ════════════════════════════════════════════════════════

  @Post('collaboration-contracts')
  createCollaborationContract(@Body() body: CreateCollaborationContractDto): CollaborationContract {
    return this.service.createCollaborationContract({
      tenantId: MOCK_TENANT_ID,
      collaborationId: body.collaborationId,
      contractNumber: body.contractNumber,
      title: body.title,
      filePath: body.filePath,
      signedAt: body.signedAt,
      effectiveDate: body.effectiveDate,
      expiryDate: body.expiryDate,
      status: body.status,
      amount: body.amount,
      parties: body.parties,
      termsSummary: body.termsSummary,
      autoRenew: body.autoRenew,
      createdBy: MOCK_TENANT_ID,
    })
  }

  @Get('collaboration-contracts')
  listCollaborationContracts(@Query() query: QueryCollaborationContractDto): CollaborationContract[] {
    return this.service.listCollaborationContracts(MOCK_TENANT_ID, {
      collaborationId: query.collaborationId,
      status: query.status,
    })
  }

  @Get('collaboration-contracts/:id')
  getCollaborationContract(@Param('id') id: string): CollaborationContract | undefined {
    return this.service.getCollaborationContract(id, MOCK_TENANT_ID)
  }

  @Patch('collaboration-contracts/:id')
  updateCollaborationContract(
    @Param('id') id: string,
    @Body() body: UpdateCollaborationContractDto,
  ): CollaborationContract {
    return this.service.updateCollaborationContract(id, MOCK_TENANT_ID, body)
  }

  @Delete('collaboration-contracts/:id')
  deleteCollaborationContract(@Param('id') id: string): { success: boolean } {
    const result = this.service.deleteCollaborationContract(id, MOCK_TENANT_ID)
    return { success: result }
  }

  // ════════════════════════════════════════════════════════
  //  品牌活动A/B测试 (AB Test) - P-47 100%
  // ════════════════════════════════════════════════════════

  @Post('campaign-ab-tests')
  createCampaignABTest(@Body() body: CreateCampaignABTestDto): CampaignABTest {
    return this.service.createCampaignABTest({
      tenantId: MOCK_TENANT_ID,
      campaignId: body.campaignId,
      name: body.name,
      description: body.description,
      variants: body.variants.map((v) => ({
        name: v.name,
        description: v.description,
        variantTitle: v.variantTitle,
        variantDescription: v.variantDescription,
        variantAssets: v.variantAssets,
        variantCoverImageUrl: v.variantCoverImageUrl,
        storeIds: v.storeIds,
      })),
      createdBy: MOCK_TENANT_ID,
    })
  }

  @Get('campaign-ab-tests')
  listCampaignABTests(
    @Query('campaignId') campaignId?: string,
  ): CampaignABTest[] {
    return this.service.listCampaignABTests(MOCK_TENANT_ID, campaignId)
  }

  @Get('campaign-ab-tests/:id')
  getCampaignABTest(@Param('id') id: string): CampaignABTest | undefined {
    return this.service.getCampaignABTest(id, MOCK_TENANT_ID)
  }

  @Post('campaign-ab-tests/:id/start')
  startCampaignABTest(@Param('id') id: string): CampaignABTest {
    return this.service.startCampaignABTest(id, MOCK_TENANT_ID)
  }

  @Post('campaign-ab-tests/:id/pause')
  pauseCampaignABTest(@Param('id') id: string): CampaignABTest {
    return this.service.pauseCampaignABTest(id, MOCK_TENANT_ID)
  }

  @Post('campaign-ab-tests/:id/resume')
  resumeCampaignABTest(@Param('id') id: string): CampaignABTest {
    return this.service.resumeCampaignABTest(id, MOCK_TENANT_ID)
  }

  @Post('campaign-ab-tests/:id/variants/:variantId/metrics')
  recordVariantMetrics(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() body: RecordVariantMetricsDto,
  ): CampaignABTest {
    return this.service.recordVariantMetrics(id, variantId, MOCK_TENANT_ID, body)
  }

  @Post('campaign-ab-tests/:id/decide-winner')
  decideABTestWinner(
    @Param('id') id: string,
    @Body() body: DecideABTestWinnerDto,
  ): CampaignABTest {
    return this.service.decideABTestWinner(id, body.variantId, MOCK_TENANT_ID)
  }

  @Get('campaign-ab-tests/:id/comparison')
  getABTestComparison(@Param('id') id: string) {
    return this.service.getABTestComparison(id, MOCK_TENANT_ID)
  }

  // ════════════════════════════════════════════════════════
  //  品牌运营日历 (Calendar) - P-47 100%
  // ════════════════════════════════════════════════════════

  @Get('calendar')
  getCalendarTimeline(@Query() query: QueryCalendarTimelineDto): CalendarTimeline {
    return this.service.getCalendarTimeline(MOCK_TENANT_ID, query.startDate, query.endDate, query.type)
  }

  // ════════════════════════════════════════════════════════
  //  品牌资产回收站 (Recycle Bin) - P-47 100%
  // ════════════════════════════════════════════════════════

  @Post('recycle-bin/soft-delete')
  softDeleteEntity(@Body() body: { entityType: string; entityId: string; deletedBy: string }): RecycleBinItem {
    return this.service.softDeleteEntity({
      tenantId: MOCK_TENANT_ID,
      entityType: body.entityType as RecycleBinEntityType,
      entityId: body.entityId,
      deletedBy: body.deletedBy,
    })
  }

  @Post('recycle-bin/:id/restore')
  restoreFromRecycleBin(@Param('id') id: string): RecycleBinItem {
    return this.service.restoreFromRecycleBin(id, MOCK_TENANT_ID)
  }

  @Delete('recycle-bin/:id')
  permanentlyDeleteFromRecycleBin(@Param('id') id: string): { success: boolean } {
    const result = this.service.permanentlyDeleteFromRecycleBin(id, MOCK_TENANT_ID)
    return { success: result }
  }

  @Get('recycle-bin')
  listRecycleBinItems(
    @Query() query: QueryRecycleBinDto,
  ): RecycleBinItem[] {
    return this.service.listRecycleBinItems(MOCK_TENANT_ID, {
      entityType: query.entityType,
      search: query.search,
    })
  }

  @Post('recycle-bin/clean-expired')
  cleanExpiredRecycleBinItems(@Body() body: { now?: string }): { deleted: number } {
    const deleted = this.service.cleanExpiredRecycleBinItems(body.now)
    return { deleted }
  }
}
