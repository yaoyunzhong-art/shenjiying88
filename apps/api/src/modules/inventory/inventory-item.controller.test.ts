import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { InventoryItemController } from './inventory-item.controller'
import { InventoryItemService } from './inventory-item.service'

/**
 * Phase-37 T167: InventoryItemController 单元测试
 *
 * 覆盖:
 *  - 路由元数据: controller path + 各 method path/method/status
 *  - 正例: create/list/get/update/stockIn/stockOut/adjust/reserve/confirm/release
 *  - 反例: tenantId 缺失抛 Error
 *  - 边界: 空列表/不存在的 id
 */

function makeMockService(): InventoryItemService {
  return new InventoryItemService()
}

describe('InventoryItemController — 路由元数据', () => {
  it('controller path = api/inventory/items', () => {
    const path = Reflect.getMetadata('path', InventoryItemController)
    assert.equal(path, 'api/inventory/items')
  })

  it('create: POST / + 201', () => {
    const method = Reflect.getMetadata('method', InventoryItemController.prototype.create)
    const path = Reflect.getMetadata('path', InventoryItemController.prototype.create)
    const status = Reflect.getMetadata('__httpCode__', InventoryItemController.prototype.create)
    assert.equal(method, 1) // POST
    assert.equal(path, '/')
    assert.equal(status, 201)
  })

  it('getOne: GET :id', () => {
    const method = Reflect.getMetadata('method', InventoryItemController.prototype.getOne)
    const path = Reflect.getMetadata('path', InventoryItemController.prototype.getOne)
    assert.equal(method, 0) // GET
    assert.equal(path, ':id')
  })

  it('list: GET /', () => {
    const method = Reflect.getMetadata('method', InventoryItemController.prototype.list)
    const path = Reflect.getMetadata('path', InventoryItemController.prototype.list)
    assert.equal(method, 0)
    assert.equal(path, '/')
  })

  it('update: PUT :id', () => {
    const method = Reflect.getMetadata('method', InventoryItemController.prototype.update)
    const path = Reflect.getMetadata('path', InventoryItemController.prototype.update)
    assert.equal(method, 2) // PUT
    assert.equal(path, ':id')
  })

  it('stockIn: POST :id/stock-in', () => {
    const method = Reflect.getMetadata('method', InventoryItemController.prototype.stockIn)
    const path = Reflect.getMetadata('path', InventoryItemController.prototype.stockIn)
    assert.equal(method, 1)
    assert.equal(path, ':id/stock-in')
  })

  it('stockOut: POST :id/stock-out', () => {
    const method = Reflect.getMetadata('method', InventoryItemController.prototype.stockOut)
    const path = Reflect.getMetadata('path', InventoryItemController.prototype.stockOut)
    assert.equal(method, 1)
    assert.equal(path, ':id/stock-out')
  })

  it('adjust: POST :id/adjust', () => {
    const method = Reflect.getMetadata('method', InventoryItemController.prototype.adjust)
    const path = Reflect.getMetadata('path', InventoryItemController.prototype.adjust)
    assert.equal(method, 1)
    assert.equal(path, ':id/adjust')
  })

  it('reserve: POST :id/reserve + 201', () => {
    const method = Reflect.getMetadata('method', InventoryItemController.prototype.reserve)
    const path = Reflect.getMetadata('path', InventoryItemController.prototype.reserve)
    const status = Reflect.getMetadata('__httpCode__', InventoryItemController.prototype.reserve)
    assert.equal(method, 1)
    assert.equal(path, ':id/reserve')
    assert.equal(status, 201)
  })

  it('confirmReservation: POST reservations/:rid/confirm', () => {
    const method = Reflect.getMetadata('method', InventoryItemController.prototype.confirmReservation)
    const path = Reflect.getMetadata('path', InventoryItemController.prototype.confirmReservation)
    assert.equal(method, 1)
    assert.equal(path, 'reservations/:rid/confirm')
  })

  it('releaseReservation: POST reservations/:rid/release', () => {
    const method = Reflect.getMetadata('method', InventoryItemController.prototype.releaseReservation)
    const path = Reflect.getMetadata('path', InventoryItemController.prototype.releaseReservation)
    assert.equal(method, 1)
    assert.equal(path, 'reservations/:rid/release')
  })

  it('getReservation: GET reservations/:rid', () => {
    const method = Reflect.getMetadata('method', InventoryItemController.prototype.getReservation)
    const path = Reflect.getMetadata('path', InventoryItemController.prototype.getReservation)
    assert.equal(method, 0)
    assert.equal(path, 'reservations/:rid')
  })

  it('getLowStock: GET low-stock/list', () => {
    const method = Reflect.getMetadata('method', InventoryItemController.prototype.getLowStock)
    const path = Reflect.getMetadata('path', InventoryItemController.prototype.getLowStock)
    assert.equal(method, 0)
    assert.equal(path, 'low-stock/list')
  })

  it('getAuditLog: GET :id/audit', () => {
    const method = Reflect.getMetadata('method', InventoryItemController.prototype.getAuditLog)
    const path = Reflect.getMetadata('path', InventoryItemController.prototype.getAuditLog)
    assert.equal(method, 0)
    assert.equal(path, ':id/audit')
  })
})

describe('InventoryItemController — 正例', () => {
  let ctrl: InventoryItemController

  beforeEach(() => {
    const svc = makeMockService()
    ctrl = new InventoryItemController(svc)
  })

  it('create + getOne 循环', () => {
    const item = ctrl.create({ tenantId: 't1', sku: 'S001', name: '测试商品', totalQty: 50, unitPriceCents: 2000 })
    assert.equal(item.sku, 'S001')
    assert.equal(item.totalQty, 50)
    assert.equal(item.availableQty, 50)

    const found = ctrl.getOne(item.id, { tenantId: 't1' })
    assert.ok(found)
    assert.equal(found!.id, item.id)
  })

  it('list 返回已创建 items', () => {
    ctrl.create({ tenantId: 't1', sku: 'A', name: 'A', totalQty: 10, unitPriceCents: 100 })
    ctrl.create({ tenantId: 't1', sku: 'B', name: 'B', totalQty: 20, unitPriceCents: 200 })
    const result = ctrl.list({ tenantId: 't1' })
    assert.equal(result.total, 2)
    assert.equal(result.items.length, 2)
  })

  it('update 修改名称 + 乐观锁递增', () => {
    const item = ctrl.create({ tenantId: 't1', sku: 'U1', name: '旧名', totalQty: 10, unitPriceCents: 100 })
    const updated = ctrl.update(item.id, { tenantId: 't1', version: '1' }, { name: '新名' })
    assert.equal(updated.name, '新名')
    assert.equal(updated.version, 2)
  })

  it('stockIn 增加库存', () => {
    const item = ctrl.create({ tenantId: 't1', sku: 'SI1', name: '入库测试', totalQty: 10, unitPriceCents: 100 })
    const after = ctrl.stockIn(item.id, { tenantId: 't1', qty: 5, reason: '补货' })
    assert.equal(after.totalQty, 15)
    assert.equal(after.availableQty, 15)
  })

  it('stockOut 减少库存', () => {
    const item = ctrl.create({ tenantId: 't1', sku: 'SO1', name: '出库测试', totalQty: 20, unitPriceCents: 100 })
    const after = ctrl.stockOut(item.id, { tenantId: 't1', qty: 5, reason: '销售出库' })
    assert.equal(after.totalQty, 15)
    assert.equal(after.availableQty, 15)
  })

  it('adjust 调整总库存', () => {
    const item = ctrl.create({ tenantId: 't1', sku: 'ADJ1', name: '调整测试', totalQty: 10, unitPriceCents: 100 })
    const after = ctrl.adjust(item.id, { tenantId: 't1', qty: 5, newTotalQty: 30, reason: '盘点调整' })
    assert.equal(after.totalQty, 30)
    assert.equal(after.availableQty, 30)
  })

  it('adjust 保留预留数量', () => {
    const svc = new InventoryItemService()
    const ctrl2 = new InventoryItemController(svc)
    const item = ctrl2.create({ tenantId: 't1', sku: 'ADJ-RES', name: '预留调整', totalQty: 20, unitPriceCents: 100 })
    ctrl2.reserve(item.id, { tenantId: 't1', orderId: 'O-ADJ', qty: 5 })
    const after = ctrl2.adjust(item.id, { tenantId: 't1', qty: 5, newTotalQty: 30, reason: '调整含预留' })
    assert.equal(after.totalQty, 30)
    assert.equal(after.availableQty, 25) // 30 - 5
  })

  it('reserve + confirm 完整流程', () => {
    const item = ctrl.create({ tenantId: 't1', sku: 'R1', name: '预留测试', totalQty: 10, unitPriceCents: 100 })
    const reservation = ctrl.reserve(item.id, { tenantId: 't1', orderId: 'ORD-001', qty: 3 })
    assert.equal(reservation.status, 'PENDING')

    // 确认后 item 总库存减少
    const afterConfirm = ctrl.confirmReservation(reservation.id, { tenantId: 't1' })
    assert.equal(afterConfirm.totalQty, 7)
    assert.equal(afterConfirm.availableQty, 7)
  })

  it('reserve + release 释放预留', () => {
    const item = ctrl.create({ tenantId: 't1', sku: 'RL1', name: '释放测试', totalQty: 10, unitPriceCents: 100 })
    const res = ctrl.reserve(item.id, { tenantId: 't1', orderId: 'ORD-002', qty: 3 })
    const afterRelease = ctrl.releaseReservation(res.id, { tenantId: 't1' }, { reason: '取消订单' })
    // release 后 reservedQty 减少
    assert.equal(afterRelease.availableQty, 10)
  })

  it('reserve 幂等: 同 orderId 返回相同 reservation', () => {
    const item = ctrl.create({ tenantId: 't1', sku: 'IDEM1', name: '幂等测试', totalQty: 10, unitPriceCents: 100 })
    const r1 = ctrl.reserve(item.id, { tenantId: 't1', orderId: 'ORD-IDEM', qty: 3 })
    const r2 = ctrl.reserve(item.id, { tenantId: 't1', orderId: 'ORD-IDEM', qty: 3 })
    assert.equal(r1.id, r2.id)
  })

  it('getLowStock 返回低于阈值的商品', () => {
    ctrl.create({ tenantId: 't1', sku: 'LS1', name: '低库存', totalQty: 3, unitPriceCents: 100, lowStockThreshold: 5 })
    ctrl.create({ tenantId: 't1', sku: 'LS2', name: '正常', totalQty: 100, unitPriceCents: 100, lowStockThreshold: 5 })
    const low = ctrl.getLowStock({ tenantId: 't1' })
    assert.equal(low.length, 1)
    assert.equal(low[0].sku, 'LS1')
  })

  it('getAuditLog 返回审计记录', () => {
    const item = ctrl.create({ tenantId: 't1', sku: 'AUD1', name: '审计', totalQty: 10, unitPriceCents: 100 })
    ctrl.stockIn(item.id, { tenantId: 't1', qty: 5, reason: '补货' })
    const logs = ctrl.getAuditLog(item.id, { tenantId: 't1' })
    assert.ok(logs.length >= 2) // CREATE + STOCK_IN
    assert.equal(logs[0].type, 'CREATE')
    assert.equal(logs[1].type, 'STOCK_IN')
  })

  it('getReservationById', () => {
    const item = ctrl.create({ tenantId: 't1', sku: 'GR1', name: '查预留', totalQty: 10, unitPriceCents: 100 })
    const res = ctrl.reserve(item.id, { tenantId: 't1', orderId: 'ORD-GR', qty: 3 })
    const found = ctrl.getReservation(res.id, { tenantId: 't1' })
    assert.equal(found!.id, res.id)
    assert.equal(found!.status, 'PENDING')
  })

  it('scanExpired(service): TTL 0 立即过期', () => {
    const svc = new InventoryItemService()
    const item = svc.create({ tenantId: 't1', sku: 'EXP', name: '过期项', totalQty: 10, unitPriceCents: 100 })
    svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-EXP', qty: 3, ttlSeconds: 0 })
    // TTL=0 的 reservation 应在未来扫过期
    const expired = svc.scanExpiredReservations(new Date('2099-01-01'))
    assert.equal(expired.length, 1)
    assert.equal(expired[0].status, 'EXPIRED')
  })
})

describe('InventoryItemController — 反例 & 边界', () => {
  let ctrl: InventoryItemController

  beforeEach(() => {
    ctrl = new InventoryItemController(makeMockService())
  })

  it('getOne 缺少 tenantId 抛 Error', () => {
    assert.throws(() => ctrl.getOne('some-id', {}), /tenantId required/)
  })

  it('list 缺少 tenantId 抛 Error', () => {
    assert.throws(() => ctrl.list({}), /tenantId required/)
  })

  it('update 缺少 tenantId 抛 Error', () => {
    assert.throws(() => ctrl.update('id', {}, { name: 'x' }), /tenantId required/)
  })

  it('confirmReservation 缺少 tenantId 抛 Error', () => {
    assert.throws(() => ctrl.confirmReservation('rid', {}), /tenantId required/)
  })

  it('releaseReservation 缺少 tenantId 抛 Error', () => {
    assert.throws(() => ctrl.releaseReservation('rid', {}), /tenantId required/)
  })

  it('getReservation 缺少 tenantId 抛 Error', () => {
    assert.throws(() => ctrl.getReservation('rid', {}), /tenantId required/)
  })

  it('getLowStock 缺少 tenantId 抛 Error', () => {
    assert.throws(() => ctrl.getLowStock({}), /tenantId required/)
  })

  it('getAuditLog 缺少 tenantId 抛 Error', () => {
    assert.throws(() => ctrl.getAuditLog('id', {}), /tenantId required/)
  })

  it('create totalQty < 0 抛 BadRequestException', () => {
    assert.throws(
      () => ctrl.create({ tenantId: 't1', sku: 'NEG', name: '负', totalQty: -1, unitPriceCents: 100 }),
      /totalQty must be >= 0/
    )
  })

  it('stockOut 可用库存不足抛 ConflictException', () => {
    const item = ctrl.create({ tenantId: 't1', sku: 'NSO1', name: '不足', totalQty: 5, unitPriceCents: 100 })
    assert.throws(
      () => ctrl.stockOut(item.id, { tenantId: 't1', qty: 10, reason: '超卖' }),
      /available qty/
    )
  })

  it('update version 冲突抛 ConflictException', () => {
    const item = ctrl.create({ tenantId: 't1', sku: 'VER1', name: 'version', totalQty: 10, unitPriceCents: 100 })
    // 先修改一次, version 变成 2
    ctrl.update(item.id, { tenantId: 't1', version: '1' }, { name: 'v2' })
    // 再用旧的 version=1 更新
    assert.throws(
      () => ctrl.update(item.id, { tenantId: 't1', version: '1' }, { name: '冲突' }),
      /version mismatch/
    )
  })

  it('跨租户隔离: getOne 返回 null', () => {
    const item = ctrl.create({ tenantId: 't1', sku: 'TEN1', name: '租户1', totalQty: 10, unitPriceCents: 100 })
    const found = ctrl.getOne(item.id, { tenantId: 't2' })
    assert.equal(found, null)
  })

  it('重复 SKU 抛 ConflictException', () => {
    ctrl.create({ tenantId: 't1', sku: 'DUP', name: '首次', totalQty: 10, unitPriceCents: 100 })
    assert.throws(
      () => ctrl.create({ tenantId: 't1', sku: 'DUP', name: '重复', totalQty: 20, unitPriceCents: 200 }),
      /SKU DUP already exists/
    )
  })

  it('reserve qty <= 0 抛 BadRequestException', () => {
    const item = ctrl.create({ tenantId: 't1', sku: 'ZQ', name: '零qty', totalQty: 10, unitPriceCents: 100 })
    assert.throws(
      () => ctrl.reserve(item.id, { tenantId: 't1', orderId: 'ORD-Z', qty: 0 }),
      /qty must be > 0/
    )
  })

  it('空列表', () => {
    const result = ctrl.list({ tenantId: 't-empty' })
    assert.equal(result.total, 0)
    assert.deepEqual(result.items, [])
  })

  it('低库存阈值过滤 无匹配', () => {
    ctrl.create({ tenantId: 't1', sku: 'NLS', name: '不缺', totalQty: 100, unitPriceCents: 100, lowStockThreshold: 5 })
    const low = ctrl.getLowStock({ tenantId: 't1' })
    assert.equal(low.length, 0)
  })
})
