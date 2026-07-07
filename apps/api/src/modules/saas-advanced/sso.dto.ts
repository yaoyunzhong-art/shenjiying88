/**
 * Phase 96 SSO DTO (V10 Sprint 2 Day 23)
 */

import type { SsoProtocol } from './sso.entity'
import type { SamlConfig, OidcConfig } from './sso.entity'

export interface CreateSamlConnectionDto {
  name: string
  saml: SamlConfig
  isDefault?: boolean
  defaultRole?: 'tenant_admin' | 'store_admin' | 'operator' | 'viewer'
  autoProvisionTenant?: boolean
  allowedEmailDomains?: string[]
}

export interface CreateOidcConnectionDto {
  name: string
  oidc: OidcConfig
  isDefault?: boolean
  defaultRole?: 'tenant_admin' | 'store_admin' | 'operator' | 'viewer'
  autoProvisionTenant?: boolean
  allowedEmailDomains?: string[]
}

export interface UpdateSsoConnectionDto {
  name?: string
  status?: 'active' | 'disabled' | 'pending_verification'
  isDefault?: boolean
  defaultRole?: 'tenant_admin' | 'store_admin' | 'operator' | 'viewer'
  autoProvisionTenant?: boolean
  allowedEmailDomains?: string[]
  saml?: Partial<SamlConfig>
  oidc?: Partial<OidcConfig>
}

export interface SsoLoginInitiateDto {
  /** 重定向 URL (登录成功后跳转) */
  redirectAfter?: string
  /** 强制重新认证 (SAML ForceAuthn) */
  forceAuthn?: boolean
}

export interface SsoLoginCompleteDto {
  /** 协议 */
  protocol: SsoProtocol
  /** SAML 响应 (Base64) 或 OIDC code */
  payload: string
  /** OIDC state */
  state?: string
}

export interface SsoConnectionResponse {
  id: string
  tenantId: string
  protocol: SsoProtocol
  name: string
  status: string
  isDefault: boolean
  defaultRole: string
  autoProvisionTenant: boolean
  allowedEmailDomains: string[]
  // 配置脱敏 (隐藏 clientSecret 等敏感字段)
  hasSaml: boolean
  hasOidc: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface SsoLoginInitResponse {
  /** 跳转 URL (SAML Form POST URL 或 OIDC auth URL) */
  redirectUrl: string
  /** OIDC state (用于校验回调) */
  state?: string
  /** PKCE code_verifier (服务端存储, 回调时使用) */
  codeVerifier?: string
  /** SAML AuthnRequest ID */
  requestId?: string
}

export interface SsoLoginCompleteResponse {
  /** 用户 ID */
  userId: string
  /** 邮箱 */
  email: string
  /** 角色 */
  role: string
  /** 是否新创建 */
  isNewUser: boolean
  /** 租户 ID */
  tenantId: string
  /** 短期访问令牌 */
  accessToken: string
  /** 短期刷新令牌 */
  refreshToken?: string
  /** 过期时间 (秒) */
  expiresIn: number
}