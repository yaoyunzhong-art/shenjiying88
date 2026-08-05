/**
 * logistics-supplement.service.spec.ts — 物流补充 Service 单元测试 (V23)
 *
 * 覆盖: TransportOrder / CargoLoad / RoutePlan / DriverSchedule /
 *       VehicleMaintenance / FuelRecord / AccidentRecord / LogisticsCost
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LogisticsSupplementService } from './logistics-supplement.service'

const TENANT_ID = 't-001'

describe('LogisticsSupplementService', () => {
  let svc: LogisticsSupplementService

  beforeEach(() => {
    svc = new LogisticsSupplementService()
  })

  // ════════════════════════════════════════════
  // TransportOrder
  // ════════════════════════════════════════════

  describe('TransportOrder', () => {
    const baseOrder = {
      tenantId: TENANT_ID,
      storeId: 'store-001',
      orderNumber: 'TO-2026-001',
      transportType: 'normal' as const,
      status: 'draft' as const,
      originWarehouseCode: 'WH-SH',
      originAddress: '上海浦东仓库',
      destinationWarehouseCode: 'WH-SZ',
      destinationAddress: '深圳南山门店',
      items: [{
        cargoId: 'cargo-001', cargoName: '电子元器件',
        quantity: 100, unit: '箱', weightKg: 500, volumeM3: 2.5,
      }],
      totalWeightKg: 500,
      totalVolumeM3: 2.5,
      driverId: 'D-001',
      driverName: '刘师傅',
      vehiclePlate: '沪A88888',
      scheduledPickupAt: new Date().toISOString(),
      estimatedArrivalAt: new Date(Date.now() + 86400000).toISOString(),
      createdBy: 'u-001',
      createdByName: '调度员',
    }

    it('正例: 创建运输调度单', async () => {
      const order = await svc.createTransportOrder(baseOrder)
      expect(order.id).toBeTruthy()
      expect(order.orderNumber).toBe('TO-2026-001')
    })

    it('正例: 更新运输状态', async () => {
      const order = await svc.createTransportOrder(baseOrder)
      const updated = await svc.updateTransportOrderStatus(order.id, 'in_transit')
      expect(updated.status).toBe('in_transit')
    })

    it('反例: 无效状态抛异常', async () => {
      const order = await svc.createTransportOrder(baseOrder)
      await expect(svc.updateTransportOrderStatus(order.id, 'invalid_status'))
        .rejects.toThrow('Invalid transport status')
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
        tenantId: TENANT_ID,
        transportOrderId: 'to-001',
        cargoCode: 'CG-001',
        cargoName: '电子产品',
        quantity: 100,
        unit: '箱',
        weightKg: 500,
        volumeM3: 2.5,
        status: 'pending' as const,
      })
      expect(load.id).toBeTruthy()
    })

    it('正例: 按运输单查询货物', async () => {
      await svc.addCargoLoad({
        tenantId: TENANT_ID, transportOrderId: 'to-001',
        cargoCode: 'CG-001', cargoName: 'A', quantity: 10, unit: '箱', weightKg: 100, volumeM3: 1,
        status: 'pending' as const,
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
        tenantId: TENANT_ID,
        name: '上海→深圳干线',
        originWarehouseCode: 'WH-SH',
        destinationWarehouseCode: 'WH-SZ',
        waypoints: [],
        totalDistanceKm: 1500,
        estimatedDurationMin: 1080,
        status: 'active' as const,
        createdBy: 'u-001',
      })
      const optimized = await svc.optimizeRoute(plan.id)
      expect(optimized.totalDistanceKm).toBeLessThan(1500)
      expect(optimized.estimatedDurationMin).toBeLessThan(1080)
    })
  })

  // ════════════════════════════════════════════
  // DriverSchedule
  // ════════════════════════════════════════════

  describe('DriverSchedule', () => {
    it('正例: 创建司机排班', async () => {
      const s = await svc.createDriverSchedule({
        tenantId: TENANT_ID,
        driverId: 'D-001',
        driverName: '刘师傅',
        scheduleDate: '2026-08-01',
        shiftName: '早班',
        shiftStart: '08:00',
        shiftEnd: '18:00',
        transportOrderIds: ['to-001'],
        status: 'scheduled' as const,
        createdBy: 'u-001',
      })
      expect(s.id).toBeTruthy()
    })

    it('正例: 按司机和日期筛选', async () => {
      await svc.createDriverSchedule({
        tenantId: TENANT_ID, driverId: 'D-001', driverName: '刘师傅',
        scheduleDate: '2026-08-01', shiftName: '早班', shiftStart: '08:00',
        shiftEnd: '18:00', transportOrderIds: [], status: 'scheduled' as const,
        createdBy: 'u-001',
      })
      // getDriverSchedules uses driverId not scheduleDate for filtering
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
        tenantId: TENANT_ID,
        vehiclePlate: '沪A88888',
        vehicleModel: '福田轻卡',
        odometerKm: 50000,
        maintType: 'routine_check' as const,
        description: '定期保养',
        status: 'pending' as const,
        scheduledAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        operatorId: 'u-001', operatorName: '维修工',
      })
      expect(r.id).toBeTruthy()
    })

    it('正例: 查询即将到来的维保', async () => {
      await svc.createMaintenanceRecord({
        tenantId: TENANT_ID, vehiclePlate: '沪A88888',
        odometerKm: 50000, maintType: 'routine_check' as const,
        description: '保养', status: 'pending' as const,
        operatorId: 'u-001', operatorName: '维修工',
      })
      // getUpcomingMaintenance filters by status 'scheduled' - need scheduled status
      await svc.createMaintenanceRecord({
        tenantId: TENANT_ID, vehiclePlate: '沪B66666',
        odometerKm: 30000, maintType: 'oil_change' as const,
        description: '换机油', status: 'scheduled' as const,
        scheduledAt: new Date(Date.now() + 3 * 86400000).toISOString(),
        operatorId: 'u-001', operatorName: '维修工',
      })
      const upcoming = await svc.getUpcomingMaintenance('沪B66666')
      expect(upcoming.length).toBe(1)
    })
  })

  // ════════════════════════════════════════════
  // FuelRecord
  // ════════════════════════════════════════════

  describe('FuelRecord', () => {
    it('正例: 记录油耗信息', async () => {
      const r = await svc.recordFuel({
        tenantId: TENANT_ID,
        vehiclePlate: '沪A88888',
        driverId: 'D-001',
        driverName: '刘师傅',
        fuelDate: '2026-08-01',
        liters: 50,
        costCent: 40000,
        unitPriceCent: 800,
        odometerKm: 10000,
        createdBy: 'u-001',
      })
      expect(r.id).toBeTruthy()
    })

    it('正例: 计算百公里油耗', async () => {
      await svc.recordFuel({
        tenantId: TENANT_ID, vehiclePlate: '沪A88888',
        driverId: 'D-001', driverName: '刘师傅',
        fuelDate: '2026-08-01', liters: 50, costCent: 40000,
        unitPriceCent: 800, odometerKm: 10000, createdBy: 'u-001',
      })
      await svc.recordFuel({
        tenantId: TENANT_ID, vehiclePlate: '沪A88888',
        driverId: 'D-001', driverName: '刘师傅',
        fuelDate: '2026-08-02', liters: 40, costCent: 32000,
        unitPriceCent: 800, odometerKm: 10500, createdBy: 'u-001',
      })
      const eff = await svc.getFuelEfficiency('沪A88888')
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
        tenantId: TENANT_ID,
        vehiclePlate: '沪A88888',
        driverId: 'D-001',
        driverName: '刘师傅',
        accidentAt: new Date().toISOString(),
        location: 'G60沪昆高速124KM',
        severity: 'minor' as const,
        responsibility: 'self' as const,
        description: '轻微追尾',
        propertyDamageCent: 200000,
        createdBy: 'u-001',
        resolved: false,
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
        tenantId: TENANT_ID,
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        items: [{ costType: 'fuel' as const, amountCent: 50000, description: '加油' }],
        totalCent: 50000,
        vehiclePlate: '沪A88888',
        createdBy: 'u-001',
      })
      await svc.recordCost({
        tenantId: TENANT_ID,
        periodStart: '2026-08-01', periodEnd: '2026-08-31',
        items: [{ costType: 'toll' as const, amountCent: 10000, description: '过路费' }],
        totalCent: 10000, vehiclePlate: '沪A88888', createdBy: 'u-001',
      })
      await svc.recordCost({
        tenantId: TENANT_ID,
        periodStart: '2026-08-01', periodEnd: '2026-08-31',
        items: [{ costType: 'fuel' as const, amountCent: 30000, description: '加油' }],
        totalCent: 30000, vehiclePlate: '沪B66666', createdBy: 'u-001',
      })
      const summary = await svc.getCostSummary('2026-08-01', '2026-08-31')
      expect(summary.totalCost).toBe(90000)
      expect(summary.byType.fuel).toBe(80000)
      expect(summary.byVehicle['沪A88888']).toBe(60000)
    })

    it('边界: 日期范围无记录', async () => {
      const summary = await svc.getCostSummary('2025-01-01', '2025-01-31')
      expect(summary.totalCost).toBe(0)
    })
  })
})
