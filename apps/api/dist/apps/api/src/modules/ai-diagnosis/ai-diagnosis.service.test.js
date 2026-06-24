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
const ai_diagnosis_service_1 = require("./ai-diagnosis.service");
(0, node_test_1.describe)('AiDiagnosisService', () => {
    let service;
    (0, node_test_1.beforeEach)(() => {
        ai_diagnosis_service_1.AiDiagnosisService.resetStores();
        service = new ai_diagnosis_service_1.AiDiagnosisService();
    });
    // ── createDiagnosis ──
    (0, node_test_1.describe)('createDiagnosis', () => {
        (0, node_test_1.default)('should create a diagnosis with PENDING status', () => {
            const result = service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 'scenario-001',
                tenantId: 'T001',
                requestedBy: 'user-001'
            });
            strict_1.default.ok(result.diagnosisId.startsWith('diag-'));
            strict_1.default.equal(result.engineId, 'engine-001');
            strict_1.default.equal(result.scenarioId, 'scenario-001');
            strict_1.default.equal(result.status, 'PENDING');
            strict_1.default.equal(result.riskLevel, 'low');
            strict_1.default.equal(result.tenantId, 'T001');
            strict_1.default.equal(result.requestedBy, 'user-001');
            strict_1.default.ok(result.createdAt);
            strict_1.default.ok(result.diagnosisId);
        });
        (0, node_test_1.default)('should create a diagnosis with optional fields', () => {
            const result = service.createDiagnosis({
                engineId: 'engine-002',
                scenarioId: 'scenario-002',
                tenantId: 'T002',
                requestedBy: 'user-002',
                promptSummary: 'Custom prompt',
                inputSnapshot: { key: 'value' }
            });
            strict_1.default.equal(result.promptSummary, 'Custom prompt');
            strict_1.default.deepEqual(result.inputSnapshot, { key: 'value' });
        });
        (0, node_test_1.default)('should create unique diagnosisIds per call', () => {
            const r1 = service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            const r2 = service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's2',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            strict_1.default.notEqual(r1.diagnosisId, r2.diagnosisId);
        });
    });
    // ── getDiagnosis ──
    (0, node_test_1.describe)('getDiagnosis', () => {
        (0, node_test_1.default)('should return created diagnosis', () => {
            const created = service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 'scenario-001',
                tenantId: 'T001',
                requestedBy: 'user-001'
            });
            const found = service.getDiagnosis(created.diagnosisId);
            strict_1.default.ok(found);
            strict_1.default.deepEqual(found, created);
        });
        (0, node_test_1.default)('should return undefined for non-existent diagnosis', () => {
            const found = service.getDiagnosis('non-existent');
            strict_1.default.equal(found, undefined);
        });
    });
    // ── listDiagnoses ──
    (0, node_test_1.describe)('listDiagnoses', () => {
        (0, node_test_1.default)('should return empty list when no diagnoses exist', () => {
            const result = service.listDiagnoses();
            strict_1.default.equal(result.total, 0);
            strict_1.default.deepEqual(result.diagnoses, []);
        });
        (0, node_test_1.default)('should list all created diagnoses', () => {
            service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's2',
                tenantId: 'T001',
                requestedBy: 'u2'
            });
            const result = service.listDiagnoses();
            strict_1.default.equal(result.total, 2);
            strict_1.default.equal(result.diagnoses.length, 2);
        });
        (0, node_test_1.default)('should filter by engineId', () => {
            service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            service.createDiagnosis({
                engineId: 'engine-002',
                scenarioId: 's2',
                tenantId: 'T001',
                requestedBy: 'u2'
            });
            const result = service.listDiagnoses({ engineId: 'engine-001' });
            strict_1.default.equal(result.total, 1);
            strict_1.default.equal(result.diagnoses[0].engineId, 'engine-001');
        });
        (0, node_test_1.default)('should filter by status', () => {
            const d1 = service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            service.updateDiagnosis(d1.diagnosisId, {
                status: 'COMPLETED',
                riskLevel: 'low',
                recommendation: 'ok'
            });
            service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's2',
                tenantId: 'T001',
                requestedBy: 'u2'
            });
            const pending = service.listDiagnoses({ status: 'PENDING' });
            const completed = service.listDiagnoses({ status: 'COMPLETED' });
            strict_1.default.equal(pending.total, 1);
            strict_1.default.equal(completed.total, 1);
        });
        (0, node_test_1.default)('should filter by riskLevel', () => {
            const d1 = service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            service.updateDiagnosis(d1.diagnosisId, { riskLevel: 'high' });
            const highRisk = service.listDiagnoses({ riskLevel: 'high' });
            strict_1.default.equal(highRisk.total, 1);
        });
        (0, node_test_1.default)('should filter by tenantId', () => {
            service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's2',
                tenantId: 'T002',
                requestedBy: 'u2'
            });
            const t1results = service.listDiagnoses({ tenantId: 'T001' });
            strict_1.default.equal(t1results.total, 1);
        });
        (0, node_test_1.default)('should return results sorted by createdAt desc', async () => {
            const d1 = service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 'first',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            // Wait to ensure timestamp difference
            await new Promise((resolve) => setTimeout(resolve, 10));
            const d2 = service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 'second',
                tenantId: 'T001',
                requestedBy: 'u2'
            });
            const result = service.listDiagnoses();
            strict_1.default.equal(result.diagnoses[0].diagnosisId, d2.diagnosisId);
            strict_1.default.equal(result.diagnoses[1].diagnosisId, d1.diagnosisId);
        });
    });
    // ── updateDiagnosis ──
    (0, node_test_1.describe)('updateDiagnosis', () => {
        (0, node_test_1.default)('should update diagnosis status', () => {
            const d = service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            const updated = service.updateDiagnosis(d.diagnosisId, {
                status: 'COMPLETED',
                riskLevel: 'medium',
                recommendation: 'All good'
            });
            strict_1.default.ok(updated);
            strict_1.default.equal(updated.status, 'COMPLETED');
            strict_1.default.equal(updated.riskLevel, 'medium');
            strict_1.default.equal(updated.recommendation, 'All good');
            strict_1.default.ok(updated.completedAt);
        });
        (0, node_test_1.default)('should set completedAt when status transitions to COMPLETED', () => {
            const d = service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            strict_1.default.equal(d.completedAt, undefined);
            const updated = service.updateDiagnosis(d.diagnosisId, { status: 'COMPLETED' });
            strict_1.default.ok(updated?.completedAt);
        });
        (0, node_test_1.default)('should set completedAt when status transitions to FAILED', () => {
            const d = service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            const updated = service.updateDiagnosis(d.diagnosisId, { status: 'FAILED' });
            strict_1.default.ok(updated?.completedAt);
        });
        (0, node_test_1.default)('should preserve completedAt when transitioning from COMPLETED to IN_PROGRESS', () => {
            const d = service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            service.updateDiagnosis(d.diagnosisId, { status: 'COMPLETED' });
            const completedAt = service.getDiagnosis(d.diagnosisId).completedAt;
            const updated = service.updateDiagnosis(d.diagnosisId, { status: 'IN_PROGRESS' });
            strict_1.default.equal(updated?.completedAt, completedAt);
        });
        (0, node_test_1.default)('should return undefined for non-existent diagnosis', () => {
            const result = service.updateDiagnosis('non-existent', { status: 'COMPLETED' });
            strict_1.default.equal(result, undefined);
        });
        (0, node_test_1.default)('should update matchedRuleIds and triggeredActionIds', () => {
            const d = service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            const updated = service.updateDiagnosis(d.diagnosisId, {
                matchedRuleIds: ['rule-001', 'rule-002'],
                matchedConditionIds: ['cond-001'],
                triggeredActionIds: ['act-001'],
                evaluationDurationMs: 42
            });
            strict_1.default.deepEqual(updated?.matchedRuleIds, ['rule-001', 'rule-002']);
            strict_1.default.deepEqual(updated?.matchedConditionIds, ['cond-001']);
            strict_1.default.deepEqual(updated?.triggeredActionIds, ['act-001']);
            strict_1.default.equal(updated?.evaluationDurationMs, 42);
        });
    });
    // ── deleteDiagnosis ──
    (0, node_test_1.describe)('deleteDiagnosis', () => {
        (0, node_test_1.default)('should delete existing diagnosis', () => {
            const d = service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            const deleted = service.deleteDiagnosis(d.diagnosisId);
            strict_1.default.equal(deleted, true);
            strict_1.default.equal(service.getDiagnosis(d.diagnosisId), undefined);
        });
        (0, node_test_1.default)('should return false for non-existent diagnosis', () => {
            const deleted = service.deleteDiagnosis('non-existent');
            strict_1.default.equal(deleted, false);
        });
    });
    // ── createDiagnosisBatch ──
    (0, node_test_1.describe)('createDiagnosisBatch', () => {
        (0, node_test_1.default)('should create a batch with multiple diagnoses', () => {
            const batch = service.createDiagnosisBatch({
                engineId: 'engine-001',
                scenarioIds: ['s1', 's2', 's3'],
                tenantId: 'T001',
                triggeredBy: 'user-001'
            });
            strict_1.default.ok(batch.batchId.startsWith('batch-'));
            strict_1.default.equal(batch.engineId, 'engine-001');
            strict_1.default.equal(batch.totalDiagnoses, 3);
            strict_1.default.equal(batch.diagnoses.length, 3);
            strict_1.default.equal(batch.triggeredBy, 'user-001');
            strict_1.default.equal(batch.tenantId, 'T001');
        });
        (0, node_test_1.default)('should auto-complete all diagnoses in batch', () => {
            const batch = service.createDiagnosisBatch({
                engineId: 'engine-001',
                scenarioIds: ['s1', 's2'],
                tenantId: 'T001',
                triggeredBy: 'user-001'
            });
            for (const d of batch.diagnoses) {
                strict_1.default.equal(d.status, 'COMPLETED');
                strict_1.default.ok(d.recommendation);
            }
        });
        (0, node_test_1.default)('should mark critical scenario as high risk', () => {
            const batch = service.createDiagnosisBatch({
                engineId: 'engine-001',
                scenarioIds: ['critical-scenario-1', 'normal-scenario'],
                tenantId: 'T001',
                triggeredBy: 'user-001'
            });
            const criticalDiag = batch.diagnoses.find((d) => d.scenarioId === 'critical-scenario-1');
            const normalDiag = batch.diagnoses.find((d) => d.scenarioId === 'normal-scenario');
            strict_1.default.equal(criticalDiag?.riskLevel, 'high');
            strict_1.default.equal(normalDiag?.riskLevel, 'low');
        });
        (0, node_test_1.default)('should calculate match rate correctly', () => {
            const batch = service.createDiagnosisBatch({
                engineId: 'engine-001',
                scenarioIds: ['critical-1', 'high-1', 'normal-1'],
                tenantId: 'T001',
                triggeredBy: 'user-001'
            });
            strict_1.default.equal(batch.totalDiagnoses, 3);
            strict_1.default.equal(batch.matchedDiagnoses, 2); // critical-1 and high-1 match
            strict_1.default.equal(batch.matchRate, 2 / 3);
        });
        (0, node_test_1.default)('should compute risk distribution', () => {
            const batch = service.createDiagnosisBatch({
                engineId: 'engine-001',
                scenarioIds: ['critical-1', 'high-2', 'normal-1', 'normal-2'],
                tenantId: 'T001',
                triggeredBy: 'user-001'
            });
            strict_1.default.equal(batch.riskDistribution.high, 2);
            strict_1.default.equal(batch.riskDistribution.low, 2);
            strict_1.default.equal(batch.riskDistribution.medium, 0);
            strict_1.default.equal(batch.riskDistribution.critical, 0);
        });
        (0, node_test_1.default)('should handle empty scenarioIds gracefully', () => {
            const batch = service.createDiagnosisBatch({
                engineId: 'engine-001',
                scenarioIds: [],
                tenantId: 'T001',
                triggeredBy: 'user-001'
            });
            strict_1.default.equal(batch.totalDiagnoses, 0);
            strict_1.default.equal(batch.matchRate, 0);
            strict_1.default.equal(batch.diagnoses.length, 0);
        });
    });
    // ── getDiagnosisBatch ──
    (0, node_test_1.describe)('getDiagnosisBatch', () => {
        (0, node_test_1.default)('should return created batch', () => {
            const created = service.createDiagnosisBatch({
                engineId: 'engine-001',
                scenarioIds: ['s1'],
                tenantId: 'T001',
                triggeredBy: 'user-001'
            });
            const found = service.getDiagnosisBatch(created.batchId);
            strict_1.default.ok(found);
            strict_1.default.deepEqual(found, created);
        });
        (0, node_test_1.default)('should return undefined for non-existent batch', () => {
            const found = service.getDiagnosisBatch('non-existent');
            strict_1.default.equal(found, undefined);
        });
    });
    // ── listDiagnosisBatches ──
    (0, node_test_1.describe)('listDiagnosisBatches', () => {
        (0, node_test_1.default)('should list all created batches', () => {
            service.createDiagnosisBatch({
                engineId: 'engine-001',
                scenarioIds: ['s1'],
                tenantId: 'T001',
                triggeredBy: 'user-001'
            });
            service.createDiagnosisBatch({
                engineId: 'engine-002',
                scenarioIds: ['s2'],
                tenantId: 'T001',
                triggeredBy: 'user-002'
            });
            const batches = service.listDiagnosisBatches();
            strict_1.default.equal(batches.length, 2);
        });
        (0, node_test_1.default)('should filter by engineId', () => {
            service.createDiagnosisBatch({
                engineId: 'engine-001',
                scenarioIds: ['s1'],
                tenantId: 'T001',
                triggeredBy: 'user-001'
            });
            service.createDiagnosisBatch({
                engineId: 'engine-002',
                scenarioIds: ['s2'],
                tenantId: 'T001',
                triggeredBy: 'user-002'
            });
            const filtered = service.listDiagnosisBatches({ engineId: 'engine-001' });
            strict_1.default.equal(filtered.length, 1);
            strict_1.default.equal(filtered[0].engineId, 'engine-001');
        });
    });
    // ── generateRiskReport ──
    (0, node_test_1.describe)('generateRiskReport', () => {
        (0, node_test_1.default)('should return empty report when no diagnoses exist', () => {
            const report = service.generateRiskReport();
            strict_1.default.equal(report.totalEvaluated, 0);
            strict_1.default.deepEqual(report.riskDistribution, { low: 0, medium: 0, high: 0, critical: 0 });
            strict_1.default.deepEqual(report.topRecommendations, []);
            strict_1.default.equal(report.averageEvaluationDurationMs, 0);
        });
        (0, node_test_1.default)('should calculate risk distribution correctly', () => {
            const d1 = service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            const d2 = service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's2',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            service.updateDiagnosis(d1.diagnosisId, { riskLevel: 'high', recommendation: 'Critical issue', status: 'COMPLETED' });
            service.updateDiagnosis(d2.diagnosisId, { riskLevel: 'critical', recommendation: 'Urgent', status: 'COMPLETED' });
            const report = service.generateRiskReport();
            strict_1.default.equal(report.totalEvaluated, 2);
            strict_1.default.equal(report.riskDistribution.high, 1);
            strict_1.default.equal(report.riskDistribution.critical, 1);
            strict_1.default.equal(report.riskDistribution.low, 0);
            strict_1.default.equal(report.riskDistribution.medium, 0);
        });
        (0, node_test_1.default)('should return top recommendations sorted by risk', () => {
            const d1 = service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            const d2 = service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's2',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            service.updateDiagnosis(d1.diagnosisId, { riskLevel: 'critical', recommendation: 'Fix immediately', status: 'COMPLETED' });
            service.updateDiagnosis(d2.diagnosisId, { riskLevel: 'high', recommendation: 'Review needed', status: 'COMPLETED' });
            const report = service.generateRiskReport();
            strict_1.default.equal(report.topRecommendations.length, 2);
            strict_1.default.equal(report.topRecommendations[0].riskLevel, 'critical');
            strict_1.default.equal(report.topRecommendations[1].riskLevel, 'high');
        });
        (0, node_test_1.default)('should only include high and critical in top recommendations', () => {
            for (let i = 0; i < 5; i++) {
                const d = service.createDiagnosis({
                    engineId: 'engine-001',
                    scenarioId: `s${i}`,
                    tenantId: 'T001',
                    requestedBy: 'u1'
                });
                service.updateDiagnosis(d.diagnosisId, { riskLevel: 'low', status: 'COMPLETED' });
            }
            const report = service.generateRiskReport();
            strict_1.default.equal(report.topRecommendations.length, 0);
            strict_1.default.equal(report.totalEvaluated, 5);
        });
        (0, node_test_1.default)('should filter report by engineId', () => {
            const d1 = service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            const d2 = service.createDiagnosis({
                engineId: 'engine-002',
                scenarioId: 's2',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            service.updateDiagnosis(d1.diagnosisId, { riskLevel: 'high', status: 'COMPLETED' });
            service.updateDiagnosis(d2.diagnosisId, { riskLevel: 'low', status: 'COMPLETED' });
            const report = service.generateRiskReport({ engineId: 'engine-001' });
            strict_1.default.equal(report.totalEvaluated, 1);
            strict_1.default.equal(report.riskDistribution.high, 1);
        });
        (0, node_test_1.default)('should filter report by tenantId', () => {
            service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            service.createDiagnosis({
                engineId: 'engine-001',
                scenarioId: 's2',
                tenantId: 'T002',
                requestedBy: 'u1'
            });
            const report = service.generateRiskReport({ tenantId: 'T001' });
            strict_1.default.equal(report.totalEvaluated, 1);
        });
    });
});
//# sourceMappingURL=ai-diagnosis.service.test.js.map