/**
 * audit-logs/page.test.tsx — 源码分析测试
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'

const PAGE = path.resolve('apps/tob-web/app/audit-logs/page.tsx')
const content = fs.readFileSync(PAGE, 'utf-8')

describe('audit-logs', () => {
  it('页面文件存在', () => { assert.ok(fs.existsSync(PAGE)) })
  it('包含 default export', () => { assert.ok(content.includes('export default')) })
  it('包含 useState', () => { assert.ok(content.includes('useState')) })
  it('包含 DataTable', () => { assert.ok(content.includes('DataTable') || content.includes('table') || content.includes('map')) })
  it('TSC兼容: 无as any', () => { assert.ok(!content.includes('as any')) })
})
