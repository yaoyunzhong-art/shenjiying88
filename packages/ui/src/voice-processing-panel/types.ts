/**
 * Phase 102 语音处理 前台 Types (V11 Sprint 3 Day 44)
 */

export type TtsEngine = 'mock-azure-tts' | 'mock-google-tts' | 'mock-aliyun-tts' | 'mock-tencent-tts' | 'mock-edge-tts' | 'mock-minimax-tts'
export type SttEngine = 'mock-azure-stt' | 'mock-google-stt' | 'mock-whisper' | 'mock-aliyun-stt' | 'mock-tencent-asr' | 'mock-iflytek'
export type VoiceCloningEngine = 'mock-minimax-voice' | 'mock-aliyun-sambert' | 'mock-azure-custom-neural'

export type TtsEmotion = 'neutral' | 'happy' | 'sad' | 'angry' | 'excited' | 'calm' | 'professional' | 'friendly'
export type TtsVoiceGender = 'male' | 'female' | 'neutral'
export type SupportedLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'es-ES' | 'fr-FR' | 'de-DE' | 'ru-RU' | 'auto'

export type TtsTaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type SttTaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type VoiceCloneStatus = 'pending' | 'training' | 'ready' | 'failed'
export type VoiceprintStatus = 'pending' | 'enrolled' | 'active' | 'disabled'

export interface TtsVoice {
  id: string
  displayName: string
  gender: TtsVoiceGender
  language: SupportedLanguage
  defaultEmotion: TtsEmotion
  engine: TtsEngine
  sampleRate: 16000 | 24000 | 48000
  description?: string
}

export interface TtsTask {
  id: string
  text: string
  engine: TtsEngine
  voiceId: string
  emotion: TtsEmotion
  speedAdjustment: number
  pitchAdjustment: number
  volumeAdjustment: number
  outputFormat: 'mp3' | 'wav' | 'ogg' | 'pcm'
  sampleRate: number
  status: TtsTaskStatus
  progress: number
  durationMs?: number
  audioUrl?: string
  estimatedAudioSec?: number
  characterCount: number
  createdAt: string
}

export interface SttSegment {
  id: string
  startMs: number
  endMs: number
  text: string
  speakerId?: string
  speakerName?: string
  confidence: number
  emotion?: TtsEmotion
  language?: SupportedLanguage
}

export interface SttTask {
  id: string
  sourceAssetId: string
  engine: SttEngine
  language: SupportedLanguage
  enableSpeakerDiarization: boolean
  enableEmotionRecognition: boolean
  status: SttTaskStatus
  progress: number
  durationMs?: number
  segmentCount: number
  fullText?: string
  detectedLanguage?: SupportedLanguage
  createdAt: string
}

export interface VoiceClone {
  id: string
  name: string
  description?: string
  engine: VoiceCloningEngine
  referenceAssetId: string
  referenceDurationSec: number
  status: VoiceCloneStatus
  progress: number
  trainingDurationMs?: number
  similarityScore?: number
  createdBy: string
  createdAt: string
}

export interface Voiceprint {
  id: string
  speakerName: string
  engine: SttEngine
  referenceAssetIds: string[]
  status: VoiceprintStatus
  enrolledDurationMs?: number
  createdAt: string
}

export interface VoiceStats {
  totalTtsTasks: number
  totalSttTasks: number
  totalClones: number
  totalVoiceprints: number
  totalAudioSec: number
  totalCharacters: number
}

// ============ 显示标签 ============

export const TTS_ENGINE_LABELS: Record<TtsEngine, string> = {
  'mock-azure-tts': 'Azure TTS',
  'mock-google-tts': 'Google TTS',
  'mock-aliyun-tts': '阿里云 TTS',
  'mock-tencent-tts': '腾讯云 TTS',
  'mock-edge-tts': 'Edge TTS',
  'mock-minimax-tts': 'MiniMax TTS',
}

export const STT_ENGINE_LABELS: Record<SttEngine, string> = {
  'mock-azure-stt': 'Azure STT',
  'mock-google-stt': 'Google STT',
  'mock-whisper': 'OpenAI Whisper',
  'mock-aliyun-stt': '阿里云 STT',
  'mock-tencent-asr': '腾讯云 ASR',
  'mock-iflytek': '讯飞 ASR',
}

export const CLONE_ENGINE_LABELS: Record<VoiceCloningEngine, string> = {
  'mock-minimax-voice': 'MiniMax Voice',
  'mock-aliyun-sambert': '阿里 Sambert',
  'mock-azure-custom-neural': 'Azure Custom Neural',
}

export const EMOTION_LABELS: Record<TtsEmotion, string> = {
  neutral: '中性', happy: '开心', sad: '悲伤', angry: '愤怒',
  excited: '兴奋', calm: '平静', professional: '专业', friendly: '友好',
}

export const EMOTION_COLORS: Record<TtsEmotion, string> = {
  neutral: '#8c8c8c', happy: '#faad14', sad: '#1890ff', angry: '#ff4d4f',
  excited: '#f759ab', calm: '#52c41a', professional: '#722ed1', friendly: '#13c2c2',
}

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  'zh-CN': '中文', 'en-US': '英文', 'ja-JP': '日文', 'ko-KR': '韩文',
  'es-ES': '西班牙文', 'fr-FR': '法文', 'de-DE': '德文', 'ru-RU': '俄文', auto: '自动',
}

export const GENDER_ICONS: Record<TtsVoiceGender, string> = {
  male: '👨', female: '👩', neutral: '🧑',
}

export const STATUS_LABELS: Record<TtsTaskStatus | SttTaskStatus, string> = {
  pending: '等待中', processing: '合成中', completed: '已完成', failed: '失败', cancelled: '已取消',
}

export const STATUS_COLORS: Record<TtsTaskStatus | SttTaskStatus, string> = {
  pending: '#bfbfbf', processing: '#1890ff', completed: '#52c41a', failed: '#ff4d4f', cancelled: '#faad14',
}

export const CLONE_STATUS_LABELS: Record<VoiceCloneStatus, string> = {
  pending: '待训练', training: '训练中', ready: '就绪', failed: '失败',
}

export const CLONE_STATUS_COLORS: Record<VoiceCloneStatus, string> = {
  pending: '#bfbfbf', training: '#1890ff', ready: '#52c41a', failed: '#ff4d4f',
}

/**
 * 时长格式化 (ms → mm:ss)
 */
export function formatAudioTime(ms?: number): string {
  if (ms == null) return '-'
  const sec = Math.floor(ms / 1000)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * 时长格式化 (秒 → 友好显示)
 */
export function formatSeconds(sec: number): string {
  if (sec < 60) return `${sec.toFixed(1)} s`
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}m ${s}s`
}

/**
 * 字符数
 */
export function countChars(text: string): number {
  let cn = 0, en = 0
  for (const ch of text) {
    if (/[一-龥]/.test(ch)) cn++
    else if (/[a-zA-Z0-9]/.test(ch)) en++
  }
  return cn + Math.round(en * 0.5)
}