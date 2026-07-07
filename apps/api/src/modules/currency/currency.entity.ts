/**
 * 货币模块实体定义
 */

export type CurrencyCode = 'CNY' | 'USD' | 'HKD' | 'TWD' | 'JPY' | 'KRW' | 'THB' | 'VND' | 'IDR' | 'MYR' | 'SGD'

/**
 * 汇率记录
 */
export interface ExchangeRate {
  from: CurrencyCode
  to: CurrencyCode
  rate: number
  updatedAt: Date
  source: 'central_bank' | 'market' | 'fixed' | 'manual'
}

/**
 * 金额值对象
 */
export interface Money {
  amount: number
  currency: CurrencyCode
}

/**
 * 货币配置
 */
export interface CurrencyConfig {
  baseCurrency: CurrencyCode
  decimalPlaces: number
  roundingMode: 'floor' | 'round' | 'ceil'
}

/**
 * 转换请求
 */
export interface ConvertRequest {
  amount: number
  from: CurrencyCode
  to: CurrencyCode
}

/**
 * 转换响应
 */
export interface ConvertResponse {
  originalAmount: number
  originalCurrency: CurrencyCode
  convertedAmount: number
  targetCurrency: CurrencyCode
  rate: number
  timestamp: string
}

/**
 * 设置汇率请求
 */
export interface SetRateRequest {
  from: CurrencyCode
  to: CurrencyCode
  rate: number
  source?: 'manual' | 'market'
}

/**
 * 汇率列表查询响应项
 */
export interface RateItem {
  from: CurrencyCode
  to: CurrencyCode
  rate: number
  source: string
  updatedAt: string
}

/**
 * 金额计算请求
 */
export interface ArithmeticRequest {
  a: { amount: number; currency: CurrencyCode }
  b: { amount: number; currency: CurrencyCode }
  operation: 'add' | 'subtract' | 'multiply' | 'divide'
  factor?: number // used for multiply/divide
}
