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

  describe('Bootstrap 综合门户端点', () => {
    it('GET /portals/bootstrap 返回三个 scope 门户和市场画像', async () => {
      const res = await request(app.getHttpServer()).get('/portals/bootstrap').set(TENANT_CN).expect(200)
      assert.equal(res.body.success, true)
      assert.ok(res.body.data.tenantPortal)
      assert.ok(res.body.data.brandPortal)
      assert.ok(res.body.data.storePortal)
      assert.equal(res.body.data.marketProfile.marketCode, 'cn-mainland')
      assert.ok(Array.isArray(res.body.data.regionalOverrides))
    })

    it('bootstrap 内部 tenant portal 包含 loginEntry 完整结构', async () => {
      const res = await request(app.getHttpServer()).get('/portals/bootstrap').set(TENANT_CN).expect(200)
      const login = res.body.data.tenantPortal.loginEntry
      assert.ok(login)
      assert.ok(typeof login.label === 'string')
      assert.ok(typeof login.loginPath === 'string')
      assert.equal(login.ssoEnabled, true)
    })

    it('bootstrap 返回的 foundation 依赖元数据', async () => {
      const res = await request(app.getHttpServer()).get('/portals/bootstrap').set(TENANT_CN).expect(200)
      assert.ok(res.body.data.dependsOn !== undefined)
      assert.ok(Array.isArray(res.body.data.dependsOn))
    })

    it('bootstrap 返回的 marketProfile 包含 tax 和 email 配置', async () => {
      const res = await request(app.getHttpServer()).get('/portals/bootstrap').set(TENANT_CN).expect(200)
      assert.ok(res.body.data.marketProfile.tax)
      assert.ok(res.body.data.marketProfile.email)
      assert.ok(res.body.data.marketProfile.network)
      assert.ok(res.body.data.marketProfile.social)
    })

    it('缺省头部走默认 tenant 上下文', async () => {
      const res = await request(app.getHttpServer()).get('/portals/bootstrap').expect(200)
      assert.equal(res.body.data.tenantPortal.scopeCode, 'tenant-001')
      assert.equal(res.body.data.brandPortal.scopeCode, 'brand-001')
      assert.equal(res.body.data.storePortal.scopeCode, 'store-001')
    })

    it('不同市场上下文返回不同 timezone 和语言集合', async () => {
      const cn = await request(app.getHttpServer()).get('/portals/bootstrap').set(TENANT_CN).expect(200)
      const us = await request(app.getHttpServer()).get('/portals/bootstrap').set(TENANT_US).expect(200)
      assert.equal(cn.body.data.marketProfile.timezone.timezone, 'Asia/Shanghai')
      assert.equal(us.body.data.marketProfile.timezone.timezone, 'America/Los_Angeles')
      assert.ok(cn.body.data.tenantPortal.supportedLanguages.includes('zh-CN'))
      assert.ok(us.body.data.tenantPortal.supportedLanguages.includes('en-US'))
    })

    it('不同市场的 tax 配置不同（CN included vs US excluded）', async () => {
      const cn = await request(app.getHttpServer()).get('/portals/bootstrap').set(TENANT_CN).expect(200)
      const us = await request(app.getHttpServer()).get('/portals/bootstrap').set(TENANT_US).expect(200)
      assert.equal(cn.body.data.marketProfile.tax.taxMode, 'INCLUDED')
      assert.equal(us.body.data.marketProfile.tax.taxMode, 'EXCLUDED')
      assert.equal(cn.body.data.marketProfile.tax.taxLabel, '增值税')
      assert.equal(us.body.data.marketProfile.tax.taxLabel, 'Sales Tax')
    })

    it('不同市场的社交平台配置不同（CN WeChat vs US Instagram）', async () => {
      const cn = await request(app.getHttpServer()).get('/portals/bootstrap').set(TENANT_CN).expect(200)
      const us = await request(app.getHttpServer()).get('/portals/bootstrap').set(TENANT_US).expect(200)
      assert.ok(cn.body.data.marketProfile.social.primaryPlatforms.includes('WECHAT'))
      assert.ok(us.body.data.marketProfile.social.primaryPlatforms.includes('INSTAGRAM'))
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
        assert.equal(res.body.data.tenantPortal.domainSource, 'custom')
        assert.equal(res.body.data.brandPortal.primaryDomain, 'brand-cn.custom.example.com')
        assert.equal(res.body.data.brandPortal.domainSource, 'custom')
        assert.equal(res.body.data.storePortal.primaryDomain, 'store-cn.custom.example.com')
        assert.equal(res.body.data.storePortal.domainSource, 'custom')
      } finally {
        await built.app.close()
      }
    })

    it('bootstrap 回退默认域名（部分自定义部分回退）', async () => {
      const built = await buildApp({
        findPrimaryDomain: (scope) => {
          if (scope.scopeType === 'TENANT') return 'tenant-only.custom.example.com'
          return null
        },
      })

      try {
        const res = await request(built.app.getHttpServer()).get('/portals/bootstrap').set(TENANT_US).expect(200)
        assert.equal(res.body.data.tenantPortal.primaryDomain, 'tenant-only.custom.example.com')
        assert.equal(res.body.data.tenantPortal.domainSource, 'custom')
        assert.equal(res.body.data.brandPortal.domainSource, 'default')
        assert.equal(res.body.data.storePortal.domainSource, 'default')
      } finally {
        await built.app.close()
      }
    })
  })

  describe('Tenant Portal 租户门户', () => {
    it('GET /portals/tenant-portal 返回租户门户并继承头部上下文', async () => {
      const res = await request(app.getHttpServer()).get('/portals/tenant-portal').set(TENANT_CN).expect(200)
      assert.equal(res.body.data.scopeCode, 'tenant-cn')
      assert.equal(res.body.data.tenantCode, 'tenant-cn')
      assert.equal(res.body.data.loginEntry.loginPath, '/cn-mainland/tenant-cn/login')
    })

    it('tenant-portal 包含 solutionTags 和 heroTitle', async () => {
      const res = await request(app.getHttpServer()).get('/portals/tenant-portal').set(TENANT_CN).expect(200)
      assert.ok(Array.isArray(res.body.data.solutionTags))
      assert.ok(res.body.data.solutionTags.length > 0)
      assert.ok(typeof res.body.data.heroTitle === 'string')
      assert.ok(typeof res.body.data.heroSubtitle === 'string')
    })

    it('tenant-portal 的 audience 和 channel 断言', async () => {
      const res = await request(app.getHttpServer()).get('/portals/tenant-portal').set(TENANT_CN).expect(200)
      assert.equal(res.body.data.audience, 'ToB')
      assert.equal(res.body.data.channel, 'Web')
    })

    it('tenant-portal US 市场返回 en-US 语言支持', async () => {
      const res = await request(app.getHttpServer()).get('/portals/tenant-portal').set(TENANT_US).expect(200)
      assert.equal(res.body.data.marketCode, 'us-default')
      assert.ok(res.body.data.supportedLanguages.includes('en-US'))
      assert.equal(res.body.data.loginEntry.loginPath, '/us-default/tenant-us/login')
    })
  })

  describe('Brand Portal 品牌门户', () => {
    it('GET /portals/brand-portal 返回品牌门户并带品牌上下文', async () => {
      const res = await request(app.getHttpServer()).get('/portals/brand-portal').set(TENANT_CN).expect(200)
      assert.equal(res.body.data.scopeCode, 'brand-cn')
      assert.equal(res.body.data.brandCode, 'brand-cn')
      assert.equal(res.body.data.tenantCode, 'tenant-cn')
      assert.ok(res.body.data.heroTitle.includes('brand-cn'))
    })

    it('brand-portal 包含品牌招商 solutionTags', async () => {
      const res = await request(app.getHttpServer()).get('/portals/brand-portal').set(TENANT_CN).expect(200)
      assert.ok(Array.isArray(res.body.data.solutionTags))
      assert.ok(res.body.data.solutionTags.includes('品牌招商'))
      assert.ok(res.body.data.solutionTags.includes('品牌后台'))
    })

    it('brand-portal 拥有独立的 loginEntry', async () => {
      const res = await request(app.getHttpServer()).get('/portals/brand-portal').set(TENANT_CN).expect(200)
      assert.ok(res.body.data.loginEntry)
      assert.equal(res.body.data.loginEntry.ssoEnabled, true)
      assert.ok(res.body.data.loginEntry.loginPath.includes('tenant-cn'))
      assert.ok(res.body.data.loginEntry.loginPath.includes('brand-cn'))
    })

    it('brand-portal US 市场返回品牌英文名', async () => {
      const res = await request(app.getHttpServer()).get('/portals/brand-portal').set(TENANT_US).expect(200)
      assert.equal(res.body.data.name, 'brand-us 品牌 ToB 官网')
      assert.equal(res.body.data.marketCode, 'us-default')
    })
  })

  describe('Store Portal 门店门户', () => {
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

    it('store-portal 的 audience 为 ToC（区别于 tenant/brand）', async () => {
      const res = await request(app.getHttpServer()).get('/portals/store-portal').set(TENANT_CN).expect(200)
      assert.equal(res.body.data.audience, 'ToC')
      assert.equal(res.body.data.scopeType, 'Store')
    })

    it('store-portal 包含 storeName 字段', async () => {
      const res = await request(app.getHttpServer()).get('/portals/store-portal').set(TENANT_CN).expect(200)
      assert.ok(typeof res.body.data.storeName === 'string')
      assert.ok(res.body.data.storeName.includes('store-cn'))
    })

    it('store-portal US 市场绑定 en-US', async () => {
      const res = await request(app.getHttpServer()).get('/portals/store-portal').set(TENANT_US).expect(200)
      assert.equal(res.body.data.marketCode, 'us-default')
      assert.ok(res.body.data.supportedLanguages.includes('en-US'))
    })
  })

  describe('Custom Primary Domain 自定义主域名', () => {
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
        assert.equal(tenant.body.data.domainSource, 'custom')
        assert.equal(brand.body.data.primaryDomain, 'brand-only.custom.example.com')
        assert.equal(brand.body.data.domainSource, 'custom')
        assert.equal(store.body.data.primaryDomain, 'store-only.custom.example.com')
        assert.equal(store.body.data.domainSource, 'custom')
      } finally {
        await built.app.close()
      }
    })

    it('未命中 primaryDomain 时独立门户接口回退平台默认域名', async () => {
      const built = await buildApp({
        findPrimaryDomain: () => null,
      })

      try {
        const tenant = await request(built.app.getHttpServer()).get('/portals/tenant-portal').set(TENANT_CN).expect(200)
        const brand = await request(built.app.getHttpServer()).get('/portals/brand-portal').set(TENANT_CN).expect(200)
        const store = await request(built.app.getHttpServer()).get('/portals/store-portal').set(TENANT_CN).expect(200)
        assert.equal(tenant.body.data.primaryDomain, 'tenant-cn.cn-mainland.b2b.local')
        assert.equal(tenant.body.data.domainSource, 'default')
        assert.equal(brand.body.data.primaryDomain, 'brand-cn.tenant-cn.cn-mainland.b2b.local')
        assert.equal(brand.body.data.domainSource, 'default')
        assert.equal(store.body.data.primaryDomain, 'store-cn.brand-cn.tenant-cn.cn-mainland.local')
        assert.equal(store.body.data.domainSource, 'default')
      } finally {
        await built.app.close()
      }
    })
  })

  describe('Domain Governance 域名治理摘要', () => {
    it('GET /portals/domain-governance 返回治理摘要结构（中国市场）', async () => {
      const res = await request(app.getHttpServer()).get('/portals/domain-governance').set(TENANT_CN).expect(200)
      assert.ok(res.body.success !== undefined)
      assert.ok(res.body.data !== undefined)
      assert.ok(typeof res.body.data.requiresAttention === 'boolean')
      assert.ok(Array.isArray(res.body.data.currentScopes))
    })

    it('GET /portals/domain-governance 返回治理摘要结构（美国市场）', async () => {
      const res = await request(app.getHttpServer()).get('/portals/domain-governance').set(TENANT_US).expect(200)
      assert.ok(res.body.success !== undefined)
      assert.ok(res.body.data !== undefined)
      assert.ok('lastEvaluatedAt' in res.body.data)
    })
  })
})
