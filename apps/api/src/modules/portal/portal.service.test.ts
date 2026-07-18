import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { PortalService } from './portal.service'
import type { MarketService } from '../market/market.service'
import type { FoundationService } from '../foundation/foundation.service'
import { LanguageCode, PortalAudience, PortalScopeType, PortalChannel, StorefrontSurface } from '@m5/domain'
import type { RequestTenantContext } from '../tenant/tenant.types'
import type { DomainResolutionService } from '../saas-advanced/domain-resolution.service'

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

function mockDomainResolutionService(
  overrides: Partial<Pick<DomainResolutionService, 'findPrimaryDomain'>> = {},
) {
  return {
    findPrimaryDomain: () => null,
    ...overrides,
  } as DomainResolutionService
}

describe('portal.service: resolveTenantPortal', () => {
  it('returns tenant portal with correct audience and scope', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveTenantPortal(createContext())

    assert.equal(portal.audience, PortalAudience.ToB)
    assert.equal(portal.scopeType, PortalScopeType.Tenant)
    assert.equal(portal.scopeCode, 'tenant-demo')
    assert.equal(portal.tenantCode, 'tenant-demo')
    assert.equal(portal.marketCode, 'cn-mainland')
    assert.equal(portal.channel, PortalChannel.Web)
  })

  it('tenant portal name includes tenantId', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveTenantPortal(createContext())

    assert.ok(portal.name.includes('tenant-demo'))
  })

  it('tenant portal has login entry with sso enabled', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveTenantPortal(createContext())

    assert.ok(portal.loginEntry)
    assert.equal(portal.loginEntry.ssoEnabled, true)
    assert.ok(portal.loginEntry.label.includes('租户后台'))
    assert.ok(portal.loginEntry.loginPath.includes('tenant-demo'))
  })

  it('tenant portal supports the market profile languages', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveTenantPortal(createContext())

    assert.deepEqual(portal.supportedLanguages, [LanguageCode.ZhCn])
  })

  it('tenant portal primaryDomain is constructed correctly', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveTenantPortal(createContext())

    assert.equal(portal.primaryDomain, 'tenant-demo.cn-mainland.b2b.local')
    assert.equal(portal.domainSource, 'default')
  })

  it('tenant portal 优先返回 custom primary domain', () => {
    const svc = new PortalService(
      mockMarketService(),
      mockFoundationService(),
      undefined,
      mockDomainResolutionService({
        findPrimaryDomain: (scope) =>
          scope.scopeType === 'TENANT' && scope.tenantId === 'tenant-demo'
            ? 'tenant.custom.example.com'
            : null,
      }),
    )
    const portal = svc.resolveTenantPortal(createContext())

    assert.equal(portal.primaryDomain, 'tenant.custom.example.com')
    assert.equal(portal.domainSource, 'custom')
  })
})

describe('portal.service: resolveBrandPortal', () => {
  it('returns brand portal with correct audience and scope', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveBrandPortal(createContext())

    assert.equal(portal.audience, PortalAudience.ToB)
    assert.equal(portal.scopeType, PortalScopeType.Brand)
    assert.equal(portal.scopeCode, 'brand-demo')
    assert.equal(portal.brandCode, 'brand-demo')
    assert.equal(portal.marketCode, 'cn-mainland')
  })

  it('brand portal uses default brand code when not provided', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveBrandPortal(createContext({ brandId: undefined }))

    assert.equal(portal.scopeCode, 'brand-demo')
    assert.equal(portal.brandCode, 'brand-demo')
  })

  it('brand portal has login entry with sso enabled', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveBrandPortal(createContext())

    assert.ok(portal.loginEntry)
    assert.equal(portal.loginEntry.ssoEnabled, true)
    assert.ok(portal.loginEntry.label.includes('品牌后台'))
  })

  it('brand portal 优先返回品牌 custom primary domain', () => {
    const svc = new PortalService(
      mockMarketService(),
      mockFoundationService(),
      undefined,
      mockDomainResolutionService({
        findPrimaryDomain: (scope) =>
          scope.scopeType === 'BRAND' && scope.brandId === 'brand-demo'
            ? 'brand.custom.example.com'
            : null,
      }),
    )
    const portal = svc.resolveBrandPortal(createContext())

    assert.equal(portal.primaryDomain, 'brand.custom.example.com')
    assert.equal(portal.domainSource, 'custom')
  })
})

describe('portal.service: resolveStorePortal', () => {
  it('returns store portal with ToC audience', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveStorePortal(createContext())

    assert.equal(portal.audience, PortalAudience.ToC)
    assert.equal(portal.scopeType, PortalScopeType.Store)
    assert.equal(portal.scopeCode, 'store-001')
    assert.equal(portal.storeCode, 'store-001')
    assert.equal(portal.storeName, 'store-001 门店')
  })

  it('store portal uses defaults when not provided', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveStorePortal(createContext({ brandId: undefined, storeId: undefined }))

    assert.equal(portal.brandCode, 'brand-demo')
    assert.equal(portal.storeCode, 'store-001')
  })

  it('store portal has supported surfaces for all channels', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveStorePortal(createContext())

    assert.ok(portal.supportedSurfaces.includes(StorefrontSurface.OfficialSite))
    assert.ok(portal.supportedSurfaces.includes(StorefrontSurface.H5))
    assert.ok(portal.supportedSurfaces.includes(StorefrontSurface.MiniApp))
    assert.ok(portal.supportedSurfaces.includes(StorefrontSurface.App))
    assert.ok(portal.supportedSurfaces.includes(StorefrontSurface.PcConsole))
    assert.ok(portal.supportedSurfaces.includes(StorefrontSurface.PadConsole))
  })

  it('store portal in cn-mainland only supports ZhCn', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const portal = svc.resolveStorePortal(createContext())

    assert.deepEqual(portal.supportedLanguages, [LanguageCode.ZhCn])
  })

  it('store portal 优先返回门店 custom primary domain', () => {
    const svc = new PortalService(
      mockMarketService(),
      mockFoundationService(),
      undefined,
      mockDomainResolutionService({
        findPrimaryDomain: (scope) =>
          scope.scopeType === 'STORE' && scope.storeId === 'store-001'
            ? 'store.custom.example.com'
            : null,
      }),
    )
    const portal = svc.resolveStorePortal(createContext())

    assert.equal(portal.primaryDomain, 'store.custom.example.com')
    assert.equal(portal.domainSource, 'custom')
  })
})

describe('portal.service: getBootstrap', () => {
  it('getBootstrap returns bootstrap response with portals', () => {
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

  it('getBootstrap tenantPortal has ToB audience', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const result = svc.getBootstrap(createContext())

    assert.equal(result.tenantPortal.audience, PortalAudience.ToB)
  })

  it('getBootstrap storePortal has ToC audience', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const result = svc.getBootstrap(createContext())

    assert.equal(result.storePortal.audience, PortalAudience.ToC)
  })

  it('getBootstrap marketProfile has correct marketCode', () => {
    const svc = new PortalService(mockMarketService(), mockFoundationService())
    const result = svc.getBootstrap(createContext())

    assert.equal(result.marketProfile.marketCode, 'cn-mainland')
  })

  it('getBootstrap 三个 scope 都优先返回 custom primary domain', () => {
    const svc = new PortalService(
      mockMarketService(),
      mockFoundationService(),
      undefined,
      mockDomainResolutionService({
        findPrimaryDomain: (scope) => {
          if (scope.scopeType === 'TENANT') return 'tenant.custom.example.com'
          if (scope.scopeType === 'BRAND') return 'brand.custom.example.com'
          if (scope.scopeType === 'STORE') return 'store.custom.example.com'
          return null
        },
      }),
    )
    const result = svc.getBootstrap(createContext())

    assert.equal(result.tenantPortal.primaryDomain, 'tenant.custom.example.com')
    assert.equal(result.tenantPortal.domainSource, 'custom')
    assert.equal(result.brandPortal.primaryDomain, 'brand.custom.example.com')
    assert.equal(result.brandPortal.domainSource, 'custom')
    assert.equal(result.storePortal.primaryDomain, 'store.custom.example.com')
    assert.equal(result.storePortal.domainSource, 'custom')
  })

  it('getBootstrap 未命中 custom primary 时三个 scope 都标记 default', () => {
    const svc = new PortalService(
      mockMarketService(),
      mockFoundationService(),
      undefined,
      mockDomainResolutionService({
        findPrimaryDomain: () => null,
      }),
    )
    const result = svc.getBootstrap(createContext())

    assert.equal(result.tenantPortal.domainSource, 'default')
    assert.equal(result.brandPortal.domainSource, 'default')
    assert.equal(result.storePortal.domainSource, 'default')
  })
})
