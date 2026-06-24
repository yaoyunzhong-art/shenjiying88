import type { RuntimeGovernanceApiActionKey, RuntimeGovernanceCallbackEvent, RuntimeGovernanceCallbackStatus, RuntimeGovernanceClientApp, RuntimeGovernanceNextStep, RuntimeGovernanceRecommendedAction, RuntimeGovernanceReplaySource, RuntimeGovernanceRiskLevel } from '@m5/types';
export declare class SubmitRuntimeGovernanceActionDto {
    app: RuntimeGovernanceClientApp;
    action: RuntimeGovernanceApiActionKey;
    nextStep: RuntimeGovernanceNextStep;
    riskLevel: RuntimeGovernanceRiskLevel;
    requestEndpoint: string;
    payload: Record<string, unknown>;
    payloadSummary: string;
    recommendedAction: RuntimeGovernanceRecommendedAction;
    handlerName: string;
    idempotencyKey: string;
    actorId?: string;
}
export declare class SyncRuntimeGovernanceActionDto {
    handlerName: string;
    ticketCode: string;
    idempotencyKey: string;
}
export declare class RecordRuntimeGovernanceCallbackDto {
    callbackStatus: RuntimeGovernanceCallbackStatus;
    ackToken: string;
    lastEvent: RuntimeGovernanceCallbackEvent;
    summary: string;
    idempotencyKey: string;
}
export declare class ReplayRuntimeGovernanceActionDto {
    ledgerKey: string;
    requestedFrom: RuntimeGovernanceReplaySource;
    ticketCode: string;
    idempotencyKey: string;
}
export declare class BatchReplayRuntimeGovernanceActionItemDto extends ReplayRuntimeGovernanceActionDto {
    receiptCode: string;
}
export declare class BatchReplayRuntimeGovernanceActionDto {
    items: BatchReplayRuntimeGovernanceActionItemDto[];
}
//# sourceMappingURL=runtime-governance.dto.d.ts.map