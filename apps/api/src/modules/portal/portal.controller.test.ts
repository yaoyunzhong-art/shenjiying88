import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { PortalController } from './portal.controller'
import type { PortalService } from './portal.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { LanguageCode, PortalAudience, PortalChannel, PortalScopeType, StorefrontSurface } from '@m5/domain'
import { DECORATORS } from '@nestjs/swagger/dist/constants'

// ---- metadata assertions ----

it('portal controller path metadata is set', () => {
  const path = Reflect.getMetadata('path', PortalController)
  assert.equal(path, 'portals')
})

it('portal controller swagger tags metadata is set', () => {
  const tags = Reflect.getMetadata(DECORATORS.API_TAGS, PortalController) as string[] | undefined
  assert.deepEqual(tags, ['portal'])
})

it('portal controller getBootstrap route has GET metadata', () => {
  const method = Reflect.getMetadata('method', PortalController.prototype.getBootstrap)
  const path = Reflect.getMetadata('path', PortalController.prototype.getBootstrap)
  const operation = Reflect.getMetadata(
    DECORATORS.API_OPERATION,
    PortalController.prototype.getBootstrap,
  ) as { summary?: string; description?: string } | undefined

  assert.equal(method, 0) // GET = 0 in RequestMethod enum
  assert.equal(path, 'bootstrap')
  assert.equal(operation?.summary, '获取门户 bootstrap 信息')
})

it('portal controller getTenantPortal route metadata', () => {
  const method = Reflect.getMetadata('method', PortalController.prototype.getTenantPortal)
  const path = Reflect.getMetadata('path', PortalController.prototype.getTenantPortal)
  const operation = Reflect.getMetadata(
    DECORATORS.API_OPERATION,
    PortalController.prototype.getTenantPortal,
  ) as { summary?: string } | undefined
  assert.equal(method, 0)
  assert.equal(path, 'tenant-portal')
  assert.equal(operation?.summary, '获取租户级门户')
})

it('portal controller getBrandPortal route metadata', () => {
  const method = Reflect.getMetadata('method', PortalController.prototype.getBrandPortal)
  const path = Reflect.getMetadata('path', PortalController.prototype.getBrandPortal)
  const operation = Reflect.getMetadata(
    DECORATORS.API_OPERATION,
    PortalController.prototype.getBrandPortal,
  ) as { summary?: string } | undefined
  assert.equal(method, 0)
  assert.equal(path, 'brand-portal')
  assert.equal(operation?.summary, '获取品牌级门户')
})

it('portal controller getStorePortal route metadata', () => {
  const method = Reflect.getMetadata('method', PortalController.prototype.getStorePortal)
  const path = Reflect.getMetadata('path', PortalController.prototype.getStorePortal)
  const operation = Reflect.getMetadata(
    DECORATORS.API_OPERATION,
    PortalController.prototype.getStorePortal,
  ) as { summary?: string } | undefined
  assert.equal(method, 0)
  assert.equal(path, 'store-portal')
  assert.equal(operation?.summary, '获取门店级门户')
})

// ---- runtime behaviour tests ----

describe('getBootstrap() – happy path', () => {
  const mockBootstrapResponse = {
    tenantPortal: {
      audience: PortalAudience.ToB,
      scopeType: PortalScopeType.Tenant,
      scopeCode: 't-1',
      tenantCode: 't-1',
      marketCode: 'cn-mainland',
      channel: PortalChannel.Web,
      name: 't-1 ToB 官网',
      primaryDomain: 't-1.cn-mainland.b2b.local',
      supportedLanguages: [LanguageCode.ZhCn],
      heroTitle: 't-1 企业级经营门户',
      loginEntry: { label: '进入租户后台', loginPath: '/cn-mainland/t-1/login', ssoEnabled: true }
    },
    brandPortal: {
      audience: PortalAudience.ToB,
      scopeType: PortalScopeType.Brand,
      scopeCode: 'b-1',
      tenantCode: 't-1',
      brandCode: 'b-1',
      marketCode: 'cn-mainland',
      channel: PortalChannel.Web,
      name: 'b-1 品牌 ToB 官网',
      primaryDomain: 'b-1.t-1.cn-mainland.b2b.local',
      supportedLanguages: [LanguageCode.ZhCn],
      heroTitle: 'b-1 品牌经营官网',
      loginEntry: { label: '进入品牌后台', loginPath: '/cn-mainland/t-1/b-1/login', ssoEnabled: true }
    },
    storePortal: {
      audience: PortalAudience.ToC,
      scopeType: PortalScopeType.Store,
      scopeCode: 's-1',
      tenantCode: 't-1',
      brandCode: 'b-1',
      storeCode: 's-1',
      storeName: 's-1 门店',
      marketCode: 'cn-mainland',
      channel: PortalChannel.Web,
      name: 's-1 门店门户',
      primaryDomain: 's-1.b-1.t-1.cn-mainland.local',
      supportedLanguages: [LanguageCode.ZhCn],
      supportedSurfaces: [
        StorefrontSurface.OfficialSite,
        StorefrontSurface.H5,
        StorefrontSurface.MiniApp,
        StorefrontSurface.App,
        StorefrontSurface.PcConsole,
        StorefrontSurface.PadConsole
      ]
    },
    marketProfile: {
      marketCode: 'cn-mainland',
      marketName: '中国大陆',
      locale: { defaultLanguage: LanguageCode.ZhCn, supportedLanguages: [LanguageCode.ZhCn] },
      timezone: { timezone: 'Asia/Shanghai' },
      tax: { taxMode: 'INCLUDED', taxRate: 13, taxLabel: '增值税' },
      network: { networkRegion: 'CHINA_MAINLAND' },
      email: { provider: 'SMTP', fromName: 'M5 CN', fromAddress: 'hello@cn.local' },
      social: { primaryPlatforms: ['WECHAT'], supportPlatforms: [] }
    },
    regionalOverrides: [],
    foundationDependencies: [],
    foundationContracts: []
  }

  const fullContext: RequestTenantContext = {
    tenantId: 't-1',
    brandId: 'b-1',
    storeId: 's-1',
    marketCode: 'cn-mainland'
  }

  it('returns expected shape from service delegate', () => {
    const mockService = {
      getBootstrap: (ctx: RequestTenantContext) => ({ ...mockBootstrapResponse })
    }

    const controller = new PortalController(mockService as unknown as PortalService)
    const result = controller.getBootstrap(fullContext)

    assert.equal(result.tenantPortal.scopeType, PortalScopeType.Tenant)
    assert.equal(result.tenantPortal.audience, PortalAudience.ToB)
    assert.equal(result.tenantPortal.scopeCode, 't-1')

    assert.equal(result.brandPortal.scopeType, PortalScopeType.Brand)
    assert.equal(result.brandPortal.scopeCode, 'b-1')
    assert.equal(result.brandPortal.brandCode, 'b-1')

    assert.equal(result.storePortal.scopeType, PortalScopeType.Store)
    assert.equal(result.storePortal.scopeCode, 's-1')
    assert.equal(result.storePortal.storeName, 's-1 门店')
  })

  it('passes tenantContext through to service', () => {
    let capturedCtx: RequestTenantContext | undefined
    const mockService = {
      getBootstrap: (ctx: RequestTenantContext) => {
        capturedCtx = ctx
        return { ...mockBootstrapResponse }
      }
    }

    const controller = new PortalController(mockService as unknown as PortalService)
    controller.getBootstrap(fullContext)

    assert.deepStrictEqual(capturedCtx, fullContext)
  })

  it('returns foundationDependencies array', () => {
    const mockService = {
      getBootstrap: () => ({ ...mockBootstrapResponse })
    }

    const controller = new PortalController(mockService as unknown as PortalService)
    const result = controller.getBootstrap(fullContext)

    assert.ok(Array.isArray(result.foundationDependencies))
  })

  it('returns regionalOverrides array', () => {
    const mockService = {
      getBootstrap: () => ({ ...mockBootstrapResponse })
    }

    const controller = new PortalController(mockService as unknown as PortalService)
    const result = controller.getBootstrap(fullContext)

    assert.ok(Array.isArray(result.regionalOverrides))
  })
})

// ---- boundary / edge-case tests ----

describe('getBootstrap() – boundary cases', () => {
  it('handles minimal tenant context (tenantId only)', () => {
    const mockService = {
      getBootstrap: (ctx: RequestTenantContext) => ({
        tenantPortal: { scopeCode: ctx.tenantId },
        brandPortal: {},
        storePortal: {},
        marketProfile: {},
        regionalOverrides: [],
        foundationDependencies: [],
        foundationContracts: []
      })
    }

    const controller = new PortalController(mockService as unknown as PortalService)
    const minimalCtx: RequestTenantContext = { tenantId: 'min-t-1' }

    const result = controller.getBootstrap(minimalCtx)
    assert.equal(result.tenantPortal.scopeCode, 'min-t-1')
  })

  it('handles undefined brandId in context (portal service uses fallback)', () => {
    // The controller simply delegates, so it should not throw when brandId is missing
    const mockService = {
      getBootstrap: (ctx: RequestTenantContext) => ({
        tenantPortal: { scopeCode: ctx.tenantId },
        brandPortal: { scopeCode: ctx.brandId ?? 'brand-demo' },
        storePortal: { scopeCode: ctx.storeId ?? 'store-001' },
        marketProfile: {},
        regionalOverrides: [],
        foundationDependencies: [],
        foundationContracts: []
      })
    }

    const controller = new PortalController(mockService as unknown as PortalService)
    const contextWithoutBrand: RequestTenantContext = { tenantId: 't-no-brand' }

    // Should not throw
    assert.doesNotThrow(() => controller.getBootstrap(contextWithoutBrand))
  })

  it('handles international market context (en-US)', () => {
    const mockService = {
      getBootstrap: (ctx: RequestTenantContext) => ({
        tenantPortal: { scopeCode: ctx.tenantId, supportedLanguages: [LanguageCode.EnUs] },
        brandPortal: {},
        storePortal: { supportedLanguages: [LanguageCode.EnUs] },
        marketProfile: { marketCode: 'us-default' },
        regionalOverrides: [],
        foundationDependencies: [],
        foundationContracts: []
      })
    }

    const controller = new PortalController(mockService as unknown as PortalService)
    const usContext: RequestTenantContext = {
      tenantId: 't-us',
      brandId: 'b-us',
      storeId: 's-us',
      marketCode: 'us-default'
    }

    const result = controller.getBootstrap(usContext)
    assert.equal(result.tenantPortal.supportedLanguages[0], LanguageCode.EnUs)
    assert.equal(result.marketProfile.marketCode, 'us-default')
  })

  it('returns consistent ToB audience for tenant and brand portals', () => {
    const mockService = {
      getBootstrap: () => ({
        tenantPortal: { audience: PortalAudience.ToB },
        brandPortal: { audience: PortalAudience.ToB },
        storePortal: { audience: PortalAudience.ToC },
        marketProfile: {},
        regionalOverrides: [],
        foundationDependencies: [],
        foundationContracts: []
      })
    }

    const controller = new PortalController(mockService as unknown as PortalService)
    const ctx: RequestTenantContext = { tenantId: 't-1' }

    const result = controller.getBootstrap(ctx)
    assert.equal(result.tenantPortal.audience, PortalAudience.ToB)
    assert.equal(result.brandPortal.audience, PortalAudience.ToB)
    assert.equal(result.storePortal.audience, PortalAudience.ToC)
  })

  it('handle empty regional overrides', () => {
    const mockService = {
      getBootstrap: () => ({
        tenantPortal: {},
        brandPortal: {},
        storePortal: {},
        marketProfile: {},
        regionalOverrides: [],
        foundationDependencies: [],
        foundationContracts: []
      })
    }

    const controller = new PortalController(mockService as unknown as PortalService)
    const ctx: RequestTenantContext = { tenantId: 't-empty' }

    const result = controller.getBootstrap(ctx)
    assert.equal(result.regionalOverrides.length, 0)
  })

  it('handle populated regional overrides', () => {
    const mockOverrides = [
      { scopeType: 'TENANT', scopeCode: 't-1', inheritanceMode: 'TENANT_DEFAULT', marketCode: 'cn-mainland' }
    ]
    const mockService = {
      getBootstrap: () => ({
        tenantPortal: {},
        brandPortal: {},
        storePortal: {},
        marketProfile: {},
        regionalOverrides: mockOverrides,
        foundationDependencies: [],
        foundationContracts: []
      })
    }

    const controller = new PortalController(mockService as unknown as PortalService)
    const ctx: RequestTenantContext = { tenantId: 't-1' }

    const result = controller.getBootstrap(ctx)
    assert.equal(result.regionalOverrides.length, 1)
    assert.equal(result.regionalOverrides[0].scopeType, 'TENANT')
  })

  it('returns foundationContracts array', () => {
    const mockService = {
      getBootstrap: () => ({
        tenantPortal: {},
        brandPortal: {},
        storePortal: {},
        marketProfile: {},
        regionalOverrides: [],
        foundationDependencies: [],
        foundationContracts: ['portal-page:v1', 'portal-theme:v1']
      })
    }

    const controller = new PortalController(mockService as unknown as PortalService)
    const ctx: RequestTenantContext = { tenantId: 't-contracts' }

    const result = controller.getBootstrap(ctx)
    assert.ok(Array.isArray(result.foundationContracts))
    assert.deepStrictEqual(result.foundationContracts, ['portal-page:v1', 'portal-theme:v1'])
  })
})

// ---- error / negative path ----

describe('getBootstrap() – negative cases', () => {
  it('throws when service.getBootstrap throws', () => {
    const mockService = {
      getBootstrap: () => {
        throw new Error('Market not found for context')
      }
    }

    const controller = new PortalController(mockService as unknown as PortalService)
    const ctx: RequestTenantContext = { tenantId: 't-bad-market', marketCode: 'xx-invalid' }

    assert.throws(
      () => controller.getBootstrap(ctx),
      /Market not found/
    )
  })

  it('does not mutate input tenantContext reference', () => {
    const original: RequestTenantContext = Object.freeze({
      tenantId: 't-immutable',
      brandId: 'b-immutable'
    })

    const mockService = {
      getBootstrap: () => ({
        tenantPortal: {},
        brandPortal: {},
        storePortal: {},
        marketProfile: {},
        regionalOverrides: [],
        foundationDependencies: [],
        foundationContracts: []
      })
    }

    const controller = new PortalController(mockService as unknown as PortalService)
    // Should not throw due to Object.freeze
    assert.doesNotThrow(() => controller.getBootstrap(original as RequestTenantContext))
  })
})

// ---- new endpoints: getTenantPortal / getBrandPortal / getStorePortal ----

const independentCtx: RequestTenantContext = {
  tenantId: 't-indep',
  brandId: 'b-indep',
  storeId: 's-indep',
  marketCode: 'cn-mainland'
}

describe('getTenantPortal() – happy path', () => {
  it('返回租户 ToB 门户信息', () => {
    const mockService = {
      resolveTenantPortal: (ctx: RequestTenantContext) => ({
        audience: PortalAudience.ToB,
        scopeType: PortalScopeType.Tenant,
        scopeCode: ctx.tenantId,
        tenantCode: ctx.tenantId,
        marketCode: 'cn-mainland',
        channel: PortalChannel.Web,
        name: `${ctx.tenantId} ToB 官网`,
        primaryDomain: `${ctx.tenantId}.cn-mainland.b2b.local`,
        supportedLanguages: [LanguageCode.ZhCn],
        heroTitle: `${ctx.tenantId} 企业级经营门户`,
        loginEntry: { label: '进入租户后台', loginPath: '/login', ssoEnabled: true }
      })
    }
    const ctrl = new PortalController(mockService as unknown as PortalService)
    const result = ctrl.getTenantPortal(independentCtx)
    assert.equal(result.audience, PortalAudience.ToB)
    assert.equal(result.scopeType, PortalScopeType.Tenant)
    assert.equal(result.scopeCode, 't-indep')
    assert.ok(result.loginEntry.ssoEnabled)
  })

  it('租户门户不包含 brandCode / storeCode', () => {
    const mockService = {
      resolveTenantPortal: (ctx: RequestTenantContext) => ({
        audience: PortalAudience.ToB,
        scopeType: PortalScopeType.Tenant,
        scopeCode: ctx.tenantId,
        tenantCode: ctx.tenantId,
        marketCode: 'cn-mainland',
        channel: PortalChannel.Web,
        name: '租户官网',
        primaryDomain: 't.local',
        supportedLanguages: [LanguageCode.ZhCn],
        loginEntry: { label: '登录', loginPath: '/login', ssoEnabled: true }
      })
    }
    const ctrl = new PortalController(mockService as unknown as PortalService)
    const result = ctrl.getTenantPortal(independentCtx)
    assert.equal((result as any).brandCode, undefined)
    assert.equal((result as any).storeCode, undefined)
  })
})

describe('getBrandPortal() – happy path', () => {
  it('返回品牌 ToB 门户信息', () => {
    const mockService = {
      resolveBrandPortal: (ctx: RequestTenantContext) => ({
        audience: PortalAudience.ToB,
        scopeType: PortalScopeType.Brand,
        scopeCode: ctx.brandId!,
        tenantCode: ctx.tenantId,
        brandCode: ctx.brandId!,
        marketCode: 'cn-mainland',
        channel: PortalChannel.Web,
        name: `${ctx.brandId} 品牌官网`,
        primaryDomain: `${ctx.brandId}.local`,
        supportedLanguages: [LanguageCode.ZhCn],
        heroTitle: '品牌经营门户',
        loginEntry: { label: '进入品牌后台', loginPath: '/brand/login', ssoEnabled: true }
      })
    }
    const ctrl = new PortalController(mockService as unknown as PortalService)
    const result = ctrl.getBrandPortal(independentCtx)
    assert.equal(result.audience, PortalAudience.ToB)
    assert.equal(result.scopeType, PortalScopeType.Brand)
    assert.equal(result.brandCode, 'b-indep')
  })

  it('品牌门户 heroTitle 非空', () => {
    const mockService = {
      resolveBrandPortal: () => ({
        audience: PortalAudience.ToB,
        scopeType: PortalScopeType.Brand,
        scopeCode: 'b-1',
        tenantCode: 't-1',
        brandCode: 'b-1',
        marketCode: 'cn-mainland',
        channel: PortalChannel.Web,
        name: '品牌官网',
        primaryDomain: 'b.local',
        supportedLanguages: [LanguageCode.ZhCn],
        heroTitle: '品牌经营官网',
        loginEntry: { label: '进入品牌后台', loginPath: '/login', ssoEnabled: true }
      })
    }
    const ctrl = new PortalController(mockService as unknown as PortalService)
    const result = ctrl.getBrandPortal(independentCtx)
    assert.ok(result.heroTitle)
    assert.ok(result.heroTitle!.length > 0)
  })
})

describe('getStorePortal() – happy path', () => {
  it('返回门店 ToC 门户信息', () => {
    const mockService = {
      resolveStorePortal: (ctx: RequestTenantContext) => ({
        audience: PortalAudience.ToC,
        scopeType: PortalScopeType.Store,
        scopeCode: ctx.storeId!,
        tenantCode: ctx.tenantId,
        brandCode: ctx.brandId!,
        storeCode: ctx.storeId!,
        storeName: `${ctx.storeId} 门店`,
        marketCode: 'cn-mainland',
        channel: PortalChannel.Web,
        name: `${ctx.storeId} 门店门户`,
        primaryDomain: `${ctx.storeId}.local`,
        supportedLanguages: [LanguageCode.ZhCn],
        supportedSurfaces: [StorefrontSurface.OfficialSite, StorefrontSurface.MiniApp]
      })
    }
    const ctrl = new PortalController(mockService as unknown as PortalService)
    const result = ctrl.getStorePortal(independentCtx)
    assert.equal(result.audience, PortalAudience.ToC)
    assert.equal(result.scopeType, PortalScopeType.Store)
    assert.equal(result.storeCode, 's-indep')
    assert.ok(result.storeName)
  })

  it('门店门户含 supportedSurfaces', () => {
    const mockService = {
      resolveStorePortal: () => ({
        audience: PortalAudience.ToC,
        scopeType: PortalScopeType.Store,
        scopeCode: 's-1',
        tenantCode: 't-1',
        brandCode: 'b-1',
        storeCode: 's-1',
        storeName: '测试门店',
        marketCode: 'cn-mainland',
        channel: PortalChannel.Web,
        name: '门店门户',
        primaryDomain: 's.local',
        supportedLanguages: [LanguageCode.ZhCn],
        supportedSurfaces: [
          StorefrontSurface.OfficialSite,
          StorefrontSurface.H5,
          StorefrontSurface.MiniApp
        ]
      })
    }
    const ctrl = new PortalController(mockService as unknown as PortalService)
    const result = ctrl.getStorePortal(independentCtx)
    assert.ok(Array.isArray(result.supportedSurfaces))
    assert.ok(result.supportedSurfaces!.length >= 3)
    assert.ok(result.supportedSurfaces!.includes(StorefrontSurface.MiniApp))
  })
})

// ---- new endpoints: boundary / negative cases ----

describe('新 endpoint – 边界和错误场景', () => {
  it('getTenantPortal 在 service 抛出时向上传播', () => {
    const mockService = {
      resolveTenantPortal: () => { throw new Error('Tenant not found') }
    }
    const ctrl = new PortalController(mockService as unknown as PortalService)
    assert.throws(() => ctrl.getTenantPortal(independentCtx), /Tenant not found/)
  })

  it('getBrandPortal 在缺少 brandId 时仍正常工作（由 service 兜底）', () => {
    const mockService = {
      resolveBrandPortal: (ctx: RequestTenantContext) => ({
        audience: PortalAudience.ToB,
        scopeType: PortalScopeType.Brand,
        scopeCode: ctx.brandId ?? 'brand-demo',
        tenantCode: ctx.tenantId,
        brandCode: ctx.brandId ?? 'brand-demo',
        marketCode: 'cn-mainland',
        channel: PortalChannel.Web,
        name: '品牌官网',
        primaryDomain: 'b.local',
        supportedLanguages: [LanguageCode.ZhCn],
        loginEntry: { label: '进入品牌后台', loginPath: '/login', ssoEnabled: true }
      })
    }
    const ctrl = new PortalController(mockService as unknown as PortalService)
    const ctxNoBrand: RequestTenantContext = { tenantId: 't-nobrand' }
    const result = ctrl.getBrandPortal(ctxNoBrand)
    assert.equal(result.brandCode, 'brand-demo')
  })

  it('getStorePortal 国际化市场返回英文', () => {
    const mockService = {
      resolveStorePortal: () => ({
        audience: PortalAudience.ToC,
        scopeType: PortalScopeType.Store,
        scopeCode: 's-us',
        tenantCode: 't-us',
        brandCode: 'b-us',
        storeCode: 's-us',
        storeName: 'US Store',
        marketCode: 'us-default',
        channel: PortalChannel.Web,
        name: 'US Store Portal',
        primaryDomain: 's-us.local',
        supportedLanguages: [LanguageCode.EnUs],
        supportedSurfaces: [StorefrontSurface.OfficialSite]
      })
    }
    const ctrl = new PortalController(mockService as unknown as PortalService)
    const ctxUS: RequestTenantContext = { tenantId: 't-us', marketCode: 'us-default' }
    const result = ctrl.getStorePortal(ctxUS)
    assert.equal(result.supportedLanguages[0], LanguageCode.EnUs)
    assert.equal(result.marketCode, 'us-default')
  })
})
