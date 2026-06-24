import type { FoundationConsumerDescriptor as SharedFoundationConsumerDescriptor, FoundationAlertAcknowledgement, FoundationAlertCatalogItem, FoundationAlertCode, FoundationAlertTimelineEntry, FoundationOperationsAlertTriageState, RuntimeGovernanceCallbackStallDetail, RuntimeGovernanceOverviewFilter } from '@m5/types';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestActorContext, RequestTenantContext } from '../tenant/tenant.types';
import { LytGovernanceQueryService } from '../lyt/lyt-governance-query.service';
import { ConfigurationGovernanceService } from './configuration-governance/configuration-governance.service';
import { IdentityAccessService } from './identity-access/identity-access.service';
import { IntegrationOrchestrationService } from './integration-orchestration/integration-orchestration.service';
import { ResilienceOperationsService } from './resilience-operations/resilience-operations.service';
import { RuntimeGovernanceService } from './runtime-governance/runtime-governance.service';
import { TrustGovernanceService } from './trust-governance/trust-governance.service';
import type { FoundationBlueprint, FoundationConsumerDescriptor, FoundationConsumerKey, FoundationGovernanceBaseline, FoundationModuleDescriptor } from './foundation.types';
export declare class FoundationService {
    private readonly identityAccessService;
    private readonly configurationGovernanceService;
    private readonly integrationOrchestrationService;
    private readonly trustGovernanceService;
    private readonly resilienceOperationsService;
    private readonly runtimeGovernanceService;
    private readonly prisma;
    private readonly lytGovernanceQueryService?;
    constructor(identityAccessService: IdentityAccessService, configurationGovernanceService: ConfigurationGovernanceService, integrationOrchestrationService: IntegrationOrchestrationService, trustGovernanceService: TrustGovernanceService, resilienceOperationsService: ResilienceOperationsService, runtimeGovernanceService: RuntimeGovernanceService, prisma: PrismaService, lytGovernanceQueryService?: LytGovernanceQueryService | undefined);
    getModuleCatalog(): FoundationModuleDescriptor[];
    getConsumerCatalog(): FoundationConsumerDescriptor[];
    getGovernanceBaselines(): FoundationGovernanceBaseline[];
    getBlueprint(): FoundationBlueprint;
    getConsumerDependency(consumer: string): SharedFoundationConsumerDescriptor | {
        availableConsumers: FoundationConsumerKey[];
    };
    getDependencySummary(consumer: FoundationConsumerKey): SharedFoundationConsumerDescriptor | undefined;
    getOperationsAlertsCatalog(tenantContext?: RequestTenantContext): Promise<{
        generatedAt: string;
        alerts: ({
            acknowledgement: FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: FoundationAlertTimelineEntry | null;
            triageState: FoundationOperationsAlertTriageState;
            triageSummary: string;
            drilldownPath: string;
            ackPath: string;
            mutePath: string;
            unmutePath: string;
            code: "approvals-pending";
            defaultSummary: "存在待处理审批单";
            severityPolicy: "待处理审批单数量 >= 5 时为 high，否则为 medium";
            sourceModules: readonly ["trust-governance", "configuration-governance"];
            drilldownEnabled: true;
            acknowledgementEnabled: true;
        } | {
            acknowledgement: FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: FoundationAlertTimelineEntry | null;
            triageState: FoundationOperationsAlertTriageState;
            triageSummary: string;
            drilldownPath: string;
            ackPath: string;
            mutePath: string;
            unmutePath: string;
            code: "approval-execution-failures";
            defaultSummary: "存在执行失败且待人工确认的审批单";
            severityPolicy: "只要存在即为 high";
            sourceModules: readonly ["trust-governance", "configuration-governance"];
            drilldownEnabled: true;
            acknowledgementEnabled: true;
        } | {
            acknowledgement: FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: FoundationAlertTimelineEntry | null;
            triageState: FoundationOperationsAlertTriageState;
            triageSummary: string;
            drilldownPath: string;
            ackPath: string;
            mutePath: string;
            unmutePath: string;
            code: "high-risk-audits";
            defaultSummary: "存在高风险治理审计事件";
            severityPolicy: "高风险审计数量 >= 5 时为 high，否则为 medium";
            sourceModules: readonly ["trust-governance", "configuration-governance"];
            drilldownEnabled: true;
            acknowledgementEnabled: true;
        } | {
            acknowledgement: FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: FoundationAlertTimelineEntry | null;
            triageState: FoundationOperationsAlertTriageState;
            triageSummary: string;
            drilldownPath: string;
            ackPath: string;
            mutePath: string;
            unmutePath: string;
            code: "blocked-rate-limit-ledgers";
            defaultSummary: "存在被封禁中的配额账本";
            severityPolicy: "只要存在即为 medium";
            sourceModules: readonly ["trust-governance"];
            drilldownEnabled: true;
            acknowledgementEnabled: true;
        } | {
            acknowledgement: FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: FoundationAlertTimelineEntry | null;
            triageState: FoundationOperationsAlertTriageState;
            triageSummary: string;
            drilldownPath: string;
            ackPath: string;
            mutePath: string;
            unmutePath: string;
            code: "secret-rotation-attention";
            defaultSummary: "存在需要轮换或已过期的密钥";
            severityPolicy: "存在 expired secret 时为 high，否则为 medium";
            sourceModules: readonly ["configuration-governance"];
            drilldownEnabled: true;
            acknowledgementEnabled: true;
        } | {
            acknowledgement: FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: FoundationAlertTimelineEntry | null;
            triageState: FoundationOperationsAlertTriageState;
            triageSummary: string;
            drilldownPath: string;
            ackPath: string;
            mutePath: string;
            unmutePath: string;
            code: "observability-degradation";
            defaultSummary: "存在异常的 metrics/logs/traces 信号";
            severityPolicy: "critical 信号存在时为 high，否则为 medium";
            sourceModules: readonly ["resilience-operations"];
            drilldownEnabled: true;
            acknowledgementEnabled: true;
        } | {
            acknowledgement: FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: FoundationAlertTimelineEntry | null;
            triageState: FoundationOperationsAlertTriageState;
            triageSummary: string;
            drilldownPath: string;
            ackPath: string;
            mutePath: string;
            unmutePath: string;
            code: "recovery-drill-attention";
            defaultSummary: "存在待补演练或恢复预案关注项";
            severityPolicy: "attention 或 staleDrills > 0 时为 medium";
            sourceModules: readonly ["resilience-operations"];
            drilldownEnabled: true;
            acknowledgementEnabled: true;
        } | {
            acknowledgement: FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: FoundationAlertTimelineEntry | null;
            triageState: FoundationOperationsAlertTriageState;
            triageSummary: string;
            drilldownPath: string;
            ackPath: string;
            mutePath: string;
            unmutePath: string;
            code: "runtime-governance-backlog";
            defaultSummary: "存在待持续跟进的 runtime governance receipt";
            severityPolicy: "存在 high risk backlog 或 backlog >= 5 时为 high，否则为 medium";
            sourceModules: readonly ["runtime-governance"];
            drilldownEnabled: true;
            acknowledgementEnabled: true;
        } | {
            acknowledgement: FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: FoundationAlertTimelineEntry | null;
            triageState: FoundationOperationsAlertTriageState;
            triageSummary: string;
            drilldownPath: string;
            ackPath: string;
            mutePath: string;
            unmutePath: string;
            code: "runtime-callback-stalled";
            defaultSummary: "存在等待 callback 回写的 runtime receipt";
            severityPolicy: "只要存在等待 callback 的 receipt 即为 high";
            sourceModules: readonly ["runtime-governance"];
            drilldownEnabled: true;
            acknowledgementEnabled: true;
        } | {
            acknowledgement: FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: FoundationAlertTimelineEntry | null;
            triageState: FoundationOperationsAlertTriageState;
            triageSummary: string;
            drilldownPath: string;
            ackPath: string;
            mutePath: string;
            unmutePath: string;
            code: "lyt-connection-governance-risk";
            defaultSummary: "存在 LYT 门店连接治理风险";
            severityPolicy: "存在 high severity LYT 治理告警时为 high，否则为 medium";
            sourceModules: readonly ["integration-orchestration"];
            drilldownEnabled: true;
            acknowledgementEnabled: true;
        })[];
    }>;
    getOperationsOverview(tenantContext?: RequestTenantContext, runtimeFilter?: RuntimeGovernanceOverviewFilter): Promise<{
        generatedAt: string;
        summary: {
            approvalsPending: number;
            approvalsWithFailures: number;
            highRiskAudits: number;
            blockedLedgers: number;
            rotationDueSecrets: number;
            expiredSecrets: number;
            expiringCertificates: number;
            expiredCertificates: number;
            degradedSignals: number;
            attentionRecoveryPlans: number;
            staleDrills: number;
            runtimeGovernanceBacklog: number;
            stalledRuntimeCallbacks: number;
            highRiskRuntimeBacklog: number;
            runtimeBlockedActions: number;
            lytGovernanceAlertGroups: number;
            lytGovernanceAffectedStores: number;
        };
        alerts: {
            acknowledgement: FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: FoundationAlertTimelineEntry | null;
            triageState: FoundationOperationsAlertTriageState;
            triageSummary: string;
            severity: import("@m5/types").FoundationAlertSeverity;
            code: FoundationAlertCode;
            count: number;
            summary: string;
        }[];
        topFailures: {
            module: string;
            code: string;
            count: number;
        }[];
        topRisks: {
            acknowledgement: FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: FoundationAlertTimelineEntry | null;
            triageState: FoundationOperationsAlertTriageState;
            triageSummary: string;
            severity: import("@m5/types").FoundationAlertSeverity;
            code: FoundationAlertCode;
            count: number;
            summary: string;
        }[];
        moduleHealth: {
            trustGovernance: {
                module: string;
                score: number;
                status: string;
                indicators: {
                    highRiskAudits: number;
                    pendingApprovals: number;
                    executionFailures: number;
                    blockedCount: number;
                };
            };
            configurationGovernance: {
                module: string;
                score: number;
                status: string;
                indicators: {
                    highRiskAudits: number;
                    pendingApprovals: number;
                    executionFailures: number;
                    blockedCount: number;
                };
            };
            resilienceOperations: {
                module: string;
                score: number;
                status: string;
                indicators: {
                    highRiskAudits: number;
                    pendingApprovals: number;
                    executionFailures: number;
                    blockedCount: number;
                };
            };
            runtimeGovernance: {
                module: string;
                score: number;
                status: string;
                indicators: {
                    highRiskAudits: number;
                    pendingApprovals: number;
                    executionFailures: number;
                    blockedCount: number;
                };
            };
        };
        modules: {
            trustGovernance: Record<string, unknown>;
            configurationGovernance: Record<string, unknown>;
            resilienceOperations: Record<string, unknown>;
            runtimeGovernance: import("@m5/types").RuntimeGovernanceOperationsOverview;
            lytGovernance: import("../lyt/lyt.contract").LytConnectionGovernanceAlertsContract;
        };
    }>;
    getOperationsAlerts(tenantContext?: RequestTenantContext): Promise<{
        generatedAt: string;
        alerts: {
            acknowledgement: FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: FoundationAlertTimelineEntry | null;
            triageState: FoundationOperationsAlertTriageState;
            triageSummary: string;
            severity: import("@m5/types").FoundationAlertSeverity;
            code: FoundationAlertCode;
            count: number;
            summary: string;
        }[];
        topRisks: {
            acknowledgement: FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: FoundationAlertTimelineEntry | null;
            triageState: FoundationOperationsAlertTriageState;
            triageSummary: string;
            severity: import("@m5/types").FoundationAlertSeverity;
            code: FoundationAlertCode;
            count: number;
            summary: string;
        }[];
    }>;
    getOperationsModuleDetail(moduleKey: string, tenantContext?: RequestTenantContext): Promise<{
        generatedAt: string;
        moduleKey: string;
        availableModuleKeys: readonly ["trust-governance", "configuration-governance", "resilience-operations", "runtime-governance"];
        health?: undefined;
        detail?: undefined;
    } | {
        generatedAt: string;
        moduleKey: "configuration-governance" | "trust-governance" | "resilience-operations" | "runtime-governance";
        health: {
            module: string;
            score: number;
            status: string;
            indicators: {
                highRiskAudits: number;
                pendingApprovals: number;
                executionFailures: number;
                blockedCount: number;
            };
        };
        detail: Record<string, unknown> | import("@m5/types").RuntimeGovernanceOperationsOverview;
        availableModuleKeys?: undefined;
    }>;
    acknowledgeOperationsAlert(code: string, tenantContext: RequestTenantContext | undefined, actorContext: RequestActorContext | undefined, note?: string): Promise<{
        generatedAt: string;
        code: string;
        availableAlertCodes: readonly ["approvals-pending", "approval-execution-failures", "high-risk-audits", "blocked-rate-limit-ledgers", "secret-rotation-attention", "observability-degradation", "recovery-drill-attention", "runtime-governance-backlog", "runtime-callback-stalled", "lyt-connection-governance-risk"];
        catalog?: undefined;
        acknowledgement?: undefined;
        visibleInOverview?: undefined;
        availableActions?: undefined;
        history?: undefined;
    } | {
        generatedAt: string;
        code: string;
        catalog: FoundationAlertCatalogItem | null;
        acknowledgement: FoundationAlertAcknowledgement;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: FoundationAlertTimelineEntry[];
        availableAlertCodes?: undefined;
    }>;
    muteOperationsAlert(code: string, tenantContext: RequestTenantContext | undefined, actorContext: RequestActorContext | undefined, input?: {
        mutedUntil?: string;
        note?: string;
    }): Promise<{
        generatedAt: string;
        code: string;
        availableAlertCodes: readonly ["approvals-pending", "approval-execution-failures", "high-risk-audits", "blocked-rate-limit-ledgers", "secret-rotation-attention", "observability-degradation", "recovery-drill-attention", "runtime-governance-backlog", "runtime-callback-stalled", "lyt-connection-governance-risk"];
        catalog?: undefined;
        acknowledgement?: undefined;
        visibleInOverview?: undefined;
        availableActions?: undefined;
        history?: undefined;
    } | {
        generatedAt: string;
        code: string;
        catalog: FoundationAlertCatalogItem | null;
        acknowledgement: FoundationAlertAcknowledgement;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: FoundationAlertTimelineEntry[];
        availableAlertCodes?: undefined;
    }>;
    unmuteOperationsAlert(code: string, tenantContext: RequestTenantContext | undefined, actorContext: RequestActorContext | undefined, note?: string): Promise<{
        generatedAt: string;
        code: string;
        availableAlertCodes: readonly ["approvals-pending", "approval-execution-failures", "high-risk-audits", "blocked-rate-limit-ledgers", "secret-rotation-attention", "observability-degradation", "recovery-drill-attention", "runtime-governance-backlog", "runtime-callback-stalled", "lyt-connection-governance-risk"];
        catalog?: undefined;
        acknowledgement?: undefined;
        visibleInOverview?: undefined;
        availableActions?: undefined;
        history?: undefined;
    } | {
        generatedAt: string;
        code: string;
        catalog: FoundationAlertCatalogItem | null;
        acknowledgement: FoundationAlertAcknowledgement;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: FoundationAlertTimelineEntry[];
        availableAlertCodes?: undefined;
    }>;
    getOperationsAlertDrilldown(code: string, tenantContext?: RequestTenantContext): Promise<{
        generatedAt: string;
        code: string;
        availableAlertCodes: readonly ["approvals-pending", "approval-execution-failures", "high-risk-audits", "blocked-rate-limit-ledgers", "secret-rotation-attention", "observability-degradation", "recovery-drill-attention", "runtime-governance-backlog", "runtime-callback-stalled", "lyt-connection-governance-risk"];
        catalog?: undefined;
        alert?: undefined;
        acknowledgement?: undefined;
        visibleInOverview?: undefined;
        availableActions?: undefined;
        history?: undefined;
        detail?: undefined;
    } | {
        generatedAt: string;
        code: string;
        catalog: FoundationAlertCatalogItem | null;
        alert: {
            severity: string;
            code: "approvals-pending";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "approval-execution-failures";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "high-risk-audits";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "blocked-rate-limit-ledgers";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "secret-rotation-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "observability-degradation";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "recovery-drill-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-governance-backlog";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-callback-stalled";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "lyt-connection-governance-risk";
            count: number;
            summary: string;
            acknowledgement: null;
        } | null;
        acknowledgement: FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: FoundationAlertTimelineEntry[];
        detail: {
            total: number;
            limit: number;
            approvals: any[];
            topFailures?: undefined;
            audits?: undefined;
            sampled?: undefined;
            secrets?: undefined;
            certificates?: undefined;
            observability?: undefined;
            recovery?: undefined;
            receipts?: undefined;
            timeoutThresholds?: undefined;
            escalationSummary?: undefined;
            scope?: undefined;
            alerts?: undefined;
            topAlertCodes?: undefined;
            affectedStoreIds?: undefined;
            affectedCapabilities?: undefined;
            recommendedNextActions?: undefined;
        };
        availableAlertCodes?: undefined;
    } | {
        generatedAt: string;
        code: string;
        catalog: FoundationAlertCatalogItem | null;
        alert: {
            severity: string;
            code: "approvals-pending";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "approval-execution-failures";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "high-risk-audits";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "blocked-rate-limit-ledgers";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "secret-rotation-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "observability-degradation";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "recovery-drill-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-governance-backlog";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-callback-stalled";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "lyt-connection-governance-risk";
            count: number;
            summary: string;
            acknowledgement: null;
        } | null;
        acknowledgement: FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: FoundationAlertTimelineEntry[];
        detail: {
            total: number;
            limit: number;
            topFailures: {
                module: string;
                code: string;
                count: number;
            }[];
            approvals: any[];
            audits?: undefined;
            sampled?: undefined;
            secrets?: undefined;
            certificates?: undefined;
            observability?: undefined;
            recovery?: undefined;
            receipts?: undefined;
            timeoutThresholds?: undefined;
            escalationSummary?: undefined;
            scope?: undefined;
            alerts?: undefined;
            topAlertCodes?: undefined;
            affectedStoreIds?: undefined;
            affectedCapabilities?: undefined;
            recommendedNextActions?: undefined;
        };
        availableAlertCodes?: undefined;
    } | {
        generatedAt: string;
        code: string;
        catalog: FoundationAlertCatalogItem | null;
        alert: {
            severity: string;
            code: "approvals-pending";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "approval-execution-failures";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "high-risk-audits";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "blocked-rate-limit-ledgers";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "secret-rotation-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "observability-degradation";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "recovery-drill-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-governance-backlog";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-callback-stalled";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "lyt-connection-governance-risk";
            count: number;
            summary: string;
            acknowledgement: null;
        } | null;
        acknowledgement: FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: FoundationAlertTimelineEntry[];
        detail: {
            total: number;
            limit: number;
            audits: {
                module: string;
                audit: unknown;
            }[];
            approvals?: undefined;
            topFailures?: undefined;
            sampled?: undefined;
            secrets?: undefined;
            certificates?: undefined;
            observability?: undefined;
            recovery?: undefined;
            receipts?: undefined;
            timeoutThresholds?: undefined;
            escalationSummary?: undefined;
            scope?: undefined;
            alerts?: undefined;
            topAlertCodes?: undefined;
            affectedStoreIds?: undefined;
            affectedCapabilities?: undefined;
            recommendedNextActions?: undefined;
        };
        availableAlertCodes?: undefined;
    } | {
        generatedAt: string;
        code: string;
        catalog: FoundationAlertCatalogItem | null;
        alert: {
            severity: string;
            code: "approvals-pending";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "approval-execution-failures";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "high-risk-audits";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "blocked-rate-limit-ledgers";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "secret-rotation-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "observability-degradation";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "recovery-drill-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-governance-backlog";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-callback-stalled";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "lyt-connection-governance-risk";
            count: number;
            summary: string;
            acknowledgement: null;
        } | null;
        acknowledgement: FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: FoundationAlertTimelineEntry[];
        detail: {
            total: number;
            sampled: {
                metadata?: Record<string, unknown> | undefined;
            }[];
            limit?: undefined;
            approvals?: undefined;
            topFailures?: undefined;
            audits?: undefined;
            secrets?: undefined;
            certificates?: undefined;
            observability?: undefined;
            recovery?: undefined;
            receipts?: undefined;
            timeoutThresholds?: undefined;
            escalationSummary?: undefined;
            scope?: undefined;
            alerts?: undefined;
            topAlertCodes?: undefined;
            affectedStoreIds?: undefined;
            affectedCapabilities?: undefined;
            recommendedNextActions?: undefined;
        };
        availableAlertCodes?: undefined;
    } | {
        generatedAt: string;
        code: string;
        catalog: FoundationAlertCatalogItem | null;
        alert: {
            severity: string;
            code: "approvals-pending";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "approval-execution-failures";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "high-risk-audits";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "blocked-rate-limit-ledgers";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "secret-rotation-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "observability-degradation";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "recovery-drill-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-governance-backlog";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-callback-stalled";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "lyt-connection-governance-risk";
            count: number;
            summary: string;
            acknowledgement: null;
        } | null;
        acknowledgement: FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: FoundationAlertTimelineEntry[];
        detail: {
            total: number;
            secrets: {
                status?: string | undefined;
                expiresAt?: string | null | undefined;
            }[];
            certificates: {
                status?: string | undefined;
                expiresAt?: string | null | undefined;
            }[];
            limit?: undefined;
            approvals?: undefined;
            topFailures?: undefined;
            audits?: undefined;
            sampled?: undefined;
            observability?: undefined;
            recovery?: undefined;
            receipts?: undefined;
            timeoutThresholds?: undefined;
            escalationSummary?: undefined;
            scope?: undefined;
            alerts?: undefined;
            topAlertCodes?: undefined;
            affectedStoreIds?: undefined;
            affectedCapabilities?: undefined;
            recommendedNextActions?: undefined;
        };
        availableAlertCodes?: undefined;
    } | {
        generatedAt: string;
        code: string;
        catalog: FoundationAlertCatalogItem | null;
        alert: {
            severity: string;
            code: "approvals-pending";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "approval-execution-failures";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "high-risk-audits";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "blocked-rate-limit-ledgers";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "secret-rotation-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "observability-degradation";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "recovery-drill-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-governance-backlog";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-callback-stalled";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "lyt-connection-governance-risk";
            count: number;
            summary: string;
            acknowledgement: null;
        } | null;
        acknowledgement: FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: FoundationAlertTimelineEntry[];
        detail: {
            total: number;
            observability: unknown;
            limit?: undefined;
            approvals?: undefined;
            topFailures?: undefined;
            audits?: undefined;
            sampled?: undefined;
            secrets?: undefined;
            certificates?: undefined;
            recovery?: undefined;
            receipts?: undefined;
            timeoutThresholds?: undefined;
            escalationSummary?: undefined;
            scope?: undefined;
            alerts?: undefined;
            topAlertCodes?: undefined;
            affectedStoreIds?: undefined;
            affectedCapabilities?: undefined;
            recommendedNextActions?: undefined;
        };
        availableAlertCodes?: undefined;
    } | {
        generatedAt: string;
        code: string;
        catalog: FoundationAlertCatalogItem | null;
        alert: {
            severity: string;
            code: "approvals-pending";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "approval-execution-failures";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "high-risk-audits";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "blocked-rate-limit-ledgers";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "secret-rotation-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "observability-degradation";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "recovery-drill-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-governance-backlog";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-callback-stalled";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "lyt-connection-governance-risk";
            count: number;
            summary: string;
            acknowledgement: null;
        } | null;
        acknowledgement: FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: FoundationAlertTimelineEntry[];
        detail: {
            total: number;
            recovery: unknown;
            limit?: undefined;
            approvals?: undefined;
            topFailures?: undefined;
            audits?: undefined;
            sampled?: undefined;
            secrets?: undefined;
            certificates?: undefined;
            observability?: undefined;
            receipts?: undefined;
            timeoutThresholds?: undefined;
            escalationSummary?: undefined;
            scope?: undefined;
            alerts?: undefined;
            topAlertCodes?: undefined;
            affectedStoreIds?: undefined;
            affectedCapabilities?: undefined;
            recommendedNextActions?: undefined;
        };
        availableAlertCodes?: undefined;
    } | {
        generatedAt: string;
        code: string;
        catalog: FoundationAlertCatalogItem | null;
        alert: {
            severity: string;
            code: "approvals-pending";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "approval-execution-failures";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "high-risk-audits";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "blocked-rate-limit-ledgers";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "secret-rotation-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "observability-degradation";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "recovery-drill-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-governance-backlog";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-callback-stalled";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "lyt-connection-governance-risk";
            count: number;
            summary: string;
            acknowledgement: null;
        } | null;
        acknowledgement: FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: FoundationAlertTimelineEntry[];
        detail: {
            total: number;
            receipts: unknown[];
            limit?: undefined;
            approvals?: undefined;
            topFailures?: undefined;
            audits?: undefined;
            sampled?: undefined;
            secrets?: undefined;
            certificates?: undefined;
            observability?: undefined;
            recovery?: undefined;
            timeoutThresholds?: undefined;
            escalationSummary?: undefined;
            scope?: undefined;
            alerts?: undefined;
            topAlertCodes?: undefined;
            affectedStoreIds?: undefined;
            affectedCapabilities?: undefined;
            recommendedNextActions?: undefined;
        };
        availableAlertCodes?: undefined;
    } | {
        generatedAt: string;
        code: string;
        catalog: FoundationAlertCatalogItem | null;
        alert: {
            severity: string;
            code: "approvals-pending";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "approval-execution-failures";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "high-risk-audits";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "blocked-rate-limit-ledgers";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "secret-rotation-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "observability-degradation";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "recovery-drill-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-governance-backlog";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-callback-stalled";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "lyt-connection-governance-risk";
            count: number;
            summary: string;
            acknowledgement: null;
        } | null;
        acknowledgement: FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: FoundationAlertTimelineEntry[];
        detail: {
            total: number;
            timeoutThresholds: {
                readonly low: number;
                readonly medium: number;
                readonly high: number;
            };
            escalationSummary: {
                waitCallback: number;
                scheduleReplay: number;
                openManualReview: number;
            };
            receipts: RuntimeGovernanceCallbackStallDetail[];
            limit?: undefined;
            approvals?: undefined;
            topFailures?: undefined;
            audits?: undefined;
            sampled?: undefined;
            secrets?: undefined;
            certificates?: undefined;
            observability?: undefined;
            recovery?: undefined;
            scope?: undefined;
            alerts?: undefined;
            topAlertCodes?: undefined;
            affectedStoreIds?: undefined;
            affectedCapabilities?: undefined;
            recommendedNextActions?: undefined;
        };
        availableAlertCodes?: undefined;
    } | {
        generatedAt: string;
        code: string;
        catalog: FoundationAlertCatalogItem | null;
        alert: {
            severity: string;
            code: "approvals-pending";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "approval-execution-failures";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "high-risk-audits";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "blocked-rate-limit-ledgers";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "secret-rotation-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "observability-degradation";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "recovery-drill-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-governance-backlog";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-callback-stalled";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "lyt-connection-governance-risk";
            count: number;
            summary: string;
            acknowledgement: null;
        } | null;
        acknowledgement: FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: FoundationAlertTimelineEntry[];
        detail: {
            total: number;
            scope: Record<string, unknown>;
            alerts: any[];
            topAlertCodes: string[];
            affectedStoreIds: string[];
            affectedCapabilities: string[];
            recommendedNextActions: string[];
            limit?: undefined;
            approvals?: undefined;
            topFailures?: undefined;
            audits?: undefined;
            sampled?: undefined;
            secrets?: undefined;
            certificates?: undefined;
            observability?: undefined;
            recovery?: undefined;
            receipts?: undefined;
            timeoutThresholds?: undefined;
            escalationSummary?: undefined;
        };
        availableAlertCodes?: undefined;
    } | {
        generatedAt: string;
        code: string;
        catalog: FoundationAlertCatalogItem | null;
        alert: {
            severity: string;
            code: "approvals-pending";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "approval-execution-failures";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "high-risk-audits";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "blocked-rate-limit-ledgers";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "secret-rotation-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "observability-degradation";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "recovery-drill-attention";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-governance-backlog";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "runtime-callback-stalled";
            count: number;
            summary: string;
            acknowledgement: null;
        } | {
            severity: string;
            code: "lyt-connection-governance-risk";
            count: number;
            summary: string;
            acknowledgement: null;
        } | null;
        acknowledgement: FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: FoundationAlertTimelineEntry[];
        detail: null;
        availableAlertCodes?: undefined;
    }>;
    private recordAlertMutationHistory;
    private getAlertHistory;
    private getLatestAlertActivityMap;
    private getAlertAcknowledgementMap;
    private buildOperationsAlertReadModels;
    private getAlertAcknowledgement;
    private getLytGovernanceAlerts;
}
//# sourceMappingURL=foundation.service.d.ts.map