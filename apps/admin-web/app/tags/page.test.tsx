/**
 * tags/page.test.tsx — 客户标签管理页面源码分析测试
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'

const PAGE = 'apps/admin-web/app/tags/page.tsx'
const content = fs.readFileSync(PAGE, 'utf-8')

describe('tags 客户标签管理页面', () => {
  it('页面文件存在', () => { assert.ok(fs.existsSync(PAGE)) })
  it('包含default export', () => { assert.ok(content.includes('export default')) })
  it('包含useState', () => { assert.ok(content.includes('useState')) })
  it('包含PageShell', () => { assert.ok(content.includes('PageShell')) })
  it('包含列表渲染', () => { assert.ok(content.includes('.map(')) })
  it('包含标签数据', () => { assert.ok(content.includes('标签') || content.includes('tag')) })
  it('TSC兼容: 无as any', () => { assert.ok(!content.includes('as any')) })
  it('圈梁四道箍注释存在', () => { assert.ok(content.includes('圈梁四道箍')) })
})
