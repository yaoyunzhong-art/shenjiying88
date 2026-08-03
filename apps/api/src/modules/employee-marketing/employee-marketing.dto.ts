// employee-marketing.dto.ts · WP-11 全员营销与绩效
// 日期: 2026-07-23
// 状态: IMPLEMENTED · 推广码/KPI/排行榜/任务/违规检测 DTO

import type {
  PromoCodeType,
  PositionType,
  KpiPeriod,
  RiskLevel,
  TaskStatus,
} from './employee-marketing.entity';

// ─── 推广码 ─────────────────────────────────────────────

export class CreatePromoCodeDto {
  employeeId!: string;
  code!: string;
  type!: PromoCodeType;
  commissionRate!: number;
  validUntil!: string; // ISO date
  usageLimit!: number;
}

export class PromoCodeResponseDto {
  id!: string;
  employeeId!: string;
  code!: string;
  type!: PromoCodeType;
  commissionRate!: number;
  validUntil!: string;
  usageLimit!: number;
  currentUsage!: number;
}

export class ListPromoCodesQueryDto {
  employeeId?: string;
}

// ─── 推广追踪 ───────────────────────────────────────────

export class TrackPromotionDto {
  promoCodeId!: string;
  customerId?: string;
  orderId?: string;
  referredUserId?: string;
  commission!: number;
  note?: string;
}

export class PromoTrackingResponseDto {
  id!: string;
  promoCodeId!: string;
  customerId?: string;
  orderId?: string;
  referredUserId?: string;
  commission!: number;
  status!: string;
  createdAt!: string;
  confirmedAt?: string;
  note?: string;
}

// ─── KPI ────────────────────────────────────────────────

export class CreateKpiConfigDto {
  positionType!: PositionType;
  metricName!: string;
  target!: number;
  weight!: number;
  unit!: string;
  period!: KpiPeriod;
}

export class KpiConfigResponseDto {
  id!: string;
  positionType!: PositionType;
  metricName!: string;
  target!: number;
  weight!: number;
  unit!: string;
  period!: KpiPeriod;
}

export class SubmitKpiResultDto {
  employeeId!: string;
  period!: string; // YYYY-MM
  scores!: Record<string, number>;
}

export class KpiResultResponseDto {
  id!: string;
  employeeId!: string;
  period!: string;
  scores!: Record<string, number>;
  totalScore!: number;
  bonusAmount!: number;
  createdAt!: string;
}

// ─── 排行榜 ─────────────────────────────────────────────

export class LeaderboardEntryResponseDto {
  employeeId!: string;
  totalConversions!: number;
  totalCommission!: number;
  rank!: number;
}

export class LeaderboardResponseDto {
  entries!: LeaderboardEntryResponseDto[];
  updatedAt!: string;
}

// ─── 任务 ───────────────────────────────────────────────

export class CreateTaskDto {
  title!: string;
  description!: string;
  points!: number;
  deadline!: string; // ISO date
  assignedTo!: string[];
}

export class TaskResponseDto {
  id!: string;
  title!: string;
  description!: string;
  points!: number;
  deadline!: string;
  status!: TaskStatus;
  assignedTo!: string[];
  createdAt!: string;
}

// ─── 违规检测 ───────────────────────────────────────────

export class ComplianceCheckResponseDto {
  riskLevel!: RiskLevel;
  suspiciousItems!: string[];
  score!: number;
}

// ─── 统计 ───────────────────────────────────────────────

export class EmployeePromoStatsResponseDto {
  employeeId!: string;
  totalPromoCodes!: number;
  totalClicks!: number;
  totalConversions!: number;
  totalCommission!: number;
  confirmedCommission!: number;
  conversionRate!: number;
  rank?: number;
}
