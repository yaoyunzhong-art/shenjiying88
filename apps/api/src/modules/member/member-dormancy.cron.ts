import { Injectable, Logger, Optional } from '@nestjs/common'
import { MemberDormancyService, type DormancyScanResult } from './member-dormancy.service'

/**
 * Phase-36 T166-2: Member 休眠状态机 · cron 调度
 *
 * 反模式 v4 cron-job-pitfall 防御:
 *  - in-memory 重入锁 (由 MemberDormancyService.scanInProgress 维护)
 *  - 异常隔离: 单次 cron 失败不影响下一次
 *  - 耗时统计: durationMs 用于监控告警
 *  - 幂等: 多次调用无副作用 (状态机去重)
 *
 * 部署说明:
 *  - 当前用 NestJS @Cron 装饰器 (单实例)
 *  - Phase-46 升级为 Bull Queue + Redis 锁 (多实例)
 */

export interface CronMetrics {
  totalRuns: number
  totalScanned: number
  totalDormantPromoted: number
  totalChurnedPromoted: number
  totalDurationMs: number
  lastRunAt: string | null
  lastErrorAt: string | null
  lastError: string | null
}

@Injectable()
export class MemberDormancyCron {
  private readonly logger = new Logger(MemberDormancyCron.name)
  private metrics: CronMetrics = {
    totalRuns: 0,
    totalScanned: 0,
    totalDormantPromoted: 0,
    totalChurnedPromoted: 0,
    totalDurationMs: 0,
    lastRunAt: null,
    lastErrorAt: null,
    lastError: null
  }

  constructor(@Optional() private readonly dormancy?: MemberDormancyService) {}

  /**
   * cron 入口: 每小时跑一次
   * 反模式 v4 防御: try/catch 异常隔离, 不让 cron 崩溃
   */
  async hourlyScan(): Promise<DormancyScanResult | null> {
    if (!this.dormancy) {
      this.logger.warn('MemberDormancyService not provided, skip cron')
      return null
    }

    try {
      const result = await this.dormancy.scanAndPromote()
      this.metrics.totalRuns++
      this.metrics.totalScanned += result.scannedCount
      this.metrics.totalDormantPromoted += result.dormantPromoted
      this.metrics.totalChurnedPromoted += result.churnedPromoted
      this.metrics.totalDurationMs += result.durationMs
      this.metrics.lastRunAt = result.scannedAt
      return result
    } catch (err) {
      this.metrics.lastErrorAt = new Date().toISOString()
      this.metrics.lastError = (err as Error).message
      this.logger.error(`Cron scan failed: ${(err as Error).message}`)
      return null
    }
  }

  /**
   * 获取 cron 指标 (admin-web 监控面板)
   */
  getMetrics(): CronMetrics {
    return { ...this.metrics }
  }

  /**
   * 重置 metrics (测试 / 紧急恢复)
   */
  resetMetrics(): void {
    this.metrics = {
      totalRuns: 0,
      totalScanned: 0,
      totalDormantPromoted: 0,
      totalChurnedPromoted: 0,
      totalDurationMs: 0,
      lastRunAt: null,
      lastErrorAt: null,
      lastError: null
    }
  }
}