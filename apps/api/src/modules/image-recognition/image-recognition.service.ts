/**
 * Phase 101 图像识别 Service (V11 Sprint 3 Day 36)
 *
 * 核心能力:
 * 1. 商品识别 (Product Recognition) - YOLOv8/EfficientNet
 * 2. 货架分析 (Shelf Analysis) - 货位占用 + 缺货 + 价格合规 + 补货建议
 * 3. 图像分类 (Classification) - ResNet50/CLIP
 * 4. 视觉搜索 (Visual Search) - pHash + embedding cosine
 * 5. 重复检测 (Duplicate Detection) - pHash + dHash
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { requireTenantContext } from '../../common/context/tenant-context'
import {
  RecognitionTask, DetectedObject, VisualFingerprint,
  RecognitionTaskType, RecognitionEngine,
  RecognitionResult, ShelfAnalysis, VisualSearchResult, DuplicateDetection,
  generateRecognitionId, generateObjectId, generateFingerprintId,
  computePerceptualHash, computeDifferenceHash, hammingDistance, distanceToSimilarity,
  cosineSimilarity, iou,
  ENGINE_META, getModelVersion, mockEmbedding, mockBbox,
} from './image-recognition.entity'
import type {
  CreateRecognitionDto, VisualSearchDto, DuplicateDetectionDto,
  ListRecognitionQuery, RecognitionTaskResponse, RecognitionStatsResponse,
} from './image-recognition.dto'

@Injectable()
export class ImageRecognitionService {
  /** 识别任务 */
  private readonly tasks = new Map<string, RecognitionTask>()
  /** tenantId → taskIds */
  private readonly tasksByTenant = new Map<string, Set<string>>()
  /** sourceAssetId → taskIds */
  private readonly tasksByAsset = new Map<string, Set<string>>()

  /** 检测对象 */
  private readonly objects = new Map<string, DetectedObject>()
  /** recognitionId → objectIds */
  private readonly objectsByRecognition = new Map<string, Set<string>>()
  /** tenantId → objectIds */
  private readonly objectsByTenant = new Map<string, Set<string>>()

  /** 视觉指纹 */
  private readonly fingerprints = new Map<string, VisualFingerprint>()
  /** tenantId → fingerprints */
  private readonly fingerprintsByTenant = new Map<string, Set<string>>()
  /** assetId → fingerprintId */
  private readonly fingerprintsByAsset = new Map<string, string>()

  /** 货架分析缓存 (recognitionId → ShelfAnalysis) */
  private readonly shelfAnalyses = new Map<string, ShelfAnalysis>()
  /** 视觉搜索缓存 */
  private readonly visualSearchCache = new Map<string, VisualSearchResult[]>()
  /** 重复检测缓存 */
  private readonly duplicateCache = new Map<string, DuplicateDetection>()

  /** 重复检测总数 */
  private duplicateCount = 0

  // ============ 1. 创建识别任务 ============

  async createRecognition(dto: CreateRecognitionDto): Promise<RecognitionResult> {
    const ctx = requireTenantContext()
    const engine = dto.engine ?? this.guessEngine(dto.taskType)
    const engineMeta = ENGINE_META[engine]
    if (!engineMeta) {
      throw new BadRequestException(`引擎 ${engine} 不存在`)
    }
    if (!engineMeta.taskTypes.includes(dto.taskType)) {
      throw new BadRequestException(`引擎 ${engine} 不支持任务类型 ${dto.taskType}`)
    }
    const now = new Date().toISOString()
    const task: RecognitionTask = {
      id: generateRecognitionId(),
      tenantId: ctx.tenantId,
      taskType: dto.taskType,
      engine,
      sourceAssetId: dto.sourceAssetId,
      filename: dto.filename ?? `asset-${dto.sourceAssetId}.jpg`,
      status: 'processing',
      progress: 0.2,
      objectCount: 0,
      linkedEntity: dto.linkedEntity,
      requestedBy: ctx.userId ?? 'system',
      createdAt: now,
      updatedAt: now,
    }
    this.tasks.set(task.id, task)
    this.addTaskToIndexes(task)

    // 同步模拟识别
    const start = Date.now()
    const detectedObjects: DetectedObject[] = []
    if (dto.taskType === 'product_recognition' || dto.taskType === 'object_detection') {
      const count = 3 + Math.floor(Math.random() * 5) // 3-7 个对象
      for (let i = 0; i < count; i++) {
        const seed = Date.now() + i
        detectedObjects.push(this.makeMockDetectedObject(task, i, seed))
      }
    } else if (dto.taskType === 'image_classification') {
      detectedObjects.push(this.makeMockDetectedObject(task, 0, Date.now()))
    }
    for (const obj of detectedObjects) {
      this.objects.set(obj.id, obj)
      if (!this.objectsByRecognition.has(task.id)) this.objectsByRecognition.set(task.id, new Set())
      this.objectsByRecognition.get(task.id)!.add(obj.id)
      if (!this.objectsByTenant.has(task.tenantId)) this.objectsByTenant.set(task.tenantId, new Set())
      this.objectsByTenant.get(task.tenantId)!.add(obj.id)
    }

    // 计算视觉指纹
    const fp = this.computeFingerprint(task.tenantId, dto.sourceAssetId)

    let shelfAnalysis: ShelfAnalysis | undefined
    if (dto.taskType === 'shelf_analysis') {
      shelfAnalysis = this.makeMockShelfAnalysis(detectedObjects)
      this.shelfAnalyses.set(task.id, shelfAnalysis)
    }

    task.status = 'completed'
    task.progress = 1.0
    task.objectCount = detectedObjects.length
    task.durationMs = Date.now() - start + engineMeta.avgTimeMs
    task.updatedAt = new Date().toISOString()

    return {
      task,
      objects: detectedObjects,
      shelfAnalysis,
      avgConfidence: this.avgConfidenceOf(detectedObjects),
      engineMeta: {
        modelVersion: getModelVersion(engine),
        classesSupported: engineMeta.classesSupported,
      },
      visualSearchResults: undefined,
      duplicates: undefined,
    }
  }

  async getRecognitionResult(recognitionId: string): Promise<RecognitionResult> {
    const ctx = requireTenantContext()
    const task = await this.getTaskRaw(recognitionId, ctx.tenantId)
    const objects = Array.from(this.objectsByRecognition.get(recognitionId) ?? new Set<string>())
      .map((id: string) => this.objects.get(id))
      .filter((o): o is DetectedObject => o != null)
    return {
      task,
      objects,
      shelfAnalysis: this.shelfAnalyses.get(recognitionId),
      avgConfidence: this.avgConfidenceOf(objects),
      engineMeta: {
        modelVersion: getModelVersion(task.engine),
        classesSupported: ENGINE_META[task.engine].classesSupported,
      },
    }
  }

  async listRecognitionTasks(query: ListRecognitionQuery = {}): Promise<RecognitionTaskResponse[]> {
    const ctx = requireTenantContext()
    const all: RecognitionTask[] = Array.from(this.tasksByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id: string) => this.tasks.get(id))
      .filter((t): t is RecognitionTask => t != null)
    let filtered = all
    if (query.taskType) filtered = filtered.filter((t) => t.taskType === query.taskType)
    if (query.status) filtered = filtered.filter((t) => t.status === query.status)
    if (query.engine) filtered = filtered.filter((t) => t.engine === query.engine)
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const limit = query.limit ?? 50
    return filtered.slice(0, limit).map((t) => this.toTaskResponse(t))
  }

  async cancelRecognition(recognitionId: string): Promise<RecognitionTask> {
    const ctx = requireTenantContext()
    const task = await this.getTaskRaw(recognitionId, ctx.tenantId)
    if (task.status === 'completed' || task.status === 'failed') {
      throw new BadRequestException(`任务已是终态 ${task.status}, 不可取消`)
    }
    task.status = 'cancelled'
    task.updatedAt = new Date().toISOString()
    return task
  }

  // ============ 2. 视觉搜索 ============

  async visualSearch(dto: VisualSearchDto): Promise<VisualSearchResult[]> {
    const ctx = requireTenantContext()
    // 确保源资产有指纹
    const sourceFp = await this.ensureFingerprint(ctx.tenantId, dto.sourceAssetId)
    const candidates: VisualFingerprint[] = []
    const allFps = Array.from(this.fingerprintsByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id: string) => this.fingerprints.get(id))
      .filter((fp): fp is VisualFingerprint => fp != null)
    for (const fp of allFps) {
      if (fp.assetId === dto.sourceAssetId) continue
      if (dto.candidateAssetIds && !dto.candidateAssetIds.includes(fp.assetId)) continue
      candidates.push(fp)
    }
    const results: VisualSearchResult[] = candidates.map((cand) => {
      const distance = hammingDistance(sourceFp.pHash, cand.pHash)
      const similarity = distanceToSimilarity(distance)
      return {
        sourceAssetId: dto.sourceAssetId,
        matchedAssetId: cand.assetId,
        similarity,
        distance,
        matchedAt: new Date().toISOString(),
      }
    })
    results.sort((a, b) => b.similarity - a.similarity)
    const topK = dto.topK ?? 10
    const minSim = dto.minSimilarity ?? 0
    const filtered = results.filter((r) => r.similarity >= minSim).slice(0, topK)
    this.visualSearchCache.set(dto.sourceAssetId, filtered)
    return filtered
  }

  // ============ 3. 重复检测 ============

  async detectDuplicates(dto: DuplicateDetectionDto): Promise<DuplicateDetection> {
    const ctx = requireTenantContext()
    const sourceFp = await this.ensureFingerprint(ctx.tenantId, dto.sourceAssetId)
    const allFps = Array.from(this.fingerprintsByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id: string) => this.fingerprints.get(id))
      .filter((fp): fp is VisualFingerprint => fp != null && fp.assetId !== dto.sourceAssetId)
    const threshold = dto.threshold ?? 0.85
    const candidates = dto.candidateAssetIds
      ? allFps.filter((fp) => dto.candidateAssetIds!.includes(fp.assetId))
      : allFps
    const duplicates = candidates
      .map((cand) => {
        const distance = hammingDistance(sourceFp.pHash, cand.pHash)
        const similarity = distanceToSimilarity(distance)
        return {
          assetId: cand.assetId,
          pHash: cand.pHash,
          distance,
          similarity,
        }
      })
      .filter((d) => d.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
    const result: DuplicateDetection = {
      sourceAssetId: dto.sourceAssetId,
      duplicates,
    }
    this.duplicateCache.set(dto.sourceAssetId, result)
    this.duplicateCount += duplicates.length
    return result
  }

  // ============ 4. 引擎元数据 ============

  listEngines(): Array<{
    type: string
    displayName: string
    category: string
    taskTypes: RecognitionTaskType[]
    classesSupported: number
    avgTimeMs: number
    accuracy: number
  }> {
    return Object.entries(ENGINE_META).map(([type, meta]) => ({
      type,
      displayName: meta.displayName,
      category: meta.category,
      taskTypes: meta.taskTypes,
      classesSupported: meta.classesSupported,
      avgTimeMs: meta.avgTimeMs,
      accuracy: meta.accuracy,
    }))
  }

  // ============ 5. 统计 ============

  async getRecognitionStats(): Promise<RecognitionStatsResponse> {
    const ctx = requireTenantContext()
    const tasks: RecognitionTask[] = Array.from(this.tasksByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id: string) => this.tasks.get(id))
      .filter((t): t is RecognitionTask => t != null)
    const objs: DetectedObject[] = Array.from(this.objectsByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id: string) => this.objects.get(id))
      .filter((o): o is DetectedObject => o != null)
    const completedTasks = tasks.filter((t) => t.status === 'completed').length
    const failedTasks = tasks.filter((t) => t.status === 'failed').length
    const byTaskType: Record<string, number> = {}
    const byEngine: Record<string, number> = {}
    for (const t of tasks) {
      byTaskType[t.taskType] = (byTaskType[t.taskType] ?? 0) + 1
      byEngine[t.engine] = (byEngine[t.engine] ?? 0) + 1
    }
    const totalObjectsDetected = objs.length
    const avgConfidence = totalObjectsDetected > 0
      ? objs.reduce((s: number, o: DetectedObject) => s + o.confidence, 0) / totalObjectsDetected
      : 0
    const completedWithDuration = tasks.filter((t) => t.status === 'completed' && t.durationMs)
    const avgDurationMs = completedWithDuration.length > 0
      ? completedWithDuration.reduce((s: number, t: RecognitionTask) => s + (t.durationMs ?? 0), 0) / completedWithDuration.length
      : 0
    return {
      totalTasks: tasks.length,
      completedTasks,
      failedTasks,
      totalObjectsDetected,
      byTaskType,
      byEngine,
      avgConfidence,
      avgDurationMs,
      duplicatesDetected: this.duplicateCount,
    }
  }

  // ============ 工具 ============

  countTasks(): number { return this.tasks.size }
  countObjects(): number { return this.objects.size }
  countFingerprints(): number { return this.fingerprints.size }

  // ============ Helpers ============

  private async getTaskRaw(taskId: string, tenantId: string): Promise<RecognitionTask> {
    const task = this.tasks.get(taskId)
    if (!task || task.tenantId !== tenantId) {
      throw new NotFoundException(`识别任务 ${taskId} 不存在`)
    }
    return task
  }

  private addTaskToIndexes(task: RecognitionTask): void {
    if (!this.tasksByTenant.has(task.tenantId)) this.tasksByTenant.set(task.tenantId, new Set())
    this.tasksByTenant.get(task.tenantId)!.add(task.id)
    if (!this.tasksByAsset.has(task.sourceAssetId)) this.tasksByAsset.set(task.sourceAssetId, new Set())
    this.tasksByAsset.get(task.sourceAssetId)!.add(task.id)
  }

  private guessEngine(taskType: RecognitionTaskType): RecognitionEngine {
    if (taskType === 'shelf_analysis') return 'mock-yolov8n-shelf'
    if (taskType === 'product_recognition') return 'mock-efficientnet'
    if (taskType === 'image_classification') return 'mock-clip'
    if (taskType === 'visual_search') return 'mock-clip'
    if (taskType === 'duplicate_detection') return 'mock-pHash'
    return 'mock-yolov8'
  }

  private makeMockDetectedObject(task: RecognitionTask, idx: number, seed: number): DetectedObject {
    const labels = ['可口可乐 330ml', '农夫山泉 550ml', '蒙牛纯牛奶 250ml', '康师傅红烧牛肉面', '乐事薯片原味', '奥利奥饼干', '雪碧 600ml']
    const label = labels[idx % labels.length] ?? '未知商品'
    const skuIds = ['SKU-001', 'SKU-002', 'SKU-003', 'SKU-004', 'SKU-005']
    const skuId = skuIds[idx % skuIds.length]
    return {
      id: generateObjectId(),
      recognitionId: task.id,
      tenantId: task.tenantId,
      label,
      category: 'beverage/snack',
      bbox: mockBbox(seed),
      confidence: 0.75 + Math.random() * 0.24,
      skuId,
      productName: label,
      priceCny: 2 + Math.random() * 30,
      quantity: 1 + Math.floor(Math.random() * 5),
      createdAt: new Date().toISOString(),
    }
  }

  private makeMockShelfAnalysis(objects: DetectedObject[]): ShelfAnalysis {
    const totalSlots = 24
    const occupied = objects.length
    return {
      totalSlots,
      occupiedSlots: Math.min(occupied, totalSlots),
      emptySlots: Math.max(0, totalSlots - occupied),
      occupancyRate: Math.min(occupied, totalSlots) / totalSlots,
      outOfStock: [
        { skuId: 'SKU-A1', productName: '可口可乐 330ml', quantity: 0 },
      ],
      priceCompliance: {
        correctCount: Math.max(0, occupied - 1),
        incorrectCount: occupied > 1 ? 1 : 0,
        issues: occupied > 1
          ? [{ skuId: 'SKU-B2', expectedPrice: 5, detectedPrice: 5.5 }]
          : [],
      },
      tidiness: 0.85 + Math.random() * 0.1,
      restockSuggestions: [
        { skuId: 'SKU-A1', productName: '可口可乐 330ml', suggestedQuantity: 12 },
      ],
    }
  }

  private avgConfidenceOf(objs: DetectedObject[]): number {
    if (objs.length === 0) return 0
    return objs.reduce((s, o) => s + o.confidence, 0) / objs.length
  }

  private computeFingerprint(tenantId: string, assetId: string): VisualFingerprint {
    const seed = `${assetId}-${tenantId}`
    // 模拟 64 个像素
    const pixels = new Uint8Array(64)
    let h = 0
    for (let i = 0; i < seed.length; i++) {
      h = ((h << 5) - h + seed.charCodeAt(i)) | 0
    }
    for (let i = 0; i < 64; i++) {
      h = ((h << 5) - h + i) | 0
      pixels[i] = Math.abs(h) % 256
    }
    const fp: VisualFingerprint = {
      assetId,
      tenantId,
      pHash: computePerceptualHash(pixels),
      dHash: computeDifferenceHash(pixels),
      colorHistogram: { r: 128, g: 128, b: 128 },
      embedding: mockEmbedding(seed, 256),
      thumbnailSize: 256,
      createdAt: new Date().toISOString(),
    }
    const id = generateFingerprintId()
    this.fingerprints.set(id, fp)
    if (!this.fingerprintsByTenant.has(tenantId)) this.fingerprintsByTenant.set(tenantId, new Set())
    this.fingerprintsByTenant.get(tenantId)!.add(id)
    this.fingerprintsByAsset.set(assetId, id)
    return fp
  }

  private async ensureFingerprint(tenantId: string, assetId: string): Promise<VisualFingerprint> {
    const id = this.fingerprintsByAsset.get(assetId)
    if (id) {
      const fp = this.fingerprints.get(id)
      if (fp && fp.tenantId === tenantId) return fp
    }
    return this.computeFingerprint(tenantId, assetId)
  }

  private toTaskResponse(t: RecognitionTask): RecognitionTaskResponse {
    const objs = Array.from(this.objectsByRecognition.get(t.id) ?? new Set<string>())
      .map((id: string) => this.objects.get(id))
      .filter((o): o is DetectedObject => o != null)
    return {
      id: t.id,
      tenantId: t.tenantId,
      taskType: t.taskType,
      engine: t.engine,
      sourceAssetId: t.sourceAssetId,
      filename: t.filename,
      status: t.status,
      progress: t.progress,
      durationMs: t.durationMs,
      objectCount: t.objectCount,
      errorMessage: t.errorMessage,
      avgConfidence: this.avgConfidenceOf(objs),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }
  }
}