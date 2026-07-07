import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { GovernanceApprovalController } from './governance-approval.controller'

it('governance-approval controller path metadata is set', () => {
  const path = Reflect.getMetadata('path', GovernanceApprovalController)
  assert.equal(path, 'foundation/governance-approval')
})

it('governance-approval controller listApprovals route has GET metadata', () => {
  const method = Reflect.getMetadata('method', GovernanceApprovalController.prototype.listApprovals)
  const path = Reflect.getMetadata('path', GovernanceApprovalController.prototype.listApprovals)
  assert.equal(method, 0)
  assert.equal(path, '/')
})

it('governance-approval controller summarizeApprovals route has GET metadata', () => {
  const method = Reflect.getMetadata('method', GovernanceApprovalController.prototype.summarizeApprovals)
  const path = Reflect.getMetadata('path', GovernanceApprovalController.prototype.summarizeApprovals)
  assert.equal(method, 0)
  assert.equal(path, 'summarize')
})

it('governance-approval controller getApproval route has GET metadata', () => {
  const method = Reflect.getMetadata('method', GovernanceApprovalController.prototype.getApproval)
  const path = Reflect.getMetadata('path', GovernanceApprovalController.prototype.getApproval)
  assert.equal(method, 0)
  assert.equal(path, ':ticket')
})

it('governance-approval controller materializeApproval route has POST metadata', () => {
  const method = Reflect.getMetadata('method', GovernanceApprovalController.prototype.materializeApproval)
  const path = Reflect.getMetadata('path', GovernanceApprovalController.prototype.materializeApproval)
  assert.equal(method, 1)
  assert.equal(path, '/')
})

it('governance-approval controller decideApproval route has POST metadata', () => {
  const method = Reflect.getMetadata('method', GovernanceApprovalController.prototype.decideApproval)
  const path = Reflect.getMetadata('path', GovernanceApprovalController.prototype.decideApproval)
  assert.equal(method, 1)
  assert.equal(path, 'decide')
})

it('governance-approval controller cancelApproval route has POST metadata', () => {
  const method = Reflect.getMetadata('method', GovernanceApprovalController.prototype.cancelApproval)
  const path = Reflect.getMetadata('path', GovernanceApprovalController.prototype.cancelApproval)
  assert.equal(method, 1)
  assert.equal(path, 'cancel')
})

it('governance-approval controller resubmitApproval route has POST metadata', () => {
  const method = Reflect.getMetadata('method', GovernanceApprovalController.prototype.resubmitApproval)
  const path = Reflect.getMetadata('path', GovernanceApprovalController.prototype.resubmitApproval)
  assert.equal(method, 1)
  assert.equal(path, 'resubmit')
})

it('governance-approval controller markExecuted route has POST metadata', () => {
  const method = Reflect.getMetadata('method', GovernanceApprovalController.prototype.markExecuted)
  const path = Reflect.getMetadata('path', GovernanceApprovalController.prototype.markExecuted)
  assert.equal(method, 1)
  assert.equal(path, 'execute')
})

it('governance-approval controller markExecutionFailed route has POST metadata', () => {
  const method = Reflect.getMetadata('method', GovernanceApprovalController.prototype.markExecutionFailed)
  const path = Reflect.getMetadata('path', GovernanceApprovalController.prototype.markExecutionFailed)
  assert.equal(method, 1)
  assert.equal(path, 'execute-failure')
})

it('governance-approval controller instantiates with prisma dependency', () => {
  const prisma = { $connect: () => Promise.resolve() } as any
  const controller = new GovernanceApprovalController(prisma)
  assert.ok(controller instanceof GovernanceApprovalController)
  assert.strictEqual(typeof controller.listApprovals, 'function')
  assert.strictEqual(typeof controller.summarizeApprovals, 'function')
  assert.strictEqual(typeof controller.getApproval, 'function')
  assert.strictEqual(typeof controller.materializeApproval, 'function')
  assert.strictEqual(typeof controller.decideApproval, 'function')
  assert.strictEqual(typeof controller.cancelApproval, 'function')
  assert.strictEqual(typeof controller.resubmitApproval, 'function')
  assert.strictEqual(typeof controller.markExecuted, 'function')
  assert.strictEqual(typeof controller.markExecutionFailed, 'function')
})
