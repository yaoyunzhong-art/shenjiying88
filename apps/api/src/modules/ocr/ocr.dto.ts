/**
 * Phase 100 OCR + 文档解析 DTO (V11 Sprint 3 Day 33)
 */

import type { OcrLanguage, DocumentFormat, OcrEngineType, ParserEngineType } from './ocr.entity'

export interface CreateOcrTaskDto {
  sourceAssetId: string
  engine?: OcrEngineType
  language?: OcrLanguage
  enableLayoutAnalysis?: boolean
  enableTableDetection?: boolean
  linkedEntity?: {
    entityType: 'product' | 'order' | 'member' | 'report' | 'receipt' | 'contract' | 'other'
    entityId: string
  }
}

export interface ParseDocumentDto {
  sourceAssetId: string
  parser?: ParserEngineType
  /** 是否提取表格 */
  extractTables?: boolean
  /** 是否提取图片 (仅作为引用) */
  extractImages?: boolean
}

export interface ListOcrTasksQuery {
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  engine?: OcrEngineType
  language?: OcrLanguage
  limit?: number
}

export interface ListDocumentsQuery {
  format?: DocumentFormat
  parser?: ParserEngineType
  status?: 'pending' | 'parsing' | 'parsed' | 'failed'
  limit?: number
}

export interface OcrTaskResponse {
  id: string
  tenantId: string
  sourceAssetId: string
  filename: string
  engine: OcrEngineType
  language: OcrLanguage
  enableLayoutAnalysis: boolean
  enableTableDetection: boolean
  status: string
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

export interface OcrBlockResponse {
  id: string
  taskId: string
  page: number
  blockType: string
  text: string
  bbox: { x: number; y: number; width: number; height: number }
  confidence: number
  order: number
  createdAt: string
}

export interface DocumentResponse {
  id: string
  tenantId: string
  sourceAssetId: string
  filename: string
  format: DocumentFormat
  parser: ParserEngineType
  status: string
  pageCount: number
  charCount: number
  parseDurationMs?: number
  metadata: any
  tableCount: number
  listCount: number
  previewText: string
  createdAt: string
  updatedAt: string
}

export interface OcrStatsResponse {
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