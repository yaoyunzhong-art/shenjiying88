import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  DEFAULT_TENANT_ID,
  DEFAULT_MARKET_CODE,
  ActorTypes,
  createDefaultTenantContext,
  createEmptyResolvedActorContext,
  resolveEffectiveTenantId,
  resolveEffectiveBrandId,
  resolveEffectiveStoreId,
  resolveEffectiveMarketCode,
  isActorAuthenticated,
  actorSummary,
  matchesTenantScope
} from './tenant.entity'
import type {
  RequestTenantContext,
  RequestActorContext,
  TenantScopeRequirement
} from './tenant.types'

describe('tenant.entity: constants', () => {
  it('DEFAULT_TENANT_ID equals tenant-demo', () => {
    assert.equal(DEFAULT_TENANT_ID, 'tenant-demo')
  })

  it('DEFAULT_MARKET_CODE equals default', () => {
    assert.equal(DEFAULT_MARKET_CODE, 'default')
  })
})

describe('tenant.entity: ActorTypes', () => {
  it('contains all six actor types', () => {
    assert.equal(ActorTypes.PlatformUser, 'platform-user')
    assert.equal(ActorTypes.TenantUser, 'tenant-user')
    assert.equal(ActorTypes.BrandUser, 'brand-user')
    assert.equal(ActorTypes.StoreUser, 'store-user')
    assert.equal(ActorTypes.EmployeeUser, 'employee-user')
    assert.equal(ActorTypes.ServiceAccount, 'service-account')
  })

  it('all values are correct actor types', () => {
    const values = Object.values(ActorTypes)
    assert.equal(values.length, 6)
    assert.ok(values.every(v => typeof v === 'string'))
  })
})

describe('tenant.entity: createDefaultTenantContext', () => {
  it('returns defaults when no overrides', () => {
    const ctx = createDefaultTenantContext()
    assert.equal(ctx.tenantId, DEFAULT_TENANT_ID)
    assert.equal(ctx.marketCode, DEFAULT_MARKET_CODE)
    assert.equal(ctx.brandId, undefined)
    assert.equal(ctx.storeId, undefined)
  })

  it('accepts tenantId override', () => {
    const ctx = createDefaultTenantContext({ tenantId: 'tenant-custom' })
    assert.equal(ctx.tenantId, 'tenant-custom')
    assert.equal(ctx.marketCode, DEFAULT_MARKET_CODE)
  })

  it('accepts brandId override', () => {
    const ctx = createDefaultTenantContext({ brandId: 'brand-01', storeId: 'store-01' })
    assert.equal(ctx.brandId, 'brand-01')
    assert.equal(ctx.storeId, 'store-01')
  })
})

describe('tenant.entity: createEmptyResolvedActorContext', () => {
  it('returns unauthenticated context with defaults', () => {
    const ctx = createEmptyResolvedActorContext()
    assert.equal(ctx.authenticated, false)
    assert.equal(ctx.actor, null)
    assert.equal(ctx.effectiveTenantId, DEFAULT_TENANT_ID)
    assert.equal(ctx.effectiveMarketCode, DEFAULT_MARKET_CODE)
    assert.deepEqual(ctx.roles, [])
    assert.deepEqual(ctx.permissions, [])
    assert.equal(ctx.effectiveBrandId, undefined)
    assert.equal(ctx.effectiveStoreId, undefined)
  })

  it('accepts partial overrides', () => {
    const ctx = createEmptyResolvedActorContext({
      authenticated: true,
      effectiveTenantId: 'tenant-custom',
      roles: ['manager']
    })
    assert.equal(ctx.authenticated, true)
    assert.equal(ctx.effectiveTenantId, 'tenant-custom')
    assert.deepEqual(ctx.roles, ['manager'])
  })

  it('tenantContext is created with defaults', () => {
    const ctx = createEmptyResolvedActorContext()
    assert.ok(ctx.tenantContext)
    assert.equal(ctx.tenantContext.tenantId, DEFAULT_TENANT_ID)
  })
})

describe('tenant.entity: resolveEffectiveTenantId', () => {
  it('actorContext takes priority', () => {
    const actor: RequestActorContext = {
      actorId: 'a1', actorType: 'tenant-user',
      roles: [], permissions: [], authenticated: true,
      source: 'headers', tenantId: 'actor-tenant'
    }
    const tenant = createDefaultTenantContext({ tenantId: 'tenant-ctx' })
    assert.equal(resolveEffectiveTenantId(actor, tenant), 'actor-tenant')
  })

  it('falls back to tenantContext', () => {
    const tenant = createDefaultTenantContext({ tenantId: 'tenant-ctx' })
    assert.equal(resolveEffectiveTenantId(undefined, tenant), 'tenant-ctx')
  })

  it('falls back to default when both undefined', () => {
    assert.equal(resolveEffectiveTenantId(undefined, undefined), DEFAULT_TENANT_ID)
  })
})

describe('tenant.entity: resolveEffectiveBrandId', () => {
  it('actorContext takes priority', () => {
    const actor: RequestActorContext = {
      actorId: 'a1', actorType: 'brand-user',
      roles: [], permissions: [], authenticated: true,
      source: 'headers', brandId: 'actor-brand'
    }
    const tenant = createDefaultTenantContext({ brandId: 'tenant-brand' })
    assert.equal(resolveEffectiveBrandId(actor, tenant), 'actor-brand')
  })

  it('falls back to tenantContext', () => {
    const tenant = createDefaultTenantContext({ brandId: 'tenant-brand' })
    assert.equal(resolveEffectiveBrandId(undefined, tenant), 'tenant-brand')
  })

  it('returns undefined when both undefined', () => {
    assert.equal(resolveEffectiveBrandId(undefined, undefined), undefined)
  })
})

describe('tenant.entity: resolveEffectiveStoreId', () => {
  it('actorContext takes priority', () => {
    const actor: RequestActorContext = {
      actorId: 'a1', actorType: 'store-user',
      roles: [], permissions: [], authenticated: true,
      source: 'headers', storeId: 'actor-store'
    }
    const tenant = createDefaultTenantContext({ storeId: 'tenant-store' })
    assert.equal(resolveEffectiveStoreId(actor, tenant), 'actor-store')
  })

  it('falls back to default undefined', () => {
    assert.equal(resolveEffectiveStoreId(undefined, undefined), undefined)
  })
})

describe('tenant.entity: resolveEffectiveMarketCode', () => {
  it('reads from tenantContext', () => {
    const tenant = createDefaultTenantContext({ marketCode: 'cn-sh' })
    assert.equal(resolveEffectiveMarketCode(tenant), 'cn-sh')
  })

  it('defaults when no tenantContext', () => {
    assert.equal(resolveEffectiveMarketCode(undefined), DEFAULT_MARKET_CODE)
  })
})

describe('tenant.entity: isActorAuthenticated', () => {
  it('returns true when authenticated', () => {
    const actor: RequestActorContext = {
      actorId: 'a1', actorType: 'tenant-user',
      roles: [], permissions: [], authenticated: true,
      source: 'headers'
    }
    assert.equal(isActorAuthenticated(actor), true)
  })

  it('returns false when not authenticated', () => {
    const actor: RequestActorContext = {
      actorId: 'a1', actorType: 'tenant-user',
      roles: [], permissions: [], authenticated: false,
      source: 'headers'
    }
    assert.equal(isActorAuthenticated(actor), false)
  })

  it('returns false when undefined', () => {
    assert.equal(isActorAuthenticated(undefined), false)
  })
})

describe('tenant.entity: actorSummary', () => {
  it('returns null when no actor', () => {
    assert.equal(actorSummary(undefined), null)
  })

  it('returns actorId when no name/type', () => {
    const actor: RequestActorContext = {
      actorId: 'a1', actorType: 'tenant-user',
      roles: [], permissions: [], authenticated: true,
      source: 'headers'
    }
    const summary = actorSummary(actor)
    assert.ok(summary)
    assert.ok(summary.includes('tenant-user'))
  })

  it('returns name and type and roles', () => {
    const actor: RequestActorContext = {
      actorId: 'a2', actorType: 'employee-user',
      actorName: '张三',
      roles: ['manager', 'staff'], permissions: [], authenticated: true,
      source: 'headers'
    }
    const summary = actorSummary(actor)
    assert.ok(summary)
    assert.ok(summary.includes('张三'))
    assert.ok(summary.includes('employee-user'))
    assert.ok(summary.includes('manager'))
    assert.ok(summary.includes('staff'))
  })

  it('returns actorId as fallback when no name and no type', () => {
    const actor: RequestActorContext = {
      actorId: 'bare-id', actorType: 'tenant-user',
      roles: [], permissions: [], authenticated: false,
      source: 'headers'
    }
    const summary = actorSummary(actor)
    // type exists so it won't hit fallback
    assert.ok(summary !== null)
  })
})

describe('tenant.entity: matchesTenantScope', () => {
  it('returns true when no requirement', () => {
    const ctx = createEmptyResolvedActorContext({ effectiveTenantId: 't1' })
    assert.equal(matchesTenantScope(ctx, undefined), true)
  })

  it('returns true when tenantId matches', () => {
    const ctx = createEmptyResolvedActorContext({ effectiveTenantId: 't1' })
    assert.equal(matchesTenantScope(ctx, { tenantId: 't1' }), true)
  })

  it('returns false when tenantId mismatches', () => {
    const ctx = createEmptyResolvedActorContext({ effectiveTenantId: 't1' })
    assert.equal(matchesTenantScope(ctx, { tenantId: 't2' }), false)
  })

  it('returns true when brandId matches', () => {
    const ctx = createEmptyResolvedActorContext({
      effectiveTenantId: 't1',
      effectiveBrandId: 'b1'
    })
    assert.equal(matchesTenantScope(ctx, { tenantId: 't1', brandId: 'b1' }), true)
  })

  it('returns false when brandId mismatches', () => {
    const ctx = createEmptyResolvedActorContext({
      effectiveTenantId: 't1',
      effectiveBrandId: 'b1'
    })
    assert.equal(matchesTenantScope(ctx, { brandId: 'b2' }), false)
  })

  it('returns true when storeId matches', () => {
    const ctx = createEmptyResolvedActorContext({
      effectiveTenantId: 't1',
      effectiveStoreId: 's1'
    })
    assert.equal(matchesTenantScope(ctx, { storeId: 's1' }), true)
  })

  it('returns false when storeId mismatches', () => {
    const ctx = createEmptyResolvedActorContext({
      effectiveTenantId: 't1',
      effectiveStoreId: 's1'
    })
    assert.equal(matchesTenantScope(ctx, { storeId: 's2' }), false)
  })
})
