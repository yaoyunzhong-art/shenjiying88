export declare class ConfigurationScopeDto {
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
}
export declare class FeatureFlagQueryDto extends ConfigurationScopeDto {
    subjectKey?: string;
}
export declare class RotateSecretDto {
    rotatedBy?: string;
    requestedBy?: string;
    approvalTicket?: string;
    approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
}
export declare class ConfigEntryQueryDto extends ConfigurationScopeDto {
    namespace?: string;
    key?: string;
}
export declare class CertificateQueryDto extends ConfigurationScopeDto {
    name?: string;
    status?: 'active' | 'expiring-soon' | 'expired';
    expiringWithinDays?: number;
}
export declare class UpsertConfigEntryDto extends ConfigurationScopeDto {
    namespace: string;
    key: string;
    valueType: 'JSON' | 'STRING' | 'NUMBER' | 'BOOLEAN';
    scopeType: 'PLATFORM' | 'TENANT' | 'BRAND' | 'STORE' | 'MARKET' | 'PORTAL' | 'USER' | 'DEVICE' | 'INTEGRATION';
    value: unknown;
    marketProfileId?: string;
    portalSiteId?: string;
    schemaRef?: string;
    tags?: string[];
    status?: string;
    changedBy?: string;
    changeReason?: string;
    requestedBy?: string;
    approvalTicket?: string;
    approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
}
export declare class PersistFeatureFlagDto extends ConfigurationScopeDto {
    key: string;
    name: string;
    scopeType: 'PLATFORM' | 'TENANT' | 'BRAND' | 'STORE' | 'MARKET' | 'PORTAL' | 'USER' | 'DEVICE' | 'INTEGRATION';
    status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
    strategy: 'ALL' | 'PERCENTAGE' | 'ALLOW_LIST' | 'SCOPE_MATCH';
    enabled: boolean;
    percentage?: number;
    allowList?: string[];
    conditions?: Record<string, unknown>;
    marketProfileId?: string;
    description?: string;
    note?: string;
    startsAt?: string;
    endsAt?: string;
    requestedBy?: string;
    approvalTicket?: string;
    approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
}
export declare class RegisterSecretDto extends ConfigurationScopeDto {
    key: string;
    type: 'api-key' | 'webhook-signing' | 'certificate';
    scopeType: 'PLATFORM' | 'TENANT' | 'BRAND' | 'STORE' | 'MARKET' | 'PORTAL' | 'USER' | 'DEVICE' | 'INTEGRATION';
    provider?: 'DATABASE' | 'VAULT' | 'KMS' | 'EXTERNAL';
    integrationAppId?: string;
    reference?: string;
    value?: string;
    algorithm?: string;
    scopes?: string[];
    consumers?: string[];
    expiresAt?: string;
    rotatedBy?: string;
    requestedBy?: string;
    approvalTicket?: string;
    approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
}
//# sourceMappingURL=configuration-governance.dto.d.ts.map