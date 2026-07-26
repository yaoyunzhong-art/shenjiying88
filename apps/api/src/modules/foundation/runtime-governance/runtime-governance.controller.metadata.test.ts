import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { RuntimeGovernanceController } from './runtime-governance.controller'
import {
  PERMISSIONS_METADATA_KEY,
  ROLES_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../identity-access/identity-access.decorator'

const RUNTIME_ROLES = ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN']

describe('RuntimeGovernanceController metadata', () => {
  it('controller should require tenant scope', () => {
    assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, RuntimeGovernanceController), {})
  })

  it('read routes should reuse runtime governance read metadata', () => {
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, RuntimeGovernanceController.prototype.getActionReceipt),
      ['foundation.runtime-governance.read'],
    )
    assert.deepEqual(
      Reflect.getMetadata(ROLES_METADATA_KEY, RuntimeGovernanceController.prototype.getActionReceipt),
      RUNTIME_ROLES,
    )
  })

  it('write routes should reuse runtime governance write metadata', () => {
    ;[
      RuntimeGovernanceController.prototype.submitAction,
      RuntimeGovernanceController.prototype.syncAction,
      RuntimeGovernanceController.prototype.recordCallback,
      RuntimeGovernanceController.prototype.replayAction,
    ].forEach((handler) => {
      assert.deepEqual(
        Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler),
        ['foundation.runtime-governance.write'],
      )
      assert.deepEqual(Reflect.getMetadata(ROLES_METADATA_KEY, handler), RUNTIME_ROLES)
    })
  })
})
