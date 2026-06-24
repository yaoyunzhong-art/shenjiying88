import { ObservabilityQueryDto, RecoveryPlanQueryDto, RetryPolicyQueryDto, StageEdgeReplayDto } from './resilience-operations.dto';
import { ResilienceOperationsService } from './resilience-operations.service';
export declare class ResilienceOperationsController {
    private readonly resilienceOperationsService;
    constructor(resilienceOperationsService: ResilienceOperationsService);
    getManagementMetadata(): unknown;
    getOperationsOverview(): unknown;
    getObservabilitySignals(query: ObservabilityQueryDto): unknown;
    getRetryPolicies(query: RetryPolicyQueryDto): unknown;
    getRecoveryPlans(query: RecoveryPlanQueryDto): unknown;
    getRecoveryPlan(resource: string): unknown;
    stageEdgeReplay(body: StageEdgeReplayDto): unknown;
}
//# sourceMappingURL=resilience-operations.controller.d.ts.map