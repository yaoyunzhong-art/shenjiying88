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
const ai_diagnosis_controller_1 = require("./ai-diagnosis.controller");
const ai_diagnosis_service_1 = require("./ai-diagnosis.service");
const common_1 = require("@nestjs/common");
(0, node_test_1.describe)('AiDiagnosisController', () => {
    let controller;
    let service;
    (0, node_test_1.beforeEach)(() => {
        ai_diagnosis_service_1.AiDiagnosisService.resetStores();
        service = new ai_diagnosis_service_1.AiDiagnosisService();
        controller = new ai_diagnosis_controller_1.AiDiagnosisController(service);
    });
    // ── POST / ──
    (0, node_test_1.describe)('POST /ai-diagnosis', () => {
        (0, node_test_1.default)('should create a diagnosis and return 201', () => {
            const dto = {
                engineId: 'engine-001',
                scenarioId: 'scenario-001',
                tenantId: 'T001',
                requestedBy: 'user-001'
            };
            const result = controller.create(dto);
            strict_1.default.ok(result.diagnosis);
            strict_1.default.equal(result.diagnosis.engineId, 'engine-001');
            strict_1.default.equal(result.diagnosis.status, 'PENDING');
        });
        (0, node_test_1.default)('should return diagnosis with unique id', () => {
            const r1 = controller.create({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            const r2 = controller.create({
                engineId: 'engine-001',
                scenarioId: 's2',
                tenantId: 'T001',
                requestedBy: 'u2'
            });
            strict_1.default.notEqual(r1.diagnosis.diagnosisId, r2.diagnosis.diagnosisId);
        });
    });
    // ── GET / ──
    (0, node_test_1.describe)('GET /ai-diagnosis', () => {
        (0, node_test_1.default)('should return empty list', () => {
            const result = controller.list({});
            strict_1.default.equal(result.total, 0);
            strict_1.default.deepEqual(result.diagnoses, []);
        });
        (0, node_test_1.default)('should list created diagnoses', () => {
            controller.create({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            controller.create({
                engineId: 'engine-001',
                scenarioId: 's2',
                tenantId: 'T001',
                requestedBy: 'u2'
            });
            const result = controller.list({});
            strict_1.default.equal(result.total, 2);
        });
        (0, node_test_1.default)('should filter by status', () => {
            const d = controller.create({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            controller.update(d.diagnosis.diagnosisId, { status: 'COMPLETED' });
            const result = controller.list({ status: 'COMPLETED' });
            strict_1.default.equal(result.total, 1);
        });
        (0, node_test_1.default)('should filter by engineId', () => {
            controller.create({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            controller.create({
                engineId: 'engine-002',
                scenarioId: 's2',
                tenantId: 'T001',
                requestedBy: 'u2'
            });
            const result = controller.list({ engineId: 'engine-001' });
            strict_1.default.equal(result.total, 1);
        });
    });
    // ── GET /:diagnosisId ──
    (0, node_test_1.describe)('GET /ai-diagnosis/:diagnosisId', () => {
        (0, node_test_1.default)('should return diagnosis by id', () => {
            const created = controller.create({
                engineId: 'engine-001',
                scenarioId: 'scenario-001',
                tenantId: 'T001',
                requestedBy: 'user-001'
            });
            const result = controller.get(created.diagnosis.diagnosisId);
            strict_1.default.equal(result.diagnosis.diagnosisId, created.diagnosis.diagnosisId);
        });
        (0, node_test_1.default)('should throw NotFoundException for missing diagnosis', () => {
            strict_1.default.throws(() => controller.get('non-existent'), (err) => err.message === 'Diagnosis non-existent not found');
        });
    });
    // ── PATCH /:diagnosisId ──
    (0, node_test_1.describe)('PATCH /ai-diagnosis/:diagnosisId', () => {
        (0, node_test_1.default)('should update diagnosis status', () => {
            const created = controller.create({
                engineId: 'engine-001',
                scenarioId: 'scenario-001',
                tenantId: 'T001',
                requestedBy: 'user-001'
            });
            const result = controller.update(created.diagnosis.diagnosisId, {
                status: 'COMPLETED',
                riskLevel: 'medium',
                recommendation: 'Done'
            });
            strict_1.default.equal(result.diagnosis.status, 'COMPLETED');
            strict_1.default.equal(result.diagnosis.riskLevel, 'medium');
            strict_1.default.equal(result.diagnosis.recommendation, 'Done');
        });
        (0, node_test_1.default)('should throw NotFoundException for missing diagnosis', () => {
            strict_1.default.throws(() => controller.update('non-existent', { status: 'COMPLETED' }), (err) => err.message === 'Diagnosis non-existent not found');
        });
    });
    // ── DELETE /:diagnosisId ──
    (0, node_test_1.describe)('DELETE /ai-diagnosis/:diagnosisId', () => {
        (0, node_test_1.default)('should delete diagnosis', () => {
            const created = controller.create({
                engineId: 'engine-001',
                scenarioId: 'scenario-001',
                tenantId: 'T001',
                requestedBy: 'user-001'
            });
            controller.remove(created.diagnosis.diagnosisId);
            strict_1.default.throws(() => controller.get(created.diagnosis.diagnosisId), (err) => err.message.includes('not found'));
        });
        (0, node_test_1.default)('should throw NotFoundException for missing diagnosis', () => {
            strict_1.default.throws(() => controller.remove('non-existent'), (err) => err.message === 'Diagnosis non-existent not found');
        });
    });
    // ── POST /batch ──
    (0, node_test_1.describe)('POST /ai-diagnosis/batch', () => {
        (0, node_test_1.default)('should create a batch', () => {
            const result = controller.createBatch({
                engineId: 'engine-001',
                scenarioIds: ['s1', 's2', 's3'],
                tenantId: 'T001',
                triggeredBy: 'user-001'
            });
            strict_1.default.ok(result.batch);
            strict_1.default.equal(result.batch.totalDiagnoses, 3);
            strict_1.default.ok(result.batch.batchId.startsWith('batch-'));
        });
        (0, node_test_1.default)('should auto-complete all diagnoses', () => {
            const result = controller.createBatch({
                engineId: 'engine-001',
                scenarioIds: ['s1', 's2'],
                tenantId: 'T001',
                triggeredBy: 'user-001'
            });
            strict_1.default.equal(result.batch.matchedDiagnoses, 0);
            strict_1.default.equal(result.batch.riskDistribution.low, 2);
        });
        (0, node_test_1.default)('should detect critical scenarios', () => {
            const result = controller.createBatch({
                engineId: 'engine-001',
                scenarioIds: ['critical-scenario'],
                tenantId: 'T001',
                triggeredBy: 'user-001'
            });
            strict_1.default.equal(result.batch.matchedDiagnoses, 1);
            strict_1.default.equal(result.batch.riskDistribution.high, 1);
        });
    });
    // ── GET /batch/:batchId ──
    (0, node_test_1.describe)('GET /ai-diagnosis/batch/:batchId', () => {
        (0, node_test_1.default)('should return batch by id', () => {
            const created = controller.createBatch({
                engineId: 'engine-001',
                scenarioIds: ['s1'],
                tenantId: 'T001',
                triggeredBy: 'user-001'
            });
            const result = controller.getBatch(created.batch.batchId);
            strict_1.default.equal(result.batch.batchId, created.batch.batchId);
        });
        (0, node_test_1.default)('should throw NotFoundException for missing batch', () => {
            strict_1.default.throws(() => controller.getBatch('non-existent'), (err) => err.message.includes('not found'));
        });
    });
    // ── GET /batch ──
    (0, node_test_1.describe)('GET /ai-diagnosis/batch', () => {
        (0, node_test_1.default)('should list all batches', () => {
            controller.createBatch({
                engineId: 'engine-001',
                scenarioIds: ['s1'],
                tenantId: 'T001',
                triggeredBy: 'user-001'
            });
            controller.createBatch({
                engineId: 'engine-002',
                scenarioIds: ['s2'],
                tenantId: 'T001',
                triggeredBy: 'user-002'
            });
            const result = controller.listBatches();
            strict_1.default.equal(result.length, 2);
        });
        (0, node_test_1.default)('should filter by engineId', () => {
            controller.createBatch({
                engineId: 'engine-001',
                scenarioIds: ['s1'],
                tenantId: 'T001',
                triggeredBy: 'user-001'
            });
            controller.createBatch({
                engineId: 'engine-002',
                scenarioIds: ['s2'],
                tenantId: 'T001',
                triggeredBy: 'user-002'
            });
            const result = controller.listBatches('engine-001');
            strict_1.default.equal(result.length, 1);
        });
    });
    // ── GET /report/risk ──
    (0, node_test_1.describe)('GET /ai-diagnosis/report/risk', () => {
        (0, node_test_1.default)('should generate risk report', () => {
            const d = controller.create({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            controller.update(d.diagnosis.diagnosisId, {
                riskLevel: 'high',
                recommendation: 'Check rules',
                status: 'COMPLETED'
            });
            const report = controller.riskReport();
            strict_1.default.ok(report.generatedAt);
            strict_1.default.equal(report.totalEvaluated, 1);
            strict_1.default.equal(report.riskDistribution.high, 1);
            strict_1.default.equal(report.topRecommendations.length, 1);
        });
        (0, node_test_1.default)('should filter report by engineId', () => {
            controller.create({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            const report = controller.riskReport('engine-001');
            strict_1.default.equal(report.totalEvaluated, 1);
        });
        (0, node_test_1.default)('should handle empty dataset', () => {
            const report = controller.riskReport();
            strict_1.default.equal(report.totalEvaluated, 0);
            strict_1.default.deepEqual(report.topRecommendations, []);
            strict_1.default.equal(report.averageEvaluationDurationMs, 0);
        });
        (0, node_test_1.default)('should include averageEvaluationDurationMs in report', () => {
            const d1 = controller.create({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            controller.update(d1.diagnosis.diagnosisId, {
                status: 'COMPLETED',
                evaluationDurationMs: 100
            });
            const d2 = controller.create({
                engineId: 'engine-001',
                scenarioId: 's2',
                tenantId: 'T001',
                requestedBy: 'u2'
            });
            controller.update(d2.diagnosis.diagnosisId, {
                status: 'COMPLETED',
                evaluationDurationMs: 200
            });
            const report = controller.riskReport('engine-001');
            strict_1.default.equal(report.averageEvaluationDurationMs, 150);
        });
        (0, node_test_1.default)('should sort high-risk recommendations first', () => {
            const d1 = controller.create({
                engineId: 'engine-001',
                scenarioId: 'critical-s1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            controller.update(d1.diagnosis.diagnosisId, {
                status: 'COMPLETED',
                riskLevel: 'critical',
                recommendation: 'Urgent fix'
            });
            const d2 = controller.create({
                engineId: 'engine-001',
                scenarioId: 'high-s2',
                tenantId: 'T001',
                requestedBy: 'u2'
            });
            controller.update(d2.diagnosis.diagnosisId, {
                status: 'COMPLETED',
                riskLevel: 'high',
                recommendation: 'Check soon'
            });
            const report = controller.riskReport('engine-001');
            strict_1.default.equal(report.topRecommendations.length, 2);
            strict_1.default.equal(report.topRecommendations[0].riskLevel, 'critical');
            strict_1.default.equal(report.topRecommendations[1].riskLevel, 'high');
            strict_1.default.equal(report.riskDistribution.critical, 1);
            strict_1.default.equal(report.riskDistribution.high, 1);
        });
    });
    // ── 边界与错误处理 ──
    (0, node_test_1.describe)('boundary & error handling', () => {
        (0, node_test_1.default)('should handle update with empty patch (no-op)', () => {
            const d = controller.create({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            const result = controller.update(d.diagnosis.diagnosisId, {});
            strict_1.default.equal(result.diagnosis.diagnosisId, d.diagnosis.diagnosisId);
            strict_1.default.equal(result.diagnosis.status, 'PENDING'); // unchanged
        });
        (0, node_test_1.default)('should update diagnosis to IN_PROGRESS status', () => {
            const d = controller.create({
                engineId: 'engine-001',
                scenarioId: 'scenario-001',
                tenantId: 'T001',
                requestedBy: 'user-001'
            });
            const result = controller.update(d.diagnosis.diagnosisId, {
                status: 'IN_PROGRESS'
            });
            strict_1.default.equal(result.diagnosis.status, 'IN_PROGRESS');
        });
        (0, node_test_1.default)('should update diagnosis to FAILED status', () => {
            const d = controller.create({
                engineId: 'engine-001',
                scenarioId: 'scenario-001',
                tenantId: 'T001',
                requestedBy: 'user-001'
            });
            const result = controller.update(d.diagnosis.diagnosisId, {
                status: 'FAILED'
            });
            strict_1.default.equal(result.diagnosis.status, 'FAILED');
        });
        (0, node_test_1.default)('should throw NotFoundException when updating deleted diagnosis', () => {
            const d = controller.create({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            controller.remove(d.diagnosis.diagnosisId);
            strict_1.default.throws(() => controller.update(d.diagnosis.diagnosisId, { status: 'COMPLETED' }), (err) => err instanceof common_1.NotFoundException);
        });
        (0, node_test_1.default)('should throw NotFoundException when getting deleted diagnosis', () => {
            const d = controller.create({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            controller.remove(d.diagnosis.diagnosisId);
            strict_1.default.throws(() => controller.get(d.diagnosis.diagnosisId), (err) => err instanceof common_1.NotFoundException);
        });
        (0, node_test_1.default)('should handle delete returning 204 (void return)', () => {
            const d = controller.create({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            const result = controller.remove(d.diagnosis.diagnosisId);
            strict_1.default.equal(result, undefined); // 204 NO_CONTENT returns void
        });
        (0, node_test_1.default)('should list empty batch when no batches created', () => {
            const batches = controller.listBatches();
            strict_1.default.deepEqual(batches, []);
        });
        (0, node_test_1.default)('should filter batches by tenantId', () => {
            controller.createBatch({
                engineId: 'engine-001',
                scenarioIds: ['s1'],
                tenantId: 'T001',
                triggeredBy: 'u1'
            });
            controller.createBatch({
                engineId: 'engine-001',
                scenarioIds: ['s2'],
                tenantId: 'T002',
                triggeredBy: 'u2'
            });
            const result = controller.listBatches(undefined, 'T001');
            strict_1.default.equal(result.length, 1);
            strict_1.default.equal(result[0].tenantId, 'T001');
        });
        (0, node_test_1.default)('should filter report by tenantId', () => {
            controller.create({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            controller.create({
                engineId: 'engine-001',
                scenarioId: 's2',
                tenantId: 'T002',
                requestedBy: 'u2'
            });
            const report = controller.riskReport(undefined, 'T001');
            strict_1.default.equal(report.totalEvaluated, 1);
        });
        (0, node_test_1.default)('should create diagnosis with optional promptSummary and inputSnapshot', () => {
            const inputSnapshot = { deviceId: 'dev-001', cpuUsage: 95 };
            const dto = {
                engineId: 'engine-001',
                scenarioId: 'scenario-001',
                tenantId: 'T001',
                requestedBy: 'user-001',
                promptSummary: '设备异常检测',
                inputSnapshot
            };
            const result = controller.create(dto);
            strict_1.default.equal(result.diagnosis.promptSummary, '设备异常检测');
            strict_1.default.deepEqual(result.diagnosis.inputSnapshot, inputSnapshot);
        });
        (0, node_test_1.default)('should persist created diagnosis in list after creation', () => {
            controller.create({
                engineId: 'engine-001',
                scenarioId: 's1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            const list1 = controller.list({});
            strict_1.default.equal(list1.total, 1);
            controller.create({
                engineId: 'engine-001',
                scenarioId: 's2',
                tenantId: 'T001',
                requestedBy: 'u2'
            });
            const list2 = controller.list({});
            strict_1.default.equal(list2.total, 2);
        });
        (0, node_test_1.default)('should filter diagnosis by riskLevel', () => {
            const d1 = controller.create({
                engineId: 'engine-001',
                scenarioId: 'low-s1',
                tenantId: 'T001',
                requestedBy: 'u1'
            });
            controller.update(d1.diagnosis.diagnosisId, { status: 'COMPLETED', riskLevel: 'low' });
            const d2 = controller.create({
                engineId: 'engine-001',
                scenarioId: 'high-s1',
                tenantId: 'T001',
                requestedBy: 'u2'
            });
            controller.update(d2.diagnosis.diagnosisId, { status: 'COMPLETED', riskLevel: 'high' });
            const result = controller.list({ riskLevel: 'high' });
            strict_1.default.equal(result.total, 1);
            strict_1.default.equal(result.diagnoses[0].riskLevel, 'high');
        });
    });
});
//# sourceMappingURL=ai-diagnosis.controller.test.js.map