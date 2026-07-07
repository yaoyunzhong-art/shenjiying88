import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Test, type TestingModule } from '@nestjs/testing'
import { InventoryItemController } from './inventory-item.controller'
import { InventoryItemService } from './inventory-item.service'
import type {
  InventoryItem,
  InventoryReservation,
  InventoryAuditEntry,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
} from './inventory-item.entity'

/** 伪 service — 全 mock, 仅验证 controller → service 委托 + 参数传递 */
function mockService() {
  return {
    create:         vi.fn(),
    getById:        vi.fn(),
    list:           vi.fn(),
    update:         vi.fn(),
    stockIn:        vi.fn(),
    stockOut:       vi.fn(),
    adjust:         vi.fn(),
    reserve:        vi.fn(),
    confirmReservation:  vi.fn(),
    releaseReservation:  vi.fn(),
    getReservationById:  vi.fn(),
    getLowStock:         vi.fn(),
    getAuditLog:         vi.fn(),
  } satisfies Partial<InventoryItemService> as unknown as InventoryItemService
}

type Svc = ReturnType<typeof mockService>

describe('InventoryItemController', () => {
  let ctrl: InventoryItemController
  let svc: Svc

  const aItem: InventoryItem = {
    id: 'inv-001', tenantId: 't1', sku: 'S001', name: '测试商品',
    unit: '件', totalQty: 50, reservedQty: 0, availableQty: 50,
    lowStockThreshold: 0, unitPriceCents: 2000, status: 'ACTIVE',
    version: 1, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
  }
  const aRes: InventoryReservation = {
    id: 'res-001', tenantId: 't1', itemId: 'inv-001', orderId: 'ORD-001',
    qty: 3, status: 'PENDING', expiresAt: '2025-01-01T01:00:00Z',
    createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
    history: [],
  }

  beforeEach(async () => {
    svc = mockService()
    const mod: TestingModule = await Test.createTestingModule({
      controllers: [InventoryItemController],
      providers: [{ provide: InventoryItemService, useValue: svc }],
    }).compile()
    ctrl = mod.get(InventoryItemController)
  })

  // ================================================================
  // 1. 正例 — 创建
  // ================================================================
  describe('create', () => {
    it('应委托 service.create 并返回新建 item', () => {
      svc.create.mockReturnValue(aItem)
      const input: CreateInventoryItemInput = { tenantId: 't1', sku: 'S001', name: '测试商品', totalQty: 50, unitPriceCents: 2000 }
      const result = ctrl.create(input)
      expect(svc.create).toHaveBeenCalledWith(input)
      expect(result).toEqual(aItem)
    })
  })

  // ================================================================
  // 2-3. 正例 — getOne / list
  // ================================================================
  describe('getOne', () => {
    it('应委托 service.getById 并返回 item', () => {
      svc.getById.mockReturnValue(aItem)
      const result = ctrl.getOne('inv-001', { tenantId: 't1' })
      expect(svc.getById).toHaveBeenCalledWith('inv-001', 't1')
      expect(result).toEqual(aItem)
    })

    it('tenantId 缺失应抛 Error', () => {
      expect(() => ctrl.getOne('inv-001', {})).toThrow('tenantId required')
      expect(svc.getById).not.toHaveBeenCalled()
    })
  })

  describe('list', () => {
    it('应委托 service.list 并返回分页结果', () => {
      const page = { items: [aItem], total: 1 }
      svc.list.mockReturnValue(page)
      const result = ctrl.list({ tenantId: 't1', status: 'ACTIVE' })
      expect(svc.list).toHaveBeenCalledWith({ tenantId: 't1', status: 'ACTIVE' })
      expect(result).toEqual(page)
    })

    it('tenantId 缺失应抛 Error', () => {
      expect(() => ctrl.list({})).toThrow('tenantId required')
    })
  })

  // ================================================================
  // 4. 正例 — update
  // ================================================================
  describe('update', () => {
    it('应委托 service.update 并返回已更新 item', () => {
      svc.update.mockReturnValue({ ...aItem, name: '新名', version: 2 })
      const patch: UpdateInventoryItemInput = { name: '新名' }
      const result = ctrl.update('inv-001', { tenantId: 't1', version: '1' }, patch)
      expect(svc.update).toHaveBeenCalledWith('inv-001', 't1', 1, patch)
      expect(result.name).toBe('新名')
      expect(result.version).toBe(2)
    })

    it('tenantId 缺失应抛 Error', () => {
      expect(() => ctrl.update('id', {}, { name: 'x' })).toThrow('tenantId required')
    })
  })

  // ================================================================
  // 5-7. 正例 — stockIn / stockOut / adjust
  // ================================================================
  describe('stockIn', () => {
    it('应委托 service.stockIn 并返回更新后 item', () => {
      svc.stockIn.mockReturnValue({ ...aItem, totalQty: 55, availableQty: 55 })
      const result = ctrl.stockIn('inv-001', { tenantId: 't1', qty: 5, reason: '补货' })
      expect(svc.stockIn).toHaveBeenCalledWith({ itemId: 'inv-001', tenantId: 't1', qty: 5, reason: '补货' })
      expect(result.totalQty).toBe(55)
    })
  })

  describe('stockOut', () => {
    it('应委托 service.stockOut 并返回更新后 item', () => {
      svc.stockOut.mockReturnValue({ ...aItem, totalQty: 45, availableQty: 45 })
      const result = ctrl.stockOut('inv-001', { tenantId: 't1', qty: 5, reason: '销售出库' })
      expect(svc.stockOut).toHaveBeenCalledWith({ itemId: 'inv-001', tenantId: 't1', qty: 5, reason: '销售出库' })
      expect(result.totalQty).toBe(45)
    })
  })

  describe('adjust', () => {
    it('应委托 service.adjust 并返回调整后 item', () => {
      svc.adjust.mockReturnValue({ ...aItem, totalQty: 30, availableQty: 30 })
      const result = ctrl.adjust('inv-001', { tenantId: 't1', qty: 5, newTotalQty: 30, reason: '盘点' })
      expect(svc.adjust).toHaveBeenCalledWith({ itemId: 'inv-001', tenantId: 't1', qty: 5, newTotalQty: 30, reason: '盘点' })
      expect(result.totalQty).toBe(30)
    })
  })

  // ================================================================
  // 8. 正例 — reserve
  // ================================================================
  describe('reserve', () => {
    it('应委托 service.reserve 并返回 reservation', () => {
      svc.reserve.mockReturnValue(aRes)
      const result = ctrl.reserve('inv-001', { tenantId: 't1', orderId: 'ORD-001', qty: 3 })
      expect(svc.reserve).toHaveBeenCalledWith({ itemId: 'inv-001', tenantId: 't1', orderId: 'ORD-001', qty: 3 })
      expect(result.status).toBe('PENDING')
    })
  })

  // ================================================================
  // 9-10. 正例 — confirmReservation / releaseReservation
  // ================================================================
  describe('confirmReservation', () => {
    it('应委托 service.confirmReservation 并返回更新后 item', () => {
      svc.confirmReservation.mockReturnValue({ ...aItem, totalQty: 47, availableQty: 47 })
      const result = ctrl.confirmReservation('res-001', { tenantId: 't1' })
      expect(svc.confirmReservation).toHaveBeenCalledWith('res-001', 't1')
      expect(result.totalQty).toBe(47)
    })

    it('tenantId 缺失应抛 Error', () => {
      expect(() => ctrl.confirmReservation('rid', {})).toThrow('tenantId required')
    })
  })

  describe('releaseReservation', () => {
    it('应委托 service.releaseReservation 并返回 item', () => {
      svc.releaseReservation.mockReturnValue(aItem)
      const result = ctrl.releaseReservation('res-001', { tenantId: 't1' }, { reason: '取消', releasedBy: 'admin' })
      expect(svc.releaseReservation).toHaveBeenCalledWith('res-001', 't1', '取消', 'admin')
      expect(result.id).toBe('inv-001')
    })

    it('tenantId 缺失应抛 Error', () => {
      expect(() => ctrl.releaseReservation('rid', {})).toThrow('tenantId required')
    })
  })

  // ================================================================
  // 11-13. 正例 — getReservation / getLowStock / getAuditLog
  // ================================================================
  describe('getReservation', () => {
    it('应委托 service.getReservationById 并返回 reservation', () => {
      svc.getReservationById.mockReturnValue(aRes)
      const result = ctrl.getReservation('res-001', { tenantId: 't1' })
      expect(svc.getReservationById).toHaveBeenCalledWith('res-001', 't1')
      expect(result?.id).toBe('res-001')
    })

    it('tenantId 缺失应抛 Error', () => {
      expect(() => ctrl.getReservation('rid', {})).toThrow('tenantId required')
    })
  })

  describe('getLowStock', () => {
    it('应委托 service.getLowStock 并返回低库存列表', () => {
      svc.getLowStock.mockReturnValue([aItem])
      const result = ctrl.getLowStock({ tenantId: 't1' })
      expect(svc.getLowStock).toHaveBeenCalledWith('t1')
      expect(result).toHaveLength(1)
    })

    it('tenantId 缺失应抛 Error', () => {
      expect(() => ctrl.getLowStock({})).toThrow('tenantId required')
    })
  })

  describe('getAuditLog', () => {
    it('应委托 service.getAuditLog 并返回审计记录', () => {
      const logs: InventoryAuditEntry[] = [
        { itemId: 'inv-001', tenantId: 't1', type: 'CREATE', beforeQty: 0, afterQty: 50, reason: 'item created', performedBy: 'system', at: '2025-01-01T00:00:00Z' },
      ]
      svc.getAuditLog.mockReturnValue(logs)
      const result = ctrl.getAuditLog('inv-001', { tenantId: 't1' })
      expect(svc.getAuditLog).toHaveBeenCalledWith('inv-001', 't1')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('CREATE')
    })

    it('tenantId 缺失应抛 Error', () => {
      expect(() => ctrl.getAuditLog('id', {})).toThrow('tenantId required')
    })
  })

  // ================================================================
  // 14+. 反例 & 边界 — 委托层验证 service 异常向上传播
  // ================================================================
  describe('service 异常传播', () => {
    it('create 应透传 service 异常', () => {
      svc.create.mockImplementation(() => { throw new Error('SKU重复') })
      expect(() => ctrl.create({ tenantId: 't1', sku: 'DUP', name: '重复', totalQty: 10, unitPriceCents: 100 })).toThrow('SKU重复')
    })

    it('stockOut 应透传库存不足异常', () => {
      svc.stockOut.mockImplementation(() => { throw new Error('available qty') })
      expect(() => ctrl.stockOut('inv-001', { tenantId: 't1', qty: 999, reason: '超卖' })).toThrow('available qty')
    })

    it('update 应透传 version 冲突异常', () => {
      svc.update.mockImplementation(() => { throw new Error('version mismatch') })
      expect(() => ctrl.update('inv-001', { tenantId: 't1', version: '1' }, { name: 'x' })).toThrow('version mismatch')
    })

    it('releaseReservation 可选参数默认为空', () => {
      svc.releaseReservation.mockReturnValue(aItem)
      const result = ctrl.releaseReservation('res-001', { tenantId: 't1' })  // 不传 body
      expect(svc.releaseReservation).toHaveBeenCalledWith('res-001', 't1', undefined, undefined)
      expect(result).toEqual(aItem)
    })

    it('getOne 跨租户返回 null', () => {
      svc.getById.mockReturnValue(null)
      const result = ctrl.getOne('inv-001', { tenantId: 't2' })
      expect(result).toBeNull()
    })

    it('list 空租户返回空数组', () => {
      svc.list.mockReturnValue({ items: [], total: 0 })
      const result = ctrl.list({ tenantId: 't-empty' })
      expect(result.total).toBe(0)
      expect(result.items).toEqual([])
    })
  })
})
