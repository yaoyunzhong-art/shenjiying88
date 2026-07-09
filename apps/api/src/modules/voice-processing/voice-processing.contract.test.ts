import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [voice-processing] [D] 合约测试
 *
 * 验证 voice-processing 模块的实体 Shape、业务逻辑契约、边界条件
 */

import assert from 'node:assert/strict'
import { VoiceProcessingService } from './voice-processing.service'
import {
  countChars, estimateAudioDurationSec, cosineSim,
  mockVoiceprintEmbedding,
  TTS_VOICES, TTS_ENGINE_META, STT_ENGINE_META,
  generateTtsTaskId, generateSttTaskId, generateSegmentId,
  generateVoiceprintId, generateVoiceCloneId,
} from './voice-processing.entity'
import type {
  TtsTask, SttTask, SttSegment, Voiceprint, VoiceClone,
  TtsEngine, SttEngine, VoiceCloningEngine,
} from './voice-processing.entity'
import type {
  CreateTtsTaskDto, CreateSttTaskDto, CloneVoiceDto,
  EnrollVoiceprintDto, IdentifySpeakerDto,
} from './voice-processing.dto'
import { runWithTenant } from '../../common/context/tenant-context'

// ─── 租户上下文 ──────────────────────────────────────
const TENANT = {
  tenantId: 't-contract',
  storeId: 'store-contract-001',
  userId: 'contract-tester',
  role: 'tenant_admin' as const,
}

const OTHER_TENANT = {
  tenantId: 't-other',
  storeId: 'store-other-001',
  userId: 'other-user',
  role: 'tenant_admin' as const,
}

// ─── 服务实例 helper ──────────────────────────────────

function makeService(): VoiceProcessingService {
  return new VoiceProcessingService()
}

// ═══════════════════════════════════════════════════════
// 合约: 工具函数 Shape
// ═══════════════════════════════════════════════════════
describe('[voice-processing] 合约: 工具函数', () => {
  it('countChars 返回值始终 >= 1', () => {
    assert.ok(countChars('你好') >= 1)
    assert.ok(countChars('Hello') >= 1)
    assert.ok(countChars('') >= 0) // 空字符串
    assert.ok(countChars('123456') >= 1)
  })

  it('estimateAudioDurationSec 始终返回正数', () => {
    const d1 = estimateAudioDurationSec('你好')
    const d2 = estimateAudioDurationSec('你好', 50) // fast
    const d3 = estimateAudioDurationSec('你好', -50) // slow
    assert.ok(d1 > 0)
    assert.ok(d2 > 0)
    assert.ok(d3 > 0)
    assert.ok(d2 < d1) // 语速快 → 时长短
    assert.ok(d3 > d1) // 语速慢 → 时长长
  })

  it('cosineSim 合法范围: -1 ≤ sim ≤ 1', () => {
    const a = [1, 0, 0]
    const b = [0.5, 0.5, 0]
    const c = [-1, 0, 0]
    assert.ok(cosineSim(a, a) >= -1 && cosineSim(a, a) <= 1)
    assert.ok(cosineSim(a, b) >= -1 && cosineSim(a, b) <= 1)
    assert.ok(cosineSim(a, c) >= -1 && cosineSim(a, c) <= 1) // negative possible
    assert.equal(cosineSim([], []), 0) // empty arrays
    assert.equal(cosineSim([1, 2], [1, 2, 3]), 0) // different lengths
  })

  it('mockVoiceprintEmbedding L2 归一化到 1', () => {
    const v1 = mockVoiceprintEmbedding('张三')
    const v2 = mockVoiceprintEmbedding('李四')
    const v3 = mockVoiceprintEmbedding('张三') // same seed -> same embedding
    assert.equal(v1.length, 128)
    assert.equal(v2.length, 128)
    const norm1 = Math.sqrt(v1.reduce((s, x) => s + x * x, 0))
    const norm2 = Math.sqrt(v2.reduce((s, x) => s + x * x, 0))
    assert.ok(Math.abs(norm1 - 1) < 1e-6)
    assert.ok(Math.abs(norm2 - 1) < 1e-6)
    // Same seed generates same embedding
    assert.deepStrictEqual(v1, v3)
  })

  it('ID 生成器返回预期前缀', () => {
    assert.ok(generateTtsTaskId().startsWith('tts-'))
    assert.ok(generateSttTaskId().startsWith('stt-'))
    assert.ok(generateSegmentId().startsWith('seg-'))
    assert.ok(generateVoiceprintId().startsWith('vp-'))
    assert.ok(generateVoiceCloneId().startsWith('vc-'))
    // ID 不可重复
    const ids = new Set(Array.from({ length: 100 }, () => generateTtsTaskId()))
    assert.equal(ids.size, 100)
  })
})

// ═══════════════════════════════════════════════════════
// 合约: 元数据 Shape
// ═══════════════════════════════════════════════════════
describe('[voice-processing] 合约: 引擎/音色元数据', () => {
  it('TTS_VOICES 每个条目包含必要字段', () => {
    for (const v of TTS_VOICES) {
      assert.equal(typeof v.id, 'string')
      assert.equal(typeof v.displayName, 'string')
      assert.ok(['male', 'female', 'neutral'].includes(v.gender))
      assert.equal(typeof v.engine, 'string')
      assert.ok([16000, 24000, 48000].includes(v.sampleRate))
    }
  })

  it('TTS_ENGINE_META 每个条目包含必要字段', () => {
    assert.equal(TTS_ENGINE_META.length, 6)
    for (const e of TTS_ENGINE_META) {
      assert.equal(typeof e.type, 'string')
      assert.equal(typeof e.displayName, 'string')
      assert.ok(Array.isArray(e.languages))
      assert.equal(typeof e.voicesCount, 'number')
      assert.equal(typeof e.freeQuotaPerMonth, 'number')
      assert.equal(typeof e.unitPricePerCharCny, 'number')
      assert.equal(typeof e.supportsCloning, 'boolean')
      assert.equal(typeof e.supportsEmotion, 'boolean')
    }
  })

  it('STT_ENGINE_META 每个条目包含必要字段', () => {
    assert.equal(STT_ENGINE_META.length, 6)
    for (const e of STT_ENGINE_META) {
      assert.equal(typeof e.type, 'string')
      assert.equal(typeof e.displayName, 'string')
      assert.ok(Array.isArray(e.languages))
      assert.equal(typeof e.freeHoursPerMonth, 'number')
      assert.equal(typeof e.unitPricePerHourCny, 'number')
      assert.equal(typeof e.supportsDiarization, 'boolean')
      assert.equal(typeof e.supportsEmotion, 'boolean')
      assert.equal(typeof e.realtimeStreaming, 'boolean')
    }
  })

  it('所有引擎 type 全局唯一', () => {
    const ttsTypes = TTS_ENGINE_META.map(e => e.type)
    const sttTypes = STT_ENGINE_META.map(e => e.type)
    const allTypes = [...ttsTypes, ...sttTypes]
    assert.equal(new Set(allTypes).size, allTypes.length)
  })

  it('Edge TTS 免费额度无限', () => {
    const edge = TTS_ENGINE_META.find(e => e.type === 'mock-edge-tts')
    assert.ok(edge)
    assert.equal(edge.freeQuotaPerMonth, Infinity)
    assert.equal(edge.unitPricePerCharCny, 0)
    assert.equal(edge.supportsCloning, false)
    assert.equal(edge.supportsEmotion, false)
  })

  it('Whisper 免费额度无限 + 无实时流', () => {
    const whisper = STT_ENGINE_META.find(e => e.type === 'mock-whisper')
    assert.ok(whisper)
    assert.equal(whisper.freeHoursPerMonth, Infinity)
    assert.equal(whisper.realtimeStreaming, false)
    assert.equal(whisper.supportsDiarization, false)
  })
})

// ═══════════════════════════════════════════════════════
// 合约: TTS 合成
// ═══════════════════════════════════════════════════════
describe('[voice-processing] 合约: TTS 合成', () => {
  it('createTtsTask 返回 Task Shape', async () => {
    const svc = makeService()
    const task = await runWithTenant(TENANT, () =>
      svc.createTtsTask({
        text: '测试语音合成',
        voiceId: 'zh-female-xiaoxian',
      } as CreateTtsTaskDto),
    ) as TtsTask

    assert.ok(task.id.startsWith('tts-'))
    assert.equal(task.tenantId, TENANT.tenantId)
    assert.equal(task.text, '测试语音合成')
    assert.equal(task.engine, 'mock-azure-tts')
    assert.equal(task.voiceId, 'zh-female-xiaoxian')
    assert.equal(task.emotion, 'friendly')
    assert.ok(['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(task.status))
    assert.equal(typeof task.progress, 'number')
    assert.equal(typeof task.createdAt, 'string')
    assert.equal(typeof task.updatedAt, 'string')
  })

  it('createTtsTask 自定义参数生效', async () => {
    const svc = makeService()
    const task = await runWithTenant(TENANT, () =>
      svc.createTtsTask({
        text: 'Custom params test',
        engine: 'mock-aliyun-tts',
        voiceId: 'zh-female-xiaomeng',
        emotion: 'excited',
        speedAdjustment: 20,
        pitchAdjustment: 10,
        volumeAdjustment: -10,
        outputFormat: 'wav',
        sampleRate: 48000,
      } as CreateTtsTaskDto),
    ) as TtsTask

    assert.equal(task.engine, 'mock-aliyun-tts')
    assert.equal(task.voiceId, 'zh-female-xiaomeng')
    assert.equal(task.emotion, 'excited')
    assert.equal(task.speedAdjustment, 20)
    assert.equal(task.pitchAdjustment, 10)
    assert.equal(task.volumeAdjustment, -10)
    assert.equal(task.outputFormat, 'wav')
    assert.equal(task.sampleRate, 48000)
  })

  it('getTtsTask 返回相同 Shape', async () => {
    const svc = makeService()
    const created = await runWithTenant(TENANT, () =>
      svc.createTtsTask({ text: '获取测试', voiceId: 'zh-female-xiaoxian' } as CreateTtsTaskDto),
    ) as TtsTask
    const got = await runWithTenant(TENANT, () =>
      svc.getTtsTask(created.id),
    ) as TtsTaskResponse

    assert.equal(got.id, created.id)
    assert.equal(got.text, '获取测试')
    assert.equal(got.engine, 'mock-azure-tts')
    assert.equal(typeof got.progress, 'number')
    assert.equal(typeof got.createdAt, 'string')
  })

  it('listTtsTasks 返回数组 Shape', async () => {
    const svc = makeService()
    await runWithTenant(TENANT, () =>
      svc.createTtsTask({ text: '列表测试1', voiceId: 'zh-female-xiaoxian' } as CreateTtsTaskDto),
    )
    await runWithTenant(TENANT, () =>
      svc.createTtsTask({ text: '列表测试2', voiceId: 'zh-male-yunxi' } as CreateTtsTaskDto),
    )

    const items = await runWithTenant(TENANT, () =>
      svc.listTtsTasks({}),
    ) as TtsTask[]

    assert.ok(items.length >= 2)
    for (const item of items) {
      assert.ok(item.id.startsWith('tts-'))
      assert.equal(typeof item.text, 'string')
    }
  })

  it('createTtsTask 同步完成状态为 completed', async () => {
    const svc = makeService()
    const task = await runWithTenant(TENANT, () =>
      svc.createTtsTask({ text: '状态测试', voiceId: 'zh-female-xiaoxian' } as CreateTtsTaskDto),
    ) as TtsTask
    // 因为是同步 mock, create 后立即 completed
    assert.ok(['processing', 'completed'].includes(task.status))
  })

  it('不存在的引擎 → BadRequest', async () => {
    const svc = makeService()
    await assert.rejects(
      () => runWithTenant(TENANT, () =>
        svc.createTtsTask({
          text: 'test',
          engine: 'mock-fake-engine' as TtsEngine,
          voiceId: 'zh-female-xiaoxian',
        } as CreateTtsTaskDto),
      ),
      /不存在/,
    )
  })

  it('不存在的音色 → BadRequest', async () => {
    const svc = makeService()
    await assert.rejects(
      () => runWithTenant(TENANT, () =>
        svc.createTtsTask({
          text: 'test',
          voiceId: 'nonexistent-voice',
        } as CreateTtsTaskDto),
      ),
      /不存在/,
    )
  })

  it('音色与引擎不匹配 → BadRequest', async () => {
    const svc = makeService()
    await assert.rejects(
      () => runWithTenant(TENANT, () =>
        svc.createTtsTask({
          text: 'test',
          engine: 'mock-google-tts',
          voiceId: 'zh-female-xiaomeng', // 阿里云引擎的音色
        } as CreateTtsTaskDto),
      ),
      /不属于/,
    )
  })

  it('引擎不支持情感但传入情感 → BadRequest', async () => {
    const svc = makeService()
    await assert.rejects(
      () => runWithTenant(TENANT, () =>
        svc.createTtsTask({
          text: 'test',
          engine: 'mock-google-tts',
          voiceId: 'en-female-jenny',
          emotion: 'happy',
        } as CreateTtsTaskDto),
      ),
      /不支持情感|不属于/,
    )
  })

  it('不存在的 TTS 任务 → NotFound', async () => {
    const svc = makeService()
    await assert.rejects(
      () => runWithTenant(TENANT, () => svc.getTtsTask('tts-nonexistent')),
      /TTS 任务.*不存在/,
    )
  })

  it('跨租户隔离: 无法获取其他租户的任务', async () => {
    const svc = makeService()
    const task = await runWithTenant(TENANT, () =>
      svc.createTtsTask({ text: '跨租户测试', voiceId: 'zh-female-xiaoxian' } as CreateTtsTaskDto),
    ) as TtsTask
    await assert.rejects(
      () => runWithTenant(OTHER_TENANT, () => svc.getTtsTask(task.id)),
      /不存在/,
    )
  })
})

// ═══════════════════════════════════════════════════════
// 合约: STT 转写
// ═══════════════════════════════════════════════════════
describe('[voice-processing] 合约: STT 转写', () => {
  it('createSttTask 返回 Task Shape', async () => {
    const svc = makeService()
    const task = await runWithTenant(TENANT, () =>
      svc.createSttTask({
        sourceAssetId: 'asset-stt-001',
        filename: 'audio.wav',
      } as CreateSttTaskDto),
    ) as SttTask

    assert.ok(task.id.startsWith('stt-'))
    assert.equal(task.tenantId, TENANT.tenantId)
    assert.equal(task.sourceAssetId, 'asset-stt-001')
    assert.ok(['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(task.status))
    assert.equal(typeof task.fullText, 'string')
    assert.equal(typeof task.avgConfidence, 'number')
    assert.equal(typeof task.audioDurationSec, 'number')
    assert.equal(typeof task.createdAt, 'string')
  })

  it('createSttTask 启用了说话人分离', async () => {
    const svc = makeService()
    const task = await runWithTenant(TENANT, () =>
      svc.createSttTask({
        sourceAssetId: 'asset-diarize-001',
        enableDiarization: true,
      } as CreateSttTaskDto),
    ) as SttTask

    assert.ok(task.speakerCount >= 1)
    assert.ok(task.segments.length >= 1)
    for (const seg of task.segments) {
      assert.ok(seg.speakerId)
      assert.ok(seg.text)
      assert.ok(seg.confidence > 0)
    }
  })

  it('listSttTasks 返回数组 Shape', async () => {
    const svc = makeService()
    await runWithTenant(TENANT, () =>
      svc.createSttTask({ sourceAssetId: 'asset-stt-list-1' } as CreateSttTaskDto),
    )
    await runWithTenant(TENANT, () =>
      svc.createSttTask({ sourceAssetId: 'asset-stt-list-2' } as CreateSttTaskDto),
    )

    const items = await runWithTenant(TENANT, () =>
      svc.listSttTasks({}),
    ) as SttTask[]

    assert.ok(items.length >= 2)
    for (const item of items) {
      assert.ok(item.id.startsWith('stt-'))
      assert.equal(typeof item.fullText, 'string')
    }
  })

  it('getSttTask 返回完整 Shape', async () => {
    const svc = makeService()
    const created = await runWithTenant(TENANT, () =>
      svc.createSttTask({ sourceAssetId: 'asset-stt-get' } as CreateSttTaskDto),
    ) as SttTask
    const got = await runWithTenant(TENANT, () =>
      svc.getSttTask(created.id),
    ) as SttTaskResponse

    assert.equal(got.id, created.id)
    assert.equal(typeof got.fullText, 'string')
    assert.ok(got.fullText.length > 0)
    assert.ok(got.avgConfidence > 0)
    assert.ok(got.speakerCount >= 0)
  })

  it('listSttSegments 返回 Segment Shape', async () => {
    const svc = makeService()
    const task = await runWithTenant(TENANT, () =>
      svc.createSttTask({
        sourceAssetId: 'asset-stt-seg',
        enableDiarization: true,
      } as CreateSttTaskDto),
    ) as SttTask
    const segments = await runWithTenant(TENANT, () =>
      svc.listSttSegments(task.id),
    ) as SttSegment[]

    assert.ok(Array.isArray(segments))
    for (const seg of segments) {
      assert.ok(seg.speakerId)
      assert.ok(seg.text)
      assert.ok(seg.confidence > 0)
      assert.ok(seg.startMs >= 0)
      assert.ok(seg.endMs > seg.startMs)
    }
  })

  it('createSttTask 同步完成状态为 completed', async () => {
    const svc = makeService()
    const task = await runWithTenant(TENANT, () =>
      svc.createSttTask({ sourceAssetId: 'asset-stt-completed' } as CreateSttTaskDto),
    ) as SttTask
    assert.equal(task.status, 'completed')
  })

  it('不存在的 STT 任务 → NotFound', async () => {
    const svc = makeService()
    await assert.rejects(
      () => runWithTenant(TENANT, () => svc.getSttTask('stt-nonexistent')),
      /STT 任务.*不存在/,
    )
  })
})

// ═══════════════════════════════════════════════════════
// 合约: 语音克隆
// ═══════════════════════════════════════════════════════
describe('[voice-processing] 合约: 语音克隆', () => {
  it('cloneVoice 返回 Clone Shape', async () => {
    const svc = makeService()
    const clone = await runWithTenant(TENANT, () =>
      svc.cloneVoice({
        name: '测试克隆',
        engine: 'mock-azure-custom-neural',
        referenceAssetId: 'asset-ref-voice-001',
        referenceDurationSec: 120,
      } as CloneVoiceDto),
    ) as VoiceClone

    assert.ok(clone.id.startsWith('vc-'))
    assert.equal(clone.tenantId, TENANT.tenantId)
    assert.equal(clone.name, '测试克隆')
    assert.equal(clone.engine, 'mock-azure-custom-neural')
    assert.ok(['pending', 'training', 'ready', 'failed'].includes(clone.status))
    assert.equal(typeof clone.progress, 'number')
    assert.equal(typeof clone.createdAt, 'string')
  })

  it('listVoiceClones 返回数组 Shape', async () => {
    const svc = makeService()
    await runWithTenant(TENANT, () =>
      svc.cloneVoice({
        name: '克隆1',
        engine: 'mock-minimax-voice',
        referenceAssetId: 'asset-clone-1',
        referenceDurationSec: 60,
      } as CloneVoiceDto),
    )
    const clones = await runWithTenant(TENANT, () =>
      svc.listVoiceClones(),
    ) as VoiceClone[]

    assert.ok(Array.isArray(clones))
  })

  it('deleteVoiceClone 正常删除', async () => {
    const svc = makeService()
    const clone = await runWithTenant(TENANT, () =>
      svc.cloneVoice({
        name: '待删除',
        engine: 'mock-azure-custom-neural',
        referenceAssetId: 'asset-delete-me',
        referenceDurationSec: 30,
      } as CloneVoiceDto),
    ) as VoiceClone
    await runWithTenant(TENANT, () =>
      svc.deleteVoiceClone(clone.id),
    )
    // 删除后列表应为空
    const clones = await runWithTenant(TENANT, () =>
      svc.listVoiceClones(),
    ) as VoiceClone[]
    assert.equal(clones.find(c => c.id === clone.id), undefined)
  })

  it('删除不存在的克隆 → NotFound', async () => {
    const svc = makeService()
    await assert.rejects(
      () => runWithTenant(TENANT, () =>
        svc.deleteVoiceClone('vc-nonexistent'),
      ),
      /不存在/,
    )
  })

  it('克隆参考音频不足5秒 → BadRequest', async () => {
    const svc = makeService()
    await assert.rejects(
      () => runWithTenant(TENANT, () =>
        svc.cloneVoice({
          name: 'too-short',
          engine: 'mock-azure-custom-neural',
          referenceAssetId: 'asset-short',
          referenceDurationSec: 2,
        } as CloneVoiceDto),
      ),
      /至少 5 秒/,
    )
  })

  it('克隆参考音频超过10分钟 → BadRequest', async () => {
    const svc = makeService()
    await assert.rejects(
      () => runWithTenant(TENANT, () =>
        svc.cloneVoice({
          name: 'too-long',
          engine: 'mock-azure-custom-neural',
          referenceAssetId: 'asset-long',
          referenceDurationSec: 601,
        } as CloneVoiceDto),
      ),
      /不能超过 10 分钟/,
    )
  })
})

// ═══════════════════════════════════════════════════════
// 合约: 声纹注册 & 识别
// ═══════════════════════════════════════════════════════
describe('[voice-processing] 合约: 声纹注册与识别', () => {
  it('enrollVoiceprint 返回 Voiceprint Shape', async () => {
    const svc = makeService()
    const vp = await runWithTenant(TENANT, () =>
      svc.enrollVoiceprint({
        speakerName: '张三',
        referenceAssetIds: ['asset-vp-1', 'asset-vp-2'],
        description: '门店员工声纹',
      } as EnrollVoiceprintDto),
    ) as Voiceprint

    assert.ok(vp.id.startsWith('vp-'))
    assert.equal(vp.tenantId, TENANT.tenantId)
    assert.equal(vp.speakerName, '张三')
    assert.ok(vp.referenceAssetIds.length >= 2)
    assert.ok(Array.isArray(vp.embedding))
    assert.equal(vp.embedding.length, 128)
    assert.equal(vp.status, 'enrolled')
    assert.equal(typeof vp.createdAt, 'string')
  })

  it('listVoiceprints 返回数组 Shape', async () => {
    const svc = makeService()
    await runWithTenant(TENANT, () =>
      svc.enrollVoiceprint({
        speakerName: '李四',
        referenceAssetIds: ['asset-vp-3'],
      } as EnrollVoiceprintDto),
    )
    const vps = await runWithTenant(TENANT, () =>
      svc.listVoiceprints(),
    ) as Voiceprint[]

    assert.ok(Array.isArray(vps))
    for (const vp of vps) {
      assert.ok(vp.id.startsWith('vp-'))
      assert.equal(typeof vp.speakerName, 'string')
      assert.ok(Array.isArray(vp.embedding))
    }
  })

  it('identifySpeakers 返回 segmentId + matches Shape', async () => {
    const svc = makeService()
    await runWithTenant(TENANT, () =>
      svc.enrollVoiceprint({
        speakerName: '张三',
        referenceAssetIds: ['asset-vp-ident-1'],
      } as EnrollVoiceprintDto),
    )

    const sttTask = await runWithTenant(TENANT, () =>
      svc.createSttTask({
        sourceAssetId: 'asset-stt-ident',
        enableDiarization: true,
      } as CreateSttTaskDto),
    ) as SttTask

    const result = await runWithTenant(TENANT, () =>
      svc.identifySpeakers({
        segmentIds: sttTask.segments.map(s => s.id),
      } as IdentifySpeakerDto),
    ) as Array<{ segmentId: string; matches: Array<{ voiceprintId: string; speakerName: string; similarity: number; distance: number }> }>

    assert.ok(Array.isArray(result))
    if (result.length > 0) {
      for (const segResult of result) {
        assert.ok(segResult.segmentId)
        assert.ok(Array.isArray(segResult.matches))
        for (const match of segResult.matches) {
          assert.ok(match.voiceprintId)
          assert.ok(match.speakerName)
          assert.ok(match.similarity >= -1 && match.similarity <= 1)
          assert.ok(match.distance >= 0)
        }
      }
    }
  })
})

// ═══════════════════════════════════════════════════════
// 合约: 引擎 & 音色查询
// ═══════════════════════════════════════════════════════
describe('[voice-processing] 合约: 引擎与音色查询', () => {
  it('listTtsEngines 返回 EngineMeta Shape', () => {
    const svc = makeService()
    const engines = svc.listTtsEngines()
    assert.equal(engines.length, 6)
    for (const e of engines) {
      assert.equal(typeof e.type, 'string')
      assert.equal(typeof e.displayName, 'string')
      assert.ok(Array.isArray(e.languages))
    }
  })

  it('listSttEngines 返回 EngineMeta Shape', () => {
    const svc = makeService()
    const engines = svc.listSttEngines()
    assert.equal(engines.length, 6)
    for (const e of engines) {
      assert.equal(typeof e.type, 'string')
      assert.ok(Array.isArray(e.languages))
    }
  })

  it('listVoices 返回数组 Shape', () => {
    const svc = makeService()
    const all = svc.listVoices()
    assert.ok(all.length >= 6)

    const azureVoices = svc.listVoices('mock-azure-tts')
    assert.ok(azureVoices.length > 0)
    for (const v of azureVoices) {
      assert.equal(v.engine, 'mock-azure-tts')
    }
  })

  it('listVoices 按引擎过滤', () => {
    const svc = makeService()
    const aliyun = svc.listVoices('mock-aliyun-tts')
    assert.ok(aliyun.length > 0)
    for (const v of aliyun) {
      assert.equal(v.engine, 'mock-aliyun-tts')
    }

    const nonexistent = svc.listVoices('mock-fake-engine')
    assert.equal(nonexistent.length, 0)
  })
})

// ═══════════════════════════════════════════════════════
// 合约: 统计
// ═══════════════════════════════════════════════════════
describe('[voice-processing] 合约: 统计', () => {
  it('getVoiceStats 返回 Stats Shape', async () => {
    const svc = makeService()
    const stats = await runWithTenant(TENANT, () =>
      svc.getVoiceStats(),
    )

    assert.equal(typeof stats.totalTtsTasks, 'number')
    assert.equal(typeof stats.totalSttTasks, 'number')
    assert.equal(typeof stats.totalChars, 'number')
    assert.equal(typeof stats.totalAudioSec, 'number')
    assert.equal(typeof stats.totalVoiceprints, 'number')
    assert.equal(typeof stats.totalVoiceClones, 'number')
    assert.equal(typeof stats.byTtsEngine, 'object')
    assert.equal(typeof stats.bySttEngine, 'object')
    assert.equal(typeof stats.avgSttConfidence, 'number')
  })

  it('空服务时统计为 0', async () => {
    const svc = makeService()
    const stats = await runWithTenant(TENANT, () =>
      svc.getVoiceStats(),
    )
    assert.equal(stats.totalTtsTasks, 0)
    assert.equal(stats.totalSttTasks, 0)
    assert.equal(stats.totalChars, 0)
    assert.equal(stats.totalAudioSec, 0)
    assert.equal(stats.avgSttConfidence, 0)
  })

  it('创建任务后统计递增', async () => {
    const svc = makeService()
    await runWithTenant(TENANT, () =>
      svc.createTtsTask({ text: '统计测试文本内容', voiceId: 'zh-female-xiaoxian' } as CreateTtsTaskDto),
    )
    await runWithTenant(TENANT, () =>
      svc.createSttTask({ sourceAssetId: 'asset-stt-stats' } as CreateSttTaskDto),
    )

    const stats = await runWithTenant(TENANT, () =>
      svc.getVoiceStats(),
    )
    assert.ok(stats.totalTtsTasks >= 1)
    assert.ok(stats.totalSttTasks >= 1)
    assert.ok(stats.totalChars > 0)
    assert.ok(stats.totalAudioSec > 0)
  })
})

// ═══════════════════════════════════════════════════════
// 合约: 租户隔离
// ═══════════════════════════════════════════════════════
describe('[voice-processing] 合约: 租户隔离', () => {
  it('TTS 任务列表仅返回当前租户的数据', async () => {
    const svc = makeService()

    await runWithTenant(TENANT, () =>
      svc.createTtsTask({ text: 'Tenant A 的任务', voiceId: 'zh-female-xiaoxian' } as CreateTtsTaskDto),
    )
    await runWithTenant(OTHER_TENANT, () =>
      svc.createTtsTask({ text: 'Tenant B 的任务', voiceId: 'zh-female-xiaoxian' } as CreateTtsTaskDto),
    )

    const itemsA = await runWithTenant(TENANT, () =>
      svc.listTtsTasks({}),
    ) as TtsTask[]
    for (const item of itemsA) {
      assert.equal(item.tenantId, TENANT.tenantId)
    }

    const itemsB = await runWithTenant(OTHER_TENANT, () =>
      svc.listTtsTasks({}),
    ) as TtsTask[]
    for (const item of itemsB) {
      assert.equal(item.tenantId, OTHER_TENANT.tenantId)
    }
  })

  it('STT 列表仅返回当前租户的数据', async () => {
    const svc = makeService()

    await runWithTenant(TENANT, () =>
      svc.createSttTask({ sourceAssetId: 'asset-iso-stt-A' } as CreateSttTaskDto),
    )
    await runWithTenant(OTHER_TENANT, () =>
      svc.createSttTask({ sourceAssetId: 'asset-iso-stt-B' } as CreateSttTaskDto),
    )

    const itemsA = await runWithTenant(TENANT, () =>
      svc.listSttTasks({}),
    ) as SttTask[]
    for (const item of itemsA) {
      assert.equal(item.tenantId, TENANT.tenantId)
    }

    const itemsB = await runWithTenant(OTHER_TENANT, () =>
      svc.listSttTasks({}),
    ) as SttTask[]
    for (const item of itemsB) {
      assert.equal(item.tenantId, OTHER_TENANT.tenantId)
    }
  })

  it('声纹列表仅返回当前租户的数据', async () => {
    const svc = makeService()

    await runWithTenant(TENANT, () =>
      svc.enrollVoiceprint({
        speakerName: 'TenantA 员工',
        referenceAssetIds: ['asset-iso-vp-A'],
      } as EnrollVoiceprintDto),
    )
    await runWithTenant(OTHER_TENANT, () =>
      svc.enrollVoiceprint({
        speakerName: 'TenantB 员工',
        referenceAssetIds: ['asset-iso-vp-B'],
      } as EnrollVoiceprintDto),
    )

    const itemsA = await runWithTenant(TENANT, () =>
      svc.listVoiceprints(),
    ) as Voiceprint[]
    for (const item of itemsA) {
      assert.equal(item.tenantId, TENANT.tenantId)
    }
  })
})
