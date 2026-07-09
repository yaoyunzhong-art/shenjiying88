/**
 * 🐜 自动: [multimodal-fusion] [A] contract 补全
 *
 * Multimodal Fusion：跨模块合约类型
 * 定义 multimodal-fusion 模块对外暴露的稳定合约接口。
 */
import type { FusionResult, FusionRequest, ModalityType } from './multimodal-fusion.entity'

export interface FusionResultContract {
  requestId: string
  confidence: number
  summary: string
  modalities: ModalityType[]
  processedAt: string
}

export function toFusionResultContract(full: FusionResult): FusionResultContract {
  return {
    requestId: full.requestId,
    confidence: full.confidence,
    summary: full.summary,
    modalities: full.modalities,
    processedAt: full.processedAt?.toISOString() ?? new Date().toISOString(),
  }
}

export type { FusionResult, FusionRequest, ModalityType }
