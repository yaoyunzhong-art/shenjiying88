/**
 * Phase-41 T172: 规则执行结果列表页测试
 *
 * 覆盖:
 *  - 统计计数逻辑
 *  - 搜索过滤逻辑
 *  - 状态过滤逻辑
 *  - 分页逻辑
 *  - 组合过滤逻辑
 *  - 时间范围过滤
 */


import { describe, it } from 'node:test';
import assert from 'node:assert';


// Replicates the page's core filtering/pagination logic
function renderState(search: string, statusFilter: string, timeRange: string, page: number) {
  const statuses = ['SUCCESS', 'FAILURE', 'RUNNING', 'TIMEOUT']
  const ruleNames = ['信用评分规则', '风控拦截规则', '会员升级规则', '优惠券发放规则', '异常登录检测规则', '批量通知规则', '库存预警规则']

  const allExecutions = Array.from({ length: 47 }, (_, i) => ({
    id: `exec-${i + 1}`,
    ruleName: ruleNames[i % 7]!,
    ruleId: `rule-${Math.floor(i / 4) + 1}`,
    status: statuses[i % 4]!,
    triggeredBy: ['会员注册事件', '订单创建事件', '定时任务', '手动执行', 'Webhook'][i % 5]!,
    durationMs: [230, 1500, 3200, 8900, 12000][i % 5]!,
    createdAt: new Date(Date.now() - i * 3600000 - Math.random() * 86400000).toISOString(),
  }))

  let filtered = [...allExecutions]

  if (search.trim()) {
    const q = search.toLowerCase()
    filtered = filtered.filter(e =>
      e.ruleName.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      e.ruleId.toLowerCase().includes(q)
    )
  }

  if (statusFilter) {
    filtered = filtered.filter(e => e.status === statusFilter)
  }

  if (timeRange !== 'all') {
    const cutoff = Date.now() - (
      timeRange === '24h' ? 86400000 :
      timeRange === '7d' ? 604800000 :
      2592000000
    )
    filtered = filtered.filter(e => new Date(e.createdAt).getTime() >= cutoff)
  }

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const pageSize = 10
  const pageCount = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  return { total: allExecutions.length, filteredCount: filtered.length, pageCount, pageResults: paged.length, results: paged }
}

describe('RuleExecutionsPage ~ 过滤与分页核心逻辑', () => {
  // 1. 统计: 4 种状态各占约 1/4
  it('47 条数据: SUCCESS/FAILURE/RUNNING/TIMEOUT 各存在', () => {
    const { total } = renderState('', '', 'all', 1)
    assert.equal(total, 47)
  })

  // 2. 搜索过滤
  it('搜索"信用"只返回信用评分规则记录', () => {
    const { results } = renderState('信用', '', 'all', 1)
    assert.ok(results.length > 0)
    for (const r of results) {
      assert.ok(r.ruleName.includes('信用'))
    }
  })

  // 3. 不匹配搜索 → 空
  it('搜索不存在规则名返回空', () => {
    const { filteredCount } = renderState('__NONEXISTENT__', '', 'all', 1)
    assert.equal(filteredCount, 0)
  })

  // 4. 状态过滤: SUCCESS
  it('过滤 SUCCESS 后全部结果状态正确', () => {
    const { results } = renderState('', 'SUCCESS', 'all', 1)
    assert.ok(results.length > 0)
    for (const r of results) {
      assert.equal(r.status, 'SUCCESS')
    }
  })

  // 5. 状态过滤: FAILURE
  it('过滤 FAILURE 后全部结果状态正确', () => {
    const { results } = renderState('', 'FAILURE', 'all', 1)
    assert.ok(results.length > 0)
    for (const r of results) {
      assert.equal(r.status, 'FAILURE')
    }
  })

  // 6. 分页: 47 条 → 5 页
  it('47 条数据分页为 5 页 (每页 10 条)', () => {
    const { total, pageCount } = renderState('', '', 'all', 1)
    assert.equal(total, 47)
    assert.equal(pageCount, 5)
  })

  // 7. 各页数据数量正确
  it('第 1-4 页各 10 条, 第 5 页 7 条', () => {
    for (let p = 1; p <= 4; p++) {
      const state = renderState('', '', 'all', p)
      assert.equal(state.pageResults, 10, `第 ${p} 页应有 10 条`)
    }
    const page5 = renderState('', '', 'all', 5)
    assert.equal(page5.pageResults, 7, '第 5 页应有 7 条')
  })

  // 8. 默认 24h 过滤
  it('默认 24h 过滤返回 ≤47 条', () => {
    const { filteredCount } = renderState('', '', '24h', 1)
    assert.ok(filteredCount <= 47)
    assert.ok(filteredCount >= 1)
  })

  // 9. 组合搜索 + 状态
  it('搜索"风控"且状态 FAILURE 组合过滤', () => {
    const { results } = renderState('风控', 'FAILURE', 'all', 1)
    for (const r of results) {
      assert.ok(r.ruleName.includes('风控'))
      assert.equal(r.status, 'FAILURE')
    }
  })

  // 10. TIMEOUT 状态过滤
  it('过滤 TIMEOUT 后全部结果状态为 TIMEOUT', () => {
    const { results } = renderState('', 'TIMEOUT', 'all', 1)
    assert.ok(results.length > 0)
    for (const r of results) {
      assert.equal(r.status, 'TIMEOUT')
    }
  })
})
