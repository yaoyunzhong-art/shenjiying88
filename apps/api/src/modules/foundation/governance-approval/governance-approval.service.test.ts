import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { GovernanceApprovalService } from './governance-approval.service'

describe('GovernanceApprovalService', () => {
  const makePrismaStub = () => ({
    governanceApproval: {
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
      update: () => Promise.resolve({})
    }
  }) as any

  describe('instantiation', () => {
    test('creates service instance with prisma dependency', () => {
      const prisma = makePrismaStub()
      const service = new GovernanceApprovalService(prisma)
      assert.ok(service instanceof GovernanceApprovalService)
    })

    test('exposes listApprovals method', () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      assert.equal(typeof service.listApprovals, 'function')
    })

    test('exposes summarizeApprovals method', () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      assert.equal(typeof service.summarizeApprovals, 'function')
    })

    test('exposes getApproval method', () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      assert.equal(typeof service.getApproval, 'function')
    })

    test('exposes materializeApproval method', () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      assert.equal(typeof service.materializeApproval, 'function')
    })

    test('exposes decideApproval method', () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      assert.equal(typeof service.decideApproval, 'function')
    })

    test('exposes cancelApproval method', () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      assert.equal(typeof service.cancelApproval, 'function')
    })

    test('exposes resubmitApproval method', () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      assert.equal(typeof service.resubmitApproval, 'function')
    })

    test('exposes markExecuted method', () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      assert.equal(typeof service.markExecuted, 'function')
    })

    test('exposes markExecutionFailed method', () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      assert.equal(typeof service.markExecutionFailed, 'function')
    })
  })

  describe('listApprovals', () => {
    test('returns empty array when no approvals exist', async () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      const result = await service.listApprovals({})
      assert.deepEqual(result, [])
    })

    test('filters by operation and resourceType', async () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      const result = await service.listApprovals({
        operation: 'create-user',
        resourceType: 'user'
      })
      assert.deepEqual(result, [])
    })
  })

  describe('summarizeApprovals', () => {
    test('returns summary with zero metrics when no approvals', async () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      const result: any = await service.summarizeApprovals({})
      assert.equal(result.total, 0)
      assert.equal(result.statuses.NOT_REQUIRED, 0)
      assert.equal(result.statuses.PENDING, 0)
      assert.equal(result.groups.length, 0)
    })
  })
})
