import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { PortalService } from './portal.service'
import type { MarketService } from '../market/market.service'
import type { FoundationService } from '../foundation/foundation.service'
import { LanguageCode, PortalAudience, PortalScopeType, PortalChannel, StorefrontSurface } from '@m5/domain'
import type { RequestTenantContext } from '../tenant/tenant.types'

function mockMarketService() {
  return {
    getMergedProfile: () => ({
      marketCode: 'cn-mainland',
      marketName: '中国大陆',
      locale: {
        defaultLanguage: LanguageCode.ZhCn,
        supportedLanguages: [LanguageCode.ZhCn]
      },
      timezone: { timezone: 'Asia/Shanghai' },
      currency: { currencyCode: 'CNY', symbol: '¥' },
      tax: { taxMode: 'INCLUDED', taxRate: 6, taxLabel: '增值税' },
      network: {
        networkRegion: 'MAINLAND_CHINA',
        apiBaseUrl: 'https://cn-api.m5.local',
        cdnBaseUrl: 'https://cn-cdn.m5.local',
        callbackBaseUrl: 'https://cn-hooks.m5.local'
      },
      email: {
        provider: 'ALIYUN_DM',
        fromName: 'M5 China',
        fromAddress: 'hello-cn@m5.local',
        replyTo: 'hello-cn@m5.local'
      }
    }),
    getOverrides: () => []
  } as unknown as MarketService
}

function mockFoundationService() {
  return {
    getDependencySummary: () => ({ consumer: 'portal' })
  } as unknown as FoundationService
}

function createContext(overrides: Partial<RequestTenantContext> = {}): RequestTenantContext {
  return {
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
    ...overrides
  }
}

describe('portal.service: resolveTenantPortal', () => {
  test('returns tenant portal with correct audience and scope', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveTenantPortal(createContext())

    assert.equal(portal.audience, PortalAudience.ToB)
    assert.equal(portal.scopeType, PortalScopeType.Tenant)
    assert.equal(portal.scopeCode, 'tenant-demo')
    assert.equal(portal.tenantCode, 'tenant-demo')
    assert.equal(portal.marketCode, 'cn-mainland')
    assert.equal(portal.channel, PortalChannel.Web)
  })

  test('tenant portal name includes tenantId', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveTenantPortal(createContext())

    assert.ok(portal.name.includes('tenant-demo'))
  })

  test('tenant portal has login entry with sso enabled', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveTenantPortal(createContext())

    assert.ok(portal.loginEntry)
    assert.equal(portal.loginEntry.ssoEnabled, true)
    assert.ok(portal.loginEntry.label.includes('租户后台'))
    assert.ok(portal.loginEntry.loginPath.includes('tenant-demo'))
  })

  test('tenant portal supports the market profile languages', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveTenantPortal(createContext())

    assert.deepEqual(portal.supportedLanguages, [LanguageCode.ZhCn])
  })

  test('tenant portal primaryDomain is constructed correctly', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveTenantPortal(createContext())

    assert.equal(portal.primaryDomain, 'tenant-demo.cn-mainland.b2b.local')
  })
})

describe('portal.service: resolveBrandPortal', () => {
  test('returns brand portal with correct audience and scope', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveBrandPortal(createContext())

    assert.equal(portal.audience, PortalAudience.ToB)
    assert.equal(portal.scopeType, PortalScopeType.Brand)
    assert.equal(portal.scopeCode, 'brand-demo')
    assert.equal(portal.brandCode, 'brand-demo')
    assert.equal(portal.marketCode, 'cn-mainland')
  })

  test('brand portal uses default brand code when not provided', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveBrandPortal(createContext({ brandId: undefined }))

    assert.equal(portal.scopeCode, 'brand-demo')
    assert.equal(portal.brandCode, 'brand-demo')
  })

  test('brand portal has login entry with sso enabled', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveBrandPortal(createContext())

    assert.ok(portal.loginEntry)
    assert.equal(portal.loginEntry.ssoEnabled, true)
    assert.ok(portal.loginEntry.label.includes('品牌后台'))
  })
})

describe('portal.service: resolveStorePortal', () => {
  test('returns store portal with ToC audience', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveStorePortal(createContext())

    assert.equal(portal.audience, PortalAudience.ToC)
    assert.equal(portal.scopeType, PortalScopeType.Store)
    assert.equal(portal.scopeCode, 'store-001')
    assert.equal(portal.storeCode, 'store-001')
    assert.equal(portal.storeName, 'store-001 门店')
  })

  test('store portal uses defaults when not provided', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveStorePortal(createContext({ brandId: undefined, storeId: undefined }))

    assert.equal(portal.brandCode, 'brand-demo')
    assert.equal(portal.storeCode, 'store-001')
  })

  test('store portal has supported surfaces for all channels', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveStorePortal(createContext())

    assert.ok(portal.supportedSurfaces.includes(StorefrontSurface.OfficialSite))
    assert.ok(portal.supportedSurfaces.includes(StorefrontSurface.H5))
    assert.ok(portal.supportedSurfaces.includes(StorefrontSurface.MiniApp))
    assert.ok(portal.supportedSurfaces.includes(StorefrontSurface.App))
    assert.ok(portal.supportedSurfaces.includes(StorefrontSurface.PcConsole))
    assert.ok(portal.supportedSurfaces.includes(StorefrontSurface.PadConsole))
  })

  test('store portal in cn-mainland only supports ZhCn', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveStorePortal(createContext())

    assert.deepEqual(portal.supportedLanguages, [LanguageCode.ZhCn])
  })
})

describe('portal.service: getBootstrap', () => {
  test('getBootstrap returns bootstrap response with portals', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const result = svc.getBootstrap(createContext())

    assert.ok(result)
    assert.ok(result.tenantPortal)
    assert.ok(result.brandPortal)
    assert.ok(result.storePortal)
    assert.ok(result.marketProfile)
    assert.ok(result.regionalOverrides)
    assert.ok(Array.isArray(result.regionalOverrides))
  })

  test('getBootstrap tenantPortal has ToB audience', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const result = svc.getBootstrap(createContext())

    assert.equal(result.tenantPortal.audience, PortalAudience.ToB)
  })

  test('getBootstrap storePortal has ToC audience', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const result = svc.getBootstrap(createContext())

    assert.equal(result.storePortal.audience, PortalAudience.ToC)
  })

  test('getBootstrap marketProfile has correct marketCode', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const result = svc.getBootstrap(createContext())

    assert.equal(result.marketProfile.marketCode, 'cn-mainland')
  })
})
