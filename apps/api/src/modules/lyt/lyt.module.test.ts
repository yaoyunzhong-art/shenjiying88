import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import { Global, Module } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import { LytModule } from './lyt.module'
import { LytController } from './lyt.controller'
import { LytAdapterRegistry } from './lyt-adapter.registry'
import { LytService } from './lyt.service'
import { LytConnectionManager } from './lyt-connection.manager'
import { MockLytAdapter } from './adapters/mock-lyt.adapter'
import { RealLytAdapter } from './adapters/real-lyt.adapter'
import { SandboxLytAdapter } from './adapters/sandbox-lyt.adapter'
import { FoundationModule } from '../foundation/foundation.module'
import { IntegrationOrchestrationService } from '../foundation/integration-orchestration/integration-orchestration.service'

const stubFoundationService = {
  getDependencySummary: () => ({
    dependsOn: ['identity-access', 'configuration-governance'],
    handoffContracts: ['contract-a', 'contract-b']
  })
}

const stubIntegrationOrchestrationService = {
  acceptWebhook: async () => ({ status: 'accepted', source: 'lyt', idempotency: { key: 'lyt:evt-1' } }),
  publishEvent: async () => ({ status: 'accepted', envelope: { aggregateId: 'evt-1' } })
}

/** 轻量 stub 替代 FoundationModule，避免引入全部 sub‑module 和 Prisma 依赖 */
@Global()
@Module({
  providers: [
    { provide: 'FoundationService', useValue: stubFoundationService },
    { provide: IntegrationOrchestrationService, useValue: stubIntegrationOrchestrationService }
  ],
  exports: ['FoundationService', IntegrationOrchestrationService]
})
class StubFoundationModule {}

function createTestingModule(): Promise<TestingModule> {
  return Test.createTestingModule({ imports: [LytModule] })
    .overrideModule(FoundationModule)
    .useModule(StubFoundationModule)
    .compile()
}

describe('LytModule', () => {
  it('should compile and instantiate', async () => {
    const moduleRef = await createTestingModule()
    assert.ok(moduleRef)
  })

  it('should provide LytController', async () => {
    const moduleRef = await createTestingModule()
    const controller = moduleRef.get<LytController>(LytController)
    assert.ok(controller)
    assert.ok(controller instanceof LytController)
  })

  it('should provide LytService', async () => {
    const moduleRef = await createTestingModule()
    const service = moduleRef.get<LytService>(LytService)
    assert.ok(service)
    assert.ok(service instanceof LytService)
  })

  it('should provide LytConnectionManager', async () => {
    const moduleRef = await createTestingModule()
    const manager = moduleRef.get<LytConnectionManager>(LytConnectionManager)
    assert.ok(manager)
    assert.ok(manager instanceof LytConnectionManager)
  })

  it('should provide MockLytAdapter', async () => {
    const moduleRef = await createTestingModule()
    const adapter = moduleRef.get<MockLytAdapter>(MockLytAdapter)
    assert.ok(adapter)
    assert.ok(adapter instanceof MockLytAdapter)
  })

  it('should provide SandboxLytAdapter and RealLytAdapter', async () => {
    const moduleRef = await createTestingModule()
    const sandbox = moduleRef.get<SandboxLytAdapter>(SandboxLytAdapter)
    const real = moduleRef.get<RealLytAdapter>(RealLytAdapter)
    assert.ok(sandbox instanceof SandboxLytAdapter)
    assert.ok(real instanceof RealLytAdapter)
  })

  it('should provide LytAdapterRegistry', async () => {
    const moduleRef = await createTestingModule()
    const registry = moduleRef.get<LytAdapterRegistry>(LytAdapterRegistry)
    assert.ok(registry)
    assert.ok(registry instanceof LytAdapterRegistry)
  })
})
