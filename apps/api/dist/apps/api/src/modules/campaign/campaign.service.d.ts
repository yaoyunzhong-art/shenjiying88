import { LoyaltyService } from '../loyalty/loyalty.service';
import { MemberService } from '../member/member.service';
import type { RequestTenantContext } from '../tenant/tenant.types';
import { CampaignActionStatus, CampaignCondition, CampaignStatus, CampaignTrigger, type CampaignAction, type CampaignDispatch, type CampaignPlan } from './campaign.entity';
export interface CampaignTriggerEvent {
    eventName: CampaignTrigger | string;
    tenantContext: RequestTenantContext;
    memberId?: string;
    orderId?: string;
    paymentId?: string;
    orderAmount?: number;
    memberLevel?: string;
    storeId?: string;
    brandId?: string;
    payload?: Record<string, unknown>;
}
export interface CampaignEvaluationResult {
    matchedCampaigns: number;
    dispatchedActions: number;
    skippedActions: number;
    failedActions: number;
    dispatches: CampaignDispatch[];
}
export declare class CampaignService {
    private readonly memberService?;
    private readonly loyaltyService?;
    constructor(memberService?: MemberService | undefined, loyaltyService?: LoyaltyService | undefined);
    registerCampaign(input: {
        tenantContext: RequestTenantContext;
        code: string;
        title: string;
        description?: string;
        triggerEvent: CampaignTrigger;
        conditions: CampaignCondition[];
        actions: CampaignAction[];
        priority?: number;
        scheduledStart?: string;
        scheduledEnd?: string;
    }): CampaignPlan;
    updateCampaignStatus(planId: string, status: CampaignStatus, tenantId: string): CampaignPlan;
    listCampaigns(tenantId: string, filter?: {
        status?: CampaignStatus;
        triggerEvent?: CampaignTrigger;
    }): CampaignPlan[];
    getCampaign(planId: string, tenantId: string): CampaignPlan | undefined;
    listDispatches(tenantId: string, filter?: {
        planId?: string;
        memberId?: string;
        status?: CampaignActionStatus;
    }): CampaignDispatch[];
    evaluateTriggers(event: CampaignTriggerEvent): CampaignEvaluationResult;
    private validateAction;
    private assertValidStatusTransition;
    private isWithinScheduledWindow;
    private matchesConditions;
    private valueMatchesString;
    private dispatchAction;
    resetCampaignStoresForTests(): void;
}
//# sourceMappingURL=campaign.service.d.ts.map