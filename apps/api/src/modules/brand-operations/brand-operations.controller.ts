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
} from './brand-operations.dto'
import type {
  BrandAsset,
  BrandCampaign,
  BrandSyncRecord,
  BrandOperationsMetrics,
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
  //  统计
  // ═══════════════════════════════════════════

  @Get('metrics')
  getMetrics(): BrandOperationsMetrics {
    return this.service.getMetrics(MOCK_TENANT_ID)
  }
}
