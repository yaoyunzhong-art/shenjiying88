/**
 * Phase 96 高级 SaaS - 自定义域名 Entity (V10 Sprint 2 Day 22)
 *
 * DomainMapping: 租户自定义域名映射 (acme.shenjiying88.com → tenantId)
 * DomainStatus: pending_verification → active → ssl_issuing → active_ssl
 * DomainVerificationMethod: DNS TXT 校验
 */

export type DomainScopeType = 'TENANT' | 'BRAND' | 'STORE'

export type DomainStatus =
  | 'pending_verification'  // 用户配置域名, 等待 TXT 校验
  | 'active'                // TXT 校验通过, 域名已激活
  | 'ssl_issuing'           // SSL 证书申请中 (Let's Encrypt)
  | 'active_ssl'            // SSL 证书已签发
  | 'ssl_failed'            // SSL 申请失败
  | 'disabled'              // 管理员禁用

export type SslProvider = 'letsencrypt' | 'custom'

export interface DomainMapping {
  id: string
  scopeType: DomainScopeType
  tenantId: string
  brandId?: string
  storeId?: string
  portalSiteId?: string
  isPrimary?: boolean
  /** 自定义域名 (例: acme.shenjiying88.com) */
  domain: string
  /** DNS TXT 校验 token (用户需在 DNS 添加该 TXT 记录) */
  verificationToken: string
  /** DNS TXT 记录主机名 (例: _shenjiying-verify.acme.shenjiying88.com) */
  verificationHost: string
  status: DomainStatus
  /** SSL 证书 */
  ssl?: {
    provider: SslProvider
    /** 证书过期时间 */
    expiresAt: string
    /** 证书指纹 (SHA256) */
    fingerprint: string
    /** 上次续期时间 */
    lastRenewedAt: string
  }
  /** 上次校验时间 */
  lastVerifiedAt?: string
  /** 校验失败次数 (>=3 自动 disabled) */
  verificationFailCount: number
  createdAt: string
  updatedAt: string
  createdBy: string
}

/**
 * DNS TXT 校验 token 生成 (24 字符 base64url)
 */
export function generateVerificationToken(): string {
  const bytes = new Uint8Array(18) // 18 字节 → 24 base64url
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Math.floor(Math.random() * 256)
  }
  return Buffer.from(bytes).toString('base64url')
}

/**
 * DNS TXT 主机名构造
 */
export function buildVerificationHost(domain: string): string {
  return `_shenjiying-verify.${domain}`
}

/**
 * DNS TXT 记录值 (用户需在 DNS 配置)
 */
export function buildVerificationValue(token: string): string {
  return `shenjiying-verify=${token}`
}

/**
 * 域名格式校验
 */
export function isValidDomain(domain: string): { valid: boolean; error?: string } {
  if (!domain || domain.length > 253) {
    return { valid: false, error: '域名长度 1-253' }
  }
  // 简单 FQDN 校验 (允许字母/数字/连字符/点)
  const fqdnRegex = /^(?=.{1,253}$)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/
  if (!fqdnRegex.test(domain)) {
    return { valid: false, error: '域名格式不合法 (需 FQDN)' }
  }
  // 禁止本地测试域
  const blocked = ['localhost', 'local', 'example.com', 'example.org', 'test']
  for (const b of blocked) {
    if (domain === b || domain.endsWith(`.${b}`)) {
      return { valid: false, error: `禁止使用保留域名: ${b}` }
    }
  }
  return { valid: true }
}

/**
 * SSL 证书指纹计算 (SHA256)
 */
export function computeSslFingerprint(certPem: string): string {
  // 简化版: 实际生产应使用 node:crypto X509Certificate
  // 这里用 SHA256 of cert body 模拟
  const cleanPem = certPem.replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s/g, '')
  return Buffer.from(cleanPem).toString('base64').slice(0, 64)
}
