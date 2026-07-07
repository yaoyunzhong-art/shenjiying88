/**
 * Phase 98 CDN Cache DTO (V10 Sprint 2 Day 29)
 *
 * 请求/响应的 TypeScript 类型定义（不含 class-validator，
 * 此处使用纯接口以保持与现有 controller/service 风格一致）
 */

import type { CacheStrategy, CacheableMethod, CdnCacheRule, EdgeNode, CacheInvalidation } from './cdn.entity'

// ============ 规则管理 DTO ============

export interface CreateRuleDto {
  name: string
  urlPattern: string
  methods?: CacheableMethod[]
  strategy?: CacheStrategy
  maxAge?: number
  staleWhileRevalidate?: number
  enableETag?: boolean
  enableGzip?: boolean
  enableBrotli?: boolean
  varyHeaders?: string[]
  cacheableStatusCodes?: number[]
  priority?: number
  enabled?: boolean
}

export interface UpdateRuleDto {
  name?: string
  urlPattern?: string
  methods?: CacheableMethod[]
  strategy?: CacheStrategy
  maxAge?: number
  staleWhileRevalidate?: number
  enableETag?: boolean
  enableGzip?: boolean
  enableBrotli?: boolean
  varyHeaders?: string[]
  cacheableStatusCodes?: number[]
  priority?: number
  enabled?: boolean
}

// ============ 边缘节点 DTO ============

export interface AddEdgeNodeDto {
  name: string
  region: string
  endpoint: string
  capacityBytes: number
}

// ============ 主动失效 DTO ============

export interface InvalidateDto {
  mode: 'url' | 'pattern'
  target: string
  edgeNodeIds?: string[]
}

// ============ URL 匹配 DTO ============

export interface MatchRuleDto {
  url: string
  method?: string
}

// ============ 响应 DTO ============

export interface RuleListResponse {
  items: CdnCacheRule[]
}

export interface NodeListResponse {
  items: EdgeNode[]
}

export interface MatchRuleResponse {
  matched: boolean
  rule: CdnCacheRule | null
  cacheControl: string | null
}

export interface InvalidationListResponse {
  items: CacheInvalidation[]
}

export interface EdgeNodeStatsResponse {
  totalNodes: number
  onlineNodes: number
  totalCapacityBytes: number
  totalUsedBytes: number
  averageHitRate: number
  averageLatencyMs: number
}
