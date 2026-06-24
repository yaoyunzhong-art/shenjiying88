import type { RequestTenantContext } from '../tenant/tenant.types';
import { ActivateCouponPlanDto, ActivateBlindboxPlanDto, IssueCouponFromPlanDto, IssueBlindboxFromPlanDto, RegisterCouponPlanDto, RegisterBlindboxPlanDto } from './loyalty.dto';
import { LoyaltyService } from './loyalty.service';
export declare class LoyaltyController {
    private readonly loyaltyService;
    constructor(loyaltyService: LoyaltyService);
    listPointsLedger(tenantContext: RequestTenantContext): import("./loyalty.entity").PointsLedgerEntry[];
    listCouponRedemptions(tenantContext: RequestTenantContext): import("./loyalty.entity").CouponRedemption[];
    listBlindboxFulfillments(tenantContext: RequestTenantContext): import("./loyalty.entity").BlindboxFulfillment[];
    listSettlements(tenantContext: RequestTenantContext): import("./loyalty.entity").LoyaltyOrderSettlement[];
    registerCouponPlan(tenantContext: RequestTenantContext, body: RegisterCouponPlanDto): import("./loyalty.entity").CouponPlan;
    listCouponPlans(tenantContext: RequestTenantContext): import("./loyalty.entity").CouponPlan[];
    getCouponPlan(tenantContext: RequestTenantContext, planId: string): import("./loyalty.entity").CouponPlan | undefined;
    activateCouponPlan(tenantContext: RequestTenantContext, planId: string, body: ActivateCouponPlanDto): import("./loyalty.entity").CouponPlan;
    issueCoupon(tenantContext: RequestTenantContext, planId: string, body: IssueCouponFromPlanDto): import("./loyalty.entity").CouponRedemption;
    registerBlindboxPlan(tenantContext: RequestTenantContext, body: RegisterBlindboxPlanDto): import("./loyalty.entity").BlindboxPlan;
    listBlindboxPlans(tenantContext: RequestTenantContext): import("./loyalty.entity").BlindboxPlan[];
    getBlindboxPlan(tenantContext: RequestTenantContext, planId: string): import("./loyalty.entity").BlindboxPlan | undefined;
    activateBlindboxPlan(tenantContext: RequestTenantContext, planId: string, body: ActivateBlindboxPlanDto): import("./loyalty.entity").BlindboxPlan;
    issueBlindbox(tenantContext: RequestTenantContext, planId: string, body: IssueBlindboxFromPlanDto): import("./loyalty.entity").BlindboxFulfillment;
}
//# sourceMappingURL=loyalty.controller.d.ts.map