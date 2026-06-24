import { PrismaService } from '../../../prisma/prisma.service';
import { GovernanceApprovalCancelInput, GovernanceApprovalDecisionInput, GovernanceApprovalExecutionFailureInput, GovernanceApprovalExecutionInput, GovernanceApprovalQueryInput, GovernanceApprovalResubmitInput, GovernanceApprovalSnapshot, MaterializeGovernanceApprovalInput, resubmitGovernanceApproval, summarizeGovernanceApprovals } from './governance-approval';
import { RuntimeGovernanceService } from '../runtime-governance/runtime-governance.service';
/**
 * 审批状态变化的钩子阶段，决定下游模块如何解读此次结果。
 */
export type GovernanceApprovalOutcomeStage = 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'SUPERSEDED' | 'EXECUTED' | 'EXECUTION_FAILED' | 'RESUBMITTED';
/**
 * 审批结果事件：approval service 在状态变化时一次性派发。
 * 下游模块按 resourceType 决定是否消费，例如 member 模块把它落进 AuditLog。
 */
export interface GovernanceApprovalOutcomeEvent {
    resourceType: string;
    resourceKey: string;
    stage: GovernanceApprovalOutcomeStage;
    approval: GovernanceApprovalSnapshot;
    tenantId: string | null;
    brandId: string | null;
    storeId: string | null;
    decisionNote?: string | null;
    failureReason?: string | null;
    previousStatus?: GovernanceApprovalSnapshot['status'];
}
export type GovernanceApprovalOutcomeHook = (event: GovernanceApprovalOutcomeEvent) => Promise<void> | void;
export declare class GovernanceApprovalService {
    private readonly prisma;
    private readonly runtimeGovernanceService;
    private readonly outcomeHooks;
    constructor(prisma: PrismaService, runtimeGovernanceService: RuntimeGovernanceService);
    registerApprovalOutcomeHook(resourceType: string, hook: GovernanceApprovalOutcomeHook): () => void;
    listApprovals(query: GovernanceApprovalQueryInput): Promise<GovernanceApprovalSnapshot[]>;
    summarizeApprovals(query: GovernanceApprovalQueryInput): Promise<ReturnType<typeof summarizeGovernanceApprovals>>;
    getApproval(ticket: string): Promise<GovernanceApprovalSnapshot>;
    materializeApproval(input: MaterializeGovernanceApprovalInput): Promise<GovernanceApprovalSnapshot>;
    decideApproval(input: GovernanceApprovalDecisionInput): Promise<GovernanceApprovalSnapshot>;
    cancelApproval(input: GovernanceApprovalCancelInput): Promise<GovernanceApprovalSnapshot>;
    resubmitApproval(input: GovernanceApprovalResubmitInput): Promise<ReturnType<typeof resubmitGovernanceApproval>>;
    markExecuted(input: GovernanceApprovalExecutionInput): Promise<GovernanceApprovalSnapshot>;
    markExecutionFailed(input: GovernanceApprovalExecutionFailureInput): Promise<GovernanceApprovalSnapshot>;
    private fetchApprovalStatus;
    private emitOutcome;
    private resumeRuntimeReplayIfNeeded;
}
//# sourceMappingURL=governance-approval.service.d.ts.map