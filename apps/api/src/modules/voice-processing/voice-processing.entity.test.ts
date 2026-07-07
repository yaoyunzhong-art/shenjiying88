import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [voice-processing] [A] entity 测试补全
 *
 * 语音处理 Entity 工具函数与数据测试
 */

import assert from 'node:assert/strict'
import {
  cosineSim,
  countChars,
  estimateAudioDurationSec,
  mockVoiceprintEmbedding,
  generateTtsTaskId,
  generateSttTaskId,
  generateSegmentId,
  generateVoiceprintId,
  generateVoiceCloneId,
  TTS_VOICES,
  TTS_ENGINE_META,
  STT_ENGINE_META,
} from './voice-processing.entity'

describe('voice-processing entity - 工具函数', () => {
  // ============ ID 生成 ============
  it('generateTtsTaskId 生成唯一 ID', () => {
    const id1 = generateTtsTaskId()
    const id2 = generateTtsTaskId()
    assert.ok(id1.startsWith('tts-'))
    assert.ok(id2.startsWith('tts-'))
    assert.notEqual(id1, id2)
  })

  it('generateSttTaskId 生成唯一 ID', () => {
    const id = generateSttTaskId()
    assert.ok(id.startsWith('stt-'))
  })

  it('generateSegmentId 生成唯一 ID', () => {
    const id = generateSegmentId()
    assert.ok(id.startsWith('seg-'))
  })

  it('generateVoiceprintId 生成唯一 ID', () => {
    const id = generateVoiceprintId()
    assert.ok(id.startsWith('vp-'))
  })

  it('generateVoiceCloneId 生成唯一 ID', () => {
    const id = generateVoiceCloneId()
    assert.ok(id.startsWith('vc-'))
  })

  // ============ cosineSim ============
  it('cosineSim 相同向量返回 1', () => {
    const v = [1, 0, 0]
    assert.equal(cosineSim(v, v), 1)
  })

  it('cosineSim 正交向量返回 0', () => {
    assert.equal(cosineSim([1, 0], [0, 1]), 0)
  })

  it('cosineSim 空向量返回 0', () => {
    assert.equal(cosineSim([], []), 0)
    assert.equal(cosineSim([], [1, 2, 3]), 0)
    assert.equal(cosineSim([1, 2, 3], []), 0)
  })

  it('cosineSim 长度不匹配返回 0', () => {
    assert.equal(cosineSim([1, 0], [1, 0, 0]), 0)
  })

  it('cosineSim 零向量返回 0', () => {
    assert.equal(cosineSim([0, 0, 0], [1, 2, 3]), 0)
  })

  it('cosineSim 计算正确值', () => {
    const sim = cosineSim([1, 2, 3], [4, 5, 6])
    assert.ok(sim > 0.9)
    assert.ok(sim < 1)
  })

  // ============ countChars ============
  it('countChars 中文字符计数', () => {
    assert.equal(countChars('你好世界'), 4)
  })

  it('countChars 英文按 0.5 计数', () => {
    assert.equal(countChars('hello'), 3) // 5*0.5=2.5 → ceil=3
  })

  it('countChars 混排文本', () => {
    const result = countChars('你好 hello 世界')
    // 中文字: 你(1) 好(1) 世(1) 界(1) = 4
    // 英文字母: h(0.5) e(0.5) l(0.5) l(0.5) o(0.5) = 2.5
    // 空格跳过
    // total = 4 + 2.5 = 6.5 → ceil=7
    assert.equal(result, 7)
  })

  it('countChars 空文本返回 0', () => {
    assert.equal(countChars(''), 0)
  })

  it('countChars 纯空格返回 0', () => {
    assert.equal(countChars('   '), 0)
  })

  it('countChars 符号计数', () => {
    // '!' = 1 (不是中文也不是英文数字)
    assert.equal(countChars('!'), 1)
  })

  it('countChars 数字按 0.5 计数', () => {
    assert.equal(countChars('123'), 2) // 3*0.5=1.5 → ceil=2
  })

  // ============ estimateAudioDurationSec ============
  it('estimateAudioDurationSec 正常文本', () => {
    // "你好世界" = 4 字, 基速 200字/分 → 0.3sec/字 → 4*0.3=1.2s
    const dur = estimateAudioDurationSec('你好世界')
    assert.ok(dur > 0)
    assert.ok(dur < 3)
  })

  it('estimateAudioDurationSec 语速加快缩短时长', () => {
    const normal = estimateAudioDurationSec('你好', 0)
    const fast = estimateAudioDurationSec('你好', 50) // +50%
    assert.ok(fast < normal)
  })

  it('estimateAudioDurationSec 语速减慢增长时长', () => {
    const normal = estimateAudioDurationSec('你好', 0)
    const slow = estimateAudioDurationSec('你好', -50) // -50%
    assert.ok(slow > normal)
  })

  it('estimateAudioDurationSec 空文本返回 0', () => {
    assert.equal(estimateAudioDurationSec(''), 0)
  })

  // ============ mockVoiceprintEmbedding ============
  it('mockVoiceprintEmbedding 相同 seed 产生相同向量', () => {
    const e1 = mockVoiceprintEmbedding('user-张三')
    const e2 = mockVoiceprintEmbedding('user-张三')
    assert.deepEqual(e1, e2)
  })

  it('mockVoiceprintEmbedding 不同 seed 产生不同向量', () => {
    const e1 = mockVoiceprintEmbedding('user-张三')
    const e2 = mockVoiceprintEmbedding('user-李四')
    assert.notDeepEqual(e1, e2)
  })

  it('mockVoiceprintEmbedding 默认维度 128', () => {
    const emb = mockVoiceprintEmbedding('test')
    assert.equal(emb.length, 128)
  })

  it('mockVoiceprintEmbedding 自定义维度', () => {
    const emb = mockVoiceprintEmbedding('test', 64)
    assert.equal(emb.length, 64)
  })

  it('mockVoiceprintEmbedding 输出向量已归一化', () => {
    const emb = mockVoiceprintEmbedding('normalize-test')
    const norm = Math.sqrt(emb.reduce((s, x) => s + x * x, 0))
    assert.ok(Math.abs(norm - 1) < 1e-6)
  })

  // ============ TTS_VOICES ============
  it('TTS_VOICES 已定义六种音色', () => {
    assert.ok(TTS_VOICES.length >= 6)
    const ids = TTS_VOICES.map((v) => v.id)
    assert.ok(ids.includes('zh-female-xiaoxian'))
    assert.ok(ids.includes('en-female-jenny'))
    assert.ok(ids.includes('ja-female-nanami'))
  })

  it('TTS_VOICES 每种音色有合法引擎', () => {
    const engineTypes = TTS_ENGINE_META.map((e) => e.type)
    for (const voice of TTS_VOICES) {
      assert.ok(engineTypes.includes(voice.engine), `音色 ${voice.id} 引擎 ${voice.engine} 不合法`)
    }
  })

  // ============ TTS_ENGINE_META ============
  it('TTS_ENGINE_META 含 6 引擎', () => {
    assert.equal(TTS_ENGINE_META.length, 6)
  })

  it('TTS_ENGINE_META Edge TTS 免费且不支持克隆和情感', () => {
    const edge = TTS_ENGINE_META.find((e) => e.type === 'mock-edge-tts')
    assert.ok(edge)
    assert.equal(edge!.unitPricePerCharCny, 0)
    assert.equal(edge!.supportsCloning, false)
    assert.equal(edge!.supportsEmotion, false)
    assert.equal(edge!.freeQuotaPerMonth, Infinity)
  })

  it('TTS_ENGINE_META Azure TTS 支持克隆和情感', () => {
    const azure = TTS_ENGINE_META.find((e) => e.type === 'mock-azure-tts')
    assert.ok(azure)
    assert.equal(azure!.supportsCloning, true)
    assert.equal(azure!.supportsEmotion, true)
  })

  // ============ STT_ENGINE_META ============
  it('STT_ENGINE_META 含 6 引擎', () => {
    assert.equal(STT_ENGINE_META.length, 6)
  })

  it('STT_ENGINE_META Whisper 免费且不支持说话人分离', () => {
    const whisper = STT_ENGINE_META.find((e) => e.type === 'mock-whisper')
    assert.ok(whisper)
    assert.equal(whisper!.unitPricePerHourCny, 0)
    assert.equal(whisper!.supportsDiarization, false)
    assert.equal(whisper!.freeHoursPerMonth, Infinity)
  })

  it('STT_ENGINE_META 阿里云 STT 支持实时流', () => {
    const aliyun = STT_ENGINE_META.find((e) => e.type === 'mock-aliyun-stt')
    assert.ok(aliyun)
    assert.equal(aliyun!.realtimeStreaming, true)
  })


})
