import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { toRegionalConfigOverrideContract } from './market.contract'

it('contract mapper: regional override omits undefined nested keys', () => {
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

