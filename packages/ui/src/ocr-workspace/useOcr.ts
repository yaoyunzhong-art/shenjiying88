/**
 * Phase 100 OCR + 文档解析 前台 Real Hooks (V11 Sprint 3 Day 35)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { OcrTask, OcrBlock, ParsedDocument, OcrStats, EngineInfo, OcrEngine, ParserEngine } from './types'

const MOCK_TASKS: OcrTask[] = [
  {
    id: 'ocr-001',
    tenantId: 'tenant-A',
    sourceAssetId: 'asset-receipt-001',
    filename: 'receipt-2026-06-25.jpg',
    engine: 'mock-paddleocr',
    language: 'zh-CN',
    enableLayoutAnalysis: true,
    enableTableDetection: false,
    status: 'completed',
    progress: 1.0,
    durationMs: 1250,
    summary: { pageCount: 1, totalChars: 145, avgConfidence: 0.94, languageDetected: 'zh-CN' },
    blockCount: 8,
    createdAt: '2026-06-25T10:00:00Z',
    updatedAt: '2026-06-25T10:00:01Z',
  },
  {
    id: 'ocr-002',
    tenantId: 'tenant-A',
    sourceAssetId: 'asset-invoice-pdf',
    filename: 'invoice-may.pdf',
    engine: 'mock-azure-cv',
    language: 'en-US',
    enableLayoutAnalysis: true,
    enableTableDetection: true,
    status: 'completed',
    progress: 1.0,
    durationMs: 3200,
    summary: { pageCount: 3, totalChars: 1850, avgConfidence: 0.97, languageDetected: 'en-US' },
    blockCount: 42,
    createdAt: '2026-06-26T14:00:00Z',
    updatedAt: '2026-06-26T14:00:03Z',
  },
  {
    id: 'ocr-003',
    tenantId: 'tenant-A',
    sourceAssetId: 'asset-report-scan',
    filename: 'quarterly-report.png',
    engine: 'mock-paddleocr',
    language: 'mixed',
    enableLayoutAnalysis: false,
    enableTableDetection: false,
    status: 'processing',
    progress: 0.65,
    blockCount: 12,
    createdAt: '2026-06-28T09:00:00Z',
    updatedAt: '2026-06-28T09:00:02Z',
  },
]

const MOCK_BLOCKS: Record<string, OcrBlock[]> = {
  'ocr-001': [
    { id: 'b1', taskId: 'ocr-001', page: 1, blockType: 'title', text: '收款收据', bbox: { x: 100, y: 50, width: 400, height: 30 }, confidence: 0.96, order: 0, createdAt: '2026-06-25T10:00:01Z' },
    { id: 'b2', taskId: 'ocr-001', page: 1, blockType: 'text', text: '日期: 2026-06-25', bbox: { x: 100, y: 100, width: 300, height: 25 }, confidence: 0.94, order: 1, createdAt: '2026-06-25T10:00:01Z' },
    { id: 'b3', taskId: 'ocr-001', page: 1, blockType: 'text', text: '金额: ¥1,234.56', bbox: { x: 100, y: 140, width: 300, height: 25 }, confidence: 0.95, order: 2, createdAt: '2026-06-25T10:00:01Z' },
    { id: 'b4', taskId: 'ocr-001', page: 1, blockType: 'text', text: '商户: 审计云科技有限公司', bbox: { x: 100, y: 180, width: 400, height: 25 }, confidence: 0.93, order: 3, createdAt: '2026-06-25T10:00:01Z' },
  ],
  'ocr-002': [
    { id: 'b10', taskId: 'ocr-002', page: 1, blockType: 'title', text: 'INVOICE #2026-05', bbox: { x: 100, y: 50, width: 500, height: 35 }, confidence: 0.98, order: 0, createdAt: '2026-06-26T14:00:03Z' },
    { id: 'b11', taskId: 'ocr-002', page: 1, blockType: 'table', text: 'Item | Qty | Price | Total', bbox: { x: 100, y: 200, width: 600, height: 30 }, confidence: 0.97, order: 1, createdAt: '2026-06-26T14:00:03Z' },
    { id: 'b12', taskId: 'ocr-002', page: 2, blockType: 'text', text: 'Subtotal: $1,234.56', bbox: { x: 100, y: 100, width: 400, height: 25 }, confidence: 0.96, order: 0, createdAt: '2026-06-26T14:00:03Z' },
  ],
}

const MOCK_DOCS: ParsedDocument[] = [
  {
    id: 'doc-001',
    tenantId: 'tenant-A',
    sourceAssetId: 'asset-pdf-report',
    filename: 'annual-report-2025.pdf',
    format: 'pdf',
    parser: 'mock-pdfplumber',
    status: 'parsed',
    pageCount: 24,
    charCount: 86420,
    parseDurationMs: 4800,
    metadata: { title: '2025 年度报告', keywords: ['财报', '营收', '净利润'], fileSize: 1024 * 1024 * 3 },
    tableCount: 12,
    listCount: 5,
    previewText: '本报告涵盖 2025 年度财务状况、经营成果...',
    createdAt: '2026-06-20T10:00:00Z',
    updatedAt: '2026-06-20T10:00:05Z',
  },
  {
    id: 'doc-002',
    tenantId: 'tenant-A',
    sourceAssetId: 'asset-csv-export',
    filename: 'sales-q2.csv',
    format: 'csv',
    parser: 'mock-papaparse',
    status: 'parsed',
    pageCount: 1,
    charCount: 12580,
    parseDurationMs: 80,
    metadata: { keywords: ['销售', '季度'], fileSize: 1024 * 8 },
    tableCount: 1,
    listCount: 0,
    previewText: 'name,amount,date\n销售A,12345.67,2026-04-01...',
    createdAt: '2026-06-22T15:00:00Z',
    updatedAt: '2026-06-22T15:00:00Z',
  },
]

const MOCK_ENGINES: EngineInfo[] = [
  { type: 'mock-paddleocr', category: 'ocr', displayName: 'PaddleOCR (中文)', languages: ['zh-CN', 'en-US'], avgTimePerPageMs: 600, freeQuotaPerMonth: 10000, unitPriceCny: 0.005 },
  { type: 'mock-azure-cv', category: 'ocr', displayName: 'Azure CV', languages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'], avgTimePerPageMs: 500, freeQuotaPerMonth: 5000, unitPriceCny: 0.01 },
  { type: 'mock-tesseract', category: 'ocr', displayName: 'Tesseract OSS', languages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'], avgTimePerPageMs: 800, freeQuotaPerMonth: Infinity, unitPriceCny: 0 },
  { type: 'mock-pdfplumber', category: 'parser', displayName: 'pdfplumber', formats: ['pdf'], avgTimePerPageMs: 200, freeQuotaPerMonth: Infinity, unitPriceCny: 0 },
  { type: 'mock-python-docx', category: 'parser', displayName: 'python-docx', formats: ['docx'], avgTimePerPageMs: 100, freeQuotaPerMonth: Infinity, unitPriceCny: 0 },
  { type: 'mock-openpyxl', category: 'parser', displayName: 'openpyxl', formats: ['xlsx'], avgTimePerPageMs: 150, freeQuotaPerMonth: Infinity, unitPriceCny: 0 },
]

const MOCK_STATS: OcrStats = {
  totalTasks: 89,
  completedTasks: 82,
  failedTasks: 3,
  totalDocuments: 56,
  totalChars: 1245780,
  totalPages: 423,
  byEngine: { 'mock-paddleocr': 45, 'mock-azure-cv': 28, 'mock-tesseract': 16 },
  byFormat: { pdf: 32, xlsx: 12, csv: 8, docx: 4 },
  avgConfidence: 0.93,
  avgParseTimeMs: 1850,
}

// ============ Hooks ============

export function useOcrTasks() {
  return useQuery({
    queryKey: ['ocr', 'tasks'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 80))
      return MOCK_TASKS
    },
    staleTime: 30 * 1000,
  })
}

export function useOcrBlocks(taskId: string) {
  return useQuery({
    queryKey: ['ocr', 'blocks', taskId],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 60))
      return MOCK_BLOCKS[taskId] ?? []
    },
    staleTime: 30 * 1000,
  })
}

export function useParsedDocuments() {
  return useQuery({
    queryKey: ['ocr', 'documents'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 80))
      return MOCK_DOCS
    },
    staleTime: 30 * 1000,
  })
}

export function useEngines() {
  return useQuery({
    queryKey: ['ocr', 'engines'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 30))
      return MOCK_ENGINES
    },
    staleTime: 60 * 1000,
  })
}

export function useOcrStats() {
  return useQuery({
    queryKey: ['ocr', 'stats'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 50))
      return MOCK_STATS
    },
    staleTime: 60 * 1000,
  })
}

export function useCreateOcrTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { sourceAssetId: string; engine?: OcrEngine; language?: string }) => {
      await new Promise((r) => setTimeout(r, 150))
      const task: OcrTask = {
        id: `ocr-${Date.now().toString(36)}`,
        tenantId: 'tenant-A',
        sourceAssetId: input.sourceAssetId,
        filename: `${input.sourceAssetId}.jpg`,
        engine: input.engine ?? 'mock-paddleocr',
        language: (input.language ?? 'auto') as any,
        enableLayoutAnalysis: true,
        enableTableDetection: false,
        status: 'completed',
        progress: 1.0,
        durationMs: 1200,
        summary: { pageCount: 1, totalChars: 256, avgConfidence: 0.95, languageDetected: 'zh-CN' },
        blockCount: 6,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      MOCK_TASKS.unshift(task)
      return task
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ocr', 'tasks'] }),
  })
}

export function useParseDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { sourceAssetId: string; parser?: ParserEngine }) => {
      await new Promise((r) => setTimeout(r, 300))
      const format = input.sourceAssetId.includes('pdf') ? 'pdf'
        : input.sourceAssetId.includes('docx') ? 'docx'
        : input.sourceAssetId.includes('xlsx') ? 'xlsx'
        : input.sourceAssetId.includes('csv') ? 'csv'
        : 'pdf'
      const doc: ParsedDocument = {
        id: `doc-${Date.now().toString(36)}`,
        tenantId: 'tenant-A',
        sourceAssetId: input.sourceAssetId,
        filename: `${input.sourceAssetId}.${format}`,
        format: format as any,
        parser: input.parser ?? 'mock-pdfplumber',
        status: 'parsed',
        pageCount: 1,
        charCount: 1024,
        parseDurationMs: 1500,
        metadata: { title: 'New Document', keywords: ['auto'] },
        tableCount: 1,
        listCount: 0,
        previewText: '新解析文档预览...',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      MOCK_DOCS.unshift(doc)
      return doc
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ocr', 'documents'] }),
  })
}