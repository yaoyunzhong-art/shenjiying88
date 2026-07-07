/**
 * License Module (V9 需求 2 · V10 Day 19 Phase 88)
 *
 * 付费授权模块统一导出
 * - API Client
 * - React Hooks
 * - UI Components
 * - Types
 */

// ===== API =====
export {
  LicenseAPI,
  checkLicense,
  listTenantLicenses,
  listStoreLicenses,
  listAuditLogs,
  suspendLicense,
  activateLicense,
  generateActivationCode,
  verifyActivationCode,
  getAdminStats,
  bulkSuspendLicenses,
} from './api/license-api'

export type {
  // API 配置类型
  APIConfig,
  APIResponse,
  APIError,
} from './api/types'

// ===== Hooks =====
export { useLicense } from './hooks/useLicense'
export type { UseLicenseOptions, UseLicenseReturn } from './types'

// ===== Components =====
export { LicenseManager } from './components/LicenseManager'
export type { LicenseManagerProps } from './types'

// ===== Types =====
export type {
  // Base Types
  License,
  LicenseStatus,
  LicenseLevel,
  LicenseScope,
  LicenseQuota,

  // API Types
  LicenseCheckResult,
  LicenseListResponse,
  ActivationResult,
  GenerateCodeInput,
  GenerateCodeResult,
  VerifyCodeResult,
  LicenseAuditLog,
  BulkSuspendResult,
  AdminStats,

  // Component Types
  LicenseViewType,
  LicenseViewMode,
  LicenseCardProps,
  ActivationCodeInputProps,
  LicenseFilterState,
  LicenseSortState,

  // Cache Types
  LicenseCacheConfig,
  LicenseCacheStats,

  // Event Types
  LicenseEvent,
  LicenseEventType,
} from './types'

// ===== Utils =====
export {
  // 工具函数
  formatLicenseDate,
  formatLicenseStatus,
  calculateRemainingDays,
  isLicenseExpired,
  isLicenseValid,
} from './utils'

// ===== Constants =====
export {
  // 常量
  LICENSE_SCOPES,
  LICENSE_STATUS_LABELS,
  LICENSE_DEFAULT_TTL,
} from './constants'

// Default export
export { default } from './api/license-api'
