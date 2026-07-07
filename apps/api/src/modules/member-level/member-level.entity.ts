/**
 * 会员等级实体定义（6阶18级体系）
 *
 * 6阶：REGULAR / VIP / SVIP / DIAMOND / LEGEND / MYTH
 * 每阶3级：L1 / L2 / L3
 *
 * 树哥后台自动执行：积分成长值判定
 */

/** 等级列表 */
export enum MemberLevelTier {
  REGULAR = 'REGULAR',
  VIP = 'VIP',
  SVIP = 'SVIP',
  DIAMOND = 'DIAMOND',
  LEGEND = 'LEGEND',
  MYTH = 'MYTH'
}

/** 等级子级 */
export enum MemberLevelSub {
  L1 = 'L1',
  L2 = 'L2',
  L3 = 'L3'
}

/** 完整等级 KEY：如 REGULAR_L1 */
export type MemberLevelKey = `${MemberLevelTier}_${MemberLevelSub}`

/** 等级阈值配置 */
export interface LevelThreshold {
  tier: MemberLevelTier
  sub: MemberLevelSub
  /** 所需成长值（经验值） */
  requiredGrowth: number
  /** 所需累计消费 */
  requiredSpend: number
  /** 所需到访次数 */
  requiredVisits: number
  /** 等级权益简述 */
  benefits: string[]
}

/** 会员等级信息 */
export interface LevelInfo {
  memberId: string
  currentTier: MemberLevelTier
  currentSub: MemberLevelSub
  currentLevelKey: MemberLevelKey
  growthValue: number
  totalSpend: number
  totalVisits: number
  nextLevelThreshold?: LevelThreshold
  /** 升级进度 0-1 */
  upgradeProgress: number
  /** 等级权益 */
  benefits: string[]
  /** 变更时间 */
  evaluatedAt: string
  /** 是否新升级 */
  upgraded: boolean
}

/** 等级评估输入 */
export interface LevelEvaluationInput {
  memberId: string
  growthValue: number
  totalSpend: number
  totalVisits: number
  tenantId: string
}

/** 批量评估输入 */
export interface BatchLevelInput {
  items: LevelEvaluationInput[]
}

/** 批量评估输出 */
export interface BatchLevelOutput {
  items: LevelInfo[]
  totalEvaluated: number
  upgradedCount: number
  timestamp: string
}

/** 等级变更记录 */
export interface LevelChangeRecord {
  memberId: string
  fromTier: MemberLevelTier
  fromSub: MemberLevelSub
  toTier: MemberLevelTier
  toSub: MemberLevelSub
  reason: string
  changedAt: string
}

/** 等级配置项 */
export interface LevelConfig {
  tier: MemberLevelTier
  label: string
  growthRequired: number
  spendRequired: number
  visitRequired: number
  benefits: string[]
}

/** 全量等级配置 */
export interface AllLevelConfig {
  tiers: LevelConfig[]
  lastUpdated: string
}
