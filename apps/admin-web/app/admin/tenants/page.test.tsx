/**
 * admin/tenants/page.test.tsx — 租户配额管理源码分析测试
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'

const PAGE = 'apps/admin-web/app/admin/tenants/page.tsx'
const content = fs.readFileSync(PAGE, 'utf-8')

describe('admin/tenants 租户配额管理', () => {
  it('页面文件存在', () => { assert.ok(fs.existsSync(PAGE)) })
  it('包含 default export', () => { assert.ok(content.includes('export default')) })
  it('包含 DataTable', () => { assert.ok(content.includes('DataTable')) })
  it('包含 SearchFilterInput', () => { assert.ok(content.includes('SearchFilterInput')) })
  it('包含 Pagination', () => { assert.ok(content.includes('Pagination')) })
  it('包含 StatCard 概览', () => { assert.ok(content.includes('StatCard')) })
  it('包含配额状态', () => { assert.ok(content.includes('normal') && content.includes('warning') && content.includes('critical')) })
  it('TSC兼容: 无as any', () => { assert.ok(!content.includes('as any')) })
})
