"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const class_validator_1 = require("class-validator");
const resilience_operations_dto_1 = require("./resilience-operations.dto");
(0, node_test_1.default)('ObservabilityQueryDto accepts optional status filter', () => {
    // empty query should be valid (no required fields)
    const empty = new resilience_operations_dto_1.ObservabilityQueryDto();
    strict_1.default.equal((0, class_validator_1.validateSync)(empty).length, 0);
    // with valid status string
    const withStatus = Object.assign(new resilience_operations_dto_1.ObservabilityQueryDto(), { status: 'warning' });
    strict_1.default.equal((0, class_validator_1.validateSync)(withStatus).length, 0);
    // non-string status should fail
    const invalidStatus = Object.assign(new resilience_operations_dto_1.ObservabilityQueryDto(), { status: 123 });
    strict_1.default.equal((0, class_validator_1.validateSync)(invalidStatus).length > 0, true);
});
(0, node_test_1.default)('RetryPolicyQueryDto accepts optional capability filter', () => {
    const empty = new resilience_operations_dto_1.RetryPolicyQueryDto();
    strict_1.default.equal((0, class_validator_1.validateSync)(empty).length, 0);
    const withCapability = Object.assign(new resilience_operations_dto_1.RetryPolicyQueryDto(), { capability: 'edge-sync' });
    strict_1.default.equal((0, class_validator_1.validateSync)(withCapability).length, 0);
    // non-string capability should fail
    const invalidCapability = Object.assign(new resilience_operations_dto_1.RetryPolicyQueryDto(), { capability: 456 });
    strict_1.default.equal((0, class_validator_1.validateSync)(invalidCapability).length > 0, true);
});
(0, node_test_1.default)('RecoveryPlanQueryDto accepts optional status filter', () => {
    const empty = new resilience_operations_dto_1.RecoveryPlanQueryDto();
    strict_1.default.equal((0, class_validator_1.validateSync)(empty).length, 0);
    const withStatus = Object.assign(new resilience_operations_dto_1.RecoveryPlanQueryDto(), { status: 'ready' });
    strict_1.default.equal((0, class_validator_1.validateSync)(withStatus).length, 0);
});
(0, node_test_1.default)('StageEdgeReplayDto validates required fields and bounds', () => {
    // valid payload
    const valid = Object.assign(new resilience_operations_dto_1.StageEdgeReplayDto(), {
        storeId: 'store-001',
        operationCount: 100
    });
    strict_1.default.equal((0, class_validator_1.validateSync)(valid).length, 0);
    // missing required storeId
    const missingStoreId = Object.assign(new resilience_operations_dto_1.StageEdgeReplayDto(), {
        operationCount: 100
    });
    const storeIdErrors = (0, class_validator_1.validateSync)(missingStoreId);
    strict_1.default.equal(storeIdErrors.length > 0, true);
    strict_1.default.equal(storeIdErrors.some((e) => e.property === 'storeId'), true);
    // missing required operationCount
    const missingCount = Object.assign(new resilience_operations_dto_1.StageEdgeReplayDto(), {
        storeId: 'store-001'
    });
    const countErrors = (0, class_validator_1.validateSync)(missingCount);
    strict_1.default.equal(countErrors.length > 0, true);
    strict_1.default.equal(countErrors.some((e) => e.property === 'operationCount'), true);
    // operationCount below min (1)
    const belowMin = Object.assign(new resilience_operations_dto_1.StageEdgeReplayDto(), {
        storeId: 'store-001',
        operationCount: 0
    });
    const belowMinErrors = (0, class_validator_1.validateSync)(belowMin);
    strict_1.default.equal(belowMinErrors.length > 0, true);
    strict_1.default.equal(belowMinErrors.some((e) => e.property === 'operationCount'), true);
    // operationCount above max (5000)
    const aboveMax = Object.assign(new resilience_operations_dto_1.StageEdgeReplayDto(), {
        storeId: 'store-001',
        operationCount: 5001
    });
    const aboveMaxErrors = (0, class_validator_1.validateSync)(aboveMax);
    strict_1.default.equal(aboveMaxErrors.length > 0, true);
    strict_1.default.equal(aboveMaxErrors.some((e) => e.property === 'operationCount'), true);
    // operationCount at boundary min=1
    const atMin = Object.assign(new resilience_operations_dto_1.StageEdgeReplayDto(), {
        storeId: 'store-001',
        operationCount: 1
    });
    strict_1.default.equal((0, class_validator_1.validateSync)(atMin).length, 0);
    // operationCount at boundary max=5000
    const atMax = Object.assign(new resilience_operations_dto_1.StageEdgeReplayDto(), {
        storeId: 'store-001',
        operationCount: 5000
    });
    strict_1.default.equal((0, class_validator_1.validateSync)(atMax).length, 0);
});
//# sourceMappingURL=resilience-operations.dto.test.js.map