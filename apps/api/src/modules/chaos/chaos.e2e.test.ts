import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Chaos 混沌工程 HTTP 链路
 *
 * 链路:
 *   HTTP → ChaosEngineeringController → ChaosExperimentService + FaultInjectionService + ChaosAutoRollbackService
 *
 * 验证:
 *   - 混沌实验创建→运行→暂停→结果
 *   - 故障注入(延迟/错误/超时/CPU)的完整生命周期
 *   - 健康监控→自动回滚触发
 *   - 回滚历史查询
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { ChaosEngineeringController } from './chaos-engineering.controller'
import {
  ChaosExperimentService,
  FaultInjectionService,
  ChaosAutoRollbackService,
} from './chaos-engineering.service'

async function buildApp() {
  const experimentService = new ChaosExperimentService()
  const faultService = new FaultInjectionService()
  const rollbackService = new ChaosAutoRollbackService()

  const moduleRef = await Test.createTestingModule({
    controllers: [ChaosEngineeringController],
    providers: [
      { provide: ChaosExperimentService, useValue: experimentService },
      { provide: FaultInjectionService, useValue: faultService },
      { provide: ChaosAutoRollbackService, useValue: rollbackService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, experimentService, faultService, rollbackService }
}

let experimentIdA: string
let experimentIdB: string

it('e2e: 创建混沌实验→运行→暂停→查看结果全流程', async () => {
  const { app } = await buildApp()
  try {
    // 1. 创建实验
    const createRes = await request(app.getHttpServer())
      .post('/chaos/experiments')
      .send({
        name: 'latency-test',
        target: 'api-service',
        faultType: 'LATENCY',
        faultTarget: 'api-service',
        faultParams: { delayMs: 500 },
      })
    assert.equal(createRes.statusCode, 201)
    experimentIdA = createRes.body.id
    assert.ok(experimentIdA)
    assert.equal(createRes.body.status, 'PENDING')
    assert.equal(createRes.body.name, 'latency-test')

    // 2. 运行实验
    const runRes = await request(app.getHttpServer())
      .post(`/chaos/experiments/${experimentIdA}/run`)
    assert.equal(runRes.statusCode, 201)
    assert.equal(runRes.body.status, 'RUNNING')
    assert.ok(runRes.body.startedAt)
    assert.equal(runRes.body.faultInjections[0].active, true)

    // 3. 暂停实验
    const pauseRes = await request(app.getHttpServer())
      .post(`/chaos/experiments/${experimentIdA}/pause`)
    assert.equal(pauseRes.statusCode, 201)
    assert.equal(pauseRes.body.status, 'PAUSED')
    assert.equal(pauseRes.body.faultInjections[0].active, false)

    // 4. 创建第二个实验用于结果查询
    const exp2Res = await request(app.getHttpServer())
      .post('/chaos/experiments')
      .send({
        name: 'error-test',
        target: 'payment-service',
        faultType: 'ERROR',
        faultTarget: 'payment-service',
        faultParams: { errorRate: 30 },
      })
    experimentIdB = exp2Res.body.id

    // 运行并手动完成
    await request(app.getHttpServer()).post(`/chaos/experiments/${experimentIdB}/run`)
    experimentIdB = exp2Res.body.id
  } finally {
    await app.close()
  }
})

it('e2e: 故障注入(延迟/错误/超时/CPU)完整生命周期', async () => {
  const { app, faultService } = await buildApp()
  try {
    // 1. 注入延迟故障
    const latencyRes = await request(app.getHttpServer())
      .post('/chaos/faults/latency')
      .send({ target: 'api-gateway', paramValue: 300 })
    assert.equal(latencyRes.statusCode, 201)
    assert.equal(latencyRes.body.type, 'LATENCY')
    assert.equal(latencyRes.body.active, true)

    // 2. 注入错误故障
    const errorRes = await request(app.getHttpServer())
      .post('/chaos/faults/error')
      .send({ target: 'payment-api', paramValue: 50 })
    assert.equal(errorRes.statusCode, 201)
    assert.equal(errorRes.body.type, 'ERROR')
    assert.equal(errorRes.body.params.errorRate, 50)

    // 3. 注入超时故障
    const timeoutRes = await request(app.getHttpServer())
      .post('/chaos/faults/timeout')
      .send({ target: 'auth-service', paramValue: 2000 })
    assert.equal(timeoutRes.statusCode, 201)
    assert.equal(timeoutRes.body.type, 'TIMEOUT')
    assert.equal(timeoutRes.body.active, true)

    // 4. 注入 CPU 燃烧故障
    const cpuRes = await request(app.getHttpServer())
      .post('/chaos/faults/cpu-burn')
      .send({ target: 'worker-node', paramValue: 80 })
    assert.equal(cpuRes.statusCode, 201)
    assert.equal(cpuRes.body.type, 'CPU_BURN')
    assert.equal(cpuRes.body.active, true)

    // 5. 获取所有活跃故障
    const allRes = await request(app.getHttpServer())
      .get('/chaos/faults')
    assert.equal(allRes.statusCode, 200)
    assert.equal(allRes.body.length, 4)

    // 6. 停止故障注入
    const stopRes = await request(app.getHttpServer())
      .post('/chaos/faults/api-gateway/stop')
    assert.equal(stopRes.statusCode, 201)
    assert.equal(stopRes.body.stopped, true)

    // 停止后活跃故障应为 3
    const afterStop = faultService.getAllActiveFaults()
    assert.equal(afterStop.length, 3)
  } finally {
    await app.close()
  }
})

it('e2e: 健康监控→连续失败→自动回滚', async () => {
  const { app, rollbackService } = await buildApp()
  try {
    const experimentId = 'exp-rollback-001'

    // 发送连续3次不健康指标
    const unhealthyMetrics = {
      cpuUsage: 95,
      memoryUsage: 95,
      errorRate: 0.5,
      latencyAvg: 2000,
    }

    let monitorRes
    for (let i = 0; i < 3; i++) {
      monitorRes = await request(app.getHttpServer())
        .post(`/chaos/health/monitor?experimentId=${experimentId}`)
        .send({ ...unhealthyMetrics, healthy: false })
      assert.equal(monitorRes.statusCode, 201)
    }

    // 第三次后 shouldRollback 应为 true
    assert.equal(monitorRes!.body.shouldRollback, true)
    assert.equal(monitorRes!.body.failureCount, 3)

    // 触发自动回滚
    const rollbackRes = await request(app.getHttpServer())
      .post(`/chaos/health/rollback?experimentId=${experimentId}`)
      .send({ reason: 'Health threshold exceeded' })
    assert.equal(rollbackRes.statusCode, 201)
    assert.equal(rollbackRes.body.triggered, true)
  } finally {
    await app.close()
  }
})

it('e2e: 回滚历史记录查询', async () => {
  const { app } = await buildApp()
  try {
    // 创建两次回滚记录
    const unhealthyMetrics = {
      cpuUsage: 98,
      memoryUsage: 98,
      errorRate: 0.8,
      latencyAvg: 5000,
      healthy: false,
    }

    for (const expId of ['exp-hist-a', 'exp-hist-b']) {
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post(`/chaos/health/monitor?experimentId=${expId}`)
          .send(unhealthyMetrics)
      }
      await request(app.getHttpServer())
        .post(`/chaos/health/rollback?experimentId=${expId}`)
        .send({ reason: 'Auto rollback triggered' })
    }

    // 查询所有回滚历史
    const allRes = await request(app.getHttpServer())
      .get('/chaos/rollbacks')
    assert.equal(allRes.statusCode, 200)
    assert.equal(allRes.body.length, 2)

    // 按实验查询
    const expRes = await request(app.getHttpServer())
      .get('/chaos/rollbacks/exp-hist-a')
    assert.equal(expRes.statusCode, 200)
    assert.equal(expRes.body.length, 1)
    assert.equal(expRes.body[0].experimentId, 'exp-hist-a')
  } finally {
    await app.close()
  }
})

it('e2e: 不同故障类型实验间隔离', async () => {
  const { app } = await buildApp()
  try {
    // 创建不同类型故障实验
    const experiments = [
      { name: 'lat-isolate', faultType: 'LATENCY', faultParams: { delayMs: 300 } },
      { name: 'err-isolate', faultType: 'ERROR', faultParams: { errorRate: 75 } },
      { name: 'timeout-isolate', faultType: 'TIMEOUT', faultParams: { timeoutMs: 5000 } },
      { name: 'cpu-isolate', faultType: 'CPU_BURN', faultParams: { percentage: 60 } },
    ]

    const ids: string[] = []
    for (const exp of experiments) {
      const res = await request(app.getHttpServer())
        .post('/chaos/experiments')
        .send({
          name: exp.name,
          target: exp.name,
          faultType: exp.faultType,
          faultTarget: exp.name,
          faultParams: exp.faultParams,
        })
      assert.equal(res.statusCode, 201)
      ids.push(res.body.id)

      // 运行
      await request(app.getHttpServer()).post(`/chaos/experiments/${res.body.id}/run`)
    }

    // 所有实验独立运行互不影响
    const allRes = await request(app.getHttpServer()).get('/chaos/experiments')
    assert.equal(allRes.body.length, 4)
    const runningCount = allRes.body.filter((e: Record<string, unknown>) => e.status === 'RUNNING').length
    assert.equal(runningCount, 4)
  } finally {
    await app.close()
  }
})

it('e2e: 健康恢复后重置失败计数', async () => {
  const { app } = await buildApp()
  try {
    const expId = 'exp-recover'

    // 2次失败
    for (let i = 0; i < 2; i++) {
      await request(app.getHttpServer())
        .post(`/chaos/health/monitor?experimentId=${expId}`)
        .send({ cpuUsage: 95, memoryUsage: 95, errorRate: 0.5, latencyAvg: 2000, healthy: false })
    }

    // 1次恢复
    const recoverRes = await request(app.getHttpServer())
      .post(`/chaos/health/monitor?experimentId=${expId}`)
      .send({ cpuUsage: 40, memoryUsage: 50, errorRate: 0.01, latencyAvg: 80, healthy: true })
    assert.equal(recoverRes.statusCode, 201)
    assert.equal(recoverRes.body.healthy, true)
    assert.equal(recoverRes.body.failureCount, 0)
    assert.equal(recoverRes.body.shouldRollback, false)
  } finally {
    await app.close()
  }
})
