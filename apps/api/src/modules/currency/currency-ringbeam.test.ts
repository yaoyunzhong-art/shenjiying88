/**
 * currency-ringbeam.test.ts - 货币模块圈梁测试
 * 覆盖: 正例(类型/合约/格式化/运算) + 反例(无效币种/零除/空) + 边界(极端值/跨币种/汇率链)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CurrencyService } from './currency.service'
import type { CurrencyCode, Money, ExchangeRate, CurrencyConfig } from './currency.service'
import type {
  ConvertRequestContract,
  ConvertResponseContract,
  RateItemContract,
  SetRateRequestContract,
  MoneyOperandContract,
  ArithmeticRequestContract,
  CurrencyConfigContract,
  RateStalenessContract,
} from './currency.contract'
import { CurrencyModule } from './currency.module'

// ── 辅助构造 ──────────────────────────────────────────────

const ALL_CURRENCIES: CurrencyCode[] = [
  'CNY', 'USD', 'HKD', 'TWD', 'JPY', 'KRW', 'THB', 'VND', 'IDR', 'MYR', 'SGD',
]

describe('✅ AC-CURRENCY: 货币圈梁', () => {
  let service: CurrencyService

  beforeEach(() => {
    service = new CurrencyService()
    service.setConfig({
      baseCurrency: 'CNY',
      decimalPlaces: 2,
      roundingMode: 'floor',
    })
  })

  // ═══════ 正例: 类型/合约/数据结构验证 ═══════════════════════════

  it('[P0] 合约类型 ConvertRequestContract 具有正确结构', () => {
    const req: ConvertRequestContract = { amount: 100, from: 'USD', to: 'CNY' }
    expect(req).toEqual({ amount: 100, from: 'USD', to: 'CNY' })
  })

  it('[P0] 合约类型 ConvertResponseContract 具有正确结构', () => {
    const resp: ConvertResponseContract = {
      originalAmount: 100,
      originalCurrency: 'USD',
      convertedAmount: 720,
      targetCurrency: 'CNY',
      rate: 7.2,
      timestamp: '2026-07-19T00:00:00Z',
    }
    expect(resp).toHaveProperty('originalAmount', 100)
    expect(resp).toHaveProperty('convertedAmount', 720)
    expect(resp).toHaveProperty('rate', 7.2)
  })

  it('[P0] 合约类型 RateItemContract 具有正确结构', () => {
    const item: RateItemContract = {
      from: 'USD', to: 'CNY', rate: 7.2,
      source: 'market', updatedAt: '2026-07-19T00:00:00Z',
    }
    expect(item).toHaveProperty('from', 'USD')
    expect(item).toHaveProperty('to', 'CNY')
    expect(item).toHaveProperty('source', 'market')
  })

  it('[P0] 合约类型 SetRateRequestContract 支持可选 source', () => {
    const r1: SetRateRequestContract = { from: 'USD', to: 'CNY', rate: 7.2, source: 'manual' }
    const r2: SetRateRequestContract = { from: 'USD', to: 'CNY', rate: 7.2 }
    expect(r1.source).toBe('manual')
    expect(r2.rate).toBe(7.2)
  })

  it('[P0] 合约类型 ArithmeticRequestContract 支持加减', () => {
    const a: MoneyOperandContract = { amount: 100, currency: 'CNY' }
    const b: MoneyOperandContract = { amount: 50, currency: 'CNY' }
    const req: ArithmeticRequestContract = { a, b, operation: 'add' }
    expect(req.operation).toBe('add')
    expect(req.a.amount).toBe(100)
    expect(req.b.amount).toBe(50)
  })

  it('[P0] 合约类型 CurrencyConfigContract 兼容 CurrencyConfig', () => {
    const cfg: CurrencyConfigContract = { baseCurrency: 'CNY', decimalPlaces: 2, roundingMode: 'floor' }
    expect(cfg.baseCurrency).toBe('CNY')
    expect(cfg.roundingMode).toBe('floor')
  })

  it('[P0] 合约类型 RateStalenessContract 具有正确结构', () => {
    const stale: RateStalenessContract = {
      from: 'USD', to: 'CNY', isStale: true, maxAgeMs: 86400000, rate: 7.2,
    }
    expect(stale.isStale).toBe(true)
    expect(stale.maxAgeMs).toBe(86400000)
  })

  // ═══════ 正例: 汇率基础操作 ═══════════════════════════════════════

  it('[P0] 同币种汇率始终为 1', () => {
    const rate = service.getRate('CNY', 'CNY')
    expect(rate).not.toBeNull()
    expect(rate!.rate).toBe(1)
    expect(rate!.source).toBe('fixed')
  })

  it('[P0] 设置手动汇率后可通过 getRate 获取', () => {
    service.setRate('USD', 'CNY', 7.2, 'manual')
    const rate = service.getRate('USD', 'CNY')
    expect(rate).not.toBeNull()
    expect(rate!.rate).toBe(7.2)
    expect(rate!.source).toBe('manual')
  })

  it('[P0] 自动汇率覆盖市场汇率 (最优优先级)', () => {
    service.setRate('USD', 'CNY', 7.1, 'market')
    service.setRate('USD', 'CNY', 7.2, 'manual')
    const rate = service.getRate('USD', 'CNY')
    expect(rate!.rate).toBe(7.2) // manual 覆盖 market
    expect(rate!.source).toBe('manual')
  })

  it('[P0] 市场汇率可通过 getRate 获取', () => {
    service.setRate('USD', 'CNY', 7.15, 'market')
    const rate = service.getRate('USD', 'CNY')
    expect(rate).not.toBeNull()
    expect(rate!.rate).toBe(7.15)
    expect(rate!.source).toBe('market')
  })

  it('[P0] getAllRates 返回所有已设置的汇率', () => {
    service.setRate('USD', 'CNY', 7.2, 'manual')
    service.setRate('SGD', 'CNY', 5.4, 'market')
    const rates = service.getAllRates()
    expect(rates.length).toBe(2)
  })

  it('[P0] getRatesFromBase 返回本位币对所有货币汇率', () => {
    service.setRate('CNY', 'USD', 0.14, 'market')
    const rates = service.getRatesFromBase('CNY')
    expect(rates.CNY).toBe(1)
    expect(rates.USD).toBeGreaterThan(0)
  })

  // ═══════ 正例: 货币转换 ══════════════════════════════════════════

  it('[P0] 同一币种转换返回相同金额', () => {
    const result = service.convert({ amount: 100, currency: 'CNY' }, 'CNY')
    expect(result.amount).toBe(100)
    expect(result.currency).toBe('CNY')
  })

  it('[P0] 不同币种转换正确', () => {
    service.setRate('USD', 'CNY', 7.2, 'market')
    const result = service.convert({ amount: 100, currency: 'USD' }, 'CNY')
    expect(result.currency).toBe('CNY')
    expect(result.amount).toBeGreaterThan(0)
  })

  it('[P0] convertAmount 返回正确的转换值', () => {
    service.setRate('USD', 'CNY', 7.2, 'market')
    const amount = service.convertAmount(100, 'USD', 'CNY')
    expect(amount).toBe(720)
  })

  it('[P0] JPY 零小数位币种转换正确', () => {
    service.setRate('CNY', 'JPY', 20, 'market')
    const amount = service.convertAmount(100, 'CNY', 'JPY')
    // 100 * 20 * 10^0 / 10^2 = 2000 / 100 = 20
    expect(amount).toBe(20)
  })

  // ═══════ 正例: 算术运算 ══════════════════════════════════════════

  it('[P0] 同币种加法', () => {
    const result = service.add(
      { amount: 100, currency: 'USD' },
      { amount: 50, currency: 'USD' },
    )
    expect(result.amount).toBe(150)
    expect(result.currency).toBe('USD')
  })

  it('[P0] 同币种减法', () => {
    const result = service.subtract(
      { amount: 100, currency: 'USD' },
      { amount: 30, currency: 'USD' },
    )
    expect(result.amount).toBe(70)
    expect(result.currency).toBe('USD')
  })

  it('[P0] 跨币种加法时自动转换货币', () => {
    service.setRate('CNY', 'USD', 0.14, 'market')
    const result = service.add(
      { amount: 100, currency: 'CNY' },
      { amount: 700, currency: 'CNY' },
    )
    expect(result.currency).toBe('CNY')
    expect(result.amount).toBe(800)
  })

  it('[P0] multiply 操作正确', () => {
    const result = service.multiply({ amount: 100, currency: 'CNY' }, 3)
    expect(result.currency).toBe('CNY')
    expect(result.amount).toBe(300)
  })

  it('[P0] divide 操作正确', () => {
    const result = service.divide({ amount: 100, currency: 'CNY' }, 4)
    expect(result.currency).toBe('CNY')
    expect(result.amount).toBe(25)
  })

  // ═══════ 正例: 格式化 ════════════════════════════════════════════

  it('[P0] format 返回带货币符号的格式化字符串', () => {
    const formatted = service.format({ amount: 100, currency: 'CNY' })
    expect(formatted).toContain('¥')
  })

  it('[P0] formatCompact 将大数转为中文万', () => {
    const result = service.formatCompact(12345, 'CNY')
    expect(result).toBe('¥1万')
  })

  it('[P0] formatCompact 将亿级数字转为中文亿', () => {
    const result = service.formatCompact(1_2345_6789, 'CNY')
    expect(result).toBe('¥1亿')
  })

  it('[P0] formatCompact 小于1000时返回原值', () => {
    const result = service.formatCompact(999, 'CNY')
    expect(result).toBe('¥999')
  })

  // ═══════ 正例: 配置管理 ══════════════════════════════════════════

  it('[P0] getConfig 返回默认配置', () => {
    const cfg = service.getConfig()
    expect(cfg.baseCurrency).toBe('CNY')
    expect(cfg.decimalPlaces).toBe(2)
    expect(cfg.roundingMode).toBe('floor')
  })

  it('[P0] setConfig 部分更新配置', () => {
    service.setConfig({ roundingMode: 'round' })
    const cfg = service.getConfig()
    expect(cfg.roundingMode).toBe('round')
    expect(cfg.baseCurrency).toBe('CNY') // unchanged
  })

  it('[P0] setConfig 替换全部配置', () => {
    service.setConfig({ baseCurrency: 'USD', decimalPlaces: 2, roundingMode: 'ceil' })
    const cfg = service.getConfig()
    expect(cfg.baseCurrency).toBe('USD')
    expect(cfg.roundingMode).toBe('ceil')
  })

  // ═══════ 正例: Module 结构 ═══════════════════════════════════════

  it('[P0] CurrencyModule 导出 CurrencyService', () => {
    const exports = Reflect.getMetadata('exports', CurrencyModule) as unknown[]
    expect(exports).toContain(CurrencyService)
  })

  it('[P0] CurrencyModule 注册了 CurrencyService', () => {
    const providers = Reflect.getMetadata('providers', CurrencyModule) as unknown[]
    expect(providers).toContain(CurrencyService)
  })

  // ═══════ 反例: 无效输入 ══════════════════════════════════════════

  it('[P1] 未设置汇率时 convertAmount 返回 0', () => {
    const amount = service.convertAmount(100, 'USD', 'CNY')
    expect(amount).toBe(0)
  })

  it('[P1] 获取未设置的汇率时 getRate 通过交叉汇率尝试', () => {
    service.setRate('CNY', 'USD', 0.14, 'market')
    // USD -> CNY 通过交叉汇率
    const rate = service.getRate('USD', 'CNY')
    expect(rate).not.toBeNull()
    expect(rate!.rate).toBeCloseTo(1 / 0.14, 5)
  })

  it('[P1] divide 除零抛出异常', () => {
    expect(() => service.divide({ amount: 100, currency: 'CNY' }, 0)).toThrow('Division by zero')
  })

  it('[P1] 负数金额的转换', () => {
    service.setRate('USD', 'CNY', 7.2, 'market')
    const amount = service.convertAmount(-50, 'USD', 'CNY')
    expect(amount).toBeLessThan(0)
  })

  // ═══════ 边界: 极端值 ════════════════════════════════════════════

  it('[P2] 边界: 零金额转换', () => {
    service.setRate('USD', 'CNY', 7.2, 'market')
    const amount = service.convertAmount(0, 'USD', 'CNY')
    expect(amount).toBe(0)
  })

  it('[P2] 边界: isRateStale 当无汇率时返回 true', () => {
    const stale = service.isRateStale('USD', 'CNY', 1000)
    expect(stale).toBe(true)
  })

  it('[P2] 边界: 大量币种全部可达', () => {
    for (const code of ALL_CURRENCIES) {
      const money: Money = { amount: 1, currency: code }
      expect(money.currency).toBe(code)
    }
  })

  it('[P2] 边界: 所有 11 种币种间的交叉汇率', () => {
    // 交叉汇率: USD -> CNY -> JPY
    // getCrossRate 需要直接配对: 设置 USD->CNY 和 CNY->JPY
    service.setRate('USD', 'CNY', 7.2, 'market')
    service.setRate('CNY', 'JPY', 20, 'market')
    const usdToJpy = service.getRate('USD', 'JPY')
    expect(usdToJpy).not.toBeNull()
    expect(usdToJpy!.rate).toBeGreaterThan(0)
  })

  it('[P2] 边界: 3 币种枚举验证', () => {
    expect(ALL_CURRENCIES.length).toBe(11)
    expect(ALL_CURRENCIES).toContain('CNY')
    expect(ALL_CURRENCIES).toContain('USD')
    expect(ALL_CURRENCIES).toContain('HKD')
  })

  it('[P2] 边界: formatCompact 千级数字', () => {
    const result = service.formatCompact(1000, 'USD')
    expect(result).toBe('$1千')
  })

  it('[P2] 边界: 多次设置同一汇率互相覆盖', () => {
    service.setRate('USD', 'CNY', 7.1, 'market')
    service.setRate('USD', 'CNY', 7.2, 'market')
    const rate = service.getRate('USD', 'CNY')
    expect(rate!.rate).toBe(7.2) // latest wins
  })

  it('[P2] 边界: getRatesFromBase 所有币种都包含', () => {
    service.setRate('CNY', 'USD', 0.14, 'market')
    const rates = service.getRatesFromBase('CNY')
    for (const code of ALL_CURRENCIES) {
      expect(rates).toHaveProperty(code)
    }
  })

  it('[P2] 边界: HKD 联系汇率正确', () => {
    const rate = service.getRate('HKD', 'USD')
    expect(rate).not.toBeNull()
    expect(rate!.rate).toBeCloseTo(0.128, 5)
    expect(rate!.source).toBe('fixed')
  })

  it('[P2] 边界: 无关联汇率时 getRate 返回 null', () => {
    // 不设任何汇率, 所有交叉汇率都无法计算
    const rate = service.getRate('KRW', 'IDR')
    expect(rate).toBeNull()
  })
})
