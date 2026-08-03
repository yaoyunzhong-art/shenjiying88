/**
 * logistics-supplement.service.supplement.spec.ts — 物流补充 Service 补充覆盖 (V23)
 *
 * 覆盖 principal spec 未覆盖的 public 方法:
 *   updateTransportOrder / deleteTransportOrder / getCargoLoad (single) /
 *   updateCargoStatus / listRoutePlans / updateRoutePlan / deleteRoutePlan /
 *   deleteDriverSchedule / getVehicleMaintenanceHistory /
 *   getAccidentRecords (vehicle filter) / resolveAccident (already resolved) /
 *   getCost (single) / deleteCost / getMetrics / getFuelRecord (single) /
 *   deleteFuelRecord / deleteTransportOrder (in_transit 错误)
 *
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LogisticsSupplementService } from './logistics-supplement.service'

const TENANT = 't-supp-001'

function makeBaseOrder() {
  return {
    tenantId: TENANT,
    storeId: 'store-sup',
    orderNumber: 'TO-SUP-001',
    transportType: 'normal' as const,
    status: 'draft' as const,
    originWarehouseCode: 'WH-SH',
    originAddress: '上海仓库',
    destinationWarehouseCode: 'WH-SZ',
    destinationAddress: '深圳门店',
    items: [{ cargoId: 'c-001', cargoName: '物料', quantity: 10, unit: '箱', weightKg: 200, volumeM3: 1 }],
    totalWeightKg: 200,
    driverId: 'D-001',
    driverName: '张师傅',
    vehiclePlate: '沪A00001',
    scheduledPickupAt: new Date().toISOString(),
    estimatedArrivalAt: new Date(Date.now() + 86400000).toISOString(),
    createdBy: 'u-sup',
    createdByName: '管理员',
  }
}

describe('LogisticsSupplementService — Supplement', () => {
  let svc: LogisticsSupplementService

  beforeEach(() => {
    svc = new LogisticsSupplementService()
  })

  // ════════════════════════════════════════════════════
  // updateTransportOrder
  // ════════════════════════════════════════════════════

  describe('updateTransportOrder', () => {
    it('正例: 更新运输单字段', async () => {
      const order = await svc.createTransportOrder(makeBaseOrder())
      const updated = await svc.updateTransportOrder(order.id, { driverName: '李师傅' })
      expect(updated.driverName).toBe('李师傅')
      // updatedAt 应为 ISO 字符串，不为空
      expect(typeof updated.updatedAt).toBe('string')
      expect(updated.updatedAt.length).toBeGreaterThan(0)
    })

    it('正例: 更新 items 时自动重算重量和体积', async () => {
      const order = await svc.createTransportOrder(makeBaseOrder())
      const updated = await svc.updateTransportOrder(order.id, {
        items: [
          { cargoId: 'c-002', cargoName: '新物料', quantity: 20, unit: '箱', weightKg: 500, volumeM3: 3 },
        ],
      })
      expect(updated.totalWeightKg).toBe(500)
      expect(updated.totalVolumeM3).toBe(3)
    })
  })

  // ════════════════════════════════════════════════════
  // deleteTransportOrder
  // ════════════════════════════════════════════════════

  describe('deleteTransportOrder', () => {
    it('正例: 删除草稿状态的运输单', async () => {
      const order = await svc.createTransportOrder({ ...makeBaseOrder(), orderNumber: 'TO-DEL-001' })
      await expect(svc.deleteTransportOrder(order.id)).resolves.toBeUndefined()
    })

    it('反例: 删除进行中的运输单抛 BadRequestException', async () => {
      const order = await svc.createTransportOrder({ ...makeBaseOrder(), orderNumber: 'TO-DEL-002' })
      await svc.updateTransportOrderStatus(order.id, 'in_transit')
      await expect(svc.deleteTransportOrder(order.id)).rejects.toThrow('in-transit')
    })

    it('反例: 删除不存在的运输单抛 NotFoundException', async () => {
      await expect(svc.deleteTransportOrder('nonexist')).rejects.toThrow('not found')
    })
  })

  // ════════════════════════════════════════════════════
  // getCargoLoad (single)
  // ════════════════════════════════════════════════════

  describe('getCargoLoad', () => {
    it('正例: 通过 ID 查询货物装载', async () => {
      const load = await svc.addCargoLoad({
        tenantId: TENANT, transportOrderId: 'to-sup-1',
        cargoCode: 'CG-SUP', cargoName: '贵重品', quantity: 5, unit: '件',
        weightKg: 100, volumeM3: 0.5, status: 'pending' as const,
      })
      const found = await svc.getCargoLoad(load.id)
      expect(found.cargoName).toBe('贵重品')
    })

    it('反例: 不存在的货物抛 NotFoundException', async () => {
      await expect(svc.getCargoLoad('nonexist')).rejects.toThrow('not found')
    })
  })

  // ════════════════════════════════════════════════════
  // updateCargoStatus
  // ════════════════════════════════════════════════════

  describe('updateCargoStatus', () => {
    it('正例: 更新货物状态为 delivered', async () => {
      const load = await svc.addCargoLoad({
        tenantId: TENANT, transportOrderId: 'to-sup-2',
        cargoCode: 'CG-STATUS', cargoName: '状态测试', quantity: 10, unit: '箱',
        weightKg: 300, status: 'loaded' as const,
      })
      const updated = await svc.updateCargoStatus(load.id, 'delivered')
      expect(updated.status).toBe('delivered')
      expect(updated.unloadedAt).toBeTruthy()
    })

    it('反例: 无效状态抛 BadRequestException', async () => {
      const load = await svc.addCargoLoad({
        tenantId: TENANT, transportOrderId: 'to-sup-2',
        cargoCode: 'CG-ERR', cargoName: '错误', quantity: 1, unit: '箱',
        weightKg: 10, status: 'pending' as const,
      })
      await expect(svc.updateCargoStatus(load.id, 'invalid_status'))
        .rejects.toThrow('Invalid cargo status')
    })
  })

  // ════════════════════════════════════════════════════
  // listRoutePlans
  // ════════════════════════════════════════════════════

  describe('listRoutePlans', () => {
    it('正例: 按状态筛选路线规划', async () => {
      await svc.createRoutePlan({
        tenantId: TENANT, name: '路线A', originWarehouseCode: 'WH-A',
        destinationWarehouseCode: 'WH-B', waypoints: [], totalDistanceKm: 100,
        estimatedDurationMin: 120, status: 'active' as const, createdBy: 'u-sup',
      })
      await svc.createRoutePlan({
        tenantId: TENANT, name: '路线B', originWarehouseCode: 'WH-C',
        destinationWarehouseCode: 'WH-D', waypoints: [], totalDistanceKm: 200,
        estimatedDurationMin: 240, status: 'archived' as const, createdBy: 'u-sup',
      })
      const active = await svc.listRoutePlans({ status: 'active' })
      expect(active.length).toBe(1)
      expect(active[0].name).toBe('路线A')
    })

    it('边界: 无过滤返回全部', async () => {
      const all = await svc.listRoutePlans()
      expect(all.length).toBe(0) // 无数据
    })
  })

  // ════════════════════════════════════════════════════
  // updateRoutePlan
  // ════════════════════════════════════════════════════

  describe('updateRoutePlan', () => {
    it('正例: 更新路线规划字段', async () => {
      const plan = await svc.createRoutePlan({
        tenantId: TENANT, name: '原路线', originWarehouseCode: 'WH-X',
        destinationWarehouseCode: 'WH-Y', waypoints: [], totalDistanceKm: 500,
        estimatedDurationMin: 360, status: 'active' as const, createdBy: 'u-sup',
      })
      const updated = await svc.updateRoutePlan(plan.id, { name: '新路线', totalDistanceKm: 550 })
      expect(updated.name).toBe('新路线')
      expect(updated.totalDistanceKm).toBe(550)
    })
  })

  // ════════════════════════════════════════════════════
  // deleteRoutePlan
  // ════════════════════════════════════════════════════

  describe('deleteRoutePlan', () => {
    it('正例: 删除路线规划', async () => {
      const plan = await svc.createRoutePlan({
        tenantId: TENANT, name: '待删', originWarehouseCode: 'WH-DEL',
        destinationWarehouseCode: 'WH-DEL2', waypoints: [], totalDistanceKm: 10,
        estimatedDurationMin: 10, status: 'active' as const, createdBy: 'u-sup',
      })
      await expect(svc.deleteRoutePlan(plan.id)).resolves.toBeUndefined()
    })

    it('反例: 删除不存在的路线抛 NotFoundException', async () => {
      await expect(svc.deleteRoutePlan('nonexist')).rejects.toThrow('not found')
    })
  })

  // ════════════════════════════════════════════════════
  // deleteDriverSchedule
  // ════════════════════════════════════════════════════

  describe('deleteDriverSchedule', () => {
    it('正例: 删除司机排班', async () => {
      const s = await svc.createDriverSchedule({
        tenantId: TENANT, driverId: 'D-DEL', driverName: '待删司机',
        scheduleDate: '2026-08-15', shiftName: '晚班', shiftStart: '18:00',
        shiftEnd: '02:00', transportOrderIds: [], status: 'scheduled' as const,
      })
      await expect(svc.deleteDriverSchedule(s.id)).resolves.toBeUndefined()
    })

    it('反例: 删除不存在的排班抛 NotFoundException', async () => {
      await expect(svc.deleteDriverSchedule('nonexist')).rejects.toThrow('not found')
    })
  })

  // ════════════════════════════════════════════════════
  // getVehicleMaintenanceHistory
  // ════════════════════════════════════════════════════

  describe('getVehicleMaintenanceHistory', () => {
    it('正例: 查询车辆维保历史', async () => {
      await svc.createMaintenanceRecord({
        tenantId: TENANT, vehiclePlate: '沪A99999', odometerKm: 10000,
        maintType: 'oil_change' as const, description: '换机油',
        status: 'completed' as const, operatorId: 'u-sup', operatorName: '维修工',
      })
      await svc.createMaintenanceRecord({
        tenantId: TENANT, vehiclePlate: '沪A99999', odometerKm: 20000,
        maintType: 'routine_check' as const, description: '定期检查',
        status: 'completed' as const, operatorId: 'u-sup', operatorName: '维修工',
      })
      const history = await svc.getVehicleMaintenanceHistory('沪A99999')
      expect(history.length).toBe(2)
    })

    it('边界: 无记录返回空数组', async () => {
      const history = await svc.getVehicleMaintenanceHistory('沪A00000')
      expect(history).toEqual([])
    })
  })

  // ════════════════════════════════════════════════════
  // getAccidentRecords (vehicle filter)
  // ════════════════════════════════════════════════════

  describe('getAccidentRecords', () => {
    it('正例: 按车牌筛选事故记录', async () => {
      await svc.recordAccident({
        tenantId: TENANT, vehiclePlate: '沪AACC01', driverId: 'D-A1', driverName: '甲',
        accidentAt: new Date().toISOString(), location: 'G50高速',
        severity: 'minor' as const, responsibility: 'self' as const,
        description: '轻微刮擦', propertyDamageCent: 50000,
      })
      await svc.recordAccident({
        tenantId: TENANT, vehiclePlate: '沪AACC01', driverId: 'D-A1', driverName: '甲',
        accidentAt: new Date().toISOString(), location: '市区',
        severity: 'moderate' as const, responsibility: 'counterparty' as const,
        description: '追尾', propertyDamageCent: 200000,
      })
      const records = await svc.getAccidentRecords('沪AACC01')
      expect(records.length).toBe(2)
    })

    it('边界: 无匹配返回空数组', async () => {
      const records = await svc.getAccidentRecords('沪ANONE')
      expect(records).toEqual([])
    })
  })

  // ════════════════════════════════════════════════════
  // resolveAccident (already resolved)
  // ════════════════════════════════════════════════════

  describe('resolveAccident', () => {
    it('正例: 解决事故记录', async () => {
      const r = await svc.recordAccident({
        tenantId: TENANT, vehiclePlate: '沪ARES01', driverId: 'D-R1', driverName: '乙',
        accidentAt: new Date().toISOString(), location: 'G15',
        severity: 'minor' as const, responsibility: 'self' as const,
        description: '小事故', propertyDamageCent: 10000,
      })
      const resolved = await svc.resolveAccident(r.id, '保险理赔完成')
      expect(resolved.resolved).toBe(true)
      expect(resolved.resolution).toBe('保险理赔完成')
    })

    it('反例: 重复解决已解决的事故抛 BadRequestException', async () => {
      const r = await svc.recordAccident({
        tenantId: TENANT, vehiclePlate: '沪ARES02', driverId: 'D-R2', driverName: '丙',
        accidentAt: new Date().toISOString(), location: 'G2',
        severity: 'minor' as const, responsibility: 'self' as const,
        description: '刮擦', propertyDamageCent: 5000,
      })
      await svc.resolveAccident(r.id, '已处理')
      await expect(svc.resolveAccident(r.id, '重复'))
        .rejects.toThrow('already resolved')
    })
  })

  // ════════════════════════════════════════════════════
  // getCost (single)
  // ════════════════════════════════════════════════════

  describe('getCost', () => {
    it('正例: 通过 ID 查询成本记录', async () => {
      const c = await svc.recordCost({
        tenantId: TENANT, periodStart: '2026-08-01', periodEnd: '2026-08-31',
        items: [{ costType: 'fuel' as const, amountCent: 45000, description: '油费' }],
        totalCent: 45000, createdBy: 'u-sup',
      })
      const found = await svc.getCost(c.id)
      expect(found.totalCent).toBe(45000)
    })

    it('反例: 不存在的成本记录抛 NotFoundException', async () => {
      await expect(svc.getCost('nonexist')).rejects.toThrow('not found')
    })
  })

  // ════════════════════════════════════════════════════
  // deleteCost
  // ════════════════════════════════════════════════════

  describe('deleteCost', () => {
    it('正例: 删除成本记录', async () => {
      const c = await svc.recordCost({
        tenantId: TENANT, periodStart: '2026-09-01', periodEnd: '2026-09-30',
        items: [{ costType: 'parking' as const, amountCent: 3000, description: '停车费' }],
        totalCent: 3000, createdBy: 'u-sup',
      })
      await expect(svc.deleteCost(c.id)).resolves.toBeUndefined()
    })

    it('反例: 删除不存在的成本抛 NotFoundException', async () => {
      await expect(svc.deleteCost('nonexist')).rejects.toThrow('not found')
    })
  })

  // ════════════════════════════════════════════════════
  // getFuelRecord (single)
  // ════════════════════════════════════════════════════

  describe('getFuelRecord', () => {
    it('正例: 通过 ID 查询油耗记录', async () => {
      const r = await svc.recordFuel({
        tenantId: TENANT, vehiclePlate: '沪AF001', driverId: 'D-F1', driverName: '丁',
        fuelDate: '2026-08-10', liters: 60, costCent: 48000, unitPriceCent: 800,
        odometerKm: 15000, createdBy: 'u-sup',
      })
      const found = await svc.getFuelRecord(r.id)
      expect(found.liters).toBe(60)
    })

    it('反例: 不存在的记录抛 NotFoundException', async () => {
      await expect(svc.getFuelRecord('nonexist')).rejects.toThrow('not found')
    })
  })

  // ════════════════════════════════════════════════════
  // deleteFuelRecord
  // ════════════════════════════════════════════════════

  describe('deleteFuelRecord', () => {
    it('正例: 删除油耗记录', async () => {
      const r = await svc.recordFuel({
        tenantId: TENANT, vehiclePlate: '沪AFDEL', driverId: 'D-FDEL', driverName: '戊',
        fuelDate: '2026-08-11', liters: 40, costCent: 32000, unitPriceCent: 800,
        odometerKm: 16000, createdBy: 'u-sup',
      })
      await expect(svc.deleteFuelRecord(r.id)).resolves.toBeUndefined()
    })

    it('反例: 删除不存在的油耗记录抛 NotFoundException', async () => {
      await expect(svc.deleteFuelRecord('nonexist')).rejects.toThrow('not found')
    })
  })

  // ════════════════════════════════════════════════════
  // getMetrics
  // ════════════════════════════════════════════════════

  describe('getMetrics', () => {
    it('正例: 空数据返回零指标', async () => {
      const metrics = await svc.getMetrics()
      expect(metrics.totalTransportOrders).toBe(0)
      expect(metrics.onTimeDeliveryRate).toBe(0)
      expect(metrics.totalDrivers).toBe(0)
    })

    it('正例: 有数据后指标正确', async () => {
      // 创建 2 个运输单（1个完成）
      const o1 = await svc.createTransportOrder(makeBaseOrder())
      const o2 = await svc.createTransportOrder({ ...makeBaseOrder(), orderNumber: 'TO-SUP-M2' })

      // 完成一个
      await svc.updateTransportOrderStatus(o1.id, 'completed')
      const now = new Date()
      await svc.updateTransportOrder(o1.id, {
        actualPickupAt: now.toISOString(),
        actualArrivalAt: now.toISOString(), // on-time
      })

      const o2Data = await svc.getTransportOrder(o2.id)
      await svc.updateTransportOrderStatus(o2.id, 'in_transit')

      // 添加事故
      await svc.recordAccident({
        tenantId: TENANT, vehiclePlate: '沪A88888', driverId: 'D-001', driverName: '张',
        accidentAt: now.toISOString(), location: '高速',
        severity: 'minor' as const, responsibility: 'self' as const,
        description: '小事故', propertyDamageCent: 10000,
      })

      const metrics = await svc.getMetrics()
      expect(metrics.totalTransportOrders).toBe(2)
      expect(metrics.completedOrders).toBe(1)
      expect(metrics.inTransitOrders).toBe(1)
      // 实际准时率要看 actualArrivalAt <= estimatedArrivalAt
      // o1 的 actual 和 estimated 都是 now，所以应该是 on-time
      expect(metrics.totalAccidents).toBe(1)
    })
  })
})
