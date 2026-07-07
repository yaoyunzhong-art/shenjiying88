import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🦞 龙虾哥测试第二段
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 * 8角色视角·Tenant模块扩展角色测试 (追加覆盖场景)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TenantController } from './tenant.controller'

function makeReq(overrides: any = {}) {
  return {
    tenantContext: { tenantId: 't-tenant', brandId: 'b-tenant', storeId: 's-tenant', marketCode: 'zh-cn' },
    actorContext: {
      actorId: 'actor-001',
      actorType: 'user',
      actorName: 'Test Actor',
      roles: ['SUPER_ADMIN'],
      permissions: ['tenant:read'],
      authenticated: true,
      source: 'headers' as const,
    } as any,
    governanceContext: { requestId: 'req-001' },
    ...overrides,
  }
}

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

// ════════════ 👔店长 ════════════
describe(`${ROLES.TenantAdmin} tenant扩展角色测试`, () => {
  it('店长跨门店 resolve 时返回正确 brandId', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      tenantContext: { tenantId: 't-mall', brandId: 'b-mall', storeId: 's-mall-a', marketCode: 'zh-cn' },
      actorContext: {
        ...makeReq().actorContext,
        roles: ['TENANT_ADMIN'],
        permissions: ['*'],
        brandId: 'b-mall',
      },
    })
    const r = ctrl.resolveTenant(req)
    assert.equal(r.effectiveTenantId, 't-mall')
    assert.equal(r.effectiveBrandId, 'b-mall')
    assert.equal(r.effectiveStoreId, 's-mall-a')
  })
})

// ════════════ 🛒前台 ════════════
describe(`${ROLES.Reception} tenant扩展角色测试`, () => {
  it('前台 resolve 时 tenantContext.storeId 被保留', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      tenantContext: { tenantId: 't-rec', brandId: 'b-rec', storeId: 's-counter-01', marketCode: 'zh-cn' },
      actorContext: {
        ...makeReq().actorContext,
        roles: ['RECEPTION'],
        permissions: ['tenant:read'],
        storeId: 's-counter-01',
      },
    })
    const r = ctrl.resolveTenant(req)
    assert.equal(r.effectiveStoreId, 's-counter-01')
  })

  it('前台带多个 marketCode 也能 resolve', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      tenantContext: { tenantId: 't-multi', brandId: 'b-multi', storeId: 's-multi', marketCode: 'en-hk' },
      actorContext: {
        ...makeReq().actorContext,
        roles: ['RECEPTION'],
        permissions: ['tenant:read'],
      },
    })
    const r = ctrl.resolveTenant(req)
    assert.equal(r.effectiveMarketCode, 'en-hk')
  })
})

// ════════════ 👥HR ════════════
describe(`${ROLES.HR} tenant扩展角色测试`, () => {
  it('HR 无 tenantContext 时使用 actorContext 的 tenantId', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      tenantContext: undefined,
      actorContext: {
        ...makeReq().actorContext,
        tenantId: 't-hr-direct',
        brandId: 'b-hr',
        roles: ['HR'],
        storeId: undefined,
      },
    })
    const r = ctrl.resolveTenant(req)
    assert.equal(r.effectiveTenantId, 't-hr-direct')
  })

  it('HR 带 storeId 也能 resolve', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      tenantContext: { tenantId: 't-hr', brandId: 'b-hr', storeId: 's-hr-office', marketCode: 'zh-cn' },
      actorContext: {
        ...makeReq().actorContext,
        roles: ['HR'],
        storeId: 's-hr-office',
      },
    })
    const r = ctrl.resolveTenant(req)
    assert.equal(r.effectiveStoreId, 's-hr-office')
  })
})

// ════════════ 🔧安监 ════════════
describe(`${ROLES.Safety} tenant扩展角色测试`, () => {
  it('安监 actorContext 全缺时回退 tenantContext', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      actorContext: undefined,
      tenantContext: { tenantId: 't-safety-only', brandId: 'b-safety', storeId: 's-camera-01', marketCode: 'zh-cn' },
    })
    const r = ctrl.resolveTenant(req)
    assert.equal(r.effectiveTenantId, 't-safety-only')
    assert.equal(r.actor, null)
  })

  it('安监有 storeId 未认证也可 resolve', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      actorContext: {
        actorId: 'sensor-01',
        actorType: 'device',
        roles: [],
        permissions: ['tenant:read'],
        authenticated: false,
        source: 'headers' as const,
      },
    })
    const r = ctrl.resolveTenant(req)
    assert.equal(r.actor?.authenticated, false)
    assert.equal(r.effectiveTenantId, 't-tenant')
  })
})

// ════════════ 🎮导玩员 ════════════
describe(`${ROLES.Guide} tenant扩展角色测试`, () => {
  it('导玩员 actor.actorName 包含中文', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      tenantContext: { tenantId: 't-game', brandId: 'b-game', storeId: 's-arcade', marketCode: 'zh-cn' },
      actorContext: {
        ...makeReq().actorContext,
        actorName: '导游小王',
        roles: ['GUIDE'],
        permissions: ['tenant:read'],
      },
    })
    const r = ctrl.resolveTenant(req)
    assert.equal(r.actor?.actorName, '导游小王')
  })

  it('导玩员带 platform-user 类型也能 resolve', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      actorContext: {
        ...makeReq().actorContext,
        actorType: 'platform-user',
        roles: ['GUIDE'],
      },
    })
    const r = ctrl.resolveTenant(req)
    assert.equal(r.actor?.actorType, 'platform-user')
  })
})

// ════════════ 🎯运行专员 ════════════
describe(`${ROLES.Ops} tenant扩展角色测试`, () => {
  it('运行专员 actorContext.tenantId 与 tenantContext 不同时优先 actorContext', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      tenantContext: { tenantId: 't-common', brandId: 'b-c', storeId: 's-c', marketCode: 'zh-cn' },
      actorContext: {
        ...makeReq().actorContext,
        tenantId: 't-ops-dedicated',
        brandId: 'b-ops',
        storeId: 's-ops-room',
        roles: ['OPERATIONS'],
      },
    })
    const r = ctrl.resolveTenant(req)
    assert.equal(r.effectiveTenantId, 't-ops-dedicated')
  })

  it('运行专员无 governanceContext 也能 resolve', () => {
    const ctrl = new TenantController()
    const req = makeReq({ governanceContext: undefined })
    const r = ctrl.resolveTenant(req)
    assert.equal(r.requestId, undefined)
  })
})

// ════════════ 🤝团建 ════════════
describe(`${ROLES.Teambuilding} tenant扩展角色测试`, () => {
  it('团建 tenantContext 全空时回退 actorContext', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      tenantContext: undefined,
      actorContext: {
        ...makeReq().actorContext,
        tenantId: 't-tb-only',
        brandId: 'b-tb',
        roles: ['TEAMBUILDING'],
      },
    })
    const r = ctrl.resolveTenant(req)
    assert.equal(r.effectiveTenantId, 't-tb-only')
  })

  it('团建 brandId 优先 actorContext', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      tenantContext: { tenantId: 't-tb', brandId: 'b-tenant-tb', storeId: 's-tb', marketCode: 'zh-cn' },
      actorContext: {
        ...makeReq().actorContext,
        brandId: 'b-actor-tb',
        roles: ['TEAMBUILDING'],
      },
    })
    const r = ctrl.resolveTenant(req)
    assert.equal(r.effectiveBrandId, 'b-actor-tb')
  })
})

// ════════════ 📢营销 ════════════
describe(`${ROLES.Marketing} tenant扩展角色测试`, () => {
  it('营销跨品牌 resolve 时 brandId 使用 actorContext', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      tenantContext: { tenantId: 't-mkt', brandId: 'b-mkt-base', storeId: 's-mkt', marketCode: 'zh-cn' },
      actorContext: {
        ...makeReq().actorContext,
        brandId: 'b-mkt-campaign',
        roles: ['MARKETING'],
        permissions: ['campaign:write'],
      },
    })
    const r = ctrl.resolveTenant(req)
    assert.equal(r.effectiveBrandId, 'b-mkt-campaign')
  })

  it('营销 actor.roles 为空数组仍可 resolve', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      actorContext: {
        ...makeReq().actorContext,
        roles: [],
        permissions: [],
      },
    })
    const r = ctrl.resolveTenant(req)
    assert.deepEqual(r.actor?.roles, [])
  })

  it('营销 service-account 也能正确 resolve', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      actorContext: {
        ...makeReq().actorContext,
        actorType: 'service-account',
        roles: ['MARKETING'],
        permissions: ['tenant:read'],
      },
    })
    const r = ctrl.resolveTenant(req)
    assert.equal(r.actor?.actorType, 'service-account')
    assert.equal(r.effectiveTenantId, 't-tenant')
  })
})
