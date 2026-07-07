// Coupon Types · Phase-17 T1
// 更新: 2026-06-26 · Pulse-68 主任务
// 状态: COMPLETE · Phase-17 跨门店核销类型已扩展

/**
 * Coupon 通用类型定义
 */

export interface CouponScope {
  type: 'single-store' | 'multi-store' | 'tenant-wide';
  storeIds: string[];
  includeSubordinates: boolean;
}

export interface CouponRedemptionRules {
  minAmount?: number;
  applicableCategories?: string[];
  excludeItems?: string[];
  userSegments?: string[];
}

export type CouponValueType = 'fixed' | 'percentage';
export type CouponStatus = 'active' | 'paused' | 'expired' | 'exhausted';

export interface RedemptionRequest {
  tenantId?: string;
  userId: string;
  couponCode: string;
  storeId: string;
  orderAmount: number;
  orderId: string;
  idempotencyKey: string;
  category?: string;
  userSegment?: string;
}

export interface RedemptionResult {
  success: boolean;
  couponId?: string;
  amount?: number;
  redemptionId?: string;
  error?: {
    code:
      | 'COUPON_NOT_FOUND'
      | 'COUPON_EXPIRED'
      | 'COUPON_EXHAUSTED'
      | 'STORE_NOT_IN_SCOPE'
      | 'MIN_AMOUNT_NOT_MET'
      | 'USER_SEGMENT_NOT_MATCH'
      | 'DUPLICATE_REDEMPTION'
      | 'QUOTA_EXCEEDED';
    message: string;
  };
}

export interface CouponQuotaContext {
  tenantId: string;
  couponId: string;
  quotaKind: 'coupon.redemption';
  reserveCount: number;
}

export interface CrossStoreEligibility {
  eligible: boolean;
  reason?: string;
  matchedScope: 'single-store' | 'multi-store' | 'tenant-wide';
  matchedStoreIds: string[];
}
