import assert from 'node:assert/strict'
import test from 'node:test'
import { toRegionalConfigOverrideContract } from './market.contract'

test('contract mapper: regional override omits undefined nested keys', () => {
  const contract = toRegionalConfigOverrideContract({
    scopeType: 'TENANT' as never,
    scopeCode: 'tenant-demo',
    inheritanceMode: 'TENANT_DEFAULT' as never,
    marketCode: 'cn-mainland',
    email: {
      fromName: 'tenant-demo HQ'
    }
  })

  assert.deepEqual(contract, {
    scopeType: 'TENANT',
    scopeCode: 'tenant-demo',
    inheritanceMode: 'TENANT_DEFAULT',
    marketCode: 'cn-mainland',
    email: {
      fromName: 'tenant-demo HQ'
    }
  })
})

