"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiDiagnosisService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const diagnosisStore = new Map();
const batchStore = new Map();
let AiDiagnosisService = class AiDiagnosisService {
    // ── 存储重置（仅供测试使用） ──
    static resetStores() {
        diagnosisStore.clear();
        batchStore.clear();
    }
    // ── 创建诊断 ──
    createDiagnosis(input) {
        const diagnosisId = `diag-${(0, node_crypto_1.randomUUID)().slice(0, 8)}`;
        const now = new Date().toISOString();
        const diagnosis = {
            diagnosisId,
            engineId: input.engineId,
            scenarioId: input.scenarioId,
            status: 'PENDING',
            matchedRuleIds: [],
            matchedConditionIds: [],
            triggeredActionIds: [],
            riskLevel: 'low',
            recommendation: '',
            promptSummary: input.promptSummary ?? `诊断任务 - ${input.scenarioId}`,
            evaluationDurationMs: 0,
            inputSnapshot: input.inputSnapshot ?? {},
            outputSnapshot: {},
            createdAt: now,
            tenantId: input.tenantId,
            requestedBy: input.requestedBy
        };
        diagnosisStore.set(diagnosisId, diagnosis);
        return diagnosis;
    }
    // ── 获取单个诊断 ──
    getDiagnosis(diagnosisId) {
        return diagnosisStore.get(diagnosisId);
    }
    // ── 列出诊断 ──
    listDiagnoses(filters) {
        let results = Array.from(diagnosisStore.values());
        if (filters?.engineId)
            results = results.filter((d) => d.engineId === filters.engineId);
        if (filters?.status)
            results = results.filter((d) => d.status === filters.status);
        if (filters?.riskLevel)
            results = results.filter((d) => d.riskLevel === filters.riskLevel);
        if (filters?.tenantId)
            results = results.filter((d) => d.tenantId === filters.tenantId);
        // 按创建时间降序
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return { diagnoses: results, total: results.length };
    }
    // ── 更新诊断状态 ──
    updateDiagnosis(diagnosisId, patch) {
        const existing = diagnosisStore.get(diagnosisId);
        if (!existing)
            return undefined;
        const updated = {
            ...existing,
            ...patch,
            completedAt: patch.status === 'COMPLETED' || patch.status === 'FAILED'
                ? new Date().toISOString()
                : existing.completedAt
        };
        diagnosisStore.set(diagnosisId, updated);
        return updated;
    }
    // ── 删除诊断 ──
    deleteDiagnosis(diagnosisId) {
        return diagnosisStore.delete(diagnosisId);
    }
    // ── 批量诊断 ──
    createDiagnosisBatch(input) {
        const batchId = `batch-${(0, node_crypto_1.randomUUID)().slice(0, 8)}`;
        const now = new Date().toISOString();
        const diagnoses = input.scenarioIds.map((scenarioId) => this.createDiagnosis({
            engineId: input.engineId,
            scenarioId,
            tenantId: input.tenantId,
            requestedBy: input.triggeredBy,
            promptSummary: `批量诊断 - ${scenarioId}`
        }));
        // 自动完成所有诊断（模拟）
        for (const d of diagnoses) {
            const isMatched = d.scenarioId.includes('critical') || d.scenarioId.includes('high');
            this.updateDiagnosis(d.diagnosisId, {
                status: 'COMPLETED',
                riskLevel: isMatched ? 'high' : 'low',
                recommendation: isMatched
                    ? `场景 ${d.scenarioId} 触发高风险警告，建议即时检查规则配置`
                    : `场景 ${d.scenarioId} 规则执行正常，无异常`,
                matchedRuleIds: isMatched ? [d.engineId] : [],
                matchedConditionIds: isMatched ? ['cond-risk-high'] : [],
                triggeredActionIds: isMatched ? ['act-alert'] : [],
                outputSnapshot: { riskScore: isMatched ? 85 : 5 },
                evaluationDurationMs: Math.floor(Math.random() * 200) + 10
            });
        }
        const completedDiagnoses = diagnoses.map((d) => diagnosisStore.get(d.diagnosisId));
        const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
        for (const d of completedDiagnoses) {
            riskDistribution[d.riskLevel]++;
        }
        const batch = {
            batchId,
            engineId: input.engineId,
            totalDiagnoses: completedDiagnoses.length,
            matchedDiagnoses: completedDiagnoses.filter((d) => d.matchedRuleIds.length > 0).length,
            matchRate: completedDiagnoses.length > 0
                ? completedDiagnoses.filter((d) => d.matchedRuleIds.length > 0).length /
                    completedDiagnoses.length
                : 0,
            riskDistribution,
            avgEvaluationDurationMs: completedDiagnoses.length > 0
                ? Math.round(completedDiagnoses.reduce((sum, d) => sum + d.evaluationDurationMs, 0) /
                    completedDiagnoses.length)
                : 0,
            diagnoses: completedDiagnoses,
            createdAt: now,
            triggeredBy: input.triggeredBy,
            tenantId: input.tenantId
        };
        batchStore.set(batchId, batch);
        return batch;
    }
    getDiagnosisBatch(batchId) {
        return batchStore.get(batchId);
    }
    listDiagnosisBatches(filters) {
        let results = Array.from(batchStore.values());
        if (filters?.engineId)
            results = results.filter((b) => b.engineId === filters.engineId);
        if (filters?.tenantId)
            results = results.filter((b) => b.tenantId === filters.tenantId);
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return results;
    }
    // ── 风险报告 ──
    generateRiskReport(filters) {
        let diagnoses = Array.from(diagnosisStore.values());
        if (filters?.engineId)
            diagnoses = diagnoses.filter((d) => d.engineId === filters.engineId);
        if (filters?.tenantId)
            diagnoses = diagnoses.filter((d) => d.tenantId === filters.tenantId);
        const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
        for (const d of diagnoses) {
            riskDistribution[d.riskLevel]++;
        }
        const topRecommendations = diagnoses
            .filter((d) => d.riskLevel === 'high' || d.riskLevel === 'critical')
            .sort((a, b) => {
            const order = { critical: 0, high: 1, medium: 2, low: 3 };
            return (order[a.riskLevel] ?? 99) - (order[b.riskLevel] ?? 99);
        })
            .slice(0, 10)
            .map((d) => ({
            diagnosisId: d.diagnosisId,
            riskLevel: d.riskLevel,
            recommendation: d.recommendation
        }));
        const averageEvaluationDurationMs = diagnoses.length > 0
            ? Math.round(diagnoses.reduce((sum, d) => sum + d.evaluationDurationMs, 0) / diagnoses.length)
            : 0;
        return {
            generatedAt: new Date().toISOString(),
            totalEvaluated: diagnoses.length,
            riskDistribution,
            topRecommendations,
            averageEvaluationDurationMs
        };
    }
};
exports.AiDiagnosisService = AiDiagnosisService;
exports.AiDiagnosisService = AiDiagnosisService = __decorate([
    (0, common_1.Injectable)()
], AiDiagnosisService);
//# sourceMappingURL=ai-diagnosis.service.js.map