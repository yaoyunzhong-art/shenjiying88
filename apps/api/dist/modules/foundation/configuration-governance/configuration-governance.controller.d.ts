import { ApprovalQueryDto, ApprovalTimelineQueryDto, AuditQueryDto } from '../trust-governance/trust-governance.dto';
import { ConfigurationGovernanceService } from './configuration-governance.service';
import { CertificateQueryDto, ConfigEntryQueryDto, ConfigurationScopeDto, FeatureFlagQueryDto, PersistFeatureFlagDto, RegisterSecretDto, RotateSecretDto, UpsertConfigEntryDto } from './configuration-governance.dto';
export declare class ConfigurationGovernanceController {
    private readonly configurationGovernanceService;
    constructor(configurationGovernanceService: ConfigurationGovernanceService);
    getManagementMetadata(): unknown;
    getOperationsOverview(): Promise<unknown>;
    getSnapshot(query: ConfigurationScopeDto): Promise<unknown>;
    getFeatureFlags(query: FeatureFlagQueryDto): Promise<unknown>;
    getFeatureFlagRecords(query: FeatureFlagQueryDto): Promise<unknown>;
    getFeatureFlag(flagKey: string, query: FeatureFlagQueryDto): Promise<unknown>;
    saveFeatureFlag(body: PersistFeatureFlagDto): Promise<unknown>;
    getConfigEntries(query: ConfigEntryQueryDto): Promise<unknown>;
    getAudit(query: AuditQueryDto): Promise<unknown>;
    getAuditSummary(query: AuditQueryDto): Promise<unknown>;
    getApprovals(query: ApprovalQueryDto): Promise<unknown>;
    getApprovalSummary(query: ApprovalQueryDto): Promise<unknown>;
    getApprovalDetail(approvalTicket: string): Promise<unknown>;
    getApprovalTimeline(approvalTicket: string, query: ApprovalTimelineQueryDto): Promise<unknown>;
    saveConfigEntry(body: UpsertConfigEntryDto): Promise<unknown>;
    getSecrets(): Promise<unknown>;
    getSecretsCertificatePosture(): Promise<unknown>;
    getSecret(secretName: string): Promise<unknown>;
    getCertificates(query: CertificateQueryDto): Promise<unknown>;
    getCertificate(certificateName: string, query: CertificateQueryDto): Promise<unknown>;
    rotateSecret(secretName: string, body: RotateSecretDto): Promise<unknown>;
    registerSecret(body: RegisterSecretDto): Promise<unknown>;
    private toTenantContext;
}
//# sourceMappingURL=configuration-governance.controller.d.ts.map