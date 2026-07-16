import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [warehouse-bin] [D] entity 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  BinStatus,
  BinType,
  type WarehouseBin,
} from './warehouse-bin.entity'

describe('WarehouseBin Entity', () => {
  describe('enums', () => {
    it('BinStatus should have correct values', () => {
      assert.equal(BinStatus.Empty, 'EMPTY')
      assert.equal(BinStatus.Occupied, 'OCCUPIED')
      assert.equal(BinStatus.Reserved, 'RESERVED')
      assert.equal(BinStatus.Maintenance, 'MAINTENANCE')
    })

    it('BinType should have correct values', () => {
      assert.equal(BinType.Shelf, 'SHELF')
      assert.equal(BinType.Floor, 'FLOOR')
      assert.equal(BinType.Cold, 'COLD')
      assert.equal(BinType.Hazardous, 'HAZARDOUS')
    })
  })

  describe('WarehouseBin interface shape', () => {
    it('should create a valid bin with currentItem', () => {
      const bin: WarehouseBin = {
        id: 'bin-001',
        code: 'A-01-01',
        area: 'A区',
        type: BinType.Shelf,
        status: BinStatus.Occupied,
        capacity: 100,
        usedCapacity: 80,
        currentItem: '电子元器件',
        tenantId: 'tenant-001',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-16T00:00:00.000Z',
      }

      assert.equal(bin.id, 'bin-001')
      assert.equal(bin.code, 'A-01-01')
      assert.equal(bin.area, 'A区')
      assert.equal(bin.type, BinType.Shelf)
      assert.equal(bin.status, BinStatus.Occupied)
      assert.equal(bin.capacity, 100)
      assert.equal(bin.usedCapacity, 80)
      assert.equal(bin.currentItem, '电子元器件')
      assert.equal(bin.tenantId, 'tenant-001')
    })

    it('should support bin without currentItem (empty)', () => {
      const bin: WarehouseBin = {
        id: 'bin-002',
        code: 'A-01-03',
        area: 'A区',
        type: BinType.Shelf,
        status: BinStatus.Empty,
        capacity: 100,
        usedCapacity: 0,
        tenantId: 'tenant-001',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-16T00:00:00.000Z',
      }

      assert.equal(bin.currentItem, undefined)
      assert.equal(bin.usedCapacity, 0)
    })

    it('should create hazardous type bin', () => {
      const bin: WarehouseBin = {
        id: 'bin-003',
        code: 'D-01-01',
        area: 'D区危险品',
        type: BinType.Hazardous,
        status: BinStatus.Occupied,
        capacity: 100,
        usedCapacity: 60,
        currentItem: '盐酸(工业级)',
        tenantId: 'tenant-001',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-16T00:00:00.000Z',
      }

      assert.equal(bin.type, BinType.Hazardous)
      assert.equal(bin.status, BinStatus.Occupied)
    })
  })
})
