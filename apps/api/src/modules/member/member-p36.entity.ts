/**
 * P-36 会员中心实体定义 (PRD-002)
 *
 * @see docs/knowledge/prd/prd-member-p36.md
 */

/** 会员等级 */
export type MemberP36Level = 'regular' | 'silver' | 'gold' | 'diamond'

/** 等级配置 */
export interface LevelConfig {
  level: MemberP36Level
  label: string
  emoji: string
  /** 升级门槛(累计消费) */
  threshold: number
  /** 积分倍率 */
  pointsMultiplier: number
  /** 折扣(0-1) */
  discount: number
  /** 权益列表 */
  benefits: string[]
}

/** 等级排序 */
export const LEVEL_ORDER: MemberP36Level[] = ['regular', 'silver', 'gold', 'diamond']

/** 等级配置表 */
export const LEVEL_CONFIGS: Record<MemberP36Level, LevelConfig> = {
  regular: {
    level: 'regular',
    label: '普通',
    emoji: '🟤',
    threshold: 0,
    pointsMultiplier: 1,
    discount: 1,
    benefits: ['积分1x倍率']
  },
  silver: {
    level: 'silver',
    label: '银卡',
    emoji: '🩶',
    threshold: 50000,  // 500元 = 50000分
    pointsMultiplier: 1.2,
    discount: 0.95,
    benefits: ['积分1.2x倍率', '全场95折']
  },
  gold: {
    level: 'gold',
    label: '金卡',
    emoji: '🟡',
    threshold: 200000,  // 2000元 = 200000分
    pointsMultiplier: 1.5,
    discount: 0.9,
    benefits: ['积分1.5x倍率', '全场9折']
  },
  diamond: {
    level: 'diamond',
    label: '钻石',
    emoji: '💎',
    threshold: 500000,  // 5000元 = 500000分
    pointsMultiplier: 2,
    discount: 0.85,
    benefits: ['积分2x倍率', '全场85折', '生日礼']
  }
}

/** 会员中心会员 */
export interface P36Member {
  id: string
  phone: string
  name: string
  level: MemberP36Level
  points: number
  balance: number      // 预付余额(分)
  totalSpent: number   // 累计消费(分)
  createdAt: Date
  expiredAt?: Date
}

/** 积分流水 */
export interface PointsTransaction {
  id: string
  memberId: string
  type: 'earn' | 'redeem' | 'expire' | 'admin'
  amount: number
  orderId?: string
  remark: string
  createdAt: Date
}

/** 余额流水 */
export interface BalanceTransaction {
  id: string
  memberId: string
  type: 'recharge' | 'payment' | 'refund' | 'admin'
  amount: number
  orderId?: string
  paymentMethod?: string
  createdAt: Date
}

/** 等级展示信息（含进度条） */
export interface LevelDisplay {
  level: MemberP36Level
  label: string
  emoji: string
  points: number
  balance: number
  balanceYuan: number
  totalSpent: number
  /** 当前等级对应的累计消费门槛 */
  currentThreshold: number
  /** 下一等级门槛(顶级为当前等级门槛) */
  nextThreshold: number
  /** 升级进度 0-1 */
  progress: number
  /** 升级进度百分比 */
  progressPercent: number
  /** 距保级/升级还需消费(分) */
  remainingToNext: number
  /** 当前权益 */
  benefits: string[]
  /** 今日可用权益 */
  todayBenefits: string[]
}

/** 消费记录条目 */
export interface ConsumptionRecord {
  id: string
  memberId: string
  type: 'recharge' | 'payment' | 'points_earn' | 'points_redeem'
  amount: number
  /** 关联订单号 */
  orderId?: string
  /** 备注 */
  remark: string
  createdAt: Date
}

/**
 * 根据累计消费计算等级
 */
export function computeLevel(totalSpent: number): MemberP36Level {
  const levels = LEVEL_ORDER
  let result: MemberP36Level = 'regular'
  for (const lv of levels) {
    if (totalSpent >= LEVEL_CONFIGS[lv].threshold) {
      result = lv
    } else {
      break
    }
  }
  return result
}

/**
 * 构建等级展示信息
 */
export function buildLevelDisplay(member: P36Member): LevelDisplay {
  const level = member.level
  const config = LEVEL_CONFIGS[level]
  const levelIdx = LEVEL_ORDER.indexOf(level)
  const nextLevel: MemberP36Level | undefined = LEVEL_ORDER[levelIdx + 1]
  const nextConfig = nextLevel ? LEVEL_CONFIGS[nextLevel] : config
  const nextThreshold = nextConfig.threshold
  const currentThreshold = config.threshold

  // 计算进度
  let progress = 0
  if (nextThreshold > currentThreshold) {
    progress = Math.min(1, Math.max(0, (member.totalSpent - currentThreshold) / (nextThreshold - currentThreshold)))
  } else {
    progress = 1 // 顶级
  }
  const progressPercent = Math.round(progress * 100)
  const remainingToNext = Math.max(0, nextThreshold - member.totalSpent)

  return {
    level,
    label: config.label,
    emoji: config.emoji,
    points: member.points,
    balance: member.balance,
    balanceYuan: Math.floor(member.balance / 100),
    totalSpent: member.totalSpent,
    currentThreshold,
    nextThreshold,
    progress,
    progressPercent,
    remainingToNext,
    benefits: config.benefits,
    todayBenefits: config.benefits
  }
}

/**
 * 计算消费应获得的积分（基于等级倍率）
 */
export function calcEarnedPoints(consumptionAmount: number, level: MemberP36Level): number {
  const config = LEVEL_CONFIGS[level]
  // PRD: 消费1元=1基础积分，再乘以等级倍率
  const basePoints = Math.floor(consumptionAmount / 100) // 消费额以分为单位，转换元
  return Math.floor(basePoints * config.pointsMultiplier)
}
