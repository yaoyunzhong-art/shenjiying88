import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { LogisticsManagementController } from './logistics-management.controller'

describe('LogisticsManagementController metadata', () => {
  it('controller should keep logistics-management path', () => {
    assert.equal(Reflect.getMetadata('path', LogisticsManagementController), 'logistics-management')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [LogisticsManagementController.prototype.createSupplyOrder, 1, 'supply-orders'],
      [LogisticsManagementController.prototype.listSupplyOrders, 0, 'supply-orders'],
      [LogisticsManagementController.prototype.getSupplyOrder, 0, 'supply-orders/:id'],
      [LogisticsManagementController.prototype.updateSupplyOrder, 4, 'supply-orders/:id'],
      [LogisticsManagementController.prototype.deleteSupplyOrder, 3, 'supply-orders/:id'],
      [LogisticsManagementController.prototype.createSupplyVendor, 1, 'supply-vendors'],
      [LogisticsManagementController.prototype.listSupplyVendors, 0, 'supply-vendors'],
      [LogisticsManagementController.prototype.getSupplyVendor, 0, 'supply-vendors/:id'],
      [LogisticsManagementController.prototype.updateSupplyVendor, 4, 'supply-vendors/:id'],
      [LogisticsManagementController.prototype.deleteSupplyVendor, 3, 'supply-vendors/:id'],
      [LogisticsManagementController.prototype.createInventoryItem, 1, 'inventory-items'],
      [LogisticsManagementController.prototype.listInventoryItems, 0, 'inventory-items'],
      [LogisticsManagementController.prototype.getInventoryItem, 0, 'inventory-items/:id'],
      [LogisticsManagementController.prototype.updateInventoryItem, 4, 'inventory-items/:id'],
      [LogisticsManagementController.prototype.deleteInventoryItem, 3, 'inventory-items/:id'],
      [LogisticsManagementController.prototype.stocktake, 1, 'inventory-items/:id/stocktake'],
      [LogisticsManagementController.prototype.getLowStockItems, 0, 'inventory-items/low-stock'],
      [LogisticsManagementController.prototype.createMaintenanceTask, 1, 'maintenance-tasks'],
      [LogisticsManagementController.prototype.listMaintenanceTasks, 0, 'maintenance-tasks'],
      [LogisticsManagementController.prototype.getMaintenanceTask, 0, 'maintenance-tasks/:id'],
      [LogisticsManagementController.prototype.updateMaintenanceTask, 4, 'maintenance-tasks/:id'],
      [LogisticsManagementController.prototype.deleteMaintenanceTask, 3, 'maintenance-tasks/:id'],
      [LogisticsManagementController.prototype.getDueMaintenanceTasks, 0, 'maintenance-tasks/due'],
      [LogisticsManagementController.prototype.getMetrics, 0, 'metrics'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
