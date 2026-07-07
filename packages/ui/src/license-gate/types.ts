/**
 * 付费授权 - 类型定义 (V9 需求 2 · V10 Day 4 Phase 88)
 */

export type LicenseScope =
  | 'ai.capability'
  | 'ai.knowledge'
  | 'ai.industry'
  | 'integration.open'

export type LicenseLevel = 'tenant' | 'store'

export type LicenseStatus = 'active' | 'expired' | 'suspended' | 'pending'

export type ActivationSource = 'paid' | 'trial' | 'tier-match' | 'whitelist'

export interface License {
  id: string
  tenantId: string
  storeId?: string
  scope: LicenseScope
  level: LicenseLevel
  status: LicenseStatus
  quota?: number
  usedQuota?: number
  activationSource: ActivationSource
  validFrom: string
  validUntil: string
  autoRenew: boolean
  priceCents?: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CheckLicenseResponse {
  allowed: boolean
  license?: License
  reason?: string
  trialDaysRemaining?: number
  quotaRemaining?: number
}

export interface UseLicenseCheckOptions {
  /** 当前门店 ID */
  storeId?: string
  /** API base */
  apiBase?: string
}

export interface LicenseGateProps {
  /** 授权范围 */
  scope: LicenseScope
  /** 当前门店 ID */
  storeId?: string
  /** 已授权时渲染 */
  children: React.ReactNode
  /** 未授权时渲染 (默认: 升级提示卡) */
  fallback?: React.ReactNode
  /** API base */
  apiBase?: string
  /** 端类型 */
  device?: 'pc' | 'h5' | 'app' | 'pad' | 'miniapp'
}