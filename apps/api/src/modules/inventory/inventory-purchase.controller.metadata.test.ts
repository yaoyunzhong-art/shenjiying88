import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { InventoryPurchaseController } from './inventory-purchase.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, InventoryPurchaseController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, InventoryPurchaseController)

describe('InventoryPurchaseController metadata', () => {
  const readHandlers = [
    InventoryPurchaseController.prototype.listPurchaseOrders,
    InventoryPurchaseController.prototype.getPurchaseOrder,
    InventoryPurchaseController.prototype.getPayments,
    InventoryPurchaseController.prototype.getNotes,
    InventoryPurchaseController.prototype.listSuppliers,
    InventoryPurchaseController.prototype.getSupplier,
    InventoryPurchaseController.prototype.getStats,
    InventoryPurchaseController.prototype.getAlerts,
    InventoryPurchaseController.prototype.getOrderHistory,
    InventoryPurchaseController.prototype.getOrderTimeline,
    InventoryPurchaseController.prototype.getBatchSummary,
  ]

  const writeHandlers = [
    InventoryPurchaseController.prototype.createPurchaseOrder,
    InventoryPurchaseController.prototype.updatePurchaseOrder,
    InventoryPurchaseController.prototype.deletePurchaseOrder,
    InventoryPurchaseController.prototype.submitForApproval,
    InventoryPurchaseController.prototype.approveOrder,
    InventoryPurchaseController.prototype.rejectOrder,
    InventoryPurchaseController.prototype.placeOrder,
    InventoryPurchaseController.prototype.cancelOrder,
    InventoryPurchaseController.prototype.receiveOrder,
    InventoryPurchaseController.prototype.recordPayment,
    InventoryPurchaseController.prototype.addNote,
    InventoryPurchaseController.prototype.createReturn,
    InventoryPurchaseController.prototype.approveReturn,
    InventoryPurchaseController.prototype.inspectReturn,
    InventoryPurchaseController.prototype.rejectReturn,
    InventoryPurchaseController.prototype.refundReturn,
    InventoryPurchaseController.prototype.exchangeReturn,
    InventoryPurchaseController.prototype.closeReturn,
    InventoryPurchaseController.prototype.completeReturn,
    InventoryPurchaseController.prototype.createSupplier,
    InventoryPurchaseController.prototype.updateSupplier,
    InventoryPurchaseController.prototype.batchApprove,
  ]

  it('controller should no longer stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, InventoryPurchaseController), undefined)
  })

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse inventory.purchase.read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['inventory.purchase.read'])
    })
  })

  it('write routes should reuse inventory.purchase.write', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['inventory.purchase.write'])
    })
  })
})
