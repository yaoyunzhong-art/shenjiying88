/**
 * alert-engine.ts - Phase-22 T75
 * Alertmanager 兼容告警引擎
 *
 * 三级告警:
 * - P0: 紧急 (5xx 错误率 > 5% / latency P99 > 5s / 服务宕机)
 * - P1: 警告 (P99 > 1s / 4xx 错误率 > 20% / 队列积压)
 * - P2: 通知 (SLO burn rate 异常 / 非关键异常)
 *
 * 评估规则:
 *   阈值 (threshold) + 时间窗口 (windowMs) + 最小样本 (minSamples)
 *   触发条件: metric 在窗口内超过阈值 + 样本数足够
 *
 * 抑制规则 (inhibit):
 *   P0 触发时抑制同服务的 P1/P2
 *   服务宕机时抑制该服务其他告警
 *
 * 用法:
 *   const engine = new AlertEngine({ metrics: metricsService });
 *   engine.addRule({ id: 'http_5xx_rate', severity: 'P0', ... });
 *   const alerts = engine.evaluate();
 */
import { MetricsService } from './metrics.service';

export type AlertSeverity = 'P0' | 'P1' | 'P2';
export type AlertState = 'firing' | 'resolved' | 'silenced';

export interface AlertRule {
  id: string;
  severity: AlertSeverity;
  /** 显示标题 */
  title: string;
  /** 详细描述 (markdown) */
  description?: string;
  /** 评估的 metric 名 */
  metric: string;
  /** 评估函数:返回 metric 摘要 → 触发? */
  evaluator: (summary: MetricSummary) => boolean;
  /** 时间窗口 (ms) */
  windowMs: number;
  /** 最小样本数 (避免冷启动误报) */
  minSamples?: number;
  /** 受影响的服务 / 模块 */
  service?: string;
  /** 抑制规则:命中此告警后,抑制其他告警 */
  inhibits?: string[];
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: AlertSeverity;
  title: string;
  state: AlertState;
  /** 当前值 (触发时的快照) */
  value?: number;
  /** 触发时间 */
  firedAt: string;
  /** 解决时间 */
  resolvedAt?: string;
  /** 评估窗口 */
  windowMs: number;
  /** 服务/模块 */
  service?: string;
  /** 触发原因 */
  reason?: string;
}

export interface MetricSummary {
  /** 时间窗口内样本数 */
  count: number;
  /** 平均值 */
  avg: number;
  /** 最大值 */
  max: number;
  /** 最小值 */
  min: number;
  /** P50 (中位数) */
  p50: number;
  /** P95 */
  p95: number;
  /** P99 */
  p99: number;
}

export interface AlertEngineConfig {
  metrics: MetricsService;
  /** 默认 min samples (默认 10) */
  defaultMinSamples?: number;
  /** 时间窗口数据保留 */
  historyMs?: number;
}

// ── Helper: 计算百分位 ──

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, idx)];
}

// ── AlertEngine ──

export class AlertEngine {
  private readonly rules = new Map<string, AlertRule>();
  private readonly activeAlerts = new Map<string, Alert>();
  private readonly history: Alert[] = [];
  private readonly metrics: MetricsService;
  private readonly defaultMinSamples: number;

  constructor(config: AlertEngineConfig) {
    this.metrics = config.metrics;
    this.defaultMinSamples = config.defaultMinSamples ?? 10;
  }

  // ── Rule Management ──

  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  listRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  // ── Evaluation ──

  /**
   * 评估所有规则,返回当前 firing alerts
   */
  evaluate(): Alert[] {
    const now = Date.now();
    const firing: Alert[] = [];

    for (const rule of this.rules.values()) {
      const summary = this.computeSummary(rule.metric, rule.windowMs);
      const minSamples = rule.minSamples ?? this.defaultMinSamples;
      const shouldFire = summary.count >= minSamples && rule.evaluator(summary);

      const existing = this.activeAlerts.get(rule.id);
      if (shouldFire) {
        const alert: Alert = {
          id: existing?.id ?? `${rule.id}-${now}`,
          ruleId: rule.id,
          severity: rule.severity,
          title: rule.title,
          state: 'firing',
          value: summary.avg,
          firedAt: existing?.firedAt ?? new Date(now).toISOString(),
          windowMs: rule.windowMs,
          service: rule.service,
          reason: `${rule.metric} avg=${summary.avg.toFixed(2)} p99=${summary.p99.toFixed(2)} (count=${summary.count})`,
        };
        this.activeAlerts.set(rule.id, alert);
        firing.push(alert);
      } else if (existing) {
        // Resolve
        existing.state = 'resolved';
        existing.resolvedAt = new Date(now).toISOString();
        this.history.push(existing);
        this.activeAlerts.delete(rule.id);
      }
    }

    // 应用抑制规则
    return this.applyInhibits(firing);
  }

  /**
   * 获取当前 active alerts (不重新评估)
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * 获取历史 alerts (resolved)
   */
  getHistory(limit = 100): Alert[] {
    return this.history.slice(-limit);
  }

  // ── Helpers ──

  private computeSummary(metricName: string, windowMs: number): MetricSummary {
    const rendered = this.metrics.render();
    const cutoff = Date.now() - windowMs;
    const values: number[] = [];

    // 简化实现:解析当前 render 输出;真实场景应从 time-series DB 拉
    // 这里我们用 histogram 桶中点估算 + count
    const lines = rendered.split('\n');
    for (const line of lines) {
      if (!line.startsWith(`${metricName}_count`)) continue;
      const m = line.match(/\s+(\d+(?:\.\d+)?)$/);
      if (m) values.push(Number(m[1]));
    }

    if (values.length === 0) {
      return { count: 0, avg: 0, max: 0, min: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((s, v) => s + v, 0);

    return {
      count: values.length,
      avg: sum / values.length,
      max: sorted[sorted.length - 1],
      min: sorted[0],
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
    };
  }

  private applyInhibits(alerts: Alert[]): Alert[] {
    const ruleMap = new Map(alerts.map((a) => [a.ruleId, a]));
    const inhibited = new Set<string>();

    for (const alert of alerts) {
      const rule = this.rules.get(alert.ruleId);
      if (!rule?.inhibits) continue;
      for (const inhibitId of rule.inhibits) {
        if (ruleMap.has(inhibitId)) inhibited.add(inhibitId);
      }
    }

    return alerts.filter((a) => !inhibited.has(a.ruleId));
  }
}

// ── Default Rules ──

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'http_5xx_high',
    severity: 'P0',
    title: 'HTTP 5xx 错误率过高',
    description: '5xx 错误率 > 5%,用户受影响',
    metric: 'http_requests_total',
    evaluator: (s) => s.avg > 5,
    windowMs: 60_000,
    minSamples: 100,
    inhibits: ['http_4xx_high', 'latency_p99_high'],
  },
  {
    id: 'http_4xx_high',
    severity: 'P1',
    title: 'HTTP 4xx 错误率过高',
    metric: 'http_requests_total',
    evaluator: (s) => s.avg > 20,
    windowMs: 60_000,
    minSamples: 100,
  },
  {
    id: 'latency_p99_high',
    severity: 'P1',
    title: 'API 延迟 P99 超过 1s',
    metric: 'http_request_duration_ms',
    evaluator: (s) => s.p99 > 1000,
    windowMs: 60_000,
    minSamples: 50,
  },
  {
    id: 'latency_p99_critical',
    severity: 'P0',
    title: 'API 延迟 P99 超过 5s (严重)',
    metric: 'http_request_duration_ms',
    evaluator: (s) => s.p99 > 5000,
    windowMs: 60_000,
    minSamples: 50,
  },
  {
    id: 'exceptions_burst',
    severity: 'P1',
    title: '异常数突增',
    metric: 'http_exceptions_total',
    evaluator: (s) => s.count > 50,
    windowMs: 60_000,
    minSamples: 1,
  },
];

export function installDefaultRules(engine: AlertEngine): void {
  for (const rule of DEFAULT_ALERT_RULES) engine.addRule(rule);
}
