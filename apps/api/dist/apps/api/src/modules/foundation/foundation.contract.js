"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toFoundationModuleContract = toFoundationModuleContract;
exports.toFoundationConsumerContract = toFoundationConsumerContract;
exports.toFoundationGovernanceBaselineContract = toFoundationGovernanceBaselineContract;
exports.toFoundationBootstrapContract = toFoundationBootstrapContract;
exports.toFoundationOperationsOverviewContract = toFoundationOperationsOverviewContract;
exports.toFoundationOperationsAlertContract = toFoundationOperationsAlertContract;
exports.toFoundationConsumerDependencyContract = toFoundationConsumerDependencyContract;
exports.toFoundationModuleCatalogContract = toFoundationModuleCatalogContract;
exports.toFoundationAlertCatalogItemContract = toFoundationAlertCatalogItemContract;
// ─── Mappers ───
function toFoundationModuleContract(descriptor) {
    return {
        key: descriptor.key,
        name: descriptor.name,
        purpose: descriptor.purpose,
        capabilities: descriptor.capabilities.map((cap) => ({
            key: cap.key,
            name: cap.name,
            entrypoints: cap.entrypoints ?? [],
            consumers: cap.consumers ?? [],
            status: cap.status
        }))
    };
}
function toFoundationConsumerContract(descriptor) {
    return {
        consumer: descriptor.consumer,
        modulePath: descriptor.modulePath,
        dependsOn: descriptor.dependsOn ?? [],
        responsibility: descriptor.responsibility,
        governanceTouchpoints: descriptor.governanceTouchpoints ?? [],
        highRiskEntrypoints: descriptor.highRiskEntrypoints ?? []
    };
}
function toFoundationGovernanceBaselineContract(baseline) {
    return {
        key: baseline.key,
        name: baseline.name,
        ownerModule: baseline.ownerModule,
        summary: baseline.summary,
        controls: baseline.controls ?? [],
        evidence: baseline.evidence ?? []
    };
}
function toFoundationBootstrapContract(blueprint) {
    const modules = (blueprint.modules ?? []);
    const consumers = (blueprint.consumers ?? []);
    const baselines = (blueprint.governanceBaselines ?? []);
    const moduleStatuses = {};
    for (const mod of modules) {
        for (const cap of mod.capabilities ?? []) {
            moduleStatuses[cap.key] = cap.status;
        }
    }
    return {
        generatedAt: blueprint.generatedAt,
        docCount: (blueprint.docs ?? []).length,
        guardrails: blueprint.guardrails ?? [],
        frontendBootstrapUrl: typeof blueprint.frontendBootstrap === 'string' ? blueprint.frontendBootstrap : null,
        moduleCount: modules.length,
        moduleNames: modules.map((m) => m.key),
        moduleStatuses,
        consumerCount: consumers.length,
        consumerNames: consumers.map((c) => c.consumer),
        baselineCount: baselines.length
    };
}
function toFoundationOperationsOverviewContract(input) {
    const summary = input.summary;
    const alerts = input.alerts ?? [];
    return {
        generatedAt: input.generatedAt,
        approvalCounts: {
            approvalsPending: summary.approvalsPending ?? 0,
            approvalsWithFailures: summary.approvalsWithFailures ?? 0
        },
        auditCounts: {
            highRiskAudits: summary.highRiskAudits ?? 0
        },
        rateLimitCounts: {
            blockedLedgers: summary.blockedLedgers ?? 0
        },
        secretCounts: {
            rotationDue: summary.rotationDueSecrets ?? 0,
            expired: summary.expiredSecrets ?? 0,
            expiringCertificates: summary.expiringCertificates ?? 0,
            expiredCertificates: summary.expiredCertificates ?? 0
        },
        observabilityCounts: {
            degradedSignals: summary.degradedSignals ?? 0
        },
        recoveryCounts: {
            attentionRequired: summary.attentionRecoveryPlans ?? 0,
            staleDrills: summary.staleDrills ?? 0
        },
        runtimeGovernanceCounts: {
            backlog: summary.runtimeGovernanceBacklog ?? 0,
            stalledCallbacks: summary.stalledRuntimeCallbacks ?? 0,
            highRiskBacklog: summary.highRiskRuntimeBacklog ?? 0,
            blockedActions: summary.runtimeBlockedActions ?? 0
        },
        lytGovernanceCounts: {
            alertGroups: summary.lytGovernanceAlertGroups ?? 0,
            affectedStores: summary.lytGovernanceAffectedStores ?? 0
        },
        alerts: alerts.map((a) => toFoundationOperationsAlertContract(a)),
        alertCount: alerts.length,
        highRiskAlertCount: alerts.filter((a) => a.severity === 'high').length
    };
}
function toFoundationOperationsAlertContract(alert) {
    return {
        severity: alert.severity,
        code: alert.code,
        count: alert.count,
        summary: alert.summary
    };
}
function toFoundationConsumerDependencyContract(input) {
    if (input.consumer) {
        return {
            consumer: input.consumer.consumer,
            modulePath: input.consumer.modulePath,
            dependsOn: input.consumer.dependsOn ?? [],
            responsibility: input.consumer.responsibility,
            governanceTouchpoints: input.consumer.governanceTouchpoints ?? [],
            highRiskEntrypoints: input.consumer.highRiskEntrypoints ?? [],
            found: true
        };
    }
    return {
        consumer: input.consumerKey,
        modulePath: '',
        dependsOn: [],
        responsibility: '未找到对应消费者描述符。',
        governanceTouchpoints: [],
        highRiskEntrypoints: [],
        found: false
    };
}
function toFoundationModuleCatalogContract(modules) {
    return {
        moduleCount: modules.length,
        moduleNames: modules.map((m) => m.key),
        modules: modules.map(toFoundationModuleContract)
    };
}
/**
 * Build a FoundationAlertCatalogItem contract for cross-module consumption.
 * Strips path fields that are runtime-dependent.
 */
function toFoundationAlertCatalogItemContract(item) {
    return {
        code: item.code,
        defaultSummary: item.defaultSummary,
        severityPolicy: item.severityPolicy,
        sourceModules: item.sourceModules,
        drilldownEnabled: item.drilldownEnabled,
        acknowledgementEnabled: item.acknowledgementEnabled
    };
}
//# sourceMappingURL=foundation.contract.js.map