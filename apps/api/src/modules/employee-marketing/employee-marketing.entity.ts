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
/**
 * 岗位类型（5类 · 宪法13.1对齐）
 * 一线作战岗 / 管理带动岗 / 市场内容岗 / 支持赋能岗 / 后勤保障岗
 */
export type PositionType = 'frontline' | 'management' | 'content' | 'support' | 'logistics';

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
  commissionTier: number; // 阶梯费率档位: 1=1-10单/2=11-30/3=31-100/4=101+
  createdAt: Date;
  validUntil: Date;
  usageLimit: number;
  currentUsage: number;
  isAdMarked: boolean; // 推广自带广告标识（宪法13.8）
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
  isSeamless: boolean; // 扫码无感（宪法13.8）
  customerOptedOut: boolean; // 客户是否退订此员工推广（宪法13.8）
  customerUnbindable: boolean; // 推广关系是否可解除
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
 * 任务难度等级（宪法13.3对齐）
 */
export type TaskDifficulty = 'basic' | 'intermediate' | 'advanced';

/**
 * 任务状态（宪法13.2/13.3对齐）
 */
export interface MarketingTaskV2 {
  id: string;
  title: string;
  description: string;
  points: number;
  difficulty: TaskDifficulty;
  unlockCondition?: string; // e.g. 'basic_50' | 'intermediate_30_certified'
  isReplaceable: boolean; // 可替换不擅长的任务
  deadline: Date;
  status: 'active' | 'completed' | 'expired' | 'appealed';
  assignedTo: string[];
  evidence?: string; // 完成证据(截图/链接)
  appealReason?: string; // 申诉理由
  createdAt: Date;
}

/**
 * 师徒制2.0关系（宪法13.6对齐）
 */
export interface MentorRelation {
  id: string;
  apprenticeId: string;
  mentorId: string;
  startDate: Date;
  status: 'active' | 'completed';
  coachingScore: number; // 辅导成绩，纳入KPI辅助指标
}

/**
 * 成就徽章（宪法13.5对齐）
 */
export interface AchievementBadge {
  id: string;
  employeeId: string;
  badgeId: string;
  badgeName: string;
  earnedAt: Date;
}

/**
 * 巅峰休息期状态（宪法13.5对齐）
 */
export interface PeakRestPeriod {
  employeeId: string;
  consecutiveGoldMonths: number; // 连续金牌月数
  kpiReductionPercent: number; // KPI降幅(>=3月金牌则20%)
  isActive: boolean;
}

/**
 * 将士圈分享（宪法13.7·战友圈→将士圈）
 */
export interface CirclePost {
  id: string;
  employeeId: string;
  content: string;
  tips: string;
  likes: number;
  createdAt: Date;
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
  bonusPoolAmount: number; // 奖金池分配额（宪法13.5·增量利润5%）
  guaranteedBonus: boolean; // 是否保底奖金
  createdAt: Date;
}

/**
 * 营销任务（已由MarketingTaskV2替代）
 */
export interface MarketingTask extends MarketingTaskV2 {
  // 保持向后兼容
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
// ═══════════════════════════════════════════════════════════════
// KOL体系（WP-11增强·扩展宪法13章至KOL场景）
// ═══════════════════════════════════════════════════════════════

/**
 * KOL等级
 */
export type KolLevel = 'S' | 'A' | 'B' | 'C';

/**
 * KOL注册信息
 */
export interface KolProfile {
  id: string;
  name: string;
  level: KolLevel;
  followerCount: number;
  platforms: string[];
  status: 'pending' | 'approved' | 'rejected';
  commissionRate: number;
  totalRevenue: number;
  totalCommission: number;
  roc: number; // Return on Commission
  createdAt: Date;
}
