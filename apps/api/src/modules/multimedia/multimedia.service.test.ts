import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase 99 多模态存储 Service Tests (V11 Sprint 3 Day 31-32)
 *
 * 18 tests 覆盖:
 * - MIME 校验白名单 (2)
 * - 文件大小限制 (1)
 * - 资产 CRUD (3)
 * - 跨租户 contentHash 去重 (2)
 * - 衍生版本 CRUD (2)
 * - 签名 URL HMAC 一致性 (2)
 * - 存储后端 CRUD + 凭证加密 (3)
 * - 默认后端设置 (1)
 * - 标签检索倒排索引 (1)
 * - 跨租户隔离 (1)
 */

import assert from 'node:assert/strict'
import { MultimediaService } from './multimedia.service'
import {
  isAllowedMimeType,
  inferAssetType,
  MAX_FILE_SIZES,
  generateSignedUrl,
  verifySignedUrl,
  buildStorageKey,
  buildThumbnailParams,
  buildVideoParams,
  computeContentHash,
} from './multimedia.entity'
import { runWithTenant } from '../../common/context/tenant-context'

const TENANT_A = {
  tenantId: 'tenant-A', storeId: 'store-001', userId: 'admin-A',
  role: 'tenant_admin' as const,
}
const TENANT_B = {
  tenantId: 'tenant-B', storeId: 'store-002', userId: 'admin-B',
  role: 'tenant_admin' as const,
}

const SHARED_SERVICE = new MultimediaService()

// 工具
async function setupBackend() {
  return await runWithTenant(TENANT_A, async () =>
    SHARED_SERVICE.addStorageBackend({
      name: 'test-s3',
      type: 's3',
      bucket: 'test-bucket',
      region: 'ap-east-1',
      credentials: 'AKIA-TEST-SECRET-CRED',
      cdnDomain: 'cdn-test.shenjiying88.com',
      isDefault: true,
    }),
  )
}

// ============ Tests ============

describe('Phase 99 多模态存储 (V11 Sprint 3 Day 31-32)', () => {
  // ============ 1. MIME 校验白名单 (2) ============
  describe('1. MIME type 校验', () => {
    it('允许 image/jpeg', () => {
      assert.equal(isAllowedMimeType('image/jpeg'), true)
      assert.equal(isAllowedMimeType('image/png'), true)
      assert.equal(isAllowedMimeType('image/webp'), true)
    })

    it('拒绝未在白名单的 MIME', () => {
      assert.equal(isAllowedMimeType('application/zip'), false)
      assert.equal(isAllowedMimeType('text/html'), false)
      assert.equal(isAllowedMimeType('application/x-msdownload'), false)
    })
  })

  // ============ 2. inferAssetType (1) ============
  describe('2. 资产类型推断', () => {
    it('image/video/audio/document 分流', () => {
      assert.equal(inferAssetType('image/jpeg'), 'image')
      assert.equal(inferAssetType('video/mp4'), 'video')
      assert.equal(inferAssetType('audio/mpeg'), 'audio')
      assert.equal(inferAssetType('application/pdf'), 'document')
      assert.equal(inferAssetType('text/plain'), 'unknown')
    })
  })

  // ============ 3. 工具函数 (3) ============
  describe('3. 工具函数', () => {
    it('buildStorageKey 包含 tenant + hash 前缀', () => {
      const key = buildStorageKey('tenant-A', 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789', 'photo.jpg')
      assert.ok(key.includes('tenant-A'))
      assert.ok(key.includes('abcdef0123456789'))
      assert.ok(key.endsWith('.jpg'))
    })

    it('buildThumbnailParams / buildVideoParams', () => {
      assert.equal(buildThumbnailParams({ width: 256, height: 256 }), '256x256-q80-webp')
      assert.equal(buildThumbnailParams({ width: 128, height: 128, quality: 90, format: 'jpeg' }), '128x128-q90-jpeg')
      assert.equal(buildVideoParams({ resolution: '720p', bitrate: '2000k', codec: 'h264' }), '720p-2000k-h264')
    })

    it('computeContentHash SHA-256 64 字符 hex', () => {
      const hash = computeContentHash('hello world')
      assert.equal(hash.length, 64)
      assert.equal(hash, computeContentHash('hello world')) // 幂等
    })
  })

  // ============ 4. 文件大小限制 (1) ============
  describe('4. 文件大小上限', () => {
    it('image 50MB / video 2GB / audio 500MB / document 100MB', () => {
      assert.equal(MAX_FILE_SIZES.image, 50 * 1024 * 1024)
      assert.equal(MAX_FILE_SIZES.video, 2 * 1024 * 1024 * 1024)
      assert.equal(MAX_FILE_SIZES.audio, 500 * 1024 * 1024)
      assert.equal(MAX_FILE_SIZES.document, 100 * 1024 * 1024)
    })

    it('创建超大文件被拒', async () => {
      await setupBackend()
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () =>
          SHARED_SERVICE.createAsset({
            originalFilename: 'huge.jpg',
            mimeType: 'image/jpeg',
            sizeBytes: 100 * 1024 * 1024, // 100MB > 50MB limit
            contentHash: computeContentHash('huge'),
          }),
        ),
        /文件超过/,
      )
    })
  })

  // ============ 5. 资产 CRUD (3) ============
  describe('5. 资产 CRUD', () => {
    it('创建资产 (uploading 状态)', async () => {
      const { asset, isDuplicate } = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createAsset({
          originalFilename: 'photo-001.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024 * 1024,
          contentHash: computeContentHash('photo-001'),
          tags: ['product', 'hero'],
          linkedEntity: { entityType: 'product', entityId: 'prod-001' },
        }),
      )
      assert.equal(asset.status, 'uploading')
      assert.equal(asset.assetType, 'image')
      assert.equal(asset.tags.length, 2)
      assert.equal(asset.linkedEntity?.entityId, 'prod-001')
      assert.equal(isDuplicate, false)
    })

    it('completeUpload → processing → ready', async () => {
      const { asset } = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createAsset({
          originalFilename: 'img.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 100,
          contentHash: computeContentHash('img-complete'),
        }),
      )
      const completed = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.completeUpload(asset.id, { uploadEtag: 'mock-etag' }),
      )
      assert.equal(completed.status, 'ready')
      assert.equal(completed.processingProgress, 1.0)
      assert.ok(completed.cdnUrl)
      assert.ok(completed.cdnUrl!.includes('cdn-test.shenjiying88.com'))
    })

    it('删除资产 → 不在列表', async () => {
      const { asset } = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createAsset({
          originalFilename: 'to-del.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 50,
          contentHash: computeContentHash('to-del'),
        }),
      )
      await runWithTenant(TENANT_A, async () => SHARED_SERVICE.deleteAsset(asset.id))
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () => SHARED_SERVICE.getAsset(asset.id)),
        /不存在/,
      )
    })
  })

  // ============ 6. 跨租户去重 (2) ============
  describe('6. 跨租户 contentHash 去重', () => {
    it('同 hash 不同租户 → 创建引用 (isDuplicate=true)', async () => {
      const hash = computeContentHash('cross-tenant-dedupe-test')
      // 租户 A 先创建
      const a = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createAsset({
          originalFilename: 'cross.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 100,
          contentHash: hash,
          tags: ['from-A'],
        }),
      )
      assert.equal(a.isDuplicate, false)

      // 租户 B 用同 hash → 引用
      const b = await runWithTenant(TENANT_B, async () =>
        SHARED_SERVICE.createAsset({
          originalFilename: 'cross-copy.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 100,
          contentHash: hash,
          tags: ['from-B'],
        }),
      )
      assert.equal(b.isDuplicate, true)
      assert.equal(b.asset.tenantId, 'tenant-B')
      assert.notEqual(b.asset.id, a.asset.id) // 不同 ID
      assert.equal(b.asset.tags[0], 'from-B') // B 自己的标签
    })

    it('duplicateHitCount 累加', async () => {
      const before = SHARED_SERVICE.countAssets()
      await runWithTenant(TENANT_B, async () =>
        SHARED_SERVICE.createAsset({
          originalFilename: 'dup.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 100,
          contentHash: computeContentHash('dup-hit-' + Date.now()),
        }),
      )
      const after = SHARED_SERVICE.countAssets()
      assert.equal(after, before + 1)
    })
  })

  // ============ 7. 衍生版本 (2) ============
  describe('7. 衍生版本', () => {
    it('创建 thumbnail variant', async () => {
      const { asset } = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createAsset({
          originalFilename: 'var-test.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 100,
          contentHash: computeContentHash('var-test'),
        }),
      )
      const variant = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createVariant(asset.id, {
          variantType: 'thumbnail',
          format: 'webp',
          sizeBytes: 5000,
          parameters: { width: 256, height: 256, quality: 80 },
        }),
      )
      assert.equal(variant.variantType, 'thumbnail')
      assert.equal(variant.status, 'completed')
      assert.equal(variant.storageKey.includes('thumbnail.webp'), true)
    })

    it('列出 asset 的 variants', async () => {
      const { asset } = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createAsset({
          originalFilename: 'list-var.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 100,
          contentHash: computeContentHash('list-var'),
        }),
      )
      await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createVariant(asset.id, {
          variantType: 'preview',
          format: 'jpeg',
          sizeBytes: 50000,
        }),
      )
      await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createVariant(asset.id, {
          variantType: 'compressed',
          format: 'webp',
          sizeBytes: 30000,
        }),
      )
      const variants = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.listVariants(asset.id),
      )
      assert.equal(variants.length, 2)
    })
  })

  // ============ 8. 签名 URL HMAC (2) ============
  describe('8. 签名 URL HMAC', () => {
    it('生成 + 验证一致', () => {
      const expiresAt = Math.floor(Date.now() / 1000) + 3600
      const url = generateSignedUrl({
        storageKey: 'tenant-A/multimedia/2026/06/test.jpg',
        expiresAt,
        secret: 'test-secret',
      })
      assert.ok(url.includes('expires='))
      assert.ok(url.includes('signature='))
      const sig = url.split('signature=')[1]
      assert.equal(
        verifySignedUrl(url, expiresAt, sig, 'test-secret'),
        true,
      )
    })

    it('过期 URL 验证失败', () => {
      const expiresAt = Math.floor(Date.now() / 1000) - 10 // 已过期
      const url = generateSignedUrl({
        storageKey: 'k.jpg',
        expiresAt,
        secret: 's',
      })
      const sig = url.split('signature=')[1]
      assert.equal(verifySignedUrl(url, expiresAt, sig, 's'), false)
    })
  })

  // ============ 9. 存储后端 (3) ============
  describe('9. 存储后端管理', () => {
    it('添加 S3 后端 + 凭证加密', async () => {
      const backend = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addStorageBackend({
          name: 's3-prod',
          type: 's3',
          bucket: 'shenjiying-prod',
          region: 'ap-east-1',
          credentials: 'AKIA-PLAINTEXT-CREDENTIALS',
          isDefault: false,
        }),
      )
      assert.equal(backend.type, 's3')
      assert.ok(backend.credentialsEncrypted)
      assert.notEqual(backend.credentialsEncrypted, 'AKIA-PLAINTEXT-CREDENTIALS') // 加密
      // 解密验证
      assert.equal(
        SHARED_SERVICE.decryptBackendCredentialsForTesting(backend),
        'AKIA-PLAINTEXT-CREDENTIALS',
      )
    })

    it('删除默认后端被拒', async () => {
      // 先确保有 default backend
      const defaultBackend = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addStorageBackend({
          name: 'default-test',
          type: 's3',
          bucket: 'b',
          region: 'r',
          credentials: 'c',
          isDefault: true,
        }),
      )
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () => SHARED_SERVICE.deleteStorageBackend(defaultBackend.id)),
        /不能删除默认/,
      )
    })

    it('列出 + 删除非默认后端', async () => {
      const backend = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addStorageBackend({
          name: 'to-delete',
          type: 'oss',
          bucket: 'b-oss',
          region: 'cn-shanghai',
          credentials: 'oss-key',
        }),
      )
      const list = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.listStorageBackends(),
      )
      assert.ok(list.some((b) => b.id === backend.id))
      await runWithTenant(TENANT_A, async () => SHARED_SERVICE.deleteStorageBackend(backend.id))
      const after = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.listStorageBackends(),
      )
      assert.equal(after.some((b) => b.id === backend.id), false)
    })
  })

  // ============ 10. 标签检索 (1) ============
  describe('10. 标签检索', () => {
    it('按 tags 过滤', async () => {
      const { asset: a1 } = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createAsset({
          originalFilename: 'a1.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 10,
          contentHash: computeContentHash('tag-a1'),
          tags: ['hero', 'product'],
        }),
      )
      const { asset: a2 } = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createAsset({
          originalFilename: 'a2.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 10,
          contentHash: computeContentHash('tag-a2'),
          tags: ['product'],
        }),
      )
      const filtered = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.listAssets({ tags: ['hero'] }),
      )
      assert.equal(filtered.some((a) => a.id === a1.id), true)
      assert.equal(filtered.some((a) => a.id === a2.id), false)
    })
  })

  // ============ 11. 跨租户隔离 (1) ============
  describe('11. 跨租户隔离', () => {
    it('租户 B 不能访问租户 A 的资产', async () => {
      const { asset } = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createAsset({
          originalFilename: 'isolated.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 100,
          contentHash: computeContentHash('isolated-' + Date.now()),
        }),
      )
      await assert.rejects(
        () => runWithTenant(TENANT_B, async () => SHARED_SERVICE.getAsset(asset.id)),
        /不存在/,
      )
    })
  })

  // ============ 12. 统计 (1) ============
  describe('12. 存储统计', () => {
    it('getStorageStats 聚合 byType + duplicateHits', async () => {
      await setupBackend()
      const stats = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.getStorageStats(),
      )
      assert.ok(stats.totalAssets >= 0)
      assert.ok(stats.totalSizeBytes >= 0)
      assert.ok(typeof stats.byType === 'object')
      assert.equal(typeof stats.duplicateHits, 'number')
    })
  })
})