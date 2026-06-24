import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { GovernanceApprovalModule } from './governance-approval.module'
import { GovernanceApprovalController } from './governance-approval.controller'

const stubPrismaService = {
  governanceApproval: {
    create: async () => ({
      id: 'apr-001',
      approvalTicket: 'APR-TEST-ABC12345',
      operation: 'test.operation',
      resourceType: 'test',
      resourceKey: 'key-001',
      scopeType: 'PLATFORM',
      tenantId: null,
      brandId: null,
      storeId: null,
      required: true,
      requestedBy: 'user-001',
      status: 'PENDING',
      version: 1,
      decisionNote: null,
      decidedBy: null,
      decidedAt: null,
      summary: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findUnique: async () => null,
    findMany: async () => [],
    update: async () => ({}),
  },
}

describe('GovernanceApprovalModule', () => {
  let moduleRef: TestingModule

  test('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [GovernanceApprovalModule],
    })
      .overrideProvider('PrismaService')
      .useValue(stubPrismaService)
      .compile()

    assert.ok(moduleRef)
  })

  test('should provide GovernanceApprovalController', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [GovernanceApprovalModule],
    })
      .overrideProvider('PrismaService')
      .useValue(stubPrismaService)
      .compile()

    const controller = moduleRef.get<GovernanceApprovalController>(
      GovernanceApprovalController,
    )
    assert.ok(controller)
    assert.ok(controller instanceof GovernanceApprovalController)
  })
})
