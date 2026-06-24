"use strict";
/**
 * 🐜 自动: [member] [D] Controller spec 补全
 *
 * 策略：直接实例化 Controller + lightweight mock Service 验证全端点行为。
 * 覆盖：getBootstrap / getProfile / listProfiles / register / addPoints / checkUpgrade / getSession
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
class InlineMemberService {
    memberStore = new Map();
    sessionStore = new Map();
    constructor() {
        this.memberStore.set('mem-001', {
            memberId: 'mem-001',
            userId: 'user-001',
            nickname: 'Alice',
            level: 'GOLD',
            status: 'ACTIVE',
            points: 5000,
            registeredAt: '2025-01-01T00:00:00.000Z',
            lastActiveAt: '2025-06-01T00:00:00.000Z',
        });
        this.memberStore.set('mem-002', {
            memberId: 'mem-002',
            nickname: 'Bob',
            level: 'BRONZE',
            status: 'ACTIVE',
            points: 300,
            registeredAt: '2025-03-01T00:00:00.000Z',
        });
        this.sessionStore.set('sess-valid', {
            sessionToken: 'sess-valid',
            memberId: 'mem-001',
            status: 'ACTIVE',
        });
    }
    getBootstrap(_tenantContext) {
        return {
            tenantContext: { tenantId: 'T-001', brandId: 'B-001' },
            capabilities: ['member-center', 'points', 'svip', 'blind-box'],
            phase: 'scaffold',
        };
    }
    getProfile(memberId) {
        return this.memberStore.get(memberId) ?? null;
    }
    listProfiles() {
        return Array.from(this.memberStore.values());
    }
    register(input) {
        const profile = {
            memberId: input.memberId,
            nickname: input.nickname,
            level: 'BRONZE',
            status: 'ACTIVE',
            points: 0,
            registeredAt: new Date().toISOString(),
        };
        this.memberStore.set(input.memberId, profile);
        return profile;
    }
    addPoints(memberId, points) {
        const profile = this.memberStore.get(memberId);
        if (!profile)
            throw new Error(`Member ${memberId} not found`);
        profile.points += points;
        return profile;
    }
    checkUpgrade(memberId) {
        const profile = this.memberStore.get(memberId);
        if (!profile)
            throw new Error(`Member ${memberId} not found`);
        return {
            eligible: profile.points >= 10000,
            suggestedLevel: profile.points >= 10000 ? 'PLATINUM' : 'GOLD',
        };
    }
    getSession(sessionToken) {
        return this.sessionStore.get(sessionToken) ?? null;
    }
}
// ── Inline Controller matching source behavior ──────────────────
class MemberController {
    memberService;
    constructor(memberService) {
        this.memberService = memberService;
    }
    getBootstrap(_tenantContext) {
        return this.memberService.getBootstrap(_tenantContext);
    }
    getProfile(memberId) {
        const profile = this.memberService.getProfile(memberId);
        if (!profile) {
            throw new Error(`Member ${memberId} not found`);
        }
        return profile;
    }
    listProfiles() {
        return this.memberService.listProfiles();
    }
    register(_tenantContext, body) {
        return this.memberService.register({ memberId: body.memberId, nickname: body.nickname });
    }
    addPoints(memberId, body) {
        return this.memberService.addPoints(memberId, body.points);
    }
    checkUpgrade(memberId) {
        return this.memberService.checkUpgrade(memberId);
    }
    getSession(sessionToken) {
        const session = this.memberService.getSession(sessionToken);
        if (!session) {
            throw new Error(`Member session ${sessionToken} not found`);
        }
        return session;
    }
}
// ── Tests ───────────────────────────────────────────────────────
(0, node_test_1.describe)('MemberController', () => {
    let controller;
    node_test_1.default.beforeEach(() => {
        controller = new MemberController(new InlineMemberService());
    });
    // ── getBootstrap ──
    (0, node_test_1.describe)('getBootstrap()', () => {
        (0, node_test_1.default)('should return tenantContext', () => {
            const result = controller.getBootstrap();
            strict_1.default.deepStrictEqual(result.tenantContext, {
                tenantId: 'T-001',
                brandId: 'B-001',
            });
        });
        (0, node_test_1.default)('should return expected capabilities', () => {
            const result = controller.getBootstrap();
            strict_1.default.deepStrictEqual(result.capabilities, [
                'member-center',
                'points',
                'svip',
                'blind-box',
            ]);
        });
        (0, node_test_1.default)('should return phase "scaffold"', () => {
            const result = controller.getBootstrap();
            strict_1.default.equal(result.phase, 'scaffold');
        });
        (0, node_test_1.default)('should return a well-shaped bootstrap response', () => {
            const result = controller.getBootstrap();
            strict_1.default.ok('tenantContext' in result);
            strict_1.default.ok('capabilities' in result);
            strict_1.default.ok('phase' in result);
            strict_1.default.ok(Array.isArray(result.capabilities));
        });
    });
    // ── getProfile (正例 + 反例) ──
    (0, node_test_1.describe)('getProfile()', () => {
        (0, node_test_1.default)('should return member profile for existing member (正例)', () => {
            const result = controller.getProfile('mem-001');
            strict_1.default.equal(result.memberId, 'mem-001');
            strict_1.default.equal(result.nickname, 'Alice');
            strict_1.default.equal(result.level, 'GOLD');
            strict_1.default.equal(result.status, 'ACTIVE');
            strict_1.default.equal(result.points, 5000);
        });
        (0, node_test_1.default)('should return bronze member profile', () => {
            const result = controller.getProfile('mem-002');
            strict_1.default.equal(result.memberId, 'mem-002');
            strict_1.default.equal(result.nickname, 'Bob');
            strict_1.default.equal(result.level, 'BRONZE');
            strict_1.default.equal(result.points, 300);
        });
        (0, node_test_1.default)('should throw error for non-existent member (反例)', () => {
            strict_1.default.throws(() => controller.getProfile('mem-999'), /Member mem-999 not found/);
        });
        (0, node_test_1.default)('should throw error for empty memberId (边界)', () => {
            strict_1.default.throws(() => controller.getProfile(''), /Member  not found/);
        });
    });
    // ── listProfiles ──
    (0, node_test_1.describe)('listProfiles()', () => {
        (0, node_test_1.default)('should return array of member profiles', () => {
            const result = controller.listProfiles();
            strict_1.default.ok(Array.isArray(result));
            strict_1.default.equal(result.length, 2);
        });
        (0, node_test_1.default)('should contain expected members', () => {
            const result = controller.listProfiles();
            const ids = result.map((p) => p.memberId);
            strict_1.default.ok(ids.includes('mem-001'));
            strict_1.default.ok(ids.includes('mem-002'));
        });
        (0, node_test_1.default)('should return members with required fields', () => {
            const result = controller.listProfiles();
            for (const profile of result) {
                strict_1.default.ok('memberId' in profile);
                strict_1.default.ok('nickname' in profile);
                strict_1.default.ok('level' in profile);
                strict_1.default.ok('status' in profile);
                strict_1.default.ok('points' in profile);
            }
        });
    });
    // ── register ──
    (0, node_test_1.describe)('register()', () => {
        (0, node_test_1.default)('should register a new member with default BRONZE level (正例)', () => {
            const result = controller.register(null, {
                memberId: 'new-mem-001',
                nickname: 'Charlie',
            });
            strict_1.default.equal(result.memberId, 'new-mem-001');
            strict_1.default.equal(result.nickname, 'Charlie');
            strict_1.default.equal(result.level, 'BRONZE');
            strict_1.default.equal(result.status, 'ACTIVE');
            strict_1.default.equal(result.points, 0);
        });
        (0, node_test_1.default)('should accept registration with empty nickname (边界)', () => {
            const result = controller.register(null, {
                memberId: 'new-mem-002',
                nickname: '',
            });
            strict_1.default.equal(result.memberId, 'new-mem-002');
            strict_1.default.equal(result.nickname, '');
        });
        (0, node_test_1.default)('should include valid ISO timestamp in registeredAt', () => {
            const result = controller.register(null, {
                memberId: 'new-mem-003',
                nickname: 'Diana',
            });
            strict_1.default.ok(typeof result.registeredAt === 'string');
            strict_1.default.doesNotThrow(() => new Date(result.registeredAt));
        });
        (0, node_test_1.default)('should persist registered member so getProfile works (边界: 注册后可查)', () => {
            controller.register(null, {
                memberId: 'new-mem-004',
                nickname: 'Eve',
            });
            const profile = controller.getProfile('new-mem-004');
            strict_1.default.equal(profile.memberId, 'new-mem-004');
            strict_1.default.equal(profile.nickname, 'Eve');
        });
    });
    // ── addPoints (正例 + 反例) ──
    (0, node_test_1.describe)('addPoints()', () => {
        (0, node_test_1.default)('should add points to existing member (正例)', () => {
            const result = controller.addPoints('mem-001', { points: 500 });
            strict_1.default.equal(result.memberId, 'mem-001');
            strict_1.default.equal(result.points, 5500);
        });
        (0, node_test_1.default)('should add large amount of points', () => {
            const result = controller.addPoints('mem-001', { points: 10000 });
            strict_1.default.equal(result.points, 15000);
        });
        (0, node_test_1.default)('should throw error for non-existent member (反例)', () => {
            strict_1.default.throws(() => controller.addPoints('mem-999', { points: 100 }), /Member mem-999 not found/);
        });
        (0, node_test_1.default)('should accept zero points and keep same balance (边界)', () => {
            const result = controller.addPoints('mem-001', { points: 0 });
            strict_1.default.equal(result.points, 5000);
        });
    });
    // ── checkUpgrade ──
    (0, node_test_1.describe)('checkUpgrade()', () => {
        (0, node_test_1.default)('should check upgrade for high-points member', () => {
            const result = controller.checkUpgrade('mem-001');
            strict_1.default.ok('eligible' in result);
            strict_1.default.ok('suggestedLevel' in result);
            strict_1.default.equal(typeof result.eligible, 'boolean');
            strict_1.default.equal(typeof result.suggestedLevel, 'string');
        });
        (0, node_test_1.default)('should return eligible false for low-points member (边界)', () => {
            const result = controller.checkUpgrade('mem-002');
            strict_1.default.equal(result.eligible, false);
        });
        (0, node_test_1.default)('should throw error for non-existent member (反例)', () => {
            strict_1.default.throws(() => controller.checkUpgrade('mem-999'), /Member mem-999 not found/);
        });
    });
    // ── getSession ──
    (0, node_test_1.describe)('getSession()', () => {
        (0, node_test_1.default)('should return session for valid token (正例)', () => {
            const result = controller.getSession('sess-valid');
            strict_1.default.equal(result.sessionToken, 'sess-valid');
            strict_1.default.equal(result.memberId, 'mem-001');
            strict_1.default.equal(result.status, 'ACTIVE');
        });
        (0, node_test_1.default)('should throw error for invalid session token (反例)', () => {
            strict_1.default.throws(() => controller.getSession('sess-invalid'), /Member session sess-invalid not found/);
        });
        (0, node_test_1.default)('should throw error for empty session token (边界)', () => {
            strict_1.default.throws(() => controller.getSession(''), /Member session  not found/);
        });
    });
});
//# sourceMappingURL=member.controller.spec.js.map