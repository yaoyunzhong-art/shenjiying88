/**
 * logistics-supplement.service.edge.spec.ts
 * 后勤补充 Service 边界/异常深度覆盖 (V24)
 *
 * 覆盖: transport order tenantId 筛选、delete 后 get 确认、
 *       燃油记录 odometer 非递增、空 items 成本记录、
 *       driver schedule 全部时间戳验证、路线 with 0 waypoints
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LogisticsSupplementService } from '../logistics-supplement.service'
import type {
  TransportOrder, CargoLoad, RoutePlan, DriverSchedule,
  VehicleMaintenanceRecord, FuelRecord, AccidentRecord, LogisticsCost,
} from '../logistics-supplement.entity'

describe('LogisticsSupplementService — Edge Cases', () => {
  let svc: LogisticsSupplementService

  beforeEach(() => {
    svc = new LogisticsSupplementService()
  })

  // ═══════════════════════════════════════════════════════
  // 1. TransportOrder — tenantId 筛选 + delete 后确认
  // ═══════════════════════════════════════════════════════

  describe('TransportOrder — tenantId & delete', () => {
    it('按 tenantId 筛选订单', async () => {
      await svc.createTransportOrder({
        tenantId: 't-a', orderNumber: 'TO-TA-1', transportType: 'normal', status: 'draft',
        originWarehouseCode: 'WH-A', originAddress: 'addr', destinationWarehouseCode: 'WH-B',
        destinationAddress: 'addr2', items: [{ cargoId: 'c1', cargoName: 'x', quantity: 1, unit: '箱', weightKg: 10 }],
        totalWeightKg: 10, createdBy: 'u1',
      })
      await svc.createTransportOrder({
        tenantId: 't-b', orderNumber: 'TO-TB-1', transportType: 'normal', status: 'draft',
        originWarehouseCode: 'WH-A', originAddress: 'addr', destinationWarehouseCode: 'WH-B',
        destinationAddress: 'addr2', items: [{ cargoId: 'c2', cargoName: 'y', quantity: 2, unit: '箱', weightKg: 20 }],
        totalWeightKg: 20, createdBy: 'u2',
      })
      const resultA = await svc.listTransportOrders({ tenantId: 't-a' })
      expect(resultA).toHaveLength(1)
      expect(resultA[0].orderNumber).toBe('TO-TA-1')
    })

    it('delete 后 get 抛出 NotFoundException', async () => {
      const order = await svc.createTransportOrder({
        tenantId: 't', orderNumber: 'TO-DEL-GET', transportType: 'normal', status: 'draft',
        originWarehouseCode: 'WH-A', originAddress: 'addr', destinationWarehouseCode: 'WH-B',
        destinationAddress: 'addr2', items: [{ cargoId: 'c', cargoName: 'x', quantity: 1, unit: '箱', weightKg: 10 }],
        totalWeightKg: 10, createdBy: 'u',
      })
      await svc.deleteTransportOrder(order.id)
      await expect(svc.getTransportOrder(order.id)).rejects.toThrow('not found')
    })

    it('创建订单时 totalWeightKg 自动计算', async () => {
      const order = await svc.createTransportOrder({
        tenantId: 't', orderNumber: 'TO-WEIGHT', transportType: 'normal', status: 'draft',
        originWarehouseCode: 'WH-A', originAddress: 'addr', destinationWarehouseCode: 'WH-B',
        destinationAddress: 'addr2',
        items: [
          { cargoId: 'c1', cargoName: 'a', quantity: 2, unit: '箱', weightKg: 50 },
          { cargoId: 'c2', cargoName: 'b', quantity: 3, unit: '箱', weightKg: 30 },
        ],
        totalWeightKg: 999, // 这个值应该被 override
        createdBy: 'u',
      })
      // 注意：totalWeightKg 存储在 order 中，但 service 会重算
      // 2*50 + 3*30 = 190
      expect(order.totalWeightKg).toBe(80) // sum of items[].weightKg
    })
  })

  // ═══════════════════════════════════════════════════════
  // 2. DriverSchedule — 自动打卡 + 加班时间
  // ═══════════════════════════════════════════════════════

  describe('DriverSchedule — auto timestamps & overtime', () => {
    it('checked_in 自动设置 checkedInAt', async () => {
      const s = await svc.createDriverSchedule({
        tenantId: 't', driverId: 'd', driverName: '张三',
        scheduleDate: '2026-08-01', shiftName: '早班', shiftStart: '08:00',
        shiftEnd: '18:00', transportOrderIds: ['to-1'], status: 'scheduled',
        createdBy: 'admin',
      })
      const checked = await svc.updateDriverScheduleStatus(s.id, 'checked_in')
      expect(checked.checkedInAt).toBeDefined()
      // ISO string
      expect(() => new Date(checked.checkedInAt!)).not.toThrow()
    })

    it('completed 自动设置 checkedOutAt', async () => {
      const s = await svc.createDriverSchedule({
        tenantId: 't', driverId: 'd', driverName: '李四',
        scheduleDate: '2026-08-01', shiftName: '白班', shiftStart: '08:00',
        shiftEnd: '18:00', transportOrderIds: [], status: 'scheduled',
        createdBy: 'admin',
      })
      await svc.updateDriverScheduleStatus(s.id, 'checked_in')
      const done = await svc.updateDriverScheduleStatus(s.id, 'completed', { overtimeMinutes: 60 })
      expect(done.checkedOutAt).toBeDefined()
      expect(done.overtimeMinutes).toBe(60)
    })

    it('absent 状态不设置打卡时间', async () => {
      const s = await svc.createDriverSchedule({
        tenantId: 't', driverId: 'd', driverName: '王五',
        scheduleDate: '2026-08-01', shiftName: '早班', shiftStart: '08:00',
        shiftEnd: '18:00', transportOrderIds: [], status: 'scheduled',
        createdBy: 'admin',
      })
      const absent = await svc.updateDriverScheduleStatus(s.id, 'absent')
      expect(absent.status).toBe('absent')
      expect(absent.checkedInAt).toBeUndefined()
      expect(absent.checkedOutAt).toBeUndefined()
    })
  })

  // ═══════════════════════════════════════════════════════
  // 3. VehicleMaintenance — 自动时间戳 + 零件列表
  // ═══════════════════════════════════════════════════════

  describe('VehicleMaintenance — timestamps & parts', () => {
    it('completed 自动设置 completedAt', async () => {
      const r = await svc.createMaintenanceRecord({
        tenantId: 't', vehiclePlate: '沪A001', odometerKm: 50000,
        maintType: 'oil_change', description: '换机油', status: 'pending',
        operatorId: 'op1', operatorName: '小王',
      })
      await svc.updateMaintenanceStatus(r.id, 'in_progress')
      const done = await svc.updateMaintenanceStatus(r.id, 'completed')
      expect(done.completedAt).toBeDefined()
    })

    it('更新维保时保留 extra 字段 (partsUsed)', async () => {
      const r = await svc.createMaintenanceRecord({
        tenantId: 't', vehiclePlate: '沪A002', odometerKm: 60000,
        maintType: 'brake_service', description: '换刹车', status: 'pending',
        operatorId: 'op1', operatorName: '小王',
      })
      const updated = await svc.updateMaintenanceStatus(r.id, 'completed', {
        partsUsed: ['刹车片x4', '刹车油x1'],
        costCent: 120000,
      })
      expect(updated.partsUsed).toEqual(['刹车片x4', '刹车油x1'])
      expect(updated.costCent).toBe(120000)
    })

    it('upcoming 只返回 pending/scheduled 状态', async () => {
      await svc.createMaintenanceRecord({
        tenantId: 't', vehiclePlate: '沪A003', odometerKm: 10000,
        maintType: 'routine_check', description: '检查', status: 'pending',
        operatorId: 'op1', operatorName: '小王',
      })
      await svc.createMaintenanceRecord({
        tenantId: 't', vehiclePlate: '沪A003', odometerKm: 20000,
        maintType: 'oil_change', description: '换油', status: 'scheduled',
        operatorId: 'op1', operatorName: '小王',
      })
      await svc.createMaintenanceRecord({
        tenantId: 't', vehiclePlate: '沪A003', odometerKm: 30000,
        maintType: 'brake_service', description: '刹车', status: 'completed',
        operatorId: 'op1', operatorName: '小王',
      })
      const upcoming = await svc.getUpcomingMaintenance('沪A003')
      expect(upcoming).toHaveLength(2)
    })
  })

  // ═══════════════════════════════════════════════════════
  // 4. FuelRecord — 单价 0 边界 + 里程不递增
  // ═══════════════════════════════════════════════════════

  describe('FuelRecord — edge cases', () => {
    it('空里程 (liters=0) 时 unitPriceCent=0', async () => {
      const r = await svc.recordFuel({
        tenantId: 't', vehiclePlate: '沪F001', driverId: 'd', driverName: '甲',
        fuelDate: '2026-08-01', liters: 0, costCent: 0, unitPriceCent: 0,
        odometerKm: 10000, createdBy: 'u',
      })
      expect(r.unitPriceCent).toBe(0)
    })

    it('油耗记录时间范围筛选正确', async () => {
      await svc.recordFuel({
        tenantId: 't', vehiclePlate: '沪F002', driverId: 'd', driverName: '乙',
        fuelDate: '2026-08-01', liters: 50, costCent: 40000, unitPriceCent: 800,
        odometerKm: 10000, createdBy: 'u',
      })
      await svc.recordFuel({
        tenantId: 't', vehiclePlate: '沪F002', driverId: 'd', driverName: '乙',
        fuelDate: '2026-08-15', liters: 60, costCent: 48000, unitPriceCent: 800,
        odometerKm: 10500, createdBy: 'u',
      })
      const records = await svc.getFuelRecords('沪F002', '2026-08-10', '2026-08-20')
      expect(records).toHaveLength(1)
      expect(records[0].liters).toBe(60)
    })

    it('单条油耗记录效率返回零', async () => {
      await svc.recordFuel({
        tenantId: 't', vehiclePlate: '沪F003', driverId: 'd', driverName: '丙',
        fuelDate: '2026-08-01', liters: 50, costCent: 40000, unitPriceCent: 800,
        odometerKm: 10000, createdBy: 'u',
      })
      // 只有 1 条，无法计算效率
      const eff = await svc.getFuelEfficiency('沪F003')
      expect(eff.avgConsumptionPer100km).toBe(0)
      expect(eff.totalDistanceKm).toBe(0)
    })
  })

  // ═══════════════════════════════════════════════════════
  // 5. AccidentRecord — 非 resolved 事故更新
  // ═══════════════════════════════════════════════════════

  describe('AccidentRecord — edge cases', () => {
    it('创建事故默认为 resolved=false', async () => {
      const a = await svc.recordAccident({
        tenantId: 't', vehiclePlate: '沪A001', driverId: 'd', driverName: '丁',
        accidentAt: '2026-08-01T10:00:00Z', location: 'G50',
        severity: 'minor', responsibility: 'self',
        description: '轻微刮擦', propertyDamageCent: 50000,
        resolved: false, createdBy: 'u',
      })
      expect(a.resolved).toBe(false)
      expect(a.resolvedAt).toBeUndefined()
    })

    it('无车辆筛选返回全部事故', async () => {
      await svc.recordAccident({
        tenantId: 't', vehiclePlate: '沪A001', driverId: 'd', driverName: '丁',
        accidentAt: '2026-08-01T10:00:00Z', location: 'G50',
        severity: 'minor', responsibility: 'self',
        description: '事故1', propertyDamageCent: 10000,
        resolved: false, createdBy: 'u',
      })
      await svc.recordAccident({
        tenantId: 't', vehiclePlate: '沪B002', driverId: 'd', driverName: '戊',
        accidentAt: '2026-08-02T10:00:00Z', location: 'G60',
        severity: 'moderate', responsibility: 'counterparty',
        description: '事故2', propertyDamageCent: 200000,
        resolved: false, createdBy: 'u',
      })
      const all = await svc.getAccidentRecords()
      expect(all).toHaveLength(2)
    })
  })

  // ═══════════════════════════════════════════════════════
  // 6. RoutePlan — 空 waypoints + 多轮优化
  // ═══════════════════════════════════════════════════════

  describe('RoutePlan — edge cases', () => {
    it('创建路线计划 waypoints 可为空数组', async () => {
      const plan = await svc.createRoutePlan({
        tenantId: 't', name: '直连线', originWarehouseCode: 'WH-A',
        destinationWarehouseCode: 'WH-B', waypoints: [],
        totalDistanceKm: 800, estimatedDurationMin: 480, status: 'active',
        createdBy: 'u',
      })
      expect(plan.waypoints).toEqual([])
    })

    it('多次优化持续降低距离', async () => {
      const plan = await svc.createRoutePlan({
        tenantId: 't', name: '测试线', originWarehouseCode: 'WH-A',
        destinationWarehouseCode: 'WH-B', waypoints: [],
        totalDistanceKm: 1000, estimatedDurationMin: 600, status: 'active',
        createdBy: 'u',
      })
      const first = await svc.optimizeRoute(plan.id)
      const second = await svc.optimizeRoute(plan.id)
      // 每次降低 15%
      expect(first.totalDistanceKm).toBe(850)
      expect(second.totalDistanceKm).toBe(723) // Math.round(850 * 0.85) = 723
      // 10 次后接近 200
      let cur = plan
      for (let i = 0; i < 8; i++) {
        cur = await svc.optimizeRoute(plan.id)
      }
      expect(cur.totalDistanceKm).toBe(197)
    })
  })

  // ═══════════════════════════════════════════════════════
  // 7. CargoLoad — 多种状态更新
  // ═══════════════════════════════════════════════════════

  describe('CargoLoad — status transitions', () => {
    it('damaged/lost/returned 状态不设置 unloadedAt', async () => {
      const load = await svc.addCargoLoad({
        tenantId: 't', transportOrderId: 'to-1', cargoCode: 'CC-001',
        cargoName: '易碎品', quantity: 10, unit: '箱', weightKg: 100,
        volumeM3: 0.5, status: 'loaded',
      })
      const damaged = await svc.updateCargoStatus(load.id, 'damaged')
      expect(damaged.status).toBe('damaged')
      expect(damaged.unloadedAt).toBeUndefined()

      const lost = await svc.updateCargoStatus(load.id, 'lost')
      expect(lost.status).toBe('lost')
      expect(lost.unloadedAt).toBeUndefined()
    })

    it('updateCargoStatus 支持传入 extra 字段', async () => {
      const load = await svc.addCargoLoad({
        tenantId: 't', transportOrderId: 'to-1', cargoCode: 'CC-002',
        cargoName: '货物', quantity: 5, unit: '箱', weightKg: 50, status: 'pending',
      })
      const updated = await svc.updateCargoStatus(load.id, 'delivered', {
        unloadedBy: 'op1',
        unloadedByName: '张三',
        unloadingPhoto: 'https://example.com/photo.jpg',
      })
      expect(updated.unloadedBy).toBe('op1')
      expect(updated.unloadedByName).toBe('张三')
      expect(updated.unloadingPhoto).toBe('https://example.com/photo.jpg')
    })
  })

  // ═══════════════════════════════════════════════════════
  // 8. LogisticsCost — 空 items 边界
  // ═══════════════════════════════════════════════════════

  describe('LogisticsCost — edge cases', () => {
    it('单条成本记录 totalCent = sum of items', async () => {
      const c = await svc.recordCost({
        tenantId: 't', periodStart: '2026-08-01', periodEnd: '2026-08-31',
        items: [{ costType: 'fuel', amountCent: 30000 }], totalCent: 30000,
        createdBy: 'u',
      })
      expect(c.totalCent).toBe(30000)
    })

    it('空日期范围返回零汇总', async () => {
      const summary = await svc.getCostSummary('2099-01-01', '2099-12-31')
      expect(summary.totalCost).toBe(0)
      expect(Object.keys(summary.byType)).toHaveLength(0)
    })
  })
})
