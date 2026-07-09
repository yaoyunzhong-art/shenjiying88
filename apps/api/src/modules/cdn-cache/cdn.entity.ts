/**
 * Phase 98 CDN 缓存 Entity (V10 Sprint 2 Day 29)
 *
 * 缓存策略:
 * - URL pattern 路由 (精确/通配符)
 * - TTL 配置
 * - stale-while-revalidate
 * - 边缘节点路由
 * - 主动失效
 */

export type CacheStrategy = 'public' | 'private' | 'no-store' | 'no-cache' | 'immutable'

export type CacheableMethod = 'GET' | 'HEAD'

/**
 * CDN 缓存规则
 */
export interface CdnCacheRule {
  id: string
  tenantId: string
  /** 规则名称 */
  name: string
  /** URL pattern (支持 :param 通配符 + * 全匹配) */
  urlPattern: string
  /** HTTP 方法 */
  methods: CacheableMethod[]
  /** 缓存策略 */
  strategy: CacheStrategy
  /** 缓存 TTL (秒) */
  maxAge: number
  /** stale-while-revalidate (秒) */
  staleWhileRevalidate: number
  /** ETag 启用 */
  enableETag: boolean
  /** Gzip 压缩 */
  enableGzip: boolean
  /** Brotli 压缩 */
  enableBrotli: boolean
  /** Vary 头 (例: 'Accept-Encoding', 'User-Agent') */
  varyHeaders: string[]
  /** 状态码 (只缓存这些状态码的响应) */
  cacheableStatusCodes: number[]
  /** 优先级 (数字越大越优先匹配) */
  priority: number
  /** 是否启用 */
  enabled: boolean
  createdAt: string
  updatedAt: string
}

/**
 * CDN 边缘节点 (实际生产用 CDN 提供商 API, 这里 mock)
 */
export interface EdgeNode {
  id: string
  /** 节点名称 (例: 'edge-cn-shanghai-01') */
  name: string
  /** 地区 (例: 'cn-shanghai') */
  region: string
  /** 节点 URL */
  endpoint: string
  /** 状态 */
  status: 'online' | 'offline' | 'degraded'
  /** 容量 (字节) */
  capacityBytes: number
  /** 已用 (字节) */
  usedBytes: number
  /** 命中率 */
  hitRate: number
  /** 平均延迟 (ms) */
  avgLatencyMs: number
  /** 最后心跳时间 */
  lastHeartbeatAt: string
}

/**
 * CDN 缓存条目 (实际生产在边缘节点内存, 这里 mock 索引)
 */
export interface CdnCacheEntry {
  /** 缓存 key */
  key: string
  /** 关联规则 ID */
  ruleId: string
  /** 边缘节点 ID */
  edgeNodeId: string
  /** 原始 URL */
  url: string
  /** 响应状态码 */
  statusCode: number
  /** 缓存内容大小 (字节) */
  sizeBytes: number
  /** 缓存时间 */
  cachedAt: number
  /** TTL (秒) */
  ttl: number
  /** 边缘节点名称 */
  nodeName: string
  /** 过期时间 */
  expiresAt: string
  /** 命中次数 */
  hitCount: number
  /** ETag */
  etag?: string
}

/**
 * 缓存失效记录
 */
export interface CacheInvalidation {
  id: string
  /** 失效模式: 'url' (精确) / 'pattern' (通配符) */
  mode: 'url' | 'pattern'
  /** 目标 (URL 或 pattern) */
  target: string
  /** URL pattern (contract 兼容) */
  pattern: string
  /** 失效原因 (contract 兼容) */
  reason: string
  /** 创建时间 (contract 兼容) */
  createdAt: string
  /** 触发的边缘节点 */
  edgeNodeIds: string[]
  /** 状态 */
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  /** 影响的条目数 */
  affectedEntries: number
  triggeredAt: string
  completedAt?: string
  triggeredBy: string
}

// ============ 工具函数 ============

export function generateRuleId(): string {
  return `cdn-rule-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}
export function generateNodeId(): string {
  return `edge-${Math.random().toString(36).slice(2, 8)}`
}
export function generateInvalidationId(): string {
  return `cdn-inv-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * URL pattern 编译: '/api/reports/:id' → regex
 */
export function compilePattern(pattern: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = []
  const regexStr = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // 转义正则特殊字符
    .replace(/\*/g, '.*') // * → .*
    .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
      paramNames.push(name)
      return '([^/]+)'
    })
  return { regex: new RegExp(`^${regexStr}$`), paramNames }
}

/**
 * URL pattern 匹配
 */
export function matchUrl(pattern: string, url: string): { match: boolean; params: Record<string, string> } {
  const { regex, paramNames } = compilePattern(pattern)
  const m = url.match(regex)
  if (!m) return { match: false, params: {} }
  const params: Record<string, string> = {}
  for (let i = 0; i < paramNames.length; i++) {
    params[paramNames[i]] = decodeURIComponent(m[i + 1])
  }
  return { match: true, params }
}

/**
 * Cache-Control 头构造
 */
export function buildCacheControlHeader(rule: CdnCacheRule): string {
  const parts: string[] = []
  switch (rule.strategy) {
    case 'public':
      parts.push('public')
      break
    case 'private':
      parts.push('private')
      break
    case 'no-store':
      parts.push('no-store')
      break
    case 'no-cache':
      parts.push('no-cache')
      break
    case 'immutable':
      parts.push('public')
      parts.push('immutable')
      break
  }
  if (rule.strategy !== 'no-store') {
    parts.push(`max-age=${rule.maxAge}`)
    if (rule.staleWhileRevalidate > 0) {
      parts.push(`stale-while-revalidate=${rule.staleWhileRevalidate}`)
    }
  }
  return parts.join(', ')
}

/**
 * ETag 生成 (基于内容 + 时间戳)
 */
export function generateETag(content: string | Buffer, lastModified?: string): string {
  const { createHash } = require('node:crypto')
  const hash = createHash('md5')
    .update(typeof content === 'string' ? content : content)
    .update(lastModified ?? new Date().toISOString())
    .digest('base64')
  return `W/"${hash.slice(0, 22)}"`
}

/**
 * 缓存键生成 (URL + Vary headers)
 */
export function buildCacheKey(url: string, varyHeaders: Record<string, string>): string {
  const sorted = Object.keys(varyHeaders).sort().map((k) => `${k}=${varyHeaders[k]}`).join('&')
  return `${url}${sorted ? `?${sorted}` : ''}`
}

/**
 * 命中率计算
 */
export function computeHitRate(hits: number, misses: number): number {
  const total = hits + misses
  if (total === 0) return 0
  return hits / total
}

/**
 * 内容指纹 (静态资源 immutable 缓存用)
 */
export function contentFingerprint(content: string | Buffer): string {
  const { createHash } = require('node:crypto')
  return createHash('sha256').update(content).digest('hex').slice(0, 12)
}