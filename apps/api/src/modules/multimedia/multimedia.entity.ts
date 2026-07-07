/**
 * Phase 99 多模态存储 Entity (V11 Sprint 3 Day 31-32)
 *
 * MultimediaAsset: 图片/音视频统一抽象
 * AssetVariant: 衍生处理版本 (thumbnail, webp, mp4-720p 等)
 * StorageBackend: 多种存储后端 (s3, oss, local)
 * AssetAccessLog: 访问审计日志
 */

export type AssetType = 'image' | 'video' | 'audio' | 'document' | 'unknown'

export type AssetVisibility = 'public' | 'private' | 'tenant_internal' | 'signed_url_only'

export type AssetStatus = 'uploading' | 'processing' | 'ready' | 'failed' | 'deleted'

/**
 * 多模态资产 (统一抽象)
 */
export interface MultimediaAsset {
  id: string
  tenantId: string
  /** 文件名 (原始) */
  originalFilename: string
  /** 资产类型 */
  assetType: AssetType
  /** MIME type */
  mimeType: string
  /** 字节大小 */
  sizeBytes: number
  /** 内容 SHA-256 哈希 (去重) */
  contentHash: string
  /** 存储后端 */
  storageBackend: StorageBackendType
  /** 存储路径 (例: tenant-A/multimedia/2026/06/abc123.jpg) */
  storageKey: string
  /** CDN URL (如有) */
  cdnUrl?: string
  /** 公开访问 URL */
  url?: string
  /** 临时签名 URL 过期时间 */
  signedUrlExpiresAt?: string
  /** 状态 */
  status: AssetStatus
  /** 可见性 */
  visibility: AssetVisibility
  /** 维度 (宽 x 高 for image/video, 秒 for audio) */
  dimensions?: {
    width?: number
    height?: number
    durationSec?: number
  }
  /** EXIF 数据 (图片) */
  exif?: Record<string, string | number>
  /** 标签 (自由文本, 用于检索) */
  tags: string[]
  /** 关联业务实体 */
  linkedEntity?: {
    entityType: 'product' | 'order' | 'member' | 'report' | 'receipt' | 'other'
    entityId: string
  }
  /** 上传者 */
  uploadedBy: string
  /** 处理进度 (0..1) */
  processingProgress: number
  /** 错误信息 */
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

/**
 * 资产衍生版本 (处理产物)
 */
export interface AssetVariant {
  id: string
  assetId: string
  /** 衍生类型 */
  variantType: 'thumbnail' | 'preview' | 'compressed' | 'transcoded' | 'watermarked' | 'extracted_audio' | 'text_ocr' | 'json_metadata'
  /** 衍生文件格式 (例: 'webp', 'mp4', 'mp3', 'json') */
  format: string
  /** 大小 (字节) */
  sizeBytes: number
  /** 存储 Key */
  storageKey: string
  /** URL */
  url?: string
  /** 衍生参数 (例: 'thumb-256x256', 'mp4-720p') */
  parameters?: Record<string, string | number>
  /** 处理耗时 (ms) */
  processingDurationMs: number
  /** 状态 */
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
}

/**
 * 存储后端类型
 */
export type StorageBackendType = 's3' | 'oss' | 'cos' | 'local' | 'azure_blob' | 'gcs'

/**
 * 存储后端配置
 */
export interface StorageBackend {
  id: string
  name: string
  type: StorageBackendType
  /** Bucket / 容器 */
  bucket: string
  /** 区域 */
  region: string
  /** Endpoint (可选, 私有部署) */
  endpoint?: string
  /** 凭证 (加密存储) */
  credentialsEncrypted: string
  /** CDN 域名 */
  cdnDomain?: string
  /** 是否默认 */
  isDefault: boolean
  /** 是否启用 */
  enabled: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 资产访问日志
 */
export interface AssetAccessLog {
  id: string
  assetId: string
  tenantId: string
  /** 访问类型 */
  accessType: 'view' | 'download' | 'signed_url_generated' | 'deleted' | 'variant_accessed'
  /** 访问者 (userId or IP) */
  accessor: string
  /** IP 地址 */
  ip?: string
  /** User-Agent */
  userAgent?: string
  /** 访问时间 */
  accessedAt: string
}

// ============ 工具函数 ============

export function generateAssetId(): string {
  return `asset-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}
export function generateVariantId(): string {
  return `var-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}
export function generateBackendId(): string {
  return `storage-${Math.random().toString(36).slice(2, 8)}`
}
export function generateAccessLogId(): string {
  return `acc-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

/**
 * 内容 SHA-256 哈希
 */
export function computeContentHash(content: Buffer | string): string {
  const { createHash } = require('node:crypto')
  return createHash('sha256').update(content).digest('hex')
}

/**
 * MIME type → AssetType 推断
 */
export function inferAssetType(mimeType: string): AssetType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType === 'application/pdf' || mimeType.includes('word') || mimeType.includes('sheet') || mimeType.includes('presentation')) return 'document'
  return 'unknown'
}

/**
 * 存储 Key 生成 (基于 hash + 租户 + 日期, 防止重名)
 */
export function buildStorageKey(tenantId: string, contentHash: string, filename: string, date: Date = new Date()): string {
  const yyyy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const ext = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : ''
  return `${tenantId}/multimedia/${yyyy}/${mm}/${contentHash.slice(0, 16)}${ext}`
}

/**
 * 文件扩展名提取
 */
export function extractExtension(filename: string): string {
  const idx = filename.lastIndexOf('.')
  return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : ''
}

/**
 * MIME type 校验 (白名单)
 */
export const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/heic'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
}

export function isAllowedMimeType(mimeType: string): boolean {
  return Object.values(ALLOWED_MIME_TYPES).flat().includes(mimeType)
}

/**
 * 文件大小限制 (字节)
 */
export const MAX_FILE_SIZES: Record<AssetType, number> = {
  image: 50 * 1024 * 1024,        // 50 MB
  video: 2 * 1024 * 1024 * 1024,   // 2 GB
  audio: 500 * 1024 * 1024,        // 500 MB
  document: 100 * 1024 * 1024,     // 100 MB
  unknown: 50 * 1024 * 1024,
}

/**
 * 签名 URL 生成 (HMAC-SHA256)
 *
 * 实际生产: 用 CDN/对象存储的签名 URL (AWS S3 presigned URL)
 * 这里用 HMAC mock 实现
 */
export function generateSignedUrl(opts: {
  storageKey: string
  expiresAt: number           // unix timestamp
  secret: string
  baseUrl?: string
}): string {
  const { createHmac } = require('node:crypto')
  const payload = `${opts.storageKey}:${opts.expiresAt}`
  const sig = createHmac('sha256', opts.secret).update(payload).digest('base64url')
  const base = opts.baseUrl ?? 'https://cdn.shenjiying88.com'
  return `${base}/${opts.storageKey}?expires=${opts.expiresAt}&signature=${sig}`
}

export function verifySignedUrl(url: string, expiresAt: number, signature: string, secret: string): boolean {
  if (Date.now() / 1000 > expiresAt) return false
  const { createHmac } = require('node:crypto')
  // 从 url 提取 storageKey
  const urlObj = new URL(url)
  const storageKey = urlObj.pathname.slice(1)
  const payload = `${storageKey}:${expiresAt}`
  const expectedSig = createHmac('sha256', secret).update(payload).digest('base64url')
  return expectedSig === signature
}

/**
 * 缩略图参数生成 (图片处理)
 */
export interface ThumbnailParams {
  width: number
  height: number
  quality?: number
  format?: 'jpeg' | 'webp' | 'png'
}
export function buildThumbnailParams(p: ThumbnailParams): string {
  return `${p.width}x${p.height}-q${p.quality ?? 80}-${p.format ?? 'webp'}`
}

/**
 * 视频转码参数
 */
export interface VideoTranscodeParams {
  resolution: '480p' | '720p' | '1080p' | '4k'
  bitrate: string
  codec: 'h264' | 'h265' | 'vp9'
}
export function buildVideoParams(p: VideoTranscodeParams): string {
  return `${p.resolution}-${p.bitrate}-${p.codec}`
}

/**
 * 重复检测 (相同 contentHash)
 */
export function isDuplicateContent(hash1: string, hash2: string): boolean {
  return hash1 === hash2
}