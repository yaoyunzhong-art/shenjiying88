import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [voice-processing] [A] stress 测试补全
 *
 * 覆盖边界场景:
 * - 并发大批量 TTS/STT 任务（高吞吐场景）
 * - 极端输入值（超长文本、超大音频时长）
 * - 快速连续状态变更（取消/查询/再取消）
 * - 内存/时间压力 (大量语音克隆并行)
 */

import assert from 'node:assert/strict'
import { VoiceProcessingService } from './voice-processing.service'
import { VoiceProcessingController } from './voice-processing.controller'
import { runWithTenant } from '../../common/context/tenant-context'

const TENANT = {
  tenantId: 'stress-tenant',
  storeId: 'stress-store',
  userId: 'stress-user',
  role: 'tenant_admin' as const,
}

describe('VoiceProcessing - Stress & Resilience', () => {
  let service: VoiceProcessingService
  let controller: VoiceProcessingController

  beforeEach(() => {
    service = new VoiceProcessingService()
    controller = new VoiceProcessingController(service)
  })

  // ─── 高并发批量 TTS ───

  describe('高并发批量 TTS', () => {
    it('同时批量创建 100 个 TTS 任务不崩溃', () => runWithTenant(TENANT, async () => {
      const promises = Array.from({ length: 100 }, (_, i) =>
        controller.createTts({
          text: `批量 TTS 测试文本 ${i} 号，这是一段用于压力测试的合成语音内容。`,
          engine: 'mock-azure-tts',
          voiceId: 'zh-female-xiaoxian',
          emotion: 'neutral',
        })
      )
      const results = await Promise.all(promises)
      assert.equal(results.length, 100)
      for (const r of results) {
        assert.ok(r.id)
        assert.ok(['processing', 'completed'].includes(r.status))
      }
    }))

    it('同时创建 50 个 TTS 和 50 个 STT 任务不互相影响', () => runWithTenant(TENANT, async () => {
      const ttsPromises = Array.from({ length: 50 }, (_, i) =>
        controller.createTts({
          text: `混合压力测试 TTS ${i}`,
          engine: 'mock-google-tts',
          voiceId: 'ja-female-nanami',
          emotion: 'neutral',
        })
      )
      const sttPromises = Array.from({ length: 50 }, (_, i) =>
        controller.createStt({
          sourceAssetId: `stress_audio_${i}`,
          engine: 'mock-whisper',
          language: 'zh-CN',
          enableDiarization: false,
        })
      )
      const [ttsResults, sttResults] = await Promise.all([
        Promise.all(ttsPromises),
        Promise.all(sttPromises),
      ])
      assert.equal(ttsResults.length, 50)
      assert.equal(sttResults.length, 50)
      for (const t of ttsResults) assert.ok(t.id)
      for (const s of sttResults) assert.ok(s.id)
    }))
  })

  // ─── 极端输入值 ───

  describe('极端输入值', () => {
    it('超长文本 TTS 创建和查询正常', () => runWithTenant(TENANT, async () => {
      const longText = 'A'.repeat(50000)
      const task = await controller.createTts({
        text: longText,
        engine: 'mock-edge-tts',
        voiceId: 'zh-female-xiaoxian',
      })
      assert.ok(task.id)

      const fetched = await controller.getTts(task.id)
      assert.equal(fetched.id, task.id)
      assert.equal(fetched.text.length, 50000)
    }))

    it('空文本 TTS 创建成功（系统允许空文本）', () => runWithTenant(TENANT, async () => {
      const task = await controller.createTts({
        text: '',
        engine: 'mock-azure-tts',
        voiceId: 'zh-female-xiaoxian',
      })
      assert.ok(task.id)
      assert.equal(task.text, '')
    }))

    it('不存在的引擎应抛出 BadRequest', () => runWithTenant(TENANT, async () => {
      await expect(() =>
        controller.createTts({
          text: '测试文本',
          engine: 'non-existent-engine' as any,
          voiceId: 'zh-female-xiaoxian',
        })
      ).rejects.toThrow()
    }))

    it('不存在的音色应抛出 BadRequest', () => runWithTenant(TENANT, async () => {
      await expect(() =>
        controller.createTts({
          text: '测试文本',
          engine: 'mock-azure-tts',
          voiceId: 'non-existent-voice' as any,
        })
      ).rejects.toThrow()
    }))

    it('音色与引擎不匹配应抛出 BadRequest', () => runWithTenant(TENANT, async () => {
      // zh-female-xiaomeng belongs to mock-aliyun-tts, not mock-azure-tts
      await expect(() =>
        controller.createTts({
          text: '测试文本',
          engine: 'mock-azure-tts',
          voiceId: 'zh-female-xiaomeng',
        })
      ).rejects.toThrow()
    }))
  })

  // ─── 快速连续状态变更 ───

  describe('快速连续状态变更', () => {
    it('创建后立即取消（完成态任务取消应抛异常）', () => runWithTenant(TENANT, async () => {
      const task = await controller.createTts({
        text: '快速取消测试',
        engine: 'mock-azure-tts',
        voiceId: 'zh-female-xiaoxian',
      })
      assert.ok(task.id)

      // 任务自动完成, 取消已完成任务应抛 BadRequest
      await expect(() =>
        controller.cancelTts(task.id)
      ).rejects.toThrow()
    }))

    it('STT 创建 → 获取段落 → 查询（完成态任务取消应抛异常）', () => runWithTenant(TENANT, async () => {
      const task = await controller.createStt({
        sourceAssetId: 'stress_test_audio',
        engine: 'mock-whisper',
        language: 'zh-CN',
        enableDiarization: false,
      })
      assert.ok(task.id)

      // 获取段落
      const segments1 = await controller.listSttSegments(task.id)
      assert.ok(Array.isArray(segments1.items))

      // 任务自动完成, 取消已完成任务应抛异常
      await expect(() =>
        controller.cancelStt(task.id)
      ).rejects.toThrow()

      // 取消后查询仍然返回
      const fetched = await controller.getStt(task.id)
      assert.equal(fetched.id, task.id)
    }))

    it('同一个语音克隆连续删除 - 第二次抛出NotFound', () => runWithTenant(TENANT, async () => {
      const clone = await controller.cloneVoice({
        name: '压力测试克隆',
        engine: 'mock-minimax-voice',
        referenceAssetId: 'asset-minimax-ref',
        referenceDurationSec: 60,
      })
      assert.ok(clone.id)

      // 第一次删除
      await controller.deleteClone(clone.id)

      // 第二次删除应抛 NotFoundException
      await expect(() =>
        controller.deleteClone(clone.id)
      ).rejects.toThrow()
    }))
  })

  // ─── 声纹批量注册与识别 ───

  describe('声纹批量注册与识别', () => {
    it('批量注册 50 个声纹不崩溃', () => runWithTenant(TENANT, async () => {
      const promises = Array.from({ length: 50 }, (_, i) =>
        controller.enrollVoiceprint({
          speakerName: `speaker_stress_${i}`,
          referenceAssetIds: [`asset-stress-${i}.wav`],
        })
      )
      const results = await Promise.all(promises)
      assert.equal(results.length, 50)
      for (const r of results) {
        assert.ok(r.id)
        assert.equal(r.status, 'enrolled')
      }
    }))

    it('识别前先注册一批声纹再识别', () => runWithTenant(TENANT, async () => {
      // 先注册一批
      await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          controller.enrollVoiceprint({
            speakerName: `known_speaker_${i}`,
            referenceAssetIds: [`asset-known-${i}.wav`],
          })
        )
      )

      // 通过 listVoiceprints 确认
      const vps = await controller.listVoiceprints()
      assert.ok(Array.isArray(vps.items))
      assert.equal(vps.items.length, 20)
    }))
  })

  // ─── 大数据量查询 ───

  describe('大数据量查询', () => {
    it('100 个 TTS 任务后 listTts 返回全部', () => runWithTenant(TENANT, async () => {
      await Promise.all(
        Array.from({ length: 100 }, (_, i) =>
          controller.createTts({
            text: `大数据查询测试 ${i}`,
            engine: 'mock-azure-tts',
            voiceId: 'zh-female-xiaoxian',
          })
        )
      )

      const result = await controller.listTts({ limit: 1000 })
      assert.equal(result.total, 100)
      assert.equal(result.items.length, 100)
    }))

    it('100 个 STT 任务后 listStt 返回全部', () => runWithTenant(TENANT, async () => {
      await Promise.all(
        Array.from({ length: 100 }, (_, i) =>
          controller.createStt({
            sourceAssetId: `query_test_audio_${i}`,
            engine: 'mock-whisper',
            language: 'zh-CN',
            enableDiarization: false,
          })
        )
      )

      const result = await controller.listStt({ limit: 1000 })
      assert.equal(result.total, 100)
      assert.equal(result.items.length, 100)
    }))
  })

  // ─── 引擎和音色查询 ───

  describe('引擎和音色查询', () => {
    it('列出所有 TTS 引擎', () => runWithTenant(TENANT, async () => {
      const engines = await controller.listTtsEngines()
      assert.ok(Array.isArray(engines.items))
      assert.ok(engines.items.length >= 6)
    }))

    it('列出所有 STT 引擎', () => runWithTenant(TENANT, async () => {
      const engines = await controller.listSttEngines()
      assert.ok(Array.isArray(engines.items))
      assert.ok(engines.items.length >= 6)
    }))

    it('列出所有音色', () => runWithTenant(TENANT, async () => {
      // Call without argument to get all voices (engine defaults to undefined)
      const voices = await controller.listVoices()
      assert.ok(Array.isArray(voices.items))
      assert.ok(voices.items.length > 0)
    }))
  })

  // ─── TTS with all emotions ───

  describe('TTS 全情感覆盖', () => {
    const emotions = ['neutral', 'happy', 'sad', 'angry', 'excited', 'calm', 'professional', 'friendly'] as const
    for (const emotion of emotions) {
      it(`TTS 使用 ${emotion} 情感创建成功`, () => runWithTenant(TENANT, async () => {
        const task = await controller.createTts({
          text: `这是一段 ${emotion} 情感的测试语音`,
          engine: 'mock-azure-tts',
          voiceId: 'zh-female-xiaoxian',
          emotion: emotion as any,
        })
        assert.ok(task.id)
        assert.equal(task.emotion, emotion)
      }))
    }
  })

  // ─── 语音克隆场景 ───

  describe('语音克隆', () => {
    it('创建多个语音克隆后列出全部', () => runWithTenant(TENANT, async () => {
      await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          controller.cloneVoice({
            name: `clone_stress_${i}`,
            engine: 'mock-minimax-voice',
            referenceAssetId: `asset-${i}`,
            referenceDurationSec: 30 + i,
          })
        )
      )

      const clones = await controller.listClones()
      assert.ok(Array.isArray(clones.items))
      assert.equal(clones.items.length, 20)
    }))

    it('克隆删除后列表应剔除', () => runWithTenant(TENANT, async () => {
      const clone = await controller.cloneVoice({
        name: 'delete_me',
        engine: 'mock-aliyun-sambert',
        referenceAssetId: 'asset-sambert',
        referenceDurationSec: 45,
      })
      await controller.deleteClone(clone.id)
      const clones = await controller.listClones()
      const found = clones.items.find((c: any) => c.id === clone.id)
      assert.ok(!found, '已删除的克隆不应出现在列表中')
    }))
  })

  // ─── 统计信息 ───

  describe('统计信息', () => {
    it('创建任务后统计信息非空', () => runWithTenant(TENANT, async () => {
      await controller.createTts({
        text: '统计测试',
        engine: 'mock-azure-tts',
        voiceId: 'zh-female-xiaoxian',
      })

      const stats = await controller.stats()
      assert.ok(stats.totalTtsTasks >= 1)
      assert.ok(typeof stats.totalAudioSec === 'number')
    }))
  })
})
