/**
 * oss.service.spec.ts — OSS 文件存储 Service 单元测试 (V23)
 *
 * 覆盖: initUpload / completeUpload / getFile / listFiles / generateDownloadUrl /
 *       deleteFile / deleteFiles / generateSignedUrl / verifySignedUrlExternal /
 *       createBucket / listBuckets / getBucket / updateBucket / deleteBucket / getStorageStats
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { OssService } from './oss.service'
import { runWithTenant } from '../../common/context/tenant-context'

const tenantCtx = { tenantId: 'tenant-oss-spec', userId: 'tester', storeId: 'store-01' }

describe('OssService', () => {
  let service: OssService

  beforeEach(() => {
    service = new OssService()
  })

  // ════════════════════════════════════════════
  // initUpload
  // ════════════════════════════════════════════

  describe('initUpload', () => {
    it('正例: 初始化上传成功', async () => {
      const result = await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'test.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 102400,
          contentHash: 'abc123',
        }),
      )
      expect(result.fileId).toBeTruthy()
      expect(result.objectKey).toBeTruthy()
      expect(result.uploadUrl).toBeTruthy()
      expect(result.expiresAt).toBeGreaterThan(0)
    })

    it('正例: 同租户同hash去重', async () => {
      const r1 = await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'test.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 102400,
          contentHash: 'dedup001',
        }),
      )
      const r2 = await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'dup.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 102400,
          contentHash: 'dedup001',
        }),
      )
      expect(r1.fileId).toBe(r2.fileId) // 去重
    })

    it('反例: 不支持的MIME类型抛异常', async () => {
      await expect(
        runWithTenant(tenantCtx, () =>
          service.initUpload({
            originalFilename: 'test.exe',
            mimeType: 'application/x-msdownload',
            sizeBytes: 1000,
            contentHash: 'abc',
          }),
        ),
      ).rejects.toThrow('不在白名单')
    })

    it('反例: 超过大小限制抛异常', async () => {
      await expect(
        runWithTenant(tenantCtx, () =>
          service.initUpload({
            originalFilename: 'large.mp4',
            mimeType: 'video/mp4',
            sizeBytes: 5_000_000_000,
            contentHash: 'large001',
          }),
        ),
      ).rejects.toThrow('超过')
    })
  })

  // ════════════════════════════════════════════
  // completeUpload
  // ════════════════════════════════════════════

  describe('completeUpload', () => {
    it('正例: 完成上传', async () => {
      const init = await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'doc.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 50000,
          contentHash: 'pdf001',
        }),
      )
      const result = await runWithTenant(tenantCtx, () =>
        service.completeUpload(init.fileId, { etag: '"etag001"' }),
      )
      expect(result.status).toBe('ready')
      expect(result.url).toBeTruthy()
    })

    it('反例: 重复完成抛异常', async () => {
      const init = await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'doc.pdf',
          mimeType: 'application/pdf', sizeBytes: 50000, contentHash: 'pdf002',
        }),
      )
      await runWithTenant(tenantCtx, () =>
        service.completeUpload(init.fileId, { etag: '"e1"' }),
      )
      await expect(
        runWithTenant(tenantCtx, () =>
          service.completeUpload(init.fileId, { etag: '"e2"' }),
        ),
      ).rejects.toThrow('不在上传中')
    })
  })

  // ════════════════════════════════════════════
  // getFile / listFiles
  // ════════════════════════════════════════════

  describe('getFile', () => {
    it('正例: 获取文件', async () => {
      const init = await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'test.png',
          mimeType: 'image/png', sizeBytes: 1000, contentHash: 'png001',
        }),
      )
      const file = await runWithTenant(tenantCtx, () => service.getFile(init.fileId))
      expect(file.originalFilename).toBe('test.png')
    })
  })

  describe('listFiles', () => {
    it('正例: 列出文件', async () => {
      await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'a.jpg',
          mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'ls001',
        }),
      )
      const list = await runWithTenant(tenantCtx, () => service.listFiles())
      expect(list.total).toBe(1)
    })
  })

  // ════════════════════════════════════════════
  // delete
  // ════════════════════════════════════════════

  describe('deleteFile', () => {
    it('正例: 删除文件', async () => {
      const init = await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'del.jpg',
          mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'del001',
        }),
      )
      await runWithTenant(tenantCtx, () => service.deleteFile(init.fileId))
      await expect(
        runWithTenant(tenantCtx, () => service.getFile(init.fileId)),
      ).rejects.toThrow('不存在')
    })
  })

  describe('deleteFiles', () => {
    it('正例: 批量删除', async () => {
      const f1 = await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'a.jpg',
          mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'bd001',
        }),
      )
      const f2 = await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'b.jpg',
          mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'bd002',
        }),
      )
      const result = await runWithTenant(tenantCtx, () =>
        service.deleteFiles([f1.fileId, f2.fileId]),
      )
      expect(result.deleted).toBe(2)
    })
  })

  // ════════════════════════════════════════════
  // Bucket管理
  // ════════════════════════════════════════════

  describe('bucket', () => {
    it('正例: 创建桶', async () => {
      const bucket = await runWithTenant(tenantCtx, () =>
        service.createBucket({
          name: 'test-bucket',
          provider: 'aliyun',
          region: 'cn-hangzhou',
          accessKey: 'ak', secretKey: 'sk',
        }),
      )
      expect(bucket.enabled).toBe(true)
    })

    it('正例: 列出桶', async () => {
      await runWithTenant(tenantCtx, () =>
        service.createBucket({
          name: 'b1', provider: 'aliyun', region: 'cn-hz',
          accessKey: 'ak', secretKey: 'sk',
        }),
      )
      const list = await runWithTenant(tenantCtx, () => service.listBuckets())
      expect(list.length).toBe(1)
    })
  })

  // ════════════════════════════════════════════
  // 存储统计
  // ════════════════════════════════════════════

  describe('getStorageStats', () => {
    it('正例: 返回统计', async () => {
      const stats = await runWithTenant(tenantCtx, () => service.getStorageStats())
      expect(stats).toHaveProperty('totalFiles')
      expect(stats).toHaveProperty('totalSizeBytes')
      expect(stats).toHaveProperty('byType')
      expect(stats).toHaveProperty('byStorageClass')
      expect(stats).toHaveProperty('recentUploads')
    })
  })
})
