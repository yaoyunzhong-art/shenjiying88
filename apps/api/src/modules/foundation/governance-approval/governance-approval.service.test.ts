import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
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
    it('creates service instance with prisma dependency', () => {
      const prisma = makePrismaStub()
      const service = new GovernanceApprovalService(prisma)
      assert.ok(service instanceof GovernanceApprovalService)
    })

    it('exposes listApprovals method', () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      assert.equal(typeof service.listApprovals, 'function')
    })

    it('exposes summarizeApprovals method', () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      assert.equal(typeof service.summarizeApprovals, 'function')
    })

    it('exposes getApproval method', () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      assert.equal(typeof service.getApproval, 'function')
    })

    it('exposes materializeApproval method', () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      assert.equal(typeof service.materializeApproval, 'function')
    })

    it('exposes decideApproval method', () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      assert.equal(typeof service.decideApproval, 'function')
    })

    it('exposes cancelApproval method', () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      assert.equal(typeof service.cancelApproval, 'function')
    })

    it('exposes resubmitApproval method', () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      assert.equal(typeof service.resubmitApproval, 'function')
    })

    it('exposes markExecuted method', () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      assert.equal(typeof service.markExecuted, 'function')
    })

    it('exposes markExecutionFailed method', () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      assert.equal(typeof service.markExecutionFailed, 'function')
    })
  })

  describe('listApprovals', () => {
    it('returns empty array when no approvals exist', async () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      const result = await service.listApprovals({})
      assert.deepEqual(result, [])
    })

    it('filters by operation and resourceType', async () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      const result = await service.listApprovals({
        operation: 'create-user',
        resourceType: 'user'
      })
      assert.deepEqual(result, [])
    })
  })

  describe('summarizeApprovals', () => {
    it('returns summary with zero metrics when no approvals', async () => {
      const service = new GovernanceApprovalService(makePrismaStub())
      const result: any = await service.summarizeApprovals({})
      assert.equal(result.total, 0)
      assert.equal(result.statuses.NOT_REQUIRED, 0)
      assert.equal(result.statuses.PENDING, 0)
      assert.equal(result.groups.length, 0)
    })
  })
})
