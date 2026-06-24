import type { RequestTenantContext } from '../tenant/tenant.types';
import { SvipBenefitType, SvipMemberStatus, SvipTierLevel, type SvipBenefit, type SvipMember, type SvipTier } from './svip.entity';
import type { CreateSvipMemberDto, SvipBenefitDto, SvipTierDto, SvipUpgradeDto } from './svip.dto';
export declare class SvipService {
    /**
     * 初始化租户默认等级
     */
    initDefaultTiers(tenantContext: RequestTenantContext): SvipTier[];
    /**
     * 获取等级列表
     */
    listTiers(tenantId: string): SvipTier[];
    /**
     * 获取单个等级
     */
    getTier(tierId: string, tenantId: string): SvipTier | undefined;
    /**
     * 按等级数值查找
     */
    getTierByLevel(level: number, tenantId: string): SvipTier | undefined;
    /**
     * 创建 / 更新等级
     */
    upsertTier(tenantContext: RequestTenantContext, dto: SvipTierDto): SvipTier;
    /**
     * 创建 SVIP 会员
     */
    createMember(tenantContext: RequestTenantContext, dto: CreateSvipMemberDto): SvipMember;
    /**
     * 获取会员 SVIP 信息
     */
    getMemberTier(memberId: string, tenantId: string): SvipMember | undefined;
    /**
     * 列出所有 SVIP 会员
     */
    listMembers(tenantId: string, filters?: {
        status?: SvipMemberStatus;
        tierLevel?: number;
        brandId?: string;
        storeId?: string;
    }): SvipMember[];
    /**
     * 根据 memberId 查找 SVIP 会员
     */
    private findMemberByMemberId;
    /**
     * 自动判定等级: 根据 totalSpend + points
     */
    calculateTier(totalSpend: number, points: number): SvipTierLevel;
    /**
     * 升级 SVIP 等级
     */
    upgradeTier(tenantContext: RequestTenantContext, dto: SvipUpgradeDto): SvipMember;
    /**
     * 降级 SVIP 等级
     */
    downgradeTier(tenantContext: RequestTenantContext, dto: SvipUpgradeDto): SvipMember;
    /**
     * 到期降级: expiresAt 到期 → 降级并保留 30 天缓冲期
     */
    checkAndDowngradeExpired(tenantId: string): SvipMember[];
    /**
     * 冻结 SVIP 会员
     */
    freezeMember(memberId: string, tenantId: string): SvipMember;
    /**
     * 解冻 SVIP 会员
     */
    unfreezeMember(memberId: string, tenantId: string): SvipMember;
    /**
     * 获取等级权益列表
     */
    listBenefits(tierId: string): SvipBenefit[];
    /**
     * 创建权益
     */
    createBenefit(dto: SvipBenefitDto): SvipBenefit;
    /**
     * 更新权益
     */
    updateBenefit(benefitId: string, dto: Partial<SvipBenefitDto>): SvipBenefit;
    /**
     * 使用权益
     */
    useBenefit(memberId: string, benefitType: SvipBenefitType, tenantId: string): {
        success: boolean;
        benefit?: SvipBenefit;
        member?: SvipMember;
        message: string;
    };
    /**
     * 与 loyalty 模块联动: 积分达阈值自动升 SVIP
     * 此方法由 loyalty 模块在积分结算后调用
     */
    checkAndAutoUpgrade(tenantContext: RequestTenantContext, memberId: string, totalSpend: number, currentPoints: number): {
        upgraded: boolean;
        newLevel?: SvipTierLevel;
        reason?: string;
    };
    /**
     * 获取会员可用的权益列表
     */
    getMemberAvailableBenefits(memberId: string, tenantId: string): {
        benefits: SvipBenefit[];
        tierLevel: SvipTierLevel;
        tierName: string;
    } | null;
    /**
     * 清除所有数据 (仅测试用)
     */
    resetSvipStoresForTests(): void;
}
//# sourceMappingURL=svip.service.d.ts.map