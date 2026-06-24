import type { DiagnosisEntity, DiagnosisBatch } from './ai-diagnosis.entity';
export declare class AiDiagnosisService {
    static resetStores(): void;
    createDiagnosis(input: {
        engineId: string;
        scenarioId: string;
        tenantId: string;
        requestedBy: string;
        promptSummary?: string;
        inputSnapshot?: Record<string, unknown>;
    }): DiagnosisEntity;
    getDiagnosis(diagnosisId: string): DiagnosisEntity | undefined;
    listDiagnoses(filters?: {
        engineId?: string;
        status?: DiagnosisEntity['status'];
        riskLevel?: DiagnosisEntity['riskLevel'];
        tenantId?: string;
    }): {
        diagnoses: DiagnosisEntity[];
        total: number;
    };
    updateDiagnosis(diagnosisId: string, patch: {
        status?: DiagnosisEntity['status'];
        riskLevel?: DiagnosisEntity['riskLevel'];
        recommendation?: string;
        matchedRuleIds?: string[];
        matchedConditionIds?: string[];
        triggeredActionIds?: string[];
        outputSnapshot?: Record<string, unknown>;
        evaluationDurationMs?: number;
    }): DiagnosisEntity | undefined;
    deleteDiagnosis(diagnosisId: string): boolean;
    createDiagnosisBatch(input: {
        engineId: string;
        scenarioIds: string[];
        tenantId: string;
        triggeredBy: string;
    }): DiagnosisBatch;
    getDiagnosisBatch(batchId: string): DiagnosisBatch | undefined;
    listDiagnosisBatches(filters?: {
        engineId?: string;
        tenantId?: string;
    }): DiagnosisBatch[];
    generateRiskReport(filters?: {
        engineId?: string;
        tenantId?: string;
    }): {
        generatedAt: string;
        totalEvaluated: number;
        riskDistribution: {
            low: number;
            medium: number;
            high: number;
            critical: number;
        };
        topRecommendations: Array<{
            diagnosisId: string;
            riskLevel: string;
            recommendation: string;
        }>;
        averageEvaluationDurationMs: number;
    };
}
//# sourceMappingURL=ai-diagnosis.service.d.ts.map