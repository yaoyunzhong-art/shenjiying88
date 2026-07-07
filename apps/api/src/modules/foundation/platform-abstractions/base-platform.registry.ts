import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import {
  type BasePlatform,
  type BasePlatformContext,
  type BaseMemberPayload,
  type BaseMemberResult,
  type BaseOrderPayload,
  type BaseOrderResult,
  type BasePointsPayload,
  type BasePointsResult,
  type RoutingDecision,
  type RouteQuery,
  type PlatformHealth,
  BasePlatformError
} from './base-platform.port'
import { LYTPlatform } from './lyt-platform'
import { MockAltPlatform } from './mock-alt-platform'
import { CircuitBreaker } from '../resilience-operations/circuit-breaker'
import { TokenBucket } from '../resilience-operations/rate-limiter'

/**
 * BasePlatformRegistry · 多底座注册 + 路由 (P3-1.4)
 *
 * 职责:
 *   1. 注册多个 BasePlatform (LYT / MockAlt / 未来 Xxx)
 *   2. tenantId → primary 映射
 *   3. 灰度: 同一 tenant 部分流量切到 secondary (CanaryRouter 决策)
 *   4. 故障隔离: 每个底座一个 CircuitBreaker
 *   5. 限流: 每个底座一个 TokenBucket (避免雪崩)
 *   6. 降级: 主底座 unhealthy → 自动 fallback
 *
 * 用法:
 *   const decision = await registry.route({ tenantId: 't1', operation: 'syncMember' })
 *   const result = await dispatch(decision, ctx, payload)
 */
@Injectable()
export class BasePlatformRegistry implements OnApplicationBootstrap {
  private readonly logger = new Logger(BasePlatformRegistry.name)
  private readonly platforms = new Map<string, BasePlatform>()
  private readonly breakers = new Map<string, CircuitBreaker>()
  private readonly limiters = new Map<string, TokenBucket>()
  private readonly primaryByTenant = new Map<string, string>()
  private defaultPlatformId: string | null = null
  private fallbackPlatformId: string | null = null
  private readonly health = new Map<string, { health: PlatformHealth; lastCheckAt: number; latencyMs: number }>()

  constructor(
    private readonly lytPlatform: LYTPlatform,
    private readonly mockAltPlatform: MockAltPlatform
  ) {}

  onApplicationBootstrap(): void {
    // 默认注册 LYT + MockAlt
    this.registerPlatform(this.lytPlatform)
    this.registerPlatform(this.mockAltPlatform)
    this.setDefaultPlatform(this.lytPlatform.platformId)
    this.setFallbackPlatform(this.lytPlatform.platformId)
    this.logger.log(
      `BasePlatformRegistry bootstrapped with: ${Array.from(this.platforms.keys()).join(', ')}`
    )
  }

  // ─── 注册 ───────────────────────────────────

  registerPlatform(platform: BasePlatform): void {
    if (this.platforms.has(platform.platformId)) {
      this.logger.warn(`Platform ${platform.platformId} already registered, overwriting`)
    }
    this.platforms.set(platform.platformId, platform)
    this.breakers.set(
      platform.platformId,
      new CircuitBreaker({
        name: `base-${platform.platformId}`,
        failureThreshold: 5,
        cooldownMs: 30_000
      })
    )
    this.limiters.set(
      platform.platformId,
      new TokenBucket({
        name: `base-${platform.platformId}`,
        capacity: 100,
        refillPerSecond: 50
      })
    )
  }

  setPrimaryForTenant(tenantId: string, platformId: string): void {
    if (!this.platforms.has(platformId)) {
      throw new Error(`Unknown platform: ${platformId}`)
    }
    this.primaryByTenant.set(tenantId, platformId)
    this.logger.log(`Tenant ${tenantId} primary -> ${platformId}`)
  }

  removePrimaryForTenant(tenantId: string): void {
    this.primaryByTenant.delete(tenantId)
  }

  setDefaultPlatform(platformId: string): void {
    if (!this.platforms.has(platformId)) {
      throw new Error(`Unknown platform: ${platformId}`)
    }
    this.defaultPlatformId = platformId
  }

  setFallbackPlatform(platformId: string): void {
    if (!this.platforms.has(platformId)) {
      throw new Error(`Unknown platform: ${platformId}`)
    }
    this.fallbackPlatformId = platformId
  }

  // ─── 路由 (P3-1.4 + P3-2 灰度接入) ─────────

  /**
   * 路由决策
   *   1. tenant 配了 primary → 用 primary (除非 CanaryRouter 切到 secondary)
   *   2. tenant 未配 → 用 defaultPlatform
   *   3. primary unhealthy → fallback
   *   4. CanaryRouter 决策见 canary.router.ts
   */
  route(query: RouteQuery): RoutingDecision {
    const primaryId = this.primaryByTenant.get(query.tenantId) ?? this.defaultPlatformId
    if (!primaryId) {
      throw new Error('No platform configured (no default)')
    }
    const primary = this.platforms.get(primaryId)
    if (!primary) {
      throw new Error(`Platform ${primaryId} not found`)
    }
    // 注: Canary 决策由外部 canaryRouter 注入, 这里返回 primary
    // 灰度调用方用法:
    //   const canaryDecision = canaryRouter.shouldUseCanary(...)
    //   const platformId = canaryDecision.useCanary ? 'secondary-id' : primaryId
    return {
      platform: primary,
      reason: 'primary',
      decidedAt: Date.now()
    }
  }

  /**
   * 路由到指定 platform (供 canary 决策后调用)
   */
  routeTo(platformId: string, reason: RoutingDecision['reason'], canaryBucket?: RoutingDecision['canaryBucket']): RoutingDecision {
    const platform = this.platforms.get(platformId)
    if (!platform) throw new Error(`Platform ${platformId} not found`)
    return { platform, reason, canaryBucket, decidedAt: Date.now() }
  }

  // ─── 业务分发 (with 熔断 + 限流 + 降级) ────

  async dispatchSyncMember(
    decision: RoutingDecision,
    ctx: BasePlatformContext,
    payload: BaseMemberPayload
  ): Promise<BaseMemberResult> {
    return this.execute(decision, ctx, (platform) => platform.syncMember(ctx, payload), 'syncMember')
  }

  async dispatchSyncOrder(
    decision: RoutingDecision,
    ctx: BasePlatformContext,
    payload: BaseOrderPayload
  ): Promise<BaseOrderResult> {
    return this.execute(decision, ctx, (platform) => platform.syncOrder(ctx, payload), 'syncOrder')
  }

  async dispatchAdjustPoints(
    decision: RoutingDecision,
    ctx: BasePlatformContext,
    payload: BasePointsPayload
  ): Promise<BasePointsResult> {
    return this.execute(decision, ctx, (platform) => platform.adjustPoints(ctx, payload), 'adjustPoints')
  }

  private async execute<T>(
    decision: RoutingDecision,
    ctx: BasePlatformContext,
    op: (platform: BasePlatform) => Promise<T>,
    operation: string
  ): Promise<T> {
    const platformId = decision.platform.platformId
    const limiter = this.limiters.get(platformId)
    if (limiter && !limiter.tryAcquire()) {
      throw new BasePlatformError({
        platformId,
        operation,
        message: 'rate limited',
        retryable: true
      })
    }
    const breaker = this.breakers.get(platformId)
    if (breaker) {
      try {
        return await breaker.exec(() => op(decision.platform))
      } catch (err) {
        // 熔断开启 → 尝试 fallback
        if (err instanceof Error && err.name === 'CircuitOpenError') {
          if (this.fallbackPlatformId && this.fallbackPlatformId !== platformId) {
            const fallback = this.platforms.get(this.fallbackPlatformId)
            if (fallback) {
              this.logger.warn(
                `Circuit OPEN for ${platformId}, falling back to ${this.fallbackPlatformId}`
              )
              return op(fallback)
            }
          }
        }
        throw err
      }
    }
    return op(decision.platform)
  }

  // ─── 健康检查 ──────────────────────────────

  async checkHealth(platformId: string): Promise<{ health: PlatformHealth; latencyMs: number }> {
    const platform = this.platforms.get(platformId)
    if (!platform) throw new Error(`Unknown platform: ${platformId}`)
    try {
      const ctx: BasePlatformContext = { tenantId: 'health-check', requestId: 'hc' }
      const result = await platform.healthCheck(ctx)
      const health: PlatformHealth = result.healthy ? 'HEALTHY' : 'DEGRADED'
      this.health.set(platformId, { health, lastCheckAt: Date.now(), latencyMs: result.latencyMs })
      return { health, latencyMs: result.latencyMs }
    } catch (err) {
      this.health.set(platformId, { health: 'UNHEALTHY', lastCheckAt: Date.now(), latencyMs: -1 })
      return { health: 'UNHEALTHY', latencyMs: -1 }
    }
  }

  getHealth(platformId: string) {
    return this.health.get(platformId)
  }

  // ─── 测试/管理辅助 ─────────────────────────

  listPlatforms(): Array<{ platformId: string; platformType: string }> {
    return Array.from(this.platforms.values()).map((p) => ({
      platformId: p.platformId,
      platformType: p.platformType
    }))
  }

  getBreakerStats(platformId: string) {
    return this.breakers.get(platformId)?.getStats() ?? null
  }

  getLimiterStats(platformId: string) {
    return this.limiters.get(platformId)?.getStats() ?? null
  }
}
