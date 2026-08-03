// health-dashboard.controller.ts - Phase-19 T35
// 用途: 健康度仪表板 REST API

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'

import { HealthScoreService } from './health-score.service';
import { HealthDashboardService } from './health-dashboard.service';
import { EvaluateHealthDto, AlertConfigDto, GrafanaQueryDto, TenantHealthInputDto } from './health-dashboard.dto';
import type { TenantHealthInput } from './health-dashboard.entity';

@UseGuards(TenantGuard)
@Controller('health-dashboard')
export class HealthDashboardController {
  constructor(
    private readonly healthScoreService: HealthScoreService,
    private readonly dashboardService: HealthDashboardService,
  ) {}

  /**
   * POST /health-dashboard/evaluate
   * 批量评估租户健康度
   */
  @Post('evaluate')
  evaluate(@Body() dto: EvaluateHealthDto) {
    const inputs: TenantHealthInput[] = dto.tenants.map(toTenantInput);
    return this.healthScoreService.computeBatch(inputs);
  }

  /**
   * GET /health-dashboard/summary
   * 生成仪表板汇总
   */
  @Get('summary')
  generateSummary(@Query() _query: GrafanaQueryDto) {
    // 生产环境应从数据库读取租户输入，这里简化处理
    const inputs: TenantHealthInput[] = /* c8 ignore next */ [];
    return this.dashboardService.generateSummary(inputs);
  }

  /**
   * POST /health-dashboard/alerts
   * 告警检查
   */
  @Post('alerts')
  checkAlerts(
    @Body() body: { scores: TenantHealthInputDto[]; config: AlertConfigDto },
  ) {
    const scores = body.scores.map(toTenantInput).map((i) =>
      this.healthScoreService.compute(i),
    );
    return this.dashboardService.checkAlerts({
      scores,
      config: {
        warningThreshold: body.config.warningThreshold,
        criticalThreshold: body.config.criticalThreshold,
        notifyChannels: body.config.notifyChannels as Array<'email' | 'feishu' | 'dingtalk'>,
      },
    });
  }

  /**
   * GET /health-dashboard/metrics
   * Grafana 指标导出
   */
  @Get('metrics')
  getMetrics() {
    // 简化:返回空仪表板指标
    return this.dashboardService.toGrafana({
      totalTenants: 0,
      byStatus: { HEALTHY: 0, WARNING: 0, CRITICAL: 0 },
      averageScore: 0,
      topIssues: [],
      alerts: [],
      computedAt: new Date().toISOString(),
    });
  }
}

function toTenantInput(dto: TenantHealthInputDto): TenantHealthInput {
  return {
    tenantId: dto.tenantId,
    p95Ms: dto.p95Ms,
    errorRate: dto.errorRate,
    quotaUsagePercent: dto.quotaUsagePercent,
    championActivityScore: dto.championActivityScore,
    anomalyCount30d: dto.anomalyCount30d,
  };
}
