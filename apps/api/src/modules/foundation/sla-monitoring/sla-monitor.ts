import { Injectable, Logger } from '@nestjs/common'
import {
  type SlaAlert,
  type SlaAlertHandler,
  type LatencyRecord,
  type SlaMetrics,
  type SlaMonitor,
  type SlaThresholds,
  type AlertSeverity
} from './sla-monitor.port'

/**
 * SlaMonitor 内存实现 (P3-3.2)
 *
 * 算法:
 *   - 滑动窗口: 默认 60s, 过期样本自动清理
 *   - 指标计算: p95/p99 用 sort+取分位 (T = ceil(0.95 * N))
 *   - 告警: record() 后立即评估 (sampleCount >= minSamples 才评估)
 *   - 严重度:
 *       info: 1 个阈值越界
 *       warning: 2 个阈值越界
 *       critical: 3 个及以上, 或 p99 越界 + 错误率同时越界
 *
 * 集成:
 *   - BasePlatformRegistry.dispatchXxx() 调 record()
 *   - onAlert 注册到 CanaryRouter.setForceRollback(true) → 自动回滚
 */
@Injectable()
export class SlaMonitorImpl implements SlaMonitor {
  private readonly logger = new Logger(SlaMonitorImpl.name)
  /** scope → 样本数组 (按 at 升序) */
  private readonly samples = new Map<string, LatencyRecord[]>()
  /** scope → 阈值 */
  private readonly thresholds = new Map<string, SlaThresholds>()
  /** 告警回调 */
  private readonly handlers: SlaAlertHandler[] = []
  /** 告警去重: scope:reason → 最后告警时间 */
  private readonly alertDedup = new Map<string, number>()
  /** 告警去重窗口 (ms) - 60s 内同 reason 不重复 */
  private readonly alertDedupMs = 60_000

  readonly windowSeconds: number
  /** 触发评估的最小样本数 (默认 10) */
  private minSamplesDefault: number = 10

  constructor(input: { windowSeconds?: number; minSamples?: number } = {}) {
    this.windowSeconds = input.windowSeconds ?? 60
    if (input.minSamples !== undefined) this.minSamplesDefault = input.minSamples
  }

  // ─── 记录 ───────────────────────────────────

  record(record: LatencyRecord): void {
    const scope = record.scope ?? '__global__'
    let arr = this.samples.get(scope)
    if (!arr) {
      arr = []
      this.samples.set(scope, arr)
    }
    arr.push(record)
    this.evictExpired(arr, record.at)
    // 立即评估
    this.evaluateInternal(scope)
  }

  recordBatch(records: LatencyRecord[]): void {
    for (const r of records) this.record(r)
  }

  private evictExpired(arr: LatencyRecord[], now: number): void {
    const cutoff = now - this.windowSeconds * 1000
    // 找到第一个 >= cutoff 的索引, 前面都过期
    let i = 0
    while (i < arr.length && arr[i].at < cutoff) i += 1
    if (i > 0) arr.splice(0, i)
  }

  // ─── 指标 ───────────────────────────────────

  getMetrics(scope?: string): SlaMetrics {
    const target = scope ?? '__global__'
    return this.computeMetrics(target)
  }

  getAllMetrics(): SlaMetrics[] {
    return Array.from(this.samples.keys()).map((s) => this.computeMetrics(s))
  }

  private computeMetrics(scope: string): SlaMetrics {
    const arr = this.samples.get(scope) ?? []
    const now = Date.now()
    const windowStart = now - this.windowSeconds * 1000
    const N = arr.length
    if (N === 0) {
      return {
        scope,
        sampleCount: 0,
        successRate: 1,
        errorRate: 0,
        avgDurationMs: 0,
        p95DurationMs: 0,
        p99DurationMs: 0,
        throughputPerSec: 0,
        windowStart,
        windowEnd: now
      }
    }
    let success = 0
    const durations: number[] = []
    let sum = 0
    for (const r of arr) {
      if (r.success) success += 1
      durations.push(r.durationMs)
      sum += r.durationMs
    }
    durations.sort((a, b) => a - b)
    const p95Idx = Math.min(N - 1, Math.ceil(0.95 * N) - 1)
    const p99Idx = Math.min(N - 1, Math.ceil(0.99 * N) - 1)
    return {
      scope,
      sampleCount: N,
      successRate: success / N,
      errorRate: (N - success) / N,
      avgDurationMs: sum / N,
      p95DurationMs: durations[Math.max(0, p95Idx)],
      p99DurationMs: durations[Math.max(0, p99Idx)],
      throughputPerSec: N / this.windowSeconds,
      windowStart,
      windowEnd: now
    }
  }

  // ─── 阈值 + 告警 ────────────────────────────

  setThresholds(scope: string, thresholds: SlaThresholds): void {
    this.thresholds.set(scope, thresholds)
  }

  clearThresholds(scope: string): void {
    this.thresholds.delete(scope)
  }

  onAlert(handler: SlaAlertHandler): void {
    this.handlers.push(handler)
  }

  evaluate(scope?: string): SlaAlert[] {
    if (scope) return this.evaluateInternal(scope)
    const alerts: SlaAlert[] = []
    for (const s of this.samples.keys()) {
      alerts.push(...this.evaluateInternal(s))
    }
    return alerts
  }

  private evaluateInternal(scope: string): SlaAlert[] {
    const thresholds = this.thresholds.get(scope)
    if (!thresholds) return []
    const metrics = this.computeMetrics(scope)
    const minSamples = thresholds.minSamples ?? this.minSamplesDefault
    if (metrics.sampleCount < minSamples) return []
    const alerts: SlaAlert[] = []
    const violations: string[] = []
    if (thresholds.p95Ms !== undefined && metrics.p95DurationMs > thresholds.p95Ms) {
      violations.push(`p95=${metrics.p95DurationMs.toFixed(0)}ms > ${thresholds.p95Ms}ms`)
    }
    if (thresholds.p99Ms !== undefined && metrics.p99DurationMs > thresholds.p99Ms) {
      violations.push(`p99=${metrics.p99DurationMs.toFixed(0)}ms > ${thresholds.p99Ms}ms`)
    }
    if (thresholds.errorRate !== undefined && metrics.errorRate > thresholds.errorRate) {
      violations.push(`errorRate=${(metrics.errorRate * 100).toFixed(1)}% > ${(thresholds.errorRate * 100).toFixed(1)}%`)
    }
    if (violations.length === 0) return alerts
    const severity: AlertSeverity =
      violations.length >= 3 || (violations.length >= 2 && violations.some((v) => v.startsWith('p99')))
        ? 'critical'
        : violations.length === 2
        ? 'warning'
        : 'info'
    const reason = violations.join('; ')
    const alert: SlaAlert = {
      scope,
      severity,
      reason,
      metrics,
      thresholds,
      at: Date.now()
    }
    alerts.push(alert)
    // 去重
    const dedupKey = `${scope}:${reason}`
    const last = this.alertDedup.get(dedupKey) ?? 0
    if (Date.now() - last >= this.alertDedupMs) {
      this.alertDedup.set(dedupKey, Date.now())
      // 异步触发告警, 不阻塞 record()
      void this.fireAlert(alert)
    }
    return alerts
  }

  private async fireAlert(alert: SlaAlert): Promise<void> {
    for (const h of this.handlers) {
      try {
        await h(alert)
      } catch (err) {
        this.logger.error(`Alert handler failed: ${(err as Error).message}`)
      }
    }
  }

  // ─── 重置 ───────────────────────────────────

  reset(scope?: string): void {
    if (scope) {
      this.samples.delete(scope)
      this.alertDedup.clear()
    } else {
      this.samples.clear()
      this.alertDedup.clear()
    }
  }
}
