/**
 * 🐜 自动: [oss] [D] contract 补全
 *
 * OSS 文件管理：跨模块合约类型
 * 供其他模块（marketing, report, content, ai-push 等）消费。
 */
import type {
  OssProvider,
  OssStorageClass,
  OssFileType,
  OssFileStatus,
} from './oss.entity'
import type {
  OssFileResponse,
  FileListResponse,
  BucketResponse,
  InitUploadResponse,
  DownloadUrlResponse,
  StorageStatsResponse,
} from './oss.dto'

/**
 * OSS 文件合约 (跨模块安全子集)
 */
export interface OssFileContract {
  id: string
  tenantId: string
  originalFilename: string
  mimeType: string
  sizeBytes: number
  contentHash: string
  etag: string
  provider: OssProvider
  bucket: string
  objectKey: string
  cdnUrl?: string
  url?: string
  fileType: OssFileType
  storageClass: OssStorageClass
  status: OssFileStatus
  tags: string[]
  uploadedBy: string
  createdAt: string
  updatedAt: string
}

/**
 * 文件列表合约
 */
export interface FileListContract {
  items: OssFileContract[]
  total: number
  page: number
  pageSize: number
}

/**
 * OSS 桶合约
 */
export interface OssBucketContract {
  id: string
  name: string
  provider: OssProvider
  region: string
  cdnDomain?: string
  isDefault: boolean
  enabled: boolean
}

/**
 * 上传初始化响应合约
 */
export interface InitUploadContract {
  fileId: string
  objectKey: string
  uploadUrl: string
  expiresAt: number
}

/**
 * 下载 URL 合约
 */
export interface DownloadUrlContract {
  url: string
  expiresAt: number
  objectKey: string
}

/**
 * 存储统计合约
 */
export interface OssStorageStatsContract {
  totalFiles: number
  totalSizeBytes: number
  byType: Record<string, { count: number; sizeBytes: number }>
  byStorageClass: Record<string, { count: number; sizeBytes: number }>
  recentUploads: number
}

/**
 * 合约版本号
 */
export const OSS_CONTRACT_VERSION = '1.0.0'

/**
 * 合约稳定性标记
 */
export type ContractStability = 'stable' | 'experimental' | 'deprecated'

export const CONTRACT_STABILITY: Record<string, ContractStability> = {
  OssFileContract: 'stable',
  FileListContract: 'stable',
  OssBucketContract: 'stable',
  InitUploadContract: 'stable',
  DownloadUrlContract: 'stable',
  OssStorageStatsContract: 'stable',
}

// ============ 转换函数 ============

export function toOssFileContract(file: OssFileResponse): OssFileContract {
  return {
    id: file.id,
    tenantId: file.tenantId,
    originalFilename: file.originalFilename,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    contentHash: file.contentHash,
    etag: file.etag,
    provider: file.provider,
    bucket: file.bucket,
    objectKey: file.objectKey,
    cdnUrl: file.cdnUrl,
    url: file.url,
    fileType: file.fileType,
    storageClass: file.storageClass,
    status: file.status,
    tags: file.tags,
    uploadedBy: file.uploadedBy,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  }
}

export function toFileListContract(resp: FileListResponse): FileListContract {
  return {
    items: resp.items.map(toOssFileContract),
    total: resp.total,
    page: resp.page,
    pageSize: resp.pageSize,
  }
}

export function toOssBucketContract(bucket: BucketResponse): OssBucketContract {
  return {
    id: bucket.id,
    name: bucket.name,
    provider: bucket.provider,
    region: bucket.region,
    cdnDomain: bucket.cdnDomain,
    isDefault: bucket.isDefault,
    enabled: bucket.enabled,
  }
}

export function toInitUploadContract(resp: InitUploadResponse): InitUploadContract {
  return {
    fileId: resp.fileId,
    objectKey: resp.objectKey,
    uploadUrl: resp.uploadUrl,
    expiresAt: resp.expiresAt,
  }
}

export function toDownloadUrlContract(resp: DownloadUrlResponse): DownloadUrlContract {
  return {
    url: resp.url,
    expiresAt: resp.expiresAt,
    objectKey: resp.objectKey,
  }
}

export function toOssStorageStatsContract(stats: StorageStatsResponse): OssStorageStatsContract {
  return {
    totalFiles: stats.totalFiles,
    totalSizeBytes: stats.totalSizeBytes,
    byType: stats.byType,
    byStorageClass: stats.byStorageClass,
    recentUploads: stats.recentUploads,
  }
}

/**
 * 合约断言：检测 OSS 文件形状
 */
export function assertOssFileContractShape(obj: unknown): obj is OssFileContract {
  if (typeof obj !== 'object' || obj === null) return false
  const o = obj as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.tenantId === 'string' &&
    typeof o.originalFilename === 'string' &&
    typeof o.mimeType === 'string' &&
    typeof o.sizeBytes === 'number' &&
    typeof o.contentHash === 'string' &&
    typeof o.storageClass === 'string' &&
    Array.isArray(o.tags) &&
    typeof o.createdAt === 'string' &&
    typeof o.updatedAt === 'string'
  )
}
