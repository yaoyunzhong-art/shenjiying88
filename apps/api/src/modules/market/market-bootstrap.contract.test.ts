import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { assertExactKeys } from '../../testing/contract-assertions'
import { createContractTestFoundationDependencySummary } from '../../testing/bootstrap-fixtures'
import { MarketService } from './market.service'

it('contract: market bootstrap shape', () => {
  const foundationService = {
    getDependencySummary: () => createContractTestFoundationDependencySummary()
  }

  const service = new MarketService(foundationService as never)
  const bootstrap = service.getBootstrap()

  assertExactKeys(bootstrap, [
    'defaultDomesticMarketCode',
    'defaultInternationalMarketCode',
    'supportedMarkets',
    'foundationDependencies',
    'foundationContracts'
  ])
  assert.equal(typeof bootstrap.defaultDomesticMarketCode, 'string')
  assert.equal(typeof bootstrap.defaultInternationalMarketCode, 'string')
  assert.equal(Array.isArray(bootstrap.supportedMarkets), true)
  assert.equal(Array.isArray(bootstrap.foundationDependencies), true)
  assert.equal(Array.isArray(bootstrap.foundationContracts), true)
  assert.deepEqual(bootstrap.foundationDependencies, ['identity-access', 'configuration-governance'])
  assert.deepEqual(bootstrap.foundationContracts, ['contract-a'])
  assert.equal(bootstrap.supportedMarkets.length, 2)
  assert.deepEqual(
    bootstrap.supportedMarkets.map((market) => market.marketCode),
    ['cn-mainland', 'us-default']
  )

  for (const market of bootstrap.supportedMarkets) {
    assertExactKeys(market, [
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
    assertExactKeys(market.tax, ['taxMode', 'taxRate', 'taxLabel'])
    assertExactKeys(market.network, ['networkRegion', 'apiBaseUrl', 'cdnBaseUrl', 'callbackBaseUrl'])
    assertExactKeys(market.email, ['provider', 'fromName', 'fromAddress', 'replyTo'])
  }
})
