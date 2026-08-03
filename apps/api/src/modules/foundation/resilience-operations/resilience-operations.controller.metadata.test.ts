import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { ResilienceOperationsController } from './resilience-operations.controller'
import {
  PERMISSIONS_METADATA_KEY,
  ROLES_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../identity-access/identity-access.decorator'

const GOVERNANCE_READ_ROLES = ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN']
const RECOVERY_WRITE_ROLES = ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS']

describe('ResilienceOperationsController metadata', () => {
  const readHandlers = [
    ResilienceOperationsController.prototype.getManagementMetadata,
    ResilienceOperationsController.prototype.getOperationsOverview,
    ResilienceOperationsController.prototype.getObservabilitySignals,
    ResilienceOperationsController.prototype.getRetryPolicies,
    ResilienceOperationsController.prototype.getRecoveryPlans,
    ResilienceOperationsController.prototype.getRecoveryPlan,
  ]

  it('controller should require tenant scope', () => {
    assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, ResilienceOperationsController), {})
  })

  it('read routes should reuse governance read permission and roles', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), ['foundation.governance.read'])
      assert.deepEqual(Reflect.getMetadata(ROLES_METADATA_KEY, handler), GOVERNANCE_READ_ROLES)
    })
  })

  it('stageEdgeReplay should reuse recovery write permission and roles', () => {
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ResilienceOperationsController.prototype.stageEdgeReplay),
      ['foundation.operations.recovery.write'],
    )
    assert.deepEqual(
      Reflect.getMetadata(ROLES_METADATA_KEY, ResilienceOperationsController.prototype.stageEdgeReplay),
      RECOVERY_WRITE_ROLES,
    )
  })
})
