/**
 * SlaMonitor SLA 监控抽象 (P3-3.1)
 *
 * 业务背景:
 *   - 多底座接入 + 灰度后, 需要 SLA 监控
 *   - 监控指标: 延迟 p95/p99 + 错误率 + 吞吐量
 *   - 触发条件: 阈值越界 → 告警 + 自动回滚
 *
 * 设计要点:
 *   - Port (本文件): 接口 + 数据结构 + 阈值
 *   - Adapter: 内存实现 (P3-3.2), 后续可替换为 Prometheus / OTel
 *   - 告警 + 回滚: 越界后调用 onAlert 回调, 由 CanaryRouter.setForceRollback 自动回滚
 */

export type AlertSeverity = 'info' | 'warning' | 'critical'

/** 单次调用记录 */
export interface LatencyRecord {
  /** 调用耗时 ms */
  durationMs: number
  /** 是否成功 */
  success: boolean
  /** 关联 scope (如 platform / tenant / channel) */
  scope?: string
  /** 关联 operation */
  operation?: string
  /** 时间戳 ms */
  at: number
}

/** 指标汇总 (基于一段时间窗口) */
export interface SlaMetrics {
  scope: string
  /** 样本数 */
  sampleCount: number
  /** 成功率 0-1 */
  successRate: number
  /** 错误率 0-1 */
  errorRate: number
  /** 平均耗时 ms */
  avgDurationMs: number
  /** p95 耗时 ms */
  p95DurationMs: number
  /** p99 耗时 ms */
  p99DurationMs: number
  /** 吞吐量 = sampleCount / windowSeconds */
  throughputPerSec: number
  /** 窗口开始时间 ms */
  windowStart: number
  /** 窗口结束时间 ms */
  windowEnd: number
}

/** SLA 阈值配置 */
export interface SlaThresholds {
  /** p95 延迟上限 (ms), 越界告警 */
  p95Ms?: number
  /** p99 延迟上限 (ms), 越界告警 */
  p99Ms?: number
  /** 错误率上限 (0-1), 越界告警 */
  errorRate?: number
  /** 最小样本数 (小于此数不告警, 避免冷启动误报) */
  minSamples?: number
}

/** 告警事件 */
export interface SlaAlert {
  scope: string
  severity: AlertSeverity
  /** 触发原因 */
  reason: string
  /** 触发时的指标快照 */
  metrics: SlaMetrics
  /** 触发的阈值 */
  thresholds: SlaThresholds
  /** 时间 ms */
  at: number
}

/** 告警回调签名 */
export type SlaAlertHandler = (alert: SlaAlert) => void | Promise<void>

/** SlaMonitor 接口 (Port) */
export interface SlaMonitor {
  /** 记录一次调用 */
  record(record: LatencyRecord): void

  /** 批量记录 */
  recordBatch(records: LatencyRecord[]): void

  /** 获取当前 scope 的指标 (默认聚合全部) */
  getMetrics(scope?: string): SlaMetrics

  /** 获取所有 scope 的指标 */
  getAllMetrics(): SlaMetrics[]

  /** 设置阈值 */
  setThresholds(scope: string, thresholds: SlaThresholds): void

  /** 移除阈值 */
  clearThresholds(scope: string): void

  /** 注册告警回调 */
  onAlert(handler: SlaAlertHandler): void

  /** 主动检测 (业务可定时调用) */
  evaluate(scope?: string): SlaAlert[]

  /** 重置某 scope 的样本 */
  reset(scope?: string): void

  /** 滑动窗口大小 (秒), 默认 60 */
  readonly windowSeconds: number
}
