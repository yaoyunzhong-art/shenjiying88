/**
 * cdn-cache.service.ts — CDN Cache Service (canonical name)
 *
 * CDN 缓存模块入口。
 * 统一导出缓存规则管理 & 边缘节点运营的全部类型与服务。
 *
 * ═══ 导出概览 ═══════════════════════════════════════════════════════
 *
 * 服务类 ───────────────────────
 *   CdnCacheService         缓存规则 CRUD & 边缘节点管理
 *
 * 实体类型 ─────────────────────
 *   CacheStrategy           缓存策略 (public/private/no-store/no-cache/immutable)
 *   CacheableMethod         可缓存 HTTP 方法
 *   CdnCacheRule            缓存规则
 *   EdgeNode                边缘节点
 *   CdnCacheEntry           缓存条目
 *   CacheInvalidation       缓存失效记录
 *
 * 工具函数 ─────────────────────
 *   compilePattern          URL pattern → 正则编译
 *   matchUrl                URL pattern 匹配
 *   buildCacheControlHeader Cache-Control 头构造
 *   generateETag            ETag 生成 (MD5)
 *   buildCacheKey           缓存键生成
 *   computeHitRate          命中率计算
 *   contentFingerprint      内容指纹 (SHA256)
 *   generateRuleId          规则 ID 生成
 *   generateNodeId          节点 ID 生成
 *   generateInvalidationId  失效记录 ID 生成
 *
 * DTO 类型 ─────────────────────
 *   CreateRuleDto            创建规则 DTO
 *   UpdateRuleDto            更新规则 DTO
 *   AddEdgeNodeDto           添加节点 DTO
 *   InvalidateDto            缓存失效 DTO
 *   MatchRuleDto             规则匹配 DTO
 *   RuleListResponse         规则列表响应
 *   NodeListResponse         节点列表响应
 *   MatchRuleResponse        匹配结果响应
 *   InvalidationListResponse 失效记录列表响应
 *   EdgeNodeStatsResponse    节点统计响应
 *
 * ═══ 使用示例 ═══════════════════════════════════════════════════════
 *
 *   import { CdnCacheService, CdnCacheRule, buildCacheControlHeader } from './cdn-cache.service'
 *   const svc = app.get(CdnCacheService)
 *   const rules = svc.getRules(tenantId)
 *   const header = buildCacheControlHeader(rule)
 *
 * @module CdnCache
 */

export { CdnCacheService } from './cdn.service'

// ─── 实体类型 ───────────────────────────────────────────────────────────────
export type {
  CacheStrategy,
  CacheableMethod,
  CdnCacheRule,
  EdgeNode,
  CdnCacheEntry,
  CacheInvalidation,
} from './cdn.entity'

// ─── 工具函数 ───────────────────────────────────────────────────────────────
export {
  generateRuleId,
  generateNodeId,
  generateInvalidationId,
  compilePattern,
  matchUrl,
  buildCacheControlHeader,
  generateETag,
  buildCacheKey,
  computeHitRate,
  contentFingerprint,
} from './cdn.entity'

// ─── DTO ────────────────────────────────────────────────────────────────────
export type {
  CreateRuleDto,
  UpdateRuleDto,
  AddEdgeNodeDto,
  InvalidateDto,
  MatchRuleDto,
  RuleListResponse,
  NodeListResponse,
  MatchRuleResponse,
  InvalidationListResponse,
  EdgeNodeStatsResponse,
} from './cdn.dto'

// ─── CDN 常量 ──────────────────────────────────────────────────────────────
export const DEFAULT_CACHE_MAX_AGE = 3600 // 1 hour
export const DEFAULT_STALE_WHILE_REVALIDATE = 86400 // 24h stale
export const CACHEABLE_STATUS_CODES = [200, 301, 302, 307, 308] as const
export const EDGE_NODE_REGIONS = ['cn-shanghai', 'cn-beijing', 'cn-shenzhen', 'ap-southeast-1', 'us-west-1'] as const
