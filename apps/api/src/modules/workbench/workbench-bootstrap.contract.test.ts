import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
import { assertExactKeys } from '../../testing/contract-assertions'
import {
  createBrandPortalFixture,
  createContractTestFoundationDependencySummary,
  createMarketProfileFixture,
  createMinimalTenantContextFixture,
  createStorePortalFixture,
  createSupportedClientsFixture,
  createTenantPortalFixture
} from '../../testing/bootstrap-fixtures'
import { WorkbenchService } from './workbench.service'

test('contract: workbench bootstrap shape', () => {
  const marketService = {
    getMergedProfile: () => createMarketProfileFixture()
  }

  const portalService = {
    getBootstrap: () => ({
      tenantPortal: createTenantPortalFixture(),
      brandPortal: createBrandPortalFixture(),
      storePortal: createStorePortalFixture()
    })
  }

  const foundationService = {
    getDependencySummary: () => createContractTestFoundationDependencySummary()
  }

  const runtimeGovernanceService = {} as never
  const service = new WorkbenchService(marketService as never, portalService as never, foundationService as never, runtimeGovernanceService)
  const bootstrap = service.getBootstrap(createMinimalTenantContextFixture() as never)

  assertExactKeys(bootstrap, [
    'tenantContext',
    'workbenches',
    'storePortals',
    'tenantPortal',
    'brandPortal',
    'marketProfile',
    'regionalLoginPolicies',
    'supportedLocales',
    'supportedClients',
    'foundationDependencies',
    'foundationContracts'
  ])
  assert.equal((bootstrap.tenantContext as unknown as Record<string, unknown>).tenantId, 'tenant-demo')
  assert.equal(Array.isArray(bootstrap.workbenches), true)
  assert.equal(Array.isArray(bootstrap.storePortals), true)
  assert.equal(typeof bootstrap.regionalLoginPolicies.defaultLoginPath, 'string')
  assert.equal(typeof bootstrap.regionalLoginPolicies.ssoEnabled, 'boolean')
  assertExactKeys(bootstrap.regionalLoginPolicies, ['defaultLoginPath', 'ssoEnabled'])
  assert.equal(Array.isArray(bootstrap.supportedLocales), true)
  assert.equal(Array.isArray(bootstrap.supportedClients), true)
  assert.equal(Array.isArray(bootstrap.foundationDependencies), true)
  assert.equal(Array.isArray(bootstrap.foundationContracts), true)
  assertExactKeys(bootstrap.tenantContext, ['tenantId'])
  assert.equal((bootstrap.tenantContext as { tenantId: string }).tenantId, 'tenant-demo')
  assert.deepEqual(bootstrap.supportedLocales, ['zh-CN'])
  assert.deepEqual(bootstrap.supportedClients, createSupportedClientsFixture())
  assert.deepEqual(bootstrap.foundationDependencies, ['identity-access', 'configuration-governance'])
  assert.deepEqual(bootstrap.foundationContracts, ['contract-a'])
  assert.deepEqual(bootstrap.regionalLoginPolicies, {
    defaultLoginPath: '/cn-mainland/tenant-demo/login',
    ssoEnabled: true
  })
  assert.equal(bootstrap.workbenches.length, 10)
  assert.deepEqual(
    bootstrap.workbenches.map((workbench) => workbench.role),
    [
      'SUPER_ADMIN',
      'TENANT_ADMIN',
      'BRAND_MANAGER',
      'STORE_MANAGER',
      'GUIDE',
      'CASHIER',
      'OPERATIONS',
      'FINANCE',
      'WAREHOUSE',
      'COACH'
    ]
  )

  for (const workbench of bootstrap.workbenches) {
    assertExactKeys(workbench, ['role', 'channel', 'title', 'description', 'marketCodes', 'navItems'])
    assert.equal(Array.isArray(workbench.marketCodes), true)
    assert.equal(Array.isArray(workbench.navItems), true)
    assert.equal(workbench.navItems.length > 0, true)
    assertExactKeys(workbench.navItems[0], ['key', 'label', 'href', 'description'])
  }

  assertExactKeys(bootstrap.tenantPortal, [
    'audience',
    'scopeType',
    'scopeCode',
    'tenantCode',
    'brandCode',
    'marketCode',
    'channel',
    'name',
    'primaryDomain',
    'supportedLanguages',
    'heroTitle',
    'heroSubtitle',
    'solutionTags',
    'loginEntry'
  ])
  assertExactKeys(bootstrap.tenantPortal.loginEntry, ['label', 'loginPath', 'ssoEnabled'])

  assertExactKeys(bootstrap.marketProfile, [
    'marketCode',
    'marketName',
    'countryCode',
    'locale',
    'timezone',
    'currency',
    'tax',
    'network',
    'email',
    'social'
  ])

  const marketProfileRecord = bootstrap.marketProfile as unknown as Record<string, unknown>
  assertExactKeys(marketProfileRecord.tax, ['taxMode', 'taxRate', 'taxLabel'])
  assertExactKeys(marketProfileRecord.network, ['networkRegion', 'apiBaseUrl', 'cdnBaseUrl', 'callbackBaseUrl'])
  assertExactKeys(marketProfileRecord.email, ['provider', 'fromName', 'fromAddress', 'replyTo'])
})
