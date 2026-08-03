import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import {
  PERMISSIONS_METADATA_KEY,
  ROLES_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { WorkbenchController } from './workbench.controller'

const WORKBENCH_READ_ROLES = [
  'SUPER_ADMIN',
  'TENANT_ADMIN',
  'BRAND_MANAGER',
  'STORE_MANAGER',
  'GUIDE',
  'CASHIER',
  'OPERATIONS',
  'SECURITY_ADMIN',
]

const WORKBENCH_ACTION_ROLES = ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN']
const WORKBENCH_SECRET_ROTATION_ROLES = ['SUPER_ADMIN', 'SECURITY_ADMIN']

describe('WorkbenchController metadata', () => {
  const readHandlers = [
    WorkbenchController.prototype.getBootstrap,
    WorkbenchController.prototype.getWorkbenches,
    WorkbenchController.prototype.getNavItems,
    WorkbenchController.prototype.checkCapability,
  ]

  const runtimeWriteHandlers = [
    WorkbenchController.prototype.executeApproval,
    WorkbenchController.prototype.submitRuntimeReplay,
    WorkbenchController.prototype.syncHandlerReceipt,
    WorkbenchController.prototype.recordHandlerCallback,
    WorkbenchController.prototype.replayActionReceipt,
  ]

  it('read routes should require tenant scope, workbench roles and workbench.read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler), {})
      assert.deepEqual(Reflect.getMetadata(ROLES_METADATA_KEY, handler), WORKBENCH_READ_ROLES)
      assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), ['workbench.read'])
    })
  })

  it('runtime read route should require tenant scope, action roles and runtime-governance.read', () => {
    assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, WorkbenchController.prototype.getActionReceipt), {})
    assert.deepEqual(Reflect.getMetadata(ROLES_METADATA_KEY, WorkbenchController.prototype.getActionReceipt), WORKBENCH_ACTION_ROLES)
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, WorkbenchController.prototype.getActionReceipt),
      ['foundation.runtime-governance.read'],
    )
  })

  it('runtime write routes should require tenant scope, action roles and runtime-governance.write', () => {
    runtimeWriteHandlers.forEach((handler) => {
      assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler), {})
      assert.deepEqual(Reflect.getMetadata(ROLES_METADATA_KEY, handler), WORKBENCH_ACTION_ROLES)
      assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), ['foundation.runtime-governance.write'])
    })
  })

  it('secret rotation route should require tenant scope, limited roles and runtime-governance.write', () => {
    assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, WorkbenchController.prototype.rotateSecret), {})
    assert.deepEqual(Reflect.getMetadata(ROLES_METADATA_KEY, WorkbenchController.prototype.rotateSecret), WORKBENCH_SECRET_ROTATION_ROLES)
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, WorkbenchController.prototype.rotateSecret),
      ['foundation.runtime-governance.write'],
    )
  })
})
