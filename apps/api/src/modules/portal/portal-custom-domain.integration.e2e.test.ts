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
    assert.equal(portal.body.data.domainSource, 'custom')
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
    assert.equal(bootstrap.body.data.storePortal.domainSource, 'custom')
  })

  it('删除品牌当前 primary 后，Portal brand-portal 回退平台默认域名', async () => {
    const headers = {
      'x-tenant-id': 'tenant-link-brand-fallback',
      'x-brand-id': 'brand-fallback',
      'x-role': 'brand_admin',
    }

    const added = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'brand-fallback.example.io' })
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
    await request(app.getHttpServer())
      .delete(`/saas/domain/${added.body.data.id}`)
      .set(headers)
      .expect(204)

    const portal = await request(app.getHttpServer())
      .get('/portals/brand-portal')
      .set(headers)
      .expect(200)

    assert.equal(
      portal.body.data.primaryDomain,
      'brand-fallback.tenant-link-brand-fallback.cn-mainland.b2b.local',
    )
    assert.equal(portal.body.data.domainSource, 'default')
  })

  it('删除门店当前 primary 后，Portal bootstrap 回退平台默认 store 域名', async () => {
    const headers = {
      'x-tenant-id': 'tenant-link-store-fallback',
      'x-brand-id': 'brand-store-fallback',
      'x-store-id': 'store-fallback',
      'x-role': 'store_admin',
    }

    const added = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'store-fallback.example.io' })
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
    await request(app.getHttpServer())
      .delete(`/saas/domain/${added.body.data.id}`)
      .set(headers)
      .expect(204)

    const bootstrap = await request(app.getHttpServer())
      .get('/portals/bootstrap')
      .set(headers)
      .expect(200)

    assert.equal(
      bootstrap.body.data.storePortal.primaryDomain,
      'store-fallback.brand-store-fallback.tenant-link-store-fallback.cn-mainland.local',
    )
    assert.equal(bootstrap.body.data.storePortal.domainSource, 'default')
  })

  it('tenant 删除旧 primary 并重选后，Portal bootstrap 读取到新 tenant 主域名', async () => {
    const headers = {
      'x-tenant-id': 'tenant-link-tenant',
      'x-role': 'tenant_admin',
    }

    const first = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'tenant-first.example.io' })
      .expect(201)
    const second = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'tenant-second.example.io' })
      .expect(201)

    customDomainService.setDnsTxtOverride(first.body.data.verificationHost, [
      buildVerificationValue(first.body.data.verificationToken),
    ])
    customDomainService.setDnsTxtOverride(second.body.data.verificationHost, [
      buildVerificationValue(second.body.data.verificationToken),
    ])

    await request(app.getHttpServer()).post(`/saas/domain/${first.body.data.id}/verify`).set(headers).expect(200)
    await request(app.getHttpServer()).post(`/saas/domain/${second.body.data.id}/verify`).set(headers).expect(200)
    await request(app.getHttpServer()).post(`/saas/domain/${first.body.data.id}/primary`).set(headers).expect(200)
    await request(app.getHttpServer()).delete(`/saas/domain/${first.body.data.id}`).set(headers).expect(204)
    await request(app.getHttpServer()).post(`/saas/domain/${second.body.data.id}/primary`).set(headers).expect(200)

    const bootstrap = await request(app.getHttpServer())
      .get('/portals/bootstrap')
      .set(headers)
      .expect(200)

    assert.equal(bootstrap.body.data.tenantPortal.primaryDomain, 'tenant-second.example.io')
    assert.equal(bootstrap.body.data.tenantPortal.domainSource, 'custom')
  })

  it('brand 删除旧 primary 并重选后，Portal brand-portal 读取到新 brand 主域名', async () => {
    const headers = {
      'x-tenant-id': 'tenant-link-brand-reselect',
      'x-brand-id': 'brand-reselect',
      'x-role': 'brand_admin',
    }

    const first = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'brand-first.example.io' })
      .expect(201)
    const second = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'brand-second.example.io' })
      .expect(201)

    customDomainService.setDnsTxtOverride(first.body.data.verificationHost, [
      buildVerificationValue(first.body.data.verificationToken),
    ])
    customDomainService.setDnsTxtOverride(second.body.data.verificationHost, [
      buildVerificationValue(second.body.data.verificationToken),
    ])

    await request(app.getHttpServer()).post(`/saas/domain/${first.body.data.id}/verify`).set(headers).expect(200)
    await request(app.getHttpServer()).post(`/saas/domain/${second.body.data.id}/verify`).set(headers).expect(200)
    await request(app.getHttpServer()).post(`/saas/domain/${first.body.data.id}/primary`).set(headers).expect(200)
    await request(app.getHttpServer()).delete(`/saas/domain/${first.body.data.id}`).set(headers).expect(204)
    await request(app.getHttpServer()).post(`/saas/domain/${second.body.data.id}/primary`).set(headers).expect(200)

    const portal = await request(app.getHttpServer())
      .get('/portals/brand-portal')
      .set(headers)
      .expect(200)

    assert.equal(portal.body.data.primaryDomain, 'brand-second.example.io')
    assert.equal(portal.body.data.domainSource, 'custom')
  })

  it('store 删除旧 primary 并重选后，Portal bootstrap 读取到新 store 主域名', async () => {
    const headers = {
      'x-tenant-id': 'tenant-link-store-reselect',
      'x-brand-id': 'brand-store-reselect',
      'x-store-id': 'store-reselect',
      'x-role': 'store_admin',
    }

    const first = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'store-first.example.io' })
      .expect(201)
    const second = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'store-second.example.io' })
      .expect(201)

    customDomainService.setDnsTxtOverride(first.body.data.verificationHost, [
      buildVerificationValue(first.body.data.verificationToken),
    ])
    customDomainService.setDnsTxtOverride(second.body.data.verificationHost, [
      buildVerificationValue(second.body.data.verificationToken),
    ])

    await request(app.getHttpServer()).post(`/saas/domain/${first.body.data.id}/verify`).set(headers).expect(200)
    await request(app.getHttpServer()).post(`/saas/domain/${second.body.data.id}/verify`).set(headers).expect(200)
    await request(app.getHttpServer()).post(`/saas/domain/${first.body.data.id}/primary`).set(headers).expect(200)
    await request(app.getHttpServer()).delete(`/saas/domain/${first.body.data.id}`).set(headers).expect(204)
    await request(app.getHttpServer()).post(`/saas/domain/${second.body.data.id}/primary`).set(headers).expect(200)

    const bootstrap = await request(app.getHttpServer())
      .get('/portals/bootstrap')
      .set(headers)
      .expect(200)

    assert.equal(bootstrap.body.data.storePortal.primaryDomain, 'store-second.example.io')
    assert.equal(bootstrap.body.data.storePortal.domainSource, 'custom')
  })
})
