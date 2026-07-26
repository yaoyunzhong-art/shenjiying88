import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { LicenseController } from './license.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, LicenseController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, LicenseController)

describe('LicenseController metadata', () => {
  const readHandlers = [
    LicenseController.prototype.check,
    LicenseController.prototype.listTenantLicenses,
    LicenseController.prototype.listStoreLicenses,
    LicenseController.prototype.listAudit,
    LicenseController.prototype.verifyActivationCode,
  ]

  const writeHandlers = [
    LicenseController.prototype.suspend,
    LicenseController.prototype.activate,
    LicenseController.prototype.generateActivationCode,
  ]

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse finance:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['finance:read'])
    })
  })

  it('write routes should reuse finance:*', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['finance:*'])
    })
  })
})
