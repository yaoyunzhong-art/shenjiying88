/**
 * voice-processing.service.spec.ts
 * 纯函数式内联测试 — 不 import 生产代码
 * 覆盖: TTS/STT 引擎元数据查询、音色匹配、字数统计、音频时长估算、余弦相似度、Mock 声纹嵌入
 */

import { describe, it, expect } from 'vitest'

/* ============================================================
 * 1. 枚举 + 类型定义
 * ============================================================ */

export type TtsEngine =
  | 'mock-azure-tts' | 'mock-google-tts' | 'mock-aliyun-tts'
  | 'mock-tencent-tts' | 'mock-edge-tts' | 'mock-minimax-tts'

export type SttEngine =
  | 'mock-azure-stt' | 'mock-google-stt' | 'mock-whisper'
  | 'mock-aliyun-stt' | 'mock-tencent-asr' | 'mock-iflytek'

export type TtsEmotion =
  | 'neutral' | 'happy' | 'sad' | 'angry' | 'excited' | 'calm' | 'professional' | 'friendly'

export type SupportedLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'es-ES' | 'fr-FR' | 'de-DE' | 'ru-RU' | 'auto'

export interface TtsVoice {
  id: string; displayName: string; gender: 'male' | 'female' | 'neutral'
  language: SupportedLanguage; defaultEmotion: TtsEmotion; engine: TtsEngine
  sampleRate: 16000 | 24000 | 48000; description?: string
}

export interface TtsEngineMeta {
  type: TtsEngine; displayName: string
  languages: SupportedLanguage[]; voicesCount: number
  freeQuotaPerMonth: number; unitPricePerCharCny: number
  supportsCloning: boolean; supportsEmotion: boolean
}

export interface SttEngineMeta {
  type: SttEngine; displayName: string
  languages: SupportedLanguage[]; freeHoursPerMonth: number
  unitPricePerHourCny: number
  supportsDiarization: boolean; supportsEmotion: boolean
  realtimeStreaming: boolean
}

/* ============================================================
 * 2. Mock 数据工厂
 * ============================================================ */

const TTS_VOICES: TtsVoice[] = [
  { id: 'zh-female-xiaoxian', displayName: '晓娴 (温柔女声)', gender: 'female', language: 'zh-CN', defaultEmotion: 'friendly', engine: 'mock-azure-tts', sampleRate: 24000 },
  { id: 'zh-male-yunxi', displayName: '云希 (稳重男声)', gender: 'male', language: 'zh-CN', defaultEmotion: 'professional', engine: 'mock-azure-tts', sampleRate: 24000 },
  { id: 'zh-female-xiaomeng', displayName: '小梦 (活泼女声)', gender: 'female', language: 'zh-CN', defaultEmotion: 'happy', engine: 'mock-aliyun-tts', sampleRate: 24000 },
  { id: 'en-female-jenny', displayName: 'Jenny (Female, US)', gender: 'female', language: 'en-US', defaultEmotion: 'neutral', engine: 'mock-azure-tts', sampleRate: 24000 },
  { id: 'ja-female-nanami', displayName: '七海 (ななみ)', gender: 'female', language: 'ja-JP', defaultEmotion: 'neutral', engine: 'mock-google-tts', sampleRate: 24000 },
]

const TTS_ENGINE_META: TtsEngineMeta[] = [
  { type: 'mock-azure-tts', displayName: 'Azure TTS', languages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'es-ES'], voicesCount: 200, freeQuotaPerMonth: 500000, unitPricePerCharCny: 0.000016, supportsCloning: true, supportsEmotion: true },
  { type: 'mock-google-tts', displayName: 'Google TTS', languages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'], voicesCount: 380, freeQuotaPerMonth: 4000000, unitPricePerCharCny: 0.000016, supportsCloning: true, supportsEmotion: false },
  { type: 'mock-aliyun-tts', displayName: '阿里云 TTS', languages: ['zh-CN', 'en-US'], voicesCount: 80, freeQuotaPerMonth: 2000000, unitPricePerCharCny: 0.00002, supportsCloning: true, supportsEmotion: true },
  { type: 'mock-tencent-tts', displayName: '腾讯云 TTS', languages: ['zh-CN', 'en-US'], voicesCount: 60, freeQuotaPerMonth: 1000000, unitPricePerCharCny: 0.000022, supportsCloning: true, supportsEmotion: true },
  { type: 'mock-edge-tts', displayName: 'Edge TTS', languages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'], voicesCount: 300, freeQuotaPerMonth: Infinity, unitPricePerCharCny: 0, supportsCloning: false, supportsEmotion: false },
  { type: 'mock-minimax-tts', displayName: 'MiniMax TTS', languages: ['zh-CN', 'en-US', 'ja-JP'], voicesCount: 100, freeQuotaPerMonth: 1000000, unitPricePerCharCny: 0.000012, supportsCloning: true, supportsEmotion: true },
]

const STT_ENGINE_META: SttEngineMeta[] = [
  { type: 'mock-azure-stt', displayName: 'Azure STT', languages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'], freeHoursPerMonth: 5, unitPricePerHourCny: 8, supportsDiarization: true, supportsEmotion: false, realtimeStreaming: true },
  { type: 'mock-google-stt', displayName: 'Google STT', languages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'], freeHoursPerMonth: 60, unitPricePerHourCny: 9, supportsDiarization: true, supportsEmotion: true, realtimeStreaming: true },
  { type: 'mock-whisper', displayName: 'Whisper', languages: ['auto', 'zh-CN', 'en-US', 'ja-JP'], freeHoursPerMonth: Infinity, unitPricePerHourCny: 0, supportsDiarization: false, supportsEmotion: false, realtimeStreaming: false },
  { type: 'mock-aliyun-stt', displayName: '阿里云 STT', languages: ['zh-CN', 'en-US'], freeHoursPerMonth: 2, unitPricePerHourCny: 5, supportsDiarization: true, supportsEmotion: true, realtimeStreaming: true },
  { type: 'mock-tencent-asr', displayName: '腾讯云 ASR', languages: ['zh-CN', 'en-US'], freeHoursPerMonth: 5, unitPricePerHourCny: 4.5, supportsDiarization: true, supportsEmotion: false, realtimeStreaming: true },
  { type: 'mock-iflytek', displayName: '科大讯飞 ASR', languages: ['zh-CN'], freeHoursPerMonth: 5, unitPricePerHourCny: 4.8, supportsDiarization: true, supportsEmotion: true, realtimeStreaming: true },
]

/* ============================================================
 * 3. 内联业务逻辑纯函数
 * ============================================================ */

/** 按引擎过滤音色列表 */
function listVoices(engine?: TtsEngine): TtsVoice[] {
  return engine ? TTS_VOICES.filter(v => v.engine === engine) : [...TTS_VOICES]
}

/** 查找音色 */
function findVoice(voiceId: string): TtsVoice | undefined {
  return TTS_VOICES.find(v => v.id === voiceId)
}

/** 查找 TTS 引擎元数据 */
function findTtsEngine(engine: TtsEngine): TtsEngineMeta | undefined {
  return TTS_ENGINE_META.find(e => e.type === engine)
}

/** 查找 STT 引擎元数据 */
function findSttEngine(engine: SttEngine): SttEngineMeta | undefined {
  return STT_ENGINE_META.find(e => e.type === engine)
}

/** 检查音色是否属于指定引擎 */
function voiceBelongsToEngine(voiceId: string, engine: TtsEngine): boolean {
  const voice = findVoice(voiceId)
  if (!voice) return false
  return voice.engine === engine || engine === 'mock-edge-tts'
}

/** 检查引擎是否支持情感调节 */
function engineSupportsEmotion(engine: TtsEngine): boolean {
  const meta = findTtsEngine(engine)
  return meta?.supportsEmotion ?? false
}

/** 检查 STT 引擎是否支持说话人分离 */
function sttSupportsDiarization(engine: SttEngine): boolean {
  const meta = findSttEngine(engine)
  return meta?.supportsDiarization ?? false
}

/** 检查 STT 引擎是否支持情绪识别 */
function sttSupportsEmotion(engine: SttEngine): boolean {
  const meta = findSttEngine(engine)
  return meta?.supportsEmotion ?? false
}

/** 检查 STT 引擎是否支持指定语言 */
function sttSupportsLanguage(engine: SttEngine, language: SupportedLanguage): boolean {
  const meta = findSttEngine(engine)
  if (!meta) return false
  return meta.languages.includes(language)
}

/** 文本字数统计（中文按1，英文数字按0.5，标点按1，空白不计） */
function countChars(text: string): number {
  let count = 0
  for (const ch of text) {
    if (/[\u4e00-\u9fa5]/.test(ch)) count += 1
    else if (/[a-zA-Z0-9]/.test(ch)) count += 0.5
    else if (/\s/.test(ch)) continue
    else count += 1
  }
  return Math.ceil(count)
}

/** 估算音频时长（秒）— 平均语速 ~200 字/分 */
function estimateAudioDurationSec(text: string, speedAdjustment = 0): number {
  const chars = countChars(text)
  const baseSecPerChar = 60 / 200
  const speedFactor = 1 + speedAdjustment / 100
  return (chars * baseSecPerChar) / speedFactor
}

/** 余弦相似度 */
function cosineSim(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0)
    na += (a[i] ?? 0) ** 2
    nb += (b[i] ?? 0) ** 2
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

/** Mock 声纹嵌入 */
function mockVoiceprintEmbedding(seed: string, dims = 128): number[] {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  }
  const result: number[] = []
  for (let i = 0; i < dims; i++) {
    h = ((h << 5) - h + i) | 0
    result.push(((h & 0xffff) / 0xffff) * 2 - 1)
  }
  const norm = Math.sqrt(result.reduce((s, x) => s + x * x, 0))
  if (norm === 0) return result
  return result.map(x => x / norm)
}

/** 简单的情绪猜测 */
function guessEmotion(text: string): TtsEmotion {
  if (/好|不错|谢谢|感谢|很高兴/.test(text)) return 'happy'
  if (/问题|错误|失败|抱歉/.test(text)) return 'calm'
  if (/!!/.test(text)) return 'excited'
  return 'neutral'
}

/* ============================================================
 * 4. 测试用例 (≥18)
 * ============================================================ */

describe('voice-processing — 纯函数业务逻辑', () => {

  /* ---------- 音色查询 ---------- */
  describe('listVoices / findVoice', () => {
    it('无引擎过滤应返回全部音色', () => {
      expect(listVoices().length).toBe(5)
    })

    it('按引擎过滤应只返回匹配的音色', () => {
      const azure = listVoices('mock-azure-tts')
      expect(azure.length).toBe(3)
      azure.forEach(v => expect(v.engine).toBe('mock-azure-tts'))

      const aliyun = listVoices('mock-aliyun-tts')
      expect(aliyun.length).toBe(1)
    })

    it('不存在的引擎应返回空列表', () => {
      expect(listVoices('mock-edge-tts' as TtsEngine).length).toBe(0)
    })

    it('findVoice 通过 ID 查找正确音色', () => {
      const v = findVoice('zh-female-xiaoxian')
      expect(v).toBeDefined()
      expect(v!.displayName).toContain('晓娴')
    })

    it('findVoice 不存在的 ID 返回 undefined', () => {
      expect(findVoice('nonexistent')).toBeUndefined()
    })
  })

  /* ---------- 引擎元数据 ---------- */
  describe('TTS/STT 引擎元数据', () => {
    it('所有 TTS 引擎应可查询', () => {
      const engines: TtsEngine[] = ['mock-azure-tts', 'mock-google-tts', 'mock-aliyun-tts', 'mock-tencent-tts', 'mock-edge-tts', 'mock-minimax-tts']
      engines.forEach(e => {
        const meta = findTtsEngine(e)
        expect(meta).toBeDefined()
        expect(meta!.type).toBe(e)
      })
    })

    it('所有 STT 引擎应可查询', () => {
      const engines: SttEngine[] = ['mock-azure-stt', 'mock-google-stt', 'mock-whisper', 'mock-aliyun-stt', 'mock-tencent-asr', 'mock-iflytek']
      engines.forEach(e => {
        const meta = findSttEngine(e)
        expect(meta).toBeDefined()
        expect(meta!.type).toBe(e)
      })
    })

    it('Edge TTS 不支持克隆', () => {
      const meta = findTtsEngine('mock-edge-tts')
      expect(meta!.supportsCloning).toBe(false)
    })

    it('Google TTS 不支持情感', () => {
      const meta = findTtsEngine('mock-google-tts')
      expect(meta!.supportsEmotion).toBe(false)
    })

    it('不存在的 TTS 引擎返回 undefined', () => {
      expect(findTtsEngine('unknown' as TtsEngine)).toBeUndefined()
    })
  })

  /* ---------- voiceBelongsToEngine ---------- */
  describe('voiceBelongsToEngine', () => {
    it('Azure 音色应属于 Azure 引擎', () => {
      expect(voiceBelongsToEngine('zh-female-xiaoxian', 'mock-azure-tts')).toBe(true)
    })

    it('非匹配引擎应返回 false', () => {
      expect(voiceBelongsToEngine('zh-female-xiaomeng', 'mock-azure-tts')).toBe(false)
    })

    it('Edge TTS 可接受所有音色', () => {
      expect(voiceBelongsToEngine('zh-female-xiaomeng', 'mock-edge-tts')).toBe(true)
    })

    it('不存在的音色 ID 返回 false', () => {
      expect(voiceBelongsToEngine('nonexistent', 'mock-azure-tts')).toBe(false)
    })
  })

  /* ---------- STT 引擎能力 ---------- */
  describe('STT 引擎能力检查', () => {
    it('Whisper 不支持说话人分离和情绪', () => {
      expect(sttSupportsDiarization('mock-whisper')).toBe(false)
      expect(sttSupportsEmotion('mock-whisper')).toBe(false)
    })

    it('Google STT 支持说话人分离和情绪', () => {
      expect(sttSupportsDiarization('mock-google-stt')).toBe(true)
      expect(sttSupportsEmotion('mock-google-stt')).toBe(true)
    })

    it('Azure STT 支持说话人分离但不支持情绪', () => {
      expect(sttSupportsDiarization('mock-azure-stt')).toBe(true)
      expect(sttSupportsEmotion('mock-azure-stt')).toBe(false)
    })

    it('讯飞 ASR 仅支持中文', () => {
      expect(sttSupportsLanguage('mock-iflytek', 'zh-CN')).toBe(true)
      expect(sttSupportsLanguage('mock-iflytek', 'en-US')).toBe(false)
    })

    it('Whisper 支持 auto', () => {
      expect(sttSupportsLanguage('mock-whisper', 'auto')).toBe(true)
    })
  })

  /* ---------- 字数统计 ---------- */
  describe('countChars', () => {
    it('纯中文应精确计数', () => {
      expect(countChars('您好世界')).toBe(4)
    })

    it('英文按 0.5 计字数', () => {
      expect(countChars('hello')).toBe(3) // 5 * 0.5 = 2.5 → ceil 3
    })

    it('空格不计入', () => {
      expect(countChars('你好 世界')).toBe(4)
    })

    it('标点按 1 计', () => {
      expect(countChars('你好!')).toBe(3)
    })

    it('空字符串返回 0', () => {
      expect(countChars('')).toBe(0)
    })
  })

  /* ---------- 音频时长估算 ---------- */
  describe('estimateAudioDurationSec', () => {
    it('中文 10 字默认语速约 3 秒', () => {
      const sec = estimateAudioDurationSec('一二三四五六七八九十')
      expect(sec).toBeCloseTo(3, 0)
    })

    it('语速 +50% 时长缩短', () => {
      const normal = estimateAudioDurationSec('您好世界这是测试')
      const fast = estimateAudioDurationSec('您好世界这是测试', 50)
      expect(fast).toBeLessThan(normal)
    })

    it('空文本返回 0', () => {
      expect(estimateAudioDurationSec('')).toBe(0)
    })
  })

  /* ---------- 余弦相似度 ---------- */
  describe('cosineSim', () => {
    it('相同向量应返回 1', () => {
      const a = [1, 0, 0]
      const b = [1, 0, 0]
      expect(cosineSim(a, b)).toBeCloseTo(1, 6)
    })

    it('正交向量应返回 0', () => {
      const a = [1, 0]
      const b = [0, 1]
      expect(cosineSim(a, b)).toBeCloseTo(0, 6)
    })

    it('维度不匹配应返回 0', () => {
      expect(cosineSim([1, 0], [1, 0, 0])).toBe(0)
    })

    it('空数组应返回 0', () => {
      expect(cosineSim([], [])).toBe(0)
    })
  })

  /* ---------- Mock 声纹嵌入 ---------- */
  describe('mockVoiceprintEmbedding', () => {
    it('相同种子应产生相同嵌入', () => {
      const a = mockVoiceprintEmbedding('test-speaker', 128)
      const b = mockVoiceprintEmbedding('test-speaker', 128)
      expect(a).toEqual(b)
    })

    it('不同种子应产生不同嵌入', () => {
      const a = mockVoiceprintEmbedding('speaker1', 128)
      const b = mockVoiceprintEmbedding('speaker2', 128)
      expect(a).not.toEqual(b)
    })

    it('嵌入向量应单位化（模 ≈ 1）', () => {
      const emb = mockVoiceprintEmbedding('test', 128)
      const norm = Math.sqrt(emb.reduce((s, x) => s + x * x, 0))
      expect(norm).toBeCloseTo(1, 5)
    })

    it('128 维向量', () => {
      expect(mockVoiceprintEmbedding('test', 128).length).toBe(128)
    })
  })

  /* ---------- 情绪猜测 ---------- */
  describe('guessEmotion', () => {
    it('"谢谢" 返回 happy', () => {
      expect(guessEmotion('非常感谢')).toBe('happy')
    })

    it('"错误" 返回 calm', () => {
      expect(guessEmotion('出现错误')).toBe('calm')
    })

    it('默认返回 neutral', () => {
      expect(guessEmotion('这是一段普通文本')).toBe('neutral')
    })
  })
})
