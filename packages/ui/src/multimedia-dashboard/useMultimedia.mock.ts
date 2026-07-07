/**
 * Phase 99 多模态存储 前台 Mock (V11 Sprint 3 Day 34 - SSR mock)
 */

import type { MultimediaAsset, StorageBackend, StorageStats } from './types'

const MOCK_ASSETS: MultimediaAsset[] = [
  {
    id: 'asset-001',
    tenantId: 'tenant-A',
    originalFilename: 'hero-banner.jpg',
    assetType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 1024 * 1024 * 2.5,
    contentHash: 'abc1234567890abcdef',
    storageBackend: 's3',
    storageKey: 'tenant-A/multimedia/2026/06/abc1234567890.jpg',
    cdnUrl: 'https://cdn.shenjiying88.com/hero-banner.jpg',
    status: 'ready',
    visibility: 'public',
    dimensions: { width: 1920, height: 1080 },
    tags: ['hero', 'homepage'],
    uploadedBy: 'admin-A',
    processingProgress: 1.0,
    variantCount: 3,
    createdAt: '2026-06-25T10:00:00Z',
    updatedAt: '2026-06-25T10:05:00Z',
  },
  {
    id: 'asset-002',
    tenantId: 'tenant-A',
    originalFilename: 'product-demo.mp4',
    assetType: 'video',
    mimeType: 'video/mp4',
    sizeBytes: 1024 * 1024 * 50,
    contentHash: 'def4567890123',
    storageBackend: 'oss',
    storageKey: 'tenant-A/multimedia/2026/06/def4567890123.mp4',
    status: 'processing',
    visibility: 'tenant_internal',
    dimensions: { width: 1920, height: 1080, durationSec: 120 },
    tags: ['product', 'demo'],
    uploadedBy: 'admin-A',
    processingProgress: 0.65,
    variantCount: 0,
    createdAt: '2026-06-27T15:30:00Z',
    updatedAt: '2026-06-27T15:32:00Z',
  },
  {
    id: 'asset-003',
    tenantId: 'tenant-A',
    originalFilename: 'invoice-may.pdf',
    assetType: 'document',
    mimeType: 'application/pdf',
    sizeBytes: 1024 * 256,
    contentHash: '789abcdef012',
    storageBackend: 's3',
    storageKey: 'tenant-A/multimedia/2026/06/789abcdef012.pdf',
    status: 'ready',
    visibility: 'private',
    tags: ['finance', 'invoice'],
    linkedEntity: { entityType: 'report', entityId: 'rpt-2026-05' },
    uploadedBy: 'admin-A',
    processingProgress: 1.0,
    variantCount: 1,
    createdAt: '2026-06-26T08:00:00Z',
    updatedAt: '2026-06-26T08:02:00Z',
  },
]

const MOCK_BACKENDS: StorageBackend[] = [
  { id: 'storage-s3-prod', name: 'AWS S3 生产环境', type: 's3', bucket: 'shenjiying-prod', region: 'ap-east-1', cdnDomain: 'cdn.shenjiying88.com', isDefault: true, enabled: true, createdAt: '2026-01-01' },
  { id: 'storage-oss-backup', name: '阿里云 OSS 备份', type: 'oss', bucket: 'shenjiying-backup', region: 'cn-shanghai', isDefault: false, enabled: true, createdAt: '2026-03-15' },
]

const MOCK_STATS: StorageStats = {
  totalAssets: 156,
  totalSizeBytes: 1024 * 1024 * 1024 * 4.2,
  byType: {
    image: { count: 98, sizeBytes: 1024 * 1024 * 512 },
    video: { count: 23, sizeBytes: 1024 * 1024 * 1024 * 3 },
    document: { count: 31, sizeBytes: 1024 * 1024 * 256 },
    audio: { count: 4, sizeBytes: 1024 * 1024 * 128 },
  },
  recentUploads: 12,
  avgProcessingTimeMs: 1850,
  duplicateHits: 7,
}

export function useMultimediaAssets(_opts: { assetType?: string; tags?: string[]; limit?: number } = {}) {
  return { data: MOCK_ASSETS, isLoading: false }
}

export function useStorageStats() {
  return { data: MOCK_STATS, isLoading: false }
}

export function useStorageBackends() {
  return { data: MOCK_BACKENDS, isLoading: false }
}

export function useUploadAsset() {
  return {
    mutate: (_input: any) => undefined,
    isPending: false,
    data: undefined,
  }
}

export function useDeleteAsset() {
  return {
    mutate: (_assetId: string) => undefined,
    isPending: false,
  }
}

export function useGenerateSignedUrl() {
  return {
    mutate: (_input: any) => undefined,
    isPending: false,
    data: { url: 'https://cdn.shenjiying88.com/mock?signature=test', expiresAt: 0 },
  }
}

export function useAddStorageBackend() {
  return {
    mutate: (_input: any) => undefined,
    isPending: false,
  }
}