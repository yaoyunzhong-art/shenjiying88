export declare class AuditRecordDto {
    eventType: string;
    details: Record<string, unknown>;
    tenantId?: string;
    actorId?: string;
    source?: string;
    riskLevel?: 'low' | 'medium' | 'high';
}
export declare class AuditQueryDto {
    limit?: number;
    tenantId?: string;
    action?: string;
    source?: string;
    requestId?: string;
    actorId?: string;
    approvalTicket?: string;
    riskLevel?: 'low' | 'medium' | 'high';
    from?: string;
    to?: string;
}
export declare class ApprovalTimelineQueryDto {
    limit?: number;
}
export declare class ApprovalQueryDto {
    limit?: number;
    approvalTicket?: string;
    operation?: string;
    resourceType?: string;
    resourceKey?: string;
    requestedBy?: string;
    decidedBy?: string;
    tenantId?: string;
    from?: string;
    to?: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    executed?: boolean;
    executionStatus?: string;
    hasFailures?: boolean;
    failureStatus?: string;
    groupBy?: Array<'operation' | 'resourceType' | 'status' | 'executionStatus' | 'failureStatus' | 'requestedBy'>;
}
export declare class ApprovalDecisionDto {
    decidedBy: string;
    expectedVersion?: number;
    decisionNote?: string;
}
export declare class ApprovalLifecycleDto {
    operatorId: string;
    expectedVersion?: number;
    reason?: string;
}
export declare class RateLimitCheckDto {
    scopeKey: string;
    limit: number;
    windowSeconds: number;
    blockSeconds?: number;
}
export declare class RateLimitPolicyQueryDto {
    code?: string;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    integrationAppId?: string;
}
export declare class UpsertRateLimitPolicyDto {
    code: string;
    scopeType: 'PLATFORM' | 'TENANT' | 'BRAND' | 'STORE' | 'MARKET' | 'PORTAL' | 'USER' | 'DEVICE' | 'INTEGRATION';
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    integrationAppId?: string;
    period: 'MINUTE' | 'HOUR' | 'DAY' | 'MONTH';
    limit: number;
    burstLimit?: number;
    dimensionKeys?: string[];
    algorithm?: string;
    metadata?: Record<string, unknown>;
    requestedBy?: string;
    approvalTicket?: string;
    approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
}
export declare class QuotaLedgerQueryDto {
    policyCode?: string;
    subjectKey?: string;
    tenantId?: string;
    limit?: number;
}
export declare class ResetQuotaLedgerDto {
    policyCode?: string;
    ledgerId?: string;
    subjectKey?: string;
    resetAllActive?: boolean;
    requestedBy?: string;
    approvalTicket?: string;
    approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
}
export declare class MaskPiiDto {
    payload: Record<string, unknown>;
}
export declare class AiReviewDto {
    modelCode: string;
    tenantId: string;
    purpose: string;
    prompt?: string;
    estimatedTokens?: number;
}
//# sourceMappingURL=trust-governance.dto.d.ts.map