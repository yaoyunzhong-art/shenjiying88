import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * multimedia.entity.test.ts — 多模态存储 Entity 单元测试
 *
 * 覆盖:
 * - 类型守卫 / 工具函数
 * - generateAssetId / generateVariantId / generateBackendId / generateAccessLogId
 * - computeContentHash / inferAssetType / buildStorageKey
 * - isAllowedMimeType / MAX_FILE_SIZES
 * - generateSignedUrl / verifySignedUrl
 * - isDuplicateContent / buildThumbnailParams / buildVideoParams
 * - extractExtension
 */

import assert from 'node:assert'
import {
  generateAssetId,
  generateVariantId,
  generateBackendId,
  generateAccessLogId,
  computeContentHash,
  inferAssetType,
  buildStorageKey,
  isAllowedMimeType,
  MAX_FILE_SIZES,
  generateSignedUrl,
  verifySignedUrl,
  isDuplicateContent,
  buildThumbnailParams,
  buildVideoParams,
  extractExtension,
  ALLOWED_MIME_TYPES,
} from './multimedia.entity'

void describe('MultimediaEntity', () => {
  void describe('generateAssetId', () => {
    void it('应生成格式正确的资产ID', () => {
      const id = generateAssetId()
      assert.ok(id.startsWith('asset-'), `ID应以 asset- 开头, 实际: ${id}`)
      assert.ok(id.length > 12, `ID长度应大于12, 实际: ${id.length}`)
    })

    void it('应生成唯一ID (连续调用去重)', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateAssetId()))
      assert.strictEqual(ids.size, 100, '100次调用应生成100个唯一ID')
    })
  })

  void describe('generateVariantId', () => {
    void it('应生成格式正确的变体ID', () => {
      const id = generateVariantId()
      assert.ok(id.startsWith('var-'), `ID应以 var- 开头, 实际: ${id}`)
    })

    void it('应生成唯一ID', () => {
      const ids = new Set(Array.from({ length: 50 }, () => generateVariantId()))
      assert.strictEqual(ids.size, 50)
    })
  })

  void describe('generateBackendId', () => {
    void it('应生成格式正确的后端ID', () => {
      const id = generateBackendId()
      assert.ok(id.startsWith('storage-'), `ID应以 storage- 开头, 实际: ${id}`)
    })
  })

  void describe('generateAccessLogId', () => {
    void it('应生成格式正确的访问日志ID', () => {
      const id = generateAccessLogId()
      assert.ok(id.startsWith('acc-'), `ID应以 acc- 开头, 实际: ${id}`)
    })
  })

  void describe('computeContentHash', () => {
    void it('应对字符串内容计算SHA-256', () => {
      const hash = computeContentHash('hello')
      assert.strictEqual(typeof hash, 'string')
      assert.strictEqual(hash.length, 64, 'SHA-256 hex 长度为64')
    })

    void it('应对Buffer内容计算SHA-256', () => {
      const hash = computeContentHash(Buffer.from('world'))
      assert.strictEqual(hash.length, 64)
    })

    void it('相同内容应生成相同哈希', () => {
      const a = computeContentHash('test-data')
      const b = computeContentHash('test-data')
      assert.strictEqual(a, b)
    })

    void it('不同内容应生成不同哈希', () => {
      const a = computeContentHash('foo')
      const b = computeContentHash('bar')
      assert.notStrictEqual(a, b)
    })
  })

  void describe('inferAssetType', () => {
    void it('image/jpeg 应推断为 image', () => {
      assert.strictEqual(inferAssetType('image/jpeg'), 'image')
    })

    void it('video/mp4 应推断为 video', () => {
      assert.strictEqual(inferAssetType('video/mp4'), 'video')
    })

    void it('audio/mpeg 应推断为 audio', () => {
      assert.strictEqual(inferAssetType('audio/mpeg'), 'audio')
    })

    void it('application/pdf 应推断为 document', () => {
      assert.strictEqual(inferAssetType('application/pdf'), 'document')
    })

    void it('未知 MIME 应推断为 unknown', () => {
      assert.strictEqual(inferAssetType('application/octet-stream'), 'unknown')
    })
  })

  void describe('buildStorageKey', () => {
    const fixedDate = new Date('2026-06-01T00:00:00Z')

    void it('应生成正确的存储路径', () => {
      const key = buildStorageKey('tenant-a', 'abc123def', 'photo.jpg', fixedDate)
      assert.ok(key.startsWith('tenant-a/multimedia/2026/06/'))
      assert.ok(key.endsWith('.jpg'))
      assert.ok(key.includes('abc123def'))
    })

    void it('无扩展名文件应正确处理', () => {
      const key = buildStorageKey('t1', 'hash123', 'noext', fixedDate)
      assert.ok(!key.endsWith('.'), '无扩展名不应追加点号')
    })

    void it('多段扩展名应只取最后一段', () => {
      const key = buildStorageKey('t1', 'hash', 'archive.tar.gz', fixedDate)
      assert.ok(key.endsWith('.gz'), '应取 .gz 作为扩展名')
    })
  })

  void describe('isAllowedMimeType', () => {
    void it('应允许常见图片类型', () => {
      assert.ok(isAllowedMimeType('image/jpeg'))
      assert.ok(isAllowedMimeType('image/png'))
      assert.ok(isAllowedMimeType('image/webp'))
    })

    void it('应允许常见视频类型', () => {
      assert.ok(isAllowedMimeType('video/mp4'))
      assert.ok(isAllowedMimeType('video/webm'))
    })

    void it('应拒绝不允许的类型', () => {
      assert.ok(!isAllowedMimeType('text/html'))
      assert.ok(!isAllowedMimeType('application/java-archive'))
    })

    void it('ALLOWED_MIME_TYPES 应包含所有分类', () => {
      assert.ok(Array.isArray(ALLOWED_MIME_TYPES.image))
      assert.ok(Array.isArray(ALLOWED_MIME_TYPES.video))
      assert.ok(Array.isArray(ALLOWED_MIME_TYPES.audio))
      assert.ok(Array.isArray(ALLOWED_MIME_TYPES.document))
    })
  })

  void describe('MAX_FILE_SIZES', () => {
    void it('应定义各类型的大小限制', () => {
      assert.ok(MAX_FILE_SIZES.image > 0)
      assert.ok(MAX_FILE_SIZES.video > MAX_FILE_SIZES.image)
      assert.ok(MAX_FILE_SIZES.unknown > 0)
    })
  })

  void describe('generateSignedUrl', () => {
    void it('应生成包含签名的URL', () => {
      const future = Math.floor(Date.now() / 1000) + 3600
      const url = generateSignedUrl({
        storageKey: 't1/multimedia/2026/06/abc.jpg',
        expiresAt: future,
        secret: 'test-secret',
      })
      assert.ok(url.startsWith('https://cdn.shenjiying88.com/'))
      assert.ok(url.includes('expires='))
      assert.ok(url.includes('signature='))
    })

    void it('应支持自定义baseUrl', () => {
      const future = Math.floor(Date.now() / 1000) + 3600
      const url = generateSignedUrl({
        storageKey: 'key',
        expiresAt: future,
        secret: 's',
        baseUrl: 'https://my-cdn.example.com',
      })
      assert.ok(url.startsWith('https://my-cdn.example.com/'))
    })
  })

  void describe('verifySignedUrl', () => {
    void it('应通过有效的签名URL验证', () => {
      const expiresAt = Math.floor(Date.now() / 1000) + 3600
      const secret = 'verify-test-secret'
      const url = generateSignedUrl({ storageKey: 'test/key.jpg', expiresAt, secret })
      const parsed = new URL(url)
      const sig = parsed.searchParams.get('signature')!
      assert.ok(verifySignedUrl(url, expiresAt, sig, secret))
    })

    void it('应拒绝过期的签名URL', () => {
      const expired = Math.floor(Date.now() / 1000) - 60
      const secret = 'test'
      const url = generateSignedUrl({ storageKey: 'old/key.jpg', expiresAt: expired, secret })
      const parsed = new URL(url)
      const sig = parsed.searchParams.get('signature')!
      assert.ok(!verifySignedUrl(url, expired, sig, secret))
    })

    void it('应拒绝签名不匹配的URL', () => {
      const expiresAt = Math.floor(Date.now() / 1000) + 3600
      const url = generateSignedUrl({ storageKey: 'key', expiresAt, secret: 'secret-a' })
      assert.ok(!verifySignedUrl(url, expiresAt, 'invalid-signature', 'secret-a'))
    })
  })

  void describe('isDuplicateContent', () => {
    void it('相同哈希应返回 true', () => {
      assert.ok(isDuplicateContent('hash1', 'hash1'))
    })

    void it('不同哈希应返回 false', () => {
      assert.ok(!isDuplicateContent('hash1', 'hash2'))
    })
  })

  void describe('buildThumbnailParams', () => {
    void it('应生成缩略图参数字符串', () => {
      const result = buildThumbnailParams({ width: 256, height: 256 })
      assert.ok(result.includes('256x256'))
      assert.ok(result.includes('q80'))
    })

    void it('应支持自定义格式和画质', () => {
      const result = buildThumbnailParams({ width: 128, height: 128, quality: 90, format: 'jpeg' })
      assert.ok(result.includes('128x128'))
      assert.ok(result.includes('q90'))
      assert.ok(result.includes('jpeg'))
    })
  })

  void describe('buildVideoParams', () => {
    void it('应生成视频转码参数字符串', () => {
      const result = buildVideoParams({ resolution: '720p', bitrate: '2M', codec: 'h264' })
      assert.ok(result.includes('720p'))
      assert.ok(result.includes('2M'))
      assert.ok(result.includes('h264'))
    })
  })

  void describe('extractExtension', () => {
    void it('应提取普通扩展名', () => {
      assert.strictEqual(extractExtension('photo.jpg'), 'jpg')
    })

    void it('应返回小写', () => {
      assert.strictEqual(extractExtension('Photo.JPG'), 'jpg')
    })

    void it('无扩展名应返回空字符串', () => {
      assert.strictEqual(extractExtension('README'), '')
    })

    void it('隐藏文件应正确处理', () => {
      assert.strictEqual(extractExtension('.gitignore'), 'gitignore')
    })
  })
})
