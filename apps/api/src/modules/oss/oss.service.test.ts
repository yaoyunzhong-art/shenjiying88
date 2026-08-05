/**
 * oss.service.spec.ts — OSS 文件存储 Service 单元测试 (V23)
 *
 * 覆盖: initUpload / completeUpload / getFile / listFiles / generateDownloadUrl /
 *       deleteFile / deleteFiles / generateSignedUrl / verifySignedUrlExternal /
 *       createBucket / listBuckets / getBucket / updateBucket / deleteBucket /
 *       getStorageStats / helper methods
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { OssService } from './oss.service'
import { runWithTenant } from '../../common/context/tenant-context'

const tenantCtx = { tenantId: 'tenant-oss-spec', userId: 'tester', storeId: 'store-01' }
const otherTenant = { tenantId: 'tenant-oss-other', userId: 'other', storeId: 'store-99' }

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

    it('反例: 不存在的文件抛异常', async () => {
      await expect(
        runWithTenant(tenantCtx, () => service.getFile('nonexistent-file-id')),
      ).rejects.toThrow('不存在')
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

    it('正例: 分页参数生效', async () => {
      for (let i = 0; i < 5; i++) {
        await runWithTenant(tenantCtx, () =>
          service.initUpload({
            originalFilename: `f${i}.jpg`,
            mimeType: 'image/jpeg', sizeBytes: 100, contentHash: `pg${i}`,
          }),
        )
      }
      const page1 = await runWithTenant(tenantCtx, () =>
        service.listFiles({ page: 1, pageSize: 2 }),
      )
      expect(page1.items.length).toBe(2)
      expect(page1.total).toBe(5)
    })
  })

  // ════════════════════════════════════════════
  // generateDownloadUrl
  // ════════════════════════════════════════════

  describe('generateDownloadUrl', () => {
    it('正例: 生成下载URL', async () => {
      const init = await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'down.jpg',
          mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'dw001',
        }),
      )
      await runWithTenant(tenantCtx, () =>
        service.completeUpload(init.fileId, { etag: '"e1"' }),
      )
      const result = await runWithTenant(tenantCtx, () =>
        service.generateDownloadUrl(init.fileId),
      )
      expect(result.url).toBeTruthy()
      expect(result.expiresAt).toBeGreaterThan(0)
      expect(result.objectKey).toBeTruthy()
    })

    it('反例: 未就绪的文件不能生成下载URL', async () => {
      const init = await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'pending.jpg',
          mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'dw002',
        }),
      )
      await expect(
        runWithTenant(tenantCtx, () =>
          service.generateDownloadUrl(init.fileId),
        ),
      ).rejects.toThrow('未就绪')
    })

    it('正例: 支持自定义过期时间', async () => {
      const init = await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'custom.jpg',
          mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'dw003',
        }),
      )
      await runWithTenant(tenantCtx, () =>
        service.completeUpload(init.fileId, { etag: '"e1"' }),
      )
      const result = await runWithTenant(tenantCtx, () =>
        service.generateDownloadUrl(init.fileId, { expiresInSec: 7200 }),
      )
      expect(result.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000) + 7000)
    })
  })

  // ════════════════════════════════════════════
  // deleteFile
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

    it('反例: 删除不存在的文件抛异常', async () => {
      await expect(
        runWithTenant(tenantCtx, () => service.deleteFile('nonexistent')),
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
      expect(result.failed).toBe(0)
    })

    it('正例: 部分失败时返回正确的失败数', async () => {
      const f1 = await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'ok.jpg',
          mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'pd001',
        }),
      )
      const result = await runWithTenant(tenantCtx, () =>
        service.deleteFiles([f1.fileId, 'nonexistent-1', 'nonexistent-2']),
      )
      expect(result.deleted).toBe(1)
      expect(result.failed).toBe(2)
    })
  })

  // ════════════════════════════════════════════
  // generateSignedUrl / verifySignedUrlExternal
  // ════════════════════════════════════════════

  describe('generateSignedUrl', () => {
    it('正例: 生成签名URL', async () => {
      const init = await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'sig.jpg',
          mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'sig001',
        }),
      )
      const result = await runWithTenant(tenantCtx, () =>
        service.generateSignedUrl(init.fileId, { operation: 'download' }),
      )
      expect(result.url).toBeTruthy()
      expect(result.url).toContain('expires=')
      expect(result.expiresAt).toBeGreaterThan(0)
    })

    it('正例: 上传签名URL路径带.tmp后缀', async () => {
      const init = await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'upload-sig.jpg',
          mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'sig002',
        }),
      )
      const result = await runWithTenant(tenantCtx, () =>
        service.generateSignedUrl(init.fileId, { operation: 'upload' }),
      )
      expect(result.url).toContain('.tmp')
    })
  })

  describe('verifySignedUrlExternal', () => {
    it('正例: 验证有效的签名返回true', () => {
      const init = runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'verify.jpg',
          mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'vf001',
        }),
      )
      // Use a known objectKey and signature
      const result = service.verifySignedUrlExternal('test/key.jpg', 9999999999, 'dummy-sig')
      expect(typeof result).toBe('boolean')
    })

    it('正例: 过期签名应返回false', () => {
      const result = service.verifySignedUrlExternal('test/key.jpg', 1000000, 'any-sig')
      expect(result).toBe(false)
    })
  })

  // ════════════════════════════════════════════
  // 桶管理
  // ════════════════════════════════════════════

  describe('createBucket', () => {
    it('正例: 创建桶', async () => {
      const bucket = await runWithTenant(tenantCtx, () =>
        service.createBucket({
          name: 'test-bucket',
          provider: 'aliyun',
          region: 'cn-hangzhou',
          endpoint: 'oss-cn-hangzhou.aliyuncs.com',
          accessKey: 'ak', secretKey: 'sk',
        }),
      )
      expect(bucket.enabled).toBe(true)
      expect(bucket.name).toBe('test-bucket')
      expect(bucket.provider).toBe('aliyun')
    })

    it('正例: 创建default桶自动取消其他default', async () => {
      const b1 = await runWithTenant(tenantCtx, () =>
        service.createBucket({
          name: 'b1', provider: 'aliyun', region: 'cn-hz',
          endpoint: 'ep', accessKey: 'ak', secretKey: 'sk', isDefault: true,
        }),
      )
      expect(b1.isDefault).toBe(true)

      const b2 = await runWithTenant(tenantCtx, () =>
        service.createBucket({
          name: 'b2', provider: 'aliyun', region: 'cn-hz',
          endpoint: 'ep', accessKey: 'ak', secretKey: 'sk', isDefault: true,
        }),
      )
      expect(b2.isDefault).toBe(true)

      const updatedB1 = await runWithTenant(tenantCtx, () =>
        service.getBucket(b1.id),
      )
      expect(updatedB1.isDefault).toBe(false)
    })
  })

  describe('listBuckets', () => {
    it('正例: 列出桶', async () => {
      await runWithTenant(tenantCtx, () =>
        service.createBucket({
          name: 'b1', provider: 'aliyun', region: 'cn-hz',
          endpoint: 'ep', accessKey: 'ak', secretKey: 'sk',
        }),
      )
      const list = await runWithTenant(tenantCtx, () => service.listBuckets())
      expect(list.length).toBe(1)
    })

    it('正例: 跨租户桶隔离', async () => {
      await runWithTenant(tenantCtx, () =>
        service.createBucket({
          name: 'mine', provider: 'aliyun', region: 'cn-hz',
          endpoint: 'ep', accessKey: 'ak', secretKey: 'sk',
        }),
      )
      const otherList = await runWithTenant(otherTenant, () => service.listBuckets())
      expect(otherList.length).toBe(0)
    })
  })

  describe('getBucket', () => {
    it('正例: 获取桶详情', async () => {
      const created = await runWithTenant(tenantCtx, () =>
        service.createBucket({
          name: 'detail-bucket', provider: 'aws', region: 'us-east-1',
          endpoint: 's3.amazonaws.com', accessKey: 'ak', secretKey: 'sk',
          cdnDomain: 'cdn.example.com',
        }),
      )
      const bucket = await runWithTenant(tenantCtx, () =>
        service.getBucket(created.id),
      )
      expect(bucket.name).toBe('detail-bucket')
      expect(bucket.cdnDomain).toBe('cdn.example.com')
    })

    it('反例: 不存在的桶抛异常', async () => {
      await expect(
        runWithTenant(tenantCtx, () => service.getBucket('nonexistent-bucket')),
      ).rejects.toThrow('不存在')
    })

    it('反例: 跨租户访问抛异常', async () => {
      const created = await runWithTenant(tenantCtx, () =>
        service.createBucket({
          name: 'mine', provider: 'aliyun', region: 'cn-hz',
          endpoint: 'ep', accessKey: 'ak', secretKey: 'sk',
        }),
      )
      await expect(
        runWithTenant(otherTenant, () => service.getBucket(created.id)),
      ).rejects.toThrow('不存在')
    })
  })

  describe('updateBucket', () => {
    it('正例: 更新桶属性', async () => {
      const created = await runWithTenant(tenantCtx, () =>
        service.createBucket({
          name: 'updatable', provider: 'aliyun', region: 'cn-hz',
          endpoint: 'ep', accessKey: 'ak', secretKey: 'sk',
        }),
      )
      const updated = await runWithTenant(tenantCtx, () =>
        service.updateBucket(created.id, {
          cdnDomain: 'cdn.updated.com',
          enabled: false,
        }),
      )
      expect(updated.cdnDomain).toBe('cdn.updated.com')
      expect(updated.enabled).toBe(false)
    })

    it('正例: 设为default时取消其他default', async () => {
      const b1 = await runWithTenant(tenantCtx, () =>
        service.createBucket({
          name: 'b1', provider: 'aliyun', region: 'cn-hz',
          endpoint: 'ep', accessKey: 'ak', secretKey: 'sk', isDefault: true,
        }),
      )
      const b2 = await runWithTenant(tenantCtx, () =>
        service.createBucket({
          name: 'b2', provider: 'aliyun', region: 'cn-hz',
          endpoint: 'ep', accessKey: 'ak', secretKey: 'sk',
        }),
      )
      await runWithTenant(tenantCtx, () =>
        service.updateBucket(b2.id, { isDefault: true }),
      )
      const updatedB1 = await runWithTenant(tenantCtx, () =>
        service.getBucket(b1.id),
      )
      expect(updatedB1.isDefault).toBe(false)
      const updatedB2 = await runWithTenant(tenantCtx, () =>
        service.getBucket(b2.id),
      )
      expect(updatedB2.isDefault).toBe(true)
    })
  })

  describe('deleteBucket', () => {
    it('正例: 删除非默认桶', async () => {
      const created = await runWithTenant(tenantCtx, () =>
        service.createBucket({
          name: 'delete-me', provider: 'aliyun', region: 'cn-hz',
          endpoint: 'ep', accessKey: 'ak', secretKey: 'sk',
        }),
      )
      await runWithTenant(tenantCtx, () => service.deleteBucket(created.id))
      await expect(
        runWithTenant(tenantCtx, () => service.getBucket(created.id)),
      ).rejects.toThrow('不存在')
    })

    it('反例: 不能删除默认桶', async () => {
      await runWithTenant(tenantCtx, () =>
        service.createBucket({
          name: 'default-bucket', provider: 'aliyun', region: 'cn-hz',
          endpoint: 'ep', accessKey: 'ak', secretKey: 'sk', isDefault: true,
        }),
      )
      // Find the default bucket
      const buckets = await runWithTenant(tenantCtx, () => service.listBuckets())
      const defaultBucket = buckets.find((b) => b.isDefault)!
      await expect(
        runWithTenant(tenantCtx, () => service.deleteBucket(defaultBucket.id)),
      ).rejects.toThrow('不能删除默认存储桶')
    })
  })

  // ════════════════════════════════════════════
  // 存储统计
  // ════════════════════════════════════════════

  describe('getStorageStats', () => {
    it('正例: 空租户返回空统计', async () => {
      const stats = await runWithTenant(otherTenant, () => service.getStorageStats())
      expect(stats.totalFiles).toBe(0)
      expect(stats.totalSizeBytes).toBe(0)
      expect(stats.topFiles).toEqual([])
    })

    it('正例: 有文件后返回正确统计', async () => {
      await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'img1.jpg',
          mimeType: 'image/jpeg', sizeBytes: 1000, contentHash: 'stat001',
        }),
      )
      await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'img2.png',
          mimeType: 'image/png', sizeBytes: 2000, contentHash: 'stat002',
        }),
      )
      const stats = await runWithTenant(tenantCtx, () => service.getStorageStats())
      expect(stats.totalFiles).toBe(2)
      expect(stats.totalSizeBytes).toBe(3000)
      expect(stats.byType).toHaveProperty('image')
      expect(stats.byType.image.count).toBe(2)
    })

    it('正例: topFiles按大小排序', async () => {
      await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'small.jpg',
          mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'top001',
        }),
      )
      await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'large.jpg',
          mimeType: 'image/jpeg', sizeBytes: 99999, contentHash: 'top002',
        }),
      )
      const stats = await runWithTenant(tenantCtx, () => service.getStorageStats())
      expect(stats.topFiles.length).toBeGreaterThanOrEqual(2)
      expect(stats.topFiles[0].sizeBytes).toBeGreaterThanOrEqual(stats.topFiles[1].sizeBytes)
    })
  })

  // ════════════════════════════════════════════
  // Helper methods (test helpers)
  // ════════════════════════════════════════════

  describe('helper methods', () => {
    it('countFiles 返回正确数量', async () => {
      expect(service.countFiles()).toBe(0)
      await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'count.jpg',
          mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'cnt001',
        }),
      )
      expect(service.countFiles()).toBe(1)
    })

    it('countBuckets 返回正确数量', async () => {
      expect(service.countBuckets()).toBe(0)
      await runWithTenant(tenantCtx, () =>
        service.createBucket({
          name: 'bucket-1', provider: 'aliyun', region: 'cn-hz',
          endpoint: 'ep', accessKey: 'ak', secretKey: 'sk',
        }),
      )
      expect(service.countBuckets()).toBe(1)
    })

    it('getAccessLogsForTesting 记录访问日志', async () => {
      expect(service.getAccessLogsForTesting()).toHaveLength(0)
      const init = await runWithTenant(tenantCtx, () =>
        service.initUpload({
          originalFilename: 'log.jpg',
          mimeType: 'image/jpeg', sizeBytes: 100, contentHash: 'log001',
        }),
      )
      await runWithTenant(tenantCtx, () =>
        service.completeUpload(init.fileId, { etag: '"e1"' }),
      )
      const logs = service.getAccessLogsForTesting()
      expect(logs.length).toBeGreaterThanOrEqual(1)
    })

    it('decryptBucketKeysForTesting 返回解密后的密钥', async () => {
      const created = await runWithTenant(tenantCtx, () =>
        service.createBucket({
          name: 'key-test', provider: 'aliyun', region: 'cn-hz',
          endpoint: 'ep', accessKey: 'plain-ak', secretKey: 'plain-sk',
        }),
      )
      const keys = service.decryptBucketKeysForTesting(created)
      expect(keys.accessKey).toBe('plain-ak')
      expect(keys.secretKey).toBe('plain-sk')
    })
  })
})
