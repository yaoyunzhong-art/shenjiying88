// health-dashboard.service.ts - Phase-19 T35
// 用途: 健康度仪表板数据 + Grafana 导出 + 告警
// 关联: phase-19-intelligence/spec.md §Phase 4
import { Injectable } from '@nestjs/common';
import { HealthScoreService, type TenantHealthScore, type TenantHealthInput } from './health-score.service';

export interface DashboardSummary {
  totalTenants: number;
  byStatus: Record<'HEALTHY' | 'WARNING' | 'CRITICAL', number>;
  averageScore: number;
  topIssues: Array<{ issue: string; count: number }>;
  alerts: Array<{ tenantId: string; severity: string; message: string }>;
  computedAt: string;
}

export interface AlertConfig {
  warningThreshold: number;
  criticalThreshold: number;
  notifyChannels: Array<'email' | 'feishu' | 'dingtalk'>;
}

@Injectable()
export class HealthDashboardService {
  constructor(private readonly healthScore: HealthScoreService) {}

  /**
   * 生成仪表板汇总
   */
  generateSummary(inputs: TenantHealthInput[]): DashboardSummary {
    const scores = this.healthScore.computeBatch(inputs);
    const byStatus = { HEALTHY: 0, WARNING: 0, CRITICAL: 0 };
    let totalScore = 0;
    for (const s of scores) {
      byStatus[s.status]++;
      totalScore += s.score;
    }
    const averageScore = scores.length > 0 ? totalScore / scores.length : 0;

    // 汇总 top issues
    const issueCounts = new Map<string, number>();
    for (const s of scores) {
      for (const rec of s.recommendations) {
        if (rec === '健康度良好,继续保持') continue;
        // 简化:取推荐的前 10 字作为 issue key
        const key = rec.slice(0, 20);
        issueCounts.set(key, (issueCounts.get(key) ?? 0) + 1);
      }
    }
    const topIssues = Array.from(issueCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));

    // 告警:WARNING + CRITICAL
    const alerts = scores
      .filter((s) => s.status !== 'HEALTHY')
      .map((s) => ({
        tenantId: s.tenantId,
        severity: s.status,
        message: `${s.tenantId} 健康度 ${s.score} (${s.status})`,
      }));

    return {
      totalTenants: scores.length,
      byStatus,
      averageScore,
      topIssues,
      alerts,
      computedAt: new Date().toISOString(),
    };
  }

  /**
   * 告警检查
   */
  checkAlerts(input: {
    scores: TenantHealthScore[];
    config: AlertConfig;
  }): Array<{ tenantId: string; severity: string; message: string; notifyChannels: string[] }> {
    const alerts: Array<{ tenantId: string; severity: string; message: string; notifyChannels: string[] }> = [];
    for (const s of input.scores) {
      if (s.score < input.config.criticalThreshold) {
        alerts.push({
          tenantId: s.tenantId,
          severity: 'CRITICAL',
          message: `租户 ${s.tenantId} 健康度 ${s.score} < ${input.config.criticalThreshold}`,
          notifyChannels: input.config.notifyChannels,
        });
      } else if (s.score < input.config.warningThreshold) {
        alerts.push({
          tenantId: s.tenantId,
          severity: 'WARNING',
          message: `租户 ${s.tenantId} 健康度 ${s.score} < ${input.config.warningThreshold}`,
          notifyChannels: ['email'],
        });
      }
    }
    return alerts;
  }

  /**
   * Grafana 导出
   */
  toGrafana(summary: DashboardSummary): string {
    const lines: string[] = [];
    lines.push('# HELP tenant_health_score_avg Average tenant health score');
    lines.push('# TYPE tenant_health_score_avg gauge');
    lines.push(`tenant_health_score_avg ${summary.averageScore.toFixed(2)}`);

    for (const status of ['HEALTHY', 'WARNING', 'CRITICAL'] as const) {
      lines.push(`# HELP tenant_by_status_${status.toLowerCase()} Tenants by status`);
      lines.push(`# TYPE tenant_by_status_${status.toLowerCase()} gauge`);
      lines.push(`tenant_by_status_${status.toLowerCase()} ${summary.byStatus[status]}`);
    }
    return lines.join('\n');
  }
}
