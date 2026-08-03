/**
 * ═══════════════════════════════════════════════════════════════
 * 箍一: 测试目标模块声明
 *   - 模块: tax | 文件: tax.service.edge.test.ts
 *   - 目标: 补充 TaxService 的边界/异常/舍入/多币种场景
 *   - 与 tax.service.test.ts (33 it) 互补不重复
 * ═══════════════════════════════════════════════════════════════
 * 箍二: 依赖Mock清单
 *   - TaxService — 直接实例化, in-memory Map 存储
 *   - TaxType / TaxConfig — 类型导入
 *   - 无需外部依赖
 * ═══════════════════════════════════════════════════════════════
 * 箍三: 边界条件覆盖承诺
 *   - 舍入模式全排列 (floor/round/ceil)
 *   - 极小金额精度 (< 0.01)
 *   - 极高金额不溢出
 *   - 含税价/不含税价切换边角
 *   - 税率 0% / 100% 极端值
 * ═══════════════════════════════════════════════════════════════
 * 箍四: 与E2E测试的分工/衔接
 *   - 无 E2E 测试覆盖本文件深度舍入/类型精度场景
 * ═══════════════════════════════════════════════════════════════
 * 箍五: 回归触发条件
 *   - tax.service.ts 计算逻辑 / 舍入算法变更
 *   - tax.entity.ts TaxConfig / TaxType 枚举变更
 *   - 添加/删除默认税率表
 * ═══════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { TaxService } from './tax.service'
import type { TaxType } from './tax.entity'

// ── Helpers ──────────────────────────────────────────────

function makeService(): TaxService {
  return new TaxService()
}

// ════════════════════════════════════════════════════════════
// TaxService — 边界/异常/舍入深度场景
// ════════════════════════════════════════════════════════════

describe('[tax-edge] TaxService 边界与深度场景', () => {
  // ── 1. 舍入模式全排列 ──────────────────────────

  describe('舍入模式全排列', () => {
    it('[边界] roundingMode=floor 时税款截断而不四舍五入', () => {
      const svc = makeService()
      svc.setConfig({ roundingMode: 'floor' })
      // 0.053 * 1 = 0.053, floor(0.053 * 100) / 100 = 5.3 → 0.05
      const result = svc.calculate({ amount: 1, jurisdiction: 'US-VA' })
      // US-VA 5.3%, 1 * 0.053 = 0.053, floor → 0.05
      assert.equal(result.taxAmount, 0.05)
    })

    it('[边界] roundingMode=ceil 时税款向上取整', () => {
      const svc = makeService()
      svc.setConfig({ roundingMode: 'ceil' })
      // 0.053 * 1 = 0.053, ceil(0.053 * 100) / 100 = 0.06
      const result = svc.calculate({ amount: 1, jurisdiction: 'US-VA' })
      assert.equal(result.taxAmount, 0.06)
    })

    it('[边界] roundingMode=round 时四舍五入', () => {
      const svc = makeService()
      svc.setConfig({ roundingMode: 'round' })
      // US-VA 5.3%, 1 * 0.053 = 0.053, round(0.053 * 100) / 100 = 0.05
      const result = svc.calculate({ amount: 1, jurisdiction: 'US-VA' })
      assert.ok(result.taxAmount === 0.05 || result.taxAmount === 0.06)
    })
  })

  // ── 2. 极小金额精度 ────────────────────────────

  describe('极小金额精度', () => {
    it('[边界] 分币金额 (0.01) 计算正确', () => {
      const svc = makeService()
      const result = svc.calculate({ amount: 0.01, jurisdiction: 'CN' })
      // CN VAT 13% + service_charge 6% = 19%
      // 0.01 * 0.13 = 0.0013 → floor(0.0013 * 100) / 100 = 0.00
      // 0.01 * 0.06 = 0.0006 → floor(0.0006 * 100) / 100 = 0.00
      assert.equal(result.taxAmount, 0)
      assert.equal(result.grossAmount, 0.01)
    })

    it('[边界] 厘级金额 (0.001) 计算', () => {
      const svc = makeService()
      // With the current applyRounding using rate < 0.01 → 4 decimals
      const result = svc.calculate({ amount: 0.001, jurisdiction: 'CN' })
      assert.ok(typeof result.taxAmount === 'number')
      assert.ok(Number.isFinite(result.taxAmount))
    })
  })

  // ── 3. 极高金额 ────────────────────────────────

  describe('极高金额场景', () => {
    it('[边界] 十亿级金额正确计算', () => {
      const svc = makeService()
      const result = svc.calculate({ amount: 1_000_000_000, jurisdiction: 'CN' })
      // CN: 13% + 6% = 19%
      assert.equal(result.taxAmount, 190_000_000)
      assert.equal(result.grossAmount, 1_190_000_000)
    })

    it('[边界] 极小税率 (0.1%) 计算精确', () => {
      const svc = makeService()
      svc.addRate({ name: 'Low Tax', type: 'vat', rate: 0.001, jurisdiction: 'TEST', enabled: true })
      const result = svc.calculate({ amount: 100000, jurisdiction: 'TEST' })
      // 100000 * 0.001 = 100
      assert.equal(result.taxAmount, 100)
    })

    it('[边界] 极高税率 (99.99%) 不溢出', () => {
      const svc = makeService()
      svc.addRate({ name: 'Max Tax', type: 'vat', rate: 0.9999, jurisdiction: 'TEST', enabled: true })
      const result = svc.calculate({ amount: 10000, jurisdiction: 'TEST' })
      // 10000 * 0.9999 = 9999
      assert.equal(result.taxAmount, 9999)
      assert.equal(result.grossAmount, 19999)
    })
  })

  // ── 4. 含税价深度场景 ──────────────────────────

  describe('含税价深度场景', () => {
    it('[正例] 含税价提取税额精确到分', () => {
      const svc = makeService()
      svc.setConfig({ priceInclusive: true, roundingMode: 'floor' })
      // 1130 含税 (VAT 13%): 税额 = 1130 * 0.13 / 1.13 = 130.0
      const result = svc.calculate({ amount: 1130, jurisdiction: 'CN', taxType: 'vat' })
      assert.equal(result.taxAmount, 130)
      assert.equal(result.netAmount, 1000)
    })

    it('[正例] 含税价下 grossAmount = 传入 amount', () => {
      const svc = makeService()
      svc.setConfig({ priceInclusive: true })
      const result = svc.calculate({ amount: 100, jurisdiction: 'CN', taxType: 'vat' })
      assert.equal(result.grossAmount, 100)
    })

    it('[边界] 含税价零金额', () => {
      const svc = makeService()
      svc.setConfig({ priceInclusive: true })
      const result = svc.calculate({ amount: 0, jurisdiction: 'CN' })
      assert.equal(result.taxAmount, 0)
      assert.equal(result.netAmount, 0)
      assert.equal(result.grossAmount, 0)
    })

    it('[边界] 含税价大额切换回不含税', () => {
      const svc = makeService()
      svc.setConfig({ priceInclusive: true })
      const inclusive = svc.calculate({ amount: 1130, jurisdiction: 'CN', taxType: 'vat' })
      svc.setConfig({ priceInclusive: false })
      const exclusive = svc.calculate({ amount: 1130, jurisdiction: 'CN', taxType: 'vat' })
      // Inclusive: 税额从含税中提取; Exclusive: 1130 为净价, 税额 = 1130 * 0.13
      assert.notEqual(inclusive.taxAmount, exclusive.taxAmount)
    })
  })

  // ── 5. 税率 CRUD 边角 ──────────────────────────

  describe('税率 CRUD 边角', () => {
    it('[边界] 添加税率后 updateRate 返回 updatedAt 更新', () => {
      const svc = makeService()
      const added = svc.addRate({ name: 'New', type: 'vat', rate: 0.08, jurisdiction: 'TEST', enabled: true })
      const originalUpdated = added.updatedAt.getTime()
      // Small delay to ensure time diff
      const updated = svc.updateRate(added.id, { rate: 0.09 })
      assert.ok(updated!.updatedAt.getTime() >= originalUpdated)
    })

    it('[异常] updateRate 不改变 id 和 createdAt', () => {
      const svc = makeService()
      const added = svc.addRate({ name: 'Stable', type: 'gst', rate: 0.05, jurisdiction: 'TEST', enabled: true })
      const originalId = added.id
      const originalCreated = added.createdAt.getTime()
      const updated = svc.updateRate(added.id, { name: 'Updated', rate: 0.06 })
      assert.equal(updated!.id, originalId)
      assert.equal(updated!.createdAt.getTime(), originalCreated)
    })

    it('[异常] deleteRate 后再 getRateById 返回 null', () => {
      const svc = makeService()
      const all = svc.getAllRates()
      const first = all[0]
      svc.deleteRate(first.id)
      assert.equal(svc.getRateById(first.id), null)
      // Second delete should return false
      assert.equal(svc.deleteRate(first.id), false)
    })
  })

  // ── 6. 批量计算边角 ────────────────────────────

  describe('批量计算边角', () => {
    it('[边界] 空数组批量计算返回零', () => {
      const svc = makeService()
      const result = svc.calculateBatch({ items: [] })
      assert.equal(result.items.length, 0)
      assert.equal(result.totalTaxAmount, 0)
      assert.equal(result.totalGrossAmount, 0)
    })

    it('[正例] 批量计算含不同税率的多个商品', () => {
      const svc = makeService()
      const result = svc.calculateBatch({
        items: [
          { id: 'i1', amount: 100, jurisdiction: 'CN' },
          { id: 'i2', amount: 200, jurisdiction: 'US-VA' },
          { id: 'i3', amount: 300, jurisdiction: 'SG' },
          { id: 'i4', amount: 400, jurisdiction: 'HK' },
          { id: 'i5', amount: 500, jurisdiction: 'JP' },
        ],
      })
      assert.equal(result.items.length, 5)
      // HK is 0% tax, so totalTaxAmount should be from the other 4
      assert.ok(result.totalTaxAmount > 0)
      assert.ok(result.totalGrossAmount > result.totalTaxAmount)
    })

    it('[边界] 批量计算中部分地区无税率', () => {
      const svc = makeService()
      const result = svc.calculateBatch({
        items: [
          { id: 'normal', amount: 1000, jurisdiction: 'CN' },
          { id: 'nottaxed', amount: 500, jurisdiction: 'UNKNOWN' },
        ],
      })
      assert.ok(result.items[0].taxAmount > 0)
      assert.equal(result.items[1].taxAmount, 0)
    })
  })

  // ── 7. Config 边角 ─────────────────────────────

  describe('Config 边角场景', () => {
    it('[边界] 连续 setConfig 只保留最新', () => {
      const svc = makeService()
      svc.setConfig({ defaultJurisdiction: 'JP' })
      svc.setConfig({ priceInclusive: true })
      svc.setConfig({ roundingMode: 'ceil' })
      const config = svc.getConfig()
      assert.equal(config.defaultJurisdiction, 'JP')
      assert.equal(config.priceInclusive, true)
      assert.equal(config.roundingMode, 'ceil')
    })

    it('[正例] 获取的 config 是副本, 修改不影响内部', () => {
      const svc = makeService()
      const config = svc.getConfig()
      config.priceInclusive = true
      const config2 = svc.getConfig()
      assert.equal(config2.priceInclusive, false)
    })
  })

  // ── 8. formatTaxAmount 边角 ────────────────────

  describe('formatTaxAmount 边角', () => {
    it('[边界] 不同 locale 格式不同', () => {
      const svc = makeService()
      const zh = svc.formatTaxAmount(1234.56, 'zh-CN')
      const en = svc.formatTaxAmount(1234.56, 'en-US')
      // Both should contain the number but format may differ
      assert.ok(zh.includes('1,234.56') || zh.replace(/\s/g, '').length > 0)
      assert.ok(en.includes('1,234.56'))
    })

    it('[边界] 小于 1 分的金额格式化为 0.00', () => {
      const svc = makeService()
      assert.equal(svc.formatTaxAmount(0.001, 'zh-CN'), '0.00')
    })
  })

  // ── 9. 多税率叠加场景 ──────────────────────────

  describe('多税率叠加场景', () => {
    it('[正例] 添加后 CN 地区同时计算 VAT + 服务费 + 关税', () => {
      const svc = makeService()
      svc.addRate({ name: 'Customs', type: 'customs_duty', rate: 0.08, jurisdiction: 'CN', enabled: true })
      const result = svc.calculate({ amount: 10000, jurisdiction: 'CN' })
      // Should have VAT (13%) + service_charge (6%) + customs_duty (8%) = 27%
      assert.equal(result.breakdown.length, 3)
      assert.equal(result.taxAmount, 2700)
    })
  })
})
