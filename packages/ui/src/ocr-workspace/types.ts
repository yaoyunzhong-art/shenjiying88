/**
 * Phase 100 OCR + 文档解析 前台 Types (V11 Sprint 3 Day 35)
 */

export type OcrStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type DocumentStatus = 'pending' | 'parsing' | 'parsed' | 'failed'
export type OcrEngine = 'mock-tesseract' | 'mock-paddleocr' | 'mock-azure-cv' | 'mock-gcp-vision' | 'mock-aws-textract' | 'mock-baidu-ocr'
export type ParserEngine = 'mock-pdfplumber' | 'mock-pdfminer' | 'mock-python-docx' | 'mock-openpyxl' | 'mock-pptx-parser' | 'mock-papaparse'
export type DocumentFormat = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'csv' | 'txt' | 'rtf' | 'md'
export type OcrLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'auto' | 'mixed'
export type BlockType = 'text' | 'title' | 'table' | 'figure' | 'header' | 'footer' | 'list_item'

export interface OcrTask {
  id: string
  tenantId: string
  sourceAssetId: string
  filename: string
  engine: OcrEngine
  language: OcrLanguage
  enableLayoutAnalysis: boolean
  enableTableDetection: boolean
  status: OcrStatus
  progress: number
  durationMs?: number
  summary?: {
    pageCount: number
    totalChars: number
    avgConfidence: number
    languageDetected?: OcrLanguage
  }
  errorMessage?: string
  blockCount: number
  createdAt: string
  updatedAt: string
}

export interface OcrBlock {
  id: string
  taskId: string
  page: number
  blockType: BlockType
  text: string
  bbox: { x: number; y: number; width: number; height: number }
  confidence: number
  order: number
  createdAt: string
}

export interface ParsedDocument {
  id: string
  tenantId: string
  sourceAssetId: string
  filename: string
  format: DocumentFormat
  parser: ParserEngine
  status: DocumentStatus
  pageCount: number
  charCount: number
  parseDurationMs?: number
  metadata: {
    title?: string
    author?: string
    keywords?: string[]
    fileSize?: number
  }
  tableCount: number
  listCount: number
  previewText: string
  createdAt: string
  updatedAt: string
}

export interface OcrStats {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  totalDocuments: number
  totalChars: number
  totalPages: number
  byEngine: Record<string, number>
  byFormat: Record<string, number>
  avgConfidence: number
  avgParseTimeMs: number
}

export interface EngineInfo {
  type: string
  category: 'ocr' | 'parser'
  displayName: string
  languages?: string[]
  formats?: string[]
  avgTimePerPageMs: number
  freeQuotaPerMonth: number
  unitPriceCny: number
}

// ============ 显示标签 ============

export const OCR_STATUS_LABELS: Record<OcrStatus, string> = {
  pending: '等待中',
  processing: '识别中',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消',
}

export const OCR_STATUS_COLORS: Record<OcrStatus, string> = {
  pending: '#bfbfbf',
  processing: '#1890ff',
  completed: '#52c41a',
  failed: '#ff4d4f',
  cancelled: '#8c8c8c',
}

export const DOC_STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: '等待中',
  parsing: '解析中',
  parsed: '已完成',
  failed: '失败',
}

export const DOC_STATUS_COLORS: Record<DocumentStatus, string> = {
  pending: '#bfbfbf',
  parsing: '#1890ff',
  parsed: '#52c41a',
  failed: '#ff4d4f',
}

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  text: '正文',
  title: '标题',
  table: '表格',
  figure: '图表',
  header: '页眉',
  footer: '页脚',
  list_item: '列表项',
}

export const FORMAT_ICONS: Record<DocumentFormat, string> = {
  pdf: '📕',
  docx: '📘',
  xlsx: '📗',
  pptx: '📙',
  csv: '📊',
  txt: '📄',
  rtf: '📝',
  md: '📋',
}