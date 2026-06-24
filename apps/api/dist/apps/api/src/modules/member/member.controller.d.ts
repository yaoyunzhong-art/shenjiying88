import type { LytMemberSnapshotContract, MemberOperationsExecutionReceiptContract, MemberOperationsProfileContract, MemberOperationsTaskContract, MemberProfileContract, RuntimeGovernanceReceipt } from '@m5/types';
import type { RequestTenantContext } from '../tenant/tenant.types';
import { MemberService } from './member.service';
import type { MemberMutationApprovalResult, MemberProfile, MemberProfileMutationHistoryEntry } from './member.entity';
import { MemberLevelAdjustDto, MemberLoginDto, MemberPaymentActivityDto, MemberPersistentProfileUpdateDto, MemberPersistentRegisterDto, MemberPointsAdjustDto, MemberStatusAdjustDto } from './member.dto';
export declare class MemberController {
    private readonly memberService;
    constructor(memberService: MemberService);
    getBootstrap(tenantContext: RequestTenantContext): import("./member.entity").MemberBootstrap;
    /** 列出持久化会员 */
    listPersistentProfiles(tenantContext: RequestTenantContext): Promise<MemberProfileContract[]>;
    /** 列出 LYT 标准会员快照 */
    listLytMemberSnapshots(tenantContext: RequestTenantContext): Promise<LytMemberSnapshotContract[]>;
    /** 获取 LYT 标准会员快照 */
    getLytMemberSnapshot(externalMemberId: string, tenantContext: RequestTenantContext): Promise<LytMemberSnapshotContract>;
    /** 获取持久化会员档案 */
    getPersistentProfile(memberId: string, tenantContext: RequestTenantContext): Promise<MemberProfileContract>;
    /** 获取持久化会员最近操作历史 */
    listPersistentMutationHistory(memberId: string, tenantContext: RequestTenantContext): Promise<MemberProfileMutationHistoryEntry[]>;
    /** 获取会员运营画像与动作建议 */
    getOperationsProfile(memberId: string, tenantContext: RequestTenantContext): Promise<MemberOperationsProfileContract>;
    /** 获取会员运营任务队列 */
    listOperationsTasks(memberId: string, tenantContext: RequestTenantContext): Promise<MemberOperationsTaskContract[]>;
    /** 获取会员运营执行回执 */
    listOperationsReceipts(memberId: string, tenantContext: RequestTenantContext): Promise<MemberOperationsExecutionReceiptContract[]>;
    /** 获取某条会员运营执行回执对应的 runtime 治理轨迹 */
    getOperationsRuntimeReceipt(memberId: string, executionId: string, tenantContext: RequestTenantContext): Promise<RuntimeGovernanceReceipt>;
    /** 对某条会员运营执行回执触发 runtime replay */
    replayOperationsExecution(memberId: string, executionId: string, tenantContext: RequestTenantContext): Promise<RuntimeGovernanceReceipt>;
    /** 注册新会员 */
    register(tenantContext: RequestTenantContext, body: {
        memberId: string;
        nickname: string;
    }): MemberProfile;
    /** 持久化注册会员 */
    registerPersistent(tenantContext: RequestTenantContext, body: MemberPersistentRegisterDto): Promise<MemberProfile>;
    /** 更新持久化会员基础资料 */
    updatePersistentProfile(memberId: string, tenantContext: RequestTenantContext, body: MemberPersistentProfileUpdateDto): Promise<MemberProfile>;
    /** 持久化会员加积分 */
    awardPersistentPoints(memberId: string, tenantContext: RequestTenantContext, body: MemberPointsAdjustDto): Promise<MemberProfileContract | MemberMutationApprovalResult>;
    /** 持久化会员扣减积分 */
    rollbackPersistentPoints(memberId: string, tenantContext: RequestTenantContext, body: MemberPointsAdjustDto): Promise<MemberProfileContract | MemberMutationApprovalResult>;
    /** 更新持久化会员状态 */
    updatePersistentStatus(memberId: string, tenantContext: RequestTenantContext, body: MemberStatusAdjustDto): Promise<MemberProfileContract | MemberMutationApprovalResult>;
    /** 手工调整持久化会员等级 */
    overridePersistentLevel(memberId: string, tenantContext: RequestTenantContext, body: MemberLevelAdjustDto): Promise<MemberProfileContract | MemberMutationApprovalResult>;
    /** 记录持久化会员支付行为 */
    recordPersistentPaymentActivity(memberId: string, tenantContext: RequestTenantContext, body: MemberPaymentActivityDto): Promise<MemberProfile>;
    /** 会员登录 */
    login(tenantContext: RequestTenantContext, body: MemberLoginDto): Promise<import("./member.entity").MemberLoginResult>;
    /** 查询登录态 */
    getSession(sessionToken: string): import("./member.entity").MemberSession;
    /** 获取会员档案 */
    getProfile(memberId: string): MemberProfile;
    /** 列出所有会员 */
    listProfiles(): MemberProfile[];
    /** 增加积分 */
    addPoints(memberId: string, body: {
        points: number;
    }): MemberProfile;
    /** 检查是否可升级 */
    checkUpgrade(memberId: string): {
        canUpgrade: boolean;
        currentLevel: import("./member.entity").MemberLevel;
        nextLevel: import("./member.entity").MemberLevel | null;
        pointsNeeded: number;
    };
}
//# sourceMappingURL=member.controller.d.ts.map