import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: AI Rule Engine 评估 HTTP 链路
 *
 * 链路:
 *   HTTP → TestController → AiRuleEngineService
 *
 * 验证:
 *   - 成员等级评估 (VIP / SVIP / REGULAR)
 *   - 设备异常检测 (CPU / MEMORY / DISK / NETWORK / ERROR)
 *   - 批量评估 (混合 member + device)
 *   - 引擎状态查询
 *   - 路由分发 (POST /evaluate)
 *   - 异常输入 (未知 type / 缺少字段)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body,
  Controller,
  Get,
  Inject,
  Post
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { AiRuleEngineService } from './ai-rule-engine.service'

@Controller('ai-rule-engine')
class TestAiRuleEngineController {
  constructor(
    @Inject(AiRuleEngineService) private readonly aiRuleEngineService: AiRuleEngineService
  ) {}

  @Post('evaluate')
  evaluate(@Body() body: Record<string, unknown>) {
    const { type, data } = body as { type: string; data: Record<string, unknown> }
    if (type === 'member-level') {
      return {
        type: 'member-level',
        result: this.aiRuleEngineService.evaluateMemberLevel(data as any),
        timestamp: new Date().toISOString()
      }
    }
    if (type === 'device-anomaly') {
      return {
        type: 'device-anomaly',
        result: this.aiRuleEngineService.detectDeviceAnomaly(data as any),
        timestamp: new Date().toISOString()
      }
    }
    throw new Error(`Unsupported evaluation type: ${type}`)
  }

  @Post('evaluate/member-level')
  evaluateMemberLevel(@Body() input: Record<string, unknown>) {
    const result = this.aiRuleEngineService.evaluateMemberLevel(input as any)
    return { type: 'member-level', result, timestamp: new Date().toISOString() }
  }

  @Post('evaluate/device-anomaly')
  detectDeviceAnomaly(@Body() input: Record<string, unknown>) {
    const result = this.aiRuleEngineService.detectDeviceAnomaly(input as any)
    return { type: 'device-anomaly', result, timestamp: new Date().toISOString() }
  }

  @Post('evaluate/batch')
  evaluateBatch(@Body() request: Record<string, unknown>) {
    return this.aiRuleEngineService.batchEvaluate(request as any)
  }

  @Get('engines')
  getEngines() {
    return this.aiRuleEngineService.getEngineStatus()
  }
}

async function buildApp() {
  const aiRuleEngineService = new AiRuleEngineService()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestAiRuleEngineController],
    providers: [
      { provide: AiRuleEngineService, useValue: aiRuleEngineService }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, aiRuleEngineService }
}

it('e2e: member level → SVIP when high spend + points + visits', async () => {
  const { app } = await buildApp()

  try {
    const res = await request(app.getHttpServer())
      .post('/ai-rule-engine/evaluate/member-level')
      .send({
        memberId: 'm-svip-1',
        totalPoints: 8000,
        totalSpend: 15000,
        visitCount: 30,
        tenantId: 'tenant-A'
      })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.type, 'member-level')
    const result = res.body.data.result
    assert.equal(result.memberId, 'm-svip-1')
    assert.equal(result.suggestedLevel, 'SVIP')
    assert.ok(result.triggeredRules.length >= 3)
    assert.ok(result.confidence >= 0.8)
  } finally {
    await app.close()
  }
})

it('e2e: member level → SVIP with all 3 conditions matched (ALL strategy)', async () => {
  const { app } = await buildApp()

  try {
    const res = await request(app.getHttpServer())
      .post('/ai-rule-engine/evaluate/member-level')
      .send({
        memberId: 'm-vip-1',
        totalPoints: 6000,
        totalSpend: 12000,
        visitCount: 25,
        tenantId: 'tenant-A'
      })
    assert.equal(res.statusCode, 201)
    const result = res.body.data.result
    assert.equal(result.suggestedLevel, 'SVIP')
    assert.equal(result.triggeredRules.length, 3)
    assert.ok(result.confidence >= 0.8)
    assert.equal(result.currentLevel, 'SVIP')
  } finally {
    await app.close()
  }
})

it('e2e: member level → REGULAR when partial match (ALL strategy fails)', async () => {
  const { app } = await buildApp()

  try {
    const res = await request(app.getHttpServer())
      .post('/ai-rule-engine/evaluate/member-level')
      .send({
        memberId: 'm-partial-1',
        totalPoints: 6000,
        totalSpend: 3000,
        visitCount: 25,
        tenantId: 'tenant-A'
      })
    assert.equal(res.statusCode, 201)
    const result = res.body.data.result
    assert.equal(result.suggestedLevel, 'REGULAR')
    assert.equal(result.triggeredRules.length, 0)
    assert.equal(result.confidence, 0.3)
  } finally {
    await app.close()
  }
})

it('e2e: member level → REGULAR when no conditions match', async () => {
  const { app } = await buildApp()

  try {
    const res = await request(app.getHttpServer())
      .post('/ai-rule-engine/evaluate/member-level')
      .send({
        memberId: 'm-reg-1',
        totalPoints: 50,
        totalSpend: 200,
        visitCount: 2,
        tenantId: 'tenant-A'
      })
    assert.equal(res.statusCode, 201)
    const result = res.body.data.result
    assert.equal(result.suggestedLevel, 'REGULAR')
    assert.equal(result.triggeredRules.length, 0)
    assert.equal(result.confidence, 0.3)
  } finally {
    await app.close()
  }
})

it('e2e: device anomaly → CRITICAL with multiple metrics breached', async () => {
  const { app } = await buildApp()

  try {
    const res = await request(app.getHttpServer())
      .post('/ai-rule-engine/evaluate/device-anomaly')
      .send({
        deviceId: 'dev-1',
        storeId: 'store-1',
        metrics: {
          cpuUsage: 95,
          memoryUsage: 90,
          diskUsage: 95,
          networkLatencyMs: 50,
          errorRate: 1,
          uptimeHours: 100
        },
        tenantId: 'tenant-A'
      })
    assert.equal(res.statusCode, 201)
    const result = res.body.data.result
    assert.equal(result.isAnomaly, true)
    assert.equal(result.severity, 'CRITICAL')
    assert.ok(result.triggeredRules.length >= 3)
    assert.ok(result.anomalyType)
    assert.ok(result.recommendations.length >= 1)
  } finally {
    await app.close()
  }
})

it('e2e: device anomaly → LOW with no metrics breached', async () => {
  const { app } = await buildApp()

  try {
    const res = await request(app.getHttpServer())
      .post('/ai-rule-engine/evaluate/device-anomaly')
      .send({
        deviceId: 'dev-2',
        storeId: 'store-1',
        metrics: {
          cpuUsage: 30,
          memoryUsage: 40,
          diskUsage: 50,
          networkLatencyMs: 50,
          errorRate: 0.1,
          uptimeHours: 200
        },
        tenantId: 'tenant-A'
      })
    assert.equal(res.statusCode, 201)
    const result = res.body.data.result
    assert.equal(result.isAnomaly, false)
    assert.equal(result.severity, 'LOW')
    assert.equal(result.triggeredRules.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: device anomaly → CPU_SPIKE detected with type', async () => {
  const { app } = await buildApp()

  try {
    const res = await request(app.getHttpServer())
      .post('/ai-rule-engine/evaluate/device-anomaly')
      .send({
        deviceId: 'dev-3',
        storeId: 'store-1',
        metrics: {
          cpuUsage: 98,
          memoryUsage: 40,
          diskUsage: 50,
          networkLatencyMs: 50,
          errorRate: 0.1,
          uptimeHours: 200
        },
        tenantId: 'tenant-A'
      })
    assert.equal(res.statusCode, 201)
    const result = res.body.data.result
    assert.equal(result.isAnomaly, true)
    assert.equal(result.anomalyType, 'CPU_SPIKE')
  } finally {
    await app.close()
  }
})

it('e2e: dispatch endpoint routes member-level correctly', async () => {
  const { app } = await buildApp()

  try {
    const res = await request(app.getHttpServer())
      .post('/ai-rule-engine/evaluate')
      .send({
        type: 'member-level',
        data: {
          memberId: 'm-dispatch-1',
          totalPoints: 200,
          totalSpend: 100,
          visitCount: 1,
          tenantId: 'tenant-A'
        }
      })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.type, 'member-level')
    assert.ok(res.body.data.result)
    assert.ok(res.body.data.timestamp)
  } finally {
    await app.close()
  }
})

it('e2e: dispatch endpoint routes device-anomaly correctly', async () => {
  const { app } = await buildApp()

  try {
    const res = await request(app.getHttpServer())
      .post('/ai-rule-engine/evaluate')
      .send({
        type: 'device-anomaly',
        data: {
          deviceId: 'dev-dispatch-1',
          storeId: 'store-1',
          metrics: {
            cpuUsage: 50,
            memoryUsage: 50,
            diskUsage: 50,
            networkLatencyMs: 50,
            errorRate: 0.1,
            uptimeHours: 100
          },
          tenantId: 'tenant-A'
        }
      })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.type, 'device-anomaly')
    assert.equal(res.body.data.result.isAnomaly, false)
  } finally {
    await app.close()
  }
})

it('e2e: dispatch endpoint rejects unsupported type', async () => {
  const { app } = await buildApp()

  try {
    const res = await request(app.getHttpServer())
      .post('/ai-rule-engine/evaluate')
      .send({ type: 'unknown-type', data: {} })
    assert.equal(res.statusCode, 500)
  } finally {
    await app.close()
  }
})

it('e2e: batch evaluate mixes member-level + device-anomaly', async () => {
  const { app } = await buildApp()

  try {
    const res = await request(app.getHttpServer())
      .post('/ai-rule-engine/evaluate/batch')
      .send({
        items: [
          {
            type: 'member-level',
            data: {
              memberId: 'm-batch-1',
              totalPoints: 6000,
              totalSpend: 12000,
              visitCount: 25,
              tenantId: 'tenant-A'
            }
          },
          {
            type: 'device-anomaly',
            data: {
              deviceId: 'dev-batch-1',
              storeId: 'store-1',
              metrics: {
                cpuUsage: 95,
                memoryUsage: 95,
                diskUsage: 95,
                networkLatencyMs: 50,
                errorRate: 0.1,
                uptimeHours: 100
              },
              tenantId: 'tenant-A'
            }
          },
          {
            type: 'member-level',
            data: {
              memberId: 'm-batch-2',
              totalPoints: 10,
              totalSpend: 10,
              visitCount: 0,
              tenantId: 'tenant-A'
            }
          }
        ]
      })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.total, 3)
    assert.equal(res.body.data.succeeded, 3)
    assert.equal(res.body.data.failed, 0)
    assert.equal(res.body.data.items.length, 3)
    assert.equal(res.body.data.items[0].inputId, 'm-batch-1')
    assert.equal(res.body.data.items[0].result.suggestedLevel, 'SVIP')
    assert.equal(res.body.data.items[1].inputId, 'dev-batch-1')
    assert.equal(res.body.data.items[1].result.isAnomaly, true)
    assert.equal(res.body.data.items[2].inputId, 'm-batch-2')
    assert.equal(res.body.data.items[2].result.suggestedLevel, 'REGULAR')
    assert.ok(res.body.data.timestamp)
  } finally {
    await app.close()
  }
})

it('e2e: batch evaluate handles empty items list', async () => {
  const { app } = await buildApp()

  try {
    const res = await request(app.getHttpServer())
      .post('/ai-rule-engine/evaluate/batch')
      .send({ items: [] })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.total, 0)
    assert.equal(res.body.data.succeeded, 0)
    assert.equal(res.body.data.failed, 0)
    assert.equal(res.body.data.items.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: get engines returns all rule engines with status', async () => {
  const { app } = await buildApp()

  try {
    const res = await request(app.getHttpServer())
      .get('/ai-rule-engine/engines')
    assert.equal(res.statusCode, 200)
    const engines = res.body.data
    assert.equal(engines.length, 3)
    const memberEngine = engines.find((e: any) => e.engineId === 'member-level-v1')
    assert.ok(memberEngine)
    assert.equal(memberEngine.conditionsCount, 3)
    assert.equal(memberEngine.actionsCount, 3)
    assert.equal(memberEngine.matchStrategy, 'ALL')
    const deviceEngine = engines.find((e: any) => e.engineId === 'device-anomaly-v1')
    assert.ok(deviceEngine)
    assert.equal(deviceEngine.conditionsCount, 5)
    assert.equal(deviceEngine.actionsCount, 2)
    assert.equal(deviceEngine.matchStrategy, 'ANY')
    const riskScoreEngine = engines.find((e: any) => e.engineId === 'risk-score-v1')
    assert.ok(riskScoreEngine)
    assert.equal(riskScoreEngine.conditionsCount, 5)
    assert.equal(riskScoreEngine.actionsCount, 3)
    assert.equal(riskScoreEngine.matchStrategy, 'ANY')
  } finally {
    await app.close()
  }
})

it('e2e: member level → SVIP with exactly boundary values', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/ai-rule-engine/evaluate/member-level')
      .send({
        memberId: 'm-boundary',
        totalPoints: 5000,
        totalSpend: 10000,
        visitCount: 20,
        tenantId: 'tenant-A'
      })
    assert.equal(res.body.data.result.suggestedLevel, 'SVIP')
    assert.equal(res.body.data.result.currentLevel, 'SVIP')
  } finally {
    await app.close()
  }
})

it('e2e: member level → REGULAR when just below threshold', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/ai-rule-engine/evaluate/member-level')
      .send({
        memberId: 'm-below',
        totalPoints: 4999,
        totalSpend: 9999,
        visitCount: 19,
        tenantId: 'tenant-A'
      })
    assert.equal(res.body.data.result.suggestedLevel, 'REGULAR')
  } finally {
    await app.close()
  }
})

it('e2e: device anomaly → MEMORY_LEAK type detected', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/ai-rule-engine/evaluate/device-anomaly')
      .send({
        deviceId: 'dev-mem',
        storeId: 'store-1',
        metrics: {
          cpuUsage: 50,
          memoryUsage: 95,
          diskUsage: 50,
          networkLatencyMs: 50,
          errorRate: 0.1,
          uptimeHours: 200
        },
        tenantId: 'tenant-A'
      })
    assert.equal(res.body.data.result.isAnomaly, true)
    assert.equal(res.body.data.result.anomalyType, 'MEMORY_LEAK')
  } finally {
    await app.close()
  }
})

it('e2e: device anomaly → DISK_FULL type detected', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/ai-rule-engine/evaluate/device-anomaly')
      .send({
        deviceId: 'dev-disk',
        storeId: 'store-1',
        metrics: {
          cpuUsage: 30,
          memoryUsage: 40,
          diskUsage: 95,
          networkLatencyMs: 50,
          errorRate: 0.1,
          uptimeHours: 200
        },
        tenantId: 'tenant-A'
      })
    assert.equal(res.body.data.result.isAnomaly, true)
    assert.equal(res.body.data.result.anomalyType, 'DISK_FULL')
  } finally {
    await app.close()
  }
})

it('e2e: device anomaly → NETWORK_LATENCY type detected', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/ai-rule-engine/evaluate/device-anomaly')
      .send({
        deviceId: 'dev-net',
        storeId: 'store-1',
        metrics: {
          cpuUsage: 30,
          memoryUsage: 40,
          diskUsage: 50,
          networkLatencyMs: 550,
          errorRate: 0.1,
          uptimeHours: 200
        },
        tenantId: 'tenant-A'
      })
    assert.equal(res.body.data.result.isAnomaly, true)
    assert.equal(res.body.data.result.anomalyType, 'NETWORK_LATENCY')
  } finally {
    await app.close()
  }
})

it('e2e: device anomaly → HIGH_ERROR_RATE type detected', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/ai-rule-engine/evaluate/device-anomaly')
      .send({
        deviceId: 'dev-err',
        storeId: 'store-1',
        metrics: {
          cpuUsage: 30,
          memoryUsage: 40,
          diskUsage: 50,
          networkLatencyMs: 50,
          errorRate: 8,
          uptimeHours: 200
        },
        tenantId: 'tenant-A'
      })
    assert.equal(res.body.data.result.isAnomaly, true)
    assert.equal(res.body.data.result.anomalyType, 'HIGH_ERROR_RATE')
  } finally {
    await app.close()
  }
})

it('e2e: device anomaly LOW severity has no anomalyType', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/ai-rule-engine/evaluate/device-anomaly')
      .send({
        deviceId: 'dev-low',
        storeId: 'store-1',
        metrics: {
          cpuUsage: 30,
          memoryUsage: 40,
          diskUsage: 50,
          networkLatencyMs: 50,
          errorRate: 0.1,
          uptimeHours: 200
        },
        tenantId: 'tenant-A'
      })
    assert.equal(res.body.data.result.isAnomaly, false)
    assert.equal(res.body.data.result.severity, 'LOW')
  } finally {
    await app.close()
  }
})

it('e2e: batch evaluate ignores unknown type without counting as success or failure', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/ai-rule-engine/evaluate/batch')
      .send({
        items: [
          {
            type: 'member-level',
            data: {
              memberId: 'm-mix-1',
              totalPoints: 5000,
              totalSpend: 10000,
              visitCount: 20,
              tenantId: 'tenant-A'
            }
          },
          {
            type: 'unknown-type',
            data: { foo: 'bar' }
          }
        ]
      })
    assert.equal(res.body.data.total, 2)
    assert.equal(res.body.data.succeeded, 1)
    assert.equal(res.body.data.failed, 0)
    assert.equal(res.body.data.items.length, 1)
  } finally {
    await app.close()
  }
})

it('e2e: engines endpoint returns deterministic order', async () => {
  const { app } = await buildApp()
  try {
    const r1 = await request(app.getHttpServer()).get('/ai-rule-engine/engines')
    const r2 = await request(app.getHttpServer()).get('/ai-rule-engine/engines')
    assert.deepEqual(r1.body.data, r2.body.data)
  } finally {
    await app.close()
  }
})
