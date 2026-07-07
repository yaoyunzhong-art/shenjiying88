/**
 * Phase 96 SSO 前台 Types (V10 Sprint 2 Day 24)
 */

export type SsoProtocol = 'saml' | 'oidc'

export interface SsoConnection {
  id: string
  tenantId: string
  protocol: SsoProtocol
  name: string
  status: 'active' | 'disabled' | 'pending_verification'
  isDefault: boolean
  defaultRole: 'tenant_admin' | 'store_admin' | 'operator' | 'viewer'
  autoProvisionTenant: boolean
  allowedEmailDomains: string[]
  hasSaml: boolean
  hasOidc: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface SsoLoginInit {
  redirectUrl: string
  state?: string
  requestId?: string
}

export interface SsoLoginResult {
  userId: string
  email: string
  role: string
  isNewUser: boolean
  tenantId: string
  accessToken: string
  refreshToken?: string
  expiresIn: number
}

export const SSO_PROTOCOL_LABELS: Record<SsoProtocol, string> = {
  saml: 'SAML 2.0',
  oidc: 'OpenID Connect',
}

export const SSO_STATUS_LABELS: Record<string, string> = {
  active: '已启用',
  disabled: '已禁用',
  pending_verification: '待验证',
}

export const SSO_STATUS_COLORS: Record<string, string> = {
  active: '#52c41a',
  disabled: '#bfbfbf',
  pending_verification: '#faad14',
}

export const SSO_ROLE_LABELS: Record<string, string> = {
  tenant_admin: '租户管理员',
  store_admin: '门店管理员',
  operator: '操作员',
  viewer: '访客',
}