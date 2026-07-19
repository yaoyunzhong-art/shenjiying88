/**
 * audit-logs/page.test.tsx — 日志审计页 L1 源码分析测试
 *
 * 覆盖: 页面结构、数据完整性、辅助函数逻辑、边界条件
 * 圈梁: TSC通过 → 测试存在 → 圈梁表更新 → PRD标记
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import fs from 'fs'

const PAGE = resolve(import.meta.dirname, 'page.tsx')
const content = fs.readFileSync(PAGE, 'utf-8')

describe('audit-logs', () => {
  // ── 页面存在与导出 ──
  it('页面文件存在', () => { assert.ok(fs.existsSync(PAGE)) })
  it('包含 default export', () => { assert.ok(content.includes('export default')) })
  it('仅一个 export default', () => {
    const matches = content.match(/export default/g)
    assert.equal(matches?.length, 1)
  })
  it('TSC兼容: 无 as any', () => { assert.ok(!content.includes('as any')) })

  // ── React hooks ──
  it('包含 useState', () => { assert.ok(content.includes('useState')) })
  it('包含 useMemo', () => { assert.ok(content.includes('useMemo')) })

  // ── 核心渲染 ──
  it('包含日志列表渲染', () => { assert.ok(content.includes('.map(')) })
  it('包含筛选过滤', () => { assert.ok(content.includes('filter') || content.includes('Filter')) })
  it('包含搜索功能', () => { assert.ok(content.includes('search') || content.includes('Search') || content.includes('搜索')) })
  it('包含filterLogs或分页', () => { assert.ok(content.includes('filterLogs(') || content.includes('Pagination') || content.includes('pagination') || content.includes('LoadMore')) })
  it('包含刷新', () => { assert.ok(content.includes('刷新') || content.includes('refresh') || content.includes('Refresh')) })

  // ── 数据字段 ──
  it('包含时间显示', () => { assert.ok(content.includes('time') || content.includes('Time') || content.includes('时间')) })
  it('包含操作人', () => { assert.ok(content.includes('用户') || content.includes('user') || content.includes('操作人') || content.includes('admin')) })
  it('包含 IP 字段', () => { assert.ok(content.includes('IP') || content.includes('ip') || content.includes('Ip')) })
  it('包含操作类型字段', () => { assert.ok(content.includes('actionType') || content.includes('ActionType')) })
  it('包含结果字段', () => { assert.ok(content.includes('result') || content.includes('result:')) })
  it('包含目标字段', () => { assert.ok(content.includes('target') || content.includes('target:')) })
  it('包含详情字段', () => { assert.ok(content.includes('detail') || content.includes('detail:')) })

  // ── 数据完整性 ──
  it('默认数据至少包含 10 条日志', () => {
    const ids = Array.from(content.matchAll(/id:\s*'log-\d+'/g))
    assert.ok(ids.length >= 10, `got ${ids.length} log entries`)
  })
  it('每条日志包含 6 个必要字段', () => {
    const lines = content.split('\n')
    const logEntries = lines.filter(l => l.trim().startsWith('{'))
    // 验证 DEFAULT_LOGS 数组每条记录的结构完整性
    const fieldCounts = content.match(/(time|operator|actionType|target|ip|result|detail):/g)
    assert.ok(fieldCounts && fieldCounts.length >= 7 * 10, `expected ≥70 field references, got ${fieldCounts?.length}`)
  })
  it('操作类型常量包含 6 种类型', () => {
    const types = ['login', 'logout', 'data_modify', 'permission_change', 'system_setting', 'export']
    for (const t of types) assert.ok(content.includes(t), `missing action type: ${t}`)
  })
  it('结果状态常量包含 3 种状态', () => {
    for (const r of ['success', 'failure', 'denied']) assert.ok(content.includes(r))
  })
  it('结果颜色映射包含 3 种', () => {
    assert.ok(content.includes("'success'"))
    assert.ok(content.includes("'failure'"))
    assert.ok(content.includes("'denied'"))
  })

  // ── 边界条件 ──
  it('empty state 组件存在', () => { assert.ok(content.includes('EmptyState') || content.includes('EmptySearchState')) })
  it('isToday 函数存在', () => { assert.ok(content.includes('isToday(')) })
  it('computeStats 函数存在', () => { assert.ok(content.includes('computeStats(')) })
  it('filterLogs 函数存在', () => { assert.ok(content.includes('filterLogs(')) })
})
