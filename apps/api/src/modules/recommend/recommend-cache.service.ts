import { Injectable } from '@nestjs/common'
import { createHash } from 'node:crypto'
import type { RecommendationRequest, RecommendationResult } from './recommend.entity'

/**
 * Phase-40 T170: RecommendCacheService (LRU + TTL 缓存)
 *
 * 反模式 v4 caching-strategy-pattern:
 *  - LRU (max 200 entries)
 *  - TTL (default 5min)
 *  - cache key: hash(tenantId+memberId+contextItemId+strategies+limit+filters)
 *  - invalidate by tenantId
 */

interface CacheEntry {
  key: string
  result: RecommendationResult
  expiresAt: number
  lastAccessAt: number
}

@Injectable()
export class RecommendCacheService {
  private entries = new Map<string, CacheEntry>()
  private readonly MAX_ENTRIES = 200
  private readonly DEFAULT_TTL_MS = 5 * 60 * 1000  // 5min

  fingerprint(req: RecommendationRequest): string {
    const parts = [
      req.tenantId,
      req.memberId ?? '',
      req.contextItemId ?? '',
      (req.strategies ?? []).sort().join(','),
      String(req.limit ?? 10),
      JSON.stringify(req.filters ?? {}),
      req.excludePurchased ? '1' : '0',
      req.excludeOutOfStock ? '1' : '0',
      req.diversify ? '1' : '0'
    ]
    return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 32)
  }

  get(key: string): RecommendationResult | null {
    const entry = this.entries.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key)
      return null
    }
    entry.lastAccessAt = Date.now()
    return { ...entry.result, metadata: { ...entry.result.metadata, cached: true } }
  }

  set(key: string, result: RecommendationResult, ttlMs?: number): void {
    if (this.entries.size >= this.MAX_ENTRIES) this.evictLRU()
    this.entries.set(key, {
      key,
      result,
      expiresAt: Date.now() + (ttlMs ?? this.DEFAULT_TTL_MS),
      lastAccessAt: Date.now()
    })
  }

  invalidate(tenantId: string): number {
    let count = 0
    for (const [k, e] of this.entries) {
      if (e.result.request.tenantId === tenantId) {
        this.entries.delete(k)
        count++
      }
    }
    return count
  }

  stats(): { size: number; maxEntries: number } {
    return { size: this.entries.size, maxEntries: this.MAX_ENTRIES }
  }

  clear(): void {
    this.entries.clear()
  }

  private evictLRU(): void {
    let oldest: string | null = null
    let oldestAccess = Infinity
    for (const [k, e] of this.entries) {
      if (e.lastAccessAt < oldestAccess) {
        oldestAccess = e.lastAccessAt
        oldest = k
      }
    }
    if (oldest) this.entries.delete(oldest)
  }
}