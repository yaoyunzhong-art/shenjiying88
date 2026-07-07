// perf-monitor.service.ts - Phase-18 T15
// 用途: 关键路径 P95/SLA 监控 + 慢查询检测
// 关联: phase-18-experience-ai/spec.md §2.1
import { Injectable, Logger } from '@nestjs/common';

export interface PerfSample {
  route: string;
  durationMs: number;
  statusCode: number;
  timestamp: string;
  tenantId?: string;
}

export interface PerfStats {
  route: string;
  p50: number;
  p95: number;
  p99: number;
  max: number;
  count: number;
  errorRate: number;
}

export interface SlaConfig {
  route: string;
  targetP95Ms: number;
  warnThresholdP95Ms: number;
}

/**
 * PerfMonitorService - 性能监控服务
 *
 * 关键能力:
 * 1. 路由级 P95/P99 统计 (滑动窗口)
 * 2. SLA 监控 (P95 < target, 超阈值告警)
 * 3. 慢查询检测 (> 500ms 单独记录)
 * 4. 错误率统计
 */
@Injectable()
export class PerfMonitorService {
  private readonly logger = new Logger(PerfMonitorService.name);
  private readonly samples: PerfSample[] = [];
  private readonly slowQueries: PerfSample[] = [];
  private readonly slaConfigs = new Map<string, SlaConfig>();
  /** 路由 → [P95违规次数] */
  private readonly slaViolations = new Map<string, number>();
  private readonly MAX_SAMPLES = 10_000;

  /** 测试 helper */
  reset(): void {
    this.samples.length = 0;
    this.slowQueries.length = 0;
    this.slaConfigs.clear();
    this.slaViolations.clear();
  }

  /** 注册 SLA 配置 */
  registerSla(config: SlaConfig): void {
    this.slaConfigs.set(config.route, config);
  }

  /** 记录一次采样 */
  record(sample: PerfSample): void {
    this.samples.push(sample);
    if (this.samples.length > this.MAX_SAMPLES) {
      this.samples.shift();
    }
    if (sample.durationMs > 500) {
      this.slowQueries.push(sample);
      if (this.slowQueries.length > 1000) this.slowQueries.shift();
    }
    // SLA 检查
    const sla = this.slaConfigs.get(sample.route);
    if (sla) {
      const stats = this.getStatsForRoute(sample.route);
      if (stats.p95 > sla.warnThresholdP95Ms) {
        const count = (this.slaViolations.get(sample.route) ?? 0) + 1;
        this.slaViolations.set(sample.route, count);
        if (stats.p95 > sla.targetP95Ms * 1.2) {
          this.logger.warn(
            `[SLA VIOLATION] ${sample.route}: p95=${stats.p95.toFixed(1)}ms > target ${sla.targetP95Ms}ms (${count} violations)`
          );
        }
      }
    }
  }

  /** 计算路由 P95/P99 */
  getStatsForRoute(route: string): PerfStats {
    const routeSamples = this.samples.filter(s => s.route === route);
    if (routeSamples.length === 0) {
      return { route, p50: 0, p95: 0, p99: 0, max: 0, count: 0, errorRate: 0 };
    }
    const durations = routeSamples.map(s => s.durationMs).sort((a, b) => a - b);
    const errorCount = routeSamples.filter(s => s.statusCode >= 400).length;
    return {
      route,
      p50: this.percentile(durations, 0.5),
      p95: this.percentile(durations, 0.95),
      p99: this.percentile(durations, 0.99),
      max: durations[durations.length - 1],
      count: routeSamples.length,
      errorRate: errorCount / routeSamples.length,
    };
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const idx = Math.min(Math.floor(sorted.length * p), sorted.length - 1);
    return sorted[idx];
  }

  /** 所有路由统计 */
  getAllStats(): PerfStats[] {
    const routes = new Set(this.samples.map(s => s.route));
    return Array.from(routes).map(r => this.getStatsForRoute(r));
  }

  /** SLA 违规路由 */
  getSlaViolations(): { route: string; violations: number; stats: PerfStats }[] {
    const result: { route: string; violations: number; stats: PerfStats }[] = [];
    for (const [route, count] of this.slaViolations.entries()) {
      result.push({ route, violations: count, stats: this.getStatsForRoute(route) });
    }
    return result.sort((a, b) => b.violations - a.violations);
  }

  /** 慢查询列表 */
  getSlowQueries(limit: number = 20): PerfSample[] {
    return this.slowQueries.slice(-limit);
  }

  /** 总览 */
  summary(): { totalSamples: number; routes: number; slowQueries: number; slaViolations: number } {
    return {
      totalSamples: this.samples.length,
      routes: new Set(this.samples.map(s => s.route)).size,
      slowQueries: this.slowQueries.length,
      slaViolations: Array.from(this.slaViolations.values()).reduce((s, v) => s + v, 0),
    };
  }
}
