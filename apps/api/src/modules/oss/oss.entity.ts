/**
 * Phase V23 OSS 文件管理 Entity (V23 Sprint Day 21-22)
 *
 * OssFile: 统一文件抽象 (支持 Aliyun OSS / AWS S3 / Tencent COS)
 * OssBucket: 存储桶配置
 * OssAccessLog: 访问审计日志
 */

export type OssProvider = 'aliyun' | 'aws' | 'tencent' | 'minio' | 'local'

export type OssStorageClass = 'standard' | 'infrequent_access' | 'archive' | 'cold_archive'

export type OssFileStatus = 'uploading' | 'processing' | 'ready' | 'failed'

export type OssFileType = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other'

/**
 * OSS 文件
 */
export interface OssFile {
  id: string
  tenantId: string
  /** 文件名 (原始) */
  originalFilename: string
  /** MIME type */
  mimeType: string
  /** 字节大小 */
  sizeBytes: number
  /** 内容 MD5/ETag (上传校验) */
  etag: string
  /** 内容 SHA-256 哈希 (去重) */
  contentHash: string
  /** 存储提供方 */
  provider: OssProvider
  /** 存储桶 */
  bucket: string
  /** 存储路径 */
  objectKey: string
  /** CDN URL */
  cdnUrl?: string
  /** 公开 URL */
  url?: string
  /** 临时签名 URL 过期时间 */
  signedUrlExpiresAt?: string
  /** 文件类型 */
  fileType: OssFileType
  /** 存储类型 */
  storageClass: OssStorageClass
  /** 状态 */
  status: OssFileStatus
  /** 标签 */
  tags: string[]
  /** 关联业务实体 */
  linkedEntity?: {
    entityType: 'product' | 'order' | 'member' | 'report' | 'receipt' | 'contract' | 'other'
    entityId: string
  }
  /** 上传者 */
  uploadedBy: string
  /** 错误信息 */
  errorMessage?: string
  /** 版权信息 */
  copyright?: string
  createdAt: string
  updatedAt: string
}

/**
 * OSS 存储桶配置
 */
export interface OssBucket {
  id: string
  tenantId: string
  /** 桶名称 */
  name: string
  /** 存储提供方 */
  provider: OssProvider
  /** 区域 */
  region: string
  /** Endpoint */
  endpoint: string
  /** 访问密钥 (加密存储) */
  accessKeyEncrypted: string
  /** 秘钥 (加密存储) */
  secretKeyEncrypted: string
  /** CDN 域名 */
  cdnDomain?: string
  /** 默认桶 */
  isDefault: boolean
  /** 是否启用 */
  enabled: boolean
  createdAt: string
  updatedAt: string
}

/**
 * OSS 访问日志
 */
export interface OssAccessLog {
  id: string
  fileId: string
  tenantId: string
  /** 操作类型 */
  action: 'upload' | 'download' | 'delete' | 'list' | 'signed_url' | 'view'
  /** 访问者 */
  accessor: string
  /** IP 地址 */
  ip?: string
  /** User-Agent */
  userAgent?: string
  /** 访问时间 */
  accessedAt: string
}

/**
 * OSS 存储统计
 */
export interface OssStorageStats {
  totalFiles: number
  totalSizeBytes: number
  byType: Record<string, { count: number; sizeBytes: number }>
  byStorageClass: Record<string, { count: number; sizeBytes: number }>
  recentUploads: number
}

// ============ ID 生成 ============

export function generateFileId(): string {
  return `oss-file-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

export function generateBucketId(): string {
  return `oss-bucket-${Math.random().toString(36).slice(2, 8)}`
}

export function generateAccessLogId(): string {
  return `oss-log-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

// ============ 工具函数 ============

/**
 * MIME → OssFileType 推断
 */
export function inferFileType(mimeType: string): OssFileType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('application/zip') || mimeType.startsWith('application/gzip') || mimeType.startsWith('application/x-tar')) return 'archive'
  const docTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml', 'text/plain']
  if (docTypes.some((t) => mimeType.startsWith(t) || mimeType.includes(t))) return 'document'
  return 'other'
}

/**
 * 对象 Key 生成
 */
export function buildObjectKey(tenantId: string, contentHash: string, filename: string, prefix?: string): string {
  const ext = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : ''
  const date = new Date()
  const yyyy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  const path = prefix ? `${prefix}/` : ''
  return `${tenantId}/oss/${path}${yyyy}/${mm}/${dd}/${contentHash.slice(0, 20)}${ext}`
}

/**
 * MIME type 白名单
 */
export const ALLOWED_MIME_TYPES = [
  // image
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/heic', 'image/tiff',
  // video
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
  // audio
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac', 'audio/flac',
  // document
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'text/markdown',
  // archive
  'application/zip', 'application/gzip', 'application/x-tar', 'application/x-7z-compressed',
  // other
  'application/json', 'application/xml', 'application/octet-stream',
]

export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType)
}

/**
 * 文件大小限制 (字节)
 */
export const MAX_FILE_SIZES: Record<OssFileType, number> = {
  image: 50 * 1024 * 1024,
  video: 2 * 1024 * 1024 * 1024,
  audio: 500 * 1024 * 1024,
  document: 100 * 1024 * 1024,
  archive: 500 * 1024 * 1024,
  other: 200 * 1024 * 1024,
}

/**
 * 文件扩展名提取
 */
export function extractExtension(filename: string): string {
  const idx = filename.lastIndexOf('.')
  return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : ''
}

/**
 * 签名 URL 生成 (HMAC-SHA256)
 */
export function generateSignedUrl(opts: {
  objectKey: string
  expiresAt: number
  secret: string
  baseUrl?: string
}): string {
  const { createHmac } = require('node:crypto')
  const payload = `${opts.objectKey}:${opts.expiresAt}`
  const sig = createHmac('sha256', opts.secret).update(payload).digest('base64url')
  const base = opts.baseUrl ?? 'https://cdn.shenjiying88.com'
  return `${base}/${opts.objectKey}?expires=${opts.expiresAt}&signature=${sig}`
}

export function verifySignedUrl(objectKey: string, expiresAt: number, signature: string, secret: string): boolean {
  if (Date.now() / 1000 > expiresAt) return false
  const { createHmac } = require('node:crypto')
  const payload = `${objectKey}:${expiresAt}`
  const expectedSig = createHmac('sha256', secret).update(payload).digest('base64url')
  return expectedSig === signature
}
