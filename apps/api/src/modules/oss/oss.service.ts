/**
 * Phase V23 OSS 文件管理 Service (V23 Sprint Day 21-22)
 *
 * 核心能力:
 * 1. 文件上传初始化 + 上传完成确认
 * 2. 文件下载 (直链 / 签名 URL)
 * 3. 文件删除 (单文件 / 批量)
 * 4. 文件列表 (分页 / 筛选 / 排序)
 * 5. 多桶管理
 * 6. 签名 URL 生成 (上传 / 下载)
 * 7. 存储统计
 */

import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common'
import { requireTenantContext } from '../../common/context/tenant-context'
import { encryptField, decryptField } from '../ai-model-config/encryption.util'
import {
  OssFile,
  OssBucket,
  OssAccessLog,
  OssProvider,
  OssStorageClass,
  OssFileType,
  generateFileId,
  generateBucketId,
  generateAccessLogId,
  inferFileType,
  buildObjectKey,
  isAllowedMimeType,
  MAX_FILE_SIZES,
  generateSignedUrl,
  verifySignedUrl,
} from './oss.entity'
import type {
  InitUploadDto,
  CompleteUploadDto,
  GenerateDownloadUrlDto,
  DeleteFileDto,
  ListFilesQueryDto,
  CreateBucketDto,
  UpdateBucketDto,
  GenerateSignedUrlDto,
  OssFileResponse,
  FileListResponse,
  BucketResponse,
  InitUploadResponse,
  DownloadUrlResponse,
  StorageStatsResponse,
} from './oss.dto'

@Injectable()
export class OssService {
  /** 文件存储 */
  private readonly files = new Map<string, OssFile>()
  /** tenantId → fileIds */
  private readonly filesByTenant = new Map<string, Set<string>>()
  /** contentHash → fileId (去重) */
  private readonly filesByHash = new Map<string, string>()
  /** tag → fileIds */
  private readonly filesByTag = new Map<string, Set<string>>()
  /** linkedEntity.entityId → fileIds */
  private readonly filesByEntity = new Map<string, Set<string>>()
  /** prefix → fileIds */
  private readonly filesByPrefix = new Map<string, Set<string>>()

  /** 桶存储 */
  private readonly buckets = new Map<string, OssBucket>()
  /** tenantId → bucketIds */
  private readonly bucketsByTenant = new Map<string, Set<string>>()
  /** 默认桶 ID */
  private readonly defaultBucketByTenant = new Map<string, string>()

  /** 访问日志 */
  private readonly accessLogs: OssAccessLog[] = []

  /** 签名密钥 */
  private readonly signedUrlSecret = process.env.OSS_SIGN_SECRET ?? 'mock-oss-sign-secret'

  /** 文件数计数器 */
  private fileCounter = 0
  private totalUploadedBytes = 0

  // ============ 1. 文件上传 ============

  async initUpload(dto: InitUploadDto): Promise<InitUploadResponse> {
    const ctx = requireTenantContext()

    // MIME 校验
    if (!isAllowedMimeType(dto.mimeType)) {
      throw new BadRequestException(`MIME type ${dto.mimeType} 不在白名单`)
    }

    const fileType = inferFileType(dto.mimeType)
    if (dto.sizeBytes > MAX_FILE_SIZES[fileType]) {
      throw new BadRequestException(`文件超过 ${fileType} 类型最大尺寸 ${MAX_FILE_SIZES[fileType]} bytes`)
    }

    // 选择桶
    let bucket: OssBucket | undefined
    if (dto.bucketId) {
      bucket = this.buckets.get(dto.bucketId)
    } else {
      const defaultId = this.defaultBucketByTenant.get(ctx.tenantId)
      if (defaultId) bucket = this.buckets.get(defaultId)
    }

    // 如果没有任何桶则自动创建一个本地模拟桶
    if (!bucket) {
      bucket = this.autoCreateDefaultBucket(ctx.tenantId)
    }

    if (!bucket.enabled) {
      throw new BadRequestException(`存储桶 ${bucket.name} 已禁用`)
    }

    // 去重检查
    const existingFileId = this.filesByHash.get(dto.contentHash)
    if (existingFileId) {
      const existing = this.files.get(existingFileId)
      if (existing && existing.tenantId === ctx.tenantId) {
        // 同租户去重, 返回已存在的文件
        const expiresAt = Math.floor(Date.now() / 1000) + 3600
        const uploadUrl = generateSignedUrl({
          objectKey: existing.objectKey,
          expiresAt,
          secret: this.signedUrlSecret,
          baseUrl: bucket.cdnDomain ? `https://${bucket.cdnDomain}` : undefined,
        })
        return {
          fileId: existing.id,
          objectKey: existing.objectKey,
          uploadUrl,
          expiresAt,
        }
      }
    }

    // 创建文件记录 (uploading 状态)
    const storageClass = dto.storageClass ?? 'standard'
    const objectKey = buildObjectKey(ctx.tenantId, dto.contentHash, dto.originalFilename, dto.prefix)
    const now = new Date().toISOString()

    const file: OssFile = {
      id: generateFileId(),
      tenantId: ctx.tenantId,
      originalFilename: dto.originalFilename,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      etag: '',
      contentHash: dto.contentHash,
      provider: bucket.provider,
      bucket: bucket.name,
      objectKey,
      fileType,
      storageClass,
      status: 'uploading',
      tags: dto.tags ?? [],
      linkedEntity: dto.linkedEntity,
      uploadedBy: ctx.userId ?? 'system',
      createdAt: now,
      updatedAt: now,
    }

    this.files.set(file.id, file)
    this.addToIndexes(file)

    const expiresAt = Math.floor(Date.now() / 1000) + 7200
    const uploadUrl = generateSignedUrl({
      objectKey,
      expiresAt,
      secret: this.signedUrlSecret,
      baseUrl: bucket.cdnDomain ? `https://${bucket.cdnDomain}` : undefined,
    })

    return { fileId: file.id, objectKey, uploadUrl, expiresAt }
  }

  async completeUpload(fileId: string, dto: CompleteUploadDto): Promise<OssFileResponse> {
    const ctx = requireTenantContext()
    const file = await this.getFileRaw(fileId, ctx.tenantId)

    if (file.status !== 'uploading') {
      throw new BadRequestException(`文件 ${fileId} 不在上传中状态, 当前状态: ${file.status}`)
    }

    file.etag = dto.etag
    file.status = 'ready'
    file.updatedAt = new Date().toISOString()

    // 生成 CDN URL
    const bucket = this.findBucketByName(file.bucket, ctx.tenantId)
    if (bucket?.cdnDomain) {
      file.cdnUrl = `https://${bucket.cdnDomain}/${file.objectKey}`
      file.url = file.cdnUrl
    } else {
      file.url = `https://oss.shenjiying88.com/${file.objectKey}`
    }

    this.fileCounter++
    this.totalUploadedBytes += file.sizeBytes
    this.logAccess(fileId, 'upload', ctx.userId ?? 'system')

    return this.toFileResponse(file)
  }

  // ============ 2. 文件查询 ============

  async getFile(fileId: string): Promise<OssFileResponse> {
    const ctx = requireTenantContext()
    const file = await this.getFileRaw(fileId, ctx.tenantId)
    this.logAccess(fileId, 'view', ctx.userId ?? 'system')
    return this.toFileResponse(file)
  }

  async listFiles(query: ListFilesQueryDto = {}): Promise<FileListResponse> {
    const ctx = requireTenantContext()
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 20, 100)

    let all = Array.from(this.filesByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id) => this.files.get(id))
      .filter((f): f is OssFile => f != null)

    // 筛选
    if (query.prefix) {
      all = all.filter((f) => query.prefix != null && f.objectKey.startsWith(query.prefix))
    }
    if (query.fileType) {
      all = all.filter((f) => f.fileType === query.fileType)
    }
    if (query.status) {
      all = all.filter((f) => f.status === query.status)
    }
    if (query.tags) {
      const tagList = Array.isArray(query.tags) ? query.tags : [query.tags]
      all = all.filter((f) => tagList.every((t) => f.tags.includes(t)))
    }
    if (query.linkedEntityId) {
      all = all.filter((f) => f.linkedEntity?.entityId === query.linkedEntityId)
    }

    // 排序
    const sortBy = query.sortBy ?? 'createdAt'
    const sortOrder = query.sortOrder ?? 'desc'
    all.sort((a, b) => {
      let cmp = 0
      if (sortBy === 'createdAt') cmp = a.createdAt.localeCompare(b.createdAt)
      else if (sortBy === 'sizeBytes') cmp = a.sizeBytes - b.sizeBytes
      else if (sortBy === 'originalFilename') cmp = a.originalFilename.localeCompare(b.originalFilename)
      if (sortOrder === 'desc') cmp = -cmp
      return cmp
    })

    const total = all.length
    const offset = (page - 1) * pageSize
    const items = all.slice(offset, offset + pageSize).map((f) => this.toFileResponse(f))

    this.logAccess('batch', 'list', ctx.userId ?? 'system')
    return { items, total, page, pageSize }
  }

  // ============ 3. 文件下载 ============

  async generateDownloadUrl(fileId: string, dto: GenerateDownloadUrlDto = {}): Promise<DownloadUrlResponse> {
    const ctx = requireTenantContext()
    const file = await this.getFileRaw(fileId, ctx.tenantId)

    if (file.status !== 'ready') {
      throw new BadRequestException(`文件 ${fileId} 未就绪, 状态: ${file.status}`)
    }

    const expiresInSec = dto.expiresInSec ?? 3600
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSec

    const bucket = this.findBucketByName(file.bucket, ctx.tenantId)
    const url = generateSignedUrl({
      objectKey: file.objectKey,
      expiresAt,
      secret: this.signedUrlSecret,
      baseUrl: bucket?.cdnDomain ? `https://${bucket.cdnDomain}` : undefined,
    })

    file.signedUrlExpiresAt = new Date(expiresAt * 1000).toISOString()
    this.logAccess(fileId, 'download', ctx.userId ?? 'system')

    return { url, expiresAt, objectKey: file.objectKey }
  }

  // ============ 4. 文件删除 ============

  async deleteFile(fileId: string, dto: DeleteFileDto = {}): Promise<void> {
    const ctx = requireTenantContext()
    const file = await this.getFileRaw(fileId, ctx.tenantId)

    this.files.delete(file.id)
    this.filesByTenant.get(ctx.tenantId)?.delete(file.id)
    this.filesByHash.delete(file.contentHash)

    for (const tag of file.tags) {
      this.filesByTag.get(tag)?.delete(file.id)
    }
    if (file.linkedEntity) {
      this.filesByEntity.get(file.linkedEntity.entityId)?.delete(file.id)
    }

    this.logAccess(fileId, 'delete', ctx.userId ?? 'system')
  }

  async deleteFiles(fileIds: string[]): Promise<{ deleted: number; failed: number }> {
    const ctx = requireTenantContext()
    let deleted = 0
    let failed = 0

    for (const fileId of fileIds) {
      try {
        await this.deleteFile(fileId)
        deleted++
      } catch {
        failed++
      }
    }

    return { deleted, failed }
  }

  // ============ 5. 签名 URL ============

  async generateSignedUrl(fileId: string, dto: GenerateSignedUrlDto): Promise<{ url: string; expiresAt: number }> {
    const ctx = requireTenantContext()
    const file = await this.getFileRaw(fileId, ctx.tenantId)
    const expiresInSec = dto.expiresInSec ?? 3600
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSec

    const bucket = this.findBucketByName(file.bucket, ctx.tenantId)
    const baseUrl = bucket?.cdnDomain ? `https://${bucket.cdnDomain}` : undefined

    const url = generateSignedUrl({
      objectKey: dto.operation === 'upload' ? `${file.objectKey}.tmp` : file.objectKey,
      expiresAt,
      secret: this.signedUrlSecret,
      baseUrl,
    })

    file.signedUrlExpiresAt = new Date(expiresAt * 1000).toISOString()
    this.logAccess(fileId, 'signed_url', ctx.userId ?? 'system')

    return { url, expiresAt }
  }

  verifySignedUrlExternal(objectKey: string, expiresAt: number, signature: string): boolean {
    return verifySignedUrl(objectKey, expiresAt, signature, this.signedUrlSecret)
  }

  // ============ 6. 桶管理 ============

  async createBucket(dto: CreateBucketDto): Promise<BucketResponse> {
    const ctx = requireTenantContext()
    const now = new Date().toISOString()
    const bucket: OssBucket = {
      id: generateBucketId(),
      tenantId: ctx.tenantId,
      name: dto.name,
      provider: dto.provider,
      region: dto.region,
      endpoint: dto.endpoint,
      accessKeyEncrypted: encryptField(dto.accessKey),
      secretKeyEncrypted: encryptField(dto.secretKey),
      cdnDomain: dto.cdnDomain,
      isDefault: dto.isDefault ?? false,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    }

    this.buckets.set(bucket.id, bucket)
    if (!this.bucketsByTenant.has(ctx.tenantId)) {
      this.bucketsByTenant.set(ctx.tenantId, new Set())
    }
    this.bucketsByTenant.get(ctx.tenantId)!.add(bucket.id)

    if (bucket.isDefault) {
      this.defaultBucketByTenant.set(ctx.tenantId, bucket.id)
      // 取消其他默认桶
      for (const [id, b] of this.buckets) {
        if (b.tenantId === ctx.tenantId && id !== bucket.id && b.isDefault) {
          b.isDefault = false
        }
      }
    }

    return this.toBucketResponse(bucket)
  }

  async listBuckets(): Promise<BucketResponse[]> {
    const ctx = requireTenantContext()
    const ids = this.bucketsByTenant.get(ctx.tenantId) ?? new Set()
    return Array.from(ids)
      .map((id) => this.buckets.get(id))
      .filter((b): b is OssBucket => b != null)
      .map((b) => this.toBucketResponse(b))
  }

  async getBucket(bucketId: string): Promise<BucketResponse> {
    const ctx = requireTenantContext()
    const bucket = this.buckets.get(bucketId)
    if (!bucket || bucket.tenantId !== ctx.tenantId) {
      throw new NotFoundException(`存储桶 ${bucketId} 不存在`)
    }
    return this.toBucketResponse(bucket)
  }

  async updateBucket(bucketId: string, dto: UpdateBucketDto): Promise<BucketResponse> {
    const ctx = requireTenantContext()
    const bucket = this.buckets.get(bucketId)
    if (!bucket || bucket.tenantId !== ctx.tenantId) {
      throw new NotFoundException(`存储桶 ${bucketId} 不存在`)
    }

    if (dto.cdnDomain !== undefined) bucket.cdnDomain = dto.cdnDomain
    if (dto.region !== undefined) bucket.region = dto.region
    if (dto.endpoint !== undefined) bucket.endpoint = dto.endpoint
    if (dto.enabled !== undefined) bucket.enabled = dto.enabled
    if (dto.accessKey !== undefined) bucket.accessKeyEncrypted = encryptField(dto.accessKey)
    if (dto.secretKey !== undefined) bucket.secretKeyEncrypted = encryptField(dto.secretKey)

    if (dto.isDefault === true) {
      this.defaultBucketByTenant.set(ctx.tenantId, bucket.id)
      bucket.isDefault = true
      for (const [id, b] of this.buckets) {
        if (b.tenantId === ctx.tenantId && id !== bucket.id && b.isDefault) {
          b.isDefault = false
        }
      }
    }

    bucket.updatedAt = new Date().toISOString()
    return this.toBucketResponse(bucket)
  }

  async deleteBucket(bucketId: string): Promise<void> {
    const ctx = requireTenantContext()
    const bucket = this.buckets.get(bucketId)
    if (!bucket || bucket.tenantId !== ctx.tenantId) {
      throw new NotFoundException(`存储桶 ${bucketId} 不存在`)
    }
    if (bucket.isDefault) {
      throw new BadRequestException('不能删除默认存储桶')
    }
    this.buckets.delete(bucketId)
    this.bucketsByTenant.get(ctx.tenantId)?.delete(bucketId)
  }

  // ============ 7. 存储统计 ============

  async getStorageStats(): Promise<StorageStatsResponse> {
    const ctx = requireTenantContext()
    const all = Array.from(this.filesByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id) => this.files.get(id))
      .filter((f): f is OssFile => f != null)

    const totalSizeBytes = all.reduce((s, f) => s + f.sizeBytes, 0)

    const byType: Record<string, { count: number; sizeBytes: number }> = {}
    const byStorageClass: Record<string, { count: number; sizeBytes: number }> = {}

    for (const f of all) {
      if (!byType[f.fileType]) byType[f.fileType] = { count: 0, sizeBytes: 0 }
      byType[f.fileType].count++
      byType[f.fileType].sizeBytes += f.sizeBytes

      if (!byStorageClass[f.storageClass]) byStorageClass[f.storageClass] = { count: 0, sizeBytes: 0 }
      byStorageClass[f.storageClass].count++
      byStorageClass[f.storageClass].sizeBytes += f.sizeBytes
    }

    const recentUploads = all.filter((f) =>
      Date.now() - new Date(f.createdAt).getTime() < 24 * 60 * 60 * 1000,
    ).length

    const topFiles = [...all]
      .sort((a, b) => b.sizeBytes - a.sizeBytes)
      .slice(0, 10)
      .map((f) => ({
        id: f.id,
        originalFilename: f.originalFilename,
        sizeBytes: f.sizeBytes,
      }))

    return { totalFiles: all.length, totalSizeBytes, byType, byStorageClass, recentUploads, topFiles }
  }

  // ============ Helper ============

  private async getFileRaw(fileId: string, tenantId: string): Promise<OssFile> {
    const file = this.files.get(fileId)
    if (!file || file.tenantId !== tenantId) {
      throw new NotFoundException(`文件 ${fileId} 不存在`)
    }
    return file
  }

  private addToIndexes(file: OssFile): void {
    if (!this.filesByTenant.has(file.tenantId)) {
      this.filesByTenant.set(file.tenantId, new Set())
    }
    this.filesByTenant.get(file.tenantId)!.add(file.id)
    this.filesByHash.set(file.contentHash, file.id)

    for (const tag of file.tags) {
      if (!this.filesByTag.has(tag)) this.filesByTag.set(tag, new Set())
      this.filesByTag.get(tag)!.add(file.id)
    }

    if (file.linkedEntity) {
      const key = file.linkedEntity.entityId
      if (!this.filesByEntity.has(key)) this.filesByEntity.set(key, new Set())
      this.filesByEntity.get(key)!.add(file.id)
    }

    // prefix 索引
    const parts = file.objectKey.split('/')
    for (let i = 1; i <= parts.length; i++) {
      const prefix = parts.slice(0, i).join('/')
      if (!this.filesByPrefix.has(prefix)) this.filesByPrefix.set(prefix, new Set())
      this.filesByPrefix.get(prefix)!.add(file.id)
    }
  }

  private findBucketByName(name: string, tenantId: string): OssBucket | undefined {
    for (const b of this.buckets.values()) {
      if (b.name === name && b.tenantId === tenantId) return b
    }
    return undefined
  }

  private autoCreateDefaultBucket(tenantId: string): OssBucket {
    const existing = this.defaultBucketByTenant.get(tenantId)
    if (existing && this.buckets.has(existing)) return this.buckets.get(existing)!

    const now = new Date().toISOString()
    const bucket: OssBucket = {
      id: generateBucketId(),
      tenantId,
      name: `shenjiying-oss-${tenantId.slice(0, 8)}`,
      provider: 'aliyun',
      region: 'cn-hangzhou',
      endpoint: 'oss-cn-hangzhou.aliyuncs.com',
      accessKeyEncrypted: encryptField('auto-access-key'),
      secretKeyEncrypted: encryptField('auto-secret-key'),
      isDefault: true,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    }

    this.buckets.set(bucket.id, bucket)
    if (!this.bucketsByTenant.has(tenantId)) {
      this.bucketsByTenant.set(tenantId, new Set())
    }
    this.bucketsByTenant.get(tenantId)!.add(bucket.id)
    this.defaultBucketByTenant.set(tenantId, bucket.id)

    return bucket
  }

  private logAccess(fileId: string, action: OssAccessLog['action'], accessor: string): void {
    this.accessLogs.push({
      id: generateAccessLogId(),
      fileId,
      tenantId: this.files.get(fileId)?.tenantId ?? 'unknown',
      action,
      accessor,
      accessedAt: new Date().toISOString(),
    })
  }

  private toFileResponse(f: OssFile): OssFileResponse {
    return {
      id: f.id,
      tenantId: f.tenantId,
      originalFilename: f.originalFilename,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes,
      etag: f.etag,
      contentHash: f.contentHash,
      provider: f.provider,
      bucket: f.bucket,
      objectKey: f.objectKey,
      cdnUrl: f.cdnUrl,
      url: f.url,
      fileType: f.fileType,
      storageClass: f.storageClass,
      status: f.status,
      tags: f.tags,
      linkedEntity: f.linkedEntity,
      uploadedBy: f.uploadedBy,
      errorMessage: f.errorMessage,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }
  }

  private toBucketResponse(b: OssBucket): BucketResponse {
    return {
      id: b.id,
      tenantId: b.tenantId,
      name: b.name,
      provider: b.provider,
      region: b.region,
      endpoint: b.endpoint,
      cdnDomain: b.cdnDomain,
      isDefault: b.isDefault,
      enabled: b.enabled,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }
  }

  // ============ 测试用 ============

  countFiles(): number { return this.files.size }
  countBuckets(): number { return this.buckets.size }
  getAccessLogsForTesting(): OssAccessLog[] { return this.accessLogs }
  decryptBucketKeysForTesting(bucket: BucketResponse): { accessKey: string; secretKey: string } {
    const b = this.buckets.get(bucket.id)
    if (!b) throw new NotFoundException()
    return {
      accessKey: decryptField(b.accessKeyEncrypted),
      secretKey: decryptField(b.secretKeyEncrypted),
    }
  }
}
