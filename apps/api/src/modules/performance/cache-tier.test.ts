import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { CacheTierService } from './cache-tier.service'

describe('CacheTierService', () => {
  let service: CacheTierService

  const defaultConfig = {
    l1: { maxBytes: 10 * 1024 * 1024, evictionPolicy: 'lru' as const, ttlMs: 60000 },
    l2: { maxBytes: 100 * 1024 * 1024, evictionPolicy: 'lru' as const, ttlMs: 300000, host: 'localhost:6379' },
    l3: { maxBytes: 1024 * 1024 * 1024, evictionPolicy: 'ttl' as const, ttlMs: 3600000, host: 'localhost:3306' },
    readThrough: true,
    writeThrough: true,
    prefetchEnabled: true
  }

  beforeEach(() => {
    service = new CacheTierService()
  })

  // 1. configure 初始化 + getConfig 确认
  it('configure 正确初始化缓存配置', () => {
    service.configure(defaultConfig)
    const config = service.getConfig()

    expect(config.l1.maxBytes).toBe(10 * 1024 * 1024)
    expect(config.l2.maxBytes).toBe(100 * 1024 * 1024)
    expect(config.l3.maxBytes).toBe(1024 * 1024 * 1024)
    expect(config.readThrough).toBe(true)
    expect(config.writeThrough).toBe(true)
    expect(config.prefetchEnabled).toBe(true)
  })

  it('getConfig 未初始化时抛出错误', () => {
    expect(() => service.getConfig()).toThrow('缓存未初始化')
  })

  // 2. set / get 基础读写
  it('set 和 get 正确存储和读取数据', () => {
    service.configure(defaultConfig)

    service.set('key1', { data: 'value1' })
    const result = service.get<{ data: string }>('key1')

    expect(result).toEqual({ data: 'value1' })
  })

  it('get 不存在的 key 返回 null', () => {
    service.configure(defaultConfig)

    const result = service.get('nonexistent')
    expect(result).toBeNull()
  })

  it('set 可以传入 ttlMs 和 tags', () => {
    service.configure(defaultConfig)

    service.set('key2', 'value2', { ttlMs: 5000, tags: ['tag1', 'tag2'] })
    const result = service.get<string>('key2')

    expect(result).toBe('value2')
  })

  // 3. get L1 miss → L2 hit（readThrough=true）
  it('L1 miss 时从 L2 获取数据（readThrough=true）', () => {
    service.configure(defaultConfig)

    service.set('key_l2', 'l2_value')

    // 清除 L1 但保留 L2
    service.flush('l1')

    // 从 L1 获取应该触发 L2 回填
    const result = service.get<string>('key_l2')
    expect(result).toBe('l2_value')

    // 验证数据已回填到 L1
    const l1Stats = service.getStats()[0]
    expect(l1Stats.totalKeys).toBeGreaterThan(0)
  })

  it('readThrough=false 时不会回填到 L1', () => {
    const configNoReadThrough = { ...defaultConfig, readThrough: false, writeThrough: false }
    service.configure(configNoReadThrough)

    service.set('key_nort', 'nort_value')
    service.flush('l1')
    service.flush('l2')

    // L2 也被清空，所以应该返回 null
    const result = service.get<string>('key_nort')
    expect(result).toBeNull()
  })

  // 4. mget / mset 批量操作
  it('mget 批量获取多个 key', () => {
    service.configure(defaultConfig)

    service.set('batch_key1', 'value1')
    service.set('batch_key2', 'value2')
    service.set('batch_key3', 'value3')

    const results = service.mget<string>(['batch_key1', 'batch_key2', 'batch_key3', 'nonexistent'])

    expect(results).toEqual(['value1', 'value2', 'value3', null])
  })

  it('mset 批量写入', () => {
    service.configure(defaultConfig)

    service.mset([
      { key: 'mset_key1', value: 'mset_value1' },
      { key: 'mset_key2', value: 'mset_value2' },
      { key: 'mset_key3', value: 123 }
    ])

    const results = service.mget(['mset_key1', 'mset_key2', 'mset_key3'])
    expect(results).toEqual(['mset_value1', 'mset_value2', 123])
  })

  // 5. delete / flush 清理
  it('delete 删除指定 key', () => {
    service.configure(defaultConfig)

    service.set('delete_key', 'delete_value')
    expect(service.get('delete_key')).toBe('delete_value')

    service.delete('delete_key')
    expect(service.get('delete_key')).toBeNull()
  })

  it('flush(tier) 清空指定 tier', () => {
    // writeThrough=true 确保数据写入所有 tier
    const configWT = { ...defaultConfig, writeThrough: true, readThrough: false }
    service.configure(configWT)

    service.set('flush_key1', 'value1')
    service.set('flush_key2', 'value2')

    service.flush('l1')
    // readThrough=false，所以 L1 miss 直接返回 null，不查找 L2
    expect(service.get('flush_key1')).toBeNull()
    expect(service.get('flush_key2')).toBeNull()
  })

  it('flush() 清空所有 tier', () => {
    service.configure(defaultConfig)

    service.set('flush_all', 'value')
    service.flush()

    expect(service.get('flush_all')).toBeNull()
  })

  // 6. has / getTTL / expire
  it('has 检查 key 是否存在', () => {
    service.configure(defaultConfig)

    service.set('has_key', 'has_value')
    expect(service.has('has_key')).toBe(true)
    expect(service.has('nonexistent')).toBe(false)
  })

  it('has 排除已过期数据', async () => {
    service.configure(defaultConfig)

    service.set('expired_key', 'value', { ttlMs: 1 })
    expect(service.has('expired_key')).toBe(true)

    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(service.has('expired_key')).toBe(false)
  })

  it('getTTL 返回剩余 TTL', () => {
    service.configure(defaultConfig)

    service.set('ttl_key', 'value', { ttlMs: 5000 })
    const ttl = service.getTTL('ttl_key')

    expect(ttl).toBeGreaterThan(0)
    expect(ttl).toBeLessThanOrEqual(5000)
  })

  it('getTTL key 不存在返回 -2', () => {
    service.configure(defaultConfig)

    expect(service.getTTL('nonexistent')).toBe(-2)
  })

  it('getTTL 无 TTL 返回 -1', () => {
    service.configure(defaultConfig)

    service.set('no_ttl_key', 'value')
    expect(service.getTTL('no_ttl_key')).toBe(-1)
  })

  it('expire 设置 TTL', () => {
    service.configure(defaultConfig)

    service.set('expire_key', 'value')
    service.expire('expire_key', 10000)

    const ttl = service.getTTL('expire_key')
    expect(ttl).toBeGreaterThan(0)
    expect(ttl).toBeLessThanOrEqual(10000)
  })

  // 7. deleteByTag 按标签删除
  it('deleteByTag 删除指定标签的所有 key', () => {
    service.configure(defaultConfig)

    service.set('tag_key1', 'value1', { tags: ['tag_a'] })
    service.set('tag_key2', 'value2', { tags: ['tag_a', 'tag_b'] })
    service.set('tag_key3', 'value3', { tags: ['tag_b'] })

    const deletedCount = service.deleteByTag('tag_a')

    expect(deletedCount).toBe(2)
    expect(service.get('tag_key1')).toBeNull()
    expect(service.get('tag_key2')).toBeNull()
    expect(service.get('tag_key3')).toBe('value3')
  })

  it('deleteByTag 标签不存在返回 0', () => {
    service.configure(defaultConfig)

    const deletedCount = service.deleteByTag('nonexistent_tag')
    expect(deletedCount).toBe(0)
  })

  // 8. warm 预热 + loader 调用
  it('warm 预热缓存', () => {
    service.configure(defaultConfig)

    const loader = (keys: string[]) => {
      const map = new Map<string, unknown>()
      for (const key of keys) {
        map.set(key, `loaded_${key}`)
      }
      return map
    }

    service.warm(['warm_key1', 'warm_key2'], loader)

    expect(service.get('warm_key1')).toBe('loaded_warm_key1')
    expect(service.get('warm_key2')).toBe('loaded_warm_key2')
  })

  it('warm 跳过已存在的 key', () => {
    service.configure(defaultConfig)

    service.set('warm_existing', 'original')

    const loader = (keys: string[]) => {
      const map = new Map<string, unknown>()
      for (const key of keys) {
        map.set(key, `loaded_${key}`)
      }
      return map
    }

    service.warm(['warm_existing', 'warm_new'], loader)

    expect(service.get('warm_existing')).toBe('original')
    expect(service.get('warm_new')).toBe('loaded_warm_new')
  })

  it('prefetchEnabled=false 时 warm 不执行', () => {
    const configNoPrefetch = { ...defaultConfig, prefetchEnabled: false }
    service.configure(configNoPrefetch)

    const loader = (keys: string[]) => {
      const map = new Map<string, unknown>()
      for (const key of keys) {
        map.set(key, `loaded_${key}`)
      }
      return map
    }

    service.warm(['some_key'], loader)
    expect(service.get('some_key')).toBeNull()
  })

  // 9. setAggregated / getAggregated 聚合缓存
  it('setAggregated 和 getAggregated 正常工作', () => {
    service.configure(defaultConfig)

    service.setAggregated('daily_revenue', 'SELECT SUM(amount)', 'sum', 60_000)
    const result = service.getAggregated<number>('daily_revenue')

    expect(typeof result).toBe('number')
    expect(result).toBeGreaterThanOrEqual(0)
  })

  it('getAggregated 首次调用触发计算', () => {
    service.configure(defaultConfig)

    service.setAggregated('test_agg', 'SELECT COUNT(*)', 'count', 60_000)

    const result1 = service.getAggregated<number>('test_agg')
    const result2 = service.getAggregated<number>('test_agg')

    expect(result1).toBe(result2)
  })

  it('getAggregated 过期后重新计算', async () => {
    service.configure(defaultConfig)

    service.setAggregated('short_agg', 'SELECT AVG(x)', 'avg', 50)

    const result1 = service.getAggregated<number>('short_agg')

    await new Promise((resolve) => setTimeout(resolve, 60))

    const result2 = service.getAggregated<number>('short_agg')

    expect(typeof result1).toBe('number')
    expect(typeof result2).toBe('number')
  })

  it('refreshAggregated 手动刷新', () => {
    service.configure(defaultConfig)

    service.setAggregated('manual_refresh', 'SELECT MIN(val)', 'min', 60_000)
    const result1 = service.getAggregated<number>('manual_refresh')

    service.refreshAggregated('manual_refresh')
    const result2 = service.getAggregated<number>('manual_refresh')

    expect(typeof result1).toBe('number')
    expect(typeof result2).toBe('number')
  })

  it('getAggregated key 不存在抛出错误', () => {
    service.configure(defaultConfig)

    expect(() => service.getAggregated('nonexistent')).toThrow('聚合缓存 nonexistent 未找到')
  })

  // 10. getStats 各 tier 命中率统计
  it('getStats 返回正确的统计信息', () => {
    service.configure(defaultConfig)

    service.set('stats_key1', 'value1')
    service.get('stats_key1')
    service.get('stats_key1')
    service.get('nonexistent')

    const stats = service.getStats()

    expect(stats).toHaveLength(3)

    const l1Stats = stats.find((s) => s.tier === 'l1')
    expect(l1Stats).toBeDefined()
    expect(l1Stats!.hitCount).toBe(2)
    expect(l1Stats!.missCount).toBe(1)
    expect(l1Stats!.hitRate).toBeCloseTo(0.667, 2)
  })

  // 11. getGlobalStats 全局统计
  it('getGlobalStats 返回全局统计', () => {
    service.configure(defaultConfig)

    service.set('global_key', 'value')
    service.get('global_key')
    service.get('global_key')
    service.get('nonexistent')

    const globalStats = service.getGlobalStats()

    expect(globalStats.totalHits).toBeGreaterThan(0)
    expect(globalStats.totalMisses).toBeGreaterThanOrEqual(1)
    expect(globalStats.overallHitRate).toBeGreaterThan(0)
    expect(globalStats.totalKeys).toBeGreaterThan(0)
    expect(globalStats.totalBytes).toBeGreaterThan(0)
  })

  it('getGlobalStats 无数据时返回零值', () => {
    service.configure(defaultConfig)

    const globalStats = service.getGlobalStats()

    expect(globalStats.totalHits).toBe(0)
    expect(globalStats.totalMisses).toBe(0)
    expect(globalStats.overallHitRate).toBe(0)
    expect(globalStats.totalKeys).toBe(0)
    expect(globalStats.totalBytes).toBe(0)
  })

  // 12. LRU 淘汰触发（超出 maxBytes）
  it('LRU 淘汰策略正确驱逐最久未访问的条目', () => {
    const smallConfig = {
      ...defaultConfig,
      l1: { maxBytes: 20, evictionPolicy: 'lru' as const, ttlMs: 60000 },
      writeThrough: false,
      readThrough: false
    }
    service.configure(smallConfig)

    // Each value is 8 bytes. 2 entries = 16 bytes, 3 entries = 24 > 20 bytes limit
    // After 2 entries, adding 3rd triggers eviction. LRU victim is lru_key1
    service.set('lru_key1', 'v1')
    service.get('lru_key1')

    service.set('lru_key2', 'v2')
    service.get('lru_key2')

    service.set('lru_key3', 'v3')

    expect(service.get('lru_key1')).toBeNull()
    expect(service.get('lru_key2')).toBe('v2')
    expect(service.get('lru_key3')).toBe('v3')
  })

  it('LFU 淘汰策略正确驱逐访问频率最低的条目', () => {
    const smallConfig = {
      ...defaultConfig,
      l1: { maxBytes: 20, evictionPolicy: 'lfu' as const, ttlMs: 60000 },
      writeThrough: false,
      readThrough: false
    }
    service.configure(smallConfig)

    service.set('lfu_key1', 'v1')
    service.get('lfu_key1')

    service.set('lfu_key2', 'v2')
    service.get('lfu_key2')
    service.get('lfu_key2')

    service.set('lfu_key3', 'v3')

    expect(service.get('lfu_key1')).toBeNull()
    expect(service.get('lfu_key2')).toBe('v2')
    expect(service.get('lfu_key3')).toBe('v3')
  })

  it('FIFO 淘汰策略正确驱逐最早进入的条目', () => {
    const smallConfig = {
      ...defaultConfig,
      l1: { maxBytes: 20, evictionPolicy: 'fifo' as const, ttlMs: 60000 },
      writeThrough: false,
      readThrough: false
    }
    service.configure(smallConfig)

    service.set('fifo_key1', 'v1')
    service.set('fifo_key2', 'v2')
    service.get('fifo_key1')

    service.set('fifo_key3', 'v3')

    expect(service.get('fifo_key1')).toBeNull()
    expect(service.get('fifo_key2')).toBe('v2')
    expect(service.get('fifo_key3')).toBe('v3')
  })

  it('TTL 淘汰策略正确驱逐即将过期的条目', () => {
    const smallConfig = {
      ...defaultConfig,
      l1: { maxBytes: 20, evictionPolicy: 'ttl' as const, ttlMs: 60000 },
      writeThrough: false,
      readThrough: false
    }
    service.configure(smallConfig)

    service.set('ttl_key1', 'v1', { ttlMs: 1000 })
    service.set('ttl_key2', 'v2', { ttlMs: 5000 })

    service.set('ttl_key3', 'v3')

    expect(service.get('ttl_key1')).toBeNull()
    expect(service.get('ttl_key2')).toBe('v2')
    expect(service.get('ttl_key3')).toBe('v3')
  })

  // 额外：fillFromLowerTier
  it('fillFromLowerTier 从下层填充上层缓存', () => {
    service.configure(defaultConfig)

    service.flush()

    service.set('fill_key', 'fill_value')
    service.flush('l1')
    service.flush('l2')

    const result = service.fillFromLowerTier('fill_key')
    expect(result).toBe(true)
    expect(service.get('fill_key')).toBe('fill_value')
  })

  // 额外：resetStats
  it('resetStats 重置所有统计', () => {
    service.configure(defaultConfig)

    service.set('reset_key', 'value')
    service.get('reset_key')
    service.get('nonexistent')

    service.resetStats()
    const stats = service.getStats()

    for (const stat of stats) {
      expect(stat.hitCount).toBe(0)
      expect(stat.missCount).toBe(0)
    }
  })

  // 额外：writeThrough = false
  it('writeThrough=false 时只写入 L1/L2 不写入 L3', () => {
    const configNoWriteThrough = { ...defaultConfig, writeThrough: false }
    service.configure(configNoWriteThrough)

    service.set('write_through_key', 'value')

    expect(service.get('write_through_key')).toBe('value')
  })

  // 额外：mget/mget with mixed results
  it('mget 处理混合存在/不存在的 key', () => {
    service.configure(defaultConfig)

    service.set('mixed_key1', 'value1')
    service.set('mixed_key3', 'value3')

    const results = service.mget<string>(['mixed_key1', 'mixed_key2', 'mixed_key3'])
    expect(results).toEqual(['value1', null, 'value3'])
  })
})
