import type { RateLimitResult } from './openapi.entity'
import { RateLimitAdapter } from './datasources/rate-limit.adapter'

/**
 * Phase-44 T174: RateLimiter (滑动窗口限流)
 *
 * DR-44-E: 滑动窗口 (1min QPS) + 日配额
 *
 * 反模式 v4 rate-limiter:
 *  - 滑动窗口 vs 固定窗口 (固定窗口有边界突刺)
 *  - 桶配置: tenantId + endpoint
 *  - 超额返回 Retry-After
 */

const DEFAULT_WINDOW_MS = 60 * 1000  // 1 分钟

export class RateLimiter {
  constructor(private readonly adapter: RateLimitAdapter) {}

  /**
   * 检查 + 记录一次请求
   */
  check(input: {
    tenantId: string
    keyId?: string
    endpoint: string
    now?: number
  }): RateLimitResult {
    const now = input.now || Date.now()
    const bucket = this.adapter.queryBucketByTenant(input.tenantId, input.endpoint)
    if (!bucket) {
      return { allowed: true, remaining: -1 }  // 无桶配置 = 不限流
    }
    if (!bucket.active) {
      return { allowed: false, remaining: 0, reason: 'bucket_disabled' }
    }

    // 1. QPS 滑动窗口检查 (qps = 窗口内允许的最大请求数)
    const windowMs = bucket.windowMs || DEFAULT_WINDOW_MS
    const inWindow = this.adapter.queryInWindow(input.tenantId, input.endpoint, now, windowMs)
    if (inWindow.length >= bucket.qps) {
      const oldestInWindow = inWindow[0]
      const retryAfterMs = oldestInWindow ? (oldestInWindow.timestamp + windowMs) - now : 1000
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil(retryAfterMs / 1000),
        reason: 'qps_exceeded'
      }
    }

    // 2. 日配额检查
    if (bucket.dailyQuota > 0 && input.keyId) {
      const dayStart = this.getDayStart(now)
      const dayEnd = dayStart + 86400000
      const used = this.adapter.queryDailyUsage(input.tenantId, input.keyId, dayStart, dayEnd)
      if (used >= bucket.dailyQuota) {
        const nextDayStart = dayStart + 86400000
        return {
          allowed: false,
          remaining: 0,
          retryAfter: Math.ceil((nextDayStart - now) / 1000),
          reason: 'daily_quota_exceeded'
        }
      }
    }

    // 3. 记录请求
    this.adapter.recordRequest({
      id: `rl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId: input.tenantId,
      keyId: input.keyId,
      endpoint: input.endpoint,
      timestamp: now,
      weight: 1
    })

    return {
      allowed: true,
      remaining: bucket.dailyQuota > 0 && input.keyId
        ? Math.max(0, bucket.dailyQuota - this.adapter.queryDailyUsage(input.tenantId, input.keyId, this.getDayStart(now), this.getDayStart(now) + 86400000) - 1)
        : -1
    }
  }

  /**
   * 创建一个新的限流桶
   */
  createBucket(input: {
    tenantId: string
    endpoint: string
    qps: number
    dailyQuota: number
    windowMs?: number
  }): { id: string; active: boolean } {
    const id = `rlb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    this.adapter.saveBucket({
      id,
      tenantId: input.tenantId,
      endpoint: input.endpoint,
      qps: input.qps,
      dailyQuota: input.dailyQuota,
      windowMs: input.windowMs || DEFAULT_WINDOW_MS,
      active: true,
      createdAt: new Date().toISOString()
    })
    return { id, active: true }
  }

  /**
   * 禁用/启用桶
   */
  setBucketActive(bucketId: string, active: boolean): boolean {
    const bucket = this.adapter.queryBucket(bucketId)
    if (!bucket) return false
    bucket.active = active
    this.adapter.saveBucket(bucket)
    return true
  }

  /**
   * 一天的开始时间戳 (本地 00:00)
   */
  private getDayStart(now: number): number {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }

  /** 检查是否超额 (只读) */
  peek(tenantId: string, endpoint: string, now: number = Date.now()): {
    qps: number
    dailyUsed: number
    allowed: boolean
  } {
    const bucket = this.adapter.queryBucketByTenant(tenantId, endpoint)
    if (!bucket) return { qps: 0, dailyUsed: 0, allowed: true }
    const inWindow = this.adapter.queryInWindow(tenantId, endpoint, now, bucket.windowMs)
    return {
      qps: bucket.qps,
      dailyUsed: inWindow.length,
      allowed: inWindow.length < bucket.qps
    }
  }
}