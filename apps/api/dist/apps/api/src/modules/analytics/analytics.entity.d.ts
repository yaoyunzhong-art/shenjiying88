export declare enum AnalyticsScope {
    Tenant = "TENANT",
    Brand = "BRAND",
    Store = "STORE"
}
export declare enum DiagnosticSeverity {
    Info = "INFO",
    Warning = "WARNING",
    Critical = "CRITICAL"
}
export declare enum DiagnosticCategory {
    PaymentHealth = "PAYMENT_HEALTH",
    CouponPerformance = "COUPON_PERFORMANCE",
    BlindboxEngagement = "BLINDBOX_ENGAGEMENT",
    MemberActivity = "MEMBER_ACTIVITY",
    PointEconomy = "POINT_ECONOMY",
    ConcentrationRisk = "CONCENTRATION_RISK"
}
export interface OperationSnapshotMetric {
    key: string;
    label: string;
    value: number;
    unit: string;
    /** Optional ratio expressed as percentage 0..100 */
    ratio?: number;
    trend?: 'UP' | 'DOWN' | 'FLAT';
}
export interface OperationSnapshotGroup {
    groupKey: string;
    groupLabel: string;
    metrics: OperationSnapshotMetric[];
}
export interface OperationSnapshot {
    tenantId: string;
    scope: AnalyticsScope;
    brandId?: string;
    storeId?: string;
    generatedAt: string;
    groups: OperationSnapshotGroup[];
    totals: OperationSnapshotMetric[];
}
export interface DiagnosticRecommendation {
    actionCode: string;
    description: string;
    /** Optional linkage to a campaign kind we know how to dispatch */
    suggestedCampaignKind?: 'POINTS_AWARD' | 'COUPON_ISSUE' | 'BLINDBOX_PROMO' | 'RE_ENGAGEMENT';
    priority: number;
}
export interface Diagnostic {
    diagnosticId: string;
    ruleId: string;
    tenantContext: {
        tenantId: string;
        brandId?: string;
        storeId?: string;
    };
    scope: AnalyticsScope;
    category: DiagnosticCategory;
    severity: DiagnosticSeverity;
    title: string;
    summary: string;
    evidence: Record<string, unknown>;
    recommendations: DiagnosticRecommendation[];
    generatedAt: string;
}
//# sourceMappingURL=analytics.entity.d.ts.map