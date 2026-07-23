// employee-marketing.entity.ts · WP-11 全员营销与绩效
// 日期: 2026-07-23
// 状态: IMPLEMENTED · 推广码/KPI配置/绩效结果/营销任务

/**
 * 推广码类型
 */
export type PromoCodeType = 'coupon' | 'discount' | 'ticket';

/**
 * 推广追踪状态
 */
export type PromoTrackingStatus = 'pending' | 'confirmed' | 'cancelled';

/**
 * 岗位类型（7类）
 */
export type PositionType = '收银' | '销售' | '运营' | '管理' | '清洁' | '安保' | '客服';

/**
 * KPI 周期
 */
export type KpiPeriod = 'daily' | 'weekly' | 'monthly';

/**
 * 风险等级
 */
export type RiskLevel = 'high' | 'medium' | 'low';

/**
 * 营销任务状态
 */
export type TaskStatus = 'active' | 'completed' | 'expired';

/**
 * 推广码
 */
export interface PromoCode {
  id: string;
  employeeId: string;
  code: string;
  type: PromoCodeType;
  commissionRate: number;
  createdAt: Date;
  validUntil: Date;
  usageLimit: number;
  currentUsage: number;
}

/**
 * 推广追踪
 */
export interface PromoTracking {
  id: string;
  promoCodeId: string;
  customerId?: string;
  orderId?: string;
  referredUserId?: string;
  commission: number;
  status: PromoTrackingStatus;
  createdAt: Date;
  confirmedAt?: Date;
  note?: string;
}

/**
 * KPI 配置（7 类岗位）
 */
export interface KpiConfig {
  id: string;
  positionType: PositionType;
  metricName: string;
  target: number;
  weight: number; // 0~1
  unit: string;
  period: KpiPeriod;
}

/**
 * 绩效结果
 */
export interface KpiResult {
  id: string;
  employeeId: string;
  period: string; // YYYY-MM
  scores: Record<string, number>;
  totalScore: number;
  bonusAmount: number;
  createdAt: Date;
}

/**
 * 营销任务
 */
export interface MarketingTask {
  id: string;
  title: string;
  description: string;
  points: number;
  deadline: Date;
  status: TaskStatus;
  assignedTo: string[];
  createdAt: Date;
}

/**
 * 推广统计
 */
export interface EmployeePromoStats {
  employeeId: string;
  totalPromoCodes: number;
  totalClicks: number;
  totalConversions: number;
  totalCommission: number;
  confirmedCommission: number;
  conversionRate: number;
  rank?: number;
}

/**
 * 违规检测结果
 */
export interface ComplianceCheckResult {
  riskLevel: RiskLevel;
  suspiciousItems: string[];
  score: number; // 0~100
}

/**
 * 推广排行榜条目
 */
export interface LeaderboardEntry {
  employeeId: string;
  totalConversions: number;
  totalCommission: number;
  rank: number;
}
