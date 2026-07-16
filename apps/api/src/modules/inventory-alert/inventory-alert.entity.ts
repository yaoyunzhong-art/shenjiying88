import { ApiProperty } from '@nestjs/swagger'

export enum AlertLevel {
  Low = 'low',
  Critical = 'critical',
  Overstock = 'overstock',
}

export enum AlertStatus {
  Pending = 'pending',
  Resolved = 'resolved',
  Ignored = 'ignored',
}

export interface InventoryAlert {
  id: string
  tenantId: string
  productId: string
  productName: string
  sku: string
  currentStock: number
  minStock: number
  maxStock: number
  alertLevel: AlertLevel
  message: string
  status: AlertStatus
  createdAt: string
  updatedAt: string
}

export const AlertLevelLabels: Record<AlertLevel, string> = {
  [AlertLevel.Low]: '库存偏低',
  [AlertLevel.Critical]: '库存严重不足',
  [AlertLevel.Overstock]: '库存积压',
}

export const AlertStatusLabels: Record<AlertStatus, string> = {
  [AlertStatus.Pending]: '待处理',
  [AlertStatus.Resolved]: '已解决',
  [AlertStatus.Ignored]: '已忽略',
}
