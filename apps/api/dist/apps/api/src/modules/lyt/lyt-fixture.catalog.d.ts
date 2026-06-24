export type LytFixtureKey = 'member-query' | 'order-query' | 'payment-success-webhook' | 'gate-pass-webhook' | 'device-status-query';
export type LytFixtureTransport = 'api' | 'webhook';
export type LytFixtureCapability = 'member' | 'order' | 'payment' | 'gate' | 'device';
export type LytFixtureValidationStatus = 'ready-for-rehearsal' | 'needs-sample-completion';
export type LytFixtureRiskLevel = 'high' | 'medium';
export interface LytFixtureCatalogItem {
    key: LytFixtureKey;
    title: string;
    transport: LytFixtureTransport;
    capability: LytFixtureCapability;
    riskLevel: LytFixtureRiskLevel;
    method: 'GET' | 'POST';
    path: string;
    recommendedUsage: string;
    eventType?: string;
    mappingVersion: string;
    requiredRawFields: string[];
    recommendedRawFields: string[];
    requiredHeaders: string[];
    recommendedHeaders: string[];
    requiredQueryParams: string[];
    recommendedQueryParams: string[];
    standardFieldChecklist: string[];
    schemaChecklist: string[];
    archiveChecklist: string[];
    samplePayload: Record<string, unknown>;
    sampleHeaders: Record<string, string>;
    sampleQueryParams: Record<string, string>;
}
export declare function evaluateLytFixtureValidation(item: LytFixtureCatalogItem): {
    validationStatus: LytFixtureValidationStatus;
    missingSampleFields: string[];
    missingChecklistItems: string[];
};
export declare function getMissingFixtureFields(item: Pick<LytFixtureCatalogItem, 'requiredRawFields'>, payload: Record<string, unknown>): string[];
export declare function getMissingFixtureHeaders(item: Pick<LytFixtureCatalogItem, 'requiredHeaders'>, headers: Record<string, unknown>): string[];
export declare function getMissingFixtureQueryParams(item: Pick<LytFixtureCatalogItem, 'requiredQueryParams'>, query: Record<string, unknown>): string[];
export declare function getLytFixtureCatalog(filters?: {
    transport?: LytFixtureTransport;
    capability?: LytFixtureCapability;
}): LytFixtureCatalogItem[];
export declare function getLytFixtureByKey(key: string): LytFixtureCatalogItem | null;
//# sourceMappingURL=lyt-fixture.catalog.d.ts.map