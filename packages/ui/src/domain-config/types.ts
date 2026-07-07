/**
 * Phase 96 Custom Domain 前台 Types (V10 Sprint 2 Day 25)
 */

export type DomainStatus =
  | 'pending_verification'
  | 'active'
  | 'ssl_issuing'
  | 'active_ssl'
  | 'ssl_failed'
  | 'disabled'

export interface DomainMapping {
  id: string
  tenantId: string
  domain: string
  verificationToken: string
  verificationHost: string
  status: DomainStatus
  ssl?: {
    provider: 'letsencrypt' | 'custom'
    expiresAt: string
    fingerprint: string
    lastRenewedAt: string
  }
  lastVerifiedAt?: string
  verificationFailCount: number
  createdAt: string
  updatedAt: string
  createdBy: string
}

export const DOMAIN_STATUS_LABELS: Record<DomainStatus, string> = {
  pending_verification: '待 DNS 校验',
  active: '已激活',
  ssl_issuing: 'SSL 申请中',
  active_ssl: 'SSL 已签发',
  ssl_failed: 'SSL 失败',
  disabled: '已禁用',
}

export const DOMAIN_STATUS_COLORS: Record<DomainStatus, string> = {
  pending_verification: '#faad14',
  active: '#52c41a',
  ssl_issuing: '#1890ff',
  active_ssl: '#13c2c2',
  ssl_failed: '#ff4d4f',
  disabled: '#bfbfbf',
}