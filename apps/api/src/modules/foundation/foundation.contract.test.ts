import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  toFoundationModuleContract,
  toFoundationConsumerContract,
  toFoundationGovernanceBaselineContract,
  toFoundationBootstrapContract,
  toFoundationOperationsOverviewContract,
  toFoundationOperationsAlertContract,
  toFoundationConsumerDependencyContract,
  toFoundationModuleCatalogContract,
  toFoundationAlertCatalogItemContract
} from './foundation.contract'
import type {
  FoundationBlueprint,
  FoundationModuleDescriptor,
  FoundationConsumerDescriptor,
  FoundationGovernanceBaseline,
  FoundationOperationsAlert,
  FoundationAlertCatalogItem,
  FoundationAlertCode,
  FoundationModuleKey
} from '@m5/types'

// ─── Helpers ───

function makeModuleDescriptor(
  overrides: Partial<FoundationModuleDescriptor> = {}
): FoundationModuleDescriptor {
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
  }
}

function makeConsumerDescriptor(
  overrides: Partial<FoundationConsumerDescriptor> = {}
): FoundationConsumerDescriptor {
  return {
    consumer: 'market',
    modulePath: 'src/modules/market',
    dependsOn: ['identity-access' as const, 'configuration-governance' as const],
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
  }
}

function makeGovernanceBaseline(
  overrides: Partial<FoundationGovernanceBaseline> = {}
): FoundationGovernanceBaseline {
  return {
    key: 'configuration.secrets',
    name: 'Secrets baseline',
    ownerModule: 'configuration-governance',
    summary: 'secret governance baseline',
    controls: ['rotation'],
    evidence: ['docs/governance-observability.md'],
    ...overrides
  }
}

function makeBlueprint(overrides: Partial<FoundationBlueprint> = {}): FoundationBlueprint {
  return {
    generatedAt: '2026-06-23T06:00:00Z',
    docs: ['src/modules/foundation/foundation-architecture.md', 'docs/governance.md'],
    guardrails: ['不得绕过底座接入外部系统', '跨租户访问必须隔离'],
    frontendBootstrap: {
      version: '1.0.0',
      bootstrapEndpoint: '/api/v1/foundation/bootstrap',
      deliveredCapabilities: [],
      appProfiles: {} as Record<string, unknown>
    } as unknown as FoundationBlueprint['frontendBootstrap'],
    modules: [makeModuleDescriptor()],
    consumers: [makeConsumerDescriptor()],
    governanceBaselines: [makeGovernanceBaseline()],
    ...overrides
  }
}

function makeOperationsAlert(
  overrides: Partial<FoundationOperationsAlert> = {}
): FoundationOperationsAlert {
  return {
    severity: 'high' as const,
    code: 'approvals-pending',
    count: 5,
    summary: '存在待处理审批单',
    ...overrides
  }
}

// ─── toFoundationModuleContract ───

describe('toFoundationModuleContract()', () => {
  test('maps a full descriptor to contract', () => {
    const descriptor = makeModuleDescriptor()
    const contract = toFoundationModuleContract(descriptor)

    assert.equal(contract.key, 'identity-access')
    assert.equal(contract.name, 'Identity Access')
    assert.equal(contract.purpose, 'auth and authorization')
    assert.equal(contract.capabilities.length, 2)
  })

  test('maps capabilities correctly', () => {
    const descriptor = makeModuleDescriptor()
    const contract = toFoundationModuleContract(descriptor)

    const auth = contract.capabilities.find((c) => c.key === 'identity-access.auth')
    assert.ok(auth, 'should find auth capability')
    assert.equal(auth!.name, 'Authentication')
    assert.deepEqual(auth!.entrypoints, ['/api/v1/auth/login'])
    assert.deepEqual(auth!.consumers, ['market', 'portal'])
    assert.equal(auth!.status, 'active')

    const rbac = contract.capabilities.find((c) => c.key === 'identity-access.rbac')
    assert.ok(rbac, 'should find rbac capability')
    assert.equal(rbac!.name, 'RBAC')
  })

  test('handles descriptor with empty capabilities', () => {
    const descriptor = makeModuleDescriptor({
      capabilities: []
    })
    const contract = toFoundationModuleContract(descriptor)

    assert.equal(contract.capabilities.length, 0)
  })

  test('handles capability with missing optional fields', () => {
    const descriptor: FoundationModuleDescriptor = {
      key: 'identity-access' as FoundationModuleDescriptor['key'],
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
    }
    const contract = toFoundationModuleContract(descriptor)

    assert.equal(contract.key, 'identity-access')
    assert.equal(contract.capabilities.length, 1)
    assert.deepEqual(contract.capabilities[0].entrypoints, [])
    assert.deepEqual(contract.capabilities[0].consumers, [])
  })
})

// ─── toFoundationConsumerContract ───

describe('toFoundationConsumerContract()', () => {
  test('maps a full consumer descriptor', () => {
    const descriptor = makeConsumerDescriptor()
    const contract = toFoundationConsumerContract(descriptor)

    assert.equal(contract.consumer, 'market')
    assert.equal(contract.modulePath, 'src/modules/market')
    assert.deepEqual(contract.dependsOn, ['identity-access', 'configuration-governance'])
    assert.equal(contract.responsibility, '多市场默认值输出')
    assert.deepEqual(contract.governanceTouchpoints, ['/api/v1/foundation/bootstrap'])
    assert.deepEqual(contract.highRiskEntrypoints, [])
  })

  test('handles consumer with empty arrays', () => {
    const descriptor = makeConsumerDescriptor({
      dependsOn: [],
      governanceTouchpoints: [],
      highRiskEntrypoints: []
    })
    const contract = toFoundationConsumerContract(descriptor)

    assert.deepEqual(contract.dependsOn, [])
    assert.deepEqual(contract.governanceTouchpoints, [])
    assert.deepEqual(contract.highRiskEntrypoints, [])
  })

  test('handles high risk entrypoints', () => {
    const descriptor = makeConsumerDescriptor({
      highRiskEntrypoints: ['member-login', 'payment-submit']
    })
    const contract = toFoundationConsumerContract(descriptor)

    assert.deepEqual(contract.highRiskEntrypoints, ['member-login', 'payment-submit'])
  })

  test('preserves modulePath for non-empty descriptor', () => {
    const descriptor = makeConsumerDescriptor({ modulePath: 'src/modules/portal' })
    const contract = toFoundationConsumerContract(descriptor)

    assert.equal(contract.modulePath, 'src/modules/portal')
  })
})

// ─── toFoundationGovernanceBaselineContract ───

describe('toFoundationGovernanceBaselineContract()', () => {
  test('maps a full governance baseline', () => {
    const baseline = makeGovernanceBaseline()
    const contract = toFoundationGovernanceBaselineContract(baseline)

    assert.equal(contract.key, 'configuration.secrets')
    assert.equal(contract.name, 'Secrets baseline')
    assert.equal(contract.ownerModule, 'configuration-governance')
    assert.equal(contract.summary, 'secret governance baseline')
    assert.deepEqual(contract.controls, ['rotation'])
    assert.deepEqual(contract.evidence, ['docs/governance-observability.md'])
  })

  test('handles baseline with multiple controls', () => {
    const baseline = makeGovernanceBaseline({
      controls: ['rotation', 'audit', 'backup']
    })
    const contract = toFoundationGovernanceBaselineContract(baseline)

    assert.deepEqual(contract.controls, ['rotation', 'audit', 'backup'])
  })

  test('handles baseline with multiple evidence entries', () => {
    const baseline = makeGovernanceBaseline({
      evidence: ['docs/a.md', 'docs/b.md']
    })
    const contract = toFoundationGovernanceBaselineContract(baseline)

    assert.deepEqual(contract.evidence, ['docs/a.md', 'docs/b.md'])
  })
})

// ─── toFoundationBootstrapContract ───

describe('toFoundationBootstrapContract()', () => {
  test('maps a full blueprint', () => {
    const blueprint = makeBlueprint()
    const contract = toFoundationBootstrapContract(blueprint)

    assert.equal(contract.generatedAt, '2026-06-23T06:00:00Z')
    assert.equal(contract.docCount, 2)
    assert.equal(contract.guardrails.length, 2)
    assert.equal(contract.frontendBootstrapUrl, null)
    assert.equal(contract.moduleCount, 1)
    assert.deepEqual(contract.moduleNames, ['identity-access'])
    assert.equal(contract.consumerCount, 1)
    assert.deepEqual(contract.consumerNames, ['market'])
    assert.equal(contract.baselineCount, 1)
  })

  test('maps module statuses from capabilities', () => {
    const blueprint = makeBlueprint()
    const contract = toFoundationBootstrapContract(blueprint)

    assert.deepEqual(contract.moduleStatuses, {
      'identity-access.auth': 'active',
      'identity-access.rbac': 'active'
    })
  })

  test('handles blueprint with multiple modules', () => {
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
    })
    const contract = toFoundationBootstrapContract(blueprint)

    assert.equal(contract.moduleCount, 2)
    assert.deepEqual(contract.moduleNames, ['identity-access', 'configuration-governance'])
    assert.deepEqual(contract.moduleStatuses, {
      'identity-access.auth': 'active',
      'identity-access.rbac': 'active',
      'config.secrets': 'active'
    })
  })

  test('handles empty modules and consumers', () => {
    const blueprint = makeBlueprint({
      modules: [],
      consumers: [],
      governanceBaselines: []
    })
    const contract = toFoundationBootstrapContract(blueprint)

    assert.equal(contract.moduleCount, 0)
    assert.deepEqual(contract.moduleNames, [])
    assert.equal(contract.consumerCount, 0)
    assert.deepEqual(contract.consumerNames, [])
    assert.equal(contract.baselineCount, 0)
  })

  test('handles null/undefined frontendBootstrap gracefully', () => {
    const blueprint = makeBlueprint({ frontendBootstrap: undefined })
    const contract = toFoundationBootstrapContract(blueprint)

    assert.equal(contract.frontendBootstrapUrl, null)
  })

  test('handles numeric frontendBootstrap gracefully', () => {
    const blueprint = makeBlueprint({ frontendBootstrap: 42 as unknown as FoundationBlueprint['frontendBootstrap'] })
    const contract = toFoundationBootstrapContract(blueprint)

    assert.equal(contract.frontendBootstrapUrl, null)
  })

  test('handles missing docs gracefully', () => {
    const blueprint = makeBlueprint({ docs: undefined })
    const contract = toFoundationBootstrapContract(blueprint)

    assert.equal(contract.docCount, 0)
  })
})

// ─── toFoundationOperationsAlertContract ───

describe('toFoundationOperationsAlertContract()', () => {
  test('maps a high severity alert', () => {
    const alert = makeOperationsAlert()
    const contract = toFoundationOperationsAlertContract(alert)

    assert.equal(contract.severity, 'high')
    assert.equal(contract.code, 'approvals-pending')
    assert.equal(contract.count, 5)
    assert.equal(contract.summary, '存在待处理审批单')
  })

  test('maps a medium severity alert', () => {
    const alert = makeOperationsAlert({ severity: 'medium', code: 'blocked-rate-limit-ledgers', count: 1 })
    const contract = toFoundationOperationsAlertContract(alert)

    assert.equal(contract.severity, 'medium')
    assert.equal(contract.code, 'blocked-rate-limit-ledgers')
    assert.equal(contract.count, 1)
  })

  test('maps a low severity alert', () => {
    const alert = makeOperationsAlert({ severity: 'low', code: 'recovery-drill-attention', count: 0 })
    const contract = toFoundationOperationsAlertContract(alert)

    assert.equal(contract.severity, 'low')
    assert.equal(contract.code, 'recovery-drill-attention')
    assert.equal(contract.count, 0)
  })

  test('handles zero count alert', () => {
    const alert = makeOperationsAlert({ count: 0 })
    const contract = toFoundationOperationsAlertContract(alert)

    assert.equal(contract.count, 0)
    assert.equal(contract.summary, '存在待处理审批单')
  })
})

// ─── toFoundationOperationsOverviewContract ───

describe('toFoundationOperationsOverviewContract()', () => {
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
  }

  test('maps full overview snapshot', () => {
    const contract = toFoundationOperationsOverviewContract(fullInput)

    assert.equal(contract.generatedAt, '2026-06-23T06:00:00Z')
    assert.equal(contract.approvalCounts.approvalsPending, 3)
    assert.equal(contract.approvalCounts.approvalsWithFailures, 1)
    assert.equal(contract.auditCounts.highRiskAudits, 7)
    assert.equal(contract.rateLimitCounts.blockedLedgers, 2)
    assert.equal(contract.secretCounts.rotationDue, 4)
    assert.equal(contract.secretCounts.expired, 1)
    assert.equal(contract.secretCounts.expiringCertificates, 3)
    assert.equal(contract.secretCounts.expiredCertificates, 0)
    assert.equal(contract.observabilityCounts.degradedSignals, 5)
    assert.equal(contract.recoveryCounts.attentionRequired, 2)
    assert.equal(contract.recoveryCounts.staleDrills, 1)
    assert.equal(contract.runtimeGovernanceCounts.backlog, 8)
    assert.equal(contract.runtimeGovernanceCounts.stalledCallbacks, 3)
    assert.equal(contract.runtimeGovernanceCounts.highRiskBacklog, 2)
    assert.equal(contract.runtimeGovernanceCounts.blockedActions, 1)
    assert.equal(contract.lytGovernanceCounts.alertGroups, 2)
    assert.equal(contract.lytGovernanceCounts.affectedStores, 5)
  })

  test('maps alerts correctly', () => {
    const contract = toFoundationOperationsOverviewContract(fullInput)

    assert.equal(contract.alerts.length, 3)
    assert.equal(contract.alerts[0].code, 'approvals-pending')
    assert.equal(contract.alerts[0].severity, 'high')
    assert.equal(contract.alerts[1].code, 'blocked-rate-limit-ledgers')
    assert.equal(contract.alerts[1].severity, 'medium')
    assert.equal(contract.alertCount, 3)
    assert.equal(contract.highRiskAlertCount, 2)
  })

  test('handles empty alerts', () => {
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
    }
    const contract = toFoundationOperationsOverviewContract(input)

    assert.equal(contract.alerts.length, 0)
    assert.equal(contract.alertCount, 0)
    assert.equal(contract.highRiskAlertCount, 0)
    assert.equal(contract.approvalCounts.approvalsPending, 0)
  })

  test('handles missing summary keys gracefully', () => {
    const input = {
      generatedAt: '2026-06-23T06:00:00Z',
      summary: {} as Record<string, number>,
      alerts: []
    }
    const contract = toFoundationOperationsOverviewContract(input)

    assert.equal(contract.approvalCounts.approvalsPending, 0)
    assert.equal(contract.runtimeGovernanceCounts.backlog, 0)
    assert.equal(contract.lytGovernanceCounts.affectedStores, 0)
  })
})

// ─── toFoundationConsumerDependencyContract ───

describe('toFoundationConsumerDependencyContract()', () => {
  test('maps a found consumer', () => {
    const descriptor = makeConsumerDescriptor()
    const allNames = ['market', 'portal', 'workbench']
    const contract = toFoundationConsumerDependencyContract({
      consumer: descriptor,
      consumerKey: 'market',
      allConsumerNames: allNames
    })

    assert.equal(contract.consumer, 'market')
    assert.equal(contract.found, true)
    assert.equal(contract.modulePath, 'src/modules/market')
    assert.deepEqual(contract.dependsOn, ['identity-access', 'configuration-governance'])
  })

  test('maps an unfound consumer', () => {
    const contract = toFoundationConsumerDependencyContract({
      consumer: undefined,
      consumerKey: 'unknown-consumer',
      allConsumerNames: ['market', 'portal']
    })

    assert.equal(contract.consumer, 'unknown-consumer')
    assert.equal(contract.found, false)
    assert.equal(contract.modulePath, '')
    assert.deepEqual(contract.dependsOn, [])
    assert.equal(contract.responsibility, '未找到对应消费者描述符。')
    assert.deepEqual(contract.governanceTouchpoints, [])
    assert.deepEqual(contract.highRiskEntrypoints, [])
  })

  test('preserves found flag for existing consumer', () => {
    const descriptor = makeConsumerDescriptor({ consumer: 'portal' })
    const contract = toFoundationConsumerDependencyContract({
      consumer: descriptor,
      consumerKey: 'portal',
      allConsumerNames: ['portal']
    })

    assert.equal(contract.found, true)
    assert.equal(contract.consumer, 'portal')
  })
})

// ─── toFoundationModuleCatalogContract ───

describe('toFoundationModuleCatalogContract()', () => {
  test('maps multiple modules', () => {
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
    ]
    const contract = toFoundationModuleCatalogContract(modules)

    assert.equal(contract.moduleCount, 2)
    assert.deepEqual(contract.moduleNames, ['identity-access', 'trust-governance'])
    assert.equal(contract.modules.length, 2)
    assert.equal(contract.modules[0].key, 'identity-access')
    assert.equal(contract.modules[1].key, 'trust-governance')
  })

  test('handles empty modules array', () => {
    const contract = toFoundationModuleCatalogContract([])

    assert.equal(contract.moduleCount, 0)
    assert.deepEqual(contract.moduleNames, [])
    assert.equal(contract.modules.length, 0)
  })

  test('handles single module', () => {
    const modules = [makeModuleDescriptor()]
    const contract = toFoundationModuleCatalogContract(modules)

    assert.equal(contract.moduleCount, 1)
    assert.deepEqual(contract.moduleNames, ['identity-access'])
    assert.equal(contract.modules.length, 1)
  })
})

// ─── toFoundationAlertCatalogItemContract ───

describe('toFoundationAlertCatalogItemContract()', () => {
  test('maps a full alert catalog item', () => {
    const item: FoundationAlertCatalogItem = {
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
    }
    const contract = toFoundationAlertCatalogItemContract(item)

    assert.equal(contract.code, 'approvals-pending')
    assert.equal(contract.defaultSummary, '存在待处理审批单')
    assert.equal(contract.severityPolicy, '数量 >= 5 时为 high')
    assert.deepEqual(contract.sourceModules, ['trust-governance', 'configuration-governance'])
    assert.equal(contract.drilldownEnabled, true)
    assert.equal(contract.acknowledgementEnabled, true)
  })

  test('handles disabled drilldown and acknowledgement', () => {
    const item: FoundationAlertCatalogItem = {
      code: 'runtime-governance-backlog' as FoundationAlertCode,
      defaultSummary: 'summary',
      severityPolicy: 'always low',
      sourceModules: ['resilience-operations' as FoundationModuleKey],
      drilldownPath: '',
      ackPath: '',
      mutePath: '',
      unmutePath: '',
      drilldownEnabled: false,
      acknowledgementEnabled: false
    }
    const contract = toFoundationAlertCatalogItemContract(item)

    assert.equal(contract.drilldownEnabled, false)
    assert.equal(contract.acknowledgementEnabled, false)
  })

  test('handles single source module', () => {
    const item: FoundationAlertCatalogItem = {
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
    }
    const contract = toFoundationAlertCatalogItemContract(item)

    assert.deepEqual(contract.sourceModules, ['runtime-governance'])
  })
})

// ─── Cross-mapper integration ───

describe('contract integration', () => {
  test('full pipeline: blueprint → bootstrap contract → consumer dependency', () => {
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
    })

    const bootstrap = toFoundationBootstrapContract(blueprint)
    assert.equal(bootstrap.moduleCount, 2)
    assert.equal(bootstrap.consumerCount, 2)
    assert.equal(bootstrap.baselineCount, 1)
    assert.deepEqual(bootstrap.consumerNames, ['market', 'portal'])

    const depContract = toFoundationConsumerDependencyContract({
      consumer: blueprint.consumers?.[0] as FoundationConsumerDescriptor | undefined,
      consumerKey: 'market',
      allConsumerNames: bootstrap.consumerNames
    })
    assert.equal(depContract.found, true)
    assert.equal(depContract.consumer, 'market')
  })

  test('pipeline: overview → alerts counting', () => {
    const overview = toFoundationOperationsOverviewContract({
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
    })

    assert.equal(overview.alertCount, 2)
    assert.equal(overview.highRiskAlertCount, 1)
    assert.equal(overview.runtimeGovernanceCounts.backlog, 1)
    assert.equal(overview.runtimeGovernanceCounts.stalledCallbacks, 1)
  })
})
