import type { RequestTenantContext } from '../tenant/tenant.types'

/**
 * 分润类型枚举
 */
export enum RoyaltyType {
  /** 按销售额比例分润 */
  RevenueShare = 'REVENUE_SHARE',
  /** 按固定金额分润 */
  FixedAmount = 'FIXED_AMOUNT',
  /** 按阶梯分润 */
  Tiered = 'TIERED',
}

/**
 * 分润规则状态
 */
export enum RoyaltyStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Expired = 'EXPIRED',
}

/**
 * 分润规则实体
 *
 * 定义品牌联名活动中的分润规则：分润率、类型、有效期等。
 * 紧耦合：分润规则 → 品牌订单 → 分润计算结果
 */
export interface RoyaltyRule {
  /** 分润规则唯一 ID */
  ruleId: string
  tenantContext: RequestTenantContext
  tenantId?: string
  /** 关联品牌 ID */
  brandId: string
  /** 关联联名项目 ID（可选，支持项目级分润） */
  collabProjectId?: string
  /** 分润规则名称 */
  name: string
  /** 分润类型 */
  royaltyType: RoyaltyType
  /** 分润率（百分比，0-100，适用于 RevenueShare / Tiered） */
  rate: number
  /** 固定分润金额（分，适用于 FixedAmount） */
  fixedAmount: number
  /** 阶梯分润配置 JSON（Tiered 类型使用） */
  tierConfig?: string
  /** 规则状态 */
  status: RoyaltyStatus
  /** 生效时间 */
  effectiveDate: string
  /** 失效时间 */
  expirationDate?: string
  /** 规则描述 */
  description?: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/**
 * 分润计算结果实体
 *
 * 记录了某笔订单下通过分润规则计算产生的实际分润记录。
 */
export interface RoyaltyCalculation {
  /** 分润结算单 ID */
  calculationId: string
  tenantContext: RequestTenantContext
  tenantId?: string
  /** 关联分润规则 ID */
  ruleId: string
  /** 关联品牌 ID */
  brandId: string
  /** 关联品牌订单 ID */
  orderId: string
  /** 订单金额（分） */
  orderAmount: number
  /** 计算时分润率（快照） */
  appliedRate: number
  /** 计算时分润类型（快照） */
  appliedType: RoyaltyType
  /** 分润金额（分，最终结算值） */
  royaltyAmount: number
  /** 计算说明 */
  description?: string
  /** 计算时间 */
  calculatedAt: string
  /** 是否已结算回流 */
  settled: boolean
  /** 结算回流时间 */
  settledAt?: string
}

/**
 * 分润计算输入
 */
export interface RoyaltyCalculationInput {
  /** 品牌 ID */
  brandId: string
  /** 品牌订单 ID */
  orderId: string
  /** 订单金额（分） */
  orderAmount: number
  /** 可选：指定规则 ID（否则按品牌+有效时间匹配最优规则） */
  ruleId?: string
  /** 可选：指定联名项目 ID（用于规则匹配） */
  collabProjectId?: string
  /** 计算说明 */
  description?: string
}
