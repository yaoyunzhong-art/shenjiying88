import { Injectable, Logger } from '@nestjs/common'
import { createHash } from 'node:crypto'
import {
  type CanaryDecision,
  type CanaryQuery,
  type CanaryRouterConfig,
  type CanaryRouterStats,
  type CanaryStage
} from './canary-router.port'

/**
 * CanaryRouter 实现 (P3-2.2)
 *
 * 决策算法 (按优先级):
 *   1. forceRollback=true → 全部 primary
 *   2. allowlist 命中 → canary
 *   3. denylist 命中 → primary
 *   4. stagePercentage=0 → primary
 *   5. stagePercentage=100 → canary
 *   6. hash(tenantId + hashKey) % 100 < stagePercentage → canary
 *      else → primary
 *
 * Hash 选型: SHA-256(tenantId + ':' + hashKey) 均匀分布
 * 优点: 同 (tenant, hashKey) 总是同 bucket, 灰度稳定
 */
@Injectable()
export class CanaryRouter {
  private readonly logger = new Logger(CanaryRouter.name)
  private readonly primaryPlatformId: string
  private readonly canaryPlatformId: string
  private readonly allowlist: Set<string>
  private readonly denylist: Set<string>
  private forceRollback = false
  private currentStage: number = 0
  private stats: CanaryRouterStats = {
    totalDecisions: 0,
    canaryDecisions: 0,
    primaryDecisions: 0,
    perReason: {
      override_force_canary: 0,
      override_force_primary: 0,
      allowlist: 0,
      denylist: 0,
      percentage_hash: 0
    },
    currentStage: 0
  }

  constructor(config: CanaryRouterConfig) {
    this.primaryPlatformId = config.primaryPlatformId
    this.canaryPlatformId = config.canaryPlatformId
    this.allowlist = new Set(config.allowlist ?? [])
    this.denylist = new Set(config.denylist ?? [])
    this.forceRollback = config.forceRollback ?? false
  }

  /**
   * 核心决策
   * 返回 { useCanary, bucket, reason, ... }
   */
  shouldUseCanary(query: CanaryQuery): CanaryDecision {
    this.stats.totalDecisions += 1

    // 1. 紧急回滚
    if (this.forceRollback) {
      this.stats.primaryDecisions += 1
      this.stats.perReason.override_force_primary += 1
      return {
        useCanary: false,
        bucket: 'primary',
        reason: 'override_force_primary',
        effectivePercentage: 0,
        hashBucket: 0
      }
    }

    // 2. Allowlist
    if (this.allowlist.has(query.tenantId)) {
      this.stats.canaryDecisions += 1
      this.stats.perReason.allowlist += 1
      return {
        useCanary: true,
        bucket: 'canary',
        reason: 'allowlist',
        effectivePercentage: 100,
        hashBucket: 0
      }
    }

    // 3. Denylist
    if (this.denylist.has(query.tenantId)) {
      this.stats.primaryDecisions += 1
      this.stats.perReason.denylist += 1
      return {
        useCanary: false,
        bucket: 'primary',
        reason: 'denylist',
        effectivePercentage: 0,
        hashBucket: 0
      }
    }

    // 4-5. 阶段边界
    const pct = query.stagePercentage
    if (pct <= 0) {
      this.stats.primaryDecisions += 1
      this.stats.perReason.percentage_hash += 1
      return {
        useCanary: false,
        bucket: 'primary',
        reason: 'percentage_hash',
        effectivePercentage: 0,
        hashBucket: 0
      }
    }
    if (pct >= 100) {
      this.stats.canaryDecisions += 1
      this.stats.perReason.percentage_hash += 1
      return {
        useCanary: true,
        bucket: 'canary',
        reason: 'percentage_hash',
        effectivePercentage: 100,
        hashBucket: 0
      }
    }

    // 6. Hash 决定
    const hash = this.bucketize(query.tenantId, query.hashKey)
    const useCanary = hash < pct
    if (useCanary) {
      this.stats.canaryDecisions += 1
    } else {
      this.stats.primaryDecisions += 1
    }
    this.stats.perReason.percentage_hash += 1
    return {
      useCanary,
      bucket: useCanary ? 'canary' : 'primary',
      reason: 'percentage_hash',
      effectivePercentage: pct,
      hashBucket: hash
    }
  }

  /**
   * SHA-256(tenantId + ':' + hashKey) % 100
   * 输出 [0, 100) 整数
   */
  private bucketize(tenantId: string, hashKey: string): number {
    const hash = createHash('sha256').update(`${tenantId}:${hashKey}`).digest()
    // 取前 4 字节作为 uint32
    const n = hash.readUInt32BE(0)
    return n % 100
  }

  // ─── 配置管理 ──────────────────────────────

  setStage(stage: CanaryStage): void {
    this.currentStage = stage
    this.stats.currentStage = stage
    this.logger.log(`Canary stage updated: ${stage}%`)
  }

  setForceRollback(force: boolean): void {
    this.forceRollback = force
    this.logger.warn(`Canary forceRollback: ${force}`)
  }

  addToAllowlist(tenantId: string): void {
    this.allowlist.add(tenantId)
  }

  addToDenylist(tenantId: string): void {
    this.denylist.add(tenantId)
  }

  removeFromAllowlist(tenantId: string): void {
    this.allowlist.delete(tenantId)
  }

  removeFromDenylist(tenantId: string): void {
    this.denylist.delete(tenantId)
  }

  // ─── 状态查询 ──────────────────────────────

  getStats(): CanaryRouterStats {
    return { ...this.stats, perReason: { ...this.stats.perReason } }
  }

  getConfig() {
    return {
      primaryPlatformId: this.primaryPlatformId,
      canaryPlatformId: this.canaryPlatformId,
      allowlist: Array.from(this.allowlist),
      denylist: Array.from(this.denylist),
      forceRollback: this.forceRollback,
      currentStage: this.currentStage
    }
  }
}
