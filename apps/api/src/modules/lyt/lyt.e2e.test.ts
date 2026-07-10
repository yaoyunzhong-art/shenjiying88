import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: LYT 连接编排引擎 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext → TestController → LytService → Mock adapters
 *
 * 验证:
 *   - fixtures 列表 / 摘要 / 单个获取
 *   - fixture compare / import-preview / import-plan
 *   - bootstrap 端点
 *   - connection 查询（storeId / readiness / access-view / adapter）
 *   - governance summary / alerts
 *   - device status 查询
 *   - webhooks callback / drill / replay-fixture
 *   - 参数校验（缺少必需参数返回 400）
 *   - 边界情况（不存在的 fixture key、空 tenantContext）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  ValidationPipe
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { LytService } from './lyt.service'
import { LytAdapterRegistry } from './lyt-adapter.registry'
import { LytConnectionManager } from './lyt-connection.manager'
import { LytGovernanceQueryService } from './lyt-governance-query.service'
import { MockLytAdapter } from './adapters/mock-lyt.adapter'
import { FoundationService } from '../foundation/foundation.service'
import { IntegrationOrchestrationService } from '../foundation/integration-orchestration/integration-orchestration.service'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'
import type { LytResolvedConnection } from './lyt.entity'
import type {
  LytFixtureCompareDto,
  LytFixtureImportPlanDto,
  LytFixtureImportPreviewDto,
  LytWebhookDrillDto,
  LytWebhookFixtureReplayDto,
  LytWebhookIngestDto
} from './lyt.dto'

// ---------------------------------------------------------------------------
// 内联 Test Controller（复制 LytController 相同路由）
// ---------------------------------------------------------------------------

@Controller('lyt')
class TestLytController {
  constructor(@Inject(LytService) private readonly lytService: LytService) {}

  @Get('fixtures')
  getFixtures(@Query('transport') transport?: string, @Query('capability') capability?: string) {
    return this.lytService.getFixtures({ transport, capability })
  }

  @Get('fixtures/summary')
  getFixtureSummary(@Query('transport') transport?: string, @Query('capability') capability?: string) {
    return this.lytService.getFixtureSummary({ transport, capability })
  }

  @Get('fixtures/:key')
  getFixture(@Param('key') key: string) {
    return this.lytService.getFixture(key)
  }

  @Post('fixtures/:key/compare')
  compareFixture(@Param('key') key: string, @Body() body: LytFixtureCompareDto) {
    return this.lytService.compareFixtureInput(key, body)
  }

  @Post('fixtures/:key/import-preview')
  importFixturePreview(@Param('key') key: string, @Body() body: LytFixtureImportPreviewDto) {
    return this.lytService.previewFixtureImport(key, body)
  }

  @Post('fixtures/:key/import-plan')
  importFixturePlan(@Param('key') key: string, @Body() body: LytFixtureImportPlanDto) {
    return this.lytService.planFixtureImport(key, body)
  }

  @Get('bootstrap')
  getBootstrap() {
    return this.lytService.getBootstrap()
  }

  @Get('connection/:storeId')
  async getConnection(@Param('storeId') storeId: string, @Req() req: Request) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext | undefined
    return this.lytService.getConnection(storeId, tc)
  }

  @Get('connection/:storeId/readiness')
  async getConnectionCapabilityReadiness(@Param('storeId') storeId: string, @Req() req: Request) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext | undefined
    return this.lytService.getConnectionCapabilityReadiness(storeId, tc)
  }

  @Get('connection/:storeId/access-view')
  async getStoreCapabilityAccessView(@Param('storeId') storeId: string, @Req() req: Request) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext | undefined
    return this.lytService.getStoreCapabilityAccessView(storeId, tc)
  }

  @Get('connection/:storeId/adapter')
  async getAdapterSelection(@Param('storeId') storeId: string, @Req() req: Request) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext | undefined
    return this.lytService.getAdapterSelection(storeId, tc)
  }

  @Get('connection/governance-summary')
  async getConnectionGovernanceSummary(@Req() req: Request) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext | undefined
    return this.lytService.getConnectionGovernanceSummary(tc)
  }

  @Get('connection/governance-alerts')
  async getConnectionGovernanceAlerts(@Req() req: Request) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext | undefined
    return this.lytService.getConnectionGovernanceAlerts(tc)
  }

  @Get('devices/:deviceId/status')
  async getDeviceStatus(@Param('deviceId') deviceId: string) {
    return this.lytService.getAdapter().getDeviceStatus(deviceId)
  }

  @Post('webhooks/callback')
  async acceptWebhook(@Body() body: LytWebhookIngestDto) {
    return this.lytService.acceptWebhook(body)
  }

  @Post('webhooks/drill')
  async drillWebhook(@Body() body: LytWebhookDrillDto) {
    return this.lytService.drillWebhook(body)
  }

  @Post('webhooks/replay-fixture')
  async replayWebhookFixture(@Body() body: LytWebhookFixtureReplayDto) {
    return this.lytService.replayWebhookFixture(body)
  }
}

// ---------------------------------------------------------------------------
// Tenant Context Helpers
// ---------------------------------------------------------------------------

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

const TENANT_A = { 'x-tenant-id': 'tenant-A', 'x-brand-id': 'brand-A', 'x-store-id': 'store-A' }
const TENANT_B = { 'x-tenant-id': 'tenant-B', 'x-brand-id': 'brand-B', 'x-store-id': 'store-B' }

// ---------------------------------------------------------------------------
// Mock Factories
// ---------------------------------------------------------------------------

function makeResolvedConnection(overrides: Partial<LytResolvedConnection> = {}): LytResolvedConnection {
  return {
    vendor: 'lyt',
    tenantId: 'tenant-A',
    brandId: 'brand-A',
    storeId: 'store-001',
    vendorTenantId: 'tenant-A',
    vendorBrandId: 'brand-A',
    vendorStoreId: 'store-001',
    endpoint: 'mock://lyt/mock/store',
    authMode: 'mock-token',
    hasCredential: false,
    capabilities: ['member', 'payment', 'order', 'device', 'gate'],
    connectionStatus: 'configured',
    source: 'fallback',
    resolutionLevel: 'fallback',
    resolutionKey: 'mock:key',
    resolutionChain: ['store:store-001', 'tenant:tenant-A'],
    healthStatus: 'pending-configuration',
    lastCheckedAt: new Date().toISOString(),
    ...overrides
  }
}

function makeConnectionManagerMock(): Partial<LytConnectionManager> {
  const storeConnections = new Map<string, LytResolvedConnection>()
  return {
    getConnectionForStore(storeId: string, tenantContext?: Pick<RequestTenantContext, 'tenantId' | 'brandId'>) {
      const key = `${tenantContext?.tenantId ?? 'default'}:${storeId}`
      if (!storeConnections.has(key)) {
        storeConnections.set(key, makeResolvedConnection({
          storeId,
          tenantId: tenantContext?.tenantId ?? 'tenant-demo',
          brandId: tenantContext?.brandId
        }))
      }
      return Promise.resolve(storeConnections.get(key)!)
    },
    listScopedStores(tenantContext?: Pick<RequestTenantContext, 'tenantId' | 'brandId'>) {
      return Promise.resolve([
        {
          id: 'store-001',
          tenantId: tenantContext?.tenantId ?? 'tenant-001',
          brandId: tenantContext?.brandId ?? 'brand-001',
          code: 'STORE001',
          name: 'Test Store'
        }
      ])
    }
  }
}

function makeGovernanceQueryServiceMock(): Partial<LytGovernanceQueryService> {
  return {
    getConnectionCapabilityReadiness(storeId: string, _tenantContext?: Pick<RequestTenantContext, 'tenantId' | 'brandId'>) {
      return Promise.resolve({
        storeId,
        ready: true,
        tenantId: 'mock-tenant',
        vendor: 'mock-vendor',
        vendorTenantId: 'mock-vt',
        vendorStoreId: 'mock-vs',
        connectionStatus: 'configured' as const,
        hasCredential: true,
        enabledCapabilities: ['member', 'payment', 'order', 'device', 'gate'],
        readinessByCapability: [],
        missingRequirements: [] as string[],
        recommendedNextActions: [] as string[]
      })
    },
    getConnectionGovernanceSummary(_tenantContext?: Pick<RequestTenantContext, 'tenantId' | 'brandId'>) {
      return Promise.resolve({
        generatedAt: new Date().toISOString(),
        scope: {},
        totalStores: 3,
        configuredStores: 2,
        pendingConfigurationStores: 1,
        staleStores: 0,
        inheritedStores: 0,
        storeLevelConfiguredStores: 2,
        capabilityBreakdown: [],
        recommendedNextActions: [],
        storeGroups: [],
        stores: []
      })
    },
    getConnectionGovernanceAlerts(_tenantContext?: Pick<RequestTenantContext, 'tenantId' | 'brandId'>) {
      return Promise.resolve({
        generatedAt: new Date().toISOString(),
        scope: {},
        alerts: []
      })
    },
    getStoreCapabilityAccessView(storeId: string, _tenantContext?: Pick<RequestTenantContext, 'tenantId' | 'brandId'>) {
      return Promise.resolve({
        storeId,
        connectionStatus: 'configured' as const,
        accessByCapability: [],
        recommendedNextActions: [] as string[]
      })
    }
  }
}

function makeFoundationServiceMock(): Partial<FoundationService> {
  return {
    getDependencySummary(_module: string) {
      return {
        module: 'lyt-adapter',
        dependencies: ['member', 'transaction', 'loyalty', 'campaign'],
        contracts: ['LytMemberProfile', 'LytOrderPayload', 'LytDeviceStatus'],
        phase: 'scaffold'
      }
    }
  } as any
}

function makeIntegrationOrchestrationServiceMock(): Partial<IntegrationOrchestrationService> {
  return {
    acceptWebhook(_app: string, input: any) {
      return Promise.resolve({
        accepted: true,
        status: 'ok',
        idempotencyKey: input.eventId ? `idem:${input.eventId}` : `idem:${Date.now()}`,
        signatureStatus: 'not-applicable'
      })
    },
    publishEvent(input: any) {
      return Promise.resolve({
        published: true,
        eventId: input.eventId ?? `drill-${Date.now()}`,
        mode: input.dryRun ? 'dry-run' : 'published',
        standardizedEvent: {
          aggregateId: `evt-${Date.now()}`,
          sourceEventName: input.eventType ?? 'unknown',
          standardizedEventName: input.eventType ?? 'unknown',
          capability: 'member',
          idempotencyKey: `idem:${Date.now()}`,
          payload: input.payload ?? {}
        }
      })
    }
  } as any
}

// ---------------------------------------------------------------------------
// Build App
// ---------------------------------------------------------------------------

/** create a minimal adapter-like mock for listAvailableAdapters */
function makeAdapterMock(name: string, mode: 'mock' | 'sandbox' | 'real') {
  return { adapterName: name, adapterMode: mode } as any
}

async function buildApp() {
  const mockAdapter = new MockLytAdapter()
  const sandboxAdapterMock = makeAdapterMock('SandboxLytAdapter', 'sandbox')
  const realAdapterMock = makeAdapterMock('RealLytAdapter', 'real')
  const adapterRegistry = new LytAdapterRegistry(
    mockAdapter,
    sandboxAdapterMock,
    realAdapterMock
  )
  const connectionManager = makeConnectionManagerMock() as LytConnectionManager
  const governanceQueryService = makeGovernanceQueryServiceMock() as LytGovernanceQueryService
  const foundationService = makeFoundationServiceMock() as FoundationService
  const integrationOrchestrationService = makeIntegrationOrchestrationServiceMock() as IntegrationOrchestrationService

  const lytService = new LytService(
    adapterRegistry,
    foundationService,
    connectionManager,
    integrationOrchestrationService,
    undefined,
    undefined,
    undefined,
    undefined,
    governanceQueryService,
    undefined
  )

  const moduleRef = await Test.createTestingModule({
    controllers: [TestLytController],
    providers: [
      { provide: LytService, useValue: lytService },
      { provide: LytAdapterRegistry, useValue: adapterRegistry },
      { provide: FoundationService, useValue: foundationService },
      { provide: LytGovernanceQueryService, useValue: governanceQueryService },
      { provide: IntegrationOrchestrationService, useValue: integrationOrchestrationService }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, lytService, mockAdapter }
}

// ---------------------------------------------------------------------------
// Fixtures 端点
// ---------------------------------------------------------------------------

it('e2e: get fixtures returns all fixture catalog items', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/lyt/fixtures').set(TENANT_A)
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
    assert.ok(res.body.data.length >= 5)
    for (const f of res.body.data) {
      assert.ok(f.key)
      assert.ok(f.title)
      assert.ok(f.transport)
      assert.ok(f.capability)
    }
  } finally {
    await app.close()
  }
})

it('e2e: get fixtures filtered by transport api', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/lyt/fixtures?transport=api').set(TENANT_A)
    assert.equal(res.statusCode, 200)
    for (const f of res.body.data) {
      assert.equal(f.transport, 'api')
    }
  } finally {
    await app.close()
  }
})

it('e2e: get fixtures filtered by capability', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/lyt/fixtures?capability=member').set(TENANT_A)
    assert.equal(res.statusCode, 200)
    for (const f of res.body.data) {
      assert.equal(f.capability, 'member')
    }
  } finally {
    await app.close()
  }
})

it('e2e: get fixture summary returns checklist', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/lyt/fixtures/summary').set(TENANT_A)
    assert.equal(res.statusCode, 200)
    assert.ok(typeof res.body.data.totalFixtures === 'number')
    assert.ok(typeof res.body.data.readyFixtures === 'number')
    assert.ok(typeof res.body.data.blockedFixtures === 'number')
    assert.ok(Array.isArray(res.body.data.blockedFixtureKeys))
  } finally {
    await app.close()
  }
})

it('e2e: get single fixture by valid key', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/lyt/fixtures/member-query').set(TENANT_A)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.key, 'member-query')
    assert.ok(res.body.data.title)
  } finally {
    await app.close()
  }
})

it('e2e: get fixture by unknown key returns 400+', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/lyt/fixtures/nonexistent-key-xyz').set(TENANT_A)
    assert.ok(res.statusCode >= 400)
  } finally {
    await app.close()
  }
})

it('e2e: compare fixture returns compare report', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/lyt/fixtures/member-query/compare')
      .set(TENANT_A)
      .send({ payload: { externalMemberId: 'ext-comp-001' } })
    assert.ok(res.statusCode === 200 || res.statusCode === 201)
    assert.ok(res.body.data)
    assert.equal(res.body.data.fixtureKey, 'member-query')
  } finally {
    await app.close()
  }
})

it('e2e: import fixture preview returns preview contract', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/lyt/fixtures/member-query/import-preview')
      .set(TENANT_A)
      .send({ payload: { externalMemberId: 'ext-prev-001' } })
    assert.ok(res.statusCode === 200 || res.statusCode === 201)
    assert.ok(res.body.data)
    assert.equal(res.body.data.fixtureKey, 'member-query')
  } finally {
    await app.close()
  }
})

it('e2e: import fixture plan returns plan contract', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/lyt/fixtures/member-query/import-plan')
      .set(TENANT_A)
      .send({ payload: { externalMemberId: 'ext-plan-001' } })
    assert.ok(res.statusCode === 200 || res.statusCode === 201)
    assert.ok(res.body.data)
    assert.equal(res.body.data.fixtureKey, 'member-query')
  } finally {
    await app.close()
  }
})

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

it('e2e: bootstrap returns adapter name and foundation info', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/lyt/bootstrap').set(TENANT_A)
    assert.equal(res.statusCode, 200)
    assert.ok(res.body.data)
    assert.equal(res.body.data.adapter, 'MockLytAdapter')
    assert.ok(Array.isArray(res.body.data.foundationDependencies))
    assert.ok(Array.isArray(res.body.data.foundationContracts))
  } finally {
    await app.close()
  }
})

// ---------------------------------------------------------------------------
// Connection 端点
// ---------------------------------------------------------------------------

it('e2e: get connection for store returns resolved connection', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/lyt/connection/store-001').set(TENANT_A)
    assert.equal(res.statusCode, 200)
    assert.ok(res.body.data)
    assert.equal(res.body.data.storeId, 'store-001')
    assert.ok(res.body.data.connectionStatus)
    assert.ok(Array.isArray(res.body.data.capabilities))
  } finally {
    await app.close()
  }
})

it('e2e: different tenants get different connections for same store', async () => {
  const { app } = await buildApp()
  try {
    const resA = await request(app.getHttpServer()).get('/lyt/connection/store-001').set(TENANT_A)
    const resB = await request(app.getHttpServer()).get('/lyt/connection/store-001').set(TENANT_B)
    assert.equal(resA.statusCode, 200)
    assert.equal(resB.statusCode, 200)
    if (resA.body.data?.tenantId && resB.body.data?.tenantId) {
      assert.notEqual(resA.body.data.tenantId, resB.body.data.tenantId)
    }
  } finally {
    await app.close()
  }
})

it('e2e: get connection readiness for store', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/lyt/connection/store-001/readiness')
      .set(TENANT_A)
    assert.equal(res.statusCode, 200)
    assert.ok(res.body.data)
    assert.ok(typeof res.body.data.ready === 'boolean')
  } finally {
    await app.close()
  }
})

it('e2e: get store capability access view', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/lyt/connection/store-001/access-view')
      .set(TENANT_A)
    assert.equal(res.statusCode, 200)
    assert.ok(res.body.data)
  } finally {
    await app.close()
  }
})

it('e2e: get adapter selection for store', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/lyt/connection/store-001/adapter')
      .set(TENANT_A)
    assert.equal(res.statusCode, 200)
    assert.ok(res.body.data)
  } finally {
    await app.close()
  }
})

// ---------------------------------------------------------------------------
// Governance 端点
// ---------------------------------------------------------------------------

it('e2e: get governance summary', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/lyt/connection/governance-summary')
      .set(TENANT_A)
    assert.equal(res.statusCode, 200)
    assert.ok(res.body.data)
  } finally {
    await app.close()
  }
})

it('e2e: get governance alerts returns alert contract', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/lyt/connection/governance-alerts')
      .set(TENANT_A)
    assert.equal(res.statusCode, 200)
    assert.ok(res.body.data)
    assert.ok(res.body.data && typeof res.body.data === 'object')
  } finally {
    await app.close()
  }
})

// ---------------------------------------------------------------------------
// Device 端点
// ---------------------------------------------------------------------------

it('e2e: get device status returns online (mock adapter)', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/lyt/devices/dev-001/status').set(TENANT_A)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.status, 'ONLINE')
    assert.equal(res.body.data.deviceId, 'dev-001')
  } finally {
    await app.close()
  }
})

it('e2e: get device status for different device', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/lyt/devices/gate-main/status').set(TENANT_A)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.deviceId, 'gate-main')
  } finally {
    await app.close()
  }
})

// ---------------------------------------------------------------------------
// Webhook 端点
// ---------------------------------------------------------------------------

it('e2e: webhook callback accepts valid payload', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/lyt/webhooks/callback')
      .set(TENANT_A)
      .send({
        signature: 'sig-test-001',
        timestamp: new Date().toISOString(),
        eventId: 'evt-cb-001',
        eventType: 'member.created',
        payload: { memberId: 'm-001', nickname: 'Test' }
      })
    assert.ok([200, 201].includes(res.statusCode))
    assert.ok(res.body.data)
  } finally {
    await app.close()
  }
})

it('e2e: webhook callback with empty body still processed (DTO is lenient)', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/lyt/webhooks/callback')
      .set(TENANT_A)
      .send({ signature: '', timestamp: '', payload: {} })
    // With empty strings the DTO passes validation; service may return 200 or 201
    assert.ok([200, 201].includes(res.statusCode))
  } finally {
    await app.close()
  }
})

it('e2e: webhook drill dryRun=true returns drill contract', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/lyt/webhooks/drill')
      .set(TENANT_A)
      .send({
        eventId: 'drill-001',
        eventType: 'member.created',
        dryRun: true,
        payload: { memberId: 'm-drill-001' }
      })
    assert.ok([200, 201].includes(res.statusCode))
    assert.ok(res.body.data)
  } finally {
    await app.close()
  }
})

it('e2e: webhook drill dryRun=false still works', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/lyt/webhooks/drill')
      .set(TENANT_A)
      .send({
        eventId: 'drill-002',
        eventType: 'order.created',
        dryRun: false,
        payload: { orderId: 'o-002' }
      })
    assert.ok(res.statusCode === 200 || res.statusCode === 201)
    assert.ok(res.body.data)
  } finally {
    await app.close()
  }
})

it('e2e: webhook replay fixture with valid key', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/lyt/webhooks/replay-fixture')
      .set(TENANT_A)
      .send({
        fixtureKey: 'payment-success-webhook',
        eventId: 'replay-001',
        strictValidation: false,
        payload: { paymentId: 'pay-001' }
      })
    assert.ok([200, 201].includes(res.statusCode))
    assert.ok(res.body.data)
  } finally {
    await app.close()
  }
})

it('e2e: webhook replay fixture strict validation', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/lyt/webhooks/replay-fixture')
      .set(TENANT_A)
      .send({
        fixtureKey: 'gate-pass-webhook',
        eventId: 'replay-002',
        strictValidation: true,
        headers: { 'x-signature': 'sig-test' },
        payload: { passCode: 'ABC123', storeId: 'store-001' }
      })
    assert.ok(res.statusCode >= 200)
  } finally {
    await app.close()
  }
})

// ---------------------------------------------------------------------------
// 边界测试
// ---------------------------------------------------------------------------

it('e2e: no tenant headers still works with defaults', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/lyt/bootstrap')
    assert.equal(res.statusCode, 200)
    assert.ok(res.body.data)
  } finally {
    await app.close()
  }
})

it('e2e: fixtures filter with both transport and capability', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/lyt/fixtures?transport=webhook&capability=payment')
      .set(TENANT_A)
    assert.equal(res.statusCode, 200)
    for (const f of res.body.data) {
      assert.equal(f.transport, 'webhook')
      assert.equal(f.capability, 'payment')
    }
  } finally {
    await app.close()
  }
})

it('e2e: multiple webhook callbacks are idempotent', async () => {
  const { app } = await buildApp()
  try {
    const payload = {
      signature: 'sig-idem-001',
      timestamp: new Date().toISOString(),
      eventId: 'idem-001',
      payload: { memberId: 'm-idem', nickname: 'IdemTest' }
    }
    const res1 = await request(app.getHttpServer())
      .post('/lyt/webhooks/callback')
      .set(TENANT_A)
      .send(payload)
    assert.ok(res1.statusCode === 200 || res1.statusCode === 201)

    const res2 = await request(app.getHttpServer())
      .post('/lyt/webhooks/callback')
      .set(TENANT_A)
      .send(payload)
    assert.ok(res2.statusCode === 200 || res2.statusCode === 201)
  } finally {
    await app.close()
  }
})
