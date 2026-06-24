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
(0, node_test_1.describe)('DiagnosisEntity 类型形状', () => {
    // ── 构造合规对象并验证字段 ──
    (0, node_test_1.default)('应支持 PENDING 状态的诊断实体', () => {
        const diagnosis = {
            diagnosisId: 'diag-abc12345',
            engineId: 'engine-001',
            scenarioId: 'scenario-001',
            status: 'PENDING',
            matchedRuleIds: [],
            matchedConditionIds: [],
            triggeredActionIds: [],
            riskLevel: 'low',
            recommendation: '',
            promptSummary: '初始化诊断',
            evaluationDurationMs: 0,
            inputSnapshot: {},
            outputSnapshot: {},
            createdAt: '2024-01-15T08:00:00Z',
            tenantId: 'T001',
            requestedBy: 'user-001'
        };
        strict_1.default.equal(diagnosis.diagnosisId, 'diag-abc12345');
        strict_1.default.equal(diagnosis.engineId, 'engine-001');
        strict_1.default.equal(diagnosis.scenarioId, 'scenario-001');
        strict_1.default.equal(diagnosis.status, 'PENDING');
        strict_1.default.equal(diagnosis.riskLevel, 'low');
        strict_1.default.equal(diagnosis.tenantId, 'T001');
        strict_1.default.equal(diagnosis.requestedBy, 'user-001');
        strict_1.default.equal(diagnosis.recommendation, '');
        strict_1.default.equal(diagnosis.promptSummary, '初始化诊断');
        strict_1.default.equal(diagnosis.evaluationDurationMs, 0);
        strict_1.default.deepEqual(diagnosis.matchedRuleIds, []);
        strict_1.default.deepEqual(diagnosis.matchedConditionIds, []);
        strict_1.default.deepEqual(diagnosis.triggeredActionIds, []);
        strict_1.default.deepEqual(diagnosis.inputSnapshot, {});
        strict_1.default.deepEqual(diagnosis.outputSnapshot, {});
        strict_1.default.ok(diagnosis.createdAt);
        // completedAt 可选，未传入时应为 undefined
        strict_1.default.equal(diagnosis.completedAt, undefined);
    });
    (0, node_test_1.default)('应支持 COMPLETED 状态的诊断实体', () => {
        const diagnosis = {
            diagnosisId: 'diag-xyz98765',
            engineId: 'engine-002',
            scenarioId: 'scenario-002',
            status: 'COMPLETED',
            matchedRuleIds: ['rule-001', 'rule-002'],
            matchedConditionIds: ['cond-001'],
            triggeredActionIds: ['act-001'],
            riskLevel: 'high',
            recommendation: '触发高风险警告，建议即时检查',
            promptSummary: '批量诊断 - scenario-002',
            evaluationDurationMs: 150,
            inputSnapshot: { memberId: 'M001', points: 500 },
            outputSnapshot: { riskScore: 85 },
            createdAt: '2024-01-15T08:05:00Z',
            completedAt: '2024-01-15T08:05:01.150Z',
            tenantId: 'T002',
            requestedBy: 'user-002'
        };
        strict_1.default.equal(diagnosis.status, 'COMPLETED');
        strict_1.default.equal(diagnosis.riskLevel, 'high');
        strict_1.default.deepEqual(diagnosis.matchedRuleIds, ['rule-001', 'rule-002']);
        strict_1.default.deepEqual(diagnosis.matchedConditionIds, ['cond-001']);
        strict_1.default.deepEqual(diagnosis.triggeredActionIds, ['act-001']);
        strict_1.default.equal(diagnosis.evaluationDurationMs, 150);
        strict_1.default.deepEqual(diagnosis.inputSnapshot, { memberId: 'M001', points: 500 });
        strict_1.default.deepEqual(diagnosis.outputSnapshot, { riskScore: 85 });
        strict_1.default.equal(diagnosis.completedAt, '2024-01-15T08:05:01.150Z');
    });
    (0, node_test_1.default)('应支持 FAILED 状态的诊断实体', () => {
        const diagnosis = {
            diagnosisId: 'diag-fail01',
            engineId: 'engine-003',
            scenarioId: 'scenario-fail',
            status: 'FAILED',
            matchedRuleIds: [],
            matchedConditionIds: [],
            triggeredActionIds: [],
            riskLevel: 'low',
            recommendation: '执行失败：超时',
            promptSummary: '诊断失败',
            evaluationDurationMs: 5000,
            inputSnapshot: { reason: 'timeout' },
            outputSnapshot: { error: 'Execution timeout' },
            createdAt: '2024-01-15T08:10:00Z',
            completedAt: '2024-01-15T08:10:05Z',
            tenantId: 'T003',
            requestedBy: 'system'
        };
        strict_1.default.equal(diagnosis.status, 'FAILED');
        strict_1.default.equal(diagnosis.evaluationDurationMs, 5000);
        strict_1.default.ok(diagnosis.completedAt);
    });
});
(0, node_test_1.describe)('DiagnosisEntity status 枚举约束', () => {
    (0, node_test_1.default)('status 仅接受 PENDING | IN_PROGRESS | COMPLETED | FAILED', () => {
        // 类型编译时约束 —— 运行时验证合法值
        const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'];
        strict_1.default.equal(validStatuses.length, 4);
        strict_1.default.ok(validStatuses.includes('PENDING'));
        strict_1.default.ok(validStatuses.includes('IN_PROGRESS'));
        strict_1.default.ok(validStatuses.includes('COMPLETED'));
        strict_1.default.ok(validStatuses.includes('FAILED'));
    });
});
(0, node_test_1.describe)('DiagnosisEntity riskLevel 枚举约束', () => {
    (0, node_test_1.default)('riskLevel 仅接受 low | medium | high | critical', () => {
        const validLevels = ['low', 'medium', 'high', 'critical'];
        strict_1.default.equal(validLevels.length, 4);
        strict_1.default.ok(validLevels.includes('low'));
        strict_1.default.ok(validLevels.includes('medium'));
        strict_1.default.ok(validLevels.includes('high'));
        strict_1.default.ok(validLevels.includes('critical'));
    });
});
(0, node_test_1.describe)('DiagnosisBatch 类型形状', () => {
    (0, node_test_1.default)('应包含 DiagnosisEntity[] 数组', () => {
        const diagnosis = {
            diagnosisId: 'diag-test001',
            engineId: 'engine-001',
            scenarioId: 's1',
            status: 'COMPLETED',
            matchedRuleIds: ['rule-001'],
            matchedConditionIds: ['cond-001'],
            triggeredActionIds: ['act-001'],
            riskLevel: 'medium',
            recommendation: '建议复查',
            promptSummary: '测试诊断',
            evaluationDurationMs: 42,
            inputSnapshot: {},
            outputSnapshot: {},
            createdAt: '2024-01-15T08:00:00Z',
            completedAt: '2024-01-15T08:00:00.042Z',
            tenantId: 'T001',
            requestedBy: 'user-001'
        };
        const batch = {
            batchId: 'batch-abc12345',
            engineId: 'engine-001',
            totalDiagnoses: 1,
            matchedDiagnoses: 1,
            matchRate: 1.0,
            riskDistribution: { low: 0, medium: 1, high: 0, critical: 0 },
            avgEvaluationDurationMs: 42,
            diagnoses: [diagnosis],
            createdAt: '2024-01-15T08:01:00Z',
            triggeredBy: 'user-001',
            tenantId: 'T001'
        };
        strict_1.default.equal(batch.batchId, 'batch-abc12345');
        strict_1.default.equal(batch.engineId, 'engine-001');
        strict_1.default.equal(batch.totalDiagnoses, 1);
        strict_1.default.equal(batch.matchedDiagnoses, 1);
        strict_1.default.equal(batch.matchRate, 1.0);
        strict_1.default.deepEqual(batch.riskDistribution, { low: 0, medium: 1, high: 0, critical: 0 });
        strict_1.default.equal(batch.avgEvaluationDurationMs, 42);
        strict_1.default.equal(batch.triggeredBy, 'user-001');
        strict_1.default.equal(batch.tenantId, 'T001');
        strict_1.default.ok(batch.createdAt);
        // 验证 diagnoses 是数组且包含 DiagnosisEntity
        strict_1.default.ok(Array.isArray(batch.diagnoses));
        strict_1.default.equal(batch.diagnoses.length, 1);
        strict_1.default.equal(batch.diagnoses[0].diagnosisId, 'diag-test001');
        strict_1.default.equal(batch.diagnoses[0].riskLevel, 'medium');
    });
    (0, node_test_1.default)('应支持多个 diagnoses', () => {
        const makeDiagnosis = (id, riskLevel) => ({
            diagnosisId: id,
            engineId: 'engine-001',
            scenarioId: id,
            status: 'COMPLETED',
            matchedRuleIds: [],
            matchedConditionIds: [],
            triggeredActionIds: [],
            riskLevel,
            recommendation: '',
            promptSummary: '',
            evaluationDurationMs: 50,
            inputSnapshot: {},
            outputSnapshot: {},
            createdAt: '2024-01-15T08:00:00Z',
            tenantId: 'T001',
            requestedBy: 'user-001'
        });
        const batch = {
            batchId: 'batch-multi',
            engineId: 'engine-001',
            totalDiagnoses: 3,
            matchedDiagnoses: 2,
            matchRate: 2 / 3,
            riskDistribution: { low: 1, medium: 1, high: 1, critical: 0 },
            avgEvaluationDurationMs: 50,
            diagnoses: [
                makeDiagnosis('diag-1', 'low'),
                makeDiagnosis('diag-2', 'medium'),
                makeDiagnosis('diag-3', 'high')
            ],
            createdAt: '2024-01-15T08:01:00Z',
            triggeredBy: 'user-001',
            tenantId: 'T001'
        };
        strict_1.default.equal(batch.diagnoses.length, 3);
        strict_1.default.equal(batch.totalDiagnoses, 3);
        strict_1.default.equal(batch.matchedDiagnoses, 2);
        strict_1.default.equal(batch.riskDistribution.low, 1);
        strict_1.default.equal(batch.riskDistribution.medium, 1);
        strict_1.default.equal(batch.riskDistribution.high, 1);
        strict_1.default.equal(batch.riskDistribution.critical, 0);
        // 验证每个元素都是 DiagnosisEntity
        for (const d of batch.diagnoses) {
            strict_1.default.ok(d.diagnosisId);
            strict_1.default.ok(d.status);
            strict_1.default.ok(d.riskLevel);
        }
    });
    (0, node_test_1.default)('DiagnosisBatch 的 diagnoses 应为 DiagnosisEntity 类型数组', () => {
        // 通过构造和类型推导验证 diagnoses 是 DiagnosisEntity[]
        const batch = {
            batchId: 'batch-type-check',
            engineId: 'engine-001',
            totalDiagnoses: 0,
            matchedDiagnoses: 0,
            matchRate: 0,
            riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
            avgEvaluationDurationMs: 0,
            diagnoses: [],
            createdAt: '2024-01-15T08:00:00Z',
            triggeredBy: 'user-001',
            tenantId: 'T001'
        };
        // 空数组也是合法的
        strict_1.default.ok(Array.isArray(batch.diagnoses));
        strict_1.default.equal(batch.diagnoses.length, 0);
        strict_1.default.equal(batch.totalDiagnoses, 0);
    });
});
//# sourceMappingURL=ai-diagnosis.entity.test.js.map