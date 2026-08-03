/**
 * tax.service.spec.ts — 税务模块 Service 单元测试
 *
 * 覆盖: 税率管理 / 单笔计算 / 批量计算 / 配置切换 / 格式化 / 边界场景
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TaxService } from './tax.service'

describe('TaxService — 税率管理', () => {
  let svc: TaxService

  beforeEach(() => {
    svc = new TaxService()
  })

  it('getAllRates 返回所有税率', () => {
    const rates = svc.getAllRates()
    expect(rates.length).toBeGreaterThan(0)
    expect(rates[0].id).toBeDefined()
    expect(rates[0].name).toBeDefined()
  })

  it('getEnabledRates 只返回已启用的税率', () => {
    const enabled = svc.getEnabledRates()
    enabled.forEach((r) => expect(r.enabled).toBe(true))
  })

  it('getRateById 返回指定税率', () => {
    const rates = svc.getAllRates()
    const rate = svc.getRateById(rates[0].id)
    expect(rate).not.toBeNull()
    expect(rate!.id).toBe(rates[0].id)
  })

  it('getRateById 不存在的 ID 返回 null', () => {
    expect(svc.getRateById('nonexistent')).toBeNull()
  })

  it('getRatesByJurisdiction 按地区筛选', () => {
    const cnRates = svc.getRatesByJurisdiction('CN')
    cnRates.forEach((r) => expect(r.jurisdiction).toBe('CN'))
    expect(cnRates.length).toBeGreaterThan(0)
  })

  it('addRate 添加新税率', () => {
    const rate = svc.addRate({
      name: '测试税率',
      type: 'vat',
      rate: 0.05,
      jurisdiction: 'CN-TEST',
      enabled: true,
      description: '测试用',
    })
    expect(rate.id).toBeDefined()
    expect(rate.name).toBe('测试税率')
    const found = svc.getRateById(rate.id)
    expect(found).not.toBeNull()
  })

  it('updateRate 更新税率', () => {
    const rates = svc.getAllRates()
    const id = rates[0].id
    const updated = svc.updateRate(id, { rate: 0.15, description: '更新描述' })
    expect(updated).not.toBeNull()
    expect(updated!.rate).toBe(0.15)
    expect(updated!.description).toBe('更新描述')
  })

  it('updateRate 不存在的 ID 返回 null', () => {
    expect(svc.updateRate('nonexistent', { rate: 0.1 })).toBeNull()
  })

  it('deleteRate 删除税率', () => {
    const rate = svc.addRate({ name: '临时税率', type: 'vat', rate: 0.01, jurisdiction: 'TMP', enabled: true, description: '' })
    const result = svc.deleteRate(rate.id)
    expect(result).toBe(true)
    expect(svc.getRateById(rate.id)).toBeNull()
  })

  it('deleteRate 不存在的 ID 返回 false', () => {
    expect(svc.deleteRate('nonexistent')).toBe(false)
  })
})

describe('TaxService — 税额计算', () => {
  let svc: TaxService

  beforeEach(() => {
    svc = new TaxService()
  })

  it('calculate 含税计算 (exclusive)', () => {
    const result = svc.calculate({ amount: 1000, jurisdiction: 'CN' })
    expect(result.netAmount).toBe(1000)
    expect(result.grossAmount).toBeGreaterThan(1000)
    expect(result.taxAmount).toBeGreaterThan(0)
    expect(result.breakdown.length).toBeGreaterThan(0)
  })

  it('calculate 含税计算 (inclusive)', () => {
    svc.setConfig({ priceInclusive: true })
    const result = svc.calculate({ amount: 1130, jurisdiction: 'CN' })
    expect(result.grossAmount).toBe(1130)
    expect(result.netAmount).toBeLessThan(1130)
    expect(result.taxAmount).toBeGreaterThan(0)
  })

  it('calculate 指定税种', () => {
    const result = svc.calculate({ amount: 1000, jurisdiction: 'CN', taxType: 'vat' })
    expect(result.breakdown).toHaveLength(1)
    expect(result.breakdown[0].type).toBe('vat')
  })

  it('calculate 无适用税率返回零税额', () => {
    const result = svc.calculate({ amount: 1000, jurisdiction: 'XX-UNKNOWN' })
    expect(result.taxAmount).toBe(0)
    expect(result.netAmount).toBe(1000)
    expect(result.grossAmount).toBe(1000)
  })

  it('calculate 金额为 0 返回零', () => {
    const result = svc.calculate({ amount: 0, jurisdiction: 'CN' })
    expect(result.taxAmount).toBe(0)
    expect(result.effectiveRate).toBe(0)
  })

  it('calculate 香港零税率', () => {
    const result = svc.calculate({ amount: 1000, jurisdiction: 'HK' })
    expect(result.taxAmount).toBe(0)
    expect(result.grossAmount).toBe(1000)
  })

  it('calculateBatch 批量计算', () => {
    const result = svc.calculateBatch({
      items: [
        { id: '1', amount: 1000, jurisdiction: 'CN' },
        { id: '2', amount: 500, jurisdiction: 'US-TX' },
        { id: '3', amount: 300, jurisdiction: 'JP' },
      ],
    })
    expect(result.items).toHaveLength(3)
    expect(result.totalTaxAmount).toBeGreaterThan(0)
    expect(result.totalGrossAmount).toBeGreaterThan(0)
  })
})

describe('TaxService — 配置与格式化', () => {
  let svc: TaxService

  beforeEach(() => {
    svc = new TaxService()
  })

  it('setConfig 更新后生效', () => {
    svc.setConfig({ roundingMode: 'ceil' })
    const config = svc.getConfig()
    expect(config.roundingMode).toBe('ceil')
  })

  it('getConfig 返回当前配置', () => {
    const config = svc.getConfig()
    expect(config.defaultJurisdiction).toBe('CN')
    expect(config.priceInclusive).toBe(false)
    expect(config.roundingMode).toBe('floor')
  })

  it('setConfig 部分更新', () => {
    svc.setConfig({ priceInclusive: true })
    const config = svc.getConfig()
    expect(config.priceInclusive).toBe(true)
    expect(config.defaultJurisdiction).toBe('CN') // unchanged
  })

  it('formatTaxAmount 格式化金额', () => {
    const formatted = svc.formatTaxAmount(1234.5)
    expect(formatted).toContain('1,234.50')
  })

  it('formatTaxAmount 支持 region 参数', () => {
    const formatted = svc.formatTaxAmount(1234.5, 'en-US')
    expect(formatted).toContain('1,234.50')
  })

  it('roundingMode floor 向下取整', () => {
    svc.setConfig({ roundingMode: 'floor' })
    const result = svc.calculate({ amount: 100, jurisdiction: 'CN', taxType: 'vat' })
    // 100 * 0.13 = 13, floor(13) = 13
    expect(result.taxAmount).toBe(13)
  })

  it('roundingMode ceil 向上取整', () => {
    svc.setConfig({ roundingMode: 'ceil' })
    const result = svc.calculate({ amount: 1, jurisdiction: 'US-TX', taxType: 'sales_tax' })
    // 1 * 0.0825 = 0.0825, ceil with 2 decimal = 0.09
    expect(result.taxAmount).toBeGreaterThanOrEqual(0.09)
  })
})
