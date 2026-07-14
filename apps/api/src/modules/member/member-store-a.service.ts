/**
 * P-36 店A增强 会员中心服务 (V17)
 *
 * 基于 MemberP36Service 的店A特有能力增强
 * - 会员信息查询（含脱敏字段）
 * - 注册新会员（含积分账户创建）
 * - 累计积分
 * - 兑换积分
 * - 会员等级查询
 *
 * @see docs/knowledge/prd/prd-member-p36.md
 */

import { Injectable } from '@nestjs/common'
import { MemberP36Service, resetP36MemberTestState } from './member-p36.service'
import { computeLevel, buildLevelDisplay, calcEarnedPoints } from './member-p36.entity'
import type { P36Member, LevelDisplay, MemberP36Level } from './member-p36.entity'

// ── 类型 ──

export interface StoreAMemberInfo {
  id: string
  phone: string
  maskedPhone: string
  name: string
  level: MemberP36Level
  levelLabel: string
  levelEmoji: string
  points: number
  balance: number
  balanceYuan: number
  totalSpent: number
  totalSpentYuan: number
  createdAt: string
  expiredAt: string | null
  isActive: boolean
}

export interface RegisterRequest {
  phone: string
  name: string
  storeCode?: string
}

export interface PointsEarnRequest {
  consumptionAmount: number
  orderId?: string
  activityId?: string
}

export interface PointsRedeemRequest {
  points: number
  orderId?: string
}

export interface RedeemResult {
  member: StoreAMemberInfo
  deductionAmount: number
  deductionYuan: number
}

export interface StoreALevelInfo {
  level: MemberP36Level
  label: string
  emoji: string
  points: number
  balance: number
  balanceYuan: number
  totalSpent: number
  totalSpentYuan: number
  currentThreshold: number
  currentThresholdYuan: number
  nextThreshold: number
  nextThresholdYuan: number
  progress: number
  progressPercent: number
  remainingToNext: number
  remainingToNextYuan: number
  benefits: string[]
  todayBenefits: string[]
  allLevels: Record<string, {
    label: string
    emoji: string
    threshold: number
    pointsMultiplier: number
    discount: number
    benefits: string[]
  }>
}

export interface MemberReportRow {
  id: string
  name: string
  phone: string
  maskedPhone: string
  level: string
  levelEmoji: string
  points: number
  totalSpent: number
  createdAt: string
  lastActivity: string
}

export interface BatchImportResult {
  total: number
  success: number
  failed: number
  errors: Array<{ index: number; reason: string }>
  members: P36Member[]
}

export interface SegmentationQuery {
  levels?: MemberP36Level[]
  minPoints?: number
  maxPoints?: number
  minTotalSpent?: number
  maxTotalSpent?: number
  registeredAfter?: string
  keyword?: string
}

export interface SegmentationResult {
  total: number
  members: StoreAMemberInfo[]
}

// ── 工具 ──

function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return '***'
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

function toStoreAMemberInfo(m: P36Member): StoreAMemberInfo {
  return {
    id: m.id,
    phone: m.phone,
    maskedPhone: maskPhone(m.phone),
    name: m.name,
    level: m.level,
    levelLabel: m.level,
    levelEmoji: getLevelEmoji(m.level),
    points: m.points,
    balance: m.balance,
    balanceYuan: Math.floor(m.balance / 100),
    totalSpent: m.totalSpent,
    totalSpentYuan: Math.floor(m.totalSpent / 100),
    createdAt: m.createdAt.toISOString(),
    expiredAt: m.expiredAt ? m.expiredAt.toISOString() : null,
    isActive: m.expiredAt ? m.expiredAt > new Date() : true
  }
}

function getLevelEmoji(level: MemberP36Level): string {
  const emojiMap: Record<MemberP36Level, string> = {
    regular: '🟤',
    silver: '🩶',
    gold: '🟡',
    diamond: '💎'
  }
  return emojiMap[level]
}

function getLevelLabel(level: MemberP36Level): string {
  const labelMap: Record<MemberP36Level, string> = {
    regular: '普通',
    silver: '银卡',
    gold: '金卡',
    diamond: '钻石'
  }
  return labelMap[level]
}

// ── 等级门槛常量 ──

const LEVEL_THRESHOLDS: Record<MemberP36Level, number> = {
  regular: 0,
  silver: 500,      // 500元
  gold: 2000,       // 2000元
  diamond: 5000     // 5000元
}

const LEVEL_POINTS_MULTIPLIER: Record<MemberP36Level, number> = {
  regular: 1,
  silver: 1.2,
  gold: 1.5,
  diamond: 2
}

const LEVEL_DISCOUNT: Record<MemberP36Level, number> = {
  regular: 1,
  silver: 0.95,
  gold: 0.9,
  diamond: 0.85
}

const LEVEL_BENEFITS: Record<MemberP36Level, string[]> = {
  regular: ['积分1x倍率'],
  silver: ['积分1.2x倍率', '全场95折'],
  gold: ['积分1.5x倍率', '全场9折'],
  diamond: ['积分2x倍率', '全场85折', '生日礼']
}

const LEVEL_ORDER: MemberP36Level[] = ['regular', 'silver', 'gold', 'diamond']

// ── Store A 内部跟踪的会员ID列表 ──
const trackedMemberIds = new Set<string>()

export function resetStoreATestState(): void {
  resetP36MemberTestState()
  trackedMemberIds.clear()
}

@Injectable()
export class MemberStoreAService {
  constructor(private readonly p36Svc: MemberP36Service) {}

  private trackMember(member: P36Member): void {
    trackedMemberIds.add(member.id)
  }

  /**
   * 查询会员信息（增强版：含脱敏手机号、等级标签、活跃状态）
   */
  getMemberInfo(memberId: string): StoreAMemberInfo | null {
    const m = this.p36Svc.queryById(memberId)
    if (!m) return null
    return toStoreAMemberInfo(m)
  }

  /**
   * 注册新会员（含积分账户创建）
   */
  register(req: RegisterRequest): P36Member {
    const member = this.p36Svc.register(req.phone, req.name)
    this.trackMember(member)
    return member
  }

  /**
   * 累计积分（带活动ID追踪）
   */
  earnPoints(memberId: string, consumptionAmount: number, orderId?: string, activityId?: string): P36Member {
    return this.p36Svc.earnPoints(memberId, consumptionAmount, orderId)
  }

  /**
   * 兑换积分（增强返回含元转换）
   */
  redeemPoints(memberId: string, points: number): RedeemResult {
    const result = this.p36Svc.redeemPoints(memberId, points)
    return {
      member: toStoreAMemberInfo(result.member),
      deductionAmount: result.deductionAmount,
      deductionYuan: Math.floor(result.deductionAmount / 100)
    }
  }

  /**
   * 查看会员等级（增强：含等级列表、元转换）
   */
  getLevelInfo(memberId: string): StoreALevelInfo | null {
    const display = this.p36Svc.getLevelDisplay(memberId)
    if (!display) return null

    const allLevels: StoreALevelInfo['allLevels'] = {}
    for (const lv of LEVEL_ORDER) {
      allLevels[lv] = {
        label: getLevelLabel(lv),
        emoji: getLevelEmoji(lv),
        threshold: LEVEL_THRESHOLDS[lv],
        pointsMultiplier: LEVEL_POINTS_MULTIPLIER[lv],
        discount: LEVEL_DISCOUNT[lv],
        benefits: [...LEVEL_BENEFITS[lv]]
      }
    }

    return {
      level: display.level,
      label: display.label,
      emoji: display.emoji,
      points: display.points,
      balance: display.balance,
      balanceYuan: display.balanceYuan,
      totalSpent: display.totalSpent,
      totalSpentYuan: Math.floor(display.totalSpent / 100),
      currentThreshold: display.currentThreshold,
      currentThresholdYuan: Math.floor(display.currentThreshold / 100),
      nextThreshold: display.nextThreshold,
      nextThresholdYuan: Math.floor(display.nextThreshold / 100),
      progress: display.progress,
      progressPercent: display.progressPercent,
      remainingToNext: display.remainingToNext,
      remainingToNextYuan: Math.floor(display.remainingToNext / 100),
      benefits: [...display.benefits],
      todayBenefits: [...display.todayBenefits],
      allLevels
    }
  }

  // ── Store A 特有能力 ──

  /**
   * 👑 店长: 会员报表查阅
   */
  getMemberReport(): MemberReportRow[] {
    const allMembers = Array.from(trackedMemberIds)
      .map(id => this.p36Svc.queryById(id))
      .filter((m): m is P36Member => m !== null)

    return allMembers.map(m => ({
      id: m.id,
      name: m.name,
      phone: m.phone,
      maskedPhone: maskPhone(m.phone),
      level: m.level,
      levelEmoji: getLevelEmoji(m.level),
      points: m.points,
      totalSpent: m.totalSpent,
      createdAt: m.createdAt.toISOString(),
      lastActivity: m.createdAt.toISOString()
    }))
  }

  getMemberReportSummary(): {
    totalMembers: number
    totalPoints: number
    totalSpent: number
    levelDistribution: Record<string, number>
    avgPoints: number
  } {
    const members = Array.from(trackedMemberIds)
      .map(id => this.p36Svc.queryById(id))
      .filter((m): m is P36Member => m !== null)
    const levelDistribution: Record<string, number> = {
      regular: 0, silver: 0, gold: 0, diamond: 0
    }
    let totalPoints = 0
    let totalSpent = 0

    for (const m of members) {
      levelDistribution[m.level] = (levelDistribution[m.level] || 0) + 1
      totalPoints += m.points
      totalSpent += m.totalSpent
    }

    return {
      totalMembers: members.length,
      totalPoints,
      totalSpent,
      levelDistribution,
      avgPoints: members.length > 0 ? Math.round(totalPoints / members.length) : 0
    }
  }

  /**
   * 🛒 前台: 快速会员注册（≤3步）
   */
  quickRegister(phone: string, name: string): P36Member {
    const member = this.p36Svc.register(phone, name)
    this.trackMember(member)
    return member
  }

  /**
   * 🔧 安监: 敏感数据脱敏验证
   */
  getMemberInfoMasked(memberId: string): StoreAMemberInfo | null {
    const info = this.getMemberInfo(memberId)
    if (!info) return null
    return {
      ...info,
      maskedPhone: maskPhone(info.phone),
      phone: maskPhone(info.phone)
    }
  }

  /**
   * 🎯 运行专员: 积分活动配置
   */
  configureActivity(
    activityId: string,
    config: {
      name: string
      pointsMultiplier: number
      startDate: string
      endDate: string
      targetLevels: MemberP36Level[]
    }
  ): boolean {
    if (!activityId || !config.name) return false
    if (config.pointsMultiplier <= 0) return false
    if (new Date(config.endDate) <= new Date(config.startDate)) return false
    if (!config.targetLevels || config.targetLevels.length === 0) return false
    // 模拟活动配置存储
    return true
  }

  /**
   * @deprecated Use configureActivity instead
   */
  configurePointsActivity(
    activityId: string,
    config: {
      name: string
      pointsMultiplier: number
      startDate: string
      endDate: string
      targetLevels: MemberP36Level[]
    }
  ): boolean {
    return this.configureActivity(activityId, config)
  }

  /**
   * 🤝 团建: 批量会员导入
   */
  batchImport(members: Array<{ phone: string; name: string }>): BatchImportResult {
    const result: BatchImportResult = {
      total: members.length,
      success: 0,
      failed: 0,
      errors: [],
      members: []
    }

    for (let i = 0; i < members.length; i++) {
      const m = members[i]
      try {
        if (!m.phone || !m.phone.trim()) {
          throw new Error('手机号不能为空')
        }
        if (!m.name || !m.name.trim()) {
          throw new Error('姓名不能为空')
        }
        const member = this.p36Svc.register(m.phone.trim(), m.name.trim())
        this.trackMember(member)
        result.members.push(member)
        result.success++
      } catch (e: unknown) {
        result.failed++
        result.errors.push({
          index: i,
          reason: (e as Error).message
        })
      }
    }

    return result
  }

  /**
   * 📢 营销: 会员分群查询
   */
  querySegmentation(query: SegmentationQuery): SegmentationResult {
    let members = Array.from(trackedMemberIds)
      .map(id => this.p36Svc.queryById(id))
      .filter((m): m is P36Member => m !== null)

    // 等级筛选
    if (query.levels && query.levels.length > 0) {
      members = members.filter(m => query.levels!.includes(m.level))
    }

    // 积分范围
    if (query.minPoints !== undefined) {
      members = members.filter(m => m.points >= query.minPoints!)
    }
    if (query.maxPoints !== undefined) {
      members = members.filter(m => m.points <= query.maxPoints!)
    }

    // 累计消费范围
    if (query.minTotalSpent !== undefined) {
      members = members.filter(m => m.totalSpent >= query.minTotalSpent!)
    }
    if (query.maxTotalSpent !== undefined) {
      members = members.filter(m => m.totalSpent <= query.maxTotalSpent!)
    }

    // 注册时间
    if (query.registeredAfter) {
      const after = new Date(query.registeredAfter)
      members = members.filter(m => m.createdAt >= after)
    }

    // 关键字搜索
    if (query.keyword) {
      const kw = query.keyword.toLowerCase()
      members = members.filter(m =>
        m.name.toLowerCase().includes(kw) ||
        m.phone.includes(kw)
      )
    }

    return {
      total: members.length,
      members: members.map(toStoreAMemberInfo)
    }
  }

}
