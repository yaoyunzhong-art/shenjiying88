/**
 * logistics-supplement.service.spec.ts
 * 后勤补充 Service 单元测试 — 15+ tests
 *
 * 覆盖: 运输调度单 CRUD、货物装载、路线规划、
 *       司机排班、车辆维保、油耗记录、事故记录、
 *       物流成本核算、统计指标 + 边界/异常
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LogisticsSupplementService } from '../logistics-supplement.service'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import type {
  TransportOrder, CargoLoad, RoutePlan, DriverSchedule,
  VehicleMaintenanceRecord, FuelRecord, AccidentRecord, LogisticsCost,
} from '../logistics-supplement.entity'

const makeOrder = (overrides?: Partial<Omit<TransportOrder, 'id' | 'createdAt' | 'updatedAt'>>) => ({
  tenantId: 't001',
  orderNumber: 'TO-20260729-001',
  transportType: 'normal' as const,
  status: 'draft' as const,
  originWarehouseCode: 'WH-A',
  originAddress: '上海浦东',
  destinationWarehouseCode: 'WH-B',
  destinationAddress: '北京朝阳',
  items: [{ cargoId: 'c1', cargoName: '电子元件', quantity: 100, unit: '箱', weightKg: 500, volumeM3: 2 }],
  totalWeightKg: 500,
  totalVolumeM3: 2,
  driverId: 'd001',
  driverName: '张三',
  vehiclePlate: '沪A88888',
  scheduledPickupAt: '2026-07-30T08:00:00Z',
  estimatedArrivalAt: '2026-07-31T18:00:00Z',
  notes: '加急',
  createdBy: 'admin',
  createdByName: '管理员',
  ...overrides,
})

// ══════════════════════════════════════════════════════════════════
// 1️⃣ 运输调度单
// ══════════════════════════════════════════════════════════════════

describe('LogisticsSupplementService — 运输调度单', () => {
  let svc: LogisticsSupplementService

  beforeEach(() => {
    svc = new LogisticsSupplementService()
  })

  it('创建运输单 → 返回完整 order，id 格式正确', async () => {
    const dto = makeOrder()
    const order = await svc.createTransportOrder(dto)
    expect(order.id).toMatch(/^to-/)
    expect(order.orderNumber).toBe('TO-20260729-001')
    expect(order.totalWeightKg).toBe(500)
    expect(order.createdAt).toBeDefined()
    expect(order.updatedAt).toBeDefined()
  })

  it('获取不存在的运输单 → NotFoundException', async () => {
    await expect(svc.getTransportOrder('to-nonexistent')).rejects.toThrow(NotFoundException)
  })

  it('更新运输单状态 → 合法状态正常更新', async () => {
    const order = await svc.createTransportOrder(makeOrder())
    // 模拟时间推移确保 updatedAt 变化
    await new Promise(r => setTimeout(r, 10))
    const updated = await svc.updateTransportOrderStatus(order.id, 'approved')
    expect(updated.status).toBe('approved')
    expect(updated.updatedAt).not.toBe(order.createdAt)
  })

  it('更新运输单状态 → 非法状态抛出 BadRequestException', async () => {
    const order = await svc.createTransportOrder(makeOrder())
    await expect(svc.updateTransportOrderStatus(order.id, 'invalid_status')).rejects.toThrow(BadRequestException)
  })

  it('更新运输单全部字段', async () => {
    const order = await svc.createTransportOrder(makeOrder())
    const updated = await svc.updateTransportOrder(order.id, { notes: '已改为普通配送' })
    expect(updated.notes).toBe('已改为普通配送')
  })

  it('删除运输单 → 成功', async () => {
    const order = await svc.createTransportOrder(makeOrder())
    await expect(svc.deleteTransportOrder(order.id)).resolves.toBeUndefined()
    await expect(svc.getTransportOrder(order.id)).rejects.toThrow(NotFoundException)
  })

  it('删除 in_transit 运输单 → BadRequestException', async () => {
    const order = await svc.createTransportOrder(makeOrder({ status: 'in_transit' }))
    await expect(svc.deleteTransportOrder(order.id)).rejects.toThrow(BadRequestException)
  })

  it('列表筛选 → 按状态筛选正确', async () => {
    await svc.createTransportOrder(makeOrder({ orderNumber: 'TO-001', status: 'draft' }))
    await svc.createTransportOrder(makeOrder({ orderNumber: 'TO-002', status: 'in_transit' }))
    await svc.createTransportOrder(makeOrder({ orderNumber: 'TO-003', status: 'completed' }))
    const drafts = await svc.listTransportOrders({ status: 'draft' })
    expect(drafts).toHaveLength(1)
    expect(drafts[0].orderNumber).toBe('TO-001')
  })
})

// ══════════════════════════════════════════════════════════════════
// 2️⃣ 货物装载
// ══════════════════════════════════════════════════════════════════

describe('LogisticsSupplementService — 货物装载', () => {
  let svc: LogisticsSupplementService

  beforeEach(() => {
    svc = new LogisticsSupplementService()
  })

  it('添加货物记录 → id 格式、字段正确', async () => {
    const load = await svc.addCargoLoad({
      tenantId: 't001',
      transportOrderId: 'to-1',
      cargoCode: 'CC-001',
      cargoName: '主板',
      quantity: 50,
      unit: '箱',
      weightKg: 200,
    })
    expect(load.id).toMatch(/^cl-/)
    expect(load.cargoName).toBe('主板')
  })

  it('更新货物状态 → delivered 时自动设置 unloadedAt', async () => {
    const load = await svc.addCargoLoad({
      tenantId: 't001',
      transportOrderId: 'to-1',
      cargoCode: 'CC-002',
      cargoName: '显示器',
      quantity: 10,
      unit: '台',
      weightKg: 150,
    })
    const updated = await svc.updateCargoStatus(load.id, 'delivered')
    expect(updated.status).toBe('delivered')
    expect(updated.unloadedAt).toBeDefined()
  })

  it('非法货物状态 → BadRequestException', async () => {
    const load = await svc.addCargoLoad({
      tenantId: 't001',
      transportOrderId: 'to-1',
      cargoCode: 'CC-003',
      cargoName: '键盘',
      quantity: 200,
      unit: '个',
      weightKg: 60,
    })
    await expect(svc.updateCargoStatus(load.id, 'flying')).rejects.toThrow(BadRequestException)
  })
})

// ══════════════════════════════════════════════════════════════════
// 3️⃣ 路线规划
// ══════════════════════════════════════════════════════════════════

describe('LogisticsSupplementService — 路线规划', () => {
  let svc: LogisticsSupplementService

  beforeEach(() => {
    svc = new LogisticsSupplementService()
  })

  it('创建路线计划', async () => {
    const plan = await svc.createRoutePlan({
      tenantId: 't001',
      name: '上海→北京主线',
      originWarehouseCode: 'WH-A',
      destinationWarehouseCode: 'WH-B',
      waypoints: [{ sequence: 1, warehouseCode: 'WH-A', address: '上海' }],
      totalDistanceKm: 1200,
      estimatedDurationMin: 600,
      createdBy: 'admin',
    })
    expect(plan.id).toMatch(/^rp-/)
    expect(plan.totalDistanceKm).toBe(1200)
  })

  it('路线优化 → 距离减少15%, 时间减少10%', async () => {
    const plan = await svc.createRoutePlan({
      tenantId: 't001',
      name: '上海→北京',
      originWarehouseCode: 'WH-A',
      destinationWarehouseCode: 'WH-B',
      waypoints: [{ sequence: 1, warehouseCode: 'WH-A', address: '上海' }],
      totalDistanceKm: 1200,
      estimatedDurationMin: 600,
      createdBy: 'admin',
    })
    const optimized = await svc.optimizeRoute(plan.id)
    expect(optimized.totalDistanceKm).toBe(1020)        // 1200 * 0.85
    expect(optimized.estimatedDurationMin).toBe(540)     // 600 * 0.90
  })

  it('获取不存在的路线 → NotFoundException', async () => {
    await expect(svc.getRoutePlan('rp-nonexistent')).rejects.toThrow(NotFoundException)
  })
})

// ══════════════════════════════════════════════════════════════════
// 4️⃣ 司机排班
// ══════════════════════════════════════════════════════════════════

describe('LogisticsSupplementService — 司机排班', () => {
  let svc: LogisticsSupplementService

  beforeEach(() => {
    svc = new LogisticsSupplementService()
  })

  it('创建排班并更新状态 → checked_in 自动设置时间', async () => {
    const s = await svc.createDriverSchedule({
      tenantId: 't001',
      driverId: 'd001',
      driverName: '张三',
      scheduleDate: '2026-07-29',
      shiftName: '白班',
      shiftStart: '08:00',
      shiftEnd: '18:00',
      createdBy: 'admin',
    })
    const checkedIn = await svc.updateDriverScheduleStatus(s.id, 'checked_in')
    expect(checkedIn.status).toBe('checked_in')
    expect(checkedIn.checkedInAt).toBeDefined()
  })

  it('非法排班状态 → BadRequestException', async () => {
    const s = await svc.createDriverSchedule({
      tenantId: 't001',
      driverId: 'd002',
      driverName: '李四',
      scheduleDate: '2026-07-29',
      shiftName: '夜班',
      shiftStart: '20:00',
      shiftEnd: '06:00',
      createdBy: 'admin',
    })
    await expect(svc.updateDriverScheduleStatus(s.id, 'sleeping')).rejects.toThrow(BadRequestException)
  })
})

// ══════════════════════════════════════════════════════════════════
// 5️⃣ 车辆维保
// ══════════════════════════════════════════════════════════════════

describe('LogisticsSupplementService — 车辆维保', () => {
  let svc: LogisticsSupplementService

  beforeEach(() => {
    svc = new LogisticsSupplementService()
  })

  it('创建维保记录并查询历史', async () => {
    const r = await svc.createMaintenanceRecord({
      tenantId: 't001',
      vehiclePlate: '沪A88888',
      odometerKm: 50000,
      maintType: 'oil_change',
      description: '常规换油',
      operatorId: 'op001',
      operatorName: '维修工小王',
    })
    expect(r.id).toMatch(/^vm-/)

    const history = await svc.getVehicleMaintenanceHistory('沪A88888')
    expect(history).toHaveLength(1)
  })

  it('更新维保状态 → in_progress 自动设置 startedAt', async () => {
    const r = await svc.createMaintenanceRecord({
      tenantId: 't001',
      vehiclePlate: '沪B66666',
      odometerKm: 100000,
      maintType: 'brake_service',
      description: '刹车片更换',
      operatorId: 'op001',
      operatorName: '维修工小王',
    })
    const started = await svc.updateMaintenanceStatus(r.id, 'in_progress')
    expect(started.startedAt).toBeDefined()
  })

  it('非法维保状态 → BadRequestException', async () => {
    const r = await svc.createMaintenanceRecord({
      tenantId: 't001',
      vehiclePlate: '沪C77777',
      odometerKm: 20000,
      maintType: 'routine_check',
      description: '例行检查',
      operatorId: 'op002',
      operatorName: '维修工老刘',
    })
    await expect(svc.updateMaintenanceStatus(r.id, 'exploded')).rejects.toThrow(BadRequestException)
  })
})

// ══════════════════════════════════════════════════════════════════
// 6️⃣ 油耗记录
// ══════════════════════════════════════════════════════════════════

describe('LogisticsSupplementService — 油耗记录', () => {
  let svc: LogisticsSupplementService

  beforeEach(() => {
    svc = new LogisticsSupplementService()
  })

  it('记录油耗 → unitPriceCent 自动计算', async () => {
    const r = await svc.recordFuel({
      tenantId: 't001',
      vehiclePlate: '沪A88888',
      driverId: 'd001',
      driverName: '张三',
      fuelDate: '2026-07-29',
      liters: 100,
      costCent: 80000,
      odometerKm: 50000,
      createdBy: 'admin',
    })
    expect(r.unitPriceCent).toBe(800)       // 80000 / 100
    expect(r.id).toMatch(/^fr-/)
  })

  it('油耗效率统计', async () => {
    await svc.recordFuel({
      tenantId: 't001', vehiclePlate: '沪A88888', driverId: 'd001', driverName: '张三',
      fuelDate: '2026-07-01', liters: 100, costCent: 80000, odometerKm: 50000,
      createdBy: 'admin',
    })
    await svc.recordFuel({
      tenantId: 't001', vehiclePlate: '沪A88888', driverId: 'd001', driverName: '张三',
      fuelDate: '2026-07-15', liters: 90, costCent: 72000, odometerKm: 50200,   // 只跑200km
      createdBy: 'admin',
    })
    await svc.recordFuel({
      tenantId: 't001', vehiclePlate: '沪A88888', driverId: 'd001', driverName: '张三',
      fuelDate: '2026-07-29', liters: 85, costCent: 68000, odometerKm: 50500,   // 又跑300km
      createdBy: 'admin',
    })
    const eff = await svc.getFuelEfficiency('沪A88888')
    expect(eff.totalFuelLiters).toBe(275)         // 100 + 90 + 85
    expect(eff.totalDistanceKm).toBe(500)          // 50500 - 50000
    expect(eff.avgConsumptionPer100km).toBeGreaterThan(0)
  })

  it('删除油耗记录 → 成功', async () => {
    const r = await svc.recordFuel({
      tenantId: 't001', vehiclePlate: '沪C99999', driverId: 'd003', driverName: '王五',
      fuelDate: '2026-07-01', liters: 50, costCent: 40000, odometerKm: 10000,
      createdBy: 'admin',
    })
    await expect(svc.deleteFuelRecord(r.id)).resolves.toBeUndefined()
    await expect(svc.getFuelRecord(r.id)).rejects.toThrow(NotFoundException)
  })
})

// ══════════════════════════════════════════════════════════════════
// 7️⃣ 事故记录
// ══════════════════════════════════════════════════════════════════

describe('LogisticsSupplementService — 事故记录', () => {
  let svc: LogisticsSupplementService

  beforeEach(() => {
    svc = new LogisticsSupplementService()
  })

  it('创建事故 → resolved=false', async () => {
    const a = await svc.recordAccident({
      tenantId: 't001',
      vehiclePlate: '沪A88888',
      driverId: 'd001',
      driverName: '张三',
      accidentAt: '2026-07-28T14:30:00Z',
      location: 'G50 高速青浦段',
      severity: 'minor',
      responsibility: 'self',
      description: '追尾前车',
      casualties: 0,
      propertyDamageCent: 500000,
      createdBy: 'admin',
    })
    expect(a.resolved).toBe(false)
    expect(a.id).toMatch(/^ac-/)
  })

  it('解决事故 → resolved=true', async () => {
    const a = await svc.recordAccident({
      tenantId: 't001', vehiclePlate: '沪A88888', driverId: 'd001', driverName: '张三',
      accidentAt: '2026-07-28T14:30:00Z', location: 'G50 高速', severity: 'moderate',
      responsibility: 'shared', description: '追尾', createdBy: 'admin',
    })
    const resolved = await svc.resolveAccident(a.id, '保险理赔完成，双方和解')
    expect(resolved.resolved).toBe(true)
    expect(resolved.resolvedAt).toBeDefined()
    expect(resolved.resolution).toBe('保险理赔完成，双方和解')
  })

  it('重复解决事故 → BadRequestException', async () => {
    const a = await svc.recordAccident({
      tenantId: 't001', vehiclePlate: '沪A88888', driverId: 'd001', driverName: '张三',
      accidentAt: '2026-07-28T14:30:00Z', location: 'G50', severity: 'minor',
      responsibility: 'self', description: '刮擦', createdBy: 'admin',
    })
    await svc.resolveAccident(a.id, '已处理')
    await expect(svc.resolveAccident(a.id, '再次处理')).rejects.toThrow(BadRequestException)
  })
})

// ══════════════════════════════════════════════════════════════════
// 8️⃣ 物流成本核算
// ══════════════════════════════════════════════════════════════════

describe('LogisticsSupplementService — 物流成本', () => {
  let svc: LogisticsSupplementService

  beforeEach(() => {
    svc = new LogisticsSupplementService()
  })

  it('记录成本 → totalCent 自动汇总', async () => {
    const c = await svc.recordCost({
      tenantId: 't001',
      transportOrderId: 'to-1',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      items: [
        { costType: 'fuel', amountCent: 80000, description: '加油' },
        { costType: 'toll', amountCent: 20000, description: '过路费' },
      ],
      vehiclePlate: '沪A88888',
      createdBy: 'admin',
    })
    expect(c.totalCent).toBe(100000)   // 80000 + 20000
    expect(c.id).toMatch(/^lc-/)
  })

  it('成本汇总 → 按类型和车辆聚合', async () => {
    await svc.recordCost({
      tenantId: 't001', transportOrderId: 'to-1',
      periodStart: '2026-07-01', periodEnd: '2026-07-15',
      items: [
        { costType: 'fuel', amountCent: 50000 },
        { costType: 'fuel', amountCent: 30000 },
      ],
      vehiclePlate: '沪A88888', createdBy: 'admin',
    })
    await svc.recordCost({
      tenantId: 't001', transportOrderId: 'to-2',
      periodStart: '2026-07-01', periodEnd: '2026-07-15',
      items: [
        { costType: 'toll', amountCent: 10000 },
      ],
      vehiclePlate: '沪B66666', createdBy: 'admin',
    })
    const summary = await svc.getCostSummary('2026-07-01', '2026-07-31')
    expect(summary.totalCost).toBe(90000)
    expect(summary.byType.fuel).toBe(80000)
    expect(summary.byType.toll).toBe(10000)
    expect(summary.byVehicle['沪A88888']).toBe(80000)
  })
})

// ══════════════════════════════════════════════════════════════════
// 9️⃣ 统计指标
// ══════════════════════════════════════════════════════════════════

describe('LogisticsSupplementService — 统计指标', () => {
  let svc: LogisticsSupplementService

  beforeEach(async () => {
    svc = new LogisticsSupplementService()
    // 创建订单作为统计基础
    await svc.createTransportOrder(makeOrder({ orderNumber: 'TO-001', status: 'completed', estimatedArrivalAt: '2026-07-30T18:00:00Z', actualArrivalAt: '2026-07-30T16:00:00Z' } as any))
    await svc.createTransportOrder(makeOrder({ orderNumber: 'TO-002', status: 'in_transit' }))
    await svc.createTransportOrder(makeOrder({ orderNumber: 'TO-003', status: 'completed', estimatedArrivalAt: '2026-07-30T18:00:00Z', actualArrivalAt: '2026-07-31T10:00:00Z' } as any))
    await svc.createTransportOrder(makeOrder({ orderNumber: 'TO-004', status: 'cancelled' }))
  })

  it('基础指标统计', async () => {
    const m = await svc.getMetrics()
    expect(m.totalTransportOrders).toBe(4)
    expect(m.inTransitOrders).toBe(1)
    expect(m.completedOrders).toBe(2)
    expect(m.cancelledOrders).toBe(1)
    expect(m.totalDrivers).toBe(1)      // 都是用 d001
  })

  it('on-time delivery rate', async () => {
    const m = await svc.getMetrics()
    // TO-001 准时(16:00 <= 18:00), TO-003 迟到(10:00 > 18:00)
    expect(m.onTimeDeliveryRate).toBe(50)   // 1/2
  })
})
