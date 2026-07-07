import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { FoundationModule } from './foundation.module'
import { FoundationController } from './foundation.controller'
import { FoundationService } from './foundation.service'
import { IdentityAccessModule } from './identity-access/identity-access.module'
import { ConfigurationGovernanceModule } from './configuration-governance/configuration-governance.module'
import { IntegrationOrchestrationModule } from './integration-orchestration/integration-orchestration.module'
import { TrustGovernanceModule } from './trust-governance/trust-governance.module'
import { ResilienceOperationsModule } from './resilience-operations/resilience-operations.module'
import { RuntimeGovernanceModule } from './runtime-governance/runtime-governance.module'
import { GovernanceApprovalModule } from './governance-approval/governance-approval.module'

describe('FoundationModule', () => {
  it('FoundationModule exposes controller metadata', () => {
    const controllers = Reflect.getMetadata('controllers', FoundationModule) || []
    assert.ok(controllers.includes(FoundationController), 'FoundationController should be registered')
  })

  it('FoundationModule exposes provider metadata', () => {
    const providers = Reflect.getMetadata('providers', FoundationModule) || []
    assert.ok(providers.includes(FoundationService), 'FoundationService should be registered')
  })

  it('FoundationModule imports all sub-modules', () => {
    const imports = Reflect.getMetadata('imports', FoundationModule) || []

    const expectedModules = [
      IdentityAccessModule,
      ConfigurationGovernanceModule,
      IntegrationOrchestrationModule,
      TrustGovernanceModule,
      ResilienceOperationsModule,
      RuntimeGovernanceModule,
      GovernanceApprovalModule
    ]

    for (const mod of expectedModules) {
      assert.ok(imports.includes(mod), `Should import ${mod.name}`)
    }
  })

  it('FoundationModule exports FoundationService', () => {
    const exports_ = Reflect.getMetadata('exports', FoundationModule) || []
    assert.ok(exports_.includes(FoundationService), 'FoundationService should be exported')
  })

  it('FoundationModule has the expected set of controllers (one)', () => {
    const controllers: unknown[] = Reflect.getMetadata('controllers', FoundationModule) || []
    assert.strictEqual(controllers.length, 1, 'FoundationModule should have exactly 1 controller')
    assert.strictEqual(controllers[0], FoundationController, 'The only controller should be FoundationController')
  })

  it('FoundationModule has exactly 1 provider (FoundationService)', () => {
    const providers: unknown[] = Reflect.getMetadata('providers', FoundationModule) || []
    assert.strictEqual(providers.length, 1, 'FoundationModule should have exactly 1 provider')
    assert.strictEqual(providers[0], FoundationService, 'The only provider should be FoundationService')
  })

  it('FoundationModule imports exactly 7 sub-modules', () => {
    const imports: unknown[] = Reflect.getMetadata('imports', FoundationModule) || []
    assert.strictEqual(imports.length, 7, 'FoundationModule should import exactly 7 sub-modules')
  })

  it('FoundationModule exports only FoundationService', () => {
    const exports_: unknown[] = Reflect.getMetadata('exports', FoundationModule) || []
    assert.strictEqual(exports_.length, 1, 'FoundationModule should export exactly 1 entity')
    assert.strictEqual(exports_[0], FoundationService, 'Should export FoundationService')
  })
})
