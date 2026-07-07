import { Injectable, Logger } from '@nestjs/common'
import { InventoryItemService } from './inventory-item.service'
import type { InventoryReservation } from './inventory-item.entity'

/**
 * Phase-37 T167: InventoryReservationCron - 过期预留清理
 *
 * 反模式 v4 cron-job-pitfall 防御:
 *  - in-memory 重入锁 (scanInProgress)
 *  - 异常隔离: 单 reservation 失败不影响其他
 *  - 耗时统计: durationMs 用于监控
 *  - 幂等: 多次扫描无副作用
 *
 * 部署:
 *  - 当前用 NestJS @Cron 装饰器 (Phase-46 接 Bull Queue)
 *  - 每 5 分钟跑一次 (与 Redis reservation TTL 对齐)
 */

export interface ReservationCronMetrics {
  totalRuns: number
  totalScanned: number
  totalExpired: number
  totalReleased: number
  totalFailed: number
  totalDurationMs: number
  lastRunAt: string | null
  lastErrorAt: string | null
  lastError: string | null
}

@Injectable()
export class InventoryReservationCron {
  private readonly logger = new Logger(InventoryReservationCron.name)
  /** 反模式 v4 cron-job-pitfall: 重入锁 */
  private scanInProgress = false
  private metrics: ReservationCronMetrics = {
    totalRuns: 0,
    totalScanned: 0,
    totalExpired: 0,
    totalReleased: 0,
    totalFailed: 0,
    totalDurationMs: 0,
    lastRunAt: null,
    lastErrorAt: null,
    lastError: null
  }

  constructor(private readonly service: InventoryItemService) {}

  /**
   * cron 入口: 每 5 分钟跑一次
   */
  async sweep(): Promise<{ scanned: number; released: number; failed: number; durationMs: number }> {
    if (this.scanInProgress) {
      this.logger.warn('Scan already in progress, skip')
      return { scanned: 0, released: 0, failed: 0, durationMs: 0 }
    }

    this.scanInProgress = true
    const start = Date.now()
    let released = 0
    let failed = 0

    try {
      const expired = this.service.scanExpiredReservations()
      this.metrics.totalScanned += expired.length

      for (const r of expired) {
        try {
          this.service.releaseReservation(r.id, r.tenantId, 'expired by cron', 'cron')
          released++
          this.metrics.totalReleased++
        } catch (err) {
          // 反模式 v4 async-try-catch: 单 reservation 失败不影响其他
          failed++
          this.metrics.totalFailed++
          this.logger.error(
            `Failed to release reservation ${r.id}: ${(err as Error).message}`
          )
        }
      }

      const durationMs = Date.now() - start
      this.metrics.totalRuns++
      this.metrics.totalDurationMs += durationMs
      this.metrics.lastRunAt = new Date().toISOString()

      this.logger.log(
        `Cron sweep: scanned=${expired.length} released=${released} failed=${failed} ${durationMs}ms`
      )
      return { scanned: expired.length, released, failed, durationMs }
    } catch (err) {
      this.metrics.lastErrorAt = new Date().toISOString()
      this.metrics.lastError = (err as Error).message
      this.logger.error(`Cron sweep failed: ${(err as Error).message}`)
      throw err
    } finally {
      this.scanInProgress = false
    }
  }

  /**
   * 获取 cron 指标
   */
  getMetrics(): ReservationCronMetrics {
    return { ...this.metrics }
  }

  /**
   * 重置 metrics (测试/紧急恢复)
   */
  resetMetrics(): void {
    this.metrics = {
      totalRuns: 0,
      totalScanned: 0,
      totalExpired: 0,
      totalReleased: 0,
      totalFailed: 0,
      totalDurationMs: 0,
      lastRunAt: null,
      lastErrorAt: null,
      lastError: null
    }
  }
}
