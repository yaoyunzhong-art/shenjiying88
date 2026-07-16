import { ApiProperty } from '@nestjs/swagger'

export enum DeviceType {
  Arcade = 'arcade',
  Shooting = 'shooting',
  Racing = 'racing',
  Basketball = 'basketball',
  VR = 'vr',
}

export interface DeviceUsageReport {
  id: string
  tenantId: string
  deviceId: string
  deviceName: string
  deviceType: DeviceType
  storeId: string
  usageRate: number
  idleRate: number
  maintenanceRate: number
  peakHours: string
  avgSessionMinutes: number
  dailyRevenue: number
  date: string
  createdAt: string
}

export const DeviceTypeLabels: Record<DeviceType, string> = {
  [DeviceType.Arcade]: '街机',
  [DeviceType.Shooting]: '射击',
  [DeviceType.Racing]: '赛车',
  [DeviceType.Basketball]: '篮球',
  [DeviceType.VR]: 'VR',
}
