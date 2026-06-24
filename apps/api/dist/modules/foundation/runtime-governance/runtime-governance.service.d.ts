import { type RuntimeGovernanceCallbackStallDetail, type RuntimeGovernanceCallbackRequest, type RuntimeGovernanceReceipt, type RuntimeGovernanceReplayRequest, type RuntimeGovernanceSubmitRequest, type RuntimeGovernanceSyncRequest } from '@m5/types';
import { PrismaService } from '../../../prisma/prisma.service';
import { IntegrationOrchestrationService } from '../integration-orchestration/integration-orchestration.service';
import { TrustGovernanceService } from '../trust-governance/trust-governance.service';
import type { FoundationModuleDescriptor } from '../foundation.types';
type RuntimeGovernanceScopedSubmitRequest = RuntimeGovernanceSubmitRequest & {
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
};
type RuntimeGovernanceScopedActionRequest<T> = T & {
    actorId?: string;
    tenantId?: string;
};
type RuntimeGovernanceOperationsOverview = {
    generatedAt: string;
    summary: {
        backlog: number;
        stalledCallbacks: number;
        highRiskBacklog: number;
        blockedActions: number;
    };
    receipts: RuntimeGovernanceReceipt[];
    stalledReceipts: RuntimeGovernanceCallbackStallDetail[];
};
export declare class RuntimeGovernanceService {
    private readonly prisma;
    private readonly integrationOrchestrationService;
    private readonly trustGovernanceService;
    constructor(prisma: PrismaService, integrationOrchestrationService: IntegrationOrchestrationService, trustGovernanceService: TrustGovernanceService);
    submitAction(input: RuntimeGovernanceScopedSubmitRequest): Promise<RuntimeGovernanceReceipt>;
    getActionReceipt(receiptCode: string): Promise<RuntimeGovernanceReceipt>;
    syncAction(receiptCode: string, input: RuntimeGovernanceScopedActionRequest<RuntimeGovernanceSyncRequest>): Promise<RuntimeGovernanceReceipt>;
    recordCallback(receiptCode: string, input: RuntimeGovernanceScopedActionRequest<RuntimeGovernanceCallbackRequest>): Promise<RuntimeGovernanceReceipt>;
    replayAction(receiptCode: string, input: RuntimeGovernanceScopedActionRequest<RuntimeGovernanceReplayRequest>): Promise<RuntimeGovernanceReceipt>;
    getOperationsOverview(tenantId?: string, now?: string | Date): Promise<RuntimeGovernanceOperationsOverview>;
    getDescriptor(): FoundationModuleDescriptor;
    private buildRateLimitDecision;
    private createSubmitReceipt;
    private listActionReceiptEntries;
    private matchesTenant;
    private isBacklogReceipt;
    private resolveActionState;
    private buildTicket;
    private buildSyncContract;
    private buildCallbackReceipt;
    private buildLedgerRecord;
    private buildReplayPolicy;
    private buildReceiptCode;
    private recordDuplicateAuditAndEvent;
    private toEventRecord;
    private mergeReceipt;
    private asRuntimeReceipt;
    private asPartialReceipt;
    private getJsonRecord;
}
export {};
//# sourceMappingURL=runtime-governance.service.d.ts.map