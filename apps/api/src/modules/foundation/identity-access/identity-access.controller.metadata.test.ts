import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { IdentityAccessController } from './identity-access.controller'
import {
  PERMISSIONS_METADATA_KEY,
  ROLES_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from './identity-access.decorator'

describe('IdentityAccessController metadata', () => {
  it('validateRole should require expected roles only', () => {
    assert.deepEqual(
      Reflect.getMetadata(ROLES_METADATA_KEY, IdentityAccessController.prototype.validateRole),
      ['tenant-admin', 'platform-admin'],
    )
    assert.equal(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, IdentityAccessController.prototype.validateRole),
      undefined,
    )
    assert.equal(
      Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, IdentityAccessController.prototype.validateRole),
      undefined,
    )
  })

  it('validatePermission should require identity-access:read only', () => {
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, IdentityAccessController.prototype.validatePermission),
      ['identity-access:read'],
    )
    assert.equal(
      Reflect.getMetadata(ROLES_METADATA_KEY, IdentityAccessController.prototype.validatePermission),
      undefined,
    )
    assert.equal(
      Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, IdentityAccessController.prototype.validatePermission),
      undefined,
    )
  })

  it('validateTenantScope should require tenant:read and explicit tenant param scope', () => {
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, IdentityAccessController.prototype.validateTenantScope),
      ['tenant:read'],
    )
    assert.deepEqual(
      Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, IdentityAccessController.prototype.validateTenantScope),
      { tenantIdParam: 'tenantId', useRequestTenant: false },
    )
    assert.equal(
      Reflect.getMetadata(ROLES_METADATA_KEY, IdentityAccessController.prototype.validateTenantScope),
      undefined,
    )
  })
})
