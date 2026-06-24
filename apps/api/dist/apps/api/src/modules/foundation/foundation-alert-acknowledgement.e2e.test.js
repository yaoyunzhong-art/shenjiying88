"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const foundation_service_1 = require("./foundation.service");
function buildIdentityAccessStub() {
    return {
        getDescriptor: () => ({
            key: 'identity-access',
            name: 'Identity Access Module',
            purpose: 'stub',
            inboundContracts: [],
            outboundContracts: [],
            capabilities: []
        })
    };
}
function buildIntegrationStub(key) {
    return {
        getDescriptor: () => ({
            key,
            name: key,
            purpose: 'stub',
            inboundContracts: [],
            outboundContracts: [],
            capabilities: []
        }),
        getOperationsOverview: async () => ({
            observability: { degradedSignals: 0, byStatus: {} },
            recovery: { attentionRequired: 0, staleDrills: 0 }
        })
    };
}
function buildRuntimeGovernanceStub(input) {
    return {
        getDescriptor: () => ({
            key: 'runtime-governance',
            name: 'runtime-governance',
            purpose: 'stub',
            inboundContracts: [],
            outboundContracts: [],
            capabilities: []
        }),
        getOperationsOverview: async () => ({
            generatedAt: '2026-06-13T00:00:00.000Z',
            summary: {
                backlog: input?.summary?.backlog ?? 0,
                stalledCallbacks: input?.summary?.stalledCallbacks ?? 0,
                highRiskBacklog: input?.summary?.highRiskBacklog ?? 0,
                blockedActions: input?.summary?.blockedActions ?? 0
            },
            receipts: input?.receipts ?? [],
            stalledReceipts: input?.stalledReceipts ?? []
        })
    };
}
function buildLytGovernanceQueryStub(input) {
    return {
        getConnectionGovernanceAlerts: async () => ({
            generatedAt: '2026-06-13T00:00:00.000Z',
            scope: { tenantId: 'tenant-demo', brandId: 'brand-demo' },
            alerts: input?.alerts ?? []
        })
    };
}
(0, node_test_1.default)('e2e: foundation overview filters muted alerts and annotates acknowledgement', async () => {
    const now = Date.now();
    const future = new Date(now + 60 * 60 * 1000);
    const prisma = {
        foundationAlertAcknowledgement: {
            findMany: async () => [
                {
                    code: 'secret-rotation-attention',
                    status: 'MUTED',
                    note: 'ops muted',
                    actorId: 'ops-admin',
                    acknowledgedAt: new Date(now - 1000),
                    mutedUntil: future,
                    updatedAt: new Date(now - 500)
                }
            ]
        }
    };
    const trustGovernanceService = {
        getDescriptor: () => ({
            key: 'trust-governance',
            name: 'trust-governance',
            purpose: 'stub',
            inboundContracts: [],
            outboundContracts: [],
            capabilities: []
        }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 1 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            rateLimit: { ledgers: { blocked: 0 } }
        })
    };
    const configurationGovernanceService = {
        getDescriptor: () => ({
            key: 'configuration-governance',
            name: 'configuration-governance',
            purpose: 'stub',
            inboundContracts: [],
            outboundContracts: [],
            capabilities: []
        }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            configuration: {
                secrets: { rotationDue: 2, expired: 0 },
                certificates: { expiringSoon: 0, expired: 0 }
            }
        })
    };
    const service = new foundation_service_1.FoundationService(buildIdentityAccessStub(), configurationGovernanceService, buildIntegrationStub('integration-orchestration'), trustGovernanceService, buildIntegrationStub('resilience-operations'), buildIntegrationStub('runtime-governance'), prisma);
    const overview = await service.getOperationsOverview({ tenantId: 'tenant-demo' });
    strict_1.default.equal(Array.isArray(overview.alerts), true);
    strict_1.default.equal(overview.alerts.some((alert) => alert.code === 'secret-rotation-attention'), false);
    strict_1.default.equal(overview.alerts.some((alert) => alert.code === 'approvals-pending'), true);
});
(0, node_test_1.default)('e2e: foundation overview carries triage and recent operation for visible alerts', async () => {
    const now = new Date('2026-06-13T00:05:00.000Z');
    const prisma = {
        foundationAlertAcknowledgement: {
            findMany: async () => [
                {
                    code: 'approvals-pending',
                    status: 'ACKED',
                    note: 'already handled',
                    actorId: 'ops-admin',
                    acknowledgedAt: new Date(now.getTime() - 1000),
                    mutedUntil: null,
                    updatedAt: now
                }
            ]
        },
        auditLog: {
            findMany: async () => [
                {
                    action: 'foundation.operations.alerts.ack',
                    resourceId: 'approvals-pending',
                    operatorId: 'ops-admin',
                    sourceChannel: 'foundation-alerts',
                    payload: {
                        note: 'already handled',
                        visibleInOverview: true
                    },
                    createdAt: now
                }
            ]
        }
    };
    const trustGovernanceService = {
        getDescriptor: () => ({
            key: 'trust-governance',
            name: 'trust-governance',
            purpose: 'stub',
            inboundContracts: [],
            outboundContracts: [],
            capabilities: []
        }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 3 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            rateLimit: { ledgers: { blocked: 0 } }
        })
    };
    const configurationGovernanceService = {
        getDescriptor: () => ({
            key: 'configuration-governance',
            name: 'configuration-governance',
            purpose: 'stub',
            inboundContracts: [],
            outboundContracts: [],
            capabilities: []
        }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            configuration: {
                secrets: { rotationDue: 0, expired: 0 },
                certificates: { expiringSoon: 0, expired: 0 }
            }
        })
    };
    const service = new foundation_service_1.FoundationService(buildIdentityAccessStub(), configurationGovernanceService, buildIntegrationStub('integration-orchestration'), trustGovernanceService, buildIntegrationStub('resilience-operations'), buildIntegrationStub('runtime-governance'), prisma);
    const overview = await service.getOperationsOverview({ tenantId: 'tenant-demo' });
    const approvalsPending = overview.alerts.find((alert) => alert.code === 'approvals-pending');
    strict_1.default.equal(approvalsPending?.acknowledgement?.status, 'ACKED');
    strict_1.default.equal(approvalsPending?.visibleInOverview, true);
    strict_1.default.equal(approvalsPending?.recentOperation?.action, 'ACK');
    strict_1.default.equal(approvalsPending?.recentOperation?.actorId, 'ops-admin');
    strict_1.default.equal(approvalsPending?.triageState, 'acknowledged');
    strict_1.default.equal(approvalsPending?.triageSummary?.includes('已确认'), true);
    strict_1.default.equal(overview.topRisks[0]?.code, 'approvals-pending');
    strict_1.default.equal(overview.topRisks[0]?.recentOperation?.actorId, 'ops-admin');
});
(0, node_test_1.default)('e2e: foundation alert catalog carries recent operation summary', async () => {
    const now = new Date('2026-06-13T00:05:00.000Z');
    const future = new Date(now.getTime() + 60 * 60 * 1000);
    const prisma = {
        foundationAlertAcknowledgement: {
            findMany: async () => [
                {
                    code: 'secret-rotation-attention',
                    status: 'MUTED',
                    note: 'ops muted',
                    actorId: 'ops-admin',
                    acknowledgedAt: new Date(now.getTime() - 1000),
                    mutedUntil: future,
                    updatedAt: now
                }
            ]
        },
        auditLog: {
            findMany: async () => [
                {
                    action: 'foundation.operations.alerts.mute',
                    resourceId: 'secret-rotation-attention',
                    operatorId: 'ops-admin',
                    sourceChannel: 'foundation-alerts',
                    payload: {
                        note: 'ops muted',
                        mutedUntil: future.toISOString(),
                        visibleInOverview: false
                    },
                    createdAt: now
                }
            ]
        }
    };
    const trustGovernanceService = {
        getDescriptor: () => ({
            key: 'trust-governance',
            name: 'trust-governance',
            purpose: 'stub',
            inboundContracts: [],
            outboundContracts: [],
            capabilities: []
        }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            rateLimit: { ledgers: { blocked: 0 } }
        })
    };
    const configurationGovernanceService = {
        getDescriptor: () => ({
            key: 'configuration-governance',
            name: 'configuration-governance',
            purpose: 'stub',
            inboundContracts: [],
            outboundContracts: [],
            capabilities: []
        }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            configuration: {
                secrets: { rotationDue: 1, expired: 0 },
                certificates: { expiringSoon: 0, expired: 0 }
            }
        })
    };
    const service = new foundation_service_1.FoundationService(buildIdentityAccessStub(), configurationGovernanceService, buildIntegrationStub('integration-orchestration'), trustGovernanceService, buildIntegrationStub('resilience-operations'), buildIntegrationStub('runtime-governance'), prisma);
    const catalog = await service.getOperationsAlertsCatalog({ tenantId: 'tenant-demo' });
    const secretRotation = catalog.alerts.find((item) => item.code === 'secret-rotation-attention');
    strict_1.default.equal(secretRotation?.acknowledgement?.status, 'MUTED');
    strict_1.default.equal(secretRotation?.recentOperation?.action, 'MUTE');
    strict_1.default.equal(secretRotation?.recentOperation?.actorId, 'ops-admin');
    strict_1.default.equal(['muted', 'expired-mute'].includes(secretRotation?.triageState ?? ''), true);
    strict_1.default.equal((secretRotation?.triageSummary?.includes('已静默') ?? false) ||
        (secretRotation?.triageSummary?.includes('静默已到期') ?? false), true);
});
(0, node_test_1.default)('e2e: foundation alert drilldown keeps muted alert context for operations follow-up', async () => {
    const now = Date.now();
    const future = new Date(now + 60 * 60 * 1000);
    const prisma = {
        foundationAlertAcknowledgement: {
            findMany: async ({ where } = {}) => {
                const codes = where?.code?.in ?? [];
                return codes.includes('secret-rotation-attention')
                    ? [
                        {
                            code: 'secret-rotation-attention',
                            status: 'MUTED',
                            note: 'ops muted',
                            actorId: 'ops-admin',
                            acknowledgedAt: new Date(now - 1000),
                            mutedUntil: future,
                            updatedAt: new Date(now - 500)
                        }
                    ]
                    : [];
            }
        },
        auditLog: {
            findMany: async () => [
                {
                    action: 'foundation.operations.alerts.mute',
                    operatorId: 'ops-admin',
                    sourceChannel: 'foundation-alerts',
                    payload: {
                        note: 'ops muted',
                        mutedUntil: future.toISOString(),
                        visibleInOverview: false
                    },
                    createdAt: new Date(now - 500)
                }
            ]
        }
    };
    const trustGovernanceService = {
        getDescriptor: () => ({
            key: 'trust-governance',
            name: 'trust-governance',
            purpose: 'stub',
            inboundContracts: [],
            outboundContracts: [],
            capabilities: []
        }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            rateLimit: { ledgers: { blocked: 0 } }
        }),
        listGovernanceApprovals: async () => [],
        getAuditRecords: async () => [],
        listQuotaLedgers: async () => []
    };
    const configurationGovernanceService = {
        getDescriptor: () => ({
            key: 'configuration-governance',
            name: 'configuration-governance',
            purpose: 'stub',
            inboundContracts: [],
            outboundContracts: [],
            capabilities: []
        }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            configuration: {
                secrets: { rotationDue: 2, expired: 0 },
                certificates: { expiringSoon: 0, expired: 0 }
            }
        }),
        getSecretMetadata: async () => [{ status: 'rotation-due', expiresAt: new Date(now + 24 * 60 * 60 * 1000).toISOString() }],
        getCertificateMetadata: async () => []
    };
    const service = new foundation_service_1.FoundationService(buildIdentityAccessStub(), configurationGovernanceService, buildIntegrationStub('integration-orchestration'), trustGovernanceService, buildIntegrationStub('resilience-operations'), buildIntegrationStub('runtime-governance'), prisma);
    const drilldown = await service.getOperationsAlertDrilldown('secret-rotation-attention', { tenantId: 'tenant-demo' });
    strict_1.default.equal(drilldown.code, 'secret-rotation-attention');
    strict_1.default.equal(drilldown.visibleInOverview, false);
    strict_1.default.equal(drilldown.alert?.count, 2);
    strict_1.default.equal(drilldown.acknowledgement?.status, 'MUTED');
    strict_1.default.equal(drilldown.catalog?.acknowledgementEnabled, true);
    strict_1.default.equal(drilldown.availableActions?.includes('UNMUTE'), true);
    strict_1.default.equal(drilldown.history?.[0]?.action, 'MUTE');
});
(0, node_test_1.default)('e2e: foundation alert mutation returns persisted history timeline', async () => {
    const now = new Date('2026-06-13T00:05:00.000Z');
    const auditLogs = [];
    const acknowledgements = new Map();
    const prisma = {
        foundationAlertAcknowledgement: {
            upsert: async ({ where, create, update }) => {
                const key = `${where.tenantId_code.tenantId}:${where.tenantId_code.code}`;
                const next = {
                    id: key,
                    ...(acknowledgements.get(key) ?? create),
                    ...update,
                    createdAt: acknowledgements.get(key)?.createdAt ?? now,
                    updatedAt: now
                };
                acknowledgements.set(key, next);
                return next;
            },
            findMany: async () => Array.from(acknowledgements.values())
        },
        auditLog: {
            create: async ({ data }) => {
                const persisted = { ...data, createdAt: now };
                auditLogs.unshift(persisted);
                return persisted;
            },
            findMany: async () => auditLogs
        }
    };
    const service = new foundation_service_1.FoundationService(buildIdentityAccessStub(), {
        getDescriptor: () => ({ key: 'configuration-governance', name: 'cfg', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] })
    }, buildIntegrationStub('integration-orchestration'), {
        getDescriptor: () => ({ key: 'trust-governance', name: 'trust', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] })
    }, buildIntegrationStub('resilience-operations'), buildIntegrationStub('runtime-governance'), prisma);
    const mutation = await service.acknowledgeOperationsAlert('observability-degradation', { tenantId: 'tenant-demo' }, { actorId: 'ops-admin' }, 'handled');
    strict_1.default.equal(mutation.acknowledgement?.status, 'ACKED');
    strict_1.default.equal(mutation.history?.length, 1);
    strict_1.default.equal(mutation.history?.[0]?.action, 'ACK');
    strict_1.default.equal(mutation.history?.[0]?.actorId, 'ops-admin');
});
(0, node_test_1.default)('e2e: foundation overview surfaces runtime governance alerts and module health', async () => {
    const service = new foundation_service_1.FoundationService(buildIdentityAccessStub(), {
        getDescriptor: () => ({ key: 'configuration-governance', name: 'cfg', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            configuration: {
                secrets: { rotationDue: 0, expired: 0 },
                certificates: { expiringSoon: 0, expired: 0 }
            }
        })
    }, buildIntegrationStub('integration-orchestration'), {
        getDescriptor: () => ({ key: 'trust-governance', name: 'trust', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            rateLimit: { ledgers: { blocked: 0 } }
        })
    }, buildIntegrationStub('resilience-operations'), buildRuntimeGovernanceStub({
        summary: {
            backlog: 3,
            stalledCallbacks: 1,
            highRiskBacklog: 1,
            blockedActions: 1
        },
        receipts: [
            {
                receiptCode: 'RUNTIME-001',
                riskLevel: 'high',
                state: 'submitted',
                callback: { callbackStatus: 'awaiting-callback' }
            }
        ]
    }), {
        foundationAlertAcknowledgement: { findMany: async () => [] },
        auditLog: { findMany: async () => [] }
    });
    const overview = await service.getOperationsOverview({ tenantId: 'tenant-demo' });
    strict_1.default.equal(overview.summary.runtimeGovernanceBacklog, 3);
    strict_1.default.equal(overview.summary.stalledRuntimeCallbacks, 1);
    strict_1.default.equal(overview.alerts.some((alert) => alert.code === 'runtime-governance-backlog'), true);
    strict_1.default.equal(overview.alerts.some((alert) => alert.code === 'runtime-callback-stalled'), true);
    strict_1.default.equal(overview.moduleHealth.runtimeGovernance.status, 'critical');
});
(0, node_test_1.default)('e2e: foundation runtime callback stalled drilldown returns timeout thresholds and escalation detail', async () => {
    const service = new foundation_service_1.FoundationService(buildIdentityAccessStub(), {
        getDescriptor: () => ({ key: 'configuration-governance', name: 'cfg', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            configuration: {
                secrets: { rotationDue: 0, expired: 0 },
                certificates: { expiringSoon: 0, expired: 0 }
            }
        })
    }, buildIntegrationStub('integration-orchestration'), {
        getDescriptor: () => ({ key: 'trust-governance', name: 'trust', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            rateLimit: { ledgers: { blocked: 0 } }
        })
    }, buildIntegrationStub('resilience-operations'), buildRuntimeGovernanceStub({
        summary: {
            backlog: 3,
            stalledCallbacks: 2,
            highRiskBacklog: 1,
            blockedActions: 0
        },
        stalledReceipts: [
            {
                receiptCode: 'RUNTIME-001',
                app: 'miniapp',
                action: 'booking-submit',
                riskLevel: 'high',
                handlerName: 'miniapp-booking-submit-handler',
                callbackStatus: 'awaiting-callback',
                replayable: true,
                scopeKey: 'miniapp:booking-submit:tenant-demo',
                latestEventType: 'runtime-governance.handler.sync.requested',
                stalled: true,
                timeoutMs: 300000,
                elapsedMs: 420000,
                exceededMs: 120000,
                escalationAction: 'SCHEDULE_REPLAY',
                summary: 'callback 超时未回写，建议进入 replay 补偿。'
            },
            {
                receiptCode: 'RUNTIME-002',
                app: 'app',
                action: 'member-login',
                riskLevel: 'medium',
                handlerName: 'native-member-session-handler',
                callbackStatus: 'awaiting-callback',
                replayable: false,
                scopeKey: 'app:member-login:tenant-demo',
                latestEventType: 'runtime-governance.handler.sync.requested',
                stalled: true,
                timeoutMs: 600000,
                elapsedMs: 780000,
                exceededMs: 180000,
                escalationAction: 'OPEN_MANUAL_REVIEW',
                summary: 'callback 超时且已无自动重试空间，建议转人工复核。'
            }
        ]
    }), {
        foundationAlertAcknowledgement: { findMany: async () => [] },
        auditLog: { findMany: async () => [] }
    });
    const drilldown = await service.getOperationsAlertDrilldown('runtime-callback-stalled', { tenantId: 'tenant-demo' });
    strict_1.default.equal(drilldown.code, 'runtime-callback-stalled');
    strict_1.default.equal(drilldown.alert?.count, 2);
    strict_1.default.deepEqual(drilldown.detail.timeoutThresholds, {
        low: 900000,
        medium: 600000,
        high: 300000
    });
    strict_1.default.deepEqual(drilldown.detail.escalationSummary, {
        waitCallback: 0,
        scheduleReplay: 1,
        openManualReview: 1
    });
    strict_1.default.deepEqual((drilldown.detail.receipts[0] ?? null) && {
        receiptCode: drilldown.detail.receipts[0]?.receiptCode,
        escalationAction: drilldown.detail.receipts[0]?.escalationAction,
        exceededMs: drilldown.detail.receipts[0]?.exceededMs
    }, {
        receiptCode: 'RUNTIME-001',
        escalationAction: 'SCHEDULE_REPLAY',
        exceededMs: 120000
    });
});
(0, node_test_1.default)('e2e: foundation overview and drilldown surface lyt governance alerts', async () => {
    const service = new foundation_service_1.FoundationService(buildIdentityAccessStub(), {
        getDescriptor: () => ({ key: 'configuration-governance', name: 'cfg', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            configuration: {
                secrets: { rotationDue: 0, expired: 0 },
                certificates: { expiringSoon: 0, expired: 0 }
            }
        }),
        getSecretMetadata: async () => [],
        getCertificateMetadata: async () => []
    }, buildIntegrationStub('integration-orchestration'), {
        getDescriptor: () => ({ key: 'trust-governance', name: 'trust', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            rateLimit: { ledgers: { blocked: 0 } }
        }),
        listGovernanceApprovals: async () => [],
        getAuditRecords: async () => [],
        listQuotaLedgers: async () => []
    }, buildIntegrationStub('resilience-operations'), buildRuntimeGovernanceStub(), {
        foundationAlertAcknowledgement: { findMany: async () => [] },
        auditLog: { findMany: async () => [] }
    }, buildLytGovernanceQueryStub({
        alerts: [
            {
                severity: 'high',
                code: 'pending-configuration-stores',
                count: 2,
                summary: '存在仍未完成真实连接配置的门店，相关能力将持续被阻塞',
                affectedStoreIds: ['store-001', 'store-002'],
                affectedCapabilities: ['payment', 'member'],
                recommendedNextActions: ['优先补齐 endpoint、credential 与 vendorStoreId']
            },
            {
                severity: 'medium',
                code: 'inherited-store-verification',
                count: 1,
                summary: '存在仍继承品牌或租户默认连接的门店，需逐店核对 capability 与 vendorStoreId',
                affectedStoreIds: ['store-003'],
                affectedCapabilities: ['gate'],
                recommendedNextActions: ['逐店核验 vendorStoreId 与 capability 范围']
            }
        ]
    }));
    const overview = await service.getOperationsOverview({ tenantId: 'tenant-demo', brandId: 'brand-demo' });
    const lytAlert = overview.alerts.find((item) => item.code === 'lyt-connection-governance-risk');
    strict_1.default.equal(overview.summary.lytGovernanceAlertGroups, 2);
    strict_1.default.equal(overview.summary.lytGovernanceAffectedStores, 3);
    strict_1.default.equal(lytAlert?.severity, 'high');
    strict_1.default.equal(lytAlert?.count, 3);
    const drilldown = await service.getOperationsAlertDrilldown('lyt-connection-governance-risk', {
        tenantId: 'tenant-demo',
        brandId: 'brand-demo'
    });
    strict_1.default.equal(drilldown.code, 'lyt-connection-governance-risk');
    strict_1.default.equal(drilldown.alert?.count, 3);
    strict_1.default.deepEqual(drilldown.detail.scope, {
        tenantId: 'tenant-demo',
        brandId: 'brand-demo'
    });
    strict_1.default.deepEqual(drilldown.detail.affectedStoreIds, ['store-001', 'store-002', 'store-003']);
    strict_1.default.deepEqual(drilldown.detail.affectedCapabilities, ['payment', 'member', 'gate']);
    strict_1.default.equal(drilldown.detail.topAlertCodes.includes('pending-configuration-stores'), true);
});
function makeBaseService() {
    return new foundation_service_1.FoundationService(buildIdentityAccessStub(), {
        getDescriptor: () => ({ key: 'configuration-governance', name: 'cfg', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            configuration: { secrets: { rotationDue: 0, expired: 0 }, certificates: { expiringSoon: 0, expired: 0 } }
        }),
        getSecretMetadata: async () => [],
        getCertificateMetadata: async () => []
    }, buildIntegrationStub('integration-orchestration'), {
        getDescriptor: () => ({ key: 'trust-governance', name: 'trust', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            rateLimit: { ledgers: { blocked: 0 } }
        }),
        listGovernanceApprovals: async () => [],
        getAuditRecords: async () => [],
        listQuotaLedgers: async () => []
    }, buildIntegrationStub('resilience-operations'), buildRuntimeGovernanceStub(), {
        foundationAlertAcknowledgement: { findMany: async () => [] },
        auditLog: { findMany: async () => [] }
    }, buildLytGovernanceQueryStub());
}
(0, node_test_1.default)('e2e: foundation summary fields are all numeric (no NaN)', async () => {
    const service = makeBaseService();
    const overview = await service.getOperationsOverview({ tenantId: 'tenant-demo', brandId: 'brand-demo' });
    for (const [key, value] of Object.entries(overview.summary)) {
        strict_1.default.equal(typeof value, 'number', `${key} should be number, got ${typeof value}`);
        strict_1.default.ok(Number.isFinite(value), `${key} should be finite, got ${value}`);
    }
});
(0, node_test_1.default)('e2e: foundation overview lytGovernanceAlertGroups is 0 when no lyt alerts', async () => {
    const service = makeBaseService();
    const overview = await service.getOperationsOverview({ tenantId: 'tenant-demo', brandId: 'brand-demo' });
    strict_1.default.equal(overview.summary.lytGovernanceAlertGroups, 0);
    strict_1.default.equal(overview.summary.lytGovernanceAffectedStores, 0);
});
(0, node_test_1.default)('e2e: foundation overview lytGovernanceAlertGroups sums multiple lyt alerts', async () => {
    const service = new foundation_service_1.FoundationService(buildIdentityAccessStub(), {
        getDescriptor: () => ({ key: 'configuration-governance', name: 'cfg', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            configuration: { secrets: { rotationDue: 0, expired: 0 }, certificates: { expiringSoon: 0, expired: 0 } }
        }),
        getSecretMetadata: async () => [],
        getCertificateMetadata: async () => []
    }, buildIntegrationStub('integration-orchestration'), {
        getDescriptor: () => ({ key: 'trust-governance', name: 'trust', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            rateLimit: { ledgers: { blocked: 0 } }
        }),
        listGovernanceApprovals: async () => [],
        getAuditRecords: async () => [],
        listQuotaLedgers: async () => []
    }, buildIntegrationStub('resilience-operations'), buildRuntimeGovernanceStub(), {
        foundationAlertAcknowledgement: { findMany: async () => [] },
        auditLog: { findMany: async () => [] }
    }, buildLytGovernanceQueryStub({
        alerts: [
            { severity: 'high', code: 'a', count: 1, summary: 'a', affectedStoreIds: ['s1'], affectedCapabilities: ['c'], recommendedNextActions: [] },
            { severity: 'medium', code: 'b', count: 2, summary: 'b', affectedStoreIds: ['s2', 's3'], affectedCapabilities: ['c'], recommendedNextActions: [] }
        ]
    }));
    const overview = await service.getOperationsOverview({ tenantId: 'tenant-demo', brandId: 'brand-demo' });
    strict_1.default.equal(overview.summary.lytGovernanceAlertGroups, 2);
    strict_1.default.equal(overview.summary.lytGovernanceAffectedStores, 3);
});
(0, node_test_1.default)('e2e: foundation overview runtimeGovernanceBacklog reflects input', async () => {
    const service = new foundation_service_1.FoundationService(buildIdentityAccessStub(), {
        getDescriptor: () => ({ key: 'configuration-governance', name: 'cfg', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            configuration: { secrets: { rotationDue: 0, expired: 0 }, certificates: { expiringSoon: 0, expired: 0 } }
        }),
        getSecretMetadata: async () => [],
        getCertificateMetadata: async () => []
    }, buildIntegrationStub('integration-orchestration'), {
        getDescriptor: () => ({ key: 'trust-governance', name: 'trust', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            rateLimit: { ledgers: { blocked: 0 } }
        }),
        listGovernanceApprovals: async () => [],
        getAuditRecords: async () => [],
        listQuotaLedgers: async () => []
    }, buildIntegrationStub('resilience-operations'), buildRuntimeGovernanceStub({ summary: { backlog: 7, stalledCallbacks: 3, highRiskBacklog: 2, blockedActions: 1 } }), {
        foundationAlertAcknowledgement: { findMany: async () => [] },
        auditLog: { findMany: async () => [] }
    }, buildLytGovernanceQueryStub());
    const overview = await service.getOperationsOverview({ tenantId: 'tenant-demo', brandId: 'brand-demo' });
    strict_1.default.equal(overview.summary.runtimeGovernanceBacklog, 7);
    strict_1.default.equal(overview.summary.stalledRuntimeCallbacks, 3);
    strict_1.default.equal(overview.summary.highRiskRuntimeBacklog, 2);
    strict_1.default.equal(overview.summary.runtimeBlockedActions, 1);
});
(0, node_test_1.default)('e2e: foundation overview highRiskAudits reflects trust overview', async () => {
    const service = new foundation_service_1.FoundationService(buildIdentityAccessStub(), {
        getDescriptor: () => ({ key: 'configuration-governance', name: 'cfg', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            configuration: { secrets: { rotationDue: 0, expired: 0 }, certificates: { expiringSoon: 0, expired: 0 } }
        }),
        getSecretMetadata: async () => [],
        getCertificateMetadata: async () => []
    }, buildIntegrationStub('integration-orchestration'), {
        getDescriptor: () => ({ key: 'trust-governance', name: 'trust', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 5 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 12 } },
            rateLimit: { ledgers: { blocked: 0 } }
        }),
        listGovernanceApprovals: async () => [],
        getAuditRecords: async () => [],
        listQuotaLedgers: async () => []
    }, buildIntegrationStub('resilience-operations'), buildRuntimeGovernanceStub(), {
        foundationAlertAcknowledgement: { findMany: async () => [] },
        auditLog: { findMany: async () => [] }
    }, buildLytGovernanceQueryStub());
    const overview = await service.getOperationsOverview({ tenantId: 'tenant-demo', brandId: 'brand-demo' });
    strict_1.default.equal(overview.summary.highRiskAudits, 12);
});
(0, node_test_1.default)('e2e: foundation overview approvalsPending reflects trust overview', async () => {
    const service = new foundation_service_1.FoundationService(buildIdentityAccessStub(), {
        getDescriptor: () => ({ key: 'configuration-governance', name: 'cfg', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 8 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            configuration: { secrets: { rotationDue: 0, expired: 0 }, certificates: { expiringSoon: 0, expired: 0 } }
        }),
        getSecretMetadata: async () => [],
        getCertificateMetadata: async () => []
    }, buildIntegrationStub('integration-orchestration'), {
        getDescriptor: () => ({ key: 'trust-governance', name: 'trust', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            rateLimit: { ledgers: { blocked: 0 } }
        }),
        listGovernanceApprovals: async () => [],
        getAuditRecords: async () => [],
        listQuotaLedgers: async () => []
    }, buildIntegrationStub('resilience-operations'), buildRuntimeGovernanceStub(), {
        foundationAlertAcknowledgement: { findMany: async () => [] },
        auditLog: { findMany: async () => [] }
    }, buildLytGovernanceQueryStub());
    const overview = await service.getOperationsOverview({ tenantId: 'tenant-demo', brandId: 'brand-demo' });
    strict_1.default.equal(overview.summary.approvalsPending, 8);
});
(0, node_test_1.default)('e2e: foundation overview rotationDueSecrets reflects config governance', async () => {
    const service = new foundation_service_1.FoundationService(buildIdentityAccessStub(), {
        getDescriptor: () => ({ key: 'configuration-governance', name: 'cfg', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            configuration: { secrets: { rotationDue: 4, expired: 1 }, certificates: { expiringSoon: 2, expired: 0 } }
        }),
        getSecretMetadata: async () => [],
        getCertificateMetadata: async () => []
    }, buildIntegrationStub('integration-orchestration'), {
        getDescriptor: () => ({ key: 'trust-governance', name: 'trust', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            rateLimit: { ledgers: { blocked: 0 } }
        }),
        listGovernanceApprovals: async () => [],
        getAuditRecords: async () => [],
        listQuotaLedgers: async () => []
    }, buildIntegrationStub('resilience-operations'), buildRuntimeGovernanceStub(), {
        foundationAlertAcknowledgement: { findMany: async () => [] },
        auditLog: { findMany: async () => [] }
    }, buildLytGovernanceQueryStub());
    const overview = await service.getOperationsOverview({ tenantId: 'tenant-demo', brandId: 'brand-demo' });
    strict_1.default.equal(overview.summary.rotationDueSecrets, 4);
    strict_1.default.equal(overview.summary.expiredSecrets, 1);
    strict_1.default.equal(overview.summary.expiringCertificates, 2);
    strict_1.default.equal(overview.summary.expiredCertificates, 0);
});
(0, node_test_1.default)('e2e: foundation drilldown lyt-governance-risk detail has scope and affectedStoreIds', async () => {
    const service = makeBaseService();
    const drilldown = await service.getOperationsAlertDrilldown('lyt-connection-governance-risk', {
        tenantId: 'tenant-A',
        brandId: 'brand-A'
    });
    strict_1.default.equal(drilldown.code, 'lyt-connection-governance-risk');
    strict_1.default.ok(drilldown.detail.affectedStoreIds);
});
(0, node_test_1.default)('e2e: foundation overview lyt alerts surface aggregated severity', async () => {
    const service = new foundation_service_1.FoundationService(buildIdentityAccessStub(), {
        getDescriptor: () => ({ key: 'configuration-governance', name: 'cfg', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            configuration: { secrets: { rotationDue: 0, expired: 0 }, certificates: { expiringSoon: 0, expired: 0 } }
        }),
        getSecretMetadata: async () => [],
        getCertificateMetadata: async () => []
    }, buildIntegrationStub('integration-orchestration'), {
        getDescriptor: () => ({ key: 'trust-governance', name: 'trust', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
        getOperationsOverview: async () => ({
            approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
            audits: { byRiskLevel: { high: 0 } },
            rateLimit: { ledgers: { blocked: 0 } }
        }),
        listGovernanceApprovals: async () => [],
        getAuditRecords: async () => [],
        listQuotaLedgers: async () => []
    }, buildIntegrationStub('resilience-operations'), buildRuntimeGovernanceStub(), {
        foundationAlertAcknowledgement: { findMany: async () => [] },
        auditLog: { findMany: async () => [] }
    }, buildLytGovernanceQueryStub({
        alerts: [
            { severity: 'high', code: 'pending-configuration-stores', count: 1, summary: 'pending', affectedStoreIds: ['s1'], affectedCapabilities: ['payment'], recommendedNextActions: [] },
            { severity: 'high', code: 'credential-missing-stores', count: 2, summary: 'creds', affectedStoreIds: ['s2', 's3'], affectedCapabilities: ['payment'], recommendedNextActions: [] }
        ]
    }));
    const overview = await service.getOperationsOverview({ tenantId: 'tenant-demo', brandId: 'brand-demo' });
    // Both alert codes contribute to lytGovernanceAlertGroups
    strict_1.default.ok(overview.summary.lytGovernanceAlertGroups >= 1);
    strict_1.default.ok(overview.summary.lytGovernanceAffectedStores >= 1);
    // overview should contain at least one alert whose code is the aggregated lyt-risk marker
    const lytAlert = overview.alerts.find((a) => a.code === 'lyt-connection-governance-risk');
    strict_1.default.ok(lytAlert);
    strict_1.default.equal(lytAlert.severity, 'high');
});
(0, node_test_1.default)('e2e: foundation overview topRisks length <= 5', async () => {
    const service = makeBaseService();
    const overview = await service.getOperationsOverview({ tenantId: 'tenant-demo', brandId: 'brand-demo' });
    strict_1.default.ok(overview.topRisks.length <= 5);
    strict_1.default.ok(overview.topFailures.length <= 5);
});
(0, node_test_1.default)('e2e: foundation overview generatedAt is valid ISO string', async () => {
    const service = makeBaseService();
    const overview = await service.getOperationsOverview({ tenantId: 'tenant-demo', brandId: 'brand-demo' });
    strict_1.default.match(overview.generatedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
});
(0, node_test_1.default)('e2e: foundation drilldown non-existent code returns code and null alert', async () => {
    const service = makeBaseService();
    const drilldown = await service.getOperationsAlertDrilldown('alert-does-not-exist', {
        tenantId: 'tenant-demo',
        brandId: 'brand-demo'
    });
    strict_1.default.equal(drilldown.code, 'alert-does-not-exist');
    strict_1.default.equal(drilldown.alert ?? null, null);
});
//# sourceMappingURL=foundation-alert-acknowledgement.e2e.test.js.map