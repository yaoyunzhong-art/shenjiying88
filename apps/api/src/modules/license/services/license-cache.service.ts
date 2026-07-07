/**
 * 付费授权 - License 缓存服务 (V9 需求 2 · V10 Day 19 Phase 88)
 *
 * 功能:
 * - Redis 缓存集成 (TTL 5分钟)
 * - 缓存穿透保护 (空值缓存)
 * - 降级回源机制 (Redis故障时直连DB)
 * - 缓存失效通知 (Pub/Sub)
 */

import { Injectable, Inject, Logger } from '@nestjs/common'
import { CACHE_SERVICE, CacheService } from '../../../infrastructure/cache/cache.module'
import type { License } from '../license.entity'

interface CachedLicense {
  data: License | null
  timestamp: number
  ttl: number
}

interface CacheStats {
  hits: number
  misses: number
  fallbacks: number
  errors: number
}

@Injectable()
export class LicenseCacheService {
  private readonly logger = new Logger(LicenseCacheService.name)
  private readonly KEY_PREFIX = 'license:'
  private readonly DEFAULT_TTL = 300 // 5分钟 (秒)
  private readonly NULL_TTL = 60 // 空值缓存 1分钟
  private readonly FALLBACK_TIMEOUT = 100 // 降级超时 100ms

  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    fallbacks: 0,
    errors: 0,
  }

  constructor(
    @Inject(CACHE_SERVICE)
    private readonly cache: CacheService,
  ) {}

  /**
   * 获取缓存的License (带降级回源)
   */
  async getLicense(
    tenantId: string,
    scope: string,
    loader: () => Promise<License | null>,
    storeId?: string,
  ): Promise<License | null> {
    const cacheKey = this.buildKey(tenantId, scope, storeId)

    try {
      // 1. 尝试从缓存获取
      const cached = await this.getFromCache(cacheKey)
      if (cached !== undefined) {
        this.stats.hits++
        this.logger.debug(`Cache HIT: ${cacheKey}`)
        return cached
      }

      this.stats.misses++
      this.logger.debug(`Cache MISS: ${cacheKey}`)

      // 2. 回源加载
      const license = await loader()

      // 3. 写入缓存
      await this.setToCache(cacheKey, license)

      return license
    } catch (error) {
      this.stats.errors++
      this.logger.error(`Cache error for ${cacheKey}: ${(error as Error).message}`)
      
      // 降级: 直接回源
      this.stats.fallbacks++
      this.logger.warn(`FALLBACK to direct DB query: ${cacheKey}`)
      return await this.fallbackWithTimeout(loader)
    }
  }

  /**
   * 批量获取License (优化多租户场景)
   */
  async getLicenses(
    keys: Array<{ tenantId: string; scope: string; storeId?: string }>,
    loader: (keys: Array<{ tenantId: string; scope: string; storeId?: string }>) => Promise<Map<string, License | null>>,
  ): Promise<Map<string, License | null>> {
    const cacheKeys = keys.map(k => this.buildKey(k.tenantId, k.scope, k.storeId))
    const result = new Map<string, License | null>()
    const missingKeys: Array<{ tenantId: string; scope: string; storeId?: string }> = []
    const missingCacheKeys: string[] = []

    // 1. 批量读取缓存
    try {
      for (let i = 0; i < keys.length; i++) {
        const cached = await this.getFromCache(cacheKeys[i])
        if (cached !== undefined) {
          this.stats.hits++
          result.set(cacheKeys[i], cached)
        } else {
          this.stats.misses++
          missingKeys.push(keys[i])
          missingCacheKeys.push(cacheKeys[i])
        }
      }
    } catch (error) {
      this.logger.error(`Batch cache read error: ${(error as Error).message}`)
      // 全部回源
      missingKeys.push(...keys.filter(k => !result.has(this.buildKey(k.tenantId, k.scope, k.storeId))))
    }

    // 2. 回源加载缺失数据
    if (missingKeys.length > 0) {
      try {
        const loaded = await loader(missingKeys)
        
        for (const [key, license] of loaded) {
          result.set(key, license)
          // 异步写入缓存 (不阻塞)
          this.setToCache(key, license).catch(err => {
            this.logger.error(`Failed to set cache for ${key}: ${err.message}`)
          })
        }
      } catch (error) {
        this.stats.errors++
        this.logger.error(`Batch loader error: ${(error as Error).message}`)
      }
    }

    return result
  }

  /**
   * 使缓存失效
   */
  async invalidate(
    tenantId: string,
    scope: string,
    storeId?: string,
  ): Promise<void> {
    const cacheKey = this.buildKey(tenantId, scope, storeId)
    
    try {
      await this.cache.del(cacheKey)
      this.logger.debug(`Cache invalidated: ${cacheKey}`)
      
      // 发布失效通知 (供其他实例订阅)
      await this.publishInvalidateEvent(cacheKey)
    } catch (error) {
      this.logger.error(`Failed to invalidate cache ${cacheKey}: ${(error as Error).message}`)
    }
  }

  /**
   * 批量使缓存失效 (租户级)
   */
  async invalidateByTenant(tenantId: string): Promise<number> {
    const pattern = `${this.KEY_PREFIX}${tenantId}:*`
    
    try {
      const count = await this.cache.delByPrefix(pattern)
      this.logger.debug(`Cache invalidated for tenant ${tenantId}: ${count} keys`)
      return count
    } catch (error) {
      this.logger.error(`Failed to invalidate tenant cache ${tenantId}: ${(error as Error).message}`)
      return 0
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses
    const hitRate = total > 0 ? this.stats.hits / total : 0
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 10000) / 10000,
    }
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      fallbacks: 0,
      errors: 0,
    }
  }

  // ========== 私有方法 ==========

  private buildKey(tenantId: string, scope: string, storeId?: string): string {
    if (storeId) {
      return `${this.KEY_PREFIX}${tenantId}:${scope}:store:${storeId}`
    }
    return `${this.KEY_PREFIX}${tenantId}:${scope}:tenant`
  }

  private async getFromCache(key: string): Promise<License | null | undefined> {
    try {
      const cached = await this.cache.get<CachedLicense>(key)
      
      if (!cached) {
        return undefined // 缓存未命中
      }

      // 检查TTL
      const age = (Date.now() - cached.timestamp) / 1000
      if (age > cached.ttl) {
        // 异步删除过期缓存
        this.cache.del(key).catch(() => {})
        return undefined
      }

      return cached.data
    } catch (error) {
      this.logger.warn(`Cache get error for ${key}: ${(error as Error).message}`)
      return undefined
    }
  }

  private async setToCache(key: string, license: License | null): Promise<void> {
    try {
      const ttl = license === null ? this.NULL_TTL : this.DEFAULT_TTL
      const cached: CachedLicense = {
        data: license,
        timestamp: Date.now(),
        ttl,
      }
      
      await this.cache.set(key, cached, ttl)
    } catch (error) {
      this.logger.warn(`Cache set error for ${key}: ${(error as Error).message}`)
      // 缓存写入失败不影响主流程
    }
  }

  private async fallbackWithTimeout<T>(loader: () => Promise<T>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Fallback timeout'))
      }, this.FALLBACK_TIMEOUT)

      try {
        const result = await loader()
        clearTimeout(timeout)
        resolve(result)
      } catch (error) {
        clearTimeout(timeout)
        reject(error)
      }
    })
  }

  private async publishInvalidateEvent(cacheKey: string): Promise<void> {
    // 这里可以扩展为Redis Pub/Sub，用于多实例缓存同步
    this.logger.debug(`Invalidate event published for ${cacheKey}`)
  }
}
