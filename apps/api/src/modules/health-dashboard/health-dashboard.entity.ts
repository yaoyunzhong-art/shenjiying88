// health-dashboard.entity.ts - Phase-19 T35
// 用途: 健康度仪表板实体类型
import { HealthScoreService, type TenantHealthInput, type TenantHealthScore } from './health-score.service';
import { HealthDashboardService, type DashboardSummary, type AlertConfig } from './health-dashboard.service';

export type {
  TenantHealthInput,
  TenantHealthScore,
  DashboardSummary,
  AlertConfig,
};

export { HealthScoreService, HealthDashboardService };
