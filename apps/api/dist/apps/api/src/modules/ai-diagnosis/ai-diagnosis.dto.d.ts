import type { DiagnosisEntity, DiagnosisBatch } from './ai-diagnosis.entity';
export declare class CreateDiagnosisDto {
    engineId: string;
    scenarioId: string;
    tenantId: string;
    requestedBy: string;
    promptSummary?: string;
    inputSnapshot?: Record<string, unknown>;
}
export declare class CreateDiagnosisBatchDto {
    engineId: string;
    scenarioIds: string[];
    tenantId: string;
    triggeredBy: string;
}
export declare class UpdateDiagnosisDto {
    status?: DiagnosisEntity['status'];
    riskLevel?: DiagnosisEntity['riskLevel'];
    recommendation?: string;
}
export declare class DiagnosisQueryDto {
    engineId?: string;
    status?: DiagnosisEntity['status'];
    riskLevel?: DiagnosisEntity['riskLevel'];
    tenantId?: string;
}
export interface DiagnosisResponse {
    diagnosis: DiagnosisEntity;
}
export interface DiagnosisListResponse {
    diagnoses: DiagnosisEntity[];
    total: number;
}
export interface DiagnosisBatchResponse {
    batch: DiagnosisBatch;
}
export interface DiagnosisRiskReportResponse {
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
}
//# sourceMappingURL=ai-diagnosis.dto.d.ts.map