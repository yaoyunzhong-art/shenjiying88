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
 *   - 设备管理与缓存生命周期
 *   - 异常场景与边界值
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Get, Inject, Post, Delete, Body, Param, Query } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { EdgeService, type EdgeServiceHealth } from './edge.service'
import { EdgeInferenceService, EdgeModelCache, EdgeNodeService, OfflineRecognitionService } from './edge-ai.service'

@Controller('test/edge')
class TestEdgeController {
  constructor(
    @Inject(EdgeService) private readonly svc: EdgeService,
    @Inject(EdgeInferenceService) private readonly inferenceSvc: EdgeInferenceService,
    @Inject(EdgeModelCache) private readonly modelCacheSvc: EdgeModelCache,
    @Inject(EdgeNodeService) private readonly nodeSvc: EdgeNodeService,
    @Inject(OfflineRecognitionService) private readonly offlineSvc: OfflineRecognitionService,
  ) {}

  @Get('models')
  async listModels() {
    return await this.svc.listModels()
  }

  @Get('health')
  async health() {
    return await this.svc.healthCheck()
  }

  @Post('cache')
  async cacheModel(@Body() body: { modelId: string; version: string }) {
    return await this.svc.cacheModel(body.modelId, body.version)
  }

  @Delete('cache/:modelId')
  async invalidateCache(@Param('modelId') modelId: string) {
    await this.modelCacheSvc.invalidateCache(modelId)
    return null
  }

  @Get('models/:modelId/status')
  async modelStatus(@Param('modelId') modelId: string, @Query('deviceId') deviceId?: string) {
    return await this.svc.getModelStatus(modelId, deviceId)
  }

  @Post('inference')
  async inference(@Body() body: { modelId: string; input: unknown; deviceId: string }) {
    return await this.svc.aiInference(body.modelId, body.input, body.deviceId)
  }

  @Post('models/:modelId/load')
  async loadModel(@Param('modelId') modelId: string, @Body() body: { deviceId: string }) {
    return await this.inferenceSvc.loadModel(modelId, body.deviceId)
  }

  @Delete('models/:modelId/unload')
  async unloadModel(@Param('modelId') modelId: string, @Body() body: { deviceId: string }) {
    await this.inferenceSvc.unloadModel(modelId, body.deviceId)
    return null
  }

  @Get('devices')
  async listDevices() {
    return this.inferenceSvc.listDevices()
  }

  @Post('cache/clean')
  async cleanCache(@Body() body: { ttlMs: number }) {
    const count = await this.modelCacheSvc.cleanExpired(body.ttlMs)
    return { cleaned: count }
  }

  @Get('cached-models')
  async listCached() {
    return this.modelCacheSvc.listCachedModels()
  }

  @Get('devices/nodes')
  async listEdgeNodes() {
    return this.nodeSvc.listDevices()
  }

  @Post('devices/nodes')
  async registerNode(@Body() body: { deviceId: string; name: string; platform: string; capabilities: string[]; memoryMb: number; status: string }) {
    return this.nodeSvc.registerDevice({
      deviceId: body.deviceId,
      name: body.name,
      platform: body.platform as 'linux' | 'android' | 'ios' | 'windows',
      capabilities: body.capabilities,
      memoryMb: body.memoryMb,
      status: body.status as 'online' | 'offline' | 'busy',
    })
  }

  @Delete('devices/nodes/:deviceId')
  async removeNode(@Param('deviceId') deviceId: string) {
    const removed = this.nodeSvc.removeDevice(deviceId)
    return { removed }
  }

  @Post('devices/nodes/:deviceId/status')
  async updateNodeStatus(@Param('deviceId') deviceId: string, @Body() body: { status: string }) {
    return this.nodeSvc.updateDeviceStatus(deviceId, body.status as 'online' | 'offline' | 'busy')
  }

  @Post('offline/recognize')
  async offlineRecognize(@Body() body: { type: string; data: string; deviceId: string }) {
    switch (body.type) {
      case 'face':
        return await this.offlineSvc.recognizeFace(body.data, body.deviceId)
      case 'voice':
        return await this.offlineSvc.recognizeVoice(body.data, body.deviceId)
      case 'qrcode':
        return await this.offlineSvc.recognizeQRCode(body.data, body.deviceId)
      default:
        throw new Error(`Unknown recognition type: ${body.type}`)
    }
  }
}

async function buildApp() {
  const inferenceService = new EdgeInferenceService()
  const modelCache = new EdgeModelCache()
  const edgeService = new EdgeService(inferenceService, modelCache)
  const nodeService = new EdgeNodeService()
  const offlineService = new OfflineRecognitionService(inferenceService)

  const moduleRef = await Test.createTestingModule({
    controllers: [TestEdgeController],
    providers: [
      { provide: EdgeService, useValue: edgeService },
      { provide: EdgeInferenceService, useValue: inferenceService },
      { provide: EdgeModelCache, useValue: modelCache },
      { provide: EdgeNodeService, useValue: nodeService },
      { provide: OfflineRecognitionService, useValue: offlineService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, edgeService, inferenceService, modelCache, nodeService, offlineService }
}

// ────── Model List & Health Tests ──────

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
    assert.ok(health.status === 'ok' || health.status === 'degraded')
    assert.ok(health.totalDevices >= 3)
    assert.ok(health.onlineDevices >= 2)
    assert.ok(health.uptime > 0)
  } finally {
    await app.close()
  }
})

it('e2e: health degraded when some devices offline', async () => {
  const { app, nodeService } = await buildApp()
  try {
    nodeService.updateDeviceStatus('edge-003', 'offline')
    const res = await request(app.getHttpServer()).get('/test/edge/health')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.status, 'degraded')
  } finally {
    await app.close()
  }
})

it('e2e: list models shows deployed device count per model', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/edge/models')
    assert.ok(res.body.data.models.length > 0)
    for (const model of res.body.data.models) {
      assert.ok(Array.isArray(model.deployedDevices))
    }
  } finally {
    await app.close()
  }
})

it('e2e: health totalDevices matches actual device count', async () => {
  const { app, inferenceService } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/edge/health')
    assert.equal(res.body.data.totalDevices, inferenceService.listDevices().length)
  } finally {
    await app.close()
  }
})

// ────── Model Cache Tests ──────

it('e2e: cache model then query status shows cached', async () => {
  const { app } = await buildApp()
  try {
    const cacheRes = await request(app.getHttpServer())
      .post('/test/edge/cache')
      .send({ modelId: 'face-detect-v1', version: 'v1.0.0' })
    assert.equal(cacheRes.body.data.modelId, 'face-detect-v1')
    assert.ok(cacheRes.body.data.cachedAt > 0)

    const statusRes = await request(app.getHttpServer())
      .get('/test/edge/models/face-detect-v1/status')
    assert.equal(statusRes.body.data.cached, true)
    assert.equal(statusRes.body.data.cachedEntry?.modelId, 'face-detect-v1')
  } finally {
    await app.close()
  }
})

it('e2e: list cached models shows cached entries', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/test/edge/cache').send({ modelId: 'face-detect-v1', version: 'v1.0.0' })
    await request(app.getHttpServer()).post('/test/edge/cache').send({ modelId: 'nlp-intent-v1', version: 'v1.2.0' })

    const res = await request(app.getHttpServer()).get('/test/edge/cached-models')
    assert.equal(res.statusCode, 200)
    const models = res.body.data as Array<{ modelId: string }>
    assert.ok(models.some((m: any) => m.modelId === 'face-detect-v1'))
    assert.ok(models.some((m: any) => m.modelId === 'nlp-intent-v1'))
  } finally {
    await app.close()
  }
})

it('e2e: invalidate cache removes model from cached list', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/test/edge/cache').send({ modelId: 'face-detect-v1', version: 'v1.0.0' })

    const beforeRes = await request(app.getHttpServer()).get('/test/edge/cached-models')
    const beforeCount = beforeRes.body.data.length

    const invalidateRes = await request(app.getHttpServer()).delete('/test/edge/cache/face-detect-v1')
    assert.equal(invalidateRes.statusCode, 200)

    const afterRes = await request(app.getHttpServer()).get('/test/edge/cached-models')
    assert.equal(afterRes.body.data.length, beforeCount - 1)
    assert.equal(afterRes.body.data.some((m: any) => m.modelId === 'face-detect-v1'), false)
  } finally {
    await app.close()
  }
})

it('e2e: clean expired cache removes old entries', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/test/edge/cache').send({ modelId: 'ocr-text-v2', version: 'v2.0.0' })
    await request(app.getHttpServer()).post('/test/edge/cache').send({ modelId: 'face-detect-v1', version: 'v1.0.0' })

    const cleanRes = await request(app.getHttpServer())
      .post('/test/edge/cache/clean')
      .send({ ttlMs: 0 }) // zero TTL = everything expired
    assert.equal(cleanRes.statusCode, 201)
    assert.ok(cleanRes.body.data.cleaned >= 2)
  } finally {
    await app.close()
  }
})

// ────── Model Status Tests ──────

it('e2e: model status without prior cache shows not cached', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/edge/models/non-existent-model/status')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.cached, false)
    assert.equal(res.body.data.loaded, false)
  } finally {
    await app.close()
  }
})

it('e2e: model status filtered by deviceId returns only that device', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/edge/models/face-detect-v1/status?deviceId=edge-001')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.deviceInfo.length, 1)
    assert.equal(res.body.data.deviceInfo[0].deviceId, 'edge-001')
  } finally {
    await app.close()
  }
})

it('e2e: load model then check status shows loaded', async () => {
  const { app } = await buildApp()
  try {
    const loadRes = await request(app.getHttpServer())
      .post('/test/edge/models/face-detect-v1/load')
      .send({ deviceId: 'edge-001' })
    assert.equal(loadRes.statusCode, 201)
    assert.equal(loadRes.statusCode, 201)
    assert.equal(loadRes.body.data.modelId, 'face-detect-v1')

    const statusRes = await request(app.getHttpServer()).get('/test/edge/models/face-detect-v1/status?deviceId=edge-001')
    assert.equal(statusRes.body.data.deviceInfo[0].loaded, true)
  } finally {
    await app.close()
  }
})

it('e2e: unload model then check status shows not loaded', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/test/edge/models/face-detect-v1/load').send({ deviceId: 'edge-001' })
    const unloadRes = await request(app.getHttpServer()).delete('/test/edge/models/face-detect-v1/unload').send({ deviceId: 'edge-001' })
    assert.equal(unloadRes.statusCode, 200)

    const statusRes = await request(app.getHttpServer()).get('/test/edge/models/face-detect-v1/status?deviceId=edge-001')
    assert.equal(statusRes.body.data.deviceInfo[0].loaded, false)
  } finally {
    await app.close()
  }
})

// ────── AI Inference Tests ──────

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

it('e2e: inference on offline device returns error', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/edge/inference')
      .send({ modelId: 'face-detect-v1', input: 'embedding:test', deviceId: 'edge-003' })
    // edge-003 is offline per mock devices
    assert.equal(res.statusCode, 500)
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
    assert.equal(res.statusCode, 500)
  } finally {
    await app.close()
  }
})

it('e2e: inference on non-existent device returns error', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/edge/inference')
      .send({ modelId: 'face-detect-v1', input: 'embedding:test', deviceId: 'non-existent-device' })
    assert.equal(res.statusCode, 500)
  } finally {
    await app.close()
  }
})

it('e2e: inference with non-available model on device returns error', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/edge/inference')
      .send({ modelId: 'non-existent-model', input: 'test', deviceId: 'edge-001' })
    assert.equal(res.statusCode, 500)
  } finally {
    await app.close()
  }
})

it('e2e: multiple inferences on same device succeed', async () => {
  const { app } = await buildApp()
  try {
    const res1 = await request(app.getHttpServer())
      .post('/test/edge/inference')
      .send({ modelId: 'face-detect-v1', input: 'embedding:image1', deviceId: 'edge-001' })
    assert.equal(res1.statusCode, 201)

    const res2 = await request(app.getHttpServer())
      .post('/test/edge/inference')
      .send({ modelId: 'face-detect-v1', input: 'embedding:image2', deviceId: 'edge-001' })
    assert.equal(res2.statusCode, 201)

    assert.ok(res1.body.data.latencyMs >= 0)
    assert.ok(res2.body.data.latencyMs >= 0)
  } finally {
    await app.close()
  }
})

// ────── Device/Node Management Tests ──────

it('e2e: list edge devices returns all registered nodes', async () => {
  const { app, inferenceService } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/edge/devices')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.length, inferenceService.listDevices().length)
  } finally {
    await app.close()
  }
})

it('e2e: list edge nodes returns nodes from node service', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/edge/devices/nodes')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.length, 2)
    assert.ok(res.body.data.some((n: any) => n.deviceId === 'edge-001'))
  } finally {
    await app.close()
  }
})

it('e2e: register a new edge node and verify it appears in list', async () => {
  const { app } = await buildApp()
  try {
    const registerRes = await request(app.getHttpServer())
      .post('/test/edge/devices/nodes')
      .send({ deviceId: 'edge-005', name: 'New Edge Node', platform: 'linux', capabilities: ['face', 'qr'], memoryMb: 2048, status: 'online' })
    assert.equal(registerRes.statusCode, 201)
    assert.equal(registerRes.body.data.deviceId, 'edge-005')

    const listRes = await request(app.getHttpServer()).get('/test/edge/devices/nodes')
    assert.equal(listRes.body.data.length, 3)
    assert.ok(listRes.body.data.some((n: any) => n.deviceId === 'edge-005'))
  } finally {
    await app.close()
  }
})

it('e2e: remove an edge node removes it from the list', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer())
      .post('/test/edge/devices/nodes')
      .send({ deviceId: 'edge-temp', name: 'Temp Node', platform: 'android', capabilities: ['face'], memoryMb: 1024, status: 'offline' })

    const removeRes = await request(app.getHttpServer()).delete('/test/edge/devices/nodes/edge-temp')
    assert.equal(removeRes.statusCode, 200)
    assert.equal(removeRes.body.data.removed, true)

    const listRes = await request(app.getHttpServer()).get('/test/edge/devices/nodes')
    assert.equal(listRes.body.data.some((n: any) => n.deviceId === 'edge-temp'), false)
  } finally {
    await app.close()
  }
})

it('e2e: update edge node status reflects in subsequent queries', async () => {
  const { app } = await buildApp()
  try {
    const updateRes = await request(app.getHttpServer())
      .post('/test/edge/devices/nodes/edge-001/status')
      .send({ status: 'busy' })
    assert.equal(updateRes.statusCode, 201)
    assert.equal(updateRes.body.data.status, 'busy')

    const listRes = await request(app.getHttpServer()).get('/test/edge/devices/nodes')
    const node = listRes.body.data.find((n: any) => n.deviceId === 'edge-001')
    assert.equal(node.status, 'busy')
  } finally {
    await app.close()
  }
})

// ────── Offline Recognition Tests ──────

it('e2e: offline face recognition returns detection result', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/edge/offline/recognize')
      .send({ type: 'face', data: 'base64_encoded_image', deviceId: 'edge-001' })
    assert.equal(res.statusCode, 201)
    assert.ok(res.body.data.faceId)
    assert.ok(res.body.data.boundingBox)
    assert.ok(Array.isArray(res.body.data.landmarks))
    assert.ok(res.body.data.matchScore! >= 0 && res.body.data.matchScore! <= 1)
  } finally {
    await app.close()
  }
})

it('e2e: offline voice recognition returns transcript', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/edge/offline/recognize')
      .send({ type: 'voice', data: 'base64_audio', deviceId: 'edge-001' })
    assert.equal(res.statusCode, 201)
    assert.ok(res.body.data.transcript.length > 0)
    assert.equal(res.body.data.language, 'zh-CN')
    assert.ok(res.body.data.confidence > 0)
    assert.ok(Array.isArray(res.body.data.words))
  } finally {
    await app.close()
  }
})

it('e2e: offline QR code recognition returns parsed data', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/edge/offline/recognize')
      .send({ type: 'qrcode', data: 'base64_qr_image', deviceId: 'edge-001' })
    assert.equal(res.statusCode, 201)
    assert.ok(res.body.data.data.startsWith('https://'))
    assert.equal(res.body.data.format, 'QR_CODE')
    assert.ok(res.body.data.rotation >= 0)
  } finally {
    await app.close()
  }
})
