import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { IdentityAccessService } from './identity-access.service'

const makeActor = (overrides: Record<string, any> = {}): any => ({
  actorId: 'actor-1',
  actorType: 'tenant-user' as const,
  source: 'headers' as const,
  roles: ['tenant-admin'],
  permissions: ['tenant:read', 'identity-access:read'],
  authenticated: true,
  ...overrides,
})

const makeTenant = (overrides: Record<string, any> = {}) => ({
  tenantId: 'tenant-1',
  brandId: 'brand-1',
  storeId: 'store-1',
  ...overrides,
})

describe('IdentityAccessService', () => {
  const service = new IdentityAccessService()

  describe('resolveActorContext', () => {
    test('returns unauthenticated context when actorContext is undefined', () => {
      const result = service.resolveActorContext(makeTenant(), undefined)
      assert.equal(result.authenticated, false)
      assert.equal(result.actor, null)
      assert.equal(result.effectiveTenantId, 'tenant-1')
    })

    test('returns authenticated context with actor details', () => {
      const actor = makeActor()
      const tenant = makeTenant()
      const result = service.resolveActorContext(tenant, actor)

      assert.equal(result.authenticated, true)
      assert.deepEqual(result.actor, { ...actor, roles: ['tenant-admin'], permissions: ['tenant:read', 'identity-access:read'], authenticated: true })
      assert.equal(result.effectiveTenantId, actor.tenantId ?? tenant.tenantId)
      assert.equal(result.effectiveBrandId, actor.brandId ?? tenant.brandId)
    })

    test('normalizes roles and permissions deduplication', () => {
      const actor = makeActor({
        roles: ['admin', 'admin', ' user '],
        permissions: ['read', 'read', ''],
      })
      const result = service.resolveActorContext(makeTenant(), actor)
      assert.deepEqual(result.roles, ['admin', 'user'] as any)
      assert.deepEqual(result.permissions, ['read'] as any)
    })

    test('uses actor tenantId/brandId over tenant context when set', () => {
      const actor = makeActor({ tenantId: 'actor-tenant', brandId: 'actor-brand' })
      const tenant = makeTenant({ tenantId: 'ctx-tenant', brandId: 'ctx-brand' })
      const result = service.resolveActorContext(tenant, actor)

      assert.equal(result.effectiveTenantId, 'actor-tenant')
      assert.equal(result.effectiveBrandId, 'actor-brand')
    })

    test('defaults authenticated to true when not explicitly false', () => {
      const actor = makeActor()
      delete (actor as any).authenticated
      const result = service.resolveActorContext(makeTenant(), actor)
      assert.equal(result.authenticated, true)
    })
  })

  describe('hasAnyRole', () => {
    test('returns true when no roles required', () => {
      assert.equal(service.hasAnyRole(makeActor(), []), true)
    })

    test('returns false when actor is undefined', () => {
      assert.equal(service.hasAnyRole(undefined, ['admin']), false)
    })

    test('returns true when actor has matching role', () => {
      assert.equal(service.hasAnyRole(makeActor({ roles: ['tenant-admin', 'editor'] }), ['tenant-admin']), true)
    })

    test('returns false when actor lacks required roles', () => {
      assert.equal(service.hasAnyRole(makeActor({ roles: ['editor'] }), ['tenant-admin']), false)
    })
  })

  describe('hasAllPermissions', () => {
    test('returns true when no permissions required', () => {
      assert.equal(service.hasAllPermissions(makeActor(), []), true)
    })

    test('returns false when actor is undefined', () => {
      assert.equal(service.hasAllPermissions(undefined, ['read']), false)
    })

    test('returns true when actor has all required permissions', () => {
      assert.equal(service.hasAllPermissions(makeActor({ permissions: ['tenant:read', 'identity-access:read'] }), ['tenant:read', 'identity-access:read']), true)
    })

    test('returns false when actor misses a permission', () => {
      assert.equal(service.hasAllPermissions(makeActor({ permissions: ['tenant:read'] }), ['tenant:read', 'identity-access:read']), false)
    })

    test('wildcard permission satisfies any requirement', () => {
      assert.equal(service.hasAllPermissions(makeActor({ permissions: ['*'] }), ['anything:action']), true)
    })
  })

  describe('isPrivilegedActor', () => {
    test('returns false for undefined actor', () => {
      assert.equal(service.isPrivilegedActor(undefined), false)
    })

    test('returns true for platform-admin role', () => {
      assert.equal(service.isPrivilegedActor(makeActor({ roles: ['platform-admin'] })), true)
    })

    test('returns true for super-admin role', () => {
      assert.equal(service.isPrivilegedActor(makeActor({ roles: ['super-admin'] })), true)
    })

    test('returns true for cross-scope permission', () => {
      assert.equal(service.isPrivilegedActor(makeActor({ permissions: ['tenant:cross-scope'] })), true)
    })

    test('returns false for regular actor', () => {
      assert.equal(service.isPrivilegedActor(makeActor({ roles: ['tenant-admin'], permissions: ['tenant:read'] })), false)
    })
  })

  describe('validateTenantScope', () => {
    test('returns true for privileged actor regardless of scope', () => {
      const actor = makeActor({ roles: ['platform-admin'] })
      const result = service.validateTenantScope(makeTenant(), actor, { tenantId: 'other-tenant' })
      assert.equal(result, true)
    })

    test('returns true when tenantId matches', () => {
      const actor = makeActor()
      const result = service.validateTenantScope(makeTenant({ tenantId: 'tenant-1' }), actor, { tenantId: 'tenant-1' })
      assert.equal(result, true)
    })

    test('returns false when tenantId mismatches for non-privileged actor', () => {
      const actor = makeActor({ roles: ['editor'] })
      const result = service.validateTenantScope(makeTenant({ tenantId: 'tenant-1' }), actor, { tenantId: 'tenant-2' })
      assert.equal(result, false)
    })

    test('skips brandId/tenantId checks when not in requiredScope', () => {
      const actor = makeActor()
      const result = service.validateTenantScope(makeTenant(), actor, {})
      assert.equal(result, true)
    })
  })

  describe('authorizeAction', () => {
    test('returns allowed when both permission and scope match', () => {
      const actor = makeActor({ permissions: ['identity-access:read'] })
      const tenant = makeTenant()
      const result = service.authorizeAction('identity-access:read', { tenantId: 'tenant-1' }, tenant, actor)

      assert.equal(result.status, 'allowed')
      assert.equal(result.permissionMatched, true)
      assert.equal(result.tenantScopeMatched, true)
    })

    test('returns denied when permission missing', () => {
      const actor = makeActor({ permissions: [] })
      const tenant = makeTenant()
      const result = service.authorizeAction('identity-access:read', { tenantId: 'tenant-1' }, tenant, actor)

      assert.equal(result.status, 'denied')
      assert.equal(result.permissionMatched, false)
    })

    test('returns allowed when no tenantContext provided (non-tenant actions)', () => {
      const actor = makeActor({ permissions: ['identity-access:read'] })
      const result = service.authorizeAction('identity-access:read', {}, undefined, actor)

      assert.equal(result.status, 'allowed')
      assert.equal(result.tenantScopeMatched, true)
    })

    test('includes enforcedBy metadata in decision', () => {
      const actor = makeActor({ permissions: ['identity-access:read'] })
      const tenant = makeTenant()
      const result = service.authorizeAction('identity-access:read', { tenantId: 'tenant-1' }, tenant, actor)

      assert.ok(Array.isArray(result.enforcedBy))
      assert.ok(result.enforcedBy.includes('IdentityAccessGuard'))
    })
  })

  describe('getDescriptor', () => {
    test('returns foundation module descriptor with correct key', () => {
      const descriptor = service.getDescriptor()!
      assert.equal(descriptor.key, 'identity-access')
      assert.equal(descriptor.capabilities.length >= 3, true)
      assert.equal(descriptor.capabilities[0]!.status, 'active')
    })
  })
})
