import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ConfigurationGovernanceService } from './configuration-governance/configuration-governance.service'
import { FoundationService } from './foundation.service'
import { IdentityAccessService } from './identity-access/identity-access.service'
import { IntegrationOrchestrationService } from './integration-orchestration/integration-orchestration.service'
import { ResilienceOperationsService } from './resilience-operations/resilience-operations.service'
import { RuntimeGovernanceService } from './runtime-governance/runtime-governance.service'
import { TrustGovernanceService } from './trust-governance/trust-governance.service'

function buildModuleStub(key: string) {
  return {
    getDescriptor: () => ({
      key,
      name: key,
      purpose: 'stub',
      inboundContracts: [],
      outboundContracts: [],
      capabilities: []
    }),
    getGovernanceBaselines: () => [],
    getOperationsOverview: async () => ({}),
    listGovernanceApprovals: async () => [],
    getAuditRecords: async () => [],
    listQuotaLedgers: async () => [],
    getSecretMetadata: async () => []
  }
}

it('contract: foundation module detail returns available keys on unknown moduleKey', async () => {
  const service = new FoundationService(
    buildModuleStub('identity-access') as never,
    buildModuleStub('configuration-governance') as never,
    buildModuleStub('integration-orchestration') as never,
    buildModuleStub('trust-governance') as never,
    buildModuleStub('resilience-operations') as never,
    buildModuleStub('runtime-governance') as never,
    {} as never
  )

  const result = await service.getOperationsModuleDetail('unknown-module', undefined)
  assert.equal(Array.isArray((result as Record<string, unknown>).availableModuleKeys), true)
  assert.equal(((result as Record<string, unknown>).availableModuleKeys as string[]).includes('runtime-governance'), true)
})

it('contract: foundation alert drilldown returns available codes on unknown code', async () => {
  const service = new FoundationService(
    buildModuleStub('identity-access') as never,
    buildModuleStub('configuration-governance') as never,
    buildModuleStub('integration-orchestration') as never,
    buildModuleStub('trust-governance') as never,
    buildModuleStub('resilience-operations') as never,
    buildModuleStub('runtime-governance') as never,
    {} as never
  )

  const result = await service.getOperationsAlertDrilldown('unknown-alert', undefined)
  assert.equal(Array.isArray((result as Record<string, unknown>).availableAlertCodes), true)
  assert.equal(
    ((result as Record<string, unknown>).availableAlertCodes as string[]).includes('runtime-governance-backlog'),
    true
  )
})

it('contract: foundation module descriptors expose active capabilities', () => {
  const descriptors = [
    new IdentityAccessService().getDescriptor(),
    new ConfigurationGovernanceService({} as never, {} as never).getDescriptor(),
    new IntegrationOrchestrationService({} as never, {} as never).getDescriptor(),
    new TrustGovernanceService({} as never).getDescriptor(),
    new ResilienceOperationsService().getDescriptor(),
    new RuntimeGovernanceService({} as never, {} as never, {} as never).getDescriptor()
  ]

  for (const descriptor of descriptors) {
    assert.equal(descriptor.capabilities.length > 0, true)
    assert.equal(descriptor.capabilities.every((capability) => capability.status === 'active'), true)
  }
})
