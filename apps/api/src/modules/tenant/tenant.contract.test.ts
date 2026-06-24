import assert from 'node:assert/strict'
import test from 'node:test'
import {
  toTenantResolveContract,
  toTenantContextContract,
  toTenantActorContract,
  toTenantScopeCheckContract,
  toTenantControllerResponseToContract
} from './tenant.contract'
import type {
  ResolvedActorContext,
  RequestActorContext,
  RequestTenantContext
} from './tenant.types'

/* ------------------------------------------------------------------ */
/*  toTenantResolveContract                                             */
/* ------------------------------------------------------------------ */

test('toTenantResolveContract maps full context with actor', () => {
  const ctx: ResolvedActorContext = {
    authenticated: true,
    actor: {
      actorId: 'user-001',
      actorType: 'tenant-user',
      actorName: '张三',
      tenantId: 'tenant-abc',
      roles: ['STORE_MANAGER'],
      permissions: ['cashier.read', 'member.read'],
      authenticated: true,
      source: 'headers'
    },
    tenantContext: {
      tenantId: 'tenant-abc',
      brandId: 'brand-xyz',
      marketCode: 'zh-CN'
    },
    effectiveTenantId: 'tenant-abc',
    effectiveBrandId: 'brand-xyz',
    effectiveStoreId: 'store-001',
    effectiveMarketCode: 'zh-CN',
    roles: ['STORE_MANAGER'],
    permissions: ['cashier.read', 'member.read']
  }

  const contract = toTenantResolveContract(ctx)

  assert.equal(contract.effectiveTenantId, 'tenant-abc')
  assert.equal(contract.effectiveBrandId, 'brand-xyz')
  assert.equal(contract.effectiveStoreId, 'store-001')
  assert.equal(contract.effectiveMarketCode, 'zh-CN')
  assert.equal(contract.source, 'tenant-module')
  assert.ok(contract.actor)
  assert.equal(contract.actor!.actorId, 'user-001')
  assert.equal(contract.actor!.actorType, 'tenant-user')
  assert.equal(contract.actor!.actorName, '张三')
  assert.deepStrictEqual(contract.actor!.roles, ['STORE_MANAGER'])
  assert.deepStrictEqual(contract.actor!.permissions, ['cashier.read', 'member.read'])
  assert.equal(contract.actor!.authenticated, true)
  assert.equal(contract.actor!.source, 'headers')
})

test('toTenantResolveContract maps context with null actor (unauthenticated)', () => {
  const ctx: ResolvedActorContext = {
    authenticated: false,
    actor: null,
    tenantContext: {
      tenantId: 'tenant-demo',
      marketCode: 'default'
    },
    effectiveTenantId: 'tenant-demo',
    effectiveMarketCode: 'default',
    roles: [],
    permissions: []
  }

  const contract = toTenantResolveContract(ctx)

  assert.equal(contract.effectiveTenantId, 'tenant-demo')
  assert.equal(contract.actor, null)
  assert.equal(contract.source, 'tenant-module')
  assert.equal(contract.effectiveBrandId, undefined)
  assert.equal(contract.effectiveStoreId, undefined)
})

test('toTenantResolveContract maps actor without name', () => {
  const ctx: ResolvedActorContext = {
    authenticated: true,
    actor: {
      actorId: 'svc-001',
      actorType: 'service-account',
      roles: ['SYSTEM'],
      permissions: ['health.read'],
      authenticated: true,
      source: 'headers'
    },
    tenantContext: {
      tenantId: 'tenant-svc',
      marketCode: 'en-US'
    },
    effectiveTenantId: 'tenant-svc',
    effectiveMarketCode: 'en-US',
    roles: ['SYSTEM'],
    permissions: ['health.read']
  }

  const contract = toTenantResolveContract(ctx)

  assert.ok(contract.actor)
  assert.equal(contract.actor!.actorName, undefined)
  assert.equal(contract.actor!.actorId, 'svc-001')
  assert.equal(contract.actor!.actorType, 'service-account')
})

/* ------------------------------------------------------------------ */
/*  toTenantContextContract                                             */
/* ------------------------------------------------------------------ */

test('toTenantContextContract maps full tenant context', () => {
  const ctx: RequestTenantContext = {
    tenantId: 'tenant-001',
    brandId: 'brand-001',
    storeId: 'store-001',
    marketCode: 'zh-CN'
  }

  const contract = toTenantContextContract(ctx)

  assert.equal(contract.tenantId, 'tenant-001')
  assert.equal(contract.brandId, 'brand-001')
  assert.equal(contract.storeId, 'store-001')
  assert.equal(contract.marketCode, 'zh-CN')
})

test('toTenantContextContract maps minimal tenant context', () => {
  const ctx: RequestTenantContext = {
    tenantId: 'tenant-min',
    marketCode: 'default'
  }

  const contract = toTenantContextContract(ctx)

  assert.equal(contract.tenantId, 'tenant-min')
  assert.equal(contract.marketCode, 'default')
  assert.equal(contract.brandId, undefined)
  assert.equal(contract.storeId, undefined)
})

/* ------------------------------------------------------------------ */
/*  toTenantActorContract                                               */
/* ------------------------------------------------------------------ */

test('toTenantActorContract maps valid actor', () => {
  const actor: RequestActorContext = {
    actorId: 'emp-001',
    actorType: 'employee-user',
    actorName: '李四',
    tenantId: 'tenant-abc',
    brandId: 'brand-xyz',
    storeId: 'store-001',
    roles: ['GUIDE', 'CASHIER'],
    permissions: ['game.read', 'cashier.write'],
    authenticated: true,
    source: 'headers'
  }

  const contract = toTenantActorContract(actor)

  assert.ok(contract)
  assert.equal(contract!.actorId, 'emp-001')
  assert.equal(contract!.actorType, 'employee-user')
  assert.equal(contract!.actorName, '李四')
  assert.deepStrictEqual(contract!.roles, ['GUIDE', 'CASHIER'])
  assert.deepStrictEqual(contract!.permissions, ['game.read', 'cashier.write'])
  assert.equal(contract!.authenticated, true)
  assert.equal(contract!.source, 'headers')
})

test('toTenantActorContract returns null for null input', () => {
  const contract = toTenantActorContract(null)
  assert.equal(contract, null)
})

test('toTenantActorContract handles actor with empty roles/permissions', () => {
  const actor: RequestActorContext = {
    actorId: 'guest-001',
    actorType: 'platform-user',
    roles: [],
    permissions: [],
    authenticated: false,
    source: 'headers'
  }

  const contract = toTenantActorContract(actor)

  assert.ok(contract)
  assert.equal(contract!.actorId, 'guest-001')
  assert.deepStrictEqual(contract!.roles, [])
  assert.deepStrictEqual(contract!.permissions, [])
  assert.equal(contract!.authenticated, false)
})

test('toTenantActorContract strips internal fields (tenantId/brandId/storeId)', () => {
  const actor: RequestActorContext = {
    actorId: 'emp-002',
    actorType: 'store-user',
    actorName: '王五',
    tenantId: 'sensitive-tenant',
    brandId: 'sensitive-brand',
    storeId: 'sensitive-store',
    roles: ['CASHIER'],
    permissions: ['receipt.write'],
    authenticated: true,
    source: 'headers'
  }

  const contract = toTenantActorContract(actor)

  // Contract must not expose tenantId/brandId/storeId
  const keys = Object.keys(contract!).sort()
  assert.deepStrictEqual(keys, [
    'actorId',
    'actorName',
    'actorType',
    'authenticated',
    'permissions',
    'roles',
    'source'
  ])
})

/* ------------------------------------------------------------------ */
/*  toTenantScopeCheckContract                                          */
/* ------------------------------------------------------------------ */

test('toTenantScopeCheckContract matches all requirements', () => {
  const ctx: ResolvedActorContext = {
    authenticated: true,
    actor: null,
    tenantContext: { tenantId: 'tenant-abc', marketCode: 'zh-CN' },
    effectiveTenantId: 'tenant-abc',
    effectiveBrandId: 'brand-xyz',
    effectiveStoreId: 'store-001',
    effectiveMarketCode: 'zh-CN',
    roles: [],
    permissions: []
  }

  const contract = toTenantScopeCheckContract(
    ctx,
    'tenant-abc',
    'brand-xyz',
    'store-001'
  )

  assert.equal(contract.matches, true)
  assert.equal(contract.requiredTenantId, 'tenant-abc')
  assert.equal(contract.requiredBrandId, 'brand-xyz')
  assert.equal(contract.requiredStoreId, 'store-001')
})

test('toTenantScopeCheckContract mismatches on tenant', () => {
  const ctx: ResolvedActorContext = {
    authenticated: true,
    actor: null,
    tenantContext: { tenantId: 'tenant-abc', marketCode: 'zh-CN' },
    effectiveTenantId: 'tenant-abc',
    effectiveBrandId: 'brand-xyz',
    effectiveStoreId: 'store-001',
    effectiveMarketCode: 'zh-CN',
    roles: [],
    permissions: []
  }

  const contract = toTenantScopeCheckContract(ctx, 'tenant-xyz')

  assert.equal(contract.matches, false)
})

test('toTenantScopeCheckContract mismatches on brand', () => {
  const ctx: ResolvedActorContext = {
    authenticated: true,
    actor: null,
    tenantContext: { tenantId: 'tenant-abc', marketCode: 'zh-CN' },
    effectiveTenantId: 'tenant-abc',
    effectiveBrandId: 'brand-xyz',
    effectiveStoreId: 'store-001',
    effectiveMarketCode: 'zh-CN',
    roles: [],
    permissions: []
  }

  const contract = toTenantScopeCheckContract(ctx, undefined, 'brand-other')

  assert.equal(contract.matches, false)
})

test('toTenantScopeCheckContract mismatches on store', () => {
  const ctx: ResolvedActorContext = {
    authenticated: true,
    actor: null,
    tenantContext: { tenantId: 'tenant-abc', marketCode: 'zh-CN' },
    effectiveTenantId: 'tenant-abc',
    effectiveBrandId: 'brand-xyz',
    effectiveStoreId: 'store-001',
    effectiveMarketCode: 'zh-CN',
    roles: [],
    permissions: []
  }

  const contract = toTenantScopeCheckContract(
    ctx,
    undefined,
    undefined,
    'store-999'
  )

  assert.equal(contract.matches, false)
})

test('toTenantScopeCheckContract matches with partial requirements', () => {
  const ctx: ResolvedActorContext = {
    authenticated: true,
    actor: null,
    tenantContext: { tenantId: 'tenant-abc', marketCode: 'zh-CN' },
    effectiveTenantId: 'tenant-abc',
    effectiveBrandId: 'brand-xyz',
    effectiveStoreId: undefined,
    effectiveMarketCode: 'zh-CN',
    roles: [],
    permissions: []
  }

  // Only require tenant, no brand/store check
  const contract = toTenantScopeCheckContract(ctx, 'tenant-abc')

  assert.equal(contract.matches, true)
})

test('toTenantScopeCheckContract with no requirements always matches', () => {
  const ctx: ResolvedActorContext = {
    authenticated: true,
    actor: null,
    tenantContext: { tenantId: 'tenant-abc', marketCode: 'zh-CN' },
    effectiveTenantId: 'tenant-abc',
    effectiveBrandId: 'brand-xyz',
    effectiveStoreId: 'store-001',
    effectiveMarketCode: 'zh-CN',
    roles: [],
    permissions: []
  }

  const contract = toTenantScopeCheckContract(ctx)

  assert.equal(contract.matches, true)
  assert.equal(contract.requiredTenantId, undefined)
  assert.equal(contract.requiredBrandId, undefined)
  assert.equal(contract.requiredStoreId, undefined)
})

/* ------------------------------------------------------------------ */
/*  toTenantControllerResponseToContract                                */
/* ------------------------------------------------------------------ */

test('toTenantControllerResponseToContract maps controller response', () => {
  const response = {
    requestId: 'req-001',
    effectiveTenantId: 'tenant-abc',
    effectiveBrandId: 'brand-xyz',
    effectiveStoreId: 'store-001',
    effectiveMarketCode: 'zh-CN',
    actor: {
      actorId: 'user-001',
      actorType: 'tenant-user' as const,
      actorName: '张三',
      roles: ['STORE_MANAGER'],
      permissions: ['cashier.read'],
      authenticated: true,
      source: 'headers' as const
    },
    source: 'tenant-module'
  }

  const contract = toTenantControllerResponseToContract(response)

  assert.equal(contract.requestId, 'req-001')
  assert.equal(contract.effectiveTenantId, 'tenant-abc')
  assert.equal(contract.source, 'tenant-module')
  assert.ok(contract.actor)
  assert.equal(contract.actor!.actorId, 'user-001')
})

test('toTenantControllerResponseToContract maps response with null actor', () => {
  const response = {
    requestId: 'req-002',
    effectiveTenantId: 'tenant-demo',
    effectiveBrandId: undefined,
    effectiveStoreId: undefined,
    effectiveMarketCode: 'default',
    actor: null,
    source: 'tenant-module'
  }

  const contract = toTenantControllerResponseToContract(response)

  assert.equal(contract.requestId, 'req-002')
  assert.equal(contract.actor, null)
  assert.equal(contract.effectiveTenantId, 'tenant-demo')
})

test('toTenantControllerResponseToContract defaults source when missing', () => {
  const response = {
    effectiveTenantId: 'tenant-abc',
    actor: null
  }

  const contract = toTenantControllerResponseToContract(response)

  assert.equal(contract.source, 'tenant-module')
  assert.equal(contract.effectiveTenantId, 'tenant-abc')
})

/* ------------------------------------------------------------------ */
/*  Contract type structural conformance                               */
/* ------------------------------------------------------------------ */

test('TenantResolveContract fields match expected shape', () => {
  const ctx: ResolvedActorContext = {
    authenticated: true,
    actor: {
      actorId: 'user-001',
      actorType: 'tenant-user',
      actorName: '张三',
      tenantId: 't1',
      roles: ['ADMIN'],
      permissions: ['all'],
      authenticated: true,
      source: 'headers'
    },
    tenantContext: { tenantId: 't1', marketCode: 'zh-CN' },
    effectiveTenantId: 't1',
    effectiveMarketCode: 'zh-CN',
    roles: ['ADMIN'],
    permissions: ['all']
  }

  const contract = toTenantResolveContract(ctx)
  const keys = Object.keys(contract).sort()

  // requestId is optional and only present when context has it
  assert.ok(keys.includes('actor'))
  assert.ok(keys.includes('effectiveTenantId'))
  assert.ok(keys.includes('effectiveMarketCode'))
  assert.ok(keys.includes('source'))
})

test('TenantContextContract fields match expected shape', () => {
  const ctx: RequestTenantContext = { tenantId: 't1', marketCode: 'zh-CN' }
  const contract = toTenantContextContract(ctx)
  const keys = Object.keys(contract).sort()

  assert.deepStrictEqual(keys, ['brandId', 'marketCode', 'storeId', 'tenantId'])
})

test('TenantScopeCheckContract fields match expected shape', () => {
  const ctx: ResolvedActorContext = {
    authenticated: true,
    actor: null,
    tenantContext: { tenantId: 't1', marketCode: 'zh-CN' },
    effectiveTenantId: 't1',
    effectiveMarketCode: 'zh-CN',
    roles: [],
    permissions: []
  }

  const contract = toTenantScopeCheckContract(ctx)
  const keys = Object.keys(contract).sort()

  assert.deepStrictEqual(keys, [
    'effectiveBrandId',
    'effectiveStoreId',
    'effectiveTenantId',
    'matches',
    'requiredBrandId',
    'requiredStoreId',
    'requiredTenantId'
  ])
})
