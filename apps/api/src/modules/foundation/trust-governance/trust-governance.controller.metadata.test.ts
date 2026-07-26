import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { TrustGovernanceController } from './trust-governance.controller'
import {
  PERMISSIONS_METADATA_KEY,
  ROLES_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../identity-access/identity-access.decorator'

describe('TrustGovernanceController metadata', () => {
  it('controller should require tenant scope', () => {
    assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, TrustGovernanceController), {})
  })

  it('governance overview handlers should reuse governance read metadata', () => {
    ;[
      TrustGovernanceController.prototype.getManagementMetadata,
      TrustGovernanceController.prototype.getOperationsOverview,
    ].forEach((handler) => {
      assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), ['foundation.governance.read'])
      assert.deepEqual(
        Reflect.getMetadata(ROLES_METADATA_KEY, handler),
        ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'],
      )
    })
  })

  it('approval handlers should reuse approval read/decide metadata', () => {
    ;[
      TrustGovernanceController.prototype.getApprovals,
      TrustGovernanceController.prototype.getApprovalSummary,
      TrustGovernanceController.prototype.getApprovalDetail,
      TrustGovernanceController.prototype.getApprovalTimeline,
    ].forEach((handler) => {
      assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), ['foundation.approval.read'])
      assert.deepEqual(
        Reflect.getMetadata(ROLES_METADATA_KEY, handler),
        ['SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'],
      )
    })

    ;[
      TrustGovernanceController.prototype.approveApproval,
      TrustGovernanceController.prototype.rejectApproval,
      TrustGovernanceController.prototype.cancelApproval,
      TrustGovernanceController.prototype.resubmitApproval,
    ].forEach((handler) => {
      assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), ['foundation.approval.decide'])
      assert.deepEqual(
        Reflect.getMetadata(ROLES_METADATA_KEY, handler),
        ['SUPER_ADMIN', 'SECURITY_ADMIN'],
      )
    })
  })

  it('audit and rate-limit handlers should reuse dedicated metadata where defined', () => {
    ;[
      TrustGovernanceController.prototype.getAudit,
      TrustGovernanceController.prototype.getAuditSummary,
    ].forEach((handler) => {
      assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), ['foundation.audit.read'])
      assert.deepEqual(
        Reflect.getMetadata(ROLES_METADATA_KEY, handler),
        ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'],
      )
    })

    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, TrustGovernanceController.prototype.getRateLimitPolicies),
      ['foundation.rate-limit-policy.read'],
    )
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, TrustGovernanceController.prototype.saveRateLimitPolicy),
      ['foundation.rate-limit-policy.write'],
    )
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, TrustGovernanceController.prototype.getQuotaLedgers),
      ['foundation.quota-ledger.read'],
    )
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, TrustGovernanceController.prototype.resetQuotaLedgers),
      ['foundation.quota-ledger.reset'],
    )
  })
})
