import type { CampaignAction, CampaignCondition, CampaignDispatch, CampaignPlan } from './campaign.entity';
export interface CampaignPlanContract {
    planId: string;
    tenantContext: CampaignPlan['tenantContext'];
    code: string;
    title: string;
    description?: string;
    status: CampaignPlan['status'];
    triggerEvent: CampaignPlan['triggerEvent'];
    conditions: CampaignCondition[];
    actions: CampaignAction[];
    priority: number;
    scheduledStart?: string;
    scheduledEnd?: string;
    createdAt: string;
    updatedAt: string;
}
export interface CampaignDispatchContract {
    dispatchId: string;
    planId: string;
    actionIndex: number;
    tenantContext: CampaignDispatch['tenantContext'];
    memberId?: string;
    orderId?: string;
    paymentId?: string;
    triggerEvent: string;
    status: CampaignDispatch['status'];
    errorMessage?: string;
    resultRef?: string;
    createdAt: string;
}
export interface CampaignEvaluationResultContract {
    matchedCampaigns: number;
    dispatchedActions: number;
    skippedActions: number;
    failedActions: number;
    dispatches: CampaignDispatchContract[];
}
export declare function toCampaignPlanContract(plan: CampaignPlan): CampaignPlanContract;
export declare function toCampaignDispatchContract(dispatch: CampaignDispatch): CampaignDispatchContract;
//# sourceMappingURL=campaign.contract.d.ts.map