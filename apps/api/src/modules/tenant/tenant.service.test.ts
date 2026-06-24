import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { TenantService } from './tenant.service'
import type {
  RequestTenantContext,
  RequestActorContext,
  RequestGovernanceContext
} from './tenant.types'

function makeTenantContext(
  overrides: Partial<RequestTenantContext> = {}
): RequestTenantContext {
  return {
    tenantId: 't-1',
    marketCode: 'cn-mainland',
    ...overrides
  }
}

function makeActorContext(
  overrides: Partial<RequestActorContext> = {}
): RequestActorContext {
  return {
    actorId: 'user-1',
    actorType: 'tenant-user',
    actorName: 'Test User',
    roles: ['admin'],
    permissions: ['read'],
    authenticated: true,
    source: 'headers',
    ...overrides
  }
}

function makeGovernanceContext(
  overrides: Partial<RequestGovernanceContext> = {}
): RequestGovernanceContext {
  return {
    requestId: 'req-1',
    startedAt: Date.now(),
    ...overrides
  }
}

describe('TenantService.resolveTenantContext()', () => {
  const tenantService = new TenantService()

  test('merges actor and tenant contexts correctly', () => {
    const result = tenantService.resolveTenantContext(
      makeTenantContext({ tenantId: 't-1', brandId: undefined, storeId: undefined }),
      makeActorContext({ tenantId: undefined, brandId: 'b-1', storeId: undefined }),
      makeGovernanceContext({ requestId: 'req-1' })
    )

    assert.equal(result.authenticated, true)
    assert.equal(result.effectiveTenantId, 't-1')
    assert.equal(result.effectiveBrandId, 'b-1')
    assert.equal(result.effectiveStoreId, undefined)
    assert.equal(result.effectiveMarketCode, 'cn-mainland')
    assert.ok(result.actor)
    assert.equal(result.actor?.actorId, 'user-1')
    assert.equal(result.actor?.actorType, 'tenant-user')
    assert.deepStrictEqual(result.roles, ['admin'])
    assert.deepStrictEqual(result.permissions, ['read'])
  })

  test('returns null actor when no actor context', () => {
    const result = tenantService.resolveTenantContext(
      makeTenantContext({ tenantId: 't-2', marketCode: 'us-default' }),
      undefined,
      makeGovernanceContext({ requestId: 'req-2' })
    )

    assert.equal(result.authenticated, false)
    assert.equal(result.effectiveTenantId, 't-2')
    assert.equal(result.effectiveMarketCode, 'us-default')
    assert.equal(result.actor, null)
    assert.deepStrictEqual(result.roles, [])
    assert.deepStrictEqual(result.permissions, [])
  })

  test('falls back to default tenant when no tenant info', () => {
    const result = tenantService.resolveTenantContext(
      makeTenantContext({ tenantId: undefined }),
      undefined
    )

    assert.equal(result.effectiveTenantId, 'tenant-demo')
    assert.equal(result.effectiveMarketCode, 'cn-mainland')
  })

  test('falls back to default marketCode when not provided', () => {
    const result = tenantService.resolveTenantContext(
      { tenantId: 't-3' } as RequestTenantContext,
      undefined
    )

    assert.equal(result.effectiveMarketCode, 'default')
  })

  test('actor tenant takes priority over context tenant', () => {
    const result = tenantService.resolveTenantContext(
      makeTenantContext({ tenantId: 't-ctx' }),
      makeActorContext({ tenantId: 't-actor' })
    )

    assert.equal(result.effectiveTenantId, 't-actor')
  })

  test('actor brand and store override tenant context', () => {
    const result = tenantService.resolveTenantContext(
      makeTenantContext({ brandId: 'b-ctx', storeId: 's-ctx' }),
      makeActorContext({ brandId: 'b-actor', storeId: 's-actor' })
    )

    assert.equal(result.effectiveBrandId, 'b-actor')
    assert.equal(result.effectiveStoreId, 's-actor')
  })

  test('actor without roles/permissions defaults to empty arrays', () => {
    const result = tenantService.resolveTenantContext(
      makeTenantContext(),
      makeActorContext({
        roles: undefined as unknown as string[],
        permissions: undefined as unknown as string[]
      })
    )

    assert.deepStrictEqual(result.roles, [])
    assert.deepStrictEqual(result.permissions, [])
  })

  test('actor with tenantId preserves other fields', () => {
    const result = tenantService.resolveTenantContext(
      makeTenantContext(),
      makeActorContext({ tenantId: 't-x', storeId: 's-5' })
    )

    assert.equal(result.effectiveTenantId, 't-x')
    assert.equal(result.effectiveStoreId, 's-5')
    assert.ok(result.actor)
    assert.equal(result.actor?.storeId, 's-5')
  })
})
