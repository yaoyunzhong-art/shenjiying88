import { FoundationScopeType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
export type GovernanceApprovalStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'SUPERSEDED';
export interface GovernanceApprovalSnapshot {
    approvalId: string | null;
    operation?: string;
    resourceType?: string;
    resourceKey?: string;
    required: boolean;
    version: number | null;
    requestedBy: string | null;
    ticket: string | null;
    status: GovernanceApprovalStatus;
    submitted: boolean;
    persisted: boolean;
    decidedBy: string | null;
    decidedAt: string | null;
    updatedAt: string | null;
    execution?: {
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
    summary?: Record<string, unknown> | null;
}
export interface MaterializeGovernanceApprovalInput {
    operation: string;
    resourceType: string;
    resourceKey: string;
    scopeType?: FoundationScopeType | keyof typeof FoundationScopeType;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    approvalRequired: boolean;
    requestedBy?: string;
    approvalTicket?: string;
    approvalStatus?: GovernanceApprovalStatus;
    requestPayload?: Record<string, unknown>;
    summary?: Record<string, unknown>;
}
export interface GovernanceApprovalQueryInput {
    limit?: number;
    approvalTicket?: string;
    operation?: string;
    resourceType?: string;
    resourceKey?: string;
    requestedBy?: string;
    decidedBy?: string;
    status?: GovernanceApprovalStatus;
    operationIn?: string[];
    resourceTypeIn?: string[];
    tenantId?: string;
    from?: string;
    to?: string;
    executed?: boolean;
    executionStatus?: string;
    hasFailures?: boolean;
    failureStatus?: string;
    groupBy?: GovernanceApprovalGroupBy[];
}
export type GovernanceApprovalGroupBy = 'operation' | 'resourceType' | 'status' | 'executionStatus' | 'failureStatus' | 'requestedBy';
export interface GovernanceApprovalDecisionInput {
    approvalTicket: string;
    decidedBy: string;
    decisionNote?: string;
    summary?: Record<string, unknown>;
    expectedVersion?: number;
    status: 'APPROVED' | 'REJECTED';
}
export interface GovernanceApprovalCancelInput {
    approvalTicket: string;
    cancelledBy: string;
    cancelReason?: string;
    expectedVersion?: number;
}
export interface GovernanceApprovalResubmitInput {
    approvalTicket: string;
    resubmittedBy: string;
    resubmitReason?: string;
    expectedVersion?: number;
}
export interface GovernanceApprovalExecutionInput {
    approvalTicket: string;
    executedBy: string;
    executionStatus: string;
    expectedVersion?: number;
    summary?: Record<string, unknown>;
}
export interface GovernanceApprovalExecutionFailureInput {
    approvalTicket: string;
    failedBy: string;
    failureStatus: string;
    failureReason: string;
    expectedVersion?: number;
    summary?: Record<string, unknown>;
}
export declare function materializeGovernanceApproval(prisma: PrismaService, input: MaterializeGovernanceApprovalInput): Promise<GovernanceApprovalSnapshot>;
export declare function listGovernanceApprovals(prisma: PrismaService, input?: GovernanceApprovalQueryInput): Promise<{
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
export declare function summarizeGovernanceApprovals(prisma: PrismaService, input?: GovernanceApprovalQueryInput): Promise<{
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
export declare function getGovernanceApprovalDetail(prisma: PrismaService, approvalTicket: string): Promise<{
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
export declare function decideGovernanceApproval(prisma: PrismaService, input: GovernanceApprovalDecisionInput): Promise<{
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
export declare function cancelGovernanceApproval(prisma: PrismaService, input: GovernanceApprovalCancelInput): Promise<{
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
export declare function resubmitGovernanceApproval(prisma: PrismaService, input: GovernanceApprovalResubmitInput): Promise<{
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
}>;
export declare function getGovernanceApprovalByTicket(prisma: PrismaService, approvalTicket: string): Promise<{
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
export declare function markGovernanceApprovalExecuted(prisma: PrismaService, input: GovernanceApprovalExecutionInput): Promise<{
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
export declare function markGovernanceApprovalExecutionFailed(prisma: PrismaService, input: GovernanceApprovalExecutionFailureInput): Promise<{
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
export declare function isGovernanceApprovalExecuted(summary: unknown): boolean;
//# sourceMappingURL=governance-approval.d.ts.map