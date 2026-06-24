import type { RequestTenantContext } from '../tenant/tenant.types';
import { RegisterCampaignDto, UpdateCampaignStatusDto } from './campaign.dto';
import { CampaignActionStatus, CampaignStatus, CampaignTrigger } from './campaign.entity';
import { CampaignService, type CampaignTriggerEvent } from './campaign.service';
export declare class CampaignController {
    private readonly campaignService;
    constructor(campaignService: CampaignService);
    registerCampaign(tenantContext: RequestTenantContext, body: RegisterCampaignDto): import("./campaign.contract").CampaignPlanContract;
    listCampaigns(tenantContext: RequestTenantContext, status?: CampaignStatus, triggerEvent?: CampaignTrigger): import("./campaign.contract").CampaignPlanContract[];
    getCampaign(tenantContext: RequestTenantContext, planId: string): import("./campaign.contract").CampaignPlanContract | null;
    updateCampaignStatus(tenantContext: RequestTenantContext, planId: string, body: UpdateCampaignStatusDto): import("./campaign.contract").CampaignPlanContract;
    listPlanDispatches(tenantContext: RequestTenantContext, planId: string): import("./campaign.contract").CampaignDispatchContract[];
    listDispatches(tenantContext: RequestTenantContext, memberId?: string, status?: CampaignActionStatus): import("./campaign.contract").CampaignDispatchContract[];
    evaluateTriggers(tenantContext: RequestTenantContext, body: Omit<CampaignTriggerEvent, 'tenantContext'>): import("./campaign.service").CampaignEvaluationResult;
}
//# sourceMappingURL=campaign.controller.d.ts.map