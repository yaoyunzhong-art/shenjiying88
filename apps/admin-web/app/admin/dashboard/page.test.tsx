/**
 * admin/dashboard/page.test.tsx — 管理后台全局分析仪表盘源码分析测试
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'

const PAGE = 'apps/admin-web/app/admin/dashboard/page.tsx'
const content = fs.readFileSync(PAGE, 'utf-8')

describe('admin/dashboard 管理后台', () => {
  it('页面文件存在', () => { assert.ok(fs.existsSync(PAGE)) })
  it('包含 default export', () => { assert.ok(content.includes('export default')) })
  it('包含 StatCard', () => { assert.ok(content.includes('StatCard')) })
  it('包含 overview 概览数据', () => { assert.ok(content.includes('totalTenants') && content.includes('totalStores') && content.includes('totalRevenue')) })
  it('包含图表数据', () => { assert.ok(content.includes('data:') || content.includes('series') || content.includes('ECharts') || content.includes('echarts')) })
  it('包含 Tabs', () => { assert.ok(content.includes('Tabs') || content.includes('tabs')) })
  it('包含租户列表', () => { assert.ok(content.includes('tenants') || content.includes('Tenants') || content.includes('租户')) })
  it('包含列表渲染', () => { assert.ok(content.includes('.map(')) })
  it('TSC兼容: 无as any', () => { assert.ok(!content.includes('as any')) })
})
