/**
 * empower-card.entity.ts — 知识赋能卡片实体 (ADR-045)
 *
 * 对应 Prisma model: EmpowerCard
 * 用于树哥派单时自动检索 top-3 知识注入
 */

/** 赋能卡片 */
export interface EmpowerCardEntity {
  id: string
  tag: string          // 竞品|技术|市场|用户|合规|设备|会员|运营|选址
  summary: string      // ≤140字摘要
  source: string       // 来源名称
  freshnessScore: number  // 0-100
  moduleMapping: string | null  // P-38/会员系统/...
  quoteCount: number
  lastQuotedAt: string | null
  confidence: number   // 0-100
  expertVetted: boolean
  detailUrl: string | null
  createdAt: string
  updatedAt: string
}

/** 创建 DTO */
export interface CreateEmpowerCardDto {
  tag: string
  summary: string
  source: string
  moduleMapping?: string
  detailUrl?: string
}

/** 搜索查询 */
export interface EmpowerCardSearchQuery {
  q?: string            // 关键词 (匹配 tag + summary + moduleMapping)
  module?: string       // 模块名精确匹配
  tag?: string          // 标签精确匹配
  limit?: number        // 返回条数 (默认 3)
  minFreshness?: number // 最低新鲜度 (默认 50)
}

/** 搜索响应 */
export interface EmpowerCardSearchResult {
  cards: EmpowerCardEntity[]
  total: number
}

/** 健康检查响应 (ADR-045 · V23 G11) */
export interface EmpowerCardHealthResponse {
  status: 'ok' | 'degraded' | 'down'
  timestamp: string
  cardsCount: number
  lastImport: string | null
  matchApiReachable: boolean
  quoteApiReachable: boolean
  lastMatch: string | null
}
