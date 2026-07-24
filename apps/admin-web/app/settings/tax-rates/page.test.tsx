/**
 * settings/tax-rates/page.test.tsx — 税率配置 L1 测试
 *
 * 覆盖: 页面结构、税率数据完整性、税务规则验证
 * 圈梁: TSC通过 → 测试存在 → 圈梁表更新 → PRD标记
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import fs from 'fs'

const PAGE = resolve(import.meta.dirname, 'page.tsx')
const content = fs.readFileSync(PAGE, 'utf-8')

describe('settings/tax-rates', () => {
  // ── 页面存在与导出 ──
  it('页面文件存在', () => { assert.ok(fs.existsSync(PAGE)) })
  it('包含 default export 函数', () => {
    assert.ok(content.includes('export default function '))
  })
  it('仅一个 export default', () => {
    const matches = content.match(/export default/g)
    assert.equal(matches?.length, 1)
  })
  it('TSC兼容: 无 as any', () => { assert.ok(!content.includes('as any')) })

  // ── 数据完整性 ──
  it('包含 TAX_RATES 数组', () => { assert.ok(content.includes('TAX_RATES')) })
  it('包含 4 条税率记录', () => {
    const categories = Array.from(content.matchAll(/category:\s*['"][^'"]+['"]/g))
    assert.equal(categories.length, 4, `got ${categories.length} categories`)
  })
  it('包含食品饮料税率', () => { assert.ok(content.includes('食品饮料')) })
  it('包含日用品税率', () => { assert.ok(content.includes('日用品')) })
  it('包含电子产品税率', () => { assert.ok(content.includes('电子产品')) })
  it('包含服务费税率', () => { assert.ok(content.includes('服务费')) })
  it('每条税率有 category/taxRate/taxType/effectiveDate 字段', () => {
    assert.ok(content.includes('category:'))
    assert.ok(content.includes('taxRate'))
    assert.ok(content.includes('taxType'))
    assert.ok(content.includes('effectiveDate'))
  })

  // ── 页面结构 ──
  it('包含表格渲染', () => { assert.ok(content.includes('map(') || content.includes('table')) })
  it('包含标题 "税率配置"', () => { assert.ok(content.includes('税率配置')) })
  it('包含品类税率表 section', () => { assert.ok(content.includes('品类税率表') || content.includes('品类税率')) })
  it('包含税务规则 section', () => { assert.ok(content.includes('税务规则')) })
  it('包含计税方式说明', () => { assert.ok(content.includes('计税方式') || content.includes('价外税')) })
  it('接入管理员权限边界', () => {
    assert.ok(content.includes('AdminPermissionGate'))
    assert.ok(content.includes("requiredPermission: 'foundation.governance.read'"))
  })
})
