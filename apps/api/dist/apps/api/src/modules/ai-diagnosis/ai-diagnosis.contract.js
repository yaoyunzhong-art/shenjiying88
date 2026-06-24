"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDiagnosisContract = toDiagnosisContract;
exports.toDiagnosisBatchContract = toDiagnosisBatchContract;
exports.toDiagnosisContracts = toDiagnosisContracts;
/**
 * Contract: 实体 -> 合约映射器
 */
function toDiagnosisContract(entity) {
    return {
        diagnosisId: entity.diagnosisId,
        engineId: entity.engineId,
        scenarioId: entity.scenarioId,
        status: entity.status,
        riskLevel: entity.riskLevel,
        recommendation: entity.recommendation,
        matchedRuleIds: [...entity.matchedRuleIds],
        matchedConditionIds: [...entity.matchedConditionIds],
        triggeredActionIds: [...entity.triggeredActionIds],
        evaluationDurationMs: entity.evaluationDurationMs,
        createdAt: entity.createdAt,
        completedAt: entity.completedAt,
        tenantId: entity.tenantId,
        requestedBy: entity.requestedBy
    };
}
/**
 * Contract: 批量诊断 -> 合约映射器
 */
function toDiagnosisBatchContract(entity) {
    return {
        batchId: entity.batchId,
        engineId: entity.engineId,
        totalDiagnoses: entity.totalDiagnoses,
        matchedDiagnoses: entity.matchedDiagnoses,
        matchRate: entity.matchRate,
        avgEvaluationDurationMs: entity.avgEvaluationDurationMs,
        createdAt: entity.createdAt,
        triggeredBy: entity.triggeredBy,
        tenantId: entity.tenantId
    };
}
/**
 * Contract: 实体 -> 合约映射器（批量）
 */
function toDiagnosisContracts(entities) {
    return entities.map(toDiagnosisContract);
}
//# sourceMappingURL=ai-diagnosis.contract.js.map