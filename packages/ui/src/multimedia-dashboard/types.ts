/**
 * Phase 99 多模态存储 前台 Types (V11 Sprint 3 Day 34)
 */

export type AssetType = 'image' | 'video' | 'audio' | 'document' | 'unknown'
export type AssetStatus = 'uploading' | 'processing' | 'ready' | 'failed' | 'deleted'
export type AssetVisibility = 'public' | 'private' | 'tenant_internal' | 'signed_url_only'
export type StorageBackendType = 's3' | 'oss' | 'cos' | 'local' | 'azure_blob' | 'gcs'

export interface MultimediaAsset {
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
  status: AssetStatus
  visibility: AssetVisibility
  dimensions?: { width?: number; height?: number; durationSec?: number }
  tags: string[]
  linkedEntity?: { entityType: string; entityId: string }
  uploadedBy: string
  processingProgress: number
  variantCount: number
  createdAt: string
  updatedAt: string
}

export interface StorageBackend {
  id: string
  name: string
  type: StorageBackendType
  bucket: string
  region: string
  endpoint?: string
  cdnDomain?: string
  isDefault: boolean
  enabled: boolean
  createdAt: string
}

export interface StorageStats {
  totalAssets: number
  totalSizeBytes: number
  byType: Record<string, { count: number; sizeBytes: number }>
  recentUploads: number
  avgProcessingTimeMs: number
  duplicateHits: number
}

// ============ 显示标签 ============

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  image: '图片',
  video: '视频',
  audio: '音频',
  document: '文档',
  unknown: '未知',
}

export const ASSET_TYPE_ICONS: Record<AssetType, string> = {
  image: '🖼️',
  video: '🎬',
  audio: '🎵',
  document: '📄',
  unknown: '📎',
}

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  uploading: '上传中',
  processing: '处理中',
  ready: '就绪',
  failed: '失败',
  deleted: '已删除',
}

export const ASSET_STATUS_COLORS: Record<AssetStatus, string> = {
  uploading: '#1890ff',
  processing: '#13c2c2',
  ready: '#52c41a',
  failed: '#ff4d4f',
  deleted: '#bfbfbf',
}

export const BACKEND_TYPE_LABELS: Record<StorageBackendType, string> = {
  s3: 'AWS S3',
  oss: '阿里云 OSS',
  cos: '腾讯云 COS',
  local: '本地存储',
  azure_blob: 'Azure Blob',
  gcs: 'Google Cloud Storage',
}

/**
 * 人类可读字节
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 2 : 0)} ${units[i]}`
}