/**
 * Phase 102 语音处理 Service (V11 Sprint 3 Day 38)
 *
 * 核心能力:
 * 1. TTS 合成 (6 engines + 6 voices + emotion/speed/pitch/volume)
 * 2. STT 转写 (6 engines + diarization + emotion + word tokens)
 * 3. 语音克隆 (Voice Cloning)
 * 4. 声纹注册 + 识别 (Voiceprint enrollment + identification)
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { requireTenantContext } from '../../common/context/tenant-context'
import {
  TtsTask, SttTask, SttSegment, Voiceprint, VoiceClone,
  TtsEngine, SttEngine, VoiceCloningEngine, TtsEmotion,
  TTS_VOICES, TTS_ENGINE_META, STT_ENGINE_META,
  generateTtsTaskId, generateSttTaskId, generateSegmentId,
  generateVoiceprintId, generateVoiceCloneId,
  countChars, estimateAudioDurationSec, cosineSim, mockVoiceprintEmbedding,
} from './voice-processing.entity'
import type {
  CreateTtsTaskDto, CreateSttTaskDto, CloneVoiceDto, EnrollVoiceprintDto,
  IdentifySpeakerDto, ListTtsQuery, ListSttQuery,
  TtsTaskResponse, SttTaskResponse, VoiceStatsResponse,
} from './voice-processing.dto'

@Injectable()
export class VoiceProcessingService {
  /** TTS 任务 */
  private readonly ttsTasks = new Map<string, TtsTask>()
  private readonly ttsTasksByTenant = new Map<string, Set<string>>()
  private readonly ttsTasksByEngine = new Map<string, Set<string>>()

  /** STT 任务 */
  private readonly sttTasks = new Map<string, SttTask>()
  private readonly sttTasksByTenant = new Map<string, Set<string>>()

  /** STT 段落 */
  private readonly segments = new Map<string, SttSegment>()
  private readonly segmentsByTask = new Map<string, Set<string>>()
  private readonly segmentsByTenant = new Map<string, Set<string>>()

  /** 声纹档案 */
  private readonly voiceprints = new Map<string, Voiceprint>()
  private readonly voiceprintsByTenant = new Map<string, Set<string>>()
  private readonly voiceprintsBySpeaker = new Map<string, string>() // speakerName → voiceprintId

  /** 语音克隆 */
  private readonly voiceClones = new Map<string, VoiceClone>()
  private readonly voiceClonesByTenant = new Map<string, Set<string>>()

  /** 总字符数 */
  private totalChars = 0
  /** 总音频时长 (秒) */
  private totalAudioSec = 0

  // ============ 1. TTS 合成 ============

  async createTtsTask(dto: CreateTtsTaskDto): Promise<TtsTask> {
    const ctx = requireTenantContext()
    const engine = dto.engine ?? 'mock-azure-tts'
    const engineMeta = TTS_ENGINE_META.find((e) => e.type === engine)
    if (!engineMeta) throw new BadRequestException(`TTS 引擎 ${engine} 不存在`)
    const voice = TTS_VOICES.find((v) => v.id === dto.voiceId)
    if (!voice) throw new BadRequestException(`音色 ${dto.voiceId} 不存在`)
    if (voice.engine !== engine && engine !== 'mock-edge-tts') {
      // 强制约束, Edge TTS 可用所有 voice
      throw new BadRequestException(`音色 ${dto.voiceId} 不属于引擎 ${engine}`)
    }
    const emotion = dto.emotion ?? voice.defaultEmotion
    if (engineMeta.supportsEmotion === false && dto.emotion && dto.emotion !== voice.defaultEmotion) {
      throw new BadRequestException(`引擎 ${engine} 不支持情感调节`)
    }
    const now = new Date().toISOString()
    const audioSec = estimateAudioDurationSec(dto.text, dto.speedAdjustment ?? 0)
    const task: TtsTask = {
      id: generateTtsTaskId(),
      tenantId: ctx.tenantId,
      text: dto.text,
      engine,
      voiceId: dto.voiceId,
      emotion,
      speedAdjustment: dto.speedAdjustment ?? 0,
      pitchAdjustment: dto.pitchAdjustment ?? 0,
      volumeAdjustment: dto.volumeAdjustment ?? 0,
      outputFormat: dto.outputFormat ?? 'mp3',
      sampleRate: dto.sampleRate ?? 24000,
      status: 'processing',
      progress: 0.3,
      requestedBy: ctx.userId ?? 'system',
      createdAt: now,
      updatedAt: now,
    }
    this.ttsTasks.set(task.id, task)
    this.addTtsToIndexes(task)
    const start = Date.now()
    task.status = 'completed'
    task.progress = 1.0
    task.durationMs = Date.now() - start + Math.round(audioSec * 1000 * 0.1) // 模拟合成耗时
    task.audioDurationSec = audioSec
    task.outputAssetId = `audio-${task.id}`
    task.updatedAt = new Date().toISOString()
    this.totalChars += countChars(dto.text)
    this.totalAudioSec += audioSec
    return task
  }

  async listTtsTasks(query: ListTtsQuery = {}): Promise<TtsTaskResponse[]> {
    const ctx = requireTenantContext()
    const all: TtsTask[] = Array.from(this.ttsTasksByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id: string) => this.ttsTasks.get(id))
      .filter((t): t is TtsTask => t != null)
    let filtered = all
    if (query.status) filtered = filtered.filter((t) => t.status === query.status)
    if (query.engine) filtered = filtered.filter((t) => t.engine === query.engine)
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const limit = query.limit ?? 50
    return filtered.slice(0, limit).map((t) => this.toTtsResponse(t))
  }

  async getTtsTask(taskId: string): Promise<TtsTaskResponse> {
    const ctx = requireTenantContext()
    return this.toTtsResponse(await this.getTtsRaw(taskId, ctx.tenantId))
  }

  async cancelTtsTask(taskId: string): Promise<TtsTask> {
    const ctx = requireTenantContext()
    const task = await this.getTtsRaw(taskId, ctx.tenantId)
    if (task.status === 'completed' || task.status === 'failed') {
      throw new BadRequestException(`任务已是终态 ${task.status}`)
    }
    task.status = 'cancelled'
    task.updatedAt = new Date().toISOString()
    return task
  }

  // ============ 2. STT 转写 ============

  async createSttTask(dto: CreateSttTaskDto): Promise<SttTask> {
    const ctx = requireTenantContext()
    const engine = dto.engine ?? 'mock-azure-stt'
    const engineMeta = STT_ENGINE_META.find((e) => e.type === engine)
    if (!engineMeta) throw new BadRequestException(`STT 引擎 ${engine} 不存在`)
    if (dto.enableDiarization && !engineMeta.supportsDiarization) {
      throw new BadRequestException(`引擎 ${engine} 不支持说话人分离`)
    }
    if (dto.enableEmotionRecognition && !engineMeta.supportsEmotion) {
      throw new BadRequestException(`引擎 ${engine} 不支持情绪识别`)
    }
    const language = dto.language ?? 'zh-CN'
    if (engineMeta.languages.indexOf(language) < 0 && language !== 'auto') {
      throw new BadRequestException(`引擎 ${engine} 不支持语言 ${language}`)
    }
    const now = new Date().toISOString()
    const audioDurationSec = 30 + Math.random() * 120
    const task: SttTask = {
      id: generateSttTaskId(),
      tenantId: ctx.tenantId,
      sourceAssetId: dto.sourceAssetId,
      filename: dto.filename ?? `asset-${dto.sourceAssetId}.wav`,
      engine,
      language,
      enableDiarization: dto.enableDiarization ?? false,
      enableEmotionRecognition: dto.enableEmotionRecognition ?? false,
      status: 'processing',
      progress: 0.4,
      fullText: '',
      segments: [],
      speakerCount: 0,
      avgConfidence: 0,
      requestedBy: ctx.userId ?? 'system',
      createdAt: now,
      updatedAt: now,
    }
    this.sttTasks.set(task.id, task)
    this.addSttToIndexes(task)

    const start = Date.now()
    // 模拟段落
    const sampleTexts = language === 'zh-CN'
      ? ['您好,欢迎致电审计云客服中心', '我想查询一下上个月的账务明细', '好的,稍后为您查询', '请问还有其他问题吗', '没有了,谢谢']
      : ['Hello, welcome to Audit Cloud customer service', 'I want to check my last month account details', 'Sure, let me check for you', 'Any other questions?', 'No thanks']
    const speakers = dto.enableDiarization ? 2 : 1
    const segments: SttSegment[] = []
    let cursorMs = 0
    for (let i = 0; i < sampleTexts.length; i++) {
      const speakerId = dto.enableDiarization ? `spk${(i % speakers) + 1}` : 'spk1'
      const segMs = 2000 + Math.floor(Math.random() * 3000)
      const seg: SttSegment = {
        id: generateSegmentId(),
        taskId: task.id,
        tenantId: ctx.tenantId,
        speakerId,
        speakerName: speakerId === 'spk1' ? '客户' : '客服',
        startMs: cursorMs,
        endMs: cursorMs + segMs,
        text: sampleTexts[i] ?? '',
        confidence: 0.85 + Math.random() * 0.14,
        emotion: dto.enableEmotionRecognition ? this.guessEmotion(sampleTexts[i] ?? '') : undefined,
        tokens: undefined,
      }
      this.segments.set(seg.id, seg)
      if (!this.segmentsByTask.has(task.id)) this.segmentsByTask.set(task.id, new Set())
      this.segmentsByTask.get(task.id)!.add(seg.id)
      if (!this.segmentsByTenant.has(ctx.tenantId)) this.segmentsByTenant.set(ctx.tenantId, new Set())
      this.segmentsByTenant.get(ctx.tenantId)!.add(seg.id)
      segments.push(seg)
      cursorMs += segMs
    }
    task.fullText = segments.map((s) => s.text).join(' ')
    task.segments = segments
    task.speakerCount = speakers
    task.avgConfidence = segments.reduce((s, seg) => s + seg.confidence, 0) / Math.max(1, segments.length)
    task.audioDurationSec = audioDurationSec
    task.status = 'completed'
    task.progress = 1.0
    task.durationMs = Date.now() - start + Math.round(audioDurationSec * 100)
    task.updatedAt = new Date().toISOString()
    this.totalAudioSec += audioDurationSec
    return task
  }

  async getSttTask(taskId: string): Promise<SttTaskResponse> {
    const ctx = requireTenantContext()
    const task = await this.getSttRaw(taskId, ctx.tenantId)
    return this.toSttResponse(task)
  }

  async listSttTasks(query: ListSttQuery = {}): Promise<SttTaskResponse[]> {
    const ctx = requireTenantContext()
    const all: SttTask[] = Array.from(this.sttTasksByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id: string) => this.sttTasks.get(id))
      .filter((t): t is SttTask => t != null)
    let filtered = all
    if (query.status) filtered = filtered.filter((t) => t.status === query.status)
    if (query.engine) filtered = filtered.filter((t) => t.engine === query.engine)
    if (query.language) filtered = filtered.filter((t) => t.language === query.language)
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const limit = query.limit ?? 50
    return filtered.slice(0, limit).map((t) => this.toSttResponse(t))
  }

  async listSttSegments(taskId: string): Promise<SttSegment[]> {
    const ctx = requireTenantContext()
    await this.getSttRaw(taskId, ctx.tenantId)
    const ids = this.segmentsByTask.get(taskId) ?? new Set<string>()
    return Array.from(ids)
      .map((id: string) => this.segments.get(id))
      .filter((s): s is SttSegment => s != null)
      .sort((a, b) => a.startMs - b.startMs)
  }

  async cancelSttTask(taskId: string): Promise<SttTask> {
    const ctx = requireTenantContext()
    const task = await this.getSttRaw(taskId, ctx.tenantId)
    if (task.status === 'completed' || task.status === 'failed') {
      throw new BadRequestException(`任务已是终态 ${task.status}`)
    }
    task.status = 'cancelled'
    task.updatedAt = new Date().toISOString()
    return task
  }

  // ============ 3. 语音克隆 ============

  async cloneVoice(dto: CloneVoiceDto): Promise<VoiceClone> {
    const ctx = requireTenantContext()
    if (dto.referenceDurationSec < 5) {
      throw new BadRequestException('参考音频至少 5 秒')
    }
    if (dto.referenceDurationSec > 600) {
      throw new BadRequestException('参考音频不能超过 10 分钟')
    }
    const now = new Date().toISOString()
    const clone: VoiceClone = {
      id: generateVoiceCloneId(),
      tenantId: ctx.tenantId,
      name: dto.name,
      description: dto.description,
      engine: dto.engine,
      referenceAssetId: dto.referenceAssetId,
      referenceDurationSec: dto.referenceDurationSec,
      status: 'training',
      progress: 0.1,
      createdBy: ctx.userId ?? 'system',
      createdAt: now,
      updatedAt: now,
    }
    this.voiceClones.set(clone.id, clone)
    if (!this.voiceClonesByTenant.has(ctx.tenantId)) this.voiceClonesByTenant.set(ctx.tenantId, new Set())
    this.voiceClonesByTenant.get(ctx.tenantId)!.add(clone.id)
    // 模拟训练
    const start = Date.now()
    clone.status = 'ready'
    clone.progress = 1.0
    clone.trainingDurationMs = Date.now() - start + dto.referenceDurationSec * 100
    clone.similarityScore = 0.82 + Math.random() * 0.15
    clone.updatedAt = new Date().toISOString()
    return clone
  }

  async listVoiceClones(): Promise<VoiceClone[]> {
    const ctx = requireTenantContext()
    const ids = this.voiceClonesByTenant.get(ctx.tenantId) ?? new Set<string>()
    return Array.from(ids)
      .map((id: string) => this.voiceClones.get(id))
      .filter((c): c is VoiceClone => c != null)
  }

  async deleteVoiceClone(cloneId: string): Promise<void> {
    const ctx = requireTenantContext()
    const clone = this.voiceClones.get(cloneId)
    if (!clone || clone.tenantId !== ctx.tenantId) {
      throw new NotFoundException(`语音克隆 ${cloneId} 不存在`)
    }
    this.voiceClones.delete(cloneId)
    this.voiceClonesByTenant.get(ctx.tenantId)?.delete(cloneId)
  }

  // ============ 4. 声纹注册 + 识别 ============

  async enrollVoiceprint(dto: EnrollVoiceprintDto): Promise<Voiceprint> {
    const ctx = requireTenantContext()
    if (dto.referenceAssetIds.length === 0) {
      throw new BadRequestException('至少 1 个参考音频')
    }
    const engine = dto.engine ?? 'mock-azure-stt'
    const now = new Date().toISOString()
    const seed = `${ctx.tenantId}-${dto.speakerName}-${dto.referenceAssetIds.join(',')}`
    const start = Date.now()
    const vp: Voiceprint = {
      id: generateVoiceprintId(),
      tenantId: ctx.tenantId,
      speakerName: dto.speakerName,
      userId: dto.userId,
      engine,
      referenceAssetIds: dto.referenceAssetIds,
      status: 'enrolled',
      embedding: mockVoiceprintEmbedding(seed, 128),
      enrolledDurationMs: Date.now() - start + 200,
      description: dto.description,
      createdBy: ctx.userId ?? 'system',
      createdAt: now,
      updatedAt: now,
    }
    this.voiceprints.set(vp.id, vp)
    if (!this.voiceprintsByTenant.has(ctx.tenantId)) this.voiceprintsByTenant.set(ctx.tenantId, new Set())
    this.voiceprintsByTenant.get(ctx.tenantId)!.add(vp.id)
    this.voiceprintsBySpeaker.set(`${ctx.tenantId}::${dto.speakerName}`, vp.id)
    return vp
  }

  async identifySpeakers(dto: IdentifySpeakerDto): Promise<Array<{
    segmentId: string
    matches: Array<{ voiceprintId: string; speakerName: string; similarity: number; distance: number }>
  }>> {
    const ctx = requireTenantContext()
    const results: Array<{
      segmentId: string
      matches: Array<{ voiceprintId: string; speakerName: string; similarity: number; distance: number }>
    }> = []
    const tenantVps = Array.from(this.voiceprintsByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id: string) => this.voiceprints.get(id))
      .filter((vp): vp is Voiceprint => vp != null)
      .filter((vp) => !dto.candidateVoiceprintIds || dto.candidateVoiceprintIds.includes(vp.id))
    for (const segId of dto.segmentIds) {
      const seg = this.segments.get(segId)
      if (!seg || seg.tenantId !== ctx.tenantId) continue
      // 模拟: 用 segmentId 派生 embedding
      const segEmb = mockVoiceprintEmbedding(segId, 128)
      const matches = tenantVps.map((vp) => {
        const sim = cosineSim(segEmb, vp.embedding)
        return {
          voiceprintId: vp.id,
          speakerName: vp.speakerName,
          similarity: sim,
          distance: 1 - sim,
        }
      })
      results.push({ segmentId: segId, matches })
    }
    return results
  }

  async listVoiceprints(): Promise<Voiceprint[]> {
    const ctx = requireTenantContext()
    const ids = this.voiceprintsByTenant.get(ctx.tenantId) ?? new Set<string>()
    return Array.from(ids)
      .map((id: string) => this.voiceprints.get(id))
      .filter((vp): vp is Voiceprint => vp != null)
  }

  // ============ 5. 引擎与音色元数据 ============

  listTtsEngines() { return TTS_ENGINE_META }
  listSttEngines() { return STT_ENGINE_META }
  listVoices(engine?: TtsEngine) {
    return engine ? TTS_VOICES.filter((v) => v.engine === engine) : TTS_VOICES
  }

  // ============ 6. 统计 ============

  async getVoiceStats(): Promise<VoiceStatsResponse> {
    const ctx = requireTenantContext()
    const tts: TtsTask[] = Array.from(this.ttsTasksByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id: string) => this.ttsTasks.get(id))
      .filter((t): t is TtsTask => t != null)
    const stt: SttTask[] = Array.from(this.sttTasksByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id: string) => this.sttTasks.get(id))
      .filter((t): t is SttTask => t != null)
    const vps: Voiceprint[] = Array.from(this.voiceprintsByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id: string) => this.voiceprints.get(id))
      .filter((vp): vp is Voiceprint => vp != null)
    const clones: VoiceClone[] = Array.from(this.voiceClonesByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id: string) => this.voiceClones.get(id))
      .filter((c): c is VoiceClone => c != null)
    const byTtsEngine: Record<string, number> = {}
    for (const t of tts) {
      byTtsEngine[t.engine] = (byTtsEngine[t.engine] ?? 0) + 1
    }
    const bySttEngine: Record<string, number> = {}
    for (const t of stt) {
      bySttEngine[t.engine] = (bySttEngine[t.engine] ?? 0) + 1
    }
    const completedStt = stt.filter((t) => t.status === 'completed')
    const avgSttConfidence = completedStt.length > 0
      ? completedStt.reduce((s, t) => s + t.avgConfidence, 0) / completedStt.length
      : 0
    return {
      totalTtsTasks: tts.length,
      totalSttTasks: stt.length,
      totalChars: this.totalChars,
      totalAudioSec: this.totalAudioSec,
      totalVoiceprints: vps.length,
      totalVoiceClones: clones.length,
      byTtsEngine,
      bySttEngine,
      avgSttConfidence,
    }
  }

  // ============ 工具 ============
  countTtsTasks(): number { return this.ttsTasks.size }
  countSttTasks(): number { return this.sttTasks.size }
  countSegments(): number { return this.segments.size }
  countVoiceprints(): number { return this.voiceprints.size }

  // ============ Helpers ============

  private async getTtsRaw(taskId: string, tenantId: string): Promise<TtsTask> {
    const t = this.ttsTasks.get(taskId)
    if (!t || t.tenantId !== tenantId) throw new NotFoundException(`TTS 任务 ${taskId} 不存在`)
    return t
  }

  private async getSttRaw(taskId: string, tenantId: string): Promise<SttTask> {
    const t = this.sttTasks.get(taskId)
    if (!t || t.tenantId !== tenantId) throw new NotFoundException(`STT 任务 ${taskId} 不存在`)
    return t
  }

  private addTtsToIndexes(task: TtsTask): void {
    if (!this.ttsTasksByTenant.has(task.tenantId)) this.ttsTasksByTenant.set(task.tenantId, new Set())
    this.ttsTasksByTenant.get(task.tenantId)!.add(task.id)
    if (!this.ttsTasksByEngine.has(task.engine)) this.ttsTasksByEngine.set(task.engine, new Set())
    this.ttsTasksByEngine.get(task.engine)!.add(task.id)
  }

  private addSttToIndexes(task: SttTask): void {
    if (!this.sttTasksByTenant.has(task.tenantId)) this.sttTasksByTenant.set(task.tenantId, new Set())
    this.sttTasksByTenant.get(task.tenantId)!.add(task.id)
  }

  private guessEmotion(text: string): TtsEmotion {
    if (/好|不错|谢谢|感谢|很高兴/.test(text)) return 'happy'
    if (/问题|错误|失败|抱歉/.test(text)) return 'calm'
    if (/!{2,}|!!/.test(text)) return 'excited'
    return 'neutral'
  }

  private toTtsResponse(t: TtsTask): TtsTaskResponse {
    return {
      id: t.id,
      tenantId: t.tenantId,
      text: t.text,
      engine: t.engine,
      voiceId: t.voiceId,
      emotion: t.emotion,
      status: t.status,
      progress: t.progress,
      durationMs: t.durationMs,
      audioDurationSec: t.audioDurationSec,
      outputAssetId: t.outputAssetId,
      errorMessage: t.errorMessage,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }
  }

  private toSttResponse(t: SttTask): SttTaskResponse {
    return {
      id: t.id,
      tenantId: t.tenantId,
      sourceAssetId: t.sourceAssetId,
      filename: t.filename,
      engine: t.engine,
      language: t.language,
      status: t.status,
      progress: t.progress,
      durationMs: t.durationMs,
      fullText: t.fullText,
      speakerCount: t.speakerCount,
      audioDurationSec: t.audioDurationSec,
      avgConfidence: t.avgConfidence,
      segmentCount: this.segmentsByTask.get(t.id)?.size ?? 0,
      errorMessage: t.errorMessage,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }
  }
}