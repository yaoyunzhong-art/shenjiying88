import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * multimedia.dto.test.ts — 多模态 DTO 单元测试
 *
 * 覆盖所有 DTO 接口的结构完整性和类型合规性
 * - CreateAssetDto / CompleteUploadDto / CreateVariantDto
 * - AddStorageBackendDto / GenerateSignedUrlDto
 * - AssetResponse / StorageStatsResponse
 */

import assert from 'node:assert'
import type {
  CreateAssetDto,
  CompleteUploadDto,
  CreateVariantDto,
  AddStorageBackendDto,
  GenerateSignedUrlDto,
  AssetResponse,
  StorageStatsResponse,
} from './multimedia.dto'

void describe('MultimediaDto', () => {
  void describe('CreateAssetDto', () => {
    void it('应包含必填字段', () => {
      const dto: CreateAssetDto = {
        originalFilename: 'photo.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 102400,
        contentHash: 'a'.repeat(64),
      }
      assert.strictEqual(dto.originalFilename, 'photo.jpg')
      assert.strictEqual(dto.mimeType, 'image/jpeg')
      assert.strictEqual(dto.sizeBytes, 102400)
      assert.strictEqual(dto.contentHash, 'a'.repeat(64))
    })

    void it('应支持可选字段', () => {
      const dto: CreateAssetDto = {
        originalFilename: 'video.mp4',
        mimeType: 'video/mp4',
        sizeBytes: 524288000,
        contentHash: 'b'.repeat(64),
        visibility: 'private',
        tags: ['intro', 'promo'],
        linkedEntity: { entityType: 'product', entityId: 'prod-001' },
        storageBackendId: 's3-main',
      }
      assert.strictEqual(dto.visibility, 'private')
      assert.deepStrictEqual(dto.tags, ['intro', 'promo'])
      assert.strictEqual(dto.linkedEntity!.entityType, 'product')
      assert.strictEqual(dto.storageBackendId, 's3-main')
    })

    void it('linkedEntity 应仅允许指定 entityType', () => {
      const dto: CreateAssetDto = {
        originalFilename: 'report.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
        contentHash: 'c'.repeat(64),
        linkedEntity: { entityType: 'report', entityId: 'rpt-123' },
      }
      assert.strictEqual(dto.linkedEntity!.entityType, 'report')
      // TS 编译检查: 'report' | 'order' | 'member' | 'product' | 'receipt' | 'other'
      const validTypes = ['product', 'order', 'member', 'report', 'receipt', 'other'] as const
      assert.ok(validTypes.includes(dto.linkedEntity!.entityType as typeof validTypes[number]))
    })
  })

  void describe('CompleteUploadDto', () => {
    void it('应包含可选的 uploadEtag', () => {
      const dto: CompleteUploadDto = { uploadEtag: '"abc123"' }
      assert.strictEqual(dto.uploadEtag, '"abc123"')
    })

    void it('uploadEtag 应可为空', () => {
      const dto: CompleteUploadDto = {}
      assert.strictEqual(dto.uploadEtag, undefined)
    })
  })

  void describe('CreateVariantDto', () => {
    void it('应包含必填字段', () => {
      const dto: CreateVariantDto = {
        variantType: 'thumbnail',
        format: 'webp',
        sizeBytes: 25600,
      }
      assert.strictEqual(dto.variantType, 'thumbnail')
      assert.strictEqual(dto.format, 'webp')
      assert.strictEqual(dto.sizeBytes, 25600)
    })

    void it('应支持全部 variantType 枚举值', () => {
      const types: CreateVariantDto['variantType'][] = [
        'thumbnail', 'preview', 'compressed', 'transcoded',
        'watermarked', 'extracted_audio', 'text_ocr', 'json_metadata',
      ]
      for (const t of types) {
        const dto: CreateVariantDto = { variantType: t, format: 'test', sizeBytes: 100 }
        assert.strictEqual(dto.variantType, t)
      }
    })

    void it('应支持带参数的变体', () => {
      const dto: CreateVariantDto = {
        variantType: 'compressed',
        format: 'avif',
        sizeBytes: 12800,
        parameters: { quality: '80', width: '1024' },
      }
      assert.strictEqual(dto.parameters!.quality, '80')
    })
  })

  void describe('AddStorageBackendDto', () => {
    void it('应包含必填字段', () => {
      const dto: AddStorageBackendDto = {
        name: 'AWS S3 Tokyo',
        type: 's3',
        bucket: 'my-bucket',
        region: 'ap-northeast-1',
        credentials: 'encrypted-credential',
      }
      assert.strictEqual(dto.name, 'AWS S3 Tokyo')
      assert.strictEqual(dto.type, 's3')
      assert.strictEqual(dto.region, 'ap-northeast-1')
    })

    void it('应支持可选字段', () => {
      const dto: AddStorageBackendDto = {
        name: '阿里云 OSS',
        type: 'oss',
        bucket: 'oss-bucket',
        region: 'cn-hangzhou',
        endpoint: 'oss-cn-hangzhou.aliyuncs.com',
        credentials: 'ak-secret',
        cdnDomain: 'cdn.example.com',
        isDefault: true,
      }
      assert.strictEqual(dto.endpoint, 'oss-cn-hangzhou.aliyuncs.com')
      assert.ok(dto.isDefault)
    })

    void it('应支持全部 StorageBackendType', () => {
      const types: AddStorageBackendDto['type'][] = ['s3', 'oss', 'cos', 'local', 'azure_blob', 'gcs']
      for (const t of types) {
        const dto: AddStorageBackendDto = { name: 't', type: t, bucket: 'b', region: 'r', credentials: 'c' }
        assert.strictEqual(dto.type, t)
      }
    })
  })

  void describe('GenerateSignedUrlDto', () => {
    void it('应包含可选的 expiresInSec', () => {
      const dto: GenerateSignedUrlDto = { expiresInSec: 7200 }
      assert.strictEqual(dto.expiresInSec, 7200)
    })

    void it('应支持 variantId', () => {
      const dto: GenerateSignedUrlDto = { expiresInSec: 3600, variantId: 'var-abc123' }
      assert.strictEqual(dto.variantId, 'var-abc123')
    })

    void it('expiresInSec 默认应省略', () => {
      const dto: GenerateSignedUrlDto = {}
      assert.strictEqual(dto.expiresInSec, undefined)
    })
  })

  void describe('AssetResponse', () => {
    void it('应包含所有核心字段', () => {
      const resp: AssetResponse = {
        id: 'asset-abc',
        tenantId: 'tenant-1',
        originalFilename: 'photo.jpg',
        assetType: 'image',
        mimeType: 'image/jpeg',
        sizeBytes: 102400,
        contentHash: 'a'.repeat(64),
        storageBackend: 's3',
        storageKey: 't1/multimedia/2026/06/a.jpg',
        cdnUrl: 'https://cdn.example.com/a.jpg',
        url: 'https://cdn.example.com/a.jpg',
        signedUrlExpiresAt: undefined as any,
        status: 'ready',
        visibility: 'public',
        tags: ['tag1'],
        uploadedBy: 'user-1',
        processingProgress: 1,
        variantCount: 2,
        createdAt: '2026-06-01T00:00:00Z',
        updatedAt: '2026-06-01T01:00:00Z',
      }
      assert.ok(resp.id)
      assert.ok(resp.cdnUrl)
      assert.strictEqual(resp.status, 'ready')
    })
  })

  void describe('StorageStatsResponse', () => {
    void it('应返回完整的统计结构', () => {
      const stats: StorageStatsResponse = {
        totalAssets: 1000,
        totalSizeBytes: 10737418240,
        byType: {
          image: { count: 800, sizeBytes: 1073741824 },
          video: { count: 100, sizeBytes: 8589934592 },
          audio: { count: 50, sizeBytes: 536870912 },
          document: { count: 50, sizeBytes: 536870912 },
        },
        recentUploads: 20,
        avgProcessingTimeMs: 1500,
        duplicateHits: 45,
      }
      assert.strictEqual(stats.totalAssets, 1000)
      assert.strictEqual(stats.totalSizeBytes, 10 * 1024 ** 3) // 10 GB
      assert.strictEqual(stats.byType.image.count, 800)
      assert.ok(stats.duplicateHits >= 0)
    })
  })
})
