export type CacheTier = 'l1' | 'l2' | 'l3'
export type EvictionPolicy = 'lru' | 'lfu' | 'fifo' | 'ttl'

export interface CacheEntry<T = unknown> {
  key: string
  value: T
  tier: CacheTier
  createdAt: Date
  accessedAt: Date
  accessCount: number
  sizeBytes: number
  ttlMs?: number
  tags?: string[]
}

export interface CacheStats {
  tier: CacheTier
  totalKeys: number
  totalBytes: number
  hitCount: number
  missCount: number
  hitRate: number
  evictionCount: number
}

export interface MultiLevelConfig {
  l1: { maxBytes: number; evictionPolicy: EvictionPolicy; ttlMs: number }
  l2: { maxBytes: number; evictionPolicy: EvictionPolicy; ttlMs: number; host?: string }
  l3: { maxBytes: number; evictionPolicy: EvictionPolicy; ttlMs: number; host?: string }
  readThrough: boolean
  writeThrough: boolean
  prefetchEnabled: boolean
}

interface InternalCacheEntry<T = unknown> {
  key: string
  value: T
  tier: CacheTier
  createdAt: number
  accessedAt: number
  accessCount: number
  sizeBytes: number
  ttlMs?: number
  tags?: string[]
}

interface AggregatedCacheEntry {
  key: string
  query: string
  aggregator: 'sum' | 'count' | 'avg' | 'min' | 'max'
  intervalMs: number
  lastRefreshed: number
  cachedValue: unknown
}

export class CacheTierService {
  private config: MultiLevelConfig | null = null
  private l1Cache = new Map<string, InternalCacheEntry>()
  private l2Cache = new Map<string, InternalCacheEntry>()
  private l3Cache = new Map<string, InternalCacheEntry>()

  private l1Stats = { hitCount: 0, missCount: 0, evictionCount: 0 }
  private l2Stats = { hitCount: 0, missCount: 0, evictionCount: 0 }
  private l3Stats = { hitCount: 0, missCount: 0, evictionCount: 0 }

  private aggregatedCaches = new Map<string, AggregatedCacheEntry>()
  private keyToTags = new Map<string, Set<string>>()
  private tagToKeys = new Map<string, Set<string>>()

  // ── 初始化配置 ──────────────────────────────────────────────────

  configure(config: MultiLevelConfig): void {
    this.config = config
    this.l1Cache.clear()
    this.l2Cache.clear()
    this.l3Cache.clear()
    this.l1Stats = { hitCount: 0, missCount: 0, evictionCount: 0 }
    this.l2Stats = { hitCount: 0, missCount: 0, evictionCount: 0 }
    this.l3Stats = { hitCount: 0, missCount: 0, evictionCount: 0 }
    this.aggregatedCaches.clear()
    this.keyToTags.clear()
    this.tagToKeys.clear()
  }

  getConfig(): MultiLevelConfig {
    if (!this.config) {
      throw new Error('缓存未初始化，请先调用 configure')
    }
    return { ...this.config }
  }

  // ── 基础操作 ───────────────────────────────────────────────────

  get<T = unknown>(key: string): T | null {
    if (!this.config) {
      throw new Error('缓存未初始化，请先调用 configure')
    }

    // Try L1 first
    const l1Entry = this.l1Cache.get(key)
    if (l1Entry && !this.isExpired(l1Entry)) {
      this.l1Stats.hitCount++
      this.updateAccess(key, 'l1')
      return l1Entry.value as T
    }

    // L1 miss - if readThrough is disabled, return null immediately
    if (!this.config.readThrough) {
      this.l1Stats.missCount++
      return null
    }

    // Try L2
    const l2Entry = this.l2Cache.get(key)
    if (l2Entry && !this.isExpired(l2Entry)) {
      this.l1Stats.missCount++
      this.l2Stats.hitCount++
      this.updateAccess(key, 'l2')

      // Read-through: promote to L1
      this.promoteToTier(key, 'l2', 'l1')

      return l2Entry.value as T
    }

    // L2 miss - try L3
    const l3Entry = this.l3Cache.get(key)
    if (l3Entry && !this.isExpired(l3Entry)) {
      this.l1Stats.missCount++
      this.l2Stats.missCount++
      this.l3Stats.hitCount++
      this.updateAccess(key, 'l3')

      // Read-through: promote to L2 and L1
      this.promoteToTier(key, 'l3', 'l2')
      this.promoteToTier(key, 'l2', 'l1')

      return l3Entry.value as T
    }

    // All tiers miss
    this.l1Stats.missCount++
    this.l2Stats.missCount++
    this.l3Stats.missCount++
    return null
  }

  set<T = unknown>(key: string, value: T, options?: { ttlMs?: number; tags?: string[] }): void {
    if (!this.config) {
      throw new Error('缓存未初始化，请先调用 configure')
    }

    const sizeBytes = this.estimateSize(value)
    const now = Date.now()

    const entry: InternalCacheEntry<T> = {
      key,
      value,
      tier: 'l1',
      createdAt: now,
      accessedAt: now,
      accessCount: 1,
      sizeBytes,
      ttlMs: options?.ttlMs,
      tags: options?.tags
    }

    // Handle tags
    if (options?.tags) {
      this.keyToTags.set(key, new Set(options.tags))
      for (const tag of options.tags) {
        if (!this.tagToKeys.has(tag)) {
          this.tagToKeys.set(tag, new Set())
        }
        this.tagToKeys.get(tag)!.add(key)
      }
    }

    // Write to L1
    this.enforceEviction('l1', sizeBytes)
    this.l1Cache.set(key, entry)

    // Write-through: write to L2 and L3
    if (this.config.writeThrough) {
      this.enforceEviction('l2', sizeBytes)
      this.enforceEviction('l3', sizeBytes)

      this.l2Cache.set(key, { ...entry, tier: 'l2' })
      this.l3Cache.set(key, { ...entry, tier: 'l3' })
    }
    // When writeThrough=false, only write to L1 (write-back behavior)
  }

  delete(key: string): void {
    this.l1Cache.delete(key)
    this.l2Cache.delete(key)
    this.l3Cache.delete(key)
    this.removeKeyTags(key)
  }

  flush(tier?: CacheTier): void {
    if (!tier || tier === 'l1') {
      this.l1Cache.clear()
      this.l1Stats = { hitCount: 0, missCount: 0, evictionCount: 0 }
    }
    if (!tier || tier === 'l2') {
      this.l2Cache.clear()
      this.l2Stats = { hitCount: 0, missCount: 0, evictionCount: 0 }
    }
    if (!tier || tier === 'l3') {
      this.l3Cache.clear()
      this.l3Stats = { hitCount: 0, missCount: 0, evictionCount: 0 }
    }
  }

  mget<T = unknown>(keys: string[]): (T | null)[] {
    return keys.map((key) => this.get<T>(key))
  }

  mset(entries: { key: string; value: unknown; ttlMs?: number }[]): void {
    for (const entry of entries) {
      this.set(entry.key, entry.value, { ttlMs: entry.ttlMs })
    }
  }

  // ── 高级操作 ───────────────────────────────────────────────────

  has(key: string): boolean {
    const l1Entry = this.l1Cache.get(key)
    if (l1Entry && !this.isExpired(l1Entry)) return true

    const l2Entry = this.l2Cache.get(key)
    if (l2Entry && !this.isExpired(l2Entry)) return true

    const l3Entry = this.l3Cache.get(key)
    if (l3Entry && !this.isExpired(l3Entry)) return true

    return false
  }

  getTTL(key: string): number {
    const l1Entry = this.l1Cache.get(key)
    if (l1Entry) {
      if (!l1Entry.ttlMs) return -1
      const remaining = l1Entry.createdAt + l1Entry.ttlMs - Date.now()
      return remaining > 0 ? remaining : -2
    }

    const l2Entry = this.l2Cache.get(key)
    if (l2Entry) {
      if (!l2Entry.ttlMs) return -1
      const remaining = l2Entry.createdAt + l2Entry.ttlMs - Date.now()
      return remaining > 0 ? remaining : -2
    }

    const l3Entry = this.l3Cache.get(key)
    if (l3Entry) {
      if (!l3Entry.ttlMs) return -1
      const remaining = l3Entry.createdAt + l3Entry.ttlMs - Date.now()
      return remaining > 0 ? remaining : -2
    }

    return -2
  }

  expire(key: string, ttlMs: number): void {
    const updateEntry = (cache: Map<string, InternalCacheEntry>) => {
      const entry = cache.get(key)
      if (entry) {
        entry.ttlMs = ttlMs
        entry.createdAt = Date.now()
      }
    }

    updateEntry(this.l1Cache)
    updateEntry(this.l2Cache)
    updateEntry(this.l3Cache)
  }

  deleteByTag(tag: string): number {
    const keys = this.tagToKeys.get(tag)
    if (!keys) return 0

    let deletedCount = 0
    for (const key of keys) {
      this.delete(key)
      deletedCount++
    }

    this.tagToKeys.delete(tag)
    return deletedCount
  }

  warm(keys: string[], loader: (keys: string[]) => Map<string, unknown>): void {
    if (!this.config?.prefetchEnabled) return

    const missingKeys = keys.filter((key) => !this.has(key))
    if (missingKeys.length === 0) return

    const loaded = loader(missingKeys)
    for (const [key, value] of loaded) {
      this.set(key, value)
    }
  }

  // ── 多级填充 ──────────────────────────────────────────────────

  fillFromLowerTier(key: string): boolean {
    if (!this.config) return false

    // Check if key exists in lower tiers
    const l3Entry = this.l3Cache.get(key)
    if (l3Entry && !this.isExpired(l3Entry)) {
      this.promoteToTier(key, 'l3', 'l2')
      if (this.config.readThrough) {
        this.promoteToTier(key, 'l2', 'l1')
      }
      return true
    }

    const l2Entry = this.l2Cache.get(key)
    if (l2Entry && !this.isExpired(l2Entry)) {
      if (this.config.readThrough) {
        this.promoteToTier(key, 'l2', 'l1')
      }
      return true
    }

    return false
  }

  // ── 预聚合 ───────────────────────────────────────────────────

  setAggregated(
    key: string,
    _query: string,
    aggregator: 'sum' | 'count' | 'avg' | 'min' | 'max',
    intervalMs: number
  ): void {
    this.aggregatedCaches.set(key, {
      key,
      query: _query,
      aggregator,
      intervalMs,
      lastRefreshed: 0,
      cachedValue: null
    })
  }

  getAggregated<T = unknown>(key: string): T {
    const agg = this.aggregatedCaches.get(key)
    if (!agg) {
      throw new Error(`聚合缓存 ${key} 未找到，请先调用 setAggregated`)
    }

    const now = Date.now()
    const isExpired = now - agg.lastRefreshed >= agg.intervalMs

    if (isExpired) {
      // Simulate query execution
      const result = this.simulateAggregation(agg.aggregator)
      agg.cachedValue = result
      agg.lastRefreshed = now
    }

    return agg.cachedValue as T
  }

  refreshAggregated(key: string): void {
    const agg = this.aggregatedCaches.get(key)
    if (!agg) {
      throw new Error(`聚合缓存 ${key} 未找到，请先调用 setAggregated`)
    }

    const result = this.simulateAggregation(agg.aggregator)
    agg.cachedValue = result
    agg.lastRefreshed = Date.now()
  }

  // ── 统计 ──────────────────────────────────────────────────────

  getStats(): CacheStats[] {
    return [
      this.buildTierStats('l1', this.l1Cache, this.l1Stats),
      this.buildTierStats('l2', this.l2Cache, this.l2Stats),
      this.buildTierStats('l3', this.l3Cache, this.l3Stats)
    ]
  }

  getGlobalStats(): {
    totalHits: number
    totalMisses: number
    overallHitRate: number
    totalKeys: number
    totalBytes: number
  } {
    const totalHits = this.l1Stats.hitCount + this.l2Stats.hitCount + this.l3Stats.hitCount
    const totalMisses = this.l1Stats.missCount + this.l2Stats.missCount + this.l3Stats.missCount
    const overallHitRate = totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0

    let totalKeys = 0
    let totalBytes = 0

    for (const entry of this.l1Cache.values()) {
      totalKeys++
      totalBytes += entry.sizeBytes
    }

    return {
      totalHits,
      totalMisses,
      overallHitRate,
      totalKeys,
      totalBytes
    }
  }

  resetStats(): void {
    this.l1Stats = { hitCount: 0, missCount: 0, evictionCount: 0 }
    this.l2Stats = { hitCount: 0, missCount: 0, evictionCount: 0 }
    this.l3Stats = { hitCount: 0, missCount: 0, evictionCount: 0 }
  }

  // ── 私有辅助方法 ───────────────────────────────────────────────

  private isExpired(entry: InternalCacheEntry): boolean {
    if (!entry.ttlMs) return false
    return Date.now() - entry.createdAt > entry.ttlMs
  }

  private updateAccess(key: string, tier: CacheTier): void {
    const getCache = (t: CacheTier) => {
      switch (t) {
        case 'l1':
          return this.l1Cache
        case 'l2':
          return this.l2Cache
        case 'l3':
          return this.l3Cache
      }
    }

    const entry = getCache(tier).get(key)
    if (entry) {
      entry.accessedAt = Date.now()
      entry.accessCount++
    }
  }

  private promoteToTier(key: string, fromTier: CacheTier, toTier: CacheTier): void {
    const sourceCache = fromTier === 'l1' ? this.l1Cache : fromTier === 'l2' ? this.l2Cache : this.l3Cache
    const targetCache = toTier === 'l1' ? this.l1Cache : toTier === 'l2' ? this.l2Cache : this.l3Cache

    const entry = sourceCache.get(key)
    if (!entry || this.isExpired(entry)) return

    const sizeBytes = entry.sizeBytes
    this.enforceEviction(toTier, sizeBytes)

    targetCache.set(key, { ...entry, tier: toTier })
  }

  private enforceEviction(tier: CacheTier, incomingSize: number): void {
    if (!this.config) return

    const getConfig = (t: CacheTier) => {
      switch (t) {
        case 'l1':
          return this.config!.l1
        case 'l2':
          return this.config!.l2
        case 'l3':
          return this.config!.l3
      }
    }

    const getCache = (t: CacheTier) => {
      switch (t) {
        case 'l1':
          return this.l1Cache
        case 'l2':
          return this.l2Cache
        case 'l3':
          return this.l3Cache
      }
    }

    const getStats = (t: CacheTier) => {
      switch (t) {
        case 'l1':
          return this.l1Stats
        case 'l2':
          return this.l2Stats
        case 'l3':
          return this.l3Stats
      }
    }

    const config = getConfig(tier)
    const cache = getCache(tier)
    const stats = getStats(tier)

    let currentBytes = 0
    for (const entry of cache.values()) {
      currentBytes += entry.sizeBytes
    }

    while (currentBytes + incomingSize > config.maxBytes && cache.size > 0) {
      const victim = this.selectVictim(cache, config.evictionPolicy)
      if (victim) {
        const entry = cache.get(victim)
        if (entry) {
          currentBytes -= entry.sizeBytes
          cache.delete(victim)
          this.removeKeyTags(victim)
          stats.evictionCount++
        }
      } else {
        break
      }
    }
  }

  private selectVictim(cache: Map<string, InternalCacheEntry>, policy: EvictionPolicy): string | null {
    if (cache.size === 0) return null

    let victim: string | null = null

    switch (policy) {
      case 'lru': {
        let oldestAccess = Infinity
        for (const [key, entry] of cache) {
          if (entry.accessedAt < oldestAccess) {
            oldestAccess = entry.accessedAt
            victim = key
          }
        }
        break
      }
      case 'lfu': {
        let lowestFreq = Infinity
        for (const [key, entry] of cache) {
          if (entry.accessCount < lowestFreq) {
            lowestFreq = entry.accessCount
            victim = key
          }
        }
        break
      }
      case 'fifo': {
        let oldestCreated = Infinity
        for (const [key, entry] of cache) {
          if (entry.createdAt < oldestCreated) {
            oldestCreated = entry.createdAt
            victim = key
          }
        }
        break
      }
      case 'ttl': {
        let earliestExpiry = Infinity
        for (const [key, entry] of cache) {
          if (entry.ttlMs) {
            const expiry = entry.createdAt + entry.ttlMs
            if (expiry < earliestExpiry) {
              earliestExpiry = expiry
              victim = key
            }
          }
        }
        // If all entries have no TTL, fall back to LRU
        if (victim === null) {
          return this.selectVictim(cache, 'lru')
        }
        break
      }
    }

    return victim
  }

  private removeKeyTags(key: string): void {
    const tags = this.keyToTags.get(key)
    if (tags) {
      for (const tag of tags) {
        this.tagToKeys.get(tag)?.delete(key)
      }
      this.keyToTags.delete(key)
    }
  }

  private estimateSize(value: unknown): number {
    try {
      return JSON.stringify(value).length * 2 // Approximate UTF-16 encoding
    } catch {
      return 100 // Default estimate
    }
  }

  private buildTierStats(
    tier: CacheTier,
    cache: Map<string, InternalCacheEntry>,
    stats: { hitCount: number; missCount: number; evictionCount: number }
  ): CacheStats {
    let totalBytes = 0
    for (const entry of cache.values()) {
      totalBytes += entry.sizeBytes
    }

    const total = stats.hitCount + stats.missCount
    const hitRate = total > 0 ? stats.hitCount / total : 0

    return {
      tier,
      totalKeys: cache.size,
      totalBytes,
      hitCount: stats.hitCount,
      missCount: stats.missCount,
      hitRate,
      evictionCount: stats.evictionCount
    }
  }

  private simulateAggregation(aggregator: 'sum' | 'count' | 'avg' | 'min' | 'max'): number {
    // Simulate aggregation result
    switch (aggregator) {
      case 'sum':
        return Math.random() * 10000
      case 'count':
        return Math.floor(Math.random() * 1000)
      case 'avg':
        return Math.random() * 100
      case 'min':
        return Math.floor(Math.random() * 10)
      case 'max':
        return Math.floor(Math.random() * 1000)
      default:
        return 0
    }
  }
}
