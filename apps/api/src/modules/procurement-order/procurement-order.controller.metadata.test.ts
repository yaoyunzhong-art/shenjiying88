import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { ProcurementOrderController } from './procurement-order.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler) ??
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ProcurementOrderController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler) ??
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, ProcurementOrderController)

describe('ProcurementOrderController metadata', () => {
  const readHandlers = [
    ProcurementOrderController.prototype.listOrders,
    ProcurementOrderController.prototype.getOverdueOrders,
    ProcurementOrderController.prototype.getOrdersBySupplier,
  ]

  const detailHandlers = [ProcurementOrderController.prototype.getOrder]
  const formHandlers = [
    ProcurementOrderController.prototype.createOrder,
    ProcurementOrderController.prototype.updateOrder,
    ProcurementOrderController.prototype.deleteOrder,
    ProcurementOrderController.prototype.updateOrderStatus,
    ProcurementOrderController.prototype.receiveItems,
  ]

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...detailHandlers, ...formHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse purchase-orders:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['purchase-orders:read'])
    })
  })

  it('detail routes should reuse purchase-orders:id:read', () => {
    detailHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['purchase-orders:id:read'])
    })
  })

  it('mutation routes should reuse purchase-orders:form:read', () => {
    formHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['purchase-orders:form:read'])
    })
  })
})
