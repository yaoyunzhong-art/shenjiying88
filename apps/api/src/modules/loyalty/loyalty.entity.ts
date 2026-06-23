import type { RequestTenantContext } from '../tenant/tenant.types'

export enum LoyaltySettlementStatus {
  Succeeded = 'SUCCEEDED',
  Failed = 'FAILED'
}

export enum CouponRedemptionStatus {
  Redeemed = 'REDEEMED',
  Released = 'RELEASED'
}

export enum BlindboxFulfillmentStatus {
  Fulfilled = 'FULFILLED',
  Skipped = 'SKIPPED',
  Revoked = 'REVOKED'
}

export enum CouponDiscountType {
  FixedAmount = 'FIXED_AMOUNT',
  Percentage = 'PERCENTAGE'
}

export enum LoyaltyPlanStatus {
  Draft = 'DRAFT',
  Active = 'ACTIVE',
  Paused = 'PAUSED',
  Expired = 'EXPIRED'
}

export interface CouponPlan {
  planId: string
  tenantContext: RequestTenantContext
  code: string
  title: string
  description?: string
  discountType: CouponDiscountType
  discountValue: number
  minOrderAmount?: number
  totalQuota: number
  remainingQuota: number
  perMemberLimit: number
  validFrom: string
  validUntil: string
  status: LoyaltyPlanStatus
  createdAt: string
  updatedAt: string
}

export interface BlindboxPlan {
  planId: string
  tenantContext: RequestTenantContext
  blindboxPlanId: string
  title: string
  description?: string
  unitPrice: number
  totalQuota: number
  remainingQuota: number
  rewardPool: Array<{ sku: string; weight: number; label: string }>
  validFrom: string
  validUntil: string
  status: LoyaltyPlanStatus
  createdAt: string
  updatedAt: string
}

export interface PointsLedgerEntry {
  entryId: string
  tenantContext: RequestTenantContext
  memberId: string
  orderId: string
  paymentId: string
  points: number
  reason: string
  createdAt: string
}

export interface CouponRedemption {
  redemptionId: string
  tenantContext: RequestTenantContext
  orderId: string
  paymentId: string
  memberId: string
  couponCode: string
  status: CouponRedemptionStatus
  createdAt: string
}

export interface BlindboxFulfillment {
  fulfillmentId: string
  tenantContext: RequestTenantContext
  orderId: string
  paymentId: string
  memberId: string
  blindboxPlanId: string
  quantity: number
  rewardSku: string
  status: BlindboxFulfillmentStatus
  relatedFulfillmentId?: string
  reason?: string
  createdAt: string
}

export interface LoyaltyOrderSettlement {
  settlementId: string
  tenantContext: RequestTenantContext
  orderId: string
  paymentId: string
  memberId: string
  status: LoyaltySettlementStatus
  awardedPoints: number
  couponCode?: string
  blindboxPlanId?: string
  createdAt: string
  updatedAt: string
}
