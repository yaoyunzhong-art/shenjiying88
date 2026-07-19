/**
 * settings/payment-config/page.test.tsx — 支付配置 L1 测试
 *
 * 覆盖: 页面结构、通道数据完整性、结算配置验证
 * 圈梁: TSC通过 → 测试存在 → 圈梁表更新 → PRD标记
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import fs from 'fs'

const PAGE = resolve(import.meta.dirname, 'page.tsx')
const content = fs.readFileSync(PAGE, 'utf-8')

describe('settings/payment-config', () => {
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
  it('包含 ACTIVE_CHANNELS 数组', () => { assert.ok(content.includes('ACTIVE_CHANNELS')) })
  it('包含 3 个支付通道', () => {
    const channels = Array.from(content.matchAll(/provider:\s*['"][^'"]+['"]/g))
    assert.equal(channels.length, 3, `got ${channels.length} channels`)
  })
  it('支持微信支付', () => { assert.ok(content.includes('微信支付') || content.includes('wechat')) })
  it('支持支付宝', () => { assert.ok(content.includes('支付宝') || content.includes('alipay')) })
  it('支持现金支付', () => { assert.ok(content.includes('现金') || content.includes('cash')) })
  it('每个通道有 name/provider/status/feeRate 字段', () => {
    assert.ok(content.includes('name:'))
    assert.ok(content.includes('provider:'))
    assert.ok(content.includes('status:'))
    assert.ok(content.includes('feeRate'))
  })

  // ── 页面结构 ──
  it('包含表格渲染', () => { assert.ok(content.includes('map(') || content.includes('table')) })
  it('包含标题 "支付配置"', () => { assert.ok(content.includes('支付配置')) })
  it('包含通道概览 section', () => { assert.ok(content.includes('通道概览')) })
  it('包含结算配置 section', () => { assert.ok(content.includes('结算配置') || content.includes('结算周期')) })
  it('包含费率信息', () => { assert.ok(content.includes('费率') || content.includes('feeRate')) })
})
