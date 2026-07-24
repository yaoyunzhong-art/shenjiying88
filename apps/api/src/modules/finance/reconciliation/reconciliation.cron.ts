import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { ReconciliationService } from './reconciliation.service'

/**
 * ReconciliationCron · T+1 2am 对账调度 (P1-2.5)
 *
 * 反模式 v4 cron-job-pitfall 防御 (类比 FinancePaymentCron):
 *   - in-memory 重入锁 (reconInProgress)
 *   - 异常隔离: 单 (tenantId, channel, date) 失败不影响其他
 *   - 耗时统计: durationMs 用于监控
 *   - 幂等: 多次跑同一个 date 结果一致
 *
 * 调度策略 (P1-2.5 MVP):
 *   - 每小时跑一次, 内部判断 "当前小时是 2 点 AND 还没跑过今天"
 *   - 真实生产: 由 K8s CronJob 调度, 这里只暴露 runOnce() 接口
 *   - 未来: BullMQ delayed job 调度, 支持重试
 *
 * 待办 (P1-2.5 完整化):
 *   - 拉取所有 tenantId 列表
 *   - 拉取所有 channel 列表
 *   - 对每个 (tenant, channel, yesterday) 调 reconcile
 */

export interface ReconciliationCronMetrics {
  totalRuns: number
  totalReconciliations: number
  totalDiscrepancies: number
  totalFailed: number
  totalDurationMs: number
  lastRunAt: string | null
  lastErrorAt: string | null
  lastError: string | null
  lastReconciliationDate: string | null
}

@Injectable()
export class ReconciliationCron implements OnApplicationBootstrap {
  private readonly logger = new Logger(ReconciliationCron.name)
  private reconInProgress = false
  private metrics: ReconciliationCronMetrics = {
    totalRuns: 0,
    totalReconciliations: 0,
    totalDiscrepancies: 0,
    totalFailed: 0,
    totalDurationMs: 0,
    lastRunAt: null,
    lastErrorAt: null,
    lastError: null,
    lastReconciliationDate: null
  }
  private intervalHandle: NodeJS.Timeout | null = null

  constructor(
    private readonly reconciliationService: ReconciliationService,
    /** 待实现: 从 TenantConfigService 拉取 */
    private readonly tenantChannelResolver: () => Array<{
      tenantId: string
      channel: 'WECHAT' | 'ALIPAY' | 'CARD' | 'CASH'
    }> = () => []
  ) {}

  onApplicationBootstrap(): void {
    // 每小时检查一次 (MVP)
    // 真实生产: K8s CronJob 调度, 这里只暴露 runOnce
    this.intervalHandle = setInterval(() => {
      const hour = new Date().getHours()
      if (hour === 2) {
        // 凌晨 2 点
        const yesterday = this.yesterday()
        if (this.metrics.lastReconciliationDate !== yesterday) {
          this.runOnce({ date: yesterday }).catch((err) => {
            this.logger.error(
              `Scheduled reconciliation failed: ${(err as Error).message}`
            )
          })
        }
      }
    }, 60 * 60 * 1000)
    this.logger.debug('ReconciliationCron started (hourly check, runs at 2am)')
  }

  onApplicationShutdown(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle)
    }
  }

  /**
   * 触发一次对账 (供测试 + 外部调用)
   */
  async runOnce(input: { date: string }): Promise<{
    date: string
    reports: number
    discrepancies: number
    failed: number
    durationMs: number
  }> {
    if (this.reconInProgress) {
      throw new Error('Reconciliation already in progress (reentry lock)')
    }
    this.reconInProgress = true
    const startedAt = Date.now()
    const targets = this.tenantChannelResolver()
    let totalReports = 0
    let totalDiscrepancies = 0
    let totalFailed = 0

    try {
      for (const target of targets) {
        try {
          const report = await this.reconciliationService.reconcile({
            tenantId: target.tenantId,
            channel: target.channel,
            date: input.date
          })
          totalReports += 1
          totalDiscrepancies += report.discrepancies.length
        } catch (error) {
          totalFailed += 1
          this.metrics.lastError = (error as Error).message
          this.metrics.lastErrorAt = new Date().toISOString()
          this.logger.error(
            `Reconciliation failed for tenant=${target.tenantId} channel=${target.channel}: ${(error as Error).message}`
          )
        }
      }
      this.metrics.totalRuns += 1
      this.metrics.totalReconciliations += totalReports
      this.metrics.totalDiscrepancies += totalDiscrepancies
      this.metrics.totalFailed += totalFailed
      this.metrics.totalDurationMs += Date.now() - startedAt
      this.metrics.lastRunAt = new Date().toISOString()
      this.metrics.lastReconciliationDate = input.date

      this.logger.log(
        `Reconciliation done: date=${input.date} reports=${totalReports} discrepancies=${totalDiscrepancies} failed=${totalFailed} duration=${Date.now() - startedAt}ms`
      )
      return {
        date: input.date,
        reports: totalReports,
        discrepancies: totalDiscrepancies,
        failed: totalFailed,
        durationMs: Date.now() - startedAt
      }
    } finally {
      this.reconInProgress = false
    }
  }

  getMetrics(): ReconciliationCronMetrics {
    return { ...this.metrics }
  }

  private yesterday(): string {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().slice(0, 10)
  }
}
