/**
 * alliance-dashboard.service.ts — WP-17B 联盟看板 (BS-0227~BS-0228)
 *
 * 功能：
 *  - 联盟运营看板（收益/客户/活动）
 */
import { Injectable, Logger } from '@nestjs/common'

// ── Types ─────────────────────────────────────────────────────────────────────

/** 运营概览 */
export interface DashboardOverview {
  /** 总联盟伙伴数 */
  totalPartners: number
  /** 活跃伙伴数 */
  activePartners: number
  /** 本月新增伙伴数 */
  newPartnersThisMonth: number
  /** 总交易金额（分） */
  totalTransactionAmount: number
  /** 本月交易金额（分） */
  monthlyTransactionAmount: number
  /** 总分成金额（分） */
  totalSettlementAmount: number
  /** 本月分成金额（分） */
  monthlySettlementAmount: number
  /** 累计联盟券发放数 */
  totalCouponsIssued: number
  /** 累计客户数 */
  totalCustomers: number
  /** 今日新增客户数 */
  newCustomersToday: number
}

/** 等级分布 */
export interface GradeDistribution {
  grade: string
  label: string
  count: number
  ratio: number
}

/** 月度趋势 */
export interface MonthlyTrend {
  month: string
  transactionAmount: number
  settlementAmount: number
  customerCount: number
}

/** 活动概览 */
export interface ActivityOverview {
  totalActivities: number
  activeActivities: number
  totalParticipations: number
  conversionRate: number
}

/** 伙伴排行榜 */
export interface PartnerRanking {
  partnerId: string
  partnerName: string
  grade: string
  transactionAmount: number
  settlementAmount: number
  customerCount: number
  healthScore: number
  rank: number
}

/** 合作伙伴看板 */
export interface PartnerDashboard {
  partnerId: string
  partnerName: string
  grade: string
  totalRevenue: number
  monthlyRevenue: number
  totalSettlements: number
  monthlySettlements: number
  totalCoupons: number
  redeemedCoupons: number
  customerCount: number
  // 等级分成信息
  revenueShareRatio: number
  couponCommissionRatio: number
  // 健康度
  healthScore: number
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class AllianceDashboardService {
  private readonly logger = new Logger(AllianceDashboardService.name)

  // 模拟数据存储
  private partnerMetrics = new Map<string, {
    totalRevenue: number
    monthlyRevenue: number
    totalSettlements: number
    monthlySettlements: number
    totalCoupons: number
    redeemedCoupons: number
    customerCount: number
    healthScore: number
    grade: string
  }>()

  // 月度聚合数据
  private monthlyData = new Map<string, {
    transactionAmount: number
    settlementAmount: number
    customerCount: number
  }>()

  constructor() {
    this.initMockData()
  }

  private initMockData(): void {
    // 初始化两个演示伙伴
    this.partnerMetrics.set('partner-demo-S', {
      totalRevenue: 150000000,
      monthlyRevenue: 25000000,
      totalSettlements: 12000000,
      monthlySettlements: 2000000,
      totalCoupons: 500,
      redeemedCoupons: 320,
      customerCount: 15000,
      healthScore: 92,
      grade: 'S',
    })
    this.partnerMetrics.set('partner-demo-A', {
      totalRevenue: 80000000,
      monthlyRevenue: 15000000,
      totalSettlements: 4800000,
      monthlySettlements: 900000,
      totalCoupons: 300,
      redeemedCoupons: 180,
      customerCount: 8000,
      healthScore: 78,
      grade: 'A',
    })

    // 初始化月度数据
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = d.toISOString().slice(0, 7)
      this.monthlyData.set(month, {
        transactionAmount: 30000000 + Math.round(Math.random() * 10000000),
        settlementAmount: 2500000 + Math.round(Math.random() * 1000000),
        customerCount: 2000 + Math.round(Math.random() * 1000),
      })
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 运营概览
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 获取联盟运营概览
   */
  getOverview(activePartnerCount: number, totalPartnerCount: number, newPartnerCount: number): DashboardOverview {
    const totals = Array.from(this.partnerMetrics.values())
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7)
    const monthData = this.monthlyData.get(currentMonth)

    return {
      totalPartners: totalPartnerCount,
      activePartners: activePartnerCount,
      newPartnersThisMonth: newPartnerCount,
      totalTransactionAmount: totals.reduce((s, m) => s + m.totalRevenue, 0),
      monthlyTransactionAmount: monthData?.transactionAmount ?? 0,
      totalSettlementAmount: totals.reduce((s, m) => s + m.totalSettlements, 0),
      monthlySettlementAmount: monthData?.settlementAmount ?? 0,
      totalCouponsIssued: totals.reduce((s, m) => s + m.totalCoupons, 0),
      totalCustomers: totals.reduce((s, m) => s + m.customerCount, 0),
      newCustomersToday: Math.round(Math.random() * 100),
    }
  }

  /**
   * 获取等级分布
   */
  getGradeDistribution(gradeCounts: Map<string, number>): GradeDistribution[] {
    const total = Array.from(gradeCounts.values()).reduce((s, c) => s + c, 0)
    const labelMap: Record<string, string> = {
      S: '战略伙伴',
      A: '核心伙伴',
      B: '优质伙伴',
      C: '普通伙伴',
    }

    return Array.from(gradeCounts.entries())
      .map(([grade, count]) => ({
        grade,
        label: labelMap[grade] ?? grade,
        count,
        ratio: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }))
      .sort((a, b) => a.grade.localeCompare(b.grade))
  }

  /**
   * 获取月度趋势
   */
  getMonthlyTrend(months: number = 6): MonthlyTrend[] {
    const now = new Date()
    const result: MonthlyTrend[] = []

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = d.toISOString().slice(0, 7)
      const data = this.monthlyData.get(month)

      result.push({
        month,
        transactionAmount: data?.transactionAmount ?? 0,
        settlementAmount: data?.settlementAmount ?? 0,
        customerCount: data?.customerCount ?? 0,
      })
    }

    return result
  }

  /**
   * 获取活动概览
   */
  getActivityOverview(): ActivityOverview {
    return {
      totalActivities: 15,
      activeActivities: 8,
      totalParticipations: 2340,
      conversionRate: 12.5,
    }
  }

  /**
   * 获取伙伴排行榜
   */
  getPartnerRanking(partnerNames: Map<string, string>): PartnerRanking[] {
    const ranking = Array.from(this.partnerMetrics.entries())
      .map(([partnerId, metrics], idx) => ({
        partnerId,
        partnerName: partnerNames.get(partnerId) ?? `Partner-${partnerId}`,
        grade: metrics.grade,
        transactionAmount: metrics.totalRevenue,
        settlementAmount: metrics.totalSettlements,
        customerCount: metrics.customerCount,
        healthScore: metrics.healthScore,
        rank: idx + 1,
      }))
      .sort((a, b) => b.transactionAmount - a.transactionAmount)
      .map((item, idx) => ({ ...item, rank: idx + 1 }))

    return ranking
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 伙伴看板
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 获取伙伴看板
   */
  getPartnerDashboard(partnerId: string, partnerName: string, grade: string): PartnerDashboard {
    const metrics = this.partnerMetrics.get(partnerId)

    // Revenue share ratios by grade
    const shareRatios: Record<string, { revenue: number; coupon: number }> = {
      S: { revenue: 0.08, coupon: 0.15 },
      A: { revenue: 0.06, coupon: 0.12 },
      B: { revenue: 0.04, coupon: 0.10 },
      C: { revenue: 0.02, coupon: 0.08 },
    }
    const ratios = shareRatios[grade] ?? shareRatios.C

    return {
      partnerId,
      partnerName,
      grade,
      totalRevenue: metrics?.totalRevenue ?? 0,
      monthlyRevenue: metrics?.monthlyRevenue ?? 0,
      totalSettlements: metrics?.totalSettlements ?? 0,
      monthlySettlements: metrics?.monthlySettlements ?? 0,
      totalCoupons: metrics?.totalCoupons ?? 0,
      redeemedCoupons: metrics?.redeemedCoupons ?? 0,
      customerCount: metrics?.customerCount ?? 0,
      revenueShareRatio: ratios.revenue,
      couponCommissionRatio: ratios.coupon,
      healthScore: metrics?.healthScore ?? 0,
    }
  }

  /**
   * 更新/设置伙伴指标（测试/注入用）
   */
  setPartnerMetrics(partnerId: string, metrics: Partial<PartnerDashboard>): void {
    const existing = this.partnerMetrics.get(partnerId) ?? {
      totalRevenue: 0,
      monthlyRevenue: 0,
      totalSettlements: 0,
      monthlySettlements: 0,
      totalCoupons: 0,
      redeemedCoupons: 0,
      customerCount: 0,
      healthScore: 0,
      grade: 'C',
    }

    this.partnerMetrics.set(partnerId, {
      ...existing,
      ...(metrics.totalRevenue !== undefined ? { totalRevenue: metrics.totalRevenue } : {}),
      ...(metrics.monthlyRevenue !== undefined ? { monthlyRevenue: metrics.monthlyRevenue } : {}),
      ...(metrics.totalSettlements !== undefined ? { totalSettlements: metrics.totalSettlements } : {}),
      ...(metrics.monthlySettlements !== undefined ? { monthlySettlements: metrics.monthlySettlements } : {}),
      ...(metrics.totalCoupons !== undefined ? { totalCoupons: metrics.totalCoupons } : {}),
      ...(metrics.redeemedCoupons !== undefined ? { redeemedCoupons: metrics.redeemedCoupons } : {}),
      ...(metrics.customerCount !== undefined ? { customerCount: metrics.customerCount } : {}),
      ...(metrics.healthScore !== undefined ? { healthScore: metrics.healthScore } : {}),
      ...(metrics.grade !== undefined ? { grade: metrics.grade } : {}),
    })
  }

  /**
   * 设置月度数据（测试用）
   */
  setMonthlyData(month: string, data: { transactionAmount?: number; settlementAmount?: number; customerCount?: number }): void {
    const existing = this.monthlyData.get(month) ?? { transactionAmount: 0, settlementAmount: 0, customerCount: 0 }
    this.monthlyData.set(month, {
      ...existing,
      ...data,
    })
  }

  /**
   * 清除数据（测试用）
   */
  clearAll(): void {
    this.partnerMetrics.clear()
    this.monthlyData.clear()
  }
}
