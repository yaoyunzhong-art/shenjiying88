// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
describe('MarketService', () => {
  const { MarketService } = require('./market.service')

  it('getBootstrap returns bootstrap with supported markets and foundation metadata', () => {
    const mockFoundation = {
      getDependencySummary: () => ({
        consumer: 'market',
        dependsOn: ['identity-access'],
        handoffContracts: ['market:v1']
      })
    }
    const service = new MarketService(mockFoundation as never)

    const result = service.getBootstrap()

    assert.equal(result.defaultDomesticMarketCode, 'cn-mainland')
    assert.equal(result.defaultInternationalMarketCode, 'us-default')
    assert.ok(Array.isArray(result.supportedMarkets))
    assert.ok(result.supportedMarkets.length >= 2)
    assert.ok(result.supportedMarkets.some((m: { marketCode: string }) => m.marketCode === 'cn-mainland'))
    assert.ok(result.supportedMarkets.some((m: { marketCode: string }) => m.marketCode === 'us-default'))
    assert.deepStrictEqual(result.foundationDependencies, ['identity-access'])
    assert.deepStrictEqual(result.foundationContracts, ['market:v1'])
  })

  it('getBootstrap handles null foundation dependency', () => {
    const mockFoundation = { getDependencySummary: () => null }
    const service = new MarketService(mockFoundation as never)

    const result = service.getBootstrap()

    assert.equal(result.defaultDomesticMarketCode, 'cn-mainland')
    assert.equal(result.defaultInternationalMarketCode, 'us-default')
    assert.ok(Array.isArray(result.supportedMarkets))
  })

  it('getByMarketCode returns cn-mainland profile', () => {
    const mockFoundation = { getDependencySummary: () => null }
    const service = new MarketService(mockFoundation as never)

    const result = service.getByMarketCode('cn-mainland')

    assert.equal(result.marketCode, 'cn-mainland')
    assert.equal(result.marketName, '中国大陆')
    assert.equal(result.currency.currencyCode, 'CNY')
    assert.equal(result.currency.symbol, '¥')
    assert.equal(result.tax.taxMode, 'PRICES_INCLUDE_TAX')
    assert.equal(result.network.networkRegion, 'MAINLAND_CHINA')
  })

  it('getByMarketCode returns us-default profile', () => {
    const mockFoundation = { getDependencySummary: () => null }
    const service = new MarketService(mockFoundation as never)

    const result = service.getByMarketCode('us-default')

    assert.equal(result.marketCode, 'us-default')
    assert.equal(result.marketName, 'United States')
    assert.equal(result.currency.currencyCode, 'USD')
    assert.equal(result.currency.symbol, '$')
    assert.equal(result.tax.taxMode, 'PRICES_EXCLUDE_TAX')
    assert.equal(result.network.networkRegion, 'NORTH_AMERICA')
  })

  it('getByMarketCode falls back to us-default for unknown marketCode', () => {
    const mockFoundation = { getDependencySummary: () => null }
    const service = new MarketService(mockFoundation as never)

    const result = service.getByMarketCode('de-unknown')

    // Falls back to us-default
    assert.equal(result.marketCode, 'us-default')
  })

  it('getOverrides returns tenant/brand/store overrides for cn-mainland', () => {
    const mockFoundation = { getDependencySummary: () => null }
    const service = new MarketService(mockFoundation as never)

    const context = {
      tenantId: 't-acme',
      brandId: 'b-shoes',
      storeId: 's-flagship',
      marketCode: 'cn-mainland'
    }

    const result = service.getOverrides(context)

    assert.equal(result.length, 3)
    assert.equal(result[0].scopeType, 'TENANT')
    assert.equal(result[0].scopeCode, 't-acme')
    assert.equal(result[0].inheritanceMode, 'TENANT_DEFAULT')
    assert.equal(result[0].email.fromName, 't-acme HQ')
    assert.equal(result[1].scopeType, 'BRAND')
    assert.equal(result[1].scopeCode, 'b-shoes')
    assert.deepStrictEqual(result[1].social.primaryPlatforms, ['WECHAT', 'DOUYIN'])
    assert.equal(result[2].scopeType, 'STORE')
    assert.equal(result[2].scopeCode, 's-flagship')
    assert.equal(result[2].timezone.timezone, 'Asia/Shanghai')
  })

  it('getOverrides uses us-default platforms and timezone for non-cn market', () => {
    const mockFoundation = { getDependencySummary: () => null }
    const service = new MarketService(mockFoundation as never)

    const context = {
      tenantId: 't-global',
      brandId: 'b-fashion',
      storeId: 's-la',
      marketCode: 'us-default'
    }

    const result = service.getOverrides(context)

    assert.equal(result.length, 3)
    assert.deepStrictEqual(result[1].social.primaryPlatforms, ['LINKEDIN', 'INSTAGRAM'])
    assert.equal(result[2].timezone.timezone, 'America/Los_Angeles')
  })

  it('getOverrides defaults to us-default when no marketCode', () => {
    const mockFoundation = { getDependencySummary: () => null }
    const service = new MarketService(mockFoundation as never)

    const context = {
      tenantId: 't-x',
      brandId: 'b-x',
      storeId: 's-x',
      marketCode: undefined
    }

    const result = service.getOverrides(context as never)

    assert.equal(result.length, 3)
    assert.deepStrictEqual(result[1].social.primaryPlatforms, ['LINKEDIN', 'INSTAGRAM'])
  })

  it('getOverrides uses default brand and store when not provided', () => {
    const mockFoundation = { getDependencySummary: () => null }
    const service = new MarketService(mockFoundation as never)

    const context = {
      tenantId: 't-minimal',
      brandId: undefined,
      storeId: undefined,
      marketCode: 'cn-mainland'
    }

    const result = service.getOverrides(context as never)

    assert.equal(result[1].scopeCode, 'brand-demo')
    assert.equal(result[2].scopeCode, 'store-001')
  })

  it('getMergedProfile returns base profile merged with overrides for cn-mainland', () => {
    const mockFoundation = { getDependencySummary: () => null }
    const service = new MarketService(mockFoundation as never)

    const context = {
      tenantId: 't-acme',
      brandId: 'b-shoes',
      storeId: 's-flagship',
      marketCode: 'cn-mainland'
    }

    const result = service.getMergedProfile(context)

    assert.equal(result.marketCode, 'cn-mainland')
    assert.equal(result.marketName, '中国大陆')
    // Store override applied last → timezone preserved as Asia/Shanghai
    assert.equal(result.timezone.timezone, 'Asia/Shanghai')
    // Email override from tenant level
    assert.ok(result.email.fromName.includes('t-acme'))
    // Social from brand override
    assert.deepStrictEqual(result.social.primaryPlatforms, ['WECHAT', 'DOUYIN'])
  })

  it('getMergedProfile returns us-default with overrides', () => {
    const mockFoundation = { getDependencySummary: () => null }
    const service = new MarketService(mockFoundation as never)

    const context = {
      tenantId: 't-global',
      brandId: 'b-fashion',
      storeId: 's-la',
      marketCode: 'us-default'
    }

    const result = service.getMergedProfile(context)

    assert.equal(result.marketCode, 'us-default')
    assert.equal(result.marketName, 'United States')
    assert.equal(result.currency.currencyCode, 'USD')
    // Store override: America/Los_Angeles
    assert.equal(result.timezone.timezone, 'America/Los_Angeles')
    assert.deepStrictEqual(result.social.primaryPlatforms, ['LINKEDIN', 'INSTAGRAM'])
  })
})
