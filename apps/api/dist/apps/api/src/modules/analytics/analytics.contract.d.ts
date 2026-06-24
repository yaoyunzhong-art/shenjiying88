import type { OperationSnapshot, OperationSnapshotMetric, OperationSnapshotGroup, Diagnostic, DiagnosticRecommendation } from './analytics.entity';
import { AnalyticsScope, DiagnosticSeverity, DiagnosticCategory } from './analytics.entity';
/**
 * 运营快照合约：对外暴露的 summary 视图
 */
export interface OperationSnapshotContract {
    tenantId: string;
    scope: AnalyticsScope;
    brandId?: string;
    storeId?: string;
    generatedAt: string;
    groups: OperationSnapshotGroup[];
    totals: OperationSnapshotMetric[];
}
/**
 * 诊断合约：对外暴露的诊断项
 */
export interface DiagnosticContract {
    diagnosticId: string;
    ruleId: string;
    tenantId: string;
    brandId?: string;
    storeId?: string;
    scope: AnalyticsScope;
    category: DiagnosticCategory;
    severity: DiagnosticSeverity;
    title: string;
    summary: string;
    evidence: Record<string, unknown>;
    recommendations: DiagnosticRecommendation[];
    generatedAt: string;
}
/**
 * 诊断推荐合约
 */
export interface DiagnosticRecommendationContract {
    actionCode: string;
    description: string;
    suggestedCampaignKind?: 'POINTS_AWARD' | 'COUPON_ISSUE' | 'BLINDBOX_PROMO' | 'RE_ENGAGEMENT';
    priority: number;
}
/**
 * 运营摘要合约：snapshot + diagnostics 汇总
 */
export interface AnalyticsBootstrapContract {
    snapshot: OperationSnapshotContract;
    diagnostics: DiagnosticContract[];
    recommendations: DiagnosticRecommendationContract[];
    generatedAt: string;
}
export declare function toOperationSnapshotContract(snapshot: OperationSnapshot): OperationSnapshotContract;
export declare function toDiagnosticContract(diagnostic: Diagnostic): DiagnosticContract;
export declare function toDiagnosticRecommendationContract(recommendation: DiagnosticRecommendation): DiagnosticRecommendationContract;
export declare function toAnalyticsBootstrapContract(input: {
    snapshot: OperationSnapshot;
    diagnostics: Diagnostic[];
    recommendations: DiagnosticRecommendation[];
}): AnalyticsBootstrapContract;
//# sourceMappingURL=analytics.contract.d.ts.map