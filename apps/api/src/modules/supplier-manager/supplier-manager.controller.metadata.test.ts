import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { SupplierManagerController } from './supplier-manager.controller'

describe('SupplierManagerController metadata', () => {
  it('controller should keep suppliers path', () => {
    assert.equal(Reflect.getMetadata('path', SupplierManagerController), 'suppliers')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [SupplierManagerController.prototype.createSupplier, 1, '/'],
      [SupplierManagerController.prototype.listSuppliers, 0, '/'],
      [SupplierManagerController.prototype.getSupplier, 0, ':supplierId'],
      [SupplierManagerController.prototype.updateSupplier, 4, ':supplierId'],
      [SupplierManagerController.prototype.deleteSupplier, 3, ':supplierId'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
