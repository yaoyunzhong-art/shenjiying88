import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { PermissionController } from './permission.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, PermissionController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, PermissionController)

describe('PermissionController metadata', () => {
  const handlers = [
    PermissionController.prototype.getAllRoles,
    PermissionController.prototype.getAllPermissions,
    PermissionController.prototype.checkPermission,
    PermissionController.prototype.batchCheckPermission,
    PermissionController.prototype.getMyPermissions,
  ]

  it('all routes should require tenant scope', () => {
    handlers.forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('all routes should reuse identity-access:read', () => {
    handlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['identity-access:read'])
    })
  })
})
