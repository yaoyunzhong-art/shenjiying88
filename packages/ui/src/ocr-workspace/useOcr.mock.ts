/**
 * Phase 100 OCR + 文档解析 前台 Mock (V11 Sprint 3 Day 35 - SSR mock)
 */

import type { OcrTask, OcrBlock, ParsedDocument, OcrStats, EngineInfo } from './types'

const MOCK_TASKS: OcrTask[] = [
  { id: 'ocr-001', tenantId: 'tenant-A', sourceAssetId: 'asset-receipt-001', filename: 'receipt-2026-06-25.jpg', engine: 'mock-paddleocr', language: 'zh-CN', enableLayoutAnalysis: true, enableTableDetection: false, status: 'completed', progress: 1.0, durationMs: 1250, summary: { pageCount: 1, totalChars: 145, avgConfidence: 0.94, languageDetected: 'zh-CN' }, blockCount: 8, createdAt: '2026-06-25T10:00:00Z', updatedAt: '2026-06-25T10:00:01Z' },
  { id: 'ocr-002', tenantId: 'tenant-A', sourceAssetId: 'asset-invoice-pdf', filename: 'invoice-may.pdf', engine: 'mock-azure-cv', language: 'en-US', enableLayoutAnalysis: true, enableTableDetection: true, status: 'completed', progress: 1.0, durationMs: 3200, summary: { pageCount: 3, totalChars: 1850, avgConfidence: 0.97, languageDetected: 'en-US' }, blockCount: 42, createdAt: '2026-06-26T14:00:00Z', updatedAt: '2026-06-26T14:00:03Z' },
  { id: 'ocr-003', tenantId: 'tenant-A', sourceAssetId: 'asset-report-scan', filename: 'quarterly-report.png', engine: 'mock-paddleocr', language: 'mixed', enableLayoutAnalysis: false, enableTableDetection: false, status: 'processing', progress: 0.65, blockCount: 12, createdAt: '2026-06-28T09:00:00Z', updatedAt: '2026-06-28T09:00:02Z' },
]

const MOCK_BLOCKS: Record<string, OcrBlock[]> = {
  'ocr-001': [
    { id: 'b1', taskId: 'ocr-001', page: 1, blockType: 'title', text: '收款收据', bbox: { x: 100, y: 50, width: 400, height: 30 }, confidence: 0.96, order: 0, createdAt: '2026-06-25T10:00:01Z' },
    { id: 'b2', taskId: 'ocr-001', page: 1, blockType: 'text', text: '日期: 2026-06-25', bbox: { x: 100, y: 100, width: 300, height: 25 }, confidence: 0.94, order: 1, createdAt: '2026-06-25T10:00:01Z' },
    { id: 'b3', taskId: 'ocr-001', page: 1, blockType: 'text', text: '金额: ¥1,234.56', bbox: { x: 100, y: 140, width: 300, height: 25 }, confidence: 0.95, order: 2, createdAt: '2026-06-25T10:00:01Z' },
  ],
  'ocr-002': [
    { id: 'b10', taskId: 'ocr-002', page: 1, blockType: 'title', text: 'INVOICE #2026-05', bbox: { x: 100, y: 50, width: 500, height: 35 }, confidence: 0.98, order: 0, createdAt: '2026-06-26T14:00:03Z' },
    { id: 'b11', taskId: 'ocr-002', page: 1, blockType: 'table', text: 'Item | Qty | Price', bbox: { x: 100, y: 200, width: 600, height: 30 }, confidence: 0.97, order: 1, createdAt: '2026-06-26T14:00:03Z' },
  ],
}

const MOCK_DOCS: ParsedDocument[] = [
  { id: 'doc-001', tenantId: 'tenant-A', sourceAssetId: 'asset-pdf-report', filename: 'annual-report-2025.pdf', format: 'pdf', parser: 'mock-pdfplumber', status: 'parsed', pageCount: 24, charCount: 86420, parseDurationMs: 4800, metadata: { title: '2025 年度报告', keywords: ['财报', '营收'], fileSize: 1024 * 1024 * 3 }, tableCount: 12, listCount: 5, previewText: '本报告涵盖 2025 年度财务状况...', createdAt: '2026-06-20T10:00:00Z', updatedAt: '2026-06-20T10:00:05Z' },
  { id: 'doc-002', tenantId: 'tenant-A', sourceAssetId: 'asset-csv-export', filename: 'sales-q2.csv', format: 'csv', parser: 'mock-papaparse', status: 'parsed', pageCount: 1, charCount: 12580, parseDurationMs: 80, metadata: { keywords: ['销售'], fileSize: 1024 * 8 }, tableCount: 1, listCount: 0, previewText: 'name,amount,date\n...', createdAt: '2026-06-22T15:00:00Z', updatedAt: '2026-06-22T15:00:00Z' },
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

export function useOcrTasks() { return { data: MOCK_TASKS, isLoading: false } }
export function useOcrBlocks(_taskId: string) { return { data: MOCK_BLOCKS[_taskId] ?? [], isLoading: false } }
export function useParsedDocuments() { return { data: MOCK_DOCS, isLoading: false } }
export function useEngines() { return { data: MOCK_ENGINES, isLoading: false } }
export function useOcrStats() { return { data: MOCK_STATS, isLoading: false } }
export function useCreateOcrTask() { return { mutate: (_: any) => undefined, isPending: false } }
export function useParseDocument() { return { mutate: (_: any) => undefined, isPending: false } }