// time-series.service.ts - Phase-19 T27 auto
// 用途: 时序指标业务逻辑层 — 聚合查询/告警/导出
// 关联: time-series-collector.service.ts (底层采集)
import { Injectable, Logger } from '@nestjs/common'
import { TimeSeriesCollectorService } from './time-series-collector.service'
import type { WindowSize } from './time-series.dto'

export interface AlertRule {
  metricName: string
  tenantId?: string
  operator: 'gt' | 'lt' | 'gte' | 'lte'
  threshold: number
  window: WindowSize
  description?: string
}

export interface AlertEvent {
  rule: AlertRule
  currentValue: number
  triggeredAt: string
  message: string
}

export interface TimeSeriesSummary {
  totalMetrics: number
  totalPoints: number
  oldestTimestamp: string | null
  newestTimestamp: string | null
  topMetricNames: string[]
}

@Injectable()
export class TimeSeriesService {
  private readonly logger = new Logger(TimeSeriesService.name)
  private readonly alertRules: AlertRule[] = []
  private readonly alerts: AlertEvent[] = []
  private readonly MAX_ALERTS = 100

  constructor(private readonly collector: TimeSeriesCollectorService) {}

  // ── 告警规则管理 ──

  /**
   * 注册一条告警规则
   */
  registerAlertRule(rule: AlertRule): { id: number; rule: AlertRule } {
    const id = this.alertRules.length
    this.alertRules.push(rule)
    this.logger.log(`Alert rule #${id} registered: ${rule.metricName} ${rule.operator} ${rule.threshold}`)
    return { id, rule }
  }

  /**
   * 列出所有告警规则
   */
  listAlertRules(): AlertRule[] {
    return [...this.alertRules]
  }

  /**
   * 删除一条告警规则
   */
  removeAlertRule(id: number): boolean {
    if (id < 0 || id >= this.alertRules.length) return false
    this.alertRules[id] = undefined as unknown as AlertRule
    return true
  }

  /**
   * 评估所有告警规则，返回新触发的告警
   */
  evaluateAllRules(): AlertEvent[] {
    const triggered: AlertEvent[] = []
    for (const rule of this.alertRules) {
      if (!rule) continue
      try {
        const metric = this.collector.query({
          metricName: rule.metricName,
          tenantId: rule.tenantId,
          window: rule.window,
        })
        if (metric.aggregate.count === 0) continue

        const currentValue = metric.aggregate.avg
        let isTriggered = false
        switch (rule.operator) {
          case 'gt': isTriggered = currentValue > rule.threshold; break
          case 'lt': isTriggered = currentValue < rule.threshold; break
          case 'gte': isTriggered = currentValue >= rule.threshold; break
          case 'lte': isTriggered = currentValue <= rule.threshold; break
        }

        if (isTriggered) {
          const event: AlertEvent = {
            rule: { ...rule },
            currentValue,
            triggeredAt: new Date().toISOString(),
            message: `[ALERT] ${rule.metricName}: ${currentValue} ${rule.operator} ${rule.threshold}`,
          }
          this.alerts.push(event)
          if (this.alerts.length > this.MAX_ALERTS) this.alerts.shift()
          triggered.push(event)
          this.logger.warn(event.message)
        }
      } catch (err) {
        this.logger.error(`Error evaluating rule #${this.alertRules.indexOf(rule)}: ${err}`)
      }
    }
    return triggered
  }

  /**
   * 获取最近的告警历史
   */
  getRecentAlerts(limit = 20): AlertEvent[] {
    return this.alerts.slice(-limit)
  }

  // ── 聚合查询 ──

  /**
   * 获取时序数据摘要
   */
  getSummary(): TimeSeriesSummary {
    const keys = this.collector.listMetricKeys()
    let totalPoints = 0
    let oldest: string | null = null
    let newest: string | null = null

    for (const key of keys) {
      const [metricName, tenantId] = key.split(':')
      const metric = this.collector.query({
        metricName,
        tenantId: tenantId === 'global' ? undefined : tenantId,
        window: '30d',
      })
      totalPoints += metric.aggregate.count
      for (const point of metric.points) {
        if (!oldest || point.timestamp < oldest) oldest = point.timestamp
        if (!newest || point.timestamp > newest) newest = point.timestamp
      }
    }

    return {
      totalMetrics: keys.length,
      totalPoints,
      oldestTimestamp: oldest,
      newestTimestamp: newest,
      topMetricNames: keys.slice(0, 10).map((k) => k.split(':')[0]),
    }
  }

  /**
   * 跨窗口对比查询 (1h / 6h / 24h)
   */
  compareWindows(metricName: string, tenantId?: string): Array<{ window: WindowSize; avg: number; count: number; p95: number }> {
    const windows: WindowSize[] = ['1h', '6h', '24h']
    return windows.map((window) => {
      const metric = this.collector.query({ metricName, tenantId, window })
      return {
        window,
        avg: metric.aggregate.avg,
        count: metric.aggregate.count,
        p95: metric.aggregate.p95,
      }
    })
  }
}
