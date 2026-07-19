/**
 * intelligence/feasibility/page.test.tsx — 可行性报告页面测试
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'

const content = fs.readFileSync('apps/admin-web/app/intelligence/feasibility/page.tsx', 'utf-8')

describe('Feasibility Page', () => {
  it('页面文件存在', () => { assert.ok(fs.existsSync('apps/admin-web/app/intelligence/feasibility/page.tsx')) })

  it('包含城市/区域/预算选择器', () => {
    assert.ok(content.includes('选择城市'))
    assert.ok(content.includes('选择区域'))
    assert.ok(content.includes('预算'))
  })

  it('包含10大城市', () => {
    const cities = ['上海','北京','广州','深圳','成都','杭州','重庆','武汉','西安','南京']
    cities.forEach(c => assert.ok(content.includes(c), `缺少城市: ${c}`))
  })

  it('包含设备配置', () => { assert.ok(content.includes('建议设备配置')) })

  it('包含风险因素', () => { assert.ok(content.includes('风险因素')) })

  it('包含财务全景表', () => { assert.ok(content.includes('财务全景表')) })

  it('包含预算对比', () => { assert.ok(content.includes('预算对比分析')) })

  it('包含同城对比', () => { assert.ok(content.includes('同城平均值对比')) })

  it('包含模拟报告', () => { assert.ok(content.includes('simulateReport')) })

  it('包含模拟财务', () => { assert.ok(content.includes('simulateFinance')) })

  it('TSC兼容: 无as any', () => { assert.ok(!content.includes('as any')) })
})
