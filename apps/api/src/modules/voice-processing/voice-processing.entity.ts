/**
 * Phase 102 语音处理 Entity (V11 Sprint 3 Day 38)
 *
 * - TTS (Text-to-Speech) 文字转语音
 * - STT (Speech-to-Text) 语音转文字
 * - 实时语音流识别
 * - 声纹识别 (Voiceprint)
 * - 语音克隆 (Voice Cloning)
 */

export type TtsEngine = 'mock-azure-tts' | 'mock-google-tts' | 'mock-aliyun-tts' | 'mock-tencent-tts' | 'mock-edge-tts' | 'mock-minimax-tts'
export type SttEngine = 'mock-azure-stt' | 'mock-google-stt' | 'mock-whisper' | 'mock-aliyun-stt' | 'mock-tencent-asr' | 'mock-iflytek'
export type VoiceCloningEngine = 'mock-minimax-voice' | 'mock-aliyun-sambert' | 'mock-azure-custom-neural'

export type TtsEmotion = 'neutral' | 'happy' | 'sad' | 'angry' | 'excited' | 'calm' | 'professional' | 'friendly'
export type TtsVoiceGender = 'male' | 'female' | 'neutral'

export type VoiceprintStatus = 'pending' | 'enrolled' | 'active' | 'disabled'
export type SttTaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type TtsTaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export type SupportedLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'es-ES' | 'fr-FR' | 'de-DE' | 'ru-RU' | 'auto'

/**
 * 语音音色 (TTS)
 */
export interface TtsVoice {
  id: string
  displayName: string
  gender: TtsVoiceGender
  language: SupportedLanguage
  /** 风格 (情感) */
  defaultEmotion: TtsEmotion
  /** 引擎 */
  engine: TtsEngine
  /** 采样率 */
  sampleRate: 16000 | 24000 | 48000
  /** 描述 */
  description?: string
}

/**
 * 语音克隆 (Voice Clone)
 */
export interface VoiceClone {
  id: string
  tenantId: string
  /** 名称 */
  name: string
  /** 描述 */
  description?: string
  /** 引擎 */
  engine: VoiceCloningEngine
  /** 参考音频 ID (来自 multimedia 模块) */
  referenceAssetId: string
  /** 参考音频时长 (秒) */
  referenceDurationSec: number
  /** 训练状态 */
  status: 'pending' | 'training' | 'ready' | 'failed'
  /** 进度 */
  progress: number
  /** 训练时长 (ms) */
  trainingDurationMs?: number
  /** 相似度 (0..1) */
  similarityScore?: number
  /** 调用方 */
  createdBy: string
  createdAt: string
  updatedAt: string
}

/**
 * TTS 合成任务
 */
export interface TtsTask {
  id: string
  tenantId: string
  /** 文本内容 */
  text: string
  /** 引擎 */
  engine: TtsEngine
  /** 音色 ID */
  voiceId: string
  /** 情感 */
  emotion: TtsEmotion
  /** 语速 (-50..+100) */
  speedAdjustment: number
  /** 音调 (-50..+50) */
  pitchAdjustment: number
  /** 音量 (-50..+50) */
  volumeAdjustment: number
  /** 输出格式 */
  outputFormat: 'mp3' | 'wav' | 'ogg' | 'pcm'
  /** 采样率 */
  sampleRate: 16000 | 24000 | 48000
  /** 状态 */
  status: TtsTaskStatus
  /** 进度 */
  progress: number
  /** 时长 (ms) */
  durationMs?: number
  /** 输出音频时长 (秒) */
  audioDurationSec?: number
  /** 输出资产 ID (multipart 模块) */
  outputAssetId?: string
  /** 错误 */
  errorMessage?: string
  /** 调用方 */
  requestedBy: string
  createdAt: string
  updatedAt: string
}

/**
 * STT 识别任务
 */
export interface SttTask {
  id: string
  tenantId: string
  /** 源音频资产 ID */
  sourceAssetId: string
  /** 文件名 */
  filename: string
  /** 引擎 */
  engine: SttEngine
  /** 语言 */
  language: SupportedLanguage
  /** 是否说话人分离 */
  enableDiarization: boolean
  /** 是否识别情绪 */
  enableEmotionRecognition: boolean
  /** 状态 */
  status: SttTaskStatus
  /** 进度 */
  progress: number
  /** 时长 (ms) */
  durationMs?: number
  /** 识别结果 (完整文本) */
  fullText: string
  /** 识别段落 */
  segments: SttSegment[]
  /** 说话人数 */
  speakerCount: number
  /** 音频时长 (秒) */
  audioDurationSec?: number
  /** 平均置信度 */
  avgConfidence: number
  /** 错误 */
  errorMessage?: string
  /** 调用方 */
  requestedBy: string
  createdAt: string
  updatedAt: string
}

/**
 * STT 段落 (含说话人 + 时间戳)
 */
export interface SttSegment {
  id: string
  taskId: string
  tenantId: string
  /** 说话人标签 */
  speakerId: string
  /** 说话人名称 */
  speakerName?: string
  /** 起始时间 (ms) */
  startMs: number
  /** 结束时间 (ms) */
  endMs: number
  /** 文本 */
  text: string
  /** 置信度 */
  confidence: number
  /** 情绪 (如果启用情绪识别) */
  emotion?: TtsEmotion
  /** Token 数组 (词级) */
  tokens?: Array<{
    text: string
    startMs: number
    endMs: number
    confidence: number
  }>
}

/**
 * 声纹档案 (Voiceprint)
 */
export interface Voiceprint {
  id: string
  tenantId: string
  /** 用户名 / 标识 */
  speakerName: string
  /** 关联用户 ID (可选) */
  userId?: string
  /** 引擎 (与 STT 引擎匹配) */
  engine: SttEngine
  /** 参考音频 ID */
  referenceAssetIds: string[]
  /** 状态 */
  status: VoiceprintStatus
  /** 声纹特征向量 (mock embedding) */
  embedding: number[]
  /** 训练时长 (ms) */
  enrolledDurationMs?: number
  /** 描述 */
  description?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

/**
 * 说话人识别结果
 */
export interface SpeakerIdentification {
  /** 匹配声纹 ID */
  voiceprintId: string
  /** 说话人姓名 */
  speakerName: string
  /** 相似度 (0..1) */
  similarity: number
  /** 距离 (cosine) */
  distance: number
}

/**
 * TTS 引擎元信息
 */
export interface TtsEngineMeta {
  type: TtsEngine
  displayName: string
  languages: SupportedLanguage[]
  voicesCount: number
  freeQuotaPerMonth: number
  unitPricePerCharCny: number
  supportsCloning: boolean
  supportsEmotion: boolean
}

export interface SttEngineMeta {
  type: SttEngine
  displayName: string
  languages: SupportedLanguage[]
  freeHoursPerMonth: number
  unitPricePerHourCny: number
  supportsDiarization: boolean
  supportsEmotion: boolean
  realtimeStreaming: boolean
}

// ============ 工具函数 ============

export function generateTtsTaskId(): string {
  return `tts-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

export function generateSttTaskId(): string {
  return `stt-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

export function generateSegmentId(): string {
  return `seg-${Math.random().toString(36).slice(2, 10)}`
}

export function generateVoiceprintId(): string {
  return `vp-${Math.random().toString(36).slice(2, 10)}`
}

export function generateVoiceCloneId(): string {
  return `vc-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * 余弦相似度 (复用 image-recognition 思想)
 */
export function cosineSim(a: number[], b: number[]): number {
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

/**
 * 文本字数 (中英文混合)
 */
export function countChars(text: string): number {
  // 中文字符按 1, 英文单词按 1
  let count = 0
  for (const ch of text) {
    if (/[\u4e00-\u9fa5]/.test(ch)) count += 1
    else if (/[a-zA-Z0-9]/.test(ch)) count += 0.5
    else if (/\s/.test(ch)) continue
    else count += 1
  }
  return Math.ceil(count)
}

/**
 * 估算音频时长 (秒) - 平均语速 ~200 字/分
 */
export function estimateAudioDurationSec(text: string, speedAdjustment = 0): number {
  const chars = countChars(text)
  const baseSecPerChar = 60 / 200 // 200 字/分
  const speedFactor = 1 + speedAdjustment / 100
  return (chars * baseSecPerChar) / speedFactor
}

/**
 * Mock embedding for voiceprint
 */
export function mockVoiceprintEmbedding(seed: string, dims = 128): number[] {
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
  return result.map((x) => x / norm)
}

// ============ 音色与引擎元数据 ============

export const TTS_VOICES: TtsVoice[] = [
  { id: 'zh-female-xiaoxian', displayName: '晓娴 (温柔女声)', gender: 'female', language: 'zh-CN', defaultEmotion: 'friendly', engine: 'mock-azure-tts', sampleRate: 24000, description: '温柔亲切,适合客服与对话' },
  { id: 'zh-male-yunxi', displayName: '云希 (稳重男声)', gender: 'male', language: 'zh-CN', defaultEmotion: 'professional', engine: 'mock-azure-tts', sampleRate: 24000, description: '沉稳专业,适合新闻播报' },
  { id: 'zh-female-xiaomeng', displayName: '小梦 (活泼女声)', gender: 'female', language: 'zh-CN', defaultEmotion: 'happy', engine: 'mock-aliyun-tts', sampleRate: 24000, description: '活泼可爱,适合短视频' },
  { id: 'en-female-jenny', displayName: 'Jenny (Female, US)', gender: 'female', language: 'en-US', defaultEmotion: 'neutral', engine: 'mock-azure-tts', sampleRate: 24000 },
  { id: 'en-male-guy', displayName: 'Guy (Male, US)', gender: 'male', language: 'en-US', defaultEmotion: 'neutral', engine: 'mock-azure-tts', sampleRate: 24000 },
  { id: 'ja-female-nanami', displayName: '七海 (ななみ)', gender: 'female', language: 'ja-JP', defaultEmotion: 'neutral', engine: 'mock-google-tts', sampleRate: 24000 },
]

export const TTS_ENGINE_META: TtsEngineMeta[] = [
  { type: 'mock-azure-tts', displayName: 'Azure TTS (Neural)', languages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'es-ES'], voicesCount: 200, freeQuotaPerMonth: 500000, unitPricePerCharCny: 0.000016, supportsCloning: true, supportsEmotion: true },
  { type: 'mock-google-tts', displayName: 'Google Cloud TTS', languages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'], voicesCount: 380, freeQuotaPerMonth: 4000000, unitPricePerCharCny: 0.000016, supportsCloning: true, supportsEmotion: false },
  { type: 'mock-aliyun-tts', displayName: '阿里云智能语音', languages: ['zh-CN', 'en-US'], voicesCount: 80, freeQuotaPerMonth: 2000000, unitPricePerCharCny: 0.00002, supportsCloning: true, supportsEmotion: true },
  { type: 'mock-tencent-tts', displayName: '腾讯云 TTS', languages: ['zh-CN', 'en-US'], voicesCount: 60, freeQuotaPerMonth: 1000000, unitPricePerCharCny: 0.000022, supportsCloning: true, supportsEmotion: true },
  { type: 'mock-edge-tts', displayName: 'Edge TTS (免费)', languages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'], voicesCount: 300, freeQuotaPerMonth: Infinity, unitPricePerCharCny: 0, supportsCloning: false, supportsEmotion: false },
  { type: 'mock-minimax-tts', displayName: 'MiniMax TTS', languages: ['zh-CN', 'en-US', 'ja-JP'], voicesCount: 100, freeQuotaPerMonth: 1000000, unitPricePerCharCny: 0.000012, supportsCloning: true, supportsEmotion: true },
]

export const STT_ENGINE_META: SttEngineMeta[] = [
  { type: 'mock-azure-stt', displayName: 'Azure Speech to Text', languages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'], freeHoursPerMonth: 5, unitPricePerHourCny: 8, supportsDiarization: true, supportsEmotion: false, realtimeStreaming: true },
  { type: 'mock-google-stt', displayName: 'Google Speech-to-Text', languages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'], freeHoursPerMonth: 60, unitPricePerHourCny: 9, supportsDiarization: true, supportsEmotion: true, realtimeStreaming: true },
  { type: 'mock-whisper', displayName: 'OpenAI Whisper', languages: ['auto', 'zh-CN', 'en-US', 'ja-JP'], freeHoursPerMonth: Infinity, unitPricePerHourCny: 0, supportsDiarization: false, supportsEmotion: false, realtimeStreaming: false },
  { type: 'mock-aliyun-stt', displayName: '阿里云语音识别', languages: ['zh-CN', 'en-US'], freeHoursPerMonth: 2, unitPricePerHourCny: 5, supportsDiarization: true, supportsEmotion: true, realtimeStreaming: true },
  { type: 'mock-tencent-asr', displayName: '腾讯云 ASR', languages: ['zh-CN', 'en-US'], freeHoursPerMonth: 5, unitPricePerHourCny: 4.5, supportsDiarization: true, supportsEmotion: false, realtimeStreaming: true },
  { type: 'mock-iflytek', displayName: '科大讯飞 ASR', languages: ['zh-CN'], freeHoursPerMonth: 5, unitPricePerHourCny: 4.8, supportsDiarization: true, supportsEmotion: true, realtimeStreaming: true },
]