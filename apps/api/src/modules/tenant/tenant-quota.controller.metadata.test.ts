import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { TenantQuotaController } from './tenant-quota.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, TenantQuotaController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, TenantQuotaController)

describe('TenantQuotaController metadata', () => {
  const readHandlers = [
    TenantQuotaController.prototype.getQuota,
    TenantQuotaController.prototype.getUsage,
  ]

  const writeHandlers = [
    TenantQuotaController.prototype.updateQuota,
  ]

  it('controller should no longer stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, TenantQuotaController), undefined)
  })

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse tenant:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['tenant:read'])
    })
  })

  it('write route should reuse tenant:write', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['tenant:write'])
    })
  })
})
