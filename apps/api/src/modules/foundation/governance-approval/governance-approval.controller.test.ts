import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
import { GovernanceApprovalController } from './governance-approval.controller'

test('governance-approval controller path metadata is set', () => {
  const path = Reflect.getMetadata('path', GovernanceApprovalController)
  assert.equal(path, 'foundation/governance-approval')
})

test('governance-approval controller listApprovals route has GET metadata', () => {
  const method = Reflect.getMetadata('method', GovernanceApprovalController.prototype.listApprovals)
  const path = Reflect.getMetadata('path', GovernanceApprovalController.prototype.listApprovals)
  assert.equal(method, 0)
  assert.equal(path, '/')
})

test('governance-approval controller summarizeApprovals route has GET metadata', () => {
  const method = Reflect.getMetadata('method', GovernanceApprovalController.prototype.summarizeApprovals)
  const path = Reflect.getMetadata('path', GovernanceApprovalController.prototype.summarizeApprovals)
  assert.equal(method, 0)
  assert.equal(path, 'summarize')
})

test('governance-approval controller getApproval route has GET metadata', () => {
  const method = Reflect.getMetadata('method', GovernanceApprovalController.prototype.getApproval)
  const path = Reflect.getMetadata('path', GovernanceApprovalController.prototype.getApproval)
  assert.equal(method, 0)
  assert.equal(path, ':ticket')
})

test('governance-approval controller materializeApproval route has POST metadata', () => {
  const method = Reflect.getMetadata('method', GovernanceApprovalController.prototype.materializeApproval)
  const path = Reflect.getMetadata('path', GovernanceApprovalController.prototype.materializeApproval)
  assert.equal(method, 1)
  assert.equal(path, '/')
})

test('governance-approval controller decideApproval route has POST metadata', () => {
  const method = Reflect.getMetadata('method', GovernanceApprovalController.prototype.decideApproval)
  const path = Reflect.getMetadata('path', GovernanceApprovalController.prototype.decideApproval)
  assert.equal(method, 1)
  assert.equal(path, 'decide')
})

test('governance-approval controller cancelApproval route has POST metadata', () => {
  const method = Reflect.getMetadata('method', GovernanceApprovalController.prototype.cancelApproval)
  const path = Reflect.getMetadata('path', GovernanceApprovalController.prototype.cancelApproval)
  assert.equal(method, 1)
  assert.equal(path, 'cancel')
})

test('governance-approval controller resubmitApproval route has POST metadata', () => {
  const method = Reflect.getMetadata('method', GovernanceApprovalController.prototype.resubmitApproval)
  const path = Reflect.getMetadata('path', GovernanceApprovalController.prototype.resubmitApproval)
  assert.equal(method, 1)
  assert.equal(path, 'resubmit')
})

test('governance-approval controller markExecuted route has POST metadata', () => {
  const method = Reflect.getMetadata('method', GovernanceApprovalController.prototype.markExecuted)
  const path = Reflect.getMetadata('path', GovernanceApprovalController.prototype.markExecuted)
  assert.equal(method, 1)
  assert.equal(path, 'execute')
})

test('governance-approval controller markExecutionFailed route has POST metadata', () => {
  const method = Reflect.getMetadata('method', GovernanceApprovalController.prototype.markExecutionFailed)
  const path = Reflect.getMetadata('path', GovernanceApprovalController.prototype.markExecutionFailed)
  assert.equal(method, 1)
  assert.equal(path, 'execute-failure')
})

test('governance-approval controller instantiates with prisma dependency', () => {
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
