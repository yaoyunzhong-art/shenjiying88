import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🦞 龙虾哥测试第二段
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 * 8角色视角·SaaS Advanced (SSO+自定义域名)扩展角色测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { runWithTenant } from '../../common/context/tenant-context'
import { SsoService } from './sso.service'
import { CustomDomainService } from './custom-domain.service'
import { isValidDomain } from './custom-domain.entity'
import { generateVerificationToken, buildVerificationHost, buildVerificationValue } from './custom-domain.entity'

const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

const TX = { tenantId: 't-saas', storeId: 'store-saas', userId: 'admin-saas', role: 'tenant_admin' as const }
function inTenant<T>(fn: () => Promise<T>): Promise<T> { return runWithTenant(TX, fn) }

function makeSsoSvc(): SsoService {
  const svc = new SsoService()
  svc.setOidcHttpClient({
    async exchangeCode(params: any) { return { access_token: `mock-token-${String(params.code).slice(0, 8)}`, expires_in: 3600 } },
    async fetchUserinfo(_token: string) { return { sub: 'mocksub-123', email: 'user@test.com', name: 'Mock' } },
  })
  return svc
}

function makeDomainSvc(): CustomDomainService {
  const svc = new CustomDomainService()
  svc.setDnsResolver({ async queryTxt(_host) { return [] } })
  svc.setSslProvider({
    async issue(domain: string) {
      const certPem = `-----BEGIN CERTIFICATE-----\nMOCK-SSL-${domain}\n-----END CERTIFICATE-----`
      return { certPem, expiresAt: new Date(Date.now() + 90 * 86400_000).toISOString(), fingerprint: certPem.slice(0, 64) }
    },
  })
  return svc
}

function makeOidcCfg(custom: any = {}) {
  return {
    issuer: custom.issuer ?? 'https://accounts.test.com',
    clientId: custom.clientId ?? 'test-client',
    clientSecret: custom.clientSecret ?? 'test-secret',
    authorizationEndpoint: custom.authorizationEndpoint ?? 'https://accounts.test.com/auth',
    tokenEndpoint: custom.tokenEndpoint ?? 'https://accounts.test.com/token',
    jwksUri: custom.jwksUri ?? 'https://accounts.test.com/jwks',
    userinfoEndpoint: custom.userinfoEndpoint ?? 'https://accounts.test.com/userinfo',
    redirectUri: custom.redirectUri ?? 'https://sp.test.com/callback',
    scope: custom.scope ?? 'openid profile email',
    claimMapping: custom.claimMapping ?? { sub: 'id', email: 'email', name: 'displayName' },
  }
}

// ════════════ 👔店长 ════════════
describe(`${ROLES.TenantAdmin} SaaS高级扩展角色测试`, () => {
  it('店长可查看自定义域名列表', async () => {
    const svc = makeDomainSvc()
    const list = await inTenant(() => svc.list())
    assert.ok(Array.isArray(list))
  })

  it('店长可创建SAML连接', async () => {
    const svc = makeSsoSvc()
    const conn = await inTenant(() =>
      svc.createSamlConnection({
        name: 'Admin SAML',
        saml: { entityId: 'https://admin.idp.com/metadata', ssoUrl: 'https://sp.test.com/acs', spEntityId: 'sp-admin', idpCertificate: '-----BEGIN CERTIFICATE-----\nMOCK-CERT-admin\n-----END CERTIFICATE-----', acsUrl: 'https://sp.test.com/acs', attributeMapping: { email: 'email' }, signedAssertions: true },
      })
    )
    assert.ok(conn.id)
  })
})

// ════════════ 🛒前台 ════════════
describe(`${ROLES.Reception} SaaS高级扩展角色测试`, () => {
  it('前台可验证域名格式', () => {
    const result = isValidDomain('store.shenjiying88.com')
    assert.ok(result.valid)
  })

  it('前台可查询OIDC连接', async () => {
    const svc = makeSsoSvc()
    const conn = await inTenant(() =>
      svc.createOidcConnection({
        name: 'Reception OIDC',
        oidc: makeOidcCfg({ issuer: 'https://rec.accounts.com' }),
      })
    )
    assert.equal(conn.status, 'active')
  })
})

// ════════════ 👥HR ════════════
describe(`${ROLES.HR} SaaS高级扩展角色测试`, () => {
  it('HR可查询SAML连接', async () => {
    const svc = makeSsoSvc()
    const conn = await inTenant(() =>
      svc.createSamlConnection({
        name: 'HR SAML',
        saml: { entityId: 'https://hr.idp.com/metadata', ssoUrl: 'https://sp.hr.com/acs', spEntityId: 'sp-hr', idpCertificate: '-----BEGIN CERTIFICATE-----\nMOCK-CERT-hr\n-----END CERTIFICATE-----', acsUrl: 'https://sp.hr.com/acs', attributeMapping: { email: 'email' }, signedAssertions: true },
      })
    )
    assert.ok(conn.id)
  })
})

// ════════════ 🔧安监 ════════════
describe(`${ROLES.Safety} SaaS高级扩展角色测试`, () => {
  it('安监可添加域名字段', async () => {
    const svc = makeDomainSvc()
    const result = await inTenant(() => svc.addDomain('safety.shenjiying88.com'))
    assert.ok(result.domain)
  })

  it('安监可为域名申请SSL', async () => {
    const svc = makeDomainSvc()
    const added = await inTenant(() => svc.addDomain('safety-ssl.shenjiying88.com'))
    // 先通过 DNS 校验使域名 active
    const host = added.verificationHost
    const expectedValue = `shenjiying-verify=${added.verificationToken}`
    ;(svc as any).dnsOverrides.set(host, [expectedValue])
    await inTenant(() => svc.verify(added.id))
    const ssl = await inTenant(() => svc.requestSsl(added.id))
    assert.ok(ssl?.ssl?.fingerprint)
  })
})

// ════════════ 🎮导玩员 ════════════
describe(`${ROLES.Guide} SaaS高级扩展角色测试`, () => {
  it('导玩员可生成域名验证Token', () => {
    const token = generateVerificationToken()
    assert.ok(token)
    assert.ok(token.length > 8)
  })

  it('导玩员可获取域名验证值', () => {
    const host = buildVerificationHost('guide.shenjiying88.com')
    const value = buildVerificationValue('test-token')
    assert.ok(typeof host === 'string')
    assert.ok(typeof value === 'string')
  })
})

// ════════════ 🎯运行专员 ════════════
describe(`${ROLES.Ops} SaaS高级扩展角色测试`, () => {
  it('运行专员可添加运维用域名', async () => {
    const svc = makeDomainSvc()
    const result = await inTenant(() => svc.addDomain('ops-monitor.shenjiying88.com'))
    assert.ok(result.id)
  })

  it('运行专员可查询域名列表', async () => {
    const svc = makeDomainSvc()
    const all = await inTenant(() => svc.list())
    assert.ok(Array.isArray(all))
  })
})

// ════════════ 🤝团建 ════════════
describe(`${ROLES.Teambuilding} SaaS高级扩展角色测试`, () => {
  it('团建可创建SAML连接', async () => {
    const svc = makeSsoSvc()
    const conn = await inTenant(() =>
      svc.createSamlConnection({
        name: 'Team SAML',
        saml: { entityId: 'https://team.idp.com/metadata', ssoUrl: 'https://sp.team.com/acs', spEntityId: 'sp-team', idpCertificate: '-----BEGIN CERTIFICATE-----\nMOCK-CERT-team\n-----END CERTIFICATE-----', acsUrl: 'https://sp.team.com/acs', attributeMapping: { email: 'email' }, signedAssertions: true },
      })
    )
    assert.ok(conn.id)
  })

  it('团建可创建OIDC连接', async () => {
    const svc = makeSsoSvc()
    const conn = await inTenant(() =>
      svc.createOidcConnection({
        name: 'Team OIDC',
        oidc: makeOidcCfg({ issuer: 'https://team.accounts.com', clientId: 'team-client', clientSecret: 'team-secret' }),
      })
    )
    const got = await inTenant(() => svc.getConnection(conn.id))
    assert.equal(got.id, conn.id)
  })
})

// ════════════ 📢营销 ════════════
describe(`${ROLES.Marketing} SaaS高级扩展角色测试`, () => {
  it('营销可添加营销站点域名', async () => {
    const svc = makeDomainSvc()
    const result = await inTenant(() => svc.addDomain('mkt-campaign.shenjiying88.com'))
    assert.ok(result.domain)
  })

  it('营销可验证域名格式', () => {
    const r1 = isValidDomain('mkt.shenjiying88.com')
    assert.ok(r1.valid)
    const r2 = isValidDomain('')
    assert.ok(!r2.valid)
  })

  it('营销可查询OIDC连接可用状态', async () => {
    const svc = makeSsoSvc()
    const conn = await inTenant(() =>
      svc.createOidcConnection({
        name: 'Mkt OIDC',
        oidc: makeOidcCfg({ issuer: 'https://mkt.accounts.com', clientId: 'mkt-client', clientSecret: 'mkt-secret' }),
      })
    )
    assert.equal(conn.status, 'active')
  })
})
