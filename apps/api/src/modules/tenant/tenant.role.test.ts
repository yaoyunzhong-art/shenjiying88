import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { TenantController } from './tenant.controller'

// ── Helpers ──
function makeReq(overrides: any = {}) {
  return {
    tenantContext: { tenantId: 't-tenant', brandId: 'b-tenant', storeId: 's-tenant', marketCode: 'zh-cn' },
    actorContext: {
      actorId: 'actor-001',
      actorType: 'user',
      actorName: 'Test Actor',
      roles: ['SUPER_ADMIN'],
      permissions: ['tenant:read'],
      authenticated: true
    } as any,
    governanceContext: { requestId: 'req-001' },
    ...overrides
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
  Marketing: '📢营销'
}

// ── 👔店长 ──
describe(`${ROLES.TenantAdmin} tenant 角色测试`, () => {
  test('店长可以 resolve tenant（含完整 actor 信息）', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      actorContext: {
        ...makeReq().actorContext,
        roles: ['TENANT_ADMIN'],
        permissions: ['*']
      }
    })
    const result = ctrl.resolveTenant(req)
    assert.equal(result.effectiveTenantId, 't-tenant')
    assert.ok(result.actor)
    assert.equal(result.actor!.roles[0], 'TENANT_ADMIN')
    assert.equal(result.source, 'tenant-module')
  })

  test('店长 resolve tenant 时 brandId 正确', () => {
    const ctrl = new TenantController()
    const req = makeReq()
    const result = ctrl.resolveTenant(req)
    assert.equal(result.effectiveBrandId, 'b-tenant')
  })

  test('店长 resolve tenant 时 requestId 被传递', () => {
    const ctrl = new TenantController()
    const req = makeReq()
    const result = ctrl.resolveTenant(req)
    assert.equal(result.requestId, 'req-001')
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} tenant 角色测试`, () => {
  test('HR可以 resolve tenant（成员管理视角）', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      actorContext: {
        ...makeReq().actorContext,
        roles: ['HR'],
        permissions: ['tenant:read']
      }
    })
    const result = ctrl.resolveTenant(req)
    assert.equal(result.effectiveTenantId, 't-tenant')
    assert.equal(result.actor!.roles[0], 'HR')
  })

  test('HR resolve tenant 时 effectiveMarketCode 可用', () => {
    const ctrl = new TenantController()
    const req = makeReq()
    const result = ctrl.resolveTenant(req)
    assert.equal(result.effectiveMarketCode, 'zh-cn')
  })

  test('HR resolve tenant 时 actor 权限列表正确', () => {
    const ctrl = new TenantController()
    const req = makeReq()
    const result = ctrl.resolveTenant(req)
    assert.ok(result.actor!.permissions.includes('tenant:read'))
  })
})

// ── 🛒 前台 ──
describe(`${ROLES.Reception} tenant 角色测试`, () => {
  test('前台可以 resolve tenant（客户接待视角，含 store 层级）', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      tenantContext: { tenantId: 't-reception', brandId: 'b-reception', storeId: 's-reception-desk', marketCode: 'zh-cn' },
      actorContext: {
        ...makeReq().actorContext,
        actorId: 'receptionist-01',
        actorType: 'store-user',
        roles: ['RECEPTION'],
        permissions: ['tenant:read', 'member:profile:read']
      }
    })
    const result = ctrl.resolveTenant(req)
    assert.equal(result.effectiveTenantId, 't-reception')
    assert.equal(result.effectiveStoreId, 's-reception-desk')
    assert.equal(result.actor!.roles[0], 'RECEPTION')
    assert.equal(result.actor!.actorType, 'store-user')
  })

  test('前台 resolve tenant 时 actor 已认证且 source 正确', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      actorContext: {
        ...makeReq().actorContext,
        roles: ['RECEPTION'],
        permissions: ['tenant:read'],
        authenticated: true
      }
    })
    const result = ctrl.resolveTenant(req)
    assert.equal(result.actor!.authenticated, true)
    assert.equal(result.source, 'tenant-module')
    assert.equal(result.effectiveMarketCode, 'zh-cn')
  })

  test('前台 resolve tenant — 无 tenantContext 时回退到 actorContext 的 tenantId', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      tenantContext: undefined as any,
      actorContext: {
        ...makeReq().actorContext,
        roles: ['RECEPTION'],
        tenantId: 't-front-desk',
        brandId: 'b-front-desk',
        storeId: 's-front-desk'
      }
    })
    const result = ctrl.resolveTenant(req)
    assert.equal(result.effectiveTenantId, 't-front-desk')
    assert.equal(result.effectiveBrandId, 'b-front-desk')
    assert.equal(result.effectiveStoreId, 's-front-desk')
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Safety} tenant 角色测试`, () => {
  test('安监可以 resolve tenant（审计日志视角）', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      actorContext: {
        ...makeReq().actorContext,
        roles: ['SECURITY_ADMIN'],
        permissions: ['audit:read']
      }
    })
    const result = ctrl.resolveTenant(req)
    assert.equal(result.actor!.roles[0], 'SECURITY_ADMIN')
    assert.equal(result.source, 'tenant-module')
  })

  test('安监 resolve tenant 时 storeId 正确', () => {
    const ctrl = new TenantController()
    const req = makeReq()
    const result = ctrl.resolveTenant(req)
    assert.equal(result.effectiveStoreId, 's-tenant')
  })

  test('安监 resolve tenant — 无 actorContext 时回退到 tenant-demo', () => {
    const ctrl = new TenantController()
    const req = makeReq({ actorContext: undefined })
    const result = ctrl.resolveTenant(req)
    assert.equal(result.effectiveTenantId, 't-tenant')
    assert.equal(result.actor, null)
  })
})

// ── 🎮 导玩员 ──
describe(`${ROLES.Guide} tenant 角色测试`, () => {
  test('导玩员可以 resolve tenant（游戏引导视角）', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      tenantContext: { tenantId: 't-guide', brandId: 'b-guide', storeId: 's-guide-zone', marketCode: 'zh-cn' },
      actorContext: {
        ...makeReq().actorContext,
        actorId: 'guide-001',
        actorType: 'store-user',
        actorName: '导游小张',
        roles: ['GUIDE'],
        permissions: ['tenant:read', 'member:profile:read', 'game:session:write']
      }
    })
    const result = ctrl.resolveTenant(req)
    assert.equal(result.effectiveTenantId, 't-guide')
    assert.equal(result.effectiveStoreId, 's-guide-zone')
    assert.equal(result.actor!.actorName, '导游小张')
    assert.equal(result.actor!.roles[0], 'GUIDE')
    assert.ok(result.actor!.permissions.includes('game:session:write'))
  })

  test('导玩员 resolve tenant — 无 actorContext 时回退到 tenantContext', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      actorContext: undefined,
      tenantContext: { tenantId: 't-game-hall', brandId: 'b-game-hall', storeId: 's-game-hall', marketCode: 'en-us' }
    })
    const result = ctrl.resolveTenant(req)
    assert.equal(result.effectiveTenantId, 't-game-hall')
    assert.equal(result.effectiveMarketCode, 'en-us')
    assert.equal(result.actor, null)
  })

  test('导玩员 resolve tenant 返回完整的 requestId 用于追溯', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      actorContext: {
        ...makeReq().actorContext,
        roles: ['GUIDE'],
        permissions: ['tenant:read']
      },
      governanceContext: { requestId: 'req-guide-2026' }
    })
    const result = ctrl.resolveTenant(req)
    assert.equal(result.requestId, 'req-guide-2026')
    assert.equal(result.source, 'tenant-module')
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Ops} tenant 角色测试`, () => {
  test('运营专员可以 resolve tenant', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      actorContext: {
        ...makeReq().actorContext,
        roles: ['OPERATIONS'],
        permissions: ['foundation.operations.alerts.write']
      }
    })
    const result = ctrl.resolveTenant(req)
    assert.equal(result.actor!.roles[0], 'OPERATIONS')
  })

  test('运营专员 resolve tenant 时 actor 已认证', () => {
    const ctrl = new TenantController()
    const req = makeReq()
    const result = ctrl.resolveTenant(req)
    assert.equal(result.actor!.authenticated, true)
  })

  test('运营专员 resolve tenant — 无 tenantContext 且无 actorContext 时回退到 tenant-demo', () => {
    const ctrl = new TenantController()
    const req = makeReq({ tenantContext: undefined, actorContext: undefined, governanceContext: {} })
    const result = ctrl.resolveTenant(req)
    assert.equal(result.effectiveTenantId, 'tenant-demo')
    assert.equal(result.actor, null)
    assert.equal(result.requestId, undefined)
  })
})

// ── 🤝 团建 ──
describe(`${ROLES.Teambuilding} tenant 角色测试`, () => {
  test('团建可以 resolve tenant（团队活动租户视角）', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      tenantContext: { tenantId: 't-teambuilding', brandId: 'b-teambuilding', storeId: 's-tb-venue', marketCode: 'zh-cn' },
      actorContext: {
        ...makeReq().actorContext,
        actorId: 'tb-coordinator-01',
        actorType: 'employee-user',
        actorName: '团建协调员',
        roles: ['TEAMBUILDING'],
        permissions: ['tenant:read', 'team:session:write', 'member:list:read']
      }
    })
    const result = ctrl.resolveTenant(req)
    assert.equal(result.effectiveTenantId, 't-teambuilding')
    assert.equal(result.effectiveBrandId, 'b-teambuilding')
    assert.equal(result.actor!.actorName, '团建协调员')
    assert.equal(result.actor!.roles[0], 'TEAMBUILDING')
    assert.ok(result.actor!.permissions.includes('team:session:write'))
  })

  test('团建 resolve tenant 时 actorType 为 employee-user', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      actorContext: {
        ...makeReq().actorContext,
        actorType: 'employee-user',
        roles: ['TEAMBUILDING'],
        permissions: ['tenant:read']
      }
    })
    const result = ctrl.resolveTenant(req)
    assert.equal(result.actor!.actorType, 'employee-user')
    assert.equal(result.actor!.authenticated, true)
    assert.equal(result.effectiveMarketCode, 'zh-cn')
  })

  test('团建 resolve tenant — 仅 tenantContext 可用时仍正常返回 tenant 信息', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      actorContext: undefined,
      tenantContext: { tenantId: 't-tb-only', brandId: undefined, storeId: undefined, marketCode: 'ja-jp' }
    })
    const result = ctrl.resolveTenant(req)
    assert.equal(result.effectiveTenantId, 't-tb-only')
    assert.equal(result.effectiveBrandId, undefined)
    assert.equal(result.effectiveStoreId, undefined)
    assert.equal(result.effectiveMarketCode, 'ja-jp')
    assert.equal(result.actor, null)
  })
})

// ── 📢 营销 ──
describe(`${ROLES.Marketing} tenant 角色测试`, () => {
  test('营销可以 resolve tenant（营销活动租户视角）', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      tenantContext: { tenantId: 't-marketing', brandId: 'b-marketing', storeId: 's-mkt-store', marketCode: 'zh-cn' },
      actorContext: {
        ...makeReq().actorContext,
        actorId: 'mkt-operator-01',
        actorType: 'brand-user',
        actorName: '营销专员',
        roles: ['MARKETING'],
        permissions: ['tenant:read', 'campaign:write', 'member:segment:read']
      }
    })
    const result = ctrl.resolveTenant(req)
    assert.equal(result.effectiveTenantId, 't-marketing')
    assert.equal(result.effectiveBrandId, 'b-marketing')
    assert.equal(result.effectiveStoreId, 's-mkt-store')
    assert.equal(result.actor!.actorName, '营销专员')
    assert.equal(result.actor!.roles[0], 'MARKETING')
    assert.ok(result.actor!.permissions.includes('campaign:write'))
    assert.ok(result.actor!.permissions.includes('member:segment:read'))
  })

  test('营销 resolve tenant 时 actorType 为 brand-user（品牌层级）', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      actorContext: {
        ...makeReq().actorContext,
        actorType: 'brand-user',
        roles: ['MARKETING'],
        permissions: ['tenant:read', 'campaign:write']
      }
    })
    const result = ctrl.resolveTenant(req)
    assert.equal(result.actor!.actorType, 'brand-user')
    assert.equal(result.source, 'tenant-module')
    assert.equal(result.requestId, 'req-001')
  })

  test('营销 resolve tenant — actor 的品牌 ID 优先于 tenantContext', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      tenantContext: { tenantId: 't-common', brandId: 'b-base', storeId: 's-base', marketCode: 'zh-cn' },
      actorContext: {
        ...makeReq().actorContext,
        actorType: 'brand-user',
        tenantId: 't-mkt-special',
        brandId: 'b-mkt-special',
        storeId: 's-mkt-special',
        roles: ['MARKETING'],
        permissions: ['tenant:read']
      }
    })
    const result = ctrl.resolveTenant(req)
    // actorContext 的值优先
    assert.equal(result.effectiveTenantId, 't-mkt-special')
    assert.equal(result.effectiveBrandId, 'b-mkt-special')
    assert.equal(result.effectiveStoreId, 's-mkt-special')
  })
})

// ──────────── 多角色边界与异常场景 ────────────
describe('跨角色 tenant resolve 边界测试', () => {
  test('多个不同角色连续 resolve 不互相污染', () => {
    const ctrl = new TenantController()

    // 店长 resolve
    const adminReq = makeReq({
      actorContext: {
        ...makeReq().actorContext,
        roles: ['TENANT_ADMIN'],
        tenantId: 't-admin',
        permissions: ['*']
      }
    })
    const adminResult = ctrl.resolveTenant(adminReq)
    assert.equal(adminResult.effectiveTenantId, 't-admin')

    // 前台 resolve（不同 tenant）
    const receptionReq = makeReq({
      tenantContext: { tenantId: 't-reception', brandId: 'b-rec', storeId: 's-rec', marketCode: 'zh-cn' },
      actorContext: {
        ...makeReq().actorContext,
        roles: ['RECEPTION'],
        tenantId: 't-reception',
        permissions: ['tenant:read']
      }
    })
    const receptionResult = ctrl.resolveTenant(receptionReq)
    assert.equal(receptionResult.effectiveTenantId, 't-reception')

    // 确认店长结果没有被动摇
    assert.equal(adminResult.effectiveTenantId, 't-admin')
  })

  test('无 governanceContext 时 requestId 为 undefined', () => {
    const ctrl = new TenantController()
    const req = makeReq({ governanceContext: undefined })
    const result = ctrl.resolveTenant(req)
    assert.equal(result.requestId, undefined)
  })

  test('未认证的 actor 也能 resolve tenant（回退到 tenantContext）', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      actorContext: {
        actorId: 'guest-001',
        actorType: 'platform-user',
        roles: [],
        permissions: [],
        authenticated: false,
        source: 'headers' as const
      }
    })
    const result = ctrl.resolveTenant(req)
    // 未认证但 actorContext 存在，使用 actorContext 的 tenantId（undefined，回退 tenantContext）
    assert.equal(result.effectiveTenantId, 't-tenant')
    assert.equal(result.actor!.authenticated, false)
    assert.deepStrictEqual(result.actor!.roles, [])
  })

  test('service-account actorType 也能 resolve tenant', () => {
    const ctrl = new TenantController()
    const req = makeReq({
      actorContext: {
        ...makeReq().actorContext,
        actorId: 'svc-bot-001',
        actorType: 'service-account',
        actorName: '自动化机器人',
        roles: ['SYSTEM'],
        permissions: ['tenant:read', 'automation:execute']
      }
    })
    const result = ctrl.resolveTenant(req)
    assert.equal(result.actor!.actorType, 'service-account')
    assert.equal(result.actor!.actorName, '自动化机器人')
    assert.equal(result.actor!.roles[0], 'SYSTEM')
  })
})
