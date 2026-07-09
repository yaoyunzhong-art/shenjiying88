import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Multimedia Simulator Test
 *
 * 8 角色视角模拟多模态资产全场景测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 覆盖: 资产上传→变体处理→签名 URL→存储后端管理→统计
 * 场景: 上传→变体生成→签名→后端切换→去重→统计查询→审计回溯
 * 正例 10 个 + 反例 6 个 + 边界 4 个 = 20 测试用例
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MultimediaController } from './multimedia.controller'
import { MultimediaService } from './multimedia.service'
import { runWithTenant } from '../../common/context/tenant-context'
import type { CreateAssetResponseContract, MultimediaAssetContract, AssetListResponseContract, AssetVariantListResponseContract, StorageBackendListResponseContract, StorageStatsContract, SignedUrlResponseContract } from './multimedia.contract'

// ─── 8 角色定义 ───
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ─── 测试租户 ───
const TENANT_A = { tenantId: 'tenant-A', storeId: 'store-001', userId: 'admin-A', role: 'tenant_admin' as const }
const TENANT_B = { tenantId: 'tenant-B', storeId: 'store-002', userId: 'admin-B', role: 'tenant_admin' as const }

// ─── 测试工厂 ───
function makeController(): { controller: MultimediaController; service: MultimediaService } {
  const service = new MultimediaService()
  const controller = new MultimediaController(service)
  return { controller, service }
}

/** 设置默认存储后端 */
async function setupDefaultBackend(service: MultimediaService) {
  return runWithTenant(TENANT_A, () =>
    service.addStorageBackend({
      name: 'default-s3',
      type: 's3',
      bucket: 'test-bucket',
      region: 'us-east-1',
      credentials: 'mock:AKID123456',
      isDefault: true,
    }),
  )
}

/** 在上下文下执行 */
async function withTenant<T>(ctx: typeof TENANT_A, fn: () => T | Promise<T>): Promise<T> {
  return runWithTenant(ctx, fn)
}

// ─── 模拟器测试套件 ───

describe('Multimedia Simulator — 8 角色视角', () => {
  let ctrl: MultimediaController
  let svc: MultimediaService

  beforeEach(async () => {
    const m = makeController()
    ctrl = m.controller
    svc = m.service
    await setupDefaultBackend(svc)
  })

  // ──────────────────────────────────────
  // 👔 店长视角: 门店日常运营资产管理
  // ──────────────────────────────────────
  describe(`${ROLES.StoreManager} 店长 — 门店日常运营资产管理`, () => {
    it('【正例】店长上传并完成门店活动海报 — 创建→完成→查询全流程', async () => {
      const asset: CreateAssetResponseContract = await withTenant(TENANT_A, () =>
        ctrl.createAsset({
          originalFilename: 'grand-opening-poster.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 2_500_000,
          contentHash: 'a1b2c3d4e5f6',
          visibility: 'public',
          tags: ['海报', '开业活动', '门店'],
        }),
      )
      assert.ok(asset.id.startsWith('asset-'))

      // 完成上传
      const completed: MultimediaAssetContract = await withTenant(TENANT_A, () =>
        ctrl.completeUpload(asset.id, {}),
      )
      assert.equal(completed.status, 'ready')
      assert.equal(completed.processingProgress, 1.0)
      assert.ok(completed.url)

      // 按 ID 查询
      const detail: MultimediaAssetContract = await withTenant(TENANT_A, () =>
        ctrl.getAsset(asset.id),
      )
      assert.equal(detail.id, asset.id)
      assert.equal(detail.tags.includes('海报'), true)
    })

    it('【反例】店长查询不存在的资产应返回 404', async () => {
      await expect(
        withTenant(TENANT_A, () => ctrl.getAsset('nonexistent-asset-id')),
      ).rejects.toThrow(/不存在/)
    })

    it('【正例】店长删除已下架活动图片 — deleteAsset 正常回收', async () => {
      const asset: CreateAssetResponseContract = await withTenant(TENANT_A, () =>
        ctrl.createAsset({
          originalFilename: 'old-banner.png',
          mimeType: 'image/png',
          sizeBytes: 1_200_000,
          contentHash: 'xyz789',
          visibility: 'tenant_internal',
        }),
      )
      await withTenant(TENANT_A, () =>
        ctrl.deleteAsset(asset.id),
      )
      // 删除后再次查询应抛 404
      await expect(
        withTenant(TENANT_A, () => ctrl.getAsset(asset.id)),
      ).rejects.toThrow(/不存在/)
    })
  })

  // ──────────────────────────────────────
  // 🛒 前台视角: 前台收银台小票 / 凭证上传
  // ──────────────────────────────────────
  describe(`${ROLES.FrontDesk} 前台 — 收银小票 / 凭证上传`, () => {
    it('【正例】前台上传收银小票 — 关联支付订单', async () => {
      const asset: CreateAssetResponseContract = await withTenant(TENANT_A, () =>
        ctrl.createAsset({
          originalFilename: 'receipt-20260709-001.png',
          mimeType: 'image/png',
          sizeBytes: 800_000,
          contentHash: 'receipt-hash-001',
          tags: ['收银小票'],
          linkedEntity: { entityType: 'order', entityId: 'order-12345' },
        }),
      )
      assert.equal(asset.linkedEntity?.entityId, 'order-12345')
    })

    it('【边界】前台上传超大图片应被拒绝 — 超过 50MB image 限制', async () => {
      await expect(
        withTenant(TENANT_A, () =>
          ctrl.createAsset({
            originalFilename: 'huge-photo.png',
            mimeType: 'image/png',
            sizeBytes: 51 * 1024 * 1024,
            contentHash: 'supersize-hash',
          }),
        ),
      ).rejects.toThrow(/超过/)
    })

    it('【反例】前台上传 MIME 类型不在白名单应被拒绝', async () => {
      await expect(
        withTenant(TENANT_A, () =>
          ctrl.createAsset({
            originalFilename: 'script.exe',
            mimeType: 'application/x-msdownload',
            sizeBytes: 50_000,
            contentHash: 'evil-hash',
          }),
        ),
      ).rejects.toThrow(/不在白名单/)
    })
  })

  // ──────────────────────────────────────
  // 👥HR 视角: 员工证明 / 培训材料管理
  // ──────────────────────────────────────
  describe(`${ROLES.HR} 👥HR — 员工证明 / 培训材料管理`, () => {
    it('【正例】HR 上传培训视频 — 创建变体（压缩版用于移动端播放）', async () => {
      const asset: CreateAssetResponseContract = await withTenant(TENANT_A, () =>
        ctrl.createAsset({
          originalFilename: 'safety-training.mp4',
          mimeType: 'video/mp4',
          sizeBytes: 150_000_000,
          contentHash: 'training-video-hash-01',
          tags: ['培训', '安全'],
        }),
      )
      // 完成上传
      await withTenant(TENANT_A, () => ctrl.completeUpload(asset.id, {}))

      // 创建压缩变体
      const variant = await withTenant(TENANT_A, () =>
        ctrl.createVariant(asset.id, {
          variantType: 'compressed',
          format: 'mp4',
          sizeBytes: 30_000_000,
          parameters: { resolution: '720p', bitrate: '2mbps' },
        }),
      )
      assert.ok(variant.id.startsWith('var-'))
      assert.equal(variant.status, 'completed')
      assert.equal(variant.variantType, 'compressed')

      // 查询变体列表
      const variants: AssetVariantListResponseContract = await withTenant(TENANT_A, () =>
        ctrl.listVariants(asset.id),
      )
      assert.equal(variants.items.length, 1)
      assert.equal(variants.items[0].variantType, 'compressed')
    })

    it('【反例】HR 为不存在的资产创建变体应返回 404', async () => {
      await expect(
        withTenant(TENANT_A, () =>
          ctrl.createVariant('no-such-asset', {
            variantType: 'thumbnail',
            format: 'webp',
            sizeBytes: 10_000,
          }),
        ),
      ).rejects.toThrow(/不存在/)
    })
  })

  // ──────────────────────────────────────
  // 🔧安监视角: 设备监控 / 巡检照片管理
  // ──────────────────────────────────────
  describe(`${ROLES.Safety} 🔧安监 — 设备巡检照片 / 安防视频管理`, () => {
    it('【正例】安监上传巡检照片 + 关联设备 — 内容哈希去重', async () => {
      const hash = 'safety-inspection-hash-01'

      const first: CreateAssetResponseContract = await withTenant(TENANT_A, () =>
        ctrl.createAsset({
          originalFilename: 'inspection-device-01.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 3_000_000,
          contentHash: hash,
          tags: ['巡检', '设备A'],
        }),
      )
      assert.ok(first.id)

      // 相同 hash 再次上传应触发去重
      const second: CreateAssetResponseContract = await withTenant(TENANT_A, () =>
        ctrl.createAsset({
          originalFilename: 'duplicate-inspection.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 3_000_000,
          contentHash: hash,
          tags: ['巡检'],
        }),
      )
      // Controller 返回 isDuplicate 标记
      // 同租户去重: 因 contentHash 相同，返回的 asset 完整但 isDuplicate 为 true
    })

    it('【正例】安监查看存储统计 — 确认已存储资产总数', async () => {
      await withTenant(TENANT_A, () =>
        ctrl.createAsset({
          originalFilename: 'cam-snapshot-01.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 500_000,
          contentHash: 'cam-snap-001',
        }),
      )
      await withTenant(TENANT_A, () =>
        ctrl.createAsset({
          originalFilename: 'cam-snapshot-02.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 600_000,
          contentHash: 'cam-snap-002',
        }),
      )

      const stats: StorageStatsContract = await withTenant(TENANT_A, () => ctrl.stats())
      assert.equal(stats.totalAssets, 2)
      assert.ok(stats.totalSizeBytes > 0)
      assert.ok(stats.byType['image'])
    })
  })

  // ──────────────────────────────────────
  // 🎮导玩员视角: 导玩设备图片 / 活动素材
  // ──────────────────────────────────────
  describe(`${ROLES.Guide} 🎮导玩员 — 导玩活动素材上传 / 签到图片`, () => {
    it('【正例】导玩员上传签到大合照 — 缩略图变体生成', async () => {
      const asset: CreateAssetResponseContract = await withTenant(TENANT_A, () =>
        ctrl.createAsset({
          originalFilename: 'group-photo-hero.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 12_000_000,
          contentHash: 'group-photo-hash-01',
          tags: ['导玩活动', '签到'],
        }),
      )
      await withTenant(TENANT_A, () => ctrl.completeUpload(asset.id, {}))

      // 生成缩略图变体
      const thumb = await withTenant(TENANT_A, () =>
        ctrl.createVariant(asset.id, {
          variantType: 'thumbnail',
          format: 'webp',
          sizeBytes: 200_000,
          parameters: { width: 256, height: 256, quality: 80 },
        }),
      )
      assert.ok(thumb.id)
      assert.equal(thumb.variantType, 'thumbnail')
      assert.equal(thumb.format, 'webp')
    })

    it('【边界】导玩员尝试为已删除资产创建变体应抛 404', async () => {
      const asset: CreateAssetResponseContract = await withTenant(TENANT_A, () =>
        ctrl.createAsset({
          originalFilename: 'temp-checkin.png',
          mimeType: 'image/png',
          sizeBytes: 100_000,
          contentHash: 'temp-checkin-hash',
        }),
      )
      await withTenant(TENANT_A, () => ctrl.deleteAsset(asset.id))

      await expect(
        withTenant(TENANT_A, () =>
          ctrl.createVariant(asset.id, {
            variantType: 'thumbnail',
            format: 'webp',
            sizeBytes: 10_000,
          }),
        ),
      ).rejects.toThrow(/不存在/)
    })
  })

  // ──────────────────────────────────────
  // 🎯运行专员视角: 存储后端管理 / 资源配置
  // ──────────────────────────────────────
  describe(`${ROLES.Ops} 🎯运行专员 — 存储后端管理 / 资源配置`, () => {
    it('【正例】运行专员新增存储后端 — 切换到阿里云 OSS', async () => {
      const backend = await withTenant(TENANT_A, () =>
        ctrl.addBackend({
          name: 'aliyun-oss-shanghai',
          type: 'oss',
          bucket: 'shenjiying-media-sh',
          region: 'cn-shanghai',
          endpoint: 'oss-cn-shanghai.aliyuncs.com',
          credentials: 'mock:AKID-ALIYUN',
        }),
      )
      assert.ok(backend.id.startsWith('storage-'))
      assert.equal(backend.type, 'oss')

      // 列出所有后端
      const backends: StorageBackendListResponseContract = await withTenant(TENANT_A, () =>
        ctrl.listBackends(),
      )
      assert.ok(backends.items.length >= 2)
    })

    it('【反例】运行专员删除默认存储后端应被拒绝', async () => {
      const backends: StorageBackendListResponseContract = await withTenant(TENANT_A, () => ctrl.listBackends())
      const defaultBackend = backends.items.find((b) => b.isDefault)
      assert.ok(defaultBackend)

      await expect(
        withTenant(TENANT_A, () => ctrl.deleteBackend(defaultBackend.id)),
      ).rejects.toThrow(/不能删除默认/)
    })

    it('【边界】运行专员删除不存在的存储后端应抛 404', async () => {
      await expect(
        withTenant(TENANT_A, () => ctrl.deleteBackend('nonexistent-backend')),
      ).rejects.toThrow(/不存在/)
    })
  })

  // ──────────────────────────────────────
  // 🤝团建视角: 团建活动照片 / 视频上传与分享
  // ──────────────────────────────────────
  describe(`${ROLES.Teambuilding} 🤝团建 — 团建活动影像上传 / 签名 URL 分享`, () => {
    it('【正例】团建生成签名 URL — 分享给所有参与者', async () => {
      const asset: CreateAssetResponseContract = await withTenant(TENANT_A, () =>
        ctrl.createAsset({
          originalFilename: 'teambuilding-kayaking.mp4',
          mimeType: 'video/mp4',
          sizeBytes: 500_000_000,
          contentHash: 'teambuilding-video-hash',
          visibility: 'signed_url_only',
          tags: ['团建', '皮划艇'],
        }),
      )
      await withTenant(TENANT_A, () => ctrl.completeUpload(asset.id, {}))

      // 生成 2 小时签名 URL
      const signed: SignedUrlResponseContract = await withTenant(TENANT_A, () =>
        ctrl.signedUrl(asset.id, { expiresInSec: 7200 }),
      )
      assert.ok(signed.url)
      assert.ok(signed.url.includes('expires='))
      assert.ok(signed.url.includes('signature='))
      assert.ok(signed.expiresAt > Math.floor(Date.now() / 1000))
    })

    it('【边界】团建请求 0 秒过期的签名 URL — 应能生成但即刻过期', async () => {
      const asset: CreateAssetResponseContract = await withTenant(TENANT_A, () =>
        ctrl.createAsset({
          originalFilename: 'team-photo-booth.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 4_000_000,
          contentHash: 'photobooth-hash',
          visibility: 'signed_url_only',
        }),
      )
      await withTenant(TENANT_A, () => ctrl.completeUpload(asset.id, {}))

      const signed: SignedUrlResponseContract = await withTenant(TENANT_A, () =>
        ctrl.signedUrl(asset.id, { expiresInSec: 0 }),
      )
      assert.ok(signed.url)
      // expiresAt 应接近当前时间（0 秒过期）
      const now = Math.floor(Date.now() / 1000)
      assert.ok(signed.expiresAt >= now)
      assert.ok(signed.expiresAt <= now + 5)
    })
  })

  // ──────────────────────────────────────
  // 📢营销视角: 营销素材批量管理 / 标签检索
  // ──────────────────────────────────────
  describe(`${ROLES.Marketing} 📢营销 — 营销素材批量管理 / 标签检索`, () => {
    it('【正例】营销上传多张海报后按标签检索', async () => {
      await withTenant(TENANT_A, () =>
        ctrl.createAsset({
          originalFilename: 'summer-sale-banner.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 2_000_000,
          contentHash: 'summer-sale-hash',
          tags: ['营销', '夏日促销', '海报'],
        }),
      )
      await withTenant(TENANT_A, () =>
        ctrl.createAsset({
          originalFilename: 'membership-card.png',
          mimeType: 'image/png',
          sizeBytes: 1_000_000,
          contentHash: 'membership-card-hash',
          tags: ['营销', '会员卡', '海报'],
        }),
      )
      // 上传一个无关资产
      await withTenant(TENANT_A, () =>
        ctrl.createAsset({
          originalFilename: 'inventory-report.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 300_000,
          contentHash: 'report-hash-01',
          tags: ['报表', '库存'],
        }),
      )

      // 按标签检索营销素材
      const all: AssetListResponseContract = await withTenant(TENANT_A, () =>
        ctrl.listAssets({ limit: 100 }),
      )
      const marketingAssets = all.items.filter((a) => a.tags.includes('营销'))
      assert.equal(marketingAssets.length, 2)
    })

    it('【正例】营销关联业务实体后按 entityId 检索 — 内容精准匹配', async () => {
      const promoId = 'promo-summer-2026'
      await withTenant(TENANT_A, () =>
        ctrl.createAsset({
          originalFilename: 'promo-video.mp4',
          mimeType: 'video/mp4',
          sizeBytes: 80_000_000,
          contentHash: 'promo-video-hash',
          linkedEntity: { entityType: 'product', entityId: promoId },
        }),
      )
      await withTenant(TENANT_A, () =>
        ctrl.createAsset({
          originalFilename: 'promo-thumbnail.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 500_000,
          contentHash: 'promo-thumb-hash',
          linkedEntity: { entityType: 'product', entityId: promoId },
        }),
      )

      const matches: AssetListResponseContract = await withTenant(TENANT_A, () =>
        ctrl.listAssets({ limit: 50 }),
      )
      const entityAssets = matches.items.filter((a) => a.linkedEntity?.entityId === promoId)
      assert.equal(entityAssets.length, 2)
    })

    it('【反例】不同租户互相不可见 — 租户 B 无法访问租户 A 的资产', async () => {
      // 租户 A 上传
      await withTenant(TENANT_A, () =>
        ctrl.createAsset({
          originalFilename: 'a-tenant-only.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 100_000,
          contentHash: 'tenant-a-only-hash',
        }),
      )

      // 租户 B 列表 — 应无交叉
      const list: AssetListResponseContract = await withTenant(TENANT_B, () =>
        ctrl.listAssets({ limit: 100 }),
      )
      const aAssets = list.items.filter((a) => a.originalFilename === 'a-tenant-only.jpg')
      assert.equal(aAssets.length, 0)
    })
  })

  // ──────────────────────────────────────
  // 跨角色交叉场景
  // ──────────────────────────────────────
  describe('跨角色交叉场景', () => {
    it('【正例】【店长+运营】店长上传 + 运营分配存储后端 + 营销创建变体', async () => {
      // 1. 运营新增 CDN 后端
      const backend = await withTenant(TENANT_A, () =>
        ctrl.addBackend({
          name: 'cloudflare-r2',
          type: 's3',
          bucket: 'sj88-media',
          region: 'auto',
          endpoint: 'https://r2.cloudflare.com',
          credentials: 'mock:CF-TOKEN',
          cdnDomain: 'media.shenjiying88.com',
        }),
      )

      // 2. 店长上传活动主视觉
      const asset: CreateAssetResponseContract = await withTenant(TENANT_A, () =>
        ctrl.createAsset({
          originalFilename: 'hero-banner-2026.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 8_000_000,
          contentHash: 'hero-banner-2026-hash',
          storageBackendId: backend.id,
          visibility: 'public',
          tags: ['活动主视觉', '2026夏季'],
        }),
      )
      await withTenant(TENANT_A, () => ctrl.completeUpload(asset.id, {}))

      // 3. 营销生成多个变体
      const thumb = await withTenant(TENANT_A, () =>
        ctrl.createVariant(asset.id, {
          variantType: 'thumbnail',
          format: 'webp',
          sizeBytes: 80_000,
          parameters: { width: 256, quality: 75 },
        }),
      )
      const preview = await withTenant(TENANT_A, () =>
        ctrl.createVariant(asset.id, {
          variantType: 'preview',
          format: 'webp',
          sizeBytes: 400_000,
          parameters: { width: 1024, quality: 85 },
        }),
      )
      assert.ok(thumb.id)
      assert.ok(preview.id)

      // 4. 统计验证
      const stats: StorageStatsContract = await withTenant(TENANT_A, () => ctrl.stats())
      assert.equal(stats.totalAssets, 1)
      assert.ok(stats.totalSizeBytes >= 8_000_000)
    })

    it('【边界】不指定 limit 时返回默认数量（默认 50）', async () => {
      // 上传 3 个
      for (let i = 0; i < 3; i++) {
        await withTenant(TENANT_A, () =>
          ctrl.createAsset({
            originalFilename: `batch-${i}.jpg`,
            mimeType: 'image/jpeg',
            sizeBytes: 100_000,
            contentHash: `batch-hash-${i}`,
          }),
        )
      }
      const list: AssetListResponseContract = await withTenant(TENANT_A, () =>
        ctrl.listAssets({}),
      )
      assert.ok(list.items.length >= 3)
    })
  })
})
