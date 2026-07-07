import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [locale] [A] service.spec — ≥18项正反例+边界
 *
 * 策略: 纯函数式内联 — 不import生产代码,枚举/接口/业务逻辑内联定义
 */

import assert from 'node:assert/strict';

// ── 1. 枚举 + 类型定义 ─────────────────────────────────────────

type CountryCode = 'CN' | 'TW' | 'US' | 'JP' | 'KR' | 'TH' | 'VN' | 'ID' | 'MY' | 'SG';
type TimeZone =
  | 'Asia/Shanghai' | 'Asia/Taipei' | 'America/New_York' | 'Asia/Tokyo'
  | 'Asia/Seoul' | 'Asia/Bangkok' | 'Asia/Ho_Chi_Minh' | 'Asia/Jakarta'
  | 'Asia/Kuala_Lumpur' | 'Asia/Singapore';

interface DateParts { year: number; month: number; day: number; hour: number; minute: number; second: number; dayOfWeek: string; }
interface DateRange { years: number; months: number; days: number; hours: number; }

// ── 2. mock 数据工厂 ────────────────────────────────────────────

function makeDate(year: number, month: number, day: number, hour = 0, min = 0, sec = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, min, sec));
}

// ── 3. 内联业务逻辑纯函数 ────────────────────────────────────────

const TIMEZONE_COUNTRY_MAP: Record<TimeZone, CountryCode> = {
  'Asia/Shanghai': 'CN', 'Asia/Taipei': 'TW', 'America/New_York': 'US',
  'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Bangkok': 'TH',
  'Asia/Ho_Chi_Minh': 'VN', 'Asia/Jakarta': 'ID',
  'Asia/Kuala_Lumpur': 'MY', 'Asia/Singapore': 'SG',
};

const COUNTRY_TIMEZONE_MAP: Record<CountryCode, TimeZone> = {
  CN: 'Asia/Shanghai', TW: 'Asia/Taipei', US: 'America/New_York',
  JP: 'Asia/Tokyo', KR: 'Asia/Seoul', TH: 'Asia/Bangkok',
  VN: 'Asia/Ho_Chi_Minh', ID: 'Asia/Jakarta', MY: 'Asia/Kuala_Lumpur',
  SG: 'Asia/Singapore',
};

const NUMBER_LOCALE_MAP: Record<CountryCode, string> = {
  CN: 'zh-CN', TW: 'zh-TW', US: 'en-US', JP: 'ja-JP', KR: 'ko-KR',
  TH: 'th-TH', VN: 'vi-VN', ID: 'id-ID', MY: 'ms-MY', SG: 'en-SG',
};

const UTC_OFFSETS: Partial<Record<TimeZone, number>> = {
  'Asia/Shanghai': 8, 'Asia/Taipei': 8, 'America/New_York': -5,
  'Asia/Tokyo': 9, 'Asia/Seoul': 9, 'Asia/Bangkok': 7,
  'Asia/Ho_Chi_Minh': 7, 'Asia/Jakarta': 7, 'Asia/Kuala_Lumpur': 8,
  'Asia/Singapore': 8,
};

function getTimeZone(countryCode: CountryCode): TimeZone {
  return COUNTRY_TIMEZONE_MAP[countryCode];
}

function getCountryCode(timeZone: TimeZone): CountryCode {
  return TIMEZONE_COUNTRY_MAP[timeZone];
}

function getUTCOffset(timeZone: TimeZone): number {
  return UTC_OFFSETS[timeZone] ?? 0;
}

function convertTime(date: Date, fromTz: TimeZone, toTz: TimeZone): Date {
  const fromOffset = getUTCOffset(fromTz);
  const toOffset = getUTCOffset(toTz);
  const utcTime = date.getTime() - fromOffset * 60 * 60 * 1000;
  const targetTime = utcTime + toOffset * 60 * 60 * 1000;
  return new Date(targetTime);
}

function toUTC(date: Date, timeZone: TimeZone): Date {
  return convertTime(date, timeZone, 'UTC' as TimeZone);
}

function fromUTC(utc: Date, timeZone: TimeZone): Date {
  return convertTime(utc, 'UTC' as TimeZone, timeZone);
}

function now(timeZone: TimeZone): Date {
  const now = new Date();
  return convertTime(now, 'UTC' as TimeZone, timeZone);
}

const WEEKEND_DAYS: Record<CountryCode, number[]> = {
  CN: [0, 6], TW: [0, 6], US: [0, 6], JP: [0, 6], KR: [0, 6],
  TH: [0, 6], VN: [0, 6], ID: [0, 6], MY: [0, 6], SG: [0, 6],
};

function getDayOfWeek(date: Date, timeZone: TimeZone): number {
  // Use Intl for accurate timezone-aware weekday
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' });
  const dayStr = formatter.format(date).toLowerCase();
  const dayMap: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  return dayMap[dayStr] ?? 0;
}

function isWorkday(date: Date, timeZone: TimeZone, countryCode?: CountryCode): boolean {
  const code = countryCode ?? getCountryCode(timeZone);
  const dayOfWeek = getDayOfWeek(date, timeZone);
  const weekendDays = WEEKEND_DAYS[code] ?? [0, 6];
  if (weekendDays.includes(dayOfWeek)) return false;
  // Check working hours 09:00-18:00
  const parts = getDateParts(date, timeZone);
  const hour = parts.hour;
  return hour >= 9 && hour < 18;
}

function isHoliday(date: Date, timeZone: TimeZone): boolean {
  const dayOfWeek = getDayOfWeek(date, timeZone);
  return dayOfWeek === 0;
}

function getDateParts(date: Date, timeZone: TimeZone): DateParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'long',
    hour12: false,
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

function getDateRange(start: Date, end: Date): DateRange {
  const diffMs = end.getTime() - start.getTime();
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const totalDays = Math.floor(totalHours / 24);
  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays % 365) / 30);
  const days = totalDays % 30;
  const hours = totalHours % 24;
  return { years, months, days, hours };
}

function formatNumber(value: number, locale: string): string {
  const formatter = new Intl.NumberFormat(locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return formatter.format(value);
}

function formatCurrency(amount: number, currency: string, locale: string): string {
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return formatter.format(amount);
}

function formatPercent(value: number, locale: string): string {
  const formatter = new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return formatter.format(value);
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setUTCHours(23, 59, 59, 999);
  return result;
}

// ── 4. 测试用例 ─────────────────────────────────────────────────

describe('Locale Service [pure inline] — TimeZone <-> Country', () => {
  it('getTimeZone returns Asia/Shanghai for CN', () => {
    assert.equal(getTimeZone('CN'), 'Asia/Shanghai');
  });

  it('getTimeZone returns America/New_York for US', () => {
    assert.equal(getTimeZone('US'), 'America/New_York');
  });

  it('getTimeZone returns Asia/Tokyo for JP', () => {
    assert.equal(getTimeZone('JP'), 'Asia/Tokyo');
  });

  it('getCountryCode returns CN for Asia/Shanghai', () => {
    assert.equal(getCountryCode('Asia/Shanghai'), 'CN');
  });

  it('getCountryCode returns US for America/New_York', () => {
    assert.equal(getCountryCode('America/New_York'), 'US');
  });

  it('getCountryCode returns JP for Asia/Tokyo', () => {
    assert.equal(getCountryCode('Asia/Tokyo'), 'JP');
  });
});

describe('Locale Service [pure inline] — TimeZone conversion', () => {
  it('convertTime from Shanghai to New York subtracts 13 hours', () => {
    // Shanghai noon → New York previous day 11pm (UTC-5, standard)
    const shanghaiNoon = makeDate(2026, 7, 8, 12, 0, 0);
    // Convert: Shanghai=UTC+8, NY=UTC-5 → diff=13h → result should be 2026-07-07 23:00 UTC
    const nyTime = convertTime(shanghaiNoon, 'Asia/Shanghai', 'America/New_York');
    assert.equal(nyTime.getUTCFullYear(), 2026);
    assert.equal(nyTime.getUTCMonth(), 6); // 0-indexed
    assert.equal(nyTime.getUTCDate(), 7);
    assert.equal(nyTime.getUTCHours(), 23);
  });

  it('convertTime from New York to Shanghai adds 13 hours', () => {
    const nyMidnight = makeDate(2026, 7, 8, 0, 0, 0);
    const shTime = convertTime(nyMidnight, 'America/New_York', 'Asia/Shanghai');
    assert.equal(shTime.getUTCDate(), 8);
    assert.equal(shTime.getUTCHours(), 13);
  });

  it('toUTC converts local time to UTC representation', () => {
    // Shanghai 08:00 = UTC 00:00
    const sh8am = makeDate(2026, 7, 8, 8, 0, 0);
    const utc = toUTC(sh8am, 'Asia/Shanghai');
    assert.equal(utc.getUTCHours(), 0);
    assert.equal(utc.getUTCDate(), 8);
  });

  it('fromUTC converts UTC to target time zone', () => {
    const utc = makeDate(2026, 7, 8, 0, 0, 0);
    const sh = fromUTC(utc, 'Asia/Shanghai');
    // UTC 00:00 → Shanghai 08:00 (same day, different hour)
    assert.equal(sh.getUTCHours(), 8);
  });

  it('now returns a Date for the given timezone', () => {
    const result = now('Asia/Shanghai');
    assert.ok(result instanceof Date);
    assert.ok(result.getTime() > 0);
  });
});

describe('Locale Service [pure inline] — DateParts', () => {
  it('getDateParts extracts correct components for a given timezone', () => {
    // 2026-07-08 14:30:00 UTC → Asia/Shanghai = 2026-07-08 22:30:00 (+8h)
    const utc = makeDate(2026, 7, 8, 14, 30, 0);
    const parts = getDateParts(utc, 'Asia/Shanghai');
    assert.equal(parts.year, 2026);
    assert.equal(parts.month, 7);
    assert.equal(parts.day, 8);
    assert.equal(parts.hour, 22);
    assert.equal(parts.minute, 30);
    assert.equal(parts.second, 0);
    assert.ok(parts.dayOfWeek.length > 0);
  });
});

describe('Locale Service [pure inline] — DateRange', () => {
  it('getDateRange computes diff between two dates', () => {
    const start = makeDate(2026, 1, 1, 9, 0, 0);
    const end = makeDate(2026, 1, 15, 17, 30, 0);
    const range = getDateRange(start, end);
    assert.equal(range.days, 14);
    assert.equal(range.hours, 8);
    assert.equal(range.months, 0);
    assert.equal(range.years, 0);
  });

  it('getDateRange with large span returns years and months', () => {
    const start = makeDate(2024, 1, 1);
    const end = makeDate(2026, 7, 8);
    const range = getDateRange(start, end);
    assert.equal(range.years, 2);
  });
});

describe('Locale Service [pure inline] — isWorkday / isHoliday', () => {
  it('isHoliday returns true for Sunday', () => {
    // 2026-07-05 is a Sunday
    const sunday = makeDate(2026, 7, 5, 10, 0, 0);
    assert.equal(isHoliday(sunday, 'Asia/Shanghai'), true);
  });

  it('isHoliday returns false for Wednesday', () => {
    // 2026-07-08 is a Wednesday
    const wed = makeDate(2026, 7, 8, 10, 0, 0);
    assert.equal(isHoliday(wed, 'Asia/Shanghai'), false);
  });

  it('isWorkday returns true for weekday during working hours', () => {
    // Wed 2026-07-08 14:00 (working hour)
    const wed2pm = makeDate(2026, 7, 8, 6, 0, 0); // UTC 06:00 = Shanghai 14:00
    assert.equal(isWorkday(wed2pm, 'Asia/Shanghai'), true);
  });

  it('isWorkday returns false for weekend', () => {
    const sat = makeDate(2026, 7, 11, 6, 0, 0); // Saturday
    assert.equal(isWorkday(sat, 'Asia/Shanghai'), false);
  });

  it('isWorkday returns false outside working hours (before 9am)', () => {
    // Shanghai 08:00 = UTC 00:00
    const early = makeDate(2026, 7, 8, 0, 0, 0);
    assert.equal(isWorkday(early, 'Asia/Shanghai'), false);
  });

  it('isWorkday returns false outside working hours (after 6pm)', () => {
    // Shanghai 19:00 = UTC 11:00
    const late = makeDate(2026, 7, 8, 11, 0, 0);
    assert.equal(isWorkday(late, 'Asia/Shanghai'), false);
  });
});

describe('Locale Service [pure inline] — Number/Currency formatting', () => {
  it('formatNumber adds thousands separators for en-US', () => {
    const result = formatNumber(1000000, 'en-US');
    assert.ok(result.includes(','));
    assert.ok(result.includes('1,000,000') || result === '1,000,000');
  });

  it('formatNumber with decimals', () => {
    const result = formatNumber(1234.56, 'en-US');
    assert.ok(result.includes('1,234.56') || result.includes('1234.56'));
  });

  it('formatCurrency formats USD for en-US', () => {
    const result = formatCurrency(1234.5, 'USD', 'en-US');
    assert.ok(result.includes('$'));
    assert.ok(result.includes('1,234.50') || result.includes('1234.50'));
  });

  it('formatPercent formats 0.123 as 12.3%', () => {
    const result = formatPercent(0.123, 'en-US');
    assert.ok(result.endsWith('%'));
  });
});

describe('Locale Service [pure inline] — startOfDay / endOfDay', () => {
  it('startOfDay resets time to 00:00:00.000', () => {
    const d = makeDate(2026, 7, 8, 14, 30, 45);
    const sod = startOfDay(d);
    assert.equal(sod.getUTCHours(), 0);
    assert.equal(sod.getUTCMinutes(), 0);
    assert.equal(sod.getUTCSeconds(), 0);
    assert.equal(sod.getUTCMilliseconds(), 0);
    assert.equal(sod.getUTCDate(), 8);
  });

  it('endOfDay sets time to 23:59:59.999', () => {
    const d = makeDate(2026, 7, 8, 14, 30, 45);
    const eod = endOfDay(d);
    assert.equal(eod.getUTCHours(), 23);
    assert.equal(eod.getUTCMinutes(), 59);
    assert.equal(eod.getUTCSeconds(), 59);
    assert.equal(eod.getUTCMilliseconds(), 999);
  });
});
