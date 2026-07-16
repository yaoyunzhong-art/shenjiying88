import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [warehouse-bin] [D] DTO 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  CreateWarehouseBinDto,
  UpdateWarehouseBinDto,
  WarehouseBinQueryDto,
  AssignItemDto,
} from './warehouse-bin.dto'
import { BinStatus, BinType } from './warehouse-bin.entity'

describe('WarehouseBin DTOs', () => {
  describe('CreateWarehouseBinDto', () => {
    it('should accept all required fields', () => {
      const dto = Object.assign(new CreateWarehouseBinDto(), {
        code: 'A-01-01',
        area: 'A区',
        type: BinType.Shelf,
        capacity: 100,
      })

      assert.equal(dto.code, 'A-01-01')
      assert.equal(dto.area, 'A区')
      assert.equal(dto.type, BinType.Shelf)
      assert.equal(dto.capacity, 100)
    })

    it('should accept optional fields', () => {
      const dto = Object.assign(new CreateWarehouseBinDto(), {
        code: 'C-01-01',
        area: 'C区冷库',
        type: BinType.Cold,
        capacity: 200,
        status: BinStatus.Empty,
        usedCapacity: 0,
        currentItem: '冻虾仁',
      })

      assert.equal(dto.status, BinStatus.Empty)
      assert.equal(dto.usedCapacity, 0)
      assert.equal(dto.currentItem, '冻虾仁')
    })

    it('should be instanceof CreateWarehouseBinDto', () => {
      const dto = Object.assign(new CreateWarehouseBinDto(), {
        code: 'B-01-01',
        area: 'B区',
        type: BinType.Floor,
        capacity: 500,
      })
      assert.ok(dto instanceof CreateWarehouseBinDto)
    })
  })

  describe('UpdateWarehouseBinDto', () => {
    it('should accept partial data', () => {
      const dto = Object.assign(new UpdateWarehouseBinDto(), { status: BinStatus.Maintenance })
      assert.equal(dto.status, BinStatus.Maintenance)
      assert.equal(dto.code, undefined)
    })

    it('should accept multiple fields', () => {
      const dto = Object.assign(new UpdateWarehouseBinDto(), {
        capacity: 200,
        usedCapacity: 100,
      })
      assert.equal(dto.capacity, 200)
      assert.equal(dto.usedCapacity, 100)
    })

    it('should accept empty object', () => {
      const dto = new UpdateWarehouseBinDto()
      assert.equal(dto.code, undefined)
      assert.equal(dto.area, undefined)
    })
  })

  describe('WarehouseBinQueryDto', () => {
    it('should hold query filters', () => {
      const dto = Object.assign(new WarehouseBinQueryDto(), {
        status: BinStatus.Empty,
        type: BinType.Shelf,
        area: 'A区',
        search: 'A-01',
      })

      assert.equal(dto.status, BinStatus.Empty)
      assert.equal(dto.type, BinType.Shelf)
      assert.equal(dto.area, 'A区')
      assert.equal(dto.search, 'A-01')
    })

    it('should accept empty query', () => {
      const dto = new WarehouseBinQueryDto()
      assert.equal(dto.status, undefined)
      assert.equal(dto.type, undefined)
    })
  })

  describe('AssignItemDto', () => {
    it('should hold item details', () => {
      const dto = Object.assign(new AssignItemDto(), {
        itemName: '电子元器件',
        quantity: 50,
      })

      assert.equal(dto.itemName, '电子元器件')
      assert.equal(dto.quantity, 50)
    })
  })
})
