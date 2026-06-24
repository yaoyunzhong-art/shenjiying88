"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDiagnosisContract = toDiagnosisContract;
exports.toDiagnosisBatchContract = toDiagnosisBatchContract;
exports.toRiskReportContract = toRiskReportContract;
// ─── Mappers ─────────────────────────────────────────
function toDiagnosisContract(d) {
    return {
        diagnosisId: d.diagnosisId,
        engineId: d.engineId,
        scenarioId: d.scenarioId,
        status: d.status,
        riskLevel: d.riskLevel,
        matchedRuleCount: d.matchedRuleIds.length,
        matchedConditionCount: d.matchedConditionIds.length,
        triggeredActionCount: d.triggeredActionIds.length,
        recommendation: d.recommendation,
        evaluationDurationMs: d.evaluationDurationMs,
        createdAt: d.createdAt,
        completedAt: d.completedAt,
        tenantId: d.tenantId,
        requestedBy: d.requestedBy,
    };
}
function toDiagnosisBatchContract(batch) {
    return {
        batchId: batch.batchId,
        engineId: batch.engineId,
        totalDiagnoses: batch.totalDiagnoses,
        matchedDiagnoses: batch.matchedDiagnoses,
        matchRate: batch.matchRate,
        riskDistribution: { ...batch.riskDistribution },
        avgEvaluationDurationMs: batch.avgEvaluationDurationMs,
        createdAt: batch.createdAt,
        triggeredBy: batch.triggeredBy,
        tenantId: batch.tenantId,
        diagnoses: batch.diagnoses.map(toDiagnosisContract),
    };
}
function toRiskReportContract(report) {
    return { ...report };
}
//# sourceMappingURL=ai-diagnosis.contract.js.map