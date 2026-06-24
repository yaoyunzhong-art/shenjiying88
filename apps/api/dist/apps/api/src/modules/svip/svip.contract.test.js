"use strict";
/**
 * 🐜 自动: [svip] [A] contract.test.ts 补全
 *
 * 覆盖:
 *   SvipTierContract / SvipMemberContract / SvipBenefitContract 接口形状
 *   toSvipTierContract / toSvipMemberContract / toSvipBenefitContract 转换函数
 *   toSvipLevelChangeContract 构建函数
 *   包含正常流程 + 边界条件 + tenantContext 剥离验证
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
const svip_entity_1 = require("./svip.entity");
const svip_contract_1 = require("./svip.contract");
const CTX = {
    tenantId: 'tenant-test-001',
    brandId: 'brand-1',
    storeId: 'store-1',
    marketCode: 'cn-mainland'
};
// ── 辅助工厂 ──
function makeSvipTier(overrides) {
    return {
        id: 'tier-001',
        tenantContext: CTX,
        name: '银卡会员',
        level: svip_entity_1.SvipTierLevel.Level1,
        minSpendAmount: 5000,
        minPoints: 500,
        benefits: ['discount_95', 'priority_queue'],
        icon: 'silver',
        color: '#C0C0C0',
        createdAt: '2026-06-23T10:00:00.000Z',
        ...overrides
    };
}
function makeSvipMember(overrides) {
    return {
        id: 'svip-member-001',
        tenantContext: CTX,
        memberId: 'member-001',
        tierId: 'tier-001',
        tierName: '银卡会员',
        tierLevel: svip_entity_1.SvipTierLevel.Level1,
        totalSpend: 6000,
        currentPoints: 600,
        joinedAt: '2026-06-01T00:00:00.000Z',
        expiresAt: '2027-06-01T00:00:00.000Z',
        status: svip_entity_1.SvipMemberStatus.Active,
        autoRenew: false,
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-23T10:00:00.000Z',
        ...overrides
    };
}
function makeSvipBenefit(overrides) {
    return {
        id: 'benefit-001',
        tierId: 'tier-001',
        benefitType: svip_entity_1.SvipBenefitType.Discount,
        benefitValue: '95%',
        description: '95折优惠',
        isActive: true,
        ...overrides
    };
}
// ──────────── toSvipTierContract ────────────
(0, node_test_1.describe)('toSvipTierContract', () => {
    (0, node_test_1.default)('完整等级转换：保留业务字段，剥离 tenantContext', () => {
        const tier = makeSvipTier();
        const contract = (0, svip_contract_1.toSvipTierContract)(tier);
        strict_1.default.equal(contract.id, 'tier-001');
        strict_1.default.equal(contract.name, '银卡会员');
        strict_1.default.equal(contract.level, svip_entity_1.SvipTierLevel.Level1);
        strict_1.default.equal(contract.minSpendAmount, 5000);
        strict_1.default.equal(contract.minPoints, 500);
        strict_1.default.deepEqual(contract.benefits, ['discount_95', 'priority_queue']);
        strict_1.default.equal(contract.icon, 'silver');
        strict_1.default.equal(contract.color, '#C0C0C0');
        strict_1.default.equal(contract.createdAt, '2026-06-23T10:00:00.000Z');
        // @ts-expect-error tenantContext 不属于 contract
        strict_1.default.equal(contract.tenantContext, undefined);
    });
    (0, node_test_1.default)('最高等级转换：至尊会员', () => {
        const tier = makeSvipTier({
            id: 'tier-005',
            name: '至尊会员',
            level: svip_entity_1.SvipTierLevel.Level5,
            minSpendAmount: 200000,
            minPoints: 40000,
            benefits: ['discount_80', 'priority_queue', 'free_upgrade', 'vip_room', 'exclusive_event', 'personal_concierge'],
            icon: 'crown',
            color: '#FF4500'
        });
        const contract = (0, svip_contract_1.toSvipTierContract)(tier);
        strict_1.default.equal(contract.level, svip_entity_1.SvipTierLevel.Level5);
        strict_1.default.equal(contract.benefits.length, 6);
        strict_1.default.equal(contract.icon, 'crown');
    });
    (0, node_test_1.default)('可选字段缺失时不影响转换', () => {
        const tier = makeSvipTier({ icon: undefined, color: undefined });
        const contract = (0, svip_contract_1.toSvipTierContract)(tier);
        strict_1.default.equal(contract.icon, undefined);
        strict_1.default.equal(contract.color, undefined);
    });
    (0, node_test_1.default)('round-trip：核心字段与原实体一致', () => {
        const tier = makeSvipTier();
        const contract = (0, svip_contract_1.toSvipTierContract)(tier);
        strict_1.default.equal(contract.id, tier.id);
        strict_1.default.equal(contract.name, tier.name);
        strict_1.default.equal(contract.level, tier.level);
        strict_1.default.equal(contract.minSpendAmount, tier.minSpendAmount);
        strict_1.default.equal(contract.createdAt, tier.createdAt);
    });
});
// ──────────── toSvipMemberContract ────────────
(0, node_test_1.describe)('toSvipMemberContract', () => {
    (0, node_test_1.default)('活跃会员转换：保留核心字段，剥离 tenantContext', () => {
        const member = makeSvipMember();
        const contract = (0, svip_contract_1.toSvipMemberContract)(member);
        strict_1.default.equal(contract.id, 'svip-member-001');
        strict_1.default.equal(contract.memberId, 'member-001');
        strict_1.default.equal(contract.tierLevel, svip_entity_1.SvipTierLevel.Level1);
        strict_1.default.equal(contract.totalSpend, 6000);
        strict_1.default.equal(contract.currentPoints, 600);
        strict_1.default.equal(contract.status, svip_entity_1.SvipMemberStatus.Active);
        strict_1.default.equal(contract.autoRenew, false);
        strict_1.default.equal(contract.expiresAt, '2027-06-01T00:00:00.000Z');
        // @ts-expect-error tenantContext 不属于 contract
        strict_1.default.equal(contract.tenantContext, undefined);
    });
    (0, node_test_1.default)('高级会员转换：Level5 至尊会员', () => {
        const member = makeSvipMember({
            id: 'svip-member-005',
            tierId: 'tier-005',
            tierName: '至尊会员',
            tierLevel: svip_entity_1.SvipTierLevel.Level5,
            totalSpend: 300000,
            currentPoints: 80000,
            autoRenew: true,
            brandId: 'brand-1',
            storeId: 'store-2'
        });
        const contract = (0, svip_contract_1.toSvipMemberContract)(member);
        strict_1.default.equal(contract.tierLevel, svip_entity_1.SvipTierLevel.Level5);
        strict_1.default.equal(contract.autoRenew, true);
        strict_1.default.equal(contract.totalSpend, 300000);
    });
    (0, node_test_1.default)('已过期会员转换', () => {
        const member = makeSvipMember({ status: svip_entity_1.SvipMemberStatus.Expired });
        const contract = (0, svip_contract_1.toSvipMemberContract)(member);
        strict_1.default.equal(contract.status, svip_entity_1.SvipMemberStatus.Expired);
    });
    (0, node_test_1.default)('已冻结会员转换', () => {
        const member = makeSvipMember({ status: svip_entity_1.SvipMemberStatus.Frozen });
        const contract = (0, svip_contract_1.toSvipMemberContract)(member);
        strict_1.default.equal(contract.status, svip_entity_1.SvipMemberStatus.Frozen);
    });
    (0, node_test_1.default)('round-trip：核心字段与原实体一致', () => {
        const member = makeSvipMember();
        const contract = (0, svip_contract_1.toSvipMemberContract)(member);
        strict_1.default.equal(contract.memberId, member.memberId);
        strict_1.default.equal(contract.tierName, member.tierName);
        strict_1.default.equal(contract.tierLevel, member.tierLevel);
        strict_1.default.equal(contract.status, member.status);
        strict_1.default.equal(contract.autoRenew, member.autoRenew);
    });
});
// ──────────── toSvipBenefitContract ────────────
(0, node_test_1.describe)('toSvipBenefitContract', () => {
    (0, node_test_1.default)('活跃权益转换', () => {
        const benefit = makeSvipBenefit();
        const contract = (0, svip_contract_1.toSvipBenefitContract)(benefit);
        strict_1.default.equal(contract.id, 'benefit-001');
        strict_1.default.equal(contract.tierId, 'tier-001');
        strict_1.default.equal(contract.benefitType, svip_entity_1.SvipBenefitType.Discount);
        strict_1.default.equal(contract.benefitValue, '95%');
        strict_1.default.equal(contract.description, '95折优惠');
        strict_1.default.equal(contract.isActive, true);
    });
    (0, node_test_1.default)('已禁用权益转换', () => {
        const benefit = makeSvipBenefit({ isActive: false });
        const contract = (0, svip_contract_1.toSvipBenefitContract)(benefit);
        strict_1.default.equal(contract.isActive, false);
    });
    (0, node_test_1.default)('VIP 房间权益类型', () => {
        const benefit = makeSvipBenefit({
            benefitType: svip_entity_1.SvipBenefitType.VipRoom,
            benefitValue: '2h',
            description: 'VIP 包间 2小时使用权'
        });
        const contract = (0, svip_contract_1.toSvipBenefitContract)(benefit);
        strict_1.default.equal(contract.benefitType, svip_entity_1.SvipBenefitType.VipRoom);
        strict_1.default.equal(contract.benefitValue, '2h');
    });
    (0, node_test_1.default)('所有权益类型枚举值均可转换', () => {
        const types = Object.values(svip_entity_1.SvipBenefitType);
        for (const bt of types) {
            const benefit = makeSvipBenefit({ benefitType: bt });
            const contract = (0, svip_contract_1.toSvipBenefitContract)(benefit);
            strict_1.default.equal(contract.benefitType, bt);
        }
    });
    (0, node_test_1.default)('round-trip：核心字段与原实体一致', () => {
        const benefit = makeSvipBenefit();
        const contract = (0, svip_contract_1.toSvipBenefitContract)(benefit);
        strict_1.default.equal(contract.benefitType, benefit.benefitType);
        strict_1.default.equal(contract.benefitValue, benefit.benefitValue);
        strict_1.default.equal(contract.description, benefit.description);
        strict_1.default.equal(contract.isActive, benefit.isActive);
    });
});
// ──────────── toSvipLevelChangeContract ────────────
(0, node_test_1.describe)('toSvipLevelChangeContract', () => {
    (0, node_test_1.default)('升级结果构建', () => {
        const result = (0, svip_contract_1.toSvipLevelChangeContract)({
            memberId: 'member-001',
            previousLevel: svip_entity_1.SvipTierLevel.Level1,
            newLevel: svip_entity_1.SvipTierLevel.Level2,
            reason: '消费达标自动升级'
        });
        strict_1.default.equal(result.memberId, 'member-001');
        strict_1.default.equal(result.previousLevel, svip_entity_1.SvipTierLevel.Level1);
        strict_1.default.equal(result.newLevel, svip_entity_1.SvipTierLevel.Level2);
        strict_1.default.equal(result.reason, '消费达标自动升级');
        strict_1.default.ok(result.changedAt);
        strict_1.default.ok(new Date(result.changedAt).getTime() > 0);
    });
    (0, node_test_1.default)('降级结果构建', () => {
        const result = (0, svip_contract_1.toSvipLevelChangeContract)({
            memberId: 'member-002',
            previousLevel: svip_entity_1.SvipTierLevel.Level3,
            newLevel: svip_entity_1.SvipTierLevel.Level2,
            reason: '积分下降降级'
        });
        strict_1.default.equal(result.previousLevel, svip_entity_1.SvipTierLevel.Level3);
        strict_1.default.equal(result.newLevel, svip_entity_1.SvipTierLevel.Level2);
        strict_1.default.equal(result.reason, '积分下降降级');
    });
    (0, node_test_1.default)('跨多级升级', () => {
        const result = (0, svip_contract_1.toSvipLevelChangeContract)({
            memberId: 'member-003',
            previousLevel: svip_entity_1.SvipTierLevel.Level1,
            newLevel: svip_entity_1.SvipTierLevel.Level5,
            reason: '大额充值直接升至至尊'
        });
        strict_1.default.equal(result.previousLevel, svip_entity_1.SvipTierLevel.Level1);
        strict_1.default.equal(result.newLevel, svip_entity_1.SvipTierLevel.Level5);
    });
    (0, node_test_1.default)('同级变更（降级/不变边界）', () => {
        const result = (0, svip_contract_1.toSvipLevelChangeContract)({
            memberId: 'member-004',
            previousLevel: svip_entity_1.SvipTierLevel.Level2,
            newLevel: svip_entity_1.SvipTierLevel.Level2,
            reason: '等级不变，仅续期'
        });
        strict_1.default.equal(result.previousLevel, svip_entity_1.SvipTierLevel.Level2);
        strict_1.default.equal(result.newLevel, svip_entity_1.SvipTierLevel.Level2);
    });
});
//# sourceMappingURL=svip.contract.test.js.map