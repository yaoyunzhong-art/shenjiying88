"use strict";
/**
 * 🐜 自动: [member] [A] 模块补全 — controller spec 增强
 *
 * 覆盖：bootstrap / register / getProfile / listProfiles / addPoints / checkUpgrade
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
const member_controller_1 = require("./member.controller");
const member_service_1 = require("./member.service");
const member_entity_1 = require("./member.entity");
// ── helpers ──
function createContext(overrides = {}) {
    return {
        tenantId: 't-001',
        brandId: 'b-001',
        storeId: 's-001',
        marketCode: 'cn-mainland',
        ...overrides
    };
}
function freshController() {
    return new member_controller_1.MemberController(new member_service_1.MemberService());
}
function createControllerWithServiceStub(service) {
    return new member_controller_1.MemberController(service);
}
function createProfileFixture(overrides = {}) {
    return {
        memberId: 'member-fixture',
        tenantContext: createContext(),
        nickname: 'Fixture Member',
        level: member_entity_1.MemberLevel.Bronze,
        status: member_entity_1.MemberStatus.Active,
        points: 0,
        registeredAt: '2026-06-20T00:00:00.000Z',
        ...overrides
    };
}
function createHistoryEntryFixture(overrides = {}) {
    return {
        historyId: 'history-fixture-001',
        tenantContext: createContext(),
        memberId: 'member-fixture',
        action: 'profile-updated',
        summary: 'fixture history entry',
        sourceChannel: 'admin-web',
        operatorId: 'ops.fixture',
        createdAt: '2026-06-20T00:00:00.000Z',
        ...overrides
    };
}
function createLoginResultFixture(overrides = {}) {
    return {
        member: createProfileFixture({
            memberId: 'member-login',
            mobile: '13500000000'
        }),
        session: {
            sessionToken: 'sess-1',
            memberId: 'member-login',
            userId: 'user-login',
            tenantId: 't-001',
            brandId: 'b-001',
            storeId: 's-001',
            issuedAt: '2026-06-20T00:00:00.000Z',
            expiresAt: '2026-06-27T00:00:00.000Z',
            authenticated: true
        },
        ...overrides
    };
}
// ── metadata assertions ──
(0, node_test_1.default)('member controller path metadata is set', () => {
    const path = Reflect.getMetadata('path', member_controller_1.MemberController);
    strict_1.default.equal(path, 'members');
});
(0, node_test_1.default)('member controller getBootstrap route has GET metadata', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MemberController: Ctrl } = require('./member.controller');
    const method = Reflect.getMetadata('method', Ctrl.prototype.getBootstrap);
    const path = Reflect.getMetadata('path', Ctrl.prototype.getBootstrap);
    strict_1.default.equal(method, 0);
    strict_1.default.equal(path, 'bootstrap');
});
(0, node_test_1.default)('member controller registerPersistent route has POST metadata', () => {
    const method = Reflect.getMetadata('method', member_controller_1.MemberController.prototype.registerPersistent);
    const path = Reflect.getMetadata('path', member_controller_1.MemberController.prototype.registerPersistent);
    strict_1.default.equal(method, 1);
    strict_1.default.equal(path, 'persistent/register');
});
(0, node_test_1.default)('member controller listPersistentMutationHistory route has GET metadata', () => {
    const method = Reflect.getMetadata('method', member_controller_1.MemberController.prototype.listPersistentMutationHistory);
    const path = Reflect.getMetadata('path', member_controller_1.MemberController.prototype.listPersistentMutationHistory);
    strict_1.default.equal(method, 0);
    strict_1.default.equal(path, 'persistent/:memberId/history');
});
(0, node_test_1.default)('member controller updatePersistentProfile route has POST metadata', () => {
    const method = Reflect.getMetadata('method', member_controller_1.MemberController.prototype.updatePersistentProfile);
    const path = Reflect.getMetadata('path', member_controller_1.MemberController.prototype.updatePersistentProfile);
    strict_1.default.equal(method, 1);
    strict_1.default.equal(path, 'persistent/:memberId/profile');
});
(0, node_test_1.default)('member controller awardPersistentPoints route has POST metadata', () => {
    const method = Reflect.getMetadata('method', member_controller_1.MemberController.prototype.awardPersistentPoints);
    const path = Reflect.getMetadata('path', member_controller_1.MemberController.prototype.awardPersistentPoints);
    strict_1.default.equal(method, 1);
    strict_1.default.equal(path, 'persistent/:memberId/points/award');
});
(0, node_test_1.default)('member controller rollbackPersistentPoints route has POST metadata', () => {
    const method = Reflect.getMetadata('method', member_controller_1.MemberController.prototype.rollbackPersistentPoints);
    const path = Reflect.getMetadata('path', member_controller_1.MemberController.prototype.rollbackPersistentPoints);
    strict_1.default.equal(method, 1);
    strict_1.default.equal(path, 'persistent/:memberId/points/rollback');
});
(0, node_test_1.default)('member controller updatePersistentStatus route has POST metadata', () => {
    const method = Reflect.getMetadata('method', member_controller_1.MemberController.prototype.updatePersistentStatus);
    const path = Reflect.getMetadata('path', member_controller_1.MemberController.prototype.updatePersistentStatus);
    strict_1.default.equal(method, 1);
    strict_1.default.equal(path, 'persistent/:memberId/status');
});
(0, node_test_1.default)('member controller overridePersistentLevel route has POST metadata', () => {
    const method = Reflect.getMetadata('method', member_controller_1.MemberController.prototype.overridePersistentLevel);
    const path = Reflect.getMetadata('path', member_controller_1.MemberController.prototype.overridePersistentLevel);
    strict_1.default.equal(method, 1);
    strict_1.default.equal(path, 'persistent/:memberId/level');
});
(0, node_test_1.default)('member controller recordPersistentPaymentActivity route has POST metadata', () => {
    const method = Reflect.getMetadata('method', member_controller_1.MemberController.prototype.recordPersistentPaymentActivity);
    const path = Reflect.getMetadata('path', member_controller_1.MemberController.prototype.recordPersistentPaymentActivity);
    strict_1.default.equal(method, 1);
    strict_1.default.equal(path, 'persistent/:memberId/payment-activity');
});
(0, node_test_1.default)('member controller login route has POST metadata', () => {
    const method = Reflect.getMetadata('method', member_controller_1.MemberController.prototype.login);
    const path = Reflect.getMetadata('path', member_controller_1.MemberController.prototype.login);
    strict_1.default.equal(method, 1);
    strict_1.default.equal(path, 'login');
});
// ── getBootstrap ──
(0, node_test_1.describe)('GET /members/bootstrap', () => {
    (0, node_test_1.default)('returns scaffold bootstrap with expected shape', () => {
        const ctrl = freshController();
        const result = ctrl.getBootstrap(createContext());
        strict_1.default.equal(result.phase, 'scaffold');
        strict_1.default.deepStrictEqual(result.capabilities, ['member-center', 'points', 'svip', 'blind-box']);
        strict_1.default.equal(result.tenantContext.tenantId, 't-001');
    });
    (0, node_test_1.default)('passes minimal context through', () => {
        const ctrl = freshController();
        const result = ctrl.getBootstrap({ tenantId: 'min-t' });
        strict_1.default.equal(result.tenantContext.tenantId, 'min-t');
        strict_1.default.equal(result.tenantContext.brandId, undefined);
    });
});
// ── POST /members/register ──
(0, node_test_1.describe)('POST /members/register', () => {
    (0, node_test_1.default)('registers a new member and returns full profile', () => {
        const ctrl = freshController();
        const profile = ctrl.register(createContext(), {
            memberId: 'alice',
            nickname: 'Alice Wang'
        });
        strict_1.default.equal(profile.memberId, 'alice');
        strict_1.default.equal(profile.nickname, 'Alice Wang');
        strict_1.default.equal(profile.level, member_entity_1.MemberLevel.Bronze);
        strict_1.default.equal(profile.status, member_entity_1.MemberStatus.Active);
        strict_1.default.equal(profile.points, 0);
        strict_1.default.ok(profile.registeredAt);
        strict_1.default.equal(profile.tenantContext.tenantId, 't-001');
    });
    (0, node_test_1.default)('throws on duplicate registration (反例)', () => {
        const ctrl = freshController();
        ctrl.register(createContext(), { memberId: 'bob', nickname: 'Bob' });
        strict_1.default.throws(() => ctrl.register(createContext(), { memberId: 'bob', nickname: 'Bob2' }), /already exists/);
    });
});
// ── GET /members/:memberId ──
(0, node_test_1.describe)('GET /members/:memberId', () => {
    (0, node_test_1.default)('retrieves registered member profile (正例)', () => {
        const ctrl = freshController();
        ctrl.register(createContext(), { memberId: 'charlie', nickname: 'Charlie' });
        const profile = ctrl.getProfile('charlie');
        strict_1.default.equal(profile.memberId, 'charlie');
        strict_1.default.equal(profile.nickname, 'Charlie');
    });
    (0, node_test_1.default)('throws for unknown member (反例)', () => {
        const ctrl = freshController();
        strict_1.default.throws(() => ctrl.getProfile('ghost'), /not found/);
    });
    (0, node_test_1.default)('handles special characters in memberId (边界)', () => {
        const ctrl = freshController();
        ctrl.register(createContext(), { memberId: 'user@org.com', nickname: 'Email User' });
        const profile = ctrl.getProfile('user@org.com');
        strict_1.default.equal(profile.nickname, 'Email User');
    });
});
// ── GET /members ──
(0, node_test_1.describe)('GET /members', () => {
    (0, node_test_1.default)('listProfiles returns an array (边界)', () => {
        const ctrl = freshController();
        const list = ctrl.listProfiles();
        strict_1.default.ok(Array.isArray(list));
    });
    (0, node_test_1.default)('registered members appear in list (正例)', () => {
        const ctrl = freshController();
        const uid = `d-${Date.now()}`;
        ctrl.register(createContext(), { memberId: uid + '-1', nickname: 'D1' });
        ctrl.register(createContext(), { memberId: uid + '-2', nickname: 'D2' });
        const list = ctrl.listProfiles();
        const ids = list.map(p => p.memberId);
        strict_1.default.ok(ids.includes(uid + '-1'));
        strict_1.default.ok(ids.includes(uid + '-2'));
    });
});
(0, node_test_1.describe)('persistent member routes', () => {
    (0, node_test_1.default)('registerPersistent delegates to service', async () => {
        const mockService = {
            registerPersistent: async ({ mobile, nickname }) => createProfileFixture({
                memberId: 'member-p1',
                mobile,
                nickname,
                persisted: true
            })
        };
        const ctrl = createControllerWithServiceStub(mockService);
        const result = await ctrl.registerPersistent(createContext(), {
            mobile: '13600000000',
            nickname: 'Persistent Controller'
        });
        strict_1.default.equal(result.memberId, 'member-p1');
        strict_1.default.equal(result.mobile, '13600000000');
        strict_1.default.equal(result.persisted, true);
    });
    (0, node_test_1.default)('listPersistentMutationHistory delegates to service', async () => {
        const mockService = {
            listPersistentMutationHistory: async (memberId, tenantContext) => [
                createHistoryEntryFixture({
                    memberId,
                    tenantContext
                })
            ]
        };
        const ctrl = createControllerWithServiceStub(mockService);
        const result = await ctrl.listPersistentMutationHistory('member-h1', createContext());
        strict_1.default.equal(result[0]?.memberId, 'member-h1');
        strict_1.default.equal(result[0]?.tenantContext.tenantId, 't-001');
    });
    (0, node_test_1.default)('updatePersistentProfile delegates to service', async () => {
        const mockService = {
            updatePersistentProfile: async ({ memberId, nickname, mobile, email, address, notes, tenantContext }) => createProfileFixture({
                memberId,
                tenantContext,
                nickname,
                mobile,
                email,
                address,
                notes
            })
        };
        const ctrl = createControllerWithServiceStub(mockService);
        const result = await ctrl.updatePersistentProfile('member-p2', createContext(), {
            nickname: '资料已更新',
            mobile: '13800138000',
            email: 'member@example.com',
            address: '深圳南山科技园',
            notes: '高净值会员'
        });
        strict_1.default.equal(result.memberId, 'member-p2');
        strict_1.default.equal(result.nickname, '资料已更新');
        strict_1.default.equal(result.mobile, '13800138000');
        strict_1.default.equal(result.email, 'member@example.com');
        strict_1.default.equal(result.address, '深圳南山科技园');
        strict_1.default.equal(result.notes, '高净值会员');
        strict_1.default.equal(result.tenantContext.tenantId, 't-001');
    });
    (0, node_test_1.default)('login delegates to service and returns session token', async () => {
        const mockService = {
            login: async ({ mobile }) => createLoginResultFixture({
                member: createProfileFixture({
                    memberId: 'member-p2',
                    mobile
                })
            })
        };
        const ctrl = createControllerWithServiceStub(mockService);
        const result = await ctrl.login(createContext(), { mobile: '13500000000' });
        strict_1.default.equal(result.member.mobile, '13500000000');
        strict_1.default.equal(result.session.sessionToken, 'sess-1');
    });
    (0, node_test_1.default)('awardPersistentPoints delegates to service', async () => {
        let capturedApprovalTicket;
        const mockService = {
            awardPoints: async (memberId, points, tenantContext, approvalTicket) => {
                capturedApprovalTicket = approvalTicket;
                return createProfileFixture({
                    memberId,
                    tenantContext,
                    points
                });
            }
        };
        const ctrl = createControllerWithServiceStub(mockService);
        const result = await ctrl.awardPersistentPoints('member-p3', createContext(), {
            points: 300,
            approvalTicket: 'APR-MEMBER-001'
        });
        strict_1.default.ok('points' in result);
        strict_1.default.equal(result.memberId, 'member-p3');
        strict_1.default.equal(result.points, 300);
        strict_1.default.equal(capturedApprovalTicket, 'APR-MEMBER-001');
        strict_1.default.equal(result.tenantContext.tenantId, 't-001');
    });
    (0, node_test_1.default)('rollbackPersistentPoints delegates to service', async () => {
        let capturedApprovalTicket;
        const mockService = {
            rollbackPoints: async (memberId, points, tenantContext, approvalTicket) => {
                capturedApprovalTicket = approvalTicket;
                return createProfileFixture({
                    memberId,
                    tenantContext,
                    points
                });
            }
        };
        const ctrl = createControllerWithServiceStub(mockService);
        const result = await ctrl.rollbackPersistentPoints('member-p4', createContext(), {
            points: 120,
            approvalTicket: 'APR-MEMBER-002'
        });
        strict_1.default.ok('points' in result);
        strict_1.default.equal(result.memberId, 'member-p4');
        strict_1.default.equal(result.points, 120);
        strict_1.default.equal(capturedApprovalTicket, 'APR-MEMBER-002');
        strict_1.default.equal(result.tenantContext.tenantId, 't-001');
    });
    (0, node_test_1.default)('updatePersistentStatus delegates to service', async () => {
        let capturedApprovalTicket;
        const mockService = {
            updatePersistentStatus: async (memberId, status, tenantContext, approvalTicket) => {
                capturedApprovalTicket = approvalTicket;
                return createProfileFixture({
                    memberId,
                    tenantContext,
                    status: status
                });
            }
        };
        const ctrl = createControllerWithServiceStub(mockService);
        const result = await ctrl.updatePersistentStatus('member-p5', createContext(), {
            status: member_entity_1.MemberStatus.Blacklisted,
            approvalTicket: 'APR-MEMBER-003'
        });
        strict_1.default.ok('status' in result);
        strict_1.default.equal(result.memberId, 'member-p5');
        strict_1.default.equal(result.status, member_entity_1.MemberStatus.Blacklisted);
        strict_1.default.equal(capturedApprovalTicket, 'APR-MEMBER-003');
        strict_1.default.equal(result.tenantContext.tenantId, 't-001');
    });
    (0, node_test_1.default)('overridePersistentLevel delegates to service', async () => {
        let capturedApprovalTicket;
        const mockService = {
            overridePersistentLevel: async (memberId, level, tenantContext, approvalTicket) => {
                capturedApprovalTicket = approvalTicket;
                return createProfileFixture({
                    memberId,
                    tenantContext,
                    level: level
                });
            }
        };
        const ctrl = createControllerWithServiceStub(mockService);
        const result = await ctrl.overridePersistentLevel('member-p6', createContext(), {
            level: member_entity_1.MemberLevel.Platinum,
            approvalTicket: 'APR-MEMBER-004'
        });
        strict_1.default.ok('level' in result);
        strict_1.default.equal(result.memberId, 'member-p6');
        strict_1.default.equal(result.level, member_entity_1.MemberLevel.Platinum);
        strict_1.default.equal(capturedApprovalTicket, 'APR-MEMBER-004');
        strict_1.default.equal(result.tenantContext.tenantId, 't-001');
    });
    (0, node_test_1.default)('recordPersistentPaymentActivity delegates full payload to service', async () => {
        let capturedInput;
        const mockService = {
            recordPaymentActivity: async (input) => {
                capturedInput = input;
                return createProfileFixture({
                    memberId: input.memberId,
                    tenantContext: input.tenantContext,
                    lastPaymentOrderId: input.orderId,
                    lastPaymentAmount: input.amount,
                    lastPaymentChannel: input.channel
                });
            }
        };
        const ctrl = createControllerWithServiceStub(mockService);
        const result = await ctrl.recordPersistentPaymentActivity('member-p5', createContext(), {
            orderId: 'order-001',
            amount: 88,
            paidAt: '2026-06-18T10:00:00.000Z',
            channel: 'wechat-pay',
            source: 'cashier'
        });
        strict_1.default.equal(result.memberId, 'member-p5');
        strict_1.default.equal(result.tenantContext.tenantId, 't-001');
        strict_1.default.equal(capturedInput?.orderId, 'order-001');
        strict_1.default.equal(capturedInput?.amount, 88);
        strict_1.default.equal(capturedInput?.channel, 'wechat-pay');
        strict_1.default.equal(capturedInput?.source, 'cashier');
    });
});
// ── controller ↔ service ↔ Prisma integration ────────────────────────────
//
// 这里直接用真 MemberService 拼上 createPrismaStub，验证 POST /members/persistent/:id/profile
// 走 controller → service.updatePersistentProfile → saveMemberProfileExtension 把 email/address/notes
// 持久化到 Prisma MemberProfileExtension 表；后续 GET /members/persistent/:id 能再读回。
const member_service_2 = require("./member.service");
const member_service_3 = require("./member.service");
(0, node_test_1.describe)('controller ↔ service ↔ Prisma MemberProfileExtension integration', () => {
    (0, node_test_1.beforeEach)(() => {
        (0, member_service_3.resetMemberServiceTestState)();
    });
    function buildPrismaStubWithExtensionStorage() {
        const extensions = new Map();
        const memberProfiles = new Map();
        const users = new Map();
        const snapshots = new Map();
        return {
            extensions,
            memberProfiles,
            users,
            snapshots,
            prisma: {
                user: {
                    findUnique: async ({ where }) => {
                        if (where.id) {
                            return Array.from(users.values()).find((user) => user.id === where.id) ?? null;
                        }
                        if (where.mobile) {
                            return users.get(where.mobile) ?? null;
                        }
                        return null;
                    },
                    create: async ({ data }) => {
                        const now = new Date();
                        const record = {
                            id: `user-${users.size + 1}`,
                            tenantId: data.tenantId,
                            mobile: data.mobile,
                            role: data.role,
                            createdAt: now,
                            updatedAt: now
                        };
                        users.set(record.mobile, record);
                        return record;
                    },
                    update: async ({ where, data }) => {
                        const existing = Array.from(users.values()).find((user) => user.id === where.id);
                        if (!existing)
                            throw new Error(`User ${where.id} not found`);
                        users.delete(existing.mobile);
                        const next = { ...existing, mobile: data.mobile ?? existing.mobile, updatedAt: new Date() };
                        users.set(next.mobile, next);
                        return next;
                    }
                },
                memberProfile: {
                    findUnique: async ({ where }) => memberProfiles.get(where.id) ?? null,
                    findFirst: async ({ where }) => Array.from(memberProfiles.values()).find((profile) => {
                        if (where.tenantId && profile.tenantId !== where.tenantId)
                            return false;
                        if (where.userId !== undefined && profile.userId !== where.userId)
                            return false;
                        return true;
                    }) ?? null,
                    create: async ({ data }) => {
                        const now = new Date();
                        const record = {
                            id: `member-${memberProfiles.size + 1}`,
                            tenantId: data.tenantId,
                            userId: data.userId ?? null,
                            points: data.points ?? 0,
                            growthValue: data.growthValue ?? 0,
                            svipStatus: data.svipStatus ?? 'INACTIVE',
                            createdAt: now,
                            updatedAt: now
                        };
                        memberProfiles.set(record.id, record);
                        return record;
                    },
                    update: async ({ where, data }) => {
                        const existing = memberProfiles.get(where.id);
                        if (!existing)
                            throw new Error(`Member profile ${where.id} not found`);
                        const next = { ...existing, ...data, updatedAt: new Date() };
                        memberProfiles.set(where.id, next);
                        return next;
                    }
                },
                memberProfileExtension: {
                    findUnique: async ({ where }) => extensions.get(where.memberProfileId) ?? null,
                    upsert: async ({ where, create, update }) => {
                        const now = new Date();
                        const existing = extensions.get(where.memberProfileId);
                        const nextRecord = existing
                            ? { ...existing, ...update, updatedAt: now }
                            : {
                                id: `extension-${extensions.size + 1}`,
                                tenantId: String(create.tenantId),
                                memberProfileId: String(create.memberProfileId),
                                email: create.email ?? null,
                                address: create.address ?? null,
                                notes: create.notes ?? null,
                                createdAt: now,
                                updatedAt: now
                            };
                        extensions.set(where.memberProfileId, nextRecord);
                        return nextRecord;
                    }
                },
                lytMemberSnapshot: {
                    findUnique: async ({ where }) => snapshots.get(`${where.tenantId_externalMemberId.tenantId}:${where.tenantId_externalMemberId.externalMemberId}`) ?? null,
                    findFirst: async ({ where }) => Array.from(snapshots.values()).find((snap) => {
                        if (where.tenantId && snap.tenantId !== where.tenantId)
                            return false;
                        if (where.memberProfileId !== undefined && snap.memberProfileId !== where.memberProfileId)
                            return false;
                        return true;
                    }) ?? null,
                    upsert: async ({ where, create, update }) => {
                        const key = `${where.tenantId_externalMemberId.tenantId}:${where.tenantId_externalMemberId.externalMemberId}`;
                        const now = new Date();
                        const existing = snapshots.get(key);
                        const nextRecord = existing
                            ? {
                                ...existing,
                                ...update,
                                updatedAtFromSource: update.updatedAtFromSource ?? existing.updatedAtFromSource
                            }
                            : {
                                id: `snap-${snapshots.size + 1}`,
                                tenantId: String(create.tenantId),
                                memberProfileId: create.memberProfileId ?? null,
                                externalMemberId: String(create.externalMemberId),
                                points: Number(create.points ?? 0),
                                growthValue: Number(create.growthValue ?? 0),
                                status: String(create.status ?? 'ACTIVE'),
                                updatedAtFromSource: create.updatedAtFromSource ?? now
                            };
                        snapshots.set(key, nextRecord);
                        return nextRecord;
                    }
                }
            }
        };
    }
    (0, node_test_1.default)('POST /members/persistent/:memberId/profile persists email/address/notes to MemberProfileExtension', async () => {
        const harness = buildPrismaStubWithExtensionStorage();
        const service = new member_service_2.MemberService(harness.prisma);
        const ctrl = new member_controller_1.MemberController(service);
        const registered = await service.registerPersistent({
            tenantContext: createContext(),
            mobile: '13600000040',
            nickname: 'Extension User',
            initialPoints: 1200
        });
        // 调用 controller 路由（不带 service mock），确保路径 controller → service → saveMemberProfileExtension
        const updated = await ctrl.updatePersistentProfile(registered.memberId, createContext(), {
            nickname: 'Extension User Updated',
            mobile: '13600000041',
            email: 'ext-user@example.com',
            address: '深圳南山区',
            notes: 'VIP,需要专属跟进'
        });
        // 1) controller 返回值携带扩展字段
        strict_1.default.equal(updated.email, 'ext-user@example.com');
        strict_1.default.equal(updated.address, '深圳南山区');
        strict_1.default.equal(updated.notes, 'VIP,需要专属跟进');
        // 2) Prisma MemberProfileExtension 表真的被 upsert 了
        const persisted = harness.extensions.get(registered.memberId);
        strict_1.default.ok(persisted, 'MemberProfileExtension row should exist after update');
        strict_1.default.equal(persisted?.email, 'ext-user@example.com');
        strict_1.default.equal(persisted?.address, '深圳南山区');
        strict_1.default.equal(persisted?.notes, 'VIP,需要专属跟进');
        strict_1.default.equal(persisted?.tenantId, 't-001');
        // 3) 二次调用做 upsert（更新语义）：之前的 email 被清空，新的 email 落进去
        await ctrl.updatePersistentProfile(registered.memberId, createContext(), {
            nickname: 'Extension User Updated',
            mobile: '13600000041',
            email: 'ext-user-2@example.com',
            address: '',
            notes: undefined
        });
        const afterUpdate = harness.extensions.get(registered.memberId);
        strict_1.default.ok(afterUpdate, 'MemberProfileExtension row should remain after second update');
        strict_1.default.equal(afterUpdate?.email, 'ext-user-2@example.com');
        // 空字符串/未提供字段被规整为 null（与 service 的 normalizeSnapshotString 行为一致）
        strict_1.default.equal(afterUpdate?.address ?? null, null);
        // 4) 通过 controller GET 再次读取时拿到的就是 Prisma 里持久化的最新值
        const reloaded = await ctrl.getPersistentProfile(registered.memberId, createContext());
        strict_1.default.equal(reloaded.email, 'ext-user-2@example.com');
        strict_1.default.equal(reloaded.address, undefined);
        strict_1.default.equal(reloaded.notes, undefined);
    });
});
// ── POST /members/:memberId/add-points ──
(0, node_test_1.describe)('POST /members/:memberId/add-points', () => {
    (0, node_test_1.default)('adds points and auto-computes level (正例)', () => {
        const ctrl = freshController();
        ctrl.register(createContext(), { memberId: 'eve', nickname: 'Eve' });
        const updated = ctrl.addPoints('eve', { points: 600 });
        strict_1.default.equal(updated.points, 600);
        strict_1.default.equal(updated.level, member_entity_1.MemberLevel.Silver);
    });
    (0, node_test_1.default)('accumulates points across calls', () => {
        const ctrl = freshController();
        ctrl.register(createContext(), { memberId: 'frank', nickname: 'Frank' });
        ctrl.addPoints('frank', { points: 1200 });
        ctrl.addPoints('frank', { points: 900 });
        const final = ctrl.addPoints('frank', { points: 50 });
        strict_1.default.equal(final.points, 2150);
        strict_1.default.equal(final.level, member_entity_1.MemberLevel.Gold); // >= 2000
    });
    (0, node_test_1.default)('throws for non-existent member (反例)', () => {
        const ctrl = freshController();
        strict_1.default.throws(() => ctrl.addPoints('no-one', { points: 100 }), /not found/);
    });
    (0, node_test_1.default)('throws for negative points (反例/边界)', () => {
        const ctrl = freshController();
        ctrl.register(createContext(), { memberId: 'grace', nickname: 'Grace' });
        strict_1.default.throws(() => ctrl.addPoints('grace', { points: -50 }), /must be positive/);
    });
    (0, node_test_1.default)('to Diamond level at exact 50000 (边界)', () => {
        const ctrl = freshController();
        ctrl.register(createContext(), { memberId: 'hank', nickname: 'Hank' });
        const updated = ctrl.addPoints('hank', { points: 50000 });
        strict_1.default.equal(updated.level, member_entity_1.MemberLevel.Diamond);
    });
});
// ── GET /members/:memberId/upgrade-check ──
(0, node_test_1.describe)('GET /members/:memberId/upgrade-check', () => {
    (0, node_test_1.default)('Bronze cannot upgrade with low points (边界)', () => {
        const ctrl = freshController();
        ctrl.register(createContext(), { memberId: 'iris', nickname: 'Iris' });
        ctrl.addPoints('iris', { points: 100 });
        const result = ctrl.checkUpgrade('iris');
        strict_1.default.equal(result.canUpgrade, false);
        strict_1.default.equal(result.currentLevel, member_entity_1.MemberLevel.Bronze);
    });
    (0, node_test_1.default)('Bronze member can check upgrade before adding points (正例)', () => {
        // checkUpgrade uses canUpgrade(currentLevel, currentPoints)
        // Bronze + 600 points => computeMemberLevel(600) = Silver > Bronze => true
        const ctrl = freshController();
        const uid = `jack-${Date.now()}`;
        ctrl.register(createContext(), { memberId: uid, nickname: 'Jack' });
        ctrl.addPoints(uid, { points: 600 }); // now Silver, 600 pts
        // After upgrade to Silver, check if can go further
        const result = ctrl.checkUpgrade(uid);
        strict_1.default.equal(result.currentLevel, member_entity_1.MemberLevel.Silver);
        // Silver + 600 pts => compute = Silver, no upgrade yet
        strict_1.default.equal(result.canUpgrade, false);
    });
    (0, node_test_1.default)('Diamond shows no upgrade path (边界)', () => {
        const ctrl = freshController();
        ctrl.register(createContext(), { memberId: 'kate', nickname: 'Kate' });
        ctrl.addPoints('kate', { points: 60000 });
        const result = ctrl.checkUpgrade('kate');
        strict_1.default.equal(result.currentLevel, member_entity_1.MemberLevel.Diamond);
        strict_1.default.equal(result.canUpgrade, false);
        strict_1.default.equal(result.nextLevel, null);
        strict_1.default.equal(result.pointsNeeded, 0);
    });
    (0, node_test_1.default)('throws for non-existent member (反例)', () => {
        const ctrl = freshController();
        strict_1.default.throws(() => ctrl.checkUpgrade('no-such-member'), /not found/);
    });
});
//# sourceMappingURL=member.controller.test.js.map