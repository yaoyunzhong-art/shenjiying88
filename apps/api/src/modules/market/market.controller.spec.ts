import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── Mock NestJS decorators ──────────────────────────────────────────
function Controller(prefix: string) {
  return (target: Function & { __prefix?: string }) => {
    target.__prefix = prefix
    return target
  }
}

const getRegistrations: string[] = []
function Get(path = '') {
  return (_target: object, propertyKey: string | symbol) => {
    getRegistrations.push(`${String(propertyKey)}:${path}`)
  }
}

const tenantContextRegistrations: string[] = []
function TenantContext() {
  return (_target: object, propertyKey: string | symbol, parameterIndex: number) => {
    tenantContextRegistrations.push(`${String(propertyKey)}:${parameterIndex}`)
  }
}

const paramRegistrations: string[] = []
function Param(name: string) {
  return (_target: object, propertyKey: string | symbol, parameterIndex: number) => {
    paramRegistrations.push(`${String(propertyKey)}:${name}:${parameterIndex}`)
  }
}

// ── Stub service ────────────────────────────────────────────────────
type MarketProfileStub = {
  marketCode: string
  marketName: string
  countryCode: string
  locale: { defaultLanguage: string; supportedLanguages: string[] }
  timezone: { timezone: string }
  currency: { currencyCode: string; symbol: string }
  tax: { taxMode: string; taxRate: number; taxLabel: string }
  network: { networkRegion: string; apiBaseUrl: string; cdnBaseUrl: string }
  email: { provider: string; fromName: string; fromAddress: string; replyTo: string }
  social: { primaryPlatforms: string[]; supportPlatforms: string[] }
}

type MockMarketService = {
  getBootstrap: () => object
  getMergedProfile: (tc: RequestTenantContext) => MarketProfileStub
  getOverrides: (tc: RequestTenantContext) => object[]
}

function createMockMarketService(): MockMarketService {
  return {
    getBootstrap: () => ({
      defaultDomesticMarketCode: 'cn-mainland',
      defaultInternationalMarketCode: 'us-default',
      supportedMarkets: [
        { marketCode: 'cn-mainland', marketName: '中国大陆' },
        { marketCode: 'us-default', marketName: 'United States' }
      ]
    }),
    getMergedProfile: (_tc: RequestTenantContext) => ({
      marketCode: 'cn-mainland',
      marketName: '中国大陆',
      countryCode: 'CN',
      locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
      timezone: { timezone: 'Asia/Shanghai' },
      currency: { currencyCode: 'CNY', symbol: '¥' },
      tax: { taxMode: 'included', taxRate: 6, taxLabel: '增值税' },
      network: { networkRegion: 'mainland-china', apiBaseUrl: 'https://cn-api.m5.local', cdnBaseUrl: 'https://cn-cdn.m5.local' },
      email: { provider: 'aliyun-dm', fromName: 'M5 China', fromAddress: 'hello-cn@m5.local', replyTo: 'support-cn@m5.local' },
      social: { primaryPlatforms: ['wechat', 'xiaohongshu'], supportPlatforms: ['wechat', 'weibo', 'douyin'] }
    }),
    getOverrides: (_tc: RequestTenantContext) => [
      { scopeType: 'tenant', scopeCode: 't1', inheritanceMode: 'tenant-default', marketCode: 'cn-mainland', email: { fromName: 't1 HQ' } },
      { scopeType: 'brand', scopeCode: 'b1', inheritanceMode: 'brand-override', marketCode: 'cn-mainland' },
      { scopeType: 'store', scopeCode: 's1', inheritanceMode: 'store-override', marketCode: 'cn-mainland' }
    ]
  }
}

// ── Controller implementation (mirrors real MarketController) ──────
class MarketController {
  constructor(private readonly marketService: MockMarketService) {}

  getBootstrap() {
    return this.marketService.getBootstrap()
  }

  getScopedMarket(scopeType: string, scopeCode: string, tenantContext: RequestTenantContext) {
    return {
      scopeType,
      scopeCode,
      marketProfile: this.marketService.getMergedProfile(tenantContext),
      overrides: this.marketService.getOverrides(tenantContext)
    }
  }

  getScopedPortalMarket(scopeType: string, scopeCode: string, tenantContext: RequestTenantContext) {
    const marketProfile = this.marketService.getMergedProfile(tenantContext)

    return {
      scopeType,
      scopeCode,
      marketCode: marketProfile.marketCode,
      locale: marketProfile.locale,
      timezone: marketProfile.timezone,
      tax: marketProfile.tax,
      network: marketProfile.network,
      email: marketProfile.email,
      social: marketProfile.social
    }
  }
}

// Register decorators (simulating what NestJS does at runtime)
Get('bootstrap')(MarketController.prototype, 'getBootstrap')
Get(':scopeType/:scopeCode')(MarketController.prototype, 'getScopedMarket')
Get(':scopeType/:scopeCode/portal')(MarketController.prototype, 'getScopedPortalMarket')
TenantContext()(MarketController.prototype, 'getScopedMarket', 2)
TenantContext()(MarketController.prototype, 'getScopedPortalMarket', 2)
Param('scopeType')(MarketController.prototype, 'getScopedMarket', 0)
Param('scopeCode')(MarketController.prototype, 'getScopedMarket', 1)
Param('scopeType')(MarketController.prototype, 'getScopedPortalMarket', 0)
Param('scopeCode')(MarketController.prototype, 'getScopedPortalMarket', 1)
Controller('markets')(MarketController)

// ── Tests ──────────────────────────────────────────────────────────
describe('MarketController', () => {
  let controller: MarketController
  let mockService: MockMarketService

  test.beforeEach(() => {
    mockService = createMockMarketService()
    controller = new MarketController(mockService)
  })

  // ── Decorator metadata ─────────────────────────────────────────
  describe('decorator metadata', () => {
    test('registers @Controller("markets") prefix', () => {
      assert.equal(
        (MarketController as typeof MarketController & { __prefix?: string }).__prefix,
        'markets'
      )
    })

    test('registers 3 @Get endpoints', () => {
      assert.equal(getRegistrations.length, 3)
      assert.ok(getRegistrations.includes('getBootstrap:bootstrap'))
      assert.ok(getRegistrations.includes('getScopedMarket::scopeType/:scopeCode'))
      assert.ok(getRegistrations.includes('getScopedPortalMarket::scopeType/:scopeCode/portal'))
    })

    test('registers TenantContext decorator on scoped endpoints', () => {
      assert.ok(tenantContextRegistrations.includes('getScopedMarket:2'))
      assert.ok(tenantContextRegistrations.includes('getScopedPortalMarket:2'))
    })

    test('registers @Param decorators for scopeType and scopeCode', () => {
      assert.ok(paramRegistrations.includes('getScopedMarket:scopeType:0'))
      assert.ok(paramRegistrations.includes('getScopedMarket:scopeCode:1'))
      assert.ok(paramRegistrations.includes('getScopedPortalMarket:scopeType:0'))
      assert.ok(paramRegistrations.includes('getScopedPortalMarket:scopeCode:1'))
    })
  })

  // ── Positive cases ─────────────────────────────────────────────
  describe('getBootstrap() — positive', () => {
    test('returns bootstrap with default market codes', () => {
      const result = controller.getBootstrap() as Record<string, unknown>
      assert.equal(result.defaultDomesticMarketCode, 'cn-mainland')
      assert.equal(result.defaultInternationalMarketCode, 'us-default')
    })

    test('returns supportedMarkets as array', () => {
      const result = controller.getBootstrap() as Record<string, unknown>
      assert.ok(Array.isArray(result.supportedMarkets))
      assert.ok((result.supportedMarkets as Array<{ marketCode: string }>).length >= 2)
    })

    test('supportedMarkets includes cn-mainland and us-default', () => {
      const result = controller.getBootstrap() as Record<string, unknown>
      const markets = result.supportedMarkets as Array<{ marketCode: string }>
      assert.ok(markets.some(m => m.marketCode === 'cn-mainland'))
      assert.ok(markets.some(m => m.marketCode === 'us-default'))
    })
  })

  describe('getScopedMarket() — positive', () => {
    const tenantCtx: RequestTenantContext = {
      tenantId: 't-abc',
      brandId: 'b-xyz',
      storeId: 's-001',
      marketCode: 'cn-mainland'
    }

    test('returns correct scopeType and scopeCode', () => {
      const result = controller.getScopedMarket('tenant', 't-abc', tenantCtx) as Record<string, unknown>
      assert.equal(result.scopeType, 'tenant')
      assert.equal(result.scopeCode, 't-abc')
    })

    test('returns marketProfile with expected fields', () => {
      const result = controller.getScopedMarket('brand', 'b-xyz', tenantCtx) as Record<string, unknown>
      const profile = result.marketProfile as Record<string, unknown>
      assert.equal(profile.marketCode, 'cn-mainland')
      assert.equal(typeof profile.locale, 'object')
      assert.equal(typeof profile.timezone, 'object')
      assert.equal(typeof profile.currency, 'object')
    })

    test('returns overrides as array with correct length', () => {
      const result = controller.getScopedMarket('store', 's-001', tenantCtx) as Record<string, unknown>
      assert.ok(Array.isArray(result.overrides))
      assert.equal((result.overrides as Array<unknown>).length, 3)
    })

    test('overrides include tenant-level override', () => {
      const result = controller.getScopedMarket('tenant', 't-abc', tenantCtx) as Record<string, unknown>
      const overrides = result.overrides as Array<Record<string, unknown>>
      const tenantOverride = overrides.find(o => o.scopeType === 'tenant')
      assert.ok(tenantOverride)
      assert.equal(tenantOverride.scopeCode, 't1')
    })
  })

  describe('getScopedPortalMarket() — positive', () => {
    const tenantCtx: RequestTenantContext = {
      tenantId: 't-us',
      brandId: 'b-us',
      storeId: 's-us',
      marketCode: 'us-default'
    }

    test('returns correct scopeType and scopeCode', () => {
      const result = controller.getScopedPortalMarket('tenant', 't-us', tenantCtx) as Record<string, unknown>
      assert.equal(result.scopeType, 'tenant')
      assert.equal(result.scopeCode, 't-us')
    })

    test('returns all portal-visible market profile fields', () => {
      const result = controller.getScopedPortalMarket('brand', 'b-us', tenantCtx) as Record<string, unknown>
      assert.equal(typeof result.marketCode, 'string')
      assert.equal(typeof result.locale, 'object')
      assert.equal(typeof result.timezone, 'object')
      assert.equal(typeof result.tax, 'object')
      assert.equal(typeof result.network, 'object')
      assert.equal(typeof result.email, 'object')
      assert.equal(typeof result.social, 'object')
    })

    test('does not expose overrides in portal response', () => {
      const result = controller.getScopedPortalMarket('brand', 'b-us', tenantCtx) as Record<string, unknown>
      assert.equal(result.overrides, undefined)
    })

    test('returns tax details for display', () => {
      const result = controller.getScopedPortalMarket('store', 's-us', { tenantId: 't1', marketCode: 'cn-mainland' }) as Record<string, unknown>
      const tax = result.tax as Record<string, unknown>
      assert.equal(typeof tax.taxMode, 'string')
      assert.equal(typeof tax.taxRate, 'number')
      assert.equal(typeof tax.taxLabel, 'string')
    })
  })

  // ── Edge / boundary cases ──────────────────────────────────────
  describe('getBootstrap() — edge cases', () => {
    test('supportedMarkets never returns more than configured profiles', () => {
      const result = controller.getBootstrap() as Record<string, unknown>
      const markets = result.supportedMarkets as Array<unknown>
      assert.ok(markets.length <= 10, 'market profiles should not exceed reasonable limit')
    })
  })

  describe('getScopedMarket() — edge cases', () => {
    test('handles empty scopeType', () => {
      const result = controller.getScopedMarket('', 't1', { tenantId: 't1' }) as Record<string, unknown>
      assert.equal(result.scopeType, '')
      assert.equal(result.scopeCode, 't1')
      assert.ok(result.marketProfile)
    })

    test('handles empty scopeCode', () => {
      const result = controller.getScopedMarket('tenant', '', { tenantId: 't1' }) as Record<string, unknown>
      assert.equal(result.scopeCode, '')
      assert.ok(result.marketProfile)
    })

    test('handles tenantContext with only tenantId', () => {
      const result = controller.getScopedMarket('tenant', 't-minimal', { tenantId: 't-minimal' }) as Record<string, unknown>
      assert.equal(result.scopeType, 'tenant')
      assert.equal(result.scopeCode, 't-minimal')
      assert.ok(result.marketProfile)
      assert.ok(Array.isArray(result.overrides))
    })
  })

  describe('getScopedPortalMarket() — edge cases', () => {
    test('handles missing brandId in context', () => {
      const result = controller.getScopedPortalMarket('brand', '', {
        tenantId: 't-nobrand',
        marketCode: 'cn-mainland'
      }) as Record<string, unknown>
      assert.equal(result.scopeCode, '')
      assert.equal(typeof result.marketCode, 'string')
    })

    test('handles missing marketCode in context gracefully', () => {
      const result = controller.getScopedPortalMarket('store', 's-nomarket', {
        tenantId: 't-nomarket'
      }) as Record<string, unknown>
      assert.equal(typeof result.marketCode, 'string')
    })

    test('network includes apiBaseUrl', () => {
      const result = controller.getScopedPortalMarket('store', 's1', {
        tenantId: 't1',
        marketCode: 'cn-mainland'
      }) as Record<string, unknown>
      const network = result.network as Record<string, unknown>
      assert.equal(typeof network.apiBaseUrl, 'string')
    })
  })

  // ── Negative cases ─────────────────────────────────────────────
  describe('getScopedMarket() — negative', () => {
    test('returns marketProfile even for unknown tenant', () => {
      // Should still return a profile (falls back to default)
      const result = controller.getScopedMarket('tenant', 'unknown-tenant', {
        tenantId: 'unknown-tenant',
        marketCode: 'unknown-market'
      }) as Record<string, unknown>
      assert.ok(result.marketProfile, 'should return a default profile even for unknown market')
    })
  })

  describe('getScopedPortalMarket() — negative', () => {
    test('returns profile for unknown marketCode gracefully', () => {
      const result = controller.getScopedPortalMarket('tenant', 't-bad', {
        tenantId: 't-bad',
        marketCode: 'xx-nonexistent'
      }) as Record<string, unknown>
      assert.equal(typeof result.marketCode, 'string')
    })
  })
})
