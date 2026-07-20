/**
 * Phase V23 OSS 文件管理 DTO (V23 Sprint Day 21-22)
 */

import type {
  OssProvider,
  OssStorageClass,
  OssFileType,
  OssFileStatus,
} from './oss.entity'

// ============ 文件上传 ============

export interface InitUploadDto {
  originalFilename: string
  mimeType: string
  sizeBytes: number
  contentHash: string
  storageClass?: OssStorageClass
  tags?: string[]
  linkedEntity?: {
    entityType: 'product' | 'order' | 'member' | 'report' | 'receipt' | 'contract' | 'other'
    entityId: string
  }
  /** 自定义存储目录前缀 */
  prefix?: string
  /** 指定桶 ID (默认用 default bucket) */
  bucketId?: string
}

export interface CompleteUploadDto {
  etag: string
  /** 上传后由客户端计算的 SHA-256 */
  serverContentHash?: string
}

// ============ 文件下载 ============

export interface GenerateDownloadUrlDto {
  /** 过期秒数 (默认 3600) */
  expiresInSec?: number
}

export interface DownloadUrlResponse {
  url: string
  expiresAt: number
  objectKey: string
}

// ============ 文件删除 ============

export interface DeleteFileDto {
  /** 是否递归删除 (针对目录) */
  recursive?: boolean
}

// ============ 文件列表 ============

export interface ListFilesQueryDto {
  prefix?: string
  fileType?: OssFileType
  tags?: string | string[]
  linkedEntityId?: string
  status?: OssFileStatus
  page?: number
  pageSize?: number
  sortBy?: 'createdAt' | 'sizeBytes' | 'originalFilename'
  sortOrder?: 'asc' | 'desc'
}

// ============ 桶管理 ============

export interface CreateBucketDto {
  name: string
  provider: OssProvider
  region: string
  endpoint: string
  accessKey: string
  secretKey: string
  cdnDomain?: string
  isDefault?: boolean
}

export interface UpdateBucketDto {
  cdnDomain?: string
  isDefault?: boolean
  enabled?: boolean
  region?: string
  endpoint?: string
  accessKey?: string
  secretKey?: string
}

// ============ 签名 URL ============

export interface GenerateSignedUrlDto {
  /** 操作 (upload/download) */
  operation: 'upload' | 'download'
  /** 过期秒数 (默认 3600) */
  expiresInSec?: number
  /** 上传时指定 content-type */
  contentType?: string
  /** 上传时指定文件大小上限 */
  contentLengthRange?: { min: number; max: number }
}

// ============ 响应 ============

export interface OssFileResponse {
  id: string
  tenantId: string
  originalFilename: string
  mimeType: string
  sizeBytes: number
  etag: string
  contentHash: string
  provider: OssProvider
  bucket: string
  objectKey: string
  cdnUrl?: string
  url?: string
  fileType: OssFileType
  storageClass: OssStorageClass
  status: OssFileStatus
  tags: string[]
  linkedEntity?: {
    entityType: string
    entityId: string
  }
  uploadedBy: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface FileListResponse {
  items: OssFileResponse[]
  total: number
  page: number
  pageSize: number
}

export interface BucketResponse {
  id: string
  tenantId: string
  name: string
  provider: OssProvider
  region: string
  endpoint: string
  cdnDomain?: string
  isDefault: boolean
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface InitUploadResponse {
  fileId: string
  objectKey: string
  uploadUrl: string
  expiresAt: number
}

export interface StorageStatsResponse {
  totalFiles: number
  totalSizeBytes: number
  byType: Record<string, { count: number; sizeBytes: number }>
  byStorageClass: Record<string, { count: number; sizeBytes: number }>
  recentUploads: number
  topFiles: Array<{ id: string; originalFilename: string; sizeBytes: number }>
}
