"use strict";
/**
 * 🐜 自动: [runtime-governance] [D] controller spec 补全
 *
 * 运行时治理 controller 测试（正例 + 反例 + 边界 + 元数据）
 *
 * 端点覆盖:
 *   - POST actions (submitAction)
 *   - GET actions/:receiptCode (getActionReceipt)
 *   - POST actions/:receiptCode/sync (syncAction)
 *   - POST actions/:receiptCode/callback (recordCallback)
 *   - POST actions/:receiptCode/replay (replayAction)
 *   - POST actions/batch-replay (batchReplayActions)
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
const runtime_governance_controller_1 = require("./runtime-governance.controller");
const identity_access_decorator_1 = require("../identity-access/identity-access.decorator");
// ── 轻量 mock receipt 工厂 ──
function mockReceipt(overrides) {
    return {
        receiptCode: 'receipt-001',
        app: 'admin-web',
        action: 'runtime-replay',
        state: 'submitted',
        nextStep: 'PROCEED',
        riskLevel: 'medium',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
        payloadSummary: '{}',
        ticket: { ticketCode: 'receipt-001-HANDLER', ticketType: 'HANDLER_CALLBACK', status: 'ready-for-handler', summary: 'ready' },
        sync: { handlerName: 'test-handler', syncMode: 'callback-followup', syncEndpoint: '/sync', callbackEndpoint: '/callback', idempotencyKey: 'k1', ready: true, summary: 'synced' },
        callback: { callbackStatus: 'awaiting-callback', ackToken: 'ack-001', lastEvent: 'HANDLER_ACCEPTED', summary: 'waiting' },
        ledger: { ledgerKey: 'ledger:receipt-001', replayEndpoint: '/replay', replayable: true, summary: 'replayable' },
        retry: { currentAttempt: 0, maxAttempts: 3, nextBackoffMs: 1000, retryable: true, summary: 'retryable' },
        rateLimit: { allowed: true, limit: 12, remaining: 11, retryAfterSeconds: 0, scopeKey: 'admin-web:runtime-replay:tenant-demo' },
        events: [],
        generatedAt: new Date().toISOString(),
        ...overrides
    };
}
function mockBatchResult(total, receiptCodes) {
    return {
        generatedAt: new Date().toISOString(),
        total,
        items: receiptCodes.map((rc) => ({ receiptCode: rc, receipt: mockReceipt({ receiptCode: rc }) }))
    };
}
// ── 辅助工厂 ──
function makeActor(overrides) {
    return {
        actorId: 'actor-rg-001',
        actorType: 'employee-user',
        roles: ['SUPER_ADMIN'],
        permissions: ['foundation.runtime-governance.write', 'foundation.runtime-governance.read'],
        authenticated: true,
        source: 'headers',
        ...overrides
    };
}
function makeTenantContext(overrides) {
    return {
        tenantId: 't-rg-001',
        brandId: 'b-rg-001',
        storeId: 's-rg-001',
        marketCode: 'zh-cn',
        ...overrides
    };
}
function makeController(mockOverrides) {
    const mockService = {
        submitAction: () => Promise.resolve(mockReceipt()),
        getActionReceipt: () => Promise.resolve(mockReceipt()),
        syncAction: () => Promise.resolve(mockReceipt()),
        recordCallback: () => Promise.resolve(mockReceipt()),
        replayAction: () => Promise.resolve(mockReceipt()),
        batchReplayActions: () => Promise.resolve(mockBatchResult(2, ['r-1', 'r-2'])),
        ...mockOverrides
    };
    return new runtime_governance_controller_1.RuntimeGovernanceController(mockService);
}
// ── 固定参数 ──
const tenantCtx = makeTenantContext();
const actor = makeActor();
const writeRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'];
const writePerms = ['foundation.runtime-governance.write'];
const readPerms = ['foundation.runtime-governance.read'];
// ══════════════════════════════════════════════════
// 1. 控制器类级别元数据
// ══════════════════════════════════════════════════
(0, node_test_1.describe)('runtime-governance controller class metadata', () => {
    (0, node_test_1.default)('controller path is "foundation/runtime-governance"', () => {
        const path = Reflect.getMetadata('path', runtime_governance_controller_1.RuntimeGovernanceController);
        strict_1.default.equal(path, 'foundation/runtime-governance');
    });
    (0, node_test_1.default)('controller class enforces tenant scope', () => {
        const scope = Reflect.getMetadata(identity_access_decorator_1.TENANT_SCOPE_METADATA_KEY, runtime_governance_controller_1.RuntimeGovernanceController);
        strict_1.default.deepEqual(scope, {});
    });
});
// ══════════════════════════════════════════════════
// 2. 端点级别元数据
// ══════════════════════════════════════════════════
(0, node_test_1.describe)('submitAction metadata', () => {
    (0, node_test_1.default)('route: POST /foundation/runtime-governance/actions', () => {
        const method = Reflect.getMetadata('method', runtime_governance_controller_1.RuntimeGovernanceController.prototype.submitAction);
        const path = Reflect.getMetadata('path', runtime_governance_controller_1.RuntimeGovernanceController.prototype.submitAction);
        strict_1.default.equal(method, 1); // POST
        strict_1.default.equal(path, 'actions');
    });
    (0, node_test_1.default)('requires write roles and write permission', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, runtime_governance_controller_1.RuntimeGovernanceController.prototype.submitAction);
        const perms = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, runtime_governance_controller_1.RuntimeGovernanceController.prototype.submitAction);
        strict_1.default.deepEqual(roles, writeRoles);
        strict_1.default.deepEqual(perms, writePerms);
    });
});
(0, node_test_1.describe)('getActionReceipt metadata', () => {
    (0, node_test_1.default)('route: GET /foundation/runtime-governance/actions/:receiptCode', () => {
        const method = Reflect.getMetadata('method', runtime_governance_controller_1.RuntimeGovernanceController.prototype.getActionReceipt);
        const path = Reflect.getMetadata('path', runtime_governance_controller_1.RuntimeGovernanceController.prototype.getActionReceipt);
        strict_1.default.equal(method, 0); // GET
        strict_1.default.equal(path, 'actions/:receiptCode');
    });
    (0, node_test_1.default)('requires read roles and read permission', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, runtime_governance_controller_1.RuntimeGovernanceController.prototype.getActionReceipt);
        const perms = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, runtime_governance_controller_1.RuntimeGovernanceController.prototype.getActionReceipt);
        strict_1.default.deepEqual(roles, writeRoles);
        strict_1.default.deepEqual(perms, readPerms);
    });
});
(0, node_test_1.describe)('syncAction metadata', () => {
    (0, node_test_1.default)('route: POST /foundation/runtime-governance/actions/:receiptCode/sync', () => {
        const method = Reflect.getMetadata('method', runtime_governance_controller_1.RuntimeGovernanceController.prototype.syncAction);
        const path = Reflect.getMetadata('path', runtime_governance_controller_1.RuntimeGovernanceController.prototype.syncAction);
        strict_1.default.equal(method, 1); // POST
        strict_1.default.equal(path, 'actions/:receiptCode/sync');
    });
    (0, node_test_1.default)('requires write roles and write permission', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, runtime_governance_controller_1.RuntimeGovernanceController.prototype.syncAction);
        const perms = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, runtime_governance_controller_1.RuntimeGovernanceController.prototype.syncAction);
        strict_1.default.deepEqual(roles, writeRoles);
        strict_1.default.deepEqual(perms, writePerms);
    });
});
(0, node_test_1.describe)('recordCallback metadata', () => {
    (0, node_test_1.default)('route: POST /foundation/runtime-governance/actions/:receiptCode/callback', () => {
        const method = Reflect.getMetadata('method', runtime_governance_controller_1.RuntimeGovernanceController.prototype.recordCallback);
        const path = Reflect.getMetadata('path', runtime_governance_controller_1.RuntimeGovernanceController.prototype.recordCallback);
        strict_1.default.equal(method, 1); // POST
        strict_1.default.equal(path, 'actions/:receiptCode/callback');
    });
    (0, node_test_1.default)('requires write roles and write permission', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, runtime_governance_controller_1.RuntimeGovernanceController.prototype.recordCallback);
        const perms = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, runtime_governance_controller_1.RuntimeGovernanceController.prototype.recordCallback);
        strict_1.default.deepEqual(roles, writeRoles);
        strict_1.default.deepEqual(perms, writePerms);
    });
});
(0, node_test_1.describe)('replayAction metadata', () => {
    (0, node_test_1.default)('route: POST /foundation/runtime-governance/actions/:receiptCode/replay', () => {
        const method = Reflect.getMetadata('method', runtime_governance_controller_1.RuntimeGovernanceController.prototype.replayAction);
        const path = Reflect.getMetadata('path', runtime_governance_controller_1.RuntimeGovernanceController.prototype.replayAction);
        strict_1.default.equal(method, 1); // POST
        strict_1.default.equal(path, 'actions/:receiptCode/replay');
    });
    (0, node_test_1.default)('requires write roles and write permission', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, runtime_governance_controller_1.RuntimeGovernanceController.prototype.replayAction);
        const perms = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, runtime_governance_controller_1.RuntimeGovernanceController.prototype.replayAction);
        strict_1.default.deepEqual(roles, writeRoles);
        strict_1.default.deepEqual(perms, writePerms);
    });
});
(0, node_test_1.describe)('batchReplayActions metadata', () => {
    (0, node_test_1.default)('route: POST /foundation/runtime-governance/actions/batch-replay', () => {
        const method = Reflect.getMetadata('method', runtime_governance_controller_1.RuntimeGovernanceController.prototype.batchReplayActions);
        const path = Reflect.getMetadata('path', runtime_governance_controller_1.RuntimeGovernanceController.prototype.batchReplayActions);
        strict_1.default.equal(method, 1); // POST
        strict_1.default.equal(path, 'actions/batch-replay');
    });
    (0, node_test_1.default)('requires write roles and write permission', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, runtime_governance_controller_1.RuntimeGovernanceController.prototype.batchReplayActions);
        const perms = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, runtime_governance_controller_1.RuntimeGovernanceController.prototype.batchReplayActions);
        strict_1.default.deepEqual(roles, writeRoles);
        strict_1.default.deepEqual(perms, writePerms);
    });
});
// ══════════════════════════════════════════════════
// 3. 正例：controller 通过 mock service 返回正确结果
// ══════════════════════════════════════════════════
(0, node_test_1.describe)('submitAction [正例]', () => {
    (0, node_test_1.default)('提交运行时治理动作返回 receipt（含 receiptCode 与 state）', async () => {
        const controller = makeController();
        const body = {
            app: 'admin-web',
            action: 'runtime-replay',
            nextStep: 'PROCEED',
            riskLevel: 'high',
            requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
            payload: { sourceReceiptCode: 'receipt-001' },
            payloadSummary: '{"sourceReceiptCode":"receipt-001"}',
            recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
            handlerName: 'admin-runtime-replay-handler',
            idempotencyKey: 'submit:001'
        };
        const result = await controller.submitAction(body, tenantCtx, actor);
        strict_1.default.equal(result.receiptCode, 'receipt-001');
        strict_1.default.equal(result.state, 'submitted');
    });
    (0, node_test_1.default)('提交动作时 tenantContext 和 actor 被合并入请求上下文', async () => {
        let captured = null;
        const controller = makeController({
            submitAction: (input) => { captured = input; return Promise.resolve(mockReceipt({ receiptCode: 'receipt-002' })); }
        });
        const body = {
            app: 'admin-web',
            action: 'runtime-replay',
            nextStep: 'PROCEED',
            riskLevel: 'high',
            requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
            payload: { sourceReceiptCode: 'receipt-002' },
            payloadSummary: '{}',
            recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
            handlerName: 'handler-test',
            idempotencyKey: 'submit:002'
        };
        await controller.submitAction(body, tenantCtx, actor);
        strict_1.default.equal(captured.tenantId, 't-rg-001');
        strict_1.default.equal(captured.brandId, 'b-rg-001');
        strict_1.default.equal(captured.storeId, 's-rg-001');
        strict_1.default.equal(captured.actorId, 'actor-rg-001');
    });
});
(0, node_test_1.describe)('getActionReceipt [正例]', () => {
    (0, node_test_1.default)('按 receiptCode 查询返回 receipt 数据（含 state）', async () => {
        const controller = makeController();
        const result = await controller.getActionReceipt('receipt-001');
        strict_1.default.equal(result.receiptCode, 'receipt-001');
        strict_1.default.equal(result.state, 'submitted');
    });
    (0, node_test_1.default)('receiptCode 包含特殊字符时仍正常返回', async () => {
        const controller = makeController({
            getActionReceipt: () => Promise.resolve(mockReceipt({ receiptCode: 'rcpt-a/b?c=1' }))
        });
        const result = await controller.getActionReceipt('rcpt-a/b?c=1');
        strict_1.default.equal(result.receiptCode, 'rcpt-a/b?c=1');
    });
});
(0, node_test_1.describe)('syncAction [正例]', () => {
    (0, node_test_1.default)('同步运行时治理动作返回 receipt（含 receiptCode 与 sync 子字段）', async () => {
        const controller = makeController();
        const body = {
            handlerName: 'admin-runtime-replay-handler',
            ticketCode: 'ticket-001',
            idempotencyKey: 'sync:001'
        };
        const result = await controller.syncAction('receipt-001', body, tenantCtx, actor);
        strict_1.default.equal(result.receiptCode, 'receipt-001');
        strict_1.default.equal(result.sync.ready, true);
    });
});
(0, node_test_1.describe)('recordCallback [正例]', () => {
    (0, node_test_1.default)('记录回调返回 receipt（含 callback 子字段）', async () => {
        const controller = makeController();
        const body = {
            callbackStatus: 'callback-recorded',
            ackToken: 'ack-token-001',
            lastEvent: 'HANDLER_COMPLETED',
            summary: 'handler completed successfully',
            idempotencyKey: 'callback:001'
        };
        const result = await controller.recordCallback('receipt-001', body, tenantCtx, actor);
        strict_1.default.equal(result.receiptCode, 'receipt-001');
        strict_1.default.equal(result.callback.lastEvent, 'HANDLER_ACCEPTED');
    });
});
(0, node_test_1.describe)('replayAction [正例]', () => {
    (0, node_test_1.default)('重放动作返回 receipt（含 state 与 ledger 字段）', async () => {
        const controller = makeController();
        const body = {
            ledgerKey: 'ledger:receipt-001',
            requestedFrom: 'TOB_WEB_RUNTIME',
            ticketCode: 'ticket-001',
            idempotencyKey: 'replay:001'
        };
        const result = await controller.replayAction('receipt-001', body, tenantCtx, actor);
        strict_1.default.equal(result.receiptCode, 'receipt-001');
        strict_1.default.equal(result.state, 'submitted');
    });
});
(0, node_test_1.describe)('batchReplayActions [正例]', () => {
    (0, node_test_1.default)('批量重放返回 { generatedAt, total, items }', async () => {
        const controller = makeController();
        const body = {
            items: [
                { receiptCode: 'r-1', ledgerKey: 'ledger-1', requestedFrom: 'TOB_WEB_RUNTIME', ticketCode: 't-1', idempotencyKey: 'br:001' },
                { receiptCode: 'r-2', ledgerKey: 'ledger-2', requestedFrom: 'TOB_WEB_RUNTIME', ticketCode: 't-2', idempotencyKey: 'br:002' }
            ]
        };
        const result = await controller.batchReplayActions(body, tenantCtx, actor);
        strict_1.default.equal(result.total, 2);
        strict_1.default.ok(Array.isArray(result.items));
        strict_1.default.equal(result.items.length, 2);
    });
});
// ══════════════════════════════════════════════════
// 4. 反例与边界
// ══════════════════════════════════════════════════
(0, node_test_1.describe)('submitAction [边界/反例]', () => {
    (0, node_test_1.default)('tenantContext 为 undefined 时不抛错（允许平台级操作）', async () => {
        const controller = makeController();
        const body = {
            app: 'admin-web',
            action: 'runtime-replay',
            nextStep: 'PROCEED',
            riskLevel: 'high',
            requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
            payload: {},
            payloadSummary: '{}',
            recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
            handlerName: 'handler-test',
            idempotencyKey: 'submit:003'
        };
        const result = await controller.submitAction(body, undefined, actor);
        strict_1.default.equal(result.receiptCode, 'receipt-001');
    });
    (0, node_test_1.default)('actor 无 actorId 时仍正常处理', async () => {
        const controller = makeController();
        const body = {
            app: 'admin-web',
            action: 'runtime-replay',
            nextStep: 'PROCEED',
            riskLevel: 'high',
            requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
            payload: {},
            payloadSummary: '{}',
            recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
            handlerName: 'handler-test',
            idempotencyKey: 'submit:004'
        };
        const minimalActor = {
            actorId: undefined,
            actorType: 'employee-user',
            roles: [],
            permissions: [],
            authenticated: false,
            source: 'headers'
        };
        const result = await controller.submitAction(body, tenantCtx, minimalActor);
        strict_1.default.equal(result.receiptCode, 'receipt-001');
    });
});
(0, node_test_1.describe)('getActionReceipt [反例]', () => {
    (0, node_test_1.default)('不存在的 receiptCode 返回 service 层结果（由 NestJS 异常过滤器处理）', async () => {
        const controller = makeController({
            getActionReceipt: () => Promise.resolve(null)
        });
        const result = await controller.getActionReceipt('non-existent');
        strict_1.default.equal(result, null);
    });
});
(0, node_test_1.describe)('syncAction [边界]', () => {
    (0, node_test_1.default)('空 ticketCode 正常透传', async () => {
        const controller = makeController();
        const body = {
            handlerName: 'handler-test',
            ticketCode: '',
            idempotencyKey: 'sync:empty'
        };
        const result = await controller.syncAction('receipt-001', body, tenantCtx, actor);
        strict_1.default.equal(result.receiptCode, 'receipt-001');
    });
});
(0, node_test_1.describe)('batchReplayActions [边界]', () => {
    (0, node_test_1.default)('单元素批量重放', async () => {
        const controller = makeController({
            batchReplayActions: () => Promise.resolve(mockBatchResult(1, ['r-single']))
        });
        const body = {
            items: [
                { receiptCode: 'r-single', ledgerKey: 'ledger-1', requestedFrom: 'TOB_WEB_RUNTIME', ticketCode: 't-1', idempotencyKey: 'br:single' }
            ]
        };
        const result = await controller.batchReplayActions(body, tenantCtx, actor);
        strict_1.default.equal(result.total, 1);
        strict_1.default.equal(result.items.length, 1);
    });
    (0, node_test_1.default)('空数组批量重放（由 DTO 验证层拦截，此处仅测透传）', async () => {
        const controller = makeController({
            batchReplayActions: () => Promise.resolve(mockBatchResult(0, []))
        });
        const body = { items: [] };
        const result = await controller.batchReplayActions(body, tenantCtx, actor);
        strict_1.default.equal(result.total, 0);
        strict_1.default.equal(result.items.length, 0);
    });
});
// ══════════════════════════════════════════════════
// 5. 全局元数据一致性回归
// ══════════════════════════════════════════════════
(0, node_test_1.describe)('所有写端点使用相同的角色和权限元数据', () => {
    const writeEndpoints = [
        'submitAction',
        'syncAction',
        'recordCallback',
        'replayAction',
        'batchReplayActions'
    ];
    writeEndpoints.forEach((ep) => {
        (0, node_test_1.default)(`${ep} 需要 ${writeRoles.length} 个角色 + ${writePerms.length} 个权限`, () => {
            const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, runtime_governance_controller_1.RuntimeGovernanceController.prototype[ep]);
            const perms = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, runtime_governance_controller_1.RuntimeGovernanceController.prototype[ep]);
            strict_1.default.deepEqual(roles, writeRoles, `${ep} roles mismatch`);
            strict_1.default.deepEqual(perms, writePerms, `${ep} permissions mismatch`);
        });
    });
});
(0, node_test_1.describe)('读端点使用独立权限', () => {
    (0, node_test_1.default)('getActionReceipt 使用 read 权限而非 write', () => {
        const perms = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, runtime_governance_controller_1.RuntimeGovernanceController.prototype.getActionReceipt);
        strict_1.default.deepEqual(perms, readPerms);
        strict_1.default.notDeepEqual(perms, writePerms);
    });
    (0, node_test_1.default)('getActionReceipt 与写端点共享相同角色集合', () => {
        const readRoles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, runtime_governance_controller_1.RuntimeGovernanceController.prototype.getActionReceipt);
        const writeRoles_ = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, runtime_governance_controller_1.RuntimeGovernanceController.prototype.submitAction);
        strict_1.default.deepEqual(readRoles, writeRoles_);
    });
});
//# sourceMappingURL=runtime-governance.controller.test.js.map