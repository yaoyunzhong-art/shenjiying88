import { Inject, Injectable, Logger, Optional } from '@nestjs/common'
import { CACHE_SERVICE, type CacheService } from '../../infrastructure/cache/cache.module'
import type { TenantContext } from '../../common/context/tenant-context'

interface TenantConfigCacheStats {
  hits: number
  misses: number
  invalidations: number
  errors: number
}

@Injectable()
export class TenantConfigCacheService {
  private readonly logger = new Logger(TenantConfigCacheService.name)
  private readonly KEY_PREFIX = 'tenant-config:'
  private readonly DEFAULT_TTL_SECONDS = 300
  private readonly TTL_JITTER_SECONDS = 30

  private stats: TenantConfigCacheStats = {
    hits: 0,
    misses: 0,
    invalidations: 0,
    errors: 0,
  }

  constructor(
    @Optional() @Inject(CACHE_SERVICE) private readonly cache?: CacheService,
  ) {}

  async getOrLoad<T>(
    scope: string,
    ctx: TenantContext,
    parts: Array<string | number | boolean | undefined>,
    loader: () => Promise<T>,
    ttlSeconds = this.DEFAULT_TTL_SECONDS,
  ): Promise<T> {
    if (!this.cache) {
      this.stats.misses++
      return loader()
    }

    const key = this.buildKey(scope, ctx, parts)
    try {
      const cached = await this.cache.get<T>(key)
      if (cached !== null) {
        this.stats.hits++
        return cached
      }
      this.stats.misses++
      const fresh = await loader()
      await this.cache.set(key, fresh, this.withJitter(ttlSeconds))
      return fresh
    } catch (error) {
      this.stats.errors++
      this.logger.warn(`cache get/load failed for ${key}: ${(error as Error).message}`)
      return loader()
    }
  }

  async invalidateTenant(tenantId?: string): Promise<number> {
    if (!tenantId || !this.cache) return 0
    try {
      const count = await this.cache.delByPrefix(`${this.KEY_PREFIX}${tenantId}:`)
      this.stats.invalidations += count
      return count
    } catch (error) {
      this.stats.errors++
      this.logger.warn(`cache invalidate failed for tenant=${tenantId}: ${(error as Error).message}`)
      return 0
    }
  }

  getStats(): TenantConfigCacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses
    return {
      ...this.stats,
      hitRate: total > 0 ? Math.round((this.stats.hits / total) * 10000) / 10000 : 0,
    }
  }

  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      errors: 0,
    }
  }

  private buildKey(
    scope: string,
    ctx: TenantContext,
    parts: Array<string | number | boolean | undefined>,
  ): string {
    const extras = parts
      .filter((part): part is string | number | boolean => part !== undefined)
      .map((part) => String(part).replace(/\s+/g, '_'))
      .join(':')

    const tenantId = ctx.tenantId ?? 'unknown'
    const brandId = ctx.brandId ?? '-'
    const storeId = ctx.storeId ?? '-'
    const role = ctx.role ?? 'viewer'

    return [
      this.KEY_PREFIX.replace(/:$/, ''),
      tenantId,
      scope,
      role,
      brandId,
      storeId,
      extras || '-',
    ].join(':')
  }

  private withJitter(ttlSeconds: number): number {
    const jitter = Math.floor(Math.random() * (this.TTL_JITTER_SECONDS + 1))
    return ttlSeconds + jitter
  }
}
