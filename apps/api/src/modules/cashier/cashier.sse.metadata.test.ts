import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { CashierSseController } from './cashier.sse'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, CashierSseController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, CashierSseController)

describe('CashierSseController metadata', () => {
  const orderReadHandlers = [
    CashierSseController.prototype.orderEvents,
    CashierSseController.prototype.orderSingleEvents,
    CashierSseController.prototype.replayOrderEvents,
  ]

  const paymentReadHandlers = [
    CashierSseController.prototype.paymentEvents,
  ]

  it('all routes should require tenant scope', () => {
    ;[...orderReadHandlers, ...paymentReadHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('order event routes should reuse order:read', () => {
    orderReadHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['order:read'])
    })
  })

  it('payment event route should reuse payment:read', () => {
    paymentReadHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['payment:read'])
    })
  })
})
