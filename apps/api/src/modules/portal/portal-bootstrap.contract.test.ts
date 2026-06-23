import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
import { assertExactKeys } from '../../testing/contract-assertions'
import {
  createContractTestFoundationDependencySummary,
  createMarketProfileFixture,
  createRegionalOverridesFixture
} from '../../testing/bootstrap-fixtures'
import { PortalService } from './portal.service'

test('contract: portal bootstrap shape', () => {
  const marketService = {
    getMergedProfile: () => createMarketProfileFixture(),
    getOverrides: () => createRegionalOverridesFixture()
  }

  const foundationService = {
    getDependencySummary: () => createContractTestFoundationDependencySummary()
  }

  const service = new PortalService(marketService as never, foundationService as never)
  const bootstrap = service.getBootstrap({ tenantId: 'tenant-demo' } as never)

  assertExactKeys(bootstrap, [
    'tenantPortal',
    'brandPortal',
    'storePortal',
    'marketProfile',
    'regionalOverrides',
    'foundationDependencies',
    'foundationContracts'
  ])
  assert.equal(typeof bootstrap.tenantPortal, 'object')
  assert.equal(typeof bootstrap.brandPortal, 'object')
  assert.equal(typeof bootstrap.storePortal, 'object')
  assert.equal(typeof bootstrap.marketProfile, 'object')
  assert.equal(Array.isArray(bootstrap.regionalOverrides), true)
  assert.equal(Array.isArray(bootstrap.foundationDependencies), true)
  assert.equal(Array.isArray(bootstrap.foundationContracts), true)
  assert.deepEqual(bootstrap.foundationDependencies, ['identity-access', 'configuration-governance'])
  assert.deepEqual(bootstrap.foundationContracts, ['contract-a'])
  const tenantOverride = bootstrap.regionalOverrides[0] as unknown as Record<string, unknown>
  const brandOverride = bootstrap.regionalOverrides[1] as unknown as Record<string, unknown>
  const storeOverride = bootstrap.regionalOverrides[2] as unknown as Record<string, unknown>
  assertExactKeys(tenantOverride, ['scopeType', 'scopeCode', 'inheritanceMode', 'marketCode', 'email'])
  assertExactKeys(tenantOverride.email, ['fromName'])
  assertExactKeys(brandOverride, ['scopeType', 'scopeCode', 'inheritanceMode', 'marketCode', 'social'])
  assertExactKeys(brandOverride.social, ['primaryPlatforms'])
  assertExactKeys(storeOverride, ['scopeType', 'scopeCode', 'inheritanceMode', 'marketCode', 'timezone'])
  assertExactKeys(storeOverride.timezone, ['timezone'])

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
  assert.equal(typeof bootstrap.tenantPortal.primaryDomain, 'string')

  assertExactKeys(bootstrap.brandPortal, [
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
  assertExactKeys(bootstrap.brandPortal.loginEntry, ['label', 'loginPath', 'ssoEnabled'])
  assert.equal(typeof bootstrap.brandPortal.primaryDomain, 'string')

  assertExactKeys(bootstrap.storePortal, [
    'audience',
    'scopeType',
    'scopeCode',
    'tenantCode',
    'brandCode',
    'storeCode',
    'storeName',
    'marketCode',
    'channel',
    'name',
    'primaryDomain',
    'supportedLanguages',
    'supportedSurfaces'
  ])
  assert.equal(typeof bootstrap.storePortal.primaryDomain, 'string')

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
