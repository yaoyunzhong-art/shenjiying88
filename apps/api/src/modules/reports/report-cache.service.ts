import { Injectable } from '@nestjs/common'
import { createHash } from 'node:crypto'
import type { ReportResult } from './reports.entity'

/**
 * Phase-39 T169: ReportCacheService - LRU + TTL 缓存
 *
 * 反模式 v4 caching-strategy-pattern 命中:
 *  - LRU (max 100 entries)
 *  - TTL (default 5min)
 *  - cache key: hash(tenantId+type+filters+dimensions+metrics)
 *  - invalidate by tenantId+type
 *
 * 不引入 Redis (in-memory Map + LRU + TTL 即可)
 */

interface CacheEntry {
  key: string
  result: ReportResult
  expiresAt: number
  lastAccessAt: number
}

@Injectable()
export class ReportCacheService {
  private entries = new Map<string, CacheEntry>()
  private readonly MAX_ENTRIES = 100
  private readonly DEFAULT_TTL_MS = 5 * 60 * 1000  // 5min
  private hits = 0
  private misses = 0

  /**
   * 生成缓存 key
   */
  fingerprint(input: {
    tenantId: string
    type: string
    from?: string
    to?: string
    granularity?: string
    filters?: any
    dimensions?: any
    metrics?: any
  }): string {
    const parts = [
      input.tenantId,
      input.type,
      input.from ?? '',
      input.to ?? '',
      input.granularity ?? '',
      JSON.stringify(input.filters ?? {}),
      JSON.stringify(input.dimensions ?? []),
      JSON.stringify(input.metrics ?? [])
    ]
    return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 32)
  }

  /**
   * 获取缓存
   */
  get(key: string): ReportResult | null {
    const entry = this.entries.get(key)
    if (!entry) {
      this.misses++
      return null
    }
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key)
      this.misses++
      return null
    }
    entry.lastAccessAt = Date.now()
    this.hits++
    return { ...entry.result, cached: true }
  }

  /**
   * 写入缓存
   */
  set(key: string, result: ReportResult, ttlMs?: number): void {
    // LRU: 超容量时清理最久未访问
    if (this.entries.size >= this.MAX_ENTRIES) {
      this.evictLRU()
    }
    this.entries.set(key, {
      key,
      result: { ...result, cached: false },
      expiresAt: Date.now() + (ttlMs ?? this.DEFAULT_TTL_MS),
      lastAccessAt: Date.now()
    })
  }

  /**
   * 主动失效 (tenant + type)
   */
  invalidate(tenantId: string, type?: string): number {
    let count = 0
    for (const [k, e] of this.entries) {
      if (e.result.tenantId !== tenantId) continue
      if (type && e.result.type !== type) continue
      this.entries.delete(k)
      count++
    }
    return count
  }

  /**
   * 全部清空
   */
  clear(): void {
    this.entries.clear()
  }

  /**
   * 缓存统计
   */
  stats(): { size: number; maxEntries: number; hitRate: number; hits: number; misses: number } {
    const total = this.hits + this.misses
    return {
      size: this.entries.size,
      maxEntries: this.MAX_ENTRIES,
      hitRate: total === 0 ? 0 : this.hits / total,
      hits: this.hits,
      misses: this.misses
    }
  }

  /** 内部方法: 记录命中 (用于 stats) */
  recordHit(): void { this.hits++ }
  recordMiss(): void { this.misses++ }

  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestAccess = Infinity
    for (const [k, e] of this.entries) {
      if (e.lastAccessAt < oldestAccess) {
        oldestAccess = e.lastAccessAt
        oldestKey = k
      }
    }
    if (oldestKey) this.entries.delete(oldestKey)
  }
}