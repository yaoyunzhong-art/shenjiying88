/**
 * Phase 100 OCR + 文档解析 Entity (V11 Sprint 3 Day 33)
 *
 * OcrTask: 图片/PDF 文字识别任务
 * Document: 解析后的结构化文档
 * OcrBlock: 识别出的文本块 (含位置 + 置信度)
 * OcrEngine/DocumentParser: 引擎与解析器抽象
 */

export type OcrLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'auto' | 'mixed'

export type DocumentFormat = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'csv' | 'txt' | 'rtf' | 'md'

export type OcrEngineType =
  | 'mock-tesseract'        // 开源 Tesseract OCR
  | 'mock-paddleocr'        // 百度 PaddleOCR (中英文)
  | 'mock-azure-cv'         // Azure Computer Vision Read API
  | 'mock-gcp-vision'       // Google Cloud Vision
  | 'mock-aws-textract'     // AWS Textract
  | 'mock-baidu-ocr'        // 百度 OCR API

export type ParserEngineType =
  | 'mock-pdfplumber'       // PDF 文本提取 (含表格)
  | 'mock-pdfminer'         // PDF 文本提取 (Python)
  | 'mock-python-docx'      // docx 解析
  | 'mock-openpyxl'         // xlsx 解析
  | 'mock-pptx-parser'      // pptx 解析
  | 'mock-papaparse'        // CSV 解析

export type OcrStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type DocumentStatus = 'pending' | 'parsing' | 'parsed' | 'failed'

/**
 * OCR 识别任务
 */
export interface OcrTask {
  id: string
  tenantId: string
  /** 源资产 ID (来自 multimedia 模块) */
  sourceAssetId: string
  /** 文件名 (冗余存储, 加速检索) */
  filename: string
  /** 引擎 */
  engine: OcrEngineType
  /** 语言 */
  language: OcrLanguage
  /** 是否启用版面分析 */
  enableLayoutAnalysis: boolean
  /** 是否检测表格 */
  enableTableDetection: boolean
  /** 状态 */
  status: OcrStatus
  /** 进度 (0..1) */
  progress: number
  /** 耗时 (ms) */
  durationMs?: number
  /** 结果摘要 (页数, 总字符数, 平均置信度) */
  summary?: {
    pageCount: number
    totalChars: number
    avgConfidence: number
    languageDetected?: OcrLanguage
  }
  /** 错误信息 */
  errorMessage?: string
  /** 调用方 */
  requestedBy: string
  /** 关联业务实体 (可选) */
  linkedEntity?: {
    entityType: 'product' | 'order' | 'member' | 'report' | 'receipt' | 'contract' | 'other'
    entityId: string
  }
  createdAt: string
  updatedAt: string
}

/**
 * OCR 文本块 (含位置 + 置信度)
 */
export interface OcrBlock {
  id: string
  taskId: string
  tenantId: string
  /** 页码 (从 1 开始) */
  page: number
  /** 文本块类型 */
  blockType: 'text' | 'title' | 'table' | 'figure' | 'header' | 'footer' | 'list_item'
  /** 文本内容 */
  text: string
  /** 边界框 (x, y, width, height, 单位: 像素) */
  bbox: { x: number; y: number; width: number; height: number }
  /** 置信度 (0..1) */
  confidence: number
  /** 行内顺序 */
  order: number
  createdAt: string
}

/**
 * 解析后的结构化文档
 */
export interface Document {
  id: string
  tenantId: string
  /** 源资产 ID */
  sourceAssetId: string
  /** 文件名 */
  filename: string
  /** 文档格式 */
  format: DocumentFormat
  /** 解析引擎 */
  parser: ParserEngineType
  /** 状态 */
  status: DocumentStatus
  /** 页数 (PDF/PPT) */
  pageCount: number
  /** 字数 / Token 数 */
  charCount: number
  /** 解析耗时 (ms) */
  parseDurationMs?: number
  /** 纯文本内容 (markdown 格式) */
  contentText: string
  /** 元数据 */
  metadata: {
    title?: string
    author?: string
    subject?: string
    keywords?: string[]
    createdAt?: string
    modifiedAt?: string
    pageSize?: { width: number; height: number }
    /** 文件大小 (bytes) */
    fileSize?: number
  }
  /** 结构化数据 (表格 + 列表) */
  structuredData: {
    tables: Array<{
      page: number
      order: number
      headers: string[]
      rows: string[][]
    }>
    lists: Array<{
      page: number
      order: number
      items: string[]
    }>
  }
  /** 错误信息 */
  errorMessage?: string
  /** 解析请求人 */
  parsedBy: string
  createdAt: string
  updatedAt: string
}

/**
 * 引擎元数据
 */
export interface EngineInfo {
  type: OcrEngineType | ParserEngineType
  category: 'ocr' | 'parser'
  displayName: string
  /** 支持的语言 */
  languages?: OcrLanguage[]
  /** 支持的格式 */
  formats?: DocumentFormat[]
  /** 每页估算耗时 (ms) */
  avgTimePerPageMs: number
  /** 每月免费额度 (页) */
  freeQuotaPerMonth: number
  /** 超出单价 (元/页) */
  unitPriceCny: number
}

// ============ 工具函数 ============

export function generateOcrTaskId(): string {
  return `ocr-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

export function generateOcrBlockId(): string {
  return `blk-${Math.random().toString(36).slice(2, 10)}`
}

export function generateDocumentId(): string {
  return `doc-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

/**
 * 解析边界框字符串 (格式: "x,y,w,h")
 */
export function parseBbox(s: string): { x: number; y: number; width: number; height: number } {
  const parts = s.split(',').map((n) => Number(n.trim()))
  if (parts.length !== 4 || parts.some(isNaN)) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }
  const [x, y, width, height] = parts as [number, number, number, number]
  return { x, y, width, height }
}

/**
 * 平均置信度计算
 */
export function averageConfidence(blocks: OcrBlock[]): number {
  if (blocks.length === 0) return 0
  const sum = blocks.reduce((s: number, b: OcrBlock) => s + b.confidence, 0)
  return sum / blocks.length
}

/**
 * 文本清理 (去除多余空白)
 */
export function cleanText(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

/**
 * 提取关键词 (基于词频)
 */
export function extractKeywords(text: string, maxCount = 10): string[] {
  const cleaned = text.replace(/[^\w\u4e00-\u9fa5\s]/g, ' ')
  const words = cleaned.split(/\s+/).filter((w) => w.length >= 2)
  const freq = new Map<string, number>()
  for (const w of words) {
    freq.set(w, (freq.get(w) ?? 0) + 1)
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxCount)
    .map(([w]) => w)
}

/**
 * 是否结构化格式 (含表格)
 */
export function isStructuredFormat(format: DocumentFormat): boolean {
  return ['pdf', 'xlsx', 'docx', 'pptx', 'csv'].includes(format)
}

/**
 * 引擎展示信息
 */
export const OCR_ENGINE_INFO: EngineInfo[] = [
  {
    type: 'mock-tesseract',
    category: 'ocr',
    displayName: 'Tesseract OSS',
    languages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'],
    avgTimePerPageMs: 800,
    freeQuotaPerMonth: Infinity,
    unitPriceCny: 0,
  },
  {
    type: 'mock-paddleocr',
    category: 'ocr',
    displayName: 'PaddleOCR (中文优化)',
    languages: ['zh-CN', 'en-US'],
    avgTimePerPageMs: 600,
    freeQuotaPerMonth: 10000,
    unitPriceCny: 0.005,
  },
  {
    type: 'mock-azure-cv',
    category: 'ocr',
    displayName: 'Azure Computer Vision',
    languages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'mixed'],
    avgTimePerPageMs: 500,
    freeQuotaPerMonth: 5000,
    unitPriceCny: 0.01,
  },
  {
    type: 'mock-gcp-vision',
    category: 'ocr',
    displayName: 'Google Cloud Vision',
    languages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'],
    avgTimePerPageMs: 700,
    freeQuotaPerMonth: 1000,
    unitPriceCny: 0.015,
  },
  {
    type: 'mock-aws-textract',
    category: 'ocr',
    displayName: 'AWS Textract (含表格)',
    languages: ['en-US'],
    avgTimePerPageMs: 1000,
    freeQuotaPerMonth: 1000,
    unitPriceCny: 0.02,
  },
  {
    type: 'mock-baidu-ocr',
    category: 'ocr',
    displayName: '百度智能云 OCR',
    languages: ['zh-CN', 'en-US'],
    avgTimePerPageMs: 400,
    freeQuotaPerMonth: 1000,
    unitPriceCny: 0.008,
  },
  {
    type: 'mock-pdfplumber',
    category: 'parser',
    displayName: 'pdfplumber',
    formats: ['pdf'],
    avgTimePerPageMs: 200,
    freeQuotaPerMonth: Infinity,
    unitPriceCny: 0,
  },
  {
    type: 'mock-pdfminer',
    category: 'parser',
    displayName: 'pdfminer.six',
    formats: ['pdf'],
    avgTimePerPageMs: 250,
    freeQuotaPerMonth: Infinity,
    unitPriceCny: 0,
  },
  {
    type: 'mock-python-docx',
    category: 'parser',
    displayName: 'python-docx',
    formats: ['docx'],
    avgTimePerPageMs: 100,
    freeQuotaPerMonth: Infinity,
    unitPriceCny: 0,
  },
  {
    type: 'mock-openpyxl',
    category: 'parser',
    displayName: 'openpyxl',
    formats: ['xlsx'],
    avgTimePerPageMs: 150,
    freeQuotaPerMonth: Infinity,
    unitPriceCny: 0,
  },
  {
    type: 'mock-pptx-parser',
    category: 'parser',
    displayName: 'pptx-parser',
    formats: ['pptx'],
    avgTimePerPageMs: 300,
    freeQuotaPerMonth: Infinity,
    unitPriceCny: 0,
  },
  {
    type: 'mock-papaparse',
    category: 'parser',
    displayName: 'PapaParse (CSV)',
    formats: ['csv'],
    avgTimePerPageMs: 50,
    freeQuotaPerMonth: Infinity,
    unitPriceCny: 0,
  },
]