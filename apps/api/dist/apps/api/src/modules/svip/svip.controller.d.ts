import type { RequestTenantContext } from '../tenant/tenant.types';
import { CreateSvipMemberDto, SvipBenefitDto, SvipMemberQueryDto, SvipTierDto, SvipTierQueryDto, SvipUpgradeDto, UseSvipBenefitDto } from './svip.dto';
import { SvipService } from './svip.service';
export declare class SvipController {
    private readonly svipService;
    constructor(svipService: SvipService);
    initDefaultTiers(tenantContext: RequestTenantContext): import("./svip.entity").SvipTier[];
    listTiers(tenantContext: RequestTenantContext, query: SvipTierQueryDto): import("./svip.entity").SvipTier[];
    getTier(tenantContext: RequestTenantContext, tierId: string): import("./svip.entity").SvipTier | undefined;
    upsertTier(tenantContext: RequestTenantContext, body: SvipTierDto): import("./svip.entity").SvipTier;
    createMember(tenantContext: RequestTenantContext, body: CreateSvipMemberDto): import("./svip.entity").SvipMember;
    listMembers(tenantContext: RequestTenantContext, query: SvipMemberQueryDto): import("./svip.entity").SvipMember[];
    getMemberTier(tenantContext: RequestTenantContext, memberId: string): import("./svip.entity").SvipMember | undefined;
    getMemberBenefits(tenantContext: RequestTenantContext, memberId: string): {
        benefits: import("./svip.entity").SvipBenefit[];
        tierLevel: import("./svip.entity").SvipTierLevel;
        tierName: string;
    } | null;
    upgradeTier(tenantContext: RequestTenantContext, body: SvipUpgradeDto): import("./svip.entity").SvipMember;
    downgradeTier(tenantContext: RequestTenantContext, body: SvipUpgradeDto): import("./svip.entity").SvipMember;
    freezeMember(tenantContext: RequestTenantContext, memberId: string): import("./svip.entity").SvipMember;
    unfreezeMember(tenantContext: RequestTenantContext, memberId: string): import("./svip.entity").SvipMember;
    checkAndDowngradeExpired(tenantContext: RequestTenantContext): import("./svip.entity").SvipMember[];
    listBenefits(tierId: string): import("./svip.entity").SvipBenefit[];
    createBenefit(body: SvipBenefitDto): import("./svip.entity").SvipBenefit;
    updateBenefit(benefitId: string, body: Partial<SvipBenefitDto>): import("./svip.entity").SvipBenefit;
    useBenefit(tenantContext: RequestTenantContext, body: UseSvipBenefitDto): {
        success: boolean;
        benefit?: import("./svip.entity").SvipBenefit | undefined;
        member?: import("./svip.entity").SvipMember | undefined;
        message: string;
    };
}
//# sourceMappingURL=svip.controller.d.ts.map