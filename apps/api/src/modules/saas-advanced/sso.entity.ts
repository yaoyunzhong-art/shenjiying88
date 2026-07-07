/**
 * Phase 96 SSO Entity (V10 Sprint 2 Day 23)
 *
 * 支持 SAML 2.0 + OIDC 双协议
 * SsoConnection: 租户的 SSO 连接配置 (entity per provider)
 * UserSsoIdentity: 用户与 SSO 提供方的身份关联
 */

export type SsoProtocol = 'saml' | 'oidc'

export type SsoConnectionStatus = 'active' | 'disabled' | 'pending_verification'

/**
 * SAML 2.0 配置
 */
export interface SamlConfig {
  /** IdP Entity ID */
  entityId: string
  /** IdP SSO URL (用户从 IdP 发起登录) */
  ssoUrl: string
  /** IdP SLO URL (Single Logout) */
  sloUrl?: string
  /** IdP 证书 (PEM, 用于验证 SAML 断言签名) */
  idpCertificate: string
  /** SP Entity ID (本应用) */
  spEntityId: string
  /** ACS URL (IdP 回调地址) */
  acsUrl: string
  /** NameID 格式 (默认 urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress) */
  nameIdFormat?: string
  /** 属性映射 (SAML 属性 → 用户字段) */
  attributeMapping: {
    email: string      // 默认 'email' / 'urn:oid:0.9.2342.19200300.100.1.3'
    name?: string
    role?: string
    tenantId?: string
  }
  /** 是否要求签名断言 */
  signedAssertions: boolean
}

/**
 * OIDC 配置
 */
export interface OidcConfig {
  /** Issuer URL */
  issuer: string
  /** Client ID */
  clientId: string
  /** Client Secret (加密存储) */
  clientSecret: string
  /** 授权端点 */
  authorizationEndpoint: string
  /** Token 端点 */
  tokenEndpoint: string
  /** UserInfo 端点 */
  userinfoEndpoint: string
  /** JWKS URI */
  jwksUri: string
  /** 回调 URL */
  redirectUri: string
  /** Scope (默认 'openid profile email') */
  scope: string
  /** Claims 映射 */
  claimMapping: {
    email: string     // 默认 'email'
    name?: string
    role?: string
    tenantId?: string
  }
}

/**
 * SSO 连接 (每租户每个协议可配置一个或多个连接)
 */
export interface SsoConnection {
  id: string
  tenantId: string
  /** 协议 */
  protocol: SsoProtocol
  /** 连接名称 */
  name: string
  /** 状态 */
  status: SsoConnectionStatus
  /** SAML 配置 (protocol='saml' 时使用) */
  saml?: SamlConfig
  /** OIDC 配置 (protocol='oidc' 时使用) */
  oidc?: OidcConfig
  /** 是否为默认登录方式 */
  isDefault: boolean
  /** 默认角色 (新用户首次 SSO 登录时分配) */
  defaultRole: 'tenant_admin' | 'store_admin' | 'operator' | 'viewer'
  /** 自动配置租户 (IdP 返回 tenantId claim 时) */
  autoProvisionTenant: boolean
  /** 允许的邮箱域名 (空 = 全部允许) */
  allowedEmailDomains: string[]
  createdAt: string
  updatedAt: string
  createdBy: string
}

/**
 * 用户 SSO 身份关联 (一个用户可绑定多个 SSO)
 */
export interface UserSsoIdentity {
  id: string
  userId: string
  tenantId: string
  /** SSO 连接 ID */
  connectionId: string
  /** 协议 */
  protocol: SsoProtocol
  /** Subject (SAML NameID / OIDC sub) */
  subject: string
  /** IdP 返回的 email (用于匹配/创建用户) */
  email: string
  /** IdP 返回的显示名 */
  displayName?: string
  /** 上次登录时间 */
  lastLoginAt: string
  /** 登录次数 */
  loginCount: number
  createdAt: string
}

// ============ 工具函数 ============

/**
 * 生成连接 ID
 */
export function generateConnectionId(): string {
  return `sso-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

/**
 * 生成身份关联 ID
 */
export function generateIdentityId(): string {
  return `ssoid-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

/**
 * 生成 SAML Request ID (SP-initiated 用)
 */
export function generateSamlRequestId(): string {
  return `_${Math.random().toString(36).slice(2, 18)}`
}

/**
 * 生成 OIDC state (防 CSRF)
 */
export function generateOidcState(): string {
  const bytes = new Uint8Array(16)
  for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  return Buffer.from(bytes).toString('base64url')
}

/**
 * 生成 OIDC PKCE code_verifier
 */
export function generatePkceVerifier(): string {
  const bytes = new Uint8Array(32)
  for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  return Buffer.from(bytes).toString('base64url')
}

/**
 * PKCE code_challenge (S256)
 */
export function deriveCodeChallenge(verifier: string): string {
  // 实际生产: SHA256(verifier) → base64url
  // 这里简化: verifier 已经是 base64url, 直接 sha256
  const { createHash } = require('node:crypto')
  return createHash('sha256').update(verifier).digest('base64url')
}

/**
 * 邮箱域名提取
 */
export function extractEmailDomain(email: string): string {
  const at = email.indexOf('@')
  if (at < 0) return ''
  return email.slice(at + 1).toLowerCase()
}

/**
 * 校验 SAML 配置
 */
export function validateSamlConfig(cfg: SamlConfig): { valid: boolean; error?: string } {
  if (!cfg.entityId) return { valid: false, error: 'SAML entityId 必填' }
  if (!cfg.ssoUrl) return { valid: false, error: 'SAML ssoUrl 必填' }
  if (!cfg.idpCertificate) return { valid: false, error: 'SAML idpCertificate 必填' }
  if (!cfg.spEntityId) return { valid: false, error: 'SAML spEntityId 必填' }
  if (!cfg.acsUrl) return { valid: false, error: 'SAML acsUrl 必填' }
  if (!cfg.attributeMapping?.email) return { valid: false, error: 'SAML attributeMapping.email 必填' }
  // 简单 URL 校验
  try { new URL(cfg.ssoUrl) } catch { return { valid: false, error: 'SAML ssoUrl 不是合法 URL' } }
  try { new URL(cfg.acsUrl) } catch { return { valid: false, error: 'SAML acsUrl 不是合法 URL' } }
  // PEM 校验
  if (!cfg.idpCertificate.includes('BEGIN CERTIFICATE')) {
    return { valid: false, error: 'idpCertificate 应为 PEM 格式' }
  }
  return { valid: true }
}

/**
 * 校验 OIDC 配置
 */
export function validateOidcConfig(cfg: OidcConfig): { valid: boolean; error?: string } {
  if (!cfg.issuer) return { valid: false, error: 'OIDC issuer 必填' }
  if (!cfg.clientId) return { valid: false, error: 'OIDC clientId 必填' }
  if (!cfg.clientSecret) return { valid: false, error: 'OIDC clientSecret 必填' }
  if (!cfg.authorizationEndpoint) return { valid: false, error: 'OIDC authorizationEndpoint 必填' }
  if (!cfg.tokenEndpoint) return { valid: false, error: 'OIDC tokenEndpoint 必填' }
  if (!cfg.userinfoEndpoint) return { valid: false, error: 'OIDC userinfoEndpoint 必填' }
  if (!cfg.jwksUri) return { valid: false, error: 'OIDC jwksUri 必填' }
  if (!cfg.redirectUri) return { valid: false, error: 'OIDC redirectUri 必填' }
  for (const url of [cfg.authorizationEndpoint, cfg.tokenEndpoint, cfg.userinfoEndpoint, cfg.jwksUri, cfg.redirectUri]) {
    try { new URL(url) } catch { return { valid: false, error: `URL 格式不合法: ${url}` } }
  }
  if (!cfg.claimMapping?.email) return { valid: false, error: 'OIDC claimMapping.email 必填' }
  return { valid: true }
}

/**
 * SAML AuthnRequest 编码 (简化版, 实际生产需 XML 数字签名)
 */
export function buildSamlAuthnRequest(opts: {
  spEntityId: string
  acsUrl: string
  id: string
  forceAuthn?: boolean
}): string {
  const issueInstant = new Date().toISOString()
  const force = opts.forceAuthn ? ' ForceAuthn="true"' : ''
  return `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="${opts.id}" Version="2.0" IssueInstant="${issueInstant}" Destination="" AssertionConsumerServiceURL="${opts.acsUrl}"${force}><saml:Issuer>${opts.spEntityId}</saml:Issuer></samlp:AuthnRequest>`
}

/**
 * OIDC Authorization URL 构造
 */
export function buildOidcAuthUrl(opts: {
  authorizationEndpoint: string
  clientId: string
  redirectUri: string
  scope: string
  state: string
  codeChallenge: string
}): string {
  const url = new URL(opts.authorizationEndpoint)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', opts.clientId)
  url.searchParams.set('redirect_uri', opts.redirectUri)
  url.searchParams.set('scope', opts.scope)
  url.searchParams.set('state', opts.state)
  url.searchParams.set('code_challenge', opts.codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  return url.toString()
}

/**
 * SAML LogoutRequest
 */
export function buildSamlLogoutRequest(opts: {
  spEntityId: string
  nameId: string
  sessionIndex?: string
}): string {
  return `<samlp:LogoutRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_${Math.random().toString(36).slice(2, 10)}" Version="2.0" IssueInstant="${new Date().toISOString()}"><saml:Issuer>${opts.spEntityId}</saml:Issuer><saml:NameID>${opts.nameId}</saml:NameID>${opts.sessionIndex ? `<samlp:SessionIndex>${opts.sessionIndex}</samlp:SessionIndex>` : ''}</samlp:LogoutRequest>`
}

/**
 * SAML 响应解析 (简化版: 实际生产需 XML 解析 + 签名验证)
 */
export interface ParsedSamlAssertion {
  nameId: string
  email?: string
  attributes: Record<string, string>
  sessionIndex?: string
}
export function parseSamlAssertion(samlResponse: string): ParsedSamlAssertion {
  // 简化解析 - 实际生产用 fast-xml-parser + xmldom
  const nameIdMatch = samlResponse.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/)
  const sessionMatch = samlResponse.match(/SessionIndex="([^"]+)"/)
  const attrRegex = /<saml:Attribute Name="([^"]+)"[^>]*>[\s\S]*?<saml:AttributeValue[^>]*>([^<]+)<\/saml:AttributeValue>/g
  const attributes: Record<string, string> = {}
  let m: RegExpExecArray | null
  while ((m = attrRegex.exec(samlResponse))) {
    attributes[m[1]] = m[2]
  }
  return {
    nameId: nameIdMatch?.[1] ?? '',
    email: attributes['email'] ?? attributes['urn:oid:0.9.2342.19200300.100.1.3'],
    attributes,
    sessionIndex: sessionMatch?.[1],
  }
}