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
const identity_access_decorator_1 = require("../foundation/identity-access/identity-access.decorator");
const workbench_controller_1 = require("./workbench.controller");
const workbench_service_1 = require("./workbench.service");
(0, node_test_1.describe)('workbench action controller metadata', () => {
    (0, node_test_1.default)('approval, replay and handler routes expose protected runtime action endpoints', () => {
        strict_1.default.equal(Reflect.getMetadata('path', workbench_controller_1.WorkbenchController.prototype.executeApproval), 'approvals/execute');
        strict_1.default.equal(Reflect.getMetadata('path', workbench_controller_1.WorkbenchController.prototype.submitRuntimeReplay), 'actions/runtime-replay');
        strict_1.default.equal(Reflect.getMetadata('path', workbench_controller_1.WorkbenchController.prototype.getActionReceipt), 'actions/:receiptCode');
        strict_1.default.equal(Reflect.getMetadata('path', workbench_controller_1.WorkbenchController.prototype.syncHandlerReceipt), 'handlers/:handlerName/receipts/:receiptCode/sync');
        strict_1.default.equal(Reflect.getMetadata('path', workbench_controller_1.WorkbenchController.prototype.recordHandlerCallback), 'handlers/:handlerName/receipts/:receiptCode/callback');
        strict_1.default.equal(Reflect.getMetadata('path', workbench_controller_1.WorkbenchController.prototype.replayActionReceipt), 'actions/:receiptCode/replay');
    });
    (0, node_test_1.default)('workbench action endpoints require tenant scope with runtime-governance permissions', () => {
        const writeHandlers = [
            workbench_controller_1.WorkbenchController.prototype.executeApproval,
            workbench_controller_1.WorkbenchController.prototype.rotateSecret,
            workbench_controller_1.WorkbenchController.prototype.submitRuntimeReplay,
            workbench_controller_1.WorkbenchController.prototype.syncHandlerReceipt,
            workbench_controller_1.WorkbenchController.prototype.recordHandlerCallback,
            workbench_controller_1.WorkbenchController.prototype.replayActionReceipt
        ];
        writeHandlers.forEach((handler) => {
            strict_1.default.deepEqual(Reflect.getMetadata(identity_access_decorator_1.TENANT_SCOPE_METADATA_KEY, handler), {});
            strict_1.default.deepEqual(Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, handler), ['foundation.runtime-governance.write']);
        });
        strict_1.default.deepEqual(Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, workbench_controller_1.WorkbenchController.prototype.rotateSecret), ['SUPER_ADMIN', 'SECURITY_ADMIN']);
        strict_1.default.deepEqual(Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, workbench_controller_1.WorkbenchController.prototype.getActionReceipt), ['foundation.runtime-governance.read']);
    });
});
(0, node_test_1.describe)('workbench action controller behavior', () => {
    (0, node_test_1.default)('executeApproval delegates to service with tenant and actor context', async () => {
        let capturedArgs = [];
        const controller = new workbench_controller_1.WorkbenchController({
            submitApprovalExecution: async (...args) => {
                capturedArgs = args;
                return { receiptCode: 'REC-APPROVAL-001', state: 'challenge-issued' };
            }
        });
        const result = await controller.executeApproval({ approvalCode: 'APP-001', idempotencyKey: 'approval:001', operatorNote: 'manual-review' }, { tenantId: 'tenant-001', marketCode: 'cn-mainland' }, { actorId: 'ops-001', actorType: 'store-user', roles: ['OPERATIONS'], permissions: [], authenticated: true, source: 'headers' });
        strict_1.default.equal(result.receiptCode, 'REC-APPROVAL-001');
        strict_1.default.equal(capturedArgs[0].approvalCode, 'APP-001');
        strict_1.default.equal(capturedArgs[1].tenantId, 'tenant-001');
        strict_1.default.equal(capturedArgs[2].actorId, 'ops-001');
    });
    (0, node_test_1.default)('sync/replay endpoints delegate to service using receipt and handler params', async () => {
        const calls = [];
        const controller = new workbench_controller_1.WorkbenchController({
            syncHandlerReceipt: async (...args) => {
                calls.push({ kind: 'sync', args });
                return { receiptCode: 'REC-001', state: 'submitted' };
            },
            replayActionReceipt: async (...args) => {
                calls.push({ kind: 'replay', args });
                return { receiptCode: 'REC-001', state: 'replay-scheduled' };
            }
        });
        await controller.syncHandlerReceipt('REC-001', 'admin-runtime-replay-handler', { ticketCode: 'TICKET-001', idempotencyKey: 'sync:001' }, { tenantId: 'tenant-001' }, { actorId: 'ops-001', actorType: 'store-user', roles: ['OPERATIONS'], permissions: [], authenticated: true, source: 'headers' });
        await controller.replayActionReceipt('REC-001', { ledgerKey: 'LEDGER-001', requestedFrom: 'ADMIN_WEB_RUNTIME', ticketCode: 'TICKET-001', idempotencyKey: 'replay:001' }, { tenantId: 'tenant-001' }, { actorId: 'ops-001', actorType: 'store-user', roles: ['OPERATIONS'], permissions: [], authenticated: true, source: 'headers' });
        strict_1.default.equal(calls[0]?.kind, 'sync');
        strict_1.default.equal(calls[0]?.args[0], 'REC-001');
        strict_1.default.equal(calls[0]?.args[1], 'admin-runtime-replay-handler');
        strict_1.default.equal(calls[1]?.kind, 'replay');
        strict_1.default.equal(calls[1]?.args[0], 'REC-001');
    });
});
(0, node_test_1.describe)('workbench action service', () => {
    function createService(runtimeOverrides = {}) {
        return new workbench_service_1.WorkbenchService(null, null, null, {
            submitAction: async (input) => ({ receiptCode: 'REC-SUBMIT-001', input }),
            getActionReceipt: async (receiptCode) => ({ receiptCode, state: 'submitted' }),
            syncAction: async (receiptCode, input) => ({ receiptCode, input, state: 'submitted' }),
            recordCallback: async (receiptCode, input) => ({ receiptCode, input, state: 'callback-recorded' }),
            replayAction: async (receiptCode, input) => ({ receiptCode, input, state: 'replay-scheduled' }),
            ...runtimeOverrides
        });
    }
    (0, node_test_1.default)('submitApprovalExecution builds admin-web challenge request', async () => {
        let captured;
        const service = createService({
            submitAction: async (input) => {
                captured = input;
                return { receiptCode: 'REC-APPROVAL-001', state: 'challenge-issued' };
            }
        });
        const result = await service.submitApprovalExecution({ approvalCode: 'APP-001', idempotencyKey: 'approval:001', challengeProfile: 'step-up' }, { tenantId: 'tenant-001', brandId: 'brand-001', storeId: 'store-001', marketCode: 'cn-mainland' }, { actorId: 'ops-001', actorType: 'store-user', roles: ['OPERATIONS'], permissions: [], authenticated: true, source: 'headers' });
        strict_1.default.equal(result.receiptCode, 'REC-APPROVAL-001');
        strict_1.default.equal(captured?.app, 'admin-web');
        strict_1.default.equal(captured?.action, 'approval-execution');
        strict_1.default.equal(captured?.nextStep, 'CHALLENGE');
        strict_1.default.equal(captured?.recommendedAction, 'COMPLETE_CHALLENGE');
        strict_1.default.equal(captured?.handlerName, 'admin-approval-execution-handler');
        strict_1.default.equal((captured?.payload).approvalCode, 'APP-001');
        strict_1.default.equal((captured?.payload).challengeProfile, 'step-up');
        strict_1.default.equal(captured?.tenantId, 'tenant-001');
        strict_1.default.equal(captured?.brandId, 'brand-001');
    });
    (0, node_test_1.default)('submitSecretRotation and runtime replay map to runtime governance defaults', async () => {
        const inputs = [];
        const service = createService({
            submitAction: async (input) => {
                inputs.push(input);
                return { receiptCode: `REC-${inputs.length}`, state: 'submitted' };
            }
        });
        await service.submitSecretRotation({ secretName: 'db-password', idempotencyKey: 'secret:001', targetScope: 'tenant' }, { tenantId: 'tenant-001' }, { actorId: 'security-001', actorType: 'tenant-user', roles: ['SECURITY_ADMIN'], permissions: [], authenticated: true, source: 'headers' });
        await service.submitRuntimeReplay({ sourceReceiptCode: 'REC-OLD-001', idempotencyKey: 'runtime:001' }, { tenantId: 'tenant-001' }, { actorId: 'ops-001', actorType: 'store-user', roles: ['OPERATIONS'], permissions: [], authenticated: true, source: 'headers' });
        strict_1.default.equal(inputs[0]?.action, 'secret-rotation');
        strict_1.default.equal(inputs[0]?.nextStep, 'REFRESH');
        strict_1.default.equal(inputs[0]?.recommendedAction, 'REFRESH_BOOTSTRAP');
        strict_1.default.equal((inputs[0]?.payload).secretName, 'db-password');
        strict_1.default.equal((inputs[0]?.payload).targetScope, 'tenant');
        strict_1.default.equal(inputs[1]?.action, 'runtime-replay');
        strict_1.default.equal(inputs[1]?.recommendedAction, 'FOLLOW_SUBMIT_CALLBACK');
        strict_1.default.equal((inputs[1]?.payload).sourceReceiptCode, 'REC-OLD-001');
    });
    (0, node_test_1.default)('sync/callback/replay delegate to runtime governance service with enriched context', async () => {
        const captured = [];
        const service = createService({
            syncAction: async (receiptCode, input) => {
                captured.push({ kind: 'sync', receiptCode, input });
                return { receiptCode, state: 'submitted' };
            },
            recordCallback: async (receiptCode, input) => {
                captured.push({ kind: 'callback', receiptCode, input });
                return { receiptCode, state: 'callback-recorded' };
            },
            replayAction: async (receiptCode, input) => {
                captured.push({ kind: 'replay', receiptCode, input });
                return { receiptCode, state: 'replay-scheduled' };
            }
        });
        await service.syncHandlerReceipt('REC-001', 'admin-runtime-replay-handler', { ticketCode: 'TICKET-001', idempotencyKey: 'sync:001' }, { tenantId: 'tenant-001' }, { actorId: 'ops-001', actorType: 'store-user', roles: ['OPERATIONS'], permissions: [], authenticated: true, source: 'headers' });
        await service.recordHandlerCallback('REC-001', 'admin-runtime-replay-handler', {
            callbackStatus: 'callback-recorded',
            ackToken: 'ACK-001',
            lastEvent: 'HANDLER_COMPLETED',
            summary: 'callback ok',
            idempotencyKey: 'callback:001'
        }, { tenantId: 'tenant-001' }, { actorId: 'ops-001', actorType: 'store-user', roles: ['OPERATIONS'], permissions: [], authenticated: true, source: 'headers' });
        await service.replayActionReceipt('REC-001', {
            ledgerKey: 'LEDGER-001',
            requestedFrom: 'ADMIN_WEB_RUNTIME',
            ticketCode: 'TICKET-001',
            idempotencyKey: 'replay:001'
        }, { tenantId: 'tenant-001' }, { actorId: 'ops-001', actorType: 'store-user', roles: ['OPERATIONS'], permissions: [], authenticated: true, source: 'headers' });
        strict_1.default.deepEqual(captured.map((item) => item.kind), ['sync', 'callback', 'replay']);
        strict_1.default.equal(captured[0]?.input.handlerName, 'admin-runtime-replay-handler');
        strict_1.default.equal(captured[0]?.input.actorId, 'ops-001');
        strict_1.default.equal(captured[1]?.input.callbackStatus, 'callback-recorded');
        strict_1.default.equal(captured[2]?.input.requestedFrom, 'ADMIN_WEB_RUNTIME');
    });
});
//# sourceMappingURL=workbench.action.test.js.map