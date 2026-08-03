import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import {
  createStorePortalFixture,
  createTenantPortalFixture
} from '../../testing/bootstrap-fixtures'
import { toStorePortalContract, toTobPortalContract } from './portal.contract'

it('contract mapper: portal contracts preserve provided primaryDomain', () => {
  const tenantPortal = toTobPortalContract(createTenantPortalFixture() as never)
  const storePortal = toStorePortalContract(createStorePortalFixture() as never)

  assert.equal(tenantPortal.primaryDomain, 'tenant-demo.cn-mainland.b2b.local')
  assert.equal(tenantPortal.domainSource, 'custom')
  assert.equal(storePortal.primaryDomain, 'store-001.brand-demo.tenant-demo.cn-mainland.local')
  assert.equal(storePortal.domainSource, 'custom')
})

it('contract mapper: portal contracts backfill missing primaryDomain', () => {
  const storePortal = toStorePortalContract({
    ...createStorePortalFixture(),
    primaryDomain: undefined
  } as never)

  assert.equal(storePortal.primaryDomain, 'store-001.cn-mainland.local')
  assert.equal(storePortal.domainSource, 'default')
})

it('contract mapper: Tob portal backfills with scopeCode.marketCode.b2b.local', () => {
  const tenantPortal = toTobPortalContract({
    ...createTenantPortalFixture(),
    primaryDomain: undefined
  } as never)

  assert.ok(tenantPortal.primaryDomain.endsWith('.b2b.local'))
  assert.ok(tenantPortal.primaryDomain.includes('tenant-demo'))
  assert.equal(tenantPortal.domainSource, 'default')
})

it('contract mapper: store portal backfills with storeCode.marketCode.local', () => {
  const storePortal = toStorePortalContract({
    ...createStorePortalFixture(),
    primaryDomain: undefined
  } as never)

  assert.ok(storePortal.primaryDomain.endsWith('.local'))
  assert.ok(!storePortal.primaryDomain.includes('b2b'))
  assert.ok(storePortal.primaryDomain.startsWith('store-001'))
  assert.equal(storePortal.domainSource, 'default')
})

it('contract mapper: store portal has required fields', () => {
  const portal = toStorePortalContract(createStorePortalFixture() as never)
  assert.ok(portal.storeCode)
  assert.ok(portal.storeName)
  assert.equal(typeof portal.audience, 'string')
  assert.equal(typeof portal.scopeType, 'string')
})

it('contract mapper: Tob portal has required fields', () => {
  const portal = toTobPortalContract(createTenantPortalFixture() as never)
  assert.ok(portal.tenantCode)
  assert.ok(portal.heroTitle)
  assert.equal(typeof portal.audience, 'string')
  assert.equal(typeof portal.scopeType, 'string')
})

it('contract mapper: Tob portal loginEntry is present', () => {
  const portal = toTobPortalContract(createTenantPortalFixture() as never)
  assert.ok(portal.loginEntry)
  assert.equal(typeof portal.loginEntry, 'object')
  assert.ok('loginPath' in portal.loginEntry)
})
