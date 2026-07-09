/**
 * 🐜 自动: [ocr] [A] contract 补全
 *
 * OCR：跨模块合约类型
 * 定义 ocr 模块对外暴露的稳定合约接口。
 */
import type {
  OcrResult,
  OcrRequest,
  OcrConfig,
  TextBlock,
  RecognitionLanguage,
} from './ocr.entity'

export interface OcrResultContract {
  requestId: string
  text: string
  confidence: number
  blocks: TextBlock[]
  language: RecognitionLanguage
  processedAt: string
}

export function toOcrResultContract(full: OcrResult): OcrResultContract {
  return {
    requestId: full.requestId,
    text: full.text,
    confidence: full.confidence,
    blocks: full.blocks,
    language: full.language,
    processedAt: full.processedAt?.toISOString() ?? new Date().toISOString(),
  }
}

export type { OcrResult, OcrConfig, TextBlock, RecognitionLanguage }
