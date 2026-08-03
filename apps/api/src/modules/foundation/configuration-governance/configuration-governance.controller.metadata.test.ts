import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { ConfigurationGovernanceController } from './configuration-governance.controller'
import {
  PERMISSIONS_METADATA_KEY,
  ROLES_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../identity-access/identity-access.decorator'

describe('ConfigurationGovernanceController metadata', () => {
  it('controller should require tenant scope', () => {
    assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, ConfigurationGovernanceController), {})
  })

  it('governance read handlers should reuse governance read metadata', () => {
    ;[
      ConfigurationGovernanceController.prototype.getManagementMetadata,
      ConfigurationGovernanceController.prototype.getOperationsOverview,
      ConfigurationGovernanceController.prototype.getSecretsCertificatePosture,
    ].forEach((handler) => {
      assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), ['foundation.governance.read'])
      assert.deepEqual(
        Reflect.getMetadata(ROLES_METADATA_KEY, handler),
        ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'],
      )
    })
  })

  it('feature flag handlers should reuse feature-flag read/write metadata', () => {
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ConfigurationGovernanceController.prototype.getFeatureFlagRecords),
      ['foundation.feature-flag.read'],
    )
    assert.deepEqual(
      Reflect.getMetadata(ROLES_METADATA_KEY, ConfigurationGovernanceController.prototype.getFeatureFlagRecords),
      ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS'],
    )
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ConfigurationGovernanceController.prototype.saveFeatureFlag),
      ['foundation.feature-flag.write'],
    )
    assert.deepEqual(
      Reflect.getMetadata(ROLES_METADATA_KEY, ConfigurationGovernanceController.prototype.saveFeatureFlag),
      ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS'],
    )
  })

  it('config and secret handlers should reuse dedicated metadata', () => {
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ConfigurationGovernanceController.prototype.getConfigEntries),
      ['foundation.config.read'],
    )
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ConfigurationGovernanceController.prototype.saveConfigEntry),
      ['foundation.config.write'],
    )
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ConfigurationGovernanceController.prototype.getSecrets),
      ['foundation.secret.read'],
    )
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ConfigurationGovernanceController.prototype.getSecret),
      ['foundation.secret.read'],
    )
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ConfigurationGovernanceController.prototype.getCertificates),
      ['foundation.secret.read'],
    )
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ConfigurationGovernanceController.prototype.getCertificate),
      ['foundation.secret.read'],
    )
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ConfigurationGovernanceController.prototype.rotateSecret),
      ['foundation.secret.rotate'],
    )
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ConfigurationGovernanceController.prototype.registerSecret),
      ['foundation.secret.write'],
    )
  })

  it('audit and approval handlers should reuse dedicated metadata', () => {
    ;[
      ConfigurationGovernanceController.prototype.getAudit,
      ConfigurationGovernanceController.prototype.getAuditSummary,
    ].forEach((handler) => {
      assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), ['foundation.audit.read'])
      assert.deepEqual(
        Reflect.getMetadata(ROLES_METADATA_KEY, handler),
        ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'],
      )
    })

    ;[
      ConfigurationGovernanceController.prototype.getApprovals,
      ConfigurationGovernanceController.prototype.getApprovalSummary,
      ConfigurationGovernanceController.prototype.getApprovalDetail,
      ConfigurationGovernanceController.prototype.getApprovalTimeline,
    ].forEach((handler) => {
      assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), ['foundation.approval.read'])
      assert.deepEqual(
        Reflect.getMetadata(ROLES_METADATA_KEY, handler),
        ['SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'],
      )
    })
  })
})
