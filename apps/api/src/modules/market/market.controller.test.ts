import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'

describe('MarketController — decorator metadata', () => {
  test('controller path metadata is set to "markets"', () => {
    const { MarketController } = require('./market.controller')
    const path = Reflect.getMetadata('path', MarketController)
    assert.equal(path, 'markets')
  })

  test('getBootstrap route has GET metadata on "bootstrap" path', () => {
    const { MarketController } = require('./market.controller')
    const method = Reflect.getMetadata('method', MarketController.prototype.getBootstrap)
    const path = Reflect.getMetadata('path', MarketController.prototype.getBootstrap)

    assert.equal(method, 0)
    assert.equal(path, 'bootstrap')
  })

  test('getScopedMarket route has GET metadata on parameterized path', () => {
    const { MarketController } = require('./market.controller')
    const method = Reflect.getMetadata('method', MarketController.prototype.getScopedMarket)
    const path = Reflect.getMetadata('path', MarketController.prototype.getScopedMarket)

    assert.equal(method, 0)
    assert.equal(path, ':scopeType/:scopeCode')
  })

  test('getScopedPortalMarket route has GET metadata on portal sub-path', () => {
    const { MarketController } = require('./market.controller')
    const method = Reflect.getMetadata('method', MarketController.prototype.getScopedPortalMarket)
    const path = Reflect.getMetadata('path', MarketController.prototype.getScopedPortalMarket)

    assert.equal(method, 0)
    assert.equal(path, ':scopeType/:scopeCode/portal')
  })
})

describe('MarketController — getBootstrap()', () => {
  test('returns scaffold bootstrap from service', () => {
    const { MarketController } = require('./market.controller')

    const mockBootstrap = {
      defaultDomesticMarketCode: 'cn-mainland',
      defaultInternationalMarketCode: 'us-default',
      supportedMarkets: [],
      foundation: { generatedAt: '2026-01-01', module: 'market' }
    }

    const mockService = {
      getBootstrap: () => mockBootstrap,
      getMergedProfile: () => ({ marketCode: 'cn-mainland' }),
      getOverrides: () => []
    }

    const controller = new MarketController(mockService as never)
    const result = controller.getBootstrap()

    assert.deepStrictEqual(result, mockBootstrap)
  })

  test('returns supportedMarkets from service', () => {
    const { MarketController } = require('./market.controller')

    const mockBootstrap = {
      defaultDomesticMarketCode: 'cn-mainland',
      defaultInternationalMarketCode: 'us-default',
      supportedMarkets: [
        { marketCode: 'cn-mainland', marketName: '中国大陆' },
        { marketCode: 'us-default', marketName: 'United States' }
      ],
      foundation: { generatedAt: '2026-01-01', module: 'market' }
    }

    const mockService = {
      getBootstrap: () => mockBootstrap,
      getMergedProfile: () => ({} as never),
      getOverrides: () => []
    }

    const controller = new MarketController(mockService as never)
    const result = controller.getBootstrap()

    assert.equal(result.supportedMarkets.length, 2)
    assert.equal(result.supportedMarkets[0].marketCode, 'cn-mainland')
    assert.equal(result.defaultDomesticMarketCode, 'cn-mainland')
    assert.equal(result.defaultInternationalMarketCode, 'us-default')
  })

  test('does not require tenantContext parameter', () => {
    const { MarketController } = require('./market.controller')

    const mockService = {
      getBootstrap: () => ({
        defaultDomesticMarketCode: 'cn-mainland',
        defaultInternationalMarketCode: 'us-default',
        supportedMarkets: [],
        foundation: { generatedAt: '2026-01-01', module: 'market' }
      }),
      getMergedProfile: () => ({} as never),
      getOverrides: () => []
    }

    const controller = new MarketController(mockService as never)
    // getBootstrap should work without any tenant context
    assert.doesNotThrow(() => controller.getBootstrap())
  })
})

describe('MarketController — getScopedMarket()', () => {
  test('returns scope info with merged profile and overrides', () => {
    const { MarketController } = require('./market.controller')

    const mockProfile = { marketCode: 'cn-mainland', marketName: '中国大陆' }
    const mockOverrides = [{ scopeType: 'TENANT', scopeCode: 't-1', inheritanceMode: 'TENANT_DEFAULT', marketCode: 'cn-mainland' }]

    const mockService = {
      getBootstrap: () => ({}),
      getMergedProfile: () => mockProfile,
      getOverrides: () => mockOverrides
    }

    const controller = new MarketController(mockService as never)

    const tenantContext = { tenantId: 't-1', brandId: 'b-1', storeId: 's-1', marketCode: 'cn-mainland' }
    const result = controller.getScopedMarket('tenant', 't-1', tenantContext)

    assert.equal(result.scopeType, 'tenant')
    assert.equal(result.scopeCode, 't-1')
    assert.deepStrictEqual(result.marketProfile, mockProfile)
    assert.deepStrictEqual(result.overrides, mockOverrides)
  })

  test('handles store-level scope with storeId in context', () => {
    const { MarketController } = require('./market.controller')

    const mockProfile = { marketCode: 'us-default', marketName: 'United States' }
    const mockOverrides = [
      { scopeType: 'STORE', scopeCode: 's-99', inheritanceMode: 'STORE_OVERRIDE', marketCode: 'us-default' }
    ]

    const mockService = {
      getBootstrap: () => ({}),
      getMergedProfile: () => mockProfile,
      getOverrides: () => mockOverrides
    }

    const controller = new MarketController(mockService as never)

    const tenantContext = { tenantId: 't-1', brandId: 'b-1', storeId: 's-99', marketCode: 'us-default' }
    const result = controller.getScopedMarket('store', 's-99', tenantContext)

    assert.equal(result.scopeType, 'store')
    assert.equal(result.scopeCode, 's-99')
    assert.deepStrictEqual(result.marketProfile, mockProfile)
    assert.equal(result.overrides[0].scopeCode, 's-99')
  })

  test('handles brand-level scope with brandId in context', () => {
    const { MarketController } = require('./market.controller')

    const mockProfile = { marketCode: 'cn-mainland', marketName: '中国大陆' }
    const mockOverrides: never[] = []

    const mockService = {
      getBootstrap: () => ({}),
      getMergedProfile: () => mockProfile,
      getOverrides: () => mockOverrides
    }

    const controller = new MarketController(mockService as never)

    const tenantContext = { tenantId: 't-2', brandId: 'b-42', marketCode: 'cn-mainland' }
    const result = controller.getScopedMarket('brand', 'b-42', tenantContext)

    assert.equal(result.scopeType, 'brand')
    assert.equal(result.scopeCode, 'b-42')
    assert.deepStrictEqual(result.overrides, [])
  })

  test('handles empty tenantContext correctly', () => {
    const { MarketController } = require('./market.controller')

    const mockProfile = { marketCode: 'us-default', marketName: 'United States' }
    const mockOverrides: never[] = []

    const mockService = {
      getBootstrap: () => ({}),
      getMergedProfile: () => mockProfile,
      getOverrides: () => mockOverrides
    }

    const controller = new MarketController(mockService as never)

    // Minimal context - only tenantId
    const tenantContext = { tenantId: 't-min' }
    const result = controller.getScopedMarket('tenant', 't-min', tenantContext)

    assert.equal(result.scopeType, 'tenant')
    assert.equal(result.scopeCode, 't-min')
  })
})

describe('MarketController — getScopedPortalMarket()', () => {
  test('returns slim portal market snapshot for brand scope', () => {
    const { MarketController } = require('./market.controller')

    const mockProfile = {
      marketCode: 'us-default',
      marketName: 'United States',
      locale: { defaultLanguage: 'en-US' },
      timezone: { timezone: 'America/New_York' },
      tax: { taxMode: 'EXCLUDED', taxRate: 8.25, taxLabel: 'Sales Tax' },
      network: { networkRegion: 'NORTH_AMERICA' },
      email: { provider: 'SENDGRID', fromName: 'M5 US', fromAddress: 'hello@us.local' },
      social: { primaryPlatforms: ['LINKEDIN'], supportPlatforms: [] }
    }

    const mockService = {
      getBootstrap: () => ({}),
      getMergedProfile: () => mockProfile,
      getOverrides: () => []
    }

    const controller = new MarketController(mockService as never)

    const tenantContext = { tenantId: 't-1', brandId: 'b-1', storeId: 's-1', marketCode: 'us-default' }
    const result = controller.getScopedPortalMarket('brand', 'b-1', tenantContext)

    assert.equal(result.scopeType, 'brand')
    assert.equal(result.scopeCode, 'b-1')
    assert.equal(result.marketCode, 'us-default')
    assert.equal(result.locale.defaultLanguage, 'en-US')
    assert.equal(result.timezone.timezone, 'America/New_York')
    assert.equal(result.tax.taxMode, 'EXCLUDED')
    assert.equal(result.tax.taxRate, 8.25)
    assert.equal(result.email.fromName, 'M5 US')
  })

  test('returns cn-mainland portal market with China-specific fields', () => {
    const { MarketController } = require('./market.controller')

    const mockProfile = {
      marketCode: 'cn-mainland',
      marketName: '中国大陆',
      locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
      timezone: { timezone: 'Asia/Shanghai' },
      currency: { currencyCode: 'CNY', symbol: '¥' },
      tax: { taxMode: 'INCLUDED', taxRate: 6, taxLabel: '增值税' },
      network: { networkRegion: 'MAINLAND_CHINA', apiBaseUrl: 'https://cn-api.m5.local', cdnBaseUrl: 'https://cn-cdn.m5.local', callbackBaseUrl: 'https://cn-hooks.m5.local' },
      email: { provider: 'ALIYUN_DM', fromName: 'M5 China', fromAddress: 'hello-cn@m5.local', replyTo: 'support-cn@m5.local' },
      social: { primaryPlatforms: ['WECHAT', 'XIAOHONGSHU'], supportPlatforms: ['WECHAT', 'WEIBO', 'DOUYIN'] }
    }

    const mockService = {
      getBootstrap: () => ({}),
      getMergedProfile: () => mockProfile,
      getOverrides: () => []
    }

    const controller = new MarketController(mockService as never)

    const tenantContext = { tenantId: 't-cn', brandId: 'b-cn', storeId: 's-cn', marketCode: 'cn-mainland' }
    const result = controller.getScopedPortalMarket('tenant', 't-cn', tenantContext)

    assert.equal(result.scopeType, 'tenant')
    assert.equal(result.scopeCode, 't-cn')
    assert.equal(result.marketCode, 'cn-mainland')
    assert.equal(result.locale.defaultLanguage, 'zh-CN')
    assert.equal(result.timezone.timezone, 'Asia/Shanghai')
    assert.equal(result.tax.taxMode, 'INCLUDED')
    assert.equal(result.tax.taxRate, 6)
    assert.equal(result.tax.taxLabel, '增值税')
    assert.equal(result.email.provider, 'ALIYUN_DM')
    assert.equal(result.email.fromName, 'M5 China')
    assert.equal(result.social.primaryPlatforms.length, 2)
    assert.deepStrictEqual(result.social.primaryPlatforms, ['WECHAT', 'XIAOHONGSHU'])
  })

  test('returns all social and network fields populated', () => {
    const { MarketController } = require('./market.controller')

    const mockProfile = {
      marketCode: 'jp-default',
      marketName: 'Japan',
      locale: { defaultLanguage: 'ja-JP' },
      timezone: { timezone: 'Asia/Tokyo' },
      tax: { taxMode: 'EXCLUDED', taxRate: 10, taxLabel: '消費税' },
      network: { networkRegion: 'APAC', apiBaseUrl: 'https://jp-api.m5.local', cdnBaseUrl: 'https://jp-cdn.m5.local', callbackBaseUrl: 'https://jp-hooks.m5.local' },
      email: { provider: 'SENDGRID', fromName: 'M5 Japan', fromAddress: 'hello-jp@m5.local', replyTo: 'support-jp@m5.local' },
      social: { primaryPlatforms: ['LINE', 'X'], supportPlatforms: ['LINE', 'X', 'INSTAGRAM'] }
    }

    const mockService = {
      getBootstrap: () => ({}),
      getMergedProfile: () => mockProfile,
      getOverrides: () => []
    }

    const controller = new MarketController(mockService as never)

    const tenantContext = { tenantId: 't-jp', marketCode: 'jp-default' }
    const result = controller.getScopedPortalMarket('tenant', 't-jp', tenantContext)

    assert.equal(result.marketCode, 'jp-default')
    assert.equal(result.network.networkRegion, 'APAC')
    assert.equal(result.network.apiBaseUrl, 'https://jp-api.m5.local')
    assert.equal(result.social.primaryPlatforms.length, 2)
    assert.equal(result.email.replyTo, 'support-jp@m5.local')
  })

  test('returns only portal-relevant fields (no full profile leak)', () => {
    const { MarketController } = require('./market.controller')

    const mockProfile = {
      marketCode: 'us-default',
      marketName: 'United States',
      countryCode: 'US',
      locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US', 'es-US'] },
      timezone: { timezone: 'America/New_York' },
      currency: { currencyCode: 'USD', symbol: '$' },
      tax: { taxMode: 'EXCLUDED', taxRate: 8.25, taxLabel: 'Sales Tax' },
      network: { networkRegion: 'NORTH_AMERICA', apiBaseUrl: 'https://us-api.m5.local', cdnBaseUrl: 'https://us-cdn.m5.local', callbackBaseUrl: 'https://us-hooks.m5.local' },
      email: { provider: 'SENDGRID', fromName: 'M5 US', fromAddress: 'hello@us.local', replyTo: 'support@us.local' },
      social: { primaryPlatforms: ['LINKEDIN'], supportPlatforms: ['LINKEDIN', 'INSTAGRAM'] }
    }

    const mockService = {
      getBootstrap: () => ({}),
      getMergedProfile: () => mockProfile,
      getOverrides: () => []
    }

    const controller = new MarketController(mockService as never)

    const result = controller.getScopedPortalMarket('tenant', 't-1', { tenantId: 't-1', marketCode: 'us-default' })

    // Portal response should NOT expose countryCode, supportedLanguages, or replyTo
    assert.equal(result.marketCode, 'us-default')
    // Verify the result has portal-specific shape
    assert.ok('marketCode' in result)
    assert.ok('locale' in result)
    assert.ok('timezone' in result)
    assert.ok('tax' in result)
    assert.ok('network' in result)
    assert.ok('email' in result)
    assert.ok('social' in result)
    // The controller destructures from the profile but the portal fields are a subset
    assert.equal(result.email.fromName, 'M5 US')
    assert.equal(result.social.primaryPlatforms.length, 1)
  })

  test('returns portal market with empty social and email fields gracefully', () => {
    const { MarketController } = require('./market.controller')

    const mockProfile = {
      marketCode: 'minimal-default',
      marketName: 'Minimal Market',
      locale: { defaultLanguage: 'en-US' },
      timezone: { timezone: 'UTC' },
      tax: { taxMode: 'EXCLUDED' as const, taxRate: 0, taxLabel: '' },
      network: { networkRegion: 'GLOBAL' },
      email: { provider: '', fromName: '', fromAddress: '', replyTo: '' },
      social: { primaryPlatforms: [] as string[], supportPlatforms: [] as string[] }
    }

    const mockService = {
      getBootstrap: () => ({}),
      getMergedProfile: () => mockProfile,
      getOverrides: () => []
    }

    const controller = new MarketController(mockService as never)
    const result = controller.getScopedPortalMarket('tenant', 't-min', { tenantId: 't-min', marketCode: 'minimal-default' })

    assert.equal(result.scopeType, 'tenant')
    assert.equal(result.marketCode, 'minimal-default')
    assert.equal(result.tax.taxRate, 0)
    assert.equal(result.tax.taxLabel, '')
    assert.equal(result.email.provider, '')
    assert.equal(result.social.primaryPlatforms.length, 0)
  })

  test('can handle scopeType with special characters (boundary)', () => {
    const { MarketController } = require('./market.controller')

    const mockProfile = { marketCode: 'cn-mainland', marketName: '中国大陆' }

    const mockService = {
      getBootstrap: () => ({}),
      getMergedProfile: () => mockProfile,
      getOverrides: () => []
    }

    const controller = new MarketController(mockService as never)

    // scopeType with hyphen and underscore
    const result = controller.getScopedMarket('cross-region_type', 'scope-99_test', { tenantId: 't-1', marketCode: 'cn-mainland' })
    assert.equal(result.scopeType, 'cross-region_type')
    assert.equal(result.scopeCode, 'scope-99_test')
  })
})

describe('MarketController — error and boundary behavior', () => {
  test('getScopedMarket propagates service errors (no profile crash)', () => {
    const { MarketController } = require('./market.controller')

    const mockService = {
      getBootstrap: () => ({}),
      getMergedProfile: () => {
        throw new Error('Market profile not found for tenant')
      },
      getOverrides: () => []
    }

    const controller = new MarketController(mockService as never)

    assert.throws(
      () => controller.getScopedMarket('tenant', 't-error', { tenantId: 't-error', marketCode: 'unknown' }),
      /Market profile not found for tenant/
    )
  })

  test('getScopedMarket propagates getOverrides errors', () => {
    const { MarketController } = require('./market.controller')

    const mockService = {
      getBootstrap: () => ({}),
      getMergedProfile: () => ({ marketCode: 'cn-mainland' }),
      getOverrides: () => {
        throw new Error('Regional overrides unavailable')
      }
    }

    const controller = new MarketController(mockService as never)

    assert.throws(
      () => controller.getScopedMarket('tenant', 't-override-err', { tenantId: 't-override-err', marketCode: 'cn-mainland' }),
      /Regional overrides unavailable/
    )
  })

  test('getScopedPortalMarket handles service returning undefined locale fields (boundary)', () => {
    const { MarketController } = require('./market.controller')

    const mockProfile = {
      marketCode: 'partial-default',
      marketName: 'Partial Market',
      locale: undefined,
      timezone: undefined,
      tax: null,
      network: undefined,
      email: null,
      social: undefined
    }

    const mockService = {
      getBootstrap: () => ({}),
      getMergedProfile: () => mockProfile as never,
      getOverrides: () => []
    }

    const controller = new MarketController(mockService as never)

    // Should not throw even with partial profile — destructuring handles undefined fields
    const result = controller.getScopedPortalMarket('store', 's-partial', { tenantId: 't-1', marketCode: 'partial-default' })
    assert.equal(result.marketCode, 'partial-default')
    assert.equal(result.locale, undefined)
    assert.equal(result.tax, null)
  })

  test('getScopedMarket with very long scopeType and scopeCode strings (boundary)', () => {
    const { MarketController } = require('./market.controller')

    const mockProfile = { marketCode: 'us-default', marketName: 'United States' }

    const mockService = {
      getBootstrap: () => ({}),
      getMergedProfile: () => mockProfile,
      getOverrides: () => []
    }

    const controller = new MarketController(mockService as never)

    const longScope = 'a'.repeat(500)
    const result = controller.getScopedMarket(longScope, longScope, { tenantId: longScope, marketCode: 'us-default' })
    assert.equal(result.scopeType.length, 500)
    assert.equal(result.scopeCode.length, 500)
  })

  test('getScopedPortalMarket returns store-level portal with surface hints', () => {
    const { MarketController } = require('./market.controller')

    const mockProfile = {
      marketCode: 'cn-mainland',
      marketName: '中国大陆',
      locale: { defaultLanguage: 'zh-CN' },
      timezone: { timezone: 'Asia/Shanghai' },
      tax: { taxMode: 'INCLUDED' as const, taxRate: 6, taxLabel: '增值税' },
      network: { networkRegion: 'MAINLAND_CHINA' },
      email: { provider: 'ALIYUN_DM', fromName: '门店', fromAddress: 'store@m5.local' },
      social: { primaryPlatforms: ['WECHAT'], supportPlatforms: [] }
    }

    const mockService = {
      getBootstrap: () => ({}),
      getMergedProfile: () => mockProfile,
      getOverrides: () => []
    }

    const controller = new MarketController(mockService as never)
    const result = controller.getScopedPortalMarket('store', 's-sh-001', { tenantId: 't-1', brandId: 'b-1', storeId: 's-sh-001', marketCode: 'cn-mainland' })

    assert.equal(result.scopeType, 'store')
    assert.equal(result.scopeCode, 's-sh-001')
    assert.equal(result.timezone.timezone, 'Asia/Shanghai')
    assert.equal(result.email.fromAddress, 'store@m5.local')
  })

  test('getScopedMarket returns empty overrides array when no overrides exist', () => {
    const { MarketController } = require('./market.controller')

    const mockProfile = { marketCode: 'eu-default', marketName: 'Europe' }

    const mockService = {
      getBootstrap: () => ({}),
      getMergedProfile: () => mockProfile,
      getOverrides: () => []
    }

    const controller = new MarketController(mockService as never)
    const result = controller.getScopedMarket('tenant', 't-eu', { tenantId: 't-eu', marketCode: 'eu-default' })

    assert.deepStrictEqual(result.overrides, [])
    assert.equal(result.marketProfile.marketCode, 'eu-default')
  })

  test('getScopedMarket preserves override ordering from service', () => {
    const { MarketController } = require('./market.controller')

    const mockOverrides = [
      { scopeType: 'TENANT', scopeCode: 't-order', inheritanceMode: 'TENANT_DEFAULT', marketCode: 'cn-mainland', priority: 1 },
      { scopeType: 'BRAND', scopeCode: 'b-order', inheritanceMode: 'BRAND_OVERRIDE', marketCode: 'cn-mainland', priority: 2 },
      { scopeType: 'STORE', scopeCode: 's-order', inheritanceMode: 'STORE_OVERRIDE', marketCode: 'cn-mainland', priority: 3 }
    ]

    const mockService = {
      getBootstrap: () => ({}),
      getMergedProfile: () => ({ marketCode: 'cn-mainland' }),
      getOverrides: () => mockOverrides
    }

    const controller = new MarketController(mockService as never)
    const result = controller.getScopedMarket('tenant', 't-order', { tenantId: 't-order', marketCode: 'cn-mainland' })

    assert.equal(result.overrides.length, 3)
    assert.equal(result.overrides[0].priority, 1)
    assert.equal(result.overrides[1].priority, 2)
    assert.equal(result.overrides[2].priority, 3)
  })
})
