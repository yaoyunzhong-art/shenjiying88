"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toOperationSnapshotContract = toOperationSnapshotContract;
exports.toDiagnosticContract = toDiagnosticContract;
exports.toDiagnosticRecommendationContract = toDiagnosticRecommendationContract;
exports.toAnalyticsBootstrapContract = toAnalyticsBootstrapContract;
// ─── Mappers ───
function toOperationSnapshotContract(snapshot) {
    return {
        tenantId: snapshot.tenantId,
        scope: snapshot.scope,
        brandId: snapshot.brandId,
        storeId: snapshot.storeId,
        generatedAt: snapshot.generatedAt,
        groups: snapshot.groups.map((g) => ({
            groupKey: g.groupKey,
            groupLabel: g.groupLabel,
            metrics: g.metrics.map((m) => ({
                key: m.key,
                label: m.label,
                value: m.value,
                unit: m.unit,
                ratio: m.ratio,
                trend: m.trend
            }))
        })),
        totals: snapshot.totals.map((m) => ({
            key: m.key,
            label: m.label,
            value: m.value,
            unit: m.unit,
            ratio: m.ratio,
            trend: m.trend
        }))
    };
}
function toDiagnosticContract(diagnostic) {
    return {
        diagnosticId: diagnostic.diagnosticId,
        ruleId: diagnostic.ruleId,
        tenantId: diagnostic.tenantContext.tenantId,
        brandId: diagnostic.tenantContext.brandId,
        storeId: diagnostic.tenantContext.storeId,
        scope: diagnostic.scope,
        category: diagnostic.category,
        severity: diagnostic.severity,
        title: diagnostic.title,
        summary: diagnostic.summary,
        evidence: diagnostic.evidence,
        recommendations: diagnostic.recommendations.map((r) => ({
            actionCode: r.actionCode,
            description: r.description,
            suggestedCampaignKind: r.suggestedCampaignKind,
            priority: r.priority
        })),
        generatedAt: diagnostic.generatedAt
    };
}
function toDiagnosticRecommendationContract(recommendation) {
    return {
        actionCode: recommendation.actionCode,
        description: recommendation.description,
        suggestedCampaignKind: recommendation.suggestedCampaignKind,
        priority: recommendation.priority
    };
}
function toAnalyticsBootstrapContract(input) {
    return {
        snapshot: toOperationSnapshotContract(input.snapshot),
        diagnostics: input.diagnostics.map(toDiagnosticContract),
        recommendations: input.recommendations.map(toDiagnosticRecommendationContract),
        generatedAt: input.snapshot.generatedAt
    };
}
//# sourceMappingURL=analytics.contract.js.map