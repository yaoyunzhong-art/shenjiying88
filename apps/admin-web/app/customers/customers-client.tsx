"use client"

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import {
  Badge,
  DataTable,
  SearchFilterInput,
  StatCard,
  StatusBadge,
  type DataTableColumn,
} from '@m5/ui'

import {
  CUSTOMER_STATUSES,
  CUSTOMER_STATUS_MAP,
  MEMBER_LEVELS,
  MEMBER_LEVEL_MAP,
  type CustomerRecord,
  type CustomerStatus,
  type CustomersPageSnapshot,
  type MemberLevel,
  filterCustomers,
  formatCustomerCurrency,
} from './customers-data'

const PER_PAGE = 10

export default function CustomersClient({
  snapshot,
}: {
  snapshot: CustomersPageSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'all'>('all')
  const [levelFilter, setLevelFilter] = useState<MemberLevel | 'all'>('all')
  const [page, setPage] = useState(0)

  const filtered = useMemo(
    () => filterCustomers(snapshot.customers, searchTerm, statusFilter, levelFilter),
    [levelFilter, searchTerm, snapshot.customers, statusFilter]
  )

  const paged = useMemo(() => {
    const start = page * PER_PAGE
    return filtered.slice(start, start + PER_PAGE)
  }, [filtered, page])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))

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
    { key: 'totalVisits', header: '到店次数' },
    {
      key: 'totalSpent',
      header: '累计消费',
      render: (item) => formatCustomerCurrency(item.totalSpent),
    },
    {
      key: 'status',
      header: '状态',
      render: (item) => {
        const info = CUSTOMER_STATUS_MAP[item.status]
        return <StatusBadge label={info.label} variant={info.variant} />
      },
    },
    { key: 'lastVisit', header: '最近到店' },
  ]

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#e2e8f0' }}>
            客户管理
          </h1>
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              color: '#94a3b8',
              fontSize: 13,
            }}
          >
            <span>来源标签: {snapshot.sourceLabel}</span>
            <span>总客户: {snapshot.stats.total}</span>
            <span>活跃客户: {snapshot.stats.active}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(96, 165, 250, 0.35)',
            background: 'rgba(59, 130, 246, 0.14)',
            color: '#dbeafe',
            cursor: 'pointer',
          }}
          disabled={isRefreshing}
        >
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="总客户" value={snapshot.stats.total} />
        <StatCard label="活跃客户" value={snapshot.stats.active} />
        <StatCard
          label="累计消费"
          value={formatCustomerCurrency(snapshot.stats.totalSpent)}
        />
        <StatCard label="钻石会员" value={snapshot.stats.diamond} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <SearchFilterInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索姓名/手机号/城市"
        />
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as CustomerStatus | 'all')
            setPage(0)
          }}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(15,23,42,0.6)',
            color: '#e2e8f0',
            fontSize: 14,
          }}
          aria-label="状态筛选"
        >
          <option value="all">全部状态</option>
          {CUSTOMER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {CUSTOMER_STATUS_MAP[status].label}
            </option>
          ))}
        </select>
        <select
          value={levelFilter}
          onChange={(event) => {
            setLevelFilter(event.target.value as MemberLevel | 'all')
            setPage(0)
          }}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(15,23,42,0.6)',
            color: '#e2e8f0',
            fontSize: 14,
          }}
          aria-label="会员等级筛选"
        >
          <option value="all">全部等级</option>
          {MEMBER_LEVELS.map((level) => (
            <option key={level} value={level}>
              {MEMBER_LEVEL_MAP[level].label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            color: '#94a3b8',
            background: 'rgba(15,23,42,0.6)',
            borderRadius: 12,
            border: '1px solid rgba(148,163,184,0.1)',
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 8,
              color: '#e2e8f0',
            }}
          >
            暂无数据
          </div>
          <div style={{ fontSize: 14 }}>当前筛选条件下没有客户记录，请调整筛选条件。</div>
        </div>
      ) : (
        <>
          <DataTable columns={columns} items={paged} rowKey={(record) => record.id} striped />
          <div style={{ marginTop: 16, textAlign: 'right', color: '#94a3b8' }}>
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setPage(index)}
                style={{
                  margin: '0 4px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  background: index === page ? 'rgba(22,119,255,0.2)' : 'transparent',
                  border:
                    index === page
                      ? '1px solid #1677ff'
                      : '1px solid rgba(148,163,184,0.3)',
                  borderRadius: 4,
                  color: index === page ? '#1677ff' : '#94a3b8',
                }}
              >
                {index + 1}
              </button>
            ))}
            <span style={{ marginLeft: 8 }}>共 {filtered.length} 条</span>
          </div>
        </>
      )}
    </div>
  )
}
