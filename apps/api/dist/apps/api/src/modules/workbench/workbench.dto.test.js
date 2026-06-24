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
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
require("reflect-metadata");
const workbench_dto_1 = require("./workbench.dto");
(0, node_test_1.describe)('Workbench DTOs', () => {
    (0, node_test_1.describe)('NavItemQueryDto', () => {
        (0, node_test_1.default)('validates with optional fields', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.NavItemQueryDto, {});
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0, 'empty dto should be valid (all fields optional)');
        });
        (0, node_test_1.default)('accepts role and channel filter', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.NavItemQueryDto, {
                role: 'GUIDE',
                channel: 'PAD'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
        (0, node_test_1.default)('accepts marketCode and capability', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.NavItemQueryDto, {
                marketCode: 'cn-mainland',
                capability: 'member-crm'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
    });
    (0, node_test_1.describe)('WorkbenchQueryDto', () => {
        (0, node_test_1.default)('validates with optional fields', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.WorkbenchQueryDto, {});
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
        (0, node_test_1.default)('accepts boolean initialized', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.WorkbenchQueryDto, {
                role: 'SUPER_ADMIN',
                initialized: true
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
    });
    (0, node_test_1.describe)('TenantContextDto', () => {
        (0, node_test_1.default)('requires tenantId', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.TenantContextDto, {});
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.ok(errors.length > 0);
            strict_1.default.ok(errors.some(e => e.property === 'tenantId'));
        });
        (0, node_test_1.default)('accepts full tenant context', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.TenantContextDto, {
                tenantId: 't-1',
                brandId: 'b-1',
                storeId: 's-1',
                marketCode: 'zh-cn'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
        (0, node_test_1.default)('accepts minimal tenant context (only tenantId)', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.TenantContextDto, {
                tenantId: 't-minimal'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
    });
    (0, node_test_1.describe)('WorkbenchBootstrapRequestDto', () => {
        (0, node_test_1.default)('requires nested tenantContext', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.WorkbenchBootstrapRequestDto, {});
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.ok(errors.length > 0);
        });
        (0, node_test_1.default)('validates nested tenantContext', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.WorkbenchBootstrapRequestDto, {
                tenantContext: { tenantId: 't-99' }
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
    });
    (0, node_test_1.describe)('CapabilityCheckDto', () => {
        (0, node_test_1.default)('requires role and capability', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.CapabilityCheckDto, {});
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 2);
            strict_1.default.ok(errors.some(e => e.property === 'role'));
            strict_1.default.ok(errors.some(e => e.property === 'capability'));
        });
        (0, node_test_1.default)('validates with both fields', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.CapabilityCheckDto, {
                role: 'GUIDE',
                capability: 'member-crm'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
    });
    (0, node_test_1.describe)('CapabilityBatchCheckDto', () => {
        (0, node_test_1.default)('requires role and capabilities array', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.CapabilityBatchCheckDto, {});
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 2);
            strict_1.default.ok(errors.some(e => e.property === 'role'));
            strict_1.default.ok(errors.some(e => e.property === 'capabilities'));
        });
        (0, node_test_1.default)('validates batch check payload', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.CapabilityBatchCheckDto, {
                role: 'STORE_MANAGER',
                capabilities: ['daily-report', 'field-scheduling']
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
        (0, node_test_1.default)('accepts capabilities array with valid strings', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.CapabilityBatchCheckDto, {
                role: 'GUIDE',
                capabilities: ['member-crm', 'promo-conversion']
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
        (0, node_test_1.default)('accepts empty capabilities array', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.CapabilityBatchCheckDto, {
                role: 'GUIDE',
                capabilities: []
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
    });
    (0, node_test_1.describe)('Workbench action DTOs', () => {
        (0, node_test_1.default)('approval execute dto requires approvalCode and idempotencyKey', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.WorkbenchApprovalExecuteDto, {
                approvalCode: 'APP-001',
                idempotencyKey: 'approval:001'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
        (0, node_test_1.default)('secret rotation dto validates secret name and idempotency key', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.WorkbenchSecretRotationDto, {
                secretName: 'db-password',
                idempotencyKey: 'secret:001',
                targetScope: 'tenant'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
        (0, node_test_1.default)('runtime replay submit dto requires source receipt code', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.WorkbenchRuntimeReplaySubmitDto, {
                sourceReceiptCode: 'REC-001',
                idempotencyKey: 'runtime:001'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
        (0, node_test_1.default)('handler sync dto requires ticket and idempotency key', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.WorkbenchHandlerSyncDto, {
                ticketCode: 'TICKET-001',
                idempotencyKey: 'sync:001'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
        (0, node_test_1.default)('handler callback dto validates runtime callback enums', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.WorkbenchHandlerCallbackDto, {
                callbackStatus: 'callback-recorded',
                ackToken: 'ACK-001',
                lastEvent: 'HANDLER_COMPLETED',
                summary: 'callback ok',
                idempotencyKey: 'callback:001'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
        (0, node_test_1.default)('action replay dto validates replay source enum', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(workbench_dto_1.WorkbenchActionReplayDto, {
                ledgerKey: 'LEDGER-001',
                requestedFrom: 'ADMIN_WEB_RUNTIME',
                ticketCode: 'TICKET-001',
                idempotencyKey: 'replay:001'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
    });
});
//# sourceMappingURL=workbench.dto.test.js.map