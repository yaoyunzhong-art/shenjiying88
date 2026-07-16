import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [warehouse-bin] [D] controller 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { WarehouseBinController } from './warehouse-bin.controller'
import { WarehouseBinService } from './warehouse-bin.service'
import {
  BinStatus,
  BinType,
} from './warehouse-bin.entity'

describe('WarehouseBinController', () => {
  let controller: InstanceType<typeof WarehouseBinController>
  let service: InstanceType<typeof WarehouseBinService>

  const TENANT = { tenantId: 'tenant-001', brandId: 'brand-1', storeId: 'store-001' }

  beforeEach(() => {
    service = new WarehouseBinService()
    controller = new WarehouseBinController(service)
  })

  afterEach(() => {
    service.resetBinStoresForTests()
  })

  // ── Route metadata ──

  describe('route metadata', () => {
    it('controller path should be warehouse-bins', () => {
      const path = Reflect.getMetadata('path', WarehouseBinController)
      assert.equal(path, 'warehouse-bins')
    })

    it('createBin should be POST /', () => {
      const method = Reflect.getMetadata('method', WarehouseBinController.prototype.createBin)
      const path = Reflect.getMetadata('path', WarehouseBinController.prototype.createBin)
      assert.equal(method, 1) // POST
      assert.equal(path, '/')
    })

    it('listBins should be GET /', () => {
      const method = Reflect.getMetadata('method', WarehouseBinController.prototype.listBins)
      const path = Reflect.getMetadata('path', WarehouseBinController.prototype.listBins)
      assert.equal(method, 0) // GET
      assert.equal(path, '/')
    })

    it('getBin should be GET /:binId', () => {
      const method = Reflect.getMetadata('method', WarehouseBinController.prototype.getBin)
      const path = Reflect.getMetadata('path', WarehouseBinController.prototype.getBin)
      assert.equal(method, 0)
      assert.equal(path, ':binId')
    })

    it('updateBin should be PATCH /:binId', () => {
      const method = Reflect.getMetadata('method', WarehouseBinController.prototype.updateBin)
      const path = Reflect.getMetadata('path', WarehouseBinController.prototype.updateBin)
      assert.equal(method, 4) // PATCH
      assert.equal(path, ':binId')
    })

    it('deleteBin should be DELETE /:binId', () => {
      const method = Reflect.getMetadata('method', WarehouseBinController.prototype.deleteBin)
      const path = Reflect.getMetadata('path', WarehouseBinController.prototype.deleteBin)
      assert.equal(method, 5) // DELETE
      assert.equal(path, ':binId')
    })

    it('assignItem should be POST /:binId/assign', () => {
      const method = Reflect.getMetadata('method', WarehouseBinController.prototype.assignItem)
      const path = Reflect.getMetadata('path', WarehouseBinController.prototype.assignItem)
      assert.equal(method, 1)
      assert.equal(path, ':binId/assign')
    })

    it('removeItem should be POST /:binId/remove', () => {
      const method = Reflect.getMetadata('method', WarehouseBinController.prototype.removeItem)
      const path = Reflect.getMetadata('path', WarehouseBinController.prototype.removeItem)
      assert.equal(method, 1)
      assert.equal(path, ':binId/remove')
    })

    it('reserveBin should be POST /:binId/reserve', () => {
      const method = Reflect.getMetadata('method', WarehouseBinController.prototype.reserveBin)
      const path = Reflect.getMetadata('path', WarehouseBinController.prototype.reserveBin)
      assert.equal(method, 1)
      assert.equal(path, ':binId/reserve')
    })

    it('setMaintenance should be POST /:binId/maintenance', () => {
      const method = Reflect.getMetadata('method', WarehouseBinController.prototype.setMaintenance)
      const path = Reflect.getMetadata('path', WarehouseBinController.prototype.setMaintenance)
      assert.equal(method, 1)
      assert.equal(path, ':binId/maintenance')
    })

    it('getEmptyBins should be GET /views/empty', () => {
      const method = Reflect.getMetadata('method', WarehouseBinController.prototype.getEmptyBins)
      const path = Reflect.getMetadata('path', WarehouseBinController.prototype.getEmptyBins)
      assert.equal(method, 0)
      assert.equal(path, 'views/empty')
    })

    it('getCapacityUtilization should be GET /views/utilization', () => {
      const method = Reflect.getMetadata('method', WarehouseBinController.prototype.getCapacityUtilization)
      const path = Reflect.getMetadata('path', WarehouseBinController.prototype.getCapacityUtilization)
      assert.equal(method, 0)
      assert.equal(path, 'views/utilization')
    })

    it('getOccupiedBinsByArea should be GET /area/:area/occupied', () => {
      const method = Reflect.getMetadata('method', WarehouseBinController.prototype.getOccupiedBinsByArea)
      const path = Reflect.getMetadata('path', WarehouseBinController.prototype.getOccupiedBinsByArea)
      assert.equal(method, 0)
      assert.equal(path, 'area/:area/occupied')
    })
  })

  // ── CRUD via controller ──

  describe('POST /warehouse-bins', () => {
    it('should create a bin', () => {
      const result = controller.createBin(TENANT, {
        code: 'NEW-01',
        area: '新区域',
        type: BinType.Shelf,
        capacity: 200,
      })

      assert.equal(result.code, 'NEW-01')
      assert.equal(result.status, BinStatus.Empty)
      assert.ok(result.id.startsWith('bin-'))
    })

    it('should create with optional fields', () => {
      const result = controller.createBin(TENANT, {
        code: 'HAZ-02',
        area: '危险品',
        type: BinType.Hazardous,
        capacity: 100,
        status: BinStatus.Occupied,
        usedCapacity: 50,
        currentItem: '化学品',
      })

      assert.equal(result.type, BinType.Hazardous)
      assert.equal(result.status, BinStatus.Occupied)
      assert.equal(result.currentItem, '化学品')
    })
  })

  describe('GET /warehouse-bins', () => {
    it('should list bins', () => {
      controller.createBin(TENANT, {
        code: 'T1', area: 'A', type: BinType.Shelf, capacity: 100,
      })

      const list = controller.listBins(TENANT, {})
      assert.ok(list.length >= 1)
    })

    it('should filter by status', () => {
      const list = controller.listBins(TENANT, { status: BinStatus.Empty })
      list.forEach((b) => assert.equal(b.status, BinStatus.Empty))
    })
  })

  describe('GET /warehouse-bins/:binId', () => {
    it('should get bin', () => {
      const created = controller.createBin(TENANT, {
        code: 'GET-01', area: 'A', type: BinType.Shelf, capacity: 100,
      })

      const found = controller.getBin(TENANT, created.id)
      assert.equal(found.code, 'GET-01')
    })

    it('should throw when not found', () => {
      assert.throws(
        () => controller.getBin(TENANT, 'nonexistent'),
        /Warehouse bin not found/
      )
    })
  })

  describe('PATCH /warehouse-bins/:binId', () => {
    it('should update bin', () => {
      const created = controller.createBin(TENANT, {
        code: 'OLD', area: 'A', type: BinType.Shelf, capacity: 100,
      })

      const updated = controller.updateBin(TENANT, created.id, { capacity: 200 })
      assert.equal(updated.capacity, 200)
    })
  })

  describe('DELETE /warehouse-bins/:binId', () => {
    it('should delete bin', () => {
      const created = controller.createBin(TENANT, {
        code: 'DEL', area: 'A', type: BinType.Shelf, capacity: 100,
      })

      const result = controller.deleteBin(TENANT, created.id)
      assert.deepStrictEqual(result, { success: true })
    })
  })

  // ── Capacity operations via controller ──

  describe('POST /warehouse-bins/:binId/assign', () => {
    it('should assign item', () => {
      const created = controller.createBin(TENANT, {
        code: 'ASGN', area: 'A', type: BinType.Shelf, capacity: 200,
      })

      const updated = controller.assignItem(TENANT, created.id, {
        itemName: '零件X',
        quantity: 50,
      })
      assert.equal(updated.usedCapacity, 50)
      assert.equal(updated.currentItem, '零件X')
      assert.equal(updated.status, BinStatus.Occupied)
    })
  })

  describe('POST /warehouse-bins/:binId/remove', () => {
    it('should remove item', () => {
      const created = controller.createBin(TENANT, {
        code: 'RMV', area: 'A', type: BinType.Shelf, capacity: 200,
        status: BinStatus.Occupied, usedCapacity: 100, currentItem: 'Items',
      })

      const updated = controller.removeItem(TENANT, created.id, { quantity: 30 })
      assert.equal(updated.usedCapacity, 70)
    })
  })

  describe('POST /warehouse-bins/:binId/reserve', () => {
    it('should reserve bin', () => {
      const created = controller.createBin(TENANT, {
        code: 'RSV', area: 'A', type: BinType.Shelf, capacity: 100,
      })

      const updated = controller.reserveBin(TENANT, created.id)
      assert.equal(updated.status, BinStatus.Reserved)
    })
  })

  describe('POST /warehouse-bins/:binId/maintenance', () => {
    it('should set maintenance', () => {
      const created = controller.createBin(TENANT, {
        code: 'MNT', area: 'A', type: BinType.Shelf, capacity: 100,
      })

      const updated = controller.setMaintenance(TENANT, created.id)
      assert.equal(updated.status, BinStatus.Maintenance)
    })
  })

  // ── Error handling ──

  describe('error propagation from service', () => {
    it('should propagate bin not found', () => {
      assert.throws(
        () => controller.getBin(TENANT, 'nonexistent'),
        /Warehouse bin not found: nonexistent/
      )
    })

    it('should propagate capacity error', () => {
      const created = controller.createBin(TENANT, {
        code: 'ERR', area: 'A', type: BinType.Shelf, capacity: 10,
        status: BinStatus.Occupied, usedCapacity: 10, currentItem: 'Full',
      })

      assert.throws(
        () => controller.assignItem(TENANT, created.id, { itemName: 'More', quantity: 5 }),
        /Insufficient capacity/
      )
    })

    it('should propagate maintenance error', () => {
      const created = controller.createBin(TENANT, {
        code: 'MNT2', area: 'A', type: BinType.Shelf, capacity: 100,
        status: BinStatus.Maintenance,
      })

      assert.throws(
        () => controller.assignItem(TENANT, created.id, { itemName: 'X', quantity: 1 }),
        /under maintenance/
      )
    })
  })
})
