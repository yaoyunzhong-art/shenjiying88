import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { DeviceType, type DeviceUsageReport } from './device-usage-report.entity'
import type { DeviceUsageQueryDto, CreateDeviceUsageDto } from './device-usage-report.dto'

const usageStore = new Map<string, DeviceUsageReport>()

function seedMockData() {
  if (usageStore.size > 0) return

  const tenantId = 'default'
  const now = new Date().toISOString()

  const mockData: DeviceUsageReport[] = [
    {
      id: 'dev-usage-001', tenantId, deviceId: 'dev-arcade-01', deviceName: '街机-拳皇97',
      deviceType: DeviceType.Arcade, storeId: 'store-001',
      usageRate: 85.5, idleRate: 10.2, maintenanceRate: 4.3,
      peakHours: '14:00-17:00, 19:00-22:00', avgSessionMinutes: 42, dailyRevenue: 1250,
      date: '2026-07-15', createdAt: now,
    },
    {
      id: 'dev-usage-002', tenantId, deviceId: 'dev-arcade-02', deviceName: '街机-三国战纪',
      deviceType: DeviceType.Arcade, storeId: 'store-001',
      usageRate: 78.3, idleRate: 15.6, maintenanceRate: 6.1,
      peakHours: '14:00-17:00', avgSessionMinutes: 38, dailyRevenue: 980,
      date: '2026-07-15', createdAt: now,
    },
    {
      id: 'dev-usage-003', tenantId, deviceId: 'dev-shooting-01', deviceName: '射击-猎枪精英',
      deviceType: DeviceType.Shooting, storeId: 'store-001',
      usageRate: 72.1, idleRate: 20.4, maintenanceRate: 7.5,
      peakHours: '13:00-16:00, 18:00-21:00', avgSessionMinutes: 25, dailyRevenue: 1560,
      date: '2026-07-15', createdAt: now,
    },
    {
      id: 'dev-usage-004', tenantId, deviceId: 'dev-racing-01', deviceName: '赛车-头文字D',
      deviceType: DeviceType.Racing, storeId: 'store-002',
      usageRate: 91.2, idleRate: 5.3, maintenanceRate: 3.5,
      peakHours: '15:00-21:00', avgSessionMinutes: 15, dailyRevenue: 2100,
      date: '2026-07-15', createdAt: now,
    },
    {
      id: 'dev-usage-005', tenantId, deviceId: 'dev-basketball-01', deviceName: '篮球机-投篮王',
      deviceType: DeviceType.Basketball, storeId: 'store-002',
      usageRate: 65.8, idleRate: 28.9, maintenanceRate: 5.3,
      peakHours: '14:00-17:00, 19:00-22:00', avgSessionMinutes: 12, dailyRevenue: 880,
      date: '2026-07-15', createdAt: now,
    },
    {
      id: 'dev-usage-006', tenantId, deviceId: 'dev-vr-01', deviceName: 'VR-极限滑雪',
      deviceType: DeviceType.VR, storeId: 'store-003',
      usageRate: 60.4, idleRate: 32.1, maintenanceRate: 7.5,
      peakHours: '16:00-21:00', avgSessionMinutes: 30, dailyRevenue: 3200,
      date: '2026-07-15', createdAt: now,
    },
    {
      id: 'dev-usage-007', tenantId, deviceId: 'dev-racing-02', deviceName: '赛车-湾岸竞速',
      deviceType: DeviceType.Racing, storeId: 'store-003',
      usageRate: 88.7, idleRate: 7.8, maintenanceRate: 3.5,
      peakHours: '14:00-20:00', avgSessionMinutes: 18, dailyRevenue: 1850,
      date: '2026-07-15', createdAt: now,
    },
    {
      id: 'dev-usage-008', tenantId, deviceId: 'dev-shooting-02', deviceName: '射击-僵尸围城',
      deviceType: DeviceType.Shooting, storeId: 'store-001',
      usageRate: 70.9, idleRate: 22.3, maintenanceRate: 6.8,
      peakHours: '13:00-16:00', avgSessionMinutes: 22, dailyRevenue: 1340,
      date: '2026-07-15', createdAt: now,
    },
  ]

  for (const item of mockData) {
    usageStore.set(item.id, item)
  }
}

@Injectable()
export class DeviceUsageReportService {
  constructor() {
    seedMockData()
  }

  list(
    tenantContext: RequestTenantContext,
    query?: DeviceUsageQueryDto,
  ): { items: DeviceUsageReport[]; total: number } {
    let items = Array.from(usageStore.values())
      .filter((r) => r.tenantId === tenantContext.tenantId)

    if (query?.storeId) {
      items = items.filter((r) => r.storeId === query.storeId)
    }
    if (query?.deviceType) {
      items = items.filter((r) => r.deviceType === query.deviceType)
    }
    if (query?.startDate) {
      items = items.filter((r) => r.date >= query.startDate!)
    }
    if (query?.endDate) {
      items = items.filter((r) => r.date <= query.endDate!)
    }

    items.sort((a, b) => a.date.localeCompare(b.date))
    return { items, total: items.length }
  }

  getById(id: string, tenantContext: RequestTenantContext): DeviceUsageReport {
    const record = usageStore.get(id)
    if (!record || record.tenantId !== tenantContext.tenantId) {
      throw new Error(`Device usage report ${id} not found`)
    }
    return record
  }

  getSummary(tenantContext: RequestTenantContext) {
    const items = Array.from(usageStore.values())
      .filter((r) => r.tenantId === tenantContext.tenantId)

    if (items.length === 0) {
      return {
        totalDevices: 0,
        avgUsageRate: 0,
        avgIdleRate: 0,
        peakDeviceType: '',
        lowestUsageDevice: '',
        totalDailyRevenue: 0,
      }
    }

    const totalDevices = items.length
    const avgUsageRate = Number((items.reduce((s, r) => s + r.usageRate, 0) / totalDevices).toFixed(1))
    const avgIdleRate = Number((items.reduce((s, r) => s + r.idleRate, 0) / totalDevices).toFixed(1))
    const totalDailyRevenue = items.reduce((s, r) => s + r.dailyRevenue, 0)

    // Peak device type (by avg usage rate)
    const byType: Record<string, { count: number; totalUsage: number }> = {}
    for (const item of items) {
      if (!byType[item.deviceType]) byType[item.deviceType] = { count: 0, totalUsage: 0 }
      byType[item.deviceType].count++
      byType[item.deviceType].totalUsage += item.usageRate
    }
    let peakDeviceType = ''
    let peakRate = 0
    for (const [type, data] of Object.entries(byType)) {
      const avg = data.totalUsage / data.count
      if (avg > peakRate) {
        peakRate = avg
        peakDeviceType = type
      }
    }

    // Lowest usage device
    const lowestUsageDevice = items.reduce((min, curr) =>
      curr.usageRate < min.usageRate ? curr : min,
    )

    return {
      totalDevices,
      avgUsageRate,
      avgIdleRate,
      peakDeviceType,
      lowestUsageDevice: lowestUsageDevice.deviceName,
      totalDailyRevenue,
    }
  }

  create(
    tenantContext: RequestTenantContext,
    input: CreateDeviceUsageDto,
  ): DeviceUsageReport {
    const now = new Date().toISOString()
    const record: DeviceUsageReport = {
      id: `dev-usage-${randomUUID()}`,
      tenantId: tenantContext.tenantId,
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      deviceType: input.deviceType,
      storeId: input.storeId,
      usageRate: input.usageRate,
      idleRate: input.idleRate,
      maintenanceRate: input.maintenanceRate,
      peakHours: input.peakHours,
      avgSessionMinutes: input.avgSessionMinutes,
      dailyRevenue: input.dailyRevenue,
      date: input.date,
      createdAt: now,
    }
    usageStore.set(record.id, record)
    return record
  }

  delete(id: string, tenantContext: RequestTenantContext): void {
    const record = usageStore.get(id)
    if (!record || record.tenantId !== tenantContext.tenantId) {
      throw new Error(`Device usage report ${id} not found`)
    }
    usageStore.delete(id)
  }
}
