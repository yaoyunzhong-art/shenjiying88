import 'reflect-metadata';
import { CampaignActionKind, CampaignConditionType, CampaignStatus, CampaignTrigger, type CampaignAction, type CampaignCondition } from './campaign.entity';
export declare class CampaignConditionDto implements CampaignCondition {
    type: CampaignConditionType;
    value: number | string | string[];
}
export declare class CampaignActionDto implements CampaignAction {
    kind: CampaignActionKind;
    params: CampaignAction['params'];
}
export declare class RegisterCampaignDto {
    code: string;
    title: string;
    description?: string;
    triggerEvent: CampaignTrigger;
    conditions: CampaignConditionDto[];
    actions: CampaignActionDto[];
    priority?: number;
    scheduledStart?: string;
    scheduledEnd?: string;
}
export declare class UpdateCampaignStatusDto {
    status: CampaignStatus;
}
//# sourceMappingURL=campaign.dto.d.ts.map