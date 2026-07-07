/**
 * 付费授权 - 实体定义 (V9 需求 2 · V10 Day 4 Phase 88)
 *
 * 设计: 租户级 + 门店级 双层授权
 * 4 类激活源: 已付费 / 试用 / 等级达标 / 白名单
 */

// ============ 授权范围 ============

export type LicenseScope =
  | 'ai.capability'      // AI 能力 (大模型调用)
  | 'ai.knowledge'       // 知识库容量
  | 'ai.industry'        // 行业增值 (游乐场/电玩/亲子)
  | 'integration.open'   // 多系统对接

// ============ 授权层级 ============

export type LicenseLevel = 'tenant' | 'store'

// ============ 激活源 ============

export type ActivationSource =
  | 'paid'              // 已付费
  | 'trial'             // 合作协议试用
  | 'tier-match'        // 等级达标 (V8 Champion 自动)
  | 'whitelist'         // 内部白名单

// ============ 状态 ============

export type LicenseStatus = 'active' | 'expired' | 'suspended' | 'pending'

// ============ 实体 ============

export interface License {
  id: string
  tenantId: string
  /** 门店 ID (租户级授权时为空) */
  storeId?: string
  scope: LicenseScope
  level: LicenseLevel
  status: LicenseStatus
  /** 配额 (知识库容量/调用次数 等) */
  quota?: number
  /** 已用配额 */
  usedQuota?: number
  /** 激活源 */
  activationSource: ActivationSource
  /** 有效期开始 (ISO 8601) */
  validFrom: string
  /** 有效期结束 (ISO 8601) */
  validUntil: string
  /** 自动续费 (订阅类) */
  autoRenew: boolean
  /** 价格(分) */
  priceCents?: number
  /** 创建者 (admin user id) */
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ============ 审计日志 (180 天保留) ============

export interface LicenseAuditLog {
  id: string
  licenseId: string
  tenantId: string
  storeId?: string
  action: 'create' | 'activate' | 'suspend' | 'expire' | 'consume' | 'reject'
  scope: LicenseScope
  /** 调用方 (user id / system) */
  operator: string
  /** 操作结果 */
  result: 'success' | 'denied'
  /** 拒绝原因 */
  reason?: string
  /** 上下文 */
  context?: Record<string, unknown>
  timestamp: string
}

// ============ 校验请求 ============

export interface CheckLicenseRequest {
  tenantId?: string
  scope: LicenseScope
  storeId?: string
}

export interface CheckLicenseResponse {
  allowed: boolean
  license?: License
  reason?: string
  /** 试用倒计时 (天) */
  trialDaysRemaining?: number
  /** 配额剩余 */
  quotaRemaining?: number
}

// ============ 创建授权请求 ============

export interface CreateLicenseRequest {
  id?: string
  tenantId: string
  storeId?: string
  scope: LicenseScope
  level: LicenseLevel
  validFrom: string
  validUntil: string
  quota?: number
  usedQuota?: number
  priceCents?: number
  autoRenew?: boolean
  activationSource: ActivationSource
  createdBy: string
}

// ============ 装饰器元数据 ============

export const LICENSE_GUARD_KEY = 'licenseGuardMeta'

export interface LicenseGuardMeta {
  scope: LicenseScope
  /** 是否允许免费试用 (false 时无授权直接拒绝) */
  allowTrial?: boolean
}