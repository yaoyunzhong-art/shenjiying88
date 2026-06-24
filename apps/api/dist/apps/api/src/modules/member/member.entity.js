"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEMBER_LEVEL_THRESHOLDS = exports.MemberStatus = exports.MemberLevel = void 0;
exports.computeMemberLevel = computeMemberLevel;
exports.canUpgrade = canUpgrade;
exports.makeMemberBootstrap = makeMemberBootstrap;
/**
 * 会员等级枚举
 */
var MemberLevel;
(function (MemberLevel) {
    MemberLevel["Bronze"] = "BRONZE";
    MemberLevel["Silver"] = "SILVER";
    MemberLevel["Gold"] = "GOLD";
    MemberLevel["Platinum"] = "PLATINUM";
    MemberLevel["Diamond"] = "DIAMOND";
})(MemberLevel || (exports.MemberLevel = MemberLevel = {}));
/**
 * 会员状态枚举
 */
var MemberStatus;
(function (MemberStatus) {
    MemberStatus["Active"] = "ACTIVE";
    MemberStatus["Frozen"] = "FROZEN";
    MemberStatus["Expired"] = "EXPIRED";
    MemberStatus["Blacklisted"] = "BLACKLISTED";
})(MemberStatus || (exports.MemberStatus = MemberStatus = {}));
/**
 * 会员等级对应的最低积分阈值
 */
exports.MEMBER_LEVEL_THRESHOLDS = {
    [MemberLevel.Bronze]: 0,
    [MemberLevel.Silver]: 500,
    [MemberLevel.Gold]: 2000,
    [MemberLevel.Platinum]: 10000,
    [MemberLevel.Diamond]: 50000
};
/**
 * 根据积分计算会员等级
 */
function computeMemberLevel(points) {
    if (points >= exports.MEMBER_LEVEL_THRESHOLDS[MemberLevel.Diamond])
        return MemberLevel.Diamond;
    if (points >= exports.MEMBER_LEVEL_THRESHOLDS[MemberLevel.Platinum])
        return MemberLevel.Platinum;
    if (points >= exports.MEMBER_LEVEL_THRESHOLDS[MemberLevel.Gold])
        return MemberLevel.Gold;
    if (points >= exports.MEMBER_LEVEL_THRESHOLDS[MemberLevel.Silver])
        return MemberLevel.Silver;
    return MemberLevel.Bronze;
}
/**
 * 判断会员是否可以升级
 */
function canUpgrade(currentLevel, points) {
    const computed = computeMemberLevel(points);
    const levels = Object.values(MemberLevel);
    return levels.indexOf(computed) > levels.indexOf(currentLevel);
}
/**
 * 构造默认 member bootstrap
 */
function makeMemberBootstrap(tenantContext, overrides = {}) {
    return {
        tenantContext,
        capabilities: ['member-center', 'points', 'svip', 'blind-box'],
        phase: 'scaffold',
        ...overrides
    };
}
//# sourceMappingURL=member.entity.js.map