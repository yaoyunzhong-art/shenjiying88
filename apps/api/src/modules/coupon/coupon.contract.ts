/**
 * coupon.contract.ts · Coupon API 契约定义 (Phase-17)
 *
 * 定义跨门店优惠券 REST API 的请求/响应契约。
 * 设计依据: spec.md §1.1.2 · E40 P0 跨门店优惠券
 */

import type {
  CouponScope,
  CouponRedemptionRules,
  CouponValueType,
  CouponStatus,
  RedemptionResult,
} from './coupon.types'
import type { CouponV2 } from './coupon.entity'

// ─── 请求契约 ───────────────────────────────────────────────────────────

/** POST /coupons 创建优惠券请求 */
export interface CreateCouponRequest {
  code: string
  tenantId: string
  scope: CouponScope
  redemptionRules: CouponRedemptionRules
  value: number
  valueType: CouponValueType
  expiresAt: string
  maxRedemptions?: number
}

/** PATCH /coupons/:id/status 更新状态请求 */
export interface UpdateCouponStatusRequest {
  status: Exclude<CouponStatus, 'expired'>
}

/** POST /coupons/redeem 核销请求 */
export interface RedeemCouponRequest {
  userId: string
  couponCode: string
  storeId: string
  orderAmount: number
  orderId: string
  idempotencyKey: string
  category?: string
}

// ─── 响应契约 ───────────────────────────────────────────────────────────

/** 优惠券详情响应 */
export interface CouponContract {
  id: string
  tenantId: string
  code: string
  scope: CouponScope
  redemptionRules: CouponRedemptionRules
  value: number
  valueType: CouponValueType
  expiresAt: string
  status: CouponStatus
  redemptionCount: number
  maxRedemptions?: number
  createdAt: string
  updatedAt: string
}

/** 优惠券列表响应 */
export interface CouponListContract {
  coupons: CouponContract[]
  total: number
  page: number
  pageSize: number
}

/** 批量核销请求 */
export interface BatchRedeemRequest {
  redemptions: RedeemCouponRequest[]
}

/** 批量核销响应 */
export interface BatchRedeemResponse {
  results: RedemptionResult[]
  succeeded: number
  failed: number
}

/** 核销结果响应 */
export type RedeemResponse = RedemptionResult

// ─── 转换函数 ───────────────────────────────────────────────────────────

/** 实体 → 契约 */
export function toCouponContract(entity: CouponV2): CouponContract {
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    code: entity.code,
    scope: entity.scope,
    redemptionRules: entity.redemptionRules,
    value: Number(entity.value),
    valueType: entity.valueType,
    expiresAt: entity.expiresAt.toISOString(),
    status: entity.status,
    redemptionCount: entity.redemptionCount,
    maxRedemptions: entity.maxRedemptions,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  }
}

/** 实体列表 → 分页契约 */
export function toCouponListContract(
  entities: CouponV2[],
  total: number,
  page: number,
  pageSize: number,
): CouponListContract {
  return {
    coupons: entities.map(toCouponContract),
    total,
    page,
    pageSize,
  }
}
