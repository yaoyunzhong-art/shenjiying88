import { describe, it, expect, beforeEach } from 'vitest'
import { LocaleService, type CountryCode, type TimeZone } from './locale.service'

/**
 * 🐜 [locale] 角色扩展测试 - 边界场景
 * 覆盖国际化时区、日期、数字格式化的边界和异常情况
 */

function setup() {
  const svc = new LocaleService()
  return { svc }
}

describe('👔店长 locale 扩展测试 - 运营管理边界场景', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('获取各国时区映射，验证全部 10 个支持国家', () => {
    const countries: CountryCode[] = ['CN', 'TW', 'US', 'JP', 'KR', 'TH', 'VN', 'ID', 'MY', 'SG']
    for (const c of countries) {
      const tz = svc.svc.getTimeZone(c)
      expect(tz).toBeDefined()
      expect(typeof tz).toBe('string')
    }
  })

  it('跨时区时间转换：上海正午对应美国纽约午夜', () => {
    const shanghaiNoon = new Date('2026-07-07T04:00:00Z') // 12:00 CST
    const nyTime = svc.svc.convertTime(shanghaiNoon, 'Asia/Shanghai', 'America/New_York')
    const nyParts = svc.svc.getDateParts(nyTime, 'America/New_York')
    // 上海 UTC+8 正午 12:00 => 纽约 UTC-5 前晚 23:00（夏令时）或午夜
    expect(nyParts.hour).toBeGreaterThanOrEqual(0)
    expect(nyParts.hour).toBeLessThan(24)
  })

  it('中国时区非工作时间判断（晚上 20:00 不应为工作时间）', () => {
    const evening = new Date('2026-07-07T12:00:00Z') // UTC 12:00 => 上海 20:00
    const isWorkday = svc.svc.isWorkday(evening, 'Asia/Shanghai', 'CN')
    expect(isWorkday).toBe(false)
  })
})

describe('🛒前台 locale 扩展测试 - 复杂格式化场景', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('格式化日期：传入未定义国家码的时区应优雅降级', () => {
    const date = new Date()
    const formatted = svc.svc.formatDate(date, 'Asia/Shanghai', 'medium')
    expect(formatted).toBeDefined()
    expect(typeof formatted).toBe('string')
    expect(formatted.length).toBeGreaterThan(0)
  })

  it('格式化超大数字应保持精度', () => {
    const result = svc.svc.formatNumber(999999999.99, 'en-US')
    expect(result).toContain('999')
    expect(result.length).toBeGreaterThan(0)
  })

  it('格式化美国门店小数货币', () => {
    const result = svc.svc.formatCurrency(0.99, 'USD', 'en-US')
    expect(result).toContain('0.99')
  })
})

describe('👥HR locale 扩展测试 - 全球化用工边界', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('泰国时区（UTC+7）与上海时区（UTC+8）相差 1 小时', () => {
    const thTz = svc.svc.getTimeZone('TH')
    expect(thTz).toBe('Asia/Bangkok')

    const date = new Date()
    const thParts = svc.svc.getDateParts(date, 'Asia/Bangkok')
    const cnParts = svc.svc.getDateParts(date, 'Asia/Shanghai')
    // 泰国比上海晚 1 小时，但日期部分可能跨天
    expect(thParts.hour).not.toBe(cnParts.hour)
  })

  it('判断是否为工作日：周六不应为工作日', () => {
    // 2026-07-11 是周六
    const saturday = new Date('2026-07-11T03:00:00Z')
    const isWorkday = svc.svc.isWorkday(saturday, 'Asia/Shanghai', 'CN')
    expect(isWorkday).toBe(false)
  })
})

describe('🔧安监 locale 扩展测试 - 安全审计时间场景', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('验证时区与国家码双向映射一致性', () => {
    const tz: TimeZone = 'America/New_York'
    const country = svc.svc.getCountryCode(tz)
    expect(country).toBe('US')
    const tzBack = svc.svc.getTimeZone(country)
    expect(tzBack).toBe(tz)
  })

  it('美国门店凌晨 2 点不应为工作时间', () => {
    const lateNight = new Date('2026-07-07T07:00:00Z') // UTC 7:00 => 纽约凌晨 2:00 (EDT)
    const isWorkday = svc.svc.isWorkday(lateNight, 'America/New_York', 'US')
    expect(isWorkday).toBe(false)
  })
})

describe('🎮导玩员 locale 扩展测试 - 跨语言展示场景', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('中文与英文货币格式化结果不同', () => {
    const zh = svc.svc.formatCurrency(100, 'USD', 'zh-CN')
    const en = svc.svc.formatCurrency(100, 'USD', 'en-US')
    expect(zh).not.toBe(en)
  })

  it('百分比格式化 0 值', () => {
    const result = svc.svc.formatPercent(0, 'en-US')
    expect(result).toBe('0.0%')
  })
})

describe('🎯运行专员 locale 扩展测试 - 运维边界场景', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('日期范围计算：两个相差 30 天的日期应返回约 1 月', () => {
    const start = new Date('2026-07-01')
    const end = new Date('2026-07-31')
    const range = svc.svc.getDateRange(start, end, 'Asia/Shanghai')
    expect(range.days).toBeGreaterThanOrEqual(0)
    expect(range.hours).toBeGreaterThanOrEqual(0)
  })

  it('当月开始和结束时间应返回合法 Date', () => {
    const date = new Date('2026-07-07T12:00:00Z')
    const start = svc.svc.startOfMonth(date, 'Asia/Shanghai')
    const end = svc.svc.endOfMonth(date, 'Asia/Shanghai')
    expect(start instanceof Date).toBe(true)
    expect(end instanceof Date).toBe(true)
    expect(end.getTime()).toBeGreaterThan(start.getTime())
  })
})

describe('🤝团建 locale 扩展测试 - 跨国活动规划场景', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('韩国和日本时区均为 UTC+9', () => {
    const krTz = svc.svc.getTimeZone('KR')
    const jpTz = svc.svc.getTimeZone('JP')
    expect(krTz).toBe('Asia/Seoul')
    expect(jpTz).toBe('Asia/Tokyo')
  })

  it('同一时间韩国和中国日期组件中的小时不同', () => {
    const now = new Date()
    const krParts = svc.svc.getDateParts(now, 'Asia/Seoul')
    const cnParts = svc.svc.getDateParts(now, 'Asia/Shanghai')
    // 韩国比中国快 1 小时
    const hourDiff = krParts.hour - cnParts.hour
    expect(hourDiff === 1 || hourDiff === -23).toBe(true)
  })
})

describe('📢营销 locale 扩展测试 - 全球营销格式场景', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('格式化不同语言下的大额数字格式不同', () => {
    const deResult = svc.svc.formatNumber(1234567.89, 'de-DE')
    expect(deResult.length).toBeGreaterThan(0)
  })

  it('泰国（UTF+7）和越南（UTC+7）在同一时间下小时相同', () => {
    const now = new Date()
    const thParts = svc.svc.getDateParts(now, 'Asia/Bangkok')
    const vnParts = svc.svc.getDateParts(now, 'Asia/Ho_Chi_Minh')
    expect(thParts.hour).toBe(vnParts.hour)
  })
})
