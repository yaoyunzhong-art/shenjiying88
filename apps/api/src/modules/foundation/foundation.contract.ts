import type {
  FoundationBlueprint,
  FoundationConsumerDescriptor,
  FoundationModuleDescriptor,
  FoundationGovernanceBaseline,
  FoundationOperationsAlert,
  FoundationAlertCatalogItem
} from '@m5/types'

/**
 * Contract types for foundation module cross-boundary communication.
 * These are the stable surface that other modules consume.
 */

/** Contract for a foundation module descriptor (cross-module safe subset) */
export interface FoundationModuleContract {
  key: string
  name: string
  purpose: string
  capabilities: Array<{
    key: string
    name: string
    entrypoints: string[]
    consumers: string[]
    status: string
  }>
}

/** Contract for a foundation consumer descriptor (cross-module safe subset) */
export interface FoundationConsumerContract {
  consumer: string
  modulePath: string
  dependsOn: string[]
  responsibility: string
  governanceTouchpoints: string[]
  highRiskEntrypoints: string[]
}

/** Contract for a foundation governance baseline */
export interface FoundationGovernanceBaselineContract {
  key: string
  name: string
  ownerModule: string
  summary: string
  controls: string[]
  evidence: string[]
}

/** Contract for the foundation bootstrap response */
export interface FoundationBootstrapContract {
  generatedAt: string
  docCount: number
  guardrails: string[]
  frontendBootstrapUrl: string | null
  moduleCount: number
  moduleNames: string[]
  moduleStatuses: Record<string, string>
  consumerCount: number
  consumerNames: string[]
  baselineCount: number
}

/** Contract for a single operations alert */
export interface FoundationOperationsAlertContract {
  severity: 'low' | 'medium' | 'high'
  code: string
  count: number
  summary: string
}

/** Contract for operations overview summary */
export interface FoundationOperationsOverviewContract {
  generatedAt: string
  approvalCounts: {
    approvalsPending: number
    approvalsWithFailures: number
  }
  auditCounts: {
    highRiskAudits: number
  }
  rateLimitCounts: {
    blockedLedgers: number
  }
  secretCounts: {
    rotationDue: number
    expired: number
    expiringCertificates: number
    expiredCertificates: number
  }
  observabilityCounts: {
    degradedSignals: number
  }
  recoveryCounts: {
    attentionRequired: number
    staleDrills: number
  }
  runtimeGovernanceCounts: {
    backlog: number
    stalledCallbacks: number
    highRiskBacklog: number
    blockedActions: number
  }
  lytGovernanceCounts: {
    alertGroups: number
    affectedStores: number
  }
  alerts: FoundationOperationsAlertContract[]
  alertCount: number
  highRiskAlertCount: number
}

/** Contract for a single consumer dependency response */
export interface FoundationConsumerDependencyContract {
  consumer: string
  modulePath: string
  dependsOn: string[]
  responsibility: string
  governanceTouchpoints: string[]
  highRiskEntrypoints: string[]
  found: boolean
}

/** Contract for module catalog response */
export interface FoundationModuleCatalogContract {
  moduleCount: number
  moduleNames: string[]
  modules: FoundationModuleContract[]
}

// ─── Mappers ───

export function toFoundationModuleContract(descriptor: FoundationModuleDescriptor): FoundationModuleContract {
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
  }
}

export function toFoundationConsumerContract(descriptor: FoundationConsumerDescriptor): FoundationConsumerContract {
  return {
    consumer: descriptor.consumer,
    modulePath: descriptor.modulePath,
    dependsOn: descriptor.dependsOn ?? [],
    responsibility: descriptor.responsibility,
    governanceTouchpoints: descriptor.governanceTouchpoints ?? [],
    highRiskEntrypoints: descriptor.highRiskEntrypoints ?? []
  }
}

export function toFoundationGovernanceBaselineContract(
  baseline: FoundationGovernanceBaseline
): FoundationGovernanceBaselineContract {
  return {
    key: baseline.key,
    name: baseline.name,
    ownerModule: baseline.ownerModule,
    summary: baseline.summary,
    controls: baseline.controls ?? [],
    evidence: baseline.evidence ?? []
  }
}

export function toFoundationBootstrapContract(blueprint: FoundationBlueprint): FoundationBootstrapContract {
  const modules = (blueprint.modules ?? []) as FoundationModuleDescriptor[]
  const consumers = (blueprint.consumers ?? []) as FoundationConsumerDescriptor[]
  const baselines = (blueprint.governanceBaselines ?? []) as FoundationGovernanceBaseline[]

  const moduleStatuses: Record<string, string> = {}
  for (const mod of modules) {
    for (const cap of mod.capabilities ?? []) {
      moduleStatuses[cap.key] = cap.status
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
  }
}

export function toFoundationOperationsOverviewContract(input: {
  generatedAt: string
  summary: Record<string, number>
  alerts: FoundationOperationsAlert[]
}): FoundationOperationsOverviewContract {
  const summary = input.summary
  const alerts = input.alerts ?? []

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
  }
}

export function toFoundationOperationsAlertContract(
  alert: FoundationOperationsAlert
): FoundationOperationsAlertContract {
  return {
    severity: alert.severity,
    code: alert.code,
    count: alert.count,
    summary: alert.summary
  }
}

export function toFoundationConsumerDependencyContract(input: {
  consumer: FoundationConsumerDescriptor | undefined
  consumerKey: string
  allConsumerNames: string[]
}): FoundationConsumerDependencyContract {
  if (input.consumer) {
    return {
      consumer: input.consumer.consumer,
      modulePath: input.consumer.modulePath,
      dependsOn: input.consumer.dependsOn ?? [],
      responsibility: input.consumer.responsibility,
      governanceTouchpoints: input.consumer.governanceTouchpoints ?? [],
      highRiskEntrypoints: input.consumer.highRiskEntrypoints ?? [],
      found: true
    }
  }

  return {
    consumer: input.consumerKey,
    modulePath: '',
    dependsOn: [],
    responsibility: '未找到对应消费者描述符。',
    governanceTouchpoints: [],
    highRiskEntrypoints: [],
    found: false
  }
}

export function toFoundationModuleCatalogContract(
  modules: FoundationModuleDescriptor[]
): FoundationModuleCatalogContract {
  return {
    moduleCount: modules.length,
    moduleNames: modules.map((m) => m.key),
    modules: modules.map(toFoundationModuleContract)
  }
}

/**
 * Build a FoundationAlertCatalogItem contract for cross-module consumption.
 * Strips path fields that are runtime-dependent.
 */
export function toFoundationAlertCatalogItemContract(item: FoundationAlertCatalogItem): {
  code: string
  defaultSummary: string
  severityPolicy: string
  sourceModules: string[]
  drilldownEnabled: boolean
  acknowledgementEnabled: boolean
} {
  return {
    code: item.code,
    defaultSummary: item.defaultSummary,
    severityPolicy: item.severityPolicy,
    sourceModules: item.sourceModules,
    drilldownEnabled: item.drilldownEnabled,
    acknowledgementEnabled: item.acknowledgementEnabled
  }
}
