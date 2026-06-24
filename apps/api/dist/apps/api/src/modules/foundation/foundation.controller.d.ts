import type { RequestTenantContext } from '../tenant/tenant.types';
import { type CurrentActorValue } from './identity-access/identity-access.decorator';
import { FoundationService } from './foundation.service';
import type { RuntimeGovernanceOverviewFilter } from '@m5/types';
export declare class FoundationController {
    private readonly foundationService;
    constructor(foundationService: FoundationService);
    getBootstrap(tenantContext: RequestTenantContext): {
        generatedAt: string;
        docs: string[];
        guardrails: string[];
        frontendBootstrap: import("@m5/types").UnifiedFoundationBootstrapContract;
        modules: import("@m5/types").FoundationModuleDescriptor[];
        consumers: import("@m5/types").FoundationConsumerDescriptor[];
        governanceBaselines: import("@m5/types").FoundationGovernanceBaseline[];
        tenantContext: RequestTenantContext;
    };
    getModules(): import("@m5/types").FoundationModuleDescriptor[];
    getOperationsOverview(tenantContext: RequestTenantContext | undefined, runtimeFocus?: RuntimeGovernanceOverviewFilter['focus'], runtimeState?: RuntimeGovernanceOverviewFilter['state'], runtimeCallbackStatus?: RuntimeGovernanceOverviewFilter['callbackStatus'], runtimeRiskLevel?: RuntimeGovernanceOverviewFilter['riskLevel'], runtimeReplayable?: string, runtimeStalledOnly?: string): Promise<{
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
            acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: import("@m5/types").FoundationAlertTimelineEntry | null;
            triageState: import("@m5/types").FoundationOperationsAlertTriageState;
            triageSummary: string;
            severity: import("@m5/types").FoundationAlertSeverity;
            code: import("@m5/types").FoundationAlertCode;
            count: number;
            summary: string;
        }[];
        topFailures: {
            module: string;
            code: string;
            count: number;
        }[];
        topRisks: {
            acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: import("@m5/types").FoundationAlertTimelineEntry | null;
            triageState: import("@m5/types").FoundationOperationsAlertTriageState;
            triageSummary: string;
            severity: import("@m5/types").FoundationAlertSeverity;
            code: import("@m5/types").FoundationAlertCode;
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
    getOperationsAlerts(tenantContext: RequestTenantContext | undefined): Promise<{
        generatedAt: string;
        alerts: {
            acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: import("@m5/types").FoundationAlertTimelineEntry | null;
            triageState: import("@m5/types").FoundationOperationsAlertTriageState;
            triageSummary: string;
            severity: import("@m5/types").FoundationAlertSeverity;
            code: import("@m5/types").FoundationAlertCode;
            count: number;
            summary: string;
        }[];
        topRisks: {
            acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: import("@m5/types").FoundationAlertTimelineEntry | null;
            triageState: import("@m5/types").FoundationOperationsAlertTriageState;
            triageSummary: string;
            severity: import("@m5/types").FoundationAlertSeverity;
            code: import("@m5/types").FoundationAlertCode;
            count: number;
            summary: string;
        }[];
    }>;
    getOperationsAlertsCatalog(tenantContext: RequestTenantContext | undefined): Promise<{
        generatedAt: string;
        alerts: ({
            acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: import("@m5/types").FoundationAlertTimelineEntry | null;
            triageState: import("@m5/types").FoundationOperationsAlertTriageState;
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
            acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: import("@m5/types").FoundationAlertTimelineEntry | null;
            triageState: import("@m5/types").FoundationOperationsAlertTriageState;
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
            acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: import("@m5/types").FoundationAlertTimelineEntry | null;
            triageState: import("@m5/types").FoundationOperationsAlertTriageState;
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
            acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: import("@m5/types").FoundationAlertTimelineEntry | null;
            triageState: import("@m5/types").FoundationOperationsAlertTriageState;
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
            acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: import("@m5/types").FoundationAlertTimelineEntry | null;
            triageState: import("@m5/types").FoundationOperationsAlertTriageState;
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
            acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: import("@m5/types").FoundationAlertTimelineEntry | null;
            triageState: import("@m5/types").FoundationOperationsAlertTriageState;
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
            acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: import("@m5/types").FoundationAlertTimelineEntry | null;
            triageState: import("@m5/types").FoundationOperationsAlertTriageState;
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
            acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: import("@m5/types").FoundationAlertTimelineEntry | null;
            triageState: import("@m5/types").FoundationOperationsAlertTriageState;
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
            acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: import("@m5/types").FoundationAlertTimelineEntry | null;
            triageState: import("@m5/types").FoundationOperationsAlertTriageState;
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
            acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
            visibleInOverview: boolean;
            availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
            recentOperation: import("@m5/types").FoundationAlertTimelineEntry | null;
            triageState: import("@m5/types").FoundationOperationsAlertTriageState;
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
    getOperationsAlertDrilldown(code: string, tenantContext: RequestTenantContext | undefined): Promise<{
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
        catalog: import("@m5/types").FoundationAlertCatalogItem | null;
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
        acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: import("@m5/types").FoundationAlertTimelineEntry[];
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
        catalog: import("@m5/types").FoundationAlertCatalogItem | null;
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
        acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: import("@m5/types").FoundationAlertTimelineEntry[];
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
        catalog: import("@m5/types").FoundationAlertCatalogItem | null;
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
        acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: import("@m5/types").FoundationAlertTimelineEntry[];
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
        catalog: import("@m5/types").FoundationAlertCatalogItem | null;
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
        acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: import("@m5/types").FoundationAlertTimelineEntry[];
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
        catalog: import("@m5/types").FoundationAlertCatalogItem | null;
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
        acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: import("@m5/types").FoundationAlertTimelineEntry[];
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
        catalog: import("@m5/types").FoundationAlertCatalogItem | null;
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
        acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: import("@m5/types").FoundationAlertTimelineEntry[];
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
        catalog: import("@m5/types").FoundationAlertCatalogItem | null;
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
        acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: import("@m5/types").FoundationAlertTimelineEntry[];
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
        catalog: import("@m5/types").FoundationAlertCatalogItem | null;
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
        acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: import("@m5/types").FoundationAlertTimelineEntry[];
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
        catalog: import("@m5/types").FoundationAlertCatalogItem | null;
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
        acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: import("@m5/types").FoundationAlertTimelineEntry[];
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
            receipts: import("@m5/types").RuntimeGovernanceCallbackStallDetail[];
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
        catalog: import("@m5/types").FoundationAlertCatalogItem | null;
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
        acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: import("@m5/types").FoundationAlertTimelineEntry[];
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
        catalog: import("@m5/types").FoundationAlertCatalogItem | null;
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
        acknowledgement: import("@m5/types").FoundationAlertAcknowledgement | null;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: import("@m5/types").FoundationAlertTimelineEntry[];
        detail: null;
        availableAlertCodes?: undefined;
    }>;
    acknowledgeOperationsAlert(code: string, tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue, body: {
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
        catalog: import("@m5/types").FoundationAlertCatalogItem | null;
        acknowledgement: import("@m5/types").FoundationAlertAcknowledgement;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: import("@m5/types").FoundationAlertTimelineEntry[];
        availableAlertCodes?: undefined;
    }>;
    muteOperationsAlert(code: string, tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue, body: {
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
        catalog: import("@m5/types").FoundationAlertCatalogItem | null;
        acknowledgement: import("@m5/types").FoundationAlertAcknowledgement;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: import("@m5/types").FoundationAlertTimelineEntry[];
        availableAlertCodes?: undefined;
    }>;
    unmuteOperationsAlert(code: string, tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue, body: {
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
        catalog: import("@m5/types").FoundationAlertCatalogItem | null;
        acknowledgement: import("@m5/types").FoundationAlertAcknowledgement;
        visibleInOverview: boolean;
        availableActions: ("DRILLDOWN" | "ACK" | "MUTE" | "UNMUTE")[];
        history: import("@m5/types").FoundationAlertTimelineEntry[];
        availableAlertCodes?: undefined;
    }>;
    getOperationsModuleDetail(moduleKey: string, tenantContext: RequestTenantContext | undefined): Promise<{
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
    getConsumers(): import("@m5/types").FoundationConsumerDescriptor[];
    getConsumer(consumer: string): import("@m5/types").FoundationConsumerDescriptor | {
        availableConsumers: import("@m5/types").FoundationConsumerKey[];
    };
}
//# sourceMappingURL=foundation.controller.d.ts.map