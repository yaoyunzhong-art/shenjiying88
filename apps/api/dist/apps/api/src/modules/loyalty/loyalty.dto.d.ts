import 'reflect-metadata';
import { CouponDiscountType, LoyaltyPlanStatus } from './loyalty.entity';
/**
 * 积分台账查询 DTO
 */
export declare class PointsLedgerQueryDto {
    orderId?: string;
    memberId?: string;
}
/**
 * 优惠券核销查询 DTO
 */
export declare class CouponRedemptionQueryDto {
    orderId?: string;
    memberId?: string;
    couponCode?: string;
}
/**
 * 盲盒履约查询 DTO
 */
export declare class BlindboxFulfillmentQueryDto {
    orderId?: string;
    memberId?: string;
    blindboxPlanId?: string;
}
/**
 * 结算查询 DTO
 */
export declare class SettlementQueryDto {
    memberId?: string;
}
export declare class BlindboxRewardEntryDto {
    sku: string;
    weight: number;
    label: string;
}
export declare class RegisterCouponPlanDto {
    code: string;
    title: string;
    description?: string;
    discountType: CouponDiscountType;
    discountValue: number;
    minOrderAmount?: number;
    totalQuota: number;
    perMemberLimit: number;
    validFrom: string;
    validUntil: string;
}
export declare class RegisterBlindboxPlanDto {
    blindboxPlanId: string;
    title: string;
    description?: string;
    unitPrice: number;
    totalQuota: number;
    rewardPool: BlindboxRewardEntryDto[];
    validFrom: string;
    validUntil: string;
}
export declare class ActivateCouponPlanDto {
    status: LoyaltyPlanStatus;
}
export declare class ActivateBlindboxPlanDto {
    status: LoyaltyPlanStatus;
}
export declare class IssueCouponFromPlanDto {
    memberId: string;
    source?: string;
}
export declare class IssueBlindboxFromPlanDto {
    memberId: string;
    quantity?: number;
}
//# sourceMappingURL=loyalty.dto.d.ts.map