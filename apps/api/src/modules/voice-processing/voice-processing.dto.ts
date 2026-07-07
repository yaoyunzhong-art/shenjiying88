/**
 * Phase 102 语音处理 DTO (V11 Sprint 3 Day 38)
 */

import type {
  TtsEngine, SttEngine, VoiceCloningEngine,
  TtsEmotion, SupportedLanguage,
} from './voice-processing.entity'

export interface CreateTtsTaskDto {
  text: string
  engine?: TtsEngine
  voiceId: string
  emotion?: TtsEmotion
  speedAdjustment?: number
  pitchAdjustment?: number
  volumeAdjustment?: number
  outputFormat?: 'mp3' | 'wav' | 'ogg' | 'pcm'
  sampleRate?: 16000 | 24000 | 48000
}

export interface CreateSttTaskDto {
  sourceAssetId: string
  filename?: string
  engine?: SttEngine
  language?: SupportedLanguage
  enableDiarization?: boolean
  enableEmotionRecognition?: boolean
}

export interface CloneVoiceDto {
  name: string
  description?: string
  engine: VoiceCloningEngine
  referenceAssetId: string
  referenceDurationSec: number
}

export interface EnrollVoiceprintDto {
  speakerName: string
  userId?: string
  engine?: SttEngine
  referenceAssetIds: string[]
  description?: string
}

export interface IdentifySpeakerDto {
  /** 待识别音频的 segment IDs */
  segmentIds: string[]
  /** 候选声纹 ID 列表 */
  candidateVoiceprintIds?: string[]
  /** 最低相似度阈值 */
  threshold?: number
}

export interface ListTtsQuery {
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  engine?: TtsEngine
  limit?: number
}

export interface ListSttQuery {
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  engine?: SttEngine
  language?: SupportedLanguage
  limit?: number
}

export interface TtsTaskResponse {
  id: string
  tenantId: string
  text: string
  engine: TtsEngine
  voiceId: string
  emotion: TtsEmotion
  status: string
  progress: number
  durationMs?: number
  audioDurationSec?: number
  outputAssetId?: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface SttTaskResponse {
  id: string
  tenantId: string
  sourceAssetId: string
  filename: string
  engine: SttEngine
  language: SupportedLanguage
  status: string
  progress: number
  durationMs?: number
  fullText: string
  speakerCount: number
  audioDurationSec?: number
  avgConfidence: number
  segmentCount: number
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface VoiceStatsResponse {
  totalTtsTasks: number
  totalSttTasks: number
  totalChars: number
  totalAudioSec: number
  totalVoiceprints: number
  totalVoiceClones: number
  byTtsEngine: Record<string, number>
  bySttEngine: Record<string, number>
  avgSttConfidence: number
}