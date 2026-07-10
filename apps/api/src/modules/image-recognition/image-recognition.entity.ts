/**
 * Phase 101 图像识别 Entity (V11 Sprint 3 Day 36)
 *
 * - 商品识别 (Product Recognition)
 * - 货架分析 (Shelf Analysis)
 * - 视觉搜索 (Visual Search)
 * - 重复图像检测 (Perceptual Hash)
 */

export type RecognitionEngine =
  | 'mock-yolov8'        // YOLOv8 通用目标检测
  | 'mock-yolov8n-shelf' // YOLOv8n 货架专用
  | 'mock-resnet50'       // ResNet50 图像分类
  | 'mock-clip'           // CLIP 零样本分类
  | 'mock-efficientnet'   // EfficientNet 零售商品
  | 'mock-pHash'          // 感知哈希 (perceptual hash)
  | 'mock-dHash'          // 差异哈希

export type RecognitionTaskType =
  | 'product_recognition'  // 商品识别
  | 'shelf_analysis'       // 货架分析
  | 'image_classification' // 图像分类
  | 'visual_search'        // 视觉搜索 (以图搜图)
  | 'duplicate_detection'  // 重复检测
  | 'object_detection'     // 通用目标检测

export type RecognitionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

/**
 * 检测到的对象 (bounding box + 类别 + 置信度)
 */
export interface DetectedObject {
  id: string
  recognitionId: string
  tenantId: string
  /** 类别标签 */
  label: string
  /** 标准化类别 (来自训练集) */
  category?: string
  /** 边界框 */
  bbox: { x: number; y: number; width: number; height: number }
  /** 置信度 */
  confidence: number
  /** SKU/产品 ID (如果是商品识别) */
  skuId?: string
  /** 商品名称 */
  productName?: string
  /** 价格 (元) */
  priceCny?: number
  /** 数量 (货架分析用) */
  quantity?: number
  createdAt: string
}

/**
 * 货架分析详情
 */
export interface ShelfAnalysis {
  /** 总货位数 */
  totalSlots: number
  /** 已占货位 */
  occupiedSlots: number
  /** 空货位 */
  emptySlots: number
  /** 占有率 (0..1) */
  occupancyRate: number
  /** 缺货商品列表 */
  outOfStock: Array<{ skuId: string; productName: string; quantity: number }>
  /** 价格合规检查 */
  priceCompliance: {
    correctCount: number
    incorrectCount: number
    issues: Array<{ skuId: string; expectedPrice: number; detectedPrice: number }>
  }
  /** 摆放整齐度 (0..1) */
  tidiness: number
  /** 关联补货建议 */
  restockSuggestions: Array<{ skuId: string; productName: string; suggestedQuantity: number }>
}

/**
 * 视觉搜索结果
 */
export interface VisualSearchResult {
  /** 源资产 */
  sourceAssetId: string
  /** 匹配资产 */
  matchedAssetId: string
  /** 相似度 (0..1) */
  similarity: number
  /** 距离 (越小越相似) */
  distance: number
  /** 缩略图 URL */
  thumbnailUrl?: string
  matchedAt: string
}

/**
 * 重复检测结果
 */
export interface DuplicateDetection {
  sourceAssetId: string
  duplicates: Array<{
    assetId: string
    pHash: string
    distance: number
    similarity: number
  }>
}

/**
 * 识别任务
 */
export interface RecognitionTask {
  id: string
  tenantId: string
  taskType: RecognitionTaskType
  engine: RecognitionEngine
  /** 源资产 ID (来自 multimedia 模块) */
  sourceAssetId: string
  /** 文件名 */
  filename: string
  /** 状态 */
  status: RecognitionStatus
  /** 进度 */
  progress: number
  /** 耗时 (ms) */
  durationMs?: number
  /** 检测对象数 */
  objectCount: number
  /** 错误信息 */
  errorMessage?: string
  /** 关联业务实体 */
  linkedEntity?: {
    entityType: 'product' | 'shelf' | 'order' | 'store' | 'campaign' | 'other'
    entityId: string
  }
  /** 调用方 */
  requestedBy: string
  createdAt: string
  updatedAt: string
}

/**
 * 识别结果 (完整版, 含任务 + 检测对象 + 详情)
 */
export interface RecognitionResult {
  task: RecognitionTask
  objects: DetectedObject[]
  shelfAnalysis?: ShelfAnalysis
  visualSearchResults?: VisualSearchResult[]
  duplicates?: DuplicateDetection
  /** 平均置信度 */
  avgConfidence: number
  /** 引擎元信息 */
  engineMeta: {
    modelVersion: string
    classesSupported: number
  }
}

/**
 * 视觉指纹 (用于重复检测 + 视觉搜索)
 */
export interface VisualFingerprint {
  assetId: string
  tenantId: string
  /** pHash (64-bit) hex string */
  pHash: string
  /** dHash (64-bit) hex string */
  dHash: string
  /** 颜色直方图 (R/G/B 三通道均值) */
  colorHistogram: { r: number; g: number; b: number }
  /** 图像特征向量 (模拟 embedding) */
  embedding: number[]
  /** 缩略图大小 */
  thumbnailSize: number
  createdAt: string
}

// ============ 工具函数 ============

export function generateRecognitionId(): string {
  return `rec-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

export function generateObjectId(): string {
  return `obj-${Math.random().toString(36).slice(2, 10)}`
}

export function generateFingerprintId(): string {
  return `fp-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * 感知哈希 (pHash) - 基于 DCT
 * 输入 32x32 灰度 → 输出 64-bit hex
 */
export function computePerceptualHash(pixels: Uint8Array): string {
  // 简化: 取像素均值, 大于均值的为 1, 否则 0
  if (pixels.length === 0) return '0'.repeat(16)
  const mean = pixels.reduce((s, v) => s + v, 0) / pixels.length
  let bits = ''
  for (let i = 0; i < Math.min(pixels.length, 64); i++) {
    bits += (pixels[i] ?? 0) > mean ? '1' : '0'
  }
  // bits → hex
  let hex = ''
  for (let i = 0; i < bits.length; i += 4) {
    const chunk = (bits.slice(i, i + 4) || '0000').padEnd(4, '0')
    hex += parseInt(chunk, 2).toString(16)
  }
  return hex.slice(0, 16)
}

/**
 * 差异哈希 (dHash) - 相邻像素差异
 */
export function computeDifferenceHash(pixels: Uint8Array): string {
  if (pixels.length < 9) return '0'.repeat(16)
  let bits = ''
  for (let i = 0; i < Math.min(pixels.length - 1, 64); i++) {
    bits += (pixels[i] ?? 0) > (pixels[i + 1] ?? 0) ? '1' : '0'
  }
  let hex = ''
  for (let i = 0; i < bits.length; i += 4) {
    const chunk = (bits.slice(i, i + 4) || '0000').padEnd(4, '0')
    hex += parseInt(chunk, 2).toString(16)
  }
  return hex.slice(0, 16)
}

/**
 * 汉明距离 (两个 hex pHash)
 */
export function hammingDistance(hex1: string, hex2: string): number {
  let dist = 0
  const maxLen = Math.max(hex1.length, hex2.length)
  for (let i = 0; i < maxLen; i++) {
    const a = hex1[i] ?? '0'
    const b = hex2[i] ?? '0'
    if (a !== b) dist++
  }
  return dist
}

/**
 * 距离 → 相似度 (0..1)
 */
export function distanceToSimilarity(distance: number, maxDistance = 16): number {
  return Math.max(0, 1 - distance / maxDistance)
}

/**
 * 余弦相似度
 */
export function cosineSimilarity(a: number[], b: number[]): number {
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
 * IOU (Intersection over Union) for bbox
 */
export function iou(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): number {
  const x1 = Math.max(a.x, b.x)
  const y1 = Math.max(a.y, b.y)
  const x2 = Math.min(a.x + a.width, b.x + b.width)
  const y2 = Math.min(a.y + a.height, b.y + b.height)
  if (x2 <= x1 || y2 <= y1) return 0
  const intersection = (x2 - x1) * (y2 - y1)
  const areaA = a.width * a.height
  const areaB = b.width * b.height
  return intersection / (areaA + areaB - intersection)
}

/**
 * 引擎运行状态
 */
export interface EngineStatus {
  engineName: RecognitionEngine
  status: 'ACTIVE' | 'DEGRADED' | 'STOPPED'
  tasksRunning: number
  tasksQueued: number
  /** 当前模型版本 */
  modelVersion: string
  /** 累计识别次数 */
  totalTasks: number
  /** 成功率 (0..1) */
  successRate: number
  /** 平均耗时 (ms) */
  avgLatencyMs: number
  /** 最后活跃时间 */
  lastActiveAt: string
  /** 错误率 (0..1) */
  errorRate?: number
  /** 内存使用量 (MB) */
  memoryUsageMb?: number
}

/**
 * 引擎元信息
 */
export const ENGINE_META: Record<RecognitionEngine, {
  displayName: string
  category: 'detection' | 'classification' | 'embedding'
  taskTypes: RecognitionTaskType[]
  classesSupported: number
  avgTimeMs: number
  accuracy: number
}> = {
  'mock-yolov8': {
    displayName: 'YOLOv8 通用目标检测',
    category: 'detection',
    taskTypes: ['object_detection', 'product_recognition'],
    classesSupported: 80,
    avgTimeMs: 150,
    accuracy: 0.92,
  },
  'mock-yolov8n-shelf': {
    displayName: 'YOLOv8n 货架专用',
    category: 'detection',
    taskTypes: ['shelf_analysis', 'product_recognition'],
    classesSupported: 5000,
    avgTimeMs: 100,
    accuracy: 0.94,
  },
  'mock-resnet50': {
    displayName: 'ResNet50 图像分类',
    category: 'classification',
    taskTypes: ['image_classification'],
    classesSupported: 1000,
    avgTimeMs: 80,
    accuracy: 0.88,
  },
  'mock-clip': {
    displayName: 'CLIP 零样本分类',
    category: 'classification',
    taskTypes: ['image_classification', 'visual_search'],
    classesSupported: 100000,
    avgTimeMs: 200,
    accuracy: 0.90,
  },
  'mock-efficientnet': {
    displayName: 'EfficientNet 零售商品',
    category: 'classification',
    taskTypes: ['product_recognition', 'image_classification'],
    classesSupported: 50000,
    avgTimeMs: 120,
    accuracy: 0.93,
  },
  'mock-pHash': {
    displayName: '感知哈希 (重复检测)',
    category: 'embedding',
    taskTypes: ['duplicate_detection', 'visual_search'],
    classesSupported: 0,
    avgTimeMs: 20,
    accuracy: 0.85,
  },
  'mock-dHash': {
    displayName: '差异哈希 (重复检测)',
    category: 'embedding',
    taskTypes: ['duplicate_detection'],
    classesSupported: 0,
    avgTimeMs: 15,
    accuracy: 0.80,
  },
}

/**
 * 模型版本
 */
export function getModelVersion(engine: RecognitionEngine): string {
  const versions: Record<RecognitionEngine, string> = {
    'mock-yolov8': 'yolov8x-v8.2.0',
    'mock-yolov8n-shelf': 'yolov8n-shelf-v3.1',
    'mock-resnet50': 'resnet50-imagenet-v2',
    'mock-clip': 'clip-vit-l-14',
    'mock-efficientnet': 'efficientnet-b5-retail-v4',
    'mock-pHash': 'phash-v1',
    'mock-dHash': 'dhash-v1',
  }
  return versions[engine]
}

/**
 * 模拟随机 embedding
 */
export function mockEmbedding(seed: string, dims = 256): number[] {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  }
  const result: number[] = []
  for (let i = 0; i < dims; i++) {
    h = ((h << 5) - h + i) | 0
    result.push(((h & 0xffff) / 0xffff) * 2 - 1) // [-1, 1]
  }
  // L2 normalize
  const norm = Math.sqrt(result.reduce((s, x) => s + x * x, 0))
  if (norm === 0) return result
  return result.map((x) => x / norm)
}

/**
 * 模拟随机 bbox
 */
export function mockBbox(seed: number): { x: number; y: number; width: number; height: number } {
  let h = seed * 2654435761
  h = ((h >>> 16) ^ h) * 2246822519
  const x = Math.abs(h) % 800
  const y = Math.abs(h >> 8) % 600
  const w = 50 + (Math.abs(h >> 16) % 200)
  const h2 = 50 + (Math.abs(h >> 24) % 200)
  return { x, y, width: w, height: h2 }
}