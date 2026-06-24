import { ApprovalDecisionDto, ApprovalLifecycleDto, ApprovalQueryDto, ApprovalTimelineQueryDto, AiReviewDto, AuditQueryDto, AuditRecordDto, MaskPiiDto, QuotaLedgerQueryDto, RateLimitCheckDto, RateLimitPolicyQueryDto, ResetQuotaLedgerDto, UpsertRateLimitPolicyDto } from './trust-governance.dto';
import { TrustGovernanceService } from './trust-governance.service';
export declare class TrustGovernanceController {
    private readonly trustGovernanceService;
    constructor(trustGovernanceService: TrustGovernanceService);
    getManagementMetadata(): unknown;
    getOperationsOverview(): Promise<unknown>;
    getApprovals(query: ApprovalQueryDto): Promise<unknown>;
    getApprovalSummary(query: ApprovalQueryDto): Promise<unknown>;
    getApprovalDetail(approvalTicket: string): Promise<unknown>;
    getApprovalTimeline(approvalTicket: string, query: ApprovalTimelineQueryDto): Promise<unknown>;
    approveApproval(approvalTicket: string, body: ApprovalDecisionDto): Promise<unknown>;
    rejectApproval(approvalTicket: string, body: ApprovalDecisionDto): Promise<unknown>;
    cancelApproval(approvalTicket: string, body: ApprovalLifecycleDto): Promise<unknown>;
    resubmitApproval(approvalTicket: string, body: ApprovalLifecycleDto): Promise<unknown>;
    getAudit(query: AuditQueryDto): Promise<unknown>;
    getAuditSummary(query: AuditQueryDto): Promise<unknown>;
    recordAudit(body: AuditRecordDto): Promise<unknown>;
    checkRateLimit(body: RateLimitCheckDto): Promise<unknown>;
    getRateLimitPolicies(query: RateLimitPolicyQueryDto): Promise<unknown>;
    saveRateLimitPolicy(body: UpsertRateLimitPolicyDto): Promise<unknown>;
    getQuotaLedgers(query: QuotaLedgerQueryDto): Promise<unknown>;
    resetQuotaLedgers(body: ResetQuotaLedgerDto): Promise<unknown>;
    maskPii(body: MaskPiiDto): unknown;
    reviewAi(body: AiReviewDto): unknown;
}
//# sourceMappingURL=trust-governance.controller.d.ts.map