/**
 * Phase V23 OSS 文件管理 Controller (V23 Sprint Day 21-22)
 *
 * 完整的 OSS 文件管理端点：
 * - 上传 (初始化 + 完成确认)
 * - 下载 (签名 URL)
 * - 删除 (单文件 + 批量)
 * - 列表 (分页/筛选/排序)
 * - 桶管理
 * - 签名 URL 生成
 * - 存储统计
 */

import {
  Controller, Get, Post, Patch, Delete, Param, Body, HttpCode, HttpStatus, Query, UseGuards,
} from '@nestjs/common'
import { OssService } from './oss.service'
import type {
  InitUploadDto,
  CompleteUploadDto,
  GenerateDownloadUrlDto,
  DeleteFileDto,
  ListFilesQueryDto,
  CreateBucketDto,
  UpdateBucketDto,
  GenerateSignedUrlDto,
} from './oss.dto'
import {
  toOssFileContract,
  toFileListContract,
  toOssBucketContract,
  toInitUploadContract,
  toDownloadUrlContract,
  toOssStorageStatsContract,
} from './oss.contract'
import type {
  OssFileContract,
  FileListContract,
  OssBucketContract,
  InitUploadContract,
  DownloadUrlContract,
  OssStorageStatsContract,
} from './oss.contract'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('oss')
@UseGuards(TenantGuard)
export class OssController {
  constructor(private readonly service: OssService) {}

  // ============ 文件上传 ============

  /**
   * 初始化上传
   * 返回预签名上传 URL, 客户端直接 PUT 到该 URL 完成上传
   */
  @Post('files/init-upload')
  @HttpCode(HttpStatus.OK)
  async initUpload(@Body() body: InitUploadDto): Promise<InitUploadContract> {
    return toInitUploadContract(await this.service.initUpload(body))
  }

  /**
   * 完成上传确认
   * 客户端上传完成后, 调用此接口通知服务端
   */
  @Post('files/:id/complete')
  @HttpCode(HttpStatus.OK)
  async completeUpload(
    @Param('id') id: string,
    @Body() body: CompleteUploadDto,
  ): Promise<OssFileContract> {
    return toOssFileContract(await this.service.completeUpload(id, body))
  }

  // ============ 文件下载 ============

  /**
   * 生成下载 URL
   * 返回预签名下载 URL, 客户端直接 GET 该 URL 下载文件
   */
  @Post('files/:id/download-url')
  @HttpCode(HttpStatus.OK)
  async generateDownloadUrl(
    @Param('id') id: string,
    @Body() body: GenerateDownloadUrlDto = {},
  ): Promise<DownloadUrlContract> {
    return toDownloadUrlContract(await this.service.generateDownloadUrl(id, body))
  }

  // ============ 文件获取 / 列表 ============

  /**
   * 获取单个文件信息
   */
  @Get('files/:id')
  async getFile(@Param('id') id: string): Promise<OssFileContract> {
    return toOssFileContract(await this.service.getFile(id))
  }

  /**
   * 文件列表 (分页 + 筛选 + 排序)
   */
  @Get('files')
  async listFiles(
    @Query() query: ListFilesQueryDto = {},
  ): Promise<FileListContract> {
    const result = await this.service.listFiles(this.normalizeListQuery(query))
    return toFileListContract(result)
  }

  // ============ 文件删除 ============

  /**
   * 删除单个文件
   */
  @Delete('files/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(
    @Param('id') id: string,
    @Body() body: DeleteFileDto = {},
  ) { await this.service.deleteFile(id, body) }

  /**
   * 批量删除文件
   */
  @Delete('files')
  @HttpCode(HttpStatus.OK)
  async deleteFiles(@Body() body: { fileIds: string[] }): Promise<{ deleted: number; failed: number }> {
    return this.service.deleteFiles(body.fileIds)
  }

  // ============ 签名 URL ============

  /**
   * 生成预签名 URL (上传或下载)
   */
  @Post('files/:id/signed-url')
  @HttpCode(HttpStatus.OK)
  async generateSignedUrl(
    @Param('id') id: string,
    @Body() body: GenerateSignedUrlDto,
  ): Promise<{ url: string; expiresAt: number }> {
    return this.service.generateSignedUrl(id, body)
  }

  // ============ 存储桶管理 ============

  /**
   * 创建存储桶
   */
  @Post('buckets')
  @HttpCode(HttpStatus.CREATED)
  async createBucket(@Body() body: CreateBucketDto): Promise<OssBucketContract> {
    return toOssBucketContract(await this.service.createBucket(body))
  }

  /**
   * 获取桶列表
   */
  @Get('buckets')
  async listBuckets(): Promise<OssBucketContract[]> {
    const buckets = await this.service.listBuckets()
    return buckets.map(toOssBucketContract)
  }

  /**
   * 获取单个桶信息
   */
  @Get('buckets/:id')
  async getBucket(@Param('id') id: string): Promise<OssBucketContract> {
    return toOssBucketContract(await this.service.getBucket(id))
  }

  /**
   * 更新桶配置
   */
  @Patch('buckets/:id')
  @HttpCode(HttpStatus.OK)
  async updateBucket(
    @Param('id') id: string,
    @Body() body: UpdateBucketDto,
  ): Promise<OssBucketContract> {
    return toOssBucketContract(await this.service.updateBucket(id, body))
  }

  /**
   * 删除桶
   */
  @Delete('buckets/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBucket(@Param('id') id: string) { await this.service.deleteBucket(id) }

  // ============ 存储统计 ============

  /**
   * 获取存储统计
   */
  @Get('stats')
  async getStats(): Promise<OssStorageStatsContract> {
    return toOssStorageStatsContract(await this.service.getStorageStats())
  }

  // ============ Helper ============

  private normalizeListQuery(query: ListFilesQueryDto) {
    return {
      prefix: query.prefix,
      fileType: query.fileType,
      tags: Array.isArray(query.tags) ? query.tags : query.tags ? [query.tags] : undefined,
      linkedEntityId: query.linkedEntityId,
      status: query.status,
      page: query.page == null ? undefined : Number(query.page),
      pageSize: query.pageSize == null ? undefined : Number(query.pageSize),
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    }
  }
}
