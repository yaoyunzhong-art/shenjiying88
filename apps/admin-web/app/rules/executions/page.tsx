'use client'

/**
 * Phase-41 T172: 规则执行结果列表页 (admin-web)
 *
 * 功能:
 *  - 搜索规则名称/ID
 *  - 按状态过滤 (成功/失败/进行中/超时)
 *  - 按时间范围过滤
 *  - 分页展示
 *  - 状态徽章/持续时间/触发上下文
 */

import { useState, useMemo } from 'react'
import { PageShell, StatCard, ListToolbar } from '@m5/ui'

type ExecutionStatus = 'SUCCESS' | 'FAILURE' | 'RUNNING' | 'TIMEOUT'
type TimeRange = '24h' | '7d' | '30d' | 'all'

interface RuleExecution {
  id: string
  ruleName: string
  ruleId: string
  status: ExecutionStatus
  triggeredBy: string
  durationMs: number
  inputSummary: string
  outputSummary: string
  errorMessage?: string
  createdAt: string
}

const STATUS_COLORS: Record<ExecutionStatus, string> = {
  SUCCESS: '#065f46',
  FAILURE: '#991b1b',
  RUNNING: '#1e40af',
  TIMEOUT: '#92400e',
}

const STATUS_BG: Record<ExecutionStatus, string> = {
  SUCCESS: '#d1fae5',
  FAILURE: '#fee2e2',
  RUNNING: '#dbeafe',
  TIMEOUT: '#fef3c7',
}

const mockExecutions: RuleExecution[] = Array.from({ length: 47 }, (_, i) => {
  const id = `exec-${i + 1}`
  const statuses: ExecutionStatus[] = ['SUCCESS', 'FAILURE', 'RUNNING', 'TIMEOUT']
  const status = statuses[i % 4]
  const durationMs = [230, 1500, 3200, 8900, 12000][i % 5]
  return {
    id,
    ruleName: ['信用评分规则', '风控拦截规则', '会员升级规则', '优惠券发放规则', '异常登录检测规则', '批量通知规则', '库存预警规则'][i % 7] as string,
    ruleId: `rule-${Math.floor(i / 4) + 1}`,
    status: status as ExecutionStatus,
    triggeredBy: ['会员注册事件', '订单创建事件', '定时任务', '手动执行', 'Webhook'][i % 5] as string,
    durationMs: durationMs as number,
    inputSummary: i % 3 === 0 ? `事件: { type: "order.created", orderId: "ORD-${1000 + i}" }` : `事件: { type: "member.login", memberId: "M${10000 + i}" }`,
    outputSummary: status === 'SUCCESS' ? '规则匹配 → 动作已分发' : status === 'FAILURE' ? `执行失败: 上游接口超时 (HTTP 504)` : status === 'RUNNING' ? '规则逻辑执行中...' : '超时: 超过最大执行时长 10s',
    errorMessage: status === 'FAILURE' ? `上游服务 ${['unavailable', 'rate-limited', 'internal-error'][i % 3]}` : undefined,
    createdAt: new Date(Date.now() - i * 3600000 - Math.random() * 86400000).toISOString(),
  }
})

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

const PAGE_SIZE = 10

export default function RuleExecutionsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | ''>('')
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let list = [...mockExecutions]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.ruleName.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.ruleId.toLowerCase().includes(q)
      )
    }

    if (statusFilter) {
      list = list.filter(e => e.status === statusFilter)
    }

    if (timeRange !== 'all') {
      const cutoff = Date.now() - (
        timeRange === '24h' ? 86400000 :
        timeRange === '7d' ? 604800000 :
        2592000000
      )
      list = list.filter(e => new Date(e.createdAt).getTime() >= cutoff)
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return list
  }, [search, statusFilter, timeRange])

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="规则执行结果"
        subtitle="查看全部规则引擎的执行记录，搜索、过滤、追踪每次规则匹配与动作分发的状态。"
      >
        {/* Stats */}
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
          <StatCard label="总计" value={mockExecutions.length} helper="全部执行记录" />
          <StatCard label="成功" value={mockExecutions.filter(e => e.status === 'SUCCESS').length} tone="success" helper="规则匹配通过" />
          <StatCard label="失败" value={mockExecutions.filter(e => e.status === 'FAILURE').length} tone="danger" helper="执行异常" />
          <StatCard label="进行中" value={mockExecutions.filter(e => e.status === 'RUNNING').length} tone="info" helper="仍在执行" />
        </div>

        {/* Filters */}
        <div style={{ marginBottom: 16 }}>
          <ListToolbar
            searchValue={search}
            onSearchChange={v => { setSearch(v); setPage(1) }}
            searchPlaceholder="搜索规则名称 / ID / 规则ID..."
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 0' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 13, color: '#6b7280' }}>状态:</label>
              {(['', 'SUCCESS', 'FAILURE', 'RUNNING', 'TIMEOUT'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1) }}
                  style={{
                    padding: '4px 12px', borderRadius: 14, fontSize: 12, border: '1px solid #d1d5db',
                    background: statusFilter === s ? '#2563eb' : '#fff',
                    color: statusFilter === s ? '#fff' : '#374151', cursor: 'pointer',
                  }}
                >
                  {s || '全部'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 13, color: '#6b7280' }}>时间:</label>
              {(['24h', '7d', '30d', 'all'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTimeRange(t); setPage(1) }}
                  style={{
                    padding: '4px 12px', borderRadius: 14, fontSize: 12, border: '1px solid #d1d5db',
                    background: timeRange === t ? '#2563eb' : '#fff',
                    color: timeRange === t ? '#fff' : '#374151', cursor: 'pointer',
                  }}
                >
                  {{ '24h': '24小时', '7d': '7天', '30d': '30天', 'all': '全部' }[t]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        {paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
            暂无匹配的执行记录
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['规则名称', '状态', '触发上下文', '持续时间', '执行时间', '操作'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 500 }}>{e.ruleName}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{e.ruleId}</div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11,
                        background: STATUS_BG[e.status], color: STATUS_COLORS[e.status],
                      }}>
                        {e.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280' }}>
                      {e.triggeredBy}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{formatDuration(e.durationMs)}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: 12 }}>{formatDate(e.createdAt)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <a
                        href={`/rules/executions/${e.id}`}
                        style={{ color: '#2563eb', textDecoration: 'none', fontSize: 12 }}
                        onClick={evt => { evt.preventDefault(); window.open(`/rules/executions/${e.id}`, '_blank') }}
                      >
                        详情 →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pageCount > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '14px 0', borderTop: '1px solid #e5e7eb' }}>
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>
                  上一页
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.min(pageCount, page + 2)).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{
                      padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db',
                      background: p === page ? '#2563eb' : '#fff',
                      color: p === page ? '#fff' : '#374151', cursor: 'pointer', fontWeight: p === page ? 600 : 400,
                    }}>
                    {p}
                  </button>
                ))}
                <button disabled={page >= pageCount} onClick={() => setPage(page + 1)}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: page >= pageCount ? 'not-allowed' : 'pointer', opacity: page >= pageCount ? 0.5 : 1 }}>
                  下一页
                </button>
              </div>
            )}
          </div>
        )}
      </PageShell>
    </main>
  )
}
