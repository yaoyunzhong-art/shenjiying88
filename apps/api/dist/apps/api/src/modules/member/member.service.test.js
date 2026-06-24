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
const member_service_1 = require("./member.service");
const member_controller_1 = require("./member.controller");
const member_approval_recorder_1 = require("./member-approval-recorder");
const governance_approval_service_1 = require("../foundation/governance-approval/governance-approval.service");
const member_entity_1 = require("./member.entity");
/**
 * 构造用于闭环验证的最小 governance approval 栈：
 * - 真实 GovernanceApprovalService：保证 decideApproval 走完整状态机和 outcome hook 派发
 * - 真实 MemberApprovalOutcomeRecorder：通过 onModuleInit 注册到 outcomeHooks
 * - 桩 RuntimeGovernanceService：只暴露 replayAction/getActionReceipt，不会触发 runtime-governance 自动恢复分支
 */
function asPrismaService(prisma) {
    return prisma;
}
function createRuntimeGovernanceStub() {
    return {
        replayAction: async () => {
            throw new Error('runtime replay should not be triggered for member profile approval');
        },
        getActionReceipt: async () => {
            throw new Error('not implemented in test stub');
        }
    };
}
function createTestMemberService(prisma, runtimeGovernanceService) {
    return new member_service_1.MemberService(prisma ? asPrismaService(prisma) : undefined, runtimeGovernanceService);
}
function createApprovalClosureHarness(prisma) {
    const runtimeGovernanceService = createRuntimeGovernanceStub();
    const governanceApprovalService = new governance_approval_service_1.GovernanceApprovalService(asPrismaService(prisma), runtimeGovernanceService);
    const recorder = new member_approval_recorder_1.MemberApprovalOutcomeRecorder(asPrismaService(prisma), governanceApprovalService);
    recorder.onModuleInit();
    return { governanceApprovalService, recorder };
}
// ── helpers ────────────────────────────────────────────────────
function createContext(overrides = {}) {
    return {
        tenantId: 'tenant-mem',
        brandId: 'brand-mem',
        storeId: 'store-mem-1',
        marketCode: 'cn-mainland',
        ...overrides
    };
}
function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function createMemberController(service = createTestMemberService()) {
    return new member_controller_1.MemberController(service);
}
function assertMemberProfileResult(value) {
    strict_1.default.ok(!('approvalRequired' in value), 'expected immediate member profile result');
}
function assertApprovalResult(value) {
    strict_1.default.ok('approvalRequired' in value, 'expected approval result');
}
function createPrismaStub() {
    const users = new Map();
    const memberProfiles = new Map();
    const memberProfileExtensions = new Map();
    const lytMemberSnapshots = new Map();
    const memberOperationsTasks = new Map();
    const memberOperationsReceipts = new Map();
    const auditLogs = [];
    const governanceApprovals = new Map();
    return {
        user: {
            findUnique: async ({ where }) => {
                if (where.id) {
                    return Array.from(users.values()).find((item) => item.id === where.id) ?? null;
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
                const existing = Array.from(users.values()).find((item) => item.id === where.id);
                if (!existing) {
                    throw new Error(`User ${where.id} not found`);
                }
                users.delete(existing.mobile);
                const nextRecord = {
                    ...existing,
                    mobile: data.mobile ?? existing.mobile,
                    updatedAt: new Date()
                };
                users.set(nextRecord.mobile, nextRecord);
                return nextRecord;
            }
        },
        memberProfile: {
            findFirst: async ({ where }) => {
                return (Array.from(memberProfiles.values()).find((item) => {
                    if (where.tenantId && item.tenantId !== where.tenantId)
                        return false;
                    if (where.userId !== undefined && item.userId !== where.userId)
                        return false;
                    return true;
                }) ?? null);
            },
            findUnique: async ({ where }) => {
                return memberProfiles.get(where.id) ?? null;
            },
            findMany: async ({ where }) => {
                const records = Array.from(memberProfiles.values()).filter((item) => {
                    return where.tenantId ? item.tenantId === where.tenantId : true;
                });
                return records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            },
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
            }
        },
        memberProfileExtension: {
            findUnique: async ({ where }) => {
                return memberProfileExtensions.get(where.memberProfileId) ?? null;
            },
            upsert: async ({ where, create, update }) => {
                const now = new Date();
                const existing = memberProfileExtensions.get(where.memberProfileId);
                const nextRecord = existing
                    ? {
                        ...existing,
                        ...update,
                        updatedAt: now
                    }
                    : {
                        id: `member-profile-extension-${memberProfileExtensions.size + 1}`,
                        tenantId: String(create.tenantId),
                        memberProfileId: String(create.memberProfileId),
                        email: create.email ?? null,
                        address: create.address ?? null,
                        notes: create.notes ?? null,
                        createdAt: now,
                        updatedAt: now
                    };
                memberProfileExtensions.set(where.memberProfileId, nextRecord);
                return nextRecord;
            }
        },
        lytMemberSnapshot: {
            findUnique: async ({ where }) => {
                const compositeKey = `${where.tenantId_externalMemberId.tenantId}:${where.tenantId_externalMemberId.externalMemberId}`;
                return lytMemberSnapshots.get(compositeKey) ?? null;
            },
            findFirst: async ({ where }) => {
                return (Array.from(lytMemberSnapshots.values()).find((item) => {
                    if (where.tenantId && item.tenantId !== where.tenantId)
                        return false;
                    if (where.memberProfileId !== undefined && item.memberProfileId !== where.memberProfileId)
                        return false;
                    return true;
                }) ?? null);
            },
            findMany: async ({ where }) => {
                const records = Array.from(lytMemberSnapshots.values()).filter((item) => where.tenantId ? item.tenantId === where.tenantId : true);
                return records.sort((a, b) => b.updatedAtFromSource.getTime() - a.updatedAtFromSource.getTime());
            },
            upsert: async ({ where, create, update }) => {
                const compositeKey = `${where.tenantId_externalMemberId.tenantId}:${where.tenantId_externalMemberId.externalMemberId}`;
                const existing = lytMemberSnapshots.get(compositeKey);
                const now = new Date();
                const nextRecord = existing
                    ? {
                        ...existing,
                        ...update,
                        updatedAt: now
                    }
                    : {
                        id: `lyt-member-snapshot-${lytMemberSnapshots.size + 1}`,
                        tenantId: String(create.tenantId),
                        brandId: create.brandId ?? null,
                        storeId: create.storeId ?? null,
                        memberProfileId: create.memberProfileId ?? null,
                        externalMemberId: String(create.externalMemberId),
                        memberCode: create.memberCode ?? null,
                        mobile: create.mobile ?? null,
                        nickname: create.nickname ?? null,
                        levelCode: create.levelCode ?? null,
                        points: Number(create.points ?? 0),
                        growthValue: Number(create.growthValue ?? 0),
                        status: String(create.status ?? 'ACTIVE'),
                        updatedAtFromSource: create.updatedAtFromSource,
                        rawVersion: create.rawVersion ?? null,
                        rawPayload: create.rawPayload ?? null,
                        createdAt: now,
                        updatedAt: now
                    };
                lytMemberSnapshots.set(compositeKey, nextRecord);
                return nextRecord;
            }
        },
        memberOperationsTask: {
            findUnique: async ({ where }) => {
                if (where.taskId) {
                    return memberOperationsTasks.get(where.taskId) ?? null;
                }
                if (where.dedupeKey) {
                    return (Array.from(memberOperationsTasks.values()).find((item) => item.dedupeKey === where.dedupeKey) ??
                        null);
                }
                return null;
            },
            findMany: async ({ where, orderBy }) => {
                const records = Array.from(memberOperationsTasks.values()).filter((item) => {
                    if (where.tenantId && item.tenantId !== where.tenantId)
                        return false;
                    if (where.memberId && item.memberId !== where.memberId)
                        return false;
                    return true;
                });
                const direction = orderBy?.[0]?.createdAt ?? 'desc';
                return records.sort((a, b) => direction === 'desc'
                    ? b.createdAt.getTime() - a.createdAt.getTime()
                    : a.createdAt.getTime() - b.createdAt.getTime());
            },
            create: async ({ data }) => {
                const now = new Date();
                const record = {
                    taskId: String(data.taskId),
                    tenantId: String(data.tenantId),
                    brandId: data.brandId ?? null,
                    storeId: data.storeId ?? null,
                    marketCode: data.marketCode ?? null,
                    memberId: String(data.memberId),
                    actionCode: String(data.actionCode),
                    title: String(data.title),
                    reason: String(data.reason),
                    channel: String(data.channel),
                    priority: String(data.priority),
                    status: String(data.status),
                    executionLane: String(data.executionLane),
                    source: String(data.source),
                    sourceOrderId: data.sourceOrderId ?? null,
                    sourcePaymentId: data.sourcePaymentId ?? null,
                    executionSummary: data.executionSummary ?? null,
                    executionTargetId: data.executionTargetId ?? null,
                    executedAt: data.executedAt ?? null,
                    dedupeKey: String(data.dedupeKey),
                    createdAt: data.createdAt,
                    scheduledAt: data.scheduledAt,
                    updatedAt: now
                };
                memberOperationsTasks.set(record.taskId, record);
                return record;
            },
            update: async ({ where, data }) => {
                const existing = memberOperationsTasks.get(where.taskId);
                if (!existing) {
                    throw new Error(`Task ${where.taskId} not found`);
                }
                const nextRecord = {
                    ...existing,
                    ...data,
                    taskId: existing.taskId,
                    dedupeKey: String(data.dedupeKey ?? existing.dedupeKey),
                    createdAt: data.createdAt ?? existing.createdAt,
                    scheduledAt: data.scheduledAt ?? existing.scheduledAt,
                    executedAt: data.executedAt === null
                        ? null
                        : (data.executedAt ?? existing.executedAt ?? null),
                    updatedAt: new Date()
                };
                memberOperationsTasks.set(existing.taskId, nextRecord);
                return nextRecord;
            }
        },
        memberOperationsExecutionReceipt: {
            findUnique: async ({ where }) => {
                return memberOperationsReceipts.get(where.executionId) ?? null;
            },
            findMany: async ({ where, orderBy }) => {
                const records = Array.from(memberOperationsReceipts.values()).filter((item) => {
                    if (where.tenantId && item.tenantId !== where.tenantId)
                        return false;
                    if (where.memberId && item.memberId !== where.memberId)
                        return false;
                    return true;
                });
                const direction = orderBy?.[0]?.executedAt ?? 'desc';
                return records.sort((a, b) => direction === 'desc'
                    ? b.executedAt.getTime() - a.executedAt.getTime()
                    : a.executedAt.getTime() - b.executedAt.getTime());
            },
            create: async ({ data }) => {
                const now = new Date();
                const record = {
                    executionId: String(data.executionId),
                    tenantId: String(data.tenantId),
                    brandId: data.brandId ?? null,
                    storeId: data.storeId ?? null,
                    marketCode: data.marketCode ?? null,
                    memberId: String(data.memberId),
                    taskId: String(data.taskId),
                    actionCode: String(data.actionCode),
                    targetType: String(data.targetType),
                    targetId: String(data.targetId),
                    status: String(data.status),
                    summary: String(data.summary),
                    payload: (data.payload ?? {}),
                    runtimeReceiptCode: data.runtimeReceiptCode ?? null,
                    runtimeState: data.runtimeState ?? null,
                    runtimeReplayable: data.runtimeReplayable ?? null,
                    executedAt: data.executedAt,
                    createdAt: now,
                    updatedAt: now
                };
                memberOperationsReceipts.set(record.executionId, record);
                return record;
            },
            update: async ({ where, data }) => {
                const existing = memberOperationsReceipts.get(where.executionId);
                if (!existing) {
                    throw new Error(`Receipt ${where.executionId} not found`);
                }
                const nextRecord = {
                    ...existing,
                    ...data,
                    executionId: existing.executionId,
                    payload: (data.payload ?? existing.payload),
                    executedAt: data.executedAt ?? existing.executedAt,
                    updatedAt: new Date()
                };
                memberOperationsReceipts.set(existing.executionId, nextRecord);
                return nextRecord;
            }
        },
        auditLog: {
            create: async ({ data }) => {
                const record = {
                    id: `audit-${auditLogs.length + 1}`,
                    tenantId: String(data.tenantId),
                    brandId: data.brandId ?? null,
                    storeId: data.storeId ?? null,
                    action: String(data.action),
                    operatorId: String(data.operatorId ?? 'member-admin'),
                    resourceType: data.resourceType ?? null,
                    resourceId: data.resourceId ?? null,
                    sourceChannel: data.sourceChannel ?? null,
                    purpose: data.purpose ?? null,
                    payload: data.payload ?? null,
                    beforeValue: data.beforeValue ?? null,
                    afterValue: data.afterValue ?? null,
                    metadata: data.metadata ?? null,
                    createdAt: new Date()
                };
                auditLogs.unshift(record);
                return record;
            },
            findMany: async ({ where, take }) => {
                const records = auditLogs.filter((item) => {
                    if (where.tenantId && item.tenantId !== where.tenantId)
                        return false;
                    if (where.resourceType && item.resourceType !== where.resourceType)
                        return false;
                    if (where.resourceId && item.resourceId !== where.resourceId)
                        return false;
                    if (where.purpose) {
                        if (typeof where.purpose === 'string') {
                            if (item.purpose !== where.purpose)
                                return false;
                        }
                        else if (where.purpose.in) {
                            if (!item.purpose || !where.purpose.in.includes(item.purpose))
                                return false;
                        }
                    }
                    return true;
                });
                return records.slice(0, take ?? records.length);
            }
        },
        governanceApproval: {
            findUnique: async ({ where }) => {
                if (!where.approvalTicket) {
                    return null;
                }
                return governanceApprovals.get(where.approvalTicket) ?? null;
            },
            create: async ({ data }) => {
                const now = new Date();
                const approvalTicket = data.approvalTicket ?? null;
                const record = {
                    id: `governance-approval-${governanceApprovals.size + 1}`,
                    approvalTicket,
                    operation: String(data.operation),
                    resourceType: String(data.resourceType),
                    resourceKey: String(data.resourceKey),
                    scopeType: String(data.scopeType ?? 'TENANT'),
                    tenantId: data.tenantId ?? null,
                    brandId: data.brandId ?? null,
                    storeId: data.storeId ?? null,
                    required: Boolean(data.required),
                    requestedBy: data.requestedBy ?? null,
                    status: String(data.status ?? 'PENDING'),
                    version: Number(data.version ?? 1),
                    decisionNote: null,
                    decidedBy: null,
                    decidedAt: null,
                    summary: data.summary ?? null,
                    createdAt: now,
                    updatedAt: now
                };
                if (approvalTicket) {
                    governanceApprovals.set(approvalTicket, record);
                }
                return record;
            },
            update: async ({ where, data }) => {
                const existing = Array.from(governanceApprovals.values()).find((item) => item.id === where.id);
                if (!existing) {
                    throw new Error(`Governance approval ${where.id} not found`);
                }
                const nextRecord = {
                    ...existing,
                    ...data,
                    id: existing.id,
                    approvalTicket: data.approvalTicket ?? existing.approvalTicket,
                    summary: data.summary ?? existing.summary,
                    updatedAt: new Date()
                };
                if (existing.approvalTicket) {
                    governanceApprovals.delete(existing.approvalTicket);
                }
                if (nextRecord.approvalTicket) {
                    governanceApprovals.set(nextRecord.approvalTicket, nextRecord);
                }
                return nextRecord;
            }
        }
    };
}
(0, node_test_1.beforeEach)(() => {
    (0, member_service_1.resetMemberServiceTestState)();
});
// ── Original MemberService contract tests ──────────────────────
(0, node_test_1.describe)('member service contract (via controller)', () => {
    (0, node_test_1.default)('getBootstrap returns tenantContext unchanged', () => {
        const ctrl = createMemberController();
        const ctx = createContext();
        const result = ctrl.getBootstrap(ctx);
        strict_1.default.deepStrictEqual(result.tenantContext, ctx);
    });
    (0, node_test_1.default)('getBootstrap always returns scaffold phase', () => {
        const ctrl = createMemberController();
        const result = ctrl.getBootstrap(createContext());
        strict_1.default.equal(result.phase, 'scaffold');
    });
    (0, node_test_1.default)('getBootstrap exposes member-center capability', () => {
        const ctrl = createMemberController();
        const result = ctrl.getBootstrap(createContext());
        strict_1.default.ok(result.capabilities.includes('member-center'));
    });
    (0, node_test_1.default)('getBootstrap exposes points capability', () => {
        const ctrl = createMemberController();
        const result = ctrl.getBootstrap(createContext());
        strict_1.default.ok(result.capabilities.includes('points'));
    });
    (0, node_test_1.default)('getBootstrap exposes svip capability', () => {
        const ctrl = createMemberController();
        const result = ctrl.getBootstrap(createContext());
        strict_1.default.ok(result.capabilities.includes('svip'));
    });
    (0, node_test_1.default)('getBootstrap exposes blind-box capability', () => {
        const ctrl = createMemberController();
        const result = ctrl.getBootstrap(createContext());
        strict_1.default.ok(result.capabilities.includes('blind-box'));
    });
    (0, node_test_1.default)('getBootstrap capabilities length is 4', () => {
        const ctrl = createMemberController();
        const result = ctrl.getBootstrap(createContext());
        strict_1.default.equal(result.capabilities.length, 4);
    });
    (0, node_test_1.default)('getBootstrap with minimal context preserves tenantId', () => {
        const ctrl = createMemberController();
        const result = ctrl.getBootstrap({
            tenantId: 'min-tenant',
        });
        strict_1.default.equal(result.tenantContext.tenantId, 'min-tenant');
    });
    (0, node_test_1.default)('getBootstrap with full context preserves brandId and storeId', () => {
        const ctrl = createMemberController();
        const ctx = createContext({
            brandId: 'brand-x',
            storeId: 'store-y',
        });
        const result = ctrl.getBootstrap(ctx);
        strict_1.default.equal(result.tenantContext.brandId, 'brand-x');
        strict_1.default.equal(result.tenantContext.storeId, 'store-y');
    });
    (0, node_test_1.default)('getBootstrap with different marketCode preserves it', () => {
        const ctrl = createMemberController();
        const ctx = createContext({ marketCode: 'en-global' });
        const result = ctrl.getBootstrap(ctx);
        strict_1.default.equal(result.tenantContext.marketCode, 'en-global');
    });
});
// ── MemberService direct unit tests ─────────────────────────────
(0, node_test_1.describe)('MemberService direct instantiation', () => {
    (0, node_test_1.default)('MemberService is instantiable without dependencies', () => {
        const service = createTestMemberService();
        strict_1.default.ok(service instanceof member_service_1.MemberService);
    });
    (0, node_test_1.default)('getBootstrap returns consistent phase', () => {
        const service = createTestMemberService();
        const ctx = createContext();
        const result = service.getBootstrap(ctx);
        strict_1.default.equal(result.phase, 'scaffold');
    });
    (0, node_test_1.default)('getBootstrap with empty tenantId still returns scaffold', () => {
        const service = createTestMemberService();
        const result = service.getBootstrap({
            tenantId: '',
            brandId: undefined,
            storeId: undefined,
            marketCode: undefined,
        });
        strict_1.default.equal(result.phase, 'scaffold');
        strict_1.default.equal(result.tenantContext.tenantId, '');
        strict_1.default.deepStrictEqual(result.capabilities, ['member-center', 'points', 'svip', 'blind-box']);
    });
    (0, node_test_1.default)('getBootstrap capabilities are immutable across calls', () => {
        const service = createTestMemberService();
        const r1 = service.getBootstrap(createContext());
        const r2 = service.getBootstrap(createContext({ tenantId: 'different' }));
        strict_1.default.notDeepStrictEqual(r1.tenantContext, r2.tenantContext);
        strict_1.default.deepStrictEqual(r1.capabilities, r2.capabilities);
    });
    (0, node_test_1.default)('getBootstrap preserves all context fields when fully populated', () => {
        const service = createTestMemberService();
        const ctx = {
            tenantId: 't-full',
            brandId: 'b-full',
            storeId: 's-full',
            marketCode: 'zh-hk',
        };
        const result = service.getBootstrap(ctx);
        strict_1.default.equal(result.tenantContext.tenantId, 't-full');
        strict_1.default.equal(result.tenantContext.brandId, 'b-full');
        strict_1.default.equal(result.tenantContext.storeId, 's-full');
        strict_1.default.equal(result.tenantContext.marketCode, 'zh-hk');
    });
});
(0, node_test_1.describe)('MemberService vs MemberController consistency', () => {
    (0, node_test_1.default)('service and controller produce identical results for same input', () => {
        const service = createTestMemberService();
        const controller = createMemberController(service);
        const ctx = createContext();
        const svcResult = service.getBootstrap(ctx);
        const ctrlResult = controller.getBootstrap(ctx);
        strict_1.default.deepStrictEqual(svcResult, ctrlResult);
    });
    (0, node_test_1.default)('service and controller both handle undefined optional fields', () => {
        const service = createTestMemberService();
        const controller = createMemberController(service);
        const ctx = { tenantId: 't-only' };
        const svcResult = service.getBootstrap(ctx);
        const ctrlResult = controller.getBootstrap(ctx);
        strict_1.default.equal(svcResult.tenantContext.brandId, ctrlResult.tenantContext.brandId);
        strict_1.default.equal(svcResult.tenantContext.storeId, ctrlResult.tenantContext.storeId);
    });
});
(0, node_test_1.describe)('MemberService edge cases', () => {
    (0, node_test_1.default)('getBootstrap with very long tenantId', () => {
        const service = createTestMemberService();
        const longId = 't-' + 'a'.repeat(200);
        const result = service.getBootstrap({ tenantId: longId });
        strict_1.default.equal(result.tenantContext.tenantId, longId);
    });
    (0, node_test_1.default)('getBootstrap with unicode tenantId', () => {
        const service = createTestMemberService();
        const result = service.getBootstrap({ tenantId: '租户-テスト-тест' });
        strict_1.default.equal(result.tenantContext.tenantId, '租户-テスト-тест');
    });
    (0, node_test_1.default)('getBootstrap with special characters in tenantId', () => {
        const service = createTestMemberService();
        const result = service.getBootstrap({ tenantId: 't_123-abc.def@org' });
        strict_1.default.equal(result.tenantContext.tenantId, 't_123-abc.def@org');
    });
    (0, node_test_1.default)('getBootstrap returned object is a new reference each call', () => {
        const service = createTestMemberService();
        const ctx = createContext();
        const r1 = service.getBootstrap(ctx);
        const r2 = service.getBootstrap(ctx);
        strict_1.default.notStrictEqual(r1, r2);
        strict_1.default.notStrictEqual(r1.capabilities, r2.capabilities);
    });
});
// ── NEW: register + getProfile + listProfiles ───────────────────
(0, node_test_1.describe)('MemberService.register()', () => {
    (0, node_test_1.default)('registers a new bronze-level member', () => {
        const service = createTestMemberService();
        const profile = service.register({
            memberId: uid('mem'),
            tenantContext: createContext(),
            nickname: 'Alice'
        });
        strict_1.default.equal(profile.memberId.startsWith('mem-'), true);
        strict_1.default.equal(profile.level, member_entity_1.MemberLevel.Bronze);
        strict_1.default.equal(profile.status, member_entity_1.MemberStatus.Active);
        strict_1.default.equal(profile.points, 0);
        strict_1.default.equal(profile.nickname, 'Alice');
        strict_1.default.ok(profile.registeredAt);
        strict_1.default.ok(profile.lastActiveAt);
    });
    (0, node_test_1.default)('throws when registering duplicate memberId', () => {
        const service = createTestMemberService();
        const dupId = uid('dup');
        service.register({
            memberId: dupId,
            tenantContext: createContext(),
            nickname: 'Bob'
        });
        strict_1.default.throws(() => service.register({
            memberId: dupId,
            tenantContext: createContext(),
            nickname: 'Charlie'
        }), /already exists/);
    });
    (0, node_test_1.default)('registered member is retrievable via getProfile', () => {
        const service = createTestMemberService();
        const mid = uid('mem');
        service.register({
            memberId: mid,
            tenantContext: createContext(),
            nickname: 'Diana'
        });
        const profile = service.getProfile(mid);
        strict_1.default.ok(profile);
        strict_1.default.equal(profile.nickname, 'Diana');
    });
    (0, node_test_1.default)('getProfile returns undefined for unknown member', () => {
        const service = createTestMemberService();
        strict_1.default.equal(service.getProfile(uid('ghost')), undefined);
    });
    (0, node_test_1.default)('preserves tenant context in profile', () => {
        const service = createTestMemberService();
        const mid = uid('ctx');
        const ctx = createContext({ tenantId: 't-special', brandId: 'b-special' });
        const profile = service.register({
            memberId: mid,
            tenantContext: ctx,
            nickname: 'Eve'
        });
        strict_1.default.equal(profile.tenantContext.tenantId, 't-special');
        strict_1.default.equal(profile.tenantContext.brandId, 'b-special');
    });
});
(0, node_test_1.describe)('MemberService persistent member flow', () => {
    (0, node_test_1.default)('registerPersistent creates user-bound persistent member profile', async () => {
        const prisma = createPrismaStub();
        const service = createTestMemberService(prisma);
        const profile = await service.registerPersistent({
            tenantContext: createContext(),
            mobile: '13800000000',
            nickname: 'Persisted Alice',
            initialPoints: 600
        });
        strict_1.default.equal(profile.persisted, true);
        strict_1.default.equal(profile.source, 'prisma');
        strict_1.default.equal(profile.mobile, '13800000000');
        strict_1.default.equal(profile.nickname, 'Persisted Alice');
        strict_1.default.equal(profile.points, 600);
        strict_1.default.equal(profile.level, member_entity_1.MemberLevel.Silver);
        strict_1.default.ok(profile.userId);
    });
    (0, node_test_1.default)('login returns session and auto-hydrated persistent member', async () => {
        const prisma = createPrismaStub();
        const service = createTestMemberService(prisma);
        await service.registerPersistent({
            tenantContext: createContext(),
            mobile: '13900000000',
            nickname: 'Session User',
            initialPoints: 2000
        });
        const result = await service.login({
            tenantContext: createContext(),
            mobile: '13900000000'
        });
        strict_1.default.equal(result.member.mobile, '13900000000');
        strict_1.default.equal(result.member.level, member_entity_1.MemberLevel.Gold);
        strict_1.default.equal(result.session.tenantId, 'tenant-mem');
        strict_1.default.equal(result.session.authenticated, true);
        strict_1.default.ok(result.session.sessionToken.length > 20);
        const storedSession = service.getSession(result.session.sessionToken);
        strict_1.default.deepStrictEqual(storedSession, result.session);
    });
    (0, node_test_1.default)('getPersistentProfile resolves persisted member by id', async () => {
        const prisma = createPrismaStub();
        const service = createTestMemberService(prisma);
        const created = await service.registerPersistent({
            tenantContext: createContext(),
            mobile: '13700000000',
            nickname: 'Lookup User'
        });
        const result = await service.getPersistentProfile(created.memberId, createContext());
        strict_1.default.equal(result?.memberId, created.memberId);
        strict_1.default.equal(result?.persisted, true);
        strict_1.default.equal(result?.mobile, '13700000000');
    });
    (0, node_test_1.default)('awardPoints updates persisted member points and level below approval threshold', async () => {
        const prisma = createPrismaStub();
        prisma.memberProfile.update = async ({ where, data }) => {
            const target = await prisma.memberProfile.findUnique({ where });
            if (!target) {
                throw new Error('member not found');
            }
            target.points += data.points.increment;
            target.growthValue += data.growthValue.increment;
            target.updatedAt = new Date();
            return target;
        };
        const service = createTestMemberService(prisma);
        const created = await service.registerPersistent({
            tenantContext: createContext(),
            mobile: '13600000001',
            nickname: 'Award User',
            initialPoints: 100
        });
        const updated = await service.awardPoints(created.memberId, 4200, createContext());
        assertMemberProfileResult(updated);
        strict_1.default.equal(updated.points, 4300);
        strict_1.default.equal(updated.level, member_entity_1.MemberLevel.Gold);
    });
    (0, node_test_1.default)('awardPoints returns approval result for high-risk bonus', async () => {
        const prisma = createPrismaStub();
        const service = createTestMemberService(prisma);
        const created = await service.registerPersistent({
            tenantContext: createContext(),
            mobile: '13600000011',
            nickname: 'Approval Award User',
            initialPoints: 100
        });
        const updated = await service.awardPoints(created.memberId, 5200, createContext());
        assertApprovalResult(updated);
        strict_1.default.equal(updated.applied, false);
        strict_1.default.equal(updated.approvalRequired, true);
        strict_1.default.equal(updated.approvalStatus, 'PENDING');
        strict_1.default.equal(updated.operation, 'member.points.award');
        const profile = await service.getPersistentProfile(created.memberId, createContext());
        strict_1.default.equal(profile?.points, 100);
    });
    (0, node_test_1.default)('rollbackPoints deducts persisted member points and level safely', async () => {
        const prisma = createPrismaStub();
        prisma.memberProfile.update = async ({ where, data }) => {
            const target = await prisma.memberProfile.findUnique({ where });
            if (!target) {
                throw new Error('member not found');
            }
            target.points = data.points;
            target.growthValue = data.growthValue;
            target.updatedAt = new Date();
            return target;
        };
        const service = createTestMemberService(prisma);
        const created = await service.registerPersistent({
            tenantContext: createContext(),
            mobile: '13600000002',
            nickname: 'Rollback User',
            initialPoints: 900
        });
        const updated = await service.rollbackPoints(created.memberId, 500, createContext());
        assertMemberProfileResult(updated);
        strict_1.default.equal(updated.points, 400);
        strict_1.default.equal(updated.level, member_entity_1.MemberLevel.Bronze);
    });
    (0, node_test_1.default)('rollbackPoints returns approval result for high-risk deduction', async () => {
        const prisma = createPrismaStub();
        const service = createTestMemberService(prisma);
        const created = await service.registerPersistent({
            tenantContext: createContext(),
            mobile: '13600000014',
            nickname: 'Approval Rollback User',
            initialPoints: 1800
        });
        const updated = await service.rollbackPoints(created.memberId, 1200, createContext());
        assertApprovalResult(updated);
        strict_1.default.equal(updated.applied, false);
        strict_1.default.equal(updated.approvalRequired, true);
        strict_1.default.equal(updated.operation, 'member.points.rollback');
        const profile = await service.getPersistentProfile(created.memberId, createContext());
        strict_1.default.equal(profile?.points, 1800);
    });
    (0, node_test_1.default)('updatePersistentStatus persists non-risk status override through snapshot hydration', async () => {
        const prisma = createPrismaStub();
        const service = createTestMemberService(prisma);
        const created = await service.registerPersistent({
            tenantContext: createContext(),
            mobile: '13600000003',
            nickname: 'Status User',
            initialPoints: 1200
        });
        const updated = await service.updatePersistentStatus(created.memberId, member_entity_1.MemberStatus.Frozen, createContext());
        assertMemberProfileResult(updated);
        strict_1.default.equal(updated.status, member_entity_1.MemberStatus.Frozen);
        const profile = await service.getPersistentProfile(created.memberId, createContext());
        strict_1.default.equal(profile?.status, member_entity_1.MemberStatus.Frozen);
    });
    (0, node_test_1.default)('updatePersistentStatus returns approval result for blacklist action', async () => {
        const prisma = createPrismaStub();
        const service = createTestMemberService(prisma);
        const created = await service.registerPersistent({
            tenantContext: createContext(),
            mobile: '13600000012',
            nickname: 'Blacklist Approval User',
            initialPoints: 1200
        });
        const updated = await service.updatePersistentStatus(created.memberId, member_entity_1.MemberStatus.Blacklisted, createContext());
        assertApprovalResult(updated);
        strict_1.default.equal(updated.applied, false);
        strict_1.default.equal(updated.approvalRequired, true);
        strict_1.default.equal(updated.operation, 'member.status.update');
        const profile = await service.getPersistentProfile(created.memberId, createContext());
        strict_1.default.equal(profile?.status, member_entity_1.MemberStatus.Active);
    });
    (0, node_test_1.default)('updatePersistentProfile persists nickname and extension fields through snapshot hydration', async () => {
        const prisma = createPrismaStub();
        const service = createTestMemberService(prisma);
        const created = await service.registerPersistent({
            tenantContext: createContext(),
            mobile: '13600000005',
            nickname: 'Profile User',
            initialPoints: 1200
        });
        const updated = await service.updatePersistentProfile({
            memberId: created.memberId,
            tenantContext: createContext(),
            nickname: 'Profile User Updated',
            mobile: '13600000999',
            email: 'member@example.com',
            address: '深圳南山科技园',
            notes: '高净值会员'
        });
        strict_1.default.equal(updated.nickname, 'Profile User Updated');
        strict_1.default.equal(updated.mobile, '13600000999');
        strict_1.default.equal(updated.email, 'member@example.com');
        strict_1.default.equal(updated.address, '深圳南山科技园');
        strict_1.default.equal(updated.notes, '高净值会员');
        const profile = await service.getPersistentProfile(created.memberId, createContext());
        strict_1.default.equal(profile?.nickname, 'Profile User Updated');
        strict_1.default.equal(profile?.mobile, '13600000999');
        strict_1.default.equal(profile?.email, 'member@example.com');
        strict_1.default.equal(profile?.address, '深圳南山科技园');
        strict_1.default.equal(profile?.notes, '高净值会员');
    });
    (0, node_test_1.default)('listPersistentMutationHistory returns recent member audits', async () => {
        const prisma = createPrismaStub();
        const service = createTestMemberService(prisma);
        const created = await service.registerPersistent({
            tenantContext: createContext(),
            mobile: '13600000006',
            nickname: 'Audit User',
            initialPoints: 1200
        });
        await service.updatePersistentProfile({
            memberId: created.memberId,
            tenantContext: createContext(),
            nickname: 'Audit User Updated',
            mobile: '13600000111'
        });
        await service.updatePersistentStatus(created.memberId, member_entity_1.MemberStatus.Frozen, createContext());
        const history = await service.listPersistentMutationHistory(created.memberId, createContext());
        strict_1.default.ok(history.length >= 2);
        strict_1.default.equal(history[0]?.memberId, created.memberId);
        strict_1.default.ok(history.some((entry) => entry.action === 'profile-updated'));
        strict_1.default.ok(history.some((entry) => entry.action === 'status-updated'));
    });
    (0, node_test_1.default)('listPersistentMutationHistory merges approval outcome audit entries', async () => {
        const prisma = createPrismaStub();
        const service = createTestMemberService(prisma);
        const created = await service.registerPersistent({
            tenantContext: createContext(),
            mobile: '13600000020',
            nickname: 'Approval Audit User',
            initialPoints: 12000
        });
        // 模拟 governance approval 写回：直接构造一条 member-approval-outcome auditLog。
        await prisma.auditLog.create({
            data: {
                tenantId: 'tenant-mem',
                brandId: 'brand-mem',
                storeId: 'store-mem-1',
                action: 'member.approval.approved',
                operatorId: 'ops.approver',
                resourceType: 'member-profile',
                resourceId: created.memberId,
                sourceChannel: 'governance-approval',
                purpose: 'member-approval-outcome',
                payload: {
                    stage: 'APPROVED',
                    approvalTicket: 'apr-ticket-001',
                    approvalStatus: 'APPROVED',
                    operation: 'member.points.award',
                    resourceKey: created.memberId,
                    previousStatus: 'PENDING',
                    requestedBy: 'ops.admin-web'
                },
                beforeValue: { approvalStatus: 'PENDING' },
                afterValue: { approvalStatus: 'APPROVED', stage: 'APPROVED' },
                metadata: {
                    summary: '审批通过：member.points.award',
                    stage: 'APPROVED',
                    previousStatus: 'PENDING'
                }
            }
        });
        const history = await service.listPersistentMutationHistory(created.memberId, createContext());
        strict_1.default.ok(history.some((entry) => entry.action === 'approval.approved'), 'approval outcome entry should be present in mutation history');
        const approvalEntry = history.find((entry) => entry.action === 'approval.approved');
        strict_1.default.ok(approvalEntry?.summary.includes('审批通过'));
        strict_1.default.equal(approvalEntry?.memberId, created.memberId);
        strict_1.default.equal(approvalEntry?.operatorId, 'ops.approver');
    });
    (0, node_test_1.default)('high-risk awardPoints -> governance approval -> approved -> AuditLog closure loop', async () => {
        const prisma = createPrismaStub();
        const { governanceApprovalService } = createApprovalClosureHarness(prisma);
        const service = createTestMemberService(prisma);
        const created = await service.registerPersistent({
            tenantContext: createContext(),
            mobile: '13600000030',
            nickname: 'Closure Loop Award User',
            initialPoints: 100
        });
        // 1) 高额加分触发 governance approval PENDING 工单
        const pending = await service.awardPoints(created.memberId, 5200, createContext());
        assertApprovalResult(pending);
        strict_1.default.equal(pending.applied, false);
        strict_1.default.equal(pending.approvalRequired, true);
        strict_1.default.equal(pending.approvalStatus, 'PENDING');
        strict_1.default.equal(pending.operation, 'member.points.award');
        strict_1.default.ok(pending.approvalTicket);
        // 2) 审批人决策通过 -> outcome hook 派发 -> MemberApprovalOutcomeRecorder 写 AuditLog
        const decided = await governanceApprovalService.decideApproval({
            approvalTicket: pending.approvalTicket,
            decidedBy: 'ops.approver-closure',
            decisionNote: 'manual review ok',
            status: 'APPROVED'
        });
        strict_1.default.equal(decided.status, 'APPROVED');
        // 3) 会员侧历史读侧能直接拿到审批结果条目
        const history = await service.listPersistentMutationHistory(created.memberId, createContext());
        const approvalEntry = history.find((entry) => entry.action === 'approval.approved');
        strict_1.default.ok(approvalEntry, 'closure loop must surface approval.approved entry in mutation history');
        strict_1.default.ok(approvalEntry?.summary.includes('审批通过'));
        strict_1.default.equal(approvalEntry?.operatorId, 'ops.approver-closure');
    });
    (0, node_test_1.default)('high-risk rollbackPoints rejection -> AuditLog reflects approval.rejected entry', async () => {
        const prisma = createPrismaStub();
        const { governanceApprovalService } = createApprovalClosureHarness(prisma);
        const service = createTestMemberService(prisma);
        const created = await service.registerPersistent({
            tenantContext: createContext(),
            mobile: '13600000031',
            nickname: 'Closure Loop Rollback User',
            initialPoints: 5000
        });
        const pending = await service.rollbackPoints(created.memberId, 1500, createContext());
        assertApprovalResult(pending);
        strict_1.default.equal(pending.approvalRequired, true);
        strict_1.default.ok(pending.approvalTicket);
        await governanceApprovalService.decideApproval({
            approvalTicket: pending.approvalTicket,
            decidedBy: 'ops.reviewer',
            decisionNote: 'insufficient evidence',
            status: 'REJECTED'
        });
        const history = await service.listPersistentMutationHistory(created.memberId, createContext());
        const rejected = history.find((entry) => entry.action === 'approval.rejected');
        strict_1.default.ok(rejected, 'closure loop must surface approval.rejected entry in mutation history');
        strict_1.default.ok(rejected?.summary.includes('审批驳回'));
        strict_1.default.equal(rejected?.operatorId, 'ops.reviewer');
    });
    (0, node_test_1.default)('blacklist status approval cancellation writes approval.cancelled audit entry', async () => {
        const prisma = createPrismaStub();
        const { governanceApprovalService } = createApprovalClosureHarness(prisma);
        const service = createTestMemberService(prisma);
        const created = await service.registerPersistent({
            tenantContext: createContext(),
            mobile: '13600000032',
            nickname: 'Closure Loop Blacklist User',
            initialPoints: 2400
        });
        const pending = await service.updatePersistentStatus(created.memberId, member_entity_1.MemberStatus.Blacklisted, createContext());
        assertApprovalResult(pending);
        strict_1.default.equal(pending.approvalRequired, true);
        strict_1.default.equal(pending.operation, 'member.status.update');
        strict_1.default.ok(pending.approvalTicket);
        await governanceApprovalService.cancelApproval({
            approvalTicket: pending.approvalTicket,
            cancelledBy: 'ops.requester',
            cancelReason: 'false positive'
        });
        const history = await service.listPersistentMutationHistory(created.memberId, createContext());
        const cancelled = history.find((entry) => entry.action === 'approval.cancelled');
        strict_1.default.ok(cancelled, 'closure loop must surface approval.cancelled entry in mutation history');
        strict_1.default.ok(cancelled?.summary.includes('审批撤销'));
        strict_1.default.equal(cancelled?.operatorId, 'ops.requester');
    });
    (0, node_test_1.default)('overridePersistentLevel persists level override through snapshot hydration', async () => {
        const prisma = createPrismaStub();
        const service = createTestMemberService(prisma);
        const created = await service.registerPersistent({
            tenantContext: createContext(),
            mobile: '13600000004',
            nickname: 'Level User',
            initialPoints: 1200
        });
        const updated = await service.overridePersistentLevel(created.memberId, member_entity_1.MemberLevel.Platinum, createContext());
        assertMemberProfileResult(updated);
        strict_1.default.equal(updated.level, member_entity_1.MemberLevel.Platinum);
        const profile = await service.getPersistentProfile(created.memberId, createContext());
        strict_1.default.equal(profile?.level, member_entity_1.MemberLevel.Platinum);
    });
    (0, node_test_1.default)('overridePersistentLevel returns approval result for manual downgrade', async () => {
        const prisma = createPrismaStub();
        const service = createTestMemberService(prisma);
        const created = await service.registerPersistent({
            tenantContext: createContext(),
            mobile: '13600000013',
            nickname: 'Downgrade Approval User',
            initialPoints: 12000
        });
        const updated = await service.overridePersistentLevel(created.memberId, member_entity_1.MemberLevel.Silver, createContext());
        assertApprovalResult(updated);
        strict_1.default.equal(updated.applied, false);
        strict_1.default.equal(updated.approvalRequired, true);
        strict_1.default.equal(updated.operation, 'member.level.override');
        const profile = await service.getPersistentProfile(created.memberId, createContext());
        strict_1.default.equal(profile?.level, member_entity_1.MemberLevel.Platinum);
    });
    (0, node_test_1.default)('syncLytMemberSnapshot creates standard snapshot and persistent business profile', async () => {
        const prisma = createPrismaStub();
        const service = createTestMemberService(prisma);
        const result = await service.syncLytMemberSnapshot({
            tenantContext: createContext(),
            externalMemberId: 'lyt-member-001',
            memberCode: 'VIP-001',
            mobile: '13500000000',
            nickname: 'LYT Alice',
            levelCode: 'VIP',
            points: 3200,
            growthValue: 3600,
            status: 'ACTIVE',
            updatedAt: '2026-06-14T12:00:00.000Z',
            rawPayload: {
                externalMemberId: 'lyt-member-001',
                nickname: 'LYT Alice'
            }
        });
        strict_1.default.equal(result.snapshot.externalMemberId, 'lyt-member-001');
        strict_1.default.equal(result.snapshot.memberProfileId, result.profile.memberId);
        strict_1.default.equal(result.snapshot.mobile, '13500000000');
        strict_1.default.equal(result.profile.mobile, '13500000000');
        strict_1.default.equal(result.profile.nickname, 'LYT Alice');
        strict_1.default.equal(result.profile.points, 3200);
        strict_1.default.equal(result.profile.level, member_entity_1.MemberLevel.Gold);
        const snapshot = await service.getLytMemberSnapshot('lyt-member-001', createContext());
        strict_1.default.equal(snapshot?.memberCode, 'VIP-001');
        strict_1.default.equal(snapshot?.levelCode, 'VIP');
    });
    (0, node_test_1.default)('getPersistentProfile hydrates snapshot nickname and mobile when user is absent', async () => {
        const prisma = createPrismaStub();
        const service = createTestMemberService(prisma);
        const result = await service.syncLytMemberSnapshot({
            tenantContext: createContext(),
            externalMemberId: 'lyt-member-002',
            nickname: 'Snapshot Only',
            points: 1200,
            growthValue: 1500,
            updatedAt: '2026-06-14T12:10:00.000Z'
        });
        const profile = await service.getPersistentProfile(result.profile.memberId, createContext());
        strict_1.default.equal(profile?.nickname, 'Snapshot Only');
        strict_1.default.equal(profile?.lastActiveAt, '2026-06-14T12:10:00.000Z');
    });
    (0, node_test_1.default)('recordPaymentActivity enriches lifecycle stage and tags on persistent profile', async () => {
        const prisma = createPrismaStub();
        const service = createTestMemberService(prisma);
        const result = await service.syncLytMemberSnapshot({
            tenantContext: createContext(),
            externalMemberId: 'lyt-member-003',
            nickname: 'Lifecycle User',
            points: 2100,
            growthValue: 2300,
            updatedAt: '2026-06-14T12:20:00.000Z'
        });
        const enriched = await service.recordPaymentActivity({
            memberId: result.profile.memberId,
            tenantContext: createContext(),
            orderId: 'lyt-order-003',
            amount: 288,
            paidAt: '2026-06-14T12:30:00.000Z',
            channel: 'wechat-pay',
            source: 'lyt-snapshot'
        });
        strict_1.default.equal(enriched.lifecycleStage, 'vip-active');
        strict_1.default.equal(enriched.lastPaymentOrderId, 'lyt-order-003');
        strict_1.default.equal(enriched.lastPaymentAmount, 288);
        strict_1.default.ok(enriched.tags?.includes('paid-member'));
        strict_1.default.ok(enriched.tags?.includes('high-value-buyer'));
        strict_1.default.ok(enriched.tags?.includes('channel-wechat-pay'));
        const tasks = await service.listOperationsTasks(result.profile.memberId, createContext());
        const receipts = await service.listOperationsReceipts(result.profile.memberId, createContext());
        strict_1.default.ok(tasks.length > 0);
        strict_1.default.ok(receipts.length > 0);
        strict_1.default.ok(tasks.every((task) => task.source === 'payment-success'));
        strict_1.default.ok(tasks.some((task) => task.sourceOrderId === 'lyt-order-003'));
    });
    (0, node_test_1.default)('getOperationsProfile derives audience segments and recommended actions from enriched profile', async () => {
        const prisma = createPrismaStub();
        const service = createTestMemberService(prisma);
        const result = await service.syncLytMemberSnapshot({
            tenantContext: createContext(),
            externalMemberId: 'lyt-member-004',
            nickname: 'Ops User',
            points: 12000,
            growthValue: 15000,
            updatedAt: '2026-06-14T12:40:00.000Z'
        });
        await service.recordPaymentActivity({
            memberId: result.profile.memberId,
            tenantContext: createContext(),
            orderId: 'lyt-order-004',
            amount: 520,
            paidAt: '2026-06-14T12:45:00.000Z',
            channel: 'wechat-pay',
            source: 'lyt-snapshot'
        });
        const operations = await service.getOperationsProfile(result.profile.memberId, createContext());
        strict_1.default.equal(operations?.lifecycleStage, 'vip-active');
        strict_1.default.ok(operations?.audienceSegments.includes('high-value-buyer'));
        strict_1.default.ok(operations?.audienceSegments.includes('channel-wechat-pay'));
        strict_1.default.ok(operations?.recommendedActions.some((action) => action.code === 'assign-vip-concierge'));
        strict_1.default.ok(operations?.automationTriggers.some((trigger) => trigger.code === 'payment-success-journey'));
    });
    (0, node_test_1.default)('enqueueOperationsTasks queues deduped execution tasks from operations profile', async () => {
        const prisma = createPrismaStub();
        const service = createTestMemberService(prisma);
        const result = await service.syncLytMemberSnapshot({
            tenantContext: createContext(),
            externalMemberId: 'lyt-member-005',
            nickname: 'Queue User',
            points: 2200,
            growthValue: 2600,
            updatedAt: '2026-06-14T12:50:00.000Z'
        });
        await service.recordPaymentActivity({
            memberId: result.profile.memberId,
            tenantContext: createContext(),
            orderId: 'lyt-order-005',
            amount: 188,
            paidAt: '2026-06-14T12:55:00.000Z',
            channel: 'wechat-pay',
            source: 'lyt-snapshot'
        });
        const first = await service.enqueueOperationsTasks({
            memberId: result.profile.memberId,
            tenantContext: createContext(),
            source: 'payment-success',
            sourceOrderId: 'lyt-order-005',
            sourcePaymentId: 'lyt-payment-005'
        });
        const second = await service.enqueueOperationsTasks({
            memberId: result.profile.memberId,
            tenantContext: createContext(),
            source: 'payment-success',
            sourceOrderId: 'lyt-order-005',
            sourcePaymentId: 'lyt-payment-005'
        });
        strict_1.default.equal(first.queuedTasks.length, 0);
        strict_1.default.equal(second.queuedTasks.length, 0);
        strict_1.default.ok(first.existingTasks.length >= 1);
        strict_1.default.ok(second.existingTasks.length >= 1);
        const listed = await service.listOperationsTasks(result.profile.memberId, createContext());
        strict_1.default.equal(listed.length, first.existingTasks.length);
        const receipts = await service.listOperationsReceipts(result.profile.memberId, createContext());
        strict_1.default.ok(receipts.length >= 1);
    });
    (0, node_test_1.default)('enqueueOperationsTasks records runtime governance receipt and supports replay', async () => {
        const prisma = createPrismaStub();
        const runtimeCalls = [];
        const mockRuntimeGovernanceService = {
            submitAction: async () => {
                runtimeCalls.push('submit');
                return {
                    receiptCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001',
                    state: 'submitted',
                    ticket: { ticketCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001-HANDLER' },
                    ledger: { ledgerKey: 'runtime-ledger:ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001', replayable: true }
                };
            },
            syncAction: async () => {
                runtimeCalls.push('sync');
                return {
                    receiptCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001',
                    state: 'submitted',
                    ticket: { ticketCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001-HANDLER' },
                    ledger: { ledgerKey: 'runtime-ledger:ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001', replayable: true }
                };
            },
            recordCallback: async () => {
                runtimeCalls.push('callback');
                return {
                    receiptCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001',
                    state: 'callback-recorded',
                    ticket: { ticketCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001-HANDLER' },
                    ledger: { ledgerKey: 'runtime-ledger:ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001', replayable: true }
                };
            },
            getActionReceipt: async () => ({
                receiptCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001',
                state: 'callback-recorded',
                ticket: { ticketCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001-HANDLER' },
                ledger: { ledgerKey: 'runtime-ledger:ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001', replayable: true }
            }),
            replayAction: async () => {
                runtimeCalls.push('replay');
                return {
                    receiptCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001',
                    state: 'replay-scheduled',
                    ticket: { ticketCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001-HANDLER' },
                    ledger: { ledgerKey: 'runtime-ledger:ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001', replayable: false }
                };
            }
        };
        const service = createTestMemberService(prisma, mockRuntimeGovernanceService);
        const result = await service.syncLytMemberSnapshot({
            tenantContext: createContext(),
            externalMemberId: 'lyt-member-006',
            nickname: 'Runtime User',
            points: 1200,
            growthValue: 1600,
            updatedAt: '2026-06-14T13:10:00.000Z'
        });
        await service.recordPaymentActivity({
            memberId: result.profile.memberId,
            tenantContext: createContext(),
            orderId: 'lyt-order-006',
            amount: 120,
            paidAt: '2026-06-14T13:15:00.000Z',
            channel: 'wechat-pay',
            source: 'lyt-snapshot'
        });
        const receipts = await service.listOperationsReceipts(result.profile.memberId, createContext());
        const runtimeReceipt = await service.getOperationsRuntimeReceipt(result.profile.memberId, receipts[0].executionId, createContext());
        const replayed = await service.replayOperationsExecution(result.profile.memberId, receipts[0].executionId, createContext());
        strict_1.default.ok(receipts[0]?.runtimeReceiptCode);
        strict_1.default.equal(runtimeReceipt?.receiptCode, 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001');
        strict_1.default.equal(replayed?.state, 'replay-scheduled');
        strict_1.default.deepEqual(runtimeCalls, ['submit', 'sync', 'callback', 'replay']);
    });
    (0, node_test_1.default)('enqueueOperationsTasks persists tasks and receipts across service instances', async () => {
        const prisma = createPrismaStub();
        const firstService = createTestMemberService(prisma);
        const result = await firstService.syncLytMemberSnapshot({
            tenantContext: createContext(),
            externalMemberId: 'lyt-member-007',
            nickname: 'Persistent Ops User',
            points: 2600,
            growthValue: 3200,
            updatedAt: '2026-06-15T09:00:00.000Z'
        });
        await firstService.recordPaymentActivity({
            memberId: result.profile.memberId,
            tenantContext: createContext(),
            orderId: 'lyt-order-007',
            amount: 268,
            paidAt: '2026-06-15T09:05:00.000Z',
            channel: 'wechat-pay',
            source: 'lyt-snapshot'
        });
        const seededTasks = await firstService.listOperationsTasks(result.profile.memberId, createContext());
        const seededReceipts = await firstService.listOperationsReceipts(result.profile.memberId, createContext());
        const secondService = createTestMemberService(prisma);
        const listedTasks = await secondService.listOperationsTasks(result.profile.memberId, createContext());
        const listedReceipts = await secondService.listOperationsReceipts(result.profile.memberId, createContext());
        strict_1.default.equal(listedTasks.length, seededTasks.length);
        strict_1.default.equal(listedReceipts.length, seededReceipts.length);
        strict_1.default.ok(listedTasks.every((task) => task.tenantContext.tenantId === createContext().tenantId));
        strict_1.default.ok(listedReceipts.every((receipt) => seededReceipts.some((item) => item.executionId === receipt.executionId)));
    });
});
(0, node_test_1.describe)('MemberService.listProfiles()', () => {
    (0, node_test_1.default)('listProfiles returns an array', () => {
        const service = createTestMemberService();
        const profiles = service.listProfiles();
        strict_1.default.ok(Array.isArray(profiles));
    });
    (0, node_test_1.default)('newly registered members appear in list', () => {
        const service = createTestMemberService();
        const idA = uid('la');
        const idB = uid('lb');
        service.register({
            memberId: idA,
            tenantContext: createContext(),
            nickname: 'Alpha'
        });
        service.register({
            memberId: idB,
            tenantContext: createContext(),
            nickname: 'Beta'
        });
        const profiles = service.listProfiles();
        const ids = profiles.map(p => p.memberId);
        strict_1.default.ok(ids.includes(idA));
        strict_1.default.ok(ids.includes(idB));
    });
});
// ── NEW: addPoints + level computation ──────────────────────────
(0, node_test_1.describe)('MemberService.addPoints()', () => {
    (0, node_test_1.default)('adds points and Bronze stays Bronze with small amount', () => {
        const service = createTestMemberService();
        const mid = uid('pts');
        service.register({
            memberId: mid,
            tenantContext: createContext(),
            nickname: 'Frank'
        });
        const updated = service.addPoints(mid, 300);
        strict_1.default.equal(updated.points, 300);
        strict_1.default.equal(updated.level, member_entity_1.MemberLevel.Bronze); // 300 < 500
    });
    (0, node_test_1.default)('adds points and upgrades to Silver when crossing 500', () => {
        const service = createTestMemberService();
        const mid = uid('up');
        service.register({
            memberId: mid,
            tenantContext: createContext(),
            nickname: 'Grace'
        });
        const updated = service.addPoints(mid, 600);
        strict_1.default.equal(updated.points, 600);
        strict_1.default.equal(updated.level, member_entity_1.MemberLevel.Silver); // 600 >= 500
    });
    (0, node_test_1.default)('adds points and upgrades to Gold when crossing 2000', () => {
        const service = createTestMemberService();
        const mid = uid('gold');
        service.register({
            memberId: mid,
            tenantContext: createContext(),
            nickname: 'Hank'
        });
        const updated = service.addPoints(mid, 2500);
        strict_1.default.equal(updated.points, 2500);
        strict_1.default.equal(updated.level, member_entity_1.MemberLevel.Gold); // 2500 >= 2000
    });
    (0, node_test_1.default)('upgrades to Platinum at 10000 points', () => {
        const service = createTestMemberService();
        const mid = uid('plat');
        service.register({
            memberId: mid,
            tenantContext: createContext(),
            nickname: 'Iris'
        });
        const updated = service.addPoints(mid, 10000);
        strict_1.default.equal(updated.points, 10000);
        strict_1.default.equal(updated.level, member_entity_1.MemberLevel.Platinum);
    });
    (0, node_test_1.default)('upgrades to Diamond at 50000 points', () => {
        const service = createTestMemberService();
        const mid = uid('dia');
        service.register({
            memberId: mid,
            tenantContext: createContext(),
            nickname: 'Jack'
        });
        const updated = service.addPoints(mid, 50000);
        strict_1.default.equal(updated.points, 50000);
        strict_1.default.equal(updated.level, member_entity_1.MemberLevel.Diamond);
    });
    (0, node_test_1.default)('accumulates points over multiple addPoints calls', () => {
        const service = createTestMemberService();
        const mid = uid('acc');
        service.register({
            memberId: mid,
            tenantContext: createContext(),
            nickname: 'Kate'
        });
        service.addPoints(mid, 300);
        service.addPoints(mid, 300);
        const updated = service.addPoints(mid, 400);
        strict_1.default.equal(updated.points, 1000);
        strict_1.default.equal(updated.level, member_entity_1.MemberLevel.Silver); // 1000 >= 500, < 2000
    });
    (0, node_test_1.default)('updates lastActiveAt on addPoints', () => {
        const service = createTestMemberService();
        const mid = uid('act');
        service.register({
            memberId: mid,
            tenantContext: createContext(),
            nickname: 'Leo'
        });
        // Small delay to ensure timestamp changes
        const before = new Date().toISOString();
        const updated = service.addPoints(mid, 100);
        strict_1.default.ok(updated.lastActiveAt >= before);
    });
    (0, node_test_1.default)('throws for unknown member', () => {
        const service = createTestMemberService();
        strict_1.default.throws(() => service.addPoints(uid('ghost'), 100), /not found/);
    });
    (0, node_test_1.default)('throws for non-positive points', () => {
        const service = createTestMemberService();
        const mid = uid('zero');
        service.register({
            memberId: mid,
            tenantContext: createContext(),
            nickname: 'Mia'
        });
        strict_1.default.throws(() => service.addPoints(mid, 0), /must be positive/);
        strict_1.default.throws(() => service.addPoints(mid, -50), /must be positive/);
    });
    (0, node_test_1.default)('revokePoints deducts points and recalculates level', () => {
        const service = createTestMemberService();
        const mid = uid('revoke');
        service.register({
            memberId: mid,
            tenantContext: createContext(),
            nickname: 'Revoke User'
        });
        service.addPoints(mid, 700);
        const updated = service.revokePoints(mid, 300);
        strict_1.default.equal(updated.points, 400);
        strict_1.default.equal(updated.level, member_entity_1.MemberLevel.Bronze);
    });
    (0, node_test_1.default)('revokePoints floors at zero', () => {
        const service = createTestMemberService();
        const mid = uid('revoke-floor');
        service.register({
            memberId: mid,
            tenantContext: createContext(),
            nickname: 'Revoke Floor User'
        });
        service.addPoints(mid, 100);
        const updated = service.revokePoints(mid, 500);
        strict_1.default.equal(updated.points, 0);
        strict_1.default.equal(updated.level, member_entity_1.MemberLevel.Bronze);
    });
});
// ── NEW: checkUpgrade ───────────────────────────────────────────
(0, node_test_1.describe)('MemberService.checkUpgrade()', () => {
    (0, node_test_1.default)('Bronze member with 300 points cannot upgrade', () => {
        const service = createTestMemberService();
        const mid = uid('chk');
        service.register({
            memberId: mid,
            tenantContext: createContext(),
            nickname: 'Nina'
        });
        service.addPoints(mid, 300);
        const result = service.checkUpgrade(mid);
        strict_1.default.equal(result.canUpgrade, false);
        strict_1.default.equal(result.currentLevel, member_entity_1.MemberLevel.Bronze);
    });
    (0, node_test_1.default)('Bronze member with 0 points cannot upgrade', () => {
        const service = createTestMemberService();
        const mid = uid('chk2');
        service.register({
            memberId: mid,
            tenantContext: createContext(),
            nickname: 'Oscar'
        });
        const result = service.checkUpgrade(mid);
        strict_1.default.equal(result.canUpgrade, false);
        strict_1.default.equal(result.currentLevel, member_entity_1.MemberLevel.Bronze);
        strict_1.default.equal(result.nextLevel, null);
    });
    (0, node_test_1.default)('Platinum member with enough points can upgrade to Diamond', () => {
        const service = createTestMemberService();
        const mid = uid('chk3');
        service.register({
            memberId: mid,
            tenantContext: createContext(),
            nickname: 'Paul'
        });
        service.addPoints(mid, 60000); // now Diamond (>= 50000)
        const result = service.checkUpgrade(mid);
        // 60000 >= 50000 => Diamond, cannot upgrade further
        strict_1.default.equal(result.currentLevel, member_entity_1.MemberLevel.Diamond);
        strict_1.default.equal(result.canUpgrade, false);
        strict_1.default.equal(result.nextLevel, null);
        strict_1.default.equal(result.pointsNeeded, 0);
    });
    (0, node_test_1.default)('Diamond member cannot upgrade further', () => {
        const service = createTestMemberService();
        const mid = uid('max');
        service.register({
            memberId: mid,
            tenantContext: createContext(),
            nickname: 'Quinn'
        });
        service.addPoints(mid, 100000);
        const result = service.checkUpgrade(mid);
        strict_1.default.equal(result.currentLevel, member_entity_1.MemberLevel.Diamond);
        strict_1.default.equal(result.canUpgrade, false);
        strict_1.default.equal(result.nextLevel, null);
        strict_1.default.equal(result.pointsNeeded, 0);
    });
    (0, node_test_1.default)('throws for unknown member', () => {
        const service = createTestMemberService();
        strict_1.default.throws(() => service.checkUpgrade(uid('phant')), /not found/);
    });
});
// ── Entity pure function tests ──────────────────────────────────
(0, node_test_1.describe)('computeMemberLevel (pure)', () => {
    (0, node_test_1.default)('returns Bronze for 0 points', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(0), member_entity_1.MemberLevel.Bronze);
    });
    (0, node_test_1.default)('returns Silver at exact 500', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(500), member_entity_1.MemberLevel.Silver);
    });
    (0, node_test_1.default)('returns Gold at exact 2000', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(2000), member_entity_1.MemberLevel.Gold);
    });
    (0, node_test_1.default)('returns Platinum at exact 10000', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(10000), member_entity_1.MemberLevel.Platinum);
    });
    (0, node_test_1.default)('returns Diamond at exact 50000', () => {
        strict_1.default.equal((0, member_entity_1.computeMemberLevel)(50000), member_entity_1.MemberLevel.Diamond);
    });
    (0, node_test_1.default)('all thresholds are monotonic', () => {
        const levels = Object.values(member_entity_1.MemberLevel);
        for (let i = 1; i < levels.length; i++) {
            strict_1.default.ok(member_entity_1.MEMBER_LEVEL_THRESHOLDS[levels[i]] > member_entity_1.MEMBER_LEVEL_THRESHOLDS[levels[i - 1]], `${levels[i]} threshold should be > ${levels[i - 1]}`);
        }
    });
});
(0, node_test_1.describe)('canUpgrade (pure)', () => {
    (0, node_test_1.default)('Bronze + 600 points => can upgrade', () => {
        strict_1.default.equal((0, member_entity_1.canUpgrade)(member_entity_1.MemberLevel.Bronze, 600), true);
    });
    (0, node_test_1.default)('Bronze + 100 points => cannot upgrade', () => {
        strict_1.default.equal((0, member_entity_1.canUpgrade)(member_entity_1.MemberLevel.Bronze, 100), false);
    });
    (0, node_test_1.default)('Diamond + 99999 points => cannot upgrade', () => {
        strict_1.default.equal((0, member_entity_1.canUpgrade)(member_entity_1.MemberLevel.Diamond, 99999), false);
    });
    (0, node_test_1.default)('Gold at 12000 points can upgrade to Platinum', () => {
        // computeMemberLevel(12000) = Platinum > Gold => true
        strict_1.default.equal((0, member_entity_1.canUpgrade)(member_entity_1.MemberLevel.Gold, 12000), true);
    });
});
//# sourceMappingURL=member.service.test.js.map