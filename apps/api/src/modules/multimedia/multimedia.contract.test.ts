import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [multimedia] [D] 合约测试
 *
 * 验证 multimedia 模块的合约 Shape、业务逻辑契约、跨模块稳定性
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { runWithTenant } from '../../common/context/tenant-context'
import { MultimediaService } from './multimedia.service'
import {
  assertAssetContractShape,
  isValidAssetType,
  isValidAssetVisibility,
  isValidStorageBackendType,
  MULTIMEDIA_CONTRACT_VERSION,
  CONTRACT_STABILITY,
  toMultimediaAssetContract,
  toCreateAssetResponseContract,
  toAssetVariantContract,
  toStorageBackendContract,
  toAssetListResponseContract,
  toStorageStatsContract,
} from './multimedia.contract'
import type {
  CreateAssetDto,
} from './multimedia.dto'

// ─── 服务实例 helper ──────────────────────────────────

function makeService(): MultimediaService {
  return new MultimediaService()
}

function inTenant<T>(fn: () => Promise<T>): Promise<T> {
  return runWithTenant(
    {
      tenantId: 'tenant-multimedia-test',
      userId: 'user-multimedia-test',
      role: 'tenant_admin',
    },
    fn,
  )
}

// ─── 合约: 版本号与稳定性 ──────────────────────────────

describe('[multimedia] 合约: 版本号与稳定性', () => {
  it('合约版本号应为 1.0.0', () => {
    assert.equal(MULTIMEDIA_CONTRACT_VERSION, '1.0.0')
  })

  it('核心合约类型状态均为 stable', () => {
    const stableContracts = ['MultimediaAssetContract', 'AssetVariantContract', 'StorageBackendContract']
    for (const name of stableContracts) {
      assert.equal(CONTRACT_STABILITY[name], 'stable', `${name} 应标记为 stable`)
    }
  })

  it('所有合约类型都有稳定性标记', () => {
    const allContracts = Object.keys(CONTRACT_STABILITY)
    assert.ok(allContracts.length >= 4)
  })
})

// ─── 合约: 实体 Shape ─────────────────────────────────

describe('[multimedia] 合约: 资产实体 Shape', () => {
  it('createAsset 返回的资产包含合约定义的必要字段', async () => {
    await inTenant(async () => {
      const svc = makeService()
      // 先配置默认存储后端
      await svc.addStorageBackend({
        name: 'default',
        type: 's3',
        bucket: 'media-dev',
        region: 'us-east-1',
        credentials: 'mock-key',
        isDefault: true,
      })

      const dto: CreateAssetDto = {
        originalFilename: 'photo.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 102400,
        contentHash: 'abc123def456',
        visibility: 'tenant_internal',
        tags: ['vacation', 'team'],
      }
      const { asset } = await svc.createAsset(dto)
      assert.equal(typeof asset.id, 'string')
      assert.equal(typeof asset.tenantId, 'string')
      assert.equal(typeof asset.originalFilename, 'string')
      assert.equal(typeof asset.assetType, 'string')
      assert.equal(asset.assetType, 'image')
      assert.equal(asset.mimeType, 'image/jpeg')
      assert.equal(typeof asset.sizeBytes, 'number')
      assert.equal(asset.contentHash, 'abc123def456')
      assert.equal(typeof asset.storageBackend, 'string')
      assert.equal(typeof asset.storageKey, 'string')
      assert.equal(asset.status, 'uploading')
      assert.equal(asset.visibility, 'tenant_internal')
      assert.equal(Array.isArray(asset.tags), true)
      assert.equal(asset.tags.includes('vacation'), true)
      assert.equal(typeof asset.createdAt, 'string')
      assert.equal(typeof asset.updatedAt, 'string')
    })
  })

  it('createAsset 返回的资产符合 assertAssetContractShape', async () => {
    await inTenant(async () => {
      const svc = makeService()
      await svc.addStorageBackend({
        name: 'default',
        type: 's3',
        bucket: 'media-dev',
        region: 'us-east-1',
        credentials: 'mock-key',
        isDefault: true,
      })
      const { asset } = await svc.createAsset({
        originalFilename: 'test.png',
        mimeType: 'image/png',
        sizeBytes: 50000,
        contentHash: 'hash789',
      })
      assert.equal(assertAssetContractShape(asset), true)
    })
  })

  it('非资产对象通过 assertAssetContractShape 返回 false', () => {
    assert.equal(assertAssetContractShape(null), false)
    assert.equal(assertAssetContractShape(undefined as any), false)
    assert.equal(assertAssetContractShape(42 as any), false)
    assert.equal(assertAssetContractShape('string' as any), false)
    assert.equal(assertAssetContractShape({}), false)
    assert.equal(assertAssetContractShape({ id: '1' }), false)
  })
})

describe('[multimedia] 合约: 衍生版本 Shape', () => {
  it('createVariant 返回的变体包含必要字段', async () => {
    await inTenant(async () => {
      const svc = makeService()
      await svc.addStorageBackend({
        name: 'default',
        type: 's3',
        bucket: 'media-dev',
        region: 'us-east-1',
        credentials: 'mock-key',
        isDefault: true,
      })
      const { asset } = await svc.createAsset({
        originalFilename: 'video.mp4',
        mimeType: 'video/mp4',
        sizeBytes: 50_000_000,
        contentHash: 'video-hash-001',
      })
      // 完成上传使其变为 ready
      await svc.completeUpload(asset.id)

      const variant = await svc.createVariant(asset.id, {
        variantType: 'thumbnail',
        format: 'webp',
        sizeBytes: 20480,
        parameters: { width: 320, height: 180 },
      })

      assert.equal(typeof variant.id, 'string')
      assert.equal(variant.assetId, asset.id)
      assert.equal(variant.variantType, 'thumbnail')
      assert.equal(variant.format, 'webp')
      assert.equal(typeof variant.sizeBytes, 'number')
      assert.equal(typeof variant.storageKey, 'string')
      assert.equal(variant.status, 'completed')
      assert.equal(typeof variant.createdAt, 'string')
      assert.equal(typeof variant.processingDurationMs, 'number')
      assert.ok(variant.processingDurationMs > 0)
    })
  })

  it('listVariants 返回正确格式', async () => {
    await inTenant(async () => {
      const svc = makeService()
      await svc.addStorageBackend({
        name: 'default',
        type: 'oss',
        bucket: 'media-prod',
        region: 'cn-shanghai',
        credentials: 'mock-oss',
        isDefault: true,
      })
      const { asset } = await svc.createAsset({
        originalFilename: 'audio.mp3',
        mimeType: 'audio/mpeg',
        sizeBytes: 5_000_000,
        contentHash: 'audio-hash-002',
      })
      await svc.completeUpload(asset.id)
      await svc.createVariant(asset.id, { variantType: 'thumbnail', format: 'jpg', sizeBytes: 1024 })
      await svc.createVariant(asset.id, { variantType: 'compressed', format: 'mp3', sizeBytes: 2_000_000 })

      const variants = await svc.listVariants(asset.id)
      assert.equal(variants.length, 2)
      assert.equal(typeof variants[0].id, 'string')
      assert.equal(typeof variants[0].variantType, 'string')
      assert.equal(typeof variants[0].format, 'string')
    })
  })
})

describe('[multimedia] 合约: 存储后端 Shape', () => {
  it('addStorageBackend 返回的存储后端包含必要字段', async () => {
    const svc = makeService()
    const backend = await svc.addStorageBackend({
      name: '阿里云OSS',
      type: 'oss',
      bucket: 'shenjiying-media',
      region: 'cn-hangzhou',
      credentials: 'encrypted-key-here',
      cdnDomain: 'media.shenjiying88.com',
      isDefault: true,
    })
    assert.equal(typeof backend.id, 'string')
    assert.equal(backend.name, '阿里云OSS')
    assert.equal(backend.type, 'oss')
    assert.equal(backend.bucket, 'shenjiying-media')
    assert.equal(backend.region, 'cn-hangzhou')
    assert.equal(backend.isDefault, true)
    assert.equal(backend.enabled, true)
    assert.equal(backend.cdnDomain, 'media.shenjiying88.com')
  })

  it('默认存储后端自动设置', async () => {
    const svc = makeService()
    const b1 = await svc.addStorageBackend({
      name: '第一块', type: 's3', bucket: 'bucket1', region: 'us-east-1', credentials: 'k1', isDefault: true,
    })
    await svc.addStorageBackend({
      name: '第二块', type: 'oss', bucket: 'bucket2', region: 'cn-shanghai', credentials: 'k2',
    })
    assert.equal(b1.isDefault, true)
    // 第二个未设 isDefault，不应覆盖
    const allBackends = await svc.listStorageBackends()
    const defaultOne = allBackends.find((b) => b.isDefault)
    assert.equal(defaultOne?.id, b1.id)
  })

  it('删除非默认后端', async () => {
    const svc = makeService()
    const b1 = await svc.addStorageBackend({
      name: 'default', type: 's3', bucket: 'b1', region: 'r1', credentials: 'c1', isDefault: true,
    })
    await svc.addStorageBackend({
      name: 'extra', type: 'local', bucket: 'b2', region: 'r2', credentials: 'c2',
    })
    const before = await svc.listStorageBackends()
    assert.equal(before.length, 2)

    // can't delete default
    await assert.rejects(async () => svc.deleteStorageBackend(b1.id), /不能删除默认/)
  })
})

// ─── 合约: 业务逻辑契约 ───────────────────────────────

describe('[multimedia] 合约: 资产业务逻辑', () => {
  it('createAsset 设置正确的 assetType', async () => {
    await inTenant(async () => {
      const svc = makeService()
      await svc.addStorageBackend({
        name: 'default', type: 's3', bucket: 'b', region: 'r', credentials: 'c', isDefault: true,
      })
      const { asset: img } = await svc.createAsset({
        originalFilename: 'a.jpg', mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'h1',
      })
      assert.equal(img.assetType, 'image')

      const { asset: vid } = await svc.createAsset({
        originalFilename: 'b.mp4', mimeType: 'video/mp4', sizeBytes: 100, contentHash: 'h2',
      })
      assert.equal(vid.assetType, 'video')

      const { asset: aud } = await svc.createAsset({
        originalFilename: 'c.mp3', mimeType: 'audio/mpeg', sizeBytes: 100, contentHash: 'h3',
      })
      assert.equal(aud.assetType, 'audio')

      const { asset: doc } = await svc.createAsset({
        originalFilename: 'd.pdf', mimeType: 'application/pdf', sizeBytes: 100, contentHash: 'h4',
      })
      assert.equal(doc.assetType, 'document')
    })
  })

  it('completeUpload 将状态从 uploading→processing→ready', async () => {
    await inTenant(async () => {
      const svc = makeService()
      await svc.addStorageBackend({
        name: 'default', type: 's3', bucket: 'b', region: 'r', credentials: 'c', isDefault: true,
      })
      const { asset } = await svc.createAsset({
        originalFilename: 'test.jpg', mimeType: 'image/jpeg', sizeBytes: 500, contentHash: 'ch',
      })
      assert.equal(asset.status, 'uploading')

      const completed = await svc.completeUpload(asset.id)
      assert.equal(completed.status, 'ready')
      assert.equal(completed.processingProgress, 1.0)
      assert.ok(completed.url?.includes('cdn'))
      assert.ok((completed.cdnUrl ?? completed.url)?.includes('cdn'))
    })
  })

  it('getAsset 返回资产的 variantCount', async () => {
    await inTenant(async () => {
      const svc = makeService()
      await svc.addStorageBackend({
        name: 'default', type: 's3', bucket: 'b', region: 'r', credentials: 'c', isDefault: true,
      })
      const { asset } = await svc.createAsset({
        originalFilename: 'test.jpg', mimeType: 'image/jpeg', sizeBytes: 500, contentHash: 'ch2',
      })
      await svc.completeUpload(asset.id)
      await svc.createVariant(asset.id, { variantType: 'thumbnail', format: 'webp', sizeBytes: 100 })
      await svc.createVariant(asset.id, { variantType: 'compressed', format: 'jpg', sizeBytes: 200 })

      const result = await svc.getAsset(asset.id)
      assert.equal(result.variantCount, 2)
    })
  })

  it('deleteAsset 移除资产及关联变体', async () => {
    await inTenant(async () => {
      const svc = makeService()
      await svc.addStorageBackend({
        name: 'default', type: 's3', bucket: 'b', region: 'r', credentials: 'c', isDefault: true,
      })
      const { asset } = await svc.createAsset({
        originalFilename: 'del.jpg', mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'del-hash',
      })
      await svc.completeUpload(asset.id)
      await svc.createVariant(asset.id, { variantType: 'thumbnail', format: 'jpg', sizeBytes: 50 })

      await svc.deleteAsset(asset.id)

      await assert.rejects(async () => svc.getAsset(asset.id), /不存在/)
      await assert.rejects(async () => svc.listVariants(asset.id), /不存在/)
    })
  })

  it('contentHash 跨租户复用：相同哈希返回 isDuplicate=true', async () => {
    const svc = makeService()
    await svc.addStorageBackend({
      name: 'default', type: 's3', bucket: 'b', region: 'r', credentials: 'c', isDefault: true,
    })

    const { asset: first, isDuplicate: d1 } = await runWithTenant(
      {
        tenantId: 'tenant-multimedia-a',
        userId: 'user-multimedia-a',
        role: 'tenant_admin',
      },
      async () =>
        svc.createAsset({
          originalFilename: 'original.jpg', mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'dedup-hash',
        }),
    )
    assert.equal(d1, false)
    assert.equal(first.status, 'uploading')

    const { asset: second, isDuplicate: d2 } = await runWithTenant(
      {
        tenantId: 'tenant-multimedia-b',
        userId: 'user-multimedia-b',
        role: 'tenant_admin',
      },
      async () =>
        svc.createAsset({
          originalFilename: 'copy.jpg', mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'dedup-hash',
        }),
    )
    assert.equal(d2, true)
    assert.equal(second.tenantId, 'tenant-multimedia-b')
    assert.equal(second.originalFilename, 'copy.jpg')
    assert.equal(second.contentHash, 'dedup-hash')
  })
})

describe('[multimedia] 合约: 签名 URL', () => {
  it('generateSignedUrlForAsset 返回签名 URL', async () => {
    await inTenant(async () => {
      const svc = makeService()
      await svc.addStorageBackend({
        name: 'default', type: 's3', bucket: 'b', region: 'r', credentials: 'c', isDefault: true,
      })
      const { asset } = await svc.createAsset({
        originalFilename: 'secret.pdf', mimeType: 'application/pdf', sizeBytes: 1000, contentHash: 'sign-hash',
      })
      await svc.completeUpload(asset.id)

      const result = await svc.generateSignedUrlForAsset(asset.id, { expiresInSec: 300 })
      assert.equal(typeof result.url, 'string')
      assert.ok(result.url.includes('expires='))
      assert.ok(result.url.includes('signature='))
      assert.equal(typeof result.expiresAt, 'number')
      assert.ok(result.expiresAt > Math.floor(Date.now() / 1000))
    })
  })

  it('verifySignedUrlExternal 验证有效签名', async () => {
    await inTenant(async () => {
      const svc = makeService()
      await svc.addStorageBackend({
        name: 'default', type: 's3', bucket: 'b', region: 'r', credentials: 'c', isDefault: true,
      })
      const { asset } = await svc.createAsset({
        originalFilename: 'verify.jpg', mimeType: 'image/jpeg', sizeBytes: 200, contentHash: 'verify-hash',
      })
      await svc.completeUpload(asset.id)

      const { url, expiresAt } = await svc.generateSignedUrlForAsset(asset.id)
      const urlObj = new URL(url)
      const signature = urlObj.searchParams.get('signature') ?? ''
      const isVerified = svc.verifySignedUrlExternal(url, expiresAt, signature)
      assert.equal(isVerified, true)
    })
  })

  it('generateSignedUrlForAsset 支持为指定变体生成签名 URL', async () => {
    await inTenant(async () => {
      const svc = makeService()
      await svc.addStorageBackend({
        name: 'default', type: 's3', bucket: 'b', region: 'r', credentials: 'c', isDefault: true,
      })
      const { asset } = await svc.createAsset({
        originalFilename: 'hero.jpg', mimeType: 'image/jpeg', sizeBytes: 1000, contentHash: 'variant-sign-hash',
      })
      await svc.completeUpload(asset.id)
      const variant = await svc.createVariant(asset.id, {
        variantType: 'thumbnail',
        format: 'webp',
        sizeBytes: 200,
      })

      const result = await svc.generateSignedUrlForAsset(asset.id, {
        expiresInSec: 300,
        variantId: variant.id,
      })
      const urlObj = new URL(result.url)
      assert.equal(urlObj.pathname.slice(1), variant.storageKey)
      assert.ok(result.url.includes('signature='))
    })
  })
})

describe('[multimedia] 合约: 存储统计', () => {
  it('getStorageStats 返回统计信息', async () => {
    await inTenant(async () => {
      const svc = makeService()
      await svc.addStorageBackend({
        name: 'default', type: 's3', bucket: 'b', region: 'r', credentials: 'c', isDefault: true,
      })

      // 创建不同类型的资产
      await svc.createAsset({
        originalFilename: 'img.jpg', mimeType: 'image/jpeg', sizeBytes: 100_000, contentHash: 's1',
      })
      await svc.createAsset({
        originalFilename: 'vid.mp4', mimeType: 'video/mp4', sizeBytes: 10_000_000, contentHash: 's2',
      })
      await svc.createAsset({
        originalFilename: 'doc.pdf', mimeType: 'application/pdf', sizeBytes: 500_000, contentHash: 's3',
      })

      const stats = await svc.getStorageStats()
      assert.equal(stats.totalAssets, 3)
      assert.ok(stats.totalSizeBytes > 0)
      assert.equal(Object.keys(stats.byType).length, 3)
      assert.equal(stats.byType['image']?.count, 1)
      assert.equal(stats.byType['video']?.count, 1)
      assert.equal(stats.byType['document']?.count, 1)
      assert.equal(typeof stats.duplicateHits, 'number')
    })
  })

  it('MIME 白名单拒绝', async () => {
    await inTenant(async () => {
      const svc = makeService()
      await svc.addStorageBackend({
        name: 'default', type: 's3', bucket: 'b', region: 'r', credentials: 'c', isDefault: true,
      })
      await assert.rejects(async () => {
        await svc.createAsset({
          originalFilename: 'bad.exe', mimeType: 'application/x-msdownload', sizeBytes: 100, contentHash: 'bad',
        })
      }, /不在白名单/)
    })
  })

  it('文件超过最大尺寸', async () => {
    await inTenant(async () => {
      const svc = makeService()
      await svc.addStorageBackend({
        name: 'default', type: 's3', bucket: 'b', region: 'r', credentials: 'c', isDefault: true,
      })
      await assert.rejects(async () => {
        await svc.createAsset({
          originalFilename: 'huge.jpg', mimeType: 'image/jpeg', sizeBytes: 200_000_000, contentHash: 'huge',
        })
      }, /超过/)
    })
  })
})

// ─── 合约: 工具函数 ───────────────────────────────────

describe('[multimedia] 合约: 工具函数', () => {
  it('toMultimediaAssetContract 只暴露跨模块安全字段', () => {
    const contract = toMultimediaAssetContract({
      id: 'asset-001',
      tenantId: 'tenant-001',
      originalFilename: 'demo.jpg',
      assetType: 'image',
      mimeType: 'image/jpeg',
      sizeBytes: 2048,
      contentHash: 'hash-001',
      storageBackend: 's3',
      storageKey: 'tenant-001/multimedia/2026/06/hash-001.jpg',
      cdnUrl: 'https://cdn.example.com/hash-001.jpg',
      url: 'https://cdn.example.com/hash-001.jpg',
      status: 'ready',
      visibility: 'tenant_internal',
      dimensions: { width: 100, height: 200 },
      tags: ['cover'],
      linkedEntity: { entityType: 'product', entityId: 'prod-001' },
      uploadedBy: 'u-001',
      processingProgress: 1,
      variantCount: 2,
      createdAt: '2026-06-30T00:00:00.000Z',
      updatedAt: '2026-06-30T00:00:00.000Z',
    })

    assert.deepEqual(contract, {
      id: 'asset-001',
      tenantId: 'tenant-001',
      originalFilename: 'demo.jpg',
      assetType: 'image',
      mimeType: 'image/jpeg',
      sizeBytes: 2048,
      contentHash: 'hash-001',
      storageBackend: 's3',
      storageKey: 'tenant-001/multimedia/2026/06/hash-001.jpg',
      cdnUrl: 'https://cdn.example.com/hash-001.jpg',
      url: 'https://cdn.example.com/hash-001.jpg',
      status: 'ready',
      visibility: 'tenant_internal',
      tags: ['cover'],
      linkedEntity: { entityType: 'product', entityId: 'prod-001' },
      processingProgress: 1,
      createdAt: '2026-06-30T00:00:00.000Z',
      updatedAt: '2026-06-30T00:00:00.000Z',
    })
  })

  it('create/list/stats mapper 返回共享 contract 结构', () => {
    const createContract = toCreateAssetResponseContract(
      {
        id: 'asset-002',
        tenantId: 'tenant-001',
        originalFilename: 'shared.png',
        assetType: 'image',
        mimeType: 'image/png',
        sizeBytes: 4096,
        contentHash: 'hash-002',
        storageBackend: 'oss',
        storageKey: 'tenant-001/multimedia/2026/06/hash-002.png',
        status: 'uploading',
        visibility: 'public',
        tags: ['banner'],
        uploadedBy: 'u-001',
        processingProgress: 0,
        createdAt: '2026-06-30T00:00:00.000Z',
        updatedAt: '2026-06-30T00:00:00.000Z',
      },
      true,
    )
    assert.equal(createContract.isDuplicate, true)
    assert.equal(createContract.originalFilename, 'shared.png')

    const variantContract = toAssetVariantContract({
      id: 'var-001',
      assetId: 'asset-002',
      variantType: 'thumbnail',
      format: 'webp',
      sizeBytes: 512,
      storageKey: 'tenant-001/multimedia/2026/06/hash-002-thumb.webp',
      url: 'https://cdn.example.com/hash-002-thumb.webp',
      processingDurationMs: 30,
      status: 'completed',
      createdAt: '2026-06-30T00:01:00.000Z',
    })
    assert.equal(variantContract.status, 'completed')
    assert.equal(variantContract.url, 'https://cdn.example.com/hash-002-thumb.webp')

    const backendContract = toStorageBackendContract({
      id: 'backend-001',
      name: 'default-oss',
      type: 'oss',
      bucket: 'media',
      region: 'cn-shanghai',
      endpoint: 'https://oss-cn-shanghai.aliyuncs.com',
      credentialsEncrypted: 'secret',
      cdnDomain: 'media.example.com',
      isDefault: true,
      enabled: true,
      createdAt: '2026-06-30T00:00:00.000Z',
      updatedAt: '2026-06-30T00:00:00.000Z',
    })
    assert.equal(
      Object.prototype.hasOwnProperty.call(backendContract, 'credentialsEncrypted'),
      false,
    )
    assert.equal(backendContract.type, 'oss')
    assert.equal(backendContract.endpoint, 'https://oss-cn-shanghai.aliyuncs.com')
    assert.equal(backendContract.cdnDomain, 'media.example.com')
    assert.equal(backendContract.createdAt, '2026-06-30T00:00:00.000Z')

    const listContract = toAssetListResponseContract([createContract])
    assert.equal(listContract.total, 1)
    assert.equal(listContract.items[0]?.id, 'asset-002')

    const statsContract = toStorageStatsContract({
      totalAssets: 3,
      totalSizeBytes: 999,
      byType: {
        image: { count: 2, sizeBytes: 333 },
      },
      recentUploads: 2,
      avgProcessingTimeMs: 12,
      duplicateHits: 1,
    })
    assert.deepEqual(statsContract, {
      totalAssets: 3,
      totalSizeBytes: 999,
      byType: {
        image: { count: 2, sizeBytes: 333 },
      },
      recentUploads: 2,
      avgProcessingTimeMs: 12,
      duplicateHits: 1,
    })
  })

  it('isValidAssetType 检查', () => {
    assert.equal(isValidAssetType('image'), true)
    assert.equal(isValidAssetType('video'), true)
    assert.equal(isValidAssetType('audio'), true)
    assert.equal(isValidAssetType('document'), true)
    assert.equal(isValidAssetType('unknown'), true)
    assert.equal(isValidAssetType('exe' as any), false)
    assert.equal(isValidAssetType('' as any), false)
  })

  it('isValidAssetVisibility 检查', () => {
    assert.equal(isValidAssetVisibility('public'), true)
    assert.equal(isValidAssetVisibility('private'), true)
    assert.equal(isValidAssetVisibility('tenant_internal'), true)
    assert.equal(isValidAssetVisibility('signed_url_only'), true)
    assert.equal(isValidAssetVisibility('invalid' as any), false)
  })

  it('isValidStorageBackendType 检查', () => {
    assert.equal(isValidStorageBackendType('s3'), true)
    assert.equal(isValidStorageBackendType('oss'), true)
    assert.equal(isValidStorageBackendType('cos'), true)
    assert.equal(isValidStorageBackendType('local'), true)
    assert.equal(isValidStorageBackendType('azure_blob'), true)
    assert.equal(isValidStorageBackendType('gcs'), true)
    assert.equal(isValidStorageBackendType('ftp' as any), false)
  })
})
