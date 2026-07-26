import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { InventoryController } from './inventory.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, InventoryController)

describe('InventoryController metadata', () => {
  const productReadHandlers = [
    InventoryController.prototype.getProduct,
    InventoryController.prototype.listProducts,
  ]

  const productWriteHandlers = [
    InventoryController.prototype.createProduct,
    InventoryController.prototype.updateProduct,
  ]

  const stockReadHandlers = [
    InventoryController.prototype.checkStock,
    InventoryController.prototype.getLowStockProducts,
    InventoryController.prototype.getStockRecords,
  ]

  const stockWriteHandlers = [
    InventoryController.prototype.stockIn,
    InventoryController.prototype.stockOut,
    InventoryController.prototype.adjustStock,
  ]

  const supplierReadHandlers = [
    InventoryController.prototype.listSuppliers,
  ]

  const supplierWriteHandlers = [
    InventoryController.prototype.createSupplier,
  ]

  const purchaseReadHandlers = [
    InventoryController.prototype.listPurchaseOrders,
  ]

  const purchaseWriteHandlers = [
    InventoryController.prototype.createPurchaseOrder,
    InventoryController.prototype.confirmOrder,
    InventoryController.prototype.receiveOrder,
  ]

  it('controller should no longer stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, InventoryController), undefined)
  })

  it('all routes should require tenant scope', () => {
    ;[
      ...productReadHandlers,
      ...productWriteHandlers,
      ...stockReadHandlers,
      ...stockWriteHandlers,
      ...supplierReadHandlers,
      ...supplierWriteHandlers,
      ...purchaseReadHandlers,
      ...purchaseWriteHandlers,
    ].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('product read routes should reuse product:read', () => {
    productReadHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['product:read'])
    })
  })

  it('product write routes should reuse inventory:update', () => {
    productWriteHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['inventory:update'])
    })
  })

  it('stock transfer read routes should reuse stock-transfer:read', () => {
    stockReadHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['stock-transfer:read'])
    })
  })

  it('stock transfer mutation routes should reuse stock-transfer:form:read', () => {
    stockWriteHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['stock-transfer:form:read'])
    })
  })

  it('supplier routes should reuse suppliers permissions', () => {
    supplierReadHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['suppliers:read'])
    })
    supplierWriteHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['suppliers:form:read'])
    })
  })

  it('purchase routes should reuse inventory.purchase permissions', () => {
    purchaseReadHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['inventory.purchase.read'])
    })
    purchaseWriteHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['inventory.purchase.write'])
    })
  })
})
