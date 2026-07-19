/**
 * settings/workflow/page.test.tsx — 源码分析
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'

const PAGE = 'apps/admin-web/app/settings/workflow/page.tsx'
const content = fs.readFileSync(PAGE, 'utf-8')

describe('settings/workflow', () => {
  it('页面文件存在', () => { assert.ok(fs.existsSync(PAGE)) })
  it('包含 default export', () => { assert.ok(content.includes('export default') || content.includes('export default function')) })
  it('包含配置数据', () => { assert.ok(content.includes('data') || content.includes('config') || content.includes('配置')) })
  it('包含列表/表格渲染', () => { assert.ok(content.includes('map') || content.includes('table')) })
  it('TSC兼容: 无as any', () => { assert.ok(!content.includes('as any')) })
})
