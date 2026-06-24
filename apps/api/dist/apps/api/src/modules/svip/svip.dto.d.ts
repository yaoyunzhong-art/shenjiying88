import 'reflect-metadata';
import { SvipBenefitType, SvipMemberStatus } from './svip.entity';
/**
 * SVIP 等级 DTO
 */
export declare class SvipTierDto {
    id?: string;
    name: string;
    level: number;
    minSpendAmount: number;
    minPoints: number;
    benefits: string[];
    icon?: string;
    color?: string;
}
/**
 * 创建 SVIP 会员 DTO
 */
export declare class CreateSvipMemberDto {
    memberId: string;
    tierId: string;
    totalSpend: number;
    currentPoints: number;
    joinedAt?: string;
    expiresAt: string;
    autoRenew?: boolean;
    brandId?: string;
    storeId?: string;
}
/**
 * SVIP 权益 DTO
 */
export declare class SvipBenefitDto {
    id?: string;
    tierId: string;
    benefitType: SvipBenefitType;
    benefitValue: string;
    description: string;
    isActive?: boolean;
}
/**
 * SVIP 升降级 DTO
 */
export declare class SvipUpgradeDto {
    memberId: string;
    targetTierLevel?: number;
    totalSpend?: number;
    currentPoints?: number;
    reason?: string;
}
/**
 * SVIP 权益使用 DTO
 */
export declare class UseSvipBenefitDto {
    memberId: string;
    benefitType: SvipBenefitType;
    referenceOrderId?: string;
    referencePaymentId?: string;
}
/**
 * SVIP 会员查询 DTO
 */
export declare class SvipMemberQueryDto {
    memberId?: string;
    status?: SvipMemberStatus;
    tierLevel?: number;
}
/**
 * SVIP 等级查询 DTO
 */
export declare class SvipTierQueryDto {
    level?: number;
}
//# sourceMappingURL=svip.dto.d.ts.map