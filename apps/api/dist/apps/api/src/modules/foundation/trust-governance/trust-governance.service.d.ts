import { FoundationScopeType, QuotaPeriod } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { FoundationGovernanceBaseline, FoundationModuleDescriptor } from '../foundation.types';
interface RateLimitInput {
    scopeKey: string;
    limit: number;
    windowSeconds: number;
    blockSeconds?: number;
}
interface RateLimitPolicyMutationInput {
    code: string;
    scopeType: keyof typeof FoundationScopeType;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    integrationAppId?: string;
    period: keyof typeof QuotaPeriod;
    limit: number;
    burstLimit?: number;
    dimensionKeys?: string[];
    algorithm?: string;
    metadata?: Record<string, unknown>;
    requestedBy?: string;
    approvalTicket?: string;
    approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
}
interface AiUsageInput {
    tenantId: string;
    purpose: string;
    prompt?: string;
    estimatedTokens?: number;
}
export declare class TrustGovernanceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly aiBudgets;
    getManagementMetadata(): {
        operation: string;
        rbac: {
            resource: string;
            action: string;
            requiredRoles: string[];
            requiredPermissions: string[];
        };
        approval: {
            required: boolean;
            approvalId: any;
            version: any;
            requestedBy: any;
            ticket: any;
            status: any;
            submitted: any;
            persisted: any;
            decidedBy: any;
            decidedAt: any;
            updatedAt: any;
            execution: any;
        };
    }[];
    listGovernanceApprovals(filters?: {
        limit?: number;
        approvalTicket?: string;
        operation?: string;
        resourceType?: string;
        resourceKey?: string;
        requestedBy?: string;
        decidedBy?: string;
        status?: 'PENDING' | 'APPROVED' | 'REJECTED';
        tenantId?: string;
        from?: string;
        to?: string;
        executed?: boolean;
        executionStatus?: string;
        hasFailures?: boolean;
        failureStatus?: string;
    }): Promise<any>;
    getGovernanceApprovalDetail(approvalTicket: string): Promise<any>;
    getGovernanceApprovalTimeline(approvalTicket: string, limit?: number): Promise<{
        approval: any;
        audits: any;
    }>;
    getOperationsOverview(): Promise<{
        generatedAt: string;
        approvals: any;
        audits: any;
        rateLimit: {
            policies: {
                total: any;
                tenantScoped: any;
                runtimeManaged: any;
            };
            ledgers: {
                total: any;
                blocked: any;
                exhausted: any;
            };
        };
    }>;
    summarizeGovernanceApprovals(filters?: {
        approvalTicket?: string;
        operation?: string;
        resourceType?: string;
        resourceKey?: string;
        requestedBy?: string;
        decidedBy?: string;
        status?: 'PENDING' | 'APPROVED' | 'REJECTED';
        tenantId?: string;
        from?: string;
        to?: string;
        executed?: boolean;
        executionStatus?: string;
        hasFailures?: boolean;
        failureStatus?: string;
        groupBy?: Array<'operation' | 'resourceType' | 'status' | 'executionStatus' | 'failureStatus' | 'requestedBy'>;
    }): Promise<any>;
    approveGovernanceApproval(approvalTicket: string, input: {
        decidedBy: string;
        decisionNote?: string;
        expectedVersion?: number;
    }): Promise<{
        status: string;
        approval: any;
        governance: {
            operation: string;
            rbac: {
                resource: string;
                action: string;
                requiredRoles: string[];
                requiredPermissions: string[];
            };
            approval: {
                required: boolean;
                approvalId: any;
                version: any;
                requestedBy: any;
                ticket: any;
                status: any;
                submitted: any;
                persisted: any;
                decidedBy: any;
                decidedAt: any;
                updatedAt: any;
                execution: any;
            };
        };
    }>;
    rejectGovernanceApproval(approvalTicket: string, input: {
        decidedBy: string;
        decisionNote?: string;
        expectedVersion?: number;
    }): Promise<{
        status: string;
        approval: any;
        governance: {
            operation: string;
            rbac: {
                resource: string;
                action: string;
                requiredRoles: string[];
                requiredPermissions: string[];
            };
            approval: {
                required: boolean;
                approvalId: any;
                version: any;
                requestedBy: any;
                ticket: any;
                status: any;
                submitted: any;
                persisted: any;
                decidedBy: any;
                decidedAt: any;
                updatedAt: any;
                execution: any;
            };
        };
    }>;
    cancelGovernanceApproval(approvalTicket: string, input: {
        operatorId: string;
        reason?: string;
        expectedVersion?: number;
    }): Promise<{
        status: string;
        approval: any;
        governance: {
            operation: string;
            rbac: {
                resource: string;
                action: string;
                requiredRoles: string[];
                requiredPermissions: string[];
            };
            approval: {
                required: boolean;
                approvalId: any;
                version: any;
                requestedBy: any;
                ticket: any;
                status: any;
                submitted: any;
                persisted: any;
                decidedBy: any;
                decidedAt: any;
                updatedAt: any;
                execution: any;
            };
        };
    }>;
    resubmitGovernanceApproval(approvalTicket: string, input: {
        operatorId: string;
        reason?: string;
        expectedVersion?: number;
    }): Promise<{
        status: string;
        supersededTicket: any;
        approval: any;
        governance: {
            operation: string;
            rbac: {
                resource: string;
                action: string;
                requiredRoles: string[];
                requiredPermissions: string[];
            };
            approval: {
                required: boolean;
                approvalId: any;
                version: any;
                requestedBy: any;
                ticket: any;
                status: any;
                submitted: any;
                persisted: any;
                decidedBy: any;
                decidedAt: any;
                updatedAt: any;
                execution: any;
            };
        };
    }>;
    recordAudit(eventType: string, details: Record<string, unknown>, context?: {
        tenantId?: string;
        actorId?: string;
        source?: string;
        riskLevel?: 'low' | 'medium' | 'high';
    }): Promise<{
        retention: string;
        auditId: string;
        eventType: string;
        tenantId?: string | undefined;
        actorId?: string | undefined;
        source?: string | undefined;
        riskLevel: "high" | "medium" | "low";
        occurredAt: string;
        details: Record<string, unknown>;
    }>;
    getAuditRecords(filters?: {
        limit?: number;
        tenantId?: string;
        action?: string;
        source?: string;
        requestId?: string;
        actorId?: string;
        approvalTicket?: string;
        riskLevel?: 'low' | 'medium' | 'high';
        purpose?: string;
        from?: string;
        to?: string;
    }): Promise<any>;
    summarizeAuditRecords(filters?: {
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
    }): Promise<any>;
    evaluateRateLimit(input: RateLimitInput): Promise<any>;
    listRateLimitPolicies(filters: {
        code?: string;
        tenantId?: string;
        brandId?: string;
        storeId?: string;
        integrationAppId?: string;
    }): Promise<any>;
    upsertRateLimitPolicy(input: RateLimitPolicyMutationInput): Promise<{
        status: string;
        policy: {
            id: string;
            code: string;
            scopeType: import("@prisma/client").$Enums.FoundationScopeType;
            tenantId: string | null;
            brandId: string | null;
            storeId: string | null;
            integrationAppId: string | null;
            period: import("@prisma/client").$Enums.QuotaPeriod;
            limit: number;
            burstLimit: number | null;
            dimensionKeys: string[];
            algorithm: string;
            metadata: Record<string, unknown>;
            updatedAt: string;
        };
        governance: {
            operation: string;
            rbac: {
                resource: string;
                action: string;
                requiredRoles: string[];
                requiredPermissions: string[];
            };
            approval: {
                required: boolean;
                approvalId: any;
                version: any;
                requestedBy: any;
                ticket: any;
                status: any;
                submitted: any;
                persisted: any;
                decidedBy: any;
                decidedAt: any;
                updatedAt: any;
                execution: any;
            };
        };
    }>;
    listQuotaLedgers(filters: {
        policyCode?: string;
        subjectKey?: string;
        tenantId?: string;
        limit?: number;
    }): Promise<any>;
    resetQuotaLedgers(input: {
        policyCode?: string;
        ledgerId?: string;
        subjectKey?: string;
        resetAllActive?: boolean;
        requestedBy?: string;
        approvalTicket?: string;
        approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
    }): Promise<{
        status: string;
        count: number;
        ledgers: never[];
        approvalRequest: any;
        governance: {
            operation: string;
            rbac: {
                resource: string;
                action: string;
                requiredRoles: string[];
                requiredPermissions: string[];
            };
            approval: {
                required: boolean;
                approvalId: any;
                version: any;
                requestedBy: any;
                ticket: any;
                status: any;
                submitted: any;
                persisted: any;
                decidedBy: any;
                decidedAt: any;
                updatedAt: any;
                execution: any;
            };
        };
    } | {
        status: string;
        count: any;
        ledgers: any;
        governance: {
            operation: string;
            rbac: {
                resource: string;
                action: string;
                requiredRoles: string[];
                requiredPermissions: string[];
            };
            approval: {
                required: boolean;
                approvalId: any;
                version: any;
                requestedBy: any;
                ticket: any;
                status: any;
                submitted: any;
                persisted: any;
                decidedBy: any;
                decidedAt: any;
                updatedAt: any;
                execution: any;
            };
        };
        approvalRequest?: undefined;
    }>;
    maskPii<T>(payload: T): T;
    reviewAiInvocation(modelCode: string, usage: AiUsageInput & {
        toolAccess?: string[];
    }): {
        modelCode: string;
        tenantId: string;
        purpose: string;
        verdict: string;
        riskScore: number;
        maskedPrompt: string;
        findings: string[];
        budget: {
            monthlyBudgetTokens: number;
            remainingTokens: number;
        } | {
            monthlyBudgetTokens: number;
            remainingTokens: number;
        };
        controls: string[];
    };
    getGovernanceBaselines(): FoundationGovernanceBaseline[];
    getDescriptor(): FoundationModuleDescriptor;
    private serializeRateLimitState;
    private maskValue;
    private toAuditRecord;
    private getJsonRecord;
    private getRiskLevel;
    private toRateLimitPolicyRecord;
    private toQuotaLedgerRecord;
    private ensureRuntimeRateLimitPolicy;
    private buildRuntimePolicyCode;
    private resolveQuotaPeriod;
    private computeResetAt;
    private getDate;
    private isUniqueConstraintError;
    private handleApprovalExecutionFailure;
    private buildGovernanceMetadata;
    private buildResourceKey;
    private toInputJsonValue;
}
export {};
//# sourceMappingURL=trust-governance.service.d.ts.map