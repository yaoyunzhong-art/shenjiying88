import 'reflect-metadata'
import type { LicenseScope, LicenseStatus, ActivationSource, LicenseLevel } from './license.entity'

/**
 * 付费授权 - DTO (V9 需求 2 · V10 Day 4 Phase 88)
 *
 * 请求/响应 DTO 定义, 不含 class-validator 装饰器 (tsx 兼容)
 */

// ============ 查询参数 DTO ============

export class CheckLicenseQueryDto {
  scope!: LicenseScope
  storeId?: string
}

export class ListLicenseQueryDto {
  storeId?: string
  limit?: string
}

// ============ 创建授权请求 DTO ============

export class CreateLicenseDto {
  tenantId!: string
  storeId?: string
  scope!: LicenseScope
  level!: LicenseLevel
  validFrom!: string
  validUntil!: string
  quota?: number
  priceCents?: number
  autoRenew?: boolean
  activationSource!: ActivationSource
  createdBy!: string
}

// ============ 暂停授权请求 DTO ============

export class SuspendLicenseDto {
  reason!: string
}

// ============ 响应 DTO ============

export class LicenseResponseDto {
  id!: string
  tenantId!: string
  storeId?: string
  scope!: LicenseScope
  level!: LicenseLevel
  status!: LicenseStatus
  quota?: number
  usedQuota?: number
  activationSource!: ActivationSource
  validFrom!: string
  validUntil!: string
  autoRenew!: boolean
  priceCents?: number
  createdBy!: string
  createdAt!: string
  updatedAt!: string
}

export class CheckLicenseResponseDto {
  allowed!: boolean
  license?: LicenseResponseDto
  reason?: string
  trialDaysRemaining?: number
  quotaRemaining?: number
}

export class LicenseListResponseDto {
  data!: LicenseResponseDto[]
  total!: number
}

export class AuditLogResponseDto {
  id!: string
  licenseId!: string
  tenantId!: string
  storeId?: string
  action!: string
  scope!: LicenseScope
  operator!: string
  result!: string
  reason?: string
  context?: Record<string, unknown>
  timestamp!: string
}

export class AuditLogListResponseDto {
  data!: AuditLogResponseDto[]
  total!: number
}
