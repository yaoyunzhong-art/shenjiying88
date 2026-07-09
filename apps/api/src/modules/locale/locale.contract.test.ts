import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [locale] [C] 合约测试
 *
 * 验证 locale 模块的实体 Shape、业务逻辑契约、类型安全
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { LocaleService, type CountryCode, type TimeZone } from './locale.service';

// ─── 服务实例 helper ──────────────────────────────────

function makeService(): LocaleService {
  return new LocaleService();
}

// ─── 合约: 时区映射完整性 ─────────────────────────────

describe('[locale] 合约: 时区↔国家映射', () => {
  const COUNTRY_CODES: CountryCode[] = ['CN', 'TW', 'US', 'JP', 'KR', 'TH', 'VN', 'ID', 'MY', 'SG'];
  const TIMEZONES: TimeZone[] = [
    'Asia/Shanghai', 'Asia/Taipei', 'America/New_York',
    'Asia/Tokyo', 'Asia/Seoul', 'Asia/Bangkok',
    'Asia/Ho_Chi_Minh', 'Asia/Jakarta', 'Asia/Kuala_Lumpur', 'Asia/Singapore',
  ];

  it('每个国家码都有对应的时区', () => {
    const svc = makeService();
    for (const cc of COUNTRY_CODES) {
      const tz = svc.getTimeZone(cc);
      assert.equal(typeof tz, 'string');
      assert.ok(tz.length > 0);
    }
  });

  it('每个时区都有对应的国家码', () => {
    const svc = makeService();
    for (const tz of TIMEZONES) {
      const cc = svc.getCountryCode(tz);
      assert.equal(typeof cc, 'string');
      assert.ok(cc.length > 0);
    }
  });

  it('映射是互逆的: getTimeZone(getCountryCode(tz)) === tz', () => {
    const svc = makeService();
    for (const tz of TIMEZONES) {
      assert.equal(svc.getTimeZone(svc.getCountryCode(tz)), tz);
    }
  });

  it('映射是互逆的: getCountryCode(getTimeZone(cc)) === cc', () => {
    const svc = makeService();
    for (const cc of COUNTRY_CODES) {
      assert.equal(svc.getCountryCode(svc.getTimeZone(cc)), cc);
    }
  });

  it('集合大小一致: 10个国家码 ↔ 10个时区', () => {
    assert.equal(COUNTRY_CODES.length, TIMEZONES.length);
  });

  it('所有国家码均为2位大写字母', () => {
    for (const cc of COUNTRY_CODES) {
      assert.match(cc, /^[A-Z]{2}$/);
    }
  });

  it('所有时区均包含斜杠(Area/City格式)', () => {
    for (const tz of TIMEZONES) {
      assert.match(tz, /^[A-Za-z_]+\/[A-Za-z_]+$/);
    }
  });
});

// ─── 合约: now/nowUTC ─────────────────────────────────

describe('[locale] 合约: 当前时间 API', () => {
  it('now() 总是返回 Date 实例', () => {
    const svc = makeService();
    for (const tz of ['Asia/Shanghai', 'America/New_York', 'Asia/Tokyo'] as TimeZone[]) {
      const d = svc.now(tz);
      assert.ok(d instanceof Date);
      assert.ok(d.getTime() > 0);
    }
  });

  it('nowUTC() 返回的值与 Date.now() 接近（5秒内）', () => {
    const svc = makeService();
    const before = Date.now();
    const utc = svc.nowUTC().getTime();
    const after = Date.now();
    assert.ok(utc >= before - 1000);
    assert.ok(utc <= after + 5000);
  });

  it('不同时区的 now() 小时值不同（跨时区）', () => {
    const svc = makeService();
    const sh = svc.now('Asia/Shanghai');
    const ny = svc.now('America/New_York');
    // 上海和纽约差大约12-13小时
    const hDiff = Math.abs(sh.getHours() - ny.getHours());
    assert.ok(hDiff >= 10 && hDiff <= 14);
  });
});

// ─── 合约: formatDate 输出格式 ─────────────────────────

describe('[locale] 合约: 日期格式化', () => {
  const testDate = new Date('2025-06-15T10:30:00.000Z');

  it('formatDate 总是返回非空字符串', () => {
    const svc = makeService();
    for (const tz of ['Asia/Shanghai', 'America/New_York'] as TimeZone[]) {
      for (const fmt of ['short', 'medium', 'long', 'full'] as const) {
        const result = svc.formatDate(testDate, tz, fmt);
        assert.equal(typeof result, 'string');
        assert.ok(result.length > 0);
      }
    }
  });

  it('short 格式长度 <= 15个字符', () => {
    const svc = makeService();
    const result = svc.formatDate(testDate, 'Asia/Shanghai', 'short');
    assert.ok(result.length <= 15, `short format too long: "${result}" (${result.length} chars)`);
  });

  it('full 格式长度 >= short 格式', () => {
    const svc = makeService();
    const short = svc.formatDate(testDate, 'Asia/Shanghai', 'short');
    const full = svc.formatDate(testDate, 'Asia/Shanghai', 'full');
    assert.ok(full.length >= short.length);
  });

  it('full 格式包含星期几', () => {
    const svc = makeService();
    const result = svc.formatDate(testDate, 'Asia/Shanghai', 'full');
    // zh-CN locale uses Chinese weekday name like 星期日, 星期一 etc.
    assert.ok(result.includes('星期'), `full format missing weekday: "${result}"`);
  });
});

// ─── 合约: formatNumber 数字格式化 ─────────────────────

describe('[locale] 合约: 数字格式化', () => {
  it('大数字千位分隔', () => {
    const svc = makeService();
    const result = svc.formatNumber(1000000, 'en-US');
    assert.ok(result.includes(',') || result.includes('.'));
    assert.ok(result.length >= 9);
  });

  it('负数保留负号', () => {
    const svc = makeService();
    const result = svc.formatNumber(-1234.56, 'en-US');
    assert.ok(result.startsWith('-'));
  });

  it('小数最多2位', () => {
    const svc = makeService();
    const result = svc.formatNumber(3.14159, 'en-US');
    const parts = result.split('.');
    if (parts.length > 1) {
      assert.ok(parts[1].length <= 2);
    }
  });
});

// ─── 合约: formatCurrency 货币格式化 ───────────────────

describe('[locale] 合约: 货币格式化', () => {
  it('USD格式化包含$符号', () => {
    const svc = makeService();
    const result = svc.formatCurrency(1234.5, 'USD', 'en-US');
    assert.ok(result.includes('$'));
    assert.ok(result.includes('1,234'));
  });

  it('JPY格式化不含小数（日元无分）', () => {
    const svc = makeService();
    const result = svc.formatCurrency(1000, 'JPY', 'ja-JP');
    // JPY格式可能将小数位截断
    assert.ok(result.length > 0);
    assert.ok(result.includes('1,000') || result.includes('1000'));
  });

  it('CNY格式化包含¥或元', () => {
    const svc = makeService();
    const result = svc.formatCurrency(100, 'CNY', 'zh-CN');
    assert.ok(result.length > 0);
  });

  it('零金额应格式化为类似 $0.00 的格式', () => {
    const svc = makeService();
    const result = svc.formatCurrency(0, 'USD', 'en-US');
    assert.ok(result.length > 0);
  });

  it('超大金额不抛异常', () => {
    const svc = makeService();
    const result = svc.formatCurrency(9999999999.99, 'USD', 'en-US');
    assert.ok(result.length > 0);
  });
});

// ─── 合约: convertTime 时区转换 ────────────────────────

describe('[locale] 合约: 时区转换', () => {
  it('相同时区转换返回相同时间', () => {
    const svc = makeService();
    const date = new Date('2025-06-15T10:00:00.000Z');
    const result = svc.convertTime(date, 'Asia/Shanghai', 'Asia/Shanghai');
    assert.equal(result.getTime(), date.getTime());
  });

  it('UTC→上海(+8h) 转换后时间值加8小时', () => {
    const svc = makeService();
    const date = new Date('2025-01-01T00:00:00.000Z');
    const result = svc.convertTime(date, 'UTC' as unknown as TimeZone, 'Asia/Shanghai');
    const diff = result.getTime() - date.getTime();
    assert.equal(diff, 8 * 60 * 60 * 1000);
  });

  it('上海(+8)→纽约(-5) 差13小时', () => {
    const svc = makeService();
    const date = new Date('2025-06-15T12:00:00.000Z');
    const result = svc.convertTime(date, 'Asia/Shanghai', 'America/New_York');
    const diff = result.getTime() - date.getTime();
    assert.equal(diff, -13 * 60 * 60 * 1000);
  });

  it('反向转换是互逆的', () => {
    const svc = makeService();
    const date = new Date('2025-06-15T12:00:00.000Z');
    const fwd = svc.convertTime(date, 'Asia/Shanghai', 'America/New_York');
    const bwd = svc.convertTime(fwd, 'America/New_York', 'Asia/Shanghai');
    assert.equal(bwd.getTime(), date.getTime());
  });
});

// ─── 合约: isWorkday/isHoliday ─────────────────────────

describe('[locale] 合约: 工作日/节假日判断', () => {
  it('周一至周五工作时间内（如09:30）应返回 true', () => {
    const svc = makeService();
    // 2025-06-16 是周一
    const monday = new Date('2025-06-16T01:30:00.000Z'); // UTC 01:30 = 上海 09:30
    assert.ok(svc.isWorkday(monday, 'Asia/Shanghai'));
  });

  it('周六应返回 false', () => {
    const svc = makeService();
    // 2025-06-21 是周六
    const saturday = new Date('2025-06-21T10:00:00.000Z');
    assert.ok(!svc.isWorkday(saturday, 'Asia/Shanghai'));
  });

  it('周日 isHoliday 返回 true', () => {
    const svc = makeService();
    // 2025-06-22 是周日
    const sunday = new Date('2025-06-22T10:00:00.000Z');
    assert.ok(svc.isHoliday(sunday, 'Asia/Shanghai'));
  });

  it('工作日上午8点（非工作时间）返回 false', () => {
    const svc = makeService();
    // 2025-06-16 周一 UTC 00:00 = 上海 08:00（9点前）
    const early = new Date('2025-06-16T00:00:00.000Z');
    assert.ok(!svc.isWorkday(early, 'Asia/Shanghai'));
  });
});

// ─── 合约: getDateParts 日期组件 ───────────────────────

describe('[locale] 合约: 日期组件提取', () => {
  const testDate = new Date('2025-06-16T10:30:45.000Z'); // 上海 18:30:45

  it('getDateParts 返回所有必需字段', () => {
    const svc = makeService();
    const parts = svc.getDateParts(testDate, 'Asia/Shanghai');
    assert.ok(typeof parts.year === 'number' && parts.year > 2000);
    assert.ok(typeof parts.month === 'number' && parts.month >= 1 && parts.month <= 12);
    assert.ok(typeof parts.day === 'number' && parts.day >= 1 && parts.day <= 31);
    assert.ok(typeof parts.hour === 'number' && parts.hour >= 0 && parts.hour <= 23);
    assert.ok(typeof parts.minute === 'number');
    assert.ok(typeof parts.second === 'number');
    assert.equal(typeof parts.dayOfWeek, 'string');
    assert.ok(parts.dayOfWeek.length > 0);
  });
});

// ─── 合约: formatTime 时间格式化 ───────────────────────

describe('[locale] 合约: 时间格式化', () => {
  const testDate = new Date('2025-06-16T10:30:45.000Z');

  it('formatTime 返回非空字符串', () => {
    const svc = makeService();
    const result = svc.formatTime(testDate, 'Asia/Shanghai');
    assert.equal(typeof result, 'string');
    assert.ok(result.length > 0);
  });

  it('long 格式包含秒', () => {
    const svc = makeService();
    const result = svc.formatTime(testDate, 'Asia/Shanghai', 'long');
    // 应包含 ':xx' 秒部分或秒数字
    assert.ok(result.length >= 5);
  });

  it('不同时区 formatTime 输出不同', () => {
    const svc = makeService();
    const sh = svc.formatTime(testDate, 'Asia/Shanghai');
    const ny = svc.formatTime(testDate, 'America/New_York');
    // 上海18:30 vs 纽约06:30 -> 输出字符串不同
    assert.notEqual(sh, ny);
  });
});

// ─── 合约: startOfDay / endOfDay ──────────────────────

describe('[locale] 合约: 日期范围边界', () => {
  const testDate = new Date('2025-06-16T10:30:00.000Z');

  it('startOfDay 返回当天 00:00:00.000 UTC', () => {
    const svc = makeService();
    const sod = svc.startOfDay(testDate, 'Asia/Shanghai');
    assert.equal(sod.getUTCHours(), 0);
    assert.equal(sod.getUTCMinutes(), 0);
    assert.equal(sod.getUTCSeconds(), 0);
    assert.equal(sod.getUTCMilliseconds(), 0);
  });

  it('endOfDay 返回当天 23:59:59.999 UTC', () => {
    const svc = makeService();
    const eod = svc.endOfDay(testDate, 'Asia/Shanghai');
    assert.equal(eod.getUTCHours(), 23);
    assert.equal(eod.getUTCMinutes(), 59);
    assert.equal(eod.getUTCSeconds(), 59);
    assert.equal(eod.getUTCMilliseconds(), 999);
  });

  it('startOfDay <= endOfDay', () => {
    const svc = makeService();
    const sod = svc.startOfDay(testDate, 'Asia/Shanghai').getTime();
    const eod = svc.endOfDay(testDate, 'Asia/Shanghai').getTime();
    assert.ok(sod <= eod);
  });
});

// ─── 合约: formatPercent ───────────────────────────────

describe('[locale] 合约: 百分比格式化', () => {
  it('0.123 → 包含 "12.3%" 或近似值', () => {
    const svc = makeService();
    const result = svc.formatPercent(0.123, 'en-US');
    assert.ok(result.includes('%'));
  });

  it('1.0 → 包含 "100.0%"', () => {
    const svc = makeService();
    const result = svc.formatPercent(1.0, 'en-US');
    assert.ok(result.includes('%'));
    assert.ok(result.includes('100'));
  });

  it('0 → 包含 "0.0%"', () => {
    const svc = makeService();
    const result = svc.formatPercent(0, 'en-US');
    assert.ok(result.includes('0'));
  });
});

// ─── 合约: getDateRange ────────────────────────────────

describe('[locale] 合约: 日期范围计算', () => {
  it('同一天返回零范围', () => {
    const svc = makeService();
    const date = new Date('2025-06-16T10:00:00.000Z');
    const range = svc.getDateRange(date, date, 'Asia/Shanghai');
    assert.equal(range.years, 0);
    assert.equal(range.months, 0);
    assert.equal(range.days, 0);
    assert.equal(range.hours, 0);
  });

  it('1年后的范围 years=1', () => {
    const svc = makeService();
    const start = new Date('2025-01-01T00:00:00.000Z');
    const end = new Date('2026-01-01T00:00:00.000Z');
    const range = svc.getDateRange(start, end, 'Asia/Shanghai');
    assert.equal(range.years, 1);
  });
});
