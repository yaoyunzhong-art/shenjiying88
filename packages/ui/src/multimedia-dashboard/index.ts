/**
 * Phase 99 多模态存储 前台 Barrel (V11 Sprint 3 Day 34)
 */

export { MultimediaDashboard } from './MultimediaDashboard'
export type { MultimediaDashboardProps } from './MultimediaDashboard'
export {
  useMultimediaAssets, useStorageStats, useStorageBackends,
  useUploadAsset, useDeleteAsset, useGenerateSignedUrl, useAddStorageBackend,
} from './useMultimedia'
export {
  ASSET_TYPE_LABELS, ASSET_TYPE_ICONS, ASSET_STATUS_LABELS, ASSET_STATUS_COLORS,
  BACKEND_TYPE_LABELS, formatBytes,
  type MultimediaAsset, type AssetType, type AssetStatus, type AssetVisibility,
  type StorageBackend, type StorageStats, type StorageBackendType,
} from './types'