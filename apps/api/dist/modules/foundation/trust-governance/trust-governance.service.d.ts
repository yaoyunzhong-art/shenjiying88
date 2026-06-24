import { FoundationScopeType, QuotaPeriod } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { type GovernanceApprovalSnapshot } from '../governance-approval/governance-approval';
import type { FoundationGovernanceBaseline, FoundationModuleDescriptor } from '../foundation.types';
interface AuditRecord {
    auditId: string;
    eventType: string;
    tenantId?: string;
    actorId?: string;
    source?: string;
    riskLevel: 'low' | 'medium' | 'high';
    occurredAt: string;
    details: Record<string, unknown>;
}
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
            approvalId: string | null;
            version: number | null;
            requestedBy: string | null;
            ticket: string | null;
            status: import("../governance-approval/governance-approval").GovernanceApprovalStatus;
            submitted: boolean;
            persisted: boolean;
            decidedBy: string | null;
            decidedAt: string | null;
            updatedAt: string | null;
            execution: {
                attempts: number;
                executed: boolean;
                executionStatus: string | null;
                executedAt: string | null;
                executedBy: string | null;
                lastFailure: {
                    failureStatus: string | null;
                    failureReason: string | null;
                    failedAt: string | null;
                    failedBy: string | null;
                } | null;
            };
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
    }): Promise<{
        submitted: boolean;
        persisted: boolean;
        approvalId: string;
        operation: string;
        resourceType: string;
        resourceKey: string;
        required: boolean;
        version: number;
        requestedBy: string | null;
        ticket: string | null;
        status: import("@prisma/client").$Enums.ApprovalStatus;
        decidedBy: string | null;
        decidedAt: string | null;
        updatedAt: string;
        execution: {
            attempts: number;
            executed: boolean;
            executionStatus: string | null;
            executedAt: string | null;
            executedBy: string | null;
            lastFailure: {
                failureStatus: string | null;
                failureReason: string | null;
                failedAt: string | null;
                failedBy: string | null;
            } | null;
        };
        summary: Record<string, unknown> | null;
    }[]>;
    getGovernanceApprovalDetail(approvalTicket: string): Promise<{
        submitted: boolean;
        persisted: boolean;
        approvalId: string;
        operation: string;
        resourceType: string;
        resourceKey: string;
        required: boolean;
        version: number;
        requestedBy: string | null;
        ticket: string | null;
        status: import("@prisma/client").$Enums.ApprovalStatus;
        decidedBy: string | null;
        decidedAt: string | null;
        updatedAt: string;
        execution: {
            attempts: number;
            executed: boolean;
            executionStatus: string | null;
            executedAt: string | null;
            executedBy: string | null;
            lastFailure: {
                failureStatus: string | null;
                failureReason: string | null;
                failedAt: string | null;
                failedBy: string | null;
            } | null;
        };
        summary: Record<string, unknown> | null;
    }>;
    getGovernanceApprovalTimeline(approvalTicket: string, limit?: number): Promise<{
        approval: {
            submitted: boolean;
            persisted: boolean;
            approvalId: string;
            operation: string;
            resourceType: string;
            resourceKey: string;
            required: boolean;
            version: number;
            requestedBy: string | null;
            ticket: string | null;
            status: import("@prisma/client").$Enums.ApprovalStatus;
            decidedBy: string | null;
            decidedAt: string | null;
            updatedAt: string;
            execution: {
                attempts: number;
                executed: boolean;
                executionStatus: string | null;
                executedAt: string | null;
                executedBy: string | null;
                lastFailure: {
                    failureStatus: string | null;
                    failureReason: string | null;
                    failedAt: string | null;
                    failedBy: string | null;
                } | null;
            };
            summary: Record<string, unknown> | null;
        };
        audits: AuditRecord[];
    }>;
    getOperationsOverview(): Promise<{
        generatedAt: string;
        approvals: {
            groups: {
                dimensions: Record<string, string | null>;
                total: number;
                statuses: {
                    NOT_REQUIRED: number;
                    PENDING: number;
                    APPROVED: number;
                    REJECTED: number;
                    CANCELLED: number;
                    SUPERSEDED: number;
                };
                execution: {
                    executed: number;
                    pending: number;
                    withFailures: number;
                    byExecutionStatus: Record<string, number>;
                    byFailureStatus: Record<string, number>;
                };
            }[];
            total: number;
            statuses: {
                NOT_REQUIRED: number;
                PENDING: number;
                APPROVED: number;
                REJECTED: number;
                CANCELLED: number;
                SUPERSEDED: number;
            };
            execution: {
                executed: number;
                pending: number;
                withFailures: number;
                byExecutionStatus: Record<string, number>;
                byFailureStatus: Record<string, number>;
            };
        };
        audits: {
            total: number;
            byAction: Record<string, number>;
            bySource: Record<string, number>;
            byRiskLevel: Record<"low" | "medium" | "high", number>;
        };
        rateLimit: {
            policies: {
                total: number;
                tenantScoped: number;
                runtimeManaged: number;
            };
            ledgers: {
                total: number;
                blocked: number;
                exhausted: number;
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
    }): Promise<{
        groups: {
            dimensions: Record<string, string | null>;
            total: number;
            statuses: {
                NOT_REQUIRED: number;
                PENDING: number;
                APPROVED: number;
                REJECTED: number;
                CANCELLED: number;
                SUPERSEDED: number;
            };
            execution: {
                executed: number;
                pending: number;
                withFailures: number;
                byExecutionStatus: Record<string, number>;
                byFailureStatus: Record<string, number>;
            };
        }[];
        total: number;
        statuses: {
            NOT_REQUIRED: number;
            PENDING: number;
            APPROVED: number;
            REJECTED: number;
            CANCELLED: number;
            SUPERSEDED: number;
        };
        execution: {
            executed: number;
            pending: number;
            withFailures: number;
            byExecutionStatus: Record<string, number>;
            byFailureStatus: Record<string, number>;
        };
    }>;
    approveGovernanceApproval(approvalTicket: string, input: {
        decidedBy: string;
        decisionNote?: string;
        expectedVersion?: number;
    }): Promise<{
        status: string;
        approval: {
            submitted: boolean;
            persisted: boolean;
            approvalId: string;
            operation: string;
            resourceType: string;
            resourceKey: string;
            required: boolean;
            version: number;
            requestedBy: string | null;
            ticket: string | null;
            status: import("@prisma/client").$Enums.ApprovalStatus;
            decidedBy: string | null;
            decidedAt: string | null;
            updatedAt: string;
            execution: {
                attempts: number;
                executed: boolean;
                executionStatus: string | null;
                executedAt: string | null;
                executedBy: string | null;
                lastFailure: {
                    failureStatus: string | null;
                    failureReason: string | null;
                    failedAt: string | null;
                    failedBy: string | null;
                } | null;
            };
            summary: Record<string, unknown> | null;
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
                approvalId: string | null;
                version: number | null;
                requestedBy: string | null;
                ticket: string | null;
                status: import("../governance-approval/governance-approval").GovernanceApprovalStatus;
                submitted: boolean;
                persisted: boolean;
                decidedBy: string | null;
                decidedAt: string | null;
                updatedAt: string | null;
                execution: {
                    attempts: number;
                    executed: boolean;
                    executionStatus: string | null;
                    executedAt: string | null;
                    executedBy: string | null;
                    lastFailure: {
                        failureStatus: string | null;
                        failureReason: string | null;
                        failedAt: string | null;
                        failedBy: string | null;
                    } | null;
                };
            };
        };
    }>;
    rejectGovernanceApproval(approvalTicket: string, input: {
        decidedBy: string;
        decisionNote?: string;
        expectedVersion?: number;
    }): Promise<{
        status: string;
        approval: {
            submitted: boolean;
            persisted: boolean;
            approvalId: string;
            operation: string;
            resourceType: string;
            resourceKey: string;
            required: boolean;
            version: number;
            requestedBy: string | null;
            ticket: string | null;
            status: import("@prisma/client").$Enums.ApprovalStatus;
            decidedBy: string | null;
            decidedAt: string | null;
            updatedAt: string;
            execution: {
                attempts: number;
                executed: boolean;
                executionStatus: string | null;
                executedAt: string | null;
                executedBy: string | null;
                lastFailure: {
                    failureStatus: string | null;
                    failureReason: string | null;
                    failedAt: string | null;
                    failedBy: string | null;
                } | null;
            };
            summary: Record<string, unknown> | null;
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
                approvalId: string | null;
                version: number | null;
                requestedBy: string | null;
                ticket: string | null;
                status: import("../governance-approval/governance-approval").GovernanceApprovalStatus;
                submitted: boolean;
                persisted: boolean;
                decidedBy: string | null;
                decidedAt: string | null;
                updatedAt: string | null;
                execution: {
                    attempts: number;
                    executed: boolean;
                    executionStatus: string | null;
                    executedAt: string | null;
                    executedBy: string | null;
                    lastFailure: {
                        failureStatus: string | null;
                        failureReason: string | null;
                        failedAt: string | null;
                        failedBy: string | null;
                    } | null;
                };
            };
        };
    }>;
    cancelGovernanceApproval(approvalTicket: string, input: {
        operatorId: string;
        reason?: string;
        expectedVersion?: number;
    }): Promise<{
        status: string;
        approval: {
            submitted: boolean;
            persisted: boolean;
            approvalId: string;
            operation: string;
            resourceType: string;
            resourceKey: string;
            required: boolean;
            version: number;
            requestedBy: string | null;
            ticket: string | null;
            status: import("@prisma/client").$Enums.ApprovalStatus;
            decidedBy: string | null;
            decidedAt: string | null;
            updatedAt: string;
            execution: {
                attempts: number;
                executed: boolean;
                executionStatus: string | null;
                executedAt: string | null;
                executedBy: string | null;
                lastFailure: {
                    failureStatus: string | null;
                    failureReason: string | null;
                    failedAt: string | null;
                    failedBy: string | null;
                } | null;
            };
            summary: Record<string, unknown> | null;
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
                approvalId: string | null;
                version: number | null;
                requestedBy: string | null;
                ticket: string | null;
                status: import("../governance-approval/governance-approval").GovernanceApprovalStatus;
                submitted: boolean;
                persisted: boolean;
                decidedBy: string | null;
                decidedAt: string | null;
                updatedAt: string | null;
                execution: {
                    attempts: number;
                    executed: boolean;
                    executionStatus: string | null;
                    executedAt: string | null;
                    executedBy: string | null;
                    lastFailure: {
                        failureStatus: string | null;
                        failureReason: string | null;
                        failedAt: string | null;
                        failedBy: string | null;
                    } | null;
                };
            };
        };
    }>;
    resubmitGovernanceApproval(approvalTicket: string, input: {
        operatorId: string;
        reason?: string;
        expectedVersion?: number;
    }): Promise<{
        status: string;
        supersededTicket: string | null;
        approval: {
            submitted: boolean;
            persisted: boolean;
            approvalId: string;
            operation: string;
            resourceType: string;
            resourceKey: string;
            required: boolean;
            version: number;
            requestedBy: string | null;
            ticket: string | null;
            status: import("@prisma/client").$Enums.ApprovalStatus;
            decidedBy: string | null;
            decidedAt: string | null;
            updatedAt: string;
            execution: {
                attempts: number;
                executed: boolean;
                executionStatus: string | null;
                executedAt: string | null;
                executedBy: string | null;
                lastFailure: {
                    failureStatus: string | null;
                    failureReason: string | null;
                    failedAt: string | null;
                    failedBy: string | null;
                } | null;
            };
            summary: Record<string, unknown> | null;
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
                approvalId: string | null;
                version: number | null;
                requestedBy: string | null;
                ticket: string | null;
                status: import("../governance-approval/governance-approval").GovernanceApprovalStatus;
                submitted: boolean;
                persisted: boolean;
                decidedBy: string | null;
                decidedAt: string | null;
                updatedAt: string | null;
                execution: {
                    attempts: number;
                    executed: boolean;
                    executionStatus: string | null;
                    executedAt: string | null;
                    executedBy: string | null;
                    lastFailure: {
                        failureStatus: string | null;
                        failureReason: string | null;
                        failedAt: string | null;
                        failedBy: string | null;
                    } | null;
                };
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
        tenantId?: string;
        actorId?: string;
        source?: string;
        riskLevel: "low" | "medium" | "high";
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
        from?: string;
        to?: string;
    }): Promise<AuditRecord[]>;
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
    }): Promise<{
        total: number;
        byAction: Record<string, number>;
        bySource: Record<string, number>;
        byRiskLevel: Record<"low" | "medium" | "high", number>;
    }>;
    evaluateRateLimit(input: RateLimitInput): Promise<{
        allowed: boolean;
        scopeKey: string;
        limit: number;
        remaining: number;
        retryAfterSeconds: number;
        state: {
            count: number;
            remaining: number | null;
            resetAt: string;
            blockedUntil: string | null;
            lastSeenAt: string;
        };
    }>;
    listRateLimitPolicies(filters: {
        code?: string;
        tenantId?: string;
        brandId?: string;
        storeId?: string;
        integrationAppId?: string;
    }): Promise<{
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
    }[]>;
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
                approvalId: string | null;
                version: number | null;
                requestedBy: string | null;
                ticket: string | null;
                status: import("../governance-approval/governance-approval").GovernanceApprovalStatus;
                submitted: boolean;
                persisted: boolean;
                decidedBy: string | null;
                decidedAt: string | null;
                updatedAt: string | null;
                execution: {
                    attempts: number;
                    executed: boolean;
                    executionStatus: string | null;
                    executedAt: string | null;
                    executedBy: string | null;
                    lastFailure: {
                        failureStatus: string | null;
                        failureReason: string | null;
                        failedAt: string | null;
                        failedBy: string | null;
                    } | null;
                };
            };
        };
    }>;
    listQuotaLedgers(filters: {
        policyCode?: string;
        subjectKey?: string;
        tenantId?: string;
        limit?: number;
    }): Promise<{
        id: string;
        subjectKey: string;
        period: import("@prisma/client").$Enums.QuotaPeriod;
        consumed: number;
        remaining: number | null;
        resetAt: string;
        policy: {
            id: string;
            code: string;
            limit: number;
            period: import("@prisma/client").$Enums.QuotaPeriod;
        };
        metadata: Record<string, unknown>;
        updatedAt: string;
    }[]>;
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
        approvalRequest: GovernanceApprovalSnapshot;
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
                approvalId: string | null;
                version: number | null;
                requestedBy: string | null;
                ticket: string | null;
                status: import("../governance-approval/governance-approval").GovernanceApprovalStatus;
                submitted: boolean;
                persisted: boolean;
                decidedBy: string | null;
                decidedAt: string | null;
                updatedAt: string | null;
                execution: {
                    attempts: number;
                    executed: boolean;
                    executionStatus: string | null;
                    executedAt: string | null;
                    executedBy: string | null;
                    lastFailure: {
                        failureStatus: string | null;
                        failureReason: string | null;
                        failedAt: string | null;
                        failedBy: string | null;
                    } | null;
                };
            };
        };
    } | {
        status: string;
        count: number;
        ledgers: {
            id: string;
            subjectKey: string;
            period: import("@prisma/client").$Enums.QuotaPeriod;
            consumed: number;
            remaining: number | null;
            resetAt: string;
            policy: {
                id: string;
                code: string;
                limit: number;
                period: import("@prisma/client").$Enums.QuotaPeriod;
            };
            metadata: Record<string, unknown>;
            updatedAt: string;
        }[];
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
                approvalId: string | null;
                version: number | null;
                requestedBy: string | null;
                ticket: string | null;
                status: import("../governance-approval/governance-approval").GovernanceApprovalStatus;
                submitted: boolean;
                persisted: boolean;
                decidedBy: string | null;
                decidedAt: string | null;
                updatedAt: string | null;
                execution: {
                    attempts: number;
                    executed: boolean;
                    executionStatus: string | null;
                    executedAt: string | null;
                    executedBy: string | null;
                    lastFailure: {
                        failureStatus: string | null;
                        failureReason: string | null;
                        failedAt: string | null;
                        failedBy: string | null;
                    } | null;
                };
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