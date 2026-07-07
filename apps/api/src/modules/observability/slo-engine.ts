/**
 * slo-engine.ts - Phase-22 T77/T78
 * SLO (Service Level Objective) 计算引擎 + Error Budget 跟踪
 *
 * SLI (Service Level Indicator):
 *   - availability: 成功请求数 / 总请求数 (排除 4xx)
 *   - latency: P99 / P95 / P50 response time
 *   - error_rate: 5xx 错误 / 总请求
 *
 * SLO (目标):
 *   - availability >= 99.9% (target)
 *   - latency P99 <= 500ms
 *   - error_rate <= 0.1%
 *
 * Error Budget:
 *   - 月度 budget = 1 - SLO target
 *   - 已用 budget = 1 - 当前 SLI
 *   - burn rate = 已用 / 时间窗口进度
 *   - 当 burn rate > 阈值时报警
 *
 * Burn Rate 阈值 (Google SRE workbook):
 *   - 1h burn rate > 14.4 → 2% budget in 1h → 立即响应 (P0)
 *   - 6h burn rate > 6    → 5% budget in 6h → 当天响应 (P1)
 *   - 24h burn rate > 3   → 10% budget in 24h
 *   - 72h burn rate > 1   → 25% budget in 72h
 */

export type SLIType = 'availability' | 'latency_p99' | 'latency_p95' | 'error_rate';

export interface SLIDataPoint {
  timestamp: string;
  total: number;
  successful: number; // status < 500
  errors: number;     // status >= 500
  /** latency 样本 (ms) */
  latencies: number[];
}

export interface SLOTarget {
  id: string;
  name: string;
  type: SLIType;
  /** 目标值:availability 99.9 → 0.999, latency <= 500 */
  target: number;
  /** 比较方向: 'gte' (>=) 或 'lte' (<=) */
  compare: 'gte' | 'lte';
  /** 月度窗口天数 (默认 30) */
  windowDays?: number;
}

export interface SLIReport {
  sloId: string;
  sloName: string;
  type: SLIType;
  /** 当前 SLI 值 (0-1 for availability/error_rate, ms for latency) */
  current: number;
  /** 目标值 */
  target: number;
  /** 是否达标 (基于 compare) */
  passing: boolean;
  /** 月度 budget (0-1) */
  monthlyBudget: number;
  /** 已用 budget (0-1) */
  budgetUsed: number;
  /** 剩余 budget (0-1) */
  budgetRemaining: number;
  /** Burn rate (当前已用 / 时间窗口进度) */
  burnRate: number;
  /** 评估窗口 */
  windowMs: number;
  /** 评估时间 */
  evaluatedAt: string;
}

export interface SLOCalculatorConfig {
  /** SLO targets 配置 */
  targets: SLOTarget[];
  /** 评估时间窗口 (ms),默认 30 天 */
  windowMs?: number;
}

export class SLOCalculator {
  private readonly targets: SLOTarget[];
  private readonly defaultWindowMs: number;

  constructor(config: SLOCalculatorConfig) {
    if (config.targets.length === 0) throw new Error('At least one SLO target required');
    this.targets = config.targets;
    this.defaultWindowMs = config.windowMs ?? 30 * 24 * 60 * 60 * 1000;
  }

  /**
   * 计算单个 SLO 报告
   */
  evaluate(targetId: string, points: SLIDataPoint[], windowMs?: number): SLIReport {
    const target = this.targets.find((t) => t.id === targetId);
    if (!target) throw new Error(`Unknown SLO target: ${targetId}`);

    const winMs = windowMs ?? this.defaultWindowMs;
    const cutoff = Date.now() - winMs;
    const windowPoints = points.filter((p) => new Date(p.timestamp).getTime() >= cutoff);

    let current: number;
    switch (target.type) {
      case 'availability':
        current = this.computeAvailability(windowPoints);
        break;
      case 'latency_p99':
        current = this.computePercentile(windowPoints, 99);
        break;
      case 'latency_p95':
        current = this.computePercentile(windowPoints, 95);
        break;
      case 'error_rate':
        current = this.computeErrorRate(windowPoints);
        break;
    }

    const passing = target.compare === 'gte' ? current >= target.target : current <= target.target;
    const monthlyBudget = this.computeMonthlyBudget(target);
    const budgetUsed = target.compare === 'gte'
      ? Math.max(0, target.target - current) // SLI < target 时为负 → 用 0
      : Math.max(0, current - target.target);

    // 时间窗口进度 (0-1)
    const windowProgress = Math.min(1, winMs / this.defaultWindowMs);
    const budgetBurnedRatio = monthlyBudget === 0 ? 0 : budgetUsed / monthlyBudget;
    const burnRate = windowProgress === 0 ? 0 : budgetBurnedRatio / windowProgress;

    return {
      sloId: target.id,
      sloName: target.name,
      type: target.type,
      current,
      target: target.target,
      passing,
      monthlyBudget,
      budgetUsed: budgetBurnedRatio,
      budgetRemaining: Math.max(0, 1 - budgetBurnedRatio),
      burnRate,
      windowMs: winMs,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * 评估所有 targets,返回报告列表
   */
  evaluateAll(pointsBySLO: Record<string, SLIDataPoint[]>): SLIReport[] {
    return this.targets.map((t) => this.evaluate(t.id, pointsBySLO[t.id] ?? []));
  }

  /**
   * 检查 burn rate 是否触发告警
   * Google SRE 阈值:1h>14.4 / 6h>6 / 24h>3 / 72h>1
   */
  checkBurnRateAlert(report: SLIReport): { alert: boolean; severity: 'P0' | 'P1' | 'P2' | null } {
    if (report.burnRate >= 14.4) return { alert: true, severity: 'P0' };
    if (report.burnRate >= 6) return { alert: true, severity: 'P1' };
    if (report.burnRate >= 3) return { alert: true, severity: 'P2' };
    return { alert: false, severity: null };
  }

  // ── SLI 计算 ──

  private computeAvailability(points: SLIDataPoint[]): number {
    const total = points.reduce((s, p) => s + p.total, 0);
    const success = points.reduce((s, p) => s + p.successful, 0);
    return total === 0 ? 1 : success / total;
  }

  private computeErrorRate(points: SLIDataPoint[]): number {
    const total = points.reduce((s, p) => s + p.total, 0);
    const errors = points.reduce((s, p) => s + p.errors, 0);
    return total === 0 ? 0 : errors / total;
  }

  private computePercentile(points: SLIDataPoint[], p: number): number {
    const allLatencies = points.flatMap((p) => p.latencies);
    if (allLatencies.length === 0) return 0;
    const sorted = [...allLatencies].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
  }

  private computeMonthlyBudget(target: SLOTarget): number {
    // availability 99.9% → budget = 1 - 0.999 = 0.001 (0.1% 可用 downtime)
    // latency 500ms P99 → budget = 时间窗口中超过 500ms 的比例上限
    // V1 简化:availability error budget = 1 - target; latency budget = 0.01 (1% 慢请求)
    if (target.type === 'availability' || target.type === 'error_rate') {
      return Math.abs(1 - target.target);
    }
    // latency: 简化用 5% 慢请求作为 budget
    return 0.05;
  }

  listTargets(): SLOTarget[] {
    return [...this.targets];
  }
}

// ── Default SLO Targets ──

export const DEFAULT_SLO_TARGETS: SLOTarget[] = [
  {
    id: 'api_availability',
    name: 'API 可用性',
    type: 'availability',
    target: 0.999,
    compare: 'gte',
    windowDays: 30,
  },
  {
    id: 'api_latency_p99',
    name: 'API P99 延迟',
    type: 'latency_p99',
    target: 500,
    compare: 'lte',
    windowDays: 30,
  },
  {
    id: 'api_latency_p95',
    name: 'API P95 延迟',
    type: 'latency_p95',
    target: 200,
    compare: 'lte',
    windowDays: 30,
  },
  {
    id: 'api_error_rate',
    name: 'API 错误率',
    type: 'error_rate',
    target: 0.001,
    compare: 'lte',
    windowDays: 30,
  },
];
