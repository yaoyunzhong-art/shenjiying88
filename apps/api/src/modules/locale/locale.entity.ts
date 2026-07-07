/**
 * locale 模块实体定义
 */
import type { CountryCode, TimeZone } from './locale.service'

export type { CountryCode, TimeZone }

/**
 * 时区信息
 */
export interface TimeZoneInfo {
  code: TimeZone
  name: string
  utcOffset: number
  countryCode: CountryCode
}

/**
 * 本地化配置
 */
export interface LocaleConfig {
  defaultTimeZone: TimeZone
  dateFormat: 'short' | 'medium' | 'long' | 'full'
  locale: string
}

/**
 * 格式化日期请求
 */
export interface FormatDateRequest {
  date: Date
  timeZone: TimeZone
  format: 'short' | 'medium' | 'long' | 'full'
}

/**
 * 格式化数字请求
 */
export interface FormatNumberRequest {
  value: number
  locale: string
}

/**
 * 格式化货币请求
 */
export interface FormatCurrencyRequest {
  amount: number
  currency: string
  locale: string
}

/**
 * 转换时间请求
 */
export interface ConvertTimeRequest {
  date: Date
  fromTz: TimeZone
  toTz: TimeZone
}

/**
 * 判断工作日请求
 */
export interface IsWorkdayRequest {
  date: Date
  timeZone: TimeZone
  countryCode?: CountryCode
}

/**
 * 当前位置信息
 */
export interface LocaleInfo {
  timeZone: TimeZone
  countryCode: CountryCode
  locale: string
  utcOffset: number
}

/**
 * 时间响应
 */
export interface TimeResponse {
  iso8601: string
  date: string
  time: string
  dateTime: string
  timeZone: TimeZone
  utcOffset: number
}

/**
 * 格式转化响应
 */
export interface FormatResponse {
  original: string
  formatted: string
  locale: string
}

/**
 * 货币格式化响应
 */
export interface CurrencyFormatResponse {
  originalAmount: number
  originalCurrency: string
  formatted: string
  locale: string
}

/**
 * 时区转换响应
 */
export interface ConvertTimeResponse {
  originalDate: string
  fromTz: TimeZone
  convertedDate: string
  toTz: TimeZone
  timeDifference: string
}

/**
 * 工作日判断响应
 */
export interface WorkdayResponse {
  isWorkday: boolean
  isHoliday: boolean
  dayOfWeek: string
  date: string
  timeZone: TimeZone
  countryCode: CountryCode
}
