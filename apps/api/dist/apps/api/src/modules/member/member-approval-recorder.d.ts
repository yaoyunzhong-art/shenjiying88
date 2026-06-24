import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { GovernanceApprovalOutcomeEvent, GovernanceApprovalOutcomeHook, GovernanceApprovalService } from '../foundation/governance-approval/governance-approval.service';
import { PrismaService } from '../../prisma/prisma.service';
/**
 * 会员审批结果回写器：把 governance approval service 的 outcome 事件
 * 落进 member-profile 专属 AuditLog，作为真实持久化的审批历史主链。
 *
 * 由 MemberModule 在 onModuleInit 时挂到 governance approval service 的钩子表，
 * 不在业务调用方手动触发，避免漏写。
 */
export declare class MemberApprovalOutcomeRecorder implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly governanceApprovalService;
    private disconnect?;
    constructor(prisma: PrismaService, governanceApprovalService: GovernanceApprovalService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    /**
     * 暴露成方法以便单测和外部调用能直接验证，不依赖钩子触发链。
     */
    recordOutcome(event: GovernanceApprovalOutcomeEvent): Promise<void>;
    private getAuditLogModel;
    private buildOutcomeSummary;
    private resolveOperatorId;
    private buildPayload;
    private buildBeforeValue;
    private buildAfterValue;
}
export declare const MEMBER_APPROVAL_OUTCOME_RESOURCE_TYPE = "member-profile";
export type MemberApprovalOutcomeHook = GovernanceApprovalOutcomeHook;
//# sourceMappingURL=member-approval-recorder.d.ts.map