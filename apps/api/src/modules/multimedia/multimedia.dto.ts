/**
 * Phase 99 多模态存储 DTO (V11 Sprint 3 Day 31-32)
 */

import type { AssetType, AssetVisibility, StorageBackendType } from './multimedia.entity'

export interface CreateAssetDto {
  originalFilename: string
  mimeType: string
  sizeBytes: number
  /** 上传时已计算的 contentHash (客户端预计算节省服务端 CPU) */
  contentHash: string
  visibility?: AssetVisibility
  tags?: string[]
  linkedEntity?: {
    entityType: 'product' | 'order' | 'member' | 'report' | 'receipt' | 'other'
    entityId: string
  }
  /** 存储后端 ID (可选, 默认 default) */
  storageBackendId?: string
}

export interface CompleteUploadDto {
  /** 已上传到存储后的最终 ETag */
  uploadEtag?: string
}

export interface CreateVariantDto {
  variantType: 'thumbnail' | 'preview' | 'compressed' | 'transcoded' | 'watermarked' | 'extracted_audio' | 'text_ocr' | 'json_metadata'
  format: string
  sizeBytes: number
  parameters?: Record<string, string | number>
}

export interface AddStorageBackendDto {
  name: string
  type: StorageBackendType
  bucket: string
  region: string
  endpoint?: string
  /** 明文凭证 (服务端加密存储) */
  credentials: string
  cdnDomain?: string
  isDefault?: boolean
}

export interface GenerateSignedUrlDto {
  /** 过期时间 (秒, 默认 3600) */
  expiresInSec?: number
  /** 变体 ID (可选, 默认为原始资产) */
  variantId?: string
}

export interface ListAssetsQueryDto {
  assetType?: AssetType
  tags?: string | string[]
  linkedEntityId?: string
  limit?: number | string
}

export interface AssetResponse {
  id: string
  tenantId: string
  originalFilename: string
  assetType: AssetType
  mimeType: string
  sizeBytes: number
  contentHash: string
  storageBackend: StorageBackendType
  storageKey: string
  cdnUrl?: string
  url?: string
  signedUrlExpiresAt?: string
  status: string
  visibility: AssetVisibility
  dimensions?: any
  tags: string[]
  linkedEntity?: any
  uploadedBy: string
  processingProgress: number
  errorMessage?: string
  variantCount: number
  createdAt: string
  updatedAt: string
}

export interface StorageStatsResponse {
  totalAssets: number
  totalSizeBytes: number
  byType: Record<string, { count: number; sizeBytes: number }>
  recentUploads: number
  avgProcessingTimeMs: number
  duplicateHits: number
}
