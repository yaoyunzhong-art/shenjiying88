import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Edge 边缘计算 HTTP 链路
 *
 * 链路:
 *   HTTP → TestEdgeController → EdgeService (→ EdgeInferenceService + EdgeModelCache)
 *
 * 验证:
 *   - 模型列表与健康检查
 *   - 模型缓存与状态查询
 *   - AI推理全流程（加载→推理→结果）
 *   - 跨设备模型差异
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Get, Inject, Post, Body, Param } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { EdgeService, type EdgeServiceHealth } from './edge.service'
import { EdgeInferenceService, EdgeModelCache } from './edge-ai.service'

@Controller('test/edge')
class TestEdgeController {
  constructor(
    @Inject(EdgeService) private readonly svc: EdgeService,
  ) {}

  @Get('models')
  async listModels() {
    return { success: true, data: await this.svc.listModels() }
  }

  @Get('health')
  async health() {
    return { success: true, data: await this.svc.healthCheck() }
  }

  @Post('cache')
  async cacheModel(@Body() body: { modelId: string; version: string }) {
    return { success: true, data: await this.svc.cacheModel(body.modelId, body.version) }
  }

  @Get('models/:modelId/status')
  async modelStatus(@Param('modelId') modelId: string, @Body() body?: { deviceId?: string }) {
    return { success: true, data: await this.svc.getModelStatus(modelId, body?.deviceId) }
  }

  @Post('inference')
  async inference(@Body() body: { modelId: string; input: unknown; deviceId: string }) {
    return { success: true, data: await this.svc.aiInference(body.modelId, body.input, body.deviceId) }
  }
}

async function buildApp() {
  const inferenceService = new EdgeInferenceService()
  const modelCache = new EdgeModelCache()
  const edgeService = new EdgeService(inferenceService, modelCache)

  const moduleRef = await Test.createTestingModule({
    controllers: [TestEdgeController],
    providers: [
      { provide: EdgeService, useValue: edgeService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, edgeService }
}

it('e2e: list models returns 5 default models', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/edge/models')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.total, 5)
    assert.ok(res.body.data.models.some((m: any) => m.modelId === 'face-detect-v1'))
  } finally {
    await app.close()
  }
})

it('e2e: health check returns ok with devices', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/edge/health')
    assert.equal(res.statusCode, 200)
    const health = res.body.data as EdgeServiceHealth
    assert.equal(health.status, 'ok')
    assert.ok(health.totalDevices >= 3)
    assert.ok(health.onlineDevices >= 2)
    assert.ok(health.uptime > 0)
  } finally {
    await app.close()
  }
})

it('e2e: cache model then query status shows cached', async () => {
  const { app } = await buildApp()
  try {
    const cacheRes = await request(app.getHttpServer())
      .post('/test/edge/cache')
      .send({ modelId: 'face-detect-v1', version: 'v1.0.0' })
    assert.equal(cacheRes.body.data.modelId, 'face-detect-v1')
    assert.ok(cacheRes.body.data.cachedAt > 0)

    // Status for any device should show cached
    const statusRes = await request(app.getHttpServer())
      .get('/test/edge/models/face-detect-v1/status')
    assert.equal(statusRes.body.data.cached, true)
    assert.equal(statusRes.body.data.cachedEntry?.modelId, 'face-detect-v1')
  } finally {
    await app.close()
  }
})

it('e2e: ai inference on online device returns result', async () => {
  const { app } = await buildApp()
  try {
    const infRes = await request(app.getHttpServer())
      .post('/test/edge/inference')
      .send({ modelId: 'face-detect-v1', input: 'embedding:test_face_image', deviceId: 'edge-001' })
    assert.equal(infRes.statusCode, 201)
    assert.equal(infRes.body.data.modelId, 'face-detect-v1')
    assert.ok(infRes.body.data.latencyMs >= 0)
    assert.ok(infRes.body.data.timestamp > 0)
  } finally {
    await app.close()
  }
})

it('e2e: device without capability throws error', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/edge/inference')
      .send({ modelId: 'voice-recognize-v2', input: 'classify:test_audio', deviceId: 'edge-002' })
    // edge-002 has only face+qr capability, not voice
    // The inference service will require model to be loaded first before inference
    // If model not available on device, EdgeService.aiInference throws
    assert.equal(res.statusCode, 500)
  } finally {
    await app.close()
  }
})
