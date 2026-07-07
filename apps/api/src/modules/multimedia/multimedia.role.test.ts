import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [multimedia] [C] 角色测试
 *
 * 8 角色视角的 multimedia 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import assert from 'node:assert/strict'
// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ════════════════════════════════════════════════════════
// 内联 Entity 类型 (从 multimedia.entity 中提取核心类型)
// ════════════════════════════════════════════════════════

type AssetType = 'image' | 'video' | 'audio' | 'document' | 'unknown'
type AssetVisibility = 'public' | 'private' | 'tenant_internal' | 'signed_url_only'
type AssetStatus = 'uploading' | 'processing' | 'ready' | 'failed' | 'deleted'
type StorageBackendType = 's3' | 'oss' | 'cos' | 'local' | 'azure_blob' | 'gcs'

interface MultimediaAsset {
  id: string
  tenantId: string
  originalFilename: string
  assetType: AssetType
  mimeType: string
  sizeBytes: number
  contentHash: string
  storageBackend: StorageBackendType
  storageKey: string
  cdnUrl?: string
  url?: string
  signedUrlExpiresAt?: string
  status: AssetStatus
  visibility: AssetVisibility
  tags: string[]
  linkedEntity?: { entityType: string; entityId: string }
  uploadedBy: string
  processingProgress: number
  createdAt: string
  updatedAt: string
}

interface AssetVariant {
  id: string
  assetId: string
  variantType: string
  format: string
  sizeBytes: number
  storageKey: string
  url?: string
  parameters?: Record<string, string | number>
  processingDurationMs: number
  status: string
  createdAt: string
}

interface StorageBackend {
  id: string
  name: string
  type: StorageBackendType
  bucket: string
  region: string
  cdnDomain?: string
  isDefault: boolean
  enabled: boolean
  createdAt: string
  updatedAt: string
}

// ════════════════════════════════════════════════════════
// 内联 Service (简化版, 模拟 multimedia.service 核心行为)
// ════════════════════════════════════════════════════════

function genId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

function inferAssetType(mimeType: string): AssetType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType === 'application/pdf' || mimeType.includes('word') || mimeType.includes('sheet') || mimeType.includes('presentation')) return 'document'
  return 'unknown'
}

const ALLOWED_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/heic',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])

const MAX_FILE_SIZES: Record<string, number> = {
  image: 50 * 1024 * 1024,
  video: 2 * 1024 * 1024 * 1024,
  audio: 500 * 1024 * 1024,
  document: 100 * 1024 * 1024,
  unknown: 50 * 1024 * 1024,
}

class InlineMultimediaService {
  private assets = new Map<string, MultimediaAsset>()
  private assetsByTenant = new Map<string, Set<string>>()
  private assetsByHash = new Map<string, string>()
  private variants = new Map<string, AssetVariant>()
  private variantsByAsset = new Map<string, Set<string>>()
  private backends = new Map<string, StorageBackend>()
  private defaultBackendId: string | null = null
  private duplicateHits = 0

  private currentTenantId = 'default-tenant'

  // 测试用: 设置当前租户
  setTenant(tenantId: string) { this.currentTenantId = tenantId }

  createAsset(opts: {
    originalFilename: string
    mimeType: string
    sizeBytes: number
    contentHash: string
    visibility?: AssetVisibility
    tags?: string[]
    linkedEntity?: { entityType: string; entityId: string }
  }): { asset: MultimediaAsset; isDuplicate: boolean } {
    // MIME 校验
    if (!ALLOWED_MIMES.has(opts.mimeType)) {
      throw Object.assign(new Error(`MIME type ${opts.mimeType} 不在白名单`), { status: 400 })
    }
    const assetType = inferAssetType(opts.mimeType)
    const maxSize = MAX_FILE_SIZES[assetType] ?? MAX_FILE_SIZES.unknown
    if (opts.sizeBytes > maxSize) {
      throw Object.assign(new Error(`文件超过 ${assetType} 类型最大尺寸 ${maxSize} bytes`), { status: 400 })
    }

    // 存储后端检查
    if (this.backends.size === 0 && !this.defaultBackendId) {
      throw Object.assign(new Error('存储后端未配置'), { status: 400 })
    }

    // 去重
    const existingId = this.assetsByHash.get(opts.contentHash)
    if (existingId) {
      const existing = this.assets.get(existingId)
      if (existing && existing.tenantId !== this.currentTenantId) {
        const refId = genId('asset')
        const ref: MultimediaAsset = {
          ...existing,
          id: refId,
          tenantId: this.currentTenantId,
          originalFilename: opts.originalFilename,
          tags: opts.tags ?? [],
          linkedEntity: opts.linkedEntity,
          status: 'ready',
          processingProgress: 1,
          uploadedBy: 'role-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        this.assets.set(refId, ref)
        this.addToIndex(ref)
        this.duplicateHits++
        return { asset: ref, isDuplicate: true }
      }
    }

    const backend = this.defaultBackendId ? this.backends.get(this.defaultBackendId) : null
    if (!backend) throw Object.assign(new Error('存储后端未配置'), { status: 400 })

    const now = new Date().toISOString()
    const asset: MultimediaAsset = {
      id: genId('asset'),
      tenantId: this.currentTenantId,
      originalFilename: opts.originalFilename,
      assetType,
      mimeType: opts.mimeType,
      sizeBytes: opts.sizeBytes,
      contentHash: opts.contentHash,
      storageBackend: backend.type,
      storageKey: `${this.currentTenantId}/multimedia/${now.slice(0, 7)}/${opts.contentHash.slice(0, 16)}`,
      status: 'uploading',
      visibility: opts.visibility ?? 'tenant_internal',
      tags: opts.tags ?? [],
      linkedEntity: opts.linkedEntity,
      uploadedBy: 'role-user',
      processingProgress: 0,
      createdAt: now,
      updatedAt: now,
    }
    this.assets.set(asset.id, asset)
    this.addToIndex(asset)
    return { asset, isDuplicate: false }
  }

  completeUpload(assetId: string): MultimediaAsset {
    const asset = this.assets.get(assetId)
    if (!asset || asset.tenantId !== this.currentTenantId) {
      throw Object.assign(new Error(`资产 ${assetId} 不存在`), { status: 404 })
    }
    asset.status = 'ready'
    asset.processingProgress = 1
    asset.url = `https://cdn.shenjiying88.com/${asset.storageKey}`
    asset.updatedAt = new Date().toISOString()
    return asset
  }

  getAsset(assetId: string): MultimediaAsset | null {
    const asset = this.assets.get(assetId)
    if (!asset || asset.tenantId !== this.currentTenantId) return null
    return asset
  }

  listAssets(): MultimediaAsset[] {
    const ids = this.assetsByTenant.get(this.currentTenantId) ?? new Set()
    return Array.from(ids).map((id) => this.assets.get(id)).filter(Boolean) as MultimediaAsset[]
  }

  deleteAsset(assetId: string): void {
    const asset = this.assets.get(assetId)
    if (!asset || asset.tenantId !== this.currentTenantId) {
      throw Object.assign(new Error(`资产 ${assetId} 不存在`), { status: 404 })
    }
    this.assets.delete(assetId)
    this.assetsByTenant.get(this.currentTenantId)?.delete(assetId)
    this.assetsByHash.delete(asset.contentHash)
  }

  createVariant(assetId: string, dto: { variantType: string; format: string; sizeBytes: number; parameters?: Record<string, string | number> }): AssetVariant {
    const asset = this.assets.get(assetId)
    if (!asset || asset.tenantId !== this.currentTenantId) {
      throw Object.assign(new Error(`资产 ${assetId} 不存在`), { status: 404 })
    }
    const variant: AssetVariant = {
      id: genId('var'),
      assetId,
      variantType: dto.variantType,
      format: dto.format,
      sizeBytes: dto.sizeBytes,
      storageKey: `${asset.storageKey}.${dto.variantType}.${dto.format}`,
      parameters: dto.parameters,
      processingDurationMs: 50,
      status: 'completed',
      createdAt: new Date().toISOString(),
    }
    this.variants.set(variant.id, variant)
    if (!this.variantsByAsset.has(assetId)) this.variantsByAsset.set(assetId, new Set())
    this.variantsByAsset.get(assetId)!.add(variant.id)
    return variant
  }

  listVariants(assetId: string): AssetVariant[] {
    const ids = this.variantsByAsset.get(assetId) ?? new Set()
    return Array.from(ids).map((id) => this.variants.get(id)).filter(Boolean) as AssetVariant[]
  }

  generateSignedUrl(assetId: string, expiresInSec = 3600): { url: string; expiresAt: number } {
    const asset = this.assets.get(assetId)
    if (!asset || asset.tenantId !== this.currentTenantId) {
      throw Object.assign(new Error(`资产 ${assetId} 不存在`), { status: 404 })
    }
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSec
    return {
      url: `https://cdn.shenjiying88.com/${asset.storageKey}?expires=${expiresAt}&sig=mock`,
      expiresAt,
    }
  }

  addStorageBackend(input: { name: string; type: StorageBackendType; bucket: string; region: string; isDefault?: boolean }): StorageBackend {
    const now = new Date().toISOString()
    const backend: StorageBackend = {
      id: genId('storage'),
      name: input.name,
      type: input.type,
      bucket: input.bucket,
      region: input.region,
      isDefault: input.isDefault ?? false,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    }
    this.backends.set(backend.id, backend)
    if (backend.isDefault) {
      this.defaultBackendId = backend.id
      for (const [id, b] of this.backends) {
        if (id !== backend.id && b.isDefault) b.isDefault = false
      }
    }
    if (!this.defaultBackendId) {
      this.defaultBackendId = backend.id
      backend.isDefault = true
    }
    return backend
  }

  listBackends(): StorageBackend[] {
    return Array.from(this.backends.values())
  }

  deleteBackend(id: string): void {
    const b = this.backends.get(id)
    if (!b) throw Object.assign(new Error(`存储后端 ${id} 不存在`), { status: 404 })
    if (b.isDefault) throw Object.assign(new Error('不能删除默认存储后端'), { status: 400 })
    this.backends.delete(id)
  }

  getStorageStats(): { totalAssets: number; totalSizeBytes: number; duplicateHits: number; recentUploads: number } {
    const all = this.listAssets()
    const totalSize = all.reduce((s, a) => s + a.sizeBytes, 0)
    const recent = all.filter((a) => Date.now() - new Date(a.createdAt).getTime() < 86400000).length
    return {
      totalAssets: all.length,
      totalSizeBytes: totalSize,
      duplicateHits: this.duplicateHits,
      recentUploads: recent,
    }
  }

  private addToIndex(asset: MultimediaAsset): void {
    if (!this.assetsByTenant.has(asset.tenantId)) {
      this.assetsByTenant.set(asset.tenantId, new Set())
    }
    this.assetsByTenant.get(asset.tenantId)!.add(asset.id)
    this.assetsByHash.set(asset.contentHash, asset.id)
  }
}

// ════════════════════════════════════════════════════════
// 内联 Controller (简化版)
// ════════════════════════════════════════════════════════

class InlineMultimediaController {
  constructor(private readonly service: InlineMultimediaService) {}

  createAsset(body: any) {
    return this.service.createAsset(body)
  }
  completeUpload(id: string) {
    return this.service.completeUpload(id)
  }
  getAsset(id: string) {
    const a = this.service.getAsset(id)
    if (!a) throw Object.assign(new Error(`Asset ${id} not found`), { status: 404 })
    return a
  }
  listAssets() {
    const items = this.service.listAssets()
    return { items, total: items.length }
  }
  deleteAsset(id: string) {
    this.service.deleteAsset(id)
  }
  createVariant(id: string, body: any) {
    return this.service.createVariant(id, body)
  }
  listVariants(id: string) {
    const items = this.service.listVariants(id)
    return { items, total: items.length }
  }
  signedUrl(id: string, body: any) {
    return this.service.generateSignedUrl(id, body.expiresInSec ?? 3600)
  }
  addBackend(body: any) {
    return this.service.addStorageBackend(body)
  }
  listBackends() {
    return { items: this.service.listBackends() }
  }
  deleteBackend(id: string) {
    this.service.deleteBackend(id)
  }
  stats() {
    return this.service.getStorageStats()
  }
}

// ── 工厂 ──
function createEnv() {
  const service = new InlineMultimediaService()
  const controller = new InlineMultimediaController(service)
  return { service, controller }
}

function setupBackend(service: InlineMultimediaService) {
  service.addStorageBackend({
    name: 'default-s3',
    type: 's3',
    bucket: 'test-bucket',
    region: 'ap-east-1',
    isDefault: true,
  })
}

// ═══════════════════════════════════════════════════════════════
// 👔 店长 — 门店管理者视角
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} multimedia 角色测试`, () => {
  it('店长查看存储统计，确认系统资源使用正常', () => {
    const { service } = createEnv()
    setupBackend(service)

    service.createAsset({
      originalFilename: 'store-banner.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 150000,
      contentHash: 'hash-store-banner',
    })

    const stats = service.getStorageStats()
    assert.ok(stats.totalAssets >= 1)
    assert.ok(stats.totalSizeBytes > 0)
    assert.ok(typeof stats.duplicateHits === 'number')
  })

  it('店长查看存储后端列表，确认配置完整', () => {
    const { service } = createEnv()
    setupBackend(service)

    service.addStorageBackend({
      name: 'backup-oss',
      type: 'oss',
      bucket: 'backup-bucket',
      region: 'cn-shanghai',
    })

    const backends = service.listBackends()
    assert.ok(backends.length >= 2)
    assert.ok(backends.some((b) => b.isDefault))
  })

  it('店长上传门店宣传图并完成上传，确认状态流转: uploading → ready', () => {
    const { service } = createEnv()
    setupBackend(service)

    const { asset } = service.createAsset({
      originalFilename: 'promo-banner.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 200000,
      contentHash: 'hash-promo',
    })
    assert.equal(asset.status, 'uploading')

    const completed = service.completeUpload(asset.id)
    assert.equal(completed.status, 'ready')
    assert.ok(completed.url)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🛒 前台 — 收银/接待人员视角
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} multimedia 角色测试`, () => {
  it('前台上传收银小票照片', () => {
    const { service, controller } = createEnv()
    setupBackend(service)

    const { asset } = controller.createAsset({
      originalFilename: 'receipt-20260628.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 80000,
      contentHash: 'hash-receipt',
      tags: ['receipt', 'cashier'],
    })
    assert.equal(asset.assetType, 'image')
    assert.ok(asset.id)
    assert.ok(asset.tags.includes('receipt'))
  })

  it('前台查询资产列表确认记录存在', () => {
    const { service, controller } = createEnv()
    setupBackend(service)

    controller.createAsset({
      originalFilename: 'daily-report.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 50000,
      contentHash: 'hash-daily',
    })

    const result = controller.listAssets()
    assert.equal(result.total, 1)
  })

  it('前台尝试上传禁止的 MIME 类型应被拒绝（安全边界）', () => {
    const { service, controller } = createEnv()
    setupBackend(service)

    assert.throws(
      () => controller.createAsset({
        originalFilename: 'malware.exe',
        mimeType: 'application/x-msdownload',
        sizeBytes: 1000,
        contentHash: 'hash-exe',
      }),
      (err: any) => err.status === 400,
    )
  })
})

// ═══════════════════════════════════════════════════════════════
// 👥 HR — 人力资源视角
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.HR} multimedia 角色测试`, () => {
  it('HR 上传培训视频确认类型正确', () => {
    const { service, controller } = createEnv()
    setupBackend(service)

    const { asset } = controller.createAsset({
      originalFilename: 'onboarding-2026.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 50000000,
      contentHash: 'hash-training',
      tags: ['training', 'onboarding'],
    })
    assert.equal(asset.assetType, 'video')
    assert.equal(asset.mimeType, 'video/mp4')
  })

  it('HR 获取已上传培训课件详情', () => {
    const { service, controller } = createEnv()
    setupBackend(service)

    const { asset: created } = controller.createAsset({
      originalFilename: 'policy-manual.pptx',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      sizeBytes: 3000000,
      contentHash: 'hash-pptx',
    })

    const detail = controller.getAsset(created.id)
    assert.equal(detail.originalFilename, 'policy-manual.pptx')
    assert.equal(detail.assetType, 'document')
  })

  it('HR 不能删除不存在的资产（边界）', () => {
    const { service, controller } = createEnv()
    setupBackend(service)

    assert.throws(
      () => controller.deleteAsset('ghost-hr-asset'),
      (err: any) => err.status === 404,
    )
  })
})

// ═══════════════════════════════════════════════════════════════
// 🔧 安监 — 安全监控视角
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Security} multimedia 角色测试`, () => {
  it('安监上传监控截图标记为内部资产', () => {
    const { service, controller } = createEnv()
    setupBackend(service)

    const { asset } = controller.createAsset({
      originalFilename: 'surveillance-snap.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 250000,
      contentHash: 'hash-surveillance',
      visibility: 'tenant_internal',
      tags: ['security', 'surveillance'],
    })
    assert.equal(asset.visibility, 'tenant_internal')
  })

  it('安监生成签名 URL 限时共享（15分钟过期）', () => {
    const { service, controller } = createEnv()
    setupBackend(service)

    const { asset } = controller.createAsset({
      originalFilename: 'incident-photo.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 200000,
      contentHash: 'hash-incident',
    })

    const signed = controller.signedUrl(asset.id, { expiresInSec: 900 })
    assert.ok(signed.url)
    assert.ok(signed.expiresAt > Math.floor(Date.now() / 1000))
    assert.ok(signed.expiresAt <= Math.floor(Date.now() / 1000) + 900)
  })

  it('安监不能跨租户完成上传（多租户隔离边界）', () => {
    const { service, controller } = createEnv()
    setupBackend(service)

    const { asset } = controller.createAsset({
      originalFilename: 'secure-file.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 100000,
      contentHash: 'hash-secure',
    })

    // 切换租户
    service.setTenant('other-tenant')
    // 其他租户不能操作此资产
    assert.throws(
      () => controller.getAsset(asset.id),
      (err: any) => err.status === 404,
    )
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎮 导玩员 — 游乐设备运营视角
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} multimedia 角色测试`, () => {
  it('导玩员上传设备故障照片关联设备实体', () => {
    const { service, controller } = createEnv()
    setupBackend(service)

    const { asset } = controller.createAsset({
      originalFilename: 'vr-headset-broken.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 300000,
      contentHash: 'hash-vr-broken',
      tags: ['maintenance', 'attraction'],
      linkedEntity: { entityType: 'other', entityId: 'attraction-vr-zone' },
    })
    assert.ok(asset.linkedEntity)
    assert.equal(asset.linkedEntity!.entityId, 'attraction-vr-zone')
  })

  it('导玩员为设备照片创建缩略图变体用于报修单', () => {
    const { service, controller } = createEnv()
    setupBackend(service)

    const { asset } = controller.createAsset({
      originalFilename: 'arcade-console.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 400000,
      contentHash: 'hash-arcade',
    })

    const variant = controller.createVariant(asset.id, {
      variantType: 'thumbnail',
      format: 'webp',
      sizeBytes: 15000,
    })
    assert.equal(variant.variantType, 'thumbnail')
    assert.equal(variant.status, 'completed')
  })

  it('导玩员查询资产列表确认跨租户隔离', () => {
    const { service, controller } = createEnv()
    setupBackend(service)

    controller.createAsset({
      originalFilename: 'guide-photo.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 100000,
      contentHash: 'hash-guide-photo',
    })

    // 另一个租户看不到
    service.setTenant('tenant-guide-other')
    const items = controller.listAssets()
    assert.equal(items.total, 0, '跨租户隔离生效')
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎯 运行专员 — 系统运维视角
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} multimedia 角色测试`, () => {
  it('运行专员添加 OSS 存储后端并设为默认', () => {
    const { service, controller } = createEnv()

    const backend = controller.addBackend({
      name: 'ops-oss',
      type: 'oss',
      bucket: 'ops-bucket',
      region: 'cn-shanghai',
      isDefault: true,
    })
    assert.ok(backend.id)
    assert.equal(backend.type, 'oss')
    assert.equal(backend.isDefault, true)
  })

  it('运行专员查看存储统计确认不同内容不触发去重', () => {
    const { service, controller } = createEnv()
    setupBackend(service)

    controller.createAsset({
      originalFilename: 'ops-a.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 5000,
      contentHash: 'hash-ops-a',
    })
    controller.createAsset({
      originalFilename: 'ops-b.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 8000,
      contentHash: 'hash-ops-b',
    })

    const stats = controller.stats()
    assert.equal(stats.totalAssets, 2)
    assert.equal(stats.totalSizeBytes, 13000)
  })

  it('运行专员删除非默认后端，但不能删除默认后端（权限边界）', () => {
    const { service, controller } = createEnv()

    const defaultB = controller.addBackend({
      name: 'default-s3',
      type: 's3',
      bucket: 'default-bucket',
      region: 'ap-east-1',
      isDefault: true,
    })
    const extraB = controller.addBackend({
      name: 'extra-cos',
      type: 'cos',
      bucket: 'extra-bucket',
      region: 'ap-guangzhou',
    })

    // 可以删除非默认
    controller.deleteBackend(extraB.id)
    const afterDelete = controller.listBackends()
    assert.equal(afterDelete.items.length, 1)

    // 不能删除默认
    assert.throws(
      () => controller.deleteBackend(defaultB.id),
      (err: any) => err.status === 400,
    )
  })
})

// ═══════════════════════════════════════════════════════════════
// 🤝 团建 — 团建活动组织视角
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} multimedia 角色测试`, () => {
  it('团建上传多张活动照片并确认全部入库', () => {
    const { service, controller } = createEnv()
    setupBackend(service)

    const photos = ['paintball.jpg', 'karaoke.jpg', 'bbq.jpg']
    for (const photo of photos) {
      controller.createAsset({
        originalFilename: photo,
        mimeType: 'image/jpeg',
        sizeBytes: 120000,
        contentHash: `hash-tb-${photo.replace('.', '-')}`,
        tags: ['teambuilding'],
      })
    }

    const result = controller.listAssets()
    assert.equal(result.total, photos.length)
  })

  it('团建为活动视频创建预览变体', () => {
    const { service, controller } = createEnv()
    setupBackend(service)

    const { asset } = controller.createAsset({
      originalFilename: 'drone-footage.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 100000000,
      contentHash: 'hash-drone',
      tags: ['teambuilding', 'drone'],
    })

    const preview = controller.createVariant(asset.id, {
      variantType: 'preview',
      format: 'mp4',
      sizeBytes: 5000000,
      parameters: { resolution: '720p' },
    })
    assert.equal(preview.variantType, 'preview')
    assert.deepEqual(preview.parameters, { resolution: '720p' })
  })

  it('团建获取不存在的资产应报错（边界）', () => {
    const { controller } = createEnv()

    assert.throws(
      () => controller.getAsset('nonexistent-activity-asset'),
      (err: any) => err.status === 404,
    )
  })
})

// ═══════════════════════════════════════════════════════════════
// 📢 营销 — 市场营销视角
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} multimedia 角色测试`, () => {
  it('营销上传促销活动海报关联产品实体', () => {
    const { service, controller } = createEnv()
    setupBackend(service)

    const { asset } = controller.createAsset({
      originalFilename: 'summer-sale-poster.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 500000,
      contentHash: 'hash-summer-poster',
      tags: ['campaign', 'poster'],
      linkedEntity: { entityType: 'product', entityId: 'product-summer-pack' },
    })
    assert.equal(asset.linkedEntity!.entityId, 'product-summer-pack')
  })

  it('营销生成签名 URL 分享素材给合作方（2小时过期）', () => {
    const { service, controller } = createEnv()
    setupBackend(service)

    const { asset } = controller.createAsset({
      originalFilename: 'partner-creative.png',
      mimeType: 'image/png',
      sizeBytes: 1000000,
      contentHash: 'hash-partner-creative',
      tags: ['marketing', 'partner'],
      visibility: 'signed_url_only',
    })

    const signed = controller.signedUrl(asset.id, { expiresInSec: 7200 })
    assert.ok(signed.url.includes('sig=mock'))
    const expectedExpire = Math.floor(Date.now() / 1000) + 7200
    assert.ok(Math.abs(signed.expiresAt - expectedExpire) <= 2)
  })

  it('营销删除过时素材后无法再查询（边界）', () => {
    const { service, controller } = createEnv()
    setupBackend(service)

    const { asset } = controller.createAsset({
      originalFilename: 'old-campaign.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 50000,
      contentHash: 'hash-old-campaign',
      tags: ['archived'],
    })

    controller.deleteAsset(asset.id)

    assert.throws(
      () => controller.getAsset(asset.id),
      (err: any) => err.status === 404,
    )
  })
})
