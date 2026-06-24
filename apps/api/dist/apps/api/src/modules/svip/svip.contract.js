"use strict";
/**
 * SVIP 模块跨边界通信契约
 *
 * 定义其他模块消费 SVIP 数据的稳定表面层。
 * 剥离 tenantContext 等内部字段，只暴露安全的业务字段。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSvipTierContract = toSvipTierContract;
exports.toSvipMemberContract = toSvipMemberContract;
exports.toSvipBenefitContract = toSvipBenefitContract;
exports.toSvipLevelChangeContract = toSvipLevelChangeContract;
/**
 * 将内部 SvipTier 转换为跨模块契约
 */
function toSvipTierContract(tier) {
    return {
        id: tier.id,
        name: tier.name,
        level: tier.level,
        minSpendAmount: tier.minSpendAmount,
        minPoints: tier.minPoints,
        benefits: tier.benefits,
        icon: tier.icon,
        color: tier.color,
        createdAt: tier.createdAt
    };
}
/**
 * 将内部 SvipMember 转换为跨模块契约
 */
function toSvipMemberContract(member) {
    return {
        id: member.id,
        memberId: member.memberId,
        tierId: member.tierId,
        tierName: member.tierName,
        tierLevel: member.tierLevel,
        totalSpend: member.totalSpend,
        currentPoints: member.currentPoints,
        status: member.status,
        autoRenew: member.autoRenew,
        joinedAt: member.joinedAt,
        expiresAt: member.expiresAt,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt
    };
}
/**
 * 将内部 SvipBenefit 转换为跨模块契约
 */
function toSvipBenefitContract(benefit) {
    return {
        id: benefit.id,
        tierId: benefit.tierId,
        benefitType: benefit.benefitType,
        benefitValue: benefit.benefitValue,
        description: benefit.description,
        isActive: benefit.isActive
    };
}
/**
 * 构建等级变更结果契约
 */
function toSvipLevelChangeContract(params) {
    return {
        memberId: params.memberId,
        previousLevel: params.previousLevel,
        newLevel: params.newLevel,
        reason: params.reason,
        changedAt: new Date().toISOString()
    };
}
//# sourceMappingURL=svip.contract.js.map