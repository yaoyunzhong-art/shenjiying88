import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Workbench 工作台 HTTP 链路
 *
 * 链路:
 *   HTTP → TestController → WorkbenchService → MarketService + PortalService + FoundationService
 *
 * 验证:
 *   - bootstrap 返回 tenant/brand/store portal + market profile + role workbenches
 *   - getRoleWorkbenches 返回所有角色
 *   - checkCapability 按角色判断能力
 *   - 跨租户 / 跨市场差异
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { WorkbenchService } from './workbench.service'
import { MarketService } from '../market/market.service'
import { PortalService } from '../portal/portal.service'
import { FoundationService } from '../foundation/foundation.service'
import type { TenantAwareRequest } from '../tenant/tenant.types'

function attachTenantContext(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as unknown as unknown as TenantAwareRequest
  ctx.tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-001',
    brandId: (req.header('x-brand-id') as string | undefined) ?? 'brand-001',
    storeId: (req.header('x-store-id') as string | undefined) ?? 'store-001',
    marketCode: (req.header('x-market-code') as string | undefined) ?? 'cn-mainland'
  }
  next()
}

@Controller('workbench')
class TestWorkbenchController {
  constructor(@Inject(WorkbenchService) private readonly workbench: WorkbenchService) {}

  @Get('bootstrap')
  bootstrap(@Req() req: Request) {
    const ctx = (req as unknown as unknown as TenantAwareRequest).tenantContext
    return this.workbench.getBootstrap(ctx)
  }

  @Get('role-workbenches')
  list() {
    return this.workbench.getRoleWorkbenches()
  }

  @Post('check-capability')
  checkCapability(@Body() body: { role: string; capability: string }) {
    return {
      result: this.workbench.checkCapability(body.role, body.capability)
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
  const portalService = new PortalService(marketService, foundationService)
  // runtimeGovernanceService is only used for submit/sync/replay (not bootstrap), pass undefined
  const workbench = new WorkbenchService(marketService, portalService, foundationService, undefined as any)
  const moduleRef = await Test.createTestingModule({
    controllers: [TestWorkbenchController],
    providers: [
      { provide: WorkbenchService, useValue: workbench },
      { provide: MarketService, useValue: marketService },
      { provide: PortalService, useValue: portalService },
      { provide: FoundationService, useValue: foundationService }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, workbench }
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

it('e2e: bootstrap returns workbenches + portals + market', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_CN)
    assert.equal(res.statusCode, 200)
    const data = res.body.data
    assert.ok(data.tenantContext)
    assert.equal(data.tenantContext.tenantId, 'tenant-cn')
    assert.ok(Array.isArray(data.workbenches))
    assert.ok(data.workbenches.length >= 3)
    assert.ok(data.tenantPortal)
    assert.ok(data.brandPortal)
    assert.ok(Array.isArray(data.storePortals))
    assert.ok(data.marketProfile)
    assert.equal(data.marketProfile.marketCode, 'cn-mainland')
  } finally {
    await app.close()
  }
})

it('e2e: bootstrap supported clients list', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_CN)
    assert.ok(Array.isArray(res.body.data.supportedClients))
    assert.ok(res.body.data.supportedClients.length >= 4)
  } finally {
    await app.close()
  }
})

it('e2e: bootstrap supported locales come from market profile', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_CN)
    assert.ok(Array.isArray(res.body.data.supportedLocales))
    assert.ok(res.body.data.supportedLocales.length >= 1)
  } finally {
    await app.close()
  }
})

it('e2e: getRoleWorkbenches returns role list with nav items', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/workbench/role-workbenches')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
    assert.ok(res.body.data.length >= 3)
    const superAdmin = res.body.data.find((w: any) => w.role === 'SUPER_ADMIN')
    assert.ok(superAdmin)
    assert.ok(Array.isArray(superAdmin.navItems))
  } finally {
    await app.close()
  }
})

it('e2e: checkCapability returns true for SUPER_ADMIN with tenant-management', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/workbench/check-capability')
      .send({ role: 'SUPER_ADMIN', capability: 'tenant-management' })
    assert.equal(res.body.data.result, true)
  } finally {
    await app.close()
  }
})

it('e2e: checkCapability returns false for unknown capability', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/workbench/check-capability')
      .send({ role: 'OPERATIONS', capability: 'unknown:capability' })
    assert.equal(res.body.data.result, false)
  } finally {
    await app.close()
  }
})

it('e2e: bootstrap marketProfile differs by tenant', async () => {
  const { app } = await buildApp()
  try {
    const cn = await request(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_CN)
    const us = await request(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_US)
    assert.equal(cn.body.data.marketProfile.timezone.timezone, 'Asia/Shanghai')
    assert.equal(us.body.data.marketProfile.timezone.timezone, 'America/Los_Angeles')
  } finally {
    await app.close()
  }
})

it('e2e: bootstrap tenantContext reflects request headers', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/workbench/bootstrap')
      .set('x-tenant-id', 'tenant-X')
      .set('x-brand-id', 'brand-X')
      .set('x-store-id', 'store-X')
    assert.equal(res.body.data.tenantContext.tenantId, 'tenant-X')
    assert.equal(res.body.data.tenantContext.brandId, 'brand-X')
    assert.equal(res.body.data.tenantContext.storeId, 'store-X')
  } finally {
    await app.close()
  }
})

it('e2e: bootstrap workbenches array has SUPER_ADMIN + others', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_CN)
    const roles = res.body.data.workbenches.map((w: any) => w.role)
    assert.ok(roles.includes('SUPER_ADMIN'))
  } finally {
    await app.close()
  }
})

it('e2e: bootstrap foundationDependencies array is present', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_CN)
    assert.ok(Array.isArray(res.body.data.foundationDependencies))
  } finally {
    await app.close()
  }
})

it('e2e: role workbenches have role/channel/title', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/workbench/role-workbenches')
    for (const wb of res.body.data) {
      assert.ok(wb.role, 'role must be set')
      assert.ok(wb.channel, 'channel must be set')
      assert.ok(wb.title, 'title must be set')
    }
  } finally {
    await app.close()
  }
})

it('e2e: bootstrap returns portalIdentifier derived from tenant', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_CN)
    assert.equal(res.body.data.tenantPortal.scopeCode, 'tenant-cn')
    assert.equal(res.body.data.brandPortal.scopeCode, 'brand-cn')
  } finally {
    await app.close()
  }
})

it('e2e: checkCapability returns true for GUIDE with promo-conversion', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/workbench/check-capability')
      .send({ role: 'GUIDE', capability: 'promo-conversion' })
    assert.equal(res.body.data.result, true)
  } finally {
    await app.close()
  }
})

it('e2e: checkCapability returns false for GUIDE with audit-center', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/workbench/check-capability')
      .send({ role: 'GUIDE', capability: 'audit-center' })
    assert.equal(res.body.data.result, false)
  } finally {
    await app.close()
  }
})

it('e2e: checkCapability returns false for CASHIER with tenant-management', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/workbench/check-capability')
      .send({ role: 'CASHIER', capability: 'tenant-management' })
    assert.equal(res.body.data.result, false)
  } finally {
    await app.close()
  }
})

it('e2e: checkCapability returns false for unknown role', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/workbench/check-capability')
      .send({ role: 'NONEXISTENT_ROLE', capability: 'tenant-management' })
    assert.equal(res.body.data.result, false)
  } finally {
    await app.close()
  }
})

it('e2e: bootstrap regionalLoginPolicies contains loginPath and ssoEnabled', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_CN)
    const policy = res.body.data.regionalLoginPolicies
    assert.ok(policy)
    assert.ok(typeof policy.defaultLoginPath === 'string')
    assert.equal(policy.ssoEnabled, true)
  } finally {
    await app.close()
  }
})

it('e2e: bootstrap workbenches have nav items with key, label, href', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_CN)
    const superAdmin = res.body.data.workbenches.find((w: any) => w.role === 'SUPER_ADMIN')
    assert.ok(superAdmin.navItems.length >= 3)
    for (const item of superAdmin.navItems) {
      assert.ok(item.key)
      assert.ok(item.label)
      assert.ok(item.href)
    }
  } finally {
    await app.close()
  }
})

it('e2e: bootstrap storePortals array contains one entry per request', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/workbench/bootstrap')
      .set({ ...TENANT_CN, 'x-store-id': 'store-001' })
    assert.equal(res.body.data.storePortals.length, 1)
    assert.equal(res.body.data.storePortals[0].scopeCode, 'store-001')
  } finally {
    await app.close()
  }
})

it('e2e: supportedClients list includes core channels', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_CN)
    const clients = res.body.data.supportedClients
    assert.ok(Array.isArray(clients))
    assert.ok(clients.length >= 4)
    // core channels must be present
    assert.ok(clients.includes('PC'))
    assert.ok(clients.includes('H5'))
    assert.ok(clients.includes('MINIAPP'))
    assert.ok(clients.includes('APP'))
  } finally {
    await app.close()
  }
})
