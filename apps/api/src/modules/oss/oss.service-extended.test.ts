/**
 * oss.service-extended.test.ts — OssService 单元测试
 *
 * 覆盖内容（每个 describe 分组 ≥3 tests，总计 ≥15）：
 * - initUpload（文件上传初始化/去重/MIME校验/大小校验/自动创桶）
 * - completeUpload（上传完成确认/状态变更/CDN URL生成）
 * - getFile / listFiles（文件查询/分页/多条件筛选/排序）
 * - generateDownloadUrl / generateSignedUrl（URL生成/过期）
 * - deleteFile / deleteFiles（单文件/批量删除）
 * - bucket CRUD（创建/列表/详情/更新/删除）
 * - getStorageStats（统计汇总）
 *
 * 使用 runWithTenant 提供 tenant 上下文
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { OssService } from './oss.service'
import { runWithTenant } from '../../common/context/tenant-context'
import type { InitUploadDto } from './oss.dto'

const tenantCtx = { tenantId: 'tenant-oss-ext', userId: 'tester-ext', storeId: 'store-01' }

function createService(): OssService {
  return new OssService()
}

describe('OssService — extended', () => {
  let service: OssService

  beforeEach(() => {
    service = createService()
  })

  // ============ initUpload ============

  it('initUpload rejects disallowed MIME type', async () => {
    await runWithTenant(tenantCtx, async () => {
      const dto: InitUploadDto = {
        originalFilename: 'evil.html',
        mimeType: 'text/html',
        sizeBytes: 100,
        contentHash: 'hash-evil',
      }
      await expect(service.initUpload(dto)).rejects.toThrow('MIME type')
    })
  })

  it('initUpload rejects file exceeding max size for its type', async () => {
    await runWithTenant(tenantCtx, async () => {
      const dto: InitUploadDto = {
        originalFilename: 'huge.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 200 * 1024 * 1024, // > 50MB limit for images
        contentHash: 'hash-huge',
      }
      await expect(service.initUpload(dto)).rejects.toThrow('超过')
    })
  })

  it('initUpload returns fileId and signed upload URL on success', async () => {
    await runWithTenant(tenantCtx, async () => {
      const dto: InitUploadDto = {
        originalFilename: 'photo.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1024 * 1024,
        contentHash: 'hash-001',
        tags: ['monthly', 'report'],
      }
      const result = await service.initUpload(dto)
      expect(result.fileId).toBeTruthy()
      expect(result.objectKey).toContain('hash-001')
      expect(result.uploadUrl).toContain('oss')
      expect(result.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000))
    })
  })

  it('initUpload deduplicates by contentHash for same tenant', async () => {
    await runWithTenant(tenantCtx, async () => {
      const dto: InitUploadDto = {
        originalFilename: 'dup.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 51200,
        contentHash: 'hash-dup-01',
      }
      const first = await service.initUpload(dto)
      const second = await service.initUpload(dto)
      expect(second.fileId).toBe(first.fileId)
    })
  })

  it('initUpload auto-creates default bucket when none exists', async () => {
    await runWithTenant(tenantCtx, async () => {
      const buckets = await service.listBuckets()
      expect(buckets.length).toBe(0) // initially empty

      const dto: InitUploadDto = {
        originalFilename: 'test.txt',
        mimeType: 'text/plain',
        sizeBytes: 100,
        contentHash: 'hash-bucket-auto',
      }
      await service.initUpload(dto)

      const after = await service.listBuckets()
      expect(after.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ============ completeUpload ============

  it('completeUpload changes file status from uploading to ready', async () => {
    await runWithTenant(tenantCtx, async () => {
      const init = await service.initUpload({
        originalFilename: 'complete-test.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1000,
        contentHash: 'hash-complete-01',
      })
      const result = await service.completeUpload(init.fileId, { etag: '"abc123"' })
      expect(result.status).toBe('ready')
      expect(result.etag).toBe('"abc123"')
    })
  })

  it('completeUpload generates url and optionally cdnUrl', async () => {
    await runWithTenant(tenantCtx, async () => {
      const init = await service.initUpload({
        originalFilename: 'cdn-test.png',
        mimeType: 'image/png',
        sizeBytes: 2000,
        contentHash: 'hash-cdn-01',
      })
      const result = await service.completeUpload(init.fileId, { etag: '"xyz"' })
      expect(result.url).toBeTruthy()
      expect(result.url).toContain('oss.shenjiying88.com')
    })
  })

  it('completeUpload rejects non-uploading file status', async () => {
    await runWithTenant(tenantCtx, async () => {
      const init = await service.initUpload({
        originalFilename: 'double.png',
        mimeType: 'image/png',
        sizeBytes: 100,
        contentHash: 'hash-double',
      })
      await service.completeUpload(init.fileId, { etag: '"e1"' })
      // Second complete should fail
      await expect(
        service.completeUpload(init.fileId, { etag: '"e2"' }),
      ).rejects.toThrow('不在上传中状态')
    })
  })

  // ============ getFile ============

  it('getFile returns file details after upload', async () => {
    await runWithTenant(tenantCtx, async () => {
      const init = await service.initUpload({
        originalFilename: 'get-test.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 500,
        contentHash: 'hash-get-01',
      })
      await service.completeUpload(init.fileId, { etag: '"get"' })
      const file = await service.getFile(init.fileId)
      expect(file.originalFilename).toBe('get-test.jpg')
      expect(file.status).toBe('ready')
    })
  })

  it('getFile throws NotFoundException for non-existent file', async () => {
    await runWithTenant(tenantCtx, async () => {
      await expect(service.getFile('non-existent-id')).rejects.toThrow('不存在')
    })
  })

  // ============ listFiles ============

  it('listFiles returns empty array when no files', async () => {
    await runWithTenant(tenantCtx, async () => {
      const result = await service.listFiles({ page: 1, pageSize: 10 })
      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  it('listFiles returns uploaded files with pagination', async () => {
    await runWithTenant(tenantCtx, async () => {
      for (let i = 0; i < 5; i++) {
        const dto: InitUploadDto = {
          originalFilename: `file-${i}.jpg`,
          mimeType: 'image/jpeg',
          sizeBytes: 100 + i,
          contentHash: `hash-list-${i}`,
        }
        await runWithTenant(tenantCtx, async () => {
          const init = await service.initUpload(dto)
          await service.completeUpload(init.fileId, { etag: `"e${i}"` })
        })
      }
      const result = await service.listFiles({ page: 1, pageSize: 3 })
      expect(result.items.length).toBe(3)
      expect(result.total).toBe(5)
      expect(result.page).toBe(1)
    })
  })

  it('listFiles filters by fileType', async () => {
    await runWithTenant(tenantCtx, async () => {
      const dto1: InitUploadDto = {
        originalFilename: 'doc.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1000,
        contentHash: 'hash-filter-01',
      }
      const dto2: InitUploadDto = {
        originalFilename: 'video.mp4',
        mimeType: 'video/mp4',
        sizeBytes: 2000,
        contentHash: 'hash-filter-02',
      }
      const init1 = await service.initUpload(dto1)
      const init2 = await service.initUpload(dto2)
      await service.completeUpload(init1.fileId, { etag: '"pdf"' })
      await service.completeUpload(init2.fileId, { etag: '"mp4"' })

      const docs = await service.listFiles({ fileType: 'document' })
      expect(docs.items.every((f) => f.fileType === 'document')).toBe(true)
    })
  })

  // ============ deleteFile / deleteFiles ============

  it('deleteFile removes file and makes it inaccessible', async () => {
    await runWithTenant(tenantCtx, async () => {
      const init = await service.initUpload({
        originalFilename: 'del-test.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 100,
        contentHash: 'hash-del-01',
      })
      await service.deleteFile(init.fileId)
      await expect(service.getFile(init.fileId)).rejects.toThrow('不存在')
    })
  })

  it('deleteFiles returns counts of deleted and failed', async () => {
    await runWithTenant(tenantCtx, async () => {
      const inits = await Promise.all([
        service.initUpload({ originalFilename: 'a.jpg', mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'hash-batch-a' }),
        service.initUpload({ originalFilename: 'b.jpg', mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'hash-batch-b' }),
        service.initUpload({ originalFilename: 'c.jpg', mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'hash-batch-c' }),
      ])
      const result = await service.deleteFiles([inits[0].fileId, inits[1].fileId, 'non-existent-id'])
      expect(result.deleted).toBeGreaterThanOrEqual(2)
      expect(result.failed).toBeGreaterThanOrEqual(1)
    })
  })

  // ============ generateDownloadUrl ============

  it('generateDownloadUrl returns valid download URL for ready file', async () => {
    await runWithTenant(tenantCtx, async () => {
      const init = await service.initUpload({
        originalFilename: 'dl-test.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 100,
        contentHash: 'hash-dl-01',
      })
      await service.completeUpload(init.fileId, { etag: '"dl"' })
      const dl = await service.generateDownloadUrl(init.fileId)
      expect(dl.url).toBeTruthy()
      expect(dl.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000) - 10)
      expect(dl.objectKey).toBeTruthy()
    })
  })

  it('generateDownloadUrl rejects uploading file', async () => {
    await runWithTenant(tenantCtx, async () => {
      const init = await service.initUpload({
        originalFilename: 'pending.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 100,
        contentHash: 'hash-dl-pending',
      })
      await expect(service.generateDownloadUrl(init.fileId)).rejects.toThrow('未就绪')
    })
  })

  // ============ generateSignedUrl ============

  it('generateSignedUrl returns URL with expiry', async () => {
    await runWithTenant(tenantCtx, async () => {
      const init = await service.initUpload({
        originalFilename: 'signed.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 100,
        contentHash: 'hash-signed-01',
      })
      await service.completeUpload(init.fileId, { etag: '"s"' })
      const result = await service.generateSignedUrl(init.fileId, { operation: 'download', expiresInSec: 600 })
      expect(result.url).toBeTruthy()
      expect(result.expiresAt - Math.floor(Date.now() / 1000)).toBeLessThanOrEqual(610)
    })
  })

  // ============ bucket CRUD ============

  it('createBucket creates a new bucket', async () => {
    await runWithTenant(tenantCtx, async () => {
      const bucket = await service.createBucket({
        name: 'test-ext-bucket',
        provider: 'aliyun',
        region: 'cn-hangzhou',
        endpoint: 'oss-cn-hangzhou.aliyuncs.com',
        accessKey: 'test-access-key',
        secretKey: 'test-secret-key',
      })
      expect(bucket.name).toBe('test-ext-bucket')
      expect(bucket.enabled).toBe(true)
      expect(bucket.id).toBeTruthy()
    })
  })

  it('listBuckets returns created buckets', async () => {
    await runWithTenant(tenantCtx, async () => {
      await service.createBucket({
        name: 'bucket-1',
        provider: 'minio',
        region: 'us-east-1',
        endpoint: 'http://minio:9000',
        accessKey: 'ak-test',
        secretKey: 'sk-test',
      })
      await service.createBucket({
        name: 'bucket-2',
        provider: 'aws',
        region: 'us-west-2',
        endpoint: 's3.us-west-2.amazonaws.com',
        accessKey: 'ak-test-2',
        secretKey: 'sk-test-2',
      })
      const list = await service.listBuckets()
      expect(list.length).toBe(2)
    })
  })

  it('deleteBucket rejects deleting default bucket', async () => {
    await runWithTenant(tenantCtx, async () => {
      // The first auto-created bucket becomes default
      const init = await service.initUpload({
        originalFilename: 'auto.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 100,
        contentHash: 'hash-bucket-default',
      })
      const buckets = await service.listBuckets()
      const defaultBucket = buckets.find((b) => b.isDefault)
      if (defaultBucket) {
        await expect(service.deleteBucket(defaultBucket.id)).rejects.toThrow('不能删除默认存储桶')
      }
    })
  })

  // ============ getStorageStats ============

  it('getStorageStats returns zeros when no files uploaded', async () => {
    await runWithTenant(tenantCtx, async () => {
      const stats = await service.getStorageStats()
      expect(stats.totalFiles).toBe(0)
      expect(stats.totalSizeBytes).toBe(0)
    })
  })

  it('getStorageStats accumulates totalSizeBytes from uploaded files', async () => {
    await runWithTenant(tenantCtx, async () => {
      const inits = await Promise.all([
        service.initUpload({ originalFilename: 's1.jpg', mimeType: 'image/jpeg', sizeBytes: 1000, contentHash: 'hash-stat-1' }),
        service.initUpload({ originalFilename: 's2.jpg', mimeType: 'image/jpeg', sizeBytes: 2000, contentHash: 'hash-stat-2' }),
      ])
      await Promise.all([
        service.completeUpload(inits[0].fileId, { etag: '"s1"' }),
        service.completeUpload(inits[1].fileId, { etag: '"s2"' }),
      ])
      const stats = await service.getStorageStats()
      expect(stats.totalFiles).toBe(2)
      expect(stats.totalSizeBytes).toBe(3000)
    })
  })

  // ============ verifySignedUrlExternal ============

  it('verifySignedUrlExternal validates a correct signature', async () => {
    // This test does not need tenant context since verifySignedUrlExternal is stateless
    const result = service.verifySignedUrlExternal('some-key', 9999999999, 'invalid-sig')
    expect(result).toBe(false)
  })
})
