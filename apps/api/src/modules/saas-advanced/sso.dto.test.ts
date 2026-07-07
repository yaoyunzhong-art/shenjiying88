import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [saas-advanced] [A] sso dto 测试补全
 *
 * SSO DTO 类型定义测试
 */

import assert from 'node:assert/strict'
import {
  CreateSamlConnectionDto,
  CreateOidcConnectionDto,
  UpdateSsoConnectionDto,
  SsoLoginInitiateDto,
  SsoLoginCompleteDto,
  SsoConnectionResponse,
  SsoLoginInitResponse,
  SsoLoginCompleteResponse,
} from './sso.dto'

describe('saas-advanced sso dto - 类型定义', () => {
  // ============ CreateSamlConnectionDto ============
  it('CreateSamlConnectionDto 必填字段', () => {
    const dto: CreateSamlConnectionDto = {
      name: '企业 SAML',
      saml: {
        entityId: 'https://idp.example.com/entity',
        ssoUrl: 'https://idp.example.com/sso',
        idpCertificate: 'MIID...',
        spEntityId: 'https://sp.example.com',
        acsUrl: 'https://sp.example.com/acs',
        attributeMapping: { email: 'email' },
        signedAssertions: true,
      },
    }
    assert.equal(dto.name, '企业 SAML')
    assert.equal(dto.saml.entityId, 'https://idp.example.com/entity')
  })

  it('CreateSamlConnectionDto 含可选字段', () => {
    const dto: CreateSamlConnectionDto = {
      name: '完整 SAML',
      saml: {
        entityId: 'eid',
        ssoUrl: 'url',
        idpCertificate: 'cert',
        spEntityId: 'https://sp.example.com',
        acsUrl: 'https://sp.example.com/acs',
        attributeMapping: { email: 'email' },
        signedAssertions: true,
      },
      isDefault: true,
      defaultRole: 'tenant_admin',
      autoProvisionTenant: true,
      allowedEmailDomains: ['example.com'],
    }
    assert.equal(dto.isDefault, true)
    assert.equal(dto.defaultRole, 'tenant_admin')
  })

  // ============ CreateOidcConnectionDto ============
  it('CreateOidcConnectionDto 必填字段', () => {
    const dto: CreateOidcConnectionDto = {
      name: '企业 OIDC',
      oidc: {
        clientId: 'client-001',
        clientSecret: 'secret',
        issuer: 'https://issuer.example.com',
        authorizationEndpoint: 'https://issuer.example.com/auth',
        tokenEndpoint: 'https://issuer.example.com/token',
        userinfoEndpoint: 'https://issuer.example.com/userinfo',
        jwksUri: 'https://issuer.example.com/jwks',
        redirectUri: 'https://sp.example.com/callback',
        scope: 'openid profile email',
        claimMapping: { email: 'email' },
      },
    }
    assert.equal(dto.name, '企业 OIDC')
    assert.equal(dto.oidc.scope, 'openid profile email')
  })

  // ============ UpdateSsoConnectionDto ============
  it('UpdateSsoConnectionDto 全可选', () => {
    const dto: UpdateSsoConnectionDto = {}
    assert.deepEqual(dto, {})
  })

  it('UpdateSsoConnectionDto 部分更新', () => {
    const dto: UpdateSsoConnectionDto = { name: '新名称', status: 'active' }
    assert.equal(dto.name, '新名称')
    assert.equal(dto.status, 'active')
  })

  it('UpdateSsoConnectionDto 更新 SAML 部分配置', () => {
    const dto: UpdateSsoConnectionDto = { saml: { entityId: 'new-entity' } }
    assert.equal(dto.saml!.entityId, 'new-entity')
  })

  // ============ SsoLoginInitiateDto ============
  it('SsoLoginInitiateDto 可选字段', () => {
    const dto: SsoLoginInitiateDto = {}
    assert.deepEqual(dto, {})
  })

  it('SsoLoginInitiateDto 强制重新认证', () => {
    const dto: SsoLoginInitiateDto = { redirectAfter: '/dashboard', forceAuthn: true }
    assert.equal(dto.redirectAfter, '/dashboard')
    assert.equal(dto.forceAuthn, true)
  })

  // ============ SsoLoginCompleteDto ============
  it('SsoLoginCompleteDto SAML', () => {
    const dto: SsoLoginCompleteDto = { protocol: 'saml', payload: 'base64-saml-response' }
    assert.equal(dto.protocol, 'saml')
  })

  it('SsoLoginCompleteDto OIDC', () => {
    const dto: SsoLoginCompleteDto = { protocol: 'oidc', payload: 'auth-code', state: 'state-abc' }
    assert.equal(dto.protocol, 'oidc')
    assert.equal(dto.state, 'state-abc')
  })

  // ============ SsoConnectionResponse ============
  it('SsoConnectionResponse 全字段', () => {
    const resp: SsoConnectionResponse = {
      id: 'sso-001',
      tenantId: 'tenant-abc',
      protocol: 'saml',
      name: '企业 SAML',
      status: 'active',
      isDefault: true,
      defaultRole: 'tenant_admin',
      autoProvisionTenant: false,
      allowedEmailDomains: [],
      hasSaml: true,
      hasOidc: false,
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
      createdBy: 'user-001',
    }
    assert.equal(resp.protocol, 'saml')
    assert.equal(resp.hasSaml, true)
    assert.equal(resp.hasOidc, false)
  })

  // ============ SsoLoginInitResponse ============
  it('SsoLoginInitResponse SAML 不含 state', () => {
    const resp: SsoLoginInitResponse = {
      redirectUrl: 'https://idp.example.com/sso?SAMLRequest=...',
      requestId: 'req-001',
    }
    assert.equal(resp.state, undefined)
    assert.ok(resp.redirectUrl.includes('SAMLRequest'))
  })

  it('SsoLoginInitResponse OIDC 含 state 和 codeVerifier', () => {
    const resp: SsoLoginInitResponse = {
      redirectUrl: 'https://issuer.example.com/auth?client_id=...',
      state: 'state-xyz',
      codeVerifier: 'pkce-verifier-xxx',
    }
    assert.equal(resp.state, 'state-xyz')
    assert.equal(resp.codeVerifier, 'pkce-verifier-xxx')
  })

  // ============ SsoLoginCompleteResponse ============
  it('SsoLoginCompleteResponse 新用户', () => {
    const resp: SsoLoginCompleteResponse = {
      userId: 'user-001',
      email: 'admin@example.com',
      role: 'tenant_admin',
      isNewUser: true,
      tenantId: 'tenant-abc',
      accessToken: 'eyJ...',
      expiresIn: 3600,
    }
    assert.equal(resp.isNewUser, true)
    assert.equal(resp.role, 'tenant_admin')
  })

  it('SsoLoginCompleteResponse 老用户含 refresh', () => {
    const resp: SsoLoginCompleteResponse = {
      userId: 'user-002',
      email: 'existing@example.com',
      role: 'operator',
      isNewUser: false,
      tenantId: 'tenant-xyz',
      accessToken: 'eyJ...',
      refreshToken: 'rt_...',
      expiresIn: 7200,
    }
    assert.equal(resp.isNewUser, false)
    assert.equal(resp.refreshToken, 'rt_...')
  })
})
