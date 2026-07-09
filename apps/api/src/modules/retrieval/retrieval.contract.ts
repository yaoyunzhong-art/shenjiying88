/**
 * 🐜 自动: [retrieval] [A] contract 补全
 *
 * Retrieval：跨模块合约类型
 * 定义 retrieval 模块对外暴露的稳定合约接口。
 */
import type {
  RetrievalResult,
  RetrievalQuery,
  DocumentChunk,
  RetrievalStrategy,
} from './retrieval.entity'

export interface RetrievalResultContract {
  query: string
  results: DocumentChunk[]
  totalHits: number
  strategy: RetrievalStrategy
  took: number
}

export function toRetrievalResultContract(full: RetrievalResult): RetrievalResultContract {
  return {
    query: full.query,
    results: full.results,
    totalHits: full.totalHits,
    strategy: full.strategy,
    took: full.took,
  }
}

export type { RetrievalResult, RetrievalQuery, DocumentChunk, RetrievalStrategy }
