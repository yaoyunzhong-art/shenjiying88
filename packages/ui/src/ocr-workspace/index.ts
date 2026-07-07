/**
 * Phase 100 OCR 工作台 前台 Barrel (V11 Sprint 3 Day 35)
 */

export { OcrWorkspace } from './OcrWorkspace'
export type { OcrWorkspaceProps } from './OcrWorkspace'
export {
  useOcrTasks, useOcrBlocks, useParsedDocuments, useEngines, useOcrStats,
  useCreateOcrTask, useParseDocument,
} from './useOcr'
export {
  OCR_STATUS_LABELS, OCR_STATUS_COLORS,
  DOC_STATUS_LABELS, DOC_STATUS_COLORS,
  BLOCK_TYPE_LABELS, FORMAT_ICONS,
  type OcrTask, type OcrBlock, type ParsedDocument, type OcrStats,
  type EngineInfo, type OcrStatus, type DocumentStatus,
  type OcrEngine, type ParserEngine, type DocumentFormat, type OcrLanguage, type BlockType,
} from './types'