/**
 * alliance-tier.service.ts — WP-17B 分级联盟增强 (BS-0218~BS-0219)
 *
 * 功能：
 *  - 联盟合作伙伴分级（战略/核心/普通），对应 S/A/B/C
 *  - 不同级别不同分成比例
 *  - 各等级权益配置
 */
import { Injectable, Logger } from '@nestjs/common'
import type { Grade } from './alliance-grade.service'

// ── Types ─────────────────────────────────────────────────────────────────────

/** 等级名称映射 */
export const GRADE_LABELS: Record<Grade, string> = {
  S: '战略伙伴',
  A: '核心伙伴',
  B: '优质伙伴',
  C: '普通伙伴',
}

/** 等级分成配置 */
export interface TierShareConfig {
  grade: Grade
  label: string
  /** 订单分成比例（0~1） */
  revenueShareRatio: number
  /** 联盟券推广佣金比例（0~1） */
  couponCommissionRatio: number
  /** 月最低结算门槛（分） */
  minSettlementThreshold: number
  /** 等级权益列表 */
  benefits: string[]
}

/** 等级变更记录 */
export interface TierChangeRecord {
  partnerId: string
  fromGrade: Grade | null
  toGrade: Grade
  reason: string
  changedAt: string
}

// ── Default Configs ───────────────────────────────────────────────────────────

const DEFAULT_TIER_CONFIGS: TierShareConfig[] = [
  {
    grade: 'S',
    label: '战略伙伴',
    revenueShareRatio: 0.08,
    couponCommissionRatio: 0.15,
    minSettlementThreshold: 0,
    benefits: ['优先结算', '专属运营支持', '联合品牌推广', '数据共享'],
  },
  {
    grade: 'A',
    label: '核心伙伴',
    revenueShareRatio: 0.06,
    couponCommissionRatio: 0.12,
    minSettlementThreshold: 10000,
    benefits: ['快速结算', '运营支持', '联合营销'],
  },
  {
    grade: 'B',
    label: '优质伙伴',
    revenueShareRatio: 0.04,
    couponCommissionRatio: 0.10,
    minSettlementThreshold: 50000,
    benefits: ['标准结算', '基础运营支持'],
  },
  {
    grade: 'C',
    label: '普通伙伴',
    revenueShareRatio: 0.02,
    couponCommissionRatio: 0.08,
    minSettlementThreshold: 100000,
    benefits: ['基础结算'],
  },
]

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class AllianceTierService {
  private readonly logger = new Logger(AllianceTierService.name)

  /** 可覆盖的分成配置 */
  private overrides = new Map<Grade, Partial<TierShareConfig>>()

  /** 等级变更历史 */
  private changeHistory = new Map<string, TierChangeRecord[]>()

  /**
   * 获取指定等级的分成配置（含覆盖）
   */
  getTierConfig(grade: Grade): TierShareConfig {
    const defaults = DEFAULT_TIER_CONFIGS.find((c) => c.grade === grade)
    if (!defaults) {
      // fallback to C
      return DEFAULT_TIER_CONFIGS[DEFAULT_TIER_CONFIGS.length - 1]
    }
    const override = this.overrides.get(grade)
    if (override) {
      return { ...defaults, ...override }
    }
    return { ...defaults }
  }

  /**
   * 获取所有等级的默认分成配置
   */
  getDefaultTierConfigs(): TierShareConfig[] {
    return DEFAULT_TIER_CONFIGS.map((c) => ({ ...c }))
  }

  /**
   * 获取所有等级的当前配置（含覆盖）
   */
  getAllTierConfigs(): TierShareConfig[] {
    return DEFAULT_TIER_CONFIGS.map((c) => {
      const override = this.overrides.get(c.grade)
      return override ? { ...c, ...override } : { ...c }
    })
  }

  /**
   * 覆盖指定等级的分成配置
   */
  setTierConfig(grade: Grade, config: Partial<TierShareConfig>): TierShareConfig {
    this.overrides.set(grade, { ...this.overrides.get(grade), ...config })
    this.logger.log(`Tier config updated for ${grade}: ${JSON.stringify(config)}`)
    return this.getTierConfig(grade)
  }

  /**
   * 重置指定等级到默认配置
   */
  resetTierConfig(grade: Grade): TierShareConfig {
    this.overrides.delete(grade)
    this.logger.log(`Tier config reset for ${grade}`)
    return this.getTierConfig(grade)
  }

  /**
   * 计算指定等级的订单分成金额
   * @param grade 伙伴等级
   * @param orderAmount 订单金额（分）
   * @returns 分成金额（分）
   */
  calculateRevenueShare(grade: Grade, orderAmount: number): number {
    const config = this.getTierConfig(grade)
    return Math.round(orderAmount * config.revenueShareRatio)
  }

  /**
   * 计算指定等级的券佣金
   * @param grade 伙伴等级
   * @param couponDiscount 优惠券面额（分）
   * @returns 佣金金额（分）
   */
  calculateCouponCommission(grade: Grade, couponDiscount: number): number {
    const config = this.getTierConfig(grade)
    return Math.round(couponDiscount * config.couponCommissionRatio)
  }

  /**
   * 获取等级名称
   */
  getGradeLabel(grade: Grade): string {
    return GRADE_LABELS[grade] ?? '未知等级'
  }

  /**
   * 记录等级变更
   */
  recordGradeChange(partnerId: string, fromGrade: Grade | null, toGrade: Grade, reason: string): TierChangeRecord {
    const record: TierChangeRecord = {
      partnerId,
      fromGrade,
      toGrade,
      reason,
      changedAt: new Date().toISOString(),
    }
    const history = this.changeHistory.get(partnerId) ?? []
    history.push(record)
    this.changeHistory.set(partnerId, history)
    this.logger.log(`Grade change recorded: ${partnerId} ${fromGrade ?? 'NONE'} -> ${toGrade} reason=${reason}`)
    return record
  }

  /**
   * 获取等级变更历史
   */
  getGradeChangeHistory(partnerId: string): TierChangeRecord[] {
    return this.changeHistory.get(partnerId) ?? []
  }

  /**
   * 清除所有配置覆盖（测试用）
   */
  clearOverrides(): void {
    this.overrides.clear()
  }
}
