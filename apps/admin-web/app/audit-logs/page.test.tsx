/**
 * audit-logs/page.test.tsx — 日志审计页 L1 源码分析测试
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'

const PAGE = 'apps/admin-web/app/audit-logs/page.tsx'
const content = fs.readFileSync(PAGE, 'utf-8')

describe('audit-logs', () => {
  it('页面文件存在', () => { assert.ok(fs.existsSync(PAGE)) })
  it('包含 default export', () => { assert.ok(content.includes('export default')) })
  it('包含 useState', () => { assert.ok(content.includes('useState')) })
  it('包含日志列表渲染', () => { assert.ok(content.includes('.map(')) })
  it('包含筛选过滤', () => { assert.ok(content.includes('filter') || content.includes('Filter')) })
  it('包含搜索功能', () => { assert.ok(content.includes('search') || content.includes('Search') || content.includes('搜索')) })
  it('包含时间显示', () => { assert.ok(content.includes('time') || content.includes('Time') || content.includes('时间')) })
  it('包含操作人', () => { assert.ok(content.includes('用户') || content.includes('user') || content.includes('操作人') || content.includes('admin')) })
  it('包含 IP 字段', () => { assert.ok(content.includes('IP') || content.includes('ip') || content.includes('Ip')) })
  it('包含分页', () => { assert.ok(content.includes('Pagination') || content.includes('pagination') || content.includes('pageSize')) })
  it('包含刷新', () => { assert.ok(content.includes('刷新') || content.includes('refresh') || content.includes('Refresh')) })
  it('TSC兼容: 无 as any', () => { assert.ok(!content.includes('as any')) })
})
