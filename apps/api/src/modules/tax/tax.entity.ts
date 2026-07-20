/**
 * 税务模块实体定义
 */

/**
 * 税种类型
 */
export type TaxType = 'vat' | 'sales_tax' | 'gst' | 'service_charge' | 'customs_duty'

/**
 * 税种记录
 */
export interface TaxRate {
  id: string
  name: string
  type: TaxType
  rate: number // e.g., 0.13 for 13%
  jurisdiction: string // e.g., 'CN', 'US-VA', 'US-TX', 'HK'
  /** 租户 ID（RLS 多租户隔离字段） */
  tenantId: string
  enabled: boolean
  description?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * 税项计算请求
 */
export interface TaxCalculationRequest {
  amount: number // 税前金额（最小单位）
  jurisdiction: string
  taxType?: TaxType
}

/**
 * 税项计算响应
 */
export interface TaxCalculationResult {
  netAmount: number
  taxAmount: number
  grossAmount: number
  effectiveRate: number
  breakdown: Array<{
    name: string
    type: TaxType
    rate: number
    amount: number
  }>
}

/**
 * 税务配置
 */
export interface TaxConfig {
  defaultJurisdiction: string
  priceInclusive: boolean // 价格是否含税
  roundingMode: 'floor' | 'round' | 'ceil'
}

/**
 * 批量计算请求
 */
export interface BatchTaxRequest {
  items: Array<{
    id: string
    amount: number
    jurisdiction: string
    taxType?: TaxType
  }>
}

/**
 * 批量计算响应
 */
export interface BatchTaxResult {
  items: Array<{
    id: string
    netAmount: number
    taxAmount: number
    grossAmount: number
    effectiveRate: number
  }>
  totalTaxAmount: number
  totalGrossAmount: number
}
