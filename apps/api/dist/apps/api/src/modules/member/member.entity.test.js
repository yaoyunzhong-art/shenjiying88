"use strict";
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
const member_entity_1 = require("./member.entity");
// ── MemberLevel enum ───────────────────────────────────────────
(0, node_test_1.describe)('member.entity: MemberLevel enum', () => {
    (0, node_test_1.default)('has five levels in ascending order', () => {
        strict_1.default.equal(member_entity_1.MemberLevel.Bronze, 'BRONZE');
        strict_1.default.equal(member_entity_1.MemberLevel.Silver, 'SILVER');
        strict_1.default.equal(member_entity_1.MemberLevel.Gold, 'GOLD');
        strict_1.default.equal(member_entity_1.MemberLevel.Platinum, 'PLATINUM');
        strict_1.default.equal(member_entity_1.MemberLevel.Diamond, 'DIAMOND');
    });
    (0, node_test_1.default)('values array is ordered', () => {
        const values = Object.values(member_entity_1.MemberLevel);
        strict_1.default.deepEqual(values, ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']);
    });
});
// ── MemberStatus enum ──────────────────────────────────────────
(0, node_test_1.describe)('member.entity: MemberStatus enum', () => {
    (0, node_test_1.default)('has four statuses', () => {
        strict_1.default.equal(member_entity_1.MemberStatus.Active, 'ACTIVE');
        strict_1.default.equal(member_entity_1.MemberStatus.Frozen, 'FROZEN');
        strict_1.default.equal(member_entity_1.MemberStatus.Expired, 'EXPIRED');
        strict_1.default.equal(member_entity_1.MemberStatus.Blacklisted, 'BLACKLISTED');
    });
});
// ── MEMBER_LEVEL_THRESHOLDS ────────────────────────────────────
(0, node_test_1.describe)('member.entity: MEMBER_LEVEL_THRESHOLDS', () => {
    (0, node_test_1.default)('Bronze threshold is 0', () => {
        strict_1.default.equal(member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Bronze], 0);
    });
    (0, node_test_1.default)('Silver threshold is 500', () => {
        strict_1.default.equal(member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Silver], 500);
    });
    (0, node_test_1.default)('Gold threshold is 2000', () => {
        strict_1.default.equal(member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Gold], 2000);
    });
    (0, node_test_1.default)('Platinum threshold is 10000', () => {
        strict_1.default.equal(member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Platinum], 10000);
    });
    (0, node_test_1.default)('Diamond threshold is 50000', () => {
        strict_1.default.equal(member_entity_1.MEMBER_LEVEL_THRESHOLDS[member_entity_1.MemberLevel.Diamond], 50000);
    });
    (0, node_test_1.default)('thresholds are monotonically increasing', () => {
        const values = Object.values(member_entity_1.MEMBER_LEVEL_THRESHOLDS);
        for (let i = 1; i < values.length; i++) {
            strict_1.default.ok(values[i] > values[i - 1], `threshold ${i} should be > ${i - 1}`);
        }
    });
});
// ── computeMemberLevel ─────────────────────────────────────────
(0, node_test_1.describe)('member.entity: computeMemberLevel', () => {
    (0, node_test_1.default)('0 points -> Bronze', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(0), member_entity_1.MemberLevel.Bronze);
    });
    (0, node_test_1.default)('499 points -> Bronze', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(499), member_entity_1.MemberLevel.Bronze);
    });
    (0, node_test_1.default)('500 points -> Silver', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(500), member_entity_1.MemberLevel.Silver);
    });
    (0, node_test_1.default)('1999 points -> Silver', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(1999), member_entity_1.MemberLevel.Silver);
    });
    (0, node_test_1.default)('2000 points -> Gold', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(2000), member_entity_1.MemberLevel.Gold);
    });
    (0, node_test_1.default)('9999 points -> Gold', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(9999), member_entity_1.MemberLevel.Gold);
    });
    (0, node_test_1.default)('10000 points -> Platinum', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(10000), member_entity_1.MemberLevel.Platinum);
    });
    (0, node_test_1.default)('49999 points -> Platinum', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(49999), member_entity_1.MemberLevel.Platinum);
    });
    (0, node_test_1.default)('50000 points -> Diamond', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(50000), member_entity_1.MemberLevel.Diamond);
    });
    (0, node_test_1.default)('100000 points -> Diamond', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(100000), member_entity_1.MemberLevel.Diamond);
    });
    (0, node_test_1.default)('negative points -> Bronze', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(-100), member_entity_1.MemberLevel.Bronze);
    });
    (0, node_test_1.default)('non-integer points work correctly', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(2500.5), member_entity_1.MemberLevel.Gold);
    });
});
// ── canUpgrade ─────────────────────────────────────────────────
(0, node_test_1.describe)('member.entity: canUpgrade', () => {
    (0, node_test_1.default)('Bronze with 500 points can upgrade to Silver', () => {
        strict_1.default.equal((0, member_entity_1.canUpgrade)(member_entity_1.MemberLevel.Bronze, 500), true);
    });
    (0, node_test_1.default)('Bronze with 0 points cannot upgrade', () => {
        strict_1.default.equal((0, member_entity_1.canUpgrade)(member_entity_1.MemberLevel.Bronze, 0), false);
    });
    (0, node_test_1.default)('Silver with 2000 points can upgrade to Gold', () => {
        strict_1.default.equal((0, member_entity_1.canUpgrade)(member_entity_1.MemberLevel.Silver, 2000), true);
    });
    (0, node_test_1.default)('Gold with 1500 points cannot upgrade (insufficient for Platinum)', () => {
        strict_1.default.equal((0, member_entity_1.canUpgrade)(member_entity_1.MemberLevel.Gold, 1500), false);
    });
    (0, node_test_1.default)('Diamond can never upgrade further', () => {
        strict_1.default.equal((0, member_entity_1.canUpgrade)(member_entity_1.MemberLevel.Diamond, 999999), false);
    });
    (0, node_test_1.default)('Platinum with 50000 points can upgrade to Diamond', () => {
        strict_1.default.equal((0, member_entity_1.canUpgrade)(member_entity_1.MemberLevel.Platinum, 50000), true);
    });
    (0, node_test_1.default)('Silver with 499 points cannot upgrade', () => {
        strict_1.default.equal((0, member_entity_1.canUpgrade)(member_entity_1.MemberLevel.Silver, 499), false);
    });
});
// ── makeMemberBootstrap ────────────────────────────────────────
(0, node_test_1.describe)('member.entity: makeMemberBootstrap', () => {
    const tenantContext = {
        tenantId: 't-entity-1',
        brandId: 'b-entity-1',
        storeId: 's-entity-1',
        marketCode: 'zh-cn'
    };
    (0, node_test_1.default)('returns default bootstrap with given tenant context', () => {
        const result = (0, member_entity_1.makeMemberBootstrap)(tenantContext);
        strict_1.default.deepStrictEqual(result.tenantContext, tenantContext);
        strict_1.default.equal(result.phase, 'scaffold');
        strict_1.default.deepEqual(result.capabilities, ['member-center', 'points', 'svip', 'blind-box']);
    });
    (0, node_test_1.default)('allows overriding phase', () => {
        const result = (0, member_entity_1.makeMemberBootstrap)(tenantContext, { phase: 'production' });
        strict_1.default.equal(result.phase, 'production');
    });
    (0, node_test_1.default)('allows overriding capabilities', () => {
        const result = (0, member_entity_1.makeMemberBootstrap)(tenantContext, {
            capabilities: ['member-center']
        });
        strict_1.default.deepEqual(result.capabilities, ['member-center']);
    });
    (0, node_test_1.default)('allows overriding both phase and capabilities', () => {
        const result = (0, member_entity_1.makeMemberBootstrap)(tenantContext, {
            phase: 'staging',
            capabilities: ['member-center', 'points']
        });
        strict_1.default.equal(result.phase, 'staging');
        strict_1.default.deepEqual(result.capabilities, ['member-center', 'points']);
    });
    (0, node_test_1.default)('works with minimal tenant context', () => {
        const minimalCtx = { tenantId: 't-min' };
        const result = (0, member_entity_1.makeMemberBootstrap)(minimalCtx);
        strict_1.default.equal(result.tenantContext.tenantId, 't-min');
        strict_1.default.equal(result.tenantContext.brandId, undefined);
    });
});
// ── MemberProfile type contract ────────────────────────────────
(0, node_test_1.describe)('member.entity: MemberProfile type contract', () => {
    (0, node_test_1.default)('can construct a valid MemberProfile object', () => {
        const profile = {
            memberId: 'mem-001',
            tenantContext: { tenantId: 't-1' },
            nickname: 'TestUser',
            level: member_entity_1.MemberLevel.Gold,
            status: member_entity_1.MemberStatus.Active,
            points: 3000,
            registeredAt: '2025-01-15T00:00:00.000Z',
            lastActiveAt: '2025-06-14T10:00:00.000Z'
        };
        strict_1.default.equal(profile.memberId, 'mem-001');
        strict_1.default.equal(profile.nickname, 'TestUser');
        strict_1.default.equal(profile.level, 'GOLD');
        strict_1.default.equal(profile.status, 'ACTIVE');
        strict_1.default.equal(profile.points, 3000);
        strict_1.default.ok(profile.lastActiveAt);
        strict_1.default.ok(!isNaN(Date.parse(profile.registeredAt)));
    });
    (0, node_test_1.default)('lastActiveAt is optional', () => {
        const profile = {
            memberId: 'mem-002',
            tenantContext: { tenantId: 't-2' },
            nickname: 'Minimal',
            level: member_entity_1.MemberLevel.Bronze,
            status: member_entity_1.MemberStatus.Active,
            points: 0,
            registeredAt: '2025-06-14T00:00:00.000Z'
        };
        strict_1.default.equal(profile.lastActiveAt, undefined);
    });
});
(0, node_test_1.describe)('member.entity: MemberSession type contract', () => {
    (0, node_test_1.default)('can construct a valid member session', () => {
        const session = {
            sessionToken: 'sess-token',
            memberId: 'mem-001',
            userId: 'user-001',
            tenantId: 'tenant-1',
            brandId: 'brand-1',
            storeId: 'store-1',
            issuedAt: '2026-06-14T00:00:00.000Z',
            expiresAt: '2026-06-21T00:00:00.000Z',
            authenticated: true
        };
        strict_1.default.equal(session.memberId, 'mem-001');
        strict_1.default.equal(session.userId, 'user-001');
        strict_1.default.equal(session.authenticated, true);
    });
});
//# sourceMappingURL=member.entity.test.js.map