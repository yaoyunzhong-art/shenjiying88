import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createStorePortalFixture,
  createTenantPortalFixture
} from '../../testing/bootstrap-fixtures'
import { toStorePortalContract, toTobPortalContract } from './portal.contract'

test('contract mapper: portal contracts preserve provided primaryDomain', () => {
  const tenantPortal = toTobPortalContract(createTenantPortalFixture() as never)
  const storePortal = toStorePortalContract(createStorePortalFixture() as never)

  assert.equal(tenantPortal.primaryDomain, 'tenant-demo.cn-mainland.b2b.local')
  assert.equal(storePortal.primaryDomain, 'store-001.brand-demo.tenant-demo.cn-mainland.local')
})

test('contract mapper: portal contracts backfill missing primaryDomain', () => {
  const storePortal = toStorePortalContract({
    ...createStorePortalFixture(),
    primaryDomain: undefined
  } as never)

  assert.equal(storePortal.primaryDomain, 'store-001.cn-mainland.local')
})
