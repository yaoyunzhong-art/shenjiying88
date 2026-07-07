import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Canary 灰度发布 HTTP 链路
 *
 * 链路:
 *   HTTP → TestCanaryController → CanaryService
 *
 * 验证:
 *   - 实验 CRUD (create / list / get)
 *   - 状态机 (activate / pause / promote / rollback)
 *   - 灰度评估 (percentage / tenant / store / tag 策略)
 *   - 健康监控 (recordHealth / getHealth / checkAutoPromote)
 *   - 审计日志 (auditLogs)
 *   - 异常输入 (未知 ID / 无效状态转换 / 超范围百分比)
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
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { CanaryService } from './canary.service'

@Controller('canary')
class TestCanaryController {
  constructor(
    @Inject(CanaryService) private readonly service: CanaryService
  ) {}

  @Get('list')
  list() {
    const items = this.service.listExperiments()
    return { items, total: items.length }
  }

  @Get(':id')
  get(@Param('id') id: string) {
    const e = this.service.getExperiment(id)
    if (!e) throw new Error(`Experiment ${id} not found`)
    return e
  }

  @Post('create')
  create(@Body() body: Record<string, unknown>) {
    return this.service.createExperiment(body as any)
  }

  @Post(':id/activate')
  activate(@Param('id') id: string, @Body() body: { operator: string }) {
    const e = this.service.activate(id, body.operator)
    if (!e) throw new Error(`Experiment ${id} not found`)
    return e
  }

  @Post(':id/pause')
  pause(@Param('id') id: string, @Body() body: { operator: string; reason?: string }) {
    const e = this.service.pause(id, body.operator, body.reason)
    if (!e) throw new Error(`Experiment ${id} not found`)
    return e
  }

  @Post(':id/promote')
  promote(@Param('id') id: string, @Body() body: { percentage: number; operator: string }) {
    const e = this.service.promote(id, body.percentage, body.operator)
    if (!e) throw new Error(`Experiment ${id} not found`)
    return e
  }

  @Post(':id/rollback')
  rollback(@Param('id') id: string, @Body() body: { operator: string; reason: string }) {
    const e = this.service.rollback(id, body.operator, body.reason)
    if (!e) throw new Error(`Experiment ${id} not found`)
    return e
  }

  @Post('evaluate')
  evaluate(@Body() body: { flagKey: string; tenantId: string; storeId?: string; tags?: string[] }) {
    return this.service.evaluate(body)
  }

  @Post(':id/health')
  recordHealth(@Param('id') id: string, @Body() body: { errorRate: number; latencyP95: number; latencyAvg: number; totalRequests: number }) {
    const snap = this.service.recordHealth({ experimentId: id, ...body })
    return snap
  }

  @Get(':id/health')
  getHealth(@Param('id') id: string) {
    return {
      latest: this.service.getLatestHealth(id),
      history: this.service.listHealth(id),
    }
  }

  @Get(':id/check-promote')
  checkPromote(@Param('id') id: string) {
    return this.service.checkAutoPromote(id)
  }

  @Get(':id/audit')
  auditLogs(@Param('id') id: string) {
    return { items: this.service.listAuditLogs(id), total: this.service.listAuditLogs(id).length }
  }
}

async function buildApp() {
  const canaryService = new CanaryService()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestCanaryController],
    providers: [
      { provide: CanaryService, useValue: canaryService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, canaryService }
}

// ==================== 1. 实验 CRUD ====================

it('e2e: create experiment returns entity with id', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/canary/create')
      .send({
        name: '新功能 V3 灰度',
        description: '测试新结算流程',
        flagKey: 'checkout.v3',
        strategy: 'percentage',
        strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 5,
        targetPercentage: 100,
        createdBy: 'admin-001',
      })
    assert.equal(res.statusCode, 201)
    const exp = res.body.data
    assert.ok(exp.id)
    assert.equal(exp.name, '新功能 V3 灰度')
    assert.equal(exp.flagKey, 'checkout.v3')
    assert.equal(exp.status, 'draft')
    assert.equal(exp.currentPercentage, 0)
    assert.equal(exp.initialPercentage, 5)
    assert.equal(exp.createdBy, 'admin-001')
    assert.ok(exp.createdAt)
  } finally {
    await app.close()
  }
})

it('e2e: list experiments returns seed experiments', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/canary/list')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.total, 2)
    assert.ok(Array.isArray(res.body.data.items))
    assert.equal(res.body.data.items.length, 2)

    const names = res.body.data.items.map((e: any) => e.name)
    assert.ok(names.includes('AI 模型 V2 灰度'))
    assert.ok(names.includes('新结算流程'))
  } finally {
    await app.close()
  }
})

it('e2e: get experiment by id', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/canary/exp-seed-ai-v2')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.id, 'exp-seed-ai-v2')
    assert.equal(res.body.data.name, 'AI 模型 V2 灰度')
    assert.equal(res.body.data.status, 'active')
    assert.equal(res.body.data.currentPercentage, 25)
  } finally {
    await app.close()
  }
})

it('e2e: get experiment by non-existent id returns 500', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/canary/exp-does-not-exist')
    assert.equal(res.statusCode, 500)
  } finally {
    await app.close()
  }
})

// ==================== 2. 状态机 ====================

it('e2e: activate a draft experiment', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/canary/create')
      .send({
        name: '可激活实验',
        description: 'test',
        flagKey: 'test.activate',
        strategy: 'percentage',
        strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 10,
        targetPercentage: 100,
        createdBy: 'admin',
      })
    const id = createRes.body.data.id

    const res = await request(app.getHttpServer())
      .post(`/canary/${id}/activate`)
      .send({ operator: 'ops-user' })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.status, 'active')
    assert.equal(res.body.data.currentPercentage, 10)
  } finally {
    await app.close()
  }
})

it('e2e: pause an active experiment', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/canary/exp-seed-ai-v2/pause')
      .send({ operator: 'ops-user', reason: '线上问题排查' })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.status, 'paused')
  } finally {
    await app.close()
  }
})

it('e2e: promote an active experiment', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/canary/create')
      .send({
        name: '可晋级实验',
        description: 'test',
        flagKey: 'test.promote',
        strategy: 'percentage',
        strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 10,
        targetPercentage: 100,
        createdBy: 'admin',
      })
    const id = createRes.body.data.id
    await request(app.getHttpServer())
      .post(`/canary/${id}/activate`)
      .send({ operator: 'ops' })

    const res = await request(app.getHttpServer())
      .post(`/canary/${id}/promote`)
      .send({ percentage: 50, operator: 'ops' })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.status, 'active')
    assert.equal(res.body.data.currentPercentage, 50)
  } finally {
    await app.close()
  }
})

it('e2e: promote to target percentage completes experiment', async () => {
  const { app } = await buildApp()
  try {
    // exp-seed-ai-v2: current=25 target=100
    const res = await request(app.getHttpServer())
      .post('/canary/exp-seed-ai-v2/promote')
      .send({ percentage: 100, operator: 'ops' })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.status, 'completed')
    assert.equal(res.body.data.currentPercentage, 100)
    assert.ok(res.body.data.endedAt)
  } finally {
    await app.close()
  }
})

it('e2e: rollback an active experiment', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/canary/create')
      .send({
        name: '回滚实验',
        description: 'test',
        flagKey: 'test.rollback',
        strategy: 'percentage',
        strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 20,
        targetPercentage: 80,
        createdBy: 'admin',
      })
    const id = createRes.body.data.id
    await request(app.getHttpServer())
      .post(`/canary/${id}/activate`)
      .send({ operator: 'ops' })

    const res = await request(app.getHttpServer())
      .post(`/canary/${id}/rollback`)
      .send({ operator: 'ops', reason: '错误率过高' })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.status, 'rolled_back')
    assert.equal(res.body.data.currentPercentage, 0)
  } finally {
    await app.close()
  }
})

it('e2e: invalid state transition (draft cannot be paused) → 400', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/canary/create')
      .send({
        name: '新草稿实验',
        description: 'test',
        flagKey: 'test.state',
        strategy: 'percentage',
        strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 5,
        targetPercentage: 50,
        createdBy: 'admin',
      })
    const id = createRes.body.data.id

    const res = await request(app.getHttpServer())
      .post(`/canary/${id}/pause`)
      .send({ operator: 'ops' })
    assert.equal(res.statusCode, 400)
  } finally {
    await app.close()
  }
})

// ==================== 3. 灰度评估 ====================

it('e2e: evaluate matches store strategy', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/canary/evaluate')
      .send({
        flagKey: 'checkout.new_flow',
        tenantId: 'tenant-A',
        storeId: 'store-001',
      })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.enabled, true)
    assert.equal(res.body.data.matchedStrategy, 'store')
    assert.equal(res.body.data.experimentId, 'exp-seed-checkout')
  } finally {
    await app.close()
  }
})

it('e2e: evaluate returns disabled when no matching experiment', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/canary/evaluate')
      .send({
        flagKey: 'nonexistent.flag',
        tenantId: 'tenant-A',
      })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.enabled, false)
    assert.equal(res.body.data.matchedStrategy, null)
    assert.equal(res.body.data.reason, 'No matching experiment')
  } finally {
    await app.close()
  }
})

it('e2e: evaluate percentage strategy returns enabled', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/canary/evaluate')
      .send({
        flagKey: 'ai.model.v2_enabled',
        tenantId: 'tenant-A',
      })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.enabled, true)
    assert.equal(res.body.data.matchedStrategy, 'percentage')
    assert.equal(res.body.data.experimentId, 'exp-seed-ai-v2')
    assert.equal(res.body.data.percentage, 25)
  } finally {
    await app.close()
  }
})

it('e2e: evaluate with store that is not in store strategy', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/canary/evaluate')
      .send({
        flagKey: 'checkout.new_flow',
        tenantId: 'tenant-A',
        storeId: 'store-999',
      })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.enabled, false)
    assert.equal(res.body.data.reason, 'No matching experiment')
  } finally {
    await app.close()
  }
})

// ==================== 4. 健康监控 ====================

it('e2e: record health snapshot and retrieve', async () => {
  const { app } = await buildApp()
  try {
    const recordRes = await request(app.getHttpServer())
      .post('/canary/exp-seed-ai-v2/health')
      .send({
        errorRate: 0.005,
        latencyP95: 200,
        latencyAvg: 120,
        totalRequests: 1500,
      })
    assert.equal(recordRes.statusCode, 201)
    assert.ok(recordRes.body.data.timestamp)
    assert.equal(recordRes.body.data.isHealthy, true)
    assert.equal(recordRes.body.data.experimentId, 'exp-seed-ai-v2')

    const getRes = await request(app.getHttpServer())
      .get('/canary/exp-seed-ai-v2/health')
    assert.equal(getRes.statusCode, 200)
    assert.ok(getRes.body.data.latest)
    assert.equal(getRes.body.data.latest.isHealthy, true)
    assert.ok(Array.isArray(getRes.body.data.history))
  } finally {
    await app.close()
  }
})

it('e2e: record unhealthy health snapshot', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/canary/exp-seed-ai-v2/health')
      .send({
        errorRate: 0.05,
        latencyP95: 2000,
        latencyAvg: 500,
        totalRequests: 300,
      })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.isHealthy, false)
    assert.equal(res.body.data.errorRate, 0.05)
  } finally {
    await app.close()
  }
})

it('e2e: get health for experiment with no snapshots', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/canary/create')
      .send({
        name: '无健康监控',
        description: 'no health data',
        flagKey: 'test.no-health',
        strategy: 'percentage',
        strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 10,
        targetPercentage: 100,
        createdBy: 'admin',
      })
    const id = createRes.body.data.id

    const res = await request(app.getHttpServer())
      .get(`/canary/${id}/health`)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.latest, null)
    assert.equal(res.body.data.history.length, 0)
  } finally {
    await app.close()
  }
})

// ==================== 5. 自动晋级检查 ====================

it('e2e: check auto promote returns should promote for healthy experiment', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer())
      .post('/canary/exp-seed-ai-v2/health')
      .send({
        errorRate: 0.001,
        latencyP95: 150,
        latencyAvg: 80,
        totalRequests: 2000,
      })

    const res = await request(app.getHttpServer())
      .get('/canary/exp-seed-ai-v2/check-promote')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.shouldPromote, true)
    assert.ok(res.body.data.nextPercentage)
    assert.equal(res.body.data.nextPercentage, 50)
  } finally {
    await app.close()
  }
})

it('e2e: check auto promote returns false when no health data', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/canary/create')
      .send({
        name: '自动晋级实验',
        description: 'test',
        flagKey: 'test.auto-promote',
        strategy: 'percentage',
        strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 10,
        targetPercentage: 100,
        autoPromote: {
          checkIntervalMin: 30,
          healthMetrics: ['error_rate', 'latency_p95'],
          promoteSteps: [10, 25, 50, 100],
          healthThreshold: 0.01,
          maxPromotions: 3,
        },
        createdBy: 'admin',
      })
    const id = createRes.body.data.id
    await request(app.getHttpServer())
      .post(`/canary/${id}/activate`)
      .send({ operator: 'ops' })

    const res = await request(app.getHttpServer())
      .get(`/canary/${id}/check-promote`)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.shouldPromote, false)
    assert.equal(res.body.data.reason, 'No health data')
  } finally {
    await app.close()
  }
})

// ==================== 6. 审计日志 ====================

it('e2e: audit logs are recorded on actions', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/canary/create')
      .send({
        name: '审计实验',
        description: 'audit test',
        flagKey: 'test.audit',
        strategy: 'percentage',
        strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 5,
        targetPercentage: 50,
        createdBy: 'admin-audit',
      })
    const id = createRes.body.data.id

    await request(app.getHttpServer())
      .post(`/canary/${id}/activate`)
      .send({ operator: 'ops-audit' })

    const auditRes = await request(app.getHttpServer())
      .get(`/canary/${id}/audit`)
    assert.equal(auditRes.statusCode, 200)
    assert.equal(auditRes.body.data.total, 2) // create + activate
    assert.equal(auditRes.body.data.items.length, 2)
    const actions = auditRes.body.data.items.map((a: any) => a.action)
    assert.ok(actions.includes('create'))
    assert.ok(actions.includes('activate'))
  } finally {
    await app.close()
  }
})

it('e2e: audit logs empty for non-existent experiment', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/canary/exp-non-existent/audit')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.items.length, 0)
    assert.equal(res.body.data.total, 0)
  } finally {
    await app.close()
  }
})

// ==================== 7. 边界与异常 ====================

it('e2e: promote with percentage below current → 400', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/canary/exp-seed-ai-v2/promote')
      .send({ percentage: 10, operator: 'ops' })
    assert.equal(res.statusCode, 400)
  } finally {
    await app.close()
  }
})

it('e2e: promote with percentage above target → 400', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/canary/exp-seed-ai-v2/promote')
      .send({ percentage: 150, operator: 'ops' })
    assert.equal(res.statusCode, 400)
  } finally {
    await app.close()
  }
})

it('e2e: activate already active experiment → 400', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/canary/exp-seed-ai-v2/activate')
      .send({ operator: 'ops' })
    assert.equal(res.statusCode, 400)
  } finally {
    await app.close()
  }
})

it('e2e: rollback draft experiment succeeds (service allows any status)', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/canary/create')
      .send({
        name: '草稿回滚测试',
        description: 'test',
        flagKey: 'test.draft-rollback',
        strategy: 'percentage',
        strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 5,
        targetPercentage: 100,
        createdBy: 'admin',
      })
    const id = createRes.body.data.id

    const res = await request(app.getHttpServer())
      .post(`/canary/${id}/rollback`)
      .send({ operator: 'ops', reason: '测试回滚草稿' })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.status, 'rolled_back')
    assert.equal(res.body.data.currentPercentage, 0)
    assert.ok(res.body.data.endedAt)
  } finally {
    await app.close()
  }
})

it('e2e: evaluate with empty flag key returns disabled', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/canary/evaluate')
      .send({
        flagKey: '',
        tenantId: 'tenant-A',
      })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.enabled, false)
  } finally {
    await app.close()
  }
})
