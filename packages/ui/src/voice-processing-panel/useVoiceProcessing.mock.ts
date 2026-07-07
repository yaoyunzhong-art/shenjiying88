/**
 * Phase 102 语音处理 前台 Mock (V11 Sprint 3 Day 44 - SSR mock)
 */

import type {
  TtsTask, SttTask, VoiceClone, Voiceprint, TtsVoice, VoiceStats, SttSegment,
} from './types'

const MOCK_VOICES: TtsVoice[] = [
  { id: 'zh-female-xiaoxian', displayName: '晓娴 (女/中文)', gender: 'female', language: 'zh-CN', defaultEmotion: 'friendly', engine: 'mock-azure-tts', sampleRate: 24000, description: '温柔女声,适合客服/导览' },
  { id: 'zh-male-yunxi', displayName: '云希 (男/中文)', gender: 'male', language: 'zh-CN', defaultEmotion: 'professional', engine: 'mock-google-tts', sampleRate: 24000, description: '专业男声,适合新闻播报' },
  { id: 'zh-female-xiaomeng', displayName: '小梦 (女/中文)', gender: 'female', language: 'zh-CN', defaultEmotion: 'happy', engine: 'mock-aliyun-tts', sampleRate: 16000, description: '活泼女声,适合广告营销' },
  { id: 'en-female-jenny', displayName: 'Jenny (女/英文)', gender: 'female', language: 'en-US', defaultEmotion: 'neutral', engine: 'mock-azure-tts', sampleRate: 24000 },
  { id: 'en-male-guy', displayName: 'Guy (男/英文)', gender: 'male', language: 'en-US', defaultEmotion: 'professional', engine: 'mock-google-tts', sampleRate: 24000 },
  { id: 'ja-female-nanami', displayName: '七海 (女/日文)', gender: 'female', language: 'ja-JP', defaultEmotion: 'calm', engine: 'mock-minimax-tts', sampleRate: 48000 },
]

const MOCK_TTS_TASKS: TtsTask[] = [
  {
    id: 'tts-001',
    text: '欢迎光临,请问有什么可以帮您?',
    engine: 'mock-azure-tts',
    voiceId: 'zh-female-xiaoxian',
    emotion: 'friendly',
    speedAdjustment: 0,
    pitchAdjustment: 0,
    volumeAdjustment: 0,
    outputFormat: 'mp3',
    sampleRate: 24000,
    status: 'completed',
    progress: 1.0,
    durationMs: 380,
    audioUrl: 'https://cdn.shenjiying88.com/tts/001.mp3',
    estimatedAudioSec: 2.8,
    characterCount: 13,
    createdAt: '2026-06-27T10:00:00Z',
  },
  {
    id: 'tts-002',
    text: '您的订单已发货,预计明天到达',
    engine: 'mock-google-tts',
    voiceId: 'zh-male-yunxi',
    emotion: 'professional',
    speedAdjustment: 5,
    pitchAdjustment: 0,
    volumeAdjustment: 0,
    outputFormat: 'mp3',
    sampleRate: 24000,
    status: 'processing',
    progress: 0.65,
    characterCount: 14,
    createdAt: '2026-06-27T11:00:00Z',
  },
]

const MOCK_STT_TASKS: SttTask[] = [
  {
    id: 'stt-001',
    sourceAssetId: 'asset-customer-call-01',
    engine: 'mock-azure-stt',
    language: 'zh-CN',
    enableSpeakerDiarization: true,
    enableEmotionRecognition: true,
    status: 'completed',
    progress: 1.0,
    durationMs: 2500,
    segmentCount: 5,
    fullText: '您好,我想咨询一下我的订单状态。好的,请稍等,我帮您查询。您的订单已经发货,预计明天到达。',
    detectedLanguage: 'zh-CN',
    createdAt: '2026-06-27T14:00:00Z',
  },
]

const MOCK_STT_SEGMENTS: SttSegment[] = [
  { id: 'seg-1', startMs: 0, endMs: 2400, text: '您好,我想咨询一下我的订单状态。', speakerId: 'spk-1', speakerName: '客户', confidence: 0.95, emotion: 'neutral', language: 'zh-CN' },
  { id: 'seg-2', startMs: 2400, endMs: 4800, text: '好的,请稍等,我帮您查询。', speakerId: 'spk-2', speakerName: '客服', confidence: 0.97, emotion: 'friendly', language: 'zh-CN' },
  { id: 'seg-3', startMs: 4800, endMs: 7500, text: '您的订单已经发货,预计明天到达。', speakerId: 'spk-2', speakerName: '客服', confidence: 0.96, emotion: 'professional', language: 'zh-CN' },
  { id: 'seg-4', startMs: 7500, endMs: 9800, text: 'Hello, I would like to check my order status.', speakerId: 'spk-1', speakerName: 'Customer', confidence: 0.93, emotion: 'neutral', language: 'en-US' },
  { id: 'seg-5', startMs: 9800, endMs: 12500, text: 'Sure, let me check that for you.', speakerId: 'spk-2', speakerName: 'Agent', confidence: 0.94, emotion: 'friendly', language: 'en-US' },
]

const MOCK_CLONES: VoiceClone[] = [
  {
    id: 'clone-001',
    name: '店长声音',
    description: '店长王老师的声音克隆',
    engine: 'mock-minimax-voice',
    referenceAssetId: 'asset-manager-voice',
    referenceDurationSec: 120,
    status: 'ready',
    progress: 1.0,
    trainingDurationMs: 4500,
    similarityScore: 0.92,
    createdBy: 'admin-A',
    createdAt: '2026-06-20T08:00:00Z',
  },
  {
    id: 'clone-002',
    name: '前台小李',
    engine: 'mock-aliyun-sambert',
    referenceAssetId: 'asset-frontdesk-voice',
    referenceDurationSec: 60,
    status: 'training',
    progress: 0.45,
    createdBy: 'admin-A',
    createdAt: '2026-06-27T10:00:00Z',
  },
]

const MOCK_VOICEPRINTS: Voiceprint[] = [
  { id: 'vp-001', speakerName: '店长王老师', engine: 'mock-azure-stt', referenceAssetIds: ['asset-mgr-1', 'asset-mgr-2'], status: 'active', enrolledDurationMs: 800, createdAt: '2026-06-15T08:00:00Z' },
  { id: 'vp-002', speakerName: '前台小李', engine: 'mock-google-stt', referenceAssetIds: ['asset-fd-1'], status: 'enrolled', enrolledDurationMs: 750, createdAt: '2026-06-16T09:00:00Z' },
]

const MOCK_STATS: VoiceStats = {
  totalTtsTasks: 248,
  totalSttTasks: 132,
  totalClones: 8,
  totalVoiceprints: 12,
  totalAudioSec: 8640,
  totalCharacters: 38420,
}

// ============ Hooks ============

export function useTtsVoices() { return { data: MOCK_VOICES, isLoading: false } }
export function useTtsTasks(_opts: { engine?: string; limit?: number } = {}) { return { data: MOCK_TTS_TASKS, isLoading: false } }
export function useSttTasks(_opts: { engine?: string; limit?: number } = {}) { return { data: MOCK_STT_TASKS, isLoading: false } }
export function useSttSegments(_taskId: string | null) { return { data: MOCK_STT_SEGMENTS, isLoading: false } }
export function useVoiceClones() { return { data: MOCK_CLONES, isLoading: false } }
export function useVoiceprints() { return { data: MOCK_VOICEPRINTS, isLoading: false } }
export function useVoiceStats() { return { data: MOCK_STATS, isLoading: false } }

export function useCreateTts() {
  return { mutate: (_input: any) => undefined, isPending: false, data: MOCK_TTS_TASKS[0] }
}
export function useCreateStt() {
  return { mutate: (_input: any) => undefined, isPending: false, data: MOCK_STT_TASKS[0] }
}
export function useCloneVoice() {
  return { mutate: (_input: any) => undefined, isPending: false, data: MOCK_CLONES[0] }
}
export function useEnrollVoiceprint() {
  return { mutate: (_input: any) => undefined, isPending: false, data: MOCK_VOICEPRINTS[0] }
}
export function useCancelTts() {
  return { mutate: (_taskId: string) => undefined, isPending: false }
}
export function useCancelStt() {
  return { mutate: (_taskId: string) => undefined, isPending: false }
}