/**
 * intelligence/monitor/page.test.tsx — 竞争监控页面测试
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'

const content = fs.readFileSync('apps/admin-web/app/intelligence/monitor/page.tsx', 'utf-8')

describe('Monitor Page', () => {
  it('页面文件存在', () => { assert.ok(fs.existsSync('apps/admin-web/app/intelligence/monitor/page.tsx')) })

  it('包含6种告警类型', () => {
    assert.ok(content.includes('price_change'))
    assert.ok(content.includes('new_activity'))
    assert.ok(content.includes('new_promotion'))
    assert.ok(content.includes('rating_change'))
    assert.ok(content.includes('equipment_change'))
    assert.ok(content.includes('policy_change'))
  })

  it('有3级严重度', () => {
    assert.ok(content.includes('high'))
    assert.ok(content.includes('medium'))
    assert.ok(content.includes('low'))
  })

  it('从API获取数据', () => { assert.ok(content.includes('/intelligence/monitor/summary')) })

  it('有降级mock数据', () => { assert.ok(content.includes('generateMockData')) })

  it('有自动刷新', () => { assert.ok(content.includes('autoRefresh') || content.includes('30_000')) })

  it('展示趋势图', () => {
    assert.ok(content.includes('trend'))
    assert.ok(content.includes('TrendPoint'))
  })

  it('TSC兼容: 无as any', () => { assert.ok(!content.includes('as any')) })
})
