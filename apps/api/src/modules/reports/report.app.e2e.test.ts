// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
// AppModule 使用了 ConfigModule.forRoot，其中 validate 会同步校验运行所需的最小 env 集合。
// import 会被 tsx 静态提升，因此这里仍使用动态 require 加载 AppModule。
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret'
process.env.API_PORT = process.env.API_PORT ?? '3001'
process.env.REDIS_HOST = process.env.REDIS_HOST ?? 'localhost'
process.env.REDIS_PORT = process.env.REDIS_PORT ?? '6379'
process.env.LYT_MODE = process.env.LYT_MODE ?? 'mock'
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test'

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { HttpException, HttpStatus } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { getRepositoryToken } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { CouponV2 } from '../coupon/coupon.entity'
import { CouponRedemptionLog } from '../coupon/coupon-redemption-log.entity'
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter'
import { TrafficGovernanceGuard } from '../../common/guards/traffic-governance.guard'
import { RequestAuditInterceptor } from '../../common/interceptors/request-audit.interceptor'
import { ReportCacheService } from './report-cache.service'
import { ReportController } from './report.controller'
import { ReportExportService } from './report-export.service'
import type { ReportResult, ReportType } from './reports.entity'
import { PrismaService } from '../../prisma/prisma.service'
import { RequestGovernanceService } from '../../common/governance/request-governance.service'
import { GovernanceApprovalService } from '../foundation/governance-approval/governance-approval.service'
import { IdentityAccessGuard } from '../foundation/identity-access/identity-access.guard'
import { MemberApprovalOutcomeRecorder } from '../member/member-approval-recorder'
import { AgentModule } from '../agent/agent.module'

const { AppModule } = require('../../app.module')
const mockPrismaService = {
  $connect: async () => undefined,
  $disconnect: async () => undefined,
  $queryRaw: async () => [],
} as unknown as PrismaService
const mockGovernanceApprovalService = {
  registerApprovalOutcomeHook: () => () => undefined,
} as unknown as GovernanceApprovalService
const mockRequestGovernanceService = {
  evaluateRateLimit: async () => ({
    applied: true,
    scopeKey: 'test',
    allowed: true,
    limit: 100,
    remaining: 99,
    retryAfterSeconds: 0,
    state: {},
  }),
  applyRateLimitHeaders: () => undefined,
  recordRequestFailure: () => undefined,
  recordRequestSuccess: () => undefined,
} as unknown as RequestGovernanceService

// reports HTTP 回归不关注 member 审批回写链，这里短路其模块初始化钩子，
// 避免 AppModule 在测试环境里被无关 provider 阻塞。
MemberApprovalOutcomeRecorder.prototype.onModuleInit = function noopOnModuleInit() {}
AgentModule.prototype.onModuleInit = function noopOnModuleInit() {}
TrafficGovernanceGuard.prototype.canActivate = async function allowTrafficGuard() { return true }
IdentityAccessGuard.prototype.canActivate = function allowIdentityGuard() { return true }
RequestAuditInterceptor.prototype.intercept = function bypassRequestAudit(_context, next) {
  return next.handle()
}
AllExceptionsFilter.prototype.catch = function noopGovernanceCatch(exception, host) {
  if (host.getType() !== 'http') {
    return
  }

  const ctx = host.switchToHttp()
  const response = ctx.getResponse()
  const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
  const message = exception instanceof Error ? exception.message : 'Internal server error'

  response.status(status).json({
    success: false,
    message,
    data: null,
    timestamp: new Date().toISOString(),
  })
}

describe('Reports App HTTP E2E', () => {
  let moduleRef: TestingModule
  let app: any
  const TENANT = 'tenant-http-reports'
  const OTHER_TENANT = 'tenant-http-other'

  const buildRows = (type: ReportType, extra?: unknown) => {
    if (type === 'product-ranking') {
      const topN = typeof extra === 'number' && Number.isFinite(extra) ? extra : 3
      return Array.from({ length: Math.max(topN, 1) }, (_, index) => ({
        productName: `商品-${index + 1}`,
        salesAmount: (index + 1) * 1000,
      }))
    }

    if (type === 'inventory-alert') {
      return [{ sku: 'SKU-1', stock: 3, threshold: 10, severity: 'high' }]
    }

    return [{ period: '2025-06-01', value: 100, count: 1 }]
  }

  const buildReportResult = (
    type: ReportType,
    tenantId: string,
    from = '2025-06-01',
    to = '2025-06-30',
    extra?: unknown,
  ): ReportResult => ({
    type,
    tenantId,
    period: { from, to },
    columns: [
      { field: 'period', alias: '时间', type: 'dimension' },
      { field: 'value', alias: '数值', type: 'metric' },
      { field: 'count', alias: '数量', type: 'metric' },
    ],
    rows: buildRows(type, extra),
    totals: { period: 'total', value: 100, count: 1 },
    generatedAt: new Date().toISOString(),
    cached: false,
  })

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue({} as DataSource)
      .overrideProvider(getRepositoryToken(CouponV2))
      .useValue({} as Repository<CouponV2>)
      .overrideProvider(getRepositoryToken(CouponRedemptionLog))
      .useValue({} as Repository<CouponRedemptionLog>)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(RequestGovernanceService)
      .useValue(mockRequestGovernanceService)
      .overrideProvider(GovernanceApprovalService)
      .useValue(mockGovernanceApprovalService)
      .compile()

    app = moduleRef.createNestApplication()
    await app.init()

    const controller = moduleRef.get(ReportController, { strict: false }) as unknown as {
      cache: ReportCacheService
      exportSvc: ReportExportService
      revenue: { generate: (tenantId: string, from: string, to: string) => Promise<ReportResult> }
      inventoryTurnover: { generate: (tenantId: string, from: string, to: string) => Promise<ReportResult> }
      memberGrowth: { generate: (tenantId: string, from: string, to: string) => Promise<ReportResult> }
      refundRate: { generate: (tenantId: string, from: string, to: string) => Promise<ReportResult> }
      orderConversion: { generate: (tenantId: string, from: string, to: string) => Promise<ReportResult> }
      productRanking: { generate: (tenantId: string, from: string, to: string, topN?: number) => Promise<ReportResult> }
      paymentMix: { generate: (tenantId: string, from: string, to: string) => Promise<ReportResult> }
      hourlyHeatmap: { generate: (tenantId: string, from: string, to: string) => Promise<ReportResult> }
      channelFunnel: { generate: (tenantId: string, from: string, to: string) => Promise<ReportResult> }
      inventoryAlert: { generate: (tenantId: string) => Promise<ReportResult> }
    }

    controller.cache = new ReportCacheService()
    controller.exportSvc = new ReportExportService()
    controller.revenue = {
      generate: async (tenantId, from, to) => buildReportResult('revenue', tenantId, from, to),
    }
    controller.inventoryTurnover = {
      generate: async (tenantId, from, to) => buildReportResult('inventory', tenantId, from, to),
    }
    controller.memberGrowth = {
      generate: async (tenantId, from, to) => buildReportResult('member', tenantId, from, to),
    }
    controller.refundRate = {
      generate: async (tenantId, from, to) => buildReportResult('refund', tenantId, from, to),
    }
    controller.orderConversion = {
      generate: async (tenantId, from, to) => buildReportResult('order', tenantId, from, to),
    }
    controller.productRanking = {
      generate: async (tenantId, from, to, topN) => buildReportResult('product-ranking', tenantId, from, to, topN),
    }
    controller.paymentMix = {
      generate: async (tenantId, from, to) => buildReportResult('payment-mix', tenantId, from, to),
    }
    controller.hourlyHeatmap = {
      generate: async (tenantId, from, to) => buildReportResult('hourly-heatmap', tenantId, from, to),
    }
    controller.channelFunnel = {
      generate: async (tenantId, from, to) => buildReportResult('channel-funnel', tenantId, from, to),
    }
    controller.inventoryAlert = {
      generate: async (tenantId) => buildReportResult('inventory-alert', tenantId),
    }
  })

  afterAll(async () => {
    await app?.close()
  })

  async function waitForTask(taskId: string) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const taskRes = await request(app.getHttpServer())
        .get(`/api/reports/exports/${taskId}`)
        .query({ tenantId: TENANT })

      assert.equal(taskRes.status, 200)
      assert.equal(taskRes.body.success, true)
      if (taskRes.body.data?.status === 'completed') {
        return taskRes.body.data
      }

      await new Promise((resolve) => setTimeout(resolve, 0))
    }

    assert.fail(`export task ${taskId} did not complete in time`)
  }

  async function createExportTask(tenantId: string = TENANT, format: 'csv' | 'json' | 'html' = 'csv') {
    const createRes = await request(app.getHttpServer())
      .post('/api/reports/exports')
      .send({
        tenantId,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'revenue',
        format,
      })

    assert.equal(createRes.status, 202)
    assert.equal(createRes.body.success, true)
    return createRes.body.data.taskId as string
  }

  async function createTypedExportTask(
    type: 'revenue' | 'inventory',
    format: 'csv' | 'json' | 'html',
    tenantId: string = TENANT,
  ) {
    const createRes = await request(app.getHttpServer())
      .post('/api/reports/exports')
      .send({
        tenantId,
        from: '2025-06-01',
        to: '2025-06-30',
        type,
        format,
      })

    assert.equal(createRes.status, 202)
    assert.equal(createRes.body.success, true)
    return createRes.body.data.taskId as string
  }

  async function createDefinition(name: string, tenantId: string = TENANT) {
    const createRes = await request(app.getHttpServer())
      .post('/api/reports/definitions')
      .send({
        tenantId,
        name,
        type: 'revenue',
        ownerId: 'user-http-1',
        dimensions: [{ field: 'date', alias: '日期' }],
        metrics: [{ field: 'amount', fn: 'sum', alias: '总额' }],
      })

    assert.equal(createRes.status, 201)
    assert.equal(createRes.body.success, true)
    return createRes.body.data
  }

  it('GET /api/reports/revenue returns wrapped report payload', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/reports/revenue')
      .query({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
      })

    assert.equal(res.status, 200, JSON.stringify({ status: res.status, body: res.body }))
    assert.equal(res.body.success, true, JSON.stringify(res.body))
    assert.equal(res.body.data.type, 'revenue')
    assert.equal(res.body.data.tenantId, TENANT)
    assert.ok(Array.isArray(res.body.data.rows))
  })

  it('GET remaining built-in report routes return wrapped payloads', async () => {
    const cases = [
      { path: '/api/reports/inventory', type: 'inventory', query: { tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' } },
      { path: '/api/reports/member', type: 'member', query: { tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' } },
      { path: '/api/reports/refund', type: 'refund', query: { tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' } },
      { path: '/api/reports/order', type: 'order', query: { tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' } },
      { path: '/api/reports/product-ranking', type: 'product-ranking', query: { tenantId: TENANT, from: '2025-06-01', to: '2025-06-30', topN: '3' } },
      { path: '/api/reports/payment-mix', type: 'payment-mix', query: { tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' } },
      { path: '/api/reports/hourly-heatmap', type: 'hourly-heatmap', query: { tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' } },
      { path: '/api/reports/channel-funnel', type: 'channel-funnel', query: { tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' } },
      { path: '/api/reports/inventory-alert', type: 'inventory-alert', query: { tenantId: TENANT } },
    ] as const

    for (const entry of cases) {
      const res = await request(app.getHttpServer())
        .get(entry.path)
        .query(entry.query)

      assert.equal(res.status, 200)
      assert.equal(res.body.success, true)
      assert.equal(res.body.data.type, entry.type)
      assert.equal(res.body.data.tenantId, TENANT)
      assert.ok(Array.isArray(res.body.data.rows))
    }
  })

  it('definitions CRUD works through AppModule HTTP routes', async () => {
    const created = await createDefinition('HTTP 日销售报表')

    const listRes = await request(app.getHttpServer())
      .get('/api/reports/definitions')
      .query({ tenantId: TENANT })

    assert.equal(listRes.status, 200)
    assert.equal(listRes.body.success, true)
    assert.ok(listRes.body.data.total >= 1)
    assert.ok(listRes.body.data.items.some((item: { id: string }) => item.id === created.id))

    const getRes = await request(app.getHttpServer())
      .get(`/api/reports/definitions/${created.id}`)
      .query({ tenantId: TENANT })

    assert.equal(getRes.status, 200)
    assert.equal(getRes.body.success, true)
    assert.equal(getRes.body.data.id, created.id)
    assert.equal(getRes.body.data.name, 'HTTP 日销售报表')

    const updateRes = await request(app.getHttpServer())
      .put(`/api/reports/definitions/${created.id}`)
      .query({ tenantId: TENANT, version: String(created.version) })
      .send({
        name: 'HTTP 周销售报表',
        metrics: [{ field: 'amount', fn: 'avg', alias: '平均总额' }],
      })

    assert.equal(updateRes.status, 200)
    assert.equal(updateRes.body.success, true)
    assert.equal(updateRes.body.data.name, 'HTTP 周销售报表')
    assert.equal(updateRes.body.data.version, created.version + 1)
    assert.equal(updateRes.body.data.metrics[0].fn, 'avg')

    const deleteRes = await request(app.getHttpServer())
      .delete(`/api/reports/definitions/${created.id}`)
      .query({ tenantId: TENANT })

    assert.equal(deleteRes.status, 200)
    assert.equal(deleteRes.body.success, true)
    assert.equal(deleteRes.body.data.deleted, true)

    const getAfterDeleteRes = await request(app.getHttpServer())
      .get(`/api/reports/definitions/${created.id}`)
      .query({ tenantId: TENANT })

    assert.equal(getAfterDeleteRes.status, 200)
    assert.equal(getAfterDeleteRes.body.success, true)
    assert.equal(getAfterDeleteRes.body.data, null)
  })

  it('definitions routes enforce tenant isolation and optimistic lock', async () => {
    const created = await createDefinition('HTTP 跨租户隔离定义', TENANT)

    const crossTenantGetRes = await request(app.getHttpServer())
      .get(`/api/reports/definitions/${created.id}`)
      .query({ tenantId: OTHER_TENANT })

    assert.equal(crossTenantGetRes.status, 200)
    assert.equal(crossTenantGetRes.body.success, true)
    assert.equal(crossTenantGetRes.body.data, null)

    const crossTenantDeleteRes = await request(app.getHttpServer())
      .delete(`/api/reports/definitions/${created.id}`)
      .query({ tenantId: OTHER_TENANT })

    assert.equal(crossTenantDeleteRes.status, 200)
    assert.equal(crossTenantDeleteRes.body.success, true)
    assert.equal(crossTenantDeleteRes.body.data.deleted, false)

    const staleVersionRes = await request(app.getHttpServer())
      .put(`/api/reports/definitions/${created.id}`)
      .query({ tenantId: TENANT, version: '999' })
      .send({ name: 'stale-version' })

    assert.equal(staleVersionRes.status, 500)
    assert.match(JSON.stringify(staleVersionRes.body), /version mismatch/)
  })

  it('GET /api/reports/export returns direct JSON payload', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/reports/export')
      .query({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'revenue',
        format: 'json',
      })

    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
    assert.equal(res.body.data.format, 'json')
    assert.match(String(res.body.data.filename), /\.json$/)
    assert.ok(res.body.data.size > 0)
    assert.match(String(res.body.data.content), /"type": "revenue"/)
  })

  it('cache stats and invalidate work through AppModule HTTP routes', async () => {
    await request(app.getHttpServer())
      .get('/api/reports/revenue')
      .query({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
      })

    await request(app.getHttpServer())
      .get('/api/reports/revenue')
      .query({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
      })

    const statsBeforeRes = await request(app.getHttpServer())
      .get('/api/reports/cache/stats')

    assert.equal(statsBeforeRes.status, 200)
    assert.equal(statsBeforeRes.body.success, true)
    assert.ok(typeof statsBeforeRes.body.data.size === 'number')
    assert.ok(typeof statsBeforeRes.body.data.hits === 'number')
    assert.ok(typeof statsBeforeRes.body.data.misses === 'number')

    const invalidateRes = await request(app.getHttpServer())
      .post('/api/reports/cache/invalidate')
      .send({ tenantId: TENANT, type: 'revenue' })

    assert.equal(invalidateRes.status, 201)
    assert.equal(invalidateRes.body.success, true)
    assert.ok(invalidateRes.body.data.invalidated >= 0)

    const statsAfterRes = await request(app.getHttpServer())
      .get('/api/reports/cache/stats')

    assert.equal(statsAfterRes.status, 200)
    assert.equal(statsAfterRes.body.success, true)
    assert.ok(statsAfterRes.body.data.size >= 0)
  })


  it('POST + GET /api/reports/exports completes smoke flow', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/reports/exports')
      .send({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'revenue',
        format: 'csv',
      })

    assert.equal(createRes.status, 202)
    assert.equal(createRes.body.success, true)
    assert.equal(createRes.body.data.tenantId, TENANT)
    assert.equal(createRes.body.data.type, 'revenue')
    assert.equal(createRes.body.data.format, 'csv')
    assert.ok(typeof createRes.body.data.taskId === 'string')

    const listRes = await request(app.getHttpServer())
      .get('/api/reports/exports')
      .query({ tenantId: TENANT })

    assert.equal(listRes.status, 200)
    assert.equal(listRes.body.success, true)
    assert.ok(Array.isArray(listRes.body.data.items))
    assert.ok(listRes.body.data.total >= 1)
    assert.ok(
      listRes.body.data.items.some((item: { taskId: string }) => item.taskId === createRes.body.data.taskId),
    )

    const taskRes = await request(app.getHttpServer())
      .get(`/api/reports/exports/${createRes.body.data.taskId}`)
      .query({ tenantId: TENANT })

    assert.equal(taskRes.status, 200)
    assert.equal(taskRes.body.success, true)
    assert.equal(taskRes.body.data.taskId, createRes.body.data.taskId)
  })

  it('GET download + DELETE /api/reports/exports/:taskId completes governance flow', async () => {
    const taskId = await createExportTask(TENANT, 'csv')
    const completedTask = await waitForTask(taskId)

    const downloadRes = await request(app.getHttpServer())
      .get(`/api/reports/exports/${taskId}/download`)
      .query({ tenantId: TENANT })

    assert.equal(downloadRes.status, 200)
    assert.equal(downloadRes.body.success, true)
    assert.equal(downloadRes.body.data.tenantId, TENANT)
    assert.equal(downloadRes.body.data.format, 'csv')
    assert.equal(downloadRes.body.data.filename, completedTask.filename)
    assert.ok(String(downloadRes.body.data.content).includes(','))

    const deleteRes = await request(app.getHttpServer())
      .delete(`/api/reports/exports/${taskId}`)
      .query({ tenantId: TENANT })

    assert.equal(deleteRes.status, 200)
    assert.equal(deleteRes.body.success, true)
    assert.equal(deleteRes.body.data.deleted, true)

    const taskAfterDeleteRes = await request(app.getHttpServer())
      .get(`/api/reports/exports/${taskId}`)
      .query({ tenantId: TENANT })

    assert.equal(taskAfterDeleteRes.status, 200)
    assert.equal(taskAfterDeleteRes.body.success, true)
    assert.equal(taskAfterDeleteRes.body.data, null)
  })

  it('GET /api/reports/exports supports type/format filters with total and pagination', async () => {
    const revenueCsvTaskId = await createTypedExportTask('revenue', 'csv')
    await new Promise((resolve) => setTimeout(resolve, 5))
    const inventoryJsonTaskId = await createTypedExportTask('inventory', 'json')
    await new Promise((resolve) => setTimeout(resolve, 5))
    const revenueHtmlTaskId = await createTypedExportTask('revenue', 'html')

    await waitForTask(revenueCsvTaskId)
    await waitForTask(inventoryJsonTaskId)
    await waitForTask(revenueHtmlTaskId)

    const filteredRes = await request(app.getHttpServer())
      .get('/api/reports/exports')
      .query({
        tenantId: TENANT,
        type: 'revenue',
        format: 'html',
      })

    assert.equal(filteredRes.status, 200)
    assert.equal(filteredRes.body.success, true)
    assert.equal(filteredRes.body.data.total, 1)
    assert.equal(filteredRes.body.data.offset, 0)
    assert.equal(filteredRes.body.data.limit, 1)
    assert.equal(filteredRes.body.data.items.length, 1)
    assert.equal(filteredRes.body.data.items[0].taskId, revenueHtmlTaskId)
    assert.equal(filteredRes.body.data.items[0].type, 'revenue')
    assert.equal(filteredRes.body.data.items[0].format, 'html')

    const pagedRes = await request(app.getHttpServer())
      .get('/api/reports/exports')
      .query({
        tenantId: TENANT,
        limit: '1',
        offset: '1',
      })

    assert.equal(pagedRes.status, 200)
    assert.equal(pagedRes.body.success, true)
    assert.ok(pagedRes.body.data.total >= 3)
    assert.equal(pagedRes.body.data.offset, 1)
    assert.equal(pagedRes.body.data.limit, 1)
    assert.equal(pagedRes.body.data.items.length, 1)
  })

  it('GET /api/reports/exports supports completed status filter and empty tenant fallback', async () => {
    const completedTaskId = await createTypedExportTask('revenue', 'csv')
    await waitForTask(completedTaskId)

    const statusRes = await request(app.getHttpServer())
      .get('/api/reports/exports')
      .query({
        tenantId: TENANT,
        status: 'completed',
      })

    assert.equal(statusRes.status, 200)
    assert.equal(statusRes.body.success, true)
    assert.ok(statusRes.body.data.total >= 1)
    assert.ok(statusRes.body.data.items.every((item: { status: string }) => item.status === 'completed'))

    const emptyTenantRes = await request(app.getHttpServer())
      .get('/api/reports/exports')

    assert.equal(emptyTenantRes.status, 200)
    assert.equal(emptyTenantRes.body.success, true)
    assert.equal(emptyTenantRes.body.data.total, 0)
    assert.deepEqual(emptyTenantRes.body.data.items, [])
    assert.equal(emptyTenantRes.body.data.offset, 0)
    assert.equal(emptyTenantRes.body.data.limit, 0)
  })


  it('DELETE /api/reports/exports updates list total and removes deleted task from list', async () => {
    const taskId = await createTypedExportTask('inventory', 'json')
    await waitForTask(taskId)

    const beforeDeleteRes = await request(app.getHttpServer())
      .get('/api/reports/exports')
      .query({
        tenantId: TENANT,
        type: 'inventory',
        format: 'json',
      })

    assert.equal(beforeDeleteRes.status, 200)
    assert.equal(beforeDeleteRes.body.success, true)
    assert.ok(beforeDeleteRes.body.data.total >= 1)
    assert.ok(
      beforeDeleteRes.body.data.items.some((item: { taskId: string }) => item.taskId === taskId),
    )

    const deleteRes = await request(app.getHttpServer())
      .delete(`/api/reports/exports/${taskId}`)
      .query({ tenantId: TENANT })

    assert.equal(deleteRes.status, 200)
    assert.equal(deleteRes.body.success, true)
    assert.equal(deleteRes.body.data.deleted, true)

    const afterDeleteRes = await request(app.getHttpServer())
      .get('/api/reports/exports')
      .query({
        tenantId: TENANT,
        type: 'inventory',
        format: 'json',
      })

    assert.equal(afterDeleteRes.status, 200)
    assert.equal(afterDeleteRes.body.success, true)
    assert.ok(
      afterDeleteRes.body.data.items.every((item: { taskId: string }) => item.taskId !== taskId),
    )
    assert.equal(afterDeleteRes.body.data.total, Math.max(beforeDeleteRes.body.data.total - 1, 0))
  })

  it('cross-tenant routes cannot query, download, or delete another tenant export', async () => {
    const taskId = await createExportTask(TENANT, 'csv')
    await waitForTask(taskId)

    const queryRes = await request(app.getHttpServer())
      .get(`/api/reports/exports/${taskId}`)
      .query({ tenantId: OTHER_TENANT })
    assert.equal(queryRes.status, 200)
    assert.equal(queryRes.body.success, true)
    assert.equal(queryRes.body.data, null)

    const downloadRes = await request(app.getHttpServer())
      .get(`/api/reports/exports/${taskId}/download`)
      .query({ tenantId: OTHER_TENANT })
    assert.equal(downloadRes.status, 200)
    assert.equal(downloadRes.body.success, true)
    assert.equal(downloadRes.body.data, null)

    const deleteRes = await request(app.getHttpServer())
      .delete(`/api/reports/exports/${taskId}`)
      .query({ tenantId: OTHER_TENANT })
    assert.equal(deleteRes.status, 200)
    assert.equal(deleteRes.body.success, true)
    assert.equal(deleteRes.body.data.deleted, false)
  })

  it('GET download returns payload once real-result export finishes immediately', async () => {
    const taskId = await createExportTask(TENANT, 'csv')

    const downloadRes = await request(app.getHttpServer())
      .get(`/api/reports/exports/${taskId}/download`)
      .query({ tenantId: TENANT })

    assert.equal(downloadRes.status, 200)
    assert.equal(downloadRes.body.success, true)
    assert.equal(downloadRes.body.data.tenantId, TENANT)
    assert.equal(downloadRes.body.data.format, 'csv')
    assert.match(String(downloadRes.body.data.filename), /\.csv$/)
    assert.ok(String(downloadRes.body.data.content).includes(','))
  })

  it('POST /api/reports/exports rejects missing tenantId in AppModule route', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/reports/exports')
      .send({
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'revenue',
        format: 'csv',
      })

    assert.equal(res.status, 400)
    assert.match(String(res.body.message ?? ''), /tenantId is required/)
  })

  it('POST /api/reports/exports rejects unsupported format in AppModule route', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/reports/exports')
      .send({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'revenue',
        format: 'xlsx',
      })

    assert.equal(res.status, 400)
    assert.match(String(res.body.message ?? ''), /Unsupported batch export format: xlsx/)
  })
})
