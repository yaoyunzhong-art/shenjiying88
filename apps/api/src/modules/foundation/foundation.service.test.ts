import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { FoundationService } from './foundation.service'
import type { FoundationModuleDescriptor, FoundationConsumerDescriptor, FoundationBlueprint } from './foundation.types'

const descriptor = (key: string): FoundationModuleDescriptor => ({
  key: key as any,
  name: key,
  purpose: `${key} module`,
  inboundContracts: [],
  outboundContracts: [],
  capabilities: [],
  // extended fields for backward compat
  moduleKey: key,
  modulePath: `src/modules/${key}`,
  displayName: key,
  description: `${key} module`,
  domainResponsibilities: [],
  consumers: [],
  managementMetadata: [],
  governanceBaselines: [],
  operationsDashboard: {
    overview: {},
    drilldowns: {}
  }
} as any)

const governanceBaselines = [
  { key: 'baseline-1', name: 'Baseline 1' },
  { key: 'baseline-2', name: 'Baseline 2' }
]

const mockIdentityAccessService = { getDescriptor: () => descriptor('identity') } as never
const mockConfigurationGovernanceService = {
  getDescriptor: () => descriptor('configuration'),
  getGovernanceBaselines: () => governanceBaselines
} as never
const mockIntegrationOrchestrationService = { getDescriptor: () => descriptor('integration') } as never
const mockTrustGovernanceService = {
  getDescriptor: () => descriptor('trust'),
  getGovernanceBaselines: () => governanceBaselines
} as never
const mockResilienceOperationsService = {
  getDescriptor: () => descriptor('resilience'),
  getGovernanceBaselines: () => governanceBaselines
} as never
const mockRuntimeGovernanceService = { getDescriptor: () => descriptor('runtime') } as never
const mockPrisma = {} as never

function makeService(): FoundationService {
  return new FoundationService(
    mockIdentityAccessService,
    mockConfigurationGovernanceService,
    mockIntegrationOrchestrationService,
    mockTrustGovernanceService,
    mockResilienceOperationsService,
    mockRuntimeGovernanceService,
    mockPrisma
  )
}

describe('FoundationService', () => {
  describe('getModuleCatalog', () => {
    it('returns six modules', () => {
      const service = makeService()
      const catalog = service.getModuleCatalog()
      assert.equal(catalog.length, 6)
    })

    it('returns modules with required fields', () => {
      const service = makeService()
      for (const m of service.getModuleCatalog()) {
        assert.ok(m.key, 'key')
        assert.ok(m.name, 'name')
        assert.ok(m.purpose, 'purpose')
        assert.ok(Array.isArray(m.capabilities), 'capabilities')
      }
    })

    it('includes expected module keys', () => {
      const service = makeService()
      const keys = service.getModuleCatalog().map((m) => m.key).sort()
      assert.deepEqual(keys, ['configuration', 'identity', 'integration', 'resilience', 'runtime', 'trust'])
    })
  })

  describe('getConsumerCatalog', () => {
    it('returns four consumers', () => {
      const service = makeService()
      const catalog = service.getConsumerCatalog()
      assert.equal(catalog.length, 4)
    })

    it('each consumer has required fields', () => {
      const service = makeService()
      for (const c of service.getConsumerCatalog()) {
        assert.ok(c.consumer, 'consumer')
        assert.ok(Array.isArray(c.dependsOn), 'dependsOn')
        assert.ok(c.responsibility, 'responsibility')
      }
    })

    it('includes market, portal, workbench, and lyt-adapter consumers', () => {
      const service = makeService()
      const keys = service.getConsumerCatalog().map((c) => c.consumer).sort()
      assert.deepEqual(keys, ['lyt-adapter', 'market', 'portal', 'workbench'])
    })
  })

  describe('getGovernanceBaselines', () => {
    it('returns six baselines from three sub-services', () => {
      const service = makeService()
      const baselines = service.getGovernanceBaselines()
      assert.equal(baselines.length, 6)
    })

    it('each baseline has key and name', () => {
      const service = makeService()
      for (const b of service.getGovernanceBaselines()) {
        assert.ok(b.key, 'key')
        assert.ok(b.name, 'name')
      }
    })
  })

  describe('getBlueprint', () => {
    it('returns blueprint with required top-level fields', () => {
      const service = makeService()
      const blueprint = service.getBlueprint()
      assert.ok(blueprint.generatedAt, 'generatedAt')
      assert.ok(Array.isArray(blueprint.docs), 'docs')
      assert.ok(Array.isArray(blueprint.guardrails), 'guardrails')
      assert.ok(blueprint.modules, 'modules')
      assert.ok(blueprint.consumers, 'consumers')
      assert.ok(blueprint.governanceBaselines, 'governanceBaselines')
    })

    it('blueprint composits modules, consumers, and baselines', () => {
      const service = makeService()
      const blueprint = service.getBlueprint()
      assert.equal(blueprint.modules.length, 6)
      assert.equal(blueprint.consumers.length, 4)
      assert.equal(blueprint.governanceBaselines.length, 6)
    })

    it('blueprint docs include foundation-architecture.md', () => {
      const service = makeService()
      const blueprint = service.getBlueprint()
      assert.ok(blueprint.docs.some((d) => d.includes('foundation-architecture.md')))
    })

    it('blueprint guardrails are non-empty strings', () => {
      const service = makeService()
      for (const g of service.getBlueprint().guardrails) {
        assert.ok(typeof g === 'string' && g.length > 0)
      }
    })

    it('frontendBootstrap is defined', () => {
      const service = makeService()
      const blueprint = service.getBlueprint()
      assert.ok(blueprint.frontendBootstrap !== undefined)
      assert.ok(blueprint.frontendBootstrap !== null)
    })

    it('generatedAt is a valid ISO string', () => {
      const service = makeService()
      const blueprint = service.getBlueprint()
      const d = new Date(blueprint.generatedAt)
      assert.ok(!isNaN(d.getTime()))
    })
  })

  describe('getConsumerDependency', () => {
    it('returns matching consumer for known key', () => {
      const service = makeService()
      const dep = service.getConsumerDependency('market')
      assert.ok(dep)
      assert.equal((dep as any).consumer, 'market')
    })

    it('returns availableConsumers for unknown key', () => {
      const service = makeService()
      const dep = service.getConsumerDependency('nonexistent')
      assert.ok(Array.isArray((dep as any).availableConsumers))
      assert.ok((dep as any).availableConsumers.includes('market'))
    })

    it('availableConsumers includes all four keys', () => {
      const service = makeService()
      const dep = service.getConsumerDependency('unknown')
      assert.deepEqual((dep as any).availableConsumers.sort(), ['lyt-adapter', 'market', 'portal', 'workbench'])
    })
  })

  describe('getDependencySummary', () => {
    it('returns consumer for known key', () => {
      const service = makeService()
      const summary = service.getDependencySummary('portal')
      assert.ok(summary)
      assert.equal(summary.consumer, 'portal')
    })

    it('returns undefined for unknown key', () => {
      const service = makeService()
      const summary = service.getDependencySummary('nonexistent' as never)
      assert.equal(summary, undefined)
    })
  })
})
