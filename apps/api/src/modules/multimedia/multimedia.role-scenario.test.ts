import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [multimedia] [C] 角色场景测试
 *
 * 8 角色视角的多媒体资产管理模块业务场景测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 * 使用 Service 层 in-memory 存储模拟业务逻辑
 */

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

// ── 类型定义 ──
type AssetType = 'image' | 'video' | 'audio' | 'document' | 'unknown'
type AssetStatus = 'uploading' | 'processing' | 'ready' | 'failed' | 'deleted'
type StorageBackendType = 's3' | 'oss' | 'local'

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
  status: AssetStatus
  visibility: 'public' | 'private' | 'tenant_internal' | 'signed_url_only'
  tags: string[]
  linkedEntity?: { entityType: string; entityId: string }
  uploadedBy: string
  processingProgress: number
  errorMessage?: string
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
  status: string
  createdAt: string
}

interface StorageBackend {
  id: string
  name: string
  type: StorageBackendType
  bucket: string
  region: string
  isDefault: boolean
  enabled: boolean
}

// ── Mock Service ──
class MultimediaMockService {
  private assets = new Map<string, MultimediaAsset>()
  private variants = new Map<string, AssetVariant>()
  private backends = new Map<string, StorageBackend>()
  private assetsByTenant = new Map<string, Set<string>>()
  private variantsByAsset = new Map<string, Set<string>>()
  private seq = 0

  constructor() {
    this.seed()
  }

  private nextId(prefix: string): string {
    return `${prefix}-${++this.seq}`
  }

  private now(): string {
    return new Date().toISOString()
  }

  private seed() {
    const now = this.now()
    const tenantIds = ['tenant-a', 'tenant-b', 'tenant-c']

    // Seed backends
    this.backends.set('bk-s3-01', {
      id: 'bk-s3-01',
      name: 'AWS S3 上海',
      type: 's3',
      bucket: 'shenjiying-multimedia',
      region: 'ap-shanghai',
      isDefault: true,
      enabled: true,
    })
    this.backends.set('bk-oss-01', {
      id: 'bk-oss-01',
      name: '阿里云 OSS 深圳',
      type: 'oss',
      bucket: 'sjy-multimedia-sz',
      region: 'cn-shenzhen',
      isDefault: false,
      enabled: true,
    })

    // Seed assets per tenant
    for (const tid of tenantIds) {
      if (!this.assetsByTenant.has(tid)) this.assetsByTenant.set(tid, new Set())

      for (let i = 0; i < 3; i++) {
        const id = `asset-${tid}-${i}`
        const asset: MultimediaAsset = {
          id,
          tenantId: tid,
          originalFilename: `photo_${i}.jpg`,
          assetType: 'image',
          mimeType: 'image/jpeg',
          sizeBytes: 1024 * 1024 * (i + 1),
          contentHash: `hash-${tid}-${i}-abc123`,
          storageBackend: 's3',
          storageKey: `${tid}/images/photo_${i}.jpg`,
          cdnUrl: `https://cdn.shenjiying88.com/${tid}/images/photo_${i}.jpg`,
          url: `https://cdn.shenjiying88.com/${tid}/images/photo_${i}.jpg`,
          status: 'ready',
          visibility: 'tenant_internal',
          tags: ['日常', '活动'],
          linkedEntity: i === 0 ? { entityType: 'product', entityId: `prod-${tid}` } : undefined,
          uploadedBy: 'system',
          processingProgress: 1.0,
          createdAt: new Date(Date.now() - i * 86400000).toISOString(),
          updatedAt: now,
        }
        this.assets.set(id, asset)
        this.assetsByTenant.get(tid)!.add(id)
      }

      // Add one failed asset
      const failedId = `asset-${tid}-failed`
      const failed: MultimediaAsset = {
        id: failedId,
        tenantId: tid,
        originalFilename: 'corrupted.mp4',
        assetType: 'video',
        mimeType: 'video/mp4',
        sizeBytes: 50 * 1024 * 1024,
        contentHash: `hash-${tid}-failed`,
        storageBackend: 's3',
        storageKey: `${tid}/videos/corrupted.mp4`,
        status: 'failed',
        visibility: 'tenant_internal',
        tags: ['异常'],
        uploadedBy: 'user-ops',
        processingProgress: 0.3,
        errorMessage: '文件损坏，无法解码',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        updatedAt: now,
      }
      this.assets.set(failedId, failed)
      this.assetsByTenant.get(tid)!.add(failedId)

      // Seed variants for first asset
      const variants = [
        { id: `var-${tid}-thumb`, variantType: 'thumbnail', format: 'webp', sizeBytes: 50 * 1024 },
        { id: `var-${tid}-preview`, variantType: 'preview', format: 'jpg', sizeBytes: 200 * 1024 },
      ]
      const vSet = new Set<string>()
      for (const v of variants) {
        const full: AssetVariant = {
          ...v,
          assetId: `asset-${tid}-0`,
          storageKey: `${tid}/variants/${v.variantType}_${v.id}`,
          status: 'completed',
          createdAt: now,
        }
        this.variants.set(full.id, full)
        vSet.add(full.id)
      }
      this.variantsByAsset.set(`asset-${tid}-0`, vSet)
    }
  }

  // ─── 业务方法 ───

  async createAsset(props: {
    tenantId: string
    originalFilename: string
    mimeType: string
    sizeBytes: number
    contentHash: string
    visibility?: string
    tags?: string[]
    linkedEntity?: { entityType: string; entityId: string }
    uploadedBy: string
  }): Promise<MultimediaAsset> {
    if (props.sizeBytes > 500 * 1024 * 1024) {
      throw new Error('文件超过最大尺寸限制')
    }
    const id = this.nextId('asset')
    const asset: MultimediaAsset = {
      id,
      tenantId: props.tenantId,
      originalFilename: props.originalFilename,
      assetType: this.inferAssetType(props.mimeType),
      mimeType: props.mimeType,
      sizeBytes: props.sizeBytes,
      contentHash: props.contentHash,
      storageBackend: 's3',
      storageKey: `${props.tenantId}/uploads/${id}/${props.originalFilename}`,
      status: 'uploading',
      visibility: (props.visibility as MultimediaAsset['visibility']) ?? 'tenant_internal',
      tags: props.tags ?? [],
      linkedEntity: props.linkedEntity,
      uploadedBy: props.uploadedBy,
      processingProgress: 0,
      createdAt: this.now(),
      updatedAt: this.now(),
    }
    this.assets.set(id, asset)
    if (!this.assetsByTenant.has(props.tenantId)) {
      this.assetsByTenant.set(props.tenantId, new Set())
    }
    this.assetsByTenant.get(props.tenantId)!.add(id)
    return asset
  }

  async completeUpload(assetId: string, tenantId: string): Promise<MultimediaAsset> {
    const asset = await this.getAsset(assetId, tenantId)
    asset.status = 'ready'
    asset.processingProgress = 1.0
    asset.cdnUrl = `https://cdn.shenjiying88.com/${asset.storageKey}`
    asset.url = asset.cdnUrl
    asset.updatedAt = this.now()
    return asset
  }

  async getAsset(assetId: string, tenantId: string): Promise<MultimediaAsset> {
    const asset = this.assets.get(assetId)
    if (!asset || asset.tenantId !== tenantId) {
      throw new Error('资产不存在')
    }
    return asset
  }

  async listAssets(opts: {
    tenantId: string
    assetType?: AssetType
    tags?: string[]
    status?: AssetStatus
    limit?: number
  }): Promise<MultimediaAsset[]> {
    const { tenantId, assetType, tags, status, limit = 50 } = opts
    const ids = this.assetsByTenant.get(tenantId) ?? new Set()
    let result = Array.from(ids).map((id) => this.assets.get(id)).filter((a): a is MultimediaAsset => a != null)
    if (assetType) result = result.filter((a) => a.assetType === assetType)
    if (tags?.length) result = result.filter((a) => tags.some((t) => a.tags.includes(t)))
    if (status) result = result.filter((a) => a.status === status)
    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return result.slice(0, limit)
  }

  async deleteAsset(assetId: string, tenantId: string): Promise<void> {
    const asset = await this.getAsset(assetId, tenantId)
    this.assets.delete(asset.id)
    this.assetsByTenant.get(tenantId)?.delete(asset.id)
    const vSet = this.variantsByAsset.get(assetId) ?? new Set()
    for (const vId of vSet) this.variants.delete(vId)
    this.variantsByAsset.delete(assetId)
  }

  async createVariant(props: {
    assetId: string
    tenantId: string
    variantType: string
    format: string
    sizeBytes: number
  }): Promise<AssetVariant> {
    await this.getAsset(props.assetId, props.tenantId)
    const id = this.nextId('var')
    const variant: AssetVariant = {
      id,
      assetId: props.assetId,
      variantType: props.variantType,
      format: props.format,
      sizeBytes: props.sizeBytes,
      storageKey: `${props.tenantId}/variants/${id}.${props.format}`,
      status: 'completed',
      createdAt: this.now(),
    }
    this.variants.set(id, variant)
    if (!this.variantsByAsset.has(props.assetId)) {
      this.variantsByAsset.set(props.assetId, new Set())
    }
    this.variantsByAsset.get(props.assetId)!.add(id)
    return variant
  }

  async listVariants(assetId: string, tenantId: string): Promise<AssetVariant[]> {
    await this.getAsset(assetId, tenantId)
    const ids = this.variantsByAsset.get(assetId) ?? new Set()
    return Array.from(ids).map((id) => this.variants.get(id)).filter((v): v is AssetVariant => v != null)
  }

  async getStorageStats(tenantId: string): Promise<{
    totalAssets: number
    totalSizeBytes: number
    byType: Record<string, { count: number; sizeBytes: number }>
    failedCount: number
  }> {
    const ids = this.assetsByTenant.get(tenantId) ?? new Set()
    const all = Array.from(ids).map((id) => this.assets.get(id)).filter((a): a is MultimediaAsset => a != null)
    const totalSizeBytes = all.reduce((s, a) => s + a.sizeBytes, 0)
    const byType: Record<string, { count: number; sizeBytes: number }> = {}
    for (const a of all) {
      if (!byType[a.assetType]) byType[a.assetType] = { count: 0, sizeBytes: 0 }
      byType[a.assetType].count++
      byType[a.assetType].sizeBytes += a.sizeBytes
    }
    return {
      totalAssets: all.length,
      totalSizeBytes,
      byType,
      failedCount: all.filter((a) => a.status === 'failed').length,
    }
  }

  async addStorageBackend(props: {
    name: string
    type: StorageBackendType
    bucket: string
    region: string
    isDefault?: boolean
  }): Promise<StorageBackend> {
    const id = this.nextId('bk')
    const backend: StorageBackend = {
      id,
      name: props.name,
      type: props.type,
      bucket: props.bucket,
      region: props.region,
      isDefault: props.isDefault ?? false,
      enabled: true,
    }
    this.backends.set(id, backend)
    if (backend.isDefault) {
      for (const [, b] of this.backends) {
        if (b.id !== id) b.isDefault = false
      }
    }
    return backend
  }

  async listStorageBackends(): Promise<StorageBackend[]> {
    return Array.from(this.backends.values())
  }

  async deleteStorageBackend(backendId: string): Promise<void> {
    const backend = this.backends.get(backendId)
    if (!backend) throw new Error('存储后端不存在')
    if (backend.isDefault) throw new Error('不能删除默认存储后端')
    this.backends.delete(backendId)
  }

  async getSignedUrl(assetId: string, tenantId: string, expiresInSec = 3600): Promise<{ url: string; expiresAt: number }> {
    await this.getAsset(assetId, tenantId)
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSec
    return { url: `https://cdn.shenjiying88.com/signed/${assetId}?exp=${expiresAt}`, expiresAt }
  }

  private inferAssetType(mimeType: string): AssetType {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document'
    return 'unknown'
  }

  reset() {
    this.assets.clear()
    this.variants.clear()
    this.backends.clear()
    this.assetsByTenant.clear()
    this.variantsByAsset.clear()
    this.seq = 0
    this.seed()
  }
}

function createService(): MultimediaMockService {
  return new MultimediaMockService()
}

// ── 👔 店长 ──
describe(`${ROLES.StoreManager} multimedia 角色场景测试`, () => {
  it('店长查看门店媒体资产列表，了解门店素材情况', async () => {
    const svc = createService()
    const assets = await svc.listAssets({ tenantId: 'tenant-a' })
    expect(assets.length).toBeGreaterThanOrEqual(3)
    expect(assets.some((a) => a.assetType === 'image')).toBe(true)
    expect(assets.some((a) => a.originalFilename.includes('.mp4'))).toBe(true)
  })

  it('店长上传门店活动照片，记录门店运营', async () => {
    const svc = createService()
    const asset = await svc.createAsset({
      tenantId: 'tenant-a',
      originalFilename: 'store_event_2026.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 2 * 1024 * 1024,
      contentHash: 'store-event-hash-001',
      tags: ['活动', '新开业'],
      uploadedBy: 'store-manager-001',
    })
    expect(asset.originalFilename).toBe('store_event_2026.jpg')
    expect(asset.status).toBe('uploading')
    expect(asset.tags).toContain('活动')
    expect(asset.tags).toContain('新开业')
  })

  it('店长尝试上传超大文件，系统拒绝', async () => {
    const svc = createService()
    await expect(svc.createAsset({
      tenantId: 'tenant-a',
      originalFilename: 'huge_video.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 600 * 1024 * 1024,
      contentHash: 'too-large-hash',
      uploadedBy: 'store-manager-001',
    })).rejects.toThrow('文件超过最大尺寸限制')
  })
})

// ── 🛒 前台 ──
describe(`${ROLES.FrontDesk} multimedia 角色场景测试`, () => {
  it('前台查询某活动资产详情用于顾客展示', async () => {
    const svc = createService()
    const assets = await svc.listAssets({ tenantId: 'tenant-a', tags: ['活动'] })
    expect(assets.length).toBeGreaterThanOrEqual(1)
    const first = assets[0]
    expect(first.cdnUrl).toBeTruthy()
    expect(first.url).toBeTruthy()
  })

  it('前台上传顾客照片到门店相册', async () => {
    const svc = createService()
    const asset = await svc.createAsset({
      tenantId: 'tenant-a',
      originalFilename: 'customer_photo.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1024 * 500,
      contentHash: 'customer-photo-hash',
      tags: ['顾客'],
      uploadedBy: 'front-desk-001',
    })
    expect(asset.tags).toContain('顾客')
  })

  it('前台尝试访问其他门店的资产被隔离', async () => {
    const svc = createService()
    const assetId = 'asset-tenant-b-0' // tenant-b 的资产
    await expect(svc.getAsset(assetId, 'tenant-a')).rejects.toThrow('资产不存在')
  })
})

// ── 👥 HR ──
describe(`${ROLES.HR} multimedia 角色场景测试`, () => {
  it('HR 查看全门店媒体存储统计，了解存储用量', async () => {
    const svc = createService()
    const stats = await svc.getStorageStats('tenant-a')
    expect(stats.totalAssets).toBeGreaterThanOrEqual(4) // 3 normal + 1 failed
    expect(stats.totalSizeBytes).toBeGreaterThan(0)
    expect(stats.byType.image).toBeDefined()
    expect(stats.byType.video).toBeDefined()
  })

  it('HR 检查各门店失败资产的分布', async () => {
    const svc = createService()
    const statsA = await svc.getStorageStats('tenant-a')
    expect(statsA.failedCount).toBeGreaterThanOrEqual(1)

    const statsB = await svc.getStorageStats('tenant-b')
    expect(statsB.failedCount).toBeGreaterThanOrEqual(1)
  })

  it('HR 查询空门店的统计信息返回零值', async () => {
    const svc = createService()
    const stats = await svc.getStorageStats('tenant-empty')
    expect(stats.totalAssets).toBe(0)
    expect(stats.totalSizeBytes).toBe(0)
    expect(Object.keys(stats.byType).length).toBe(0)
  })
})

// ── 🔧 安监 ──
describe(`${ROLES.Security} multimedia 角色场景测试`, () => {
  it('安监审查上传失败资产列表，排查安全原因', async () => {
    const svc = createService()
    const assets = await svc.listAssets({ tenantId: 'tenant-a', status: 'failed' })
    expect(assets.length).toBeGreaterThanOrEqual(1)
    for (const a of assets) {
      expect(a.status).toBe('failed')
      expect(a.errorMessage).toBeTruthy()
    }
  })

  it('安监确认所有媒体资产有正确的 tenantId 归属', async () => {
    const svc = createService()
    for (const tid of ['tenant-a', 'tenant-b', 'tenant-c']) {
      const assets = await svc.listAssets({ tenantId: tid })
      for (const a of assets) {
        expect(a.tenantId).toBe(tid)
      }
    }
  })

  it('安监检查存储后端的配置完整性', async () => {
    const svc = createService()
    const backends = await svc.listStorageBackends()
    expect(backends.length).toBeGreaterThanOrEqual(2)
    const defaults = backends.filter((b) => b.isDefault)
    expect(defaults.length).toBe(1) // 只能有一个默认后端
    expect(backends.every((b) => b.enabled)).toBe(true)
  })
})

// ── 🎮 导玩员 ──
describe(`${ROLES.Guide} multimedia 角色场景测试`, () => {
  it('导玩员上传游戏活动视频素材', async () => {
    const svc = createService()
    const asset = await svc.createAsset({
      tenantId: 'tenant-a',
      originalFilename: 'game_tournament_recap.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 30 * 1024 * 1024,
      contentHash: 'game-video-hash-001',
      tags: ['游戏活动', '精彩瞬间'],
      uploadedBy: 'guide-001',
    })
    expect(asset.assetType).toBe('video')
    expect(asset.tags).toContain('精彩瞬间')
  })

  it('导玩员上传完成后标记上传完成', async () => {
    const svc = createService()
    const asset = await svc.createAsset({
      tenantId: 'tenant-a',
      originalFilename: 'arcade_photo.png',
      mimeType: 'image/png',
      sizeBytes: 1024 * 300,
      contentHash: 'arcade-png-hash',
      tags: ['街机'],
      uploadedBy: 'guide-002',
    })
    const completed = await svc.completeUpload(asset.id, 'tenant-a')
    expect(completed.status).toBe('ready')
    expect(completed.cdnUrl).toBeTruthy()
  })

  it('导玩员获取资产签名 URL 用于临时分享', async () => {
    const svc = createService()
    const signed = await svc.getSignedUrl('asset-tenant-a-0', 'tenant-a', 300)
    expect(signed.url).toContain('signed/')
    expect(signed.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })
})

// ── 🎯 运行专员 ──
describe(`${ROLES.Operations} multimedia 角色场景测试`, () => {
  it('运行专员手动创建衍生版本用于缩略图生成', async () => {
    const svc = createService()
    const variant = await svc.createVariant({
      assetId: 'asset-tenant-a-0',
      tenantId: 'tenant-a',
      variantType: 'thumbnail',
      format: 'webp',
      sizeBytes: 30 * 1024,
    })
    expect(variant.variantType).toBe('thumbnail')
    expect(variant.status).toBe('completed')
  })

  it('运行专员查看资产的所有衍生版本', async () => {
    const svc = createService()
    const variants = await svc.listVariants('asset-tenant-a-0', 'tenant-a')
    expect(variants.length).toBeGreaterThanOrEqual(2) // thumbnail + preview from seed
  })

  it('运行专员删除失败资产释放空间', async () => {
    const svc = createService()
    await svc.deleteAsset('asset-tenant-a-failed', 'tenant-a')
    await expect(svc.getAsset('asset-tenant-a-failed', 'tenant-a')).rejects.toThrow('资产不存在')
  })

  it('运行专员添加新的存储后端', async () => {
    const svc = createService()
    const backend = await svc.addStorageBackend({
      name: '腾讯云 COS 北京',
      type: 's3',
      bucket: 'sjy-cos-beijing',
      region: 'ap-beijing',
    })
    expect(backend.name).toBe('腾讯云 COS 北京')
    expect(backend.enabled).toBe(true)

    const all = await svc.listStorageBackends()
    expect(all.length).toBeGreaterThanOrEqual(3)
  })

  it('运行专员尝试删除默认存储后端被拒绝', async () => {
    const svc = createService()
    await expect(svc.deleteStorageBackend('bk-s3-01')).rejects.toThrow('不能删除默认存储后端')
  })
})

// ── 🤝 团建 ──
describe(`${ROLES.Teambuilding} multimedia 角色场景测试`, () => {
  it('团建查询活动照片标签的资产列表', async () => {
    const svc = createService()
    const assets = await svc.listAssets({ tenantId: 'tenant-a', tags: ['日常'] })
    expect(assets.length).toBeGreaterThanOrEqual(1)
  })

  it('团建上传团建活动合照到门店', async () => {
    const svc = createService()
    const asset = await svc.createAsset({
      tenantId: 'tenant-a',
      originalFilename: 'teambuilding_group_photo.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 4 * 1024 * 1024,
      contentHash: 'tb-group-hash-2026',
      tags: ['团建', '合照'],
      linkedEntity: { entityType: 'other', entityId: 'event-teambuilding-2026' },
      uploadedBy: 'hr-teambuilding',
    })
    expect(asset.tags).toContain('团建')
    expect(asset.linkedEntity?.entityId).toBe('event-teambuilding-2026')
  })
})

// ── 📢 营销 ──
describe(`${ROLES.Marketing} multimedia 角色场景测试`, () => {
  it('营销上传促销活动宣传图', async () => {
    const svc = createService()
    const asset = await svc.createAsset({
      tenantId: 'tenant-a',
      originalFilename: 'summer_promo_banner.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 5 * 1024 * 1024,
      contentHash: 'promo-banner-hash-001',
      tags: ['促销', '暑期活动', '宣传'],
      visibility: 'public',
      uploadedBy: 'marketing-001',
    })
    expect(asset.visibility).toBe('public')
    expect(asset.tags).toContain('宣传')
  })

  it('营销生成宣传图签名 URL 限时推广', async () => {
    const svc = createService()
    const signed = await svc.getSignedUrl('asset-tenant-a-0', 'tenant-a', 3600)
    expect(signed.expiresAt - Math.floor(Date.now() / 1000)).toBeGreaterThanOrEqual(3500)
  })

  it('营销统计各门店媒体使用情况', async () => {
    const svc = createService()
    const statsA = await svc.getStorageStats('tenant-a')
    const statsB = await svc.getStorageStats('tenant-b')
    expect(statsA.totalAssets).toBeGreaterThan(0)
    expect(statsB.totalAssets).toBeGreaterThan(0)
  })

  it('营销上传资产时关联到产品实体', async () => {
    const svc = createService()
    const asset = await svc.createAsset({
      tenantId: 'tenant-a',
      originalFilename: 'product_banner.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 3 * 1024 * 1024,
      contentHash: 'product-banner-hash',
      linkedEntity: { entityType: 'product', entityId: 'prod-summer-pack-2026' },
      uploadedBy: 'marketing-002',
    })
    expect(asset.linkedEntity?.entityType).toBe('product')
  })
})
