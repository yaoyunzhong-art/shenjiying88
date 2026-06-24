"use strict";
/**
 * 🐜 自动: [svip] [D] controller spec 补全
 *
 * 覆盖: initDefaultTiers / listTiers / getTier / upsertTier
 *       createMember / listMembers / getMemberTier / getMemberBenefits
 *       upgradeTier / downgradeTier / freezeMember / unfreezeMember
 *       checkAndDowngradeExpired
 *       listBenefits / createBenefit / updateBenefit / useBenefit
 *
 * 正例 + 反例 + 边界
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
const CTX = {
    tenantId: 'tenant-svip-test',
    brandId: 'brand-svip',
    storeId: 'store-svip',
    marketCode: 'cn-mainland'
};
let controller;
let service;
function build() {
    service = new svip_service_1.SvipService();
    controller = new svip_controller_1.SvipController(service);
}
function initThreeTiers() {
    service.upsertTier(CTX, {
        name: '银卡会员',
        level: 1,
        minSpendAmount: 5000,
        minPoints: 500,
        benefits: ['discount_95', 'priority_queue']
    });
    service.upsertTier(CTX, {
        name: '金卡会员',
        level: 2,
        minSpendAmount: 10000,
        minPoints: 2000,
        benefits: ['discount_90', 'priority_queue', 'free_upgrade']
    });
    service.upsertTier(CTX, {
        name: '铂金会员',
        level: 3,
        minSpendAmount: 30000,
        minPoints: 6000,
        benefits: ['discount_88', 'priority_queue', 'free_upgrade', 'vip_room']
    });
}
function createActiveMember(memberId, tierLevel = svip_entity_1.SvipTierLevel.Level1) {
    const tier = service.getTierByLevel(tierLevel, CTX.tenantId);
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    return service.createMember(CTX, {
        memberId,
        tierId: tier.id,
        totalSpend: 6000,
        currentPoints: 600,
        expiresAt: future
    });
}
(0, node_test_1.beforeEach)(() => {
    build();
});
(0, node_test_1.afterEach)(() => {
    service.resetSvipStoresForTests();
});
(0, node_test_1.describe)('svip controller', () => {
    // ── 等级管理 ───────────────────────────────────────────
    (0, node_test_1.describe)('initDefaultTiers', () => {
        (0, node_test_1.default)('should init default 5 tiers when no tiers exist', () => {
            const result = controller.initDefaultTiers(CTX);
            strict_1.default.equal(result.length, 5);
            strict_1.default.equal(result[0].level, 1);
            strict_1.default.equal(result[4].level, 5);
        });
        (0, node_test_1.default)('should return existing tiers and skip re-init', () => {
            initThreeTiers();
            const result = controller.initDefaultTiers(CTX);
            strict_1.default.equal(result.length, 3);
        });
    });
    (0, node_test_1.describe)('listTiers', () => {
        (0, node_test_1.default)('should list all tiers for tenant', () => {
            initThreeTiers();
            const result = controller.listTiers(CTX, {});
            strict_1.default.equal(result.length, 3);
        });
        (0, node_test_1.default)('should filter by level', () => {
            initThreeTiers();
            const result = controller.listTiers(CTX, { level: 2 });
            strict_1.default.equal(result.length, 1);
            strict_1.default.equal(result[0].name, '金卡会员');
        });
        (0, node_test_1.default)('should return empty when no tiers present', () => {
            const result = controller.listTiers(CTX, {});
            strict_1.default.equal(result.length, 0);
        });
        (0, node_test_1.default)('should isolate between tenants', () => {
            initThreeTiers();
            const otherCtx = { ...CTX, tenantId: 'other-tenant' };
            const result = controller.listTiers(otherCtx, {});
            strict_1.default.equal(result.length, 0);
        });
    });
    (0, node_test_1.describe)('getTier', () => {
        (0, node_test_1.default)('should get tier by id', () => {
            initThreeTiers();
            const list = controller.listTiers(CTX, {});
            const tierId = list[0].id;
            const result = controller.getTier(CTX, tierId);
            strict_1.default.ok(result);
            strict_1.default.equal(result.id, tierId);
        });
        (0, node_test_1.default)('should return undefined for non-existent tier', () => {
            const result = controller.getTier(CTX, 'non-existent-id');
            strict_1.default.equal(result, undefined);
        });
        (0, node_test_1.default)('should return undefined for tier belonging to other tenant', () => {
            initThreeTiers();
            const list = controller.listTiers(CTX, {});
            const otherCtx = { ...CTX, tenantId: 'other-tenant' };
            const result = controller.getTier(otherCtx, list[0].id);
            strict_1.default.equal(result, undefined);
        });
    });
    (0, node_test_1.describe)('upsertTier', () => {
        (0, node_test_1.default)('should create a new tier', () => {
            const result = controller.upsertTier(CTX, {
                name: '测试等级',
                level: 4,
                minSpendAmount: 50000,
                minPoints: 10000,
                benefits: ['discount_85']
            });
            strict_1.default.ok(result.id);
            strict_1.default.equal(result.name, '测试等级');
            strict_1.default.equal(result.level, 4);
        });
        (0, node_test_1.default)('should update an existing tier', () => {
            const created = controller.upsertTier(CTX, {
                name: '原等级',
                level: 1,
                minSpendAmount: 1000,
                minPoints: 100,
                benefits: ['test']
            });
            const updated = controller.upsertTier(CTX, {
                id: created.id,
                name: '更新等级',
                level: 1,
                minSpendAmount: 2000,
                minPoints: 200,
                benefits: ['updated']
            });
            strict_1.default.equal(updated.id, created.id);
            strict_1.default.equal(updated.name, '更新等级');
            strict_1.default.equal(updated.minSpendAmount, 2000);
        });
    });
    // ── 会员管理 ───────────────────────────────────────────
    (0, node_test_1.describe)('createMember', () => {
        (0, node_test_1.default)('should create a SVIP member', () => {
            initThreeTiers();
            const tier = service.getTierByLevel(1, CTX.tenantId);
            const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
            const result = controller.createMember(CTX, {
                memberId: 'mem-001',
                tierId: tier.id,
                totalSpend: 6000,
                currentPoints: 600,
                expiresAt: future
            });
            strict_1.default.equal(result.memberId, 'mem-001');
            strict_1.default.equal(result.status, svip_entity_1.SvipMemberStatus.Active);
            strict_1.default.equal(result.tierLevel, 1);
        });
        (0, node_test_1.default)('should throw when tier not found', () => {
            strict_1.default.throws(() => {
                controller.createMember(CTX, {
                    memberId: 'mem-002',
                    tierId: 'non-existent-tier',
                    totalSpend: 1000,
                    currentPoints: 100,
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                });
            }, /SvipTier not found/);
        });
        (0, node_test_1.default)('should throw when duplicate active member', () => {
            initThreeTiers();
            createActiveMember('mem-003', svip_entity_1.SvipTierLevel.Level1);
            const tier = service.getTierByLevel(1, CTX.tenantId);
            strict_1.default.throws(() => {
                controller.createMember(CTX, {
                    memberId: 'mem-003',
                    tierId: tier.id,
                    totalSpend: 6000,
                    currentPoints: 600,
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                });
            }, /already has an active SVIP membership/);
        });
    });
    (0, node_test_1.describe)('listMembers', () => {
        (0, node_test_1.default)('should list all members for tenant', () => {
            initThreeTiers();
            createActiveMember('mem-a', svip_entity_1.SvipTierLevel.Level1);
            createActiveMember('mem-b', svip_entity_1.SvipTierLevel.Level2);
            const result = controller.listMembers(CTX, {});
            strict_1.default.equal(result.length, 2);
        });
        (0, node_test_1.default)('should filter by status', () => {
            initThreeTiers();
            const m = createActiveMember('mem-c', svip_entity_1.SvipTierLevel.Level1);
            controller.freezeMember(CTX, m.memberId);
            const active = controller.listMembers(CTX, { status: svip_entity_1.SvipMemberStatus.Active });
            strict_1.default.equal(active.length, 0);
            const frozen = controller.listMembers(CTX, { status: svip_entity_1.SvipMemberStatus.Frozen });
            strict_1.default.equal(frozen.length, 1);
        });
        (0, node_test_1.default)('should filter by tierLevel', () => {
            initThreeTiers();
            createActiveMember('mem-d', svip_entity_1.SvipTierLevel.Level1);
            createActiveMember('mem-e', svip_entity_1.SvipTierLevel.Level2);
            const result = controller.listMembers(CTX, { tierLevel: 2 });
            strict_1.default.equal(result.length, 1);
            strict_1.default.equal(result[0].memberId, 'mem-e');
        });
    });
    (0, node_test_1.describe)('getMemberTier', () => {
        (0, node_test_1.default)('should get member tier info', () => {
            initThreeTiers();
            createActiveMember('mem-f', svip_entity_1.SvipTierLevel.Level2);
            const result = controller.getMemberTier(CTX, 'mem-f');
            strict_1.default.ok(result);
            strict_1.default.equal(result.memberId, 'mem-f');
            strict_1.default.equal(result.tierLevel, 2);
        });
        (0, node_test_1.default)('should return undefined for non-existent member', () => {
            const result = controller.getMemberTier(CTX, 'non-existent');
            strict_1.default.equal(result, undefined);
        });
    });
    (0, node_test_1.describe)('getMemberBenefits', () => {
        (0, node_test_1.default)('should get member available benefits', () => {
            initThreeTiers();
            createActiveMember('mem-g', svip_entity_1.SvipTierLevel.Level1);
            const tierId = service.getTierByLevel(1, CTX.tenantId).id;
            service.createBenefit({
                tierId,
                benefitType: svip_entity_1.SvipBenefitType.Discount,
                benefitValue: '95%',
                description: '95折优惠'
            });
            const result = controller.getMemberBenefits(CTX, 'mem-g');
            strict_1.default.ok(result);
            strict_1.default.equal(result.tierLevel, 1);
            strict_1.default.ok(result.benefits.length >= 1);
        });
        (0, node_test_1.default)('should return null for frozen member', () => {
            initThreeTiers();
            const m = createActiveMember('mem-h');
            controller.freezeMember(CTX, m.memberId);
            const result = controller.getMemberBenefits(CTX, 'mem-h');
            strict_1.default.equal(result, null);
        });
    });
    // ── 升级 / 降级 ────────────────────────────────────────
    (0, node_test_1.describe)('upgradeTier', () => {
        (0, node_test_1.default)('should upgrade member tier level', () => {
            initThreeTiers();
            createActiveMember('mem-i', svip_entity_1.SvipTierLevel.Level1);
            const result = controller.upgradeTier(CTX, {
                memberId: 'mem-i',
                targetTierLevel: 2,
                reason: '年度消费达标'
            });
            strict_1.default.equal(result.tierLevel, 2);
            strict_1.default.equal(result.tierName, '金卡会员');
        });
        (0, node_test_1.default)('should throw when upgrading frozen member', () => {
            initThreeTiers();
            const m = createActiveMember('mem-j', svip_entity_1.SvipTierLevel.Level1);
            controller.freezeMember(CTX, m.memberId);
            strict_1.default.throws(() => {
                controller.upgradeTier(CTX, { memberId: 'mem-j', targetTierLevel: 2 });
            }, /not active/);
        });
        (0, node_test_1.default)('should throw when target level is not higher', () => {
            initThreeTiers();
            createActiveMember('mem-k', svip_entity_1.SvipTierLevel.Level2);
            strict_1.default.throws(() => {
                controller.upgradeTier(CTX, { memberId: 'mem-k', targetTierLevel: 1 });
            }, /not higher/);
        });
        (0, node_test_1.default)('should throw for non-existent member', () => {
            initThreeTiers();
            strict_1.default.throws(() => {
                controller.upgradeTier(CTX, { memberId: 'ghost', targetTierLevel: 2 });
            }, /SvipMember not found/);
        });
    });
    (0, node_test_1.describe)('downgradeTier', () => {
        (0, node_test_1.default)('should downgrade member tier level', () => {
            initThreeTiers();
            createActiveMember('mem-l', svip_entity_1.SvipTierLevel.Level2);
            const result = controller.downgradeTier(CTX, {
                memberId: 'mem-l',
                targetTierLevel: 1,
                reason: '积分不足'
            });
            strict_1.default.equal(result.tierLevel, 1);
            strict_1.default.equal(result.tierName, '银卡会员');
        });
        (0, node_test_1.default)('should throw when target level is not lower', () => {
            initThreeTiers();
            createActiveMember('mem-m', svip_entity_1.SvipTierLevel.Level1);
            strict_1.default.throws(() => {
                controller.downgradeTier(CTX, { memberId: 'mem-m', targetTierLevel: 2 });
            }, /not lower/);
        });
    });
    // ── 冻结 / 解冻 ────────────────────────────────────────
    (0, node_test_1.describe)('freezeMember', () => {
        (0, node_test_1.default)('should freeze an active member', () => {
            initThreeTiers();
            createActiveMember('mem-n', svip_entity_1.SvipTierLevel.Level1);
            const result = controller.freezeMember(CTX, 'mem-n');
            strict_1.default.equal(result.status, svip_entity_1.SvipMemberStatus.Frozen);
        });
        (0, node_test_1.default)('should throw when freezing already frozen member', () => {
            initThreeTiers();
            createActiveMember('mem-o', svip_entity_1.SvipTierLevel.Level1);
            controller.freezeMember(CTX, 'mem-o');
            strict_1.default.throws(() => {
                controller.freezeMember(CTX, 'mem-o');
            }, /already frozen/);
        });
        (0, node_test_1.default)('should throw for non-existent member', () => {
            strict_1.default.throws(() => {
                controller.freezeMember(CTX, 'non-existent');
            }, /SvipMember not found/);
        });
    });
    (0, node_test_1.describe)('unfreezeMember', () => {
        (0, node_test_1.default)('should unfreeze a frozen member', () => {
            initThreeTiers();
            createActiveMember('mem-p', svip_entity_1.SvipTierLevel.Level1);
            controller.freezeMember(CTX, 'mem-p');
            const result = controller.unfreezeMember(CTX, 'mem-p');
            strict_1.default.equal(result.status, svip_entity_1.SvipMemberStatus.Active);
        });
        (0, node_test_1.default)('should throw when unfreezing active member', () => {
            initThreeTiers();
            createActiveMember('mem-q', svip_entity_1.SvipTierLevel.Level1);
            strict_1.default.throws(() => {
                controller.unfreezeMember(CTX, 'mem-q');
            }, /not frozen/);
        });
    });
    (0, node_test_1.describe)('checkAndDowngradeExpired', () => {
        (0, node_test_1.default)('should return empty when no expired members', () => {
            initThreeTiers();
            createActiveMember('mem-r', svip_entity_1.SvipTierLevel.Level1);
            const result = controller.checkAndDowngradeExpired(CTX);
            strict_1.default.equal(result.length, 0);
        });
        (0, node_test_1.default)('should return empty for different tenant', () => {
            initThreeTiers();
            createActiveMember('mem-s', svip_entity_1.SvipTierLevel.Level1);
            const otherCtx = { ...CTX, tenantId: 'other-tenant' };
            const result = controller.checkAndDowngradeExpired(otherCtx);
            strict_1.default.equal(result.length, 0);
        });
    });
    // ── 权益管理 ───────────────────────────────────────────
    (0, node_test_1.describe)('listBenefits', () => {
        (0, node_test_1.default)('should list benefits for a tier', () => {
            initThreeTiers();
            const tierId = service.getTierByLevel(1, CTX.tenantId).id;
            service.createBenefit({
                tierId,
                benefitType: svip_entity_1.SvipBenefitType.Discount,
                benefitValue: '95%',
                description: '95折'
            });
            const result = controller.listBenefits(tierId);
            strict_1.default.equal(result.length, 1);
            strict_1.default.equal(result[0].benefitType, svip_entity_1.SvipBenefitType.Discount);
        });
        (0, node_test_1.default)('should return empty for tier with no benefits', () => {
            initThreeTiers();
            const tierId = service.getTierByLevel(3, CTX.tenantId).id;
            const result = controller.listBenefits(tierId);
            strict_1.default.equal(result.length, 0);
        });
    });
    (0, node_test_1.describe)('createBenefit', () => {
        (0, node_test_1.default)('should create a benefit', () => {
            initThreeTiers();
            const tierId = service.getTierByLevel(1, CTX.tenantId).id;
            const result = controller.createBenefit({
                tierId,
                benefitType: svip_entity_1.SvipBenefitType.VipRoom,
                benefitValue: '2h',
                description: 'VIP包厢2小时'
            });
            strict_1.default.ok(result.id);
            strict_1.default.equal(result.benefitType, svip_entity_1.SvipBenefitType.VipRoom);
            strict_1.default.ok(result.isActive);
        });
    });
    (0, node_test_1.describe)('updateBenefit', () => {
        (0, node_test_1.default)('should update benefit details', () => {
            initThreeTiers();
            const tierId = service.getTierByLevel(1, CTX.tenantId).id;
            const created = controller.createBenefit({
                tierId,
                benefitType: svip_entity_1.SvipBenefitType.Discount,
                benefitValue: '95%',
                description: 'old desc'
            });
            const updated = controller.updateBenefit(created.id, {
                description: 'new desc',
                isActive: false
            });
            strict_1.default.equal(updated.description, 'new desc');
            strict_1.default.equal(updated.isActive, false);
        });
        (0, node_test_1.default)('should throw for non-existent benefit', () => {
            strict_1.default.throws(() => {
                controller.updateBenefit('non-existent', { description: 'test' });
            }, /SvipBenefit not found/);
        });
    });
    (0, node_test_1.describe)('useBenefit', () => {
        (0, node_test_1.default)('should use a benefit successfully', () => {
            initThreeTiers();
            createActiveMember('mem-use', svip_entity_1.SvipTierLevel.Level2);
            const tierId = service.getTierByLevel(2, CTX.tenantId).id;
            service.createBenefit({
                tierId,
                benefitType: svip_entity_1.SvipBenefitType.FreeUpgrade,
                benefitValue: '7d',
                description: '7天免费升级'
            });
            const result = controller.useBenefit(CTX, {
                memberId: 'mem-use',
                benefitType: svip_entity_1.SvipBenefitType.FreeUpgrade
            });
            strict_1.default.equal(result.success, true);
            strict_1.default.ok(result.message.includes('successfully'));
        });
        (0, node_test_1.default)('should fail when member is frozen', () => {
            initThreeTiers();
            const m = createActiveMember('mem-fail', svip_entity_1.SvipTierLevel.Level2);
            controller.freezeMember(CTX, m.memberId);
            const result = controller.useBenefit(CTX, {
                memberId: 'mem-fail',
                benefitType: svip_entity_1.SvipBenefitType.Discount
            });
            strict_1.default.equal(result.success, false);
            strict_1.default.ok(result.message.includes('not an active'));
        });
        (0, node_test_1.default)('should fail when tier does not support benefit type', () => {
            initThreeTiers();
            createActiveMember('mem-x', svip_entity_1.SvipTierLevel.Level1);
            const result = controller.useBenefit(CTX, {
                memberId: 'mem-x',
                benefitType: svip_entity_1.SvipBenefitType.ExclusiveEvent
            });
            strict_1.default.equal(result.success, false);
            strict_1.default.ok(result.message.includes('does not have benefit type'));
        });
    });
});
//# sourceMappingURL=svip.controller.test.js.map