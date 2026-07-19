/**
 * settings/membership-levels/page.test.tsx — 会员等级设置 L1 测试
 *
 * 覆盖: 页面结构、等级数据完整性、数据验证
 * 圈梁: TSC通过 → 测试存在 → 圈梁表更新 → PRD标记
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import fs from 'fs'

const PAGE = resolve(import.meta.dirname, 'page.tsx')
const content = fs.readFileSync(PAGE, 'utf-8')

describe('settings/membership-levels', () => {
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
  it('包含 LEVELS 数组', () => { assert.ok(content.includes('LEVELS')) })
  it('包含 4 个会员等级', () => {
    const levels = Array.from(content.matchAll(/level:\s*\d+/g))
    assert.equal(levels.length, 4, `got ${levels.length} levels`)
  })
  it('等级名称包含普通/银卡/金卡/钻石', () => {
    assert.ok(content.includes('普通会员'))
    assert.ok(content.includes('银卡会员'))
    assert.ok(content.includes('金卡会员'))
    assert.ok(content.includes('钻石会员'))
  })
  it('等级有最低积分规则', () => {
    assert.ok(content.includes('minPoints'))
  })
  it('等级有 discount 字段', () => {
    assert.ok(content.includes('discount'))
  })
  it('等级积分递增', () => {
    const points = Array.from(content.matchAll(/minPoints:\s*(\d+)/g)).map(m => parseInt(m[1], 10))
    assert.ok(points.length >= 4, `got ${points.length} point values`)
    for (let i = 1; i < points.length; i++) {
      assert.ok(points[i] > points[i-1], `level ${i} points (${points[i]}) not > level ${i-1} (${points[i-1]})`)
    }
  })

  // ── 页面结构 ──
  it('包含表格渲染', () => { assert.ok(content.includes('map(') || content.includes('table')) })
  it('包含标题 "会员等级设置"', () => { assert.ok(content.includes('会员等级设置')) })
  it('包含升降级规则说明', () => { assert.ok(content.includes('升降级') || content.includes('升级规则')) })
  it('包含等级定义 section', () => { assert.ok(content.includes('等级定义')) })
  it('每个等级有 benefits 字段', () => {
    const benefits = Array.from(content.matchAll(/benefits:/g))
    assert.equal(benefits.length, 4, `got ${benefits.length} benefits`)
  })
})
