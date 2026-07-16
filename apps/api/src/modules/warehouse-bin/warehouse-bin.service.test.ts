import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [warehouse-bin] [D] service 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { WarehouseBinService } from './warehouse-bin.service'
import {
  BinStatus,
  BinType,
  type WarehouseBin,
} from './warehouse-bin.entity'

describe('WarehouseBinService', () => {
  let service: WarehouseBinService

  const TENANT = 'tenant-001'

  beforeEach(() => {
    service = new WarehouseBinService()
  })

  afterEach(() => {
    service.resetBinStoresForTests()
  })

  function createTestBin(overrides?: Partial<Parameters<WarehouseBinService['createBin']>[0]>): WarehouseBin {
    return service.createBin({
      tenantId: TENANT,
      code: 'TEST-01',
      area: '测试区',
      type: BinType.Shelf,
      status: BinStatus.Empty,
      capacity: 100,
      usedCapacity: 0,
      ...overrides,
    })
  }

  // ── CRUD ──

  describe('createBin', () => {
    it('should create a bin with Empty status by default', () => {
      const bin = createTestBin()

      assert.equal(bin.code, 'TEST-01')
      assert.equal(bin.area, '测试区')
      assert.equal(bin.type, BinType.Shelf)
      assert.equal(bin.status, BinStatus.Empty)
      assert.equal(bin.capacity, 100)
      assert.equal(bin.usedCapacity, 0)
      assert.equal(bin.tenantId, TENANT)
      assert.ok(bin.id.startsWith('bin-'))
      assert.ok(bin.createdAt)
      assert.ok(bin.updatedAt)
    })

    it('should create a bin with specified status', () => {
      const bin = createTestBin({
        code: 'COLD-01',
        area: '冷库',
        type: BinType.Cold,
        status: BinStatus.Reserved,
        capacity: 200,
        currentItem: '待入库冰淇淋',
      })

      assert.equal(bin.status, BinStatus.Reserved)
      assert.equal(bin.type, BinType.Cold)
      assert.equal(bin.currentItem, '待入库冰淇淋')
    })

    it('should create hazardous type bin', () => {
      const bin = createTestBin({
        code: 'HAZ-01',
        area: '危险品区',
        type: BinType.Hazardous,
      })

      assert.equal(bin.type, BinType.Hazardous)
    })
  })

  describe('getBin', () => {
    it('should return bin by id', () => {
      const bin = createTestBin()
      const found = service.getBin(bin.id, TENANT)
      assert.ok(found)
      assert.equal(found?.id, bin.id)
    })

    it('should return undefined for non-existent bin', () => {
      const found = service.getBin('nonexistent', TENANT)
      assert.equal(found, undefined)
    })

    it('should return undefined for wrong tenant', () => {
      const bin = createTestBin()
      const found = service.getBin(bin.id, 'wrong-tenant')
      assert.equal(found, undefined)
    })
  })

  describe('listBins', () => {
    it('should list seed bins plus created ones', () => {
      createTestBin({ code: 'T1' })
      const list = service.listBins(TENANT)
      assert.ok(list.length >= 1)
    })

    it('should filter by status', () => {
      createTestBin({ code: 'EMP-01', status: BinStatus.Empty })
      createTestBin({ code: 'OCC-01', status: BinStatus.Occupied })

      const empty = service.listBins(TENANT, { status: BinStatus.Empty })
      assert.ok(empty.length >= 1)
      empty.forEach((b) => assert.equal(b.status, BinStatus.Empty))
    })

    it('should filter by type', () => {
      const shelves = service.listBins(TENANT, { type: BinType.Shelf })
      shelves.forEach((b) => assert.equal(b.type, BinType.Shelf))
    })

    it('should filter by area', () => {
      const aBins = service.listBins(TENANT, { area: 'A区' })
      aBins.forEach((b) => assert.equal(b.area, 'A区'))
    })

    it('should filter by search', () => {
      const result = service.listBins(TENANT, { search: 'A-01' })
      assert.ok(result.length >= 1)
    })
  })

  describe('updateBin', () => {
    it('should update bin fields', () => {
      const bin = createTestBin()
      const updated = service.updateBin(bin.id, TENANT, {
        capacity: 200,
        status: BinStatus.Maintenance,
      })

      assert.equal(updated.capacity, 200)
      assert.equal(updated.status, BinStatus.Maintenance)
    })

    it('should throw for non-existent bin', () => {
      assert.throws(
        () => service.updateBin('nonexistent', TENANT, { code: 'X' }),
        /Warehouse bin not found/
      )
    })

    it('should throw for wrong tenant', () => {
      const bin = createTestBin()
      assert.throws(
        () => service.updateBin(bin.id, 'wrong-tenant', { code: 'X' }),
        /Warehouse bin not found/
      )
    })
  })

  describe('deleteBin', () => {
    it('should delete a bin', () => {
      const bin = createTestBin()
      service.deleteBin(bin.id, TENANT)

      const found = service.getBin(bin.id, TENANT)
      assert.equal(found, undefined)
    })

    it('should throw for non-existent bin', () => {
      assert.throws(
        () => service.deleteBin('nonexistent', TENANT),
        /Warehouse bin not found/
      )
    })

    it('should throw for wrong tenant', () => {
      const bin = createTestBin()
      assert.throws(
        () => service.deleteBin(bin.id, 'wrong-tenant'),
        /Warehouse bin not found/
      )
    })
  })

  // ── Capacity operations ──

  describe('assignItem', () => {
    it('should assign item to empty bin', () => {
      const bin = createTestBin({ capacity: 100 })
      const updated = service.assignItem(bin.id, '电子元器件', 50, TENANT)

      assert.equal(updated.usedCapacity, 50)
      assert.equal(updated.currentItem, '电子元器件')
      assert.equal(updated.status, BinStatus.Occupied)
    })

    it('should throw when bin is under maintenance', () => {
      const bin = createTestBin({ status: BinStatus.Maintenance })
      assert.throws(
        () => service.assignItem(bin.id, 'Item', 10, TENANT),
        /under maintenance/
      )
    })

    it('should throw when capacity insufficient', () => {
      const bin = createTestBin({ capacity: 100, usedCapacity: 80 })
      assert.throws(
        () => service.assignItem(bin.id, 'Overflow', 30, TENANT),
        /Insufficient capacity/
      )
    })
  })

  describe('removeItem', () => {
    it('should decrease used capacity', () => {
      const bin = createTestBin({ capacity: 100, usedCapacity: 80, currentItem: 'Items', status: BinStatus.Occupied })
      const updated = service.removeItem(bin.id, 30, TENANT)

      assert.equal(updated.usedCapacity, 50)
    })

    it('should clear bin when capacity becomes 0', () => {
      const bin = createTestBin({ capacity: 100, usedCapacity: 80, currentItem: 'Items', status: BinStatus.Occupied })
      const updated = service.removeItem(bin.id, 80, TENANT)

      assert.equal(updated.usedCapacity, 0)
      assert.equal(updated.status, BinStatus.Empty)
      assert.equal(updated.currentItem, undefined)
    })

    it('should throw when removing too much', () => {
      const bin = createTestBin({ usedCapacity: 10 })
      assert.throws(
        () => service.removeItem(bin.id, 20, TENANT),
        /Cannot remove/
      )
    })
  })

  describe('reserveBin', () => {
    it('should reserve empty bin', () => {
      const bin = createTestBin({ status: BinStatus.Empty })
      const updated = service.reserveBin(bin.id, TENANT)
      assert.equal(updated.status, BinStatus.Reserved)
    })

    it('should throw when bin is not empty', () => {
      const bin = createTestBin({ status: BinStatus.Occupied })
      assert.throws(
        () => service.reserveBin(bin.id, TENANT),
        /Cannot reserve/
      )
    })
  })

  describe('setMaintenance', () => {
    it('should set bin to maintenance', () => {
      const bin = createTestBin({ status: BinStatus.Empty })
      const updated = service.setMaintenance(bin.id, TENANT)
      assert.equal(updated.status, BinStatus.Maintenance)
    })
  })

  // ── Query views ──

  describe('getEmptyBins', () => {
    it('should return empty bins', () => {
      const empty = service.getEmptyBins(TENANT)
      assert.ok(empty.length >= 1)
      empty.forEach((b) => assert.equal(b.status, BinStatus.Empty))
    })
  })

  describe('getOccupiedBinsByArea', () => {
    it('should return occupied bins in area', () => {
      const occupied = service.getOccupiedBinsByArea('A区', TENANT)
      occupied.forEach((b) => {
        assert.equal(b.area, 'A区')
        assert.equal(b.status, BinStatus.Occupied)
      })
    })
  })

  describe('getCapacityUtilization', () => {
    it('should return utilization stats', () => {
      const stats = service.getCapacityUtilization(TENANT)
      assert.ok(stats.totalCapacity > 0)
      assert.ok(stats.totalUsed >= 0)
      assert.ok(stats.utilizationRate >= 0)
      assert.ok(stats.bins.length >= 1)
    })
  })
})
