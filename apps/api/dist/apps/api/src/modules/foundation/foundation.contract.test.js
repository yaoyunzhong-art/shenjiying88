"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const foundation_contract_1 = require("./foundation.contract");
// ─── Helpers ───
function makeModuleDescriptor(overrides = {}) {
    return {
        key: 'identity-access',
        name: 'Identity Access',
        purpose: 'auth and authorization',
        inboundContracts: ['inbound'],
        outboundContracts: ['outbound'],
        capabilities: [
            {
                key: 'identity-access.auth',
                name: 'Authentication',
                responsibilities: ['handle login'],
                entrypoints: ['/api/v1/auth/login'],
                consumers: ['market', 'portal'],
                status: 'active'
            },
            {
                key: 'identity-access.rbac',
                name: 'RBAC',
                responsibilities: ['access control'],
                entrypoints: ['/api/v1/auth/check'],
                consumers: ['workbench'],
                status: 'active'
            }
        ],
        ...overrides
    };
}
function makeConsumerDescriptor(overrides = {}) {
    return {
        consumer: 'market',
        modulePath: 'src/modules/market',
        dependsOn: ['identity-access', 'configuration-governance'],
        responsibility: '多市场默认值输出',
        governanceTouchpoints: ['/api/v1/foundation/bootstrap'],
        highRiskEntrypoints: [],
        handoffContracts: [],
        recommendedSequence: [],
        actionGovernanceExamples: [],
        runtimeHandoffExamples: [],
        runtimeReceiptExamples: [],
        governanceAlertLifecycleExamples: [],
        ...overrides
    };
}
function makeGovernanceBaseline(overrides = {}) {
    return {
        key: 'configuration.secrets',
        name: 'Secrets baseline',
        ownerModule: 'configuration-governance',
        summary: 'secret governance baseline',
        controls: ['rotation'],
        evidence: ['docs/governance-observability.md'],
        ...overrides
    };
}
function makeBlueprint(overrides = {}) {
    return {
        generatedAt: '2026-06-23T06:00:00Z',
        docs: ['src/modules/foundation/foundation-architecture.md', 'docs/governance.md'],
        guardrails: ['不得绕过底座接入外部系统', '跨租户访问必须隔离'],
        frontendBootstrap: {
            version: '1.0.0',
            bootstrapEndpoint: '/api/v1/foundation/bootstrap',
            deliveredCapabilities: [],
            appProfiles: {}
        },
        modules: [makeModuleDescriptor()],
        consumers: [makeConsumerDescriptor()],
        governanceBaselines: [makeGovernanceBaseline()],
        ...overrides
    };
}
function makeOperationsAlert(overrides = {}) {
    return {
        severity: 'high',
        code: 'approvals-pending',
        count: 5,
        summary: '存在待处理审批单',
        ...overrides
    };
}
// ─── toFoundationModuleContract ───
(0, node_test_1.describe)('toFoundationModuleContract()', () => {
    (0, node_test_1.test)('maps a full descriptor to contract', () => {
        const descriptor = makeModuleDescriptor();
        const contract = (0, foundation_contract_1.toFoundationModuleContract)(descriptor);
        strict_1.default.equal(contract.key, 'identity-access');
        strict_1.default.equal(contract.name, 'Identity Access');
        strict_1.default.equal(contract.purpose, 'auth and authorization');
        strict_1.default.equal(contract.capabilities.length, 2);
    });
    (0, node_test_1.test)('maps capabilities correctly', () => {
        const descriptor = makeModuleDescriptor();
        const contract = (0, foundation_contract_1.toFoundationModuleContract)(descriptor);
        const auth = contract.capabilities.find((c) => c.key === 'identity-access.auth');
        strict_1.default.ok(auth, 'should find auth capability');
        strict_1.default.equal(auth.name, 'Authentication');
        strict_1.default.deepEqual(auth.entrypoints, ['/api/v1/auth/login']);
        strict_1.default.deepEqual(auth.consumers, ['market', 'portal']);
        strict_1.default.equal(auth.status, 'active');
        const rbac = contract.capabilities.find((c) => c.key === 'identity-access.rbac');
        strict_1.default.ok(rbac, 'should find rbac capability');
        strict_1.default.equal(rbac.name, 'RBAC');
    });
    (0, node_test_1.test)('handles descriptor with empty capabilities', () => {
        const descriptor = makeModuleDescriptor({
            capabilities: []
        });
        const contract = (0, foundation_contract_1.toFoundationModuleContract)(descriptor);
        strict_1.default.equal(contract.capabilities.length, 0);
    });
    (0, node_test_1.test)('handles capability with missing optional fields', () => {
        const descriptor = {
            key: 'identity-access',
            name: 'Minimal',
            purpose: 'just works',
            inboundContracts: [],
            outboundContracts: [],
            capabilities: [
                {
                    key: 'minimal.cap',
                    name: 'Minimal Cap',
                    responsibilities: [],
                    entrypoints: [],
                    consumers: [],
                    status: 'active'
                }
            ]
        };
        const contract = (0, foundation_contract_1.toFoundationModuleContract)(descriptor);
        strict_1.default.equal(contract.key, 'identity-access');
        strict_1.default.equal(contract.capabilities.length, 1);
        strict_1.default.deepEqual(contract.capabilities[0].entrypoints, []);
        strict_1.default.deepEqual(contract.capabilities[0].consumers, []);
    });
});
// ─── toFoundationConsumerContract ───
(0, node_test_1.describe)('toFoundationConsumerContract()', () => {
    (0, node_test_1.test)('maps a full consumer descriptor', () => {
        const descriptor = makeConsumerDescriptor();
        const contract = (0, foundation_contract_1.toFoundationConsumerContract)(descriptor);
        strict_1.default.equal(contract.consumer, 'market');
        strict_1.default.equal(contract.modulePath, 'src/modules/market');
        strict_1.default.deepEqual(contract.dependsOn, ['identity-access', 'configuration-governance']);
        strict_1.default.equal(contract.responsibility, '多市场默认值输出');
        strict_1.default.deepEqual(contract.governanceTouchpoints, ['/api/v1/foundation/bootstrap']);
        strict_1.default.deepEqual(contract.highRiskEntrypoints, []);
    });
    (0, node_test_1.test)('handles consumer with empty arrays', () => {
        const descriptor = makeConsumerDescriptor({
            dependsOn: [],
            governanceTouchpoints: [],
            highRiskEntrypoints: []
        });
        const contract = (0, foundation_contract_1.toFoundationConsumerContract)(descriptor);
        strict_1.default.deepEqual(contract.dependsOn, []);
        strict_1.default.deepEqual(contract.governanceTouchpoints, []);
        strict_1.default.deepEqual(contract.highRiskEntrypoints, []);
    });
    (0, node_test_1.test)('handles high risk entrypoints', () => {
        const descriptor = makeConsumerDescriptor({
            highRiskEntrypoints: ['member-login', 'payment-submit']
        });
        const contract = (0, foundation_contract_1.toFoundationConsumerContract)(descriptor);
        strict_1.default.deepEqual(contract.highRiskEntrypoints, ['member-login', 'payment-submit']);
    });
    (0, node_test_1.test)('preserves modulePath for non-empty descriptor', () => {
        const descriptor = makeConsumerDescriptor({ modulePath: 'src/modules/portal' });
        const contract = (0, foundation_contract_1.toFoundationConsumerContract)(descriptor);
        strict_1.default.equal(contract.modulePath, 'src/modules/portal');
    });
});
// ─── toFoundationGovernanceBaselineContract ───
(0, node_test_1.describe)('toFoundationGovernanceBaselineContract()', () => {
    (0, node_test_1.test)('maps a full governance baseline', () => {
        const baseline = makeGovernanceBaseline();
        const contract = (0, foundation_contract_1.toFoundationGovernanceBaselineContract)(baseline);
        strict_1.default.equal(contract.key, 'configuration.secrets');
        strict_1.default.equal(contract.name, 'Secrets baseline');
        strict_1.default.equal(contract.ownerModule, 'configuration-governance');
        strict_1.default.equal(contract.summary, 'secret governance baseline');
        strict_1.default.deepEqual(contract.controls, ['rotation']);
        strict_1.default.deepEqual(contract.evidence, ['docs/governance-observability.md']);
    });
    (0, node_test_1.test)('handles baseline with multiple controls', () => {
        const baseline = makeGovernanceBaseline({
            controls: ['rotation', 'audit', 'backup']
        });
        const contract = (0, foundation_contract_1.toFoundationGovernanceBaselineContract)(baseline);
        strict_1.default.deepEqual(contract.controls, ['rotation', 'audit', 'backup']);
    });
    (0, node_test_1.test)('handles baseline with multiple evidence entries', () => {
        const baseline = makeGovernanceBaseline({
            evidence: ['docs/a.md', 'docs/b.md']
        });
        const contract = (0, foundation_contract_1.toFoundationGovernanceBaselineContract)(baseline);
        strict_1.default.deepEqual(contract.evidence, ['docs/a.md', 'docs/b.md']);
    });
});
// ─── toFoundationBootstrapContract ───
(0, node_test_1.describe)('toFoundationBootstrapContract()', () => {
    (0, node_test_1.test)('maps a full blueprint', () => {
        const blueprint = makeBlueprint();
        const contract = (0, foundation_contract_1.toFoundationBootstrapContract)(blueprint);
        strict_1.default.equal(contract.generatedAt, '2026-06-23T06:00:00Z');
        strict_1.default.equal(contract.docCount, 2);
        strict_1.default.equal(contract.guardrails.length, 2);
        strict_1.default.equal(contract.frontendBootstrapUrl, null);
        strict_1.default.equal(contract.moduleCount, 1);
        strict_1.default.deepEqual(contract.moduleNames, ['identity-access']);
        strict_1.default.equal(contract.consumerCount, 1);
        strict_1.default.deepEqual(contract.consumerNames, ['market']);
        strict_1.default.equal(contract.baselineCount, 1);
    });
    (0, node_test_1.test)('maps module statuses from capabilities', () => {
        const blueprint = makeBlueprint();
        const contract = (0, foundation_contract_1.toFoundationBootstrapContract)(blueprint);
        strict_1.default.deepEqual(contract.moduleStatuses, {
            'identity-access.auth': 'active',
            'identity-access.rbac': 'active'
        });
    });
    (0, node_test_1.test)('handles blueprint with multiple modules', () => {
        const blueprint = makeBlueprint({
            modules: [
                makeModuleDescriptor(),
                makeModuleDescriptor({
                    key: 'configuration-governance',
                    name: 'Config Gov',
                    capabilities: [
                        {
                            key: 'config.secrets',
                            name: 'Secrets',
                            responsibilities: [],
                            entrypoints: [],
                            consumers: [],
                            status: 'active'
                        }
                    ]
                })
            ]
        });
        const contract = (0, foundation_contract_1.toFoundationBootstrapContract)(blueprint);
        strict_1.default.equal(contract.moduleCount, 2);
        strict_1.default.deepEqual(contract.moduleNames, ['identity-access', 'configuration-governance']);
        strict_1.default.deepEqual(contract.moduleStatuses, {
            'identity-access.auth': 'active',
            'identity-access.rbac': 'active',
            'config.secrets': 'active'
        });
    });
    (0, node_test_1.test)('handles empty modules and consumers', () => {
        const blueprint = makeBlueprint({
            modules: [],
            consumers: [],
            governanceBaselines: []
        });
        const contract = (0, foundation_contract_1.toFoundationBootstrapContract)(blueprint);
        strict_1.default.equal(contract.moduleCount, 0);
        strict_1.default.deepEqual(contract.moduleNames, []);
        strict_1.default.equal(contract.consumerCount, 0);
        strict_1.default.deepEqual(contract.consumerNames, []);
        strict_1.default.equal(contract.baselineCount, 0);
    });
    (0, node_test_1.test)('handles null/undefined frontendBootstrap gracefully', () => {
        const blueprint = makeBlueprint({ frontendBootstrap: undefined });
        const contract = (0, foundation_contract_1.toFoundationBootstrapContract)(blueprint);
        strict_1.default.equal(contract.frontendBootstrapUrl, null);
    });
    (0, node_test_1.test)('handles numeric frontendBootstrap gracefully', () => {
        const blueprint = makeBlueprint({ frontendBootstrap: 42 });
        const contract = (0, foundation_contract_1.toFoundationBootstrapContract)(blueprint);
        strict_1.default.equal(contract.frontendBootstrapUrl, null);
    });
    (0, node_test_1.test)('handles missing docs gracefully', () => {
        const blueprint = makeBlueprint({ docs: undefined });
        const contract = (0, foundation_contract_1.toFoundationBootstrapContract)(blueprint);
        strict_1.default.equal(contract.docCount, 0);
    });
});
// ─── toFoundationOperationsAlertContract ───
(0, node_test_1.describe)('toFoundationOperationsAlertContract()', () => {
    (0, node_test_1.test)('maps a high severity alert', () => {
        const alert = makeOperationsAlert();
        const contract = (0, foundation_contract_1.toFoundationOperationsAlertContract)(alert);
        strict_1.default.equal(contract.severity, 'high');
        strict_1.default.equal(contract.code, 'approvals-pending');
        strict_1.default.equal(contract.count, 5);
        strict_1.default.equal(contract.summary, '存在待处理审批单');
    });
    (0, node_test_1.test)('maps a medium severity alert', () => {
        const alert = makeOperationsAlert({ severity: 'medium', code: 'blocked-rate-limit-ledgers', count: 1 });
        const contract = (0, foundation_contract_1.toFoundationOperationsAlertContract)(alert);
        strict_1.default.equal(contract.severity, 'medium');
        strict_1.default.equal(contract.code, 'blocked-rate-limit-ledgers');
        strict_1.default.equal(contract.count, 1);
    });
    (0, node_test_1.test)('maps a low severity alert', () => {
        const alert = makeOperationsAlert({ severity: 'low', code: 'recovery-drill-attention', count: 0 });
        const contract = (0, foundation_contract_1.toFoundationOperationsAlertContract)(alert);
        strict_1.default.equal(contract.severity, 'low');
        strict_1.default.equal(contract.code, 'recovery-drill-attention');
        strict_1.default.equal(contract.count, 0);
    });
    (0, node_test_1.test)('handles zero count alert', () => {
        const alert = makeOperationsAlert({ count: 0 });
        const contract = (0, foundation_contract_1.toFoundationOperationsAlertContract)(alert);
        strict_1.default.equal(contract.count, 0);
        strict_1.default.equal(contract.summary, '存在待处理审批单');
    });
});
// ─── toFoundationOperationsOverviewContract ───
(0, node_test_1.describe)('toFoundationOperationsOverviewContract()', () => {
    const fullInput = {
        generatedAt: '2026-06-23T06:00:00Z',
        summary: {
            approvalsPending: 3,
            approvalsWithFailures: 1,
            highRiskAudits: 7,
            blockedLedgers: 2,
            rotationDueSecrets: 4,
            expiredSecrets: 1,
            expiringCertificates: 3,
            expiredCertificates: 0,
            degradedSignals: 5,
            attentionRecoveryPlans: 2,
            staleDrills: 1,
            runtimeGovernanceBacklog: 8,
            stalledRuntimeCallbacks: 3,
            highRiskRuntimeBacklog: 2,
            runtimeBlockedActions: 1,
            lytGovernanceAlertGroups: 2,
            lytGovernanceAffectedStores: 5
        },
        alerts: [
            makeOperationsAlert({ severity: 'high', code: 'approvals-pending', count: 3 }),
            makeOperationsAlert({ severity: 'medium', code: 'blocked-rate-limit-ledgers', count: 2 }),
            makeOperationsAlert({ severity: 'high', code: 'runtime-callback-stalled', count: 3 })
        ]
    };
    (0, node_test_1.test)('maps full overview snapshot', () => {
        const contract = (0, foundation_contract_1.toFoundationOperationsOverviewContract)(fullInput);
        strict_1.default.equal(contract.generatedAt, '2026-06-23T06:00:00Z');
        strict_1.default.equal(contract.approvalCounts.approvalsPending, 3);
        strict_1.default.equal(contract.approvalCounts.approvalsWithFailures, 1);
        strict_1.default.equal(contract.auditCounts.highRiskAudits, 7);
        strict_1.default.equal(contract.rateLimitCounts.blockedLedgers, 2);
        strict_1.default.equal(contract.secretCounts.rotationDue, 4);
        strict_1.default.equal(contract.secretCounts.expired, 1);
        strict_1.default.equal(contract.secretCounts.expiringCertificates, 3);
        strict_1.default.equal(contract.secretCounts.expiredCertificates, 0);
        strict_1.default.equal(contract.observabilityCounts.degradedSignals, 5);
        strict_1.default.equal(contract.recoveryCounts.attentionRequired, 2);
        strict_1.default.equal(contract.recoveryCounts.staleDrills, 1);
        strict_1.default.equal(contract.runtimeGovernanceCounts.backlog, 8);
        strict_1.default.equal(contract.runtimeGovernanceCounts.stalledCallbacks, 3);
        strict_1.default.equal(contract.runtimeGovernanceCounts.highRiskBacklog, 2);
        strict_1.default.equal(contract.runtimeGovernanceCounts.blockedActions, 1);
        strict_1.default.equal(contract.lytGovernanceCounts.alertGroups, 2);
        strict_1.default.equal(contract.lytGovernanceCounts.affectedStores, 5);
    });
    (0, node_test_1.test)('maps alerts correctly', () => {
        const contract = (0, foundation_contract_1.toFoundationOperationsOverviewContract)(fullInput);
        strict_1.default.equal(contract.alerts.length, 3);
        strict_1.default.equal(contract.alerts[0].code, 'approvals-pending');
        strict_1.default.equal(contract.alerts[0].severity, 'high');
        strict_1.default.equal(contract.alerts[1].code, 'blocked-rate-limit-ledgers');
        strict_1.default.equal(contract.alerts[1].severity, 'medium');
        strict_1.default.equal(contract.alertCount, 3);
        strict_1.default.equal(contract.highRiskAlertCount, 2);
    });
    (0, node_test_1.test)('handles empty alerts', () => {
        const input = {
            generatedAt: '2026-06-23T06:00:00Z',
            summary: {
                approvalsPending: 0,
                approvalsWithFailures: 0,
                highRiskAudits: 0,
                blockedLedgers: 0,
                rotationDueSecrets: 0,
                expiredSecrets: 0,
                expiringCertificates: 0,
                expiredCertificates: 0,
                degradedSignals: 0,
                attentionRecoveryPlans: 0,
                staleDrills: 0,
                runtimeGovernanceBacklog: 0,
                stalledRuntimeCallbacks: 0,
                highRiskRuntimeBacklog: 0,
                runtimeBlockedActions: 0,
                lytGovernanceAlertGroups: 0,
                lytGovernanceAffectedStores: 0
            },
            alerts: []
        };
        const contract = (0, foundation_contract_1.toFoundationOperationsOverviewContract)(input);
        strict_1.default.equal(contract.alerts.length, 0);
        strict_1.default.equal(contract.alertCount, 0);
        strict_1.default.equal(contract.highRiskAlertCount, 0);
        strict_1.default.equal(contract.approvalCounts.approvalsPending, 0);
    });
    (0, node_test_1.test)('handles missing summary keys gracefully', () => {
        const input = {
            generatedAt: '2026-06-23T06:00:00Z',
            summary: {},
            alerts: []
        };
        const contract = (0, foundation_contract_1.toFoundationOperationsOverviewContract)(input);
        strict_1.default.equal(contract.approvalCounts.approvalsPending, 0);
        strict_1.default.equal(contract.runtimeGovernanceCounts.backlog, 0);
        strict_1.default.equal(contract.lytGovernanceCounts.affectedStores, 0);
    });
});
// ─── toFoundationConsumerDependencyContract ───
(0, node_test_1.describe)('toFoundationConsumerDependencyContract()', () => {
    (0, node_test_1.test)('maps a found consumer', () => {
        const descriptor = makeConsumerDescriptor();
        const allNames = ['market', 'portal', 'workbench'];
        const contract = (0, foundation_contract_1.toFoundationConsumerDependencyContract)({
            consumer: descriptor,
            consumerKey: 'market',
            allConsumerNames: allNames
        });
        strict_1.default.equal(contract.consumer, 'market');
        strict_1.default.equal(contract.found, true);
        strict_1.default.equal(contract.modulePath, 'src/modules/market');
        strict_1.default.deepEqual(contract.dependsOn, ['identity-access', 'configuration-governance']);
    });
    (0, node_test_1.test)('maps an unfound consumer', () => {
        const contract = (0, foundation_contract_1.toFoundationConsumerDependencyContract)({
            consumer: undefined,
            consumerKey: 'unknown-consumer',
            allConsumerNames: ['market', 'portal']
        });
        strict_1.default.equal(contract.consumer, 'unknown-consumer');
        strict_1.default.equal(contract.found, false);
        strict_1.default.equal(contract.modulePath, '');
        strict_1.default.deepEqual(contract.dependsOn, []);
        strict_1.default.equal(contract.responsibility, '未找到对应消费者描述符。');
        strict_1.default.deepEqual(contract.governanceTouchpoints, []);
        strict_1.default.deepEqual(contract.highRiskEntrypoints, []);
    });
    (0, node_test_1.test)('preserves found flag for existing consumer', () => {
        const descriptor = makeConsumerDescriptor({ consumer: 'portal' });
        const contract = (0, foundation_contract_1.toFoundationConsumerDependencyContract)({
            consumer: descriptor,
            consumerKey: 'portal',
            allConsumerNames: ['portal']
        });
        strict_1.default.equal(contract.found, true);
        strict_1.default.equal(contract.consumer, 'portal');
    });
});
// ─── toFoundationModuleCatalogContract ───
(0, node_test_1.describe)('toFoundationModuleCatalogContract()', () => {
    (0, node_test_1.test)('maps multiple modules', () => {
        const modules = [
            makeModuleDescriptor(),
            makeModuleDescriptor({
                key: 'trust-governance',
                name: 'Trust Governance',
                capabilities: [
                    {
                        key: 'trust.audit',
                        name: 'Audit',
                        responsibilities: [],
                        entrypoints: ['/audit'],
                        consumers: [],
                        status: 'active'
                    }
                ]
            })
        ];
        const contract = (0, foundation_contract_1.toFoundationModuleCatalogContract)(modules);
        strict_1.default.equal(contract.moduleCount, 2);
        strict_1.default.deepEqual(contract.moduleNames, ['identity-access', 'trust-governance']);
        strict_1.default.equal(contract.modules.length, 2);
        strict_1.default.equal(contract.modules[0].key, 'identity-access');
        strict_1.default.equal(contract.modules[1].key, 'trust-governance');
    });
    (0, node_test_1.test)('handles empty modules array', () => {
        const contract = (0, foundation_contract_1.toFoundationModuleCatalogContract)([]);
        strict_1.default.equal(contract.moduleCount, 0);
        strict_1.default.deepEqual(contract.moduleNames, []);
        strict_1.default.equal(contract.modules.length, 0);
    });
    (0, node_test_1.test)('handles single module', () => {
        const modules = [makeModuleDescriptor()];
        const contract = (0, foundation_contract_1.toFoundationModuleCatalogContract)(modules);
        strict_1.default.equal(contract.moduleCount, 1);
        strict_1.default.deepEqual(contract.moduleNames, ['identity-access']);
        strict_1.default.equal(contract.modules.length, 1);
    });
});
// ─── toFoundationAlertCatalogItemContract ───
(0, node_test_1.describe)('toFoundationAlertCatalogItemContract()', () => {
    (0, node_test_1.test)('maps a full alert catalog item', () => {
        const item = {
            code: 'approvals-pending',
            defaultSummary: '存在待处理审批单',
            severityPolicy: '数量 >= 5 时为 high',
            sourceModules: ['trust-governance', 'configuration-governance'],
            drilldownPath: '/foundation/overview/alerts/approvals-pending/drilldown',
            ackPath: '/foundation/overview/alerts/approvals-pending/ack',
            mutePath: '/foundation/overview/alerts/approvals-pending/mute',
            unmutePath: '/foundation/overview/alerts/approvals-pending/unmute',
            drilldownEnabled: true,
            acknowledgementEnabled: true
        };
        const contract = (0, foundation_contract_1.toFoundationAlertCatalogItemContract)(item);
        strict_1.default.equal(contract.code, 'approvals-pending');
        strict_1.default.equal(contract.defaultSummary, '存在待处理审批单');
        strict_1.default.equal(contract.severityPolicy, '数量 >= 5 时为 high');
        strict_1.default.deepEqual(contract.sourceModules, ['trust-governance', 'configuration-governance']);
        strict_1.default.equal(contract.drilldownEnabled, true);
        strict_1.default.equal(contract.acknowledgementEnabled, true);
    });
    (0, node_test_1.test)('handles disabled drilldown and acknowledgement', () => {
        const item = {
            code: 'runtime-governance-backlog',
            defaultSummary: 'summary',
            severityPolicy: 'always low',
            sourceModules: ['resilience-operations'],
            drilldownPath: '',
            ackPath: '',
            mutePath: '',
            unmutePath: '',
            drilldownEnabled: false,
            acknowledgementEnabled: false
        };
        const contract = (0, foundation_contract_1.toFoundationAlertCatalogItemContract)(item);
        strict_1.default.equal(contract.drilldownEnabled, false);
        strict_1.default.equal(contract.acknowledgementEnabled, false);
    });
    (0, node_test_1.test)('handles single source module', () => {
        const item = {
            code: 'runtime-governance-backlog',
            defaultSummary: '存在待跟进 receipt',
            severityPolicy: 'backlog >= 5 时为 high',
            sourceModules: ['runtime-governance'],
            drilldownPath: '',
            ackPath: '',
            mutePath: '',
            unmutePath: '',
            drilldownEnabled: true,
            acknowledgementEnabled: true
        };
        const contract = (0, foundation_contract_1.toFoundationAlertCatalogItemContract)(item);
        strict_1.default.deepEqual(contract.sourceModules, ['runtime-governance']);
    });
});
// ─── Cross-mapper integration ───
(0, node_test_1.describe)('contract integration', () => {
    (0, node_test_1.test)('full pipeline: blueprint → bootstrap contract → consumer dependency', () => {
        const blueprint = makeBlueprint({
            modules: [
                makeModuleDescriptor(),
                makeModuleDescriptor({
                    key: 'configuration-governance',
                    name: 'Config Gov',
                    capabilities: [
                        {
                            key: 'config.secrets',
                            name: 'Secrets',
                            responsibilities: [],
                            entrypoints: [],
                            consumers: [],
                            status: 'active'
                        }
                    ]
                })
            ],
            consumers: [
                makeConsumerDescriptor(),
                makeConsumerDescriptor({
                    consumer: 'portal',
                    modulePath: 'src/modules/portal'
                })
            ]
        });
        const bootstrap = (0, foundation_contract_1.toFoundationBootstrapContract)(blueprint);
        strict_1.default.equal(bootstrap.moduleCount, 2);
        strict_1.default.equal(bootstrap.consumerCount, 2);
        strict_1.default.equal(bootstrap.baselineCount, 1);
        strict_1.default.deepEqual(bootstrap.consumerNames, ['market', 'portal']);
        const depContract = (0, foundation_contract_1.toFoundationConsumerDependencyContract)({
            consumer: blueprint.consumers?.[0],
            consumerKey: 'market',
            allConsumerNames: bootstrap.consumerNames
        });
        strict_1.default.equal(depContract.found, true);
        strict_1.default.equal(depContract.consumer, 'market');
    });
    (0, node_test_1.test)('pipeline: overview → alerts counting', () => {
        const overview = (0, foundation_contract_1.toFoundationOperationsOverviewContract)({
            generatedAt: '2026-06-23T06:00:00Z',
            summary: {
                approvalsPending: 0,
                approvalsWithFailures: 0,
                highRiskAudits: 0,
                blockedLedgers: 0,
                rotationDueSecrets: 0,
                expiredSecrets: 0,
                expiringCertificates: 0,
                expiredCertificates: 0,
                degradedSignals: 0,
                attentionRecoveryPlans: 0,
                staleDrills: 0,
                runtimeGovernanceBacklog: 1,
                stalledRuntimeCallbacks: 1,
                highRiskRuntimeBacklog: 0,
                runtimeBlockedActions: 0,
                lytGovernanceAlertGroups: 0,
                lytGovernanceAffectedStores: 0
            },
            alerts: [
                makeOperationsAlert({ severity: 'high', code: 'runtime-callback-stalled', count: 1 }),
                makeOperationsAlert({ severity: 'medium', code: 'runtime-governance-backlog', count: 1 })
            ]
        });
        strict_1.default.equal(overview.alertCount, 2);
        strict_1.default.equal(overview.highRiskAlertCount, 1);
        strict_1.default.equal(overview.runtimeGovernanceCounts.backlog, 1);
        strict_1.default.equal(overview.runtimeGovernanceCounts.stalledCallbacks, 1);
    });
});
//# sourceMappingURL=foundation.contract.test.js.map