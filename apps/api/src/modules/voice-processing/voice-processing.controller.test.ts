import { describe, it, beforeEach, afterEach, mock } from 'node:test'
/**
 * VoiceProcessingController 单元测试 (node:test)
 *
 * Phase 102 语音处理 Controller 覆盖:
 * - TTS 合成任务 (create, list, get, cancel)
 * - STT 识别任务 (create, list, get, segments, cancel)
 * - 语音克隆 (create, list, delete)
 * - 声纹注册与识别 (enroll, list, identify)
 * - 引擎/音色元数据查询
 * - 数据统计
 * - 边界条件 (空数据集、引擎不存在、音色不存在)
 */

import assert from 'node:assert/strict'
// ── 内联 Controller ────────────────────────────────────────
class VoiceProcessingController {
  constructor(private service: any) {}

  async createTts(body: any) { return this.service.createTtsTask(body) }
  async listTts(query: any) {
    const items = await this.service.listTtsTasks(query)
    return { items, total: items.length }
  }
  async getTts(id: string) { return this.service.getTtsTask(id) }
  async cancelTts(id: string) { return this.service.cancelTtsTask(id) }

  async createStt(body: any) { return this.service.createSttTask(body) }
  async listStt(query: any) {
    const items = await this.service.listSttTasks(query)
    return { items, total: items.length }
  }
  async getStt(id: string) { return this.service.getSttTask(id) }
  async listSttSegments(id: string) {
    const items = await this.service.listSttSegments(id)
    return { items, total: items.length }
  }
  async cancelStt(id: string) { return this.service.cancelSttTask(id) }

  async cloneVoice(body: any) { return this.service.cloneVoice(body) }
  async listClones() { return { items: await this.service.listVoiceClones() } }
  async deleteClone(id: string) { await this.service.deleteVoiceClone(id) }

  async enrollVoiceprint(body: any) { return this.service.enrollVoiceprint(body) }
  async listVoiceprints() { return { items: await this.service.listVoiceprints() } }
  async identify(body: any) {
    const items = await this.service.identifySpeakers(body)
    return { items }
  }

  listTtsEngines() { return { items: this.service.listTtsEngines() } }
  listSttEngines() { return { items: this.service.listSttEngines() } }
  listVoices(engine?: any) {
    return { items: this.service.listVoices(engine) }
  }

  async stats() { return this.service.getVoiceStats() }
}

// ── Mock Service 工厂 ──────────────────────────────────────
function makeMockService(overrides: Record<string, any> = {}) {
  return {
    // TTS
    createTtsTask: mock.fn(async (dto: any) => ({
      id: 'tts-mock-001',
      tenantId: 'tenant-A',
      text: dto.text,
      engine: dto.engine ?? 'mock-azure-tts',
      voiceId: dto.voiceId,
      emotion: dto.emotion ?? 'neutral',
      status: 'pending',
      progress: 0,
      speedAdjustment: dto.speedAdjustment ?? 0,
      pitchAdjustment: dto.pitchAdjustment ?? 0,
      volumeAdjustment: dto.volumeAdjustment ?? 0,
      outputFormat: dto.outputFormat ?? 'mp3',
      sampleRate: dto.sampleRate ?? 24000,
      createdAt: '2026-06-28T09:00:00.000Z',
      updatedAt: '2026-06-28T09:00:00.000Z',
    })),
    listTtsTasks: mock.fn(async (query: any) => [
      { id: 'tts-mock-001', text: '你好', engine: 'mock-azure-tts', voiceId: 'zh-female-xiaoxian', status: 'completed', createdAt: '2026-06-28T09:00:00.000Z' },
    ]),
    getTtsTask: mock.fn(async (id: string) => {
      if (id === 'non-existent') throw new Error('TTS task not found')
      return { id, text: '你好', engine: 'mock-azure-tts', voiceId: 'zh-female-xiaoxian', status: 'completed' }
    }),
    cancelTtsTask: mock.fn(async (id: string) => {
      if (id === 'non-existent') throw new Error('TTS task not found')
      return { id, status: 'cancelled' }
    }),

    // STT
    createSttTask: mock.fn(async (dto: any) => ({
      id: 'stt-mock-001',
      tenantId: 'tenant-A',
      sourceAssetId: dto.sourceAssetId,
      filename: dto.filename ?? 'recording.wav',
      engine: dto.engine ?? 'mock-azure-stt',
      language: dto.language ?? 'zh-CN',
      status: 'pending',
      progress: 0,
      createdAt: '2026-06-28T09:00:00.000Z',
      updatedAt: '2026-06-28T09:00:00.000Z',
    })),
    listSttTasks: mock.fn(async (query: any) => [
      { id: 'stt-mock-001', sourceAssetId: 'asset-001', filename: 'recording.wav', status: 'completed', createdAt: '2026-06-28T09:00:00.000Z' },
    ]),
    getSttTask: mock.fn(async (id: string) => {
      if (id === 'non-existent-stt') throw new Error('STT task not found')
      return { id, sourceAssetId: 'asset-001', status: 'completed', fullText: '你好世界' }
    }),
    listSttSegments: mock.fn(async (taskId: string) => {
      if (taskId === 'empty-task') return []
      return [
        { id: 'seg-001', taskId, speakerId: 'speaker-1', startMs: 0, endMs: 1200, text: '你好', confidence: 0.95 },
        { id: 'seg-002', taskId, speakerId: 'speaker-1', startMs: 1200, endMs: 2500, text: '世界', confidence: 0.92 },
      ]
    }),
    cancelSttTask: mock.fn(async (id: string) => {
      if (id === 'non-existent-stt') throw new Error('STT task not found')
      return { id, status: 'cancelled' }
    }),

    // Voice Clone
    cloneVoice: mock.fn(async (dto: any) => ({
      id: 'vc-mock-001',
      tenantId: 'tenant-A',
      name: dto.name,
      engine: dto.engine,
      referenceAssetId: dto.referenceAssetId,
      referenceDurationSec: dto.referenceDurationSec,
      status: 'pending',
      progress: 0,
      createdBy: 'admin',
      createdAt: '2026-06-28T09:00:00.000Z',
      updatedAt: '2026-06-28T09:00:00.000Z',
    })),
    listVoiceClones: mock.fn(async () => [
      { id: 'vc-mock-001', name: '我的声音克隆', engine: 'mock-minimax-voice', status: 'ready', similarityScore: 0.87 },
    ]),
    deleteVoiceClone: mock.fn(async (id: string) => {
      if (id === 'non-existent-clone') throw new Error('Voice clone not found')
    }),

    // Voiceprint
    enrollVoiceprint: mock.fn(async (dto: any) => ({
      id: 'vp-mock-001',
      tenantId: 'tenant-A',
      speakerName: dto.speakerName,
      engine: dto.engine ?? 'mock-azure-stt',
      referenceAssetIds: dto.referenceAssetIds,
      status: 'enrolled',
      embedding: Array(128).fill(0),
      createdBy: 'admin',
      createdAt: '2026-06-28T09:00:00.000Z',
      updatedAt: '2026-06-28T09:00:00.000Z',
    })),
    listVoiceprints: mock.fn(async () => [
      { id: 'vp-mock-001', speakerName: '张三', engine: 'mock-azure-stt', status: 'active' },
      { id: 'vp-mock-002', speakerName: '李四', engine: 'mock-whisper', status: 'enrolled' },
    ]),
    identifySpeakers: mock.fn(async (dto: any) => {
      if (dto.segmentIds.length === 0) return []
      return [
        { voiceprintId: 'vp-mock-001', speakerName: '张三', similarity: 0.92, distance: 0.08 },
      ]
    }),

    // Engines & Voices
    listTtsEngines: mock.fn(() => [
      { type: 'mock-azure-tts', displayName: 'Azure TTS (Neural)', freeQuotaPerMonth: 500000, unitPricePerCharCny: 0.000016 },
      { type: 'mock-google-tts', displayName: 'Google Cloud TTS', freeQuotaPerMonth: 4000000, unitPricePerCharCny: 0.000016 },
    ]),
    listSttEngines: mock.fn(() => [
      { type: 'mock-azure-stt', displayName: 'Azure Speech to Text', freeHoursPerMonth: 5, unitPricePerHourCny: 8 },
      { type: 'mock-whisper', displayName: 'OpenAI Whisper', freeHoursPerMonth: Infinity, unitPricePerHourCny: 0 },
    ]),
    listVoices: mock.fn((engine?: string) => {
      const all = [
        { id: 'zh-female-xiaoxian', displayName: '晓娴', gender: 'female', language: 'zh-CN', engine: 'mock-azure-tts' },
        { id: 'zh-male-yunxi', displayName: '云希', gender: 'male', language: 'zh-CN', engine: 'mock-azure-tts' },
        { id: 'en-female-jenny', displayName: 'Jenny', gender: 'female', language: 'en-US', engine: 'mock-azure-tts' },
      ]
      if (engine) return all.filter((v) => v.engine === engine)
      return all
    }),

    // Stats
    getVoiceStats: mock.fn(async () => ({
      totalTtsTasks: 10,
      totalSttTasks: 5,
      totalChars: 5000,
      totalAudioSec: 120,
      totalVoiceprints: 3,
      totalVoiceClones: 2,
      byTtsEngine: { 'mock-azure-tts': 6, 'mock-edge-tts': 4 },
      bySttEngine: { 'mock-azure-stt': 3, 'mock-whisper': 2 },
      avgSttConfidence: 0.93,
    })),

    ...overrides,
  }
}

// ── 测试套件 ──────────────────────────────────────────────
describe('VoiceProcessingController (Phase 102)', () => {
  // ═══════════════════════════════════════════════════════════
  // TTS Tasks
  // ═══════════════════════════════════════════════════════════
  describe('POST /voice/tts/tasks - createTts()', () => {
    it('creates a TTS task with valid parameters', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.createTts({
        text: '欢迎光临我们的门店',
        voiceId: 'zh-female-xiaoxian',
        engine: 'mock-azure-tts',
      })
      assert.ok(result.id.startsWith('tts-'))
      assert.equal(result.text, '欢迎光临我们的门店')
      assert.equal(result.voiceId, 'zh-female-xiaoxian')
      assert.equal(result.status, 'pending')
    })

    it('supports optional emotion and speed parameters', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.createTts({
        text: '今天是个好日子',
        voiceId: 'zh-female-xiaomeng',
        engine: 'mock-aliyun-tts',
        emotion: 'happy',
        speedAdjustment: 10,
        pitchAdjustment: 5,
      })
      assert.equal(result.emotion, 'happy')
      assert.equal(result.speedAdjustment, 10)
    })
  })

  describe('GET /voice/tts/tasks - listTts()', () => {
    it('returns all TTS tasks with total', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.listTts({})
      assert.ok(Array.isArray(result.items))
      assert.equal(result.total, 1)
      assert.equal(result.items[0].engine, 'mock-azure-tts')
    })

    it('returns total 0 when no TTS tasks exist', async () => {
      const service = makeMockService({
        listTtsTasks: mock.fn(async () => []),
      })
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.listTts({})
      assert.equal(result.total, 0)
      assert.deepEqual(result.items, [])
    })

    it('filters by status when provided', async () => {
      const service = makeMockService({
        listTtsTasks: mock.fn(async (query: any) => {
          if (query.status === 'completed') return [{ id: 'tts-001', status: 'completed' }]
          return []
        }),
      })
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.listTts({ status: 'completed' })
      assert.equal(result.total, 1)
      assert.equal(result.items[0].status, 'completed')
    })
  })

  describe('GET /voice/tts/tasks/:id - getTts()', () => {
    it('returns TTS task details for existing task', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.getTts('tts-mock-001')
      assert.equal(result.id, 'tts-mock-001')
      assert.equal(result.text, '你好')
    })

    it('throws error for non-existent TTS task', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      await assert.rejects(
        () => ctrl.getTts('non-existent'),
        /TTS task not found/,
      )
    })
  })

  describe('POST /voice/tts/tasks/:id/cancel - cancelTts()', () => {
    it('cancels an active TTS task', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.cancelTts('tts-mock-001')
      assert.equal(result.id, 'tts-mock-001')
      assert.equal(result.status, 'cancelled')
    })

    it('throws error when cancelling non-existent task', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      await assert.rejects(
        () => ctrl.cancelTts('non-existent'),
        /TTS task not found/,
      )
    })
  })

  // ═══════════════════════════════════════════════════════════
  // STT Tasks
  // ═══════════════════════════════════════════════════════════
  describe('POST /voice/stt/tasks - createStt()', () => {
    it('creates an STT task with source asset', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.createStt({
        sourceAssetId: 'asset-001',
        filename: 'meeting.wav',
        engine: 'mock-whisper',
        language: 'zh-CN',
      })
      assert.ok(result.id.startsWith('stt-'))
      assert.equal(result.sourceAssetId, 'asset-001')
      assert.equal(result.engine, 'mock-whisper')
    })

    it('creates STT task with diarization and emotion flags', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.createStt({
        sourceAssetId: 'asset-002',
        engine: 'mock-azure-stt',
        enableDiarization: true,
        enableEmotionRecognition: true,
      })
      assert.equal(result.status, 'pending')
    })
  })

  describe('GET /voice/stt/tasks - listStt()', () => {
    it('returns all STT tasks', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.listStt({})
      assert.ok(Array.isArray(result.items))
      assert.equal(result.total, 1)
    })

    it('returns empty list when no STT tasks', async () => {
      const service = makeMockService({
        listSttTasks: mock.fn(async () => []),
      })
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.listStt({})
      assert.equal(result.total, 0)
      assert.deepEqual(result.items, [])
    })
  })

  describe('GET /voice/stt/tasks/:id - getStt()', () => {
    it('returns STT result for completed task', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.getStt('stt-mock-001')
      assert.equal(result.id, 'stt-mock-001')
      assert.equal(result.fullText, '你好世界')
    })

    it('throws error for unknown STT task', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      await assert.rejects(
        () => ctrl.getStt('non-existent-stt'),
        /STT task not found/,
      )
    })
  })

  describe('GET /voice/stt/tasks/:id/segments - listSttSegments()', () => {
    it('returns segments with timestamps and confidence', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.listSttSegments('stt-mock-001')
      assert.ok(Array.isArray(result.items))
      assert.equal(result.total, 2)
      assert.ok(result.items[0].startMs >= 0)
      assert.ok(result.items[0].confidence > 0)
    })

    it('returns empty array for task with no segments', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.listSttSegments('empty-task')
      assert.equal(result.total, 0)
      assert.deepEqual(result.items, [])
    })
  })

  describe('POST /voice/stt/tasks/:id/cancel - cancelStt()', () => {
    it('cancels an STT task', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.cancelStt('stt-mock-001')
      assert.equal(result.status, 'cancelled')
    })

    it('throws for non-existent STT task', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      await assert.rejects(
        () => ctrl.cancelStt('non-existent-stt'),
        /STT task not found/,
      )
    })
  })

  // ═══════════════════════════════════════════════════════════
  // Voice Clone
  // ═══════════════════════════════════════════════════════════
  describe('POST /voice/clones - cloneVoice()', () => {
    it('creates a voice clone job', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.cloneVoice({
        name: '客户声音克隆',
        engine: 'mock-minimax-voice',
        referenceAssetId: 'asset-ref-001',
        referenceDurationSec: 60,
      })
      assert.equal(result.name, '客户声音克隆')
      assert.equal(result.engine, 'mock-minimax-voice')
      assert.equal(result.status, 'pending')
    })
  })

  describe('GET /voice/clones - listClones()', () => {
    it('lists all voice clones', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.listClones()
      assert.ok(Array.isArray(result.items))
      assert.equal(result.items[0].name, '我的声音克隆')
    })

    it('returns empty array when no clones', async () => {
      const service = makeMockService({
        listVoiceClones: mock.fn(async () => []),
      })
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.listClones()
      assert.equal(result.items.length, 0)
    })
  })

  describe('DELETE /voice/clones/:id - deleteClone()', () => {
    it('deletes existing voice clone silently', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      await assert.doesNotReject(() => ctrl.deleteClone('vc-mock-001'))
    })

    it('throws for non-existent clone', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      await assert.rejects(
        () => ctrl.deleteClone('non-existent-clone'),
        /Voice clone not found/,
      )
    })
  })

  // ═══════════════════════════════════════════════════════════
  // Voiceprint
  // ═══════════════════════════════════════════════════════════
  describe('POST /voice/voiceprints - enrollVoiceprint()', () => {
    it('enrolls voiceprint for a speaker', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.enrollVoiceprint({
        speakerName: '张三',
        referenceAssetIds: ['asset-001', 'asset-002'],
        engine: 'mock-azure-stt',
      })
      assert.equal(result.speakerName, '张三')
      assert.equal(result.status, 'enrolled')
      assert.equal(result.referenceAssetIds.length, 2)
    })

    it('uses default engine when not specified', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.enrollVoiceprint({
        speakerName: '李四',
        referenceAssetIds: ['asset-003'],
      })
      assert.equal(result.engine, 'mock-azure-stt')
    })
  })

  describe('GET /voice/voiceprints - listVoiceprints()', () => {
    it('returns all enrolled voiceprints', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.listVoiceprints()
      assert.ok(Array.isArray(result.items))
      assert.equal(result.items.length, 2)
    })

    it('returns empty when no voiceprints', async () => {
      const service = makeMockService({
        listVoiceprints: mock.fn(async () => []),
      })
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.listVoiceprints()
      assert.equal(result.items.length, 0)
    })
  })

  describe('POST /voice/voiceprints/identify - identify()', () => {
    it('identifies speaker from voice segments', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.identify({
        segmentIds: ['seg-001', 'seg-002'],
        threshold: 0.7,
      })
      assert.ok(Array.isArray(result.items))
      assert.equal(result.items[0].speakerName, '张三')
      assert.ok(result.items[0].similarity > 0.5)
    })

    it('returns empty result with no matching candidates', async () => {
      const service = makeMockService({
        identifySpeakers: mock.fn(async () => []),
      })
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.identify({
        segmentIds: [],
        threshold: 0.95,
      })
      assert.equal(result.items.length, 0)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // Engines & Voices
  // ═══════════════════════════════════════════════════════════
  describe('GET /voice/engines/tts - listTtsEngines()', () => {
    it('returns available TTS engines', () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = ctrl.listTtsEngines()
      assert.ok(Array.isArray(result.items))
      assert.ok(result.items.length > 0)
      assert.ok(result.items[0].type.startsWith('mock-'))
    })
  })

  describe('GET /voice/engines/stt - listSttEngines()', () => {
    it('returns available STT engines', () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = ctrl.listSttEngines()
      assert.ok(Array.isArray(result.items))
      assert.ok(result.items.length > 0)
    })
  })

  describe('GET /voice/voices - listVoices()', () => {
    it('returns all voices when no engine filter', () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = ctrl.listVoices()
      assert.ok(Array.isArray(result.items))
      assert.equal(result.items.length, 3)
    })

    it('filters voices by engine when specified', () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = ctrl.listVoices('mock-google-tts')
      assert.equal(result.items.length, 0)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // Stats
  // ═══════════════════════════════════════════════════════════
  describe('GET /voice/stats - stats()', () => {
    it('returns aggregated voice statistics', async () => {
      const service = makeMockService()
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.stats()
      assert.equal(result.totalTtsTasks, 10)
      assert.equal(result.totalSttTasks, 5)
      assert.equal(result.totalChars, 5000)
      assert.equal(result.totalVoiceprints, 3)
      assert.ok(result.byTtsEngine['mock-azure-tts'] > 0)
    })

    it('returns zero stats when no activity', async () => {
      const service = makeMockService({
        getVoiceStats: mock.fn(async () => ({
          totalTtsTasks: 0,
          totalSttTasks: 0,
          totalChars: 0,
          totalAudioSec: 0,
          totalVoiceprints: 0,
          totalVoiceClones: 0,
          byTtsEngine: {},
          bySttEngine: {},
          avgSttConfidence: 0,
        })),
      })
      const ctrl = new VoiceProcessingController(service)
      const result = await ctrl.stats()
      assert.equal(result.totalTtsTasks, 0)
      assert.equal(result.totalSttTasks, 0)
    })
  })
})
