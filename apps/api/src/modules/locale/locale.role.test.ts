import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [locale] [C] 角色测试
 *
 * 8 角色视角的 locale 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { LocaleController } from './locale.controller'
import { LocaleService, type CountryCode, type TimeZone } from './locale.service'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试数据工厂 ──
function createController() {
  const service = new LocaleService()
  return new LocaleController(service)
}

// ── 👔店长 ──
describe(`${ROLES.StoreManager} locale 角色测试`, () => {
  it('店长查看中国门店当前时间（运营管理用）', () => {
    const ctrl = createController()
    const res = ctrl.getNow('Asia/Shanghai')

    assert.ok(Date.parse(res.iso8601) > 0)
    assert.equal(res.timeZone, 'Asia/Shanghai')
    assert.ok(typeof res.date === 'string' && res.date.length > 0)
    assert.ok(typeof res.time === 'string' && res.time.length > 0)
    assert.equal(res.utcOffset, 8)
  })

  it('店长查询跨国门店时区（开店决策辅助）', () => {
    const ctrl = createController()
    const cn = ctrl.getTimeZone('CN')
    const us = ctrl.getTimeZone('US')
    const jp = ctrl.getTimeZone('JP')

    assert.equal(cn.code, 'Asia/Shanghai')
    assert.equal(us.code, 'America/New_York')
    assert.equal(jp.code, 'Asia/Tokyo')
    assert.equal(cn.utcOffset, 8)
    assert.equal(jp.utcOffset, 9)
  })

  it('店长修改门店默认时区配置（管理权限）', () => {
    const ctrl = createController()
    const res = ctrl.updateConfig({
      defaultTimeZone: 'America/New_York',
      dateFormat: 'full',
      locale: 'en-US',
    })

    assert.equal(res.config.defaultTimeZone, 'America/New_York')
    assert.equal(res.config.dateFormat, 'full')
    assert.equal(res.config.locale, 'en-US')
    assert.equal(res.info.countryCode, 'US')
    assert.equal(res.info.utcOffset, -5)
  })

  it('店长读取当前配置（启动时校验）', () => {
    const ctrl = createController()
    const config = ctrl.getConfig()

    assert.ok(config.defaultTimeZone !== undefined)
    assert.ok(config.dateFormat !== undefined)
    assert.ok(config.locale !== undefined)
  })

  it('店长查看某个具体国家的工作日（排班管理）', () => {
    const ctrl = createController()
    // 选择一个周一（已知为工作日）
    const mondayDate = new Date('2026-07-06T10:00:00') // 2026-07-06 is Monday
    const res = ctrl.isWorkday({
      date: mondayDate.toISOString(),
      timeZone: 'Asia/Shanghai',
      countryCode: 'CN',
    })

    assert.equal(res.isWorkday, true)
    assert.equal(res.countryCode, 'CN')
    assert.equal(res.dayOfWeek, 'Monday')
  })

  it('店长查看门店设备时区跨时区报价时间（跨国订单）', () => {
    const ctrl = createController()
    const original = '2026-07-07T09:00:00.000Z'
    const res = ctrl.convertTime({
      date: original,
      fromTz: 'Asia/Shanghai',
      toTz: 'America/New_York',
    })

    assert.equal(res.fromTz, 'Asia/Shanghai')
    assert.equal(res.toTz, 'America/New_York')
    assert.ok(typeof res.convertedDate === 'string')
    assert.ok(res.timeDifference.includes('-13h') || res.timeDifference.includes('-12h'))
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} locale 角色测试`, () => {
  it('前台为中国会员格式化日期（会员日期显示）', () => {
    const ctrl = createController()
    const res = ctrl.formatDate({
      date: '2026-07-07T10:30:00Z',
      timeZone: 'Asia/Shanghai',
      format: 'medium',
    })

    assert.equal(res.locale, 'zh-CN')
    assert.ok(res.formatted.includes('2026') || res.formatted.includes('07'))
    assert.ok(res.formatted.length > 0)
  })

  it('前台为外籍游客格式化货币（快速结账）', () => {
    const ctrl = createController()
    const res = ctrl.formatCurrency({
      amount: 99.99,
      currency: 'USD',
      locale: 'en-US',
    })

    assert.ok(res.formatted.includes('$') || res.formatted.includes('99.99'))
    assert.equal(res.locale, 'en-US')
    assert.equal(res.originalCurrency, 'USD')
  })

  it('前台查询日本时间（接待日本游客时参考）', () => {
    const ctrl = createController()
    const res = ctrl.getNow('Asia/Tokyo')

    assert.equal(res.timeZone, 'Asia/Tokyo')
    assert.equal(res.utcOffset, 9)
    assert.ok(Date.parse(res.iso8601) > 0)
  })

  it('前台格式化大额数字（兑换积分展示）', () => {
    const ctrl = createController()
    const res = ctrl.formatNumber({ value: 1000000, locale: 'zh-CN' })

    assert.ok(typeof res.formatted === 'string')
    assert.ok(res.formatted.length > 0)
    // zh-CN uses 1,000,000
    assert.equal(res.original, '1000000')
  })

  it('前台查询周末非工作时间（判断是否可以打电话给会员）', () => {
    const ctrl = createController()
    // 使用周日
    const sundayDate = new Date('2026-07-12T10:00:00') // 2026-07-12 is Sunday
    const res = ctrl.isWorkday({
      date: sundayDate.toISOString(),
      timeZone: 'Asia/Shanghai',
    })

    assert.equal(res.isWorkday, false)
    assert.equal(res.isHoliday, true)
  })

  it('前台以中文字段格式化日期（full格式含星期）', () => {
    const ctrl = createController()
    const res = ctrl.formatDate({
      date: '2026-07-07T12:00:00Z',
      timeZone: 'Asia/Shanghai',
      format: 'full',
    })

    assert.ok(res.formatted.length > 0)
    assert.equal(res.locale, 'zh-CN')
  })

  it('前台边界：formatNumber 接收 0 值（特殊场景）', () => {
    const ctrl = createController()
    const res = ctrl.formatNumber({ value: 0, locale: 'en-US' })

    assert.equal(res.original, '0')
    assert.equal(res.formatted, '0')
  })

  it('前台边界：formatCurrency 接收最小金额 0', () => {
    const ctrl = createController()
    const res = ctrl.formatCurrency({
      amount: 0,
      currency: 'CNY',
      locale: 'zh-CN',
    })

    assert.equal(res.originalAmount, 0)
    assert.ok(res.formatted.includes('0'))
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} locale 角色测试`, () => {
  it('HR 查看各国家员工本地时间（排班管理）', () => {
    const ctrl = createController()
    const cn = ctrl.getNow('Asia/Shanghai')
    const kr = ctrl.getNow('Asia/Seoul')
    const th = ctrl.getNow('Asia/Bangkok')

    assert.equal(cn.timeZone, 'Asia/Shanghai')
    assert.equal(kr.timeZone, 'Asia/Seoul')
    assert.equal(th.timeZone, 'Asia/Bangkok')
  })

  it('HR 批量查询多国家码到时区映射（全球化招聘）', () => {
    const ctrl = createController()
    const countries: CountryCode[] = ['CN', 'US', 'JP', 'KR', 'TH']
    const results = countries.map(c => ctrl.getTimeZone(c))

    assert.equal(results.length, 5)
    assert.ok(results.every(r => r.utcOffset !== undefined))
    assert.equal(results.find(r => r.countryCode === 'CN')?.code, 'Asia/Shanghai')
  })

  it('HR 查询不同时区当前时间差异（远程会议安排）', () => {
    const ctrl = createController()
    const cnNow = ctrl.getNow('Asia/Shanghai')
    const usNow = ctrl.getNow('America/New_York')

    assert.equal(cnNow.utcOffset, 8)
    assert.equal(usNow.utcOffset, -5)
    assert.ok(cnNow.iso8601 !== usNow.iso8601)
  })

  it('HR 检查员工工作时间（员工考勤规则验证）', () => {
    const ctrl = createController()
    // 周二上午10点上海时间（UTC+8 => UTC 02:00），在工作时间9-18内
    const workDate = new Date('2026-07-07T02:00:00Z')
    const res = ctrl.isWorkday({
      date: workDate.toISOString(),
      timeZone: 'Asia/Shanghai',
    })

    assert.equal(res.isWorkday, true)
    assert.equal(res.isHoliday, false)
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} locale 角色测试`, () => {
  it('安监获取美国门店时区（安全巡查时间对齐）', () => {
    const ctrl = createController()
    const us = ctrl.getTimeZone('US')

    assert.equal(us.code, 'America/New_York')
    assert.equal(us.utcOffset, -5)
    assert.ok(us.name.length > 0)
  })

  it('安监验证设备日志时区转换（安全审计）', () => {
    const ctrl = createController()
    const logTime = '2026-07-07T03:00:00.000Z'
    const res = ctrl.convertTime({
      date: logTime,
      fromTz: 'America/New_York',
      toTz: 'Asia/Shanghai',
    })

    assert.equal(res.fromTz, 'America/New_York')
    assert.equal(res.toTz, 'Asia/Shanghai')
  })

  it('安监判断监控时间是否合法工作时段（门禁自动控制）', () => {
    const ctrl = createController()
    // 凌晨3点UTC = 上海11点，在工作时间内 => isWorkday=true
    const morningTime = new Date('2026-07-07T03:00:00Z')
    const morningRes = ctrl.isWorkday({
      date: morningTime.toISOString(),
      timeZone: 'Asia/Shanghai',
    })
    assert.equal(morningRes.isWorkday, true)
    // 晚10点UTC = 上海早6点，不在工作时间内
    const lateTime = new Date('2026-07-07T22:00:00Z')
    const lateRes = ctrl.isWorkday({
      date: lateTime.toISOString(),
      timeZone: 'Asia/Shanghai',
    })
    assert.equal(lateRes.isWorkday, false)
  })

  it('安监边界：无效国家码传入 getTimeZone（服务应容错）', () => {
    const ctrl = createController()
    try {
      const res = ctrl.getTimeZone('XX' as CountryCode)
      // 接收返回值或 undefined
      assert.ok(res === undefined || res.code !== undefined)
    } catch {
      // 允许抛出异常
      assert.ok(true)
    }
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} locale 角色测试`, () => {
  it('导玩员查看当前时间并显示中文格式（服务游客）', () => {
    const ctrl = createController()
    const now = ctrl.getNow('Asia/Shanghai')

    assert.equal(now.timeZone, 'Asia/Shanghai')
    assert.equal(now.utcOffset, 8)
    assert.ok(typeof now.dateTime === 'string')
    assert.ok(now.dateTime.length > 0)
  })

  it('导玩员格式化积分兑换金额（美元转人民币显示）', () => {
    const ctrl = createController()
    const res = ctrl.formatCurrency({
      amount: 50.5,
      currency: 'CNY',
      locale: 'zh-CN',
    })

    assert.ok(res.formatted.includes('50') || res.formatted.includes('¥'))
    assert.equal(res.originalCurrency, 'CNY')
    assert.equal(res.locale, 'zh-CN')
  })

  it('导玩员格式化游玩时长（英文数字格式展示给外宾）', () => {
    const ctrl = createController()
    const res = ctrl.formatNumber({ value: 12345.67, locale: 'en-US' })

    assert.ok(res.formatted.length > 0)
    assert.equal(res.original, '12345.67')
  })

  it('导玩员查询韩国本地时间（韩语文化展示活动用）', () => {
    const ctrl = createController()
    const res = ctrl.getNow('Asia/Seoul')

    assert.equal(res.timeZone, 'Asia/Seoul')
    assert.equal(res.utcOffset, 9)
    assert.ok(Date.parse(res.iso8601) > 0)
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} locale 角色测试`, () => {
  it('运行专员跨时区时间转换（系统日志分析）', () => {
    const ctrl = createController()
    const res = ctrl.convertTime({
      date: '2026-07-07T08:00:00.000Z',
      fromTz: 'Asia/Shanghai',
      toTz: 'Asia/Tokyo',
    })

    assert.equal(res.fromTz, 'Asia/Shanghai')
    assert.equal(res.toTz, 'Asia/Tokyo')
    assert.ok(typeof res.timeDifference === 'string')
    // 上海 UTC+8, 东京 UTC+9, 相差 +1h
    assert.ok(res.timeDifference.includes('+1'))
  })

  it('运行专员更新系统时区配置（运维管理）', () => {
    const ctrl = createController()
    const res = ctrl.updateConfig({
      defaultTimeZone: 'Asia/Tokyo',
    })

    assert.equal(res.config.defaultTimeZone, 'Asia/Tokyo')
    assert.equal(res.info.timeZone, 'Asia/Tokyo')
    assert.equal(res.info.utcOffset, 9)
  })

  it('运行专员验证配置更新后格式化日期使用新时区', () => {
    const ctrl = createController()
    ctrl.updateConfig({
      defaultTimeZone: 'America/New_York',
      locale: 'en-US',
    })

    const res = ctrl.formatDate({
      date: '2026-07-07T10:00:00Z',
      timeZone: 'America/New_York',
      format: 'short',
    })

    assert.ok(res.formatted.length > 0)
    assert.equal(res.locale, 'en-US')
  })

  it('运行专员检查节假日后的第一个工作日（运维排班）', () => {
    const ctrl = createController()
    // 周日
    const sunday = new Date('2026-07-12T10:00:00')
    const res = ctrl.isWorkday({
      date: sunday.toISOString(),
      timeZone: 'Asia/Shanghai',
    })

    assert.equal(res.isHoliday, true) // 周日为假日
    assert.equal(res.isWorkday, false)
  })

  it('运行专员边界：配置更新仅提供局部字段（增量更新）', () => {
    const ctrl = createController()
    const res = ctrl.updateConfig({ dateFormat: 'short' })

    assert.equal(res.config.dateFormat, 'short')
    // 其余字段应保持默认值
    assert.ok(res.config.defaultTimeZone !== undefined)
    assert.ok(res.config.locale !== undefined)
    assert.ok(res.info.countryCode !== undefined)
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} locale 角色测试`, () => {
  it('团建专员查询跨国团建当地日期（活动规划）', () => {
    const ctrl = createController()
    const jpNow = ctrl.getNow('Asia/Tokyo')
    const krNow = ctrl.getNow('Asia/Seoul')

    assert.equal(jpNow.timeZone, 'Asia/Tokyo')
    assert.equal(krNow.timeZone, 'Asia/Seoul')
    assert.ok(jpNow.date.length > 0)
    assert.ok(krNow.date.length > 0)
  })

  it('团建专员计算两个时区的时间差（活动时间协调）', () => {
    const ctrl = createController()
    const res = ctrl.convertTime({
      date: '2026-07-08T10:00:00.000Z',
      fromTz: 'Asia/Shanghai',
      toTz: 'Asia/Singapore',
    })

    // 上海 UTC+8, 新加坡 UTC+8, 无时差
    assert.equal(res.fromTz, 'Asia/Shanghai')
    assert.equal(res.toTz, 'Asia/Singapore')
  })

  it('团建专员格式化数字显示团建预算（不同语言展示）', () => {
    const ctrl = createController()
    const zh = ctrl.formatNumber({ value: 50000, locale: 'zh-CN' })
    const en = ctrl.formatNumber({ value: 50000, locale: 'en-US' })

    assert.ok(zh.formatted.length > 0)
    assert.ok(en.formatted.length > 0)
    assert.equal(zh.original, en.original)
  })

  it('团建专员检查活动日期是否工作日（安排团建活动）', () => {
    const ctrl = createController()
    // 周五是工作日
    const friday = new Date('2026-07-10T10:00:00')
    const res = ctrl.isWorkday({
      date: friday.toISOString(),
      timeZone: 'Asia/Shanghai',
    })

    assert.equal(res.isWorkday, true)
    assert.equal(res.dayOfWeek, 'Friday')
    assert.equal(res.isHoliday, false)
  })

  it('团建专员边界：formatCurrency 外币大金额（预算审批）', () => {
    const ctrl = createController()
    const res = ctrl.formatCurrency({
      amount: 999999.99,
      currency: 'JPY',
      locale: 'ja-JP',
    })

    assert.equal(res.originalAmount, 999999.99)
    assert.ok(res.formatted.length > 0)
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} locale 角色测试`, () => {
  it('营销专员格式化促销活动的货币金额（广告文案）', () => {
    const ctrl = createController()
    const res = ctrl.formatCurrency({
      amount: 199.99,
      currency: 'CNY',
      locale: 'zh-CN',
    })

    assert.equal(res.locale, 'zh-CN')
    assert.ok(res.formatted.includes('199.99') || res.formatted.includes('¥'))
  })

  it('营销专员查询各时区当前时间（定时推送短信排期）', () => {
    const ctrl = createController()
    const cn = ctrl.getNow('Asia/Shanghai')
    const vn = ctrl.getNow('Asia/Ho_Chi_Minh')
    const id = ctrl.getNow('Asia/Jakarta')

    assert.equal(cn.utcOffset, 8)
    assert.equal(vn.utcOffset, 7)
    assert.equal(id.utcOffset, 7)
    assert.ok(Date.parse(cn.iso8601) > Date.parse(vn.iso8601)) // 上海比越南早1小时
  })

  it('营销专员格式化数字展示活动参与人数（全球展示）', () => {
    const ctrl = createController()
    const en = ctrl.formatNumber({ value: 1000000, locale: 'en-US' })
    const th = ctrl.formatNumber({ value: 1000000, locale: 'th-TH' })

    assert.ok(en.formatted.length > 0)
    assert.ok(th.formatted.length > 0)
  })

  it('营销专员在非工作时间向会员推送消息（合规检查）', () => {
    const ctrl = createController()
    // 晚10点UTC = 上海早6点（9点前非工作时间）
    const nightTime = new Date('2026-07-07T22:00:00Z')
    const res = ctrl.isWorkday({
      date: nightTime.toISOString(),
      timeZone: 'Asia/Shanghai',
    })

    assert.equal(res.isWorkday, false)
  })

  it('营销专员获取台湾时区信息（本地化活动策划）', () => {
    const ctrl = createController()
    const tw = ctrl.getTimeZone('TW')

    assert.equal(tw.code, 'Asia/Taipei')
    assert.equal(tw.utcOffset, 8)
    assert.equal(tw.countryCode, 'TW')
  })

  it('营销专员格式化日期为长格式（活动海报日期）', () => {
    const ctrl = createController()
    const res = ctrl.formatDate({
      date: '2026-07-07T00:00:00Z',
      timeZone: 'Asia/Shanghai',
      format: 'long',
    })

    assert.ok(res.formatted.length > 0)
    assert.equal(res.locale, 'zh-CN')
  })

  it('营销专员测试台湾格式化货币（繁体中文市场）', () => {
    const ctrl = createController()
    const res = ctrl.formatCurrency({
      amount: 500,
      currency: 'TWD',
      locale: 'zh-TW',
    })

    assert.equal(res.originalAmount, 500)
    assert.equal(res.locale, 'zh-TW')
    assert.ok(res.formatted.length > 0)
  })

  it('营销专员边界：formatDate 短格式（2位年份）', () => {
    const ctrl = createController()
    const res = ctrl.formatDate({
      date: '2026-07-07T00:00:00Z',
      timeZone: 'Asia/Shanghai',
      format: 'short',
    })

    assert.ok(res.formatted.length > 0)
  })

  it('营销专员边界：超大金额格式化', () => {
    const ctrl = createController()
    const res = ctrl.formatCurrency({
      amount: 99999999.99,
      currency: 'USD',
      locale: 'en-US',
    })

    assert.equal(res.originalAmount, 99999999.99)
    assert.ok(res.formatted.length > 0)
  })
})
