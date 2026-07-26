import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { TenantController } from './tenant.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler) ??
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, TenantController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler) ??
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, TenantController)

describe('TenantController metadata', () => {
  const readHandlers = [
    TenantController.prototype.resolveTenant,
    TenantController.prototype.getQuota,
    TenantController.prototype.checkQuota,
    TenantController.prototype.getUsage,
    TenantController.prototype.getDefaultTierQuotas,
    TenantController.prototype.getLifecycle,
    TenantController.prototype.getStatus,
    TenantController.prototype.listActive,
    TenantController.prototype.listSuspended,
  ]

  const createHandlers = [
    TenantController.prototype.initQuota,
    TenantController.prototype.initLifecycle,
  ]

  const updateHandlers = [
    TenantController.prototype.setTier,
    TenantController.prototype.overrideQuota,
    TenantController.prototype.reserveQuota,
    TenantController.prototype.suspend,
    TenantController.prototype.reactivate,
  ]

  const deleteHandlers = [TenantController.prototype.softDelete]

  it('controller should no longer stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, TenantController), undefined)
  })

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...createHandlers, ...updateHandlers, ...deleteHandlers].forEach((handler) => {
      assert.deepStrictEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse tenant:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepStrictEqual(resolvePermissions(handler), ['tenant:read'])
    })
  })

  it('create routes should reuse tenant:create', () => {
    createHandlers.forEach((handler) => {
      assert.deepStrictEqual(resolvePermissions(handler), ['tenant:create'])
    })
  })

  it('update routes should reuse tenant:update', () => {
    updateHandlers.forEach((handler) => {
      assert.deepStrictEqual(resolvePermissions(handler), ['tenant:update'])
    })
  })

  it('delete routes should reuse tenant:delete', () => {
    deleteHandlers.forEach((handler) => {
      assert.deepStrictEqual(resolvePermissions(handler), ['tenant:delete'])
    })
  })
})
