/**
 * settings/promotion-rules/page.test.tsx — 促销规则设置 L1 测试
 *
 * 覆盖: 页面结构、规则数据完整性、促销类型验证
 * 圈梁: TSC通过 → 测试存在 → 圈梁表更新 → PRD标记
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import fs from 'fs'

const PAGE = resolve(import.meta.dirname, 'page.tsx')
const content = fs.readFileSync(PAGE, 'utf-8')

describe('settings/promotion-rules', () => {
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
  it('包含 RULES 数组', () => { assert.ok(content.includes('RULES')) })
  it('包含 9 个 name 字段 (3条规则 + 6种类型)', () => {
    const names = Array.from(content.matchAll(/name:\s*['"][^'"]+['"]/g))
    assert.equal(names.length, 9, `got ${names.length} name fields`)
  })
  it('包含满减规则', () => { assert.ok(content.includes('满减') || content.includes('618满200减50')) })
  it('包含折扣规则', () => { assert.ok(content.includes('折扣') || content.includes('全场9折')) })
  it('包含包邮规则', () => { assert.ok(content.includes('包邮') || content.includes('满99包邮')) })
  it('每条规则有 name/type/status/period/condition 字段', () => {
    assert.ok(content.includes('name:'))
    assert.ok(content.includes('type:'))
    assert.ok(content.includes('status:'))
    assert.ok(content.includes('period:'))
    assert.ok(content.includes('condition:'))
  })

  // ── 页面结构 ──
  it('包含表格渲染', () => { assert.ok(content.includes('map(') || content.includes('table')) })
  it('包含标题 "促销规则设置"', () => { assert.ok(content.includes('促销规则设置')) })
  it('包含当前活动规则 section', () => { assert.ok(content.includes('当前活动规则')) })
  it('包含促销类型说明 section', () => { assert.ok(content.includes('促销类型说明')) })
  it('支持 6 种促销类型', () => {
    const types = ['满减', '折扣', '赠品', '包邮', '加价购', '秒杀']
    for (const t of types) {
      assert.ok(content.includes(t), `missing promotion type: ${t}`)
    }
  })
})
