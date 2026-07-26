import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { PaymentGatewayController } from './payment-gateway.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, PaymentGatewayController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, PaymentGatewayController)

describe('PaymentGatewayController metadata', () => {
  const readHandlers = [
    PaymentGatewayController.prototype.queryPayment,
    PaymentGatewayController.prototype.queryRefund,
  ]

  it('all routes should require tenant scope', () => {
    ;[
      PaymentGatewayController.prototype.pay,
      ...readHandlers,
      PaymentGatewayController.prototype.refund,
    ].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse payment:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['payment:read'])
    })
  })

  it('pay route should reuse payment:write', () => {
    assert.deepEqual(resolvePermissions(PaymentGatewayController.prototype.pay), ['payment:write'])
  })

  it('refund route should reuse payment:refund', () => {
    assert.deepEqual(resolvePermissions(PaymentGatewayController.prototype.refund), ['payment:refund'])
  })
})
