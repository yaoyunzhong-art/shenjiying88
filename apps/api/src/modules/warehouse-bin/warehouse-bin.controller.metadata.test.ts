import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { WarehouseBinController } from './warehouse-bin.controller'

describe('WarehouseBinController metadata', () => {
  it('controller should keep warehouse-bins path', () => {
    assert.equal(Reflect.getMetadata('path', WarehouseBinController), 'warehouse-bins')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [WarehouseBinController.prototype.createBin, 1, '/'],
      [WarehouseBinController.prototype.listBins, 0, '/'],
      [WarehouseBinController.prototype.getBin, 0, ':binId'],
      [WarehouseBinController.prototype.updateBin, 4, ':binId'],
      [WarehouseBinController.prototype.deleteBin, 3, ':binId'],
      [WarehouseBinController.prototype.assignItem, 1, ':binId/assign'],
      [WarehouseBinController.prototype.removeItem, 1, ':binId/remove'],
      [WarehouseBinController.prototype.reserveBin, 1, ':binId/reserve'],
      [WarehouseBinController.prototype.setMaintenance, 1, ':binId/maintenance'],
      [WarehouseBinController.prototype.getEmptyBins, 0, 'views/empty'],
      [WarehouseBinController.prototype.getCapacityUtilization, 0, 'views/utilization'],
      [WarehouseBinController.prototype.getOccupiedBinsByArea, 0, 'area/:area/occupied'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
