import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { FinancePaymentController } from './finance-payment.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, FinancePaymentController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, FinancePaymentController)

describe('FinancePaymentController metadata', () => {
  const readHandlers = [
    FinancePaymentController.prototype.listPayments,
    FinancePaymentController.prototype.getPayment,
    FinancePaymentController.prototype.getPaymentAudit,
    FinancePaymentController.prototype.listRefundsForPayment,
    FinancePaymentController.prototype.listRefunds,
    FinancePaymentController.prototype.getRefund,
    FinancePaymentController.prototype.getRefundAudit,
  ]

  const writeHandlers = [
    FinancePaymentController.prototype.createPayment,
    FinancePaymentController.prototype.updatePayment,
    FinancePaymentController.prototype.markPaymentSuccess,
    FinancePaymentController.prototype.markPaymentFail,
    FinancePaymentController.prototype.requestRefund,
    FinancePaymentController.prototype.approveRefund,
    FinancePaymentController.prototype.rejectRefund,
    FinancePaymentController.prototype.completeRefund,
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
