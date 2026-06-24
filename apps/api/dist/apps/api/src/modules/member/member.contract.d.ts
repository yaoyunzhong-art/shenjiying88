import type { RequestTenantContext } from '../tenant/tenant.types';
import type { MemberLevel, MemberProfile, MemberStatus, MemberBootstrap, MemberSession, MemberLoginResult, MemberOperationsProfile, MemberOperationsTask, MemberOperationsExecutionReceipt, MemberOperationsAction, MemberAutomationTrigger, LytMemberSnapshot, MemberProfileMutationHistoryEntry, MemberMutationApprovalResult } from './member.entity';
export interface MemberProfileContract {
    memberId: string;
    tenantContext: RequestTenantContext;
    mobile?: string;
    nickname: string;
    email?: string;
    address?: string;
    notes?: string;
    level: MemberLevel;
    status: MemberStatus;
    points: number;
    growthValue?: number;
    svipStatus?: string;
    registeredAt: string;
    lastActiveAt?: string;
    lifecycleStage?: string;
    tags?: string[];
    lastPaymentAt?: string;
    lastPaymentAmount?: number;
    lastPaymentOrderId?: string;
    lastPaymentChannel?: string;
    source?: string;
    persisted?: boolean;
}
export interface MemberBootstrapContract {
    tenantContext: RequestTenantContext;
    capabilities: string[];
    phase: string;
}
export interface MemberSessionContract {
    sessionToken: string;
    memberId: string;
    userId: string;
    tenantId: string;
    brandId?: string;
    storeId?: string;
    issuedAt: string;
    expiresAt: string;
    authenticated: boolean;
}
export interface MemberLoginResultContract {
    member: MemberProfileContract;
    session: MemberSessionContract;
}
export interface MemberOperationsProfileContract {
    memberId: string;
    tenantContext: RequestTenantContext;
    level: MemberLevel;
    status: MemberStatus;
    lifecycleStage: string;
    audienceSegments: string[];
    recommendedActions: MemberOperationsActionContract[];
    automationTriggers: MemberAutomationTriggerContract[];
    lastPaymentAt?: string;
    lastPaymentAmount?: number;
    lastPaymentChannel?: string;
    tags: string[];
    source?: string;
}
export interface MemberOperationsActionContract {
    code: string;
    label: string;
    reason: string;
    channel: string;
    priority: string;
}
export interface MemberAutomationTriggerContract {
    code: string;
    status: string;
    source: string;
    reason: string;
}
export interface MemberOperationsTaskContract {
    taskId: string;
    tenantContext: RequestTenantContext;
    memberId: string;
    actionCode: string;
    title: string;
    reason: string;
    channel: string;
    priority: string;
    status: string;
    executionLane: string;
    source: string;
    sourceOrderId?: string;
    sourcePaymentId?: string;
    executionSummary?: string;
    executionTargetId?: string;
    executedAt?: string;
    dedupeKey: string;
    createdAt: string;
    scheduledAt: string;
}
export interface MemberOperationsExecutionReceiptContract {
    executionId: string;
    tenantContext: RequestTenantContext;
    memberId: string;
    taskId: string;
    actionCode: string;
    targetType: string;
    targetId: string;
    status: string;
    summary: string;
    payload: Record<string, unknown>;
    runtimeReceiptCode?: string;
    runtimeState?: string;
    runtimeReplayable?: boolean;
    executedAt: string;
}
export interface MemberProfileMutationHistoryContract {
    historyId: string;
    tenantContext: RequestTenantContext;
    memberId: string;
    action: string;
    summary: string;
    sourceChannel: string;
    operatorId: string;
    payload?: Record<string, unknown>;
    beforeValue?: Record<string, unknown>;
    afterValue?: Record<string, unknown>;
    createdAt: string;
}
export interface MemberMutationApprovalResultContract {
    memberId: string;
    applied: boolean;
    approvalRequired: boolean;
    approvalTicket: string | null;
    approvalStatus: string;
    operation: string;
    summary: string;
}
export interface LytMemberSnapshotContract {
    snapshotId: string;
    tenantContext: RequestTenantContext;
    memberProfileId?: string;
    externalMemberId: string;
    memberCode?: string;
    mobile?: string;
    nickname?: string;
    levelCode?: string;
    points: number;
    growthValue: number;
    status: string;
    updatedAtFromSource: string;
    rawVersion?: string;
    rawPayload?: Record<string, unknown>;
    source?: string;
}
export declare function toMemberProfileContract(profile: MemberProfile): MemberProfileContract;
export declare function toMemberBootstrapContract(bootstrap: MemberBootstrap): MemberBootstrapContract;
export declare function toMemberSessionContract(session: MemberSession): MemberSessionContract;
export declare function toMemberLoginResultContract(result: MemberLoginResult): MemberLoginResultContract;
export declare function toMemberOperationsProfileContract(profile: MemberOperationsProfile): MemberOperationsProfileContract;
export declare function toMemberOperationsActionContract(action: MemberOperationsAction): MemberOperationsActionContract;
export declare function toMemberAutomationTriggerContract(trigger: MemberAutomationTrigger): MemberAutomationTriggerContract;
export declare function toMemberOperationsTaskContract(task: MemberOperationsTask): MemberOperationsTaskContract;
export declare function toMemberOperationsExecutionReceiptContract(receipt: MemberOperationsExecutionReceipt): MemberOperationsExecutionReceiptContract;
export declare function toMemberProfileMutationHistoryContract(entry: MemberProfileMutationHistoryEntry): MemberProfileMutationHistoryContract;
export declare function toMemberMutationApprovalResultContract(result: MemberMutationApprovalResult): MemberMutationApprovalResultContract;
export declare function toLytMemberSnapshotContract(snapshot: LytMemberSnapshot): LytMemberSnapshotContract;
//# sourceMappingURL=member.contract.d.ts.map