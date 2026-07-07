/**
 * locale.service.ts - Phase-24 T117-4
 * 用途: 时区自适应 + 日期格式 + 数字格式
 *
 * 核心功能:
 * - 时区 ↔ 国家/地区映射
 * - 时间格式化 (Intl.DateTimeFormat)
 * - 数字格式化 (Intl.NumberFormat)
 * - 跨时区转换
 * - 工作日/节假日判断
 */

export type CountryCode = 'CN' | 'TW' | 'US' | 'JP' | 'KR' | 'TH' | 'VN' | 'ID' | 'MY' | 'SG';

export type TimeZone =
  | 'Asia/Shanghai'
  | 'Asia/Taipei'
  | 'America/New_York'
  | 'Asia/Tokyo'
  | 'Asia/Seoul'
  | 'Asia/Bangkok'
  | 'Asia/Ho_Chi_Minh'
  | 'Asia/Jakarta'
  | 'Asia/Kuala_Lumpur'
  | 'Asia/Singapore';

// 时区 ↔ 国家映射表
const TIMEZONE_COUNTRY_MAP: Record<TimeZone, CountryCode> = {
  'Asia/Shanghai': 'CN',
  'Asia/Taipei': 'TW',
  'America/New_York': 'US',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Bangkok': 'TH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Jakarta': 'ID',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Singapore': 'SG',
};

const COUNTRY_TIMEZONE_MAP: Record<CountryCode, TimeZone> = {
  CN: 'Asia/Shanghai',
  TW: 'Asia/Taipei',
  US: 'America/New_York',
  JP: 'Asia/Tokyo',
  KR: 'Asia/Seoul',
  TH: 'Asia/Bangkok',
  VN: 'Asia/Ho_Chi_Minh',
  ID: 'Asia/Jakarta',
  MY: 'Asia/Kuala_Lumpur',
  SG: 'Asia/Singapore',
};

// 数字格式 locale 映射
const NUMBER_LOCALE_MAP: Record<CountryCode, string> = {
  CN: 'zh-CN',
  TW: 'zh-TW',
  US: 'en-US',
  JP: 'ja-JP',
  KR: 'ko-KR',
  TH: 'th-TH',
  VN: 'vi-VN',
  ID: 'id-ID',
  MY: 'ms-MY',
  SG: 'en-SG',
};

// 周末定义 (0 = 周日, 6 = 周六)
const WEEKEND_DAYS: Record<CountryCode, number[]> = {
  CN: [0, 6],
  TW: [0, 6],
  US: [0, 6],
  JP: [0, 6],
  KR: [0, 6],
  TH: [0, 6],
  VN: [0, 6],
  ID: [0, 6],
  MY: [0, 6],
  SG: [0, 6],
};

// UTC offset 缓存 (用于时区转换计算)
const UTC_OFFSETS: Partial<Record<TimeZone, number>> = {
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
};

export interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: string;
}

export interface DateRange {
  years: number;
  months: number;
  days: number;
  hours: number;
}

export class LocaleService {
  /**
   * 根据国家码获取时区
   */
  getTimeZone(countryCode: CountryCode): TimeZone {
    return COUNTRY_TIMEZONE_MAP[countryCode];
  }

  /**
   * 根据时区获取国家码
   */
  getCountryCode(timeZone: TimeZone): CountryCode {
    return TIMEZONE_COUNTRY_MAP[timeZone];
  }

  /**
   * 获取当前时间（指定时区）
   */
  now(timeZone: TimeZone): Date {
    const now = new Date();
    return this.convertTime(now, 'UTC' as TimeZone, timeZone);
  }

  /**
   * 获取当前 UTC 时间
   */
  nowUTC(): Date {
    return new Date();
  }

  /**
   * 获取 UTC offset（小时）
   */
  private getUTCOffset(timeZone: TimeZone): number {
    return UTC_OFFSETS[timeZone] ?? 0;
  }

  /**
   * 时间格式化 - 日期
   */
  formatDate(date: Date, timeZone: TimeZone, format: 'short' | 'medium' | 'long' | 'full' = 'medium'): string {
    const countryCode = this.getCountryCode(timeZone);
    const locale = NUMBER_LOCALE_MAP[countryCode] ?? 'en-US';
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...this.getDateFormatOptions(format),
    });
    return formatter.format(date);
  }

  /**
   * 时间格式化 - 时间
   */
  formatTime(date: Date, timeZone: TimeZone, format: 'short' | 'long' = 'short'): string {
    const countryCode = this.getCountryCode(timeZone);
    const locale = NUMBER_LOCALE_MAP[countryCode] ?? 'en-US';
    const hour12 = format === 'short';
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: format === 'long' ? '2-digit' : undefined,
      hour12,
    });
    return formatter.format(date);
  }

  /**
   * 时间格式化 - 日期时间
   */
  formatDateTime(date: Date, timeZone: TimeZone): string {
    const dateStr = this.formatDate(date, timeZone, 'short');
    const timeStr = this.formatTime(date, timeZone, 'short');
    return `${dateStr} ${timeStr}`;
  }

  /**
   * 数字格式化
   * 1000000 → "1,000,000" (en) or "1.000.000" (de)
   */
  formatNumber(value: number, locale: string): string {
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return formatter.format(value);
  }

  /**
   * 货币格式化
   * formatCurrency(1234.5, 'USD', 'en-US') → "$1,234.50"
   */
  formatCurrency(amount: number, currency: string, locale: string): string {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  }

  /**
   * 百分比格式化
   * 0.123 → "12.3%"
   */
  formatPercent(value: number, locale: string): string {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return formatter.format(value);
  }

  /**
   * 提取日期组件
   */
  getDateParts(date: Date, timeZone: TimeZone): DateParts {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      weekday: 'long',
    });
    const parts = formatter.formatToParts(date);
    const get = (type: string): number | string => {
      const found = parts.find((p) => p.type === type);
      return type === 'weekday' ? (found?.value ?? 'Sunday') : Number(found?.value ?? 0);
    };
    return {
      year: get('year') as number,
      month: get('month') as number,
      day: get('day') as number,
      hour: get('hour') as number,
      minute: get('minute') as number,
      second: get('second') as number,
      dayOfWeek: get('weekday') as string,
    };
  }

  /**
   * 计算时间范围
   */
  getDateRange(start: Date, end: Date, _timeZone: TimeZone): DateRange {
    const diffMs = end.getTime() - start.getTime();
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const totalDays = Math.floor(totalHours / 24);
    const years = Math.floor(totalDays / 365);
    const months = Math.floor((totalDays % 365) / 30);
    const days = totalDays % 30;
    const hours = totalHours % 24;
    return { years, months, days, hours };
  }

  /**
   * 跨时区时间转换
   * 将时间从一个时区转换到另一个时区
   * 返回一个表示目标时区本地时间的 Date（内部以 UTC 存储）
   */
  convertTime(date: Date, fromTz: TimeZone, toTz: TimeZone): Date {
    // 获取源时区和目标时区的 UTC offset
    const fromOffset = this.getUTCOffset(fromTz);
    const toOffset = this.getUTCOffset(toTz);
    // 假设输入的 date 是源时区的本地时间
    // 先转换为 UTC：date 作为源时区的本地时间 = UTC - fromOffset
    const utcTime = date.getTime() - fromOffset * 60 * 60 * 1000;
    // 再从 UTC 转换到目标时区：UTC + toOffset
    const targetTime = utcTime + toOffset * 60 * 60 * 1000;
    return new Date(targetTime);
  }

  /**
   * 转换为 UTC
   */
  toUTC(date: Date, timeZone: TimeZone): Date {
    return this.convertTime(date, timeZone, 'UTC' as TimeZone);
  }

  /**
   * 从 UTC 转换到指定时区
   */
  fromUTC(utc: Date, timeZone: TimeZone): Date {
    return this.convertTime(utc, 'UTC' as TimeZone, timeZone);
  }

  /**
   * 判断是否为工作日
   * 假设工作时间是 09:00-18:00（本地时间）
   */
  isWorkday(date: Date, timeZone: TimeZone, countryCode?: CountryCode): boolean {
    const code = countryCode ?? this.getCountryCode(timeZone);
    const dayOfWeek = this.getDayOfWeek(date, timeZone);
    const weekendDays = WEEKEND_DAYS[code] ?? [0, 6];
    // 检查是否为周末
    if (weekendDays.includes(dayOfWeek)) {
      return false;
    }
    // 检查是否在工作时间 (09:00-18:00)
    const parts = this.getDateParts(date, timeZone);
    const hour = parts.hour;
    return hour >= 9 && hour < 18;
  }

  /**
   * 判断是否为节假日（简化版：仅检查周末）
   */
  isHoliday(date: Date, timeZone: TimeZone): boolean {
    const dayOfWeek = this.getDayOfWeek(date, timeZone);
    return dayOfWeek === 0; // 周日视为假日
  }

  /**
   * 获取星期几（0=周日，1=周一...6=周六）
   */
  private getDayOfWeek(date: Date, timeZone: TimeZone): number {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
    });
    const dayStr = formatter.format(date).toLowerCase();
    const dayMap: Record<string, number> = {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    };
    return dayMap[dayStr] ?? 0;
  }

  /**
   * 获取某时区的当天开始时间 (UTC)
   */
  startOfDay(date: Date, _timeZone: TimeZone): Date {
    const result = new Date(date);
    result.setUTCHours(0, 0, 0, 0);
    return result;
  }

  /**
   * 获取某时区的当天结束时间 (UTC)
   */
  endOfDay(date: Date, _timeZone: TimeZone): Date {
    const result = new Date(date);
    result.setUTCHours(23, 59, 59, 999);
    return result;
  }

  /**
   * 获取某时区的当月开始时间
   */
  startOfMonth(date: Date, timeZone: TimeZone): Date {
    const result = new Date(date);
    result.setUTCDate(1);
    result.setUTCHours(0, 0, 0, 0);
    return result;
  }

  /**
   * 获取某时区的当月结束时间
   */
  endOfMonth(date: Date, timeZone: TimeZone): Date {
    const result = new Date(date);
    // 找到下个月的第一天，然后减一天
    result.setUTCMonth(result.getUTCMonth() + 1);
    result.setUTCDate(0); // 设置为上个月的最后一天
    result.setUTCHours(23, 59, 59, 999);
    return result;
  }

  /**
   * 获取日期格式选项
   */
  private getDateFormatOptions(format: 'short' | 'medium' | 'long' | 'full'): Intl.DateTimeFormatOptions {
    switch (format) {
      case 'short':
        return { year: '2-digit', month: 'short', day: 'numeric' };
      case 'medium':
        return { year: 'numeric', month: '2-digit', day: '2-digit' };
      case 'long':
        return { year: 'numeric', month: 'long', day: 'numeric' };
      case 'full':
        return { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
      default:
        return {};
    }
  }
}

export const localeService = new LocaleService();
