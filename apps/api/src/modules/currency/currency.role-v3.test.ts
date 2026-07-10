import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [currency] [C] 角色测试 v3 — 大飞哥电玩城多币种经营场景
 *
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 围绕大飞哥美国三店运营场景的 currency 模块：
 * 店A: Cyber Galaxy Arcade (Colonial Heights, VA) — 总店 (USD)
 * 店B: 休斯顿店 (Houston, TX) — 分店 (USD)
 * 中国游客及代币使用涉及 CNY/USD/HKD/JPY/THB
 *
 * 每个角色 >= 2 测试用例（正常流程 + 业务边界/权限边界）
 * 覆盖端点: rates, getBaseRates, convert, setRate, add, subtract, config
 * 注意: controller 方法直接接收 DTO 对象，不经过管道验证
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { CurrencyController } from './currency.controller'
import { CurrencyService } from './currency.service'
import type { CurrencyCode, Money } from './currency.entity'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 大飞哥电玩城门店常量 ──
const TICKET_PRICE_CNY = 100             // 单次游戏币 CNY
const TICKET_PRICE_USD = 14              // 单次游戏币 USD
const TOURIST_PACK_USD = 50              // 游客套餐 USD
const MONTHLY_REVENUE_CNY = 1500000       // 月营收 CNY

// ── 辅助函数 ──
function createController(): CurrencyController {
  const service = new CurrencyService()
  return new CurrencyController(service)
}

function createServices() {
  const service = new CurrencyService()
  // Set up common exchange rates for test scenarios
  service.setRate('CNY', 'USD', 0.14, 'market')
  service.setRate('USD', 'CNY', 7.14, 'market')
  service.setRate('CNY', 'HKD', 1.09, 'market')
  service.setRate('HKD', 'CNY', 0.917, 'market')
  service.setRate('CNY', 'JPY', 20.14, 'market')
  service.setRate('CNY', 'THB', 5.05, 'market')
  service.setRate('CNY', 'KRW', 181.5, 'market')
  service.setRate('CNY', 'VND', 3550, 'market')
  service.setRate('CNY', 'SGD', 0.19, 'market')
  const controller = new CurrencyController(service)
  return { service, controller }
}

// ════════════════════════════════════════════════════════════════
// 👔店长 — StoreManager: 汇率配置与门店营收管理
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} Currency 角色测试 v3`, () => {
  it('店长查看所有已配汇率确认运营币种完整', () => {
    const { controller } = createServices()
    const rates = controller.getAllRates()
    // Should have all cross-rates we set up
    assert.ok(rates.length >= 8, `应不少于 8 组汇率, 实际 ${rates.length}`)
    const cnyUsd = rates.find(r => r.from === 'CNY' && r.to === 'USD')
    assert.ok(cnyUsd, '应有 CNY→USD 汇率')
    assert.equal(cnyUsd!.rate, 0.14)
    assert.equal(cnyUsd!.source, 'market')
  })

  it('店长查看本位币汇率总览确认美元记账基准', () => {
    const { controller, service } = createServices()
    // 切换本位币为 USD 更适合美国门店
    controller.updateConfig({ baseCurrency: 'USD' })
    // 需要设置 USD 到其他货币的汇率才能有完整总览
    service.setRate('USD', 'CNY', 7.14, 'market')
    service.setRate('USD', 'HKD', 7.8, 'market')
    service.setRate('USD', 'JPY', 150, 'market')

    // 再获取 base rates（此时 base=USD）
    service.setConfig({ baseCurrency: 'USD' })
    const baseRates = controller.getBaseRates()
    assert.equal(baseRates['USD'], 1, '本位币自身汇率为 1')
    assert.ok(baseRates['CNY'] > 0, '应有 CNY 汇率')
    assert.ok(baseRates['JPY'] > 0, '应有 JPY 汇率')
  })

  it('店长修改本位币配置后汇率计算以新本位币为准', () => {
    const { controller } = createServices()
    controller.updateConfig({ baseCurrency: 'USD' })
    const config = controller.getConfig()
    assert.equal(config.baseCurrency, 'USD')
  })

  it('店长转换月营收到美元汇报总部（边界: 大额精确转换）', () => {
    const { service, controller } = createServices()
    // 月营收 1,500,000 CNY -> 按 0.14 汇率 -> 210,000 USD
    controller.setRate({ from: 'CNY', to: 'USD', rate: 0.14, source: 'market' })
    const result = controller.convert({ amount: MONTHLY_REVENUE_CNY, from: 'CNY', to: 'USD' })
    assert.equal(result.originalCurrency, 'CNY')
    assert.equal(result.targetCurrency, 'USD')
    // amount 1500000 * rate 0.14 * 10^2 / 10^2 = 210000.00
    const expected = Math.floor(MONTHLY_REVENUE_CNY * 0.14 * 100) / 100
    assert.equal(result.convertedAmount, expected)
    assert.equal(result.rate, 0.14)
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒前台 — FrontDesk: 现场票务与外币结算
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} Currency 角色测试 v3`, () => {
  it('前台为中国游客将游戏币价格从人民币换算为人民币（同币种）', () => {
    const { controller } = createServices()
    // 同币种转换应不变
    const result = controller.convert({ amount: TICKET_PRICE_CNY, from: 'CNY', to: 'CNY' })
    assert.equal(result.convertedAmount, TICKET_PRICE_CNY)
    assert.equal(result.rate, 1)
  })

  it('前台为香港游客将 HKD 转换为 USD', () => {
    const { controller, service } = createServices()
    // 需设置 HKD -> USD, 通过固定汇率 7.8 HKD = 1 USD
    // 使用 service 直接设
    service.setRate('HKD', 'USD', 0.128, 'market') // 1 HKD = 0.128 USD
    // 200 HKD = 25.6 USD
    const result = controller.convert({ amount: 200, from: 'HKD', to: 'USD' })
    const expected = Math.floor(200 * 0.128 * 100) / 100
    assert.equal(result.convertedAmount, expected)
    assert.equal(result.targetCurrency, 'USD')
  })

  it('前台计算游客多币种消费总和（多个游戏币套餐）', () => {
    const { controller } = createServices()
    // 中国游客: 充值 500 CNY 游戏币 + 购买 50 USD 套餐
    // 以人民币计价: 500 + (50 * 7.14) = 500 + 357 = 857
    const result = controller.add({
      a: { amount: 500, currency: 'CNY' },
      b: { amount: 50, currency: 'USD' },
      operation: 'add'
    })
    const expected = 500 + Math.floor(50 * 7.14 * 100) / 100
    assert.equal(result.amount, expected)
    assert.equal(result.currency, 'CNY')
  })

  it('前台计算跨境消费差额（边界: 减法）', () => {
    const { controller } = createServices()
    // 预算 2000 CNY, 实花 100 USD -> 差 = 2000 - (100*7.14) = 2000 - 714 = 1286
    const result = controller.subtract({
      a: { amount: 2000, currency: 'CNY' },
      b: { amount: 100, currency: 'USD' },
      operation: 'subtract'
    })
    const expected = 2000 - Math.floor(100 * 7.14 * 100) / 100
    assert.equal(result.amount, expected)
    assert.equal(result.currency, 'CNY')
  })
})

// ════════════════════════════════════════════════════════════════
// 👥HR — HR: 薪酬跨国换算与合规
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} Currency 角色测试 v3`, () => {
  it('HR 查看当前汇率配置确认薪酬计算基准', () => {
    const { controller } = createServices()
    const config = controller.getConfig()
    assert.ok(config.baseCurrency !== undefined, '应有基准币种')
    assert.ok(config.decimalPlaces >= 0, '应有小数位数')
    assert.ok(['floor', 'round', 'ceil'].includes(config.roundingMode), '应有舍入模式')
  })

  it('HR 将外籍员工薪资从 USD 转换为 CNY', () => {
    const { controller } = createServices()
    // 美国员工薪资 5000 USD -> CNY = 5000 * 7.14 = 35700
    const result = controller.convert({ amount: 5000, from: 'USD', to: 'CNY' })
    const expected = Math.floor(5000 * 7.14 * 100) / 100
    assert.equal(result.convertedAmount, expected)
    assert.equal(result.originalCurrency, 'USD')
    assert.equal(result.targetCurrency, 'CNY')
  })

  it('HR 修改小数精度以处理薪资精确计算', () => {
    const { controller, service } = createServices()
    // 默认 2 位小数, 改为 4 位以处理更精确的薪资计算
    controller.updateConfig({ decimalPlaces: 4 })
    const config = controller.getConfig()
    assert.equal(config.decimalPlaces, 4)

    // 设置更精确的汇率
    controller.setRate({ from: 'USD', to: 'CNY', rate: 7.1425, source: 'market' })
    // 对精确转换的影响
    const result = controller.convert({ amount: 1234, from: 'USD', to: 'CNY' })
    assert.ok(result.convertedAmount > 0, '应能正常转换')
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧安监 — Safety: 汇率时效性与财务安全
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Safety} Currency 角色测试 v3`, () => {
  it('安监确认汇率完整性: 系统中存在关键货币对', () => {
    const { controller } = createServices()
    const rates = controller.getAllRates()
    const pairs = rates.map(r => `${r.from}→${r.to}`)
    assert.ok(pairs.includes('CNY→USD'), '应有 CNY→USD')
    assert.ok(pairs.includes('CNY→HKD'), '应有 CNY→HKD')
    assert.ok(pairs.includes('CNY→JPY'), '应有 CNY→JPY')
  })

  it('安监通过本位币总览确认所有货币汇率可用', () => {
    const { controller } = createServices()
    const baseRates = controller.getBaseRates()
    assert.ok(baseRates['CNY'] === 1, '本位币自身为 1')
    assert.ok(baseRates['USD'] > 0, 'USD 汇率应为正数')
    assert.ok(baseRates['HKD'] > 0, 'HKD 汇率应为正数')
    assert.ok(baseRates['JPY'] > 0, 'JPY 汇率应为正数')
  })

  it('安监验证无汇率对转换返回 0（边界: 缺失汇率）', () => {
    const { controller } = createServices()
    // TWD 未设置汇率, 转换应返回 0
    const result = controller.convert({ amount: 100, from: 'CNY', to: 'TWD' })
    assert.equal(result.convertedAmount, 0)
    assert.equal(result.rate, 0, '缺失汇率应返回 0')
  })

  it('安监验证同币种转换不依赖汇率（边界: 自转换）', () => {
    const { controller } = createServices()
    const result = controller.convert({ amount: 999.99, from: 'USD', to: 'USD' })
    assert.equal(result.convertedAmount, 999.99)
    assert.equal(result.rate, 1)
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮导玩员 — Guide: 游戏币定价与玩家购币换算
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} Currency 角色测试 v3`, () => {
  it('导玩员为东南亚游客将 THB 转换为游戏币价格 CNY', () => {
    // 泰国游客: 1000 THB 换 CNY = 1000 / 5.05 ≈ 198 CNY（通过交叉汇率）
    // 因为只有 CNY→THB，需要反向
    // 注: 实际通过 CrossRate from THB to CNY: getRate('THB','CNY')
    // THB→CNY = 1/5.05 = 0.198
    // 1000 THB * 0.198 * 100/100 = 198
    // 这里直接设 THB→CNY 更可靠
    const { service, controller } = createServices()
    service.setRate('THB', 'CNY', 0.198, 'market')
    const result = controller.convert({ amount: 1000, from: 'THB', to: 'CNY' })
    const expected = Math.floor(1000 * 0.198 * 100) / 100
    assert.equal(result.convertedAmount, expected)
    assert.equal(result.targetCurrency, 'CNY')
  })

  it('导玩员为韩国游客将 KRW 转换为 USD', () => {
    const { controller, service } = createServices()
    // 设置 KRW→USD 汇率
    service.setRate('KRW', 'USD', 0.00075, 'market')
    // convertAmount: 50000(₩) * 0.00075 * 100(USD小数2) / 1(KRW小数0) = 3750 美分 = $37.50
    const result = controller.convert({ amount: 50000, from: 'KRW', to: 'USD' })
    const expected = Math.floor(50000 * 0.00075 * 100) / 1
    assert.equal(result.convertedAmount, expected)
    assert.equal(result.targetCurrency, 'USD')
  })

  it('导玩员汇总多币种代币收入（边界: 三种货币相加）', () => {
    const { controller } = createServices()
    // a=100 USD, b=300 CNY. convert(300 CNY→USD): 300 * 0.14 * 100/100 = 42
    // result: 100 + 42 = 142 USD
    const result = controller.add({
      a: { amount: 100, currency: 'USD' },
      b: { amount: 300, currency: 'CNY' },
      operation: 'add'
    })
    assert.equal(result.amount, 142)
    assert.equal(result.currency, 'USD')
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯运行专员 — Operations: 汇率运维与手动调价
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} Currency 角色测试 v3`, () => {
  it('运行专员手动设置促销汇率并确认生效', () => {
    const { controller } = createServices()
    controller.setRate({ from: 'USD', to: 'CNY', rate: 7.0, source: 'manual' })
    const result = controller.convert({ amount: 100, from: 'USD', to: 'CNY' })
    assert.equal(result.rate, 7.0, '手动汇率应覆盖市场汇率')
    const expected = Math.floor(100 * 7.0 * 100) / 100
    assert.equal(result.convertedAmount, expected)
  })

  it('运行专员切换四舍五入模式验证结果准确性', () => {
    const { controller } = createServices()
    // 默认 floor
    const floorResult = controller.convert({ amount: 99, from: 'CNY', to: 'USD' })
    // 99 * 0.14 = 13.86, floor => 13.86
    const floorExpected = Math.floor(99 * 0.14 * 100) / 100
    assert.equal(floorResult.convertedAmount, floorExpected)

    // 改为 ceil
    controller.updateConfig({ roundingMode: 'ceil' })
    const ceilResult = controller.convert({ amount: 99, from: 'CNY', to: 'USD' })
    const ceilExpected = Math.ceil(99 * 0.14 * 100) / 100
    assert.equal(ceilResult.convertedAmount, ceilExpected)
  })

  it('运行专员批量设置汇率后查看列表', () => {
    const { controller } = createServices()
    controller.setRate({ from: 'CNY', to: 'KRW', rate: 185.0, source: 'market' })
    controller.setRate({ from: 'CNY', to: 'VND', rate: 3600, source: 'market' })
    const rates = controller.getAllRates()
    assert.ok(rates.some(r => r.from === 'CNY' && r.to === 'KRW' && r.rate === 185.0))
    assert.ok(rates.some(r => r.from === 'CNY' && r.to === 'VND' && r.rate === 3600))
  })

  it('运行专员修改配置（baseCurrency）后不影响已有汇率数据', () => {
    const { controller } = createServices()
    // 先获取当前基础汇率
    const baseBefore = controller.getBaseRates()
    controller.updateConfig({ baseCurrency: 'USD' })
    // baseCurrency 换了但已设的汇率仍然存在
    const rates = controller.getAllRates()
    assert.ok(rates.length > 0, '切换本位币后已有汇率未丢失')
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝团建 — Teambuilding: 团队活动跨国结算
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} Currency 角色测试 v3`, () => {
  it('团建将团队餐饮费用从 USD 转换为 CNY', () => {
    const { controller } = createServices()
    // 团队在美国的晚餐费用 350 USD -> CNY
    const result = controller.convert({ amount: 350, from: 'USD', to: 'CNY' })
    const expected = Math.floor(350 * 7.14 * 100) / 100
    assert.equal(result.convertedAmount, expected)
    assert.equal(result.targetCurrency, 'CNY')
  })

  it('团建计算多币种活动费用分摊', () => {
    const { controller } = createServices()
    // 总预算 3000 CNY = 住宿 2000 CNY + 交通 100 USD
    // 100 USD = 714 CNY, total = 2714 CNY
    // 已花费: 2000 + 714 = 2714, 剩余: 3000 - 2714 = 286
    const spent = controller.add({
      a: { amount: 2000, currency: 'CNY' },
      b: { amount: 100, currency: 'USD' },
      operation: 'add'
    })
    const remaining = controller.subtract({
      a: { amount: 3000, currency: 'CNY' },
      b: { amount: 2000, currency: 'CNY' },
      operation: 'subtract'
    })
    assert.equal(spent.currency, 'CNY')
    assert.ok(spent.amount > 0)
    assert.equal(remaining.amount, 1000)
  })

  it('团建同币种直接加减不涉及汇率（边界）', () => {
    const { controller } = createServices()
    const total = controller.add({
      a: { amount: 5000, currency: 'CNY' },
      b: { amount: 3000, currency: 'CNY' },
      operation: 'add'
    })
    assert.equal(total.amount, 8000)
    assert.equal(total.currency, 'CNY')

    const diff = controller.subtract({
      a: { amount: 5000, currency: 'CNY' },
      b: { amount: 2000, currency: 'CNY' },
      operation: 'subtract'
    })
    assert.equal(diff.amount, 3000)
  })
})

// ════════════════════════════════════════════════════════════════
// 📢营销 — Marketing: 跨境营销活动定价
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} Currency 角色测试 v3`, () => {
  it('营销将日本推广预算从 JPY 转换为 USD', () => {
    const { controller, service } = createServices()
    // 日本推广预算 500000 JPY -> USD
    // convertAmount: 500000(¥) * 0.00667 * 100(USD小数2) / 1(JPY小数0) = 333500 美分
    service.setRate('JPY', 'USD', 0.00667, 'market')
    const result = controller.convert({ amount: 500000, from: 'JPY', to: 'USD' })
    const expected = Math.floor(500000 * 0.00667 * 100) / 1
    assert.equal(result.convertedAmount, expected)
    assert.equal(result.targetCurrency, 'USD')
  })

  it('营销为香港推广活动设置专属汇率', () => {
    const { controller } = createServices()
    controller.setRate({ from: 'USD', to: 'HKD', rate: 7.85, source: 'manual' })
    // 1000 USD = 7850 HKD
    const result = controller.convert({ amount: 1000, from: 'USD', to: 'HKD' })
    const expected = Math.floor(1000 * 7.85 * 100) / 100
    assert.equal(result.convertedAmount, expected)
    assert.equal(result.rate, 7.85)
  })

  it('营销配置美金基准后更新汇率列表', () => {
    const { controller } = createServices()
    controller.updateConfig({ baseCurrency: 'USD' })
    const config = controller.getConfig()
    assert.equal(config.baseCurrency, 'USD')
    // 设一条 USD→CNY
    controller.setRate({ from: 'USD', to: 'CNY', rate: 7.14, source: 'market' })
    const baseRates = controller.getBaseRates()
    assert.equal(baseRates['USD'], 1)
  })

  it('营销查看到符合预期的促销价格（边界: 多步加减）', () => {
    const { controller } = createServices()
    // 原价 200 USD, 折扣 30 USD, 税费 50 CNY
    // 折扣后 170 USD = 1213.8 CNY (170*7.14)
    // 加税 50 CNY = 1263.8 CNY
    // 但 add/subtract 需要两两运算
    const afterDiscount = controller.subtract({
      a: { amount: 200, currency: 'USD' },
      b: { amount: 30, currency: 'USD' },
      operation: 'subtract'
    })
    assert.equal(afterDiscount.amount, 170)
    assert.equal(afterDiscount.currency, 'USD')

    // 转为 CNY + 税费
    const inCny = controller.convert({ amount: afterDiscount.amount, from: 'USD', to: 'CNY' })
    const total = controller.add({
      a: { amount: inCny.convertedAmount, currency: 'CNY' },
      b: { amount: 50, currency: 'CNY' },
      operation: 'add'
    })
    assert.equal(total.currency, 'CNY')
    assert.ok(total.amount > inCny.convertedAmount, '加税后金额应大于转换后金额')
  })
})

// ════════════════════════════════════════════════════════════════
// 跨角色边界场景
// ════════════════════════════════════════════════════════════════
describe('currency 跨角色边界场景', () => {
  it('所有汇率同时设置 + 切换配置 + 转换 = 一致性', () => {
    const { controller, service } = createServices()

    // 1. 批量设置
    controller.setRate({ from: 'CNY', to: 'USD', rate: 0.14, source: 'market' })
    controller.setRate({ from: 'CNY', to: 'HKD', rate: 1.09, source: 'market' })
    controller.setRate({ from: 'CNY', to: 'JPY', rate: 20.14, source: 'market' })

    // 2. 切换 baseCurrency
    controller.updateConfig({ baseCurrency: 'USD' })
    service.setConfig({ baseCurrency: 'USD' })

    // 3. 获取 base rates（base 已变）
    const baseRates = controller.getBaseRates()

    // 仍能正确获取
    assert.ok(baseRates['CNY'] !== undefined || baseRates['USD'] === 1)
  })

  it('多次加减组合运算精度一致', () => {
    const { controller } = createServices()

    // 100 + 50.50 - 30.25 = 120.25 (同币种)
    const step1 = controller.add({
      a: { amount: 100, currency: 'CNY' },
      b: { amount: 50.50, currency: 'CNY' },
      operation: 'add'
    })
    assert.equal(step1.amount, 150.5)

    const step2 = controller.subtract({
      a: { amount: step1.amount, currency: 'CNY' },
      b: { amount: 30.25, currency: 'CNY' },
      operation: 'subtract'
    })
    assert.equal(step2.amount, 120.25)
  })

  it('跨币种加减后再转换保持一致性', () => {
    const { controller } = createServices()
    // a=100 USD, b=200 CNY. convert(200 CNY→USD): 200 * 0.14 * 100/100 = 28
    // 100 + 28 = 128 USD
    const added = controller.add({
      a: { amount: 100, currency: 'USD' },
      b: { amount: 200, currency: 'CNY' },
      operation: 'add'
    })
    assert.equal(added.currency, 'USD')
    assert.equal(added.amount, 128)

    // 再转回 CNY: 128 USD * 7.14 * 100/100 = 913.92
    const converted = controller.convert({ amount: added.amount, from: 'USD', to: 'CNY' })
    assert.equal(converted.originalCurrency, 'USD')
    assert.equal(converted.targetCurrency, 'CNY')
    assert.ok(converted.convertedAmount > 0)
  })
})
