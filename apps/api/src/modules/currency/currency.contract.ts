/**
 * 🐜 自动: [currency] [D] contract 补全
 *
 * 货币模块：跨模块合约类型
 * 定义 currency 模块对外暴露的稳定合约接口，
 * 供 cashier, finance, payment-gateway, transactions, analytics 等模块消费。
 */

import type { CurrencyCode, Money, ExchangeRate, CurrencyConfig } from './currency.service'

/**
 * 货币转换请求合约
 */
export interface ConvertRequestContract {
  amount: number
  from: CurrencyCode
  to: CurrencyCode
}

/**
 * 货币转换响应合约
 */
export interface ConvertResponseContract {
  originalAmount: number
  originalCurrency: CurrencyCode
  convertedAmount: number
  targetCurrency: CurrencyCode
  rate: number
  timestamp: string
}

/**
 * 汇率条目合约（跨模块安全子集）
 */
export interface RateItemContract {
  from: CurrencyCode
  to: CurrencyCode
  rate: number
  source: ExchangeRate['source']
  updatedAt: string
}

/**
 * 设置汇率请求合约
 */
export interface SetRateRequestContract {
  from: CurrencyCode
  to: CurrencyCode
  rate: number
  source?: ExchangeRate['source']
}

/**
 * 算术运算操作数合约
 */
export interface MoneyOperandContract {
  amount: number
  currency: CurrencyCode
}

/**
 * 算术运算请求合约
 */
export interface ArithmeticRequestContract {
  a: MoneyOperandContract
  b: MoneyOperandContract
  operation: 'add' | 'subtract'
}

/**
 * 货币配置合约
 */
export interface CurrencyConfigContract extends CurrencyConfig {}

/**
 * 汇率查询合约（跨模块：从本位币查询所有汇率）
 */
export type BaseRatesContract = Record<string, number>

/**
 * 汇率是否过时合约
 */
export interface RateStalenessContract {
  from: CurrencyCode
  to: CurrencyCode
  isStale: boolean
  maxAgeMs: number
  rate?: number
}

/**
 * 货币模块对外合约导出索引
 */
export type {
  CurrencyCode,
  Money,
  ExchangeRate,
  CurrencyConfig,
}
