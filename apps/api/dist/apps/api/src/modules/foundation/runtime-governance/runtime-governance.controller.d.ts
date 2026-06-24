import type { RequestTenantContext } from '../../tenant/tenant.types';
import { type CurrentActorValue } from '../identity-access/identity-access.decorator';
import { BatchReplayRuntimeGovernanceActionDto, RecordRuntimeGovernanceCallbackDto, ReplayRuntimeGovernanceActionDto, SubmitRuntimeGovernanceActionDto, SyncRuntimeGovernanceActionDto } from './runtime-governance.dto';
import { RuntimeGovernanceService } from './runtime-governance.service';
export declare class RuntimeGovernanceController {
    private readonly runtimeGovernanceService;
    constructor(runtimeGovernanceService: RuntimeGovernanceService);
    submitAction(body: SubmitRuntimeGovernanceActionDto, tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue): Promise<import("@m5/types").RuntimeGovernanceReceipt>;
    getActionReceipt(receiptCode: string): Promise<import("@m5/types").RuntimeGovernanceReceipt>;
    syncAction(receiptCode: string, body: SyncRuntimeGovernanceActionDto, tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue): Promise<import("@m5/types").RuntimeGovernanceReceipt>;
    recordCallback(receiptCode: string, body: RecordRuntimeGovernanceCallbackDto, tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue): Promise<import("@m5/types").RuntimeGovernanceReceipt>;
    replayAction(receiptCode: string, body: ReplayRuntimeGovernanceActionDto, tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue): Promise<import("@m5/types").RuntimeGovernanceReceipt>;
    batchReplayActions(body: BatchReplayRuntimeGovernanceActionDto, tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue): Promise<{
        generatedAt: string;
        total: number;
        items: {
            receiptCode: string;
            receipt: import("@m5/types").RuntimeGovernanceReceipt;
        }[];
    }>;
}
//# sourceMappingURL=runtime-governance.controller.d.ts.map