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
const cross_module_dto_1 = require("./cross-module.dto");
// ── CrossModuleQueryDto ──
(0, node_test_1.describe)('CrossModuleQueryDto', () => {
    (0, node_test_1.default)('all fields are optional', () => {
        const dto = new cross_module_dto_1.CrossModuleQueryDto();
        strict_1.default.equal(dto.chainName, undefined);
        strict_1.default.equal(dto.verbose, undefined);
        strict_1.default.equal(dto.status, undefined);
    });
    (0, node_test_1.default)('can set chainName filter', () => {
        const dto = new cross_module_dto_1.CrossModuleQueryDto();
        dto.chainName = 'admin-to-consumer';
        strict_1.default.equal(dto.chainName, 'admin-to-consumer');
    });
    (0, node_test_1.default)('can set verbose flag', () => {
        const dto = new cross_module_dto_1.CrossModuleQueryDto();
        dto.verbose = true;
        strict_1.default.equal(dto.verbose, true);
    });
    (0, node_test_1.default)('can set status filter', () => {
        const dto = new cross_module_dto_1.CrossModuleQueryDto();
        dto.status = 'verified';
        strict_1.default.equal(dto.status, 'verified');
    });
});
// ── CrossModuleValidateDto ──
(0, node_test_1.describe)('CrossModuleValidateDto', () => {
    (0, node_test_1.default)('all fields are optional', () => {
        const dto = new cross_module_dto_1.CrossModuleValidateDto();
        strict_1.default.equal(dto.chainNames, undefined);
        strict_1.default.equal(dto.tenantId, undefined);
        strict_1.default.equal(dto.storeId, undefined);
        strict_1.default.equal(dto.marketCode, undefined);
    });
    (0, node_test_1.default)('can set chain names for validation', () => {
        const dto = new cross_module_dto_1.CrossModuleValidateDto();
        dto.chainNames = ['admin-to-consumer', 'sdk-to-api'];
        strict_1.default.deepEqual(dto.chainNames, ['admin-to-consumer', 'sdk-to-api']);
    });
    (0, node_test_1.default)('can set tenant context', () => {
        const dto = new cross_module_dto_1.CrossModuleValidateDto();
        dto.tenantId = 'tenant-001';
        dto.marketCode = 'default';
        strict_1.default.equal(dto.tenantId, 'tenant-001');
        strict_1.default.equal(dto.marketCode, 'default');
    });
});
// ── CrossModuleChainStatusDto ──
(0, node_test_1.describe)('CrossModuleChainStatusDto', () => {
    (0, node_test_1.default)('can create chain status DTO', () => {
        const dto = {
            chains: [
                { name: 'chain-1', modules: ['m1', 'm2'], status: 'defined' }
            ],
            total: 1,
            runtime: 'cross-module-e2e'
        };
        strict_1.default.equal(dto.total, 1);
        strict_1.default.equal(dto.runtime, 'cross-module-e2e');
    });
    (0, node_test_1.default)('chain status DTO with lastVerifiedAt', () => {
        const dto = {
            chains: [
                {
                    name: 'chain-1',
                    modules: ['m1', 'm2'],
                    status: 'verified',
                    lastVerifiedAt: '2025-01-01T00:00:00Z'
                }
            ],
            total: 1,
            runtime: 'cross-module-e2e'
        };
        strict_1.default.equal(dto.chains[0].lastVerifiedAt, '2025-01-01T00:00:00Z');
    });
    (0, node_test_1.default)('chain status DTO with brokenNodes', () => {
        const dto = {
            chains: [
                {
                    name: 'chain-1',
                    modules: ['m1', 'm2'],
                    status: 'broken',
                    brokenNodes: ['m1 → m2']
                }
            ],
            total: 1,
            runtime: 'cross-module-e2e'
        };
        strict_1.default.deepEqual(dto.chains[0].brokenNodes, ['m1 → m2']);
    });
});
// ── CrossModuleValidationResultDto ──
(0, node_test_1.describe)('CrossModuleValidationResultDto', () => {
    (0, node_test_1.default)('can create validation result DTO', () => {
        const dto = {
            chainName: 'admin-to-consumer',
            passed: true,
            stages: [
                { stage: 'stage-1', from: 'tenant', to: 'bootstrap', passed: true, durationMs: 10 }
            ],
            executedAt: '2025-01-01T00:00:00Z',
            durationMs: 100
        };
        strict_1.default.equal(dto.chainName, 'admin-to-consumer');
        strict_1.default.equal(dto.passed, true);
        strict_1.default.equal(dto.stages.length, 1);
    });
    (0, node_test_1.default)('failed validation result DTO', () => {
        const dto = {
            chainName: 'sdk-to-api',
            passed: false,
            stages: [
                { stage: 'stage-1', from: 'sdk', to: 'api', passed: true, durationMs: 5 },
                { stage: 'stage-2', from: 'api', to: 'lyt', passed: false, error: 'Connection refused', durationMs: 50 }
            ],
            executedAt: '2025-01-01T00:00:00Z',
            durationMs: 200
        };
        strict_1.default.equal(dto.passed, false);
        strict_1.default.equal(dto.stages[1].error, 'Connection refused');
    });
});
//# sourceMappingURL=cross-module.dto.test.js.map