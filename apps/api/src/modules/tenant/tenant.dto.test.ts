import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  TenantResolveQueryDto,
  TenantResolveResponseDto,
  TenantActorDto,
  TenantContextSetDto
} from './tenant.dto'

describe('tenant.dto: TenantResolveQueryDto', () => {
  test('default properties are undefined', () => {
    const dto = new TenantResolveQueryDto()
    assert.equal(dto.verbose, undefined)
    assert.equal(dto.scope, undefined)
  })

  test('can set verbose=true', () => {
    const dto = new TenantResolveQueryDto()
    dto.verbose = true
    assert.equal(dto.verbose, true)
  })

  test('can set verbose=false', () => {
    const dto = new TenantResolveQueryDto()
    dto.verbose = false
    assert.equal(dto.verbose, false)
  })

  test('can set scope string', () => {
    const dto = new TenantResolveQueryDto()
    dto.scope = 'tenant-platform'
    assert.equal(dto.scope, 'tenant-platform')
  })

  test('can set both verbose and scope', () => {
    const dto = new TenantResolveQueryDto()
    dto.verbose = true
    dto.scope = 'tenant-scope'
    assert.equal(dto.verbose, true)
    assert.equal(dto.scope, 'tenant-scope')
  })

  test('instanceof check', () => {
    const dto = new TenantResolveQueryDto()
    assert.ok(dto instanceof TenantResolveQueryDto)
  })
})

describe('tenant.dto: TenantActorDto', () => {
  test('default properties are undefined', () => {
    const dto = new TenantActorDto()
    assert.equal(dto.actorId, undefined)
    assert.equal(dto.actorType, undefined)
    assert.equal(dto.actorName, undefined)
    assert.equal(dto.roles, undefined)
    assert.equal(dto.permissions, undefined)
    assert.equal(dto.authenticated, undefined)
  })

  test('can construct complete actor', () => {
    const dto = new TenantActorDto()
    dto.actorId = 'a-001'
    dto.actorType = 'tenant-user'
    dto.actorName = '张三'
    dto.roles = ['manager', 'staff']
    dto.permissions = ['read:tenant', 'write:tenant']
    dto.authenticated = true

    assert.equal(dto.actorId, 'a-001')
    assert.equal(dto.actorType, 'tenant-user')
    assert.equal(dto.actorName, '张三')
    assert.deepEqual(dto.roles, ['manager', 'staff'])
    assert.deepEqual(dto.permissions, ['read:tenant', 'write:tenant'])
    assert.equal(dto.authenticated, true)
  })

  test('can construct unauthenticated actor', () => {
    const dto = new TenantActorDto()
    dto.actorId = 'a-002'
    dto.actorType = 'service-account'
    dto.roles = []
    dto.permissions = []
    dto.authenticated = false

    assert.equal(dto.authenticated, false)
    assert.deepEqual(dto.roles, [])
    assert.deepEqual(dto.permissions, [])
  })

  test('instanceof check', () => {
    const dto = new TenantActorDto()
    assert.ok(dto instanceof TenantActorDto)
  })
})

describe('tenant.dto: TenantResolveResponseDto', () => {
  test('default properties are undefined', () => {
    const dto = new TenantResolveResponseDto()
    assert.equal(dto.effectiveTenantId, undefined)
    assert.equal(dto.source, undefined)
    assert.equal(dto.effectiveBrandId, undefined)
    assert.equal(dto.effectiveStoreId, undefined)
    assert.equal(dto.effectiveMarketCode, undefined)
    assert.equal(dto.actor, undefined)
    assert.equal(dto.requestId, undefined)
  })

  test('can construct complete response', () => {
    const actor = new TenantActorDto()
    actor.actorId = 'a-001'
    actor.actorType = 'tenant-user'
    actor.roles = ['staff']
    actor.permissions = []
    actor.authenticated = true

    const dto = new TenantResolveResponseDto()
    dto.requestId = 'req-001'
    dto.effectiveTenantId = 'tenant-demo'
    dto.effectiveBrandId = 'brand-01'
    dto.effectiveStoreId = 'store-01'
    dto.effectiveMarketCode = 'default'
    dto.actor = actor
    dto.source = 'tenant-module'

    assert.equal(dto.requestId, 'req-001')
    assert.equal(dto.effectiveTenantId, 'tenant-demo')
    assert.equal(dto.effectiveBrandId, 'brand-01')
    assert.equal(dto.effectiveStoreId, 'store-01')
    assert.equal(dto.effectiveMarketCode, 'default')
    assert.ok(dto.actor)
    assert.equal(dto.actor.actorId, 'a-001')
    assert.equal(dto.source, 'tenant-module')
  })

  test('supports actor as null', () => {
    const dto = new TenantResolveResponseDto()
    dto.effectiveTenantId = 'tenant-demo'
    dto.source = 'tenant-module'
    dto.actor = null

    assert.equal(dto.actor, null)
  })

  test('instanceof check', () => {
    const dto = new TenantResolveResponseDto()
    assert.ok(dto instanceof TenantResolveResponseDto)
  })
})

describe('tenant.dto: TenantContextSetDto', () => {
  test('default properties are undefined', () => {
    const dto = new TenantContextSetDto()
    assert.equal(dto.tenantId, undefined)
    assert.equal(dto.brandId, undefined)
    assert.equal(dto.storeId, undefined)
    assert.equal(dto.marketCode, undefined)
  })

  test('can set partial context', () => {
    const dto = new TenantContextSetDto()
    dto.tenantId = 'tenant-custom'
    dto.marketCode = 'cn-sh'

    assert.equal(dto.tenantId, 'tenant-custom')
    assert.equal(dto.marketCode, 'cn-sh')
    assert.equal(dto.brandId, undefined)
    assert.equal(dto.storeId, undefined)
  })

  test('can set full context', () => {
    const dto = new TenantContextSetDto()
    dto.tenantId = 'tenant-001'
    dto.brandId = 'brand-001'
    dto.storeId = 'store-001'
    dto.marketCode = 'cn-bj'

    assert.equal(dto.tenantId, 'tenant-001')
    assert.equal(dto.brandId, 'brand-001')
    assert.equal(dto.storeId, 'store-001')
    assert.equal(dto.marketCode, 'cn-bj')
  })

  test('instanceof check', () => {
    const dto = new TenantContextSetDto()
    assert.ok(dto instanceof TenantContextSetDto)
  })
})
