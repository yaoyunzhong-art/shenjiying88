/**
 * 🐜 自动: [multimedia] [D] contract 补全
 *
 * 多模态存储：跨模块合约类型
 * 定义 multimedia 模块对外暴露的稳定合约接口，
 * 供其他模块（report, insight, marketing, member 等）消费。
 */
import type {
  AssetType,
  AssetVisibility,
  StorageBackendType,
  AssetStatus,
  MultimediaAsset,
  AssetVariant,
  StorageBackend,
} from './multimedia.entity'
import type { AssetResponse, StorageStatsResponse } from './multimedia.dto'

/**
 * 多模态资产合约（跨模块安全子集）
 */
export interface MultimediaAssetContract {
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
  status: AssetStatus
  visibility: AssetVisibility
  tags: string[]
  linkedEntity?: {
    entityType: 'product' | 'order' | 'member' | 'report' | 'receipt' | 'other'
    entityId: string
  }
  processingProgress: number
  createdAt: string
  updatedAt: string
}

/**
 * 资产衍生版本合约
 */
export interface AssetVariantContract {
  id: string
  assetId: string
  variantType: string
  format: string
  sizeBytes: number
  url?: string
  /** 处理耗时 (ms) */
  processingDurationMs: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
}

/**
 * 存储后端合约（跨模块安全子集）
 */
export interface StorageBackendContract {
  id: string
  name: string
  type: StorageBackendType
  bucket: string
  region: string
  endpoint?: string
  cdnDomain?: string
  enabled: boolean
  isDefault: boolean
  createdAt: string
}

/**
 * 资产创建请求合约
 */
export interface CreateAssetRequestContract {
  originalFilename: string
  mimeType: string
  sizeBytes: number
  contentHash: string
  visibility?: AssetVisibility
  tags?: string[]
  linkedEntity?: { entityType: string; entityId: string }
}

/**
 * 签名 URL 响应合约
 */
export interface SignedUrlResponseContract {
  url: string
  expiresAt: number
}

/**
 * 资产列表响应合约
 */
export interface AssetListResponseContract {
  items: MultimediaAssetContract[]
  total: number
}

/**
 * 资产创建响应合约
 */
export interface CreateAssetResponseContract extends MultimediaAssetContract {
  isDuplicate: boolean
}

/**
 * 资产衍生版本列表响应合约
 */
export interface AssetVariantListResponseContract {
  items: AssetVariantContract[]
  total: number
}

/**
 * 存储后端列表响应合约
 */
export interface StorageBackendListResponseContract {
  items: StorageBackendContract[]
}

/**
 * 存储统计合约
 */
export interface StorageStatsContract {
  totalAssets: number
  totalSizeBytes: number
  byType: Record<string, { count: number; sizeBytes: number }>
  recentUploads: number
  avgProcessingTimeMs: number
  duplicateHits: number
}

/**
 * 合约版本号
 */
export const MULTIMEDIA_CONTRACT_VERSION = '1.0.0'

/**
 * 合约稳定性标记：
 * - stable: 稳定，跨模块可安全依赖
 * - experimental: 可能变更
 * - deprecated: 未来移除
 */
export type ContractStability = 'stable' | 'experimental' | 'deprecated'

/**
 * 合约稳定性映射
 */
export const CONTRACT_STABILITY: Record<string, ContractStability> = {
  MultimediaAssetContract: 'stable',
  AssetVariantContract: 'stable',
  StorageBackendContract: 'stable',
  CreateAssetRequestContract: 'stable',
  SignedUrlResponseContract: 'stable',
  AssetListResponseContract: 'stable',
  CreateAssetResponseContract: 'stable',
  AssetVariantListResponseContract: 'stable',
  StorageBackendListResponseContract: 'stable',
  StorageStatsContract: 'stable',
}

type MultimediaAssetContractSource = Pick<
  MultimediaAsset,
  | 'id'
  | 'tenantId'
  | 'originalFilename'
  | 'assetType'
  | 'mimeType'
  | 'sizeBytes'
  | 'contentHash'
  | 'storageBackend'
  | 'storageKey'
  | 'cdnUrl'
  | 'url'
  | 'status'
  | 'visibility'
  | 'tags'
  | 'linkedEntity'
  | 'processingProgress'
  | 'createdAt'
  | 'updatedAt'
> |
  AssetResponse

export function toMultimediaAssetContract(asset: MultimediaAssetContractSource): MultimediaAssetContract {
  return {
    id: asset.id,
    tenantId: asset.tenantId,
    originalFilename: asset.originalFilename,
    assetType: asset.assetType,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    contentHash: asset.contentHash,
    storageBackend: asset.storageBackend,
    storageKey: asset.storageKey,
    cdnUrl: asset.cdnUrl,
    url: asset.url,
    status: asset.status as AssetStatus,
    visibility: asset.visibility,
    tags: asset.tags,
    linkedEntity: asset.linkedEntity,
    processingProgress: asset.processingProgress,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  }
}

export function toCreateAssetResponseContract(
  asset: MultimediaAsset,
  isDuplicate: boolean,
): CreateAssetResponseContract {
  return {
    ...toMultimediaAssetContract(asset),
    isDuplicate,
  }
}

export function toAssetVariantContract(variant: AssetVariant): AssetVariantContract {
  return {
    id: variant.id,
    assetId: variant.assetId,
    variantType: variant.variantType,
    format: variant.format,
    sizeBytes: variant.sizeBytes,
    url: variant.url,
    processingDurationMs: variant.processingDurationMs,
    status: variant.status,
    createdAt: variant.createdAt,
  }
}

export function toStorageBackendContract(backend: StorageBackend): StorageBackendContract {
  return {
    id: backend.id,
    name: backend.name,
    type: backend.type,
    bucket: backend.bucket,
    region: backend.region,
    endpoint: backend.endpoint,
    cdnDomain: backend.cdnDomain,
    enabled: backend.enabled,
    isDefault: backend.isDefault,
    createdAt: backend.createdAt,
  }
}

export function toAssetListResponseContract(
  items: MultimediaAssetContractSource[],
): AssetListResponseContract {
  return {
    items: items.map(toMultimediaAssetContract),
    total: items.length,
  }
}

export function toAssetVariantListResponseContract(
  items: AssetVariant[],
): AssetVariantListResponseContract {
  return {
    items: items.map(toAssetVariantContract),
    total: items.length,
  }
}

export function toStorageBackendListResponseContract(
  items: StorageBackend[],
): StorageBackendListResponseContract {
  return {
    items: items.map(toStorageBackendContract),
  }
}

export function toStorageStatsContract(stats: StorageStatsResponse): StorageStatsContract {
  return {
    totalAssets: stats.totalAssets,
    totalSizeBytes: stats.totalSizeBytes,
    byType: stats.byType,
    recentUploads: stats.recentUploads,
    avgProcessingTimeMs: stats.avgProcessingTimeMs,
    duplicateHits: stats.duplicateHits,
  }
}

/**
 * 合约工具函数：检测 AssetType 合法性
 */
export function isValidAssetType(t: string): t is AssetType {
  return ['image', 'video', 'audio', 'document', 'unknown'].includes(t)
}

/**
 * 合约工具函数：检测 AssetVisibility 合法性
 */
export function isValidAssetVisibility(v: string): v is AssetVisibility {
  return ['public', 'private', 'tenant_internal', 'signed_url_only'].includes(v)
}

/**
 * 合约工具函数：检测 StorageBackendType 合法性
 */
export function isValidStorageBackendType(t: string): t is StorageBackendType {
  return ['s3', 'oss', 'cos', 'local', 'azure_blob', 'gcs'].includes(t)
}

/**
 * 合约断言：检测多媒体资产形状是否符合合约
 */
export function assertAssetContractShape(obj: unknown): obj is MultimediaAssetContract {
  if (typeof obj !== 'object' || obj === null) return false
  const o = obj as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.tenantId === 'string' &&
    typeof o.originalFilename === 'string' &&
    typeof o.assetType === 'string' &&
    isValidAssetType(o.assetType as string) &&
    typeof o.mimeType === 'string' &&
    typeof o.sizeBytes === 'number' &&
    typeof o.contentHash === 'string' &&
    typeof o.storageBackend === 'string' &&
    isValidStorageBackendType(o.storageBackend as string) &&
    typeof o.storageKey === 'string' &&
    typeof o.status === 'string' &&
    typeof o.visibility === 'string' &&
    Array.isArray(o.tags) &&
    o.processingProgress !== undefined &&
    typeof o.createdAt === 'string' &&
    typeof o.updatedAt === 'string'
  )
}
