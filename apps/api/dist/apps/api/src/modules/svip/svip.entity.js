"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SVIP_TIER_THRESHOLDS = exports.SvipBenefitType = exports.SvipMemberStatus = exports.SvipTierLevel = void 0;
exports.computeSvipTierLevel = computeSvipTierLevel;
exports.canUpgradeSvipTier = canUpgradeSvipTier;
exports.buildDefaultSvipTiers = buildDefaultSvipTiers;
const node_crypto_1 = require("node:crypto");
/**
 * SVIP 等级枚举
 */
var SvipTierLevel;
(function (SvipTierLevel) {
    SvipTierLevel[SvipTierLevel["Level1"] = 1] = "Level1";
    SvipTierLevel[SvipTierLevel["Level2"] = 2] = "Level2";
    SvipTierLevel[SvipTierLevel["Level3"] = 3] = "Level3";
    SvipTierLevel[SvipTierLevel["Level4"] = 4] = "Level4";
    SvipTierLevel[SvipTierLevel["Level5"] = 5] = "Level5";
})(SvipTierLevel || (exports.SvipTierLevel = SvipTierLevel = {}));
/**
 * SVIP 会员状态
 */
var SvipMemberStatus;
(function (SvipMemberStatus) {
    SvipMemberStatus["Active"] = "active";
    SvipMemberStatus["Expired"] = "expired";
    SvipMemberStatus["Frozen"] = "frozen";
})(SvipMemberStatus || (exports.SvipMemberStatus = SvipMemberStatus = {}));
/**
 * SVIP 权益类型
 */
var SvipBenefitType;
(function (SvipBenefitType) {
    SvipBenefitType["Discount"] = "discount";
    SvipBenefitType["FreeUpgrade"] = "freeUpgrade";
    SvipBenefitType["PriorityQueue"] = "priorityQueue";
    SvipBenefitType["VipRoom"] = "vipRoom";
    SvipBenefitType["ExclusiveEvent"] = "exclusiveEvent";
})(SvipBenefitType || (exports.SvipBenefitType = SvipBenefitType = {}));
/**
 * SVIP 等级阈值配置
 */
exports.SVIP_TIER_THRESHOLDS = {
    [SvipTierLevel.Level1]: { minSpendAmount: 5000, minPoints: 500 },
    [SvipTierLevel.Level2]: { minSpendAmount: 10000, minPoints: 2000 },
    [SvipTierLevel.Level3]: { minSpendAmount: 30000, minPoints: 6000 },
    [SvipTierLevel.Level4]: { minSpendAmount: 80000, minPoints: 15000 },
    [SvipTierLevel.Level5]: { minSpendAmount: 200000, minPoints: 40000 }
};
/**
 * 根据总消费金额和积分自动计算 SVIP 等级
 */
function computeSvipTierLevel(totalSpend, points) {
    const levels = Object.values(SvipTierLevel).filter((v) => typeof v === 'number');
    let matchedLevel = SvipTierLevel.Level1;
    for (const lvl of levels) {
        const threshold = exports.SVIP_TIER_THRESHOLDS[lvl];
        if (totalSpend >= threshold.minSpendAmount && points >= threshold.minPoints) {
            matchedLevel = lvl;
        }
        else {
            break;
        }
    }
    return matchedLevel;
}
/**
 * 判断是否可以从当前等级升级
 */
function canUpgradeSvipTier(currentLevel, totalSpend, points) {
    const computed = computeSvipTierLevel(totalSpend, points);
    return computed > currentLevel;
}
/**
 * 构建默认 SVIP 等级列表
 */
function buildDefaultSvipTiers(tenantContext) {
    const now = new Date().toISOString();
    return [
        {
            id: `svip-tier-${(0, node_crypto_1.randomUUID)()}`,
            tenantContext,
            name: '银卡会员',
            level: SvipTierLevel.Level1,
            minSpendAmount: exports.SVIP_TIER_THRESHOLDS[SvipTierLevel.Level1].minSpendAmount,
            minPoints: exports.SVIP_TIER_THRESHOLDS[SvipTierLevel.Level1].minPoints,
            benefits: ['discount_95', 'priority_queue'],
            icon: 'silver',
            color: '#C0C0C0',
            createdAt: now
        },
        {
            id: `svip-tier-${(0, node_crypto_1.randomUUID)()}`,
            tenantContext,
            name: '金卡会员',
            level: SvipTierLevel.Level2,
            minSpendAmount: exports.SVIP_TIER_THRESHOLDS[SvipTierLevel.Level2].minSpendAmount,
            minPoints: exports.SVIP_TIER_THRESHOLDS[SvipTierLevel.Level2].minPoints,
            benefits: ['discount_90', 'priority_queue', 'free_upgrade'],
            icon: 'gold',
            color: '#FFD700',
            createdAt: now
        },
        {
            id: `svip-tier-${(0, node_crypto_1.randomUUID)()}`,
            tenantContext,
            name: '铂金会员',
            level: SvipTierLevel.Level3,
            minSpendAmount: exports.SVIP_TIER_THRESHOLDS[SvipTierLevel.Level3].minSpendAmount,
            minPoints: exports.SVIP_TIER_THRESHOLDS[SvipTierLevel.Level3].minPoints,
            benefits: ['discount_88', 'priority_queue', 'free_upgrade', 'vip_room'],
            icon: 'platinum',
            color: '#E5E4E2',
            createdAt: now
        },
        {
            id: `svip-tier-${(0, node_crypto_1.randomUUID)()}`,
            tenantContext,
            name: '钻石会员',
            level: SvipTierLevel.Level4,
            minSpendAmount: exports.SVIP_TIER_THRESHOLDS[SvipTierLevel.Level4].minSpendAmount,
            minPoints: exports.SVIP_TIER_THRESHOLDS[SvipTierLevel.Level4].minPoints,
            benefits: ['discount_85', 'priority_queue', 'free_upgrade', 'vip_room', 'exclusive_event'],
            icon: 'diamond',
            color: '#B9F2FF',
            createdAt: now
        },
        {
            id: `svip-tier-${(0, node_crypto_1.randomUUID)()}`,
            tenantContext,
            name: '至尊会员',
            level: SvipTierLevel.Level5,
            minSpendAmount: exports.SVIP_TIER_THRESHOLDS[SvipTierLevel.Level5].minSpendAmount,
            minPoints: exports.SVIP_TIER_THRESHOLDS[SvipTierLevel.Level5].minPoints,
            benefits: [
                'discount_80',
                'priority_queue',
                'free_upgrade',
                'vip_room',
                'exclusive_event',
                'personal_concierge'
            ],
            icon: 'crown',
            color: '#FF4500',
            createdAt: now
        }
    ];
}
//# sourceMappingURL=svip.entity.js.map