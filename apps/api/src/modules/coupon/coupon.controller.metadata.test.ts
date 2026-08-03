import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'
import { CouponController } from './coupon.controller'

function resolvePermissions(handler: Function) {
  return (
    Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler) ??
    Reflect.getMetadata(PERMISSIONS_METADATA_KEY, CouponController)
  )
}

function resolveTenantScope(handler: Function) {
  return (
    Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler) ??
    Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, CouponController)
  )
}

describe('CouponController metadata', () => {
  const readHandlers = [
    CouponController.prototype.list,
    CouponController.prototype.get,
  ]

  const writeHandlers = [
    CouponController.prototype.create,
    CouponController.prototype.updateStatus,
  ]

  const issueHandlers = [
    CouponController.prototype.redeem,
    CouponController.prototype.batchRedeem,
  ]

  it('controller should keep coupons path and stay non-public', () => {
    assert.equal(Reflect.getMetadata('path', CouponController), 'coupons')
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, CouponController), undefined)
  })

  it('all routes should require tenant scope', () => {
    ;[
      ...readHandlers,
      ...writeHandlers,
      ...issueHandlers,
    ].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse coupon:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['coupon:read'])
    })
  })

  it('write routes should reuse coupon:write', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['coupon:write'])
    })
  })

  it('redeem routes should reuse coupon:issue', () => {
    issueHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['coupon:issue'])
    })
  })
})
