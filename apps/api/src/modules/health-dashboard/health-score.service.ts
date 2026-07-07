// health-score.service.ts - Phase-19 T34
// 用途: 租户健康度评分 (P95 + 错误率 + 配额使用 + Champion 活跃度)
// 关联: phase-19-intelligence/spec.md §Phase 4
import { Injectable } from '@nestjs/common';

export interface TenantHealthInput {
  tenantId: string;
  p95Ms: number;
  errorRate: number;
  quotaUsagePercent: number;
  championActivityScore: number;
  anomalyCount30d: number;
}

export interface TenantHealthScore {
  tenantId: string;
  score: number;
  components: {
    performance: number;
    reliability: number;
    quotaHealth: number;
    community: number;
  };
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  recommendations: string[];
  computedAt: string;
}

@Injectable()
export class HealthScoreService {
  /**
   * 计算租户健康度 (0-100)
   *
   * 权重:
   * - performance: 30% (P95 < 200ms = 满分)
   * - reliability: 30% (error rate < 0.1% = 满分)
   * - quotaHealth: 20% (使用率 < 80% = 满分)
   * - community: 20% (Champion 活跃 > 50 = 满分)
   */
  compute(input: TenantHealthInput): TenantHealthScore {
    const performance = this.scorePerformance(input.p95Ms);
    const reliability = this.scoreReliability(input.errorRate);
    const quotaHealth = this.scoreQuota(input.quotaUsagePercent);
    const community = this.scoreCommunity(input.championActivityScore);

    const score = Math.round(
      performance * 0.3 + reliability * 0.3 + quotaHealth * 0.2 + community * 0.2,
    );

    const status: TenantHealthScore['status'] =
      score >= 80 ? 'HEALTHY' :
      score >= 60 ? 'WARNING' : 'CRITICAL';

    const recommendations = this.buildRecommendations({
      performance, reliability, quotaHealth, community,
      input,
    });

    return {
      tenantId: input.tenantId,
      score,
      components: { performance, reliability, quotaHealth, community },
      status,
      recommendations,
      computedAt: new Date().toISOString(),
    };
  }

  /**
   * 批量评分 + 排序
   */
  computeBatch(inputs: TenantHealthInput[]): TenantHealthScore[] {
    return inputs
      .map((i) => this.compute(i))
      .sort((a, b) => a.score - b.score); // 健康度升序,差在前
  }

  // ── Component scorers ──

  private scorePerformance(p95Ms: number): number {
    if (p95Ms <= 100) return 100;
    if (p95Ms <= 200) return 90;
    if (p95Ms <= 500) return 70;
    if (p95Ms <= 1000) return 50;
    if (p95Ms <= 3000) return 30;
    return 10;
  }

  private scoreReliability(errorRate: number): number {
    if (errorRate < 0.001) return 100;
    if (errorRate < 0.005) return 90;
    if (errorRate < 0.01) return 75;
    if (errorRate < 0.05) return 50;
    if (errorRate < 0.1) return 30;
    return 10;
  }

  private scoreQuota(usagePercent: number): number {
    if (usagePercent < 0.5) return 100;
    if (usagePercent < 0.7) return 90;
    if (usagePercent < 0.8) return 75;
    if (usagePercent < 0.9) return 50;
    if (usagePercent < 1.0) return 30;
    return 10; // 已超 quota
  }

  private scoreCommunity(championActivityScore: number): number {
    if (championActivityScore >= 100) return 100;
    if (championActivityScore >= 50) return 80;
    if (championActivityScore >= 20) return 60;
    if (championActivityScore >= 5) return 40;
    return 20;
  }

  private buildRecommendations(components: {
    performance: number;
    reliability: number;
    quotaHealth: number;
    community: number;
    input: TenantHealthInput;
  }): string[] {
    const recs: string[] = [];
    if (components.performance < 70) {
      recs.push(`性能不达标: P95=${components.input.p95Ms}ms,建议优化慢查询 (perf-monitor 提示)`);
    }
    if (components.reliability < 70) {
      recs.push(`错误率偏高: ${(components.input.errorRate * 100).toFixed(2)}%,建议排查最近异常 (anomaly-detector 提示)`);
    }
    if (components.quotaHealth < 70) {
      recs.push(`配额使用率高: ${(components.input.quotaUsagePercent * 100).toFixed(0)}%,考虑升级套餐`);
    }
    if (components.community < 60) {
      recs.push(`Champion 活跃度低: score=${components.input.championActivityScore},建议招募或培训`);
    }
    if (components.input.anomalyCount30d > 10) {
      recs.push(`30 天内异常事件 ${components.input.anomalyCount30d} 次,需关注稳定性`);
    }
    if (recs.length === 0) recs.push('健康度良好,继续保持');
    return recs;
  }
}
