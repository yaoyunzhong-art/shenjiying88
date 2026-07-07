import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Market 市场配置 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext → TestController → MarketService
 *
 * 验证:
 *   - bootstrap 返回支持的市场 / 默认市场 / foundation 依赖
 *   - scope 路由 (tenant/brand/store) 透传 scope + 返回市场画像 + 覆盖
 *   - portal 路由返回市场基础字段
 *   - 跨市场隔离: cn-mainland vs us-default 时区 / 货币
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Controller,
  Get,
  Inject,
  Param,
  Req
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { MarketService } from './market.service'
import { FoundationService } from '../foundation/foundation.service'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'

function attachTenantContext(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as TenantAwareRequest
  ctx.tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-001',
    brandId: (req.header('x-brand-id') as string | undefined) ?? 'brand-001',
    storeId: (req.header('x-store-id') as string | undefined) ?? 'store-001',
    marketCode: (req.header('x-market-code') as string | undefined) ?? 'cn-mainland'
  }
  next()
}

@Controller('markets')
class TestMarketController {
  constructor(
    @Inject(MarketService) private readonly marketService: MarketService
  ) {}

  @Get('bootstrap')
  bootstrap() {
    return this.marketService.getBootstrap()
  }

  @Get(':scopeType/:scopeCode')
  scopedMarket(@Req() req: Request, @Param('scopeType') scopeType: string, @Param('scopeCode') scopeCode: string) {
    const ctx = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return {
      scopeType,
      scopeCode,
      marketProfile: this.marketService.getMergedProfile(ctx),
      overrides: this.marketService.getOverrides(ctx)
    }
  }

  @Get(':scopeType/:scopeCode/portal')
  portalMarket(@Req() req: Request, @Param('scopeType') scopeType: string, @Param('scopeCode') scopeCode: string) {
    const ctx = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    const profile = this.marketService.getMergedProfile(ctx)
    return {
      scopeType,
      scopeCode,
      marketCode: profile.marketCode,
      locale: profile.locale,
      timezone: profile.timezone,
      tax: profile.tax,
      network: profile.network,
      email: profile.email,
      social: profile.social
    }
  }
}

async function buildApp() {
  const foundationService = {
    getModuleCatalog: () => [],
    getConsumerCatalog: () => [],
    getGovernanceBaseline: () => ({}),
    getBlueprint: () => ({}),
    getDependencySummary: () => ({ dependsOn: ['identity-access', 'configuration-governance'], handoffContracts: [] })
  } as unknown as FoundationService
  const marketService = new MarketService(foundationService)
  const moduleRef = await Test.createTestingModule({
    controllers: [TestMarketController],
    providers: [
      { provide: MarketService, useValue: marketService },
      { provide: FoundationService, useValue: foundationService }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, marketService, foundationService }
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

it('e2e: bootstrap returns supported markets + foundation dependency', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/markets/bootstrap')
    assert.equal(res.statusCode, 200)
    const data = res.body.data
    assert.equal(data.defaultDomesticMarketCode, 'cn-mainland')
    assert.equal(data.defaultInternationalMarketCode, 'us-default')
    assert.ok(Array.isArray(data.supportedMarkets))
    assert.ok(data.supportedMarkets.length >= 2)
    const codes = data.supportedMarkets.map((m: any) => m.marketCode)
    assert.ok(codes.includes('cn-mainland'))
    assert.ok(codes.includes('us-default'))
  } finally {
    await app.close()
  }
})

it('e2e: scoped market returns profile + overrides for tenant scope', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/markets/tenant/tenant-cn')
      .set(TENANT_CN)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.scopeType, 'tenant')
    assert.equal(res.body.data.scopeCode, 'tenant-cn')
    assert.equal(res.body.data.marketProfile.marketCode, 'cn-mainland')
    assert.equal(res.body.data.marketProfile.timezone.timezone, 'Asia/Shanghai')
    assert.equal(res.body.data.marketProfile.currency.currencyCode, 'CNY')
    assert.ok(Array.isArray(res.body.data.overrides))
    assert.equal(res.body.data.overrides.length, 3)
  } finally {
    await app.close()
  }
})

it('e2e: scoped market for US uses LA timezone + USD currency', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/markets/tenant/tenant-us')
      .set(TENANT_US)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.marketProfile.marketCode, 'us-default')
    assert.equal(res.body.data.marketProfile.timezone.timezone, 'America/Los_Angeles')
    assert.equal(res.body.data.marketProfile.currency.currencyCode, 'USD')
  } finally {
    await app.close()
  }
})

it('e2e: scoped market for store scope returns store-level override', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/markets/store/store-001')
      .set(TENANT_CN)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.scopeType, 'store')
    const storeOverride = res.body.data.overrides.find((o: any) => o.scopeType === 'STORE')
    assert.ok(storeOverride)
    assert.equal(storeOverride.inheritanceMode, 'STORE_OVERRIDE')
  } finally {
    await app.close()
  }
})

it('e2e: portal market route returns flat market basics', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/markets/tenant/tenant-cn/portal')
      .set(TENANT_CN)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.marketCode, 'cn-mainland')
    assert.ok(res.body.data.locale)
    assert.ok(res.body.data.timezone)
    assert.ok(res.body.data.tax)
    assert.ok(res.body.data.network)
    assert.ok(res.body.data.email)
    assert.ok(res.body.data.social)
    assert.ok(Array.isArray(res.body.data.social.primaryPlatforms))
  } finally {
    await app.close()
  }
})

it('e2e: overrides array contains tenant / brand / store entries', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/markets/tenant/tenant-cn')
      .set(TENANT_CN)
    const overrides = res.body.data.overrides
    const scopeTypes = overrides.map((o: any) => o.scopeType)
    assert.ok(scopeTypes.includes('TENANT'))
    assert.ok(scopeTypes.includes('BRAND'))
    assert.ok(scopeTypes.includes('STORE'))
  } finally {
    await app.close()
  }
})

it('e2e: CN market has wechat as primary platform', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/markets/tenant/tenant-cn')
      .set(TENANT_CN)
    const platforms = res.body.data.marketProfile.social.primaryPlatforms
    assert.ok(platforms.includes('WECHAT'))
  } finally {
    await app.close()
  }
})

it('e2e: US market has linkedin as primary platform', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/markets/tenant/tenant-us')
      .set(TENANT_US)
    const platforms = res.body.data.marketProfile.social.primaryPlatforms
    assert.ok(platforms.includes('LINKEDIN'))
  } finally {
    await app.close()
  }
})

it('e2e: CN market tax mode is Included with 增值税 label', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/markets/tenant/tenant-cn')
      .set(TENANT_CN)
    const tax = res.body.data.marketProfile.tax
    assert.equal(tax.taxMode, 'PRICES_INCLUDE_TAX')
    assert.equal(tax.taxLabel, '增值税')
    assert.equal(tax.taxRate, 6)
  } finally {
    await app.close()
  }
})

it('e2e: US market tax mode is Excluded with Sales Tax label', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/markets/tenant/tenant-us')
      .set(TENANT_US)
    const tax = res.body.data.marketProfile.tax
    assert.equal(tax.taxMode, 'PRICES_EXCLUDE_TAX')
    assert.equal(tax.taxLabel, 'Sales Tax')
    assert.equal(tax.taxRate, 8.25)
  } finally {
    await app.close()
  }
})

it('e2e: CN/US markets use distinct currency symbols and network regions', async () => {
  const { app } = await buildApp()
  try {
    const cn = await request(app.getHttpServer())
      .get('/markets/tenant/tenant-cn')
      .set(TENANT_CN)
    const us = await request(app.getHttpServer())
      .get('/markets/tenant/tenant-us')
      .set(TENANT_US)
    assert.equal(cn.body.data.marketProfile.currency.symbol, '¥')
    assert.equal(us.body.data.marketProfile.currency.symbol, '$')
    assert.equal(cn.body.data.marketProfile.network.networkRegion, 'MAINLAND_CHINA')
    assert.equal(us.body.data.marketProfile.network.networkRegion, 'NORTH_AMERICA')
  } finally {
    await app.close()
  }
})

it('e2e: CN uses AliyunDm email, US uses SendGrid', async () => {
  const { app } = await buildApp()
  try {
    const cn = await request(app.getHttpServer())
      .get('/markets/tenant/tenant-cn')
      .set(TENANT_CN)
    const us = await request(app.getHttpServer())
      .get('/markets/tenant/tenant-us')
      .set(TENANT_US)
    assert.equal(cn.body.data.marketProfile.email.provider, 'ALIYUN_DM')
    assert.equal(us.body.data.marketProfile.email.provider, 'SENDGRID')
    assert.match(cn.body.data.marketProfile.email.fromAddress, /cn/)
    assert.match(us.body.data.marketProfile.email.fromAddress, /us/)
    assert.notEqual(cn.body.data.marketProfile.email.fromAddress, us.body.data.marketProfile.email.fromAddress)
  } finally {
    await app.close()
  }
})

it('e2e: override scopeCode matches request tenant context', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/markets/tenant/tenant-cn')
      .set(TENANT_CN)
    const tenantOverride = res.body.data.overrides.find((o: any) => o.scopeType === 'TENANT')
    const brandOverride = res.body.data.overrides.find((o: any) => o.scopeType === 'BRAND')
    const storeOverride = res.body.data.overrides.find((o: any) => o.scopeType === 'STORE')
    assert.ok(tenantOverride)
    assert.ok(brandOverride)
    assert.ok(storeOverride)
    assert.equal(tenantOverride.scopeCode, 'tenant-cn')
    assert.equal(brandOverride.scopeCode, 'brand-cn')
    assert.equal(storeOverride.scopeCode, 'store-cn')
    // Inheritance chain: STORE > BRAND > TENANT
    assert.equal(tenantOverride.inheritanceMode, 'TENANT_DEFAULT')
    assert.equal(brandOverride.inheritanceMode, 'BRAND_OVERRIDE')
    assert.equal(storeOverride.inheritanceMode, 'STORE_OVERRIDE')
  } finally {
    await app.close()
  }
})

it('e2e: bootstrap lists exactly 2 supported markets with both country codes', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/markets/bootstrap')
    const markets = res.body.data.supportedMarkets
    const countryCodes = markets.map((m: any) => m.countryCode)
    assert.ok(countryCodes.includes('CN'))
    assert.ok(countryCodes.includes('US'))
    assert.equal(markets.length, 2)
    const cn = markets.find((m: any) => m.marketCode === 'cn-mainland')
    assert.equal(cn.marketName, '中国大陆')
    const us = markets.find((m: any) => m.marketCode === 'us-default')
    assert.equal(us.marketName, 'United States')
  } finally {
    await app.close()
  }
})
