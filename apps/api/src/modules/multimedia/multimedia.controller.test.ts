import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase 99 多模态存储 Controller 单元测试 (V11 Sprint 3 Day 31-32)
 *
 * 覆盖全部路由端点：
 * - POST /multimedia/assets (createAsset)
 * - POST /multimedia/assets/:id/complete (completeUpload)
 * - GET /multimedia/assets (listAssets)
 * - GET /multimedia/assets/:id (getAsset)
 * - DELETE /multimedia/assets/:id (deleteAsset)
 * - POST /multimedia/assets/:id/variants (createVariant)
 * - GET /multimedia/assets/:id/variants (listVariants)
 * - POST /multimedia/assets/:id/signed-url (signedUrl)
 * - POST /multimedia/storage-backends (addBackend)
 * - GET /multimedia/storage-backends (listBackends)
 * - DELETE /multimedia/storage-backends/:id (deleteBackend)
 * - GET /multimedia/stats (stats)
 *
 * 正例 + 反例 + 边界条件
 */

import assert from 'node:assert/strict'
import { MultimediaController } from './multimedia.controller'
import { MultimediaService } from './multimedia.service'
import { runWithTenant } from '../../common/context/tenant-context'

// ── 租户上下文 ──
const TENANT_A = {
  tenantId: 'tenant-A', storeId: 'store-001', userId: 'admin-A',
  role: 'tenant_admin' as const,
}
const TENANT_B = {
  tenantId: 'tenant-B', storeId: 'store-002', userId: 'admin-B',
  role: 'tenant_admin' as const,
}

// ── Helper: 创建共享 controller 和 service ──
function makeController() {
  const service = new MultimediaService()
  const controller = new MultimediaController(service)
  return { controller, service }
}

// ── Helper: 先设置默认存储后端 ──
async function setupDefaultBackend(service: MultimediaService) {
  return runWithTenant(TENANT_A, () =>
    service.addStorageBackend({
      name: 'default-s3',
      type: 's3',
      bucket: 'test-bucket',
      region: 'ap-east-1',
      isDefault: true,
      credentials: 'ak:sk',
    }),
  )
}

describe('MultimediaController', () => {
  // ═══════════════════════════════════════════════════
  // POST /multimedia/assets
  // ═══════════════════════════════════════════════════
  describe('POST /multimedia/assets (createAsset)', () => {
    it('【正例】创建资产成功，返回资产信息和 isDuplicate=false', async () => {
      const { controller, service } = makeController()
      await setupDefaultBackend(service)

      const result = await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'photo.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 12345,
          contentHash: 'hash-001',
        }),
      )
      assert.equal(result.isDuplicate, false)
      assert.ok(result.id)
      assert.equal(result.originalFilename, 'photo.jpg')
      assert.equal(result.mimeType, 'image/jpeg')
      assert.equal(result.assetType, 'image')
      assert.equal(result.status, 'uploading')
    })

    it('【反例】不允许的 MIME 类型抛出 BadRequest', async () => {
      const { controller, service } = makeController()
      await setupDefaultBackend(service)

      await assert.rejects(
        runWithTenant(TENANT_A, () =>
          controller.createAsset({
            originalFilename: 'script.exe',
            mimeType: 'application/x-msdownload',
            sizeBytes: 100,
            contentHash: 'hash-exe',
          }),
        ),
        { status: 400, message: /MIME type/ },
      )
    })

    it('【边界】超大文件超过限制抛出 BadRequest', async () => {
      const { controller, service } = makeController()
      await setupDefaultBackend(service)

      await assert.rejects(
        runWithTenant(TENANT_A, () =>
          controller.createAsset({
            originalFilename: 'huge.jpg',
            mimeType: 'image/jpeg',
            sizeBytes: 999999999,
            contentHash: 'hash-huge',
          }),
        ),
        { status: 400, message: /最大尺寸/ },
      )
    })

    it('【边界】无存储后端时创建资产抛出 BadRequest', async () => {
      const { controller } = makeController()

      await assert.rejects(
        runWithTenant(TENANT_A, () =>
          controller.createAsset({
            originalFilename: 'test.png',
            mimeType: 'image/png',
            sizeBytes: 5000,
            contentHash: 'hash-nobackend',
          }),
        ),
        { status: 400, message: /存储后端未配置/ },
      )
    })

    it('【正例】contentHash 跨租户去重返回 isDuplicate=true', async () => {
      const { controller, service } = makeController()
      await setupDefaultBackend(service)

      // 租户 A 创建资产
      await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'shared.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 5000,
          contentHash: 'hash-shared',
        }),
      )

      // 租户 B 用相同 hash 创建 → 跨租户引用
      const result = await runWithTenant(TENANT_B, () =>
        controller.createAsset({
          originalFilename: 'shared-copy.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 5000,
          contentHash: 'hash-shared',
        }),
      )
      assert.equal(result.isDuplicate, true)
      assert.equal(result.tenantId, 'tenant-B')
    })
  })

  // ═══════════════════════════════════════════════════
  // POST /multimedia/assets/:id/complete
  // ═══════════════════════════════════════════════════
  describe('POST /multimedia/assets/:id/complete (completeUpload)', () => {
    it('【正例】完成上传后状态变为 ready', async () => {
      const { controller, service } = makeController()
      const backend = await setupDefaultBackend(service)

      const created = await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'done.mp4',
          mimeType: 'video/mp4',
          sizeBytes: 500000,
          contentHash: 'hash-complete',
        }),
      )

      const result = await runWithTenant(TENANT_A, () =>
        controller.completeUpload(created.id, {}),
      )
      assert.equal(result.status, 'ready')
      assert.equal(result.processingProgress, 1.0)
      assert.ok(result.url)
    })

    it('【反例】不存在的资产 404', async () => {
      const { controller } = makeController()
      await assert.rejects(
        runWithTenant(TENANT_A, () =>
          controller.completeUpload('non-existent-id', {}),
        ),
        { status: 404 },
      )
    })

    it('【反例】跨租户无法完成上传', async () => {
      const { controller, service } = makeController()
      await setupDefaultBackend(service)

      const created = await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'cross.mp3',
          mimeType: 'audio/mpeg',
          sizeBytes: 30000,
          contentHash: 'hash-cross-tenant',
        }),
      )

      await assert.rejects(
        runWithTenant(TENANT_B, () =>
          controller.completeUpload(created.id, {}),
        ),
        { status: 404 },
      )
    })
  })

  // ═══════════════════════════════════════════════════
  // GET /multimedia/assets
  // ═══════════════════════════════════════════════════
  describe('GET /multimedia/assets (listAssets)', () => {
    it('【正例】列出当前租户所有资产', async () => {
      const { controller, service } = makeController()
      await setupDefaultBackend(service)

      await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'a1.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 100,
          contentHash: 'hash-list-1',
        }),
      )
      await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'a2.png',
          mimeType: 'image/png',
          sizeBytes: 200,
          contentHash: 'hash-list-2',
        }),
      )

      const result = await runWithTenant(TENANT_A, () =>
        controller.listAssets({}),
      )
      assert.equal(result.total, 2)
      assert.equal(result.items.length, 2)
    })

    it('【边界】无资产返回空列表', async () => {
      const { controller } = makeController()
      const result = await runWithTenant(TENANT_A, () =>
        controller.listAssets({}),
      )
      assert.equal(result.total, 0)
      assert.deepEqual(result.items, [])
    })

    it('【正例】跨租户隔离，租户 B 看不到租户 A 的资产', async () => {
      const { controller, service } = makeController()
      await setupDefaultBackend(service)

      await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'secret.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 100,
          contentHash: 'hash-secret',
        }),
      )

      const resultB = await runWithTenant(TENANT_B, () =>
        controller.listAssets({}),
      )
      assert.equal(resultB.total, 0)
    })
  })

  // ═══════════════════════════════════════════════════
  // GET /multimedia/assets/:id
  // ═══════════════════════════════════════════════════
  describe('GET /multimedia/assets/:id (getAsset)', () => {
    it('【正例】通过 ID 获取资产详情', async () => {
      const { controller, service } = makeController()
      await setupDefaultBackend(service)

      const created = await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'detail.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 999,
          contentHash: 'hash-detail',
        }),
      )

      const result = await runWithTenant(TENANT_A, () =>
        controller.getAsset(created.id),
      )
      assert.equal(result.id, created.id)
      assert.equal(result.originalFilename, 'detail.jpg')
      assert.ok(result.createdAt)
    })

    it('【反例】不存在的 ID 返回 404', async () => {
      const { controller } = makeController()
      await assert.rejects(
        runWithTenant(TENANT_A, () => controller.getAsset('ghost-id')),
        { status: 404 },
      )
    })
  })

  // ═══════════════════════════════════════════════════
  // DELETE /multimedia/assets/:id
  // ═══════════════════════════════════════════════════
  describe('DELETE /multimedia/assets/:id (deleteAsset)', () => {
    it('【正例】删除资产后无法再获取', async () => {
      const { controller, service } = makeController()
      await setupDefaultBackend(service)

      const created = await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'delete-me.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 50,
          contentHash: 'hash-delete',
        }),
      )

      await runWithTenant(TENANT_A, () =>
        controller.deleteAsset(created.id),
      )

      await assert.rejects(
        runWithTenant(TENANT_A, () => controller.getAsset(created.id)),
        { status: 404 },
      )
    })

    it('【反例】删除不存在资产返回 404', async () => {
      const { controller } = makeController()
      await assert.rejects(
        runWithTenant(TENANT_A, () => controller.deleteAsset('nonexistent')),
        { status: 404 },
      )
    })
  })

  // ═══════════════════════════════════════════════════
  // POST /multimedia/assets/:id/variants
  // ═══════════════════════════════════════════════════
  describe('POST /multimedia/assets/:id/variants (createVariant)', () => {
    it('【正例】为资产创建缩略图变体', async () => {
      const { controller, service } = makeController()
      await setupDefaultBackend(service)

      const asset = await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'variant.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 5000,
          contentHash: 'hash-variant',
        }),
      )

      const variant = await runWithTenant(TENANT_A, () =>
        controller.createVariant(asset.id, {
          variantType: 'thumbnail',
          format: 'webp',
          sizeBytes: 500,
        }),
      )
      assert.equal(variant.assetId, asset.id)
      assert.equal(variant.variantType, 'thumbnail')
      assert.equal(variant.status, 'completed')
    })

    it('【反例】为不存在资产创建变体返回 404', async () => {
      const { controller } = makeController()
      await assert.rejects(
        runWithTenant(TENANT_A, () =>
          controller.createVariant('bad-id', {
            variantType: 'thumbnail',
            format: 'webp',
            sizeBytes: 100,
          }),
        ),
        { status: 404 },
      )
    })
  })

  // ═══════════════════════════════════════════════════
  // GET /multimedia/assets/:id/variants
  // ═══════════════════════════════════════════════════
  describe('GET /multimedia/assets/:id/variants (listVariants)', () => {
    it('【正例】列出资产的所有变体', async () => {
      const { controller, service } = makeController()
      await setupDefaultBackend(service)

      const asset = await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'many-variants.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 10000,
          contentHash: 'hash-many-variant',
        }),
      )

      await runWithTenant(TENANT_A, () =>
        controller.createVariant(asset.id, {
          variantType: 'thumbnail',
          format: 'webp',
          sizeBytes: 200,
        }),
      )
      await runWithTenant(TENANT_A, () =>
        controller.createVariant(asset.id, {
          variantType: 'preview',
          format: 'jpg',
          sizeBytes: 1500,
        }),
      )

      const result = await runWithTenant(TENANT_A, () =>
        controller.listVariants(asset.id),
      )
      assert.equal(result.total, 2)
      assert.equal(result.items.length, 2)
    })

    it('【边界】无变体的资产返回空列表', async () => {
      const { controller, service } = makeController()
      await setupDefaultBackend(service)

      const asset = await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'no-variant.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 100,
          contentHash: 'hash-no-variant',
        }),
      )

      const result = await runWithTenant(TENANT_A, () =>
        controller.listVariants(asset.id),
      )
      assert.equal(result.total, 0)
      assert.deepEqual(result.items, [])
    })
  })

  // ═══════════════════════════════════════════════════
  // POST /multimedia/assets/:id/signed-url
  // ═══════════════════════════════════════════════════
  describe('POST /multimedia/assets/:id/signed-url (signedUrl)', () => {
    it('【正例】生成签名 URL 成功', async () => {
      const { controller, service } = makeController()
      await setupDefaultBackend(service)

      const asset = await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'signed.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 50000,
          contentHash: 'hash-signed',
        }),
      )

      const result = await runWithTenant(TENANT_A, () =>
        controller.signedUrl(asset.id, { expiresInSec: 300 }),
      )
      assert.ok(result.url)
      assert.ok(result.expiresAt > Math.floor(Date.now() / 1000))
    })

    it('【反例】不存在资产生成签名 URL 返回 404', async () => {
      const { controller } = makeController()
      await assert.rejects(
        runWithTenant(TENANT_A, () =>
          controller.signedUrl('bad-id', {}),
        ),
        { status: 404 },
      )
    })

    it('【正例】指定 variantId 时应为变体生成签名 URL', async () => {
      const { controller, service } = makeController()
      await setupDefaultBackend(service)

      const asset = await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'variant-sign.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 100,
          contentHash: 'hash-variant-sign',
        }),
      )
      await runWithTenant(TENANT_A, () => controller.completeUpload(asset.id, {}))
      const variant = await runWithTenant(TENANT_A, () =>
        controller.createVariant(asset.id, {
          variantType: 'thumbnail',
          format: 'webp',
          sizeBytes: 20,
        }),
      )

      const result = await runWithTenant(TENANT_A, () =>
        controller.signedUrl(asset.id, { variantId: variant.id, expiresInSec: 300 }),
      )
      const url = new URL(result.url)
      assert.equal(url.pathname.slice(1), `${asset.storageKey}.thumbnail.webp`)
    })

    it('【反例】variantId 不属于当前资产时返回 404', async () => {
      const { controller, service } = makeController()
      await setupDefaultBackend(service)

      const assetA = await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'asset-a.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 100,
          contentHash: 'hash-variant-a',
        }),
      )
      const assetB = await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'asset-b.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 100,
          contentHash: 'hash-variant-b',
        }),
      )
      const variantB = await runWithTenant(TENANT_A, () =>
        controller.createVariant(assetB.id, {
          variantType: 'thumbnail',
          format: 'webp',
          sizeBytes: 20,
        }),
      )

      await assert.rejects(
        runWithTenant(TENANT_A, () =>
          controller.signedUrl(assetA.id, { variantId: variantB.id }),
        ),
        { status: 404 },
      )
    })

    it('【边界】不指定过期时间使用默认 3600 秒', async () => {
      const { controller, service } = makeController()
      await setupDefaultBackend(service)

      const asset = await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'default-expire.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 100,
          contentHash: 'hash-default-expire',
        }),
      )

      const result = await runWithTenant(TENANT_A, () =>
        controller.signedUrl(asset.id, {}),
      )
      const expectedExpire = Math.floor(Date.now() / 1000) + 3600
      // 允许 2 秒误差
      assert.ok(Math.abs(result.expiresAt - expectedExpire) <= 2)
    })
  })

  // ═══════════════════════════════════════════════════
  // POST /multimedia/storage-backends
  // ═══════════════════════════════════════════════════
  describe('POST /multimedia/storage-backends (addBackend)', () => {
    it('【正例】添加 OSS 存储后端成功', async () => {
      const { controller, service } = makeController()

      const result = await runWithTenant(TENANT_A, () =>
        controller.addBackend({
          name: 'my-oss',
          type: 'oss',
          bucket: 'my-bucket',
          region: 'cn-shanghai',
          endpoint: 'https://oss-cn-shanghai.aliyuncs.com',
          credentials: 'ak:sk-oss',
          cdnDomain: 'media.shenjiying88.com',
        }),
      )
      assert.ok(result.id)
      assert.equal(result.name, 'my-oss')
      assert.equal(result.type, 'oss')
      assert.equal(result.enabled, true)
      assert.equal(result.endpoint, 'https://oss-cn-shanghai.aliyuncs.com')
      assert.equal(result.cdnDomain, 'media.shenjiying88.com')
      assert.ok(result.createdAt)
    })

    it('【正例】添加默认后端会自动覆盖之前的默认', async () => {
      const { controller, service } = makeController()

      await runWithTenant(TENANT_A, () =>
        controller.addBackend({
          name: 'first',
          type: 's3',
          bucket: 'b1',
          region: 'us-east-1',
          isDefault: true,
          credentials: 'ak1:sk1',
        }),
      )

      const second = await runWithTenant(TENANT_A, () =>
        controller.addBackend({
          name: 'second',
          type: 's3',
          bucket: 'b2',
          region: 'eu-west-1',
          isDefault: true,
          credentials: 'ak2:sk2',
        }),
      )
      assert.equal(second.isDefault, true)
      // 第一个不再是默认
      const backends = await runWithTenant(TENANT_A, () =>
        controller.listBackends(),
      )
      const first = backends.items.find((b) => b.name === 'first')
      assert.equal(first?.isDefault, false)
    })
  })

  // ═══════════════════════════════════════════════════
  // GET /multimedia/storage-backends
  // ═══════════════════════════════════════════════════
  describe('GET /multimedia/storage-backends (listBackends)', () => {
    it('【正例】列出所有存储后端', async () => {
      const { controller, service } = makeController()

      await runWithTenant(TENANT_A, () =>
        controller.addBackend({
          name: 's3-east',
          type: 's3',
          bucket: 'b-east',
          region: 'ap-east-1',
          isDefault: true,
          credentials: 'ak:sk',
        }),
      )
      await runWithTenant(TENANT_A, () =>
        controller.addBackend({
          name: 'oss-sh',
          type: 'oss',
          bucket: 'b-sh',
          region: 'cn-shanghai',
          credentials: 'ak2:sk2',
        }),
      )

      const result = await runWithTenant(TENANT_A, () =>
        controller.listBackends(),
      )
      assert.equal(result.items.length, 2)
    })

    it('【边界】无存储后端返回空列表', async () => {
      const { controller } = makeController()

      const result = await runWithTenant(TENANT_A, () =>
        controller.listBackends(),
      )
      assert.equal(result.items.length, 0)
    })
  })

  // ═══════════════════════════════════════════════════
  // DELETE /multimedia/storage-backends/:id
  // ═══════════════════════════════════════════════════
  describe('DELETE /multimedia/storage-backends/:id (deleteBackend)', () => {
    it('【正例】删除非默认后端成功', async () => {
      const { controller, service } = makeController()

      const defaultBackend = await runWithTenant(TENANT_A, () =>
        controller.addBackend({
          name: 'default',
          type: 's3',
          bucket: 'b-default',
          region: 'ap-east-1',
          isDefault: true,
          credentials: 'ak:sk',
        }),
      )
      const extra = await runWithTenant(TENANT_A, () =>
        controller.addBackend({
          name: 'extra',
          type: 'oss',
          bucket: 'b-extra',
          region: 'cn-shanghai',
          credentials: 'ak2:sk2',
        }),
      )

      await runWithTenant(TENANT_A, () =>
        controller.deleteBackend(extra.id),
      )

      const result = await runWithTenant(TENANT_A, () =>
        controller.listBackends(),
      )
      assert.equal(result.items.length, 1)
      assert.equal(result.items[0].name, 'default')
    })

    it('【反例】删除默认后端返回 BadRequest', async () => {
      const { controller, service } = makeController()

      const backend = await runWithTenant(TENANT_A, () =>
        controller.addBackend({
          name: 'default-oss',
          type: 'oss',
          bucket: 'b-oss',
          region: 'cn-shanghai',
          isDefault: true,
          credentials: 'ak:sk',
        }),
      )

      await assert.rejects(
        runWithTenant(TENANT_A, () => controller.deleteBackend(backend.id)),
        { status: 400, message: /不能删除默认存储后端/ },
      )
    })

    it('【反例】删除不存在后端返回 404', async () => {
      const { controller } = makeController()
      await assert.rejects(
        runWithTenant(TENANT_A, () => controller.deleteBackend('ghost-backend')),
        { status: 404 },
      )
    })
  })

  // ═══════════════════════════════════════════════════
  // GET /multimedia/stats
  // ═══════════════════════════════════════════════════
  describe('GET /multimedia/stats (stats)', () => {
    it('【正例】返回存储统计信息', async () => {
      const { controller, service } = makeController()
      await setupDefaultBackend(service)

      await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'img1.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1000,
          contentHash: 'hash-stats-1',
        }),
      )
      await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'vid1.mp4',
          mimeType: 'video/mp4',
          sizeBytes: 500000,
          contentHash: 'hash-stats-2',
        }),
      )

      const stats = await runWithTenant(TENANT_A, () => controller.stats())
      assert.equal(stats.totalAssets, 2)
      assert.equal(stats.totalSizeBytes, 501000)
      assert.ok(stats.byType.image)
      assert.ok(stats.byType.video)
      assert.equal(stats.recentUploads, 2)
      assert.equal(stats.avgProcessingTimeMs, 0)
      assert.equal(stats.totalSizeBytes, stats.byType.image.sizeBytes + stats.byType.video.sizeBytes)
    })

    it('【边界】无资产时统计全部为零', async () => {
      const { controller } = makeController()
      const stats = await runWithTenant(TENANT_A, () => controller.stats())
      assert.equal(stats.totalAssets, 0)
      assert.equal(stats.totalSizeBytes, 0)
      assert.equal(stats.recentUploads, 0)
      assert.equal(stats.avgProcessingTimeMs, 0)
      assert.equal(stats.duplicateHits, 0)
      assert.deepEqual(stats.byType, {})
    })
  })
})
