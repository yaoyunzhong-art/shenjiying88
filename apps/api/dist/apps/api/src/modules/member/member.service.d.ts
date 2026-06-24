import type { RuntimeGovernanceReceipt } from '@m5/types';
import { PrismaService } from '../../prisma/prisma.service';
import { RuntimeGovernanceService } from '../foundation/runtime-governance/runtime-governance.service';
import type { RequestTenantContext } from '../tenant/tenant.types';
import { MemberLevel, MemberStatus, type MemberMutationApprovalResult, type MemberProfile, type MemberProfileMutationHistoryEntry, type MemberBootstrap, type MemberLoginResult, type MemberOperationsExecutionReceipt, type MemberOperationsProfile, type MemberOperationsTask, type LytMemberSnapshot, type MemberSession } from './member.entity';
export type { MemberBootstrap } from './member.entity';
export { MemberLevel, MemberStatus, computeMemberLevel, canUpgrade, MEMBER_LEVEL_THRESHOLDS } from './member.entity';
export declare function resetMemberServiceTestState(): void;
export declare class MemberService {
    private readonly prisma?;
    private readonly runtimeGovernanceService?;
    constructor(prisma?: PrismaService | undefined, runtimeGovernanceService?: RuntimeGovernanceService | undefined);
    private getLytMemberSnapshotModel;
    private getMemberOperationsTaskModel;
    private getMemberOperationsReceiptModel;
    private getAuditLogModel;
    private getMemberProfileExtensionModel;
    private getLytSnapshotCacheKey;
    private normalizeSnapshotString;
    private normalizeSnapshotNumber;
    private normalizeOptionalSnapshotBoolean;
    private normalizeSnapshotDateString;
    private parseMemberLevel;
    private parseMemberStatus;
    private levelRank;
    private mapApprovalSnapshot;
    private materializeMemberActionApproval;
    private getMutationHistoryCacheKey;
    private buildMemberMutationSummary;
    private recordMemberMutationHistory;
    listPersistentMutationHistory(memberId: string, tenantContext: RequestTenantContext): Promise<MemberProfileMutationHistoryEntry[]>;
    private buildApprovalOutcomeSummary;
    private toLytMemberSnapshot;
    private toMemberProfile;
    private toMemberOperationsTask;
    private toMemberOperationsExecutionReceipt;
    private toMemberOperationsTaskFromRecord;
    private toMemberOperationsReceiptFromRecord;
    private buildMemberOperationsTaskPersistenceData;
    private buildMemberOperationsReceiptPersistenceData;
    private uniqueValues;
    private buildOperationsSegments;
    private buildOperationsActions;
    private buildAutomationTriggers;
    private buildOperationsProfile;
    private resolveExecutionLane;
    private findOperationsTaskByDedupeKey;
    private createOperationsTask;
    private updateOperationsTask;
    private createOperationsReceipt;
    private updateOperationsReceipt;
    private listOperationsTasksForMember;
    private listOperationsReceiptsForMember;
    private getExecutionRuntimeAction;
    private buildExecutionRuntimePayload;
    private attachRuntimeExecutionTrace;
    private buildCouponOfferPayload;
    private buildCrmFollowUpPayload;
    private executeOperationsTask;
    private hydratePersistentProfile;
    private savePersistentSnapshotOverride;
    private findSnapshotByMemberProfileId;
    private findMemberProfileExtension;
    private saveMemberProfileExtension;
    /**
     * Returns member-scoped bootstrap diagnostics.
     *
     * Capabilities: member-center, points, svip, blind-box.
     * Phase: scaffold until member domain is fully extracted.
     */
    getBootstrap(tenantContext: RequestTenantContext): MemberBootstrap;
    /**
     * 根据会员 ID 获取会员档案
     */
    getProfile(memberId: string): MemberProfile | undefined;
    /**
     * 列出所有会员档案
     */
    listProfiles(): MemberProfile[];
    /**
     * 注册新会员
     */
    register(input: {
        memberId: string;
        tenantContext: RequestTenantContext;
        nickname: string;
    }): MemberProfile;
    /**
     * 为会员增加积分，自动重新计算等级
     */
    addPoints(memberId: string, points: number): MemberProfile;
    revokePoints(memberId: string, points: number): MemberProfile;
    private sanitizeTagSegment;
    private mergeMemberTags;
    private deriveLifecycleStage;
    recordPaymentActivity(input: {
        memberId: string;
        tenantContext: RequestTenantContext;
        orderId: string;
        amount: number;
        paidAt?: string;
        channel?: string;
        source?: 'cashier' | 'lyt-snapshot';
    }): Promise<MemberProfile>;
    awardPoints(memberId: string, points: number, tenantContext: RequestTenantContext, approvalTicket?: string): Promise<MemberProfile | MemberMutationApprovalResult>;
    rollbackPoints(memberId: string, points: number, tenantContext: RequestTenantContext, approvalTicket?: string): Promise<MemberProfile | MemberMutationApprovalResult>;
    updatePersistentStatus(memberId: string, status: MemberStatus, tenantContext: RequestTenantContext, approvalTicket?: string): Promise<MemberProfile | MemberMutationApprovalResult>;
    overridePersistentLevel(memberId: string, level: MemberLevel, tenantContext: RequestTenantContext, approvalTicket?: string): Promise<MemberProfile | MemberMutationApprovalResult>;
    /**
     * 检查会员是否可升级
     */
    checkUpgrade(memberId: string): {
        canUpgrade: boolean;
        currentLevel: MemberLevel;
        nextLevel: MemberLevel | null;
        pointsNeeded: number;
    };
    registerPersistent(input: {
        tenantContext: RequestTenantContext;
        mobile: string;
        nickname: string;
        initialPoints?: number;
    }): Promise<MemberProfile>;
    getPersistentProfile(memberId: string, tenantContext: RequestTenantContext): Promise<MemberProfile | undefined>;
    updatePersistentProfile(input: {
        memberId: string;
        tenantContext: RequestTenantContext;
        nickname: string;
        mobile: string;
        email?: string;
        address?: string;
        notes?: string;
    }): Promise<MemberProfile>;
    getOperationsProfile(memberId: string, tenantContext: RequestTenantContext): Promise<MemberOperationsProfile | undefined>;
    enqueueOperationsTasks(input: {
        memberId: string;
        tenantContext: RequestTenantContext;
        source: MemberOperationsTask['source'];
        sourceOrderId?: string;
        sourcePaymentId?: string;
    }): Promise<{
        profile: MemberOperationsProfile;
        queuedTasks: MemberOperationsTask[];
        existingTasks: MemberOperationsTask[];
        executedReceipts: MemberOperationsExecutionReceipt[];
    }>;
    listOperationsTasks(memberId: string, tenantContext: RequestTenantContext): Promise<MemberOperationsTask[]>;
    listOperationsReceipts(memberId: string, tenantContext: RequestTenantContext): Promise<MemberOperationsExecutionReceipt[]>;
    getOperationsRuntimeReceipt(memberId: string, executionId: string, tenantContext: RequestTenantContext): Promise<RuntimeGovernanceReceipt | undefined>;
    replayOperationsExecution(memberId: string, executionId: string, tenantContext: RequestTenantContext): Promise<RuntimeGovernanceReceipt | undefined>;
    listPersistentProfiles(tenantContext: RequestTenantContext): Promise<MemberProfile[]>;
    getLytMemberSnapshot(externalMemberId: string, tenantContext: RequestTenantContext): Promise<LytMemberSnapshot | undefined>;
    listLytMemberSnapshots(tenantContext: RequestTenantContext): Promise<LytMemberSnapshot[]>;
    syncLytMemberSnapshot(input: {
        tenantContext: RequestTenantContext;
        externalMemberId: string;
        memberCode?: string;
        mobile?: string;
        nickname?: string;
        levelCode?: string;
        points?: number;
        growthValue?: number;
        status?: string;
        updatedAt?: string;
        rawVersion?: string;
        rawPayload?: Record<string, unknown>;
    }): Promise<{
        snapshot: LytMemberSnapshot;
        profile: MemberProfile;
    }>;
    login(input: {
        tenantContext: RequestTenantContext;
        mobile: string;
    }): Promise<MemberLoginResult>;
    getSession(sessionToken: string): MemberSession | undefined;
}
//# sourceMappingURL=member.service.d.ts.map