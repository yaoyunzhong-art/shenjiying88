import type {
  RateLimitBucket,
  RateLimitRecord,
  TenantId
} from '../openapi.entity'

/**
 * Phase-44 T174: RateLimit Adapter
 *
 * 职责:
 *  - 桶配置 (QPS + 日配额)
 *  - 请求记录 (滑动窗口数据)
 *  - 配额统计
 *
 * 反模式 v4 rate-limiter:
 *  - 桶按 tenantId + endpoint 分桶
 *  - 滑动窗口 (默认 60s)
 *  - 日配额 (按天 00:00 重置)
 */
export class RateLimitAdapter {
  private buckets = new Map<string, RateLimitBucket>()  // bucket.id -> bucket
  private records: RateLimitRecord[] = []

  saveBucket(bucket: RateLimitBucket): RateLimitBucket {
    this.buckets.set(bucket.id, { ...bucket })
    return bucket
  }

  queryBucket(id: string): RateLimitBucket | null {
    return this.buckets.get(id) || null
  }

  queryBucketByTenant(tenantId: TenantId, endpoint: string): RateLimitBucket | null {
    for (const b of this.buckets.values()) {
      if (b.tenantId === tenantId && b.endpoint === endpoint) return b
    }
    return null
  }

  queryBucketsByTenant(tenantId: TenantId): RateLimitBucket[] {
    const result: RateLimitBucket[] = []
    for (const b of this.buckets.values()) {
      if (b.tenantId === tenantId) result.push(b)
    }
    return result
  }

  deleteBucket(id: string): boolean {
    return this.buckets.delete(id)
  }

  recordRequest(record: RateLimitRecord): void {
    this.records.push(record)
    // 简化: 不自动清理, 实际生产用 TTL 索引
  }

  /** 滑动窗口查询: 在 [now - windowMs, now] 范围内的请求 */
  queryInWindow(tenantId: TenantId, endpoint: string, now: number, windowMs: number): RateLimitRecord[] {
    const cutoff = now - windowMs
    return this.records.filter(r =>
      r.tenantId === tenantId &&
      (endpoint === '*' || r.endpoint === endpoint) &&
      r.timestamp >= cutoff && r.timestamp <= now
    )
  }

  /** 查询日配额使用 */
  queryDailyUsage(tenantId: TenantId, keyId: string, dayStart: number, dayEnd: number): number {
    return this.records.filter(r =>
      r.tenantId === tenantId &&
      r.keyId === keyId &&
      r.timestamp >= dayStart && r.timestamp < dayEnd
    ).length
  }

  /** 清理过期记录 */
  cleanupExpired(beforeMs: number): number {
    const before = this.records.length
    this.records = this.records.filter(r => r.timestamp >= beforeMs)
    return before - this.records.length
  }

  /** 测试用 */
  seedBuckets(buckets: RateLimitBucket[]): void {
    for (const b of buckets) this.saveBucket(b)
  }
  reset(): void {
    this.buckets.clear()
    this.records = []
  }
}