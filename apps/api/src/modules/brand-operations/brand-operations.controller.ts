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
} from '@nestjs/common'
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

// 当前 Phase-47 骨架阶段使用硬编码 tenant/brand; 上线后替换为真实租户上下文
const MOCK_TENANT_ID = 'tenant-1'
const MOCK_BRAND_ID = 'brand-1'

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
}
