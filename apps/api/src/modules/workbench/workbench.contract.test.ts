import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import {
  createMinimalTenantContextFixture,
  createSupportedClientsFixture
} from '../../testing/bootstrap-fixtures'
import { toRoleWorkbenchContract, toTenantContextContract } from './workbench.contract'

it('contract mapper: workbench contracts normalize marketCodes and tenant context', () => {
  const workbench = toRoleWorkbenchContract({
    role: 'GUIDE' as never,
    channel: 'PAD' as never,
    title: '导购工作台',
    description: 'demo',
    navItems: [{ key: 'crm', label: '会员接待', href: '/workbench/guide', description: '画像、标签、推荐和回访' }]
  })

  const tenantContext = toTenantContextContract(createMinimalTenantContextFixture())

  assert.deepEqual(workbench.marketCodes, [])
  assert.deepEqual(tenantContext, { tenantId: 'tenant-demo' })
})

it('fixture: supported clients source stays stable', () => {
  assert.deepEqual(createSupportedClientsFixture(), ['PC', 'PAD', 'H5', 'MINIAPP', 'APP'])
})
