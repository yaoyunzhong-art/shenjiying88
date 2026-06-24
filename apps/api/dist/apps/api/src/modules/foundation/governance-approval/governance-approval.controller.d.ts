import { GovernanceApprovalCancelInput, GovernanceApprovalDecisionInput, GovernanceApprovalExecutionFailureInput, GovernanceApprovalExecutionInput, GovernanceApprovalQueryInput, GovernanceApprovalResubmitInput, GovernanceApprovalSnapshot, MaterializeGovernanceApprovalInput, resubmitGovernanceApproval, summarizeGovernanceApprovals } from './governance-approval';
import { GovernanceApprovalService } from './governance-approval.service';
export declare class GovernanceApprovalController {
    private readonly governanceApprovalService;
    constructor(governanceApprovalService: GovernanceApprovalService);
    listApprovals(query: GovernanceApprovalQueryInput): Promise<GovernanceApprovalSnapshot[]>;
    summarizeApprovals(query: GovernanceApprovalQueryInput): Promise<ReturnType<typeof summarizeGovernanceApprovals>>;
    getApproval(ticket: string): Promise<GovernanceApprovalSnapshot>;
    materializeApproval(input: MaterializeGovernanceApprovalInput): Promise<GovernanceApprovalSnapshot>;
    decideApproval(input: GovernanceApprovalDecisionInput): Promise<GovernanceApprovalSnapshot>;
    cancelApproval(input: GovernanceApprovalCancelInput): Promise<GovernanceApprovalSnapshot>;
    resubmitApproval(input: GovernanceApprovalResubmitInput): Promise<ReturnType<typeof resubmitGovernanceApproval>>;
    markExecuted(input: GovernanceApprovalExecutionInput): Promise<GovernanceApprovalSnapshot>;
    markExecutionFailed(input: GovernanceApprovalExecutionFailureInput): Promise<GovernanceApprovalSnapshot>;
}
//# sourceMappingURL=governance-approval.controller.d.ts.map