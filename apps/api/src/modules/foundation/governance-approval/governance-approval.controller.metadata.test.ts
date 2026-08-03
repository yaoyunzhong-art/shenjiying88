import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { GovernanceApprovalController } from './governance-approval.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, GovernanceApprovalController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, GovernanceApprovalController)

describe('GovernanceApprovalController metadata', () => {
  const readHandlers = [
    GovernanceApprovalController.prototype.listApprovals,
    GovernanceApprovalController.prototype.summarizeApprovals,
    GovernanceApprovalController.prototype.getApproval,
  ]

  const writeHandlers = [
    GovernanceApprovalController.prototype.materializeApproval,
    GovernanceApprovalController.prototype.decideApproval,
    GovernanceApprovalController.prototype.cancelApproval,
    GovernanceApprovalController.prototype.resubmitApproval,
    GovernanceApprovalController.prototype.markExecuted,
    GovernanceApprovalController.prototype.markExecutionFailed,
  ]

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse foundation.governance.read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['foundation.governance.read'])
    })
  })

  it('write routes should reuse foundation.governance.write', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['foundation.governance.write'])
    })
  })
})
