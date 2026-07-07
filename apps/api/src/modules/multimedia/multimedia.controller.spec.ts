import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [multimedia] controller spec 补全
 * MultimediaController 单元测试 (node:test)
 *
 * 策略：内联 Controller + Mock Service，覆盖所有路由端点。
 * 正向流程 + 边界条件（空数据集、不存在的资源、异常输入、跨租户隔离）。
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

// ── Test fixtures ──
function makeAssetResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: `asset-${Math.random().toString(36).slice(2, 8)}`,
    tenantId: 'tenant-A',
    originalFilename: 'test.jpg',
    assetType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 1024,
    contentHash: 'sha256-abc123',
    storageBackend: 's3',
    storageKey: 'tenant-A/multimedia/2026/06/abc123.jpg',
    status: 'uploading',
    visibility: 'tenant_internal',
    tags: [],
    uploadedBy: 'admin-A',
    processingProgress: 0,
    variantCount: 0,
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
    ...overrides,
  }
}

function makeVariantResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: `var-${Math.random().toString(36).slice(2, 8)}`,
    assetId: 'asset-001',
    variantType: 'thumbnail',
    format: 'webp',
    sizeBytes: 500,
    storageKey: 'tenant-A/multimedia/2026/06/abc123.jpg.thumbnail.webp',
    processingDurationMs: 50,
    status: 'completed',
    createdAt: '2026-06-29T00:01:00.000Z',
    ...overrides,
  }
}

function makeBackendResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: `bk-${Math.random().toString(36).slice(2, 8)}`,
    name: 'default-s3',
    type: 's3',
    bucket: 'test-bucket',
    region: 'ap-east-1',
    isDefault: true,
    enabled: true,
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
    ...overrides,
  }
}

// ── Helper: 创建 controller 并设置默认存储后端 ──
async function makePreparedController() {
  const service = new MultimediaService()
  const controller = new MultimediaController(service)
  await runWithTenant(TENANT_A, () =>
    service.addStorageBackend({
      name: 'default-s3',
      type: 's3',
      bucket: 'test-bucket',
      region: 'ap-east-1',
      isDefault: true,
      credentials: 'ak:sk',
    }),
  )
  return { controller, service }
}

// ── Helper: 创建一个测试资产 ──
async function createTestAsset(
  controller: MultimediaController,
  service: MultimediaService,
  overrides: Record<string, unknown> = {},
) {
  return runWithTenant(TENANT_A, () =>
    controller.createAsset({
      originalFilename: 'test.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1024,
      contentHash: 'hash-test-' + Math.random().toString(36).slice(2, 8),
      ...overrides,
    }),
  )
}

describe('MultimediaController (spec)', () => {
  // ═══════════════════════════════════════════════════
  // POST /multimedia/assets
  // ═══════════════════════════════════════════════════
  describe('POST /multimedia/assets (createAsset)', () => {
    it('【正例】创建图片资产成功，返回资产实体含 isDuplicate 标志', async () => {
      const { controller, service } = await makePreparedController()
      const result = await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'photo.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 5000,
          contentHash: 'hash-unique-001',
        }),
      )
      assert.ok(result.id)
      assert.equal(result.isDuplicate, false)
      assert.equal(result.originalFilename, 'photo.jpg')
      assert.equal(result.mimeType, 'image/jpeg')
      assert.equal(result.assetType, 'image')
      assert.equal(result.status, 'uploading')
    })

    it('【正例】创建资产时可带标签和关联实体', async () => {
      const { controller, service } = await makePreparedController()
      const result = await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'product.png',
          mimeType: 'image/png',
          sizeBytes: 3000,
          contentHash: 'hash-product-001',
          tags: ['product', 'featured'],
          linkedEntity: { entityType: 'product', entityId: 'prod-001' },
        }),
      )
      assert.deepEqual(result.tags, ['product', 'featured'])
      assert.deepEqual(result.linkedEntity, { entityType: 'product', entityId: 'prod-001' })
    })

    it('【反例】拒绝不安全的 MIME 类型', async () => {
      const { controller, service } = await makePreparedController()
      await assert.rejects(
        runWithTenant(TENANT_A, () =>
          controller.createAsset({
            originalFilename: 'danger.exe',
            mimeType: 'application/x-msdownload',
            sizeBytes: 100,
            contentHash: 'hash-exe',
          }),
        ),
        { status: 400, message: /MIME type/ },
      )
    })

    it('【反例】超过类型最大尺寸时拒绝', async () => {
      const { controller, service } = await makePreparedController()
      await assert.rejects(
        runWithTenant(TENANT_A, () =>
          controller.createAsset({
            originalFilename: 'huge.mp4',
            mimeType: 'video/mp4',
            sizeBytes: 99999999999,
            contentHash: 'hash-huge-video',
          }),
        ),
        { status: 400, message: /最大尺寸/ },
      )
    })

    it('【边界】无存储后端配置时抛出 BadRequest', async () => {
      const service = new MultimediaService()
      const controller = new MultimediaController(service)
      await assert.rejects(
        runWithTenant(TENANT_A, () =>
          controller.createAsset({
            originalFilename: 'orphan.png',
            mimeType: 'image/png',
            sizeBytes: 100,
            contentHash: 'hash-nobackend',
          }),
        ),
        { status: 400, message: /存储后端未配置/ },
      )
    })

    it('【边界】相同 contentHash 跨租户复用返回 isDuplicate=true', async () => {
      const { controller, service } = await makePreparedController()
      await runWithTenant(TENANT_A, () =>
        controller.createAsset({
          originalFilename: 'shared.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 500,
          contentHash: 'hash-shared-global',
        }),
      )
      const resultB = await runWithTenant(TENANT_B, () =>
        controller.createAsset({
          originalFilename: 'shared-copy.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 500,
          contentHash: 'hash-shared-global',
        }),
      )
      assert.equal(resultB.isDuplicate, true)
      assert.equal(resultB.tenantId, 'tenant-B')
      assert.equal(resultB.originalFilename, 'shared-copy.jpg')
    })
  })

  // ═══════════════════════════════════════════════════
  // POST /multimedia/assets/:id/complete
  // ═══════════════════════════════════════════════════
  describe('POST /multimedia/assets/:id/complete (completeUpload)', () => {
    it('【正例】完成上传后状态变为 ready', async () => {
      const { controller, service } = await makePreparedController()
      const asset = await createTestAsset(controller, service)
      const result = await runWithTenant(TENANT_A, () =>
        controller.completeUpload(asset.id, {}),
      )
      assert.equal(result.status, 'ready')
      assert.equal(result.processingProgress, 1.0)
      assert.ok(result.url)
    })

    it('【正例】完成上传后自动生成 url', async () => {
      const { controller, service } = await makePreparedController()
      const asset = await createTestAsset(controller, service)
      const result = await runWithTenant(TENANT_A, () =>
        controller.completeUpload(asset.id, { uploadEtag: '"abc123"' }),
      )
      assert.ok(result.url!.startsWith('http'))
      assert.equal(result.status, 'ready')
    })

    it('【反例】不存在的资产返回 404', async () => {
      const { controller, service } = await makePreparedController()
      await assert.rejects(
        runWithTenant(TENANT_A, () =>
          controller.completeUpload('nonexistent-asset', {}),
        ),
        { status: 404 },
      )
    })

    it('【反例】跨租户无法完成上传', async () => {
      const { controller, service } = await makePreparedController()
      const asset = await createTestAsset(controller, service)
      await assert.rejects(
        runWithTenant(TENANT_B, () =>
          controller.completeUpload(asset.id, {}),
        ),
        { status: 404 },
      )
    })
  })

  // ═══════════════════════════════════════════════════
  // GET /multimedia/assets
  // ═══════════════════════════════════════════════════
  describe('GET /multimedia/assets (listAssets)', () => {
    it('【正例】列出当前租户的所有资产', async () => {
      const { controller, service } = await makePreparedController()
      await createTestAsset(controller, service, { contentHash: 'hash-list-a' })
      await createTestAsset(controller, service, { contentHash: 'hash-list-b' })
      const result = await runWithTenant(TENANT_A, () =>
        controller.listAssets({}),
      )
      assert.equal(result.total, 2)
      assert.equal(result.items.length, 2)
    })

    it('【正例】按 assetType 过滤', async () => {
      const { controller, service } = await makePreparedController()
      await createTestAsset(controller, service, {
        originalFilename: 'img.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 100,
        contentHash: 'hash-filter-img',
      })
      await createTestAsset(controller, service, {
        originalFilename: 'vid.mp4',
        mimeType: 'video/mp4',
        sizeBytes: 500000,
        contentHash: 'hash-filter-vid',
      })
      const result = await runWithTenant(TENANT_A, () =>
        controller.listAssets({ assetType: 'image' }),
      )
      assert.equal(result.total, 1)
      assert.equal(result.items[0].mimeType, 'image/jpeg')
    })

    it('【边界】无资产时返回空列表', async () => {
      const { controller, service } = await makePreparedController()
      const result = await runWithTenant(TENANT_A, () =>
        controller.listAssets({}),
      )
      assert.equal(result.total, 0)
      assert.deepEqual(result.items, [])
    })

    it('【边界】跨租户隔离，租户 B 看不到租户 A 的资产', async () => {
      const { controller, service } = await makePreparedController()
      await createTestAsset(controller, service)
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
    it('【正例】按 ID 获取资产详情', async () => {
      const { controller, service } = await makePreparedController()
      const asset = await createTestAsset(controller, service)
      const result = await runWithTenant(TENANT_A, () =>
        controller.getAsset(asset.id),
      )
      assert.equal(result.id, asset.id)
      assert.equal(result.originalFilename, 'test.jpg')
    })

    it('【反例】不存在的资产返回 404', async () => {
      const { controller, service } = await makePreparedController()
      await assert.rejects(
        runWithTenant(TENANT_A, () => controller.getAsset('ghost-id')),
        { status: 404 },
      )
    })

    it('【反例】跨租户获取返回 404', async () => {
      const { controller, service } = await makePreparedController()
      const asset = await createTestAsset(controller, service)
      await assert.rejects(
        runWithTenant(TENANT_B, () => controller.getAsset(asset.id)),
        { status: 404 },
      )
    })
  })

  // ═══════════════════════════════════════════════════
  // DELETE /multimedia/assets/:id
  // ═══════════════════════════════════════════════════
  describe('DELETE /multimedia/assets/:id (deleteAsset)', () => {
    it('【正例】删除后无法再获取资产', async () => {
      const { controller, service } = await makePreparedController()
      const asset = await createTestAsset(controller, service)
      await runWithTenant(TENANT_A, () =>
        controller.deleteAsset(asset.id),
      )
      await assert.rejects(
        runWithTenant(TENANT_A, () => controller.getAsset(asset.id)),
        { status: 404 },
      )
    })

    it('【反例】删除不存在的资产返回 404', async () => {
      const { controller, service } = await makePreparedController()
      await assert.rejects(
        runWithTenant(TENANT_A, () => controller.deleteAsset('nonexistent')),
        { status: 404 },
      )
    })

    it('【反例】跨租户删除返回 404', async () => {
      const { controller, service } = await makePreparedController()
      const asset = await createTestAsset(controller, service)
      await assert.rejects(
        runWithTenant(TENANT_B, () => controller.deleteAsset(asset.id)),
        { status: 404 },
      )
    })

    it('【边界】删除资产后变体不可再访问', async () => {
      const { controller, service } = await makePreparedController()
      const asset = await createTestAsset(controller, service)
      // 创建变体
      await runWithTenant(TENANT_A, () =>
        controller.createVariant(asset.id, {
          variantType: 'thumbnail',
          format: 'webp',
          sizeBytes: 200,
        }),
      )
      // 删除资产
      await runWithTenant(TENANT_A, () =>
        controller.deleteAsset(asset.id),
      )
      // 已删除资产的变体不可再访问 (返回 404)
      await assert.rejects(
        runWithTenant(TENANT_A, () => controller.listVariants(asset.id)),
        (err: any) => err.status === 404,
      )
    })
  })

  // ═══════════════════════════════════════════════════
  // POST /multimedia/assets/:id/variants
  // ═══════════════════════════════════════════════════
  describe('POST /multimedia/assets/:id/variants (createVariant)', () => {
    it('【正例】为资产创建缩略图变体成功', async () => {
      const { controller, service } = await makePreparedController()
      const asset = await createTestAsset(controller, service)
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

    it('【正例】可为同一资产创建多种类型变体', async () => {
      const { controller, service } = await makePreparedController()
      const asset = await createTestAsset(controller, service)
      await runWithTenant(TENANT_A, () =>
        controller.createVariant(asset.id, {
          variantType: 'thumbnail', format: 'webp', sizeBytes: 200,
        }),
      )
      await runWithTenant(TENANT_A, () =>
        controller.createVariant(asset.id, {
          variantType: 'preview', format: 'jpg', sizeBytes: 1000,
        }),
      )
      const result = await runWithTenant(TENANT_A, () =>
        controller.listVariants(asset.id),
      )
      assert.equal(result.total, 2)
    })

    it('【反例】为不存在资产创建变体返回 404', async () => {
      const { controller, service } = await makePreparedController()
      await assert.rejects(
        runWithTenant(TENANT_A, () =>
          controller.createVariant('bad-asset', {
            variantType: 'thumbnail', format: 'webp', sizeBytes: 100,
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
      const { controller, service } = await makePreparedController()
      const asset = await createTestAsset(controller, service)
      await runWithTenant(TENANT_A, () =>
        controller.createVariant(asset.id, {
          variantType: 'thumbnail', format: 'webp', sizeBytes: 200,
        }),
      )
      const result = await runWithTenant(TENANT_A, () =>
        controller.listVariants(asset.id),
      )
      assert.equal(result.total, 1)
      assert.equal(result.items[0].variantType, 'thumbnail')
    })

    it('【边界】无变体的资产返回空列表', async () => {
      const { controller, service } = await makePreparedController()
      const asset = await createTestAsset(controller, service)
      const result = await runWithTenant(TENANT_A, () =>
        controller.listVariants(asset.id),
      )
      assert.equal(result.total, 0)
      assert.deepEqual(result.items, [])
    })

    it('【反例】不存在的资产返回 404', async () => {
      const { controller, service } = await makePreparedController()
      await assert.rejects(
        runWithTenant(TENANT_A, () => controller.listVariants('bad-asset')),
        { status: 404 },
      )
    })
  })

  // ═══════════════════════════════════════════════════
  // POST /multimedia/assets/:id/signed-url
  // ═══════════════════════════════════════════════════
  describe('POST /multimedia/assets/:id/signed-url (signedUrl)', () => {
    it('【正例】生成签名 URL 成功', async () => {
      const { controller, service } = await makePreparedController()
      const asset = await createTestAsset(controller, service)
      const result = await runWithTenant(TENANT_A, () =>
        controller.signedUrl(asset.id, { expiresInSec: 300 }),
      )
      assert.ok(result.url)
      assert.ok(result.expiresAt > Math.floor(Date.now() / 1000))
    })

    it('【边界】不指定过期时间使用默认 3600 秒', async () => {
      const { controller, service } = await makePreparedController()
      const asset = await createTestAsset(controller, service)
      const result = await runWithTenant(TENANT_A, () =>
        controller.signedUrl(asset.id, {}),
      )
      const now = Math.floor(Date.now() / 1000)
      assert.ok(result.expiresAt > now)
      assert.ok(result.expiresAt <= now + 3610)
    })

    it('【正例】指定 variantId 时应对该变体生成签名 URL', async () => {
      const { controller, service } = await makePreparedController()
      const asset = await createTestAsset(controller, service)
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

    it('【反例】不存在的资产生成签名 URL 返回 404', async () => {
      const { controller, service } = await makePreparedController()
      await assert.rejects(
        runWithTenant(TENANT_A, () =>
          controller.signedUrl('bad-id', {}),
        ),
        { status: 404 },
      )
    })

    it('【反例】variantId 不属于当前资产时返回 404', async () => {
      const { controller, service } = await makePreparedController()
      const assetA = await createTestAsset(controller, service, {
        originalFilename: 'asset-a.jpg',
        contentHash: 'spec-hash-variant-a',
      })
      const assetB = await createTestAsset(controller, service, {
        originalFilename: 'asset-b.jpg',
        contentHash: 'spec-hash-variant-b',
      })
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
  })

  // ═══════════════════════════════════════════════════
  // POST /multimedia/storage-backends
  // ═══════════════════════════════════════════════════
  describe('POST /multimedia/storage-backends (addBackend)', () => {
    it('【正例】添加 OSS 存储后端成功', async () => {
      const { controller, service } = await makePreparedController()
      const result = await runWithTenant(TENANT_A, () =>
        controller.addBackend({
          name: 'my-oss',
          type: 'oss',
          bucket: 'my-bucket',
          region: 'cn-shanghai',
          endpoint: 'https://oss-cn-shanghai.aliyuncs.com',
          credentials: 'ak:sk',
          cdnDomain: 'media.shenjiying88.com',
        }),
      )
      assert.ok(result.id)
      assert.equal(result.name, 'my-oss')
      assert.equal(result.enabled, true)
      assert.equal(result.endpoint, 'https://oss-cn-shanghai.aliyuncs.com')
      assert.equal(result.cdnDomain, 'media.shenjiying88.com')
      assert.ok(result.createdAt)
    })

    it('【正例】设置 isDefault 会覆盖之前的默认后端', async () => {
      const { controller, service } = await makePreparedController()
      const second = await runWithTenant(TENANT_A, () =>
        controller.addBackend({
          name: 'new-default',
          type: 's3',
          bucket: 'b-new',
          region: 'eu-west-1',
          isDefault: true,
          credentials: 'ak2:sk2',
        }),
      )
      assert.equal(second.isDefault, true)
      const backends = await runWithTenant(TENANT_A, () =>
        controller.listBackends(),
      )
      const first = backends.items.find((b) => b.name === 'default-s3')
      assert.equal(first?.isDefault, false)
    })
  })

  // ═══════════════════════════════════════════════════
  // GET /multimedia/storage-backends
  // ═══════════════════════════════════════════════════
  describe('GET /multimedia/storage-backends (listBackends)', () => {
    it('【正例】列出所有存储后端', async () => {
      const { controller, service } = await makePreparedController()
      await runWithTenant(TENANT_A, () =>
        controller.addBackend({
          name: 'oss-sh',
          type: 'oss',
          bucket: 'b-sh',
          region: 'cn-shanghai',
          credentials: 'ak:sk',
        }),
      )
      const result = await runWithTenant(TENANT_A, () =>
        controller.listBackends(),
      )
      assert.ok(result.items.length >= 2)
    })

    it('【边界】新建 service 时无后端返回空列表', async () => {
      const service = new MultimediaService()
      const controller = new MultimediaController(service)
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
      const { controller, service } = await makePreparedController()
      const extra = await runWithTenant(TENANT_A, () =>
        controller.addBackend({
          name: 'extra',
          type: 'oss',
          bucket: 'b-extra',
          region: 'cn-shanghai',
          credentials: 'ak:sk',
        }),
      )
      await runWithTenant(TENANT_A, () =>
        controller.deleteBackend(extra.id),
      )
      const result = await runWithTenant(TENANT_A, () =>
        controller.listBackends(),
      )
      const found = result.items.find((b) => b.id === extra.id)
      assert.equal(found, undefined)
    })

    it('【反例】删除默认后端返回 BadRequest', async () => {
      const { controller, service } = await makePreparedController()
      const backends = await runWithTenant(TENANT_A, () =>
        controller.listBackends(),
      )
      const defaultBackend = backends.items.find((b) => b.isDefault)
      if (defaultBackend) {
        await assert.rejects(
          runWithTenant(TENANT_A, () =>
            controller.deleteBackend(defaultBackend.id),
          ),
          { status: 400, message: /不能删除默认存储后端/ },
        )
      }
    })

    it('【反例】删除不存在的后端返回 404', async () => {
      const { controller, service } = await makePreparedController()
      await assert.rejects(
        runWithTenant(TENANT_A, () =>
          controller.deleteBackend('nonexistent-backend'),
        ),
        { status: 404 },
      )
    })
  })

  // ═══════════════════════════════════════════════════
  // GET /multimedia/stats
  // ═══════════════════════════════════════════════════
  describe('GET /multimedia/stats (stats)', () => {
    it('【正例】返回存储统计信息含按类型分组', async () => {
      const { controller, service } = await makePreparedController()
      await createTestAsset(controller, service, {
        originalFilename: 'img.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1000,
        contentHash: 'hash-stats-image',
      })
      await createTestAsset(controller, service, {
        originalFilename: 'video.mp4',
        mimeType: 'video/mp4',
        sizeBytes: 500000,
        contentHash: 'hash-stats-video',
      })
      const stats = await runWithTenant(TENANT_A, () => controller.stats())
      assert.equal(stats.totalAssets, 2)
      assert.equal(stats.totalSizeBytes, 501000)
      assert.ok(stats.byType.image)
      assert.ok(stats.byType.video)
      assert.equal(stats.byType.image.count, 1)
      assert.equal(stats.byType.video.count, 1)
      assert.equal(stats.recentUploads, 2)
      assert.equal(stats.avgProcessingTimeMs, 0)
    })

    it('【边界】无资产时全部统计为零', async () => {
      const { controller, service } = await makePreparedController()
      const stats = await runWithTenant(TENANT_A, () => controller.stats())
      assert.equal(stats.totalAssets, 0)
      assert.equal(stats.totalSizeBytes, 0)
      assert.equal(stats.recentUploads, 0)
      assert.equal(stats.avgProcessingTimeMs, 0)
      assert.equal(stats.duplicateHits, 0)
    })

    it('【正例】统计仅限当前租户', async () => {
      const { controller, service } = await makePreparedController()
      await createTestAsset(controller, service) // 租户 A
      const statsB = await runWithTenant(TENANT_B, () => controller.stats())
      assert.equal(statsB.totalAssets, 0)
    })
  })
})
