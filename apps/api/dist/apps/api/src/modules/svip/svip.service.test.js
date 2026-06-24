"use strict";
/**
 * 🐜 自动: [svip] [A] service.test.ts 补全
 *
 * 覆盖: initDefaultTiers / listTiers / getTier / upsertTier / getTierByLevel
 *       createMember / getMemberTier / listMembers / findMemberByMemberId
 *       upgradeTier / downgradeTier / checkAndDowngradeExpired
 *       freezeMember / unfreezeMember
 *       listBenefits / createBenefit / updateBenefit / useBenefit
 *       checkAndAutoUpgrade / getMemberAvailableBenefits
 *       resetSvipStoresForTests
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
const svip_service_1 = require("./svip.service");
const svip_entity_1 = require("./svip.entity");
const CTX = {
    tenantId: 'tenant-svip-svc',
    brandId: 'brand-svip',
    storeId: 'store-svip',
    marketCode: 'cn-mainland'
};
let service;
(0, node_test_1.beforeEach)(() => {
    service = new svip_service_1.SvipService();
});
(0, node_test_1.afterEach)(() => {
    service.resetSvipStoresForTests();
});
function initThreeTiers() {
    service.upsertTier(CTX, {
        name: '铜卡',
        level: 1,
        minSpendAmount: 3000,
        minPoints: 300,
        benefits: ['discount_95']
    });
    service.upsertTier(CTX, {
        name: '银卡',
        level: 2,
        minSpendAmount: 8000,
        minPoints: 1000,
        benefits: ['discount_90', 'priority_queue', 'free_upgrade']
    });
    service.upsertTier(CTX, {
        name: '金卡',
        level: 3,
        minSpendAmount: 15000,
        minPoints: 3000,
        benefits: ['discount_85', 'priority_queue', 'free_upgrade']
    });
}
function createActiveMember(memberId, tierLevel = svip_entity_1.SvipTierLevel.Level1) {
    const tier = service.getTierByLevel(tierLevel, CTX.tenantId);
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    // SVIP_TIER_THRESHOLDS[1] = { minSpendAmount: 5000, minPoints: 500 }
    const minThreshold = tierLevel === svip_entity_1.SvipTierLevel.Level1 ? { totalSpend: 6000, currentPoints: 600 }
        : tierLevel === svip_entity_1.SvipTierLevel.Level2 ? { totalSpend: 12000, currentPoints: 3000 }
            : { totalSpend: 30000, currentPoints: 6000 };
    return service.createMember(CTX, {
        memberId,
        tierId: tier.id,
        totalSpend: minThreshold.totalSpend,
        currentPoints: minThreshold.currentPoints,
        expiresAt: future
    });
}
// ================================================================
// 等级管理
// ================================================================
(0, node_test_1.describe)('initDefaultTiers', () => {
    (0, node_test_1.default)('应初始化 5 个默认等级', () => {
        const tiers = service.initDefaultTiers(CTX);
        strict_1.default.equal(tiers.length, 5);
        strict_1.default.equal(tiers[0].level, svip_entity_1.SvipTierLevel.Level1);
        strict_1.default.equal(tiers[4].level, svip_entity_1.SvipTierLevel.Level5);
    });
    (0, node_test_1.default)('第二次调用不重复创建', () => {
        const first = service.initDefaultTiers(CTX);
        const second = service.initDefaultTiers(CTX);
        strict_1.default.equal(first.length, 5);
        strict_1.default.equal(second.length, 5);
        strict_1.default.equal(first[0].id, second[0].id);
    });
    (0, node_test_1.default)('多租户隔离', () => {
        const ctx2 = { ...CTX, tenantId: 'other-tenant' };
        const tiers1 = service.initDefaultTiers(CTX);
        const tiers2 = service.initDefaultTiers(ctx2);
        strict_1.default.equal(tiers1.length, 5);
        strict_1.default.equal(tiers2.length, 5);
        // 不同租户等级 ID 应不同
        strict_1.default.notEqual(tiers1[0].id, tiers2[0].id);
    });
});
(0, node_test_1.describe)('listTiers', () => {
    (0, node_test_1.default)('空时返回空数组', () => {
        const result = service.listTiers(CTX.tenantId);
        strict_1.default.deepEqual(result, []);
    });
    (0, node_test_1.default)('应列出所有等级', () => {
        initThreeTiers();
        const tiers = service.listTiers(CTX.tenantId);
        strict_1.default.equal(tiers.length, 3);
    });
    (0, node_test_1.default)('按 level 排序', () => {
        initThreeTiers();
        const tiers = service.listTiers(CTX.tenantId);
        for (let i = 1; i < tiers.length; i++) {
            strict_1.default.ok(tiers[i].level > tiers[i - 1].level);
        }
    });
    (0, node_test_1.default)('租户隔离', () => {
        initThreeTiers();
        const otherTiers = service.listTiers('other-tenant');
        strict_1.default.equal(otherTiers.length, 0);
    });
});
(0, node_test_1.describe)('getTier', () => {
    (0, node_test_1.default)('应通过 id 获取等级', () => {
        initThreeTiers();
        const tiers = service.listTiers(CTX.tenantId);
        const found = service.getTier(tiers[0].id, CTX.tenantId);
        strict_1.default.ok(found);
        strict_1.default.equal(found.id, tiers[0].id);
    });
    (0, node_test_1.default)('不存在返回 undefined', () => {
        const result = service.getTier('non-existent', CTX.tenantId);
        strict_1.default.equal(result, undefined);
    });
    (0, node_test_1.default)('跨租户隔离', () => {
        initThreeTiers();
        const tiers = service.listTiers(CTX.tenantId);
        const result = service.getTier(tiers[0].id, 'other-tenant');
        strict_1.default.equal(result, undefined);
    });
});
(0, node_test_1.describe)('getTierByLevel', () => {
    (0, node_test_1.default)('按等级数值查找', () => {
        initThreeTiers();
        const tier = service.getTierByLevel(2, CTX.tenantId);
        strict_1.default.ok(tier);
        strict_1.default.equal(tier.level, svip_entity_1.SvipTierLevel.Level2);
        strict_1.default.equal(tier.name, '银卡');
    });
    (0, node_test_1.default)('不存在的等级返回 undefined', () => {
        const result = service.getTierByLevel(999, CTX.tenantId);
        strict_1.default.equal(result, undefined);
    });
});
(0, node_test_1.describe)('upsertTier', () => {
    (0, node_test_1.default)('创建新等级', () => {
        const tier = service.upsertTier(CTX, {
            name: '测试等级',
            level: 1,
            minSpendAmount: 1000,
            minPoints: 100,
            benefits: ['test']
        });
        strict_1.default.ok(tier.id);
        strict_1.default.equal(tier.name, '测试等级');
        strict_1.default.equal(tier.level, svip_entity_1.SvipTierLevel.Level1);
    });
    (0, node_test_1.default)('更新已存在的等级', () => {
        const created = service.upsertTier(CTX, {
            name: '初始',
            level: 1,
            minSpendAmount: 1000,
            minPoints: 100,
            benefits: ['old']
        });
        const updated = service.upsertTier(CTX, {
            id: created.id,
            name: '更新后的等级',
            level: 1,
            minSpendAmount: 2000,
            minPoints: 200,
            benefits: ['new']
        });
        strict_1.default.equal(updated.id, created.id);
        strict_1.default.equal(updated.name, '更新后的等级');
        strict_1.default.equal(updated.minSpendAmount, 2000);
    });
    (0, node_test_1.default)('更新时保留 createdAt', () => {
        const created = service.upsertTier(CTX, {
            name: '保留创建时间',
            level: 1,
            minSpendAmount: 1000,
            minPoints: 100,
            benefits: ['test']
        });
        const updated = service.upsertTier(CTX, {
            id: created.id,
            name: '保留',
            level: 1,
            minSpendAmount: 2000,
            minPoints: 200,
            benefits: ['test']
        });
        strict_1.default.equal(updated.createdAt, created.createdAt);
    });
});
// ================================================================
// 会员管理
// ================================================================
(0, node_test_1.describe)('createMember', () => {
    (0, node_test_1.default)('应创建会员并标记 Active', () => {
        initThreeTiers();
        const m = createActiveMember('mem-new');
        strict_1.default.ok(m.id);
        strict_1.default.equal(m.memberId, 'mem-new');
        strict_1.default.equal(m.status, svip_entity_1.SvipMemberStatus.Active);
        strict_1.default.equal(m.tierLevel, svip_entity_1.SvipTierLevel.Level1);
    });
    (0, node_test_1.default)('同 memberId 重复创建应抛出', () => {
        initThreeTiers();
        createActiveMember('dup');
        strict_1.default.throws(() => createActiveMember('dup'), /already has an active SVIP membership/);
    });
    (0, node_test_1.default)('不存在的 tierId 应抛出', () => {
        strict_1.default.throws(() => {
            service.createMember(CTX, {
                memberId: 'bad-tier',
                tierId: 'non-existent',
                totalSpend: 5000,
                currentPoints: 500,
                expiresAt: '2025-01-01T00:00:00Z'
            });
        }, /SvipTier not found/);
    });
});
(0, node_test_1.describe)('getMemberTier', () => {
    (0, node_test_1.default)('应返回会员的 SVIP 信息', () => {
        initThreeTiers();
        createActiveMember('get-me');
        const result = service.getMemberTier('get-me', CTX.tenantId);
        strict_1.default.ok(result);
        strict_1.default.equal(result.memberId, 'get-me');
    });
    (0, node_test_1.default)('不存在的会员返回 undefined', () => {
        const result = service.getMemberTier('ghost', CTX.tenantId);
        strict_1.default.equal(result, undefined);
    });
});
(0, node_test_1.describe)('listMembers', () => {
    (0, node_test_1.default)('无会员时返回空数组', () => {
        const result = service.listMembers(CTX.tenantId);
        strict_1.default.deepEqual(result, []);
    });
    (0, node_test_1.default)('列出所有会员', () => {
        initThreeTiers();
        createActiveMember('m1');
        createActiveMember('m2');
        const members = service.listMembers(CTX.tenantId);
        strict_1.default.equal(members.length, 2);
    });
    (0, node_test_1.default)('按 status 过滤', () => {
        initThreeTiers();
        createActiveMember('active1');
        const m = createActiveMember('to-freeze');
        service.freezeMember(m.memberId, CTX.tenantId);
        const active = service.listMembers(CTX.tenantId, { status: svip_entity_1.SvipMemberStatus.Active });
        const frozen = service.listMembers(CTX.tenantId, { status: svip_entity_1.SvipMemberStatus.Frozen });
        strict_1.default.equal(active.length, 1);
        strict_1.default.equal(frozen.length, 1);
    });
    (0, node_test_1.default)('按 tierLevel 过滤', () => {
        initThreeTiers();
        createActiveMember('l1', svip_entity_1.SvipTierLevel.Level1);
        createActiveMember('l2', svip_entity_1.SvipTierLevel.Level2);
        const l1 = service.listMembers(CTX.tenantId, { tierLevel: svip_entity_1.SvipTierLevel.Level1 });
        strict_1.default.equal(l1.length, 1);
        strict_1.default.equal(l1[0].memberId, 'l1');
    });
    (0, node_test_1.default)('按 brandId 过滤', () => {
        initThreeTiers();
        createActiveMember('b1');
        const result = service.listMembers(CTX.tenantId, { brandId: CTX.brandId });
        strict_1.default.equal(result.length, 1);
    });
    (0, node_test_1.default)('租户隔离', () => {
        initThreeTiers();
        createActiveMember('isolated');
        const other = service.listMembers('other-tenant');
        strict_1.default.equal(other.length, 0);
    });
});
// ================================================================
// 升级 / 降级
// ================================================================
(0, node_test_1.describe)('upgradeTier', () => {
    (0, node_test_1.default)('从 Level1 升级到 Level2', () => {
        initThreeTiers();
        createActiveMember('upgrade', svip_entity_1.SvipTierLevel.Level1);
        const result = service.upgradeTier(CTX, {
            memberId: 'upgrade',
            targetTierLevel: 2,
            totalSpend: 12000,
            currentPoints: 3000
        });
        strict_1.default.equal(result.tierLevel, svip_entity_1.SvipTierLevel.Level2);
        strict_1.default.equal(result.tierName, '银卡');
    });
    (0, node_test_1.default)('目标等级非更高时应抛出', () => {
        initThreeTiers();
        createActiveMember('no-up', svip_entity_1.SvipTierLevel.Level2);
        strict_1.default.throws(() => {
            service.upgradeTier(CTX, { memberId: 'no-up', targetTierLevel: 1 });
        }, /not higher/);
    });
    (0, node_test_1.default)('冻结会员不可升级', () => {
        initThreeTiers();
        const m = createActiveMember('frozen-upgrade');
        service.freezeMember(m.memberId, CTX.tenantId);
        strict_1.default.throws(() => {
            service.upgradeTier(CTX, { memberId: 'frozen-upgrade', targetTierLevel: 2 });
        }, /not active/);
    });
    (0, node_test_1.default)('不存在会员应抛出', () => {
        initThreeTiers();
        strict_1.default.throws(() => {
            service.upgradeTier(CTX, { memberId: 'ghost', targetTierLevel: 2 });
        }, /SvipMember not found/);
    });
    (0, node_test_1.default)('未指定 targetTierLevel 时自动计算', () => {
        initThreeTiers();
        createActiveMember('auto-up', svip_entity_1.SvipTierLevel.Level1);
        const result = service.upgradeTier(CTX, {
            memberId: 'auto-up',
            totalSpend: 30000,
            currentPoints: 6000
        });
        strict_1.default.ok(result.tierLevel > svip_entity_1.SvipTierLevel.Level1);
    });
});
(0, node_test_1.describe)('downgradeTier', () => {
    (0, node_test_1.default)('从 Level2 降级到 Level1', () => {
        initThreeTiers();
        createActiveMember('down', svip_entity_1.SvipTierLevel.Level2);
        const result = service.downgradeTier(CTX, {
            memberId: 'down',
            targetTierLevel: 1,
            totalSpend: 3000,
            currentPoints: 300
        });
        strict_1.default.equal(result.tierLevel, svip_entity_1.SvipTierLevel.Level1);
        strict_1.default.equal(result.tierName, '铜卡');
    });
    (0, node_test_1.default)('目标等级非更低时应抛出', () => {
        initThreeTiers();
        createActiveMember('no-down', svip_entity_1.SvipTierLevel.Level1);
        strict_1.default.throws(() => {
            service.downgradeTier(CTX, { memberId: 'no-down', targetTierLevel: 2 });
        }, /not lower/);
    });
    (0, node_test_1.default)('冻结会员不可降级', () => {
        initThreeTiers();
        const m = createActiveMember('frozen-down', svip_entity_1.SvipTierLevel.Level2);
        service.freezeMember(m.memberId, CTX.tenantId);
        strict_1.default.throws(() => {
            service.downgradeTier(CTX, { memberId: 'frozen-down', targetTierLevel: 1 });
        }, /not active/);
    });
});
(0, node_test_1.describe)('checkAndDowngradeExpired', () => {
    (0, node_test_1.default)('没有到期会员返回空', () => {
        initThreeTiers();
        createActiveMember('valid');
        const result = service.checkAndDowngradeExpired(CTX.tenantId);
        strict_1.default.equal(result.length, 0);
    });
    (0, node_test_1.default)('租户隔离', () => {
        initThreeTiers();
        createActiveMember('isolated');
        const result = service.checkAndDowngradeExpired('other-tenant');
        strict_1.default.equal(result.length, 0);
    });
});
// ================================================================
// 冻结 / 解冻
// ================================================================
(0, node_test_1.describe)('freezeMember', () => {
    (0, node_test_1.default)('冻结活跃会员', () => {
        initThreeTiers();
        const m = createActiveMember('freeze');
        const result = service.freezeMember(m.memberId, CTX.tenantId);
        strict_1.default.equal(result.status, svip_entity_1.SvipMemberStatus.Frozen);
    });
    (0, node_test_1.default)('重复冻结应抛出', () => {
        initThreeTiers();
        const m = createActiveMember('freeze2');
        service.freezeMember(m.memberId, CTX.tenantId);
        strict_1.default.throws(() => {
            service.freezeMember(m.memberId, CTX.tenantId);
        }, /already frozen/);
    });
    (0, node_test_1.default)('不存在的会员应抛出', () => {
        strict_1.default.throws(() => {
            service.freezeMember('ghost', CTX.tenantId);
        }, /SvipMember not found/);
    });
});
(0, node_test_1.describe)('unfreezeMember', () => {
    (0, node_test_1.default)('解冻已冻结会员', () => {
        initThreeTiers();
        const m = createActiveMember('unfreeze');
        service.freezeMember(m.memberId, CTX.tenantId);
        const result = service.unfreezeMember(m.memberId, CTX.tenantId);
        strict_1.default.equal(result.status, svip_entity_1.SvipMemberStatus.Active);
    });
    (0, node_test_1.default)('解冻非冻结状态应抛出', () => {
        initThreeTiers();
        const m = createActiveMember('not-frozen');
        strict_1.default.throws(() => {
            service.unfreezeMember(m.memberId, CTX.tenantId);
        }, /not frozen/);
    });
});
// ================================================================
// 权益管理
// ================================================================
(0, node_test_1.describe)('listBenefits', () => {
    (0, node_test_1.default)('无权益时返回空数组', () => {
        initThreeTiers();
        const tier = service.getTierByLevel(1, CTX.tenantId);
        const result = service.listBenefits(tier.id);
        strict_1.default.deepEqual(result, []);
    });
    (0, node_test_1.default)('列出 Tier 下所有活跃权益', () => {
        initThreeTiers();
        const tier = service.getTierByLevel(1, CTX.tenantId);
        service.createBenefit({
            tierId: tier.id,
            benefitType: svip_entity_1.SvipBenefitType.Discount,
            benefitValue: '95%',
            description: '95折'
        });
        const benefits = service.listBenefits(tier.id);
        strict_1.default.equal(benefits.length, 1);
        strict_1.default.equal(benefits[0].benefitType, svip_entity_1.SvipBenefitType.Discount);
    });
});
(0, node_test_1.describe)('createBenefit', () => {
    (0, node_test_1.default)('创建新权益', () => {
        initThreeTiers();
        const tier = service.getTierByLevel(1, CTX.tenantId);
        const benefit = service.createBenefit({
            tierId: tier.id,
            benefitType: svip_entity_1.SvipBenefitType.PriorityQueue,
            benefitValue: 'always',
            description: '优先排队'
        });
        strict_1.default.ok(benefit.id);
        strict_1.default.equal(benefit.benefitType, svip_entity_1.SvipBenefitType.PriorityQueue);
        strict_1.default.ok(benefit.isActive);
    });
});
(0, node_test_1.describe)('updateBenefit', () => {
    (0, node_test_1.default)('更新权益详情', () => {
        initThreeTiers();
        const tier = service.getTierByLevel(1, CTX.tenantId);
        const created = service.createBenefit({
            tierId: tier.id,
            benefitType: svip_entity_1.SvipBenefitType.VipRoom,
            benefitValue: '1h',
            description: '初始描述'
        });
        const updated = service.updateBenefit(created.id, {
            description: '更新描述',
            isActive: false
        });
        strict_1.default.equal(updated.description, '更新描述');
        strict_1.default.equal(updated.isActive, false);
    });
    (0, node_test_1.default)('不存在的权益应抛出', () => {
        strict_1.default.throws(() => {
            service.updateBenefit('non-existent', { description: 'test' });
        }, /SvipBenefit not found/);
    });
});
(0, node_test_1.describe)('useBenefit', () => {
    (0, node_test_1.default)('会员使用权益成功', () => {
        initThreeTiers();
        createActiveMember('use-it', svip_entity_1.SvipTierLevel.Level2);
        const tier = service.getTierByLevel(svip_entity_1.SvipTierLevel.Level2, CTX.tenantId);
        service.createBenefit({
            tierId: tier.id,
            benefitType: svip_entity_1.SvipBenefitType.FreeUpgrade,
            benefitValue: '7d',
            description: '7天免费升级'
        });
        const result = service.useBenefit('use-it', svip_entity_1.SvipBenefitType.FreeUpgrade, CTX.tenantId);
        strict_1.default.equal(result.success, true);
    });
    (0, node_test_1.default)('非活跃会员使用权益失败', () => {
        initThreeTiers();
        createActiveMember('frozen-use', svip_entity_1.SvipTierLevel.Level2);
        service.freezeMember('frozen-use', CTX.tenantId);
        const result = service.useBenefit('frozen-use', svip_entity_1.SvipBenefitType.Discount, CTX.tenantId);
        strict_1.default.equal(result.success, false);
        strict_1.default.ok(result.message.includes('not an active'));
    });
    (0, node_test_1.default)('等级不支持该权益类型', () => {
        initThreeTiers();
        createActiveMember('no-ben', svip_entity_1.SvipTierLevel.Level1);
        const result = service.useBenefit('no-ben', svip_entity_1.SvipBenefitType.ExclusiveEvent, CTX.tenantId);
        strict_1.default.equal(result.success, false);
        strict_1.default.ok(result.message.includes('does not have benefit type'));
    });
});
// ================================================================
// 自动升级
// ================================================================
(0, node_test_1.describe)('checkAndAutoUpgrade', () => {
    (0, node_test_1.default)('非会员达到 Level1 阈值自动创建 SVIP', () => {
        initThreeTiers();
        const result = service.checkAndAutoUpgrade(CTX, 'auto-new', 15000, 3000);
        strict_1.default.equal(result.upgraded, true);
        strict_1.default.ok(result.newLevel >= svip_entity_1.SvipTierLevel.Level1);
        strict_1.default.ok(result.reason.includes('Auto-enrolled'));
    });
    (0, node_test_1.default)('非会员低于阈值不创建', () => {
        initThreeTiers();
        const result = service.checkAndAutoUpgrade(CTX, 'too-poor', 100, 10);
        strict_1.default.equal(result.upgraded, false);
    });
    (0, node_test_1.default)('已达标会员自动升级', () => {
        initThreeTiers();
        createActiveMember('auto-upg', svip_entity_1.SvipTierLevel.Level1);
        const result = service.checkAndAutoUpgrade(CTX, 'auto-upg', 30000, 6000);
        strict_1.default.equal(result.upgraded, true);
        const member = service.getMemberTier('auto-upg', CTX.tenantId);
        strict_1.default.ok(member.tierLevel > svip_entity_1.SvipTierLevel.Level1);
    });
    (0, node_test_1.default)('无需变更返回 false', () => {
        initThreeTiers();
        createActiveMember('no-change', svip_entity_1.SvipTierLevel.Level1);
        const result = service.checkAndAutoUpgrade(CTX, 'no-change', 6000, 600);
        strict_1.default.equal(result.upgraded, false);
    });
});
// ================================================================
// 会员可用权益
// ================================================================
(0, node_test_1.describe)('getMemberAvailableBenefits', () => {
    (0, node_test_1.default)('获取活跃会员可用权益', () => {
        initThreeTiers();
        createActiveMember('benefit-check', svip_entity_1.SvipTierLevel.Level2);
        const tier = service.getTierByLevel(svip_entity_1.SvipTierLevel.Level2, CTX.tenantId);
        service.createBenefit({
            tierId: tier.id,
            benefitType: svip_entity_1.SvipBenefitType.Discount,
            benefitValue: '90%',
            description: '9折'
        });
        const result = service.getMemberAvailableBenefits('benefit-check', CTX.tenantId);
        strict_1.default.ok(result);
        strict_1.default.equal(result.tierLevel, svip_entity_1.SvipTierLevel.Level2);
        strict_1.default.ok(result.benefits.length >= 1);
    });
    (0, node_test_1.default)('冻结会员返回 null', () => {
        initThreeTiers();
        const m = createActiveMember('frozen-check');
        service.freezeMember(m.memberId, CTX.tenantId);
        const result = service.getMemberAvailableBenefits('frozen-check', CTX.tenantId);
        strict_1.default.equal(result, null);
    });
    (0, node_test_1.default)('不存在的会员返回 null', () => {
        const result = service.getMemberAvailableBenefits('ghost', CTX.tenantId);
        strict_1.default.equal(result, null);
    });
});
// ================================================================
// 辅助方法
// ================================================================
(0, node_test_1.describe)('resetSvipStoresForTests', () => {
    (0, node_test_1.default)('清除所有数据', () => {
        initThreeTiers();
        createActiveMember('reset-me');
        service.resetSvipStoresForTests();
        strict_1.default.equal(service.listTiers(CTX.tenantId).length, 0);
        strict_1.default.equal(service.listMembers(CTX.tenantId).length, 0);
    });
});
(0, node_test_1.describe)('calculateTier', () => {
    (0, node_test_1.default)('高消费高积分返回高级别', () => {
        const level = service.calculateTier(999999, 999999);
        strict_1.default.equal(level, svip_entity_1.SvipTierLevel.Level5);
    });
    (0, node_test_1.default)('低消费低积分返回 Level1', () => {
        const level = service.calculateTier(100, 10);
        strict_1.default.equal(level, svip_entity_1.SvipTierLevel.Level1);
    });
});
//# sourceMappingURL=svip.service.test.js.map