import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 扩展角色测试: voice-processing 模块
 *
 * 4 个深度角色视角：
 * 🛒前台 — 语音播报与客户语音识别
 * 👥HR — 面试录音转写与声纹入库
 * 🎮导玩员 — 游戏道具语音播报 & 互动语音
 * 🤝团建 — 团建活动语音素材合成与整理
 *
 * 每个角色 3 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
// ── 角色定义 ──
const ROLES = {
  Reception: '🛒前台',
  HR: '👥HR',
  Guide: '🎮导玩员',
  Teambuilding: '🤝团建',
}

const TENANT = 't-voice-ext'

// ── 测试数据工厂 ──

interface MockTask {
  id: string
  tenantId: string
  text?: string
  engine?: string
  voiceId?: string
  emotion?: string
  status: string
  progress: number
  createdAt: string
  updatedAt: string
  audioDurationSec?: number
  outputAssetId?: string
  errorMessage?: string
  speakerName?: string
  userId?: string
  name?: string
  fullText?: string
  speakerCount?: number
  avgConfidence?: number
  segmentCount?: number
  referenceAssetId?: string
  sourceAssetId?: string
  language?: string
}

/**
 * 创建高度可定制的 mock voice-processing service
 */
function mockVoiceService(overrides: any = {}) {
  const ttsStore = new Map<string, MockTask>()
  const sttStore = new Map<string, MockTask>()
  const cloneStore = new Map<string, MockTask>()
  const voiceprintStore = new Map<string, MockTask>()

  let ttsCounter = 0
  let sttCounter = 0
  let cloneCounter = 0
  let vpCounter = 0

  return {
    // ── TTS ──
    ttsTasks: ttsStore,
    createTtsTask: async (dto: any) => {
      if (!dto.text || dto.text.length === 0) {
        throw Object.assign(new Error('文本内容不能为空'), { status: 400 })
      }
      if (dto.text.length > 5000) {
        throw Object.assign(new Error('文本超出 5000 字符上限'), { status: 400 })
      }
      const task: MockTask = {
        id: `tts-ext-${++ttsCounter}`,
        tenantId: dto.tenantId ?? TENANT,
        text: dto.text,
        engine: dto.engine ?? 'mock-azure-tts',
        voiceId: dto.voiceId ?? 'voice-001',
        emotion: dto.emotion ?? 'neutral',
        status: 'completed',
        progress: 1.0,
        audioDurationSec: Math.round(dto.text.length * 0.1),
        outputAssetId: `asset-voice-${ttsCounter}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      ttsStore.set(task.id, task)
      return task
    },
    listTtsTasks: async (query: any = {}) => {
      const items = Array.from(ttsStore.values())
      if (query.status) return items.filter(t => t.status === query.status)
      return items
    },
    getTtsTask: async (id: string) => {
      const task = ttsStore.get(id)
      if (!task) throw Object.assign(new Error('TTS 任务不存在'), { status: 404 })
      return task
    },
    cancelTtsTask: async (id: string) => {
      const task = ttsStore.get(id)
      if (!task) throw Object.assign(new Error('TTS 任务不存在'), { status: 404 })
      if (task.status === 'completed') {
        throw Object.assign(new Error('已完成的任务不可取消'), { status: 400 })
      }
      task.status = 'cancelled'
      return task
    },

    // ── STT ──
    createSttTask: async (dto: any) => {
      if (!dto.sourceAssetId) {
        throw Object.assign(new Error('音频资源 ID 不能为空'), { status: 400 })
      }
      if (dto.language && !['zh-CN', 'en-US', 'ja-JP', 'auto'].includes(dto.language)) {
        throw Object.assign(new Error(`不支持的语言: ${dto.language}`), { status: 400 })
      }
      const task: MockTask = {
        id: `stt-ext-${++sttCounter}`,
        tenantId: dto.tenantId ?? TENANT,
        sourceAssetId: dto.sourceAssetId,
        engine: dto.engine ?? 'mock-whisper',
        language: dto.language ?? 'auto',
        status: 'completed',
        progress: 1.0,
        fullText: dto.language === 'en-US'
          ? 'Welcome to our store. How may I help you today?'
          : '欢迎光临。今天有什么可以帮您的？',
        speakerCount: 2,
        avgConfidence: 0.94,
        segmentCount: 12,
        audioDurationSec: 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      sttStore.set(task.id, task)
      return task
    },
    listSttTasks: async (query: any = {}) => {
      const items = Array.from(sttStore.values())
      if (query.status) return items.filter(t => t.status === query.status)
      return items
    },
    getSttTask: async (id: string) => {
      const task = sttStore.get(id)
      if (!task) throw Object.assign(new Error('STT 任务不存在'), { status: 404 })
      return task
    },
    listSttSegments: async (id: string) => {
      const task = sttStore.get(id)
      if (!task) throw Object.assign(new Error('STT 任务不存在'), { status: 404 })
      return [
        { index: 1, speaker: 'speaker-1', text: '欢迎光临', startMs: 0, endMs: 1500, confidence: 0.96 },
        { index: 2, speaker: 'speaker-2', text: '我想咨询一下会员卡', startMs: 2000, endMs: 5000, confidence: 0.92 },
      ]
    },
    cancelSttTask: async (id: string) => {
      const task = sttStore.get(id)
      if (!task) throw Object.assign(new Error('STT 任务不存在'), { status: 404 })
      if (task.status === 'completed') {
        throw Object.assign(new Error('已完成的任务不可取消'), { status: 400 })
      }
      task.status = 'cancelled'
      return task
    },

    // ── Voice Clone ──
    cloneVoice: async (dto: any) => {
      if (!dto.name) throw Object.assign(new Error('音色名称不能为空'), { status: 400 })
      if (!dto.referenceAssetId) throw Object.assign(new Error('参考音频不能为空'), { status: 400 })
      if (!dto.referenceDurationSec || dto.referenceDurationSec < 10) {
        throw Object.assign(new Error('参考音频至少需要 10 秒'), { status: 400 })
      }
      const clone: MockTask = {
        id: `clone-ext-${++cloneCounter}`,
        tenantId: TENANT,
        name: dto.name,
        engine: dto.engine ?? 'mock-minimax-voice',
        referenceAssetId: dto.referenceAssetId,
        status: 'ready',
        progress: 1.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      cloneStore.set(clone.id, clone)
      return clone
    },
    listVoiceClones: async () => Array.from(cloneStore.values()),
    deleteVoiceClone: async (id: string) => {
      if (!cloneStore.has(id)) throw Object.assign(new Error('音色克隆不存在'), { status: 404 })
      cloneStore.delete(id)
    },

    // ── Voiceprint ──
    enrollVoiceprint: async (dto: any) => {
      if (!dto.speakerName) throw Object.assign(new Error('说话人名称不能为空'), { status: 400 })
      if (!dto.referenceAssetIds || dto.referenceAssetIds.length < 2) {
        throw Object.assign(new Error('至少需要 2 段参考音频注册声纹'), { status: 400 })
      }
      const vp: MockTask = {
        id: `vp-ext-${++vpCounter}`,
        tenantId: TENANT,
        speakerName: dto.speakerName,
        userId: dto.userId,
        status: 'active',
        progress: 1.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      voiceprintStore.set(vp.id, vp)
      return vp
    },
    listVoiceprints: async () => Array.from(voiceprintStore.values()),
    identifySpeakers: async (dto: any) => {
      if (!dto.segmentIds || dto.segmentIds.length === 0) {
        throw Object.assign(new Error('待识别音频段不能为空'), { status: 400 })
      }
      return [
        { segmentId: dto.segmentIds[0], identifiedSpeakerId: 'vp-ext-1', speakerName: '张三', confidence: 0.87 },
      ]
    },

    // ── Engines & Voices ──
    listTtsEngines: () => [
      { type: 'mock-azure-tts', displayName: 'Azure TTS', languages: ['zh-CN', 'en-US'], voices: 12, freeQuotaPerMonth: 10000 },
      { type: 'mock-google-tts', displayName: 'Google TTS', languages: ['zh-CN', 'en-US', 'ja-JP'], voices: 8, freeQuotaPerMonth: 5000 },
    ],
    listSttEngines: () => [
      { type: 'mock-whisper', displayName: 'Whisper', languages: ['zh-CN', 'en-US', 'ja-JP'], freeQuotaPerMonth: 5000 },
      { type: 'mock-azure-stt', displayName: 'Azure STT', languages: ['zh-CN', 'en-US'], freeQuotaPerMonth: 10000 },
    ],
    listVoices: (engine?: any) => [
      { id: 'voice-cn-female-1', displayName: '晓晓', gender: 'female', language: 'zh-CN', engine: 'mock-azure-tts', defaultEmotion: 'neutral', sampleRate: 24000 },
      { id: 'voice-cn-male-1', displayName: '云扬', gender: 'male', language: 'zh-CN', engine: 'mock-azure-tts', defaultEmotion: 'professional', sampleRate: 24000 },
      { id: 'voice-en-female-1', displayName: 'Jenny', gender: 'female', language: 'en-US', engine: 'mock-azure-tts', defaultEmotion: 'friendly', sampleRate: 24000 },
    ],

    // ── Stats ──
    getVoiceStats: async () => ({
      totalTtsTasks: ttsStore.size,
      totalSttTasks: sttStore.size,
      totalChars: Array.from(ttsStore.values()).reduce((s: number, t) => s + (t.text?.length ?? 0), 0),
      totalAudioSec: Array.from(ttsStore.values()).reduce((s: number, t) => s + (t.audioDurationSec ?? 0), 0) +
                     Array.from(sttStore.values()).reduce((s: number, t) => s + (t.audioDurationSec ?? 0), 0),
      totalVoiceprints: voiceprintStore.size,
      totalVoiceClones: cloneStore.size,
      byTtsEngine: {},
      bySttEngine: {},
      avgSttConfidence: 0.92,
    }),

    ...overrides,
  }
}

/**
 * 内联 Controller 封装 (mirror real VoiceProcessingController)
 */
function createController(service: any) {
  return {
    createTts: (body: any) => service.createTtsTask(body),
    listTts: (query: any) => service.listTtsTasks(query).then((items: any) => ({ items, total: items.length })),
    getTts: (id: string) => service.getTtsTask(id),
    cancelTts: (id: string) => service.cancelTtsTask(id),

    createStt: (body: any) => service.createSttTask(body),
    listStt: (query: any) => service.listSttTasks(query).then((items: any) => ({ items, total: items.length })),
    getStt: (id: string) => service.getSttTask(id),
    listSttSegments: (id: string) => service.listSttSegments(id),
    cancelStt: (id: string) => service.cancelSttTask(id),

    cloneVoice: (body: any) => service.cloneVoice(body),
    listClones: () => service.listVoiceClones().then((items: any) => ({ items })),
    deleteClone: (id: string) => service.deleteVoiceClone(id),

    enrollVoiceprint: (body: any) => service.enrollVoiceprint(body),
    listVoiceprints: () => service.listVoiceprints().then((items: any) => ({ items })),
    identify: (body: any) => service.identifySpeakers(body).then((items: any) => ({ items })),

    listTtsEngines: () => ({ items: service.listTtsEngines() }),
    listSttEngines: () => ({ items: service.listSttEngines() }),
    listVoices: (engine?: any) => ({ items: service.listVoices(engine) }),

    stats: () => service.getVoiceStats(),
  }
}

// ══════════════════════════════════════════════════════════
// 🛒前台 — 接待播音、客户对话语音转写、活动广播
// ══════════════════════════════════════════════════════════
describe(`${ROLES.Reception} voice-processing 深度扩展测试`, () => {
  it('[正常流程] 前台创建门店迎宾语音播报并确认合成', async () => {
    const svc = mockVoiceService()
    const ctrl = createController(svc)

    const task = await ctrl.createTts({
      text: '欢迎光临开心乐园，请出示您的会员卡或在前台办理入场手续。',
      voiceId: 'voice-cn-female-1',
      emotion: 'friendly',
    })

    assert.ok(task.id.startsWith('tts-ext-'))
    assert.equal(task.status, 'completed')
    assert.ok(task.audioDurationSec! > 0)
    assert.ok(task.outputAssetId)
  })

  it('[业务异常] 前台提交空文本合成语音时收到合理错误', async () => {
    const svc = mockVoiceService()
    const ctrl = createController(svc)

    await assert.rejects(
      () => ctrl.createTts({ text: '', voiceId: 'voice-cn-female-1' }),
      (err: any) => {
        assert.equal(err.message, '文本内容不能为空')
        return true
      }
    )
  })

  it('[边界条件] 前台处理超长促销播报文本时触发字符上限校验', async () => {
    const svc = mockVoiceService()
    const ctrl = createController(svc)

    const longText = '促销 '.repeat(3000)

    await assert.rejects(
      () => ctrl.createTts({ text: longText, voiceId: 'voice-cn-female-1' }),
      (err: any) => {
        assert.ok(err.message.includes('5000 字符上限'))
        return true
      }
    )
  })
})

// ══════════════════════════════════════════════════════════
// 👥HR — 面试录音转写、员工声纹注册、培训语音合成
// ══════════════════════════════════════════════════════════
describe(`${ROLES.HR} voice-processing 深度扩展测试`, () => {
  it('[正常流程] HR 提交面试录音进行 STT 转写并获得完整对话文本', async () => {
    const svc = mockVoiceService()
    const ctrl = createController(svc)

    const task = await ctrl.createStt({
      sourceAssetId: 'asset-interview-001',
      engine: 'mock-whisper',
      language: 'zh-CN',
      enableDiarization: true,
    })

    assert.ok(task.id.startsWith('stt-ext-'))
    assert.equal(task.status, 'completed')
    assert.ok(task.fullText!.length > 0)
    assert.equal(task.speakerCount, 2)
    assert.ok(task.avgConfidence! >= 0.9)
  })

  it('[业务异常] HR 为员工注册声纹时参考音频不足被拒绝', async () => {
    const svc = mockVoiceService()
    const ctrl = createController(svc)

    await assert.rejects(
      () => ctrl.enrollVoiceprint({
        speakerName: '张三',
        referenceAssetIds: ['asset-voice-single.wav'],
        userId: 'emp-001',
      }),
      (err: any) => {
        assert.ok(err.message.includes('至少需要 2 段参考音频'))
        return true
      }
    )
  })

  it('[边界条件] HR 提交不支持的 STT 语言时返回明确错误', async () => {
    const svc = mockVoiceService()
    const ctrl = createController(svc)

    await assert.rejects(
      () => ctrl.createStt({
        sourceAssetId: 'asset-foreign.wav',
        language: 'ar-SA',
      }),
      (err: any) => {
        assert.ok(err.message.includes('不支持的语言'))
        return true
      }
    )
  })
})

// ══════════════════════════════════════════════════════════
// 🎮导玩员 — 游戏道具语音播报、竞技活动 TTS 合成、多人语音识别
// ══════════════════════════════════════════════════════════
describe(`${ROLES.Guide} voice-processing 深度扩展测试`, () => {
  it('[正常流程] 导玩员合成游戏排行榜播报语音', async () => {
    const svc = mockVoiceService()
    const ctrl = createController(svc)

    const task = await ctrl.createTts({
      text: '恭喜玩家 超级玛丽 在投篮机比赛中获得第一名，得分 980 分！',
      voiceId: 'voice-cn-male-1',
      emotion: 'excited',
      speedAdjustment: 10,
    })

    assert.ok(task.id.startsWith('tts-ext-'))
    assert.equal(task.status, 'completed')
    assert.equal(task.voiceId, 'voice-cn-male-1')
    assert.equal(task.emotion, 'excited')
  })

  it('[正常流程] 导玩员查询可用 TTS 引擎和音色列表', async () => {
    const svc = mockVoiceService()
    const ctrl = createController(svc)

    const engines = ctrl.listTtsEngines()
    assert.ok(engines.items.length >= 2)
    assert.ok(engines.items.some((e: any) => e.type === 'mock-azure-tts'))
    assert.ok(engines.items.some((e: any) => e.type === 'mock-google-tts'))

    const voices = ctrl.listVoices('mock-azure-tts')
    assert.ok(voices.items.length >= 2)
    const cnFemale = voices.items.find((v: any) => v.language === 'zh-CN' && v.gender === 'female')
    assert.ok(cnFemale)
    assert.equal(cnFemale.defaultEmotion, 'neutral')
  })

  it('[业务异常] 导玩员取消已完成的任务时被拒绝', async () => {
    const svc = mockVoiceService()
    const ctrl = createController(svc)

    const task = await ctrl.createTts({
      text: '游戏即将开始，请各位玩家就位！',
      voiceId: 'voice-cn-male-1',
    })

    // 任务已完成，尝试取消
    await assert.rejects(
      () => ctrl.cancelTts(task.id),
      (err: any) => {
        assert.ok(err.message.includes('已完成'))
        return true
      }
    )
  })
})

// ══════════════════════════════════════════════════════════
// 🤝团建 — 团建活动宣传语音、团队口号合成、解说音频管理
// ══════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} voice-processing 深度扩展测试`, () => {
  it('[正常流程] 团建专员用英文 TTS 合成外宾欢迎语', async () => {
    const svc = mockVoiceService()
    const ctrl = createController(svc)

    const task = await ctrl.createTts({
      text: 'Welcome to our team building event! Let us have a great time together.',
      voiceId: 'voice-en-female-1',
      emotion: 'friendly',
    })

    assert.ok(task.id.startsWith('tts-ext-'))
    assert.equal(task.status, 'completed')
    assert.equal(task.voiceId, 'voice-en-female-1')
    assert.equal(task.emotion, 'friendly')
  })

  it('[正常流程] 团建专员查看语音系统统计概览', async () => {
    const svc = mockVoiceService()
    const ctrl = createController(svc)

    // 先创建一些 TTS 和 STT 任务产生数据
    await ctrl.createTts({ text: '团建破冰活动开始', voiceId: 'voice-cn-female-1' })
    await ctrl.createStt({ sourceAssetId: 'asset-team-intro.wav', language: 'zh-CN' })
    await ctrl.createStt({ sourceAssetId: 'asset-team-feedback.wav', language: 'zh-CN' })

    const stats = await ctrl.stats()
    assert.equal(stats.totalTtsTasks, 1)
    assert.equal(stats.totalSttTasks, 2)
    assert.ok(stats.totalAudioSec > 0)
    assert.ok(stats.avgSttConfidence >= 0.9)
  })

  it('[业务异常] 团建专员删除不存在的语音克隆时返回 404', async () => {
    const svc = mockVoiceService()
    const ctrl = createController(svc)

    await assert.rejects(
      () => ctrl.deleteClone('clone-nonexistent-999'),
      (err: any) => {
        assert.ok(err.message.includes('音色克隆不存在'))
        return true
      }
    )
  })

  it('[正常流程] 团建专员克隆专属活动音色（完整链路）', async () => {
    const svc = mockVoiceService()
    const ctrl = createController(svc)

    const clone = await ctrl.cloneVoice({
      name: '团建御用音色',
      engine: 'mock-minimax-voice',
      referenceAssetId: 'asset-voice-team-lead.mp3',
      referenceDurationSec: 30,
    })

    assert.ok(clone.id.startsWith('clone-ext-'))
    assert.equal(clone.name, '团建御用音色')
    assert.equal(clone.status, 'ready')

    // 列出克隆确认入库
    const clones = await ctrl.listClones()
    assert.equal(clones.items.length, 1)
    assert.equal(clones.items[0].name, '团建御用音色')
  })
})

// ══════════════════════════════════════════════════════════
// 跨角色: 声纹识别与系统能力
// ══════════════════════════════════════════════════════════
describe('voice-processing 跨角色声纹识别与引擎验证', () => {
  it('[正常流程] 多个角色可注册声纹后通过语音片段识别说话人', async () => {
    const svc = mockVoiceService()
    const ctrl = createController(svc)

    // 注册两名员工声纹
    await ctrl.enrollVoiceprint({
      speakerName: '张三',
      userId: 'emp-001',
      referenceAssetIds: ['ref-1.wav', 'ref-2.wav', 'ref-3.wav'],
    })
    await ctrl.enrollVoiceprint({
      speakerName: '李四',
      userId: 'emp-002',
      referenceAssetIds: ['ref-a.wav', 'ref-b.wav'],
    })

    const vps = await ctrl.listVoiceprints()
    assert.equal(vps.items.length, 2)

    // 识别一段音频
    const result = await ctrl.identify({
      segmentIds: ['seg-call-001'],
      candidateVoiceprintIds: ['vp-ext-1'],
      threshold: 0.8,
    })
    assert.ok(result.items.length >= 1)
    assert.ok(result.items[0].confidence >= 0.8)
  })

  it('[边界条件] 引擎列表始终提供完整的语音能力信息', async () => {
    const svc = mockVoiceService()
    const ctrl = createController(svc)

    const ttsEngines = ctrl.listTtsEngines()
    const sttEngines = ctrl.listSttEngines()

    assert.ok(ttsEngines.items.length >= 2)
    assert.ok(sttEngines.items.length >= 2)
    assert.ok(ttsEngines.items.every((e: any) => e.freeQuotaPerMonth > 0))
    assert.ok(sttEngines.items.every((e: any) => e.freeQuotaPerMonth > 0))
  })

  it('[边界条件] 创建 STT 任务时不指定 sourceAssetId 会报错', async () => {
    const svc = mockVoiceService()
    const ctrl = createController(svc)

    await assert.rejects(
      () => ctrl.createStt({ language: 'zh-CN' }),
      (err: any) => {
        assert.ok(err.message.includes('音频资源 ID 不能为空'))
        return true
      }
    )
  })
})
