/**
 * logistics-supplement.controller.spec.ts
 * 后勤补充 Controller 单元测试
 *
 * 覆盖: 所有 endpoint 的路由映射、参数传递
 * 约定: 使用 mock 隔离 controller，不启动真实 HTTP 服务器
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the TrafficGovernanceGuard before importing controller
vi.mock('../../common/guards/traffic-governance.guard', () => ({
  TrafficGovernanceGuard: class {},
}))

import { LogisticsSupplementController } from '../logistics-supplement.controller'
import { LogisticsSupplementService } from '../logistics-supplement.service'
import type { TransportOrder, CargoLoad, RoutePlan, DriverSchedule,
  VehicleMaintenanceRecord, FuelRecord, AccidentRecord, LogisticsCost } from '../logistics-supplement.entity'

describe('LogisticsSupplementController', () => {
  let controller: LogisticsSupplementController
  let service: LogisticsSupplementService

  beforeEach(() => {
    service = new LogisticsSupplementService()
    controller = new LogisticsSupplementController(service)
  })

  // ── 运输调度单 ───────────────────────────────────────────────────────────

  describe('transport-orders', () => {
    it('createTransportOrder → service.createTransportOrder 被调用', async () => {
      const spy = vi.spyOn(service, 'createTransportOrder')
      const dto = {
        orderNumber: 'TO-001',
        transportType: 'normal' as const,
        originWarehouseCode: 'WH-A',
        originAddress: 'addr1',
        destinationWarehouseCode: 'WH-B',
        destinationAddress: 'addr2',
        items: [{ cargoId: 'c1', cargoName: '物料', quantity: 10, unit: '箱', weightKg: 100 }],
        createdBy: 'u1',
      }
      await controller.createTransportOrder(dto)
      expect(spy).toHaveBeenCalledWith(dto)
    })

    it('getTransportOrder → 返回正确订单', async () => {
      const order = await service.createTransportOrder({
        tenantId: 't1', orderNumber: 'TO-002', transportType: 'normal',
        status: 'draft', originWarehouseCode: 'WH-A', originAddress: 'a',
        destinationWarehouseCode: 'WH-B', destinationAddress: 'b',
        items: [{ cargoId: 'c1', cargoName: 'x', quantity: 1, unit: '箱', weightKg: 10 }],
        totalWeightKg: 10, createdBy: 'u1',
      })
      const result = await controller.getTransportOrder(order.id)
      expect(result.id).toBe(order.id)
    })

    it('listTransportOrders → 返回过滤列表', async () => {
      await service.createTransportOrder({
        tenantId: 't1', orderNumber: 'TO-L1', transportType: 'normal',
        status: 'draft', originWarehouseCode: 'WH-A', originAddress: 'a',
        destinationWarehouseCode: 'WH-B', destinationAddress: 'b',
        items: [{ cargoId: 'c1', cargoName: 'x', quantity: 1, unit: '箱', weightKg: 10 }],
        totalWeightKg: 10, createdBy: 'u1',
      })
      const result = await controller.listTransportOrders({ status: 'draft' } as any)
      expect(result.length).toBe(1)
    })

    it('updateTransportOrderStatus → 状态更新', async () => {
      const order = await service.createTransportOrder({
        tenantId: 't1', orderNumber: 'TO-STATUS', transportType: 'normal',
        status: 'draft', originWarehouseCode: 'WH-A', originAddress: 'a',
        destinationWarehouseCode: 'WH-B', destinationAddress: 'b',
        items: [{ cargoId: 'c1', cargoName: 'x', quantity: 1, unit: '箱', weightKg: 10 }],
        totalWeightKg: 10, createdBy: 'u1',
      })
      const result = await controller.updateTransportOrderStatus(order.id, { status: 'approved' })
      expect(result.status).toBe('approved')
    })

    it('updateTransportOrder → 字段更新', async () => {
      const order = await service.createTransportOrder({
        tenantId: 't1', orderNumber: 'TO-UPD', transportType: 'normal',
        status: 'draft', originWarehouseCode: 'WH-A', originAddress: 'a',
        destinationWarehouseCode: 'WH-B', destinationAddress: 'b',
        items: [{ cargoId: 'c1', cargoName: 'x', quantity: 1, unit: '箱', weightKg: 10 }],
        totalWeightKg: 10, createdBy: 'u1',
      })
      const result = await controller.updateTransportOrder(order.id, { notes: '测试更新' })
      expect(result.notes).toBe('测试更新')
    })

    it('deleteTransportOrder → 删除成功', async () => {
      const order = await service.createTransportOrder({
        tenantId: 't1', orderNumber: 'TO-DEL', transportType: 'normal',
        status: 'draft', originWarehouseCode: 'WH-A', originAddress: 'a',
        destinationWarehouseCode: 'WH-B', destinationAddress: 'b',
        items: [{ cargoId: 'c1', cargoName: 'x', quantity: 1, unit: '箱', weightKg: 10 }],
        totalWeightKg: 10, createdBy: 'u1',
      })
      await expect(controller.deleteTransportOrder(order.id)).resolves.toBeUndefined()
    })
  })

  // ── 货物装载 ─────────────────────────────────────────────────────────────

  describe('cargo-loads', () => {
    it('addCargoLoad → 创建货物记录', async () => {
      const result = await controller.addCargoLoad({
        transportOrderId: 'to-1', cargoCode: 'CC-001', cargoName: '主板',
        quantity: 50, unit: '箱', weightKg: 200,
      })
      expect(result.id).toMatch(/^cl-/)
    })

    it('getCargoLoad → 单笔查询', async () => {
      const load = await controller.addCargoLoad({
        transportOrderId: 'to-2', cargoCode: 'CC-002', cargoName: '显示器',
        quantity: 10, unit: '台', weightKg: 150,
      })
      const found = await controller.getCargoLoad(load.id)
      expect(found.cargoName).toBe('显示器')
    })

    it('getCargoLoads → 按运输单查询', async () => {
      await controller.addCargoLoad({
        transportOrderId: 'to-3', cargoCode: 'CC-003', cargoName: '物料A',
        quantity: 20, unit: '箱', weightKg: 100,
      })
      const loads = await controller.getCargoLoads('to-3')
      expect(loads.length).toBe(1)
    })

    it('updateCargoStatus → 状态更新', async () => {
      const load = await controller.addCargoLoad({
        transportOrderId: 'to-4', cargoCode: 'CC-004', cargoName: '物料B',
        quantity: 30, unit: '箱', weightKg: 150,
      })
      const updated = await controller.updateCargoStatus(load.id, { status: 'delivered' })
      expect(updated.status).toBe('delivered')
    })
  })

  // ── 路线规划 ─────────────────────────────────────────────────────────────

  describe('route-plans', () => {
    it('createRoutePlan → 创建路线', async () => {
      const result = await controller.createRoutePlan({
        name: '上海→北京', originWarehouseCode: 'WH-SH',
        destinationWarehouseCode: 'WH-BJ',
        waypoints: [{ sequence: 1, warehouseCode: 'WH-SH', address: '上海' }],
        totalDistanceKm: 1200, estimatedDurationMin: 600,
        createdBy: 'admin',
      })
      expect(result.name).toBe('上海→北京')
    })

    it('listRoutePlans → 列表', async () => {
      const plans = await controller.listRoutePlans()
      expect(Array.isArray(plans)).toBe(true)
    })

    it('getRoutePlan → 详情', async () => {
      const plan = await controller.createRoutePlan({
        name: '测试路线', originWarehouseCode: 'WH-A',
        destinationWarehouseCode: 'WH-B',
        waypoints: [{ sequence: 1, warehouseCode: 'WH-A', address: 'addr' }],
        totalDistanceKm: 100, estimatedDurationMin: 60, createdBy: 'admin',
      })
      const found = await controller.getRoutePlan(plan.id)
      expect(found.name).toBe('测试路线')
    })

    it('optimizeRoute → 优化距离', async () => {
      const plan = await controller.createRoutePlan({
        name: '优化路线', originWarehouseCode: 'WH-A',
        destinationWarehouseCode: 'WH-B',
        waypoints: [{ sequence: 1, warehouseCode: 'WH-A', address: 'addr' }],
        totalDistanceKm: 1000, estimatedDurationMin: 600, createdBy: 'admin',
      })
      const optimized = await controller.optimizeRoute(plan.id)
      expect(optimized.totalDistanceKm).toBe(850) // 1000 * 0.85
    })

    it('deleteRoutePlan → 删除', async () => {
      const plan = await controller.createRoutePlan({
        name: '待删除', originWarehouseCode: 'WH-A',
        destinationWarehouseCode: 'WH-B',
        waypoints: [], totalDistanceKm: 10, estimatedDurationMin: 10,
        createdBy: 'admin',
      })
      await expect(controller.deleteRoutePlan(plan.id)).resolves.toBeUndefined()
    })
  })

  // ── 司机排班 ─────────────────────────────────────────────────────────────

  describe('driver-schedules', () => {
    it('createSchedule → 创建排班', async () => {
      const result = await controller.createSchedule({
        driverId: 'D-001', driverName: '张三',
        scheduleDate: '2026-08-01', shiftName: '白班',
        shiftStart: '08:00', shiftEnd: '18:00',
        createdBy: 'admin',
      })
      expect(result.id).toMatch(/^ds-/)
    })

    it('getSchedules → 列表', async () => {
      const list = await controller.getSchedules('D-001', '2026-08-01')
      expect(Array.isArray(list)).toBe(true)
    })

    it('updateScheduleStatus → 签到', async () => {
      const s = await controller.createSchedule({
        driverId: 'D-002', driverName: '李四',
        scheduleDate: '2026-08-01', shiftName: '晚班',
        shiftStart: '18:00', shiftEnd: '02:00',
        createdBy: 'admin',
      })
      const updated = await controller.updateScheduleStatus(s.id, { status: 'checked_in' })
      expect(updated.status).toBe('checked_in')
      expect(updated.checkedInAt).toBeDefined()
    })

    it('deleteSchedule → 删除', async () => {
      const s = await controller.createSchedule({
        driverId: 'D-003', driverName: '王五',
        scheduleDate: '2026-08-01', shiftName: '白班',
        shiftStart: '08:00', shiftEnd: '18:00',
        createdBy: 'admin',
      })
      await expect(controller.deleteSchedule(s.id)).resolves.toBeUndefined()
    })
  })

  // ── 车辆维保 ─────────────────────────────────────────────────────────────

  describe('maintenance', () => {
    it('createMaintenance → 创建维保', async () => {
      const result = await controller.createMaintenance({
        vehiclePlate: '沪A88888', odometerKm: 50000,
        maintType: 'oil_change', description: '换机油',
        operatorId: 'op-001', operatorName: '维修工',
      })
      expect(result.id).toMatch(/^vm-/)
    })

    it('getMaintenance → 查询维保', async () => {
      const r = await controller.createMaintenance({
        vehiclePlate: '沪B66666', odometerKm: 30000,
        maintType: 'routine_check', description: '定期检查',
        operatorId: 'op-001', operatorName: '维修工',
      })
      const found = await controller.getMaintenance(r.id)
      expect(found.description).toBe('定期检查')
    })

    it('getMaintenanceHistory → 历史查询', async () => {
      await controller.createMaintenance({
        vehiclePlate: '沪C77777', odometerKm: 20000,
        maintType: 'brake_service', description: '换刹车片',
        operatorId: 'op-001', operatorName: '维修工',
      })
      const history = await controller.getMaintenanceHistory('沪C77777')
      expect(history.length).toBe(1)
    })

    it('updateMaintenanceStatus → 状态更新', async () => {
      const r = await controller.createMaintenance({
        vehiclePlate: '沪D88888', odometerKm: 60000,
        maintType: 'engine_repair', description: '发动机维修',
        operatorId: 'op-002', operatorName: '老刘',
      })
      const updated = await controller.updateMaintenanceStatus(r.id, { status: 'in_progress' })
      expect(updated.status).toBe('in_progress')
      expect(updated.startedAt).toBeDefined()
    })
  })

  // ── 油耗记录 ─────────────────────────────────────────────────────────────

  describe('fuel-records', () => {
    it('recordFuel → 记录油耗', async () => {
      const result = await controller.recordFuel({
        vehiclePlate: '沪A88888', driverId: 'D-001', driverName: '张三',
        fuelDate: '2026-08-01', liters: 100, costCent: 80000,
        odometerKm: 50000, createdBy: 'admin',
      })
      expect(result.unitPriceCent).toBe(800)
    })

    it('getFuelRecord → 查询单条', async () => {
      const r = await controller.recordFuel({
        vehiclePlate: '沪E99999', driverId: 'D-005', driverName: '赵六',
        fuelDate: '2026-08-01', liters: 50, costCent: 40000,
        odometerKm: 10000, createdBy: 'admin',
      })
      const found = await controller.getFuelRecord(r.id)
      expect(found.liters).toBe(50)
    })

    it('getFuelRecords → 按车辆查询', async () => {
      await controller.recordFuel({
        vehiclePlate: '沪F11111', driverId: 'D-010', driverName: '钱七',
        fuelDate: '2026-08-01', liters: 60, costCent: 48000,
        odometerKm: 20000, createdBy: 'admin',
      })
      const records = await controller.getFuelRecords('沪F11111')
      expect(records.length).toBe(1)
    })

    it('getFuelEfficiency → 效率统计', async () => {
      await controller.recordFuel({
        vehiclePlate: '沪G22222', driverId: 'D-020', driverName: '孙八',
        fuelDate: '2026-08-01', liters: 100, costCent: 80000,
        odometerKm: 50000, createdBy: 'admin',
      })
      await controller.recordFuel({
        vehiclePlate: '沪G22222', driverId: 'D-020', driverName: '孙八',
        fuelDate: '2026-08-15', liters: 80, costCent: 64000,
        odometerKm: 50200, createdBy: 'admin',
      })
      const eff = await controller.getFuelEfficiency('沪G22222')
      expect(eff.totalFuelLiters).toBe(180)
      expect(eff.totalDistanceKm).toBe(200)
    })

    it('deleteFuelRecord → 删除', async () => {
      const r = await controller.recordFuel({
        vehiclePlate: '沪H33333', driverId: 'D-030', driverName: '周九',
        fuelDate: '2026-08-01', liters: 30, costCent: 24000,
        odometerKm: 5000, createdBy: 'admin',
      })
      await expect(controller.deleteFuelRecord(r.id)).resolves.toBeUndefined()
    })
  })

  // ── 事故记录 ─────────────────────────────────────────────────────────────

  describe('accidents', () => {
    it('recordAccident → 创建事故', async () => {
      const result = await controller.recordAccident({
        vehiclePlate: '沪A88888', driverId: 'D-001', driverName: '张三',
        accidentAt: '2026-07-28T14:30:00Z', location: 'G50高速',
        severity: 'minor', responsibility: 'self',
        description: '轻微追尾', createdBy: 'admin',
      })
      expect(result.resolved).toBe(false)
    })

    it('getAccidents → 按车牌过滤', async () => {
      await controller.recordAccident({
        vehiclePlate: '沪I44444', driverId: 'D-040', driverName: '吴十',
        accidentAt: '2026-07-28T14:30:00Z', location: 'G50高速',
        severity: 'moderate', responsibility: 'counterparty',
        description: '追尾', createdBy: 'admin',
      })
      const accidents = await controller.getAccidents('沪I44444')
      expect(accidents.length).toBe(1)
    })

    it('getAccident → 单笔查询', async () => {
      const a = await controller.recordAccident({
        vehiclePlate: '沪J55555', driverId: 'D-050', driverName: '郑十一',
        accidentAt: '2026-07-28T14:30:00Z', location: '市区',
        severity: 'minor', responsibility: 'self',
        description: '刮擦', createdBy: 'admin',
      })
      const found = await controller.getAccident(a.id)
      expect(found.description).toBe('刮擦')
    })

    it('resolveAccident → 解决闭环', async () => {
      const a = await controller.recordAccident({
        vehiclePlate: '沪K66666', driverId: 'D-060', driverName: '冯十二',
        accidentAt: '2026-07-28T14:30:00Z', location: '高速',
        severity: 'serious', responsibility: 'shared',
        description: '严重事故', createdBy: 'admin',
      })
      const resolved = await controller.resolveAccident(a.id, { resolution: '保险理赔完成' })
      expect(resolved.resolved).toBe(true)
      expect(resolved.resolution).toBe('保险理赔完成')
    })
  })

  // ── 物流成本 ─────────────────────────────────────────────────────────────

  describe('costs', () => {
    it('recordCost → 创建成本记录', async () => {
      const result = await controller.recordCost({
        periodStart: '2026-08-01', periodEnd: '2026-08-31',
        items: [{ costType: 'fuel', amountCent: 80000, description: '加油' }],
        createdBy: 'admin',
      })
      expect(result.totalCent).toBe(80000)
    })

    it('getCostSummary → 成本汇总', async () => {
      await controller.recordCost({
        periodStart: '2026-08-01', periodEnd: '2026-08-31',
        items: [{ costType: 'fuel', amountCent: 50000 }],
        vehiclePlate: '沪A88888', createdBy: 'admin',
      })
      const summary = await controller.getCostSummary('2026-08-01' as any, '2026-08-31' as any)
      expect(summary.totalCost).toBe(50000)
    })

    it('getCost → 单笔查询', async () => {
      const c = await controller.recordCost({
        periodStart: '2026-09-01', periodEnd: '2026-09-30',
        items: [{ costType: 'toll', amountCent: 10000 }],
        createdBy: 'admin',
      })
      const found = await controller.getCost(c.id)
      expect(found.totalCent).toBe(10000)
    })

    it('deleteCost → 删除', async () => {
      const c = await controller.recordCost({
        periodStart: '2026-10-01', periodEnd: '2026-10-31',
        items: [{ costType: 'parking', amountCent: 5000 }],
        createdBy: 'admin',
      })
      await expect(controller.deleteCost(c.id)).resolves.toBeUndefined()
    })
  })

  // ── 统计指标 ─────────────────────────────────────────────────────────────

  describe('metrics', () => {
    it('getMetrics → 统计指标', async () => {
      const m = await controller.getMetrics()
      expect(m.totalTransportOrders).toBe(0)
      expect(m.onTimeDeliveryRate).toBe(0)
    })
  })
})
