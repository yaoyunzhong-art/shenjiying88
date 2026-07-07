/**
 * License Module Types (V9 需求 2 · V10 Day 19 Phase 88)
 *
 * 付费授权模块类型定义
 */

// ===== Base Types =====

export type LicenseStatus = 'active' | 'suspended' | 'expired' | 'trial'
export type LicenseLevel = 'tenant' | 'store'
export type LicenseScope = string // e.g., 'ai.capability', 'analytics'

export interface License {
  id: string
  tenantId: string
  scope: LicenseScope
  level: LicenseLevel
  status: LicenseStatus
  validFrom: string
  validUntil: string
  createdAt: string
  updatedAt: string
  storeId?: string
  metadata?: Record<string, unknown>
  // Extended fields
  scopeLabel?: string
  remainingDays?: number
  quota?: LicenseQuota
}

export interface LicenseQuota {
  used: number
  total: number
  resetAt?: string
  percentage?: number
}

// ===== API Response Types =====

export interface LicenseCheckResult {
  valid: boolean
  status: LicenseStatus
  expiresAt?: string
  scope: LicenseScope
  quota?: LicenseQuota
  message?: string
  licenseId?: string
}

export interface LicenseListResponse {
  data: License[]
  total: number
}

export interface ActivationResult {
  success: boolean
  licenseId?: string
  message: string
  expiresAt?: string
}

export interface GenerateCodeInput {
  scope: string
  durationDays: number
  quota?: number
  level: 'tenant' | 'store'
  metadata?: Record<string, unknown>
  count?: number
}

export interface GenerateCodeResult {
  codes: string[]
  count: number
  scope: string
  durationDays: number
  generatedBy: string
  generatedAt: string
}

export interface VerifyCodeResult {
  code: string
  scope: string
  formatValid: boolean
  message: string
  valid?: boolean
  metadata?: Record<string, unknown>
}

export interface LicenseAuditLog {
  id: string
  licenseId: string
  tenantId: string
  action: string
  operatorId: string
  operatorName?: string
  details: Record<string, unknown>
  createdAt: string
}

export interface BulkSuspendResult {
  success: boolean
  suspendedCount: number
  failedIds: string[]
  message: string
}

export interface AdminStats {
  totalLicenses: number
  activeLicenses: number
  suspendedLicenses: number
  expiredLicenses: number
  trialLicenses: number
  totalActivations: number
  todayActivations: number
  scopeDistribution?: Record<string, number>
}

// ===== Hook Types =====

export interface UseLicenseOptions {
  scope: LicenseScope
  storeId?: string
  autoCheck?: boolean
}

export interface UseLicenseReturn {
  // State
  license: License | null
  isLoading: boolean
  error: Error | null
  isValid: boolean
  status: LicenseStatus | null
  expiresAt: string | null
  quota: LicenseQuota | null

  // Actions
  checkLicense: () => Promise<LicenseCheckResult>
  activateLicense: (code: string) => Promise<ActivationResult>
  refreshLicense: () => Promise<void>
  clearError: () => void
}

// ===== Component Types =====

export type LicenseViewType = 'admin' | 'tenant' | 'store'
export type LicenseViewMode = 'table' | 'card' | 'compact'

export interface LicenseManagerProps {
  view: LicenseViewType
  tenantId?: string
  storeId?: string
  onLicenseChange?: (license: License) => void
}

export interface LicenseCardProps {
  license: License
  view: LicenseViewType
  onSuspend?: (id: string) => void
  onRenew?: (id: string) => void
  onViewDetails?: (license: License) => void
}

export interface ActivationCodeInputProps {
  scope: LicenseScope
  storeId?: string
  onActivate: (result: ActivationResult) => void
  onError: (error: Error) => void
  disabled?: boolean
  loading?: boolean
}

export interface LicenseFilterState {
  status?: LicenseStatus[]
  scope?: string
  level?: LicenseLevel
  dateRange?: [Date, Date]
  keyword?: string
}

export interface LicenseSortState {
  field: 'createdAt' | 'validUntil' | 'status'
  order: 'asc' | 'desc'
}

// ===== Cache Types =====

export interface LicenseCacheConfig {
  ttl: number // seconds
  nullTtl: number // seconds for null values
  fallbackTimeout: number // ms
  keyPrefix: string
}

export interface LicenseCacheStats {
  hits: number
  misses: number
  fallbacks: number
  errors: number
  hitRate: number
}

// ===== Error Types =====

export interface LicenseError {
  code: string
  message: string
  details?: Record<string, unknown>
}

// ===== Event Types =====

export type LicenseEventType =
  | 'license:activated'
  | 'license:suspended'
  | 'license:expired'
  | 'license:renewed'
  | 'license:quota:exceeded'

export interface LicenseEvent {
  type: LicenseEventType
  licenseId: string
  tenantId: string
  timestamp: string
  payload?: Record<string, unknown>
}

// Re-export
const _default = {}
export default _default
