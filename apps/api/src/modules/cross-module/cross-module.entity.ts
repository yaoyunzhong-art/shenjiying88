/**
 * 🦞 跨模块 E2E 验证 — 实体定义
 *
 * 跨模块验证关心的实体不是数据库持久化对象，
 * 而是各模块间流转的数据结构和契约快照。
 */

/**
 * 跨模块链路状态枚举
 */
export enum ChainStatus {
  Defined = 'defined',
  Validating = 'validating',
  Verified = 'verified',
  Broken = 'broken'
}

/**
 * 跨模块链路定义
 */
export interface CrossModuleChain {
  /** 链路名称 */
  name: string
  /** 链路描述 */
  description: string
  /** 涉及模块 */
  modules: string[]
  /** 当前状态 */
  status: ChainStatus
  /** 上次验证时间 */
  lastVerifiedAt?: string
  /** 失败节点 */
  brokenNodes?: string[]
}

/**
 * 跨模块验证结果实体
 */
export interface CrossModuleValidationResult {
  /** 链路名称 */
  chainName: string
  /** 是否通过 */
  passed: boolean
  /** 各阶段结果 */
  stages: ValidationStage[]
  /** 执行时间戳 */
  executedAt: string
  /** 总耗时 ms */
  durationMs: number
}

/**
 * 验证阶段
 */
export interface ValidationStage {
  /** 阶段名称 */
  stage: string
  /** 来源模块 */
  from: string
  /** 目标模块 */
  to: string
  /** 是否通过 */
  passed: boolean
  /** 错误信息 */
  error?: string
  /** 阶段耗时 ms */
  durationMs: number
}

/**
 * 跨模块 E2E 上下文
 */
export interface CrossModuleContext {
  /** 租户标识 */
  tenantId?: string
  /** 门店标识 */
  storeId?: string
  /** 品牌标识 */
  brandId?: string
  /** 市场代码 */
  marketCode?: string
  /** 是否详细模式 */
  verbose?: boolean
}

/**
 * 从链路列表构造验证摘要
 */
export function toValidationSummary(
  chains: CrossModuleChain[]
): { total: number; defined: number; validating: number; verified: number; broken: number } {
  const summary = { total: chains.length, defined: 0, validating: 0, verified: 0, broken: 0 }

  for (const chain of chains) {
    switch (chain.status) {
      case ChainStatus.Defined:
        summary.defined++
        break
      case ChainStatus.Validating:
        summary.validating++
        break
      case ChainStatus.Verified:
        summary.verified++
        break
      case ChainStatus.Broken:
        summary.broken++
        break
    }
  }

  return summary
}

/**
 * 判断链路是否全部验证通过
 */
export function isAllVerified(chains: CrossModuleChain[]): boolean {
  return chains.length > 0 && chains.every((c) => c.status === ChainStatus.Verified)
}

/**
 * 判断是否存在断开的链路
 */
export function hasBrokenChain(chains: CrossModuleChain[]): boolean {
  return chains.some((c) => c.status === ChainStatus.Broken)
}
