import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { CashierBillingController } from './cashier-billing.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, CashierBillingController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, CashierBillingController)

describe('CashierBillingController metadata', () => {
  const readHandlers = [
    CashierBillingController.prototype.getUsage,
    CashierBillingController.prototype.getWallet,
    CashierBillingController.prototype.listBills,
    CashierBillingController.prototype.getPlan,
  ]

  const writeHandlers = [
    CashierBillingController.prototype.recharge,
    CashierBillingController.prototype.setPlan,
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
