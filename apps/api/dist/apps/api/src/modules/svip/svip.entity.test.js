"use strict";
/**
 * 🐜 自动: [svip] [A] entity.test.ts 补全
 *
 * 覆盖: SvipTierLevel / SvipMemberStatus / SvipBenefitType 枚举
 *       SvipTier / SvipMember / SvipBenefit 接口默认值
 *       SVIP_TIER_THRESHOLDS / computeSvipTierLevel / canUpgradeSvipTier / buildDefaultSvipTiers
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
const CTX = {
    tenantId: 'tenant-test-001',
    brandId: 'brand-1',
    storeId: 'store-1',
    marketCode: 'cn-mainland'
};
(0, node_test_1.describe)('SvipTierLevel 枚举', () => {
    (0, node_test_1.default)('Level1 应为 1', () => {
        strict_1.default.equal(svip_entity_1.SvipTierLevel.Level1, 1);
    });
    (0, node_test_1.default)('Level2 应为 2', () => {
        strict_1.default.equal(svip_entity_1.SvipTierLevel.Level2, 2);
    });
    (0, node_test_1.default)('Level3 应为 3', () => {
        strict_1.default.equal(svip_entity_1.SvipTierLevel.Level3, 3);
    });
    (0, node_test_1.default)('Level4 应为 4', () => {
        strict_1.default.equal(svip_entity_1.SvipTierLevel.Level4, 4);
    });
    (0, node_test_1.default)('Level5 应为 5', () => {
        strict_1.default.equal(svip_entity_1.SvipTierLevel.Level5, 5);
    });
    (0, node_test_1.default)('等级值连续递增', () => {
        const values = Object.values(svip_entity_1.SvipTierLevel).filter((v) => typeof v === 'number');
        for (let i = 1; i < values.length; i++) {
            strict_1.default.ok(values[i] > values[i - 1], `Level ${values[i]} should be > Level ${values[i - 1]}`);
        }
    });
});
(0, node_test_1.describe)('SvipMemberStatus 枚举', () => {
    (0, node_test_1.default)('Active 字符串值', () => {
        strict_1.default.equal(svip_entity_1.SvipMemberStatus.Active, 'active');
    });
    (0, node_test_1.default)('Expired 字符串值', () => {
        strict_1.default.equal(svip_entity_1.SvipMemberStatus.Expired, 'expired');
    });
    (0, node_test_1.default)('Frozen 字符串值', () => {
        strict_1.default.equal(svip_entity_1.SvipMemberStatus.Frozen, 'frozen');
    });
    (0, node_test_1.default)('所有值均为合法字符串', () => {
        const valid = ['active', 'expired', 'frozen'];
        for (const v of Object.values(svip_entity_1.SvipMemberStatus)) {
            strict_1.default.ok(valid.includes(v));
        }
    });
});
(0, node_test_1.describe)('SvipBenefitType 枚举', () => {
    (0, node_test_1.default)('应包含所有权益类型', () => {
        const types = Object.values(svip_entity_1.SvipBenefitType);
        strict_1.default.ok(types.includes('discount'));
        strict_1.default.ok(types.includes('freeUpgrade'));
        strict_1.default.ok(types.includes('priorityQueue'));
        strict_1.default.ok(types.includes('vipRoom'));
        strict_1.default.ok(types.includes('exclusiveEvent'));
    });
});
(0, node_test_1.describe)('SVIP_TIER_THRESHOLDS 阈值配置', () => {
    (0, node_test_1.default)('应包含 5 个等级', () => {
        strict_1.default.equal(Object.keys(svip_entity_1.SVIP_TIER_THRESHOLDS).length, 5);
    });
    (0, node_test_1.default)('Level1 阈值', () => {
        const t = svip_entity_1.SVIP_TIER_THRESHOLDS[svip_entity_1.SvipTierLevel.Level1];
        strict_1.default.equal(t.minSpendAmount, 5000);
        strict_1.default.equal(t.minPoints, 500);
    });
    (0, node_test_1.default)('Level5 阈值最高', () => {
        const l1 = svip_entity_1.SVIP_TIER_THRESHOLDS[svip_entity_1.SvipTierLevel.Level1];
        const l5 = svip_entity_1.SVIP_TIER_THRESHOLDS[svip_entity_1.SvipTierLevel.Level5];
        strict_1.default.ok(l5.minSpendAmount > l1.minSpendAmount);
        strict_1.default.ok(l5.minPoints > l1.minPoints);
    });
    (0, node_test_1.default)('阈值严格递增', () => {
        const levels = [svip_entity_1.SvipTierLevel.Level1, svip_entity_1.SvipTierLevel.Level2, svip_entity_1.SvipTierLevel.Level3, svip_entity_1.SvipTierLevel.Level4, svip_entity_1.SvipTierLevel.Level5];
        for (let i = 1; i < levels.length; i++) {
            const prev = svip_entity_1.SVIP_TIER_THRESHOLDS[levels[i - 1]];
            const curr = svip_entity_1.SVIP_TIER_THRESHOLDS[levels[i]];
            strict_1.default.ok(curr.minSpendAmount > prev.minSpendAmount, `Level ${i + 1} minSpendAmount should be > Level ${i}`);
            strict_1.default.ok(curr.minPoints > prev.minPoints, `Level ${i + 1} minPoints should be > Level ${i}`);
        }
    });
});
(0, node_test_1.describe)('computeSvipTierLevel', () => {
    (0, node_test_1.default)('花费和积分均不足 Level1 时返回 Level1 作为最低', () => {
        const level = (0, svip_entity_1.computeSvipTierLevel)(0, 0);
        strict_1.default.equal(level, svip_entity_1.SvipTierLevel.Level1);
    });
    (0, node_test_1.default)('达到 Level1 阈值', () => {
        const level = (0, svip_entity_1.computeSvipTierLevel)(5000, 500);
        strict_1.default.ok(level >= svip_entity_1.SvipTierLevel.Level1);
    });
    (0, node_test_1.default)('花费达到 Level3 但积分不足应降级', () => {
        const level = (0, svip_entity_1.computeSvipTierLevel)(30000, 500); // 积分仅 500
        strict_1.default.ok(level < svip_entity_1.SvipTierLevel.Level3);
    });
    (0, node_test_1.default)('积分达到 Level3 但花费不足应降级', () => {
        const level = (0, svip_entity_1.computeSvipTierLevel)(2000, 6000); // 花费仅 2000
        strict_1.default.ok(level < svip_entity_1.SvipTierLevel.Level3);
    });
    (0, node_test_1.default)('超大花费和积分返回 Level5', () => {
        const level = (0, svip_entity_1.computeSvipTierLevel)(999999, 999999);
        strict_1.default.equal(level, svip_entity_1.SvipTierLevel.Level5);
    });
    (0, node_test_1.default)('刚好 Level4 阈值返回 Level4', () => {
        const level = (0, svip_entity_1.computeSvipTierLevel)(80000, 15000);
        strict_1.default.ok(level >= svip_entity_1.SvipTierLevel.Level4);
    });
});
(0, node_test_1.describe)('canUpgradeSvipTier', () => {
    (0, node_test_1.default)('Level1 达标花费可升级', () => {
        strict_1.default.equal((0, svip_entity_1.canUpgradeSvipTier)(svip_entity_1.SvipTierLevel.Level1, 20000, 3000), true);
    });
    (0, node_test_1.default)('Level1 花费不足不可升级', () => {
        strict_1.default.equal((0, svip_entity_1.canUpgradeSvipTier)(svip_entity_1.SvipTierLevel.Level1, 2000, 300), false);
    });
    (0, node_test_1.default)('Level3 花费积分均达标可升级', () => {
        strict_1.default.equal((0, svip_entity_1.canUpgradeSvipTier)(svip_entity_1.SvipTierLevel.Level3, 100000, 20000), true);
    });
    (0, node_test_1.default)('Level5 已达最高不可升级', () => {
        strict_1.default.equal((0, svip_entity_1.canUpgradeSvipTier)(svip_entity_1.SvipTierLevel.Level5, 999999, 999999), false);
    });
});
(0, node_test_1.describe)('SvipTier 接口形状', () => {
    (0, node_test_1.default)('应构建一个完整的 SvipTier 对象', () => {
        const tier = {
            id: 'tier-001',
            tenantContext: CTX,
            name: '银卡会员',
            level: svip_entity_1.SvipTierLevel.Level1,
            minSpendAmount: 5000,
            minPoints: 500,
            benefits: ['discount_95', 'priority_queue'],
            createdAt: '2024-01-01T00:00:00Z'
        };
        strict_1.default.equal(tier.id, 'tier-001');
        strict_1.default.equal(tier.name, '银卡会员');
        strict_1.default.equal(tier.level, svip_entity_1.SvipTierLevel.Level1);
        strict_1.default.equal(tier.minSpendAmount, 5000);
        strict_1.default.equal(tier.minPoints, 500);
        strict_1.default.deepEqual(tier.benefits, ['discount_95', 'priority_queue']);
        strict_1.default.equal(tier.createdAt, '2024-01-01T00:00:00Z');
    });
    (0, node_test_1.default)('icon 和 color 应为可选', () => {
        const tier = {
            id: 'tier-opt',
            tenantContext: CTX,
            name: '测试',
            level: svip_entity_1.SvipTierLevel.Level2,
            minSpendAmount: 10000,
            minPoints: 2000,
            benefits: [],
            createdAt: '2024-01-01T00:00:00Z'
        };
        strict_1.default.equal(tier.icon, undefined);
        strict_1.default.equal(tier.color, undefined);
    });
    (0, node_test_1.default)('benefits 可包含多个', () => {
        const tier = {
            id: 'tier-benefits',
            tenantContext: CTX,
            name: '高级',
            level: svip_entity_1.SvipTierLevel.Level5,
            minSpendAmount: 200000,
            minPoints: 40000,
            benefits: ['discount_80', 'priority_queue', 'free_upgrade', 'vip_room', 'exclusive_event', 'personal_concierge'],
            icon: 'crown',
            color: '#FFD700',
            createdAt: '2024-06-01T00:00:00Z'
        };
        strict_1.default.equal(tier.benefits.length, 6);
        strict_1.default.equal(tier.icon, 'crown');
        strict_1.default.equal(tier.color, '#FFD700');
    });
});
(0, node_test_1.describe)('SvipMember 接口形状', () => {
    (0, node_test_1.default)('应构建完整的 SvipMember', () => {
        const member = {
            id: 'svip-mem-001',
            tenantContext: CTX,
            memberId: 'member-001',
            tierId: 'tier-001',
            tierName: '银卡会员',
            tierLevel: svip_entity_1.SvipTierLevel.Level1,
            totalSpend: 6000,
            currentPoints: 600,
            joinedAt: '2024-01-01T00:00:00Z',
            expiresAt: '2025-01-01T00:00:00Z',
            status: svip_entity_1.SvipMemberStatus.Active,
            autoRenew: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
        };
        strict_1.default.equal(member.memberId, 'member-001');
        strict_1.default.equal(member.tierLevel, svip_entity_1.SvipTierLevel.Level1);
        strict_1.default.equal(member.status, svip_entity_1.SvipMemberStatus.Active);
        strict_1.default.equal(member.autoRenew, false);
        strict_1.default.equal(member.totalSpend, 6000);
        strict_1.default.equal(member.currentPoints, 600);
    });
    (0, node_test_1.default)('brandId 和 storeId 应为可选', () => {
        const member = {
            id: 'svip-mem-002',
            tenantContext: CTX,
            memberId: 'member-002',
            tierId: 'tier-002',
            tierName: '金卡',
            tierLevel: svip_entity_1.SvipTierLevel.Level2,
            totalSpend: 15000,
            currentPoints: 3000,
            joinedAt: '2024-01-01T00:00:00Z',
            expiresAt: '2025-01-01T00:00:00Z',
            status: svip_entity_1.SvipMemberStatus.Active,
            autoRenew: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
        };
        strict_1.default.equal(member.brandId, undefined);
        strict_1.default.equal(member.storeId, undefined);
    });
    (0, node_test_1.default)('支持 Frozen 状态', () => {
        const member = {
            id: 'svip-mem-frozen',
            tenantContext: CTX,
            memberId: 'frozen-user',
            tierId: 'tier-001',
            tierName: '银卡',
            tierLevel: svip_entity_1.SvipTierLevel.Level1,
            totalSpend: 5000,
            currentPoints: 500,
            joinedAt: '2024-01-01T00:00:00Z',
            expiresAt: '2025-01-01T00:00:00Z',
            status: svip_entity_1.SvipMemberStatus.Frozen,
            autoRenew: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-06-01T00:00:00Z'
        };
        strict_1.default.equal(member.status, svip_entity_1.SvipMemberStatus.Frozen);
    });
    (0, node_test_1.default)('支持 Expired 状态', () => {
        const member = {
            id: 'svip-mem-expired',
            tenantContext: CTX,
            memberId: 'expired-user',
            tierId: 'tier-001',
            tierName: '银卡',
            tierLevel: svip_entity_1.SvipTierLevel.Level1,
            totalSpend: 5000,
            currentPoints: 500,
            joinedAt: '2024-01-01T00:00:00Z',
            expiresAt: '2024-06-01T00:00:00Z',
            status: svip_entity_1.SvipMemberStatus.Expired,
            autoRenew: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-06-01T00:00:00Z'
        };
        strict_1.default.equal(member.status, svip_entity_1.SvipMemberStatus.Expired);
    });
});
(0, node_test_1.describe)('SvipBenefit 接口形状', () => {
    (0, node_test_1.default)('应构建完整的 SvipBenefit', () => {
        const benefit = {
            id: 'benefit-001',
            tierId: 'tier-001',
            benefitType: svip_entity_1.SvipBenefitType.Discount,
            benefitValue: '95%',
            description: '95折优惠',
            isActive: true
        };
        strict_1.default.equal(benefit.benefitType, svip_entity_1.SvipBenefitType.Discount);
        strict_1.default.equal(benefit.benefitValue, '95%');
        strict_1.default.ok(benefit.isActive);
    });
    (0, node_test_1.default)('支持冻结权益', () => {
        const benefit = {
            id: 'benefit-inactive',
            tierId: 'tier-001',
            benefitType: svip_entity_1.SvipBenefitType.VipRoom,
            benefitValue: '2h',
            description: '已下线',
            isActive: false
        };
        strict_1.default.equal(benefit.isActive, false);
    });
});
(0, node_test_1.describe)('buildDefaultSvipTiers', () => {
    (0, node_test_1.default)('应返回 5 个默认等级', () => {
        const tiers = (0, svip_entity_1.buildDefaultSvipTiers)(CTX);
        strict_1.default.equal(tiers.length, 5);
    });
    (0, node_test_1.default)('等级按 level 升序排列', () => {
        const tiers = (0, svip_entity_1.buildDefaultSvipTiers)(CTX);
        for (let i = 1; i < tiers.length; i++) {
            strict_1.default.ok(tiers[i].level > tiers[i - 1].level);
        }
    });
    (0, node_test_1.default)('Level1 名称为"银卡会员"', () => {
        const tiers = (0, svip_entity_1.buildDefaultSvipTiers)(CTX);
        strict_1.default.equal(tiers[0].name, '银卡会员');
    });
    (0, node_test_1.default)('Level5 名称为"至尊会员"', () => {
        const tiers = (0, svip_entity_1.buildDefaultSvipTiers)(CTX);
        strict_1.default.equal(tiers[4].name, '至尊会员');
    });
    (0, node_test_1.default)('每个等级应有 tenantContext', () => {
        const tiers = (0, svip_entity_1.buildDefaultSvipTiers)(CTX);
        for (const tier of tiers) {
            strict_1.default.equal(tier.tenantContext.tenantId, CTX.tenantId);
        }
    });
    (0, node_test_1.default)('阈值与 SVIP_TIER_THRESHOLDS 一致', () => {
        const tiers = (0, svip_entity_1.buildDefaultSvipTiers)(CTX);
        for (const tier of tiers) {
            const expected = svip_entity_1.SVIP_TIER_THRESHOLDS[tier.level];
            strict_1.default.equal(tier.minSpendAmount, expected.minSpendAmount);
            strict_1.default.equal(tier.minPoints, expected.minPoints);
        }
    });
    (0, node_test_1.default)('各等级应有 unique id', () => {
        const tiers = (0, svip_entity_1.buildDefaultSvipTiers)(CTX);
        const ids = new Set(tiers.map((t) => t.id));
        strict_1.default.equal(ids.size, 5);
    });
});
//# sourceMappingURL=svip.entity.test.js.map