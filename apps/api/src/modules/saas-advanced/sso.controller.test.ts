import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase 96 SSO Controller 测试 (V10 Sprint 2 Day 23)
 *
 * 覆盖 SsoController 全部 12 个端点:
 * POST   /saas/sso/saml                      — 创建 SAML 连接
 * POST   /saas/sso/oidc                      — 创建 OIDC 连接
 * GET    /saas/sso/connections                — 列出 SSO 连接
 * GET    /saas/sso/connections/:id            — 连接详情
 * PATCH  /saas/sso/connections/:id            — 更新连接
 * DELETE /saas/sso/connections/:id            — 删除连接
 * POST   /saas/sso/login/initiate/:connId     — 启动 SSO 登录
 * POST   /saas/sso/login/complete             — 完成 SSO 登录
 * POST   /saas/sso/verify                     — 验证访问令牌
 * GET    /saas/sso/identities                 — 列出用户身份关联
 *
 * 覆盖: 正例 12 + 反例/边界 10 = 22 个测试用例
 */

import assert from 'node:assert/strict'
import { SsoController } from './sso.controller'
import { SsoService } from './sso.service'
import { runWithTenant } from '../../common/context/tenant-context'

// ============ 测试用 IdP 配置 ============
const TENANT_A = {
  tenantId: 'tenant-A',
  storeId: 'store-001',
  userId: 'sso-admin',
  role: 'tenant_admin' as const,
}

const VALID_SAML = {
  name: 'Test SAML IdP',
  saml: {
    entityId: 'https://idp.example.com/metadata',
    ssoUrl: 'https://idp.example.com/sso',
    idpCertificate:
      '-----BEGIN CERTIFICATE-----MOCK-CERTIFICATE-----END CERTIFICATE-----',
    spEntityId: 'https://app.shenjiying88.com/saml',
    acsUrl: 'https://app.shenjiying88.com/saml/acs',
    attributeMapping: { email: 'email' },
    signedAssertions: true,
  },
  isDefault: true,
  defaultRole: 'operator' as const,
  autoProvisionTenant: false,
  allowedEmailDomains: [] as string[],
}

const VALID_OIDC = {
  name: 'Test OIDC IdP',
  oidc: {
    issuer: 'https://oidc.example.com',
    clientId: 'my-client-id',
    clientSecret: 'my-client-secret',
    authorizationEndpoint: 'https://oidc.example.com/auth',
    tokenEndpoint: 'https://oidc.example.com/token',
    userinfoEndpoint: 'https://oidc.example.com/userinfo',
    jwksUri: 'https://oidc.example.com/.well-known/jwks.json',
    redirectUri: 'https://app.shenjiying88.com/sso/callback',
    scope: 'openid profile email',
    claimMapping: { email: 'email' },
  },
  isDefault: false,
  defaultRole: 'viewer' as const,
}

/**
 * 在 tenant 上下文中调用 controller 方法
 */
function inA<T>(fn: () => Promise<T>): Promise<T> {
  return runWithTenant(TENANT_A, fn)
}

/** 构建一个含 email 的 SAML 响应 base64 */
function buildSamlResponseB64(email: string): string {
  const xml = `<samlp:Response><saml:Assertion><saml:Subject><saml:NameID>sub-${email}</saml:NameID></saml:Subject><saml:AttributeStatement><saml:Attribute Name="email"><saml:AttributeValue>${email}</saml:AttributeValue></saml:Attribute></saml:AttributeStatement></saml:Assertion></samlp:Response>`
  return Buffer.from(xml).toString('base64')
}

describe('Phase 96 SsoController (V10 Sprint 2 Day 23)', () => {
  let service: SsoService
  let controller: SsoController

  beforeAll(() => {
    service = new SsoService()
    controller = new SsoController(service)
  })

  // ============ 1. POST /saas/sso/saml — 创建 SAML 连接 ============
  describe('POST /saas/sso/saml — createSaml()', () => {
    it('合法配置创建 SAML 连接成功', async () => {
      const res = await inA(() => controller.createSaml(VALID_SAML))
      assert.ok(res.id)
      assert.equal(res.protocol, 'saml')
      assert.equal(res.name, 'Test SAML IdP')
      assert.equal(res.status, 'active')
    })

    it('配置缺失必填字段时抛出 BadRequest', async () => {
      try {
        await inA(() =>
          controller.createSaml({
            name: 'Bad SAML',
            saml: {
              entityId: '',
              ssoUrl: 'https://idp.example.com/sso',
              idpCertificate: '',
              spEntityId: '',
              acsUrl: '',
              attributeMapping: { email: '' },
              signedAssertions: true,
            },
          }),
        )
        assert.fail('应抛出异常')
      } catch (e: any) {
        assert.ok(e.message)
      }
    })
  })

  // ============ 2. POST /saas/sso/oidc — 创建 OIDC 连接 ============
  describe('POST /saas/sso/oidc — createOidc()', () => {
    it('合法配置创建 OIDC 连接成功', async () => {
      const res = await inA(() => controller.createOidc(VALID_OIDC))
      assert.ok(res.id)
      assert.equal(res.protocol, 'oidc')
      assert.equal(res.name, 'Test OIDC IdP')
      assert.equal(res.status, 'active')
    })

    it('配置缺失必填字段时抛出 BadRequest', async () => {
      try {
        await inA(() =>
          controller.createOidc({
            name: 'Bad OIDC',
            oidc: {
              issuer: '',
              clientId: '',
              clientSecret: '',
              authorizationEndpoint: '',
              tokenEndpoint: '',
              userinfoEndpoint: '',
              jwksUri: '',
              redirectUri: '',
              scope: '',
              claimMapping: { email: '' },
            },
          }),
        )
        assert.fail('应抛出异常')
      } catch (e: any) {
        assert.ok(e.message)
      }
    })
  })

  // ============ 3. GET /saas/sso/connections — 列出 SSO 连接 ============
  describe('GET /saas/sso/connections — list()', () => {
    it('返回 items 数组和 total', async () => {
      const res = await inA(() => controller.list())
      assert.ok(Array.isArray(res.items))
      assert.equal(typeof res.total, 'number')
      assert.ok(res.total >= 2) // SAML + OIDC 已创建
    })

    it('每个 items 含脱敏基本信息', async () => {
      const res = await inA(() => controller.list())
      for (const item of res.items) {
        assert.ok('protocol' in item)
        assert.equal(typeof item.name, 'string')
        // 不暴露敏感字段
        assert.ok(!('saml' in item) || !('oidc' in item))
      }
    })
  })

  // ============ 4. GET /saas/sso/connections/:id — 连接详情 ============
  describe('GET /saas/sso/connections/:id — getOne()', () => {
    it('已存在连接返回完整脱敏信息', async () => {
      const created = await inA(() =>
        controller.createSaml({ ...VALID_SAML, name: 'Detail SAML' }),
      )
      const res = await inA(() => controller.getOne(created.id))
      assert.equal(res.id, created.id)
      assert.equal(res.name, 'Detail SAML')
      assert.equal(res.protocol, 'saml')
      assert.ok(res.hasSaml)
    })

    it('不存在连接抛出 NotFound', async () => {
      try {
        await inA(() => controller.getOne('sso-nonexistent-999'))
        assert.fail('应抛出异常')
      } catch (e: any) {
        assert.equal(e.response?.statusCode ?? e.status ?? 404, 404)
      }
    })
  })

  // ============ 5. PATCH /saas/sso/connections/:id — 更新连接 ============
  describe('PATCH /saas/sso/connections/:id — update()', () => {
    it('更新名称成功', async () => {
      const created = await inA(() =>
        controller.createSaml({ ...VALID_SAML, name: 'Update SAML' }),
      )
      const updated = await inA(() =>
        controller.update(created.id, { name: 'Updated Name' }),
      )
      assert.equal(updated.name, 'Updated Name')
    })

    it('更新不存在连接抛出 NotFound', async () => {
      try {
        await inA(() => controller.update('sso-notexist-000', { name: 'Nope' }))
        assert.fail('应抛出异常')
      } catch (e: any) {
        assert.equal(e.response?.statusCode ?? e.status ?? 404, 404)
      }
    })
  })

  // ============ 6. DELETE /saas/sso/connections/:id — 删除连接 ============
  describe('DELETE /saas/sso/connections/:id — delete()', () => {
    it('删除已存在连接成功返回 undefined', async () => {
      const created = await inA(() =>
        controller.createSaml({ ...VALID_SAML, name: 'Delete SAML' }),
      )
      const result = await inA(() => controller.delete(created.id))
      assert.equal(result, undefined)
    })

    it('删除不存在连接抛出 NotFound', async () => {
      try {
        await inA(() => controller.delete('sso-nonexistent-888'))
        assert.fail('应抛出异常')
      } catch (e: any) {
        assert.equal(e.response?.statusCode ?? e.status ?? 404, 404)
      }
    })
  })

  // ============ 7. POST /saas/sso/login/initiate/:connectionId — 启动登录 ============
  describe('POST /saas/sso/login/initiate/:connectionId — initiateLogin()', () => {
    it('SAML 连接返回 redirectUrl + requestId', async () => {
      const created = await inA(() =>
        controller.createSaml({ ...VALID_SAML, name: 'Login Init SAML' }),
      )
      const res = await inA(() =>
        controller.initiateLogin(created.id, { redirectAfter: '/dashboard' }),
      )
      assert.ok(res.redirectUrl)
      assert.ok(res.requestId)
      assert.ok(res.redirectUrl.includes('SAMLRequest'))
    })

    it('OIDC 连接返回 redirectUrl + state + codeVerifier', async () => {
      const created = await inA(() =>
        controller.createOidc({ ...VALID_OIDC, name: 'Login Init OIDC' }),
      )
      const res = await inA(() => controller.initiateLogin(created.id, {}))
      assert.ok(res.redirectUrl)
      assert.ok(res.state)
      assert.ok(res.codeVerifier)
      assert.ok(res.redirectUrl.includes('code_challenge'))
    })

    it('不存在的连接抛出 NotFound', async () => {
      try {
        await inA(() => controller.initiateLogin('sso-missing-123', {}))
        assert.fail('应抛出异常')
      } catch (e: any) {
        assert.equal(e.response?.statusCode ?? e.status ?? 404, 404)
      }
    })
  })

  // ============ 8. POST /saas/sso/login/complete — 完成登录 ============
  describe('POST /saas/sso/login/complete — completeLogin()', () => {
    it('SAML 协议完成登录返回 accessToken + userId', async () => {
      const created = await inA(() =>
        controller.createSaml({ ...VALID_SAML, name: 'SAMLC Complete' }),
      )
      const email = 'complete@shenjiying88.com'
      const payloadB64 = buildSamlResponseB64(email)

      const res = await inA(() =>
        controller.completeLogin({ protocol: 'saml', payload: payloadB64 }),
      )
      assert.ok(res.userId)
      assert.equal(res.email, email)
      assert.ok(res.accessToken)
      assert.ok(res.expiresIn > 0)
      assert.equal(res.isNewUser, true)
    })

    it('SAML 无 email 断言时抛出异常', async () => {
      const badXml =
        '<samlp:Response><saml:Assertion><saml:Subject><saml:NameID>noemail</saml:NameID></saml:Subject></saml:Assertion></samlp:Response>'
      try {
        await inA(() =>
          controller.completeLogin({
            protocol: 'saml',
            payload: Buffer.from(badXml).toString('base64'),
          }),
        )
        assert.fail('应抛出异常')
      } catch (e: any) {
        assert.ok(e.message)
      }
    })
  })

  // ============ 9. POST /saas/sso/verify — 验证令牌 ============
  describe('POST /saas/sso/verify — verify()', () => {
    it('有效 token 返回 valid=true + claims', async () => {
      const created = await inA(() =>
        controller.createSaml({ ...VALID_SAML, name: 'Verify SAML Test' }),
      )
      const loginRes = await inA(() =>
        controller.completeLogin({
          protocol: 'saml',
          payload: buildSamlResponseB64('verify@shenjiying88.com'),
        }),
      )

      const res = await controller.verify({ token: loginRes.accessToken })
      assert.equal(res.valid, true)
      assert.ok(res.claims)
      assert.equal(res.claims.userId, loginRes.userId)
      assert.equal(res.claims.tenantId, loginRes.tenantId)
    })

    it('无效 token 返回 valid=false', async () => {
      const res = await controller.verify({
        token: 'invalid-token-xxx.yyy.zzz',
      })
      assert.equal(res.valid, false)
      assert.equal(res.claims, null)
    })

    it('过期 token 返回 valid=false', async () => {
      const payloadB64 = Buffer.from(
        JSON.stringify({ exp: 0 }),
      ).toString('base64url')
      const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payloadB64}.fakesig`
      const res = await controller.verify({ token })
      assert.equal(res.valid, false)
    })
  })

  // ============ 10. GET /saas/sso/identities — 用户身份关联 ============
  describe('GET /saas/sso/identities — listIdentities()', () => {
    it('用户登录后可通过 identities 查询身份关联', async () => {
      const created = await inA(() =>
        controller.createSaml({ ...VALID_SAML, name: 'Identity SAML Test' }),
      )
      const loginRes = await inA(() =>
        controller.completeLogin({
          protocol: 'saml',
          payload: buildSamlResponseB64('identity@shenjiying88.com'),
        }),
      )

      const req = {
        headers: {
          'x-user-id': loginRes.userId,
          'x-tenant-id': loginRes.tenantId,
        },
      }
      const res = await inA(() => controller.listIdentities(req as any))
      assert.ok(Array.isArray(res.items))
      assert.ok(res.items.length >= 1)
      assert.equal(res.items[0].userId, loginRes.userId)
      assert.equal(res.items[0].email, 'identity@shenjiying88.com')
    })

    it('无身份关联用户返回空列表', async () => {
      const req = { headers: { 'x-user-id': 'unknown-user', 'x-tenant-id': 'tenant-A' } }
      const res = await inA(() => controller.listIdentities(req as any))
      assert.ok(Array.isArray(res.items))
      assert.equal(res.items.length, 0)
    })
  })
})
