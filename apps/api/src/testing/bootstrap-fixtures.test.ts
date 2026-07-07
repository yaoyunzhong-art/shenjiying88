import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import {
  createBrandPortalFixture,
  createContractTestFoundationDependencySummary,
  createE2EFoundationDependencySummary,
  createMarketProfileFixture,
  createMinimalTenantContextFixture,
  createRegionalOverridesFixture,
  createResolvedTenantContextFixture,
  createStorePortalFixture,
  createSupportedClientsFixture,
  createTenantPortalFixture
} from './bootstrap-fixtures'

it('fixture: foundation dependency summaries preserve consumer-specific contract names', () => {
  assert.deepEqual(createContractTestFoundationDependencySummary(), {
    dependsOn: ['identity-access', 'configuration-governance'],
    handoffContracts: ['contract-a']
  })
  assert.deepEqual(createE2EFoundationDependencySummary(), {
    dependsOn: ['identity-access', 'configuration-governance'],
    handoffContracts: ['@m5/types']
  })
})

it('fixture: market and portal fixtures remain aligned to bootstrap samples', () => {
  assert.equal(createMarketProfileFixture().marketCode, 'cn-mainland')
  assert.equal(createMarketProfileFixture().tax.taxMode, 'PRICES_INCLUDE_TAX')
  assert.equal(createTenantPortalFixture().loginEntry.loginPath, '/cn-mainland/tenant-demo/login')
  assert.equal(createBrandPortalFixture().scopeType, 'BRAND')
  assert.equal(
    createStorePortalFixture().primaryDomain,
    'store-001.brand-demo.tenant-demo.cn-mainland.local'
  )
  assert.deepEqual(createStorePortalFixture().supportedSurfaces, [
    'OFFICIAL_SITE',
    'H5',
    'MINIAPP',
    'APP',
    'PC_CONSOLE',
    'PAD_CONSOLE'
  ])
})

it('fixture: regional override collection remains stable', () => {
  assert.deepEqual(createRegionalOverridesFixture(), [
    {
      scopeType: 'TENANT',
      scopeCode: 'tenant-demo',
      inheritanceMode: 'TENANT_DEFAULT',
      marketCode: 'cn-mainland',
      email: { fromName: 'tenant-demo HQ' }
    },
    {
      scopeType: 'BRAND',
      scopeCode: 'brand-demo',
      inheritanceMode: 'BRAND_OVERRIDE',
      marketCode: 'cn-mainland',
      social: { primaryPlatforms: ['WECHAT'] }
    },
    {
      scopeType: 'STORE',
      scopeCode: 'store-001',
      inheritanceMode: 'STORE_OVERRIDE',
      marketCode: 'cn-mainland',
      timezone: { timezone: 'Asia/Shanghai' }
    }
  ])
})

it('fixture: resolved tenant context and supported clients stay stable', () => {
  assert.deepEqual(createMinimalTenantContextFixture(), {
    tenantId: 'tenant-demo'
  })
  assert.deepEqual(createResolvedTenantContextFixture(), {
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland'
  })
  assert.deepEqual(createSupportedClientsFixture(), ['PC', 'PAD', 'H5', 'MINIAPP', 'APP'])
})
