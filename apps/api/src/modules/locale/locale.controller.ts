import { Controller, Get, Post, Body, Param, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common'
import { LocaleService, type CountryCode, type TimeZone } from './locale.service'
import type {
  TimeZoneInfo,
  LocaleConfig,
  TimeResponse,
  FormatResponse,
  CurrencyFormatResponse,
  ConvertTimeResponse,
  WorkdayResponse,
  LocaleInfo
} from './locale.entity'
import {
  FormatDateDto,
  FormatNumberDto,
  FormatCurrencyDto,
  ConvertTimeDto,
  IsWorkdayDto,
  ConfigUpdateDto
} from './locale.dto'
import { TenantGuard } from '../agent/tenant.guard'

// 时区名称映射
const TIMEZONE_NAMES: Partial<Record<TimeZone, string>> = {
  'Asia/Shanghai': '中国标准时间',
  'Asia/Taipei': '台湾标准时间',
  'America/New_York': '美国东部时间',
  'Asia/Tokyo': '日本标准时间',
  'Asia/Seoul': '韩国标准时间',
  'Asia/Bangkok': '泰国时间',
  'Asia/Ho_Chi_Minh': '越南时间',
  'Asia/Jakarta': '印尼西部时间',
  'Asia/Kuala_Lumpur': '马来西亚时间',
  'Asia/Singapore': '新加坡时间',
}

// 默认配置
const DEFAULT_CONFIG: LocaleConfig = {
  defaultTimeZone: 'Asia/Shanghai',
  dateFormat: 'medium',
  locale: 'zh-CN',
}

@Controller('locale')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(TenantGuard)
export class LocaleController {
  private config: LocaleConfig = { ...DEFAULT_CONFIG }

  constructor(private readonly localeService: LocaleService) {}

  /**
   * 根据国家码获取时区信息
   * GET /locale/timezone/:countryCode
   */
  @Get('timezone/:countryCode')
  getTimeZone(@Param('countryCode') countryCode: string): TimeZoneInfo {
    const code = countryCode as CountryCode
    const tz = this.localeService.getTimeZone(code)
    return {
      code: tz,
      name: TIMEZONE_NAMES[tz] ?? tz,
      utcOffset: this.getUTCOffset(tz),
      countryCode: code,
    }
  }

  /**
   * 根据时区获取国家码
   * GET /locale/country/:timeZone
   */
  @Get('country/:timeZone')
  getCountryCode(@Param('timeZone') timeZone: string): { timeZone: string; countryCode: string } {
    const tz = timeZone as TimeZone
    const countryCode = this.localeService.getCountryCode(tz)
    return { timeZone: tz, countryCode }
  }

  /**
   * 获取指定时区的当前时间
   * GET /locale/now/:timeZone
   */
  @Get('now/:timeZone')
  getNow(@Param('timeZone') timeZone: string): TimeResponse {
    const tz = timeZone as TimeZone
    const now = this.localeService.now(tz)
    return {
      iso8601: now.toISOString(),
      date: this.localeService.formatDate(now, tz, 'medium'),
      time: this.localeService.formatTime(now, tz),
      dateTime: this.localeService.formatDateTime(now, tz),
      timeZone: tz,
      utcOffset: this.getUTCOffset(tz),
    }
  }

  /**
   * 格式化日期
   * POST /locale/format-date
   */
  @Post('format-date')
  formatDate(@Body() body: FormatDateDto): FormatResponse {
    const date = new Date(body.date)
    const tz = body.timeZone as TimeZone
    const format = body.format as 'short' | 'medium' | 'long' | 'full'
    const formatted = this.localeService.formatDate(date, tz, format)
    return {
      original: body.date,
      formatted,
      locale: this.getLocaleName(tz),
    }
  }

  /**
   * 格式化数字
   * POST /locale/format-number
   */
  @Post('format-number')
  formatNumber(@Body() body: FormatNumberDto): FormatResponse {
    const formatted = this.localeService.formatNumber(body.value, body.locale)
    return {
      original: String(body.value),
      formatted,
      locale: body.locale,
    }
  }

  /**
   * 格式化货币
   * POST /locale/format-currency
   */
  @Post('format-currency')
  formatCurrency(@Body() body: FormatCurrencyDto): CurrencyFormatResponse {
    const formatted = this.localeService.formatCurrency(body.amount, body.currency, body.locale)
    return {
      originalAmount: body.amount,
      originalCurrency: body.currency,
      formatted,
      locale: body.locale,
    }
  }

  /**
   * 时区转换
   * POST /locale/convert-time
   */
  @Post('convert-time')
  convertTime(@Body() body: ConvertTimeDto): ConvertTimeResponse {
    const date = new Date(body.date)
    const fromTz = body.fromTz as TimeZone
    const toTz = body.toTz as TimeZone
    const converted = this.localeService.convertTime(date, fromTz, toTz)

    const fromOffset = this.getUTCOffset(fromTz)
    const toOffset = this.getUTCOffset(toTz)
    const diff = toOffset - fromOffset
    const sign = diff >= 0 ? '+' : ''
    const timeDifference = `UTC${sign}${diff}h`

    return {
      originalDate: date.toISOString(),
      fromTz,
      convertedDate: converted.toISOString(),
      toTz,
      timeDifference,
    }
  }

  /**
   * 判断工作日
   * POST /locale/is-workday
   */
  @Post('is-workday')
  isWorkday(@Body() body: IsWorkdayDto): WorkdayResponse {
    const date = new Date(body.date)
    const tz = body.timeZone as TimeZone
    const countryCode = (body.countryCode ?? this.localeService.getCountryCode(tz)) as CountryCode
    const isWorkday = this.localeService.isWorkday(date, tz, countryCode)
    const isHoliday = this.localeService.isHoliday(date, tz)

    const parts = this.localeService.getDateParts(date, tz)

    return {
      isWorkday,
      isHoliday,
      dayOfWeek: parts.dayOfWeek,
      date: body.date,
      timeZone: tz,
      countryCode,
    }
  }

  /**
   * 获取当前配置
   * GET /locale/config
   */
  @Get('config')
  getConfig(): LocaleConfig {
    return this.config
  }

  /**
   * 更新配置
   * POST /locale/config
   */
  @Post('config')
  updateConfig(@Body() body: ConfigUpdateDto): { config: LocaleConfig; info: LocaleInfo } {
    if (body.defaultTimeZone !== undefined) {
      this.config.defaultTimeZone = body.defaultTimeZone as TimeZone
    }
    if (body.dateFormat !== undefined) {
      this.config.dateFormat = body.dateFormat as LocaleConfig['dateFormat']
    }
    if (body.locale !== undefined) {
      this.config.locale = body.locale
    }

    const info: LocaleInfo = {
      timeZone: this.config.defaultTimeZone,
      countryCode: this.localeService.getCountryCode(this.config.defaultTimeZone),
      locale: this.config.locale,
      utcOffset: this.getUTCOffset(this.config.defaultTimeZone),
    }

    return { config: { ...this.config }, info }
  }

  /**
   * 获取 UTC offset 小时数
   */
  private getUTCOffset(timeZone: TimeZone): number {
    // 从 service 中获取 offset（通过解析格式化的时间差异）
    const now = new Date()
    const dateParts = this.localeService.getDateParts(now, timeZone)
    const utcParts = this.localeService.getDateParts(now, 'Asia/Shanghai' as TimeZone)

    // 估算：UTC+8 offset 作为参考
    const knownOffsets: Partial<Record<TimeZone, number>> = {
      'Asia/Shanghai': 8,
      'Asia/Taipei': 8,
      'America/New_York': -5,
      'Asia/Tokyo': 9,
      'Asia/Seoul': 9,
      'Asia/Bangkok': 7,
      'Asia/Ho_Chi_Minh': 7,
      'Asia/Jakarta': 7,
      'Asia/Kuala_Lumpur': 8,
      'Asia/Singapore': 8,
    }

    return knownOffsets[timeZone] ?? 0
  }

  /**
   * 根据时区获取 locale 名称
   */
  private getLocaleName(timeZone: TimeZone): string {
    const localeMap: Partial<Record<TimeZone, string>> = {
      'Asia/Shanghai': 'zh-CN',
      'Asia/Taipei': 'zh-TW',
      'America/New_York': 'en-US',
      'Asia/Tokyo': 'ja-JP',
      'Asia/Seoul': 'ko-KR',
      'Asia/Bangkok': 'th-TH',
      'Asia/Ho_Chi_Minh': 'vi-VN',
      'Asia/Jakarta': 'id-ID',
      'Asia/Kuala_Lumpur': 'ms-MY',
      'Asia/Singapore': 'en-SG',
    }
    return localeMap[timeZone] ?? 'en-US'
  }
}
