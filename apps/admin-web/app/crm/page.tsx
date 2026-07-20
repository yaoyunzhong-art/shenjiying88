/**
 * crm/page.tsx — CRM客户管理列表页 (admin-web)
 *
 * 功能: 客户列表(姓名/邮箱/电话/标签/评分/最近交互)、搜索/筛选、详情弹窗
 * 三态: loading/empty/error
 *
 * PRD: docs/knowledge/prd/v23/v23-prd-crm-management.md
 * API 端点: GET /api/crm/customers, GET /api/crm/customers/:id, GET /api/crm/stats
 */
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  Badge,
  DataTable,
  Dialog,
  LoadingSkeleton,
  StatCard,
  type DataTableColumn,
} from '@m5/ui'

import {
  CRM_STATUSES,
  CRM_STATUS_MAP,
  INTERACTION_TYPE_MAP,
  INTERACTION_TYPES,
  MOCK_CRM_CUSTOMERS,
  MOCK_CRM_STATS,
  TICKET_PRIORITY_MAP,
  TICKET_STATUS_MAP,
  formatCents,
  formatDate,
  formatDateTime,
  getScoreLevel,
  type CrmCustomerStatus,
  type CrmInteraction,
  type CustomerProfile,
  type Ticket,
} from './crm-data'

const PER_PAGE = 10

// ─── 筛选函数 ───

function filterCustomers(
  items: CustomerProfile[],
  search: string,
  statusFilter: CrmCustomerStatus | 'all',
  minScore: number,
  maxScore: number,
): CustomerProfile[] {
  let result = items

  if (search.trim()) {
    const lower = search.toLowerCase()
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.phone.toLowerCase().includes(lower) ||
        c.email.toLowerCase().includes(lower),
    )
  }

  if (statusFilter !== 'all') {
    result = result.filter((c) => c.status === statusFilter)
  }

  result = result.filter((c) => c.engagementScore >= minScore && c.engagementScore <= maxScore)

  return result
}

// ─── 详情弹窗 ───

interface DetailDialogProps {
  customer: CustomerProfile | null
  onClose: () => void
}

function DetailDialog({ customer, onClose }: DetailDialogProps) {
  if (!customer) return null

  const scoreInfo = getScoreLevel(customer.engagementScore)

  return (
    <Dialog open onClose={onClose} title={`客户详情: ${customer.name}`} style={{ maxWidth: 720, width: '90vw' }}>
      {/* 基础信息 */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 12, borderBottom: '1px solid rgba(148,163,184,0.2)', paddingBottom: 8 }}>
          基础信息
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
          <div><span style={{ color: '#94a3b8' }}>姓名：</span><span style={{ color: '#e2e8f0' }}>{customer.name}</span></div>
          <div><span style={{ color: '#94a3b8' }}>邮箱：</span><span style={{ color: '#e2e8f0' }}>{customer.email}</span></div>
          <div><span style={{ color: '#94a3b8' }}>手机：</span><span style={{ color: '#e2e8f0' }}>{customer.phone}</span></div>
          <div><span style={{ color: '#94a3b8' }}>状态：</span>
            <Badge variant={CRM_STATUS_MAP[customer.status].variant}>{CRM_STATUS_MAP[customer.status].label}</Badge>
          </div>
          <div><span style={{ color: '#94a3b8' }}>到店次数：</span><span style={{ color: '#e2e8f0' }}>{customer.visitCount} 次</span></div>
          <div><span style={{ color: '#94a3b8' }}>累计消费：</span><span style={{ color: '#e2e8f0' }}>{formatCents(customer.totalSpentCents)}</span></div>
          <div><span style={{ color: '#94a3b8' }}>最近到店：</span><span style={{ color: '#e2e8f0' }}>{customer.lastVisitAt ? formatDateTime(customer.lastVisitAt) : '从未到店'}</span></div>
          <div><span style={{ color: '#94a3b8' }}>注册时间：</span><span style={{ color: '#e2e8f0' }}>{formatDateTime(customer.createdAt)}</span></div>
        </div>
      </div>

      {/* 评分 */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 12, borderBottom: '1px solid rgba(148,163,184,0.2)', paddingBottom: 8 }}>
          活跃评分
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 60, height: 60, borderRadius: '50%',
              background: `conic-gradient(${scoreInfo.color} ${customer.engagementScore}%, rgba(148,163,184,0.15) ${customer.engagementScore}%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: scoreInfo.color,
            }}
          >
            {customer.engagementScore}
          </div>
          <div>
            <Badge variant={customer.engagementScore >= 80 ? 'success' : customer.engagementScore >= 50 ? 'warning' : 'neutral'}>
              {scoreInfo.label}
            </Badge>
            <div style={{ marginTop: 4, color: '#94a3b8', fontSize: 13 }}>评分区间 0-100</div>
          </div>
        </div>
      </div>

      {/* 标签 */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 12, borderBottom: '1px solid rgba(148,163,184,0.2)', paddingBottom: 8 }}>
          客户标签
        </h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {customer.tags.length === 0 ? (
            <span style={{ color: '#94a3b8', fontSize: 14 }}>暂无标签</span>
          ) : (
            customer.tags.map((tag) => (
              <Badge key={tag} variant="info">{tag}</Badge>
            ))
          )}
        </div>
      </div>

      {/* 备注 */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 12, borderBottom: '1px solid rgba(148,163,184,0.2)', paddingBottom: 8 }}>
          备注 ({customer.notes.length})
        </h3>
        {customer.notes.length === 0 ? (
          <span style={{ color: '#94a3b8', fontSize: 14 }}>暂无备注</span>
        ) : (
          customer.notes.map((note) => (
            <div key={note.id} style={{ marginBottom: 8, padding: 10, background: 'rgba(15,23,42,0.5)', borderRadius: 8, border: '1px solid rgba(148,163,184,0.1)' }}>
              <div style={{ color: '#cbd5e1', fontSize: 14, marginBottom: 4 }}>{note.content}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>{note.createdBy} · {formatDateTime(note.createdAt)}</div>
            </div>
          ))
        )}
      </div>

      {/* 交互记录 */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 12, borderBottom: '1px solid rgba(148,163,184,0.2)', paddingBottom: 8 }}>
          交互记录 ({customer.interactions.length})
        </h3>
        {customer.interactions.length === 0 ? (
          <span style={{ color: '#94a3b8', fontSize: 14 }}>暂无交互记录</span>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>类型</th>
                <th style={{ padding: '6px 8px' }}>摘要</th>
                <th style={{ padding: '6px 8px' }}>操作人</th>
                <th style={{ padding: '6px 8px' }}>时间</th>
              </tr>
            </thead>
            <tbody>
              {customer.interactions.map((ix) => (
                <tr key={ix.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.05)' }}>
                  <td style={{ padding: '6px 8px', color: '#cbd5e1' }}><Badge variant="neutral">{INTERACTION_TYPE_MAP[ix.type]}</Badge></td>
                  <td style={{ padding: '6px 8px', color: '#e2e8f0' }}>{ix.summary}</td>
                  <td style={{ padding: '6px 8px', color: '#94a3b8' }}>{ix.createdBy}</td>
                  <td style={{ padding: '6px 8px', color: '#94a3b8' }}>{formatDateTime(ix.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 工单列表 */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 12, borderBottom: '1px solid rgba(148,163,184,0.2)', paddingBottom: 8 }}>
          工单 ({customer.tickets.length})
        </h3>
        {customer.tickets.length === 0 ? (
          <span style={{ color: '#94a3b8', fontSize: 14 }}>暂无工单</span>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>主题</th>
                <th style={{ padding: '6px 8px' }}>优先级</th>
                <th style={{ padding: '6px 8px' }}>状态</th>
                <th style={{ padding: '6px 8px' }}>负责人</th>
                <th style={{ padding: '6px 8px' }}>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {customer.tickets.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.05)' }}>
                  <td style={{ padding: '6px 8px', color: '#e2e8f0' }}>{t.subject}</td>
                  <td style={{ padding: '6px 8px' }}><Badge variant={TICKET_PRIORITY_MAP[t.priority].variant}>{TICKET_PRIORITY_MAP[t.priority].label}</Badge></td>
                  <td style={{ padding: '6px 8px' }}><Badge variant={TICKET_STATUS_MAP[t.status].variant}>{TICKET_STATUS_MAP[t.status].label}</Badge></td>
                  <td style={{ padding: '6px 8px', color: '#94a3b8' }}>{t.assignedTo}</td>
                  <td style={{ padding: '6px 8px', color: '#94a3b8' }}>{formatDateTime(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Dialog>
  )
}

// ─── 主页面组件 ───

export default function CrmPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<CrmCustomerStatus | 'all'>('all')
  const [minScore, setMinScore] = useState(0)
  const [maxScore, setMaxScore] = useState(100)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null)
  const [isClient, setIsClient] = useState(false)

  // 模拟异步数据加载
  useEffect(() => {
    setIsClient(true)
    setLoading(true)
    setError(null)
    // 模拟网络延迟
    const timer = setTimeout(() => {
      setLoading(false)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const filtered = useMemo(
    () => filterCustomers(MOCK_CRM_CUSTOMERS, searchTerm, statusFilter, minScore, maxScore),
    [searchTerm, statusFilter, minScore, maxScore],
  )

  const paged = useMemo(() => {
    const start = page * PER_PAGE
    return filtered.slice(start, start + PER_PAGE)
  }, [filtered, page])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  const handleRowClick = useCallback((customer: CustomerProfile) => {
    setSelectedCustomer(customer)
  }, [])

  const columns: DataTableColumn<CustomerProfile>[] = [
    {
      key: 'name',
      header: '姓名',
      render: (item) => (
        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{item.name}</span>
      ),
    },
    {
      key: 'email',
      header: '邮箱',
      render: (item) => <span style={{ color: '#94a3b8' }}>{item.email}</span>,
    },
    {
      key: 'phone',
      header: '手机号',
    },
    {
      key: 'engagementScore',
      header: '评分',
      render: (item) => {
        const info = getScoreLevel(item.engagementScore)
        return (
          <span style={{ color: info.color, fontWeight: 700 }}>{item.engagementScore}</span>
        )
      },
    },
    {
      key: 'status',
      header: '状态',
      render: (item) => (
        <Badge variant={CRM_STATUS_MAP[item.status].variant}>
          {CRM_STATUS_MAP[item.status].label}
        </Badge>
      ),
    },
    {
      key: 'tags',
      header: '标签',
      render: (item) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {item.tags.length === 0 ? (
            <span style={{ color: '#64748b', fontSize: 12 }}>-</span>
          ) : (
            item.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="info" size="sm">{tag}</Badge>
            ))
          )}
          {item.tags.length > 2 && (
            <span style={{ color: '#64748b', fontSize: 12 }}>+{item.tags.length - 2}</span>
          )}
        </div>
      ),
    },
    {
      key: 'lastVisitAt',
      header: '最近交互',
      render: (item) => (
        <span style={{ color: '#94a3b8', fontSize: 13 }}>
          {item.lastVisitAt ? formatDate(item.lastVisitAt) : '-'}
        </span>
      ),
    },
  ]

  // 三态渲染
  if (!isClient || loading) {
    return (
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#e2e8f0' }}>
          客户关系管理 (CRM)
        </h1>
        <LoadingSkeleton variant="card" rows={4} label="加载 CRM 客户列表..." />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#e2e8f0' }}>
          客户关系管理 (CRM)
        </h1>
        <div style={{ textAlign: 'center', padding: 48, color: '#ef4444' }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>加载失败</div>
          <div style={{ fontSize: 14, color: '#fca5a5' }}>{error}</div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16, padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5', fontSize: 14,
            }}
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#e2e8f0' }}>
        客户关系管理 (CRM)
      </h1>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 24 }}>
        <StatCard label="总客户" value={MOCK_CRM_STATS.totalCustomers} />
        <StatCard label="活跃客户" value={MOCK_CRM_STATS.activeCustomers} />
        <StatCard label="平均评分" value={MOCK_CRM_STATS.averageScore} />
        <StatCard label="未处理工单" value={MOCK_CRM_STATS.openTickets} />
      </div>

      {/* 筛选栏 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(0) }}
          placeholder="搜索姓名/手机号/邮箱"
          aria-label="客户搜索"
          style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(15,23,42,0.6)', color: '#e2e8f0', fontSize: 14,
            minWidth: 200,
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as CrmCustomerStatus | 'all'); setPage(0) }}
          style={{
            padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(15,23,42,0.6)', color: '#e2e8f0', fontSize: 14,
          }}
          aria-label="状态筛选"
        >
          <option value="all">全部状态</option>
          {CRM_STATUSES.map((s) => (
            <option key={s} value={s}>{CRM_STATUS_MAP[s].label}</option>
          ))}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 14 }}>
          <span>评分:</span>
          <input
            type="number"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => { setMinScore(Math.max(0, Math.min(100, Number(e.target.value) || 0))); setPage(0) }}
            style={{
              width: 60, padding: '8px 8px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.2)',
              background: 'rgba(15,23,42,0.6)', color: '#e2e8f0', fontSize: 14, textAlign: 'center',
            }}
            aria-label="最低评分"
          />
          <span>~</span>
          <input
            type="number"
            min={0}
            max={100}
            value={maxScore}
            onChange={(e) => { setMaxScore(Math.max(0, Math.min(100, Number(e.target.value) || 100))); setPage(0) }}
            style={{
              width: 60, padding: '8px 8px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.2)',
              background: 'rgba(15,23,42,0.6)', color: '#e2e8f0', fontSize: 14, textAlign: 'center',
            }}
            aria-label="最高评分"
          />
        </div>
      </div>

      {/* 数据表格 */}
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center', padding: '48px 24px', color: '#94a3b8',
            background: 'rgba(15,23,42,0.6)', borderRadius: 12, border: '1px solid rgba(148,163,184,0.1)',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#e2e8f0' }}>暂无客户数据</div>
          <div style={{ fontSize: 14 }}>
            {searchTerm || statusFilter !== 'all' || minScore > 0 || maxScore < 100
              ? '当前筛选条件下没有客户记录，请调整筛选条件'
              : '尚未添加任何客户，请先创建客户'}
          </div>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            items={paged}
            rowKey={(r) => r.id}
            striped
            onRowClick={handleRowClick}
          />

          {/* 分页 */}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8' }}>
            <span>共 {filtered.length} 条记录</span>
            <div>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  style={{
                    margin: '0 4px', padding: '4px 10px', cursor: 'pointer',
                    background: i === page ? 'rgba(22,119,255,0.2)' : 'transparent',
                    border: i === page ? '1px solid #1677ff' : '1px solid rgba(148,163,184,0.3)',
                    borderRadius: 4, color: i === page ? '#1677ff' : '#94a3b8',
                    transition: 'all 0.15s',
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 详情弹窗 */}
      <DetailDialog
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />
    </div>
  )
}
