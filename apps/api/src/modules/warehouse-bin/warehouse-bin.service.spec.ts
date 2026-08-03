/**
 * warehouse-bin.service.spec.ts — 库位管理模块 Service 单元测试
 *
 * 覆盖: CRUD / 容量追踪 (assignItem/removeItem/reserveBin/setMaintenance) / 查询辅助 / 边界异常
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { WarehouseBinService } from './warehouse-bin.service'
import { BinStatus, BinType } from './warehouse-bin.entity'

describe('WarehouseBinService — CRUD', () => {
  let svc: WarehouseBinService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new WarehouseBinService()
    svc.resetBinStoresForTests()
  })

  it('createBin 创建库位成功', () => {
    const bin = svc.createBin({
      tenantId,
      code: 'E-01-01',
      area: 'E区',
      type: BinType.Shelf,
      status: BinStatus.Empty,
      capacity: 200,
    })
    expect(bin.id).toMatch(/^bin-/)
    expect(bin.code).toBe('E-01-01')
    expect(bin.status).toBe(BinStatus.Empty)
    expect(bin.usedCapacity).toBe(0)
  })

  it('createBin 使用默认值', () => {
    const bin = svc.createBin({
      tenantId, code: 'F-01', area: 'F区', type: BinType.Floor, capacity: 500,
    })
    expect(bin.status).toBe(BinStatus.Empty)
    expect(bin.usedCapacity).toBe(0)
  })

  it('getBin 返回正确的库位', () => {
    const bin = svc.createBin({
      tenantId, code: 'E-01-02', area: 'E区', type: BinType.Shelf, capacity: 100,
    })
    const found = svc.getBin(bin.id, tenantId)
    expect(found).toBeDefined()
    expect(found!.code).toBe('E-01-02')
  })

  it('getBin 返回 undefined 当库位不存在', () => {
    expect(svc.getBin('fake-id', tenantId)).toBeUndefined()
  })

  it('updateBin 更新字段', () => {
    const bin = svc.createBin({
      tenantId, code: 'E-01-03', area: 'E区', type: BinType.Shelf, capacity: 100,
    })
    const updated = svc.updateBin(bin.id, tenantId, {
      code: 'E-01-03-NEW',
      area: 'E区新',
      status: BinStatus.Reserved,
      capacity: 150,
    })
    expect(updated.code).toBe('E-01-03-NEW')
    expect(updated.area).toBe('E区新')
    expect(updated.status).toBe(BinStatus.Reserved)
    expect(updated.capacity).toBe(150)
  })

  it('deleteBin 删除成功', () => {
    const bin = svc.createBin({
      tenantId, code: 'E-01-DEL', area: 'E区', type: BinType.Shelf, capacity: 100,
    })
    svc.deleteBin(bin.id, tenantId)
    expect(svc.getBin(bin.id, tenantId)).toBeUndefined()
  })

  it('deleteBin 不存在的库位抛 Error', () => {
    expect(() => svc.deleteBin('fake-id', tenantId)).toThrow(/not found/)
  })

  it('listBins 支持按状态筛选', () => {
    svc.createBin({
      tenantId, code: 'L-EMPTY', area: 'L区', type: BinType.Shelf,
      status: BinStatus.Empty, capacity: 100,
    })
    const empty = svc.listBins(tenantId, { status: BinStatus.Empty })
    empty.forEach((b) => expect(b.status).toBe(BinStatus.Empty))
  })

  it('listBins 支持按类型筛选', () => {
    const cold = svc.listBins(tenantId, { type: BinType.Cold })
    cold.forEach((b) => expect(b.type).toBe(BinType.Cold))
  })

  it('listBins 支持按区域筛选', () => {
    const aArea = svc.listBins(tenantId, { area: 'A区' })
    aArea.forEach((b) => expect(b.area).toBe('A区'))
  })

  it('listBins 支持搜索', () => {
    const items = svc.listBins(tenantId, { search: '冷库' })
    expect(items.length).toBeGreaterThan(0)
  })
})

describe('WarehouseBinService — 容量追踪', () => {
  let svc: WarehouseBinService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new WarehouseBinService()
    svc.resetBinStoresForTests()
  })

  it('assignItem 分配物品成功', () => {
    const bin = svc.createBin({
      tenantId, code: 'CAP-01', area: '测试区', type: BinType.Shelf,
      status: BinStatus.Empty, capacity: 100,
    })
    const updated = svc.assignItem(bin.id, '测试商品', 30, tenantId)
    expect(updated.usedCapacity).toBe(30)
    expect(updated.currentItem).toBe('测试商品')
    expect(updated.status).toBe(BinStatus.Occupied)
  })

  it('assignItem 超过容量抛 Error', () => {
    const bin = svc.createBin({
      tenantId, code: 'CAP-02', area: '测试区', type: BinType.Shelf,
      capacity: 50,
    })
    expect(() => svc.assignItem(bin.id, '大件商品', 100, tenantId)).toThrow(/Insufficient capacity/)
  })

  it('assignItem 维修中的库位抛 Error', () => {
    const bin = svc.createBin({
      tenantId, code: 'CAP-MAIN', area: '测试', type: BinType.Shelf,
      status: BinStatus.Maintenance, capacity: 100,
    })
    expect(() => svc.assignItem(bin.id, '商品', 10, tenantId)).toThrow(/under maintenance/)
  })

  it('removeItem 移除物品成功', () => {
    const bin = svc.createBin({
      tenantId, code: 'CAP-03', area: '测试', type: BinType.Shelf,
      capacity: 100, usedCapacity: 80, status: BinStatus.Occupied,
      currentItem: '商品',
    })
    const updated = svc.removeItem(bin.id, 30, tenantId)
    expect(updated.usedCapacity).toBe(50)
  })

  it('removeItem 清空后状态变为 Empty', () => {
    const bin = svc.createBin({
      tenantId, code: 'CAP-04', area: '测试', type: BinType.Shelf,
      capacity: 100, usedCapacity: 50, status: BinStatus.Occupied,
      currentItem: '商品',
    })
    const updated = svc.removeItem(bin.id, 50, tenantId)
    expect(updated.usedCapacity).toBe(0)
    expect(updated.status).toBe(BinStatus.Empty)
    expect(updated.currentItem).toBeUndefined()
  })

  it('removeItem 移除超出量抛 Error', () => {
    const bin = svc.createBin({
      tenantId, code: 'CAP-05', area: '测试', type: BinType.Shelf,
      capacity: 50, usedCapacity: 20, status: BinStatus.Occupied,
    })
    expect(() => svc.removeItem(bin.id, 30, tenantId)).toThrow(/Cannot remove/)
  })

  it('reserveBin 预留空库位', () => {
    const bin = svc.createBin({
      tenantId, code: 'RES-01', area: '测试', type: BinType.Shelf,
      capacity: 100,
    })
    const updated = svc.reserveBin(bin.id, tenantId)
    expect(updated.status).toBe(BinStatus.Reserved)
  })

  it('reserveBin 非空库位抛 Error', () => {
    const bin = svc.createBin({
      tenantId, code: 'RES-02', area: '测试', type: BinType.Shelf,
      status: BinStatus.Occupied, capacity: 100, usedCapacity: 50,
    })
    expect(() => svc.reserveBin(bin.id, tenantId)).toThrow(/Cannot reserve/)
  })

  it('setMaintenance 设置维修状态', () => {
    const bin = svc.createBin({
      tenantId, code: 'MAINT-01', area: '测试', type: BinType.Shelf,
      capacity: 100,
    })
    const updated = svc.setMaintenance(bin.id, tenantId)
    expect(updated.status).toBe(BinStatus.Maintenance)
  })
})

describe('WarehouseBinService — 查询辅助', () => {
  let svc: WarehouseBinService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new WarehouseBinService()
    svc.resetBinStoresForTests()
  })

  it('getEmptyBins 只返回空库位', () => {
    const empty = svc.getEmptyBins(tenantId)
    empty.forEach((b) => expect(b.status).toBe(BinStatus.Empty))
  })

  it('getOccupiedBinsByArea 按区域查询占用库位', () => {
    const occupied = svc.getOccupiedBinsByArea('A区', tenantId)
    occupied.forEach((b) => {
      expect(b.area).toBe('A区')
      expect(b.status).toBe(BinStatus.Occupied)
    })
  })

  it('getCapacityUtilization 返回利用率', () => {
    const util = svc.getCapacityUtilization(tenantId)
    expect(util.totalCapacity).toBeGreaterThan(0)
    expect(util.utilizationRate).toBeGreaterThanOrEqual(0)
    expect(util.utilizationRate).toBeLessThanOrEqual(100)
    expect(util.bins.length).toBeGreaterThan(0)
  })
})
