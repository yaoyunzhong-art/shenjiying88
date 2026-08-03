/**
 * ai-marketing/page.test.tsx — AI营销页面源码分析测试
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'

const PAGE = path.resolve('apps/tob-web/app/ai-marketing/page.tsx')
const content = fs.readFileSync(PAGE, 'utf-8')

describe('ai-marketing AI营销页面', () => {
  it('页面文件存在', () => { assert.ok(fs.existsSync(PAGE)) })
  it('包含 default export', () => { assert.ok(content.includes('export default')) })
  it('包含4个Tab', () => {
    assert.ok(content.includes('campaigns'))
    assert.ok(content.includes('copy'))
    assert.ok(content.includes('abtest'))
    assert.ok(content.includes('segments'))
  })
  it('包含useState', () => { assert.ok(content.includes('useState')) })
  it('包含useEffect', () => { assert.ok(content.includes('useEffect')) })
  it('包含status颜色映射', () => { assert.ok(content.includes('STATUS_COLORS')) })
  it('包含活动列表渲染', () => { assert.ok(content.includes('.map(')) })
  it('包含 Tab 切换', () => { assert.ok(content.includes('Tab') || content.includes('tab')) })
  it('TSC兼容: 无as any', () => { assert.ok(!content.includes('as any')) })
})
