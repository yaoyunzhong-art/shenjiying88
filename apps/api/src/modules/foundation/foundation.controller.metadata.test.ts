import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { FoundationController } from './foundation.controller'
import {
  PERMISSIONS_METADATA_KEY,
  ROLES_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from './identity-access/identity-access.decorator'

const ALERT_WRITE_ROLES = ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN']

describe('FoundationController metadata', () => {
  const basicReadHandlers = [
    FoundationController.prototype.getBootstrap,
    FoundationController.prototype.getModules,
    FoundationController.prototype.getConsumers,
    FoundationController.prototype.getConsumer,
  ]

  const protectedReadHandlers = [
    FoundationController.prototype.getOperationsOverview,
    FoundationController.prototype.getOperationsAlerts,
    FoundationController.prototype.getOperationsAlertsCatalog,
    FoundationController.prototype.getOperationsAlertDrilldown,
    FoundationController.prototype.getOperationsModuleDetail,
  ]

  const alertWriteHandlers = [
    FoundationController.prototype.acknowledgeOperationsAlert,
    FoundationController.prototype.muteOperationsAlert,
    FoundationController.prototype.unmuteOperationsAlert,
  ]

  it('basic read handlers should stay permissionless and tenant-scope-free', () => {
    basicReadHandlers.forEach((handler) => {
      assert.equal(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler), undefined)
      assert.equal(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), undefined)
      assert.equal(Reflect.getMetadata(ROLES_METADATA_KEY, handler), undefined)
    })
  })

  it('protected read handlers should require tenant scope only', () => {
    protectedReadHandlers.forEach((handler) => {
      assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler), {})
      assert.equal(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), undefined)
      assert.equal(Reflect.getMetadata(ROLES_METADATA_KEY, handler), undefined)
    })
  })

  it('alert write handlers should require tenant scope, roles and alerts write permission', () => {
    alertWriteHandlers.forEach((handler) => {
      assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler), {})
      assert.deepEqual(Reflect.getMetadata(ROLES_METADATA_KEY, handler), ALERT_WRITE_ROLES)
      assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), ['foundation.operations.alerts.write'])
    })
  })
})
