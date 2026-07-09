/**
 * 🐜 自动: [cdn-cache] [A] contract 补全
 *
 * CDN Cache：跨模块合约类型
 * 定义 cdn-cache 模块对外暴露的稳定合约接口，
 * 供其它模块（deploy, gateway, monitoring 等）消费。
 */
import type {
  CdnCacheRule,
  EdgeNode,
  CdnCacheEntry,
  CacheInvalidation,
  CacheStrategy,
  CacheableMethod,
} from './cdn.entity'

// ─── 合约子集 ──────────────────────────────────────────────────────────

/**
 * CDN 缓存规则合约（跨模块安全子集）
 */
export interface CdnCacheRuleContract {
  id: string
  tenantId: string
  name: string
  urlPattern: string
  strategy: CacheStrategy
  maxAge: number
  enabled: boolean
  priority: number
}

/**
 * 边缘节点合约（跨模块安全子集）
 */
export interface EdgeNodeContract {
  id: string
  name: string
  region: string
  status: string
}

/**
 * 缓存条目合约（跨模块安全子集）
 */
export interface CdnCacheEntryContract {
  key: string
  url: string
  ttl: number
  cachedAt: number
  nodeName: string
}

/**
 * 缓存失效合约（跨模块安全子集）
 */
export interface CacheInvalidationContract {
  id: string
  pattern: string
  reason: string
  createdAt: string
}

// ─── 枚举合约 ───────────────────────────────────────────────────────────

export type CacheStrategyContract = Extract<CacheStrategy, 'public' | 'private' | 'no-store'>
export type CacheableMethodContract = CacheableMethod

// ─── 合约工厂函数 ───────────────────────────────────────────────────────

/**
 * 从完整规则创建合约子集
 */
export function toCdnCacheRuleContract(full: CdnCacheRule): CdnCacheRuleContract {
  return {
    id: full.id,
    tenantId: full.tenantId,
    name: full.name,
    urlPattern: full.urlPattern,
    strategy: full.strategy,
    maxAge: full.maxAge,
    enabled: full.enabled,
    priority: full.priority,
  }
}

/**
 * 从完整节点创建合约子集
 */
export function toEdgeNodeContract(full: EdgeNode): EdgeNodeContract {
  return {
    id: full.id,
    name: full.name,
    region: full.region,
    status: full.status,
  }
}

/**
 * 从完整缓存条目创建合约子集
 */
export function toCdnCacheEntryContract(full: CdnCacheEntry): CdnCacheEntryContract {
  return {
    key: full.key,
    url: full.url,
    ttl: full.ttl,
    cachedAt: full.cachedAt,
    nodeName: full.nodeName,
  }
}

/**
 * 从完整失效记录创建合约子集
 */
export function toCacheInvalidationContract(full: CacheInvalidation): CacheInvalidationContract {
  return {
    id: full.id,
    pattern: full.pattern,
    reason: full.reason,
    createdAt: full.createdAt,
  }
}

// ─── 导出原始类型子集 ───────────────────────────────────────────────────

export type {
  CdnCacheRule,
  EdgeNode,
  CdnCacheEntry,
  CacheInvalidation,
  CacheStrategy,
  CacheableMethod,
}
