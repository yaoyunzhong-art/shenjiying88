import { Injectable } from '@nestjs/common'
import { RateLimiter } from '../rate-limiter'
import { QuotaAdapter } from '../datasources/quota.adapter'
import { RateLimitAdapter } from '../datasources/rate-limit.adapter'
import type {
  TenantId,
  QuotaUsage
} from '../openapi.entity'

/**
 * Phase-44 T174: UsageService (用量统计业务层)
 *
 * 业务职责:
 *  - 创建/管理限流桶
 *  - 用量统计 + 日配额预警
 *  - 多租户聚合报表
 */
@Injectable()
export class UsageService {
  constructor(
    private readonly rateLimiter: RateLimiter,
    private readonly quotaAdapter: QuotaAdapter,
    private readonly rateLimitAdapter: RateLimitAdapter
  ) {}

  /**
   * 创建限流桶
   */
  createBucket(input: {
    tenantId: TenantId
    endpoint: string
    qps: number
    dailyQuota: number
    windowMs?: number
  }) {
    return this.rateLimiter.createBucket(input)
  }

  /**
   * 启用/禁用桶
   */
  setBucketActive(bucketId: string, active: boolean): boolean {
    return this.rateLimiter.setBucketActive(bucketId, active)
  }

  /**
   * 检查请求 (限流 + 配额)
   */
  checkRequest(input: {
    tenantId: TenantId
    keyId: string
    endpoint: string
  }) {
    const result = this.rateLimiter.check(input)

    // 如果通过, 累加日配额
    if (result.allowed && input.keyId) {
      const dailyQuota = this.getDailyQuotaFor(input.tenantId, input.endpoint)
      if (dailyQuota > 0) {
        this.quotaAdapter.increment(input.tenantId, input.keyId, this.todayKey(), dailyQuota)
      }
    }

    return result
  }

  /**
   * 查询用量
   */
  getUsage(tenantId: TenantId, keyId: string, periodKey?: string): QuotaUsage | null {
    return this.quotaAdapter.queryByPeriod(tenantId, keyId, periodKey || this.todayKey())
  }

  /**
   * 列出所有桶
   */
  listBuckets(tenantId: TenantId) {
    return this.rateLimitAdapter.queryBucketsByTenant(tenantId)
  }

  /**
   * 列出所有用量
   */
  listUsage(tenantId: TenantId): QuotaUsage[] {
    return this.quotaAdapter.queryByTenant(tenantId)
  }

  /**
   * 聚合报表
   */
  report(tenantId: TenantId): {
    totalBuckets: number
    activeBuckets: number
    totalUsageToday: number
    overageKeys: number
    topEndpoints: Array<{ endpoint: string; count: number }>
  } {
    const buckets = this.rateLimitAdapter.queryBucketsByTenant(tenantId)
    const usage = this.quotaAdapter.queryByTenant(tenantId).filter(u => u.periodKey === this.todayKey())
    const totalUsageToday = usage.reduce((sum, u) => sum + u.usedCount, 0)
    const overageKeys = usage.filter(u => u.overageCount > 0).length

    // 统计 endpoint (基于桶)
    const endpointCounts = new Map<string, number>()
    const now = Date.now()
    for (const b of buckets) {
      const cnt = this.rateLimitAdapter.queryInWindow(tenantId, b.endpoint, now, b.windowMs).length
      endpointCounts.set(b.endpoint, (endpointCounts.get(b.endpoint) || 0) + cnt)
    }
    const topEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalBuckets: buckets.length,
      activeBuckets: buckets.filter(b => b.active).length,
      totalUsageToday,
      overageKeys,
      topEndpoints
    }
  }

  /**
   * 获取 endpoint 的日配额
   */
  private getDailyQuotaFor(tenantId: TenantId, endpoint: string): number {
    const bucket = this.rateLimitAdapter.queryBucketByTenant(tenantId, endpoint)
    return bucket?.dailyQuota || 0
  }

  /**
   * 今日 key (YYYY-MM-DD)
   */
  private todayKey(): string {
    return new Date().toISOString().slice(0, 10)
  }
}