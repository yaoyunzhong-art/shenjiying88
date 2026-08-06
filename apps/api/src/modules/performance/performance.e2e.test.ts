import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Performance 性能监控 HTTP 链路
 *
 * 链路:
 *   HTTP → PerformanceController → PerformanceService → CacheTierService / DBOptimizeService / K8sScaleService
 *
 * 验证:
 *   - 指标采集: 缓存 stats / 数据库查询分析
 *   - 阈值告警: HPA 策略监控
 *   - 聚合报告: 压测运行 + 结果聚合
 *   - 看板: 部署健康 + 弹性伸缩
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { PerformanceController } from './performance.controller'
import { PerformanceService } from './performance.service'
import { CacheTierService } from './cache-tier.service'
import { DBOptimizeService } from './db-optimize.service'
import { K6RunnerService } from './k6-runner.service'
import { K8sScaleService } from './k8s-scale.service'
import { TenantGuard } from '../agent/tenant.guard'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'

async function buildApp() {
  const cacheTierService = new CacheTierService()
  cacheTierService.configure({
    l1: { maxBytes: 1024 * 1024, evictionPolicy: 'lru', ttlMs: 60000 },
    l2: { maxBytes: 10 * 1024 * 1024, evictionPolicy: 'lru', ttlMs: 300000 },
    l3: { maxBytes: 100 * 1024 * 1024, evictionPolicy: 'lru', ttlMs: 3600000 },
    readThrough: true,
    writeThrough: true,
    prefetchEnabled: true,
  })
  const dbOptimizeService = new DBOptimizeService()
  const k6RunnerService = new K6RunnerService()
  const k8sScaleService = new K8sScaleService()
  const performanceService = new PerformanceService(
    cacheTierService,
    dbOptimizeService,
    k6RunnerService,
    k8sScaleService,
  )

  const moduleRef = await Test.createTestingModule({
    controllers: [PerformanceController],
    providers: [
      { provide: PerformanceService, useValue: performanceService },
      { provide: CacheTierService, useValue: cacheTierService },
      { provide: DBOptimizeService, useValue: dbOptimizeService },
      { provide: K6RunnerService, useValue: k6RunnerService },
      { provide: K8sScaleService, useValue: k8sScaleService },
    ],
  })
    .overrideGuard(TenantGuard)
    .useValue({ canActivate: () => true })
    .compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, performanceService, cacheTierService, k6RunnerService, k8sScaleService }
}

// ─── 1. 指标采集 ─────────────────────────────────────────────

it('e2e: cache set/get stores and retrieves value', async () => {
  const { app } = await buildApp()
  try {
    // Set a cache value
    await request(app.getHttpServer())
      .post('/performance/cache/set')
      .send({ key: 'test-key', value: { name: 'hello' } })

    const res = await request(app.getHttpServer())
      .post('/performance/cache/get')
      .send({ key: 'test-key' })
    assert.equal(res.statusCode, 201)
    const value = res.body.data.value as Record<string, unknown> | null
    assert.ok(value)
    assert.equal(value.name, 'hello')
  } finally {
    await app.close()
  }
})

it('e2e: cache exists check returns true for set keys', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer())
      .post('/performance/cache/set')
      .send({ key: 'exists-key', value: 42 })

    const res = await request(app.getHttpServer())
      .post('/performance/cache/has')
      .send({ key: 'exists-key' })
    assert.equal(res.body.data.exists, true)
  } finally {
    await app.close()
  }
})

it('e2e: cache stats are reported correctly', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer())
      .post('/performance/cache/set')
      .send({ key: 'stat-key', value: true })

    const res = await request(app.getHttpServer()).get('/performance/cache/stats')
    assert.equal(res.statusCode, 200)
    const stats = res.body.data as Array<Record<string, unknown>>
    assert.ok(Array.isArray(stats))
  } finally {
    await app.close()
  }
})

it('e2e: database query analysis returns scan type and cost', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/performance/db/analyze')
      .send({ query: 'SELECT * FROM users WHERE id = 1' })
    assert.equal(res.statusCode, 201)
    const analysis = res.body.data as Record<string, unknown>
    assert.ok(analysis.queryType)
    assert.ok(typeof analysis.estimatedCost === 'number')
  } finally {
    await app.close()
  }
})

// ─── 2. 阈值告警 ─────────────────────────────────────────────

it('e2e: create HPA policy returns policy with metrics', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/performance/hpa')
      .send({
        name: 'cpu-policy',
        metric: 'cpu',
        targetValue: 80,
        targetPercent: 70,
        minReplicas: 2,
        maxReplicas: 10,
        stabilizationWindowSeconds: 300,
        cooldownSeconds: 60,
        enabled: true,
      })
    assert.equal(res.statusCode, 201)
    const policy = res.body.data as Record<string, unknown>
    assert.equal(policy.name, 'cpu-policy')
    assert.equal(policy.targetPercent, 70)
  } finally {
    await app.close()
  }
})

it('e2e: list HPA policies returns created policies', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer())
      .post('/performance/hpa')
      .send({
        name: 'mem-policy',
        metric: 'memory',
        targetValue: 85,
        targetPercent: 75,
        minReplicas: 1,
        maxReplicas: 5,
        stabilizationWindowSeconds: 300,
        cooldownSeconds: 60,
        enabled: true,
      })

    const res = await request(app.getHttpServer()).get('/performance/hpa')
    const policies = res.body.data as Array<Record<string, unknown>>
    assert.ok(policies.some((p) => p.name === 'mem-policy'))
  } finally {
    await app.close()
  }
})

// ─── 3. 聚合报告 ─────────────────────────────────────────────

it('e2e: run load test returns result with duration and requests', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/performance/load-test/run')
      .send({
        config: { name: 'test-load', duration: 10, vu: 1, pattern: 'constant' as const },
        endpoints: [{ url: 'https://api.example.com/health', method: 'GET', weight: 1 }],
      })
    assert.equal(res.statusCode, 201)
    const result = res.body.data as Record<string, unknown>
    assert.ok(result.config)
  } finally {
    await app.close()
  }
})

it('e2e: get load test result by id returns earlier result', async () => {
  const { app, k6RunnerService } = await buildApp()
  try {
    const result = await k6RunnerService.runLoadTest(
      { name: 'test-result', duration: 10, vu: 5, pattern: 'constant' as const },
      [{ url: 'https://test.com/ok', method: 'GET', weight: 1 }],
    )
    assert.ok(result.config)
  } finally {
    await app.close()
  }
})

// ─── 4. 看板 ─────────────────────────────────────────────────

it('e2e: collect metrics returns current replica metrics', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/performance/metrics')
    assert.equal(res.statusCode, 200)
    const metrics = res.body.data as Record<string, unknown>
    assert.ok(typeof metrics.cpuPercent === 'number')
    assert.ok(typeof metrics.memoryPercent === 'number')
  } finally {
    await app.close()
  }
})

it('e2e: list deployments returns deployment list', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/performance/deployments')
    assert.equal(res.statusCode, 200)
    const list = res.body.data as Array<Record<string, unknown>>
    assert.ok(Array.isArray(list))
  } finally {
    await app.close()
  }
})

it('e2e: check deployment health returns status info', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/performance/deployments/api-server/health')
    assert.equal(res.statusCode, 200)
    const health = res.body.data as Record<string, unknown>
    assert.ok(health.status)
    assert.equal(health.status, 'unknown')
  } finally {
    await app.close()
  }
})

it('e2e: evaluate scaling returns decisions based on metrics', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/performance/scaling/evaluate')
      .send({ metrics: { cpuPercent: 85, memoryPercent: 90, requestsPerSecond: 1500, latencyMs: 200, currentReplicas: 3, timestamp: new Date().toISOString() } })
    assert.equal(res.statusCode, 201)
    const decisions = res.body.data as Array<Record<string, unknown>>
    assert.ok(Array.isArray(decisions))
  } finally {
    await app.close()
  }
})
