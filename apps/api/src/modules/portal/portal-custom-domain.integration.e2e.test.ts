import 'reflect-metadata'
import assert from 'node:assert/strict'
import { afterAll, beforeAll, describe, it } from 'vitest'
import type { NextFunction, Request, Response } from 'express'
import { ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { runWithTenant } from '../../common/context/tenant-context'
import { CustomDomainController } from '../saas-advanced/custom-domain.controller'
import { CustomDomainService } from '../saas-advanced/custom-domain.service'
import { DomainResolutionService } from '../saas-advanced/domain-resolution.service'
import { buildVerificationValue } from '../saas-advanced/custom-domain.entity'
import { PortalController } from './portal.controller'
import { PortalService } from './portal.service'
import { MarketService } from '../market/market.service'
import { FoundationService } from '../foundation/foundation.service'
import type { TenantAwareRequest } from '../tenant/tenant.types'

function attachContext(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as unknown as TenantAwareRequest
  ctx.tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-link',
    brandId: (req.header('x-brand-id') as string | undefined),
    storeId: (req.header('x-store-id') as string | undefined),
    marketCode: (req.header('x-market-code') as string | undefined) ?? 'cn-mainland',
  }

  runWithTenant(
    {
      tenantId: ctx.tenantContext.tenantId,
      brandId: ctx.tenantContext.brandId,
      storeId: ctx.tenantContext.storeId,
      userId: req.header('x-user-id') ?? 'user-link',
      role: (req.header('x-role') as 'tenant_admin' | 'brand_admin' | 'store_admin' | undefined) ?? 'tenant_admin',
    },
    () => next(),
  )
}

describe('Portal + CustomDomain Integration E2E', () => {
  let app: any
  let customDomainService: CustomDomainService

  beforeAll(async () => {
    const foundationService = {
      getDependencySummary: () => ({
        dependsOn: ['identity-access', 'configuration-governance'],
        handoffContracts: ['portal-page:v1'],
      }),
    } as unknown as FoundationService

    const marketService = {
      getMergedProfile: (ctx: TenantAwareRequest['tenantContext']) => ({
        marketCode: ctx?.marketCode ?? 'cn-mainland',
        marketName: '中国大陆',
        countryCode: 'CN',
        locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
        timezone: { timezone: 'Asia/Shanghai' },
        currency: { currencyCode: 'CNY', symbol: '¥' },
        tax: { taxMode: 'INCLUDED', taxRate: 13, taxLabel: '增值税' },
        network: {
          networkRegion: 'CHINA_MAINLAND',
          apiBaseUrl: 'https://cn-api.m5.local',
          cdnBaseUrl: 'https://cn-cdn.m5.local',
          callbackBaseUrl: 'https://cn-hooks.m5.local',
        },
        email: {
          provider: 'SMTP',
          fromName: 'M5 CN',
          fromAddress: 'hello@cn.local',
          replyTo: 'support@cn.local',
        },
        social: { primaryPlatforms: ['WECHAT'], supportPlatforms: ['WECHAT'] },
      }),
      getOverrides: () => [],
    } as unknown as MarketService

    const domainResolutionService = new DomainResolutionService()
    customDomainService = new CustomDomainService(undefined, domainResolutionService)
    const portalService = new PortalService(
      marketService,
      foundationService,
      undefined,
      domainResolutionService,
    )

    const moduleRef = await Test.createTestingModule({
      controllers: [CustomDomainController, PortalController],
      providers: [
        { provide: CustomDomainService, useValue: customDomainService },
        { provide: PortalService, useValue: portalService },
        { provide: DomainResolutionService, useValue: domainResolutionService },
        { provide: MarketService, useValue: marketService },
        { provide: FoundationService, useValue: foundationService },
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    app.useGlobalInterceptors(new ResponseInterceptor())
    app.use(attachContext)
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('品牌主域名切换后，Portal brand-portal 读取到新主域名', async () => {
    const headers = {
      'x-tenant-id': 'tenant-link-brand',
      'x-brand-id': 'brand-link',
      'x-role': 'brand_admin',
    }

    const added = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'brand-link.example.io' })
      .expect(201)

    customDomainService.setDnsTxtOverride(added.body.data.verificationHost, [
      buildVerificationValue(added.body.data.verificationToken),
    ])

    await request(app.getHttpServer())
      .post(`/saas/domain/${added.body.data.id}/verify`)
      .set(headers)
      .expect(200)
    await request(app.getHttpServer())
      .post(`/saas/domain/${added.body.data.id}/primary`)
      .set(headers)
      .expect(200)

    const portal = await request(app.getHttpServer())
      .get('/portals/brand-portal')
      .set(headers)
      .expect(200)

    assert.equal(portal.body.data.primaryDomain, 'brand-link.example.io')
  })

  it('门店主域名切换后，Portal bootstrap 读取到 storePortal 主域名', async () => {
    const headers = {
      'x-tenant-id': 'tenant-link-store',
      'x-brand-id': 'brand-store',
      'x-store-id': 'store-link',
      'x-role': 'store_admin',
    }

    const added = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'store-link.example.io' })
      .expect(201)

    customDomainService.setDnsTxtOverride(added.body.data.verificationHost, [
      buildVerificationValue(added.body.data.verificationToken),
    ])

    await request(app.getHttpServer())
      .post(`/saas/domain/${added.body.data.id}/verify`)
      .set(headers)
      .expect(200)
    await request(app.getHttpServer())
      .post(`/saas/domain/${added.body.data.id}/primary`)
      .set(headers)
      .expect(200)

    const bootstrap = await request(app.getHttpServer())
      .get('/portals/bootstrap')
      .set(headers)
      .expect(200)

    assert.equal(bootstrap.body.data.storePortal.primaryDomain, 'store-link.example.io')
  })
})
