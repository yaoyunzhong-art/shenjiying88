import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { BillingController } from './billing.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, BillingController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, BillingController)

describe('BillingController metadata', () => {
  const readHandlers = [
    BillingController.prototype.calculateBill,
    BillingController.prototype.listInvoices,
    BillingController.prototype.getInvoice,
    BillingController.prototype.getPaymentStatus,
    BillingController.prototype.listDiscounts,
    BillingController.prototype.getStats,
  ]

  const approveHandlers = [
    BillingController.prototype.generateInvoice,
  ]

  const payHandlers = [
    BillingController.prototype.payInvoice,
  ]

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...approveHandlers, ...payHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse settlement:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['settlement:read'])
    })
  })

  it('invoice generation should reuse settlement:approve', () => {
    approveHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['settlement:approve'])
    })
  })

  it('payment routes should reuse settlement:pay', () => {
    payHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['settlement:pay'])
    })
  })
})
