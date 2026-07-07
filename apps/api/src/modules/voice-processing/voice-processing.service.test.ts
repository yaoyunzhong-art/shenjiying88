import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase 102 语音处理 Service Tests (V11 Sprint 3 Day 38)
 *
 * 22 tests 覆盖:
 * - 工具函数 (3) - countChars / estimateAudioDurationSec / cosineSim
 * - 引擎/音色元数据 (3)
 * - TTS CRUD (3)
 * - TTS 引擎校验 (2)
 * - STT CRUD (3)
 * - STT Diarization + 情绪 (2)
 * - 语音克隆 (2)
 * - 声纹注册 + 识别 (2)
 * - 任务取消 (1)
 * - 跨租户隔离 (1)
 */

import assert from 'node:assert/strict'
import { VoiceProcessingService } from './voice-processing.service'
import {
  countChars, estimateAudioDurationSec, cosineSim,
  TTS_VOICES, TTS_ENGINE_META, STT_ENGINE_META,
  generateTtsTaskId, generateSttTaskId, generateSegmentId,
  generateVoiceprintId, generateVoiceCloneId,
  mockVoiceprintEmbedding,
} from './voice-processing.entity'
import { runWithTenant } from '../../common/context/tenant-context'

const TENANT_A = {
  tenantId: 'tenant-A', storeId: 'store-001', userId: 'admin-A',
  role: 'tenant_admin' as const,
}
const TENANT_B = {
  tenantId: 'tenant-B', storeId: 'store-002', userId: 'admin-B',
  role: 'tenant_admin' as const,
}

const SHARED_SERVICE = new VoiceProcessingService()

describe('Phase 102 语音处理 (V11 Sprint 3 Day 38)', () => {
  // ============ 1. 工具函数 (3) ============
  describe('1. 工具函数', () => {
    it('countChars 中文 1 / 英文 0.5', () => {
      // '你好world' = 2 中文 + 5 英文 = 2 + 2.5 = 4.5 → ceil → 5
      const c1 = countChars('你好world')
      assert.ok(c1 >= 4 && c1 <= 5)
      const c2 = countChars('Hello World')
      // 10 chars 英文 = 10*0.5 = 5
      assert.ok(c2 >= 4 && c2 <= 6)
    })

    it('estimateAudioDurationSec 文本越长 → 时长越长', () => {
      const short = estimateAudioDurationSec('你好')
      const long = estimateAudioDurationSec('这是一段非常长的文本用来估算音频时长,应该比短文本更长')
      assert.ok(long > short)
      assert.ok(short > 0)
    })

    it('cosineSim 相同 = 1, 正交 = 0', () => {
      assert.ok(Math.abs(cosineSim([1, 0, 0], [1, 0, 0]) - 1) < 1e-10)
      assert.ok(Math.abs(cosineSim([1, 0, 0], [0, 1, 0]) - 0) < 1e-10)
      // 不同长度
      assert.equal(cosineSim([1, 0], [1, 0, 0]), 0)
    })

    it('mockVoiceprintEmbedding L2 归一化', () => {
      const v = mockVoiceprintEmbedding('test')
      assert.equal(v.length, 128)
      const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0))
      assert.ok(Math.abs(norm - 1) < 1e-6)
    })
  })

  // ============ 2. 引擎/音色元数据 (3) ============
  describe('2. 元数据', () => {
    it('TTS_ENGINE_META 6 个引擎', () => {
      assert.equal(TTS_ENGINE_META.length, 6)
      assert.ok(TTS_ENGINE_META.some((e) => e.type === 'mock-azure-tts'))
      assert.ok(TTS_ENGINE_META.some((e) => e.type === 'mock-edge-tts'))
    })

    it('STT_ENGINE_META 6 个引擎', () => {
      assert.equal(STT_ENGINE_META.length, 6)
      assert.ok(STT_ENGINE_META.some((e) => e.type === 'mock-whisper'))
      assert.ok(STT_ENGINE_META.some((e) => e.type === 'mock-iflytek'))
    })

    it('TTS_VOICES 至少 6 个音色', () => {
      assert.ok(TTS_VOICES.length >= 6)
      assert.ok(TTS_VOICES.some((v) => v.language === 'zh-CN'))
      assert.ok(TTS_VOICES.some((v) => v.language === 'en-US'))
    })

    it('ID 生成器', () => {
      assert.ok(generateTtsTaskId().startsWith('tts-'))
      assert.ok(generateSttTaskId().startsWith('stt-'))
      assert.ok(generateSegmentId().startsWith('seg-'))
      assert.ok(generateVoiceprintId().startsWith('vp-'))
      assert.ok(generateVoiceCloneId().startsWith('vc-'))
    })
  })

  // ============ 3. TTS CRUD (3) ============
  describe('3. TTS 合成', () => {
    it('创建 TTS 任务 → 输出资产', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createTtsTask({
          text: '欢迎使用审计云平台,这是一个 TTS 测试',
          engine: 'mock-azure-tts',
          voiceId: 'zh-female-xiaoxian',
        }),
      )
      assert.equal(task.status, 'completed')
      assert.equal(task.engine, 'mock-azure-tts')
      assert.equal(task.voiceId, 'zh-female-xiaoxian')
      assert.ok(task.outputAssetId)
      assert.ok(task.audioDurationSec! > 0)
    })

    it('emotion + speedAdjustment 调节', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createTtsTask({
          text: '你好世界',
          engine: 'mock-aliyun-tts',
          voiceId: 'zh-female-xiaomeng',
          emotion: 'happy',
          speedAdjustment: 20,
          pitchAdjustment: 5,
        }),
      )
      assert.equal(task.emotion, 'happy')
      assert.equal(task.speedAdjustment, 20)
      assert.equal(task.pitchAdjustment, 5)
    })

    it('listTtsTasks 按引擎过滤', async () => {
      // 添加 1 个额外的 azure task
      await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createTtsTask({
          text: 'second azure task',
          engine: 'mock-azure-tts',
          voiceId: 'zh-female-xiaoxian',
        }),
      )
      const items = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.listTtsTasks({ engine: 'mock-azure-tts', limit: 100 }),
      )
      assert.ok(items.length >= 1)
      for (const i of items) assert.equal(i.engine, 'mock-azure-tts')
    })
  })

  // ============ 4. TTS 引擎校验 (2) ============
  describe('4. TTS 引擎校验', () => {
    it('音色不属于引擎被拒', async () => {
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () =>
          SHARED_SERVICE.createTtsTask({
            text: 'test',
            engine: 'mock-google-tts', // voiceId 是 azure-tts
            voiceId: 'zh-female-xiaoxian',
          }),
        ),
        /不属于引擎/,
      )
    })

    it('非法引擎被拒', async () => {
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () =>
          SHARED_SERVICE.createTtsTask({
            text: 'test',
            engine: 'mock-nonexistent' as any,
            voiceId: 'zh-female-xiaoxian',
          }),
        ),
        /TTS 引擎/,
      )
    })
  })

  // ============ 5. STT CRUD (3) ============
  describe('5. STT 转写', () => {
    it('STT 默认 Azure + zh-CN → 5 段落', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createSttTask({
          sourceAssetId: 'asset-call-001',
        }),
      )
      assert.equal(task.engine, 'mock-azure-stt')
      assert.equal(task.language, 'zh-CN')
      assert.equal(task.speakerCount, 1)
      assert.ok(task.fullText.length > 0)
      assert.ok(task.avgConfidence > 0.8)
    })

    it('英文 STT → Whisper + auto 语言', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createSttTask({
          sourceAssetId: 'asset-en-001',
          engine: 'mock-whisper',
          language: 'en-US',
        }),
      )
      assert.equal(task.engine, 'mock-whisper')
      assert.ok(task.fullText.length > 0)
    })

    it('listSttSegments 排序', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createSttTask({
          sourceAssetId: 'asset-seg-001',
        }),
      )
      const segs = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.listSttSegments(task.id),
      )
      assert.ok(segs.length >= 5)
      for (let i = 1; i < segs.length; i++) {
        assert.ok(segs[i - 1].startMs <= segs[i].startMs)
      }
    })
  })

  // ============ 6. STT Diarization + 情绪 (2) ============
  describe('6. STT Diarization + 情绪', () => {
    it('enableDiarization → 2 说话人', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createSttTask({
          sourceAssetId: 'asset-diarize',
          enableDiarization: true,
        }),
      )
      assert.equal(task.speakerCount, 2)
      const segs = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.listSttSegments(task.id),
      )
      const spkSet = new Set(segs.map((s) => s.speakerId))
      assert.equal(spkSet.size, 2)
    })

    it('enableEmotionRecognition → 段落带 emotion', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createSttTask({
          sourceAssetId: 'asset-emotion',
          engine: 'mock-google-stt', // supportsEmotion=true
          enableEmotionRecognition: true,
        }),
      )
      const segs = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.listSttSegments(task.id),
      )
      assert.ok(segs.some((s) => s.emotion !== undefined))
    })

    it('引擎不支持情绪被拒', async () => {
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () =>
          SHARED_SERVICE.createSttTask({
            sourceAssetId: 'asset-x',
            engine: 'mock-azure-stt', // supportsEmotion=false
            enableEmotionRecognition: true,
          }),
        ),
        /不支持情绪/,
      )
    })
  })

  // ============ 7. 语音克隆 (2) ============
  describe('7. 语音克隆', () => {
    it('cloneVoice 训练完成 → similarityScore', async () => {
      const clone = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.cloneVoice({
          name: '我的克隆声音',
          engine: 'mock-minimax-voice',
          referenceAssetId: 'asset-ref-audio',
          referenceDurationSec: 30,
        }),
      )
      assert.equal(clone.status, 'ready')
      assert.equal(clone.progress, 1.0)
      assert.ok(clone.similarityScore! >= 0.8)
    })

    it('克隆参考音频太短被拒', async () => {
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () =>
          SHARED_SERVICE.cloneVoice({
            name: 'too short',
            engine: 'mock-minimax-voice',
            referenceAssetId: 'asset-ref',
            referenceDurationSec: 3,
          }),
        ),
        /至少 5 秒/,
      )
    })
  })

  // ============ 8. 声纹 (2) ============
  describe('8. 声纹注册 + 识别', () => {
    it('enrollVoiceprint + identifySpeakers', async () => {
      const vp = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.enrollVoiceprint({
          speakerName: '张三',
          referenceAssetIds: ['asset-vp-1', 'asset-vp-2'],
        }),
      )
      assert.equal(vp.status, 'enrolled')
      assert.equal(vp.embedding.length, 128)

      // 创建 STT 任务拿 segmentId
      const stt = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createSttTask({ sourceAssetId: 'asset-vp-test' }),
      )
      const segs = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.listSttSegments(stt.id),
      )
      const segId = segs[0].id
      const results = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.identifySpeakers({ segmentIds: [segId] }),
      )
      assert.equal(results.length, 1)
      assert.ok(results[0].matches.length >= 1)
      // cosine 相似度有效范围 [-1, 1]
      assert.ok(results[0].matches[0].similarity >= -1 && results[0].matches[0].similarity <= 1)
    })

    it('enrollVoiceprint 无 reference 被拒', async () => {
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () =>
          SHARED_SERVICE.enrollVoiceprint({
            speakerName: 'x',
            referenceAssetIds: [],
          }),
        ),
        /至少 1 个/,
      )
    })
  })

  // ============ 9. 任务取消 (1) ============
  describe('9. 任务取消', () => {
    it('取消已完成 STT 被拒', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createSttTask({ sourceAssetId: 'asset-cancel' }),
      )
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () => SHARED_SERVICE.cancelSttTask(task.id)),
        /终态/,
      )
    })
  })

  // ============ 10. 跨租户隔离 (1) ============
  describe('10. 跨租户隔离', () => {
    it('租户 B 不能访问租户 A 的 TTS 任务', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createTtsTask({
          text: 'iso test',
          engine: 'mock-azure-tts',
          voiceId: 'zh-female-xiaoxian',
        }),
      )
      await assert.rejects(
        () => runWithTenant(TENANT_B, async () => SHARED_SERVICE.getTtsTask(task.id)),
        /不存在/,
      )
    })
  })

  // ============ 11. 统计 (1) ============
  describe('11. 统计', () => {
    it('getVoiceStats 聚合', async () => {
      const stats = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.getVoiceStats(),
      )
      assert.ok(stats.totalTtsTasks > 0)
      assert.ok(stats.totalSttTasks > 0)
      assert.ok(typeof stats.byTtsEngine === 'object')
      assert.ok(typeof stats.bySttEngine === 'object')
      assert.ok(stats.avgSttConfidence > 0)
    })
  })
})