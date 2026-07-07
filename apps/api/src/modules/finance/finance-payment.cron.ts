import { Injectable, Logger } from '@nestjs/common'
import { FinancePaymentService } from './finance-payment.service'

/**
 * Phase-38 T168: FinancePaymentCron - PENDING 支付超时清理
 *
 * 反模式 v4 cron-job-pitfall 防御:
 *  - in-memory 重入锁 (scanInProgress)
 *  - 异常隔离: 单 payment 失败不影响其他
 *  - 耗时统计: durationMs 用于监控
 *  - 幂等: 多次扫描无副作用
 */

export interface PaymentCronMetrics {
  totalRuns: number
  totalScanned: number
  totalTimedOut: number
  totalFailed: number
  totalDurationMs: number
  lastRunAt: string | null
  lastErrorAt: string | null
  lastError: string | null
}

@Injectable()
export class FinancePaymentCron {
  private readonly logger = new Logger(FinancePaymentCron.name)
  /** 反模式 v4 cron-job-pitfall: 重入锁 */
  private scanInProgress = false
  private metrics: PaymentCronMetrics = {
    totalRuns: 0,
    totalScanned: 0,
    totalTimedOut: 0,
    totalFailed: 0,
    totalDurationMs: 0,
    lastRunAt: null,
    lastErrorAt: null,
    lastError: null
  }

  constructor(private readonly service: FinancePaymentService) {}

  /**
   * cron 入口: 每 5 分钟跑一次, PENDING > 15min 自动 FAILED
   */
  async sweep(): Promise<{ scanned: number; timedOut: number; failed: number; durationMs: number }> {
    if (this.scanInProgress) {
      this.logger.warn('Scan already in progress, skip')
      return { scanned: 0, timedOut: 0, failed: 0, durationMs: 0 }
    }

    this.scanInProgress = true
    const start = Date.now()
    let timedOut = 0
    let failed = 0

    try {
      const expired = this.service.scanExpiredPayments()
      this.metrics.totalScanned += expired.length
      timedOut = expired.length
      this.metrics.totalTimedOut += expired.length

      const durationMs = Date.now() - start
      this.metrics.totalRuns++
      this.metrics.totalDurationMs += durationMs
      this.metrics.lastRunAt = new Date().toISOString()

      this.logger.log(
        `Cron sweep: scanned=${expired.length} timedOut=${timedOut} failed=${failed} ${durationMs}ms`
      )
      return { scanned: expired.length, timedOut, failed, durationMs }
    } catch (err) {
      this.metrics.lastErrorAt = new Date().toISOString()
      this.metrics.lastError = (err as Error).message
      this.metrics.totalFailed++
      failed++
      this.logger.error(`Cron sweep failed: ${(err as Error).message}`)
      throw err
    } finally {
      this.scanInProgress = false
    }
  }

  getMetrics(): PaymentCronMetrics {
    return { ...this.metrics }
  }

  resetMetrics(): void {
    this.metrics = {
      totalRuns: 0,
      totalScanned: 0,
      totalTimedOut: 0,
      totalFailed: 0,
      totalDurationMs: 0,
      lastRunAt: null,
      lastErrorAt: null,
      lastError: null
    }
  }
}
