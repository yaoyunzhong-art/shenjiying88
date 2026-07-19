/**
 * intelligence/operations/page.test.tsx — 运营参谋AI选择题测试
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'

const content = fs.readFileSync('apps/admin-web/app/intelligence/operations/page.tsx', 'utf-8')

describe('Operations Page', () => {
  it('页面文件存在', () => { assert.ok(fs.existsSync('apps/admin-web/app/intelligence/operations/page.tsx')) })

  it('包含7大类AI选择题', () => {
    assert.ok(content.includes('pricing'))
    assert.ok(content.includes('activity'))
    assert.ok(content.includes('equipment'))
    assert.ok(content.includes('promotion'))
    assert.ok(content.includes('recruit'))
    assert.ok(content.includes('seasonal'))
    assert.ok(content.includes('blindbox'))
  })

  it('每个选项有dataEvidence', () => {
    const evidences = content.match(/dataEvidence/g)
    assert.ok(evidences)
    assert.ok(evidences.length >= 21)
  })

  it('包含城市选择器', () => {
    assert.ok(content.includes('同城数据参考'))
    assert.ok(content.includes('选择城市'))
  })

  it('包含7大城市', () => {
    const cities = ['上海', '北京', '广州', '深圳', '成都', '杭州', '南京']
    cities.forEach(c => assert.ok(content.includes(c), `缺少城市: ${c}`))
  })

  it('包含历史案例模式', () => {
    assert.ok(content.includes('历史案例模式'))
    assert.ok(content.includes('同城活动历史案例'))
  })

  it('AI建议面板存在', () => { assert.ok(content.includes('AI建议')) })

  it('TSC兼容: 无as any', () => { assert.ok(!content.includes('as any')) })
})
