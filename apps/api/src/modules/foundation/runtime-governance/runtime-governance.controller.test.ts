import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
import { RuntimeGovernanceController } from './runtime-governance.controller'
import {
  PERMISSIONS_METADATA_KEY,
  ROLES_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY
} from '../identity-access/identity-access.decorator'

test('runtime governance controller enforces tenant scope and access metadata', () => {
  const controllerScope = Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, RuntimeGovernanceController)
  assert.deepEqual(controllerScope, {})

  const submitPermissions = Reflect.getMetadata(PERMISSIONS_METADATA_KEY, RuntimeGovernanceController.prototype.submitAction)
  const submitRoles = Reflect.getMetadata(ROLES_METADATA_KEY, RuntimeGovernanceController.prototype.submitAction)
  const getPermissions = Reflect.getMetadata(PERMISSIONS_METADATA_KEY, RuntimeGovernanceController.prototype.getActionReceipt)
  const getRoles = Reflect.getMetadata(ROLES_METADATA_KEY, RuntimeGovernanceController.prototype.getActionReceipt)

  assert.deepEqual(submitPermissions, ['foundation.runtime-governance.write'])
  assert.deepEqual(
    submitRoles,
    ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN']
  )
  assert.deepEqual(getPermissions, ['foundation.runtime-governance.read'])
  assert.deepEqual(
    getRoles,
    ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN']
  )
})
