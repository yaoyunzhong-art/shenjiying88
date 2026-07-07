// time-series-collector.service.ts - Phase-19 T25
// 用途: 时序指标采集 + 滚动窗口 + 季节性识别
// 关联: phase-19-intelligence/spec.md §Phase 1
import { Injectable, Logger } from '@nestjs/common';
import type { PerfSample } from '../perf-monitor/perf-monitor.service';

export type WindowSize = '1h' | '6h' | '24h' | '7d' | '30d';

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

export interface TimeSeriesMetric {
  metricKey: string;
  tenantId?: string;
  window: WindowSize;
  points: TimeSeriesPoint[];
  aggregate: {
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    count: number;
  };
  /** 季节性指数:0=无周期,1=强周期 */
  seasonality: number;
}

export interface SeasonalityPattern {
  /** 周周期 (周一是0,周日是6) */
  weekly: number[];
  /** 月周期 (1-31) */
  monthly: number[];
  /** 日周期 (0-23 小时) */
  daily: number[];
}

/**
 * TimeSeriesCollector
 *
 * 数据源:perf-monitor 输出的 PerfSample 流
 * 存储:按 window 大小滚动保留,自动清理过期点
 * 聚合:实时计算 min/max/avg/p50/p95/p99
 * 季节性:基于历史数据识别周期
 *
 * V1 内存版,V2 接 InfluxDB / TimescaleDB
 */
@Injectable()
export class TimeSeriesCollectorService {
  private readonly logger = new Logger(TimeSeriesCollectorService.name);
  /** key = `${metricName}:${tenantId ?? 'global'}` */
  private readonly buffers = new Map<string, TimeSeriesPoint[]>();

  /** 窗口配置 - 各窗口保留的毫秒数 */
  private readonly windowMs: Record<WindowSize, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };

  // ── 数据写入 ──

  /**
   * 写入一个 perf sample
   */
  recordSample(sample: PerfSample): void {
    const key = this.metricKey(sample.route, sample.tenantId);
    const point: TimeSeriesPoint = {
      timestamp: sample.timestamp,
      value: sample.durationMs,
    };
    const buffer = this.buffers.get(key) ?? [];
    buffer.push(point);
    this.buffers.set(key, buffer);
    // 清理超过最大窗口 (30d) 的点
    this.evict(key, sample.timestamp);
  }

  /**
   * 批量写入
   */
  recordBatch(samples: PerfSample[]): number {
    let count = 0;
    for (const s of samples) {
      this.recordSample(s);
      count++;
    }
    return count;
  }

  /**
   * 直接写入任意 metric (供 perf-monitor / quota / Champion 等模块复用)
   */
  recordMetric(input: { metricName: string; tenantId?: string; value: number; timestamp?: string }): void {
    const key = this.metricKey(input.metricName, input.tenantId);
    const point: TimeSeriesPoint = {
      timestamp: input.timestamp ?? new Date().toISOString(),
      value: input.value,
    };
    const buffer = this.buffers.get(key) ?? [];
    buffer.push(point);
    this.buffers.set(key, buffer);
    this.evict(key, point.timestamp);
  }

  // ── 数据读取 ──

  /**
   * 查询窗口内的时序数据
   */
  query(input: { metricName: string; tenantId?: string; window: WindowSize }): TimeSeriesMetric {
    const key = this.metricKey(input.metricName, input.tenantId);
    const all = this.buffers.get(key) ?? [];
    const cutoff = Date.now() - this.windowMs[input.window];
    const points = all.filter((p) => new Date(p.timestamp).getTime() >= cutoff);

    return {
      metricKey: key,
      tenantId: input.tenantId,
      window: input.window,
      points,
      aggregate: this.computeAggregate(points),
      seasonality: this.computeSeasonality(points),
    };
  }

  /**
   * 列出所有已记录的 metric key
   */
  listMetricKeys(): string[] {
    return Array.from(this.buffers.keys());
  }

  // ── 季节性识别 ──

  /**
   * 分析季节性 - 基于历史数据识别周期模式
   *
   * 算法:
   * 1. 按小时分桶 (daily 24 桶)
   * 2. 计算每个小时的均值
   * 3. 计算方差 → 周期性指数 (0-1,1=强周期)
   */
  detectSeasonality(input: { metricName: string; tenantId?: string }): SeasonalityPattern {
    const key = this.metricKey(input.metricName, input.tenantId);
    const all = this.buffers.get(key) ?? [];
    const daily = new Array(24).fill(0);
    const dailyCount = new Array(24).fill(0);
    const weekly = new Array(7).fill(0);
    const weeklyCount = new Array(7).fill(0);
    const monthly = new Array(31).fill(0);
    const monthlyCount = new Array(31).fill(0);

    for (const p of all) {
      const d = new Date(p.timestamp);
      daily[d.getUTCHours()] += p.value;
      dailyCount[d.getUTCHours()]++;
      weekly[d.getUTCDay()] += p.value;
      weeklyCount[d.getUTCDay()]++;
      monthly[d.getUTCDate() - 1] += p.value;
      monthlyCount[d.getUTCDate() - 1]++;
    }

    return {
      daily: daily.map((sum, i) => (dailyCount[i] > 0 ? sum / dailyCount[i] : 0)),
      weekly: weekly.map((sum, i) => (weeklyCount[i] > 0 ? sum / weeklyCount[i] : 0)),
      monthly: monthly.map((sum, i) => (monthlyCount[i] > 0 ? sum / monthlyCount[i] : 0)),
    };
  }

  // ── Prometheus export ──

  /**
   * 导出为 prometheus 文本格式
   */
  toPrometheus(): string {
    const lines: string[] = [];
    for (const key of this.buffers.keys()) {
      const [metricName, tenantId] = key.split(':');
      for (const window of Object.keys(this.windowMs) as WindowSize[]) {
        const metric = this.query({ metricName, tenantId: tenantId === 'global' ? undefined : tenantId, window });
        const labels = tenantId && tenantId !== 'global' ? `{tenantId="${tenantId}"}` : '';
        lines.push(`# HELP ${metricName}_${window} ${metricName} in ${window} window`);
        lines.push(`# TYPE ${metricName}_${window} summary`);
        lines.push(`${metricName}_${window}_avg${labels} ${metric.aggregate.avg}`);
        lines.push(`${metricName}_${window}_p95${labels} ${metric.aggregate.p95}`);
        lines.push(`${metricName}_${window}_p99${labels} ${metric.aggregate.p99}`);
        lines.push(`${metricName}_${window}_count${labels} ${metric.aggregate.count}`);
      }
    }
    return lines.join('\n');
  }

  // ── Internals ──

  private metricKey(metricName: string, tenantId?: string): string {
    return `${metricName}:${tenantId ?? 'global'}`;
  }

  private evict(key: string, currentTimestamp: string): void {
    const buffer = this.buffers.get(key);
    if (!buffer) return;
    const cutoff = Date.now() - this.windowMs['30d'];
    const filtered = buffer.filter((p) => new Date(p.timestamp).getTime() >= cutoff);
    this.buffers.set(key, filtered);
  }

  private computeAggregate(points: TimeSeriesPoint[]): TimeSeriesMetric['aggregate'] {
    if (points.length === 0) {
      return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0, count: 0 };
    }
    const values = points.map((p) => p.value).sort((a, b) => a - b);
    const sum = values.reduce((s, v) => s + v, 0);
    return {
      min: values[0],
      max: values[values.length - 1],
      avg: sum / values.length,
      p50: this.percentile(values, 0.5),
      p95: this.percentile(values, 0.95),
      p99: this.percentile(values, 0.99),
      count: values.length,
    };
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    if (sorted.length === 1) return sorted[0];
    // 线性插值法 (NIST 标准)
    const rank = p * (sorted.length - 1);
    const lower = Math.floor(rank);
    const upper = Math.ceil(rank);
    const weight = rank - lower;
    return sorted[lower] + weight * (sorted[upper] - sorted[lower]);
  }

  /**
   * 季节性指数 = 1 - (残差方差 / 总方差)
   * 简化算法:对 daily/weekly pattern 计算 variation
   */
  private computeSeasonality(points: TimeSeriesPoint[]): number {
    if (points.length < 24) return 0;
    const pattern = this.detectSeasonalityInternal(points);
    const values = pattern.daily;
    if (values.every((v) => v === 0)) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    // 变异系数 CV = stdDev / mean,周期性越强 CV 越大
    const cv = mean > 0 ? stdDev / mean : 0;
    // 归一化到 0-1 (CV 通常 0-1.5 范围)
    return Math.min(1, cv);
  }

  private detectSeasonalityInternal(points: TimeSeriesPoint[]): { daily: number[] } {
    const daily = new Array(24).fill(0);
    const count = new Array(24).fill(0);
    for (const p of points) {
      const h = new Date(p.timestamp).getHours();
      daily[h] += p.value;
      count[h]++;
    }
    return {
      daily: daily.map((s, i) => (count[i] > 0 ? s / count[i] : 0)),
    };
  }

  resetForTests(): void {
    this.buffers.clear();
  }
}
