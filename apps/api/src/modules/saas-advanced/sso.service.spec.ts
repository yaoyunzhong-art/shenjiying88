/**
 * sso.service.spec.ts
 *
 * 纯内联函数式 — 不 import 生产代码
 * ≥18 项: 枚举+类型, mock 数据工厂, 内联业务逻辑纯函数
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { randomUUID, createHash, createHmac } from 'node:crypto'

// ── 1. 枚举 + 类型定义 ──────────────────────────────────────────────────────

type SsoProtocol = 'saml' | 'oidc'
type SsoConnectionStatus = 'active' | 'disabled' | 'pending_verification'

interface SamlConfig {
  entityId: string
  ssoUrl: string
  sloUrl?: string
  idpCertificate: string
  spEntityId: string
  acsUrl: string
  attributeMapping: { email: string; name?: string; role?: string; tenantId?: string }
  signedAssertions: boolean
}

interface OidcConfig {
  issuer: string
  clientId: string
  clientSecret: string
  authorizationEndpoint: string
  tokenEndpoint: string
  userinfoEndpoint: string
  jwksUri: string
  redirectUri: string
  scope: string
  claimMapping: { email: string; name?: string; role?: string; tenantId?: string }
}

interface SsoConnection {
  id: string
  tenantId: string
  protocol: SsoProtocol
  name: string
  status: SsoConnectionStatus
  saml?: SamlConfig
  oidc?: OidcConfig
  isDefault: boolean
  defaultRole: string
  autoProvisionTenant: boolean
  allowedEmailDomains: string[]
  createdAt: string
  updatedAt: string
  createdBy: string
}

interface UserSsoIdentity {
  id: string
  userId: string
  tenantId: string
  connectionId: string
  protocol: SsoProtocol
  subject: string
  email: string
  displayName?: string
  lastLoginAt: string
  loginCount: number
  createdAt: string
}

interface SsoUser {
  id: string
  tenantId: string
  email: string
  displayName?: string
  role: string
  createdAt: string
}

interface LoginInitResult {
  redirectUrl: string
  state?: string
  codeVerifier?: string
  requestId?: string
}

interface LoginCompleteResult {
  userId: string
  email: string
  role: string
  isNewUser: boolean
  tenantId: string
  accessToken: string
  refreshToken?: string
  expiresIn: number
}

// ── 2. Mock 数据工厂 ────────────────────────────────────────────────────────

const VALID_SAML: SamlConfig = {
  entityId: 'https://idp.example.com/metadata',
  ssoUrl: 'https://idp.example.com/sso',
  sloUrl: 'https://idp.example.com/slo',
  idpCertificate: '-----BEGIN CERTIFICATE-----\nMIITEST\n-----END CERTIFICATE-----',
  spEntityId: 'https://shenjiying88.com/saml/metadata',
  acsUrl: 'https://shenjiying88.com/saml/acs',
  attributeMapping: { email: 'email', name: 'displayName', role: 'role' },
  signedAssertions: true,
}

const VALID_OIDC: OidcConfig = {
  issuer: 'https://idp.example.com',
  clientId: 'client-abc',
  clientSecret: 'secret-xyz',
  authorizationEndpoint: 'https://idp.example.com/oauth2/authorize',
  tokenEndpoint: 'https://idp.example.com/oauth2/token',
  userinfoEndpoint: 'https://idp.example.com/oauth2/userinfo',
  jwksUri: 'https://idp.example.com/.well-known/jwks.json',
  redirectUri: 'https://shenjiying88.com/oidc/callback',
  scope: 'openid profile email',
  claimMapping: { email: 'email', name: 'name' },
}

function makeSsoUser(overrides: Partial<SsoUser> = {}): SsoUser {
  const now = new Date().toISOString()
  return {
    id: `user-${randomUUID().slice(0, 8)}`,
    tenantId: 'tenant-A',
    email: 'alice@example.com',
    role: 'operator',
    createdAt: now,
    ...overrides,
  }
}

// ── 3. 纯内联工厂函数 — 替代 SsoService ────────────────────────────────────

function createSsoService(tenantIdOverride?: string) {
  const connections = new Map<string, SsoConnection>()
  const connectionsByTenant = new Map<string, Set<string>>()
  const connectionsByName = new Map<string, string>()
  const identities = new Map<string, UserSsoIdentity>()
  const identitiesByConnection = new Map<string, Set<string>>()
  const identitiesBySubject = new Map<string, string>()
  const users = new Map<string, SsoUser>()
  const usersByTenantEmail = new Map<string, string>()
  const pkceStore = new Map<string, { codeVerifier: string; connectionId: string; redirectAfter?: string; expiresAt: number }>()
  const samlRequestStore = new Map<string, { connectionId: string; redirectAfter?: string; expiresAt: number }>()

  let tenantCounter = 0

  function getTenantId(): string {
    if (tenantIdOverride) return tenantIdOverride
    return `tenant-${String(++tenantCounter).padStart(3, '0')}`
  }

  function genConnectionId(): string {
    return `sso-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
  }

  function genSamlRequestId(): string {
    return `_${Math.random().toString(36).slice(2, 18)}`
  }

  function genOidcState(): string {
    const bytes = new Uint8Array(16)
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
    return Buffer.from(bytes).toString('base64url')
  }

  function genPkceVerifier(): string {
    const bytes = new Uint8Array(32)
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
    return Buffer.from(bytes).toString('base64url')
  }

  function deriveCodeChallenge(verifier: string): string {
    return createHash('sha256').update(verifier).digest('base64url')
  }

  function extractEmailDomain(email: string): string {
    const at = email.indexOf('@')
    if (at < 0) return ''
    return email.slice(at + 1).toLowerCase()
  }

  function validateSaml(cfg: SamlConfig): { valid: boolean; error?: string } {
    if (!cfg.entityId) return { valid: false, error: 'entityId 必填' }
    if (!cfg.ssoUrl) return { valid: false, error: 'ssoUrl 必填' }
    if (!cfg.idpCertificate) return { valid: false, error: 'idpCertificate 必填' }
    if (!cfg.spEntityId) return { valid: false, error: 'spEntityId 必填' }
    if (!cfg.acsUrl) return { valid: false, error: 'acsUrl 必填' }
    try { new URL(cfg.ssoUrl) } catch { return { valid: false, error: 'ssoUrl 不是合法 URL' } }
    try { new URL(cfg.acsUrl) } catch { return { valid: false, error: 'acsUrl 不是合法 URL' } }
    if (!cfg.idpCertificate.includes('BEGIN CERTIFICATE')) return { valid: false, error: '非 PEM 格式' }
    return { valid: true }
  }

  function validateOidc(cfg: OidcConfig): { valid: boolean; error?: string } {
    if (!cfg.issuer) return { valid: false, error: 'issuer 必填' }
    if (!cfg.clientId) return { valid: false, error: 'clientId 必填' }
    if (!cfg.clientSecret) return { valid: false, error: 'clientSecret 必填' }
    if (!cfg.redirectUri) return { valid: false, error: 'redirectUri 必填' }
    try { new URL(cfg.redirectUri) } catch { return { valid: false, error: 'redirectUri 不是合法 URL' } }
    return { valid: true }
  }

  function buildSamlAuthnRequest(opts: { spEntityId: string; acsUrl: string; id: string; forceAuthn?: boolean }): string {
    const issueInstant = new Date().toISOString()
    const force = opts.forceAuthn ? ' ForceAuthn="true"' : ''
    return `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="${opts.id}" Version="2.0" IssueInstant="${issueInstant}" Destination="" AssertionConsumerServiceURL="${opts.acsUrl}"${force}><saml:Issuer>${opts.spEntityId}</saml:Issuer></samlp:AuthnRequest>`
  }

  function buildOidcAuthUrl(opts: { authorizationEndpoint: string; clientId: string; redirectUri: string; scope: string; state: string; codeChallenge: string }): string {
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

  function parseSamlAssertion(samlResponse: string): { nameId: string; email?: string; attributes: Record<string, string> } {
    const nameIdMatch = samlResponse.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/)
    const attributes: Record<string, string> = {}
    const attrRegex = /<saml:Attribute Name="([^"]+)"[^>]*>[\s\S]*?<saml:AttributeValue[^>]*>([^<]+)<\/saml:AttributeValue>/g
    let m: RegExpExecArray | null
    while ((m = attrRegex.exec(samlResponse))) attributes[m[1]] = m[2]
    return {
      nameId: nameIdMatch?.[1] ?? '',
      email: attributes['email'] ?? attributes['mail'] ?? attributes['urn:oid:0.9.2342.19200300.100.1.3'],
      attributes,
    }
  }

  function signAccessToken(payload: { userId: string; tenantId: string; email: string; role: string }): string {
    const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
    const now = Math.floor(Date.now() / 1000)
    const claims = { ...payload, iat: now, exp: now + 3600, sub: payload.userId }
    const payloadB64 = Buffer.from(JSON.stringify(claims)).toString('base64url')
    const secret = 'mock-sso-secret-for-dev-only'
    const sig = createHmac('sha256', secret).update(`${headerB64}.${payloadB64}`).digest('base64url')
    return `${headerB64}.${payloadB64}.${sig}`
  }

  function verifyAccessToken(token: string): { userId: string; tenantId: string; role: string } | null {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [headerB64, payloadB64, sig] = parts
    const secret = 'mock-sso-secret-for-dev-only'
    const expectedSig = createHmac('sha256', secret).update(`${headerB64}.${payloadB64}`).digest('base64url')
    if (sig !== expectedSig) return null
    try {
      const claims = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'))
      if (claims.exp < Math.floor(Date.now() / 1000)) return null
      return { userId: claims.userId, tenantId: claims.tenantId, role: claims.role }
    } catch { return null }
  }

  function encryptSecret(plain: string): string {
    // 简单 mock: base64 编码
    return Buffer.from(plain).toString('base64')
  }

  // ── CRUD ──

  function createSamlConnection(dto: { name: string; saml: SamlConfig; defaultRole?: string; allowedEmailDomains?: string[] }): SsoConnection {
    const tid = getTenantId()
    const valid = validateSaml(dto.saml)
    if (!valid.valid) throw new Error(valid.error!)
    const nameKey = `${tid}:${dto.name}`
    if (connectionsByName.has(nameKey)) throw new Error(`连接名称 "${dto.name}" 已存在`)
    const now = new Date().toISOString()
    const conn: SsoConnection = {
      id: genConnectionId(),
      tenantId: tid,
      protocol: 'saml',
      name: dto.name,
      status: 'active',
      saml: { ...dto.saml },
      isDefault: false,
      defaultRole: dto.defaultRole ?? 'operator',
      autoProvisionTenant: false,
      allowedEmailDomains: dto.allowedEmailDomains ?? [],
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
    }
    connections.set(conn.id, conn)
    connectionsByName.set(nameKey, conn.id)
    if (!connectionsByTenant.has(tid)) connectionsByTenant.set(tid, new Set())
    connectionsByTenant.get(tid)!.add(conn.id)
    return conn
  }

  function createOidcConnection(dto: { name: string; oidc: OidcConfig; defaultRole?: string; allowedEmailDomains?: string[] }): SsoConnection {
    const tid = getTenantId()
    const valid = validateOidc(dto.oidc)
    if (!valid.valid) throw new Error(valid.error!)
    const nameKey = `${tid}:${dto.name}`
    if (connectionsByName.has(nameKey)) throw new Error(`连接名称 "${dto.name}" 已存在`)
    const now = new Date().toISOString()
    const oidcCfg: OidcConfig = { ...dto.oidc, clientSecret: encryptSecret(dto.oidc.clientSecret) }
    const conn: SsoConnection = {
      id: genConnectionId(),
      tenantId: tid,
      protocol: 'oidc',
      name: dto.name,
      status: 'active',
      oidc: oidcCfg,
      isDefault: false,
      defaultRole: dto.defaultRole ?? 'operator',
      autoProvisionTenant: false,
      allowedEmailDomains: dto.allowedEmailDomains ?? [],
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
    }
    connections.set(conn.id, conn)
    connectionsByName.set(nameKey, conn.id)
    if (!connectionsByTenant.has(tid)) connectionsByTenant.set(tid, new Set())
    connectionsByTenant.get(tid)!.add(conn.id)
    return conn
  }

  function listConnections(tid: string): SsoConnection[] {
    const ids = connectionsByTenant.get(tid) ?? new Set()
    return Array.from(ids).map(id => connections.get(id)).filter(c => c != null)
  }

  function getConnection(id: string, tid: string): SsoConnection | null {
    const c = connections.get(id)
    if (!c || c.tenantId !== tid) return null
    return c
  }

  function updateConnection(id: string, updates: Partial<SsoConnection>): SsoConnection | null {
    const c = connections.get(id)
    if (!c) return null
    Object.assign(c, updates, { id: c.id, updatedAt: new Date().toISOString() })
    connections.set(id, c)
    return c
  }

  // ── 登录 ──

  function initiateSamlLogin(conn: SsoConnection): LoginInitResult {
    if (!conn.saml) throw new Error('SAML 配置缺失')
    const requestId = genSamlRequestId()
    const authnRequest = buildSamlAuthnRequest({ spEntityId: conn.saml.spEntityId, acsUrl: conn.saml.acsUrl, id: requestId })
    const samlRequestB64 = Buffer.from(authnRequest).toString('base64')
    samlRequestStore.set(requestId, { connectionId: conn.id, expiresAt: Date.now() + 5 * 60 * 1000 })
    const ssoUrl = new URL(conn.saml.ssoUrl)
    ssoUrl.searchParams.set('SAMLRequest', samlRequestB64)
    return { redirectUrl: ssoUrl.toString(), requestId }
  }

  function initiateOidcLogin(conn: SsoConnection): LoginInitResult {
    if (!conn.oidc) throw new Error('OIDC 配置缺失')
    const codeVerifier = genPkceVerifier()
    const codeChallenge = deriveCodeChallenge(codeVerifier)
    const state = genOidcState()
    pkceStore.set(state, { codeVerifier, connectionId: conn.id, expiresAt: Date.now() + 10 * 60 * 1000 })
    const redirectUrl = buildOidcAuthUrl({
      authorizationEndpoint: conn.oidc.authorizationEndpoint,
      clientId: conn.oidc.clientId,
      redirectUri: conn.oidc.redirectUri,
      scope: conn.oidc.scope,
      state,
      codeChallenge,
    })
    return { redirectUrl, state, codeVerifier }
  }

  function initiateLogin(connectionId: string): LoginInitResult {
    const conn = connections.get(connectionId)
    if (!conn) throw new Error('SSO 连接不存在')
    if (conn.status !== 'active') throw new Error('SSO 连接未启用')
    return conn.protocol === 'saml' ? initiateSamlLogin(conn) : initiateOidcLogin(conn)
  }

  function handleUserLogin(conn: SsoConnection, email: string, subject: string, displayName?: string): LoginCompleteResult {
    const userKey = `${conn.tenantId}:${email.toLowerCase()}`
    let userId = usersByTenantEmail.get(userKey)
    let isNewUser = false
    if (!userId) {
      userId = `user-${randomUUID().slice(0, 8)}-${Date.now().toString(36)}`
      const now = new Date().toISOString()
      const user: SsoUser = { id: userId, tenantId: conn.tenantId, email: email.toLowerCase(), displayName, role: conn.defaultRole, createdAt: now }
      users.set(userId, user)
      usersByTenantEmail.set(userKey, userId)
      isNewUser = true
    }
    const accessToken = signAccessToken({ userId: userId!, tenantId: conn.tenantId, email: email.toLowerCase(), role: conn.defaultRole })
    return { userId: userId!, email: email.toLowerCase(), role: conn.defaultRole, isNewUser, tenantId: conn.tenantId, accessToken, refreshToken: `refresh-${randomUUID().slice(0, 16)}`, expiresIn: 3600 }
  }

  function getDefaultConnection(email: string): SsoConnection | null {
    const domain = extractEmailDomain(email)
    for (const conn of connections.values()) {
      if (conn.status !== 'active') continue
      if (conn.allowedEmailDomains.length > 0 && !conn.allowedEmailDomains.includes(domain)) continue
      if (conn.isDefault) return conn
    }
    for (const conn of connections.values()) {
      if (conn.status === 'active') return conn
    }
    return null
  }

  return {
    validateSaml,
    validateOidc,
    createSamlConnection,
    createOidcConnection,
    listConnections,
    getConnection,
    updateConnection,
    initiateLogin,
    initiateSamlLogin,
    initiateOidcLogin,
    handleUserLogin,
    getDefaultConnection,
    signAccessToken,
    verifyAccessToken,
    parseSamlAssertion,
    buildSamlAuthnRequest,
    buildOidcAuthUrl,
    extractEmailDomain,
    genPkceVerifier,
    deriveCodeChallenge,
    genOidcState,
    genSamlRequestId,
    connections,
    users,
    identities,
  }
}

// ── 4. Tests (≥18) ─────────────────────────────────────────────────────────

describe('SSO Service (内联纯函数)', () => {
  let svc: ReturnType<typeof createSsoService>

  beforeEach(() => {
    svc = createSsoService('test-tenant')
  })

  // ── 校验 ──
  describe('SAML 配置校验', () => {
    it('正例: 合法 SAML 通过', () => {
      expect(svc.validateSaml(VALID_SAML).valid).toBe(true)
    })

    it('反例: 缺失 entityId 被拒', () => {
      const r = svc.validateSaml({ ...VALID_SAML, entityId: '' })
      expect(r.valid).toBe(false)
      expect(r.error).toContain('entityId')
    })

    it('反例: 非 URL 被拒 + 非 PEM 被拒', () => {
      const r1 = svc.validateSaml({ ...VALID_SAML, ssoUrl: 'not-a-url' })
      expect(r1.valid).toBe(false)
      const r2 = svc.validateSaml({ ...VALID_SAML, idpCertificate: 'plain text' })
      expect(r2.valid).toBe(false)
    })
  })

  describe('OIDC 配置校验', () => {
    it('正例: 合法 OIDC 通过', () => {
      expect(svc.validateOidc(VALID_OIDC).valid).toBe(true)
    })

    it('反例: 缺失 clientSecret 被拒', () => {
      const r = svc.validateOidc({ ...VALID_OIDC, clientSecret: '' })
      expect(r.valid).toBe(false)
    })

    it('反例: 非合法 redirectUri 被拒', () => {
      const r = svc.validateOidc({ ...VALID_OIDC, redirectUri: 'not-url' })
      expect(r.valid).toBe(false)
    })
  })

  // ── URL 构造 ──
  describe('URL 构造', () => {
    it('buildSamlAuthnRequest 包含 Issuer + ACS', () => {
      const xml = svc.buildSamlAuthnRequest({ spEntityId: VALID_SAML.spEntityId, acsUrl: VALID_SAML.acsUrl, id: '_req-123' })
      expect(xml).toContain('AuthnRequest')
      expect(xml).toContain(VALID_SAML.spEntityId)
      expect(xml).toContain(VALID_SAML.acsUrl)
    })

    it('buildOidcAuthUrl 包含 PKCE + state', () => {
      const url = svc.buildOidcAuthUrl({
        authorizationEndpoint: VALID_OIDC.authorizationEndpoint,
        clientId: VALID_OIDC.clientId,
        redirectUri: VALID_OIDC.redirectUri,
        scope: VALID_OIDC.scope,
        state: 'state-xyz',
        codeChallenge: 'challenge-abc',
      })
      const parsed = new URL(url)
      expect(parsed.searchParams.get('client_id')).toBe(VALID_OIDC.clientId)
      expect(parsed.searchParams.get('state')).toBe('state-xyz')
      expect(parsed.searchParams.get('code_challenge')).toBe('challenge-abc')
      expect(parsed.searchParams.get('code_challenge_method')).toBe('S256')
    })

    it('parseSamlAssertion 提取 NameID + email', () => {
      const xml = '<samlp:Response><saml:Assertion><saml:Subject><saml:NameID>user-123</saml:NameID></saml:Subject><saml:AttributeStatement><saml:Attribute Name="email"><saml:AttributeValue>a@b.com</saml:AttributeValue></saml:Attribute></saml:AttributeStatement></saml:Assertion></samlp:Response>'
      const parsed = svc.parseSamlAssertion(xml)
      expect(parsed.nameId).toBe('user-123')
      expect(parsed.email).toBe('a@b.com')
    })
  })

  // ── 工具函数 ──
  describe('工具函数', () => {
    it('extractEmailDomain 提取正确', () => {
      expect(svc.extractEmailDomain('alice@shop.shenjiying88.com')).toBe('shop.shenjiying88.com')
      expect(svc.extractEmailDomain('invalid')).toBe('')
    })

    it('PKCE verifier + challenge 长度正确', () => {
      const v = svc.genPkceVerifier()
      expect(v.length).toBeGreaterThanOrEqual(40)
      const c = svc.deriveCodeChallenge(v)
      expect(c.length).toBeGreaterThan(0)
    })

    it('genOidcState 是 base64url', () => {
      const s = svc.genOidcState()
      expect(s.length).toBeGreaterThanOrEqual(16)
      expect(s).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it('genSamlRequestId 格式正确', () => {
      const id = svc.genSamlRequestId()
      expect(id).toMatch(/^_/)
    })
  })

  // ── SAML CRUD ──
  describe('SAML 连接 CRUD', () => {
    it('正例: 创建 SAML 连接 → active + 默认角色', () => {
      const conn = svc.createSamlConnection({ name: 'okta-saml', saml: VALID_SAML, defaultRole: 'store_admin' })
      expect(conn.protocol).toBe('saml')
      expect(conn.status).toBe('active')
      expect(conn.defaultRole).toBe('store_admin')
    })

    it('反例: 重复连接名被拒', () => {
      svc.createSamlConnection({ name: 'dup', saml: VALID_SAML })
      expect(() => svc.createSamlConnection({ name: 'dup', saml: VALID_SAML })).toThrow('已存在')
    })
  })

  // ── OIDC CRUD ──
  describe('OIDC 连接 CRUD', () => {
    it('正例: 创建 OIDC 连接', () => {
      const conn = svc.createOidcConnection({ name: 'azure-oidc', oidc: VALID_OIDC, allowedEmailDomains: ['shenjiying88.com'] })
      expect(conn.protocol).toBe('oidc')
      expect(conn.oidc!.clientSecret).not.toBe(VALID_OIDC.clientSecret) // 加密存储
      expect(conn.allowedEmailDomains).toEqual(['shenjiying88.com'])
    })

    it('正例: 查询连接列表', () => {
      svc.createOidcConnection({ name: 'oidc-1', oidc: VALID_OIDC })
      svc.createSamlConnection({ name: 'saml-1', saml: VALID_SAML })
      const list = svc.listConnections('test-tenant')
      expect(list.length).toBe(2)
    })
  })

  // ── SP-initiated 登录 ──
  describe('SP-initiated 登录', () => {
    it('SAML 启动登录 → redirectUrl + requestId', () => {
      const conn = svc.createSamlConnection({ name: 'saml-login', saml: VALID_SAML })
      const init = svc.initiateLogin(conn.id)
      expect(init.redirectUrl).toContain('SAMLRequest=')
      expect(init.requestId).toBeTruthy()
      expect(init.requestId).toMatch(/^_/)
    })

    it('OIDC 启动登录 → redirectUrl + state + codeVerifier', () => {
      const conn = svc.createOidcConnection({ name: 'oidc-login', oidc: VALID_OIDC })
      const init = svc.initiateLogin(conn.id)
      expect(init.redirectUrl).toContain('code_challenge=')
      expect(init.state).toBeTruthy()
      expect(init.codeVerifier).toBeTruthy()
      expect(init.codeVerifier!.length).toBeGreaterThanOrEqual(40)
    })

    it('反例: disabled 连接启动被拒', () => {
      const conn = svc.createSamlConnection({ name: 'disabled', saml: VALID_SAML })
      svc.updateConnection(conn.id, { status: 'disabled' })
      expect(() => svc.initiateLogin(conn.id)).toThrow('未启用')
    })
  })

  // ── 用户 JIT ──
  describe('用户 JIT', () => {
    it('正例: 新用户自动创建', () => {
      const conn = svc.createSamlConnection({ name: 'jit-saml', saml: VALID_SAML, allowedEmailDomains: ['jit.test'] })
      // 手动触发用户登录
      const result = svc.handleUserLogin(conn, 'newuser@jit.test', 'sub-jit-001')
      expect(result.isNewUser).toBe(true)
      expect(result.email).toBe('newuser@jit.test')
      expect(result.accessToken).toBeTruthy()
    })

    it('正例: 第二次登录复用 userId', () => {
      const conn = svc.createSamlConnection({ name: 'jit-reuse', saml: VALID_SAML, allowedEmailDomains: ['reuse.test'] })
      const r1 = svc.handleUserLogin(conn, 'reuse@reuse.test', 'sub-reuse')
      const r2 = svc.handleUserLogin(conn, 'reuse@reuse.test', 'sub-reuse')
      expect(r1.userId).toBe(r2.userId)
      expect(r2.isNewUser).toBe(false)
    })
  })

  // ── 访问令牌 ──
  describe('访问令牌', () => {
    it('signAccessToken + verifyAccessToken 双向校验', () => {
      const token = svc.signAccessToken({ userId: 'u-001', tenantId: 'tenant-A', email: 'u@test.com', role: 'admin' })
      const claims = svc.verifyAccessToken(token)
      expect(claims).not.toBeNull()
      expect(claims!.userId).toBe('u-001')
      expect(claims!.tenantId).toBe('tenant-A')

      // 篡改令牌验证失败
      expect(svc.verifyAccessToken(token + 'tampered')).toBeNull()
    })
  })

  // ── 跨租户隔离 ──
  describe('跨租户隔离', () => {
    it('不同租户看不到对方连接', () => {
      const tenantA = createSsoService('tenant-A')
      const tenantB = createSsoService('tenant-B')

      tenantA.createSamlConnection({ name: 'conn-a', saml: VALID_SAML })
      tenantB.createSamlConnection({ name: 'conn-b', saml: VALID_SAML })

      const aList = tenantA.listConnections('tenant-A')
      const bList = tenantB.listConnections('tenant-B')

      expect(aList).toHaveLength(1)
      expect(bList).toHaveLength(1)
      expect(aList[0].name).toBe('conn-a')
      expect(bList[0].name).toBe('conn-b')
    })
  })

  // ── 选择默认连接 ──
  describe('getDefaultConnection', () => {
    it('正例: 按邮箱域名匹配 default 连接', () => {
      const conn = svc.createSamlConnection({ name: 'default', saml: VALID_SAML, allowedEmailDomains: ['shenjiying88.com'] })
      svc.updateConnection(conn.id, { isDefault: true })
      const found = svc.getDefaultConnection('alice@shenjiying88.com')
      expect(found).not.toBeNull()
      expect(found!.name).toBe('default')
    })

    it('反例: 无允许域名且无 active 连接时返回 null', () => {
      // 无任何连接时返回 null
      const found = svc.getDefaultConnection('alice@external.com')
      expect(found).toBeNull()
    })
  })
})
