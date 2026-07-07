import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [voice-processing] [A] DTO 测试补全
 *
 * 语音处理 DTO 接口验证测试
 */

import assert from 'node:assert/strict'
import type {
  CreateTtsTaskDto,
  CreateSttTaskDto,
  CloneVoiceDto,
  EnrollVoiceprintDto,
  IdentifySpeakerDto,
  ListTtsQuery,
  ListSttQuery,
  TtsTaskResponse,
  SttTaskResponse,
  VoiceStatsResponse,
} from './voice-processing.dto'

describe('voice-processing DTO - CreateTtsTaskDto', () => {
  it('必填字段 text 和 voiceId', () => {
    const dto: CreateTtsTaskDto = {
      text: '你好世界',
      voiceId: 'zh-female-xiaoxian',
    }
    assert.equal(dto.text, '你好世界')
    assert.equal(dto.voiceId, 'zh-female-xiaoxian')
  })

  it('可选字段 engine 不传时 undefined', () => {
    const dto: CreateTtsTaskDto = {
      text: '测试',
      voiceId: 'en-female-jenny',
    }
    assert.equal(dto.engine, undefined)
  })

  it('可选字段全部传入', () => {
    const dto: CreateTtsTaskDto = {
      text: 'test',
      engine: 'mock-azure-tts',
      voiceId: 'en-female-jenny',
      emotion: 'happy',
      speedAdjustment: 20,
      pitchAdjustment: 10,
      volumeAdjustment: -10,
      outputFormat: 'mp3',
      sampleRate: 24000,
    }
    assert.equal(dto.engine, 'mock-azure-tts')
    assert.equal(dto.emotion, 'happy')
    assert.equal(dto.speedAdjustment, 20)
    assert.equal(dto.outputFormat, 'mp3')
  })

  it('engine 只接受 TtsEngine 类型值', () => {
    const dto: CreateTtsTaskDto = {
      text: 'test',
      engine: 'mock-minimax-tts',
      voiceId: 'zh-female-xiaoxian',
    }
    assert.equal(dto.engine, 'mock-minimax-tts')
  })

  it('outputFormat 限制为合法值', () => {
    const formats: CreateTtsTaskDto['outputFormat'][] = ['mp3', 'wav', 'ogg', 'pcm']
    for (const fmt of formats) {
      const dto: CreateTtsTaskDto = { text: 't', voiceId: 'v', outputFormat: fmt }
      assert.equal(dto.outputFormat, fmt)
    }
  })

  it('sampleRate 限制为 16000 | 24000 | 48000', () => {
    const rates: NonNullable<CreateTtsTaskDto['sampleRate']>[] = [16000, 24000, 48000]
    for (const sr of rates) {
      const dto: CreateTtsTaskDto = { text: 't', voiceId: 'v', sampleRate: sr }
      assert.equal(dto.sampleRate, sr)
    }
  })
})

describe('voice-processing DTO - CreateSttTaskDto', () => {
  it('必填字段 sourceAssetId', () => {
    const dto: CreateSttTaskDto = { sourceAssetId: 'asset-001' }
    assert.equal(dto.sourceAssetId, 'asset-001')
  })

  it('可选字段 engine 和 language', () => {
    const dto: CreateSttTaskDto = {
      sourceAssetId: 'asset-002',
      engine: 'mock-whisper',
      language: 'zh-CN',
      enableDiarization: true,
      enableEmotionRecognition: false,
    }
    assert.equal(dto.engine, 'mock-whisper')
    assert.equal(dto.language, 'zh-CN')
    assert.equal(dto.enableDiarization, true)
  })

  it('filename 可选', () => {
    const dto: CreateSttTaskDto = {
      sourceAssetId: 'asset-003',
      filename: 'meeting.wav',
    }
    assert.equal(dto.filename, 'meeting.wav')
  })
})

describe('voice-processing DTO - CloneVoiceDto', () => {
  it('必填字段 name, engine, referenceAssetId, referenceDurationSec', () => {
    const dto: CloneVoiceDto = {
      name: '我的克隆',
      engine: 'mock-minimax-voice',
      referenceAssetId: 'asset-voice-001',
      referenceDurationSec: 60,
    }
    assert.equal(dto.name, '我的克隆')
    assert.equal(dto.engine, 'mock-minimax-voice')
  })

  it('description 可选', () => {
    const dto: CloneVoiceDto = {
      name: 'test',
      engine: 'mock-azure-custom-neural',
      referenceAssetId: 'asset-002',
      referenceDurationSec: 30,
      description: '克隆描述',
    }
    assert.equal(dto.description, '克隆描述')
  })

  it('engine 受 VoiceCloningEngine 约束', () => {
    const engines: CloneVoiceDto['engine'][] = [
      'mock-minimax-voice',
      'mock-aliyun-sambert',
      'mock-azure-custom-neural',
    ]
    for (const e of engines) {
      const dto: CloneVoiceDto = { name: 'x', engine: e, referenceAssetId: 'a', referenceDurationSec: 10 }
      assert.equal(dto.engine, e)
    }
  })
})

describe('voice-processing DTO - EnrollVoiceprintDto', () => {
  it('必填字段 speakerName 和 referenceAssetIds', () => {
    const dto: EnrollVoiceprintDto = {
      speakerName: '张三',
      referenceAssetIds: ['asset-vp-001', 'asset-vp-002'],
    }
    assert.equal(dto.speakerName, '张三')
    assert.equal(dto.referenceAssetIds.length, 2)
  })

  it('可选字段 userId, engine, description', () => {
    const dto: EnrollVoiceprintDto = {
      speakerName: '李四',
      referenceAssetIds: ['asset-vp-003'],
      userId: 'user-001',
      engine: 'mock-aliyun-stt',
      description: '前台声纹',
    }
    assert.equal(dto.userId, 'user-001')
    assert.equal(dto.engine, 'mock-aliyun-stt')
  })
})

describe('voice-processing DTO - IdentifySpeakerDto', () => {
  it('必填 segmentIds', () => {
    const dto: IdentifySpeakerDto = { segmentIds: ['seg-001', 'seg-002'] }
    assert.equal(dto.segmentIds.length, 2)
  })

  it('可选字段 candidateVoiceprintIds 和 threshold', () => {
    const dto: IdentifySpeakerDto = {
      segmentIds: ['seg-003'],
      candidateVoiceprintIds: ['vp-001', 'vp-002'],
      threshold: 0.7,
    }
    assert.equal(dto.candidateVoiceprintIds!.length, 2)
    assert.equal(dto.threshold, 0.7)
  })

  it('threshold 为 0..1 浮点数', () => {
    const dto: IdentifySpeakerDto = { segmentIds: ['seg-001'], threshold: 0.85 }
    assert.ok(dto.threshold! >= 0 && dto.threshold! <= 1)
  })
})

describe('voice-processing DTO - ListTtsQuery', () => {
  it('按状态筛选', () => {
    const q: ListTtsQuery = { status: 'completed' }
    assert.equal(q.status, 'completed')
  })

  it('按引擎筛选', () => {
    const q: ListTtsQuery = { engine: 'mock-azure-tts' }
    assert.equal(q.engine, 'mock-azure-tts')
  })

  it('限制数量', () => {
    const q: ListTtsQuery = { limit: 10 }
    assert.equal(q.limit, 10)
  })
})

describe('voice-processing DTO - ListSttQuery', () => {
  it('按语言筛选', () => {
    const q: ListSttQuery = { language: 'zh-CN' }
    assert.equal(q.language, 'zh-CN')
  })

  it('按状态筛选', () => {
    const q: ListSttQuery = { status: 'failed' }
    assert.equal(q.status, 'failed')
  })
})

describe('voice-processing DTO - TtsTaskResponse', () => {
  it('返回包含所有核心字段', () => {
    const resp: TtsTaskResponse = {
      id: 'tts-abc123',
      tenantId: 'tenant-test',
      text: '你好',
      engine: 'mock-azure-tts',
      voiceId: 'zh-female-xiaoxian',
      emotion: 'friendly',
      status: 'completed',
      progress: 100,
      durationMs: 2500,
      audioDurationSec: 2.5,
      outputAssetId: 'asset-output-001',
      errorMessage: undefined,
      createdAt: '2026-06-28T10:00:00Z',
      updatedAt: '2026-06-28T10:00:05Z',
    }
    assert.equal(resp.id, 'tts-abc123')
    assert.equal(resp.status, 'completed')
    assert.equal(resp.progress, 100)
  })
})

describe('voice-processing DTO - SttTaskResponse', () => {
  it('返回包含所有核心字段', () => {
    const resp: SttTaskResponse = {
      id: 'stt-xyz789',
      tenantId: 'tenant-test',
      sourceAssetId: 'asset-source-001',
      filename: 'meeting.wav',
      engine: 'mock-whisper',
      language: 'zh-CN',
      status: 'completed',
      progress: 100,
      durationMs: 120000,
      fullText: '今天会议讨论...',
      speakerCount: 3,
      audioDurationSec: 120,
      avgConfidence: 0.92,
      segmentCount: 45,
      errorMessage: undefined,
      createdAt: '2026-06-28T10:00:00Z',
      updatedAt: '2026-06-28T10:03:00Z',
    }
    assert.equal(resp.id, 'stt-xyz789')
    assert.equal(resp.speakerCount, 3)
    assert.equal(resp.avgConfidence, 0.92)
  })
})

describe('voice-processing DTO - VoiceStatsResponse', () => {
  it('统计字段合计', () => {
    const stats: VoiceStatsResponse = {
      totalTtsTasks: 100,
      totalSttTasks: 50,
      totalChars: 50000,
      totalAudioSec: 3600,
      totalVoiceprints: 10,
      totalVoiceClones: 3,
      byTtsEngine: { 'mock-azure-tts': 60, 'mock-edge-tts': 40 },
      bySttEngine: { 'mock-whisper': 30, 'mock-aliyun-stt': 20 },
      avgSttConfidence: 0.88,
    }
    assert.equal(stats.totalTtsTasks, 100)
    assert.equal(stats.avgSttConfidence, 0.88)
    assert.equal(stats.byTtsEngine['mock-azure-tts'], 60)
  })
})
