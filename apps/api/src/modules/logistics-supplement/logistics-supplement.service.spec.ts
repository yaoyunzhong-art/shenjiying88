/**
 * logistics-supplement.service.spec.ts — 物流补充 Service 单元测试 (V23)
 *
 * 覆盖: TransportOrder / CargoLoad / RoutePlan / DriverSchedule /
 *       VehicleMaintenance / FuelRecord / AccidentRecord / LogisticsCost
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LogisticsSupplementService } from './logistics-supplement.service'

describe('LogisticsSupplementService', () => {
  let svc: LogisticsSupplementService

  beforeEach(() => {
    svc = new LogisticsSupplementService()
  })

  // ════════════════════════════════════════════
  // TransportOrder
  // ════════════════════════════════════════════

  describe('TransportOrder', () => {
    it('正例: 创建运输调度单', async () => {
      const order = await svc.createTransportOrder({
        tenantId: 't-001', status: 'draft' as any,
        origin: '上海仓库', destination: '深圳门店',
        vehicleId: 'V-001', driverId: 'D-001', driverName: '刘师傅',
        plannedDeparture: new Date().toISOString(),
        estimatedArrival: new Date(Date.now() + 86400000).toISOString(),
      })
      expect(order.id).toBeTruthy()
      expect(order.createdAt).toBeInstanceOf(Date)
    })

    it('正例: 更新运输状态', async () => {
      const order = await svc.createTransportOrder({
        tenantId: 't-001', status: 'draft' as any,
        origin: 'A', destination: 'B',
        vehicleId: 'V-001', driverId: 'D-001', driverName: '司机',
        plannedDeparture: new Date().toISOString(),
        estimatedArrival: new Date(Date.now() + 86400000).toISOString(),
      })
      const updated = await svc.updateTransportOrderStatus(order.id, 'in_transit')
      expect(updated.status).toBe('in_transit')
    })

    it('反例: 无效状态抛异常', async () => {
      const order = await svc.createTransportOrder({
        tenantId: 't-001', status: 'draft' as any,
        origin: 'A', destination: 'B',
        vehicleId: 'V-001', driverId: 'D-001', driverName: '司机',
        plannedDeparture: new Date().toISOString(),
        estimatedArrival: new Date(Date.now() + 86400000).toISOString(),
      })
      await expect(svc.updateTransportOrderStatus(order.id, 'invalid_status'))
        .rejects.toThrow('Invalid status')
    })

    it('反例: 不存在的订单', async () => {
      await expect(svc.getTransportOrder('nonexist')).rejects.toThrow('not found')
    })
  })

  // ════════════════════════════════════════════
  // CargoLoad
  // ════════════════════════════════════════════

  describe('CargoLoad', () => {
    it('正例: 添加货物装载', async () => {
      const load = await svc.addCargoLoad({
        transportOrderId: 'to-001',
        cargoType: '电子产品',
        quantity: 100,
        weightKg: 500,
        volumeM3: 2.5,
      })
      expect(load.id).toBeTruthy()
    })

    it('正例: 按运输单查询货物', async () => {
      await svc.addCargoLoad({
        transportOrderId: 'to-001', cargoType: 'A', quantity: 10, weightKg: 100, volumeM3: 1,
      })
      const loads = await svc.getCargoLoads('to-001')
      expect(loads.length).toBe(1)
    })
  })

  // ════════════════════════════════════════════
  // RoutePlan
  // ════════════════════════════════════════════

  describe('RoutePlan', () => {
    it('正例: 创建路线规划并优化', async () => {
      const plan = await svc.createRoutePlan({
        transportOrderId: 'to-001',
        startPoint: '上海', endPoint: '深圳',
        estimatedDistanceKm: 1500, estimatedDurationMin: 1080,
      })
      expect(plan.optimized).toBeFalsy()

      const optimized = await svc.optimizeRoute(plan.id)
      expect(optimized.optimized).toBe(true)
      expect(optimized.estimatedDistanceKm).toBeLessThan(1500)
    })
  })

  // ════════════════════════════════════════════
  // DriverSchedule
  // ════════════════════════════════════════════

  describe('DriverSchedule', () => {
    it('正例: 创建司机排班', async () => {
      const s = await svc.createDriverSchedule({
        driverId: 'D-001', driverName: '刘师傅',
        date: '2026-08-01', shift: '早班',
        vehicleId: 'V-001', transportOrderId: 'to-001',
      })
      expect(s.id).toBeTruthy()
    })

    it('正例: 按司机和日期筛选', async () => {
      await svc.createDriverSchedule({
        driverId: 'D-001', driverName: '刘师傅',
        date: '2026-08-01', shift: '早班', vehicleId: 'V-001',
      })
      const list = await svc.getDriverSchedules('D-001', '2026-08-01')
      expect(list.length).toBe(1)
    })
  })

  // ════════════════════════════════════════════
  // VehicleMaintenance
  // ════════════════════════════════════════════

  describe('VehicleMaintenance', () => {
    it('正例: 创建维保记录', async () => {
      const r = await svc.createMaintenanceRecord({
        vehicleId: 'V-001', type: 'routine', description: '定期保养',
        status: 'scheduled', scheduledDate: '2026-08-15',
      })
      expect(r.id).toBeTruthy()
    })

    it('正例: 查询即将到来的维保', async () => {
      await svc.createMaintenanceRecord({
        vehicleId: 'V-001', type: 'routine', description: '保养',
        status: 'scheduled', scheduledDate: '2026-09-01',
      })
      const upcoming = await svc.getUpcomingMaintenance('V-001')
      expect(upcoming.length).toBe(1)
    })
  })

  // ════════════════════════════════════════════
  // FuelRecord
  // ════════════════════════════════════════════

  describe('FuelRecord', () => {
    it('正例: 记录油耗信息', async () => {
      const r = await svc.recordFuel({
        vehicleId: 'V-001', date: '2026-08-01',
        liters: 50, cost: 400, odometerReading: 10000,
      })
      expect(r.id).toBeTruthy()
    })

    it('正例: 计算百公里油耗', async () => {
      await svc.recordFuel({
        vehicleId: 'V-001', date: '2026-08-01', liters: 50, cost: 400, odometerReading: 10000,
      })
      await svc.recordFuel({
        vehicleId: 'V-001', date: '2026-08-02', liters: 40, cost: 320, odometerReading: 10500,
      })
      const eff = await svc.getFuelEfficiency('V-001')
      expect(eff.totalFuelLiters).toBe(90)
      expect(eff.avgConsumptionPer100km).toBeGreaterThan(0)
    })
  })

  // ════════════════════════════════════════════
  // AccidentRecord
  // ════════════════════════════════════════════

  describe('AccidentRecord', () => {
    it('正例: 记录事故信息', async () => {
      const r = await svc.recordAccident({
        vehicleId: 'V-001', date: '2026-08-01',
        type: 'minor_collision', description: '轻微追尾',
        driverId: 'D-001', driverName: '刘师傅',
        cost: 2000, isResponsible: true,
      })
      expect(r.id).toBeTruthy()
    })
  })

  // ════════════════════════════════════════════
  // LogisticsCost
  // ════════════════════════════════════════════

  describe('LogisticsCost', () => {
    it('正例: 记录和汇总成本', async () => {
      await svc.recordCost({
        vehicleId: 'V-001', costType: 'fuel', amount: 500,
        date: '2026-08-01', description: '加油',
      })
      await svc.recordCost({
        vehicleId: 'V-001', costType: 'toll', amount: 100,
        date: '2026-08-01', description: '过路费',
      })
      await svc.recordCost({
        vehicleId: 'V-002', costType: 'fuel', amount: 300,
        date: '2026-08-01', description: '加油',
      })
      const summary = await svc.getCostSummary('2026-08-01', '2026-08-31')
      expect(summary.totalCost).toBe(900)
      expect(summary.byType.fuel).toBe(800)
      expect(summary.byVehicle['V-001']).toBe(600)
    })

    it('边界: 日期范围无记录', async () => {
      const summary = await svc.getCostSummary('2025-01-01', '2025-01-31')
      expect(summary.totalCost).toBe(0)
    })
  })
})
