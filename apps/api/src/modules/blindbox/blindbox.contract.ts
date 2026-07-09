/**
 * 🐜 自动: [blindbox] [A] contract 补全
 *
 * Blindbox：跨模块合约类型
 * 定义 blindbox 模块对外暴露的稳定合约接口，
 * 供其它模块（inventory, member, loyalty 等）消费。
 */
import type {
  BlindBoxPlan,
  BlindBoxPrize,
  BlindBoxDrawRecord,
  BlindBoxTier,
} from './blindbox.entity'
import { BlindBoxStatus, DrawType } from './blindbox.entity'

// ─── 合约子集 ──────────────────────────────────────────────────────────

/**
 * 盲盒计划合约（跨模块安全子集）
 */
export interface BlindBoxPlanContract {
  planId: string
  name: string
  tierCount: number
  totalPrizes: number
  status: BlindBoxStatus
  createdAt: string
}

/**
 * 盲盒奖品合约（跨模块安全子集）
 */
export interface BlindBoxPrizeContract {
  prizeId: string
  name: string
  stock: number
  tierName: string
}

/**
 * 盲盒抽奖记录合约（跨模块安全子集）
 */
export interface BlindBoxDrawRecordContract {
  recordId: string
  planId: string
  prizeName: string
  drawType: DrawType
  createdAt: string
}

/**
 * 盲盒概率公示条目合约（跨模块安全子集）
 */
export interface BlindBoxOddsContract {
  tierId: string
  tierName: string
  probability: number
  prizeCount: number
  guaranteePityCount: number
}

// ─── 合约工厂函数 ───────────────────────────────────────────────────────

/**
 * 从完整计划创建合约子集
 */
export function toBlindBoxPlanContract(full: BlindBoxPlan): BlindBoxPlanContract {
  const totalPrizes = full.tiers.reduce(
    (sum, tier) =>
      sum + tier.prizes.reduce((s, p) => s + p.stock, 0),
    0,
  )
  return {
    planId: full.planId,
    name: full.name,
    tierCount: full.tiers.length,
    totalPrizes,
    status: full.status,
    createdAt: full.createdAt.toISOString(),
  }
}

/**
 * 从完整抽奖记录创建合约子集
 */
export function toBlindBoxDrawRecordContract(
  full: BlindBoxDrawRecord,
): BlindBoxDrawRecordContract {
  return {
    recordId: full.recordId,
    planId: full.planId,
    prizeName: full.prizeName,
    drawType: full.drawType,
    createdAt: full.createdAt.toISOString(),
  }
}

/**
 * 从完整奖池转换为概率公示合约
 */
export function toBlindBoxOddsContracts(
  tiers: BlindBoxTier[],
  guaranteePityCount: number,
): BlindBoxOddsContract[] {
  return tiers.map((tier) => ({
    tierId: tier.tierId,
    tierName: tier.name,
    probability: tier.probability,
    prizeCount: tier.prizes.length,
    guaranteePityCount,
  }))
}

// ─── 导出原始类型子集 ───────────────────────────────────────────────────

export type { BlindBoxPlan, BlindBoxPrize, BlindBoxDrawRecord, BlindBoxTier }
export { BlindBoxStatus, DrawType }
