/**
 * knowledge.contract.ts — 知识库 API 契约
 *
 * 定义 KnowledgeModule 对外暴露的 HTTP 端点、请求/响应形状、错误码。
 * 所有 consumer 应该只依赖本契约,而非内部实现。
 *
 * @see knowledge.controller.ts
 * @see knowledge.dto.ts
 */

// ── 路由前缀 ─────────────────────────────────────────────
export const KNOWLEDGE_API_PREFIX = 'knowledge' as const

// ── HTTP 端点 ────────────────────────────────────────────
export const KnowledgeEndpoints = {
  /** POST /knowledge/index — 索引文档 */
  INDEX: { method: 'POST' as const, path: 'index', summary: 'Index a document' },

  /** POST /knowledge/query — 语义查询 */
  QUERY: { method: 'POST' as const, path: 'query', summary: 'Semantic search' },

  /** POST /knowledge/suggest — 补全建议 */
  SUGGEST: { method: 'POST' as const, path: 'suggest', summary: 'Get knowledge suggestions' },

  /** GET /knowledge/stats — 索引统计 */
  STATS: { method: 'GET' as const, path: 'stats', summary: 'Index statistics' },

  /** GET /knowledge/documents — 文档列表 */
  LIST_DOCUMENTS: { method: 'GET' as const, path: 'documents', summary: 'List indexed documents' },

  /** GET /knowledge/documents/:id — 文档详情 */
  GET_DOCUMENT: { method: 'GET' as const, path: 'documents/:id', summary: 'Get document by id' },

  /** GET /knowledge/documents/by-kind/:kind — 按类型过滤文档 */
  LIST_BY_KIND: { method: 'GET' as const, path: 'documents/by-kind/:kind', summary: 'List documents by kind' },

  /** POST /knowledge/reset — 重置索引 */
  RESET: { method: 'POST' as const, path: 'reset', summary: 'Reset index (test helper)' },

  /** DELETE /knowledge/documents/:id — 删除文档 */
  DELETE_DOCUMENT: { method: 'DELETE' as const, path: 'documents/:id', summary: 'Delete a document' },
} as const

// ── 请求/响应类型 (自 dto.ts 导出的简化引用) ─────────────

export type {
  IndexDocumentDto,
  QueryKnowledgeDto,
  QueryKnowledgeResponseDto,
  KnowledgeStatsDto,
  KnowledgeDocumentDto,
  KnowledgeCompletionDto,
  KnowledgeSuggestionDto,
} from './knowledge.dto'

export type { KnowledgeKind, KnowledgeDocument } from './knowledge.entity'
export { KNOWLEDGE_KINDS } from './knowledge.entity'

// ── 错误码 ───────────────────────────────────────────────
export const KnowledgeErrorCodes = {
  DOCUMENT_NOT_FOUND: 'KNOWLEDGE_DOCUMENT_NOT_FOUND',
  INVALID_KIND: 'KNOWLEDGE_INVALID_KIND',
} as const
