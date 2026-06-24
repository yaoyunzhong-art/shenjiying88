import type { RequestTenantContext } from '../tenant/tenant.types';
export declare enum CampaignStatus {
    Draft = "DRAFT",
    Scheduled = "SCHEDULED",
    Active = "ACTIVE",
    Paused = "PAUSED",
    Completed = "COMPLETED"
}
export declare enum CampaignTrigger {
    PaymentSuccess = "payment.success",
    MemberProfileSynced = "member.profile-synced",
    OrderCreated = "order.created",
    MemberActivityRecurring = "member.activity-recurring"
}
export declare enum CampaignActionKind {
    AwardPoints = "AWARD_POINTS",
    IssueCoupon = "ISSUE_COUPON",
    IssueBlindbox = "ISSUE_BLINDBOX",
    RecommendTag = "RECOMMEND_TAG"
}
export declare enum CampaignActionStatus {
    Pending = "PENDING",
    Dispatched = "DISPATCHED",
    Failed = "FAILED",
    Skipped = "SKIPPED"
}
export declare enum CampaignConditionType {
    MinOrderAmount = "MIN_ORDER_AMOUNT",
    MemberLevel = "MEMBER_LEVEL",
    StoreScope = "STORE_SCOPE",
    BrandScope = "BRAND_SCOPE"
}
export interface CampaignCondition {
    type: CampaignConditionType;
    /** Numeric threshold (MIN_ORDER_AMOUNT), string set (MEMBER_LEVEL/STORE_SCOPE/BRAND_SCOPE) */
    value: number | string | string[];
}
export interface CampaignAction {
    kind: CampaignActionKind;
    params: {
        /** AWARD_POINTS */
        points?: number;
        pointsAmount?: number;
        pointsReason?: string;
        reason?: string;
        expiresAt?: string;
        /** ISSUE_COUPON */
        couponPlanId?: string;
        couponTemplateId?: string;
        discountType?: string;
        discountValue?: number;
        /** ISSUE_BLINDBOX */
        blindboxPlanId?: string;
        blindboxPoolId?: string;
        blindboxQuantity?: number;
        /** RECOMMEND_TAG */
        tag?: string;
        tagCode?: string;
        tagMessage?: string;
    };
}
export interface CampaignPlan {
    planId: string;
    tenantContext: RequestTenantContext;
    code: string;
    title: string;
    description?: string;
    status: CampaignStatus;
    triggerEvent: CampaignTrigger;
    conditions: CampaignCondition[];
    actions: CampaignAction[];
    priority: number;
    scheduledStart?: string;
    scheduledEnd?: string;
    createdAt: string;
    updatedAt: string;
}
export interface CampaignDispatch {
    dispatchId: string;
    planId: string;
    actionIndex: number;
    tenantContext: RequestTenantContext;
    memberId?: string;
    orderId?: string;
    paymentId?: string;
    triggerEvent: string;
    status: CampaignActionStatus;
    errorMessage?: string;
    resultRef?: string;
    createdAt: string;
}
//# sourceMappingURL=campaign.entity.d.ts.map