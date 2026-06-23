import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { IntegrationOrchestrationModule } from './integration-orchestration.module'
import { IntegrationOrchestrationController } from './integration-orchestration.controller'
import { IntegrationOrchestrationService } from './integration-orchestration.service'

const stubPrismaService = {
  domainEvent: {
    create: async () => ({
      id: 'evt-001',
      eventType: 'test.event',
      aggregateType: 'test',
      aggregateId: 'agg-001',
      idempotencyKey: 'ik-001',
      status: 'PUBLISHED',
      payload: {},
      headers: {},
      occurredAt: new Date(),
      createdAt: new Date(),
    }),
    findUnique: async () => null,
    findMany: async () => [],
  },
}

const stubTrustGovernanceService = {
  recordAudit: async () => {},
}

describe('IntegrationOrchestrationModule', () => {
  let moduleRef: TestingModule

  test('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [IntegrationOrchestrationModule],
    })
      .overrideProvider('PrismaService')
      .useValue(stubPrismaService)
      .overrideProvider('TrustGovernanceService')
      .useValue(stubTrustGovernanceService)
      .compile()

    assert.ok(moduleRef)
  })

  test('should provide IntegrationOrchestrationController', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [IntegrationOrchestrationModule],
    })
      .overrideProvider('PrismaService')
      .useValue(stubPrismaService)
      .overrideProvider('TrustGovernanceService')
      .useValue(stubTrustGovernanceService)
      .compile()

    const controller = moduleRef.get<IntegrationOrchestrationController>(
      IntegrationOrchestrationController,
    )
    assert.ok(controller)
    assert.ok(controller instanceof IntegrationOrchestrationController)
  })

  test('should provide IntegrationOrchestrationService', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [IntegrationOrchestrationModule],
    })
      .overrideProvider('PrismaService')
      .useValue(stubPrismaService)
      .overrideProvider('TrustGovernanceService')
      .useValue(stubTrustGovernanceService)
      .compile()

    const service = moduleRef.get<IntegrationOrchestrationService>(
      IntegrationOrchestrationService,
    )
    assert.ok(service)
    assert.ok(service instanceof IntegrationOrchestrationService)
  })
})
