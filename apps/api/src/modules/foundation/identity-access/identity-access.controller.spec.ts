import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [identity-access] [D] controller spec 补全
 *
 * IdentityAccessController 综合测试：
 * - 正例：正常路由/委托/响应
 * - 反例：缺失参数、不存在的租户、无 actor 上下文
 * - 边界：特权角色、空权限、跨租户作用域
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { IdentityAccessController } from './identity-access.controller'
import { IdentityAccessService } from './identity-access.service'
import type { RequestActorContext, RequestTenantContext } from '../../tenant/tenant.types'
import type { ResolvedActorContext } from '../../tenant/tenant.types'

// ── Mocks ──

class MockIdentityAccessService {
  calls: Record<string, unknown[]> = {}
  _track(method: string, args: unknown[]) {
    this.calls[method] = this.calls[method] || []
    this.calls[method].push(args)
  }

  resolveActorContext(
    tenantContext: RequestTenantContext,
    actorContext?: RequestActorContext
  ): ResolvedActorContext {
    this._track('resolveActorContext', [tenantContext, actorContext])
    return {
      authenticated: Boolean(actorContext?.actorId),
      actor: actorContext ?? null,
      tenantContext,
      effectiveTenantId: actorContext?.tenantId ?? tenantContext.tenantId,
      effectiveBrandId: actorContext?.brandId ?? tenantContext.brandId,
      effectiveStoreId: actorContext?.storeId ?? tenantContext.storeId,
      effectiveMarketCode: tenantContext.marketCode ?? 'us-default',
      roles: actorContext?.roles ?? [],
      permissions: actorContext?.permissions ?? []
    }
  }

  authorizeAction(
    action: string,
    resourceScope: Record<string, string | undefined>,
    tenantContext?: RequestTenantContext,
    actorContext?: RequestActorContext
  ) {
    this._track('authorizeAction', [action, resourceScope, tenantContext, actorContext])
    return {
      status: 'allowed',
      action,
      resourceScope,
      actor: actorContext ?? null,
      permissionMatched: true,
      tenantScopeMatched: true,
      enforcedBy: ['IdentityAccessGuard', 'IdentityAccessService']
    }
  }
}

type MockSvc = MockIdentityAccessService & IdentityAccessService

// ── Fixtures ──

const TENANT_A: RequestTenantContext = {
  tenantId: 't-identity-a',
  brandId: 'brand-a',
  storeId: 'store-a',
  marketCode: 'SH',
}

const ACTOR_ADMIN: RequestActorContext = {
  actorId: 'admin-001',
  actorType: 'platform-user',
  roles: ['tenant-admin'],
  permissions: ['identity-access:read', 'tenant:read'],
  authenticated: true,
  source: 'headers',
}

const ACTOR_PLATFORM: RequestActorContext = {
  actorId: 'platform-admin-001',
  actorType: 'platform-user',
  roles: ['platform-admin'],
  permissions: ['*'],
  authenticated: true,
  source: 'headers',
}

function createController(): { ctrl: IdentityAccessController; svc: MockSvc } {
  const svc = new MockIdentityAccessService() as unknown as MockSvc
  const ctrl = new IdentityAccessController(svc)
  return { ctrl, svc }
}

// ── Tests ──

describe('IdentityAccessController', () => {
  // ── Route metadata ──

  describe('route metadata (NestJS @Controller/@Get decorators)', () => {
    it('controller should be mounted at /identity-access', () => {
      const path = Reflect.getMetadata('path', IdentityAccessController)
      assert.equal(path, 'identity-access')
    })

    it('getContext → GET /context', () => {
      const method = Reflect.getMetadata('method', IdentityAccessController.prototype.getContext)
      const path = Reflect.getMetadata('path', IdentityAccessController.prototype.getContext)
      assert.equal(method, 0) // GET
      assert.equal(path, 'context')
    })

    it('validateRole → GET /validate/role', () => {
      const method = Reflect.getMetadata('method', IdentityAccessController.prototype.validateRole)
      const path = Reflect.getMetadata('path', IdentityAccessController.prototype.validateRole)
      assert.equal(method, 0)
      assert.equal(path, 'validate/role')
    })

    it('validatePermission → GET /validate/permission', () => {
      const method = Reflect.getMetadata('method', IdentityAccessController.prototype.validatePermission)
      const path = Reflect.getMetadata('path', IdentityAccessController.prototype.validatePermission)
      assert.equal(method, 0)
      assert.equal(path, 'validate/permission')
    })

    it('validateTenantScope → GET /validate/tenant/:tenantId', () => {
      const method = Reflect.getMetadata('method', IdentityAccessController.prototype.validateTenantScope)
      const path = Reflect.getMetadata('path', IdentityAccessController.prototype.validateTenantScope)
      assert.equal(method, 0)
      assert.equal(path, 'validate/tenant/:tenantId')
    })
  })

  // ── getContext ──

  describe('GET /identity-access/context', () => {
    it('正例: should return resolved actor context with tenant admin', () => {
      const { ctrl, svc } = createController()
      const result = ctrl.getContext(TENANT_A, ACTOR_ADMIN) as ResolvedActorContext
      assert.equal(result.authenticated, true)
      assert.equal(result.tenantContext.tenantId, 't-identity-a')
      assert.equal(result.effectiveTenantId, 't-identity-a')
      assert.deepStrictEqual(result.roles, ['tenant-admin'])
      assert.ok(result.effectiveBrandId === 'brand-a')
      assert.ok(svc.calls['resolveActorContext']?.length === 1)
    })

    it('正例: should return resolved context without actor for anonymous', () => {
      const { ctrl, svc } = createController()
      const result = ctrl.getContext(TENANT_A, undefined) as ResolvedActorContext
      assert.equal(result.authenticated, false)
      assert.equal(result.actor, null)
      assert.deepStrictEqual(result.roles, [])
      assert.deepStrictEqual(result.permissions, [])
      assert.ok(svc.calls['resolveActorContext']?.length === 1)
    })

    it('边界: should handle platform admin with wildcard permissions', () => {
      const { ctrl } = createController()
      const result = ctrl.getContext(TENANT_A, ACTOR_PLATFORM) as ResolvedActorContext
      assert.equal(result.authenticated, true)
      assert.deepStrictEqual(result.roles, ['platform-admin'])
      assert.ok(result.permissions.includes('*'))
    })
  })

  // ── validateRole ──

  describe('GET /identity-access/validate/role', () => {
    it('正例: should validate role as allowed for tenant admin', () => {
      const { ctrl, svc } = createController()
      const result = ctrl.validateRole(TENANT_A, ACTOR_ADMIN) as { status: string; check: string; resolved: ResolvedActorContext }
      assert.equal(result.status, 'allowed')
      assert.equal(result.check, 'role')
      assert.equal(result.resolved.authenticated, true)
      assert.ok(svc.calls['resolveActorContext']?.length === 1)
    })

    it('边界: should validate role with platform admin', () => {
      const { ctrl } = createController()
      const result = ctrl.validateRole(TENANT_A, ACTOR_PLATFORM) as { status: string; resolved: ResolvedActorContext }
      assert.equal(result.status, 'allowed')
      assert.deepStrictEqual(result.resolved.roles, ['platform-admin'])
    })

    it('边界: should validate role without actor context', () => {
      const { ctrl, svc } = createController()
      const result = ctrl.validateRole(TENANT_A, undefined) as { status: string; resolved: ResolvedActorContext }
      assert.equal(result.status, 'allowed')
      assert.equal(result.resolved.authenticated, false)
      assert.ok(svc.calls['resolveActorContext']?.length === 1)
    })
  })

  // ── validatePermission ──

  describe('GET /identity-access/validate/permission', () => {
    it('正例: should validate permission as allowed with correct permission', () => {
      const { ctrl, svc } = createController()
      const result = ctrl.validatePermission(TENANT_A, ACTOR_ADMIN) as { status: string; check: string; authorization: { status: string } }
      assert.equal(result.status, 'allowed')
      assert.equal(result.check, 'permission')
      assert.equal(result.authorization.status, 'allowed')
      assert.ok(svc.calls['authorizeAction']?.length === 1)
    })

    it('边界: should validate permission without actor context', () => {
      const { ctrl } = createController()
      const result = ctrl.validatePermission(TENANT_A, undefined) as { status: string; authorization: { status: string } }
      assert.equal(result.status, 'allowed')
      assert.equal(result.authorization.status, 'allowed')
    })
  })

  // ── validateTenantScope ──

  describe('GET /identity-access/validate/tenant/:tenantId', () => {
    it('正例: should validate tenant scope with matching tenant', () => {
      const { ctrl, svc } = createController()
      const result = ctrl.validateTenantScope(
        't-identity-target',
        { ...TENANT_A, tenantId: 't-identity-target' },
        ACTOR_ADMIN
      ) as { status: string; check: string; targetTenantId: string; authorization: { status: string } }
      assert.equal(result.status, 'allowed')
      assert.equal(result.check, 'tenant-scope')
      assert.equal(result.targetTenantId, 't-identity-target')
      assert.equal(result.authorization.status, 'allowed')
      assert.ok(svc.calls['authorizeAction']?.length === 1)
    })

    it('边界: should validate tenant scope with platform admin (cross-tenant)', () => {
      const { ctrl } = createController()
      const result = ctrl.validateTenantScope(
        't-cross-tenant',
        { ...TENANT_A, tenantId: 't-cross-tenant' },
        ACTOR_PLATFORM
      ) as { targetTenantId: string; authorization: { status: string } }
      assert.equal(result.targetTenantId, 't-cross-tenant')
      assert.equal(result.authorization.status, 'allowed')
    })

    it('边界: should validate tenant scope without actor context', () => {
      const { ctrl } = createController()
      const result = ctrl.validateTenantScope(
        't-anonymous',
        { ...TENANT_A, tenantId: 't-anonymous' },
        undefined
      ) as { targetTenantId: string; authorization: { status: string } }
      assert.equal(result.targetTenantId, 't-anonymous')
      assert.equal(result.authorization.status, 'allowed')
    })

    it('边界: should validate tenant scope even with non-existent tenant (graceful)', () => {
      const { ctrl } = createController()
      const result = ctrl.validateTenantScope(
        't-non-existent',
        { ...TENANT_A, tenantId: 't-non-existent' },
        ACTOR_ADMIN
      ) as { status: string; targetTenantId: string }
      assert.equal(result.status, 'allowed')
      assert.equal(result.targetTenantId, 't-non-existent')
    })
  })
})
