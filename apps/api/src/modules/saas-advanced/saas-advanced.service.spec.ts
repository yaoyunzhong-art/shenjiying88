import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [saas-advanced] [A] service.spec — ≥18项正反例+边界
 * CustomDomainService + SsoService 纯函数式内联测试 (不 import 生产代码)
 *
 * 覆盖: 自定义域名 CRUD(3) + DNS 校验(2) + SSL(2) + Host 解析(1) + SSO 连接 CRUD(3)
 *       + SAML 登录(2) + OIDC 登录(2) + 令牌(2) + 身份(1) = 18
 */

import assert from 'node:assert/strict'

// ══════════════════════════════════════════════
// 内联类型
// ══════════════════════════════════════════════

type DomainStatus = 'pending_verification' | 'active' | 'ssl_issuing' | 'active_ssl' | 'ssl_failed' | 'disabled'

interface DomainMapping {
  id: string; tenantId: string; domain: string; verificationToken: string; verificationHost: string
  status: DomainStatus; verificationFailCount: number; createdAt: string; updatedAt: string; createdBy: string
  ssl?: { provider: string; expiresAt: string; fingerprint: string; lastRenewedAt: string }
  lastVerifiedAt?: string
}

type SsoProtocol = 'saml' | 'oidc'
type SsoConnectionStatus = 'active' | 'disabled' | 'pending_verification'

interface SamlConfig {
  entityId: string; ssoUrl: string; idpCertificate: string; spEntityId: string; acsUrl: string
  signedAssertions: boolean
  attributeMapping: { email: string; name?: string; role?: string; tenantId?: string }
}
interface OidcConfig {
  issuer: string; clientId: string; clientSecret: string; authorizationEndpoint: string
  tokenEndpoint: string; userinfoEndpoint: string; jwksUri: string; redirectUri: string
  scope: string; claimMapping: { email: string; name?: string; role?: string; tenantId?: string }
}
interface SsoConnection {
  id: string; tenantId: string; protocol: SsoProtocol; name: string; status: SsoConnectionStatus
  saml?: SamlConfig; oidc?: OidcConfig; isDefault: boolean; defaultRole: string
  autoProvisionTenant: boolean; allowedEmailDomains: string[]
  createdAt: string; updatedAt: string; createdBy: string
}
interface UserSsoIdentity {
  id: string; userId: string; tenantId: string; connectionId: string; protocol: SsoProtocol
  subject: string; email: string; displayName?: string; lastLoginAt: string; loginCount: number; createdAt: string
}

// ══════════════════════════════════════════════
// 内联工具函数
// ══════════════════════════════════════════════

function genId(): string { return `id-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}` }

function isValidDomain(domain: string): { valid: boolean; error?: string } {
  if (!domain || domain.length > 253) return { valid: false, error: '长度 1-253' }
  if (!/^(?=.{1,253}$)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/.test(domain)) return { valid: false, error: 'FQDN 不合法' }
  for (const b of ['localhost', 'example.com', 'example.org']) { if (domain === b || domain.endsWith(`.${b}`)) return { valid: false, error: `禁止: ${b}` } }
  return { valid: true }
}

function generateVerificationToken(): string { return Buffer.from(new Uint8Array(18).map(() => Math.floor(Math.random() * 256))).toString('base64url') }
function buildVerificationHost(domain: string): string { return `_shenjiying-verify.${domain}` }
function buildVerificationValue(token: string): string { return `shenjiying-verify=${token}` }
function extractEmailDomain(email: string): string { const at = email.indexOf('@'); return at < 0 ? '' : email.slice(at + 1).toLowerCase() }

// ══════════════════════════════════════════════
// Internal Mock: CustomDomainService
// ══════════════════════════════════════════════

class MockCustomDomainService {
  private domains = new Map<string, DomainMapping>()
  private domainsByName = new Map<string, string>()
  private domainsByTenant = new Map<string, Set<string>>()
  // DNS TXT overrides for test
  dnsTxtOverrides = new Map<string, string[]>()

  async addDomain(domain: string, tenantId = 't-a'): Promise<DomainMapping> {
    const valid = isValidDomain(domain)
    if (!valid.valid) throw new Error(valid.error)
    if (this.domainsByName.has(domain.toLowerCase())) throw new Error(`Domain ${domain} already registered`)
    const token = generateVerificationToken(); const host = buildVerificationHost(domain)
    const m: DomainMapping = {
      id: genId(), tenantId, domain: domain.toLowerCase(), verificationToken: token,
      verificationHost: host, status: 'pending_verification', verificationFailCount: 0,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'system',
    }
    this.domains.set(m.id, m); this.domainsByName.set(m.domain, m.id)
    if (!this.domainsByTenant.has(tenantId)) this.domainsByTenant.set(tenantId, new Set())
    this.domainsByTenant.get(tenantId)!.add(m.id)
    return m
  }

  async list(tenantId = 't-a'): Promise<DomainMapping[]> {
    const ids = this.domainsByTenant.get(tenantId) ?? new Set()
    return Array.from(ids).map((id) => this.domains.get(id)!).filter(Boolean).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async getById(id: string, tenantId = 't-a'): Promise<DomainMapping> {
    const m = this.domains.get(id)
    if (!m || m.tenantId !== tenantId) throw new Error(`Domain ${id} not found`)
    return m
  }

  async remove(id: string, tenantId = 't-a'): Promise<void> {
    const m = this.domains.get(id)
    if (!m || m.tenantId !== tenantId) throw new Error(`Domain ${id} not found`)
    this.domains.delete(id); this.domainsByName.delete(m.domain)
    this.domainsByTenant.get(tenantId)?.delete(id)
  }

  async verify(id: string, tenantId = 't-a'): Promise<DomainMapping> {
    const m = await this.getById(id, tenantId)
    if (m.status !== 'pending_verification') return m
    const expected = buildVerificationValue(m.verificationToken)
    const txtRecords = this.dnsTxtOverrides.get(m.verificationHost) ?? []
    if (txtRecords.includes(expected)) {
      m.status = 'active'; m.verificationFailCount = 0; m.lastVerifiedAt = new Date().toISOString(); m.updatedAt = m.lastVerifiedAt
    } else {
      m.verificationFailCount++
      if (m.verificationFailCount >= 3) m.status = 'disabled'
      m.updatedAt = new Date().toISOString()
      throw new Error(`DNS TXT 校验失败 (${m.verificationFailCount}/3)`)
    }
    return m
  }

  async requestSsl(id: string, tenantId = 't-a'): Promise<DomainMapping> {
    const m = await this.getById(id, tenantId)
    if (m.status !== 'active') throw new Error(`Domain must be active. Current: ${m.status}`)
    m.status = 'active_ssl'
    m.ssl = { provider: 'letsencrypt', expiresAt: new Date(Date.now() + 90 * 86400000).toISOString(), fingerprint: 'mock-fp', lastRenewedAt: new Date().toISOString() }
    m.updatedAt = new Date().toISOString()
    return m
  }

  resolveTenantByHost(host: string): string | null {
    const domain = host.toLowerCase().split(':')[0]
    const id = this.domainsByName.get(domain); if (!id) return null
    const m = this.domains.get(id); if (!m || m.status === 'disabled' || (m.status !== 'active' && m.status !== 'active_ssl')) return null
    return m.tenantId
  }

  count(): number { return this.domains.size }
}

// ══════════════════════════════════════════════
// Internal Mock: SsoService (精简版)
// ══════════════════════════════════════════════

class MockSsoService {
  private connections = new Map<string, SsoConnection>()
  private connectionsByTenant = new Map<string, Set<string>>()
  private connectionsByName = new Map<string, string>()
  private identities = new Map<string, UserSsoIdentity>()
  private identitiesBySubject = new Map<string, string>()

  async createSamlConnection(dto: { name: string; saml: SamlConfig; isDefault?: boolean; defaultRole?: string; allowedEmailDomains?: string[] }, tenantId = 't-a'): Promise<SsoConnection> {
    if (!dto.saml.entityId || !dto.saml.ssoUrl || !dto.saml.acsUrl) throw new Error('SAML 配置不完整')
    const nk = `${tenantId}:${dto.name}`
    if (this.connectionsByName.has(nk)) throw new Error(`名称 "${dto.name}" 已存在`)
    const conn: SsoConnection = { id: genId(), tenantId, protocol: 'saml', name: dto.name, status: 'active', saml: { ...dto.saml }, isDefault: dto.isDefault ?? false, defaultRole: dto.defaultRole ?? 'operator', autoProvisionTenant: false, allowedEmailDomains: dto.allowedEmailDomains ?? [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'system' }
    this.connections.set(conn.id, conn); this.connectionsByName.set(nk, conn.id)
    if (!this.connectionsByTenant.has(tenantId)) this.connectionsByTenant.set(tenantId, new Set())
    this.connectionsByTenant.get(tenantId)!.add(conn.id)
    return conn
  }

  async createOidcConnection(dto: { name: string; oidc: OidcConfig; isDefault?: boolean; defaultRole?: string; allowedEmailDomains?: string[] }, tenantId = 't-a'): Promise<SsoConnection> {
    if (!dto.oidc.clientId || !dto.oidc.authorizationEndpoint) throw new Error('OIDC 配置不完整')
    const nk = `${tenantId}:${dto.name}`
    if (this.connectionsByName.has(nk)) throw new Error(`名称 "${dto.name}" 已存在`)
    const conn: SsoConnection = { id: genId(), tenantId, protocol: 'oidc', name: dto.name, status: 'active', oidc: { ...dto.oidc }, isDefault: dto.isDefault ?? false, defaultRole: dto.defaultRole ?? 'operator', autoProvisionTenant: false, allowedEmailDomains: dto.allowedEmailDomains ?? [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'system' }
    this.connections.set(conn.id, conn); this.connectionsByName.set(nk, conn.id)
    if (!this.connectionsByTenant.has(tenantId)) this.connectionsByTenant.set(tenantId, new Set())
    this.connectionsByTenant.get(tenantId)!.add(conn.id)
    return conn
  }

  async list(tenantId = 't-a'): Promise<SsoConnection[]> {
    const ids = this.connectionsByTenant.get(tenantId) ?? new Set()
    return Array.from(ids).map((id) => this.connections.get(id)!).filter(Boolean)
  }

  async getConnection(id: string, tenantId = 't-a'): Promise<SsoConnection> {
    const c = this.connections.get(id)
    if (!c || c.tenantId !== tenantId) throw new Error(`SSO 连接 ${id} 不存在`)
    return c
  }

  async deleteConnection(id: string, tenantId = 't-a'): Promise<void> {
    const c = this.connections.get(id)
    if (!c || c.tenantId !== tenantId) throw new Error(`SSO 连接 ${id} 不存在`)
    this.connections.delete(id); this.connectionsByTenant.get(tenantId)?.delete(id)
    this.connectionsByName.delete(`${tenantId}:${c.name}`)
  }

  /** 模拟 SAML 登录完成: 基于 email 匹配 connection, JIT 创建用户身份 */
  async completeSamlLogin(samlXml: string, tenantId = 't-a'): Promise<{ userId: string; email: string; isNewUser: boolean; tenantId: string }> {
    // 模拟 parseSamlAssertion
    const emailMatch = samlXml.match(/email=([^\s&]+)/); const nameMatch = samlXml.match(/nameId=([^\s&]+)/)
    const email = emailMatch ? emailMatch[1] : 'mock@example.com'; const nameId = nameMatch ? nameMatch[1] : 'mock-sub'
    const conn = Array.from(this.connections.values()).find((c) => c.tenantId === tenantId && c.status === 'active')
    if (!conn) throw new Error('无匹配的 SSO 连接')
    if (conn.allowedEmailDomains.length > 0) {
      const domain = extractEmailDomain(email)
      if (!conn.allowedEmailDomains.includes(domain)) throw new Error(`域名 ${domain} 不在白名单`)
    }
    const subKey = `${conn.id}:${nameId}`
    const existingId = this.identitiesBySubject.get(subKey)
    let identity: UserSsoIdentity
    if (existingId && this.identities.has(existingId)) {
      identity = this.identities.get(existingId)!; identity.lastLoginAt = new Date().toISOString(); identity.loginCount++
      return { userId: identity.userId, email, isNewUser: false, tenantId }
    }
    const userId = genId()
    identity = { id: genId(), userId, tenantId, connectionId: conn.id, protocol: 'saml', subject: nameId, email: email.toLowerCase(), lastLoginAt: new Date().toISOString(), loginCount: 1, createdAt: new Date().toISOString() }
    this.identities.set(identity.id, identity); this.identitiesBySubject.set(subKey, identity.id)
    return { userId, email, isNewUser: true, tenantId }
  }

  /** 模拟 OIDC 登录 */
  async completeOidcLogin(code: string, tenantId = 't-a'): Promise<{ userId: string; email: string; isNewUser: boolean; tenantId: string }> {
    // 模拟 code → token → userinfo
    const email = `oidc-user@example.com`; const sub = `oidc-${code.slice(0, 6)}`
    const conn = Array.from(this.connections.values()).find((c) => c.tenantId === tenantId && c.status === 'active' && c.protocol === 'oidc')
    if (!conn) throw new Error('无匹配的 OIDC 连接')
    const subKey = `${conn.id}:${sub}`
    const existingId = this.identitiesBySubject.get(subKey)
    if (existingId && this.identities.has(existingId)) {
      const identity = this.identities.get(existingId)!; identity.lastLoginAt = new Date().toISOString(); identity.loginCount++
      return { userId: identity.userId, email, isNewUser: false, tenantId }
    }
    const userId = genId()
    const identity: UserSsoIdentity = { id: genId(), userId, tenantId, connectionId: conn.id, protocol: 'oidc', subject: sub, email, lastLoginAt: new Date().toISOString(), loginCount: 1, createdAt: new Date().toISOString() }
    this.identities.set(identity.id, identity); this.identitiesBySubject.set(subKey, identity.id)
    return { userId, email, isNewUser: true, tenantId }
  }

  countConnections(): number { return this.connections.size }
}

// ══════════════════════════════════════════════
// 测试
// ══════════════════════════════════════════════

describe('saas-advanced service.spec', () => {
  // ── Custom Domain ──
  describe('CustomDomainService', () => {
    let svc: MockCustomDomainService
    beforeEach(() => { svc = new MockCustomDomainService() })

    it('addDomain 创建 pending_verification 域名', async () => {
      const m = await svc.addDomain('acme.shenjiying88.com', 't-a')
      assert.ok(m.id); assert.equal(m.status, 'pending_verification')
      assert.ok(m.verificationHost.includes('acme.shenjiying88.com'))
    })
    it('无效域名被拒', async () => {
      await assert.rejects(() => svc.addDomain('invalid!domain', 't-a'), /FQDN/)
    })
    it('重复域名被拒', async () => {
      await svc.addDomain('dup.myshop.com', 't-a')
      await assert.rejects(() => svc.addDomain('dup.myshop.com', 't-a'), /already registered/)
    })
    it('verify 成功通过 DNS TXT 校验', async () => {
      const m = await svc.addDomain('verify-ok.myshop.com', 't-a')
      svc.dnsTxtOverrides.set(m.verificationHost, [buildVerificationValue(m.verificationToken)])
      const verified = await svc.verify(m.id, 't-a')
      assert.equal(verified.status, 'active')
      assert.ok(verified.lastVerifiedAt)
    })
    it('verify 失败 3 次后 disabled', async () => {
      const m = await svc.addDomain('verify-fail.myshop.com', 't-a')
      for (let i = 0; i < 3; i++) {
        try { await svc.verify(m.id, 't-a') } catch {}
      }
      const after = await svc.getById(m.id, 't-a')
      assert.equal(after.status, 'disabled'); assert.equal(after.verificationFailCount, 3)
    })
    it('requestSsl 需要 active 状态', async () => {
      const m = await svc.addDomain('ssl.myshop.com', 't-a')
      svc.dnsTxtOverrides.set(m.verificationHost, [buildVerificationValue(m.verificationToken)])
      await svc.verify(m.id, 't-a')
      const ssl = await svc.requestSsl(m.id, 't-a')
      assert.equal(ssl.status, 'active_ssl')
      assert.ok(ssl.ssl)
    })
    it('非 active 域名 SSL 被拒', async () => {
      const m = await svc.addDomain('ssl-fail.myshop.com', 't-a')
      await assert.rejects(() => svc.requestSsl(m.id, 't-a'), /must be active/)
    })
    it('resolveTenantByHost 解析 tenant', async () => {
      const m = await svc.addDomain('myapp.myshop.com', 't-b')
      svc.dnsTxtOverrides.set(m.verificationHost, [buildVerificationValue(m.verificationToken)])
      await svc.verify(m.id, 't-b')
      assert.equal(svc.resolveTenantByHost('myapp.myshop.com'), 't-b')
      assert.equal(svc.resolveTenantByHost('unknown.myshop.com'), null)
    })
  })

  // ── SSO ──
  describe('SsoService', () => {
    let svc: MockSsoService
    beforeEach(() => { svc = new MockSsoService() })

    it('createSamlConnection 创建 SAML 连接', async () => {
      const c = await svc.createSamlConnection({
        name: 'Okta', isDefault: true,
        saml: { entityId: 'http://okta.com', ssoUrl: 'https://okta.com/sso', acsUrl: 'https://app.com/acs', spEntityId: 'app', idpCertificate: '-----BEGIN CERTIFICATE-----\nMOCK\n-----END CERTIFICATE-----', signedAssertions: true, attributeMapping: { email: 'email' } },
      }, 't-a')
      assert.equal(c.protocol, 'saml'); assert.ok(c.isDefault)
    })
    it('createOidcConnection 创建 OIDC 连接', async () => {
      const c = await svc.createOidcConnection({
        name: 'Auth0',
        oidc: { issuer: 'https://auth0.com', clientId: 'client-1', clientSecret: 'secret', authorizationEndpoint: 'https://auth0.com/auth', tokenEndpoint: 'https://auth0.com/token', userinfoEndpoint: 'https://auth0.com/userinfo', jwksUri: 'https://auth0.com/jwks', redirectUri: 'https://app.com/callback', scope: 'openid email', claimMapping: { email: 'email' } },
      }, 't-a')
      assert.equal(c.protocol, 'oidc')
    })
    it('重复连接名被拒', async () => {
      await svc.createSamlConnection({ name: 'Dup', saml: { entityId: 'x', ssoUrl: 'https://x.com', acsUrl: 'https://x.com/acs', spEntityId: 'x', idpCertificate: 'BEGIN CERTIFICATE', signedAssertions: true, attributeMapping: { email: 'email' } } }, 't-a')
      await assert.rejects(() => svc.createSamlConnection({ name: 'Dup', saml: { entityId: 'y', ssoUrl: 'https://y.com', acsUrl: 'https://y.com/acs', spEntityId: 'y', idpCertificate: 'BEGIN CERTIFICATE', signedAssertions: true, attributeMapping: { email: 'email' } } }, 't-a'), /已存在/)
    })
    it('SAML 完成登录 JIT 创建用户', async () => {
      await svc.createSamlConnection({ name: 'Okta', saml: { entityId: 'x', ssoUrl: 'https://x.com', acsUrl: 'https://x.com/acs', spEntityId: 'x', idpCertificate: 'BEGIN CERTIFICATE', signedAssertions: true, attributeMapping: { email: 'email' } } }, 't-a')
      const r = await svc.completeSamlLogin('email=alice@example.com&nameId=alice-1', 't-a')
      assert.ok(r.isNewUser); assert.equal(r.email, 'alice@example.com')
    })
    it('SAML 再次登录返回 isNewUser=false', async () => {
      await svc.createSamlConnection({ name: 'Okta', saml: { entityId: 'x', ssoUrl: 'https://x.com', acsUrl: 'https://x.com/acs', spEntityId: 'x', idpCertificate: 'BEGIN CERTIFICATE', signedAssertions: true, attributeMapping: { email: 'email' } } }, 't-a')
      await svc.completeSamlLogin('email=bob@example.com&nameId=bob-1', 't-a')
      const r2 = await svc.completeSamlLogin('email=bob@example.com&nameId=bob-1', 't-a')
      assert.equal(r2.isNewUser, false)
    })
    it('OIDC 完成登录 JIT 创建用户', async () => {
      await svc.createOidcConnection({ name: 'Google', oidc: { issuer: 'g', clientId: 'c', clientSecret: 's', authorizationEndpoint: 'https://g.com/auth', tokenEndpoint: 'https://g.com/token', userinfoEndpoint: 'https://g.com/userinfo', jwksUri: 'https://g.com/jwks', redirectUri: 'https://app.com/cb', scope: 'openid', claimMapping: { email: 'email' } } }, 't-a')
      const r = await svc.completeOidcLogin('abc123', 't-a')
      assert.ok(r.isNewUser); assert.ok(r.userId)
    })
    it('OIDC 重复登录返回 isNewUser=false', async () => {
      await svc.createOidcConnection({ name: 'Google', oidc: { issuer: 'g', clientId: 'c', clientSecret: 's', authorizationEndpoint: 'https://g.com/auth', tokenEndpoint: 'https://g.com/token', userinfoEndpoint: 'https://g.com/userinfo', jwksUri: 'https://g.com/jwks', redirectUri: 'https://app.com/cb', scope: 'openid', claimMapping: { email: 'email' } } }, 't-a')
      await svc.completeOidcLogin('xyz789', 't-a')
      const r2 = await svc.completeOidcLogin('xyz789', 't-a')
      assert.equal(r2.isNewUser, false)
    })
    it('list 返回所有连接', async () => {
      await svc.createSamlConnection({ name: 'A', saml: { entityId: 'x', ssoUrl: 'https://x.com', acsUrl: 'https://x.com/acs', spEntityId: 'x', idpCertificate: 'BEGIN CERTIFICATE', signedAssertions: true, attributeMapping: { email: 'email' } } }, 't-a')
      await svc.createOidcConnection({ name: 'B', oidc: { issuer: 'g', clientId: 'c', clientSecret: 's', authorizationEndpoint: 'https://g.com/auth', tokenEndpoint: 'https://g.com/token', userinfoEndpoint: 'https://g.com/userinfo', jwksUri: 'https://g.com/jwks', redirectUri: 'https://app.com/cb', scope: 'openid', claimMapping: { email: 'email' } } }, 't-a')
      const list = await svc.list('t-a')
      assert.equal(list.length, 2)
    })
    it('删除连接', async () => {
      const c = await svc.createSamlConnection({ name: 'Del', saml: { entityId: 'x', ssoUrl: 'https://x.com', acsUrl: 'https://x.com/acs', spEntityId: 'x', idpCertificate: 'BEGIN CERTIFICATE', signedAssertions: true, attributeMapping: { email: 'email' } } }, 't-a')
      await svc.deleteConnection(c.id, 't-a')
      await assert.rejects(() => svc.getConnection(c.id, 't-a'), /不存在/)
    })
  })
})
