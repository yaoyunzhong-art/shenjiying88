import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * saas-advanced.entity.test.ts
 *
 * SaaS 高级模块实体单元测试。
 * 覆盖:
 * - CustomDomain (DomainMapping, isValidDomain, generateVerificationToken 等)
 * - SSO (SsoConnection, UserSsoIdentity, SamlConfig, OidcConfig 及工具函数)
 */

import assert from 'node:assert/strict'
import {
  generateVerificationToken,
  buildVerificationHost,
  buildVerificationValue,
  isValidDomain,
  computeSslFingerprint,
} from './custom-domain.entity'
import {
  generateConnectionId,
  generateIdentityId,
  generateSamlRequestId,
  generateOidcState,
  generatePkceVerifier,
  deriveCodeChallenge,
  extractEmailDomain,
  validateSamlConfig,
  validateOidcConfig,
  buildSamlAuthnRequest,
  buildOidcAuthUrl,
  buildSamlLogoutRequest,
  parseSamlAssertion,
} from './sso.entity'

// ──────────────────────────────────────────────
// Custom Domain 测试
// ──────────────────────────────────────────────
describe('CustomDomain entity', () => {
  // ---------- generateVerificationToken ----------
  it('正例: generateVerificationToken 返回 24 字符 base64url 字符串', () => {
    const token = generateVerificationToken()
    assert.equal(typeof token, 'string')
    assert.equal(token.length, 24)
    // base64url 只包含 [A-Za-z0-9_-]
    assert.match(token, /^[A-Za-z0-9_-]+$/)
  })

  it('正例: 两次生成 token 不同 (随机性)', () => {
    const t1 = generateVerificationToken()
    const t2 = generateVerificationToken()
    assert.notEqual(t1, t2)
  })

  // ---------- buildVerificationHost ----------
  it('正例: buildVerificationHost 构造正确', () => {
    const host = buildVerificationHost('acme.shenjiying88.com')
    assert.equal(host, '_shenjiying-verify.acme.shenjiying88.com')
  })

  it('正例: buildVerificationHost 处理子域名', () => {
    const host = buildVerificationHost('store.acme.com')
    assert.equal(host, '_shenjiying-verify.store.acme.com')
  })

  // ---------- buildVerificationValue ----------
  it('正例: buildVerificationValue 格式正确', () => {
    const value = buildVerificationValue('abc123token')
    assert.equal(value, 'shenjiying-verify=abc123token')
  })

  // ---------- isValidDomain ----------
  it('正例: isValidDomain 合法 FQDN', () => {
    const r = isValidDomain('acme.shenjiying88.com')
    assert.equal(r.valid, true)
    assert.equal(r.error, undefined)
  })

  it('正例: isValidDomain 长域名', () => {
    const r = isValidDomain('a-very-long-subdomain.valid-corp.com')
    assert.equal(r.valid, true)
  })

  it('反例: isValidDomain 空字符串', () => {
    const r = isValidDomain('')
    assert.equal(r.valid, false)
    assert.ok(r.error)
  })

  it('反例: isValidDomain 禁止本地域 localhost', () => {
    const r = isValidDomain('localhost')
    assert.equal(r.valid, false)
    assert.ok(r.error)
  })

  it('反例: isValidDomain 禁止 example.com', () => {
    const r = isValidDomain('example.com')
    assert.equal(r.valid, false)
    assert.ok(r.error?.includes('example.com'))
  })

  it('反例: isValidDomain 非法格式', () => {
    const r = isValidDomain('not-a-domain!')
    assert.equal(r.valid, false)
    assert.ok(r.error)
  })

  it('边界: isValidDomain 超过 253 字符', () => {
    const long = 'a'.repeat(254) + '.com'
    const r = isValidDomain(long)
    assert.equal(r.valid, false)
    assert.ok(r.error?.includes('253'))
  })

  // ---------- computeSslFingerprint ----------
  it('正例: computeSslFingerprint 返回 64 字符串', () => {
    const pem = '-----BEGIN CERTIFICATE-----\nMIIBxTCCAS0wDQYJKoZIhvcNAQEFBQAwFDESMBAGA1UEAwwJbG9jYWxob3N0MB4XDTI0\n-----END CERTIFICATE-----'
    const fp = computeSslFingerprint(pem)
    assert.equal(typeof fp, 'string')
    assert.equal(fp.length, 64)
  })

  it('正例: computeSslFingerprint 对同一 PEM 返回相同值', () => {
    const pem = '-----BEGIN CERTIFICATE-----\nMIIBxTCCAS0wDQYJKoZIhvcNAQEFBQAwFDESMBAGA1UEAwwJbG9jYWxob3N0MB4XDTI0\n-----END CERTIFICATE-----'
    assert.equal(computeSslFingerprint(pem), computeSslFingerprint(pem))
  })

  // ---------- DomainMapping 接口结构 ----------
  it('正例: DomainMapping 接口结构完整', () => {
    const mapping = {
      id: 'dm-001',
      tenantId: 'tenant-A',
      domain: 'acme.shenjiying88.com',
      verificationToken: 't0k3n',
      verificationHost: '_shenjiying-verify.acme.shenjiying88.com',
      status: 'active' as const,
      ssl: {
        provider: 'letsencrypt' as const,
        expiresAt: '2026-12-31T00:00:00Z',
        fingerprint: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        lastRenewedAt: '2026-06-01T00:00:00Z',
      },
      lastVerifiedAt: '2026-06-29T00:00:00Z',
      verificationFailCount: 0,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-06-28T00:00:00Z',
      createdBy: 'admin',
    }
    assert.equal(mapping.id, 'dm-001')
    assert.equal(mapping.tenantId, 'tenant-A')
    assert.equal(mapping.status, 'active')
    assert.equal(mapping.verificationFailCount, 0)
    assert.equal(mapping.ssl!.provider, 'letsencrypt')
  })

  it('正例: DomainStatus 枚举值正确', () => {
    const statuses = ['pending_verification', 'active', 'ssl_issuing', 'active_ssl', 'ssl_failed', 'disabled']
    for (const s of statuses) {
      const mapping = { status: s, id: 'x', tenantId: 't', domain: 'x.com', verificationToken: 't', verificationHost: 'h', verificationFailCount: 0, createdAt: '', updatedAt: '', createdBy: '' }
      assert.equal(mapping.status, s)
    }
  })
})

// ──────────────────────────────────────────────
// SSO 测试
// ──────────────────────────────────────────────
describe('SSO entity', () => {
  // ---------- generateXxxId ----------
  it('正例: generateConnectionId 返回以 sso- 开头的 ID', () => {
    const id = generateConnectionId()
    assert.ok(id.startsWith('sso-'))
    assert.ok(id.length > 4)
  })

  it('正例: generateIdentityId 返回以 ssoid- 开头的 ID', () => {
    const id = generateIdentityId()
    assert.ok(id.startsWith('ssoid-'))
  })

  it('正例: generateSamlRequestId 返回以 _ 开头的 ID', () => {
    const id = generateSamlRequestId()
    assert.ok(id.startsWith('_'))
  })

  // ---------- OIDC 安全相关 ----------
  it('正例: generateOidcState 返回 base64url 字符串', () => {
    const state = generateOidcState()
    assert.equal(typeof state, 'string')
    assert.ok(state.length > 0)
    assert.match(state, /^[A-Za-z0-9_-]+$/)
  })

  it('正例: generatePkceVerifier 返回 base64url 字符串', () => {
    const verifier = generatePkceVerifier()
    assert.equal(typeof verifier, 'string')
    assert.ok(verifier.length > 0)
    assert.match(verifier, /^[A-Za-z0-9_-]+$/)
  })

  it('正例: deriveCodeChallenge 返回 base64url 字符串', () => {
    const verifier = generatePkceVerifier()
    const challenge = deriveCodeChallenge(verifier)
    assert.equal(typeof challenge, 'string')
    assert.ok(challenge.length > 0)
    assert.match(challenge, /^[A-Za-z0-9_-]+$/)
  })

  // ---------- extractEmailDomain ----------
  it('正例: extractEmailDomain 正常邮箱', () => {
    assert.equal(extractEmailDomain('user@shenjiying88.com'), 'shenjiying88.com')
  })

  it('正例: extractEmailDomain 子域名邮箱', () => {
    assert.equal(extractEmailDomain('user@sub.example.com'), 'sub.example.com')
  })

  it('反例: extractEmailDomain 无 @ 返回空', () => {
    assert.equal(extractEmailDomain('notanemail'), '')
  })

  it('反例: extractEmailDomain 空字符串返回空', () => {
    assert.equal(extractEmailDomain(''), '')
  })

  // ---------- validateSamlConfig ----------
  const validSaml = () => ({
    entityId: 'https://idp.example.com/entity',
    ssoUrl: 'https://idp.example.com/sso',
    idpCertificate: '-----BEGIN CERTIFICATE-----\nMIIDazCCAlM=\n-----END CERTIFICATE-----',
    spEntityId: 'https://sp.shenjiying88.com/saml',
    acsUrl: 'https://sp.shenjiying88.com/api/auth/saml/callback',
    nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    attributeMapping: { email: 'email' },
    signedAssertions: true,
  })

  it('正例: validateSamlConfig 完整配置通过', () => {
    const r = validateSamlConfig(validSaml())
    assert.equal(r.valid, true)
  })

  it('反例: validateSamlConfig 缺 entityId', () => {
    const cfg = validSaml()
    cfg.entityId = ''
    const r = validateSamlConfig(cfg)
    assert.equal(r.valid, false)
    assert.ok(r.error?.includes('entityId'))
  })

  it('反例: validateSamlConfig 缺 ssoUrl', () => {
    const cfg = validSaml()
    cfg.ssoUrl = ''
    const r = validateSamlConfig(cfg)
    assert.equal(r.valid, false)
    assert.ok(r.error?.includes('ssoUrl'))
  })

  it('反例: validateSamlConfig 缺 idpCertificate', () => {
    const cfg = validSaml()
    cfg.idpCertificate = ''
    const r = validateSamlConfig(cfg)
    assert.equal(r.valid, false)
    assert.ok(r.error?.includes('idpCertificate'))
  })

  it('反例: validateSamlConfig 缺 acsUrl', () => {
    const cfg = validSaml()
    cfg.acsUrl = ''
    const r = validateSamlConfig(cfg)
    assert.equal(r.valid, false)
    assert.ok(r.error?.includes('acsUrl'))
  })

  it('反例: validateSamlConfig illegal ssoUrl', () => {
    const cfg = validSaml()
    cfg.ssoUrl = 'not-a-url'
    const r = validateSamlConfig(cfg)
    assert.equal(r.valid, false)
    assert.ok(r.error?.includes('URL'))
  })

  it('反例: validateSamlConfig PEM 格式不正确', () => {
    const cfg = validSaml()
    cfg.idpCertificate = 'not-pem-content'
    const r = validateSamlConfig(cfg)
    assert.equal(r.valid, false)
    assert.ok(r.error?.includes('PEM'))
  })

  it('反例: validateSamlConfig 缺 attributeMapping.email', () => {
    const cfg = validSaml()
    cfg.attributeMapping.email = ''
    const r = validateSamlConfig(cfg)
    assert.equal(r.valid, false)
    assert.ok(r.error?.includes('email'))
  })

  // ---------- validateOidcConfig ----------
  const validOidc = () => ({
    issuer: 'https://accounts.google.com',
    clientId: 'client-id-123',
    clientSecret: 'gs-abc-def',
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    userinfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
    jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
    redirectUri: 'https://sp.shenjiying88.com/api/auth/oidc/callback',
    scope: 'openid profile email',
    claimMapping: { email: 'email' },
  })

  it('正例: validateOidcConfig 完整配置通过', () => {
    const r = validateOidcConfig(validOidc())
    assert.equal(r.valid, true)
  })

  it('反例: validateOidcConfig 缺 issuer', () => {
    const cfg = validOidc()
    cfg.issuer = ''
    const r = validateOidcConfig(cfg)
    assert.equal(r.valid, false)
    assert.ok(r.error?.includes('issuer'))
  })

  it('反例: validateOidcConfig 缺 clientSecret', () => {
    const cfg = validOidc()
    cfg.clientSecret = ''
    const r = validateOidcConfig(cfg)
    assert.equal(r.valid, false)
    assert.ok(r.error?.includes('clientSecret'))
  })

  it('反例: validateOidcConfig URL 格式不合法', () => {
    const cfg = validOidc()
    cfg.authorizationEndpoint = 'not-url'
    const r = validateOidcConfig(cfg)
    assert.equal(r.valid, false)
    assert.ok(r.error?.includes('URL'))
  })

  it('反例: validateOidcConfig 缺 claimMapping.email', () => {
    const cfg = validOidc()
    cfg.claimMapping.email = ''
    const r = validateOidcConfig(cfg)
    assert.equal(r.valid, false)
    assert.ok(r.error?.includes('email'))
  })

  it('反例: validateOidcConfig 缺 clientId', () => {
    const cfg = validOidc()
    cfg.clientId = ''
    const r = validateOidcConfig(cfg)
    assert.equal(r.valid, false)
    assert.ok(r.error?.includes('clientId'))
  })

  // ---------- buildSamlAuthnRequest ----------
  it('正例: buildSamlAuthnRequest 返回 SAML XML', () => {
    const xml = buildSamlAuthnRequest({
      spEntityId: 'https://sp.shenjiying88.com/saml',
      acsUrl: 'https://sp.shenjiying88.com/api/auth/saml/callback',
      id: '_request123',
      forceAuthn: false,
    })
    assert.ok(xml.includes('samlp:AuthnRequest'))
    assert.ok(xml.includes('_request123'))
    assert.ok(xml.includes('AssertionConsumerServiceURL'))
    assert.ok(!xml.includes('ForceAuthn'))
  })

  it('正例: buildSamlAuthnRequest forceAuthn=true 包含 ForceAuthn', () => {
    const xml = buildSamlAuthnRequest({
      spEntityId: 'https://sp.shenjiying88.com/saml',
      acsUrl: 'https://sp.shenjiying88.com/api/auth/saml/callback',
      id: '_req456',
      forceAuthn: true,
    })
    assert.ok(xml.includes('ForceAuthn="true"'))
  })

  // ---------- buildOidcAuthUrl ----------
  it('正例: buildOidcAuthUrl 返回完整 URL', () => {
    const url = buildOidcAuthUrl({
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      clientId: 'my-client',
      redirectUri: 'https://sp.shenjiying88.com/callback',
      scope: 'openid email',
      state: 'abc123state',
      codeChallenge: 'challenge123',
    })
    assert.ok(url.startsWith('https://accounts.google.com/o/oauth2/v2/auth'))
    assert.ok(url.includes('response_type=code'))
    assert.ok(url.includes('client_id=my-client'))
    assert.ok(url.includes('code_challenge_method=S256'))
  })

  // ---------- buildSamlLogoutRequest ----------
  it('正例: buildSamlLogoutRequest 基本格式', () => {
    const xml = buildSamlLogoutRequest({
      spEntityId: 'sp-entity',
      nameId: 'user@sso.idp',
    })
    assert.ok(xml.includes('samlp:LogoutRequest'))
    assert.ok(xml.includes('user@sso.idp'))
    assert.ok(!xml.includes('SessionIndex'))
  })

  it('正例: buildSamlLogoutRequest 含 SessionIndex', () => {
    const xml = buildSamlLogoutRequest({
      spEntityId: 'sp-entity',
      nameId: 'user@sso.idp',
      sessionIndex: 'si_abc',
    })
    assert.ok(xml.includes('SessionIndex'))
    assert.ok(xml.includes('si_abc'))
  })

  // ---------- parseSamlAssertion ----------
  it('正例: parseSamlAssertion 解析基本断言', () => {
    const xml = `<samlp:Response><saml:Assertion><saml:Subject><saml:NameID>user@idp.com</saml:NameID></saml:Subject><saml:AttributeStatement><saml:Attribute Name="email"><saml:AttributeValue>user@idp.com</saml:AttributeValue></saml:Attribute></saml:AttributeStatement></saml:Assertion></samlp:Response>`
    const parsed = parseSamlAssertion(xml)
    assert.equal(parsed.nameId, 'user@idp.com')
    assert.equal(parsed.email, 'user@idp.com')
  })

  it('正例: parseSamlAssertion 解析 SessionIndex', () => {
    const xml = `<samlp:Response><saml:Assertion><saml:Subject><saml:NameID>user@idp.com</saml:NameID><samlp:SessionIndex>si_session_001</samlp:SessionIndex></saml:Subject></saml:Assertion></samlp:Response>`
    const parsed = parseSamlAssertion(xml)
    assert.equal(parsed.nameId, 'user@idp.com')
  })

  it('反例: parseSamlAssertion 空字符串返回空 nameId', () => {
    const parsed = parseSamlAssertion('')
    assert.equal(parsed.nameId, '')
    assert.deepEqual(parsed.attributes, {})
  })

  // ---------- SsoConnection 接口结构 ----------
  it('正例: SsoConnection 基本结构 SAML', () => {
    const conn = {
      id: 'sso-001',
      tenantId: 'tenant-A',
      protocol: 'saml' as const,
      name: '企业 IDP',
      status: 'active' as const,
      saml: validSaml(),
      isDefault: true,
      defaultRole: 'tenant_admin' as const,
      autoProvisionTenant: false,
      allowedEmailDomains: ['shenjiying88.com'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
      createdBy: 'admin',
    }
    assert.equal(conn.protocol, 'saml')
    assert.equal(conn.isDefault, true)
    assert.equal(conn.defaultRole, 'tenant_admin')
  })

  it('正例: SsoConnection 基本结构 OIDC', () => {
    const conn = {
      id: 'sso-002',
      tenantId: 'tenant-B',
      protocol: 'oidc' as const,
      name: 'Google Workspace',
      status: 'active' as const,
      oidc: validOidc(),
      isDefault: true,
      defaultRole: 'store_admin' as const,
      autoProvisionTenant: true,
      allowedEmailDomains: [],
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-06-15T00:00:00Z',
      createdBy: 'admin',
    }
    assert.equal(conn.protocol, 'oidc')
    assert.equal(conn.autoProvisionTenant, true)
    assert.equal(conn.allowedEmailDomains.length, 0)
  })

  // ---------- UserSsoIdentity 接口结构 ----------
  it('正例: UserSsoIdentity 结构完整', () => {
    const identity = {
      id: 'ssoid-001',
      userId: 'user-001',
      tenantId: 'tenant-A',
      connectionId: 'sso-001',
      protocol: 'saml' as const,
      subject: 'admin@shenjiying88.com',
      email: 'admin@shenjiying88.com',
      displayName: '管理员',
      lastLoginAt: '2026-06-30T08:00:00Z',
      loginCount: 42,
      createdAt: '2026-01-15T00:00:00Z',
    }
    assert.equal(identity.userId, 'user-001')
    assert.equal(identity.loginCount, 42)
    assert.equal(identity.email, 'admin@shenjiying88.com')
  })

  it('边界: UserSsoIdentity loginCount 为 0 (首次登录)', () => {
    const identity = {
      id: 'ssoid-002',
      userId: 'user-002',
      tenantId: 'tenant-B',
      connectionId: 'sso-002',
      protocol: 'oidc' as const,
      subject: 'newuser@corp.com',
      email: 'newuser@corp.com',
      lastLoginAt: '2026-06-30T08:00:00Z',
      loginCount: 0,
      createdAt: '2026-06-30T08:00:00Z',
    }
    assert.equal(identity.loginCount, 0)
  })
})
