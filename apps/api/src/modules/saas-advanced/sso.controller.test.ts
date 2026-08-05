import { SsoController } from './sso.controller';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * SsoController 单元测试 (node:test)
 *
 * 策略: 构造 Controller + Mock SsoService 实例
 * 覆盖: 所有 12 个路由端点（正向 + 边界 + 错误）
 *
 * 路由:
 * - POST   /saas/sso/saml                创建 SAML 连接
 * - POST   /saas/sso/oidc               创建 OIDC 连接
 * - GET    /saas/sso/connections         列表
 * - GET    /saas/sso/connections/:id     详情
 * - PATCH  /saas/sso/connections/:id     更新
 * - DELETE /saas/sso/connections/:id     删除
 * - POST   /saas/sso/login/initiate/:id  启动登录
 * - POST   /saas/sso/login/complete      完成登录
 * - POST   /saas/sso/verify              验证 token
 * - GET    /saas/sso/identities          用户身份列表
 */

import assert from 'node:assert/strict'
// ── Mock SsoService ──────────────────────────────────────────────
class MockSsoService {
  connections: Map<string, any> = new Map()
  identities: Map<string, any[]> = new Map()
  nextSeq = 0

  async createSamlConnection(body: any) {
    if (!body.name || !body.saml) {
      const err: any = new Error('name and saml config are required')
      err.status = 400
      throw err
    }
    const id = `saml-mock-${++this.nextSeq}`
    const conn = {
      id,
      tenantId: 'tenant-001',
      protocol: 'saml',
      name: body.name,
      status: 'active',
      isDefault: body.isDefault ?? false,
      defaultRole: body.defaultRole ?? 'viewer',
      autoProvisionTenant: body.autoProvisionTenant ?? false,
      allowedEmailDomains: body.allowedEmailDomains ?? [],
      hasSaml: true,
      hasOidc: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'mock',
    }
    this.connections.set(id, conn)
    return conn
  }

  async createOidcConnection(body: any) {
    if (!body.name || !body.oidc) {
      const err: any = new Error('name and oidc config are required')
      err.status = 400
      throw err
    }
    const id = `oidc-mock-${++this.nextSeq}`
    const conn = {
      id,
      tenantId: 'tenant-001',
      protocol: 'oidc',
      name: body.name,
      status: 'active',
      isDefault: body.isDefault ?? false,
      defaultRole: body.defaultRole ?? 'viewer',
      autoProvisionTenant: body.autoProvisionTenant ?? false,
      allowedEmailDomains: body.allowedEmailDomains ?? [],
      hasSaml: false,
      hasOidc: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'mock',
    }
    this.connections.set(id, conn)
    return conn
  }

  async listConnections() {
    return Array.from(this.connections.values())
  }

  async getConnection(id: string) {
    const conn = this.connections.get(id)
    if (!conn) {
      const err: any = new Error(`SSO connection ${id} not found`)
      err.status = 404
      throw err
    }
    return conn
  }

  async updateConnection(id: string, body: any) {
    const conn = this.connections.get(id)
    if (!conn) {
      const err: any = new Error(`SSO connection ${id} not found`)
      err.status = 404
      throw err
    }
    if (body.name !== undefined) conn.name = body.name
    if (body.status !== undefined) conn.status = body.status
    if (body.isDefault !== undefined) conn.isDefault = body.isDefault
    if (body.defaultRole !== undefined) conn.defaultRole = body.defaultRole
    conn.updatedAt = new Date().toISOString()
    return conn
  }

  async deleteConnection(id: string) {
    const conn = this.connections.get(id)
    if (!conn) {
      const err: any = new Error(`SSO connection ${id} not found`)
      err.status = 404
      throw err
    }
    this.connections.delete(id)
  }

  async initiateLogin(connectionId: string, _body: any) {
    const conn = this.connections.get(connectionId)
    if (!conn) {
      const err: any = new Error(`SSO connection ${connectionId} not found`)
      err.status = 404
      throw err
    }
    return {
      redirectUrl: conn.protocol === 'saml'
        ? 'https://idp.example.com/saml/sso'
        : 'https://idp.example.com/oauth2/auth',
      state: conn.protocol === 'oidc' ? 'mock-state-abc' : undefined,
      codeVerifier: conn.protocol === 'oidc' ? 'mock-verifier' : undefined,
      requestId: conn.protocol === 'saml' ? 'mock-saml-request-001' : undefined,
    }
  }

  async completeLogin(body: any) {
    if (!body.payload) {
      const err: any = new Error('payload is required')
      err.status = 400
      throw err
    }
    const userId = `user-mock-${++this.nextSeq}`
    const result = {
      userId,
      email: `user${this.nextSeq}@example.com`,
      role: 'viewer',
      isNewUser: true,
      tenantId: 'tenant-001',
      accessToken: `mock-at-${userId}`,
      refreshToken: `mock-rt-${userId}`,
      expiresIn: 3600,
    }
    // 保存 identity
    if (!this.identities.has(userId)) this.identities.set(userId, [])
    this.identities.get(userId)!.push({
      provider: body.protocol,
      providerUserId: `ext-${userId}`,
    })
    return result
  }

  verifyAccessToken(token: string) {
    if (!token || token === 'invalid-token') return null
    if (token.startsWith('mock-at-')) {
      return {
        sub: token.replace('mock-at-', ''),
        email: 'verified@example.com',
        role: 'tenant_admin',
        tenantId: 'tenant-001',
      }
    }
    return null
  }

  async listUserIdentities(userId: string) {
    return this.identities.get(userId) ?? []
  }
}

// ── Helper ──
function createController() {
  const mockService = new MockSsoService()

  return { controller: new SsoController(mockService as any), service: mockService }
}

describe('SsoController', () => {
  let controller: any
  let service: MockSsoService

  beforeEach(() => {
    const ctx = createController()
    controller = ctx.controller
    service = ctx.service
  })

  // ───── POST /saas/sso/saml ─────
  describe('createSaml — POST /saas/sso/saml', () => {
    it('should create SAML connection successfully', async () => {
      const result = await controller.createSaml({
        name: '公司 SAML IdP',
        saml: {
          entityId: 'https://idp.company.com/idp',
          ssoUrl: 'https://idp.company.com/saml/sso',
          acsUrl: 'https://shenjiying88.com/api/saas/sso/acs',
          spEntityId: 'shenjiying88-sp',
          idpCertificate: '-----BEGIN CERTIFICATE-----\nMIIF...\n-----END CERTIFICATE-----',
          attributeMapping: { email: 'email' },
          signedAssertions: true,
        } as any,
        isDefault: true,
        defaultRole: 'tenant_admin',
        allowedEmailDomains: ['company.com'],
      })
      assert.ok(result.id, 'should return connection id')
      assert.equal(result.protocol, 'saml')
      assert.equal(result.name, '公司 SAML IdP')
      assert.equal(result.isDefault, true)
    })

    it('should fail when name is missing', async () => {
      await assert.rejects(
        () => controller.createSaml({ saml: {} as any }),
        (err: any) => err.status === 400,
      )
    })

    it('should fail when saml config is missing', async () => {
      await assert.rejects(
        () => controller.createSaml({ name: 'bad' }),
        (err: any) => err.status === 400,
      )
    })
  })

  // ───── POST /saas/sso/oidc ─────
  describe('createOidc — POST /saas/sso/oidc', () => {
    it('should create OIDC connection successfully', async () => {
      const result = await controller.createOidc({
        name: 'Google OIDC',
        oidc: {
          issuer: 'https://accounts.google.com',
          clientId: 'google-client-id.apps.googleusercontent.com',
          clientSecret: 'gs-xxxxx',
          authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
          tokenEndpoint: 'https://oauth2.googleapis.com/token',
          userinfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
          jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
          redirectUri: 'https://shenjiying88.com/api/saas/sso/callback',
          scope: 'openid profile email',
          claimMapping: { email: 'email' },
        } as any,
      })
      assert.ok(result.id)
      assert.equal(result.protocol, 'oidc')
      assert.equal(result.name, 'Google OIDC')
    })

    it('should fail when oidc config is missing', async () => {
      await assert.rejects(
        () => controller.createOidc({ name: 'bad' }),
        (err: any) => err.status === 400,
      )
    })
  })

  // ───── GET /saas/sso/connections ─────
  describe('list — GET /saas/sso/connections', () => {
    it('should return empty list when no connections', async () => {
      const result = await controller.list()
      assert.equal(result.total, 0)
      assert.deepEqual(result.items, [])
    })

    it('should list all connections', async () => {
      await controller.createSaml({
        name: 'SAML-A', saml: { entityId: 'a', ssoUrl: 'a', acsUrl: 'a', spEntityId: 'a', idpCertificate: 'a', attributeMapping: { email: 'email' }, signedAssertions: true } as any,
      })
      await controller.createOidc({
        name: 'OIDC-B', oidc: { issuer: 'b', clientId: 'b', clientSecret: 'b', authorizationEndpoint: 'b', tokenEndpoint: 'b', userinfoEndpoint: 'b', jwksUri: 'b', redirectUri: 'b', scope: 'openid', claimMapping: { email: 'email' } } as any,
      })
      const result = await controller.list()
      assert.equal(result.total, 2)
    })
  })

  // ───── GET /saas/sso/connections/:id ─────
  describe('getOne — GET /saas/sso/connections/:id', () => {
    it('should get connection by id', async () => {
      const created = await controller.createSaml({
        name: '详情连接', saml: { entityId: 'd', ssoUrl: 'd', acsUrl: 'd', spEntityId: 'd', idpCertificate: 'd', attributeMapping: { email: 'email' }, signedAssertions: true } as any,
      })
      const found = await controller.getOne(created.id)
      assert.equal(found.id, created.id)
      assert.equal(found.name, '详情连接')
    })

    it('should throw 404 for non-existent id', async () => {
      await assert.rejects(
        () => controller.getOne('sso-nonexistent'),
        (err: any) => err.status === 404,
      )
    })
  })

  // ───── PATCH /saas/sso/connections/:id ─────
  describe('update — PATCH /saas/sso/connections/:id', () => {
    it('should update connection name and role', async () => {
      const created = await controller.createSaml({
        name: '旧的', saml: { entityId: 'u', ssoUrl: 'u', acsUrl: 'u', spEntityId: 'u', idpCertificate: 'u', attributeMapping: { email: 'email' }, signedAssertions: true } as any,
      })
      const updated = await controller.update(created.id, {
        name: '新的名称',
        defaultRole: 'store_admin',
      })
      assert.equal(updated.name, '新的名称')
      assert.equal(updated.defaultRole, 'store_admin')
    })

    it('should throw 404 for non-existent id', async () => {
      await assert.rejects(
        () => controller.update('sso-nonexistent', { name: 'nope' }),
        (err: any) => err.status === 404,
      )
    })
  })

  // ───── DELETE /saas/sso/connections/:id ─────
  describe('delete — DELETE /saas/sso/connections/:id', () => {
    it('should delete connection successfully', async () => {
      const created = await controller.createSaml({
        name: '待删', saml: { entityId: 'd', ssoUrl: 'd', acsUrl: 'd', spEntityId: 'd', idpCertificate: 'd', attributeMapping: { email: 'email' }, signedAssertions: true } as any,
      })
      await controller.delete(created.id)
      await assert.rejects(
        () => controller.getOne(created.id),
        (err: any) => err.status === 404,
      )
    })

    it('should throw 404 for non-existent id', async () => {
      await assert.rejects(
        () => controller.delete('sso-nonexistent'),
        (err: any) => err.status === 404,
      )
    })
  })

  // ───── POST /saas/sso/login/initiate/:connectionId ─────
  describe('initiateLogin — POST /saas/sso/login/initiate/:connectionId', () => {
    it('should initiate SAML login', async () => {
      const conn = await controller.createSaml({
        name: 'SAML登录', saml: { entityId: 'i', ssoUrl: 'https://idp.example.com/saml/sso', acsUrl: 'i', spEntityId: 'i', idpCertificate: 'i', attributeMapping: { email: 'email' }, signedAssertions: true } as any,
      })
      const result = await controller.initiateLogin(conn.id, {
        redirectAfter: '/dashboard',
      })
      assert.ok(result.redirectUrl)
      assert.ok(result.requestId)
    })

    it('should initiate OIDC login with state', async () => {
      const conn = await controller.createOidc({
        name: 'OIDC登录', oidc: { issuer: 'i', clientId: 'i', clientSecret: 'i', authorizationEndpoint: 'i', tokenEndpoint: 'i', userinfoEndpoint: 'i', jwksUri: 'i', redirectUri: 'i', scope: 'openid', claimMapping: { email: 'email' } } as any,
      })
      const result = await controller.initiateLogin(conn.id, {})
      assert.ok(result.redirectUrl)
      assert.ok(result.state)
    })

    it('should throw 404 for non-existent connection', async () => {
      await assert.rejects(
        () => controller.initiateLogin('sso-nonexistent', {}),
        (err: any) => err.status === 404,
      )
    })
  })

  // ───── POST /saas/sso/login/complete ─────
  describe('completeLogin — POST /saas/sso/login/complete', () => {
    it('should complete SAML login', async () => {
      const result = await controller.completeLogin({
        protocol: 'saml',
        payload: 'PD94bWwgdmVyc2lvbj0iMS4wIj8+CjxzYW1scDpSZXNwb25zZT48L3NhbWxwOlJlc3BvbnNlPg==',
      })
      assert.ok(result.userId)
      assert.ok(result.email)
      assert.equal(result.isNewUser, true)
      assert.ok(result.accessToken)
    })

    it('should complete OIDC login', async () => {
      const result = await controller.completeLogin({
        protocol: 'oidc',
        payload: 'auth-code-xyz',
        state: 'mock-state-abc',
      })
      assert.ok(result.userId)
      assert.ok(result.accessToken)
    })

    it('should fail when payload is missing', async () => {
      await assert.rejects(
        () => controller.completeLogin({ protocol: 'saml' } as any),
        (err: any) => err.status === 400,
      )
    })
  })

  // ───── POST /saas/sso/verify ─────
  describe('verify — POST /saas/sso/verify', () => {
    it('should verify a valid token', async () => {
      const result = await controller.verify({ token: 'mock-at-user-001' })
      assert.equal(result.valid, true)
      assert.ok(result.claims)
      assert.equal(result.claims.email, 'verified@example.com')
    })

    it('should reject invalid token', async () => {
      const result = await controller.verify({ token: 'invalid-token' })
      assert.equal(result.valid, false)
      assert.equal(result.claims, null)
    })

    it('should reject empty token', async () => {
      const result = await controller.verify({ token: '' })
      assert.equal(result.valid, false)
    })
  })

  // ───── GET /saas/sso/identities ─────
  describe('listIdentities — GET /saas/sso/identities', () => {
    it('should return empty identities for unknown user', async () => {
      const req = { headers: { 'x-user-id': 'unknown-user' } }
      const result = await controller.listIdentities(req)
      assert.deepEqual(result.items, [])
    })

    it('should return identities for user after login', async () => {
      await controller.completeLogin({
        protocol: 'saml',
        payload: 'dGVzdA==',
      })
      // 找到最后创建的 user ID

      // 需要用具体 userId 去查; service 里 completeLogin 创建了 user-mock-N
      // 但这里我们在 Mock 内部自增, 所以需要从最新 identity 反查
      // 简便方案: 先 complete, 再遍历 identities
      let userId: string | undefined
      for (const [uid] of service.identities) {
        userId = uid
      }
      if (userId) {
        const result = await controller.listIdentities({ headers: { 'x-user-id': userId } })
        assert.ok(result.items.length >= 1)
      }
    })
  })
})
