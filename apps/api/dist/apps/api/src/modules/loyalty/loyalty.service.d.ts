import { MemberService } from '../member/member.service';
import type { CashierOrder, CashierPayment } from '../cashier/cashier.entity';
import type { LytOrderSnapshot, LytPaymentSnapshot } from '../transactions/transactions.entity';
import type { RequestTenantContext } from '../tenant/tenant.types';
import { CouponDiscountType, LoyaltyPlanStatus, type BlindboxFulfillment, type BlindboxPlan, type CouponPlan, type CouponRedemption, type LoyaltyOrderSettlement, type PointsLedgerEntry } from './loyalty.entity';
export declare class LoyaltyService {
    private readonly memberService;
    constructor(memberService: MemberService);
    private buildOrderSettlementInput;
    private buildRewardSku;
    listPointsLedger(tenantId: string): PointsLedgerEntry[];
    listCouponRedemptions(tenantId: string): CouponRedemption[];
    listBlindboxFulfillments(tenantId: string): BlindboxFulfillment[];
    listSettlements(tenantId: string): LoyaltyOrderSettlement[];
    getSettlement(orderId: string, tenantId: string): LoyaltyOrderSettlement | undefined;
    listPointsLedgerForOrder(orderId: string, tenantId: string): PointsLedgerEntry[];
    listCouponRedemptionsForOrder(orderId: string, tenantId: string): CouponRedemption[];
    listBlindboxFulfillmentsForOrder(orderId: string, tenantId: string): BlindboxFulfillment[];
    private getReversedPoints;
    private listBlindboxRollbackRecords;
    settlePaidOrder(order: CashierOrder | LytOrderSnapshot, payment: CashierPayment | LytPaymentSnapshot): Promise<LoyaltyOrderSettlement>;
    settleFailedOrder(order: CashierOrder | LytOrderSnapshot, payment: CashierPayment | LytPaymentSnapshot): Promise<LoyaltyOrderSettlement>;
    settlePaidOrderFromSnapshots(order: LytOrderSnapshot, payment: LytPaymentSnapshot): Promise<LoyaltyOrderSettlement>;
    settleFailedOrderFromSnapshots(order: LytOrderSnapshot, payment: LytPaymentSnapshot): Promise<LoyaltyOrderSettlement>;
    applyRefund(order: CashierOrder, payment: CashierPayment, refundAmount: number, options?: {
        revokeBlindbox?: boolean;
    }): Promise<{
        reversedPoints: number;
        releasedCoupon: boolean;
        revokedBlindbox: boolean;
    }>;
    registerCouponPlan(input: {
        tenantContext: RequestTenantContext;
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
    }): CouponPlan;
    updateCouponPlanStatus(planId: string, status: LoyaltyPlanStatus, tenantId: string): CouponPlan;
    listCouponPlans(tenantId: string): CouponPlan[];
    getCouponPlan(planId: string, tenantId: string): CouponPlan | undefined;
    getCouponPlanByCode(code: string, tenantId: string): CouponPlan | undefined;
    registerBlindboxPlan(input: {
        tenantContext: RequestTenantContext;
        blindboxPlanId: string;
        title: string;
        description?: string;
        unitPrice: number;
        totalQuota: number;
        rewardPool: Array<{
            sku: string;
            weight: number;
            label: string;
        }>;
        validFrom: string;
        validUntil: string;
    }): BlindboxPlan;
    updateBlindboxPlanStatus(planIdOrCode: string, status: LoyaltyPlanStatus, tenantId: string): BlindboxPlan;
    listBlindboxPlans(tenantId: string): BlindboxPlan[];
    getBlindboxPlan(planId: string, tenantId: string): BlindboxPlan | undefined;
    getBlindboxPlanByCode(blindboxPlanId: string, tenantId: string): BlindboxPlan | undefined;
    issueCouponFromPlan(input: {
        tenantContext: RequestTenantContext;
        memberId: string;
        planId: string;
        source?: string;
    }): CouponRedemption;
    private pickBlindboxReward;
    issueBlindboxFromPlan(input: {
        tenantContext: RequestTenantContext;
        memberId: string;
        planId: string;
        quantity?: number;
    }): BlindboxFulfillment;
    resetLoyaltyStoresForTests(): void;
    getLoyaltySummary(input: {
        tenantId: string;
        brandId?: string;
        storeId?: string;
    }): {
        settlementCount: number;
        settlementSuccessCount: number;
        couponRedemptionCount: number;
        blindboxFulfillmentCount: number;
        pointsIn: number;
        pointsOut: number;
    };
}
//# sourceMappingURL=loyalty.service.d.ts.map