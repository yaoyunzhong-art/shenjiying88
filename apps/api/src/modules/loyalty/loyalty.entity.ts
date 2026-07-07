import type { RequestTenantContext } from '../tenant/tenant.types'

export enum LoyaltySettlementStatus {
  Succeeded = 'SUCCEEDED',
  Failed = 'FAILED'
}

export enum CouponRedemptionStatus {
  Redeemed = 'REDEEMED',
  Released = 'RELEASED'
}

export enum BlindboxQuotaExecutionMode {
  InMemoryFallback = 'IN_MEMORY_FALLBACK',
  RedisLua = 'REDIS_LUA'
}

export interface BlindboxDrawAuditLog {
  auditLogId: string
  sequence: number
  tenantContext: RequestTenantContext
  memberId: string
  planId: string
  quantity: number
  quotaBefore: number
  quotaAfter: number
  quotaExecutionMode: BlindboxQuotaExecutionMode
  previousAuditLogId?: string
  previousHash?: string
  auditHash: string
  createdAt: string
  rewards: BlindboxRewardResult[]
}

export interface BlindboxDrawAuditPage {
  items: BlindboxDrawAuditLog[]
  total: number
  offset: number
  limit: number
  hasMore: boolean
}

export interface BlindboxAuditIntegrityReport {
  valid: boolean
  totalLogs: number
  checkedAt: string
  lastAuditLogId?: string
  lastHash?: string
  brokenAuditLogId?: string
  expectedHash?: string
  actualHash?: string
  reason?: string
}

export enum BlindboxFulfillmentStatus {
  Fulfilled = 'FULFILLED',
  Skipped = 'SKIPPED',
  Revoked = 'REVOKED'
}

export enum BlindboxRewardTier {
  Standard = 'STANDARD',
  Hot = 'HOT',
  Hidden = 'HIDDEN',
  SuperHidden = 'SUPER_HIDDEN'
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
  rewardPool: BlindboxRewardEntry[]
  probabilityDisclosure?: BlindboxProbabilityDisclosureEntry[]
  caseGuarantee?: BlindboxCaseGuarantee
  validFrom: string
  validUntil: string
  status: LoyaltyPlanStatus
  createdAt: string
  updatedAt: string
}

export interface BlindboxProbabilityOverview {
  planId: string
  blindboxPlanId: string
  title: string
  status: LoyaltyPlanStatus
  totalQuota: number
  remainingQuota: number
  probabilityDisclosure: BlindboxProbabilityDisclosureEntry[]
  recentDrawRecordTotal: number
  historyLimitApplied: number
  hasMoreRecentDrawRecords: boolean
  recentDrawRecords: BlindboxDrawAuditLog[]
  caseGuarantee?: BlindboxCaseGuarantee
  updatedAt: string
}

export interface BlindboxRewardEntry {
  sku: string
  weight: number
  label: string
  tier: BlindboxRewardTier
}

export interface BlindboxProbabilityDisclosureEntry {
  tier: BlindboxRewardTier
  weight: number
  probabilityPct: number
}

export interface BlindboxCaseGuarantee {
  caseSize: number
  guaranteedTier: BlindboxRewardTier
  distinctRewards?: boolean
}

export interface BlindboxRewardResult {
  sku: string
  label: string
  tier: BlindboxRewardTier
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
  rewards?: BlindboxRewardResult[]
  guaranteeApplied?: boolean
  quotaExecutionMode?: BlindboxQuotaExecutionMode
  auditLogId?: string
  status: BlindboxFulfillmentStatus
  relatedFulfillmentId?: string
  reason?: string
  createdAt: string
}

export interface BlindboxMemberOverview {
  memberId: string
  totalFulfillments: number
  totalDrawQuantity: number
  guaranteeHitCount: number
  totalSpentQuota: number
  latestBlindboxPlanId?: string
  latestRewardSku?: string
  latestRewardTier?: BlindboxRewardTier
  lastFulfillmentAt?: string
  lastAuditAt?: string
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
