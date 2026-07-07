/**
 * Phase 99 多模态存储 Service (V11 Sprint 3 Day 31-32)
 *
 * 核心能力:
 * 1. 资产上传 + 内容寻址 (content hash 去重)
 * 2. 衍生版本 (thumbnail, transcoded, ocr text 等)
 * 3. 多存储后端 (S3/OSS/Local)
 * 4. 签名 URL 生成 + 验证
 * 5. 标签检索 + 关联业务实体
 * 6. 存储统计
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { requireTenantContext } from '../../common/context/tenant-context'
import { encryptField, decryptField } from '../ai-model-config/encryption.util'
import {
  MultimediaAsset,
  AssetVariant,
  StorageBackend,
  AssetAccessLog,
  AssetType,
  StorageBackendType,
  generateAssetId,
  generateVariantId,
  generateBackendId,
  generateAccessLogId,
  inferAssetType,
  buildStorageKey,
  isAllowedMimeType,
  MAX_FILE_SIZES,
  generateSignedUrl,
  verifySignedUrl,
} from './multimedia.entity'
import type {
  CreateAssetDto,
  CompleteUploadDto,
  CreateVariantDto,
  AddStorageBackendDto,
  GenerateSignedUrlDto,
  AssetResponse,
  StorageStatsResponse,
} from './multimedia.dto'

@Injectable()
export class MultimediaService {
  /** 资产存储 */
  private readonly assets = new Map<string, MultimediaAsset>()
  /** tenantId → assetIds */
  private readonly assetsByTenant = new Map<string, Set<string>>()
  /** contentHash → assetId (去重) */
  private readonly assetsByHash = new Map<string, string>()
  /** tag → assetIds (倒排索引) */
  private readonly assetsByTag = new Map<string, Set<string>>()
  /** linkedEntity.entityId → assetIds */
  private readonly assetsByEntity = new Map<string, Set<string>>()

  /** 衍生版本 */
  private readonly variants = new Map<string, AssetVariant>()
  /** assetId → variantIds */
  private readonly variantsByAsset = new Map<string, Set<string>>()

  /** 存储后端 */
  private readonly storageBackends = new Map<string, StorageBackend>()
  /** 默认后端 ID */
  private defaultBackendId: string | null = null

  /** 访问日志 */
  private readonly accessLogs: AssetAccessLog[] = []
  /** 重复命中计数 */
  private duplicateHitCount = 0

  /** 签名 URL 密钥 (生产用 KMS) */
  private readonly signedUrlSecret = process.env.MULTIMEDIA_SIGN_SECRET ?? 'mock-multimedia-sign-secret'

  // ============ 1. 资产上传 (含去重) ============

  async createAsset(dto: CreateAssetDto): Promise<{ asset: MultimediaAsset; isDuplicate: boolean }> {
    const ctx = requireTenantContext()
    // 1. MIME 校验
    if (!isAllowedMimeType(dto.mimeType)) {
      throw new BadRequestException(`MIME type ${dto.mimeType} 不在白名单`)
    }
    const assetType = inferAssetType(dto.mimeType)
    if (dto.sizeBytes > MAX_FILE_SIZES[assetType]) {
      throw new BadRequestException(`文件超过 ${assetType} 类型最大尺寸 ${MAX_FILE_SIZES[assetType]} bytes`)
    }
    // 2. 去重检查 (contentHash 全局去重)
    const existingAssetId = this.assetsByHash.get(dto.contentHash)
    if (existingAssetId) {
      const existing = this.assets.get(existingAssetId)
      if (existing) {
        if (existing.tenantId !== ctx.tenantId) {
          // 跨租户复用: 创建引用 (关联到本租户)
          const refId = generateAssetId()
          const ref: MultimediaAsset = {
            ...existing,
            id: refId,
            tenantId: ctx.tenantId,
            originalFilename: dto.originalFilename,
            tags: dto.tags ?? [],
            linkedEntity: dto.linkedEntity,
            status: 'ready',
            processingProgress: 1.0,
            uploadedBy: ctx.userId ?? 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          this.assets.set(refId, ref)
          this.addToIndexes(ref)
          this.duplicateHitCount++
          this.logAccess(refId, 'view', ctx.userId ?? 'system')
          return { asset: ref, isDuplicate: true }
        }
        // 同租户去重: 直接返回已存在的资产
        this.duplicateHitCount++
        this.logAccess(existingAssetId, 'view', ctx.userId ?? 'system')
        return { asset: existing, isDuplicate: true }
      }
    }

    // 3. 选择存储后端
    const backend = dto.storageBackendId
      ? this.storageBackends.get(dto.storageBackendId)
      : this.storageBackends.get(this.defaultBackendId ?? '')
    if (!backend) {
      throw new BadRequestException('存储后端未配置')
    }

    // 4. 创建资产 (uploading 状态)
    const now = new Date().toISOString()
    const storageKey = buildStorageKey(ctx.tenantId, dto.contentHash, dto.originalFilename)
    const asset: MultimediaAsset = {
      id: generateAssetId(),
      tenantId: ctx.tenantId,
      originalFilename: dto.originalFilename,
      assetType,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      contentHash: dto.contentHash,
      storageBackend: backend.type,
      storageKey,
      status: 'uploading',
      visibility: dto.visibility ?? 'tenant_internal',
      tags: dto.tags ?? [],
      linkedEntity: dto.linkedEntity,
      uploadedBy: ctx.userId ?? 'system',
      processingProgress: 0,
      createdAt: now,
      updatedAt: now,
    }
    this.assets.set(asset.id, asset)
    this.addToIndexes(asset)
    return { asset, isDuplicate: false }
  }

  async completeUpload(assetId: string, dto: CompleteUploadDto = {}): Promise<MultimediaAsset> {
    const ctx = requireTenantContext()
    const asset = await this.getAssetRaw(assetId, ctx.tenantId)
    // 模拟处理进度
    asset.status = 'processing'
    asset.processingProgress = 0.5
    asset.updatedAt = new Date().toISOString()
    // 生成 cdnUrl
    const backend = this.getBackendByType(asset.storageBackend)
    if (backend?.cdnDomain) {
      asset.cdnUrl = `https://${backend.cdnDomain}/${asset.storageKey}`
      asset.url = asset.cdnUrl
    } else {
      asset.url = `https://cdn.shenjiying88.com/${asset.storageKey}`
    }
    // 处理完成
    asset.status = 'ready'
    asset.processingProgress = 1.0
    asset.updatedAt = new Date().toISOString()
    return asset
  }

  async getAsset(assetId: string): Promise<AssetResponse> {
    const ctx = requireTenantContext()
    const asset = await this.getAssetRaw(assetId, ctx.tenantId)
    this.logAccess(assetId, 'view', ctx.userId ?? 'system')
    return this.toAssetResponse(asset)
  }

  async listAssets(opts: {
    assetType?: AssetType
    tags?: string[]
    linkedEntityType?: string
    linkedEntityId?: string
    limit?: number
  } = {}): Promise<AssetResponse[]> {
    const ctx = requireTenantContext()
    const all = Array.from(this.assetsByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id: string) => this.assets.get(id))
      .filter((a): a is MultimediaAsset => a != null)
    let filtered = all
    if (opts.assetType) filtered = filtered.filter((a) => a.assetType === opts.assetType)
    if (opts.tags?.length) {
      filtered = filtered.filter((a) => opts.tags!.every((t) => a.tags.includes(t)))
    }
    if (opts.linkedEntityId) {
      filtered = filtered.filter((a) => a.linkedEntity?.entityId === opts.linkedEntityId)
    }
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const limit = opts.limit ?? 50
    return filtered.slice(0, limit).map((a) => this.toAssetResponse(a))
  }

  async deleteAsset(assetId: string): Promise<void> {
    const ctx = requireTenantContext()
    const asset = await this.getAssetRaw(assetId, ctx.tenantId)
    this.assets.delete(asset.id)
    this.assetsByTenant.get(ctx.tenantId)?.delete(asset.id)
    this.assetsByHash.delete(asset.contentHash)
    for (const tag of asset.tags) {
      this.assetsByTag.get(tag)?.delete(asset.id)
    }
    if (asset.linkedEntity) {
      this.assetsByEntity.get(asset.linkedEntity.entityId)?.delete(asset.id)
    }
    // 关联 variants
    const variants = this.variantsByAsset.get(assetId) ?? new Set()
    for (const vId of variants) {
      this.variants.delete(vId)
    }
    this.variantsByAsset.delete(assetId)
    this.logAccess(assetId, 'deleted', ctx.userId ?? 'system')
  }

  // ============ 2. 衍生版本 ============

  async createVariant(assetId: string, dto: CreateVariantDto): Promise<AssetVariant> {
    const ctx = requireTenantContext()
    const asset = await this.getAssetRaw(assetId, ctx.tenantId)
    const start = Date.now()
    // 模拟处理
    const variant: AssetVariant = {
      id: generateVariantId(),
      assetId: asset.id,
      variantType: dto.variantType,
      format: dto.format,
      sizeBytes: dto.sizeBytes,
      storageKey: `${asset.storageKey}.${dto.variantType}.${dto.format}`,
      parameters: dto.parameters,
      processingDurationMs: Date.now() - start + 50, // 模拟
      status: 'completed',
      createdAt: new Date().toISOString(),
    }
    this.variants.set(variant.id, variant)
    if (!this.variantsByAsset.has(assetId)) {
      this.variantsByAsset.set(assetId, new Set())
    }
    this.variantsByAsset.get(assetId)!.add(variant.id)
    return variant
  }

  async listVariants(assetId: string): Promise<AssetVariant[]> {
    const ctx = requireTenantContext()
    await this.getAssetRaw(assetId, ctx.tenantId)
    const ids = this.variantsByAsset.get(assetId) ?? new Set()
    return Array.from(ids)
      .map((id) => this.variants.get(id))
      .filter((v): v is AssetVariant => v != null)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  // ============ 3. 签名 URL ============

  async generateSignedUrlForAsset(assetId: string, dto: GenerateSignedUrlDto = {}): Promise<{ url: string; expiresAt: number }> {
    const ctx = requireTenantContext()
    const asset = await this.getAssetRaw(assetId, ctx.tenantId)
    const variant = dto.variantId
      ? await this.getVariantRaw(assetId, dto.variantId, ctx.tenantId)
      : null
    const expiresInSec = dto.expiresInSec ?? 3600
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSec
    const url = generateSignedUrl({
      storageKey: variant?.storageKey ?? asset.storageKey,
      expiresAt,
      secret: this.signedUrlSecret,
      baseUrl: this.getSignedUrlBaseOrigin(variant?.url ?? asset.cdnUrl ?? asset.url),
    })
    asset.signedUrlExpiresAt = new Date(expiresAt * 1000).toISOString()
    if (variant) {
      this.logAccess(assetId, 'variant_accessed', ctx.userId ?? 'system')
    }
    this.logAccess(assetId, 'signed_url_generated', ctx.userId ?? 'system')
    return { url, expiresAt }
  }

  verifySignedUrlExternal(url: string, expiresAt: number, signature: string): boolean {
    return verifySignedUrl(url, expiresAt, signature, this.signedUrlSecret)
  }

  // ============ 4. 存储后端管理 ============

  async addStorageBackend(dto: AddStorageBackendDto): Promise<StorageBackend> {
    const now = new Date().toISOString()
    const backend: StorageBackend = {
      id: generateBackendId(),
      name: dto.name,
      type: dto.type,
      bucket: dto.bucket,
      region: dto.region,
      endpoint: dto.endpoint,
      credentialsEncrypted: encryptField(dto.credentials),
      cdnDomain: dto.cdnDomain,
      isDefault: dto.isDefault ?? false,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    }
    this.storageBackends.set(backend.id, backend)
    if (backend.isDefault) {
      this.defaultBackendId = backend.id
      for (const [id, b] of this.storageBackends) {
        if (id !== backend.id && b.isDefault) {
          b.isDefault = false
        }
      }
    }
    if (!this.defaultBackendId) {
      this.defaultBackendId = backend.id
      backend.isDefault = true
    }
    return backend
  }

  async listStorageBackends(): Promise<StorageBackend[]> {
    return Array.from(this.storageBackends.values())
  }

  async deleteStorageBackend(id: string): Promise<void> {
    const backend = this.storageBackends.get(id)
    if (!backend) throw new NotFoundException(`存储后端 ${id} 不存在`)
    if (backend.isDefault) throw new BadRequestException('不能删除默认存储后端')
    this.storageBackends.delete(id)
  }

  // ============ 5. 统计 ============

  async getStorageStats(): Promise<StorageStatsResponse> {
    const ctx = requireTenantContext()
    const all: MultimediaAsset[] = Array.from(this.assetsByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id: string) => this.assets.get(id))
      .filter((a): a is MultimediaAsset => a != null)
    const totalSize = all.reduce((s: number, a: MultimediaAsset) => s + a.sizeBytes, 0)
    const byType: Record<string, { count: number; sizeBytes: number }> = {}
    for (const a of all) {
      if (!byType[a.assetType]) byType[a.assetType] = { count: 0, sizeBytes: 0 }
      byType[a.assetType].count++
      byType[a.assetType].sizeBytes += a.sizeBytes
    }
    const recentUploads = all.filter((a: MultimediaAsset) =>
      Date.now() - new Date(a.createdAt).getTime() < 24 * 60 * 60 * 1000,
    ).length
    // 平均处理时间 (从 variants 计算)
    const allVariants: AssetVariant[] = []
    for (const a of all) {
      const vIds = this.variantsByAsset.get(a.id) ?? new Set()
      for (const vId of vIds) {
        const v = this.variants.get(vId)
        if (v) allVariants.push(v)
      }
    }
    const avgProcessingTimeMs = allVariants.length > 0
      ? allVariants.reduce((s, v) => s + v.processingDurationMs, 0) / allVariants.length
      : 0

    return {
      totalAssets: all.length,
      totalSizeBytes: totalSize,
      byType,
      recentUploads,
      avgProcessingTimeMs,
      duplicateHits: this.duplicateHitCount,
    }
  }

  // ============ 6. 工具方法 ============

  countAssets(): number { return this.assets.size }
  countVariants(): number { return this.variants.size }
  countStorageBackends(): number { return this.storageBackends.size }

  // ============ Helper ============

  private async getAssetRaw(assetId: string, tenantId: string): Promise<MultimediaAsset> {
    const asset = this.assets.get(assetId)
    if (!asset || asset.tenantId !== tenantId) {
      throw new NotFoundException(`资产 ${assetId} 不存在`)
    }
    return asset
  }

  private async getVariantRaw(assetId: string, variantId: string, tenantId: string): Promise<AssetVariant> {
    await this.getAssetRaw(assetId, tenantId)
    const variant = this.variants.get(variantId)
    if (!variant || variant.assetId !== assetId) {
      throw new NotFoundException(`变体 ${variantId} 不存在`)
    }
    return variant
  }

  private addToIndexes(asset: MultimediaAsset): void {
    if (!this.assetsByTenant.has(asset.tenantId)) {
      this.assetsByTenant.set(asset.tenantId, new Set())
    }
    this.assetsByTenant.get(asset.tenantId)!.add(asset.id)
    this.assetsByHash.set(asset.contentHash, asset.id)
    for (const tag of asset.tags) {
      if (!this.assetsByTag.has(tag)) this.assetsByTag.set(tag, new Set())
      this.assetsByTag.get(tag)!.add(asset.id)
    }
    if (asset.linkedEntity) {
      const key = asset.linkedEntity.entityId
      if (!this.assetsByEntity.has(key)) this.assetsByEntity.set(key, new Set())
      this.assetsByEntity.get(key)!.add(asset.id)
    }
  }

  private getBackendByType(type: StorageBackendType): StorageBackend | null {
    for (const b of this.storageBackends.values()) {
      if (b.type === type && b.enabled) return b
    }
    return null
  }

  private getSignedUrlBaseOrigin(candidate?: string): string | undefined {
    if (!candidate) {
      return undefined
    }
    try {
      return new URL(candidate).origin
    } catch {
      return undefined
    }
  }

  private logAccess(assetId: string, accessType: AssetAccessLog['accessType'], accessor: string): void {
    this.accessLogs.push({
      id: generateAccessLogId(),
      assetId,
      tenantId: this.assets.get(assetId)?.tenantId ?? 'unknown',
      accessType,
      accessor,
      accessedAt: new Date().toISOString(),
    })
  }

  private toAssetResponse(a: MultimediaAsset): AssetResponse {
    return {
      id: a.id,
      tenantId: a.tenantId,
      originalFilename: a.originalFilename,
      assetType: a.assetType,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      contentHash: a.contentHash,
      storageBackend: a.storageBackend,
      storageKey: a.storageKey,
      cdnUrl: a.cdnUrl,
      url: a.url,
      signedUrlExpiresAt: a.signedUrlExpiresAt,
      status: a.status,
      visibility: a.visibility,
      dimensions: a.dimensions,
      tags: a.tags,
      linkedEntity: a.linkedEntity,
      uploadedBy: a.uploadedBy,
      processingProgress: a.processingProgress,
      errorMessage: a.errorMessage,
      variantCount: this.variantsByAsset.get(a.id)?.size ?? 0,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }
  }

  // 测试用
  decryptBackendCredentialsForTesting(backend: StorageBackend): string {
    return decryptField(backend.credentialsEncrypted)
  }
  getAccessLogsForTesting(): AssetAccessLog[] { return this.accessLogs }
}
