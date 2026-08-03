import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { SsoController } from './sso.controller'
import { TENANT_OPTIONAL_KEY } from '../agent/tenant-guard.decorator'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, SsoController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, SsoController)

describe('SsoController metadata', () => {
  const readHandlers = [
    SsoController.prototype.list,
    SsoController.prototype.getOne,
    SsoController.prototype.listIdentities,
  ]

  const writeHandlers = [
    SsoController.prototype.createSaml,
    SsoController.prototype.createOidc,
    SsoController.prototype.update,
    SsoController.prototype.delete,
  ]

  const publicHandlers = [
    SsoController.prototype.initiateLogin,
    SsoController.prototype.completeLogin,
    SsoController.prototype.verify,
  ]

  it('controller should no longer stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, SsoController), undefined)
  })

  it('protected routes should require tenant scope', () => {
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

  it('public login routes should stay permissionless', () => {
    publicHandlers.forEach((handler) => {
      assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, handler), true)
      assert.equal(Reflect.getMetadata(TENANT_OPTIONAL_KEY, handler), true)
      assert.equal(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), undefined)
      assert.equal(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler), undefined)
    })
  })
})
