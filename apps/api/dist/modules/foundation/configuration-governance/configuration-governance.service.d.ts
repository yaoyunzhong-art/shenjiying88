import { ConfigValueType, FeatureFlagStatus, FoundationScopeType, Prisma, RolloutStrategy, SecretProvider } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { RequestTenantContext } from '../../tenant/tenant.types';
import { type GovernanceApprovalSnapshot } from '../governance-approval/governance-approval';
import { TrustGovernanceService } from '../trust-governance/trust-governance.service';
import type { FoundationGovernanceBaseline, FoundationModuleDescriptor } from '../foundation.types';
interface LoginPolicyConfig {
    mfaRequired?: boolean;
    sessionTtlMinutes?: number;
    allowedLoginMethods?: string[];
}
interface NotificationConfig {
    emailProvider?: string;
    smsProvider?: string;
    digestWindow?: string;
}
interface CheckoutConfig {
    allowGuestCheckout?: boolean;
    paymentChannels?: string[];
}
interface ConfigEntryMutationInput {
    namespace: string;
    key: string;
    valueType: keyof typeof ConfigValueType;
    scopeType: keyof typeof FoundationScopeType;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketProfileId?: string;
    portalSiteId?: string;
    value: unknown;
    schemaRef?: string;
    tags?: string[];
    status?: string;
    changedBy?: string;
    changeReason?: string;
    requestedBy?: string;
    approvalTicket?: string;
    approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
}
interface FeatureFlagMutationInput {
    key: string;
    name: string;
    scopeType: keyof typeof FoundationScopeType;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketProfileId?: string;
    status: keyof typeof FeatureFlagStatus;
    strategy: keyof typeof RolloutStrategy;
    enabled: boolean;
    percentage?: number;
    allowList?: string[];
    conditions?: Record<string, unknown>;
    description?: string;
    note?: string;
    startsAt?: string;
    endsAt?: string;
    requestedBy?: string;
    approvalTicket?: string;
    approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
}
interface SecretRegistrationInput {
    key: string;
    type: 'api-key' | 'webhook-signing' | 'certificate';
    scopeType: keyof typeof FoundationScopeType;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    integrationAppId?: string;
    provider?: keyof typeof SecretProvider;
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
export declare class ConfigurationGovernanceService {
    private readonly prisma;
    private readonly trustGovernanceService;
    constructor(prisma: PrismaService, trustGovernanceService: TrustGovernanceService);
    private readonly configLayers;
    private readonly featureFlags;
    private readonly secretStore;
    private readonly certificateStore;
    getManagementMetadata(): {
        operation: string;
        rbac: {
            resource: string;
            action: string;
            requiredRoles: string[];
            requiredPermissions: string[];
        };
        approval: {
            required: boolean;
            approvalId: string | null;
            version: number | null;
            requestedBy: string | null;
            ticket: string | null;
            status: import("../governance-approval/governance-approval").GovernanceApprovalStatus;
            submitted: boolean;
            persisted: boolean;
            decidedBy: string | null;
            decidedAt: string | null;
            updatedAt: string | null;
            execution: {
                attempts: number;
                executed: boolean;
                executionStatus: string | null;
                executedAt: string | null;
                executedBy: string | null;
                lastFailure: {
                    failureStatus: string | null;
                    failureReason: string | null;
                    failedAt: string | null;
                    failedBy: string | null;
                } | null;
            };
        };
    }[];
    listGovernanceApprovals(filters?: {
        limit?: number;
        approvalTicket?: string;
        operation?: string;
        resourceType?: string;
        resourceKey?: string;
        requestedBy?: string;
        decidedBy?: string;
        status?: 'PENDING' | 'APPROVED' | 'REJECTED';
        tenantId?: string;
        from?: string;
        to?: string;
        executed?: boolean;
        executionStatus?: string;
        hasFailures?: boolean;
        failureStatus?: string;
        groupBy?: Array<'operation' | 'resourceType' | 'status' | 'executionStatus' | 'failureStatus' | 'requestedBy'>;
    }): Promise<{
        submitted: boolean;
        persisted: boolean;
        approvalId: string;
        operation: string;
        resourceType: string;
        resourceKey: string;
        required: boolean;
        version: number;
        requestedBy: string | null;
        ticket: string | null;
        status: import("@prisma/client").$Enums.ApprovalStatus;
        decidedBy: string | null;
        decidedAt: string | null;
        updatedAt: string;
        execution: {
            attempts: number;
            executed: boolean;
            executionStatus: string | null;
            executedAt: string | null;
            executedBy: string | null;
            lastFailure: {
                failureStatus: string | null;
                failureReason: string | null;
                failedAt: string | null;
                failedBy: string | null;
            } | null;
        };
        summary: Record<string, unknown> | null;
    }[]>;
    getGovernanceApprovalDetail(approvalTicket: string): Promise<{
        submitted: boolean;
        persisted: boolean;
        approvalId: string;
        operation: string;
        resourceType: string;
        resourceKey: string;
        required: boolean;
        version: number;
        requestedBy: string | null;
        ticket: string | null;
        status: import("@prisma/client").$Enums.ApprovalStatus;
        decidedBy: string | null;
        decidedAt: string | null;
        updatedAt: string;
        execution: {
            attempts: number;
            executed: boolean;
            executionStatus: string | null;
            executedAt: string | null;
            executedBy: string | null;
            lastFailure: {
                failureStatus: string | null;
                failureReason: string | null;
                failedAt: string | null;
                failedBy: string | null;
            } | null;
        };
        summary: Record<string, unknown> | null;
    }>;
    getGovernanceApprovalTimeline(approvalTicket: string, limit?: number): Promise<unknown>;
    getAuditRecords(filters?: {
        limit?: number;
        tenantId?: string;
        action?: string;
        requestId?: string;
        actorId?: string;
        approvalTicket?: string;
        riskLevel?: 'low' | 'medium' | 'high';
        from?: string;
        to?: string;
    }): Promise<unknown>;
    summarizeAuditRecords(filters?: {
        limit?: number;
        tenantId?: string;
        action?: string;
        requestId?: string;
        actorId?: string;
        approvalTicket?: string;
        riskLevel?: 'low' | 'medium' | 'high';
        from?: string;
        to?: string;
    }): Promise<unknown>;
    getOperationsOverview(): Promise<unknown>;
    summarizeGovernanceApprovals(filters?: {
        approvalTicket?: string;
        operation?: string;
        resourceType?: string;
        resourceKey?: string;
        requestedBy?: string;
        decidedBy?: string;
        status?: 'PENDING' | 'APPROVED' | 'REJECTED';
        tenantId?: string;
        from?: string;
        to?: string;
        executed?: boolean;
        executionStatus?: string;
        hasFailures?: boolean;
        failureStatus?: string;
        groupBy?: Array<'operation' | 'resourceType' | 'status' | 'executionStatus' | 'failureStatus' | 'requestedBy'>;
    }): Promise<{
        groups: {
            dimensions: Record<string, string | null>;
            total: number;
            statuses: {
                NOT_REQUIRED: number;
                PENDING: number;
                APPROVED: number;
                REJECTED: number;
                CANCELLED: number;
                SUPERSEDED: number;
            };
            execution: {
                executed: number;
                pending: number;
                withFailures: number;
                byExecutionStatus: Record<string, number>;
                byFailureStatus: Record<string, number>;
            };
        }[];
        total: number;
        statuses: {
            NOT_REQUIRED: number;
            PENDING: number;
            APPROVED: number;
            REJECTED: number;
            CANCELLED: number;
            SUPERSEDED: number;
        };
        execution: {
            executed: number;
            pending: number;
            withFailures: number;
            byExecutionStatus: Record<string, number>;
            byFailureStatus: Record<string, number>;
        };
    }>;
    resolveConfigSnapshot(context: RequestTenantContext): Promise<{
        snapshotId: string;
        generatedAt: string;
        scopeChain: string[];
        context: {
            tenantId: string;
            brandId: string;
            storeId: string;
            marketCode: string;
        };
        config: {
            locale?: string;
            currency?: string;
            timezone?: string;
            loginPolicy?: LoginPolicyConfig;
            notifications?: NotificationConfig;
            checkout?: CheckoutConfig;
        };
        featureFlags: ({
            key: string;
            name: string;
            description: string;
            enabled: boolean;
            reason: string;
            matchedScope: {
                scopeType: import("@prisma/client").$Enums.FoundationScopeType;
                tenantId: string | null;
                brandId: string | null;
                storeId: string | null;
                marketProfileId: string | null;
            } | null;
            rolloutPercentage: number;
            subjectKey: string;
            source: string;
        } | {
            key: string;
            name: string;
            description: string;
            enabled: boolean;
            reason: string;
            matchedScope: Partial<RequestTenantContext>;
            rolloutPercentage: number;
            subjectKey: string;
            source: string;
        })[];
        secrets: ({
            name: string;
            type: string;
            scopes: string[];
            consumers: string[];
            algorithm: string;
            currentVersion: number;
            status: string;
            lastRotatedAt: string;
            expiresAt: string | null;
            fingerprint: string;
            provider: import("@prisma/client").$Enums.SecretProvider;
            scopeType: import("@prisma/client").$Enums.FoundationScopeType;
            versions: {
                version: number;
                fingerprint: string;
                createdAt: string;
                expiresAt: string | null;
                rotatedBy: string;
            }[];
        } | {
            name: string;
            type: "webhook-signing" | "api-key" | "certificate";
            scopes: string[];
            consumers: string[];
            algorithm: string;
            currentVersion: number;
            status: "active" | "rotation-due";
            lastRotatedAt: string;
            expiresAt: string;
            fingerprint: string;
            source: string;
            versions: {
                version: number;
                fingerprint: string;
                createdAt: string;
                expiresAt: string;
                rotatedBy: string;
            }[];
        })[];
        checksum: string;
    }>;
    getFeatureFlags(context: RequestTenantContext, subjectKey?: string): Promise<({
        key: string;
        name: string;
        description: string;
        enabled: boolean;
        reason: string;
        matchedScope: {
            scopeType: import("@prisma/client").$Enums.FoundationScopeType;
            tenantId: string | null;
            brandId: string | null;
            storeId: string | null;
            marketProfileId: string | null;
        } | null;
        rolloutPercentage: number;
        subjectKey: string;
        source: string;
    } | {
        key: string;
        name: string;
        description: string;
        enabled: boolean;
        reason: string;
        matchedScope: Partial<RequestTenantContext>;
        rolloutPercentage: number;
        subjectKey: string;
        source: string;
    })[]>;
    listPersistedFeatureFlags(context: RequestTenantContext, subjectKey?: string): Promise<({
        key: string;
        name: string;
        description: string;
        enabled: boolean;
        reason: string;
        matchedScope: {
            scopeType: import("@prisma/client").$Enums.FoundationScopeType;
            tenantId: string | null;
            brandId: string | null;
            storeId: string | null;
            marketProfileId: string | null;
        } | null;
        rolloutPercentage: number;
        subjectKey: string;
        source: string;
    } | {
        key: string;
        name: string;
        description: string;
        enabled: boolean;
        reason: string;
        matchedScope: Partial<RequestTenantContext>;
        rolloutPercentage: number;
        subjectKey: string;
        source: string;
    })[]>;
    evaluateFeatureFlag(flagKey: string, context: RequestTenantContext, subjectKey?: string): Promise<{
        key: string;
        name: string;
        description: string;
        enabled: boolean;
        reason: string;
        matchedScope: {
            scopeType: import("@prisma/client").$Enums.FoundationScopeType;
            tenantId: string | null;
            brandId: string | null;
            storeId: string | null;
            marketProfileId: string | null;
        } | null;
        rolloutPercentage: number;
        subjectKey: string;
        source: string;
    } | {
        key: string;
        name: string;
        description: string;
        enabled: boolean;
        reason: string;
        matchedScope: Partial<RequestTenantContext>;
        rolloutPercentage: number;
        subjectKey: string;
        source: string;
    }>;
    getSecretMetadata(secretName?: string): Promise<({
        name: string;
        type: string;
        scopes: string[];
        consumers: string[];
        algorithm: string;
        currentVersion: number;
        status: string;
        lastRotatedAt: string;
        expiresAt: string | null;
        fingerprint: string;
        provider: import("@prisma/client").$Enums.SecretProvider;
        scopeType: import("@prisma/client").$Enums.FoundationScopeType;
        versions: {
            version: number;
            fingerprint: string;
            createdAt: string;
            expiresAt: string | null;
            rotatedBy: string;
        }[];
    } | {
        name: string;
        type: "webhook-signing" | "api-key" | "certificate";
        scopes: string[];
        consumers: string[];
        algorithm: string;
        currentVersion: number;
        status: "active" | "rotation-due";
        lastRotatedAt: string;
        expiresAt: string;
        fingerprint: string;
        source: string;
        versions: {
            version: number;
            fingerprint: string;
            createdAt: string;
            expiresAt: string;
            rotatedBy: string;
        }[];
    })[]>;
    getCertificateMetadata(filters?: {
        name?: string;
        status?: 'active' | 'expiring-soon' | 'expired';
        expiringWithinDays?: number;
    }): Promise<{
        name: string;
        secretName: string;
        format: "PEM" | "PFX" | "JKS";
        scopes: string[];
        consumers: string[];
        domains: string[];
        issuer: string;
        autoRenew: boolean;
        issuedAt: string;
        expiresAt: string;
        lastValidatedAt: string;
        rotatedBy: string;
        status: string;
    }[]>;
    getCertificateDetail(certificateName: string, filters?: {
        expiringWithinDays?: number;
    }): Promise<{
        name: string;
        secretName: string;
        format: "PEM" | "PFX" | "JKS";
        scopes: string[];
        consumers: string[];
        domains: string[];
        issuer: string;
        autoRenew: boolean;
        issuedAt: string;
        expiresAt: string;
        lastValidatedAt: string;
        rotatedBy: string;
        status: string;
    }>;
    getSecretsCertificatePosture(): Promise<{
        generatedAt: string;
        secrets: {
            total: number;
            rotationDue: number;
            expired: number;
            sharedConsumers: number;
        };
        certificates: {
            total: number;
            expiringSoon: number;
            expired: number;
            autoRenewDisabled: number;
        };
        attention: {
            secrets: {
                type: string;
                key: string;
                status: string;
                expiresAt: string | null;
            }[];
            certificates: {
                type: string;
                key: string;
                status: string;
                expiresAt: string;
                linkedSecret: string;
            }[];
        };
    }>;
    listConfigEntries(filters: {
        namespace?: string;
        key?: string;
        tenantId?: string;
        brandId?: string;
        storeId?: string;
        marketCode?: string;
    }): Promise<{
        id: string;
        namespace: string;
        key: string;
        valueType: import("@prisma/client").$Enums.ConfigValueType;
        scopeType: import("@prisma/client").$Enums.FoundationScopeType;
        tenantId: string | null;
        brandId: string | null;
        storeId: string | null;
        marketProfileId: string | null;
        portalSiteId: string | null;
        version: number;
        value: Prisma.JsonValue;
        schemaRef: string | null;
        tags: string[];
        status: string;
        createdBy: string | null;
        latestRevision: {
            version: number;
            changedBy: string;
            changeReason: string | null;
            createdAt: string;
        } | null;
        updatedAt: string;
    }[]>;
    saveConfigEntry(input: ConfigEntryMutationInput): Promise<{
        governance: {
            operation: string;
            rbac: {
                resource: string;
                action: string;
                requiredRoles: string[];
                requiredPermissions: string[];
            };
            approval: {
                required: boolean;
                approvalId: string | null;
                version: number | null;
                requestedBy: string | null;
                ticket: string | null;
                status: import("../governance-approval/governance-approval").GovernanceApprovalStatus;
                submitted: boolean;
                persisted: boolean;
                decidedBy: string | null;
                decidedAt: string | null;
                updatedAt: string | null;
                execution: {
                    attempts: number;
                    executed: boolean;
                    executionStatus: string | null;
                    executedAt: string | null;
                    executedBy: string | null;
                    lastFailure: {
                        failureStatus: string | null;
                        failureReason: string | null;
                        failedAt: string | null;
                        failedBy: string | null;
                    } | null;
                };
            };
        };
        status: string;
        entry: {
            id: string;
            namespace: string;
            key: string;
            valueType: import("@prisma/client").$Enums.ConfigValueType;
            scopeType: import("@prisma/client").$Enums.FoundationScopeType;
            tenantId: string | null;
            brandId: string | null;
            storeId: string | null;
            marketProfileId: string | null;
            portalSiteId: string | null;
            version: number;
            value: Prisma.JsonValue;
            schemaRef: string | null;
            tags: string[];
            status: string;
            createdBy: string | null;
            revisions: {
                version: number;
                changedBy: string;
                changeReason: string | null;
                createdAt: string;
            }[];
            updatedAt: string;
        };
    }>;
    saveFeatureFlag(input: FeatureFlagMutationInput): Promise<{
        governance: {
            operation: string;
            rbac: {
                resource: string;
                action: string;
                requiredRoles: string[];
                requiredPermissions: string[];
            };
            approval: {
                required: boolean;
                approvalId: string | null;
                version: number | null;
                requestedBy: string | null;
                ticket: string | null;
                status: import("../governance-approval/governance-approval").GovernanceApprovalStatus;
                submitted: boolean;
                persisted: boolean;
                decidedBy: string | null;
                decidedAt: string | null;
                updatedAt: string | null;
                execution: {
                    attempts: number;
                    executed: boolean;
                    executionStatus: string | null;
                    executedAt: string | null;
                    executedBy: string | null;
                    lastFailure: {
                        failureStatus: string | null;
                        failureReason: string | null;
                        failedAt: string | null;
                        failedBy: string | null;
                    } | null;
                };
            };
        };
        status: string;
        record: {
            id: string;
            key: string;
            name: string;
            scopeType: import("@prisma/client").$Enums.FoundationScopeType;
            tenantId: string | null;
            brandId: string | null;
            storeId: string | null;
            marketProfileId: string | null;
            status: import("@prisma/client").$Enums.FeatureFlagStatus;
            strategy: import("@prisma/client").$Enums.RolloutStrategy;
            enabled: boolean;
            percentage: number | null;
            allowList: string[];
            conditions: Record<string, unknown>;
            description: string | undefined;
            note: string | undefined;
            startsAt: string | null;
            endsAt: string | null;
            updatedAt: string;
        };
    }>;
    rotateSecret(secretName: string, rotatedBy?: string, governance?: {
        requestedBy?: string;
        approvalTicket?: string;
        approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
    }): Promise<{
        status: string;
        secretName: string;
        approvalRequest: GovernanceApprovalSnapshot;
        governance: {
            operation: string;
            rbac: {
                resource: string;
                action: string;
                requiredRoles: string[];
                requiredPermissions: string[];
            };
            approval: {
                required: boolean;
                approvalId: string | null;
                version: number | null;
                requestedBy: string | null;
                ticket: string | null;
                status: import("../governance-approval/governance-approval").GovernanceApprovalStatus;
                submitted: boolean;
                persisted: boolean;
                decidedBy: string | null;
                decidedAt: string | null;
                updatedAt: string | null;
                execution: {
                    attempts: number;
                    executed: boolean;
                    executionStatus: string | null;
                    executedAt: string | null;
                    executedBy: string | null;
                    lastFailure: {
                        failureStatus: string | null;
                        failureReason: string | null;
                        failedAt: string | null;
                        failedBy: string | null;
                    } | null;
                };
            };
        };
    } | {
        governance: {
            operation: string;
            rbac: {
                resource: string;
                action: string;
                requiredRoles: string[];
                requiredPermissions: string[];
            };
            approval: {
                required: boolean;
                approvalId: string | null;
                version: number | null;
                requestedBy: string | null;
                ticket: string | null;
                status: import("../governance-approval/governance-approval").GovernanceApprovalStatus;
                submitted: boolean;
                persisted: boolean;
                decidedBy: string | null;
                decidedAt: string | null;
                updatedAt: string | null;
                execution: {
                    attempts: number;
                    executed: boolean;
                    executionStatus: string | null;
                    executedAt: string | null;
                    executedBy: string | null;
                    lastFailure: {
                        failureStatus: string | null;
                        failureReason: string | null;
                        failedAt: string | null;
                        failedBy: string | null;
                    } | null;
                };
            };
        };
        status: string;
        secret: ReturnType<ConfigurationGovernanceService["getSecretMetadata"]> extends Promise<(infer U)[]> ? U | undefined : never;
        secretName?: undefined;
        approvalRequest?: undefined;
    }>;
    registerSecret(input: SecretRegistrationInput): Promise<{
        status: string;
        key: string;
        approvalRequest: GovernanceApprovalSnapshot;
        governance: {
            operation: string;
            rbac: {
                resource: string;
                action: string;
                requiredRoles: string[];
                requiredPermissions: string[];
            };
            approval: {
                required: boolean;
                approvalId: string | null;
                version: number | null;
                requestedBy: string | null;
                ticket: string | null;
                status: import("../governance-approval/governance-approval").GovernanceApprovalStatus;
                submitted: boolean;
                persisted: boolean;
                decidedBy: string | null;
                decidedAt: string | null;
                updatedAt: string | null;
                execution: {
                    attempts: number;
                    executed: boolean;
                    executionStatus: string | null;
                    executedAt: string | null;
                    executedBy: string | null;
                    lastFailure: {
                        failureStatus: string | null;
                        failureReason: string | null;
                        failedAt: string | null;
                        failedBy: string | null;
                    } | null;
                };
            };
        };
    } | {
        governance: {
            operation: string;
            rbac: {
                resource: string;
                action: string;
                requiredRoles: string[];
                requiredPermissions: string[];
            };
            approval: {
                required: boolean;
                approvalId: string | null;
                version: number | null;
                requestedBy: string | null;
                ticket: string | null;
                status: import("../governance-approval/governance-approval").GovernanceApprovalStatus;
                submitted: boolean;
                persisted: boolean;
                decidedBy: string | null;
                decidedAt: string | null;
                updatedAt: string | null;
                execution: {
                    attempts: number;
                    executed: boolean;
                    executionStatus: string | null;
                    executedAt: string | null;
                    executedBy: string | null;
                    lastFailure: {
                        failureStatus: string | null;
                        failureReason: string | null;
                        failedAt: string | null;
                        failedBy: string | null;
                    } | null;
                };
            };
        };
        status: string;
        version: number;
        secret: ReturnType<ConfigurationGovernanceService["getSecretMetadata"]> extends Promise<(infer U)[]> ? U | undefined : never;
        key?: undefined;
        approvalRequest?: undefined;
    }>;
    getGovernanceBaselines(): FoundationGovernanceBaseline[];
    getDescriptor(): FoundationModuleDescriptor;
    private normalizeContext;
    private buildScopeChain;
    private mergeConfig;
    private deepMerge;
    private matchesScope;
    private getScopeSpecificity;
    private computeRolloutBucket;
    private getSubjectKey;
    private buildFingerprint;
    private buildChecksum;
    private buildId;
    private getPersistentConfigFragment;
    private evaluatePersistedFeatureFlag;
    private matchesPersistedFlagScope;
    private isPersistedFlagEnabled;
    private getPersistedRolloutPercentage;
    private getPersistentScopeSpecificity;
    private toMatchedScope;
    private toConfigFragment;
    private getConfigEntryById;
    private toFeatureFlagRecord;
    private toPersistedSecretMetadata;
    private toStaticSecretMetadata;
    private toCertificateMetadata;
    private toPrismaSecretKind;
    private fromPrismaSecretKind;
    private getDefaultSecretAlgorithm;
    private groupByKey;
    private getJsonRecord;
    private getString;
    private getStringArray;
    private isRecord;
    private recordGovernanceAudit;
    private handleApprovalExecutionFailure;
    private buildGovernanceMetadata;
    private buildResourceKey;
    private isConfigurationApproval;
    private toInputJsonValue;
}
export {};
//# sourceMappingURL=configuration-governance.service.d.ts.map