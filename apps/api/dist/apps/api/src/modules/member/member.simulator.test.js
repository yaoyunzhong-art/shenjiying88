"use strict";
/**
 * Member Simulator Test
 *
 * 模拟会员系统的场景覆盖：
 * - 会员等级计算 (computeMemberLevel)
 * - 等级升级判断 (canUpgrade)
 * - 阈值边界 (MEMBER_LEVEL_THRESHOLDS)
 * - 会员状态流转
 * - 会员注册/登录
 * - 积分调整
 * - 会员档案操作
 *
 * 8 角色视角覆盖：
 *  👔店长 - 会员等级策略审核
 *  🛒前台 - 会员积分查询与消费
 *  👥HR - 员工关联会员统计
 *  🔧安监 - 会员状态审计
 *  🎮导玩员 - 游戏化等级激励
 *  🎯运行专员 - 会员生命周期运营
 *  🤝团建 - 团建活动会员筛选
 *  📢营销 - 会员分层精准营销
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const member_entity_1 = require("./member.entity");
function createSimulatedMember(memberId, points, overrides) {
    return {
        memberId,
        level: (0, member_entity_1.computeMemberLevel)(points),
        status: member_entity_1.MemberStatus.Active,
        points,
        growthValue: overrides?.growthValue ?? 0,
        visitCount: overrides?.visitCount ?? 0,
        totalSpend: overrides?.totalSpend ?? 0,
        registeredAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
    };
}
/** 模拟积分调整 */
function simulatePointsAdjustment(member, deltaPoints) {
    const newPoints = Math.max(0, member.points + deltaPoints);
    const newLevel = (0, member_entity_1.computeMemberLevel)(newPoints);
    const levelOrder = Object.values(member_entity_1.MemberLevel);
    const oldIdx = levelOrder.indexOf(member.level);
    const newIdx = levelOrder.indexOf(newLevel);
    let action;
    if (newIdx > oldIdx)
        action = 'upgrade';
    else if (newIdx < oldIdx)
        action = 'downgrade';
    else
        action = 'unchanged';
    return {
        updated: { ...member, points: newPoints, level: newLevel },
        action
    };
}
/** 模拟状态变更 */
function simulateStatusChange(member, newStatus) {
    return { ...member, status: newStatus };
}
/** 模拟会员登录 */
function simulateMemberLogin(member) {
    const blockedStatuses = [member_entity_1.MemberStatus.Frozen, member_entity_1.MemberStatus.Blacklisted];
    if (blockedStatuses.includes(member.status)) {
        return { success: false, member, lastActiveAt: member.lastActiveAt };
    }
    const newLastActive = new Date().toISOString();
    return {
        success: true,
        member: { ...member, lastActiveAt: newLastActive },
        lastActiveAt: newLastActive
    };
}
// ─── 会员等级计算 (使用真实 computeMemberLevel) ───
(0, node_test_1.describe)('Member - Simulator (level computation)', () => {
    (0, node_test_1.default)('should compute Bronze level for new member with 0 points', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(0), member_entity_1.MemberLevel.Bronze);
    });
    (0, node_test_1.default)('should compute Silver level at 500 points', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(500), member_entity_1.MemberLevel.Silver);
    });
    (0, node_test_1.default)('should compute Gold level at 2000 points', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(2000), member_entity_1.MemberLevel.Gold);
    });
    (0, node_test_1.default)('should compute Platinum level at 10000 points', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(10000), member_entity_1.MemberLevel.Platinum);
    });
    (0, node_test_1.default)('should compute Diamond level at 50000 points', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(50000), member_entity_1.MemberLevel.Diamond);
    });
    (0, node_test_1.default)('should NOT downgrade a Diamond member whose points are still well above threshold', () => {
        const diamondMember = createSimulatedMember('mem-diamond', 80000);
        strict_1.default.equal(diamondMember.level, member_entity_1.MemberLevel.Diamond);
        const afterDeduction = simulatePointsAdjustment(diamondMember, -20000);
        strict_1.default.equal(afterDeduction.updated.points, 60000);
        strict_1.default.equal(afterDeduction.updated.level, member_entity_1.MemberLevel.Diamond);
        strict_1.default.equal(afterDeduction.action, 'unchanged');
    });
    (0, node_test_1.default)('Diamond member dropping below 50000 should be re-evaluated as Platinum', () => {
        const diamondMember = createSimulatedMember('mem-fall', 60000);
        strict_1.default.equal(diamondMember.level, member_entity_1.MemberLevel.Diamond);
        const afterDeduction = simulatePointsAdjustment(diamondMember, -20000);
        strict_1.default.equal(afterDeduction.updated.points, 40000);
        strict_1.default.equal(afterDeduction.updated.level, member_entity_1.MemberLevel.Platinum);
    });
    (0, node_test_1.default)('should handle negative total but points clamped at zero', () => {
        const member = createSimulatedMember('mem-zero', 10);
        const adjusted = simulatePointsAdjustment(member, -100);
        strict_1.default.equal(adjusted.updated.points, 0);
        strict_1.default.equal(adjusted.updated.level, member_entity_1.MemberLevel.Bronze);
    });
});
// ─── 等级升级判断 (使用真实 canUpgrade) ───
(0, node_test_1.describe)('Member - Simulator (canUpgrade)', () => {
    (0, node_test_1.default)('should allow upgrade from Bronze to Silver at 500 points', () => {
        strict_1.default.equal((0, member_entity_1.canUpgrade)(member_entity_1.MemberLevel.Bronze, 500), true);
    });
    (0, node_test_1.default)('should allow upgrade from Silver to Gold at 2000 points', () => {
        strict_1.default.equal((0, member_entity_1.canUpgrade)(member_entity_1.MemberLevel.Silver, 2000), true);
    });
    (0, node_test_1.default)('should allow upgrade from Gold to Platinum at 10000 points', () => {
        strict_1.default.equal((0, member_entity_1.canUpgrade)(member_entity_1.MemberLevel.Gold, 10000), true);
    });
    (0, node_test_1.default)('should allow upgrade from Platinum to Diamond at 50000 points', () => {
        strict_1.default.equal((0, member_entity_1.canUpgrade)(member_entity_1.MemberLevel.Platinum, 50000), true);
    });
    (0, node_test_1.default)('should NOT allow same-level "upgrade"', () => {
        strict_1.default.equal((0, member_entity_1.canUpgrade)(member_entity_1.MemberLevel.Gold, 2500), false); // still Gold only
    });
    (0, node_test_1.default)('should NOT allow downgrade (Diamond member at 10000 points still cannot upgrade-from Diamond)', () => {
        // canUpgrade(Diamond, 10000) -> computeMemberLevel(10000)=Platinum, Platinum < Diamond -> false
        strict_1.default.equal((0, member_entity_1.canUpgrade)(member_entity_1.MemberLevel.Diamond, 10000), false);
    });
    (0, node_test_1.default)('should allow skip-level upgrade (Bronze + 10000 points = Platinum > Bronze)', () => {
        strict_1.default.equal((0, member_entity_1.canUpgrade)(member_entity_1.MemberLevel.Bronze, 10000), true);
    });
    (0, node_test_1.default)('Bronze member at 0 points should NOT upgrade', () => {
        strict_1.default.equal((0, member_entity_1.canUpgrade)(member_entity_1.MemberLevel.Bronze, 0), false);
    });
});
// ─── 阈值边界测试 ───
(0, node_test_1.describe)('Member - Simulator (threshold boundaries)', () => {
    (0, node_test_1.default)('MEMBER_LEVEL_THRESHOLDS should have all 5 levels defined', () => {
        const levels = Object.keys(member_entity_1.MEMBER_LEVEL_THRESHOLDS);
        strict_1.default.equal(levels.length, 5);
        for (const lv of Object.values(member_entity_1.MemberLevel)) {
            strict_1.default.ok(lv in member_entity_1.MEMBER_LEVEL_THRESHOLDS, `Missing threshold for ${lv}`);
        }
    });
    (0, node_test_1.default)('thresholds should be monotonically increasing', () => {
        const thresholds = Object.values(member_entity_1.MEMBER_LEVEL_THRESHOLDS);
        for (let i = 1; i < thresholds.length; i++) {
            strict_1.default.ok(thresholds[i] > thresholds[i - 1], `Threshold ${thresholds[i]} should be > ${thresholds[i - 1]}`);
        }
    });
    (0, node_test_1.default)('exactly at Bronze threshold (0) should be Bronze', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Bronze]), member_entity_1.MemberLevel.Bronze);
    });
    (0, node_test_1.default)('exactly at Silver threshold should be Silver', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Silver]), member_entity_1.MemberLevel.Silver);
    });
    (0, node_test_1.default)('one point below Silver threshold should be Bronze', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Silver] - 1), member_entity_1.MemberLevel.Bronze);
    });
    (0, node_test_1.default)('exactly at Diamond threshold should be Diamond', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Diamond]), member_entity_1.MemberLevel.Diamond);
    });
    (0, node_test_1.default)('one point below Diamond threshold should be Platinum', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Diamond] - 1), member_entity_1.MemberLevel.Platinum);
    });
});
// ─── 积分调整模拟 ───
(0, node_test_1.describe)('Member - Simulator (points adjustment)', () => {
    (0, node_test_1.default)('adding points should trigger upgrade when crossing threshold', () => {
        const member = createSimulatedMember('mem-upgrade', member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Silver] - 1);
        strict_1.default.equal(member.level, member_entity_1.MemberLevel.Bronze);
        const result = simulatePointsAdjustment(member, 1);
        strict_1.default.equal(result.updated.level, member_entity_1.MemberLevel.Silver);
        strict_1.default.equal(result.action, 'upgrade');
    });
    (0, node_test_1.default)('large point addition can skip levels (Bronze to Platinum)', () => {
        const member = createSimulatedMember('mem-skip', 100);
        strict_1.default.equal(member.level, member_entity_1.MemberLevel.Bronze);
        const result = simulatePointsAdjustment(member, 10000);
        strict_1.default.equal(result.updated.level, member_entity_1.MemberLevel.Platinum);
        strict_1.default.equal(result.action, 'upgrade');
    });
    (0, node_test_1.default)('multiple small additions should eventually trigger upgrade', () => {
        let member = createSimulatedMember('mem-incremental', 4000);
        strict_1.default.equal(member.level, member_entity_1.MemberLevel.Gold);
        // Need 10000 for Platinum
        for (let i = 0; i < 6; i++) {
            const result = simulatePointsAdjustment(member, 1000);
            member = result.updated;
        }
        strict_1.default.equal(member.points, 10000);
        strict_1.default.equal(member.level, member_entity_1.MemberLevel.Platinum);
    });
    (0, node_test_1.default)('points cannot go below zero', () => {
        const member = createSimulatedMember('mem-min-zero', 50);
        const result = simulatePointsAdjustment(member, -100);
        strict_1.default.equal(result.updated.points, 0);
        strict_1.default.equal(result.updated.level, member_entity_1.MemberLevel.Bronze);
    });
    (0, node_test_1.default)('deducting points can cause downgrade', () => {
        const member = createSimulatedMember('mem-drop', 12000); // Platinum
        strict_1.default.equal(member.level, member_entity_1.MemberLevel.Platinum);
        const result = simulatePointsAdjustment(member, -3000);
        strict_1.default.equal(result.updated.points, 9000);
        strict_1.default.equal(result.updated.level, member_entity_1.MemberLevel.Gold);
        strict_1.default.equal(result.action, 'downgrade');
    });
});
// ─── 会员状态流转 ───
(0, node_test_1.describe)('Member - Simulator (status transitions)', () => {
    (0, node_test_1.default)('Active member can be frozen', () => {
        const member = createSimulatedMember('mem-to-freeze', 1000);
        strict_1.default.equal(member.status, member_entity_1.MemberStatus.Active);
        const frozen = simulateStatusChange(member, member_entity_1.MemberStatus.Frozen);
        strict_1.default.equal(frozen.status, member_entity_1.MemberStatus.Frozen);
    });
    (0, node_test_1.default)('Active member can be blacklisted', () => {
        const member = createSimulatedMember('mem-to-blacklist', 100);
        const blacklisted = simulateStatusChange(member, member_entity_1.MemberStatus.Blacklisted);
        strict_1.default.equal(blacklisted.status, member_entity_1.MemberStatus.Blacklisted);
    });
    (0, node_test_1.default)('Active member can be expired', () => {
        const member = createSimulatedMember('mem-expire', 500);
        const expired = simulateStatusChange(member, member_entity_1.MemberStatus.Expired);
        strict_1.default.equal(expired.status, member_entity_1.MemberStatus.Expired);
    });
    (0, node_test_1.default)('Expired member can still login in this model', () => {
        const expired = simulateStatusChange(createSimulatedMember('mem-login-expired', 200), member_entity_1.MemberStatus.Expired);
        const result = simulateMemberLogin(expired);
        strict_1.default.equal(result.success, true);
    });
    (0, node_test_1.default)('Frozen member should NOT be able to login', () => {
        const frozen = simulateStatusChange(createSimulatedMember('mem-login-frozen', 2000), member_entity_1.MemberStatus.Frozen);
        const result = simulateMemberLogin(frozen);
        strict_1.default.equal(result.success, false);
    });
    (0, node_test_1.default)('Blacklisted member should NOT be able to login', () => {
        const blacklisted = simulateStatusChange(createSimulatedMember('mem-login-bl', 3000), member_entity_1.MemberStatus.Blacklisted);
        const result = simulateMemberLogin(blacklisted);
        strict_1.default.equal(result.success, false);
    });
    (0, node_test_1.default)('Active member login should update lastActiveAt', async () => {
        const member = createSimulatedMember('mem-login-ok', 1000);
        const beforeLogin = member.lastActiveAt;
        // Small delay to ensure timestamp changes
        await new Promise(resolve => setTimeout(resolve, 5));
        const result = simulateMemberLogin(member);
        strict_1.default.equal(result.success, true);
        strict_1.default.ok(result.lastActiveAt !== beforeLogin, `lastActiveAt should be updated: ${result.lastActiveAt} vs ${beforeLogin}`);
    });
});
// ─── 角色场景 ───
(0, node_test_1.describe)('Member - Simulator (👔店长)', () => {
    (0, node_test_1.default)('店长应能查看全店会员等级分布', () => {
        const members = [
            createSimulatedMember('mem-001', 100),
            createSimulatedMember('mem-002', 1200),
            createSimulatedMember('mem-003', 5500),
            createSimulatedMember('mem-004', 12000),
            createSimulatedMember('mem-005', 60000)
        ];
        const levels = members.map(m => m.level);
        const distribution = {};
        for (const level of levels) {
            distribution[level] = (distribution[level] ?? 0) + 1;
        }
        strict_1.default.ok(Object.keys(distribution).length >= 3, `Expected at least 3 distinct levels, got ${Object.keys(distribution).length}`);
    });
    (0, node_test_1.default)('店长应能识别高价值会员 (Platinum+) 进行 VIP 关怀', () => {
        const members = [
            createSimulatedMember('mem-001', 100),
            createSimulatedMember('mem-002', 1200),
            createSimulatedMember('mem-003', 5500),
            createSimulatedMember('mem-004', 12000),
            createSimulatedMember('mem-005', 60000) // Diamond
        ];
        const vipMembers = members.filter(m => m.level === member_entity_1.MemberLevel.Platinum || m.level === member_entity_1.MemberLevel.Diamond);
        strict_1.default.ok(vipMembers.length >= 2, `Expected >=2 VIP members, got ${vipMembers.length}`);
        for (const vip of vipMembers) {
            strict_1.default.ok(vip.points >= member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Platinum]);
        }
    });
});
(0, node_test_1.describe)('Member - Simulator (🛒前台)', () => {
    (0, node_test_1.default)('前台应能查询会员当前积分和等级', () => {
        const member = createSimulatedMember('mem-fd', 3500);
        strict_1.default.equal(member.points, 3500);
        strict_1.default.equal(member.level, member_entity_1.MemberLevel.Gold);
    });
    (0, node_test_1.default)('前台消费后积分应正确累加', () => {
        const member = createSimulatedMember('mem-fd', 3500);
        const result = simulatePointsAdjustment(member, 500);
        strict_1.default.equal(result.updated.points, 4000);
        strict_1.default.equal(result.updated.level, member_entity_1.MemberLevel.Gold); // Still Gold
    });
    (0, node_test_1.default)('前台应能识别刚达到升级资格的会员', () => {
        const nearUpgrade = createSimulatedMember('mem-near', 9500);
        strict_1.default.equal(nearUpgrade.level, member_entity_1.MemberLevel.Gold);
        const result = simulatePointsAdjustment(nearUpgrade, 500);
        strict_1.default.equal(result.updated.points, 10000);
        strict_1.default.equal(result.updated.level, member_entity_1.MemberLevel.Platinum);
        strict_1.default.equal(result.action, 'upgrade');
    });
});
(0, node_test_1.describe)('Member - Simulator (👥HR)', () => {
    (0, node_test_1.default)('HR 应能标记黑名单会员无法登录', () => {
        const member = createSimulatedMember('mem-hr', 5000);
        const blacklisted = simulateStatusChange(member, member_entity_1.MemberStatus.Blacklisted);
        strict_1.default.equal(blacklisted.status, member_entity_1.MemberStatus.Blacklisted);
        const loginResult = simulateMemberLogin(blacklisted);
        strict_1.default.equal(loginResult.success, false);
    });
    (0, node_test_1.default)('HR 应能看到黑名单会员的积分和等级数据', () => {
        const blacklisted = simulateStatusChange(createSimulatedMember('mem-hr-data', 8000), member_entity_1.MemberStatus.Blacklisted);
        strict_1.default.equal(blacklisted.level, member_entity_1.MemberLevel.Gold);
        strict_1.default.equal(blacklisted.points, 8000);
        strict_1.default.ok(blacklisted.registeredAt);
    });
});
(0, node_test_1.describe)('Member - Simulator (🔧安监)', () => {
    (0, node_test_1.default)('安监应能冻结风险会员', () => {
        const member = createSimulatedMember('mem-sec', 12000);
        const frozen = simulateStatusChange(member, member_entity_1.MemberStatus.Frozen);
        strict_1.default.equal(frozen.status, member_entity_1.MemberStatus.Frozen);
        strict_1.default.equal(frozen.points, 12000); // 积分保留
        strict_1.default.equal(frozen.level, member_entity_1.MemberLevel.Platinum); // 等级保留
    });
    (0, node_test_1.default)('安监冻结的会员无法登录', () => {
        const frozen = simulateStatusChange(createSimulatedMember('mem-sec-login', 3000), member_entity_1.MemberStatus.Frozen);
        const result = simulateMemberLogin(frozen);
        strict_1.default.equal(result.success, false);
    });
});
(0, node_test_1.describe)('Member - Simulator (🎮导玩员)', () => {
    (0, node_test_1.default)('导玩员应能识别接近升级门槛的会员', () => {
        // 4900 points is below Gold (2000) but below Platinum (10000)
        // Actually 4900 > 2000 = Gold. Let me pick below Gold:
        const nearGoldMember = createSimulatedMember('mem-near-gold', member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Gold] - 1);
        strict_1.default.equal(nearGoldMember.level, member_entity_1.MemberLevel.Silver);
        strict_1.default.ok(nearGoldMember.points < member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Gold]);
    });
    (0, node_test_1.default)('导玩员激励消费后会员应升级到 Gold', () => {
        const nearGoldMember = createSimulatedMember('mem-upgrade-gold', member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Gold] - 1);
        strict_1.default.equal(nearGoldMember.level, member_entity_1.MemberLevel.Silver);
        const result = simulatePointsAdjustment(nearGoldMember, 1);
        strict_1.default.equal(result.updated.level, member_entity_1.MemberLevel.Gold);
        strict_1.default.equal(result.action, 'upgrade');
    });
});
(0, node_test_1.describe)('Member - Simulator (🎯运行专员)', () => {
    (0, node_test_1.default)('运行专员应能跟踪新会员从 Bronze 到 Silver 的成长路径', () => {
        let newMember = createSimulatedMember('mem-newbie', 100);
        strict_1.default.equal(newMember.level, member_entity_1.MemberLevel.Bronze);
        // Simulate multiple visits accumulating points until Silver (500)
        while (newMember.points < member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Silver]) {
            const result = simulatePointsAdjustment(newMember, 100);
            newMember = result.updated;
        }
        strict_1.default.equal(newMember.level, member_entity_1.MemberLevel.Silver);
        strict_1.default.ok(newMember.points >= member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Silver]);
    });
    (0, node_test_1.default)('运行专员应能识别到期会员进行续费提醒', () => {
        const member = createSimulatedMember('mem-renewal', 3000);
        const expired = simulateStatusChange(member, member_entity_1.MemberStatus.Expired);
        strict_1.default.equal(expired.status, member_entity_1.MemberStatus.Expired);
        strict_1.default.equal(expired.memberId, member.memberId);
        strict_1.default.ok(expired.points >= 0);
        strict_1.default.ok(expired.registeredAt);
    });
});
(0, node_test_1.describe)('Member - Simulator (🤝团建)', () => {
    (0, node_test_1.default)('团建应能筛选 VIP 会员 (Platinum+) 参与高端活动', () => {
        const members = [
            createSimulatedMember('mem-tb-001', 6000),
            createSimulatedMember('mem-tb-002', 200),
            createSimulatedMember('mem-tb-003', 60000) // Diamond
        ];
        const vipForTeambuilding = members.filter(m => m.level === member_entity_1.MemberLevel.Platinum || m.level === member_entity_1.MemberLevel.Diamond);
        strict_1.default.ok(vipForTeambuilding.length >= 1, `Expected >=1 VIP, got ${vipForTeambuilding.length}`);
        for (const vip of vipForTeambuilding) {
            strict_1.default.ok(vip.points >= member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Platinum]);
        }
    });
    (0, node_test_1.default)('团建应排除黑名单和冻结会员', () => {
        const members = [
            createSimulatedMember('mem-safe-1', 500),
            simulateStatusChange(createSimulatedMember('mem-bl-1', 2000), member_entity_1.MemberStatus.Blacklisted),
            simulateStatusChange(createSimulatedMember('mem-frozen-1', 3000), member_entity_1.MemberStatus.Frozen),
            createSimulatedMember('mem-safe-2', 15000)
        ];
        const safeMembers = members.filter(m => m.status !== member_entity_1.MemberStatus.Blacklisted && m.status !== member_entity_1.MemberStatus.Frozen);
        strict_1.default.equal(safeMembers.length, 2);
    });
});
(0, node_test_1.describe)('Member - Simulator (📢营销)', () => {
    (0, node_test_1.default)('营销应能按等级分层推送不同内容', () => {
        const members = [
            createSimulatedMember('mem-mkt-001', 500),
            createSimulatedMember('mem-mkt-002', 3000),
            createSimulatedMember('mem-mkt-003', 12000),
            createSimulatedMember('mem-mkt-004', 60000) // Diamond
        ];
        const segments = {};
        for (const m of members) {
            (segments[m.level] ??= []).push(m);
        }
        const nonEmptyLevels = Object.values(member_entity_1.MemberLevel).filter(l => (segments[l]?.length ?? 0) > 0);
        strict_1.default.ok(nonEmptyLevels.length >= 2, `Expected >=2 distinct levels, got ${nonEmptyLevels.length}`);
    });
    (0, node_test_1.default)('营销应能向白金会员 (Platinum) 推送专属活动', () => {
        const members = [
            createSimulatedMember('mem-mkt-p1', 12000),
            createSimulatedMember('mem-mkt-p2', 15000),
            createSimulatedMember('mem-mkt-g1', 3000)
        ];
        const platinumMembers = members.filter(m => m.level === member_entity_1.MemberLevel.Platinum);
        strict_1.default.ok(platinumMembers.length >= 2, `Expected >=2 Platinum members, got ${platinumMembers.length}`);
        for (const pm of platinumMembers) {
            strict_1.default.equal(pm.level, member_entity_1.MemberLevel.Platinum);
        }
    });
    (0, node_test_1.default)('营销应能对 Bronze 新会员推送首单优惠', () => {
        const members = [
            createSimulatedMember('mem-new-1', 0),
            createSimulatedMember('mem-new-2', 100),
            createSimulatedMember('mem-new-3', 499) // last point below Silver
        ];
        const bronzeMembers = members.filter(m => m.level === member_entity_1.MemberLevel.Bronze);
        strict_1.default.ok(bronzeMembers.length >= 2, `Expected >=2 Bronze members, got ${bronzeMembers.length}`);
    });
});
// ─── 全量等级覆盖 ───
(0, node_test_1.describe)('Member - Simulator (all-level coverage)', () => {
    const allLevelTests = [
        { level: member_entity_1.MemberLevel.Bronze, minPoints: member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Bronze] },
        { level: member_entity_1.MemberLevel.Silver, minPoints: member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Silver] },
        { level: member_entity_1.MemberLevel.Gold, minPoints: member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Gold] },
        { level: member_entity_1.MemberLevel.Platinum, minPoints: member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Platinum] },
        { level: member_entity_1.MemberLevel.Diamond, minPoints: member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Diamond] }
    ];
    for (const { level, minPoints } of allLevelTests) {
        (0, node_test_1.default)(`member with ${minPoints} points should be ${level}`, () => {
            const computed = (0, member_entity_1.computeMemberLevel)(minPoints);
            strict_1.default.equal(computed, level);
        });
    }
    (0, node_test_1.default)('should produce correct level for 1 million points (Diamond)', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(1000000), member_entity_1.MemberLevel.Diamond);
    });
    (0, node_test_1.default)('should produce Bronze for undefined/null-like edge (0 points)', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(0), member_entity_1.MemberLevel.Bronze);
    });
});
// ─── 批量操作 ───
(0, node_test_1.describe)('Member - Simulator (bulk operations)', () => {
    (0, node_test_1.default)('batch status change should work for 100 members', () => {
        const members = Array.from({ length: 100 }, (_, i) => createSimulatedMember(`bulk-${i}`, Math.floor(Math.random() * 60000)));
        const frozen = members.map(m => simulateStatusChange(m, member_entity_1.MemberStatus.Frozen));
        strict_1.default.equal(frozen.length, 100);
        for (const fm of frozen) {
            strict_1.default.equal(fm.status, member_entity_1.MemberStatus.Frozen);
        }
    });
    (0, node_test_1.default)('batch points adjustment should handle 500 members without error', () => {
        const members = Array.from({ length: 500 }, (_, i) => createSimulatedMember(`bulk-adj-${i}`, 1000));
        const results = members.map(m => simulatePointsAdjustment(m, 500));
        strict_1.default.equal(results.length, 500);
        for (const r of results) {
            strict_1.default.equal(r.updated.points, 1500);
            strict_1.default.ok(r.action === 'upgrade' || r.action === 'downgrade' || r.action === 'unchanged');
        }
    });
    (0, node_test_1.default)('should correctly categorize a mixed batch by level', () => {
        // Deterministic quotas to avoid flaky random sampling (BRONZE range 0-499
        // is only ~0.7% of the 0-70000 spread; 200 random samples may yield 0 BRONZE).
        // Quotas: 40 × BRONZE(0..499) + 40 × SILVER(500..1999) + 40 × GOLD(2000..9999)
        //        + 40 × PLATINUM(10000..49999) + 40 × DIAMOND(50000+)
        const quotas = [
            [0, 499],
            [500, 1999],
            [2000, 9999],
            [10000, 49999],
            [50000, 70000], // DIAMOND: 40 members
        ];
        const members = [];
        for (const [min, max] of quotas) {
            for (let i = 0; i < 40; i++) {
                members.push(createSimulatedMember(`cat-${Math.random().toString(36).slice(2)}`, Math.floor(Math.random() * (max - min + 1)) + min));
            }
        }
        const byLevel = {};
        for (const m of members) {
            byLevel[m.level] = (byLevel[m.level] ?? 0) + 1;
        }
        const total = Object.values(byLevel).reduce((a, b) => a + b, 0);
        strict_1.default.equal(total, 200);
        for (const lv of Object.values(member_entity_1.MemberLevel)) {
            strict_1.default.ok(typeof byLevel[lv] === 'number', `Should have count for ${lv}`);
        }
    });
});
//# sourceMappingURL=member.simulator.test.js.map