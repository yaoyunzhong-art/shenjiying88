/**
 * customers/new/page.test.tsx — 源码分析测试
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'

const PAGE = path.resolve('apps/tob-web/app/customers/new/page.tsx')
const content = fs.readFileSync(PAGE, 'utf-8')

describe('customers/new', () => {
  it('页面文件存在', () => { assert.ok(fs.existsSync(PAGE)) })
  it('包含 default export', () => { assert.ok(content.includes('export default')) })
  it('包含 useState/useEffect', () => { assert.ok(content.includes('useState') || content.includes('useEffect')) })
  it('包含列表渲染', () => { assert.ok(content.includes('.map(') || content.includes('map(')) })
  it('TSC兼容: 无as any', () => { assert.ok(!content.includes('as any')) })
})
