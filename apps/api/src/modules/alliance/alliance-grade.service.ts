/**
 * alliance-grade.service.ts - T112-1 Alliance 20 伙伴 + S/A/B/C 分级 + 健康度预警
 * 用途: 异业联盟伙伴管理、伙伴分级（S/A/B/C）、健康度评分与低效预警
 * 关联: P1-10 联盟分级 / P2-2 低效伙伴预警
 */
import { Injectable, Logger } from '@nestjs/common';

// ── Types ─────────────────────────────────────────────────────────────────────

export type BusinessType = 'RETAIL' | 'F&B' | 'SERVICE' | 'TECH' | 'OTHER';
export type PartnerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type Grade = 'S' | 'A' | 'B' | 'C';

export interface PartnerInfo {
  name: string;
  businessType: BusinessType;
  contact: string;
  address: string;
}

export interface AlliancePartner {
  id: string;
  name: string;
  businessType: BusinessType;
  contact: string;
  address: string;
  status: PartnerStatus;
  currentGrade: Grade | null;
  healthScore: number | null;
  registeredAt: string;
  updatedAt: string;
}

export interface HealthFactors {
  revenueScore: number;      // 营收得分 (0-100)
  orderScore: number;        // 订单数得分 (0-100)
  complaintScore: number;    // 投诉率得分 (0-100, 投诉越少越高)
  activityScore: number;     // 活跃度得分 (0-100)
  overall: number;            // 综合健康度 (0-100)
}

export interface HealthTrend {
  date: string;
  score: number;
}

export type SettlementType = 'SPLIT' | 'FIXED' | 'PERCENTAGE';
export interface SettlementParticipant {
  partnerId: string;
  share: number;
}
export interface AnomalyRecord {
  id: string;
  partnerId: string;
  type: 'SCORE_DROP' | 'ACTIVITY_DECLINE' | 'COMPLAINT_SURGE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  detectedAt: string;
}
export interface AnomalyReport {
  anomalies: AnomalyRecord[];
  summary: string;
  totalScore: number;
}

export interface GradeCriteria {
  grade: Grade;
  minScore: number;
  maxScore: number;
  label: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GRADE_CRITERIA: GradeCriteria[] = [
  { grade: 'S', minScore: 90, maxScore: 100, label: '金牌伙伴' },
  { grade: 'A', minScore: 75, maxScore: 89,  label: '优质伙伴' },
  { grade: 'B', minScore: 60, maxScore: 74,  label: '普通伙伴' },
  { grade: 'C', minScore: 0,  maxScore: 59,  label: '待改进伙伴' },
];

const UPGRADE_MONTHS = 3;   // 连续达标月数触发自动升级
const DOWNGRADE_MONTHS = 2; // 连续不达标月数触发自动降级 (P2-2)

const HEALTH_THRESHOLD_WARNING = 40; // 健康度预警阈值 (P2-2)

// ── AlliancePartner ───────────────────────────────────────────────────────────

@Injectable()
export class AlliancePartner {
  private readonly logger = new Logger(AlliancePartner.name);
  private readonly partners = new Map<string, AlliancePartner>();

  register(partnerInfo: PartnerInfo): AlliancePartner {
    const existing = Array.from(this.partners.values()).find(
      (p) => p.name === partnerInfo.name,
    );
    if (existing) {
      throw new Error(`Partner with name "${partnerInfo.name}" already exists`);
    }

    const id = `partner-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const partner = {
      id,
      name: partnerInfo.name,
      businessType: partnerInfo.businessType,
      contact: partnerInfo.contact,
      address: partnerInfo.address,
      status: 'ACTIVE' as const,
      currentGrade: null,
      healthScore: null,
      registeredAt: now,
      updatedAt: now,
    };
    this.partners.set(id, partner as AlliancePartner);
    this.logger.log(`[AlliancePartner] Registered: ${partner.name} (${id})`);
    return partner as AlliancePartner;
  }

  updatePartner(partnerId: string, info: Partial<PartnerInfo>): AlliancePartner {
    const partner = this.partners.get(partnerId);
    if (!partner) throw new Error(`Partner not found: ${partnerId}`);

    const updated = {
      ...partner,
      ...info,
      id: partner.id,
      updatedAt: new Date().toISOString(),
    };
    this.partners.set(partnerId, updated as AlliancePartner);
    this.logger.log(`[AlliancePartner] Updated: ${partner.name} (${partnerId})`);
    return updated as AlliancePartner;
  }

  /** 退出/停用伙伴（入驻退出机制核心入口）*/
  deactivatePartner(partnerId: string, reason?: string): AlliancePartner {
    const partner = this.partners.get(partnerId);
    if (!partner) throw new Error(`Partner not found: ${partnerId}`);
    if (partner.status === 'INACTIVE') {
      throw new Error(`Partner ${partnerId} is already inactive`);
    }
    const updated = {
      ...partner,
      status: 'INACTIVE' as const,
      updatedAt: new Date().toISOString(),
    };
    this.partners.set(partnerId, updated as AlliancePartner);
    this.logger.log(`[AlliancePartner] Deactivated: ${partner.name} (${partnerId})${reason ? ' reason=' + reason : ''}`);
    return updated as AlliancePartner;
  }

  /** 重新启用伙伴 */
  reactivatePartner(partnerId: string): AlliancePartner {
    const partner = this.partners.get(partnerId);
    if (!partner) throw new Error(`Partner not found: ${partnerId}`);
    if (partner.status === 'ACTIVE') {
      throw new Error(`Partner ${partnerId} is already active`);
    }
    const updated = {
      ...partner,
      status: 'ACTIVE' as const,
      updatedAt: new Date().toISOString(),
    };
    this.partners.set(partnerId, updated as AlliancePartner);
    this.logger.log(`[AlliancePartner] Reactivated: ${partner.name} (${partnerId})`);
    return updated as AlliancePartner;
  }

  getPartner(partnerId: string): AlliancePartner | undefined {
    return this.partners.get(partnerId);
  }

  listPartners(filter?: {
    businessType?: BusinessType;
    status?: PartnerStatus;
    grade?: Grade;
  }): AlliancePartner[] {
    let all = Array.from(this.partners.values());
    if (filter?.businessType) {
      all = all.filter((p) => p.businessType === filter.businessType);
    }
    if (filter?.status) {
      all = all.filter((p) => p.status === filter.status);
    }
    if (filter?.grade) {
      all = all.filter((p) => p.currentGrade === filter.grade);
    }
    return all;
  }
}

// ── PartnerGradingService ─────────────────────────────────────────────────────

interface GradingHistory {
  partnerId: string;
  records: Array<{ month: string; grade: Grade; score: number }>;
}

@Injectable()
export class PartnerGradingService {
  private readonly logger = new Logger(PartnerGradingService.name);
  private readonly history = new Map<string, GradingHistory>();

  calculateGrade(partnerId: string): Grade {
    const grade = this.scoreToGrade(this.getCurrentScore(partnerId));
    this.logger.log(`[PartnerGrading] Calculated grade ${grade} for ${partnerId}`);
    return grade;
  }

  assignGrade(partnerId: string, grade: Grade): void {
    this.ensureHistory(partnerId);
    const history = this.history.get(partnerId)!;
    const month = this.getCurrentMonth();
    const existingIdx = history.records.findIndex((r) => r.month === month);
    const score = this.gradeToScore(grade);

    if (existingIdx >= 0) {
      history.records[existingIdx] = { month, grade, score };
    } else {
      history.records.push({ month, grade, score });
    }
    this.logger.log(`[PartnerGrading] Assigned grade ${grade} to ${partnerId}`);
  }

  getGrade(partnerId: string): Grade | null {
    this.ensureHistory(partnerId);
    const history = this.history.get(partnerId)!;
    if (history.records.length === 0) return null;
    return history.records[history.records.length - 1].grade;
  }

  getGradeCriteria(): GradeCriteria[] {
    return [...GRADE_CRITERIA];
  }

  autoUpgrade(partnerId: string): boolean {
    this.ensureHistory(partnerId);
    const history = this.history.get(partnerId)!;
    const currentGrade = this.getGrade(partnerId);
    if (!currentGrade) return false;

    const currentIdx = GRADE_CRITERIA.findIndex((c) => c.grade === currentGrade);
    if (currentIdx >= GRADE_CRITERIA.length - 1) return false; // 已达 S 级

    const targetGrade = GRADE_CRITERIA[currentIdx - 1]?.grade;
    if (!targetGrade) return false;

    const targetScore = this.gradeToScore(targetGrade);
    const lastNMonths = this.getLastNMonths(UPGRADE_MONTHS);
    const relevant = history.records.filter((r) => lastNMonths.includes(r.month));

    if (relevant.length < UPGRADE_MONTHS) return false;
    const allMet = relevant.every((r) => r.score >= targetScore);

    if (allMet) {
      this.assignGrade(partnerId, targetGrade);
      this.logger.log(
        `[PartnerGrading] Auto-upgraded ${partnerId} to ${targetGrade} after ${UPGRADE_MONTHS} months`,
      );
      return true;
    }
    return false;
  }

  autoDowngrade(partnerId: string): boolean {
    this.ensureHistory(partnerId);
    const history = this.history.get(partnerId)!;
    const currentGrade = this.getGrade(partnerId);
    if (!currentGrade) return false;

    const currentIdx = GRADE_CRITERIA.findIndex((c) => c.grade === currentGrade);
    if (currentIdx >= GRADE_CRITERIA.length - 1) return false; // 已达 C 级

    const targetGrade = GRADE_CRITERIA[currentIdx + 1]?.grade;
    if (!targetGrade) return false;

    const targetScore = this.gradeToScore(targetGrade);
    const lastNMonths = this.getLastNMonths(DOWNGRADE_MONTHS);
    const relevant = history.records.filter((r) => lastNMonths.includes(r.month));

    if (relevant.length < DOWNGRADE_MONTHS) return false;
    const allBelow = relevant.every((r) => r.score < targetScore);

    if (allBelow) {
      this.assignGrade(partnerId, targetGrade);
      this.logger.log(
        `[PartnerGrading] Auto-downgraded ${partnerId} to ${targetGrade} (P2-2 low-efficiency)`,
      );
      return true;
    }
    return false;
  }

  // ── Internal helpers ────────────────────────────────────────────────────────

  private getCurrentScore(partnerId: string): number {
    // 模拟评分：实际应从外部数据源获取
    // 这里基于 history 中的最近记录估算
    this.ensureHistory(partnerId);
    const history = this.history.get(partnerId)!;
    if (history.records.length === 0) return 50;
    return history.records[history.records.length - 1].score;
  }

  private ensureHistory(partnerId: string): void {
    if (!this.history.has(partnerId)) {
      this.history.set(partnerId, { partnerId, records: [] });
    }
  }

  private scoreToGrade(score: number): Grade {
    const criteria = GRADE_CRITERIA.find(
      (c) => score >= c.minScore && score <= c.maxScore,
    );
    return criteria?.grade ?? 'C';
  }

  private gradeToScore(grade: Grade): number {
    const criteria = GRADE_CRITERIA.find((c) => c.grade === grade);
    return criteria?.minScore ?? 0;
  }

  private getCurrentMonth(): string {
    return new Date().toISOString().slice(0, 7); // YYYY-MM
  }

  private getLastNMonths(n: number): string[] {
    const months: string[] = [];
    const now = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7));
    }
    return months;
  }
}

// ── HealthScoreService ────────────────────────────────────────────────────────

interface PartnerMetrics {
  partnerId: string;
  revenue: number;       // 月营收 (元)
  orderCount: number;    // 月订单数
  complaintCount: number; // 投诉次数
  activeDays: number;    // 活跃天数 (本月)
}

interface HealthAlert {
  partnerId: string;
  partnerName: string;
  healthScore: number;
  threshold: number;
  triggeredAt: string;
  reason: string;
}

@Injectable()
export class HealthScoreService {
  private readonly logger = new Logger(HealthScoreService.name);
  private readonly metrics = new Map<string, PartnerMetrics>();
  private readonly alerts: HealthAlert[] = [];

  calculateHealthScore(partnerId: string): number {
    const m = this.metrics.get(partnerId);
    if (!m) {
      // 无数据时返回默认健康度
      return 50;
    }

    const revenueScore = this.calcRevenueScore(m.revenue);
    const orderScore = this.calcOrderScore(m.orderCount);
    const complaintScore = this.calcComplaintScore(m.complaintCount, m.orderCount);
    const activityScore = this.calcActivityScore(m.activeDays);

    const overall = Math.round(
      revenueScore * 0.35 +
      orderScore * 0.25 +
      complaintScore * 0.25 +
      activityScore * 0.15,
    );

    this.logger.log(
      `[HealthScore] ${partnerId}: rev=${revenueScore} ord=${orderScore} comp=${complaintScore} act=${activityScore} => ${overall}`,
    );
    return overall;
  }

  getHealthTrend(partnerId: string, days: number): HealthTrend[] {
    // 简化实现：返回模拟趋势数据
    const trend: HealthTrend[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      trend.push({
        date: d.toISOString().slice(0, 10),
        score: 50 + Math.round((Math.random() - 0.5) * 30),
      });
    }
    return trend;
  }

  alertIfLow(partnerId: string, threshold: number = HEALTH_THRESHOLD_WARNING): HealthAlert | null {
    const score = this.calculateHealthScore(partnerId);
    if (score >= threshold) return null;

    const existing = this.alerts.find(
      (a) => a.partnerId === partnerId && a.threshold === threshold,
    );
    if (existing) return existing;

    const alert: HealthAlert = {
      partnerId,
      partnerName: `Partner-${partnerId}`,
      healthScore: score,
      threshold,
      triggeredAt: new Date().toISOString(),
      reason: `健康度 ${score} 低于阈值 ${threshold}，触发低效伙伴预警 (P2-2)`,
    };
    this.alerts.push(alert);
    this.logger.warn(`[HealthAlert] P2-2预警触发: ${alert.reason}`);
    return alert;
  }

  getHealthFactors(partnerId: string): HealthFactors {
    const m = this.metrics.get(partnerId);
    if (!m) {
      return {
        revenueScore: 50,
        orderScore: 50,
        complaintScore: 50,
        activityScore: 50,
        overall: 50,
      };
    }

    const revenueScore = this.calcRevenueScore(m.revenue);
    const orderScore = this.calcOrderScore(m.orderCount);
    const complaintScore = this.calcComplaintScore(m.complaintCount, m.orderCount);
    const activityScore = this.calcActivityScore(m.activeDays);
    const overall = Math.round(
      revenueScore * 0.35 +
      orderScore * 0.25 +
      complaintScore * 0.25 +
      activityScore * 0.15,
    );

    return { revenueScore, orderScore, complaintScore, activityScore, overall };
  }

  // 供测试注入指标数据
  setMetrics(partnerId: string, metrics: Partial<PartnerMetrics>): void {
    const existing = this.metrics.get(partnerId) ?? {
      partnerId,
      revenue: 0,
      orderCount: 0,
      complaintCount: 0,
      activeDays: 0,
    };
    this.metrics.set(partnerId, { ...existing, ...metrics });
  }

  clearAlerts(): void {
    this.alerts.length = 0;
  }

  // ── Private scoring helpers ─────────────────────────────────────────────────

  /** 营收评分：基准 10 万，线性增长到 100 分 */
  private calcRevenueScore(revenue: number): number {
    const base = 100000; // 10 万基准
    return Math.min(100, Math.round((revenue / base) * 100));
  }

  /** 订单数评分：基准 500 单 */
  private calcOrderScore(orderCount: number): number {
    const base = 500;
    return Math.min(100, Math.round((orderCount / base) * 100));
  }

  /** 投诉率评分：无投诉 100，投诉率越高越低 */
  private calcComplaintScore(complaintCount: number, orderCount: number): number {
    if (orderCount === 0) return 50;
    const rate = complaintCount / orderCount;
    return Math.max(0, Math.round(100 - rate * 1000));
  }

  /** 活跃度评分：满勤 30 天为基准 */
  private calcActivityScore(activeDays: number): number {
    const base = 30;
    return Math.min(100, Math.round((activeDays / base) * 100));
  }
}
