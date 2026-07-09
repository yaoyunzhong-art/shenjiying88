import { describe, it, expect, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 自动: [multimedia] [A] 后端模块补全 — 压力/韧性测试
 *
 * 覆盖边界场景:
 * - 并发大批量资产上传（高吞吐场景）
 * - 极端输入值（超大数据量、特殊字符文件名、空标签）
 * - 快速连续状态变更（上传→完成→变体→签名URL→删除）
 * - 内存压力 (大量资产模拟器运行)
 */

import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { MultimediaService } from './multimedia.service'
import { MultimediaController } from './multimedia.controller'
import { runWithTenant } from '../../common/context/tenant-context'

const TENANT_A = {
  tenantId: 'multimedia-stress-a',
  storeId: 'store-a',
  userId: 'stress-user-a',
  role: 'tenant_admin' as const,
}

const TENANT_B = {
  tenantId: 'multimedia-stress-b',
  storeId: 'store-b',
  userId: 'stress-user-b',
  role: 'tenant_admin' as const,
}

describe('Multimedia - Stress & Resilience', () => {
  let service: MultimediaService
  let controller: MultimediaController

  beforeEach(() => {
    service = new (MultimediaService as any)()
    controller = new MultimediaController(service)

    // Add a default storage backend under TENANT_A context
    runWithTenant(TENANT_A, () => {
      service.addStorageBackend({
        name: 'stress-default-s3',
        type: 's3',
        bucket: 'stress-bucket',
        region: 'us-east-1',
        credentials: 'mock-creds',
        cdnDomain: 'cdn.stress-test.com',
        isDefault: true,
      })
    })
  })

  // ─── 大批量资产上传 ───

  describe('高并发资产上传', () => {
    it('连续上传 200 个图片资产不崩溃', async () => {
      const assets = await runWithTenant(TENANT_A, async () => {
        const results = []
        for (let i = 0; i < 200; i++) {
          const hash = `stress-hash-${String(i).padStart(6, '0')}-${randomUUID().slice(0, 8)}`
          results.push(await service.createAsset({
            originalFilename: `stress-image-${i}.jpg`,
            mimeType: 'image/jpeg',
            sizeBytes: (i + 1) * 1024,
            contentHash: hash,
            tags: ['stress', `batch-${i % 10}`],
          }))
        }
        return results
      })

      assert.equal(assets.length, 200)
      assert.equal(assets[0].asset.status, 'uploading')
      assert.equal(assets[0].isDuplicate, false)
      assert.equal(assets[199].asset.originalFilename, 'stress-image-199.jpg')
    })

    it('上传 100 个不同 MIME 类型资产后统计正确', async () => {
      const mimeTypes = [
        'image/jpeg', 'image/png', 'image/webp',
        'video/mp4', 'video/webm',
        'audio/mpeg', 'audio/wav',
        'application/pdf',
      ]

      const assets = await runWithTenant(TENANT_A, async () => {
        const results = []
        for (let i = 0; i < 100; i++) {
          const mimeType = mimeTypes[i % mimeTypes.length]
          const ext = mimeType.startsWith('image/') ? '.jpg' : mimeType.startsWith('video/') ? '.mp4' : mimeType.startsWith('audio/') ? '.mp3' : '.pdf'
          results.push(await service.createAsset({
            originalFilename: `mixed-${i}${ext}`,
            mimeType,
            sizeBytes: (i + 1) * 2048,
            contentHash: `mixed-hash-${i}`,
          }))
        }
        // Complete all uploads
        for (const { asset } of results) {
          await service.completeUpload(asset.id, {})
        }
        return results
      })

      const stats = await runWithTenant(TENANT_A, () => service.getStorageStats())
      assert.equal(stats.totalAssets, 100)
      const totalCount = Object.values(stats.byType).reduce((s: number, v: any) => s + v.count, 0)
      assert.equal(totalCount, 100)
    })

    it('同租户 contentHash 去重后 duplicateHits 递增', async () => {
      await runWithTenant(TENANT_A, async () => {
        const hash = 'dedup-hash-001'
        await service.createAsset({
          originalFilename: 'original.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 50000,
          contentHash: hash,
        })

        for (let i = 0; i < 10; i++) {
          await service.createAsset({
            originalFilename: `duplicate-${i}.jpg`,
            mimeType: 'image/jpeg',
            sizeBytes: 50000,
            contentHash: hash,
          })
        }
      })

      const stats = await runWithTenant(TENANT_A, () => service.getStorageStats())
      assert.equal(stats.totalAssets, 1)
      assert.equal(stats.duplicateHits, 10)
    })
  })

  // ─── 极端输入值 ───

  describe('极端输入值', () => {
    it('超长文件名不崩溃', async () => {
      const longName = 'A'.repeat(500) + '.jpg'
      const result = await runWithTenant(TENANT_A, () =>
        service.createAsset({
          originalFilename: longName,
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
          contentHash: 'long-name-hash',
        }),
      )
      assert.equal(result.asset.originalFilename.length, 504) // 500 'A' + '.jpg' = 504
    })

    it('特殊字符文件名正常处理', async () => {
      const weirdName = '🎯 测\\试/文:件*?<>|.jpg'
      const result = await runWithTenant(TENANT_A, () =>
        service.createAsset({
          originalFilename: weirdName,
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
          contentHash: 'weird-name-hash',
        }),
      )
      assert.equal(result.asset.originalFilename, weirdName)
    })

    it('零字节文件可创建', async () => {
      const result = await runWithTenant(TENANT_A, () =>
        service.createAsset({
          originalFilename: 'empty.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 0,
          contentHash: 'zero-size-hash',
        }),
      )
      assert.equal(result.asset.sizeBytes, 0)
    })

    it('超大文件限制抛出 BadRequest', async () => {
      await runWithTenant(TENANT_A, async () => {
        await expect(
          service.createAsset({
            originalFilename: 'huge-video.mp4',
            mimeType: 'video/mp4',
            sizeBytes: 3 * 1024 * 1024 * 1024,
            contentHash: 'too-big-hash',
          }),
        ).rejects.toThrow(/文件超过/)
      })
    })

    it('空标签数组正常', async () => {
      const result = await runWithTenant(TENANT_A, () =>
        service.createAsset({
          originalFilename: 'no-tags.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
          contentHash: 'no-tags-hash',
          tags: [],
        }),
      )
      assert.deepEqual(result.asset.tags, [])
    })
  })

  // ─── 快速连续状态变更 ───

  describe('快速连续状态变更', () => {
    it('上传→完成→变体→签名URL→删除 流程通畅', async () => {
      await runWithTenant(TENANT_A, async () => {
        const { asset } = await service.createAsset({
          originalFilename: 'lifecycle-test.png',
          mimeType: 'image/png',
          sizeBytes: 100000,
          contentHash: 'lifecycle-hash',
          tags: ['lifecycle'],
        })

        const completed = await service.completeUpload(asset.id, {})
        assert.equal(completed.status, 'ready')

        const variant = await service.createVariant(asset.id, {
          variantType: 'thumbnail',
          format: 'webp',
          sizeBytes: 5000,
          parameters: { width: 256, height: 256 },
        })
        assert.equal(variant.status, 'completed')

        const signed = await service.generateSignedUrlForAsset(asset.id, {
          expiresInSec: 3600,
          variantId: variant.id,
        })
        assert.ok(signed.url.includes('expires='))
        assert.ok(signed.url.includes('signature='))

        await service.deleteAsset(asset.id)
        await expect(service.getAsset(asset.id)).rejects.toThrow(/不存在/)
      })
    })

    it('完成后立即创建多个变体', async () => {
      await runWithTenant(TENANT_A, async () => {
        const { asset } = await service.createAsset({
          originalFilename: 'multi-variant.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 200000,
          contentHash: 'multi-var-hash',
        })
        await service.completeUpload(asset.id, {})

        const variants = await Promise.all([
          service.createVariant(asset.id, { variantType: 'thumbnail', format: 'webp', sizeBytes: 3000 }),
          service.createVariant(asset.id, { variantType: 'preview', format: 'webp', sizeBytes: 15000 }),
          service.createVariant(asset.id, { variantType: 'compressed', format: 'jpeg', sizeBytes: 40000 }),
          service.createVariant(asset.id, { variantType: 'json_metadata', format: 'json', sizeBytes: 500 }),
        ])
        assert.equal(variants.length, 4)

        const listed = await service.listVariants(asset.id)
        assert.equal(listed.length, 4)
      })
    })

    it('100 次快速签名 URL 生成不报错', async () => {
      await runWithTenant(TENANT_A, async () => {
        const { asset } = await service.createAsset({
          originalFilename: 'fast-signed.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 50000,
          contentHash: 'fast-signed-hash',
        })
        await service.completeUpload(asset.id, {})

        for (let i = 0; i < 100; i++) {
          const signed = await service.generateSignedUrlForAsset(asset.id, {
            expiresInSec: 60 + i * 10,
          })
          assert.ok(signed.url)
          assert.ok(signed.expiresAt > Math.floor(Date.now() / 1000), `expiresAt should be in future at i=${i}`)
        }
      })
    })
  })

  // ─── 多租户隔离 ───

  describe('多租户隔离压力', () => {
    it('两个租户各 50 个资产互不干扰', async () => {
      await runWithTenant(TENANT_A, async () => {
        for (let i = 0; i < 50; i++) {
          await service.createAsset({
            originalFilename: `tenant1-file-${i}.jpg`,
            mimeType: 'image/jpeg',
            sizeBytes: 1000 + i,
            contentHash: `t1-hash-${i}`,
            tags: ['tenant1'],
          })
        }
      })

      await runWithTenant(TENANT_B, async () => {
        for (let i = 0; i < 50; i++) {
          await service.createAsset({
            originalFilename: `tenant2-file-${i}.png`,
            mimeType: 'image/png',
            sizeBytes: 2000 + i,
            contentHash: `t2-hash-${i}`,
            tags: ['tenant2'],
          })
        }
      })

      const statsA = await runWithTenant(TENANT_A, () => service.getStorageStats())
      assert.equal(statsA.totalAssets, 50)

      const statsB = await runWithTenant(TENANT_B, () => service.getStorageStats())
      assert.equal(statsB.totalAssets, 50)
    })

    it('跨租户 contentHash 去重视为引用', async () => {
      const sharedHash = 'shared-content-hash-001'

      await runWithTenant(TENANT_A, () =>
        service.createAsset({
          originalFilename: 'shared-from-t1.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 5000,
          contentHash: sharedHash,
        }),
      )

      const result = await runWithTenant(TENANT_B, () =>
        service.createAsset({
          originalFilename: 'shared-ref-from-t2.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 5000,
          contentHash: sharedHash,
        }),
      )

      assert.equal(result.isDuplicate, true)
      assert.equal(result.asset.tenantId, TENANT_B.tenantId)
      assert.equal(result.asset.originalFilename, 'shared-ref-from-t2.jpg')

      const statsA = await runWithTenant(TENANT_A, () => service.getStorageStats())
      assert.equal(statsA.totalAssets, 1)

      const statsB = await runWithTenant(TENANT_B, () => service.getStorageStats())
      assert.equal(statsB.totalAssets, 1)
    })
  })

  // ─── 签名 URL 验证 ───

  describe('签名 URL 验证韧性', () => {
    it('过期签名 URL 验证返回 false', async () => {
      const storageKey = 'tenant-test/multimedia/2026/07/test-key.jpg'
      const expiresAt = Math.floor(Date.now() / 1000) - 1
      const url = `https://cdn.test.com/${storageKey}?expires=${expiresAt}&signature=fake`
      const result = service.verifySignedUrlExternal(url, expiresAt, 'fake')
      assert.equal(result, false)
    })

    it('验证自己生成的签名 URL 通过', async () => {
      await runWithTenant(TENANT_A, async () => {
        const { asset } = await service.createAsset({
          originalFilename: 'verify-test.png',
          mimeType: 'image/png',
          sizeBytes: 10000,
          contentHash: 'verify-signed-url-hash',
        })
        await service.completeUpload(asset.id, {})

        const signed = await service.generateSignedUrlForAsset(asset.id, {
          expiresInSec: 600,
        })

        const urlObj = new URL(signed.url)
        const signature = urlObj.searchParams.get('signature') ?? ''
        const expires = Number(urlObj.searchParams.get('expires') ?? '0')

        assert.ok(expires > 0)
        const result = service.verifySignedUrlExternal(signed.url, expires, signature)
        assert.equal(result, true)
      })
    })
  })
})
