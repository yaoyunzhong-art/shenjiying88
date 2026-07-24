/**
 * monitor-scheduler.ts — P-50 V2 竞争监控定时调度
 *
 * 调度策略:
 *   - 每2小时触发一次增量扫描
 *   - 每天04:00触发全量扫描（与侦察兵采集协同）
 *
 * 圈梁备注:
 *   依赖 @nestjs/schedule 的 ScheduleModule
 */
import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { MonitorCollectorService } from './monitor-collector.service'
import type { CompetitorAlert } from './intelligence.entity'

@Injectable()
export class MonitorScheduler {
  private readonly logger = new Logger(MonitorScheduler.name)

  /** 最近一次扫描结果缓存（最新告警列表） */
  private lastScanResult: CompetitorAlert[] = []
  private lastScanTimestamp: string | null = null

  constructor(private readonly collector: MonitorCollectorService) {
    this.logger.debug('MonitorScheduler 初始化，扫描间隔2h，全量扫描每天04:00')
  }

  /**
   * 每2小时增量扫描
   * 以整点0分为基准，保证扫描时间可预测
   */
  @Cron('0 */2 * * *', {
    name: 'monitor-incremental-scan',
    timeZone: 'Asia/Shanghai',
  })
  async handleIncrementalScan(): Promise<void> {
    this.logger.log('[Cron] 开始增量扫描 (2h间隔)')

    try {
      const rawAlerts = await this.collector.incrementalScan()
      const dedupedAlerts = this.collector.deduplicate(rawAlerts)
      this.lastScanResult = dedupedAlerts
      this.lastScanTimestamp = new Date().toISOString()

      this.logger.log(`[Cron] 增量扫描完成: ${rawAlerts.length}→${dedupedAlerts.length} 条告警`)
    } catch (err) {
      this.logger.error('[Cron] 增量扫描异常', err)
    }
  }

  /**
   * 每天04:00全量扫描
   * 与侦察兵(Scout)采集协同使用，覆盖更多竞品
   */
  @Cron('0 4 * * *', {
    name: 'monitor-full-scan',
    timeZone: 'Asia/Shanghai',
  })
  async handleFullScan(): Promise<void> {
    this.logger.log('[Cron] 开始全量扫描 (每日04:00)')

    try {
      const rawAlerts = await this.collector.fullScan()
      const dedupedAlerts = this.collector.deduplicate(rawAlerts)
      this.lastScanResult = dedupedAlerts
      this.lastScanTimestamp = new Date().toISOString()

      this.logger.log(`[Cron] 全量扫描完成: ${rawAlerts.length}→${dedupedAlerts.length} 条告警`)
    } catch (err) {
      this.logger.error('[Cron] 全量扫描异常', err)
    }
  }

  /** 获取最近一次扫描结果 */
  getLastScanResult(): { alerts: CompetitorAlert[]; scanTimestamp: string | null } {
    return {
      alerts: this.lastScanResult,
      scanTimestamp: this.lastScanTimestamp,
    }
  }
}
