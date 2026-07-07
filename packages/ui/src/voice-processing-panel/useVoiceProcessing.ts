/**
 * Phase 102 语音处理 前台 Real Hooks (V11 Sprint 3 Day 44)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  TtsTask, SttTask, VoiceClone, Voiceprint, TtsVoice, VoiceStats, SttSegment,
} from './types'

const API_BASE = '/api/voice-processing'

// ============ Mock 数据 ============

const MOCK_VOICES: TtsVoice[] = [
  { id: 'zh-female-xiaoxian', displayName: '晓娴 (女/中文)', gender: 'female', language: 'zh-CN', defaultEmotion: 'friendly', engine: 'mock-azure-tts', sampleRate: 24000 },
  { id: 'zh-male-yunxi', displayName: '云希 (男/中文)', gender: 'male', language: 'zh-CN', defaultEmotion: 'professional', engine: 'mock-google-tts', sampleRate: 24000 },
  { id: 'zh-female-xiaomeng', displayName: '小梦 (女/中文)', gender: 'female', language: 'zh-CN', defaultEmotion: 'happy', engine: 'mock-aliyun-tts', sampleRate: 16000 },
  { id: 'en-female-jenny', displayName: 'Jenny (女/英文)', gender: 'female', language: 'en-US', defaultEmotion: 'neutral', engine: 'mock-azure-tts', sampleRate: 24000 },
  { id: 'en-male-guy', displayName: 'Guy (男/英文)', gender: 'male', language: 'en-US', defaultEmotion: 'professional', engine: 'mock-google-tts', sampleRate: 24000 },
  { id: 'ja-female-nanami', displayName: '七海 (女/日文)', gender: 'female', language: 'ja-JP', defaultEmotion: 'calm', engine: 'mock-minimax-tts', sampleRate: 48000 },
]

const MOCK_TTS_TASKS: TtsTask[] = [
  {
    id: 'tts-001', text: '欢迎光临,请问有什么可以帮您?', engine: 'mock-azure-tts',
    voiceId: 'zh-female-xiaoxian', emotion: 'friendly', speedAdjustment: 0,
    pitchAdjustment: 0, volumeAdjustment: 0, outputFormat: 'mp3', sampleRate: 24000,
    status: 'completed', progress: 1.0, durationMs: 380, characterCount: 13,
    createdAt: '2026-06-27T10:00:00Z',
  },
]

const MOCK_STT_TASKS: SttTask[] = [
  {
    id: 'stt-001', sourceAssetId: 'asset-customer-call-01', engine: 'mock-azure-stt',
    language: 'zh-CN', enableSpeakerDiarization: true, enableEmotionRecognition: true,
    status: 'completed', progress: 1.0, durationMs: 2500, segmentCount: 5,
    fullText: '您好,我想咨询一下我的订单状态。好的,请稍等,我帮您查询。您的订单已经发货,预计明天到达。',
    detectedLanguage: 'zh-CN', createdAt: '2026-06-27T14:00:00Z',
  },
]

const MOCK_STT_SEGMENTS: SttSegment[] = [
  { id: 'seg-1', startMs: 0, endMs: 2400, text: '您好,我想咨询一下我的订单状态。', speakerId: 'spk-1', speakerName: '客户', confidence: 0.95, emotion: 'neutral', language: 'zh-CN' },
]

const MOCK_CLONES: VoiceClone[] = [
  { id: 'clone-001', name: '店长声音', engine: 'mock-minimax-voice', referenceAssetId: 'asset-mgr', referenceDurationSec: 120, status: 'ready', progress: 1.0, trainingDurationMs: 4500, similarityScore: 0.92, createdBy: 'admin-A', createdAt: '2026-06-20' },
]

const MOCK_VOICEPRINTS: Voiceprint[] = [
  { id: 'vp-001', speakerName: '店长王老师', engine: 'mock-azure-stt', referenceAssetIds: ['asset-mgr-1'], status: 'active', enrolledDurationMs: 800, createdAt: '2026-06-15' },
]

const MOCK_STATS: VoiceStats = {
  totalTtsTasks: 248, totalSttTasks: 132, totalClones: 8, totalVoiceprints: 12,
  totalAudioSec: 8640, totalCharacters: 38420,
}

// ============ API mock ============

async function fetchVoicesApi(): Promise<TtsVoice[]> { await new Promise((r) => setTimeout(r, 60)); return MOCK_VOICES }
async function fetchTtsApi(_opts: any): Promise<TtsTask[]> { await new Promise((r) => setTimeout(r, 80)); return MOCK_TTS_TASKS }
async function fetchSttApi(_opts: any): Promise<SttTask[]> { await new Promise((r) => setTimeout(r, 80)); return MOCK_STT_TASKS }
async function fetchSegmentsApi(_id: string): Promise<SttSegment[]> { await new Promise((r) => setTimeout(r, 50)); return MOCK_STT_SEGMENTS }
async function fetchClonesApi(): Promise<VoiceClone[]> { await new Promise((r) => setTimeout(r, 50)); return MOCK_CLONES }
async function fetchVoiceprintsApi(): Promise<Voiceprint[]> { await new Promise((r) => setTimeout(r, 50)); return MOCK_VOICEPRINTS }
async function fetchStatsApi(): Promise<VoiceStats> { await new Promise((r) => setTimeout(r, 30)); return MOCK_STATS }

// ============ Hooks ============

export function useTtsVoices() {
  return useQuery({ queryKey: ['voice', 'tts-voices'], queryFn: fetchVoicesApi, staleTime: 5 * 60 * 1000 })
}
export function useTtsTasks(opts: { engine?: string; limit?: number } = {}) {
  return useQuery({ queryKey: ['voice', 'tts-tasks', opts], queryFn: () => fetchTtsApi(opts), staleTime: 30 * 1000 })
}
export function useSttTasks(opts: { engine?: string; limit?: number } = {}) {
  return useQuery({ queryKey: ['voice', 'stt-tasks', opts], queryFn: () => fetchSttApi(opts), staleTime: 30 * 1000 })
}
export function useSttSegments(taskId: string | null) {
  return useQuery({
    queryKey: ['voice', 'stt-segments', taskId],
    queryFn: () => fetchSegmentsApi(taskId!),
    enabled: !!taskId,
    staleTime: 60 * 1000,
  })
}
export function useVoiceClones() {
  return useQuery({ queryKey: ['voice', 'clones'], queryFn: fetchClonesApi, staleTime: 60 * 1000 })
}
export function useVoiceprints() {
  return useQuery({ queryKey: ['voice', 'voiceprints'], queryFn: fetchVoiceprintsApi, staleTime: 60 * 1000 })
}
export function useVoiceStats() {
  return useQuery({ queryKey: ['voice', 'stats'], queryFn: fetchStatsApi, staleTime: 60 * 1000 })
}

export function useCreateTts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { text: string; engine: string; voiceId: string; emotion: string }) => {
      await new Promise((r) => setTimeout(r, 500))
      return { ...MOCK_TTS_TASKS[0]!, id: `tts-${Date.now().toString(36)}`, text: input.text }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voice', 'tts-tasks'] }),
  })
}

export function useCreateStt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { sourceAssetId: string; engine?: string; language?: string }) => {
      await new Promise((r) => setTimeout(r, 600))
      return { ...MOCK_STT_TASKS[0]!, id: `stt-${Date.now().toString(36)}`, sourceAssetId: input.sourceAssetId }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voice', 'stt-tasks'] }),
  })
}

export function useCloneVoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; engine: string; referenceAssetId: string; referenceDurationSec: number }) => {
      await new Promise((r) => setTimeout(r, 800))
      return { ...MOCK_CLONES[0]!, id: `clone-${Date.now().toString(36)}`, name: input.name }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voice', 'clones'] }),
  })
}

export function useEnrollVoiceprint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { speakerName: string; referenceAssetIds: string[] }) => {
      await new Promise((r) => setTimeout(r, 600))
      return { ...MOCK_VOICEPRINTS[0]!, id: `vp-${Date.now().toString(36)}`, speakerName: input.speakerName }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voice', 'voiceprints'] }),
  })
}

export function useCancelTts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => { await new Promise((r) => setTimeout(r, 100)); return { id: taskId, status: 'cancelled' } },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voice', 'tts-tasks'] }),
  })
}

export function useCancelStt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => { await new Promise((r) => setTimeout(r, 100)); return { id: taskId, status: 'cancelled' } },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voice', 'stt-tasks'] }),
  })
}