import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Get, Inject, Req } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type { Request } from 'express'
import type { NextFunction, Response } from 'express'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { assertExactKeys } from '../../testing/contract-assertions'
import {
  createE2EFoundationDependencySummary,
  createResolvedTenantContextFixture,
  createSupportedClientsFixture
} from '../../testing/bootstrap-fixtures'
import { MarketService } from '../market/market.service'
import { PortalService } from '../portal/portal.service'
import { WorkbenchService } from '../workbench/workbench.service'

import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'

function attachRequestContext(req: TenantAwareRequest) {
  const context = createResolvedTenantContextFixture()
  req.tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? context.tenantId,
    brandId: (req.header('x-brand-id') as string | undefined) ?? context.brandId,
    storeId: (req.header('x-store-id') as string | undefined) ?? context.storeId,
    marketCode: (req.header('x-market-code') as string | undefined) ?? context.marketCode
  }
}

@Controller('markets')
class TestMarketController {
  constructor(@Inject(MarketService) private readonly marketService: MarketService) {}

  @Get('bootstrap')
  getBootstrap() {
    return this.marketService.getBootstrap()
  }
}

@Controller('portals')
class TestPortalController {
  constructor(@Inject(PortalService) private readonly portalService: PortalService) {}

  @Get('bootstrap')
  getBootstrap(@Req() req: Request) {
    return this.portalService.getBootstrap((req as TenantAwareRequest).tenantContext as RequestTenantContext)
  }
}

@Controller('workbenches')
class TestWorkbenchController {
  constructor(@Inject(WorkbenchService) private readonly workbenchService: WorkbenchService) {}

  @Get('bootstrap')
  getBootstrap(@Req() req: Request) {
    return this.workbenchService.getBootstrap((req as TenantAwareRequest).tenantContext as RequestTenantContext)
  }
}

it('e2e: bootstrap consumers expose stable api result envelopes', async () => {
  const moduleRef = await Test.createTestingModule({
    controllers: [TestMarketController, TestPortalController, TestWorkbenchController],
    providers: [
      {
        provide: 'FoundationService',
        useValue: {
          getDependencySummary: () => createE2EFoundationDependencySummary()
        }
      },
      {
        provide: MarketService,
        useFactory: (foundationService: { getDependencySummary: (consumer: string) => unknown }) =>
          new MarketService(foundationService as never),
        inject: ['FoundationService']
      },
      {
        provide: PortalService,
        useFactory: (
          marketService: MarketService,
          foundationService: { getDependencySummary: (consumer: string) => unknown }
        ) => new PortalService(marketService, foundationService as never),
        inject: [MarketService, 'FoundationService']
      },
      {
        provide: 'RuntimeGovernanceService',
        useValue: {}
      },
      {
        provide: WorkbenchService,
        useFactory: (
          marketService: MarketService,
          portalService: PortalService,
          foundationService: { getDependencySummary: (consumer: string) => unknown },
          runtimeGovernanceService: Record<string, unknown>
        ) => new WorkbenchService(marketService, portalService, foundationService as never, runtimeGovernanceService as never),
        inject: [MarketService, PortalService, 'FoundationService', 'RuntimeGovernanceService']
      }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use((req: unknown, _res: Response, next: NextFunction) => {
    attachRequestContext(req as TenantAwareRequest)
    next()
  })
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  try {
    const markets = await request(app.getHttpServer()).get('/markets/bootstrap')
    assert.equal(markets.statusCode, 200)
    assertExactKeys(markets.body, ['success', 'message', 'data', 'timestamp'])
    assert.equal(markets.body.message, 'OK')
    assertExactKeys(markets.body.data, [
      'defaultDomesticMarketCode',
      'defaultInternationalMarketCode',
      'supportedMarkets',
      'foundationDependencies',
      'foundationContracts'
    ])
    assert.equal(Array.isArray(markets.body.data.supportedMarkets), true)
    assert.equal(markets.body.data.supportedMarkets.length, 2)
    assert.deepEqual(markets.body.data.foundationDependencies, [
      'identity-access',
      'configuration-governance'
    ])
    assert.deepEqual(markets.body.data.foundationContracts, ['@m5/types'])
    assert.deepEqual(
      markets.body.data.supportedMarkets.map((market: { marketCode: string }) => market.marketCode),
      ['cn-mainland', 'us-default']
    )
    for (const market of markets.body.data.supportedMarkets) {
      assertExactKeys(market, [
        'marketCode',
        'marketName',
        'countryCode',
        'locale',
        'timezone',
        'currency',
        'tax',
        'network',
        'email',
        'social'
      ])
      assertExactKeys(market.tax, ['taxMode', 'taxRate', 'taxLabel'])
      assert.equal(typeof market.tax.taxRate, 'number')
      assertExactKeys(market.network, ['networkRegion', 'apiBaseUrl', 'cdnBaseUrl', 'callbackBaseUrl'])
      assert.equal(typeof market.network.callbackBaseUrl, 'string')
      assertExactKeys(market.email, ['provider', 'fromName', 'fromAddress', 'replyTo'])
      assert.equal(typeof market.email.replyTo, 'string')
    }

    const portals = await request(app.getHttpServer()).get('/portals/bootstrap')
    assert.equal(portals.statusCode, 200)
    assertExactKeys(portals.body, ['success', 'message', 'data', 'timestamp'])
    assert.equal(portals.body.message, 'OK')
    assertExactKeys(portals.body.data, [
      'tenantPortal',
      'brandPortal',
      'storePortal',
      'marketProfile',
      'regionalOverrides',
      'foundationDependencies',
      'foundationContracts'
    ])
    assertExactKeys(portals.body.data.tenantPortal.loginEntry, ['label', 'loginPath', 'ssoEnabled'])
    assert.equal(typeof portals.body.data.tenantPortal.primaryDomain, 'string')
    assert.equal(typeof portals.body.data.storePortal.primaryDomain, 'string')
    assert.equal(Array.isArray(portals.body.data.regionalOverrides), true)
    assert.deepEqual(portals.body.data.foundationDependencies, [
      'identity-access',
      'configuration-governance'
    ])
    assert.deepEqual(portals.body.data.foundationContracts, ['@m5/types'])
    assertExactKeys(portals.body.data.regionalOverrides[0], ['scopeType', 'scopeCode', 'inheritanceMode', 'marketCode', 'email'])
    assertExactKeys(portals.body.data.regionalOverrides[0].email, ['fromName'])
    assertExactKeys(portals.body.data.marketProfile.tax, ['taxMode', 'taxRate', 'taxLabel'])
    assertExactKeys(portals.body.data.marketProfile.network, ['networkRegion', 'apiBaseUrl', 'cdnBaseUrl', 'callbackBaseUrl'])
    assertExactKeys(portals.body.data.marketProfile.email, ['provider', 'fromName', 'fromAddress', 'replyTo'])

    const workbenches = await request(app.getHttpServer()).get('/workbenches/bootstrap')
    assert.equal(workbenches.statusCode, 200)
    assertExactKeys(workbenches.body, ['success', 'message', 'data', 'timestamp'])
    assert.equal(workbenches.body.message, 'OK')
    assertExactKeys(workbenches.body.data, [
      'tenantContext',
      'workbenches',
      'storePortals',
      'tenantPortal',
      'brandPortal',
      'marketProfile',
      'regionalLoginPolicies',
      'supportedLocales',
      'supportedClients',
      'foundationDependencies',
      'foundationContracts'
    ])
    assertExactKeys(workbenches.body.data.tenantContext, ['tenantId', 'brandId', 'storeId', 'marketCode'])
    assertExactKeys(workbenches.body.data.regionalLoginPolicies, ['defaultLoginPath', 'ssoEnabled'])
    assert.deepEqual(workbenches.body.data.supportedLocales, ['zh-CN'])
    assert.deepEqual(workbenches.body.data.supportedClients, createSupportedClientsFixture())
    assert.deepEqual(workbenches.body.data.foundationDependencies, [
      'identity-access',
      'configuration-governance'
    ])
    assert.deepEqual(workbenches.body.data.foundationContracts, ['@m5/types'])
    assert.deepEqual(workbenches.body.data.regionalLoginPolicies, {
      defaultLoginPath: '/cn-mainland/tenant-demo/login',
      ssoEnabled: true
    })
    assert.equal(workbenches.body.data.workbenches.length, 10)
    assert.deepEqual(
      workbenches.body.data.workbenches.map((workbench: { role: string }) => workbench.role),
      [
        'SUPER_ADMIN',
        'TENANT_ADMIN',
        'BRAND_MANAGER',
        'STORE_MANAGER',
        'GUIDE',
        'CASHIER',
        'OPERATIONS',
        'FINANCE',
        'WAREHOUSE',
        'COACH'
      ]
    )
    for (const workbench of workbenches.body.data.workbenches) {
      assertExactKeys(workbench, ['role', 'channel', 'title', 'description', 'marketCodes', 'navItems'])
      assert.equal(Array.isArray(workbench.marketCodes), true)
      assert.equal(Array.isArray(workbench.navItems), true)
      assert.equal(workbench.navItems.length > 0, true)
      assertExactKeys(workbench.navItems[0], ['key', 'label', 'href', 'description'])
    }
    assertExactKeys(workbenches.body.data.marketProfile.tax, ['taxMode', 'taxRate', 'taxLabel'])
    assertExactKeys(workbenches.body.data.marketProfile.network, ['networkRegion', 'apiBaseUrl', 'cdnBaseUrl', 'callbackBaseUrl'])
    assertExactKeys(workbenches.body.data.marketProfile.email, ['provider', 'fromName', 'fromAddress', 'replyTo'])
  } finally {
    await app.close()
  }
})

async function buildBootstrapApp() {
  const moduleRef = await Test.createTestingModule({
    controllers: [TestMarketController, TestPortalController, TestWorkbenchController],
    providers: [
      { provide: 'FoundationService', useValue: { getDependencySummary: () => createE2EFoundationDependencySummary() } },
      {
        provide: MarketService,
        useFactory: (foundationService: { getDependencySummary: (consumer: string) => unknown }) =>
          new MarketService(foundationService as never),
        inject: ['FoundationService']
      },
      {
        provide: PortalService,
        useFactory: (
          marketService: MarketService,
          foundationService: { getDependencySummary: (consumer: string) => unknown }
        ) => new PortalService(marketService, foundationService as never),
        inject: [MarketService, 'FoundationService']
      },
      { provide: 'RuntimeGovernanceService', useValue: {} },
      {
        provide: WorkbenchService,
        useFactory: (
          marketService: MarketService,
          portalService: PortalService,
          foundationService: { getDependencySummary: (consumer: string) => unknown },
          runtimeGovernanceService: Record<string, unknown>
        ) => new WorkbenchService(marketService, portalService, foundationService as never, runtimeGovernanceService as never),
        inject: [MarketService, PortalService, 'FoundationService', 'RuntimeGovernanceService']
      }
    ]
  }).compile()
  const app = moduleRef.createNestApplication()
  app.use((req: unknown, _res: Response, next: NextFunction) => {
    attachRequestContext(req as TenantAwareRequest)
    next()
  })
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return app
}

it('e2e: markets bootstrap returns exactly 2 supported markets with cn-mainland first', async () => {
  const app = await buildBootstrapApp()
  try {
    const res = await request(app.getHttpServer()).get('/markets/bootstrap')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.supportedMarkets.length, 2)
    assert.equal(res.body.data.supportedMarkets[0].marketCode, 'cn-mainland')
    assert.equal(res.body.data.supportedMarkets[1].marketCode, 'us-default')
  } finally {
    await app.close()
  }
})

it('e2e: markets bootstrap defaults match cn-mainland + us-default pair', async () => {
  const app = await buildBootstrapApp()
  try {
    const res = await request(app.getHttpServer()).get('/markets/bootstrap')
    assert.equal(res.body.data.defaultDomesticMarketCode, 'cn-mainland')
    assert.equal(res.body.data.defaultInternationalMarketCode, 'us-default')
  } finally {
    await app.close()
  }
})

it('e2e: portal bootstrap returns tenantPortal with login entry', async () => {
  const app = await buildBootstrapApp()
  try {
    const res = await request(app.getHttpServer()).get('/portals/bootstrap')
    assert.equal(res.statusCode, 200)
    assert.ok(res.body.data.tenantPortal)
    assert.ok(res.body.data.tenantPortal.loginEntry)
    assert.equal(typeof res.body.data.tenantPortal.loginEntry.loginPath, 'string')
  } finally {
    await app.close()
  }
})

it('e2e: workbench bootstrap returns 10 roles sorted in order', async () => {
  const app = await buildBootstrapApp()
  try {
    const res = await request(app.getHttpServer()).get('/workbenches/bootstrap')
    const roles = res.body.data.workbenches.map((w: { role: string }) => w.role)
    assert.deepEqual(roles, [
      'SUPER_ADMIN',
      'TENANT_ADMIN',
      'BRAND_MANAGER',
      'STORE_MANAGER',
      'GUIDE',
      'CASHIER',
      'OPERATIONS',
      'FINANCE',
      'WAREHOUSE',
      'COACH'
    ])
  } finally {
    await app.close()
  }
})

it('e2e: portal bootstrap supports x-market-code override', async () => {
  const app = await buildBootstrapApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/portals/bootstrap')
      .set('x-market-code', 'us-default')
    assert.equal(res.statusCode, 200)
    assert.ok(res.body.data.marketProfile)
    assert.equal(res.body.data.marketProfile.countryCode, 'US')
  } finally {
    await app.close()
  }
})

it('e2e: workbench bootstrap respects x-tenant-id in tenantContext echo', async () => {
  const app = await buildBootstrapApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/workbenches/bootstrap')
      .set('x-tenant-id', 'tenant-zzz')
    assert.equal(res.body.data.tenantContext.tenantId, 'tenant-zzz')
  } finally {
    await app.close()
  }
})

it('e2e: market bootstrap returns same payload on second call (idempotency)', async () => {
  const app = await buildBootstrapApp()
  try {
    const first = await request(app.getHttpServer()).get('/markets/bootstrap')
    const second = await request(app.getHttpServer()).get('/markets/bootstrap')
    assert.equal(first.statusCode, 200)
    assert.equal(second.statusCode, 200)
    assert.deepEqual(first.body.data, second.body.data)
  } finally {
    await app.close()
  }
})

it('e2e: workbench bootstrap regionalLoginPolicies defaultLoginPath follows market/tenant pattern', async () => {
  const app = await buildBootstrapApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/workbenches/bootstrap')
      .set('x-market-code', 'us-default')
      .set('x-tenant-id', 'tenant-alpha')
    assert.equal(res.body.data.regionalLoginPolicies.defaultLoginPath, '/us-default/tenant-alpha/login')
    assert.equal(res.body.data.regionalLoginPolicies.ssoEnabled, true)
  } finally {
    await app.close()
  }
})

it('e2e: workbench bootstrap supportedClients is exactly 5 channels', async () => {
  const app = await buildBootstrapApp()
  try {
    const res = await request(app.getHttpServer()).get('/workbenches/bootstrap')
    assert.equal(res.body.data.supportedClients.length, 5)
    assert.deepEqual(res.body.data.supportedClients, createSupportedClientsFixture())
  } finally {
    await app.close()
  }
})

it('e2e: workbench bootstrap workbenches each have marketCodes array', async () => {
  const app = await buildBootstrapApp()
  try {
    const res = await request(app.getHttpServer()).get('/workbenches/bootstrap')
    for (const wb of res.body.data.workbenches) {
      assert.ok(Array.isArray(wb.marketCodes), `${wb.role} must have marketCodes array`)
      assert.ok(wb.marketCodes.length >= 1, `${wb.role} must support at least 1 market`)
    }
  } finally {
    await app.close()
  }
})

it('e2e: portal bootstrap market profile inherits from x-market-code header', async () => {
  const app = await buildBootstrapApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/portals/bootstrap')
      .set('x-market-code', 'cn-mainland')
    assert.equal(res.body.data.marketProfile.marketCode, 'cn-mainland')
    assert.equal(res.body.data.marketProfile.locale.defaultLanguage, 'zh-CN')
  } finally {
    await app.close()
  }
})
