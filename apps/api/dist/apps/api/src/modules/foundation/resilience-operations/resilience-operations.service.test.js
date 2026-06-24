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
const resilience_operations_service_1 = require("./resilience-operations.service");
(0, node_test_1.describe)('ResilienceOperationsService', () => {
    const service = new resilience_operations_service_1.ResilienceOperationsService();
    (0, node_test_1.describe)('getObservabilitySignals', () => {
        (0, node_test_1.default)('returns all three signals when no filter is provided', () => {
            const signals = service.getObservabilitySignals();
            strict_1.default.equal(signals.length, 3);
            const signalNames = signals.map((s) => s.signal).sort();
            strict_1.default.deepEqual(signalNames, ['logs', 'metrics', 'traces']);
        });
        (0, node_test_1.default)('filters by status when provided', () => {
            const healthy = service.getObservabilitySignals({ status: 'healthy' });
            strict_1.default.equal(healthy.length, 1);
            strict_1.default.equal(healthy[0].signal, 'metrics');
            const warnings = service.getObservabilitySignals({ status: 'warning' });
            strict_1.default.equal(warnings.length, 2);
            warnings.forEach((s) => strict_1.default.equal(s.status, 'warning'));
        });
        (0, node_test_1.default)('returns empty array for unknown status', () => {
            const result = service.getObservabilitySignals({ status: 'critical' });
            strict_1.default.equal(result.length, 0);
        });
        (0, node_test_1.default)('each signal has required fields', () => {
            const signals = service.getObservabilitySignals();
            for (const s of signals) {
                strict_1.default.ok(s.signal);
                strict_1.default.ok(s.status);
                strict_1.default.ok(typeof s.coverage === 'number');
                strict_1.default.ok(typeof s.collectionLagSeconds === 'number');
                strict_1.default.ok(s.lastCollectedAt);
                strict_1.default.ok(s.owner);
                strict_1.default.ok(Array.isArray(s.alertRoutes));
                strict_1.default.ok(Array.isArray(s.evidence));
            }
        });
    });
    (0, node_test_1.describe)('listRetryPolicies', () => {
        (0, node_test_1.default)('returns all three policies when no filter is provided', () => {
            const policies = service.listRetryPolicies();
            strict_1.default.equal(policies.length, 3);
        });
        (0, node_test_1.default)('filters by capability', () => {
            const edgePolicies = service.listRetryPolicies({ capability: 'edge-sync' });
            strict_1.default.equal(edgePolicies.length, 1);
            strict_1.default.equal(edgePolicies[0].key, 'edge-sync-retry');
        });
        (0, node_test_1.default)('returns empty when capability does not match', () => {
            const result = service.listRetryPolicies({ capability: 'nonexistent' });
            strict_1.default.equal(result.length, 0);
        });
        (0, node_test_1.default)('each policy has required fields', () => {
            const policies = service.listRetryPolicies();
            for (const p of policies) {
                strict_1.default.ok(p.key);
                strict_1.default.ok(p.capability);
                strict_1.default.ok(p.trigger);
                strict_1.default.ok(typeof p.maxAttempts === 'number');
                strict_1.default.ok(p.backoff);
                strict_1.default.ok(p.recoveryAction);
                strict_1.default.ok(p.escalationTarget);
            }
        });
    });
    (0, node_test_1.describe)('listRecoveryPlans', () => {
        (0, node_test_1.default)('returns all three plans when no filter is provided', () => {
            const plans = service.listRecoveryPlans();
            strict_1.default.equal(plans.length, 3);
        });
        (0, node_test_1.default)('filters by status', () => {
            const ready = service.listRecoveryPlans({ status: 'ready' });
            strict_1.default.equal(ready.length, 2);
            ready.forEach((p) => strict_1.default.equal(p.status, 'ready'));
            const attention = service.listRecoveryPlans({ status: 'attention' });
            strict_1.default.equal(attention.length, 1);
            strict_1.default.equal(attention[0].resource, 'edge-sync-pipeline');
        });
        (0, node_test_1.default)('each plan has required fields', () => {
            const plans = service.listRecoveryPlans();
            for (const p of plans) {
                strict_1.default.ok(p.resource);
                strict_1.default.ok(p.status);
                strict_1.default.ok(typeof p.rtoMinutes === 'number');
                strict_1.default.ok(typeof p.rpoMinutes === 'number');
                strict_1.default.ok(p.lastDrillAt);
                strict_1.default.ok(typeof p.staleAfterDays === 'number');
                strict_1.default.ok(Array.isArray(p.dependencies));
                strict_1.default.ok(p.runbook);
            }
        });
    });
    (0, node_test_1.describe)('describeRecoveryPlan', () => {
        (0, node_test_1.default)('returns plan details for known resource', () => {
            const result = service.describeRecoveryPlan('postgres-primary');
            strict_1.default.equal(result.status, 'ready');
            strict_1.default.equal(result.resource, 'postgres-primary');
            strict_1.default.ok(result.plan);
            strict_1.default.ok(result.plan?.rtoMinutes);
        });
        (0, node_test_1.default)('returns attention status for unknown resource', () => {
            const result = service.describeRecoveryPlan('unknown-resource');
            strict_1.default.equal(result.status, 'attention');
            strict_1.default.equal(result.resource, 'unknown-resource');
            strict_1.default.equal(result.plan, null);
        });
        (0, node_test_1.default)('baseline includes expected recovery steps', () => {
            const result = service.describeRecoveryPlan('observability-stack');
            strict_1.default.ok(result.baseline.includes('backup'));
            strict_1.default.ok(result.baseline.includes('restore-drill'));
        });
    });
    (0, node_test_1.describe)('stageEdgeReplay', () => {
        (0, node_test_1.default)('returns staged replay with storeId and operationCount', () => {
            const result = service.stageEdgeReplay('store-42', 128);
            strict_1.default.equal(result.status, 'staged');
            strict_1.default.equal(result.storeId, 'store-42');
            strict_1.default.equal(result.operationCount, 128);
        });
        (0, node_test_1.default)('includes replay pipeline steps in order', () => {
            const result = service.stageEdgeReplay('store-1', 1);
            strict_1.default.deepEqual(result.replayPipeline, [
                'local-queue',
                'network-recovery',
                'reconciliation',
                'conflict-review'
            ]);
        });
        (0, node_test_1.default)('attaches edge-sync retry policy', () => {
            const result = service.stageEdgeReplay('store-1', 5);
            strict_1.default.ok(result.retryPolicy);
            strict_1.default.equal(result.retryPolicy?.key, 'edge-sync-retry');
        });
        (0, node_test_1.default)('attaches edge-sync-pipeline recovery plan', () => {
            const result = service.stageEdgeReplay('store-1', 10);
            strict_1.default.ok(result.recoveryPlan);
            strict_1.default.equal(result.recoveryPlan?.resource, 'edge-sync-pipeline');
        });
        (0, node_test_1.default)('includes observability hooks', () => {
            const result = service.stageEdgeReplay('store-1', 3);
            strict_1.default.ok(Array.isArray(result.observabilityHooks));
            strict_1.default.ok(result.observabilityHooks.some((h) => h.includes('metrics')));
            strict_1.default.ok(result.observabilityHooks.some((h) => h.includes('logs')));
            strict_1.default.ok(result.observabilityHooks.some((h) => h.includes('traces')));
        });
    });
    (0, node_test_1.describe)('getManagementMetadata', () => {
        (0, node_test_1.default)('returns four governance metadata entries', () => {
            const metadata = service.getManagementMetadata();
            strict_1.default.equal(metadata.length, 4);
        });
        (0, node_test_1.default)('each entry has operation and rbac fields', () => {
            const metadata = service.getManagementMetadata();
            for (const entry of metadata) {
                strict_1.default.ok(entry.operation);
                strict_1.default.ok(entry.rbac);
                strict_1.default.ok(entry.rbac.resource);
                strict_1.default.ok(entry.rbac.action);
                strict_1.default.ok(Array.isArray(entry.rbac.requiredRoles));
                strict_1.default.ok(Array.isArray(entry.rbac.requiredPermissions));
            }
        });
        (0, node_test_1.default)('includes read operations for observability, retry-policy, and recovery-plan', () => {
            const metadata = service.getManagementMetadata();
            const readOps = metadata.filter((m) => m.rbac.action === 'read');
            strict_1.default.equal(readOps.length, 3);
        });
        (0, node_test_1.default)('includes write operation for edge-replay', () => {
            const metadata = service.getManagementMetadata();
            const writeOps = metadata.filter((m) => m.rbac.action === 'write');
            strict_1.default.equal(writeOps.length, 1);
            strict_1.default.equal(writeOps[0].rbac.resource, 'edge-replay');
        });
    });
    (0, node_test_1.describe)('getOperationsOverview', () => {
        (0, node_test_1.default)('returns overview with generatedAt timestamp', () => {
            const overview = service.getOperationsOverview();
            strict_1.default.ok(overview.generatedAt);
            strict_1.default.ok(Date.parse(overview.generatedAt) > 0);
        });
        (0, node_test_1.default)('observability section has required aggregates', () => {
            const overview = service.getOperationsOverview();
            strict_1.default.equal(overview.observability.totalSignals, 3);
            strict_1.default.equal(overview.observability.degradedSignals, 2);
            strict_1.default.ok(typeof overview.observability.averageCoverage === 'number');
            strict_1.default.ok(typeof overview.observability.maxCollectionLagSeconds === 'number');
            strict_1.default.ok(Array.isArray(overview.observability.signals));
        });
        (0, node_test_1.default)('retries section has required aggregates', () => {
            const overview = service.getOperationsOverview();
            strict_1.default.equal(overview.retries.totalPolicies, 3);
            strict_1.default.ok(typeof overview.retries.maxAttempts === 'number');
            strict_1.default.ok(Array.isArray(overview.retries.policies));
        });
        (0, node_test_1.default)('recovery section identifies stale drills', () => {
            const overview = service.getOperationsOverview();
            strict_1.default.equal(overview.recovery.totalPlans, 3);
            strict_1.default.equal(overview.recovery.attentionRequired, 1);
            // edge-sync-pipeline last drill 2026-04-01, stale after 30 days -> stale
            strict_1.default.equal(overview.recovery.staleDrills, 1);
        });
        (0, node_test_1.default)('byStatus maps are populated', () => {
            const overview = service.getOperationsOverview();
            strict_1.default.ok(overview.observability.byStatus);
            strict_1.default.ok(overview.retries.byCapability);
        });
    });
    (0, node_test_1.describe)('getGovernanceBaselines', () => {
        (0, node_test_1.default)('returns three governance baselines', () => {
            const baselines = service.getGovernanceBaselines();
            strict_1.default.equal(baselines.length, 3);
        });
        (0, node_test_1.default)('each baseline has required fields', () => {
            const baselines = service.getGovernanceBaselines();
            for (const b of baselines) {
                strict_1.default.ok(b.key);
                strict_1.default.ok(b.name);
                strict_1.default.ok(b.ownerModule);
                strict_1.default.ok(b.summary);
                strict_1.default.ok(Array.isArray(b.controls));
                strict_1.default.ok(Array.isArray(b.evidence));
                strict_1.default.ok(b.controls.length > 0);
            }
        });
        (0, node_test_1.default)('all baselines belong to resilience-operations module', () => {
            const baselines = service.getGovernanceBaselines();
            baselines.forEach((b) => strict_1.default.equal(b.ownerModule, 'resilience-operations'));
        });
    });
    (0, node_test_1.describe)('getDescriptor', () => {
        (0, node_test_1.default)('returns descriptor with correct module key', () => {
            const descriptor = service.getDescriptor();
            strict_1.default.equal(descriptor.key, 'resilience-operations');
            strict_1.default.equal(descriptor.name, 'Resilience Operations Module');
        });
        (0, node_test_1.default)('has three capabilities', () => {
            const descriptor = service.getDescriptor();
            strict_1.default.equal(descriptor.capabilities.length, 3);
        });
        (0, node_test_1.default)('each capability has required fields', () => {
            const descriptor = service.getDescriptor();
            for (const cap of descriptor.capabilities) {
                strict_1.default.ok(cap.key);
                strict_1.default.ok(cap.name);
                strict_1.default.ok(Array.isArray(cap.responsibilities));
                strict_1.default.ok(Array.isArray(cap.entrypoints));
                strict_1.default.ok(Array.isArray(cap.consumers));
                strict_1.default.ok(cap.status);
            }
        });
        (0, node_test_1.default)('edge-sync capability is active', () => {
            const descriptor = service.getDescriptor();
            const edgeSync = descriptor.capabilities.find((c) => c.key === 'edge-sync');
            strict_1.default.ok(edgeSync);
            strict_1.default.equal(edgeSync?.status, 'active');
        });
    });
});
//# sourceMappingURL=resilience-operations.service.test.js.map