"use strict";
/**
 * 🐜 扩展角色测试: svip 模块
 *
 * 4 个附加角色视角：
 * 🛒前台 — 检查 VIP 升级资格
 * 👔店长 — 查看 VIP 统计数据
 * 🎯运行专员 — 管理 VIP 权益
 * 📢营销 — 针对 VIP 会员营销
 *
 * 每个角色 3 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
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
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const svip_controller_1 = require("./svip.controller");
const svip_service_1 = require("./svip.service");
const svip_entity_1 = require("./svip.entity");
// ── 测试数据工厂 ──
const tenantCtx = {
    tenantId: 't-svip-ext',
    brandId: 'b-arcade',
    storeId: 's-main',
};
function createController() {
    const service = new svip_service_1.SvipService();
    return new svip_controller_1.SvipController(service);
}
function createSvipEnv(ctrl) {
    const tiers = ctrl.initDefaultTiers(tenantCtx);
    strict_1.default.equal(tiers.length, 5);
    const level1Tier = tiers.find((t) => t.level === svip_entity_1.SvipTierLevel.Level1);
    const member = ctrl.createMember(tenantCtx, {
        memberId: 'mem-vip-001',
        tierId: level1Tier.id,
        totalSpend: 6000,
        currentPoints: 800,
        expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
    });
    return { tiers, member, level1Tier };
}
// ──────────────────────────────────────────────────────────────────────
// 🛒前台 — 检查 VIP 升级资格 (reception checking VIP upgrade eligibility)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('🛒前台 — VIP 升级资格查询视角', () => {
    (0, node_test_1.default)('消费达标可升级至更高等级 (tier calculation)', () => {
        const ctrl = createController();
        const { tiers } = createSvipEnv(ctrl);
        // 模拟高消费会员：当前 Level1，消费 15000，积分 3000 → 应可升到 Level2
        const level2Tier = tiers.find((t) => t.level === svip_entity_1.SvipTierLevel.Level2);
        const upgraded = ctrl.upgradeTier(tenantCtx, {
            memberId: 'mem-vip-001',
            targetTierLevel: svip_entity_1.SvipTierLevel.Level2,
            totalSpend: 15000,
            currentPoints: 3000,
            reason: '消费达标自动升级',
        });
        strict_1.default.equal(upgraded.tierLevel, svip_entity_1.SvipTierLevel.Level2);
        strict_1.default.equal(upgraded.tierName, level2Tier.name);
    });
    (0, node_test_1.default)('积分不足无法升级 (upgrade eligibility check)', () => {
        const ctrl = createController();
        createSvipEnv(ctrl);
        // 消费金额足够 Level2（10000+）但积分不足（2000+）
        strict_1.default.throws(() => ctrl.upgradeTier(tenantCtx, {
            memberId: 'mem-vip-001',
            targetTierLevel: svip_entity_1.SvipTierLevel.Level2,
            totalSpend: 12000,
            currentPoints: 500,
            reason: '尝试升级',
        }), /Insufficient/i);
    });
    (0, node_test_1.default)('查询会员当前等级信息', () => {
        const ctrl = createController();
        const { tiers } = createSvipEnv(ctrl);
        const info = ctrl.getMemberTier(tenantCtx, 'mem-vip-001');
        (0, strict_1.default)(info, '应返回会员等级信息');
        strict_1.default.equal(info.tierLevel, svip_entity_1.SvipTierLevel.Level1);
        strict_1.default.equal(info.memberId, 'mem-vip-001');
        // 查询不存在的会员返回 undefined
        const notFound = ctrl.getMemberTier(tenantCtx, 'non-existent-member');
        strict_1.default.equal(notFound, undefined);
    });
});
// ──────────────────────────────────────────────────────────────────────
// 👔店长 — 查看 VIP 统计数据 (shop manager viewing VIP stats)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('👔店长 — VIP 统计视角', () => {
    (0, node_test_1.default)('查看所有等级配置与会员分布', () => {
        const ctrl = createController();
        const { tiers } = createSvipEnv(ctrl);
        const allTiers = ctrl.listTiers(tenantCtx, {});
        strict_1.default.equal(allTiers.length, 5);
        // 等级有序（Level1 → Level5）
        for (let i = 0; i < allTiers.length; i++) {
            strict_1.default.equal(allTiers[i].level, i + 1);
        }
    });
    (0, node_test_1.default)('按等级筛选查看会员列表', () => {
        const ctrl = createController();
        const { tiers } = createSvipEnv(ctrl);
        // 创建多个会员在不同等级
        const level2Tier = tiers.find((t) => t.level === svip_entity_1.SvipTierLevel.Level2);
        ctrl.createMember(tenantCtx, {
            memberId: 'mem-vip-002',
            tierId: level2Tier.id,
            totalSpend: 15000,
            currentPoints: 3000,
            expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
        });
        const level2Members = ctrl.listMembers(tenantCtx, { tierLevel: svip_entity_1.SvipTierLevel.Level2 });
        strict_1.default.equal(level2Members.length, 1);
        strict_1.default.equal(level2Members[0].memberId, 'mem-vip-002');
    });
    (0, node_test_1.default)('查看会员可用权益列表', () => {
        const ctrl = createController();
        const { member } = createSvipEnv(ctrl);
        const benefits = ctrl.getMemberBenefits(tenantCtx, 'mem-vip-001');
        (0, strict_1.default)(Array.isArray(benefits));
        // Level1 有 95 折 + 优先排队权益
        (0, strict_1.default)(benefits.length >= 1);
    });
});
// ──────────────────────────────────────────────────────────────────────
// 🎯运行专员 — 管理 VIP 权益 (operations managing VIP benefits)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('🎯运行专员 — VIP 权益管理视角', () => {
    (0, node_test_1.default)('创建新的 VIP 权益 (benefit assignment)', () => {
        const ctrl = createController();
        const { tiers } = createSvipEnv(ctrl);
        const level3Tier = tiers.find((t) => t.level === svip_entity_1.SvipTierLevel.Level3);
        const benefit = ctrl.createBenefit({
            tierId: level3Tier.id,
            benefitType: svip_entity_1.SvipBenefitType.ExclusiveEvent,
            benefitValue: 'yearly_gala',
            description: '年度VIP晚宴',
            isActive: true,
        });
        strict_1.default.equal(benefit.benefitType, svip_entity_1.SvipBenefitType.ExclusiveEvent);
        strict_1.default.equal(benefit.isActive, true);
        // 验证权益已关联到等级
        const tierBenefits = ctrl.listBenefits(level3Tier.id);
        (0, strict_1.default)(tierBenefits.length >= 1);
        (0, strict_1.default)(tierBenefits.some((b) => b.benefitType === svip_entity_1.SvipBenefitType.ExclusiveEvent));
    });
    (0, node_test_1.default)('更新权益状态 (enable/disable benefit)', () => {
        const ctrl = createController();
        const { tiers } = createSvipEnv(ctrl);
        const level1Tier = tiers.find((t) => t.level === svip_entity_1.SvipTierLevel.Level1);
        const benefit = ctrl.createBenefit({
            tierId: level1Tier.id,
            benefitType: svip_entity_1.SvipBenefitType.VipRoom,
            benefitValue: '2h_free',
            description: '免费 VIP 房 2 小时',
            isActive: true,
        });
        // 禁用权益
        const deactivated = ctrl.updateBenefit(benefit.id, { isActive: false });
        strict_1.default.equal(deactivated.isActive, false);
        // 验证更新已生效
        const updatedBenefit = ctrl.listBenefits(level1Tier.id)
            .find((b) => b.id === benefit.id);
        (0, strict_1.default)(updatedBenefit);
        strict_1.default.equal(updatedBenefit.isActive, false);
    });
    (0, node_test_1.default)('会员冻结后无法使用权益', () => {
        const ctrl = createController();
        createSvipEnv(ctrl);
        // 冻结会员
        const frozen = ctrl.freezeMember(tenantCtx, 'mem-vip-001');
        strict_1.default.equal(frozen.status, svip_entity_1.SvipMemberStatus.Frozen);
        // 冻结会员使用权益应失败
        strict_1.default.throws(() => ctrl.useBenefit(tenantCtx, {
            memberId: 'mem-vip-001',
            benefitType: svip_entity_1.SvipBenefitType.PriorityQueue,
        }), /frozen/i);
    });
});
// ──────────────────────────────────────────────────────────────────────
// 📢营销 — 针对 VIP 会员营销 (marketing targeting VIP promotions)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('📢营销 — VIP 营销视角', () => {
    (0, node_test_1.default)('查询所有 VIP 会员用于营销推送 (list VIP members for campaign)', () => {
        const ctrl = createController();
        const { tiers } = createSvipEnv(ctrl);
        // 创建多个会员
        const level3Tier = tiers.find((t) => t.level === svip_entity_1.SvipTierLevel.Level3);
        ctrl.createMember(tenantCtx, {
            memberId: 'mem-vip-003',
            tierId: level3Tier.id,
            totalSpend: 35000,
            currentPoints: 7000,
            expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
        });
        const allMembers = ctrl.listMembers(tenantCtx, {});
        strict_1.default.equal(allMembers.length, 2);
        // 按等级筛选高级会员用于定向营销
        const highValue = ctrl.listMembers(tenantCtx, { tierLevel: svip_entity_1.SvipTierLevel.Level3 });
        strict_1.default.equal(highValue.length, 1);
        (0, strict_1.default)(highValue[0].totalSpend >= 30000, '高级会员应有高消费');
    });
    (0, node_test_1.default)('降级超期会员 — 检查自动过期处理 (auto-downgrade expired)', () => {
        const ctrl = createController();
        const { tiers } = createSvipEnv(ctrl);
        // 创建已过期会员
        const level1Tier = tiers.find((t) => t.level === svip_entity_1.SvipTierLevel.Level1);
        ctrl.createMember(tenantCtx, {
            memberId: 'mem-expired-001',
            tierId: level1Tier.id,
            totalSpend: 6000,
            currentPoints: 800,
            expiresAt: new Date(Date.now() - 1 * 86400000).toISOString(), // 昨天到期
        });
        // 执行过期检查
        const results = ctrl.checkAndDowngradeExpired(tenantCtx);
        (0, strict_1.default)(Array.isArray(results));
        // 过期会员至少应被处理
        const expiredProcessed = results.some((r) => r.memberId === 'mem-expired-001');
        (0, strict_1.default)(expiredProcessed, '过期会员应在处理结果中');
    });
    (0, node_test_1.default)('查询升级路径 — 会员消费是否达标更高等级', () => {
        const ctrl = createController();
        const { tiers } = createSvipEnv(ctrl);
        // Level1 会员，消费 5000 → 应还在 Level1
        const level1Info = ctrl.getMemberTier(tenantCtx, 'mem-vip-001');
        strict_1.default.equal(level1Info.tierLevel, svip_entity_1.SvipTierLevel.Level1);
        // 手动升级到 Level2
        ctrl.upgradeTier(tenantCtx, {
            memberId: 'mem-vip-001',
            targetTierLevel: svip_entity_1.SvipTierLevel.Level2,
            totalSpend: 15000,
            currentPoints: 3000,
            reason: '营销活动升级',
        });
        const upgraded = ctrl.getMemberTier(tenantCtx, 'mem-vip-001');
        strict_1.default.equal(upgraded.tierLevel, svip_entity_1.SvipTierLevel.Level2);
    });
});
//# sourceMappingURL=svip.role-extended.test.js.map