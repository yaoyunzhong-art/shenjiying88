import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { CashierController } from './cashier.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, CashierController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, CashierController)

describe('CashierController metadata', () => {
  const protectedHandlers = [
    CashierController.prototype.createOrder,
    CashierController.prototype.submitOrder,
    CashierController.prototype.cancelOrder,
    CashierController.prototype.fulfillOrder,
    CashierController.prototype.getOrder,
    CashierController.prototype.getOrderItems,
    CashierController.prototype.listOrders,
    CashierController.prototype.createPayment,
    CashierController.prototype.paymentCallback,
    CashierController.prototype.createRefund,
    CashierController.prototype.getRefund,
    CashierController.prototype.getChannelStats,
  ]

  const publicHandlers = [
    CashierController.prototype.lookupMember,
    CashierController.prototype.lookupProduct,
    CashierController.prototype.listProducts,
  ]

  it('all routes should require tenant scope', () => {
    ;[...protectedHandlers, ...publicHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('order routes should reuse order permissions', () => {
    assert.deepEqual(resolvePermissions(CashierController.prototype.createOrder), ['order:write'])
    assert.deepEqual(resolvePermissions(CashierController.prototype.submitOrder), ['order:write'])
    assert.deepEqual(resolvePermissions(CashierController.prototype.cancelOrder), ['order:cancel'])
    assert.deepEqual(resolvePermissions(CashierController.prototype.fulfillOrder), ['order:write'])
    assert.deepEqual(resolvePermissions(CashierController.prototype.getOrder), ['order:read'])
    assert.deepEqual(resolvePermissions(CashierController.prototype.getOrderItems), ['order:read'])
    assert.deepEqual(resolvePermissions(CashierController.prototype.listOrders), ['order:read'])
  })

  it('payment routes should reuse payment permissions', () => {
    assert.deepEqual(resolvePermissions(CashierController.prototype.createPayment), ['payment:write'])
    assert.deepEqual(resolvePermissions(CashierController.prototype.paymentCallback), ['payment:write'])
    assert.deepEqual(resolvePermissions(CashierController.prototype.getRefund), ['payment:read'])
    assert.deepEqual(resolvePermissions(CashierController.prototype.getChannelStats), ['payment:read'])
  })

  it('refund route should reuse payment:refund and order:refund', () => {
    assert.deepEqual(resolvePermissions(CashierController.prototype.createRefund), ['payment:refund', 'order:refund'])
  })

  it('public POS lookup routes should stay permissionless', () => {
    publicHandlers.forEach((handler) => {
      assert.equal(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), undefined)
    })
  })
})
