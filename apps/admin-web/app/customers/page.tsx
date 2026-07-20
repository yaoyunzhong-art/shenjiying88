/**
 * customers/page.tsx — 门店客户管理列表页 (admin-web)
 *
 * 功能: 列表展示、搜索、状态/等级筛选、数据统计
 * 三态: loading/empty/error
 */
'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  DataTable,
  StatusBadge,
  Badge,
  SearchFilterInput,
  StatCard,
  type DataTableColumn,
} from '@m5/ui'

import {
  MOCK_CUSTOMERS,
  CUSTOMER_STATUS_MAP,
  CUSTOMER_SOURCE_MAP,
  MEMBER_LEVEL_MAP,
  GENDER_LABEL,
  CUSTOMER_STATUSES,
  MEMBER_LEVELS,
  type CustomerRecord,
  type CustomerStatus,
  type CustomerSource,
  type MemberLevel,
} from './customers-data'

const PER_PAGE = 10

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `¥${(n / 10_000).toFixed(1)}万`
  if (n >= 1_000) return `¥${(n / 1000).toFixed(1)}K`
  return `¥${n}`
}

function filterCustomers(
  items: CustomerRecord[],
  search: string,
  statusFilter: CustomerStatus | 'all',
  levelFilter: MemberLevel | 'all',
): CustomerRecord[] {
  let result = items

  if (search.trim()) {
    const lower = search.toLowerCase()
    const searchFields: (keyof CustomerRecord)[] = ['name', 'phone', 'city']
    result = result.filter((c) =>
      searchFields.some((f) => String(c[f]).toLowerCase().includes(lower)),
    )
  }

  if (statusFilter !== 'all') {
    result = result.filter((c) => c.status === statusFilter)
  }

  if (levelFilter !== 'all') {
    result = result.filter((c) => c.memberLevel === levelFilter)
  }

  return result
}

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'all'>('all')
  const [levelFilter, setLevelFilter] = useState<MemberLevel | 'all'>('all')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 模拟异步数据加载 (连接真实 API 后替换为真实 fetch)
  useEffect(() => {
    setLoading(true)
    setError(null)
    queueMicrotask(() => {
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(
    () => filterCustomers(MOCK_CUSTOMERS, searchTerm, statusFilter, levelFilter),
    [searchTerm, statusFilter, levelFilter],
  )

  const paged = useMemo(() => {
    const start = page * PER_PAGE
    return filtered.slice(start, start + PER_PAGE)
  }, [filtered, page])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  const stats = useMemo(() => {
    const total = MOCK_CUSTOMERS.length
    const active = MOCK_CUSTOMERS.filter((c) => c.status === 'active').length
    const totalSpent = MOCK_CUSTOMERS.reduce((s, c) => s + c.totalSpent, 0)
    const diamond = MOCK_CUSTOMERS.filter((c) => c.memberLevel === 'diamond').length
    return { total, active, totalSpent, diamond }
  }, [])

  const columns: DataTableColumn<CustomerRecord>[] = [
    {
      key: 'name',
      header: '姓名',
      render: (item) => (
        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{item.name}</span>
      ),
    },
    {
      key: 'memberLevel',
      header: '会员等级',
      render: (item) => {
        const info = MEMBER_LEVEL_MAP[item.memberLevel]
        return <Badge variant={info.variant}>{info.label}</Badge>
      },
    },
    { key: 'phone', header: '手机号' },
    { key: 'city', header: '城市' },
    {
      key: 'totalVisits',
      header: '到店次数',
    },
    {
      key: 'totalSpent',
      header: '累计消费',
      render: (item) => formatCurrency(item.totalSpent),
    },
    {
      key: 'status',
      header: '状态',
      render: (item) => {
        const info = CUSTOMER_STATUS_MAP[item.status]
        return <StatusBadge label={info.label} variant={info.variant} />
      },
    },
    {
      key: 'lastVisit',
      header: '最近到店',
    },
  ]

  // 三态渲染: loading / error / empty / data
  if (loading) {
    return (
      <div style={{ padding: 32, color: '#94a3b8', textAlign: 'center' }}>
        <div style={{ fontSize: 14 }}>加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 32, color: '#ef4444', textAlign: 'center' }}>
        <div style={{ fontSize: 14 }}>错误: {error}</div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#e2e8f0' }}>
        客户管理
      </h1>

      {/* 统计卡片 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="总客户" value={stats.total} />
        <StatCard label="活跃客户" value={stats.active} />
        <StatCard label="累计消费" value={formatCurrency(stats.totalSpent)} />
        <StatCard label="钻石会员" value={stats.diamond} />
      </div>

      {/* 筛选栏 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <SearchFilterInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索姓名/手机号/城市"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as CustomerStatus | 'all'); setPage(0) }}
          style={{
            padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(15,23,42,0.6)', color: '#e2e8f0', fontSize: 14,
          }}
          aria-label="状态筛选"
        >
          <option value="all">全部状态</option>
          {CUSTOMER_STATUSES.map((s) => (
            <option key={s} value={s}>{CUSTOMER_STATUS_MAP[s].label}</option>
          ))}
        </select>
        <select
          value={levelFilter}
          onChange={(e) => { setLevelFilter(e.target.value as MemberLevel | 'all'); setPage(0) }}
          style={{
            padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(15,23,42,0.6)', color: '#e2e8f0', fontSize: 14,
          }}
          aria-label="会员等级筛选"
        >
          <option value="all">全部等级</option>
          {MEMBER_LEVELS.map((l) => (
            <option key={l} value={l}>{MEMBER_LEVEL_MAP[l].label}</option>
          ))}
        </select>
      </div>

      {/* 空态 / 数据表格 */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8', background: 'rgba(15,23,42,0.6)', borderRadius: 12, border: '1px solid rgba(148,163,184,0.1)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#e2e8f0' }}>暂无数据</div>
          <div style={{ fontSize: 14 }}>当前筛选条件下没有客户记录，请调整筛选条件。</div>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            items={paged}
            rowKey={(r) => r.id}
            striped
          />

          {/* 分页 */}
          <div style={{ marginTop: 16, textAlign: 'right', color: '#94a3b8' }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                style={{
                  margin: '0 4px', padding: '4px 10px', cursor: 'pointer',
                  background: i === page ? 'rgba(22,119,255,0.2)' : 'transparent',
                  border: i === page ? '1px solid #1677ff' : '1px solid rgba(148,163,184,0.3)',
                  borderRadius: 4, color: i === page ? '#1677ff' : '#94a3b8',
                }}
              >
                {i + 1}
              </button>
            ))}
            <span style={{ marginLeft: 8 }}>共 {filtered.length} 条</span>
          </div>
        </>
      )}
    </div>
  )
}
