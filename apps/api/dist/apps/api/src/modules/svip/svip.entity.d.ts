import type { RequestTenantContext } from '../tenant/tenant.types';
/**
 * SVIP 等级枚举
 */
export declare enum SvipTierLevel {
    Level1 = 1,
    Level2 = 2,
    Level3 = 3,
    Level4 = 4,
    Level5 = 5
}
/**
 * SVIP 会员状态
 */
export declare enum SvipMemberStatus {
    Active = "active",
    Expired = "expired",
    Frozen = "frozen"
}
/**
 * SVIP 权益类型
 */
export declare enum SvipBenefitType {
    Discount = "discount",
    FreeUpgrade = "freeUpgrade",
    PriorityQueue = "priorityQueue",
    VipRoom = "vipRoom",
    ExclusiveEvent = "exclusiveEvent"
}
/**
 * SVIP 等级阈值配置
 */
export declare const SVIP_TIER_THRESHOLDS: Record<SvipTierLevel, {
    minSpendAmount: number;
    minPoints: number;
}>;
/**
 * SVIP 等级实体
 */
export interface SvipTier {
    /** 等级唯一标识 */
    id: string;
    /** 租户上下文 */
    tenantContext: RequestTenantContext;
    /** 等级名称 */
    name: string;
    /** 等级数值 (1-5) */
    level: SvipTierLevel;
    /** 最低消费金额阈值 */
    minSpendAmount: number;
    /** 最低积分阈值 */
    minPoints: number;
    /** 权益列表 (JSON 序列化) */
    benefits: string[];
    /** 等级图标 URL */
    icon?: string;
    /** 等级颜色 */
    color?: string;
    /** 创建时间 */
    createdAt: string;
}
/**
 * SVIP 会员实体
 */
export interface SvipMember {
    /** 会员唯一标识 */
    id: string;
    /** 租户上下文 */
    tenantContext: RequestTenantContext;
    /** 品牌 ID */
    brandId?: string;
    /** 门店 ID */
    storeId?: string;
    /** 关联的普通会员 ID */
    memberId: string;
    /** 当前等级 ID */
    tierId: string;
    /** 当前等级名称 */
    tierName: string;
    /** 当前等级数值 (1-5) */
    tierLevel: SvipTierLevel;
    /** 累计消费金额 */
    totalSpend: number;
    /** 当前积分 */
    currentPoints: number;
    /** 加入 SVIP 时间 */
    joinedAt: string;
    /** 到期时间 */
    expiresAt: string;
    /** 状态 */
    status: SvipMemberStatus;
    /** 是否自动续费 */
    autoRenew: boolean;
    /** 创建时间 */
    createdAt: string;
    /** 更新时间 */
    updatedAt: string;
}
/**
 * SVIP 权益实体
 */
export interface SvipBenefit {
    /** 权益唯一标识 */
    id: string;
    /** 关联的等级 ID */
    tierId: string;
    /** 权益类型 */
    benefitType: SvipBenefitType;
    /** 权益数值 (如折扣百分比、升级天数等) */
    benefitValue: string;
    /** 权益描述 */
    description: string;
    /** 是否激活 */
    isActive: boolean;
}
/**
 * 根据总消费金额和积分自动计算 SVIP 等级
 */
export declare function computeSvipTierLevel(totalSpend: number, points: number): SvipTierLevel;
/**
 * 判断是否可以从当前等级升级
 */
export declare function canUpgradeSvipTier(currentLevel: SvipTierLevel, totalSpend: number, points: number): boolean;
/**
 * 构建默认 SVIP 等级列表
 */
export declare function buildDefaultSvipTiers(tenantContext: RequestTenantContext): SvipTier[];
//# sourceMappingURL=svip.entity.d.ts.map