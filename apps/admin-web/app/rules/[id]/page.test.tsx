/**
 * rules/[id]/page.test.tsx — 源码分析测试
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'

const PAGE = 'apps/admin-web/app/rules/[id]/page.tsx'
const content = fs.readFileSync(PAGE, 'utf-8')

describe('rules/[id] 页面', () => {
  it('页面文件存在', () => { assert.ok(fs.existsSync(PAGE)) })
  it('包含default export', () => { assert.ok(content.includes('export default')) })
  it('包含useState/useEffect', () => { assert.ok(content.includes('useState') || content.includes('useEffect')) })
  it('包含loading状态', () => { assert.ok(content.includes('loading') || content.includes('Loading')) })
  it('无as any', () => { assert.ok(!content.includes('as any')) })
})
