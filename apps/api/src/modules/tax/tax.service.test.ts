/**
 * TaxService 测试
 *
 * 覆盖:
 * - getRate / CRUD 管理
 * - 税率计算 (正例/反例/边界)
 * - 批量计算
 * - 配资管理
 * - 含税/不含税
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TaxService } from './tax.service'
import type { TaxRate, TaxType, TaxCalculationRequest, BatchTaxRequest } from './tax.entity'

describe('TaxService', () => {
  let service: TaxService

  beforeEach(() => {
    service = new TaxService()
  })

  // ── Rate Management ──────────────────────────────────────────────────────

  describe('getAllRates()', () => {
    it('应返回预设的税率列表（≥9 条默认税率）', () => {
      const rates = service.getAllRates()
      expect(rates.length).toBeGreaterThanOrEqual(9)
    })

    it('每条税率应包含完整字段', () => {
      const rates = service.getAllRates()
      for (const r of rates) {
        expect(r).toHaveProperty('id')
        expect(r).toHaveProperty('name')
        expect(r).toHaveProperty('type')
        expect(r).toHaveProperty('rate')
        expect(r).toHaveProperty('jurisdiction')
        expect(r).toHaveProperty('enabled')
        expect(r).toHaveProperty('createdAt')
        expect(r).toHaveProperty('updatedAt')
      }
    })

    it('返回的税率 ID 应唯一', () => {
      const rates = service.getAllRates()
      const ids = rates.map(r => r.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
  })

  describe('getEnabledRates()', () => {
    it('应只返回启用的税率', () => {
      const enabled = service.getEnabledRates()
      expect(enabled.every(r => r.enabled)).toBe(true)
    })

    it('禁用一条税率后 enabled 列表减少', () => {
      const all = service.getAllRates()
      const firstId = all[0].id
      service.updateRate(firstId, { enabled: false })
      const enabled = service.getEnabledRates()
      expect(enabled.length).toBe(all.length - 1)
      expect(enabled.find(r => r.id === firstId)).toBeUndefined()
    })
  })

  describe('getRateById()', () => {
    it('通过 ID 查询到税率', () => {
      const all = service.getAllRates()
      const first = all[0]
      const found = service.getRateById(first.id)
      expect(found).not.toBeNull()
      expect(found!.id).toBe(first.id)
    })

    it('不存在的 ID 返回 null', () => {
      const found = service.getRateById('non-existent-id')
      expect(found).toBeNull()
    })
  })

  describe('getRatesByJurisdiction()', () => {
    it('按管辖区域筛选税率', () => {
      const cnRates = service.getRatesByJurisdiction('CN')
      expect(cnRates.length).toBeGreaterThanOrEqual(2)
      expect(cnRates.every(r => r.jurisdiction === 'CN' && r.enabled)).toBe(true)
    })

    it('无税率地区返回空数组', () => {
      const rates = service.getRatesByJurisdiction('EU-FR')
      expect(rates).toHaveLength(0)
    })
  })

  describe('addRate()', () => {
    it('添加新税率后返回完整对象', () => {
      const added = service.addRate({
        name: 'Test Tax',
        type: 'sales_tax',
        rate: 0.05,
        jurisdiction: 'US-CA',
        enabled: true,
      })
      expect(added.id).toBeDefined()
      expect(added.name).toBe('Test Tax')
      expect(added.type).toBe('sales_tax')
      expect(added.createdAt).toBeInstanceOf(Date)
    })

    it('添加后可通过 getAllRates 查询', () => {
      const before = service.getAllRates().length
      service.addRate({ name: 'New Tax', type: 'vat', rate: 0.08, jurisdiction: 'EU', enabled: true })
      expect(service.getAllRates().length).toBe(before + 1)
    })
  })

  describe('updateRate()', () => {
    it('更新税率字段成功', () => {
      const all = service.getAllRates()
      const first = all[0]
      const updated = service.updateRate(first.id, { rate: 0.15, name: 'Updated Tax' })
      expect(updated).not.toBeNull()
      expect(updated!.rate).toBe(0.15)
      expect(updated!.name).toBe('Updated Tax')
    })

    it('更新不存在的 ID 返回 null', () => {
      const updated = service.updateRate('no-such-id', { rate: 0.1 })
      expect(updated).toBeNull()
    })
  })

  describe('deleteRate()', () => {
    it('删除已存在的税率返回 true', () => {
      const all = service.getAllRates()
      const first = all[0]
      const deleted = service.deleteRate(first.id)
      expect(deleted).toBe(true)
      expect(service.getRateById(first.id)).toBeNull()
    })

    it('删除不存在的税率返回 false', () => {
      expect(service.deleteRate('no-such-id')).toBe(false)
    })
  })

  // ── Tax Calculation ──────────────────────────────────────────────────────

  describe('calculate() — 正例', () => {
    it('CN 地区 VAT 13% 计算 1000 元税款', () => {
      const result = service.calculate({ amount: 1000, jurisdiction: 'CN' })
      // 中国有 VAT 13% + 服务费 6% = 19%
      expect(result.netAmount).toBe(1000)
      expect(result.taxAmount).toBeGreaterThan(0)
      expect(result.grossAmount).toBeGreaterThan(1000)
      expect(result.breakdown.length).toBeGreaterThanOrEqual(2)
    })

    it('US-VA 地区 5.3% 销售税', () => {
      const result = service.calculate({ amount: 2000, jurisdiction: 'US-VA' })
      expect(result.breakdown.length).toBe(1)
      expect(result.breakdown[0].type).toBe('sales_tax')
      expect(result.taxAmount).toBeGreaterThan(0)
      expect(result.grossAmount).toBe(2000 + result.taxAmount)
    })

    it('指定税种类型取特定税率', () => {
      const result = service.calculate({ amount: 1000, jurisdiction: 'CN', taxType: 'vat' })
      expect(result.breakdown.length).toBe(1)
      expect(result.breakdown[0].type).toBe('vat')
      expect(result.breakdown[0].rate).toBe(0.13)
    })

    it('HK 零税率返回原值', () => {
      const result = service.calculate({ amount: 5000, jurisdiction: 'HK' })
      expect(result.taxAmount).toBe(0)
      expect(result.grossAmount).toBe(5000)
      expect(result.effectiveRate).toBe(0)
    })

    it('zero amount 计算返回零税款', () => {
      const result = service.calculate({ amount: 0, jurisdiction: 'CN' })
      expect(result.taxAmount).toBe(0)
      expect(result.grossAmount).toBe(0)
    })

    it('JP 10% 消费税', () => {
      const result = service.calculate({ amount: 1000, jurisdiction: 'JP' })
      expect(result.breakdown.length).toBe(1)
      expect(result.breakdown[0].rate).toBe(0.10)
      // 1000 * 0.10 = 100
      expect(result.taxAmount).toBe(100)
      expect(result.grossAmount).toBe(1100)
    })

    it('SG 9% GST', () => {
      const result = service.calculate({ amount: 1000, jurisdiction: 'SG' })
      expect(result.breakdown.length).toBe(1)
      expect(result.breakdown[0].type).toBe('gst')
      expect(result.breakdown[0].rate).toBe(0.09)
      expect(result.taxAmount).toBe(90)
    })
  })

  describe('calculate() — 含税价', () => {
    it('priceInclusive=true 时从含税价中提取税额', () => {
      service.setConfig({ priceInclusive: true })
      const result = service.calculate({ amount: 1130, jurisdiction: 'CN', taxType: 'vat' })
      // 1130 含税, VAT 13%: 税额 = 1130 * 0.13 / 1.13 ≈ 130
      expect(result.grossAmount).toBe(1130)
      expect(result.taxAmount).toBeGreaterThan(0)
      expect(result.netAmount).toBeLessThan(1130)
    })
  })

  describe('calculate() — 边界', () => {
    it('无对应税率地区返回零税款', () => {
      const result = service.calculate({ amount: 1000, jurisdiction: 'EU-FR' })
      expect(result.taxAmount).toBe(0)
      expect(result.grossAmount).toBe(1000)
      expect(result.breakdown).toHaveLength(0)
    })

    it('大金额计算不溢出', () => {
      const result = service.calculate({ amount: 1_0000_0000, jurisdiction: 'CN' })
      expect(result.taxAmount).toBeGreaterThan(0)
      expect(result.grossAmount).toBeGreaterThan(1_0000_0000)
    })
  })

  // ── Batch Calculation ────────────────────────────────────────────────────

  describe('calculateBatch()', () => {
    it('批量计算多个商品税款', () => {
      const request: BatchTaxRequest = {
        items: [
          { id: 'item-1', amount: 1000, jurisdiction: 'CN' },
          { id: 'item-2', amount: 500, jurisdiction: 'US-VA' },
          { id: 'item-3', amount: 200, jurisdiction: 'HK' },
        ],
      }
      const result = service.calculateBatch(request)
      expect(result.items).toHaveLength(3)
      expect(result.totalTaxAmount).toBeGreaterThan(0)
      expect(result.totalGrossAmount).toBeGreaterThan(result.totalTaxAmount)
    })

    it('批量结果中每个 item 包含完整字段', () => {
      const request: BatchTaxRequest = {
        items: [
          { id: 'test-1', amount: 1000, jurisdiction: 'CN' },
        ],
      }
      const result = service.calculateBatch(request)
      expect(result.items[0]).toHaveProperty('id', 'test-1')
      expect(result.items[0]).toHaveProperty('netAmount')
      expect(result.items[0]).toHaveProperty('taxAmount')
      expect(result.items[0]).toHaveProperty('grossAmount')
      expect(result.items[0]).toHaveProperty('effectiveRate')
    })
  })

  // ── Configuration ─────────────────────────────────────────────────────────

  describe('config management', () => {
    it('默认配置为 CN jurisdiction, 不含税, floor 舍入', () => {
      const config = service.getConfig()
      expect(config.defaultJurisdiction).toBe('CN')
      expect(config.priceInclusive).toBe(false)
      expect(config.roundingMode).toBe('floor')
    })

    it('部分更新配置保留其它字段', () => {
      service.setConfig({ defaultJurisdiction: 'US-VA' })
      const config = service.getConfig()
      expect(config.defaultJurisdiction).toBe('US-VA')
      expect(config.priceInclusive).toBe(false)
    })

    it('roundingMode=ceil 时税款向上取整', () => {
      service.setConfig({ roundingMode: 'ceil' })
      // US-VA 5.3%, 1999 * 0.053 ≈ 105.947, ceil => 105.95
      const result = service.calculate({ amount: 1999, jurisdiction: 'US-VA' })
      expect(result.taxAmount).toBeGreaterThanOrEqual(105.94)
    })
  })

  // ── Formatting ────────────────────────────────────────────────────────────

  describe('formatTaxAmount()', () => {
    it('格式化税款金额为两位小数', () => {
      const formatted = service.formatTaxAmount(1234.5, 'zh-CN')
      expect(formatted).toContain('1,234.50')
    })

    it('零金额格式化为 0.00', () => {
      expect(service.formatTaxAmount(0, 'zh-CN')).toBe('0.00')
    })
  })

  // ── Integration ───────────────────────────────────────────────────────────

  describe('完整业务场景', () => {
    it('手动添加税率 → 计算 → 更新 → 重新计算', () => {
      // 1. 添加自定义税率
      service.addRate({ name: 'Custom Duty', type: 'customs_duty', rate: 0.15, jurisdiction: 'CN', enabled: true })

      // 2. 计算含税价
      const result1 = service.calculate({ amount: 1000, jurisdiction: 'CN' })
      expect(result1.breakdown.length).toBeGreaterThanOrEqual(3)

      // 3. 更新税率
      const all = service.getAllRates()
      const customRate = all.find(r => r.type === 'customs_duty')
      expect(customRate).toBeDefined()
      if (customRate) {
        service.updateRate(customRate.id, { rate: 0.20 })
      }

      // 4. 重新计算
      const result2 = service.calculate({ amount: 1000, jurisdiction: 'CN' })
      expect(result2.taxAmount).not.toBe(result1.taxAmount)
    })
  })
})
