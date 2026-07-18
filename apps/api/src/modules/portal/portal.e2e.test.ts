import 'reflect-metadata'
import assert from 'node:assert/strict'
import { afterAll, beforeAll, describe, it } from 'vitest'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { PortalController } from './portal.controller'
import { PortalService } from './portal.service'
import { MarketService } from '../market/market.service'
import { FoundationService } from '../foundation/foundation.service'
import type { TenantAwareRequest } from '../tenant/tenant.types'
import type { DomainResolutionService } from '../saas-advanced/domain-resolution.service'

function attachTenantContext(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as unknown as TenantAwareRequest
  ctx.tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-001',
    brandId: (req.header('x-brand-id') as string | undefined) ?? 'brand-001',
    storeId: (req.header('x-store-id') as string | undefined) ?? 'store-001',
    marketCode: (req.header('x-market-code') as string | undefined) ?? 'cn-mainland'
  }
  next()
}

async function buildApp(
  options: {
    findPrimaryDomain?: DomainResolutionService['findPrimaryDomain']
  } = {},
) {
  const foundationService = {
    getModuleCatalog: () => [],
    getConsumerCatalog: () => [],
    getIdentityAccess: () => ({}),
    getConfigurationGovernance: () => ({}),
    getIntegrationOrchestration: () => ({}),
    getTrustGovernance: () => ({}),
    getResilienceOperations: () => ({}),
    getRuntimeGovernance: () => ({}),
    // foundation bootstrap contract needs these
    getGovernanceBaseline: () => ({}),
    getBlueprint: () => ({}),
    getDependencySummary: () => ({ dependsOn: ['identity-access', 'configuration-governance'], handoffContracts: [] })
  } as unknown as FoundationService
  const marketService = {
    getMergedProfile: (ctx: TenantAwareRequest['tenantContext']) => {
      const marketCode = ctx?.marketCode ?? 'cn-mainland'
      if (marketCode === 'us-default') {
        return {
          marketCode: 'us-default',
          marketName: 'United States',
          locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US'] },
          timezone: { timezone: 'America/Los_Angeles' },
          tax: { taxMode: 'EXCLUDED', taxRate: 8.25, taxLabel: 'Sales Tax' },
          network: { networkRegion: 'GLOBAL' },
          email: { provider: 'SMTP', fromName: 'M5 US', fromAddress: 'hello@us.local' },
          social: { primaryPlatforms: ['INSTAGRAM'], supportPlatforms: ['FACEBOOK'] },
        }
      }
      return {
        marketCode: 'cn-mainland',
        marketName: '中国大陆',
        locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
        timezone: { timezone: 'Asia/Shanghai' },
        tax: { taxMode: 'INCLUDED', taxRate: 13, taxLabel: '增值税' },
        network: { networkRegion: 'CHINA_MAINLAND' },
        email: { provider: 'SMTP', fromName: 'M5 CN', fromAddress: 'hello@cn.local' },
        social: { primaryPlatforms: ['WECHAT'], supportPlatforms: [] },
      }
    },
    getOverrides: () => [],
  } as unknown as MarketService
  const domainResolutionService = {
    findPrimaryDomain: options.findPrimaryDomain ?? (() => null),
  } as DomainResolutionService
  const portalService = new PortalService(marketService, foundationService, undefined, domainResolutionService)
  const moduleRef = await Test.createTestingModule({
    controllers: [PortalController],
    providers: [
      { provide: PortalService, useValue: portalService },
      { provide: MarketService, useValue: marketService },
      { provide: FoundationService, useValue: foundationService },
      { provide: 'DomainResolutionService', useValue: domainResolutionService },
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, portalService }
}

const TENANT_CN = {
  'x-tenant-id': 'tenant-cn',
  'x-brand-id': 'brand-cn',
  'x-store-id': 'store-cn',
  'x-market-code': 'cn-mainland'
}

const TENANT_US = {
  'x-tenant-id': 'tenant-us',
  'x-brand-id': 'brand-us',
  'x-store-id': 'store-us',
  'x-market-code': 'us-default'
}

describe('Portal HTTP E2E', () => {
  let app: Awaited<ReturnType<typeof buildApp>>['app']

  beforeAll(async () => {
    const built = await buildApp()
    app = built.app
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /portals/bootstrap 返回三个 scope 门户和市场画像', async () => {
    const res = await request(app.getHttpServer()).get('/portals/bootstrap').set(TENANT_CN).expect(200)
    assert.equal(res.body.success, true)
    assert.ok(res.body.data.tenantPortal)
    assert.ok(res.body.data.brandPortal)
    assert.ok(res.body.data.storePortal)
    assert.equal(res.body.data.marketProfile.marketCode, 'cn-mainland')
    assert.ok(Array.isArray(res.body.data.regionalOverrides))
  })

  it('GET /portals/tenant-portal 返回租户门户并继承头部上下文', async () => {
    const res = await request(app.getHttpServer()).get('/portals/tenant-portal').set(TENANT_CN).expect(200)
    assert.equal(res.body.data.scopeCode, 'tenant-cn')
    assert.equal(res.body.data.tenantCode, 'tenant-cn')
    assert.equal(res.body.data.loginEntry.loginPath, '/cn-mainland/tenant-cn/login')
  })

  it('GET /portals/brand-portal 返回品牌门户并带品牌上下文', async () => {
    const res = await request(app.getHttpServer()).get('/portals/brand-portal').set(TENANT_CN).expect(200)
    assert.equal(res.body.data.scopeCode, 'brand-cn')
    assert.equal(res.body.data.brandCode, 'brand-cn')
    assert.equal(res.body.data.tenantCode, 'tenant-cn')
    assert.ok(res.body.data.heroTitle.includes('brand-cn'))
  })

  it('GET /portals/store-portal 返回门店门户并暴露全部 storefront surface', async () => {
    const res = await request(app.getHttpServer()).get('/portals/store-portal').set(TENANT_CN).expect(200)
    const surfaces = res.body.data.supportedSurfaces as string[]
    assert.equal(res.body.data.scopeCode, 'store-cn')
    assert.equal(res.body.data.storeCode, 'store-cn')
    assert.ok(Array.isArray(surfaces))
    assert.ok(surfaces.includes('OFFICIAL_SITE'))
    assert.ok(surfaces.includes('H5'))
    assert.ok(surfaces.includes('MINIAPP'))
    assert.ok(surfaces.includes('APP'))
    assert.ok(surfaces.includes('PC_CONSOLE'))
    assert.ok(surfaces.includes('PAD_CONSOLE'))
  })

  it('不同市场上下文返回不同 timezone 和语言集合', async () => {
    const cn = await request(app.getHttpServer()).get('/portals/bootstrap').set(TENANT_CN).expect(200)
    const us = await request(app.getHttpServer()).get('/portals/bootstrap').set(TENANT_US).expect(200)
    assert.equal(cn.body.data.marketProfile.timezone.timezone, 'Asia/Shanghai')
    assert.equal(us.body.data.marketProfile.timezone.timezone, 'America/Los_Angeles')
    assert.ok(cn.body.data.tenantPortal.supportedLanguages.includes('zh-CN'))
    assert.ok(us.body.data.tenantPortal.supportedLanguages.includes('en-US'))
  })

  it('缺省头部走默认 tenant 上下文', async () => {
    const res = await request(app.getHttpServer()).get('/portals/bootstrap').expect(200)
    assert.equal(res.body.data.tenantPortal.scopeCode, 'tenant-001')
    assert.equal(res.body.data.brandPortal.scopeCode, 'brand-001')
    assert.equal(res.body.data.storePortal.scopeCode, 'store-001')
  })

  it('bootstrap 优先返回 custom primary domain', async () => {
    const built = await buildApp({
      findPrimaryDomain: (scope) => {
        if (scope.scopeType === 'TENANT') return 'tenant-cn.custom.example.com'
        if (scope.scopeType === 'BRAND') return 'brand-cn.custom.example.com'
        if (scope.scopeType === 'STORE') return 'store-cn.custom.example.com'
        return null
      },
    })

    try {
      const res = await request(built.app.getHttpServer()).get('/portals/bootstrap').set(TENANT_CN).expect(200)
      assert.equal(res.body.data.tenantPortal.primaryDomain, 'tenant-cn.custom.example.com')
      assert.equal(res.body.data.brandPortal.primaryDomain, 'brand-cn.custom.example.com')
      assert.equal(res.body.data.storePortal.primaryDomain, 'store-cn.custom.example.com')
    } finally {
      await built.app.close()
    }
  })

  it('独立门户接口也优先返回 custom primary domain', async () => {
    const built = await buildApp({
      findPrimaryDomain: (scope) => {
        if (scope.scopeType === 'TENANT') return 'tenant-only.custom.example.com'
        if (scope.scopeType === 'BRAND') return 'brand-only.custom.example.com'
        if (scope.scopeType === 'STORE') return 'store-only.custom.example.com'
        return null
      },
    })

    try {
      const tenant = await request(built.app.getHttpServer()).get('/portals/tenant-portal').set(TENANT_CN).expect(200)
      const brand = await request(built.app.getHttpServer()).get('/portals/brand-portal').set(TENANT_CN).expect(200)
      const store = await request(built.app.getHttpServer()).get('/portals/store-portal').set(TENANT_CN).expect(200)
      assert.equal(tenant.body.data.primaryDomain, 'tenant-only.custom.example.com')
      assert.equal(brand.body.data.primaryDomain, 'brand-only.custom.example.com')
      assert.equal(store.body.data.primaryDomain, 'store-only.custom.example.com')
    } finally {
      await built.app.close()
    }
  })
})
