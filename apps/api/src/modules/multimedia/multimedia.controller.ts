/**
 * Phase 99 多模态 Controller (V11 Sprint 3 Day 31-32)
 */

import {
  Controller, Get, Post, Delete, Param, Body, HttpCode, HttpStatus, Query,
} from '@nestjs/common'
import { MultimediaService } from './multimedia.service'
import type {
  CreateAssetDto, CompleteUploadDto, CreateVariantDto,
  AddStorageBackendDto, GenerateSignedUrlDto, ListAssetsQueryDto,
} from './multimedia.dto'
import {
  toCreateAssetResponseContract,
  toMultimediaAssetContract,
  toAssetListResponseContract,
  toAssetVariantContract,
  toAssetVariantListResponseContract,
  toStorageBackendContract,
  toStorageBackendListResponseContract,
  toStorageStatsContract,
} from './multimedia.contract'
import type {
  CreateAssetResponseContract,
  MultimediaAssetContract,
  AssetListResponseContract,
  AssetVariantContract,
  AssetVariantListResponseContract,
  SignedUrlResponseContract,
  StorageBackendContract,
  StorageBackendListResponseContract,
  StorageStatsContract,
} from './multimedia.contract'

@Controller('multimedia')
export class MultimediaController {
  constructor(private readonly service: MultimediaService) {}

  private normalizeListAssetsQuery(query: ListAssetsQueryDto) {
    return {
      assetType: query.assetType,
      tags: Array.isArray(query.tags) ? query.tags : query.tags ? [query.tags] : undefined,
      linkedEntityId: query.linkedEntityId,
      limit: query.limit == null ? undefined : Number(query.limit),
    }
  }

  // ============ 资产 ============
  @Post('assets')
  @HttpCode(HttpStatus.CREATED)
  async createAsset(@Body() body: CreateAssetDto): Promise<CreateAssetResponseContract> {
    const result = await this.service.createAsset(body)
    return toCreateAssetResponseContract(result.asset, result.isDuplicate)
  }

  @Post('assets/:id/complete')
  @HttpCode(HttpStatus.OK)
  async completeUpload(@Param('id') id: string, @Body() body: CompleteUploadDto): Promise<MultimediaAssetContract> {
    return toMultimediaAssetContract(await this.service.completeUpload(id, body))
  }

  @Get('assets')
  async listAssets(
    @Query() query: ListAssetsQueryDto = {},
  ): Promise<AssetListResponseContract> {
    const items = await this.service.listAssets(this.normalizeListAssetsQuery(query))
    return toAssetListResponseContract(items)
  }

  @Get('assets/:id')
  async getAsset(@Param('id') id: string): Promise<MultimediaAssetContract> {
    return toMultimediaAssetContract(await this.service.getAsset(id))
  }

  @Delete('assets/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAsset(@Param('id') id: string) { await this.service.deleteAsset(id) }

  // ============ 衍生版本 ============
  @Post('assets/:id/variants')
  @HttpCode(HttpStatus.CREATED)
  async createVariant(@Param('id') id: string, @Body() body: CreateVariantDto): Promise<AssetVariantContract> {
    return toAssetVariantContract(await this.service.createVariant(id, body))
  }

  @Get('assets/:id/variants')
  async listVariants(@Param('id') id: string): Promise<AssetVariantListResponseContract> {
    const items = await this.service.listVariants(id)
    return toAssetVariantListResponseContract(items)
  }

  // ============ 签名 URL ============
  @Post('assets/:id/signed-url')
  @HttpCode(HttpStatus.OK)
  async signedUrl(@Param('id') id: string, @Body() body: GenerateSignedUrlDto): Promise<SignedUrlResponseContract> {
    return this.service.generateSignedUrlForAsset(id, body)
  }

  // ============ 存储后端 ============
  @Post('storage-backends')
  @HttpCode(HttpStatus.CREATED)
  async addBackend(@Body() body: AddStorageBackendDto): Promise<StorageBackendContract> {
    return toStorageBackendContract(await this.service.addStorageBackend(body))
  }

  @Get('storage-backends')
  async listBackends(): Promise<StorageBackendListResponseContract> {
    return toStorageBackendListResponseContract(await this.service.listStorageBackends())
  }

  @Delete('storage-backends/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBackend(@Param('id') id: string) { await this.service.deleteStorageBackend(id) }

  // ============ 统计 ============
  @Get('stats')
  async stats(): Promise<StorageStatsContract> {
    return toStorageStatsContract(await this.service.getStorageStats())
  }
}
