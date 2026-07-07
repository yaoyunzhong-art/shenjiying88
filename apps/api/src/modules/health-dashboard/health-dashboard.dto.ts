// health-dashboard.dto.ts - Phase-19 T35
// 用途: 健康度仪表板请求/响应 DTO
import { IsOptional, IsNumber, IsArray, IsString, Min, Max } from 'class-validator';

export class EvaluateHealthDto {
  @IsArray()
  tenants!: TenantHealthInputDto[];
}

export class TenantHealthInputDto {
  @IsString()
  tenantId!: string;

  @IsNumber()
  @Min(0)
  p95Ms!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  errorRate!: number;

  @IsNumber()
  @Min(0)
  quotaUsagePercent!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  championActivityScore!: number;

  @IsNumber()
  @Min(0)
  anomalyCount30d!: number;
}

export class AlertConfigDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  warningThreshold!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  criticalThreshold!: number;

  @IsArray()
  @IsString({ each: true })
  notifyChannels!: string[];
}

export class GrafanaQueryDto {
  @IsOptional()
  @IsArray()
  tenantIds?: string[];
}

export class HealthDashboardResponseDto {
  summary!: {
    totalTenants: number;
    byStatus: Record<string, number>;
    averageScore: number;
    topIssues: Array<{ issue: string; count: number }>;
    alerts: Array<{ tenantId: string; severity: string; message: string }>;
    computedAt: string;
  };
}
