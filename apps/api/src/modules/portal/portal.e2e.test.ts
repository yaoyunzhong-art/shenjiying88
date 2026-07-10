import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Portal 门户管理 HTTP 链路
 *
 * 链路:
 *   HTTP → TestController → PortalService → FoundationService + MarketService
 *
 * 验证:
 *   - portal bootstrap 返回 tenant/brand/store 三个 scope 视图
 *   - 含市场画像 + 区域覆盖 + foundation 依赖
 *   - 跨租户 / 跨市场时差异
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Get, Inject, Req } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { PortalService } from './portal.service'
import { MarketService } from '../market/market.service'
import { FoundationService } from '../foundation/foundation.service'
import type { TenantAwareRequest } from '../tenant/tenant.types'

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

@Controller('portal')
class TestPortalController {
  constructor(
    @Inject(PortalService) private readonly portalService: PortalService
  ) {}

  @Get('bootstrap')
  bootstrap(@Req() req: Request) {
    const ctx = (req as unknown as TenantAwareRequest).tenantContext
    return this.portalService.getBootstrap(ctx)
  }
}

async function buildApp() {
  // Create a minimal FoundationService-compatible mock to avoid 7-arg constructor
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
  const marketService = new MarketService(foundationService)
  const portalService = new PortalService(marketService, foundationService)
  const moduleRef = await Test.createTestingModule({
    controllers: [TestPortalController],
    providers: [
      { provide: PortalService, useValue: portalService },
      { provide: MarketService, useValue: marketService },
      { provide: FoundationService, useValue: foundationService }
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

it('e2e: portal bootstrap returns three scope portals', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN)
    assert.equal(res.statusCode, 200)
    const data = res.body.data
    assert.ok(data.tenantPortal)
    assert.ok(data.brandPortal)
    assert.ok(data.storePortal)
    assert.ok(data.marketProfile)
    assert.ok(Array.isArray(data.regionalOverrides))
  } finally {
    await app.close()
  }
})

it('e2e: tenant portal has scopeCode from headers', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN)
    assert.equal(res.body.data.tenantPortal.scopeCode, 'tenant-cn')
    assert.equal(res.body.data.brandPortal.scopeCode, 'brand-cn')
    assert.equal(res.body.data.storePortal.scopeCode, 'store-cn')
  } finally {
    await app.close()
  }
})

it('e2e: marketProfile embedded in portal bootstrap', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN)
    assert.equal(res.body.data.marketProfile.marketCode, 'cn-mainland')
    assert.equal(res.body.data.marketProfile.timezone.timezone, 'Asia/Shanghai')
  } finally {
    await app.close()
  }
})

it('e2e: US tenant portal uses LA timezone', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_US)
    assert.equal(res.body.data.marketProfile.timezone.timezone, 'America/Los_Angeles')
    assert.equal(res.body.data.tenantPortal.scopeCode, 'tenant-us')
  } finally {
    await app.close()
  }
})

it('e2e: regionalOverrides contain all 3 scope types', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN)
    const scopeTypes = res.body.data.regionalOverrides.map((o: any) => o.scopeType)
    assert.ok(scopeTypes.includes('TENANT'))
    assert.ok(scopeTypes.includes('BRAND'))
    assert.ok(scopeTypes.includes('STORE'))
  } finally {
    await app.close()
  }
})

it('e2e: portal bootstrap contains foundation dependency', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN)
    assert.ok(Array.isArray(res.body.data.foundationDependencies))
    assert.ok(res.body.data.foundationDependencies.length >= 1)
  } finally {
    await app.close()
  }
})

it('e2e: default headers produce tenant-001', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/portal/bootstrap')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.tenantPortal.scopeCode, 'tenant-001')
  } finally {
    await app.close()
  }
})

it('e2e: portal identifiers vary across tenants', async () => {
  const { app } = await buildApp()
  try {
    const a = await request(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN)
    const b = await request(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_US)
    assert.notEqual(a.body.data.tenantPortal.scopeCode, b.body.data.tenantPortal.scopeCode)
    assert.notEqual(a.body.data.marketProfile.marketCode, b.body.data.marketProfile.marketCode)
  } finally {
    await app.close()
  }
})

it('e2e: portal heroTitle and brand code are derived from tenant context', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN)
    assert.equal(res.body.data.brandPortal.brandCode, 'brand-cn')
    assert.equal(res.body.data.brandPortal.tenantCode, 'tenant-cn')
    assert.ok(res.body.data.tenantPortal.heroTitle.includes('tenant-cn'))
    assert.ok(res.body.data.brandPortal.heroTitle.includes('brand-cn'))
  } finally {
    await app.close()
  }
})

it('e2e: portal store portal surfaces cover all 6 storefront surfaces', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN)
    const surfaces = res.body.data.storePortal.supportedSurfaces
    assert.ok(Array.isArray(surfaces))
    assert.ok(surfaces.length >= 6)
    assert.ok(surfaces.includes('OFFICIAL_SITE'))
    assert.ok(surfaces.includes('H5'))
    assert.ok(surfaces.includes('MINIAPP'))
    assert.ok(surfaces.includes('APP'))
    assert.ok(surfaces.includes('PC_CONSOLE'))
    assert.ok(surfaces.includes('PAD_CONSOLE'))
  } finally {
    await app.close()
  }
})

it('e2e: portal supportedLanguages differ for cn vs us markets', async () => {
  const { app } = await buildApp()
  try {
    const cn = await request(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN)
    const us = await request(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_US)
    // Tenant portal: inherits full locale list per market
    assert.ok(cn.body.data.tenantPortal.supportedLanguages.includes('zh-CN'))
    assert.ok(us.body.data.tenantPortal.supportedLanguages.includes('en-US'))
    // Store portal: zh-CN only for cn, en-US only for us
    assert.deepEqual(cn.body.data.storePortal.supportedLanguages, ['zh-CN'])
    assert.deepEqual(us.body.data.storePortal.supportedLanguages, ['en-US'])
  } finally {
    await app.close()
  }
})

it('e2e: portal login paths follow marketCode/tenantId/brandId pattern', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN)
    assert.equal(res.body.data.tenantPortal.loginEntry.loginPath, '/cn-mainland/tenant-cn/login')
    assert.equal(
      res.body.data.brandPortal.loginEntry.loginPath,
      '/cn-mainland/tenant-cn/brand-cn/login'
    )
    assert.equal(res.body.data.tenantPortal.loginEntry.ssoEnabled, true)
    assert.equal(res.body.data.brandPortal.loginEntry.ssoEnabled, true)
  } finally {
    await app.close()
  }
})

it('e2e: portal primaryDomain embeds scope code and market code', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN)
    assert.match(res.body.data.tenantPortal.primaryDomain, /^tenant-cn\.cn-mainland\.b2b\.local$/)
    assert.match(
      res.body.data.brandPortal.primaryDomain,
      /^brand-cn\.tenant-cn\.cn-mainland\.b2b\.local$/
    )
    assert.match(
      res.body.data.storePortal.primaryDomain,
      /^store-cn\.brand-cn\.tenant-cn\.cn-mainland\.local$/
    )
  } finally {
    await app.close()
  }
})
