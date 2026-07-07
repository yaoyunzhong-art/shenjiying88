import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase 96 SSO Service Tests (V10 Sprint 2 Day 23)
 *
 * 22 tests 覆盖:
 * - SAML 配置校验 (3)
 * - OIDC 配置校验 (3)
 * - SAML/OIDC URL 构造 (3)
 * - 工具函数 (4)
 * - SAML 连接 CRUD (2)
 * - OIDC 连接 CRUD (2)
 * - SP-initiated 登录 (2)
 * - 用户 JIT 创建 (2)
 * - 访问令牌 (1)
 */

import assert from 'node:assert/strict'
import { SsoService } from './sso.service'
import {
  validateSamlConfig,
  validateOidcConfig,
  generateConnectionId,
  generateSamlRequestId,
  generateOidcState,
  generatePkceVerifier,
  deriveCodeChallenge,
  extractEmailDomain,
  buildSamlAuthnRequest,
  buildOidcAuthUrl,
  parseSamlAssertion,
} from './sso.entity'
import { runWithTenant } from '../../common/context/tenant-context'

const TENANT_A = {
  tenantId: 'tenant-A',
  storeId: 'store-001',
  userId: 'admin-A',
  role: 'tenant_admin' as const,
}
const TENANT_B = {
  tenantId: 'tenant-B',
  storeId: 'store-002',
  userId: 'admin-B',
  role: 'tenant_admin' as const,
}

const SHARED_SSO = new SsoService()

const VALID_SAML = {
  entityId: 'https://idp.example.com/metadata',
  ssoUrl: 'https://idp.example.com/sso',
  sloUrl: 'https://idp.example.com/slo',
  idpCertificate: '-----BEGIN CERTIFICATE-----\nMIITEST\n-----END CERTIFICATE-----',
  spEntityId: 'https://shenjiying88.com/saml/metadata',
  acsUrl: 'https://shenjiying88.com/saml/acs',
  attributeMapping: { email: 'email', name: 'displayName', role: 'role' },
  signedAssertions: true,
}

const VALID_OIDC = {
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

describe('Phase 96 SSO (V10 Sprint 2 Day 23)', () => {
  // ============ 1. SAML 配置校验 (3) ============
  describe('1. SAML 配置校验', () => {
    it('合法 SAML 配置通过', () => {
      assert.equal(validateSamlConfig(VALID_SAML).valid, true)
    })

    it('缺失必填字段被拒', () => {
      const r1 = validateSamlConfig({ ...VALID_SAML, entityId: '' })
      assert.equal(r1.valid, false)
      assert.match(r1.error!, /entityId/)
    })

    it('非 URL 被拒 + 非 PEM 证书被拒', () => {
      const r1 = validateSamlConfig({ ...VALID_SAML, ssoUrl: 'not-a-url' })
      assert.equal(r1.valid, false)
      const r2 = validateSamlConfig({ ...VALID_SAML, idpCertificate: 'plain text' })
      assert.equal(r2.valid, false)
    })
  })

  // ============ 2. OIDC 配置校验 (3) ============
  describe('2. OIDC 配置校验', () => {
    it('合法 OIDC 配置通过', () => {
      assert.equal(validateOidcConfig(VALID_OIDC).valid, true)
    })

    it('缺失 clientSecret 被拒', () => {
      const r = validateOidcConfig({ ...VALID_OIDC, clientSecret: '' })
      assert.equal(r.valid, false)
    })

    it('非合法 redirectUri 被拒', () => {
      const r = validateOidcConfig({ ...VALID_OIDC, redirectUri: 'not-url' })
      assert.equal(r.valid, false)
    })
  })

  // ============ 3. URL 构造 (3) ============
  describe('3. URL 构造', () => {
    it('buildSamlAuthnRequest 包含 Issuer + ACS', () => {
      const xml = buildSamlAuthnRequest({
        spEntityId: VALID_SAML.spEntityId,
        acsUrl: VALID_SAML.acsUrl,
        id: '_req-123',
      })
      assert.ok(xml.includes('AuthnRequest'))
      assert.ok(xml.includes(VALID_SAML.spEntityId))
      assert.ok(xml.includes(VALID_SAML.acsUrl))
    })

    it('buildOidcAuthUrl 包含 PKCE + state', () => {
      const url = buildOidcAuthUrl({
        authorizationEndpoint: VALID_OIDC.authorizationEndpoint,
        clientId: VALID_OIDC.clientId,
        redirectUri: VALID_OIDC.redirectUri,
        scope: VALID_OIDC.scope,
        state: 'state-xyz',
        codeChallenge: 'challenge-abc',
      })
      const parsed = new URL(url)
      assert.equal(parsed.searchParams.get('client_id'), VALID_OIDC.clientId)
      assert.equal(parsed.searchParams.get('state'), 'state-xyz')
      assert.equal(parsed.searchParams.get('code_challenge'), 'challenge-abc')
      assert.equal(parsed.searchParams.get('code_challenge_method'), 'S256')
    })

    it('parseSamlAssertion 提取 NameID + attributes', () => {
      const xml = `<samlp:Response><saml:Assertion><saml:Subject><saml:NameID>user-123</saml:NameID></saml:Subject><saml:AttributeStatement><saml:Attribute Name="email"><saml:AttributeValue>a@b.com</saml:AttributeValue></saml:Attribute><saml:Attribute Name="displayName"><saml:AttributeValue>Alice</saml:AttributeValue></saml:Attribute></saml:AttributeStatement></saml:Assertion></samlp:Response>`
      const parsed = parseSamlAssertion(xml)
      assert.equal(parsed.nameId, 'user-123')
      assert.equal(parsed.email, 'a@b.com')
      assert.equal(parsed.attributes['displayName'], 'Alice')
    })
  })

  // ============ 4. 工具函数 (4) ============
  describe('4. 工具函数', () => {
    it('generateConnectionId 格式正确', () => {
      const id = generateConnectionId()
      assert.match(id, /^sso-/)
    })

    it('extractEmailDomain 提取正确', () => {
      assert.equal(extractEmailDomain('alice@shop.shenjiying88.com'), 'shop.shenjiying88.com')
      assert.equal(extractEmailDomain('invalid'), '')
    })

    it('PKCE verifier + challenge 长度正确', () => {
      const v = generatePkceVerifier()
      assert.ok(v.length >= 40, `verifier 长度 ${v.length} 应 >= 40`)
      const c = deriveCodeChallenge(v)
      assert.ok(c.length > 0)
    })

    it('generateOidcState 是 base64url', () => {
      const s = generateOidcState()
      assert.ok(s.length >= 16)
      assert.match(s, /^[A-Za-z0-9_-]+$/)
    })
  })

  // ============ 5. SAML CRUD (2) ============
  describe('5. SAML 连接 CRUD', () => {
    it('创建 SAML 连接 → active + 默认角色', async () => {
      const conn = await runWithTenant(TENANT_A, async () =>
        SHARED_SSO.createSamlConnection({
          name: 'okta-saml',
          saml: VALID_SAML,
          defaultRole: 'store_admin',
        }),
      )
      assert.equal(conn.protocol, 'saml')
      assert.equal(conn.status, 'active')
      assert.equal(conn.defaultRole, 'store_admin')
    })

    it('重复连接名被拒', async () => {
      await runWithTenant(TENANT_A, async () =>
        SHARED_SSO.createSamlConnection({ name: 'dup-name', saml: VALID_SAML }),
      )
      await assert.rejects(
        () =>
          runWithTenant(TENANT_A, async () =>
            SHARED_SSO.createSamlConnection({ name: 'dup-name', saml: VALID_SAML }),
          ),
        /已存在/,
      )
    })
  })

  // ============ 6. OIDC CRUD (2) ============
  describe('6. OIDC 连接 CRUD', () => {
    it('创建 OIDC 连接 + clientSecret 加密存储', async () => {
      const conn = await runWithTenant(TENANT_A, async () =>
        SHARED_SSO.createOidcConnection({
          name: 'azure-oidc',
          oidc: VALID_OIDC,
          allowedEmailDomains: ['shenjiying88.com'],
        }),
      )
      assert.equal(conn.protocol, 'oidc')
      assert.ok(conn.oidc!.clientSecret !== VALID_OIDC.clientSecret, '应加密存储')
      assert.deepEqual(conn.allowedEmailDomains, ['shenjiying88.com'])
    })

    it('disable 连接 → 启动登录被拒', async () => {
      const conn = await runWithTenant(TENANT_A, async () =>
        SHARED_SSO.createOidcConnection({ name: 'disabled-oidc', oidc: VALID_OIDC }),
      )
      await runWithTenant(TENANT_A, async () =>
        SHARED_SSO.updateConnection(conn.id, { status: 'disabled' }),
      )
      await assert.rejects(
        () => SHARED_SSO.initiateLogin(conn.id, {}),
        /未启用/,
      )
    })
  })

  // ============ 7. SP-initiated 登录 (2) ============
  describe('7. SP-initiated 登录', () => {
    it('SAML 启动登录 → redirectUrl + requestId', async () => {
      const conn = await runWithTenant(TENANT_A, async () =>
        SHARED_SSO.createSamlConnection({ name: 'saml-login-test', saml: VALID_SAML }),
      )
      const init = await SHARED_SSO.initiateLogin(conn.id, { redirectAfter: '/dashboard' })
      assert.ok(init.redirectUrl.includes('SAMLRequest='))
      assert.ok(init.requestId)
      assert.match(init.requestId, /^_/)
    })

    it('OIDC 启动登录 → redirectUrl + state + codeVerifier', async () => {
      const conn = await runWithTenant(TENANT_A, async () =>
        SHARED_SSO.createOidcConnection({ name: 'oidc-login-test', oidc: VALID_OIDC }),
      )
      const init = await SHARED_SSO.initiateLogin(conn.id, {})
      assert.ok(init.redirectUrl.includes('code_challenge='))
      assert.ok(init.state)
      assert.ok(init.codeVerifier)
      assert.ok(init.codeVerifier!.length >= 40)
    })
  })

  // ============ 8. 用户 JIT (2) ============
  describe('8. 用户 JIT', () => {
    it('OIDC 回调 → 新用户自动创建', async () => {
      const conn = await runWithTenant(TENANT_A, async () =>
        SHARED_SSO.createOidcConnection({
          name: 'jit-oidc',
          oidc: VALID_OIDC,
          allowedEmailDomains: ['jit-oidc.test'],
        }),
      )
      // 注入 mock OIDC HTTP
      SHARED_SSO.setOidcHttpClient({
        async exchangeCode() {
          return { access_token: 'mock-token', expires_in: 3600 }
        },
        async fetchUserinfo() {
          return { sub: 'sub-jit-001', email: 'newuser@jit-oidc.test', name: 'New User' }
        },
      })

      // 启动登录拿 state
      const init = await SHARED_SSO.initiateLogin(conn.id, {})
      const result = await SHARED_SSO.completeLogin({
        protocol: 'oidc',
        payload: 'auth-code-xyz',
        state: init.state!,
      })
      assert.equal(result.isNewUser, true)
      assert.equal(result.email, 'newuser@jit-oidc.test')
      assert.ok(result.accessToken)
      assert.equal(result.tenantId, 'tenant-A')
    })

    it('第二次同用户登录 → 复用 userId', async () => {
      // 复用上一个测试创建的用户
      const conn = await runWithTenant(TENANT_A, async () =>
        SHARED_SSO.createOidcConnection({
          name: 'jit-reuse',
          oidc: VALID_OIDC,
          allowedEmailDomains: ['reuse.test'],
        }),
      )
      SHARED_SSO.setOidcHttpClient({
        async exchangeCode() { return { access_token: 'tok', expires_in: 3600 } },
        async fetchUserinfo() { return { sub: 'sub-reuse', email: 'reuse@reuse.test', name: 'Reused' } },
      })
      const init1 = await SHARED_SSO.initiateLogin(conn.id, {})
      const r1 = await SHARED_SSO.completeLogin({ protocol: 'oidc', payload: 'c1', state: init1.state! })

      const init2 = await SHARED_SSO.initiateLogin(conn.id, {})
      const r2 = await SHARED_SSO.completeLogin({ protocol: 'oidc', payload: 'c2', state: init2.state! })

      assert.equal(r1.userId, r2.userId, '同邮箱应映射到同一 userId')
      assert.equal(r2.isNewUser, false, '第二次不应新建')
    })
  })

  // ============ 9. 跨租户隔离 (1) ============
  describe('9. 跨租户隔离', () => {
    it('tenant B 看不到 tenant A 的连接', async () => {
      const a = await runWithTenant(TENANT_A, async () =>
        SHARED_SSO.createSamlConnection({ name: 'isolated-saml', saml: VALID_SAML }),
      )
      const bList = await runWithTenant(TENANT_B, async () => SHARED_SSO.listConnections())
      const bIds = bList.map((c) => c.id)
      assert.ok(!bIds.includes(a.id))
    })
  })

  // ============ 10. 访问令牌 (1) ============
  describe('10. 访问令牌', () => {
    it('signAccessToken + verifyAccessToken 双向校验', async () => {
      const conn = await runWithTenant(TENANT_A, async () =>
        SHARED_SSO.createOidcConnection({ name: 'token-test', oidc: VALID_OIDC, allowedEmailDomains: ['tok.test'] }),
      )
      SHARED_SSO.setOidcHttpClient({
        async exchangeCode() { return { access_token: 't', expires_in: 3600 } },
        async fetchUserinfo() { return { sub: 'sub-tok', email: 'u@tok.test', name: 'Tok' } },
      })
      const init = await SHARED_SSO.initiateLogin(conn.id, {})
      const result = await SHARED_SSO.completeLogin({ protocol: 'oidc', payload: 'c', state: init.state! })

      const claims = SHARED_SSO.verifyAccessToken(result.accessToken)
      assert.ok(claims)
      assert.equal(claims!.userId, result.userId)
      assert.equal(claims!.tenantId, 'tenant-A')

      // 篡改令牌应验证失败
      const bad = SHARED_SSO.verifyAccessToken(result.accessToken + 'tampered')
      assert.equal(bad, null)
    })
  })
})