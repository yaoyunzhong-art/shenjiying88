/**
 * dynamic route: [id]/page.test.tsx
 * 源码分析测试—兼容node:test, 不依赖JSX渲染
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PAGE = path.resolve(__dirname, 'page.tsx')
const content = fs.readFileSync(PAGE, 'utf-8')

describe('stock-transfer/[id] 页面', () => {
  it('页面文件存在', () => { assert.ok(fs.existsSync(PAGE)) })
  it('包含default export', () => { assert.ok(content.includes('export default')) })
  it('应接入管理员权限边界', () => {
    assert.ok(content.includes('AdminPermissionGate'))
    assert.ok(content.includes("requiredPermission: 'stock-transfer:read'"))
  })
  it('应为异步详情页', () => { assert.ok(content.includes('async function') || content.includes('await params')) })
  it('包含loading状态', () => { assert.ok(content.includes('loading') || content.includes('Loading')) })
  it('无as any', () => { assert.ok(!content.includes('as any')) })
})
