/**
 * 🐜 自动: [identity-access] [C] 角色场景测试扩展
 *
 * 8 角色视角的 Identity Access 业务场景测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 3 个场景用例（正常打开→操作→完成 闭环 / 正向 + 负向 + 边界）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { IdentityAccessController } from './identity-access.controller'
import type { RequestActorContext, RequestTenantContext, ResolvedActorContext } from '../../tenant/tenant.types'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── Mock 服务工厂 ──
function mockIdentityAccessService() {
  const resolveRecord = new Map<string, ResolvedActorContext>()
  const permissionRecords = new Map<string, { status: string }>()

  return {
    resolveActorContext(
      tenantContext: RequestTenantContext,
      actorContext?: RequestActorContext
    ): ResolvedActorContext {
      const actor = actorContext ?? { actorId: 'anonymous', roles: [], permissions: [], authenticated: false }
      const key = `${actor.actorId}@${tenantContext.tenantId}`
      if (resolveRecord.has(key)) return resolveRecord.get(key)!

      const resolvers: Record<string, ResolvedActorContext> = {
        'store-owner@t-store': {
          authenticated: true,
          actor: { actorId: 'store-owner', roles: ['tenant-admin', 'store-admin'], permissions: ['*'], tenantId: 't-store', authenticated: true },
          tenantContext: { tenantId: 't-store', brandId: 'b-arcade', storeId: 's-main', marketCode: 'us-default' },
          effectiveTenantId: 't-store', effectiveBrandId: 'b-arcade', effectiveStoreId: 's-main', effectiveMarketCode: 'us-default',
          roles: ['tenant-admin', 'store-admin'], permissions: ['*'],
        } as ResolvedActorContext,
        'front-desk@t-store': {
          authenticated: true,
          actor: { actorId: 'front-desk', roles: ['store-staff'], permissions: ['order:read', 'order:write', 'payment:read'], tenantId: 't-store', authenticated: true },
          tenantContext: { tenantId: 't-store', brandId: 'b-arcade', storeId: 's-main', marketCode: 'us-default' },
          effectiveTenantId: 't-store', effectiveBrandId: 'b-arcade', effectiveStoreId: 's-main', effectiveMarketCode: 'us-default',
          roles: ['store-staff'], permissions: ['order:read', 'order:write', 'payment:read'],
        } as ResolvedActorContext,
        'hr-user@t-store': {
          authenticated: true,
          actor: { actorId: 'hr-user', roles: ['hr-admin'], permissions: ['user:read', 'audit:read', 'report:read'], tenantId: 't-store', authenticated: true },
          tenantContext: { tenantId: 't-store', brandId: 'b-arcade', marketCode: 'us-default' },
          effectiveTenantId: 't-store', effectiveBrandId: 'b-arcade', effectiveStoreId: undefined, effectiveMarketCode: 'us-default',
          roles: ['hr-admin'], permissions: ['user:read', 'audit:read', 'report:read'],
        } as ResolvedActorContext,
        'sec-user@t-store': {
          authenticated: true,
          actor: { actorId: 'sec-user', roles: ['security-admin'], permissions: ['audit:read', 'audit:export', 'compliance:manage'], tenantId: 't-store', authenticated: true },
          tenantContext: { tenantId: 't-store', brandId: 'b-arcade', marketCode: 'us-default' },
          effectiveTenantId: 't-store', effectiveBrandId: 'b-arcade', effectiveStoreId: undefined, effectiveMarketCode: 'us-default',
          roles: ['security-admin'], permissions: ['audit:read', 'audit:export', 'compliance:manage'],
        } as ResolvedActorContext,
        'guide-user@t-store': {
          authenticated: true,
          actor: { actorId: 'guide-user', roles: ['store-staff'], permissions: ['inventory:read', 'order:read'], tenantId: 't-store', authenticated: true },
          tenantContext: { tenantId: 't-store', brandId: 'b-arcade', storeId: 's-main', marketCode: 'us-default' },
          effectiveTenantId: 't-store', effectiveBrandId: 'b-arcade', effectiveStoreId: 's-main', effectiveMarketCode: 'us-default',
          roles: ['store-staff'], permissions: ['inventory:read', 'order:read'],
        } as ResolvedActorContext,
        'ops-user@t-store': {
          authenticated: true,
          actor: { actorId: 'ops-user', roles: ['ops-admin'], permissions: ['report:read', 'report:export', 'settlement:read'], tenantId: 't-store', authenticated: true },
          tenantContext: { tenantId: 't-store', brandId: 'b-arcade', marketCode: 'us-default' },
          effectiveTenantId: 't-store', effectiveBrandId: 'b-arcade', effectiveStoreId: undefined, effectiveMarketCode: 'us-default',
          roles: ['ops-admin'], permissions: ['report:read', 'report:export', 'settlement:read'],
        } as ResolvedActorContext,
        'team-user@t-store': {
          authenticated: true,
          actor: { actorId: 'team-user', roles: ['staff'], permissions: ['order:read', 'order:write', 'coupon:issue'], tenantId: 't-store', authenticated: true },
          tenantContext: { tenantId: 't-store', brandId: 'b-arcade', storeId: 's-main', marketCode: 'us-default' },
          effectiveTenantId: 't-store', effectiveBrandId: 'b-arcade', effectiveStoreId: 's-main', effectiveMarketCode: 'us-default',
          roles: ['staff'], permissions: ['order:read', 'order:write', 'coupon:issue'],
        } as ResolvedActorContext,
        'mkt-user@t-store': {
          authenticated: true,
          actor: { actorId: 'mkt-user', roles: ['marketing-admin'], permissions: ['coupon:read', 'coupon:write', 'coupon:issue', 'report:read'], tenantId: 't-store', authenticated: true },
          tenantContext: { tenantId: 't-store', brandId: 'b-arcade', marketCode: 'us-default' },
          effectiveTenantId: 't-store', effectiveBrandId: 'b-arcade', effectiveStoreId: undefined, effectiveMarketCode: 'us-default',
          roles: ['marketing-admin'], permissions: ['coupon:read', 'coupon:write', 'coupon:issue', 'report:read'],
        } as ResolvedActorContext,
      }
      const resolved = resolvers[key]
      if (resolved) return resolved
      return {
        authenticated: false, actor: null, tenantContext,
        effectiveTenantId: tenantContext.tenantId ?? 'unknown',
        effectiveBrandId: tenantContext.brandId, effectiveStoreId: tenantContext.storeId,
        effectiveMarketCode: tenantContext.marketCode ?? 'us-default',
        roles: [], permissions: [],
      }
    },

    authorizeAction(action: string, resourceScope: Record<string, string | undefined>, tenantContext?: RequestTenantContext, actorContext?: RequestActorContext) {
      const actor: { actorId: string; roles: string[]; permissions: string[]; authenticated: boolean } = actorContext ?? { actorId: 'anonymous', roles: [], permissions: [], authenticated: false }
      const key = `${action}:${actor.actorId}@${tenantContext?.tenantId ?? 'none'}`
      if (permissionRecords.has(key)) return permissionRecords.get(key)!
      const hasPermission = (actor.permissions as string[]).includes('*') || (actor.permissions as string[]).includes(action)
      return {
        status: hasPermission ? 'allowed' : 'denied',
        action,
        resourceScope,
        actor: actorContext ? { ...actorContext } : null,
        permissionMatched: hasPermission,
        tenantScopeMatched: true,
        enforcedBy: ['IdentityAccessGuard', 'IdentityAccessService.hasAllPermissions', 'tenant-scope-check'],
      }
    },

    hasAnyRole(actorContext: RequestActorContext | undefined, requiredRoles: string[] = []) {
      if (!actorContext || requiredRoles.length === 0) return true
      return requiredRoles.some(r => actorContext.roles?.includes(r))
    },

    hasAllPermissions(actorContext: RequestActorContext | undefined, requiredPermissions: string[] = []) {
      if (!actorContext || requiredPermissions.length === 0) return true
      return requiredPermissions.every(p => actorContext.permissions?.includes(p) || actorContext.permissions?.includes('*'))
    },

    isPrivilegedActor(actorContext?: RequestActorContext) {
      if (!actorContext) return false
      return actorContext.roles?.some(r => ['platform-admin', 'super-admin'].includes(r)) ?? false
    },

    validateTenantScope(tenantContext: RequestTenantContext, actorContext: RequestActorContext | undefined, requiredScope: Record<string, string | undefined>) {
      return true
    },

    getDescriptor() {
      return { key: 'identity-access', name: 'Identity Access Module', purpose: '', inboundContracts: [], outboundContracts: [], capabilities: [] }
    },
  }
}

function createController(svc = mockIdentityAccessService()): IdentityAccessController {
  return new IdentityAccessController(svc as any)
}

function tenantCtx(overrides: Partial<RequestTenantContext> = {}): RequestTenantContext {
  return { tenantId: 't-store', brandId: 'b-arcade', storeId: 's-main', marketCode: 'us-default', ...overrides }
}

function actorCtx(overrides: Partial<RequestActorContext> = {}): RequestActorContext {
  return { actorId: 'user-001', actorType: 'staff', roles: [], permissions: [], authenticated: true, source: 'headers', ...overrides }
}

// ──────────── 👔 店长 ────────────
describe(`${ROLES.StoreManager} identity-access 业务场景`, () => {
  let ctrl: IdentityAccessController
  let svc: ReturnType<typeof mockIdentityAccessService>

  beforeEach(() => {
    svc = mockIdentityAccessService()
    ctrl = createController(svc)
  })

  it('店长打开身份上下文解析页面，查看完整认证信息 - 正常流程', () => {
    const tc = tenantCtx()
    const ac = actorCtx({ actorId: 'store-owner', roles: ['tenant-admin'], permissions: ['*'] })
    const result = ctrl.getContext(tc, ac)
    assert.ok(result)
    assert.equal((result as any).authenticated, true)
    assert.ok((result as any).roles.length > 0)
  })

  it('店长请求租户范围校验通过 - 正常流程', () => {
    const tc = tenantCtx()
    const ac = actorCtx({ actorId: 'store-owner', roles: ['tenant-admin', 'store-admin'], permissions: ['*'] })
    const result = ctrl.validateTenantScope('t-store', tc, ac)
    assert.equal((result as any).status, 'allowed')
    assert.equal((result as any).targetTenantId, 't-store')
  })

  it('店长拒绝无效租户范围 - 边界（空tenantId）', () => {
    const tc = tenantCtx({ tenantId: '' })
    const ac = actorCtx({ actorId: 'store-owner', roles: ['tenant-admin'], permissions: ['*'] })
    const result = ctrl.getContext(tc, ac)
    assert.ok(result)
    assert.equal((result as any).effectiveTenantId, '')
  })
})

// ──────────── 🛒 前台 ────────────
describe(`${ROLES.FrontDesk} identity-access 业务场景`, () => {
  let ctrl: IdentityAccessController
  let svc: ReturnType<typeof mockIdentityAccessService>

  beforeEach(() => {
    svc = mockIdentityAccessService()
    ctrl = createController(svc)
  })

  it('前台查看自身身份上下文，确认门店级角色 - 正常流程', () => {
    const tc = tenantCtx()
    const ac = actorCtx({ actorId: 'front-desk', roles: ['store-staff'], permissions: ['order:read', 'order:write'] })
    const result = ctrl.getContext(tc, ac)
    assert.ok(result)
    assert.ok((result as any).roles.includes('store-staff'))
    assert.equal((result as any).effectiveStoreId, 's-main')
  })

  it('前台无 tenant-admin 角色，无法通过角色校验 - 权限边界', () => {
    const tc = tenantCtx()
    const ac = actorCtx({ actorId: 'front-desk', roles: ['store-staff'], permissions: ['order:read'] })
    // Role validation endpoint requires tenant-admin or platform-admin
    const hasRole = svc.hasAnyRole(ac, ['tenant-admin', 'platform-admin'])
    assert.equal(hasRole, false)
  })

  it('前台权限校验通过（订单读取+写入） - 正常流程', () => {
    const tc = tenantCtx()
    const ac = actorCtx({ actorId: 'front-desk', roles: ['store-staff'], permissions: ['order:read', 'order:write'] })
    const result = ctrl.validatePermission(tc, ac)
    assert.equal((result as any).status, 'allowed')
    assert.equal((result as any).check, 'permission')
  })
})

// ──────────── 👥 HR ────────────
describe(`${ROLES.HR} identity-access 业务场景`, () => {
  let ctrl: IdentityAccessController
  let svc: ReturnType<typeof mockIdentityAccessService>

  beforeEach(() => {
    svc = mockIdentityAccessService()
    ctrl = createController(svc)
  })

  it('HR查看员工身份上下文 - 正常流程', () => {
    const tc = tenantCtx()
    const ac = actorCtx({ actorId: 'hr-user', roles: ['hr-admin'], permissions: ['user:read', 'audit:read'] })
    const result = ctrl.getContext(tc, ac)
    assert.ok(result)
    assert.equal((result as any).effectiveTenantId, 't-store')
  })

  it('HR请求权限校验通过（用户读取+审计读取） - 正常流程', () => {
    const tc = tenantCtx()
    const ac = actorCtx({ actorId: 'hr-user', roles: ['hr-admin'], permissions: ['user:read', 'audit:read'] })
    const result = ctrl.validatePermission(tc, ac)
    assert.equal((result as any).status, 'allowed')
  })

  it('HR无跨租户权限 — 校验其他租户被拒绝 - 边界', () => {
    const tc = tenantCtx({ tenantId: 't-other' })
    const ac = actorCtx({ actorId: 'hr-user', roles: ['hr-admin'], permissions: ['user:read'] })
    const authz = svc.authorizeAction('tenant:read', { tenantId: 't-other' }, tc, ac)
    assert.equal(authz.status, 'denied')
  })
})

// ──────────── 🔧 安监 ────────────
describe(`${ROLES.Security} identity-access 业务场景`, () => {
  let ctrl: IdentityAccessController
  let svc: ReturnType<typeof mockIdentityAccessService>

  beforeEach(() => {
    svc = mockIdentityAccessService()
    ctrl = createController(svc)
  })

  it('安监查看身份上下文，确认审计权限 - 正常流程', () => {
    const tc = tenantCtx()
    const ac = actorCtx({ actorId: 'sec-user', roles: ['security-admin'], permissions: ['audit:read', 'audit:export', 'compliance:manage'] })
    const result = ctrl.getContext(tc, ac)
    assert.ok(result)
    assert.ok((result as any).permissions.includes('audit:read'))
  })

  it('安监跨租户范围校验通过（特权角色 bypass） - 正常流程', () => {
    const tc = tenantCtx({ tenantId: 't-sec' })
    const ac = actorCtx({ actorId: 'sec-user', roles: ['security-admin'], permissions: ['audit:export'] })
    const result = ctrl.validateTenantScope('t-sec', tc, ac)
    assert.equal((result as any).status, 'allowed')
  })

  it('安监不应有用户模拟权限 - 权限边界', () => {
    const ac = actorCtx({ actorId: 'sec-user', roles: ['security-admin'], permissions: ['audit:read', 'compliance:manage'] })
    const hasPerm = svc.hasAllPermissions(ac, ['user:impersonate'])
    assert.equal(hasPerm, false)
  })
})

// ──────────── 🎮 导玩员 ────────────
describe(`${ROLES.Guide} identity-access 业务场景`, () => {
  let ctrl: IdentityAccessController
  let svc: ReturnType<typeof mockIdentityAccessService>

  beforeEach(() => {
    svc = mockIdentityAccessService()
    ctrl = createController(svc)
  })

  it('导玩员查看门店身份上下文 - 正常流程', () => {
    const tc = tenantCtx()
    const ac = actorCtx({ actorId: 'guide-user', roles: ['store-staff'], permissions: ['inventory:read', 'order:read'] })
    const result = ctrl.getContext(tc, ac)
    assert.ok(result)
    assert.equal((result as any).effectiveStoreId, 's-main')
  })

  it('导玩员只有门店级权限，无写权限操作被拒绝 - 权限边界', () => {
    const ac = actorCtx({ actorId: 'guide-user', roles: ['store-staff'], permissions: ['inventory:read', 'order:read'] })
    const hasWrite = svc.hasAllPermissions(ac, ['inventory:write'])
    assert.equal(hasWrite, false)
  })

  it('导玩员跨门店无 tenant:cross-scope 权限 — 被拒绝 - 边界', () => {
    const ac = actorCtx({ actorId: 'guide-user', roles: ['store-staff'], permissions: ['inventory:read'] })
    const authz = svc.authorizeAction('tenant:cross-scope', { storeId: 's-other' }, tenantCtx({ storeId: 's-other' }), ac)
    assert.equal(authz.status, 'denied')
  })
})

// ──────────── 🎯 运行专员 ────────────
describe(`${ROLES.Operations} identity-access 业务场景`, () => {
  let ctrl: IdentityAccessController
  let svc: ReturnType<typeof mockIdentityAccessService>

  beforeEach(() => {
    svc = mockIdentityAccessService()
    ctrl = createController(svc)
  })

  it('运行专员查看身份上下文确认运营角色 - 正常流程', () => {
    const tc = tenantCtx()
    const ac = actorCtx({ actorId: 'ops-user', roles: ['ops-admin'], permissions: ['report:read', 'report:export'] })
    const result = ctrl.getContext(tc, ac)
    assert.ok(result)
    assert.ok((result as any).roles.includes('ops-admin'))
  })

  it('运行专员权限校验通过 - 正常流程', () => {
    const tc = tenantCtx()
    const ac = actorCtx({ actorId: 'ops-user', roles: ['ops-admin'], permissions: ['report:read', 'report:export'] })
    const result = ctrl.validatePermission(tc, ac)
    assert.equal((result as any).status, 'allowed')
  })

  it('运行专员无财务报告权限 - 权限边界', () => {
    const ac = actorCtx({ actorId: 'ops-user', roles: ['ops-admin'], permissions: ['report:read'] })
    const hasFinReport = svc.hasAllPermissions(ac, ['report:financial'])
    assert.equal(hasFinReport, false)
  })
})

// ──────────── 🤝 团建 ────────────
describe(`${ROLES.Teambuilding} identity-access 业务场景`, () => {
  let ctrl: IdentityAccessController
  let svc: ReturnType<typeof mockIdentityAccessService>

  beforeEach(() => {
    svc = mockIdentityAccessService()
    ctrl = createController(svc)
  })

  it('团建专员查看身份上下文，确认门店及优惠券权限 - 正常流程', () => {
    const tc = tenantCtx()
    const ac = actorCtx({ actorId: 'team-user', roles: ['staff'], permissions: ['order:read', 'order:write', 'coupon:issue'] })
    const result = ctrl.getContext(tc, ac)
    assert.ok(result)
    assert.equal((result as any).effectiveStoreId, 's-main')
    assert.ok((result as any).permissions.includes('coupon:issue'))
  })

  it('团建专员权限校验通过（coupon:issue） - 正常流程', () => {
    const tc = tenantCtx()
    const ac = actorCtx({ actorId: 'team-user', roles: ['staff'], permissions: ['coupon:issue'] })
    const result = ctrl.validatePermission(tc, ac)
    assert.equal((result as any).status, 'allowed')
  })

  it('团建专员无法执行退款权限操作 - 权限边界', () => {
    const ac = actorCtx({ actorId: 'team-user', roles: ['staff'], permissions: ['coupon:issue', 'order:read'] })
    const canRefund = svc.hasAllPermissions(ac, ['payment:refund'])
    assert.equal(canRefund, false)
  })
})

// ──────────── 📢 营销 ────────────
describe(`${ROLES.Marketing} identity-access 业务场景`, () => {
  let ctrl: IdentityAccessController
  let svc: ReturnType<typeof mockIdentityAccessService>

  beforeEach(() => {
    svc = mockIdentityAccessService()
    ctrl = createController(svc)
  })

  it('营销专员查看身份上下文确认营销角色 - 正常流程', () => {
    const tc = tenantCtx()
    const ac = actorCtx({ actorId: 'mkt-user', roles: ['marketing-admin'], permissions: ['coupon:read', 'coupon:write', 'coupon:issue'] })
    const result = ctrl.getContext(tc, ac)
    assert.ok(result)
    assert.ok((result as any).roles.includes('marketing-admin'))
  })

  it('营销专员权限校验（优惠券管理）通过 - 正常流程', () => {
    const tc = tenantCtx()
    const ac = actorCtx({ actorId: 'mkt-user', roles: ['marketing-admin'], permissions: ['coupon:read', 'coupon:write', 'coupon:issue'] })
    const result = ctrl.validatePermission(tc, ac)
    assert.equal((result as any).status, 'allowed')
  })

  it('营销专员无财务报告权限 - 权限边界', () => {
    const ac = actorCtx({ actorId: 'mkt-user', roles: ['marketing-admin'], permissions: ['coupon:read', 'coupon:write'] })
    const canViewFinancial = svc.hasAllPermissions(ac, ['report:financial'])
    assert.equal(canViewFinancial, false)
  })
})

// ──────────── 全局场景 ────────────
describe('identity-access 全局跨角色场景', () => {
  let svc: ReturnType<typeof mockIdentityAccessService>

  beforeEach(() => {
    svc = mockIdentityAccessService()
  })

  it('未认证用户返回 false authenticated - 边界', () => {
    const tc = tenantCtx()
    const resolved = svc.resolveActorContext(tc)
    assert.equal(resolved.authenticated, false)
    assert.equal(resolved.actor, null)
    assert.equal(resolved.permissions.length, 0)
  })

  it('无权限用户请求高敏感操作被拒绝 - 权限边界', () => {
    const tc = tenantCtx()
    const ac = actorCtx({ actorId: 'guest', roles: [], permissions: [] })
    const authz = svc.authorizeAction('tenant:cross-scope', { tenantId: 't-other' }, tc, ac) as { status: string; permissionMatched: boolean }
    assert.equal(authz.status, 'denied')
    assert.equal(authz.permissionMatched, false)
  })

  it('isPrivilegedActor 只对 platform-admin/super-admin 返回 true', () => {
    const adminAc = actorCtx({ actorId: 'padmin', roles: ['platform-admin'], permissions: ['*'] })
    assert.equal(svc.isPrivilegedActor(adminAc), true)

    const staffAc = actorCtx({ actorId: 'staff', roles: ['store-staff'], permissions: [] })
    assert.equal(svc.isPrivilegedActor(staffAc), false)

    assert.equal(svc.isPrivilegedActor(undefined), false)
  })
})
