import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { CustomDomainController } from './custom-domain.controller'
import { TENANT_OPTIONAL_KEY } from '../agent/tenant-guard.decorator'
import {
  PERMISSIONS_METADATA_KEY,
  ROLES_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

describe('CustomDomainController metadata', () => {
  const readRoles = [
    'SUPER_ADMIN',
    'TENANT_ADMIN',
    'BRAND_MANAGER',
    'STORE_MANAGER',
    'OPERATIONS',
    'SECURITY_ADMIN',
  ]

  const writeRoles = [
    'SUPER_ADMIN',
    'TENANT_ADMIN',
    'BRAND_MANAGER',
    'STORE_MANAGER',
    'OPERATIONS',
  ]

  it('controller should no longer stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, CustomDomainController), undefined)
  })

  it('governance read handlers should require tenant scope and governance read permission', () => {
    const handlers = [
      CustomDomainController.prototype.list,
      CustomDomainController.prototype.getCurrentPrimary,
      CustomDomainController.prototype.getCurrentPrimaryBatch,
      CustomDomainController.prototype.listActiveWithoutPrimary,
      CustomDomainController.prototype.getGovernanceSummary,
      CustomDomainController.prototype.getById,
    ]

    handlers.forEach((handler) => {
      assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler), {})
      assert.deepEqual(Reflect.getMetadata(ROLES_METADATA_KEY, handler), readRoles)
      assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), ['foundation.governance.read'])
    })
  })

  it('governance write handlers should require tenant scope and governance write permission', () => {
    const handlers = [
      CustomDomainController.prototype.addDomain,
      CustomDomainController.prototype.recommendPrimary,
      CustomDomainController.prototype.recommendPrimaryByQuery,
      CustomDomainController.prototype.recommendPrimaryBatch,
      CustomDomainController.prototype.remove,
      CustomDomainController.prototype.verify,
      CustomDomainController.prototype.requestSsl,
      CustomDomainController.prototype.setPrimary,
    ]

    handlers.forEach((handler) => {
      assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler), {})
      assert.deepEqual(Reflect.getMetadata(ROLES_METADATA_KEY, handler), writeRoles)
      assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), ['foundation.governance.write'])
    })
  })

  it('public handlers should stay permissionless and tenant-optional', () => {
    const publicHandlers = [
      CustomDomainController.prototype.resolveHost,
      CustomDomainController.prototype.validateDomain,
    ]

    publicHandlers.forEach((handler) => {
      assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, handler), true)
      assert.equal(Reflect.getMetadata(TENANT_OPTIONAL_KEY, handler), true)
      assert.equal(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler), undefined)
      assert.equal(Reflect.getMetadata(ROLES_METADATA_KEY, handler), undefined)
      assert.equal(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), undefined)
    })
  })
})
