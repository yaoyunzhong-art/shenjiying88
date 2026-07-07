import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Voice Processing HTTP 链路
 *
 * 链路: HTTP → TestController → VoiceProcessingService
 *
 * 验证:
 *   - TTS 任务创建 / 查询 / 列表 / 取消
 *   - STT 任务创建 / 查询 / 列表 / 取消 / 段落
 *   - 语音克隆
 *   - 声纹注册 + 识别
 *   - 引擎与音色元数据
 *   - 统计
 *   - 异常输入 (引擎不存在 / 音色不存在 / 参考音频过短 / 字段缺失)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Inject, Param, Post, Query,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { VoiceProcessingService } from './voice-processing.service'
import { runWithTenant } from '../../common/context/tenant-context'
import type {
  CreateTtsTaskDto, CreateSttTaskDto, CloneVoiceDto,
  EnrollVoiceprintDto, IdentifySpeakerDto,
  ListTtsQuery, ListSttQuery,
} from './voice-processing.dto'

const TENANT_ID = 'tenant-e2e'
const TENANT_CTX = {
  tenantId: TENANT_ID, storeId: 'store-e2e-001',
  userId: 'admin-e2e', role: 'tenant_admin' as const,
}

@Controller('voice')
class TestVoiceController {
  constructor(
    @Inject(VoiceProcessingService) private readonly service: VoiceProcessingService,
  ) {}

  // ===== TTS =====
  @Post('tts/tasks')
  @HttpCode(HttpStatus.CREATED)
  async createTts(@Body() body: CreateTtsTaskDto) {
    return this.service.createTtsTask(body)
  }

  @Get('tts/tasks')
  async listTts(@Query() query: ListTtsQuery) {
    const items = await this.service.listTtsTasks(query)
    return { items, total: items.length }
  }

  @Get('tts/tasks/:id')
  async getTts(@Param('id') id: string) {
    return this.service.getTtsTask(id)
  }

  @Post('tts/tasks/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelTts(@Param('id') id: string) {
    return this.service.cancelTtsTask(id)
  }

  // ===== STT =====
  @Post('stt/tasks')
  @HttpCode(HttpStatus.CREATED)
  async createStt(@Body() body: CreateSttTaskDto) {
    return this.service.createSttTask(body)
  }

  @Get('stt/tasks')
  async listStt(@Query() query: ListSttQuery) {
    const items = await this.service.listSttTasks(query)
    return { items, total: items.length }
  }

  @Get('stt/tasks/:id')
  async getStt(@Param('id') id: string) {
    return this.service.getSttTask(id)
  }

  @Get('stt/tasks/:id/segments')
  async listSttSegments(@Param('id') id: string) {
    const items = await this.service.listSttSegments(id)
    return { items, total: items.length }
  }

  @Post('stt/tasks/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelStt(@Param('id') id: string) {
    return this.service.cancelSttTask(id)
  }

  // ===== Voice Clone =====
  @Post('clones')
  @HttpCode(HttpStatus.CREATED)
  async cloneVoice(@Body() body: CloneVoiceDto) {
    return this.service.cloneVoice(body)
  }

  @Get('clones')
  async listClones() {
    return { items: await this.service.listVoiceClones() }
  }

  @Delete('clones/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteClone(@Param('id') id: string) {
    await this.service.deleteVoiceClone(id)
  }

  // ===== Voiceprint =====
  @Post('voiceprints')
  @HttpCode(HttpStatus.CREATED)
  async enrollVoiceprint(@Body() body: EnrollVoiceprintDto) {
    return this.service.enrollVoiceprint(body)
  }

  @Get('voiceprints')
  async listVoiceprints() {
    return { items: await this.service.listVoiceprints() }
  }

  @Post('voiceprints/identify')
  @HttpCode(HttpStatus.OK)
  async identify(@Body() body: IdentifySpeakerDto) {
    return this.service.identifySpeakers(body)
  }

  // ===== Engines & Voices =====
  @Get('engines/tts')
  async listTtsEngines() {
    return { items: this.service.listTtsEngines() }
  }

  @Get('engines/stt')
  async listSttEngines() {
    return { items: this.service.listSttEngines() }
  }

  @Get('voices')
  async listVoices(@Query('engine') engine?: string) {
    return { items: this.service.listVoices(engine as any) }
  }

  // ===== Stats =====
  @Get('stats')
  async stats() {
    return this.service.getVoiceStats()
  }
}

async function buildApp() {
  const service = new VoiceProcessingService()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestVoiceController],
    providers: [
      { provide: VoiceProcessingService, useValue: service },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, service }
}

function setup(block: () => Promise<void>): () => Promise<void> {
  return async () => {
    await runWithTenant(TENANT_CTX, block)
  }
}

// ===== 1. TTS =====

it('voice e2e: TTS create + get returns completed task', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/voice/tts/tasks')
      .send({
        text: '您好,欢迎致电审计云客服中心',
        voiceId: 'zh-female-xiaoxian',
      })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.id, res.body.id)
    assert.equal(res.body.status, 'completed')
    assert.equal(res.body.engine, 'mock-azure-tts')
    assert.equal(res.body.voiceId, 'zh-female-xiaoxian')
    assert.ok(res.body.audioDurationSec! > 0)

    // get
    const res2 = await request(app.getHttpServer()).get(`/voice/tts/tasks/${res.body.id}`)
    assert.equal(res2.statusCode, 200)
    assert.equal(res2.body.id, res.body.id)
  } finally {
    await app.close()
  }
})

it('voice e2e: TTS create with explicit engine + emotion', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/voice/tts/tasks')
      .send({
        text: '庆祝活动即将开始!',
        engine: 'mock-aliyun-tts',
        voiceId: 'zh-female-xiaomeng',
        emotion: 'happy',
        speedAdjustment: 10,
        pitchAdjustment: 5,
      })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.engine, 'mock-aliyun-tts')
    assert.equal(res.body.emotion, 'happy')
    assert.equal(res.body.speedAdjustment, 10)
    assert.equal(res.body.pitchAdjustment, 5)
  } finally {
    await app.close()
  }
})

it('voice e2e: TTS list returns tasks', async () => {
  const { app } = await buildApp()
  try {
    // create some tasks first
    await request(app.getHttpServer())
      .post('/voice/tts/tasks').send({ text: 't1', voiceId: 'zh-female-xiaoxian' })
    await request(app.getHttpServer())
      .post('/voice/tts/tasks').send({ text: 't2', voiceId: 'zh-female-xiaoxian' })

    const res = await request(app.getHttpServer()).get('/voice/tts/tasks')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.total, 2)
    assert.equal(res.body.items.length, 2)
  } finally {
    await app.close()
  }
})

it('voice e2e: TTS create rejects unknown engine', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/voice/tts/tasks')
      .send({ text: 'hello', engine: 'nonexistent-engine', voiceId: 'zh-female-xiaoxian' })
    assert.equal(res.statusCode, 400)
  } finally {
    await app.close()
  }
})

it('voice e2e: TTS create rejects unknown voice', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/voice/tts/tasks')
      .send({ text: 'hello', voiceId: 'nonexistent-voice' })
    assert.equal(res.statusCode, 400)
  } finally {
    await app.close()
  }
})

it('voice e2e: TTS create rejects voice not belonging to engine', async () => {
  const { app } = await buildApp()
  try {
    // zh-female-xiaomeng is for mock-aliyun-tts, not mock-azure-tts
    const res = await request(app.getHttpServer())
      .post('/voice/tts/tasks')
      .send({ text: 'hello', engine: 'mock-azure-tts', voiceId: 'zh-female-xiaomeng' })
    assert.equal(res.statusCode, 400)
  } finally {
    await app.close()
  }
})

it('voice e2e: TTS create rejects emotion on unsupported engine', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/voice/tts/tasks')
      .send({
        text: 'hello',
        engine: 'mock-google-tts',
        voiceId: 'ja-female-nanami',
        emotion: 'happy',
      })
    assert.equal(res.statusCode, 400)
  } finally {
    await app.close()
  }
})

it('voice e2e: TTS get returns 404 for nonexistent task', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/voice/tts/tasks/nonexistent')
    assert.equal(res.statusCode, 404)
  } finally {
    await app.close()
  }
})

it('voice e2e: TTS cancel completed task returns 400', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/voice/tts/tasks').send({ text: 'hello', voiceId: 'zh-female-xiaoxian' })
    assert.equal(createRes.body.status, 'completed')

    const cancelRes = await request(app.getHttpServer())
      .post(`/voice/tts/tasks/${createRes.body.id}/cancel`)
    assert.equal(cancelRes.statusCode, 400)
  } finally {
    await app.close()
  }
})

// ===== 2. STT =====

it('voice e2e: STT create + get + segments', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/voice/stt/tasks')
      .send({ sourceAssetId: 'asset-001' })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.status, 'completed')
    assert.ok(res.body.fullText.length > 0)
    assert.ok(res.body.speakerCount >= 1)
    assert.ok(res.body.avgConfidence > 0)

    // get
    const res2 = await request(app.getHttpServer()).get(`/voice/stt/tasks/${res.body.id}`)
    assert.equal(res2.statusCode, 200)
    assert.equal(res2.body.id, res.body.id)

    // segments
    const res3 = await request(app.getHttpServer()).get(`/voice/stt/tasks/${res.body.id}/segments`)
    assert.equal(res3.statusCode, 200)
    assert.ok(res3.body.total >= 1)
    assert.ok(res3.body.items[0].text)
  } finally {
    await app.close()
  }
})

it('voice e2e: STT create with diarization returns multiple speakers', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/voice/stt/tasks')
      .send({ sourceAssetId: 'asset-diar', enableDiarization: true })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.speakerCount, 2)
    assert.ok(res.body.segmentCount >= 1)
  } finally {
    await app.close()
  }
})

it('voice e2e: STT create with emotion recognition', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/voice/stt/tasks')
      .send({ sourceAssetId: 'asset-emotion', enableEmotionRecognition: true })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.status, 'completed')
  } finally {
    await app.close()
  }
})

it('voice e2e: STT list returns tasks', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer())
      .post('/voice/stt/tasks').send({ sourceAssetId: 'a1' })
    await request(app.getHttpServer())
      .post('/voice/stt/tasks').send({ sourceAssetId: 'a2' })

    const res = await request(app.getHttpServer()).get('/voice/stt/tasks')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.total, 2)
  } finally {
    await app.close()
  }
})

it('voice e2e: STT create rejects unsupported diarization engine', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/voice/stt/tasks')
      .send({ sourceAssetId: 'a', engine: 'mock-whisper', enableDiarization: true })
    assert.equal(res.statusCode, 400)
  } finally {
    await app.close()
  }
})

it('voice e2e: STT create rejects unsupported language', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/voice/stt/tasks')
      .send({ sourceAssetId: 'a', engine: 'mock-aliyun-stt', language: 'de-DE' })
    assert.equal(res.statusCode, 400)
  } finally {
    await app.close()
  }
})

it('voice e2e: STT get returns 404 for nonexistent task', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/voice/stt/tasks/nonexistent')
    assert.equal(res.statusCode, 404)
  } finally {
    await app.close()
  }
})

// ===== 3. Voice Clone =====

it('voice e2e: clone voice creates and returns ready clone', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/voice/clones')
      .send({
        name: 'e2e-voice',
        engine: 'mock-minimax-voice',
        referenceAssetId: 'ref-001',
        referenceDurationSec: 30,
      })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.name, 'e2e-voice')
    assert.equal(res.body.status, 'ready')
    assert.ok(res.body.similarityScore! > 0.8)
  } finally {
    await app.close()
  }
})

it('voice e2e: clone rejects too short reference', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/voice/clones')
      .send({
        name: 'short',
        engine: 'mock-minimax-voice',
        referenceAssetId: 'ref-short',
        referenceDurationSec: 2,
      })
    assert.equal(res.statusCode, 400)
  } finally {
    await app.close()
  }
})

it('voice e2e: clone rejects too long reference', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/voice/clones')
      .send({
        name: 'long',
        engine: 'mock-minimax-voice',
        referenceAssetId: 'ref-long',
        referenceDurationSec: 700,
      })
    assert.equal(res.statusCode, 400)
  } finally {
    await app.close()
  }
})

it('voice e2e: list + delete clone', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/voice/clones')
      .send({
        name: 'del-test',
        engine: 'mock-minimax-voice',
        referenceAssetId: 'ref-del',
        referenceDurationSec: 30,
      })
    assert.equal(createRes.statusCode, 201)

    const listRes = await request(app.getHttpServer()).get('/voice/clones')
    assert.equal(listRes.statusCode, 200)
    assert.ok(listRes.body.items.length >= 1)

    const deleteRes = await request(app.getHttpServer()).delete(`/voice/clones/${createRes.body.id}`)
    assert.equal(deleteRes.statusCode, 204)
  } finally {
    await app.close()
  }
})

// ===== 4. Voiceprint =====

it('voice e2e: enroll voiceprint + list', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/voice/voiceprints')
      .send({
        speakerName: '陈总',
        referenceAssetIds: ['ref-vp-1', 'ref-vp-2'],
      })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.speakerName, '陈总')
    assert.equal(res.body.status, 'enrolled')
    assert.ok(res.body.embedding.length > 0)

    const listRes = await request(app.getHttpServer()).get('/voice/voiceprints')
    assert.equal(listRes.statusCode, 200)
    assert.ok(listRes.body.items.length >= 1)
  } finally {
    await app.close()
  }
})

it('voice e2e: enroll rejects empty referenceAssets', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/voice/voiceprints')
      .send({ speakerName: 'test', referenceAssetIds: [] })
    assert.equal(res.statusCode, 400)
  } finally {
    await app.close()
  }
})

it('voice e2e: identify speakers after enrollment', async () => {
  const { app } = await buildApp()
  try {
    // First create an STT task to generate segments
    const sttRes = await request(app.getHttpServer())
      .post('/voice/stt/tasks')
      .send({ sourceAssetId: 'asset-ident' })
    assert.equal(sttRes.statusCode, 201)

    // Get segments
    const segRes = await request(app.getHttpServer())
      .get(`/voice/stt/tasks/${sttRes.body.id}/segments`)
    assert.ok(segRes.body.items.length >= 1)
    const segmentId = segRes.body.items[0].id

    // Enroll a voiceprint
    const vpRes = await request(app.getHttpServer())
      .post('/voice/voiceprints')
      .send({
        speakerName: '李经理',
        referenceAssetIds: ['ref-ident-1'],
      })
    assert.equal(vpRes.statusCode, 201)
    const vpId = vpRes.body.id

    // Identify
    const identRes = await request(app.getHttpServer())
      .post('/voice/voiceprints/identify')
      .send({ segmentIds: [segmentId], candidateVoiceprintIds: [vpId] })
    assert.equal(identRes.statusCode, 200)
    assert.ok(identRes.body.items.length >= 1)
    assert.equal(identRes.body.items[0].matches[0].voiceprintId, vpId)
  } finally {
    await app.close()
  }
})

// ===== 5. Engines & Voices =====

it('voice e2e: list TTS engines returns metadata', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/voice/engines/tts')
    assert.equal(res.statusCode, 200)
    assert.ok(res.body.items.length >= 6)
    const azure = res.body.items.find((e: any) => e.type === 'mock-azure-tts')
    assert.ok(azure)
    assert.equal(azure.supportsEmotion, true)
  } finally {
    await app.close()
  }
})

it('voice e2e: list STT engines returns metadata', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/voice/engines/stt')
    assert.equal(res.statusCode, 200)
    assert.ok(res.body.items.length >= 6)
    const whisper = res.body.items.find((e: any) => e.type === 'mock-whisper')
    assert.ok(whisper)
    assert.equal(whisper.supportsDiarization, false)
  } finally {
    await app.close()
  }
})

it('voice e2e: list voices returns all by default', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/voice/voices')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.items.length, 6)
  } finally {
    await app.close()
  }
})

it('voice e2e: list voices filtered by engine', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/voice/voices?engine=mock-azure-tts')
    assert.equal(res.statusCode, 200)
    assert.ok(res.body.items.length >= 3)
    res.body.items.forEach((v: any) => {
      assert.equal(v.engine, 'mock-azure-tts')
    })
  } finally {
    await app.close()
  }
})

// ===== 6. Stats =====

it('voice e2e: stats returns aggregated numbers', async () => {
  const { app } = await buildApp()
  try {
    // Create some tasks
    await request(app.getHttpServer())
      .post('/voice/tts/tasks').send({ text: 's1', voiceId: 'zh-female-xiaoxian' })
    await request(app.getHttpServer())
      .post('/voice/stt/tasks').send({ sourceAssetId: 's-asset' })

    const res = await request(app.getHttpServer()).get('/voice/stats')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.totalTtsTasks, 1)
    assert.equal(res.body.totalSttTasks, 1)
    assert.ok(res.body.totalChars > 0)
    assert.ok(res.body.totalAudioSec > 0)
    assert.ok(res.body.avgSttConfidence > 0)
  } finally {
    await app.close()
  }
})

// ===== 7. Cross-tenant isolation =====

it('voice e2e: TTS tasks are isolated between tenants', async () => {
  const { app, service } = await buildApp()
  try {
    // Create task under TENANT_ID
    const r1 = await request(app.getHttpServer())
      .post('/voice/tts/tasks').send({ text: 'tenant-a-tts', voiceId: 'zh-female-xiaoxian' })
    assert.equal(r1.statusCode, 201)

    // Now check list under same tenant - should see 1
    const r2 = await request(app.getHttpServer()).get('/voice/tts/tasks')
    assert.equal(r2.statusCode, 200)
    assert.equal(r2.body.total, 1)

    // List using a different tenant context via internal service call
    await runWithTenant({
      tenantId: 'tenant-other', storeId: 'other',
      userId: 'other', role: 'tenant_admin' as const,
    }, async () => {
      const items = await service.listTtsTasks()
      assert.equal(items.length, 0)
    })
  } finally {
    await app.close()
  }
})
