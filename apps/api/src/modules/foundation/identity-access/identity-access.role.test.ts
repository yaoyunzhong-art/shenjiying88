import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { IdentityAccessController } from './identity-access.controller'
// ── Helpers ──
function mockIdentityAccessService() {
  return {
    resolveActorContext: () => ({
      authenticated: true,
      actor: { actorId: 'a-1', roles: ['TENANT_ADMIN'], permissions: ['*'] },
      effectiveTenantId: 't-1',
      roles: ['TENANT_ADMIN'],
      permissions: ['*']
    }),
    authorizeAction: () => ({ status: 'allowed', action: 'test', permissionMatched: true, tenantScopeMatched: true }),
    getDescriptor: () => ({ key: 'identity-access', name: 'IA Module' })
  } as any
}

function createIdentityAccessController(mockSvc = mockIdentityAccessService()) {
  return new IdentityAccessController(mockSvc)
}

const tenantCtx = { tenantId: 't-ia', brandId: 'b-ia', storeId: 's-ia', marketCode: 'zh-cn' }
const actorCtx = { actorId: 'a-test', actorType: 'user', actorName: 'Test', roles: ['TENANT_ADMIN'], permissions: ['*'], authenticated: true }

const ROLES = {
  TenantAdmin: '👔店长',
  Security: '🔧安监',
  Operations: '🎯运行专员',
  HR: '👥HR'
}

// ── 👔店长 ──
describe(`${ROLES.TenantAdmin} identity-access 角色测试`, () => {
  it('店长可以获取 actor context', () => {
    const svc = mockIdentityAccessService()
    const ctrl = createIdentityAccessController(svc)
    const result = ctrl.getContext(tenantCtx, actorCtx)
    assert.equal(result.authenticated, true)
    assert.equal(result.effectiveTenantId, 't-1')
  })

  it('店长可以 validate role', () => {
    const svc = mockIdentityAccessService()
    const ctrl = createIdentityAccessController(svc)
    const result = ctrl.validateRole(tenantCtx, actorCtx)
    assert.equal(result.status, 'allowed')
    assert.equal(result.check, 'role')
  })

  it('店长可以 validate permission', () => {
    const svc = mockIdentityAccessService()
    const ctrl = createIdentityAccessController(svc)
    const result = ctrl.validatePermission(tenantCtx, actorCtx)
    assert.equal(result.status, 'allowed')
    assert.equal(result.check, 'permission')
  })

  it('店长可以 validate tenant scope', () => {
    const svc = mockIdentityAccessService()
    svc.authorizeAction = () => ({ status: 'allowed', action: 'tenant:read', permissionMatched: true, tenantScopeMatched: true })
    const ctrl = createIdentityAccessController(svc)
    const result = ctrl.validateTenantScope('t-1', tenantCtx, actorCtx)
    assert.equal(result.status, 'allowed')
    assert.equal(result.check, 'tenant-scope')
    assert.equal(result.targetTenantId, 't-1')
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} identity-access 角色测试`, () => {
  it('安监可以获取 actor context（审计视角）', () => {
    const svc = mockIdentityAccessService()
    svc.resolveActorContext = () => ({
      authenticated: true,
      actor: { actorId: 'a-sec', roles: ['SECURITY_ADMIN'], permissions: ['audit:read'] },
      effectiveTenantId: 't-ia',
      roles: ['SECURITY_ADMIN'],
      permissions: ['audit:read']
    })
    const ctrl = createIdentityAccessController(svc)
    const result = ctrl.getContext(tenantCtx, { ...actorCtx, roles: ['SECURITY_ADMIN'], permissions: ['audit:read'] })
    assert.ok(result.roles.includes('SECURITY_ADMIN'))
  })

  it('安监可以 validate permission', () => {
    const svc = mockIdentityAccessService()
    svc.authorizeAction = () => ({ status: 'allowed', action: 'identity-access:read', permissionMatched: true, tenantScopeMatched: true })
    const ctrl = createIdentityAccessController(svc)
    const result = ctrl.validatePermission(tenantCtx, actorCtx)
    assert.equal(result.status, 'allowed')
  })

  it('安监跨租户 scope validate — 边界（authorization denied）', () => {
    const svc = mockIdentityAccessService()
    svc.authorizeAction = () => ({ status: 'denied', action: 'tenant:read', permissionMatched: false, tenantScopeMatched: false, resourceScope: {}, actor: null, enforcedBy: [] })
    const ctrl = new IdentityAccessController(svc)
    const result = ctrl.validateTenantScope('t-other', tenantCtx, { ...actorCtx, roles: ['SECURITY_ADMIN'], permissions: ['audit:read'] })
    // Controller hardcodes status: 'allowed' on envelope; authorization sub-object reflects real check
    assert.equal(result.check, 'tenant-scope')
    assert.equal(result.authorization.status, 'denied')
    assert.equal(result.authorization.permissionMatched, false)
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} identity-access 角色测试`, () => {
  it('运营专员可以获取 context', () => {
    const svc = mockIdentityAccessService()
    svc.resolveActorContext = () => ({
      authenticated: true,
      actor: { actorId: 'a-ops', roles: ['OPERATIONS'], permissions: ['foundation.operations.alerts.write'] },
      effectiveTenantId: 't-ia',
      roles: ['OPERATIONS'],
      permissions: ['foundation.operations.alerts.write']
    })
    const ctrl = createIdentityAccessController(svc)
    const result = ctrl.getContext(tenantCtx, { ...actorCtx, roles: ['OPERATIONS'], permissions: ['foundation.operations.alerts.write'] })
    assert.ok(result)
  })

  it('运营专员可以 validate role', () => {
    const ctrl = createIdentityAccessController()
    const result = ctrl.validateRole(tenantCtx, actorCtx)
    assert.equal(result.check, 'role')
  })

  it('运营专员可以 validate tenant scope', () => {
    const ctrl = createIdentityAccessController()
    const result = ctrl.validateTenantScope('t-ia', tenantCtx, actorCtx)
    assert.equal(result.check, 'tenant-scope')
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} identity-access 角色测试`, () => {
  it('HR可以获取 context', () => {
    const svc = mockIdentityAccessService()
    svc.resolveActorContext = () => ({
      authenticated: true,
      actor: { actorId: 'a-hr', roles: ['HR'], permissions: ['member:read'] },
      effectiveTenantId: 't-ia',
      roles: ['HR'],
      permissions: ['member:read']
    })
    const ctrl = createIdentityAccessController(svc)
    const result = ctrl.getContext(tenantCtx, { ...actorCtx, roles: ['HR'], permissions: ['member:read'] })
    assert.ok(result.authenticated)
  })

  it('HR可以 validate role', () => {
    const svc = mockIdentityAccessService()
    const ctrl = createIdentityAccessController(svc)
    const result = ctrl.validateRole(tenantCtx, { ...actorCtx, roles: ['HR'] })
    assert.equal(result.status, 'allowed')
  })

  it('HR尝试跨scope validate — 边界（authorization denied）', () => {
    const svc = mockIdentityAccessService()
    svc.authorizeAction = () => ({ status: 'denied', action: 'tenant:read', permissionMatched: false, tenantScopeMatched: false, resourceScope: {}, actor: null, enforcedBy: [] })
    const ctrl = new IdentityAccessController(svc)
    const result = ctrl.validateTenantScope('t-other', tenantCtx, { ...actorCtx, roles: ['HR'], permissions: ['member:read'] })
    assert.equal(result.check, 'tenant-scope')
    assert.equal(result.authorization.status, 'denied')
    assert.equal(result.authorization.permissionMatched, false)
  })
})
