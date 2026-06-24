"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const resilience_operations_service_1 = require("./resilience-operations.service");
(0, node_test_1.default)('contract: resilience operations exposes observability, retry, and recovery overview', () => {
    const service = new resilience_operations_service_1.ResilienceOperationsService();
    const overview = service.getOperationsOverview();
    strict_1.default.equal(overview.observability.totalSignals >= 3, true);
    strict_1.default.equal(overview.observability.degradedSignals >= 1, true);
    strict_1.default.equal(overview.observability.signals.some((signal) => signal.signal === 'traces'), true);
    strict_1.default.equal(overview.retries.totalPolicies >= 3, true);
    strict_1.default.equal(overview.retries.policies.some((policy) => policy.key === 'edge-sync-retry'), true);
    strict_1.default.equal(overview.recovery.totalPlans >= 3, true);
    strict_1.default.equal(overview.recovery.attentionRequired >= 1, true);
    strict_1.default.equal(overview.recovery.plans.some((plan) => plan.resource === 'edge-sync-pipeline'), true);
});
//# sourceMappingURL=resilience-operations.contract.test.js.map