import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { RBACController } from './rbac.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler) ??
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, RBACController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler) ??
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, RBACController)

describe('RBACController metadata', () => {
  const readHandlers = [
    RBACController.prototype.getUserRoles,
    RBACController.prototype.checkPermission,
    RBACController.prototype.authorize,
    RBACController.prototype.getUserReport,
    RBACController.prototype.getRolePermissions,
    RBACController.prototype.getProtectedActions,
  ]

  const writeHandlers = [
    RBACController.prototype.assignRole,
    RBACController.prototype.revokeRole,
    RBACController.prototype.registerPolicy,
    RBACController.prototype.registerProtectedActions,
  ]

  it('controller should no longer stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, RBACController), undefined)
  })

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepStrictEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse identity-access:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepStrictEqual(resolvePermissions(handler), ['identity-access:read'])
    })
  })

  it('write routes should reuse identity-access:write', () => {
    writeHandlers.forEach((handler) => {
      assert.deepStrictEqual(resolvePermissions(handler), ['identity-access:write'])
    })
  })
})
