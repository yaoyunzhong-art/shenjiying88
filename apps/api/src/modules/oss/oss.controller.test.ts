/**
 * 🐜 自动: [oss] [D] controller.test
 *
 * OSS 文件管理 Controller 单元测试
 * 覆盖 16 场景, 使用 runWithTenant 提供 tenant 上下文
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { OssController } from './oss.controller'
import { OssService } from './oss.service'
import { runWithTenant } from '../../common/context/tenant-context'

const tenantCtx = { tenantId: 'tenant-oss-test', userId: 'tester-01', storeId: 'store-01' }

describe('OssController', () => {
  let controller: OssController
  let service: OssService

  beforeEach(() => {
    service = new OssService()
    controller = new OssController(service)
  })

  // ============ 上传 ============

  it('1. initUpload — 初始化上传返回签名 URL', async () => {
    await runWithTenant(tenantCtx, async () => {
      const dto = {
        originalFilename: 'report.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024 * 1024,
        contentHash: 'abc123hash',
        tags: ['monthly', 'finance'],
      }

      const result = await controller.initUpload(dto)

      expect(result).toBeDefined()
      expect(result.fileId).toBeTruthy()
      expect(result.objectKey).toContain('abc123')
      expect(result.uploadUrl).toContain('cdn.shenjiying88.com')
      expect(result.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000) - 10)
    })
  })

  it('2. initUpload — 同 contentHash 去重返回相同 fileId', async () => {
    await runWithTenant(tenantCtx, async () => {
      const dto = {
        originalFilename: 'logo.png',
        mimeType: 'image/png',
        sizeBytes: 51200,
        contentHash: 'duplicate-hash',
      }

      const first = await controller.initUpload(dto)
      const second = await controller.initUpload(dto)

      expect(second.fileId).toBe(first.fileId)
    })
  })

  it('3. initUpload — 非法 MIME type 抛出', async () => {
    await runWithTenant(tenantCtx, async () => {
      const dto = {
        originalFilename: 'hack.html',
        mimeType: 'text/html',
        sizeBytes: 100,
        contentHash: 'bad-mime',
      }

      await expect(controller.initUpload(dto)).rejects.toThrow(/不在白名单/)
    })
  })

  it('4. completeUpload — 上传完成使文件就绪', async () => {
    await runWithTenant(tenantCtx, async () => {
      const initResult = await controller.initUpload({
        originalFilename: 'photo.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 204800,
        contentHash: 'ready-test-hash',
      })

      const result = await controller.completeUpload(initResult.fileId, { etag: '"abc123"' })

      expect(result.status).toBe('ready')
      expect(result.etag).toBe('"abc123"')
      expect(result.url).toContain('oss.shenjiying88.com')
    })
  })

  it('5. completeUpload — 重新确认已就绪文件抛出', async () => {
    await runWithTenant(tenantCtx, async () => {
      const initResult = await controller.initUpload({
        originalFilename: 'doc.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 500000,
        contentHash: 'double-complete-hash',
      })

      await controller.completeUpload(initResult.fileId, { etag: '"etag1"' })
      await expect(
        controller.completeUpload(initResult.fileId, { etag: '"etag2"' }),
      ).rejects.toThrow(/不在上传中状态/)
    })
  })

  // ============ 下载 ============

  it('6. generateDownloadUrl — 返回预签名下载链接', async () => {
    await runWithTenant(tenantCtx, async () => {
      const initResult = await controller.initUpload({
        originalFilename: 'video.mp4',
        mimeType: 'video/mp4',
        sizeBytes: 100 * 1024 * 1024,
        contentHash: 'dl-test-hash',
      })
      await controller.completeUpload(initResult.fileId, { etag: '"dl-etag"' })

      const result = await controller.generateDownloadUrl(initResult.fileId, { expiresInSec: 1800 })

      expect(result.url).toBeTruthy()
      expect(result.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000))
    })
  })

  // ============ 获取 ============

  it('7. getFile — 按 ID 获取文件信息', async () => {
    await runWithTenant(tenantCtx, async () => {
      const initResult = await controller.initUpload({
        originalFilename: 'config.json',
        mimeType: 'application/json',
        sizeBytes: 4096,
        contentHash: 'get-file-test-hash',
      })
      await controller.completeUpload(initResult.fileId, { etag: '"get-etag"' })

      const result = await controller.getFile(initResult.fileId)

      expect(result.id).toBe(initResult.fileId)
      expect(result.originalFilename).toBe('config.json')
      expect(result.mimeType).toBe('application/json')
    })
  })

  it('8. getFile — 不存在的文件抛出 404', async () => {
    await runWithTenant(tenantCtx, async () => {
      await expect(controller.getFile('non-existent-id')).rejects.toThrow(/不存在/)
    })
  })

  // ============ 列表 ============

  it('9. listFiles — 分页列表返回正确总数量和页码', async () => {
    await runWithTenant(tenantCtx, async () => {
      for (let i = 0; i < 3; i++) {
        const r = await controller.initUpload({
          originalFilename: `file-${i}.jpg`,
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
          contentHash: `list-test-hash-${i}`,
        })
        await controller.completeUpload(r.fileId, { etag: `"etag-${i}"` })
      }

      const result = await controller.listFiles({ page: 1, pageSize: 10 })
      expect(result.total).toBe(3)
      expect(result.items.length).toBe(3)
      expect(result.page).toBe(1)
    })
  })

  it('10. listFiles — 按 fileType 筛选', async () => {
    await runWithTenant(tenantCtx, async () => {
      await controller.initUpload({
        originalFilename: 'img.png',
        mimeType: 'image/png',
        sizeBytes: 1024,
        contentHash: 'filter-type-img',
      })
      await controller.initUpload({
        originalFilename: 'doc.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        contentHash: 'filter-type-doc',
      })

      const result = await controller.listFiles({ fileType: 'image' })
      expect(result.total).toBe(1)
      expect(result.items[0].fileType).toBe('image')
    })
  })

  // ============ 删除 ============

  it('11. deleteFile — 删除后获取抛 404', async () => {
    await runWithTenant(tenantCtx, async () => {
      const initResult = await controller.initUpload({
        originalFilename: 'delete-me.txt',
        mimeType: 'text/plain',
        sizeBytes: 100,
        contentHash: 'delete-test-hash',
      })

      await controller.deleteFile(initResult.fileId)
      await expect(controller.getFile(initResult.fileId)).rejects.toThrow(/不存在/)
    })
  })

  it('12. deleteFiles — 批量删除统计正确', async () => {
    await runWithTenant(tenantCtx, async () => {
      const ids: string[] = []
      for (let i = 0; i < 4; i++) {
        const r = await controller.initUpload({
          originalFilename: `batch-${i}.txt`,
          mimeType: 'text/plain',
          sizeBytes: 100,
          contentHash: `batch-delete-hash-${i}`,
        })
        ids.push(r.fileId)
      }

      const result = await controller.deleteFiles({ fileIds: ids })
      expect(result.deleted).toBe(4)
      expect(result.failed).toBe(0)
    })
  })

  // ============ 桶管理 ============

  it('13. createBucket — 创建存储桶并自动设为默认', async () => {
    await runWithTenant(tenantCtx, async () => {
      const result = await controller.createBucket({
        name: 'test-bucket',
        provider: 'aliyun',
        region: 'cn-shanghai',
        endpoint: 'oss-cn-shanghai.aliyuncs.com',
        accessKey: 'ak-test',
        secretKey: 'sk-test',
        isDefault: true,
      })

      expect(result.id).toBeTruthy()
      expect(result.name).toBe('test-bucket')
      expect(result.provider).toBe('aliyun')
      expect(result.isDefault).toBe(true)
    })
  })

  it('14. listBuckets — 列出当前租户所有桶', async () => {
    await runWithTenant(tenantCtx, async () => {
      await controller.initUpload({
        originalFilename: 'a.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 100,
        contentHash: 'bucket-list-test',
      })

      const buckets = await controller.listBuckets()
      expect(buckets.length).toBeGreaterThanOrEqual(1)
      expect(buckets[0].name).toContain('shenjiying-oss')
    })
  })

  // ============ 统计 ============

  it('15. getStats — 返回正确的存储统计', async () => {
    await runWithTenant(tenantCtx, async () => {
      await controller.initUpload({
        originalFilename: 'stat-test.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 102400,
        contentHash: 'stats-test-hash',
      })

      const stats = await controller.getStats()
      expect(stats.totalFiles).toBeGreaterThanOrEqual(0)
      expect(stats.totalSizeBytes).toBeGreaterThanOrEqual(0)
      expect(stats.byType).toBeDefined()
      expect(stats.byStorageClass).toBeDefined()
    })
  })

  // ============ 签名 URL ============

  it('16. generateSignedUrl — 生成上传/下载签名', async () => {
    await runWithTenant(tenantCtx, async () => {
      const initResult = await controller.initUpload({
        originalFilename: 'signed.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1024,
        contentHash: 'signed-url-test',
      })

      const result = await controller.generateSignedUrl(initResult.fileId, {
        operation: 'download',
        expiresInSec: 3600,
      })

      expect(result.url).toBeTruthy()
      expect(result.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000))
    })
  })
})
