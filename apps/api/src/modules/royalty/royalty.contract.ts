import type { RoyaltyRule, RoyaltyCalculation, RoyaltyStatus, RoyaltyType } from './royalty.entity'

/**
 * 分润规则合约（对外响应结构）
 */
export interface RoyaltyRuleContract {
  ruleId: string
  brandId: string
  collabProjectId?: string
  name: string
  royaltyType: RoyaltyType
  rate: number
  fixedAmount: number
  tierConfig?: string
  status: RoyaltyStatus
  effectiveDate: string
  expirationDate?: string
  description?: string
  createdAt: string
  updatedAt: string
}

/**
 * 分润计算结果合约
 */
export interface RoyaltyCalculationContract {
  calculationId: string
  ruleId: string
  brandId: string
  orderId: string
  orderAmount: number
  appliedRate: number
  appliedType: RoyaltyType
  royaltyAmount: number
  description?: string
  calculatedAt: string
  settled: boolean
  settledAt?: string
}

/**
 * 将分润规则实体转换为合约格式
 */
export function toRoyaltyRuleContract(rule: RoyaltyRule): RoyaltyRuleContract {
  return {
    ruleId: rule.ruleId,
    brandId: rule.brandId,
    collabProjectId: rule.collabProjectId,
    name: rule.name,
    royaltyType: rule.royaltyType,
    rate: rule.rate,
    fixedAmount: rule.fixedAmount,
    tierConfig: rule.tierConfig,
    status: rule.status,
    effectiveDate: rule.effectiveDate,
    expirationDate: rule.expirationDate,
    description: rule.description,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  }
}

/**
 * 将分润计算结果实体转换为合约格式
 */
export function toRoyaltyCalculationContract(calc: RoyaltyCalculation): RoyaltyCalculationContract {
  return {
    calculationId: calc.calculationId,
    ruleId: calc.ruleId,
    brandId: calc.brandId,
    orderId: calc.orderId,
    orderAmount: calc.orderAmount,
    appliedRate: calc.appliedRate,
    appliedType: calc.appliedType,
    royaltyAmount: calc.royaltyAmount,
    description: calc.description,
    calculatedAt: calc.calculatedAt,
    settled: calc.settled,
    settledAt: calc.settledAt,
  }
}
