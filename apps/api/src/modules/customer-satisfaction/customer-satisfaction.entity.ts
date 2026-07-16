import { ApiProperty } from '@nestjs/swagger'

export enum SatisfactionCategory {
  Service = 'service',
  Environment = 'environment',
  Price = 'price',
  Device = 'device',
  Overall = 'overall',
}

export interface CustomerSatisfaction {
  id: string
  tenantId: string
  storeId: string
  customerName: string
  score: number
  category: SatisfactionCategory
  comment: string
  visitDate: string
  createdAt: string
}

export const SatisfactionCategoryLabels: Record<SatisfactionCategory, string> = {
  [SatisfactionCategory.Service]: '服务',
  [SatisfactionCategory.Environment]: '环境',
  [SatisfactionCategory.Price]: '价格',
  [SatisfactionCategory.Device]: '设备',
  [SatisfactionCategory.Overall]: '综合',
}
