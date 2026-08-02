"use client"
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'

import {
  Badge,
  DataTable,
  SearchFilterInput,
  StatCard,
  StatusBadge,
  type DataTableColumn,
} from '@m5/ui'
import BatchOperationsBar, { type BatchAction } from '../../components/shell/BatchOperationsBar';
import { useRowSelection } from '../../components/shell/useRowSelection';
import { useCrudFeedback } from '../../components/shell/FeedbackProvider';
import ListToolbar from '../../components/shell/ListToolbar';

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
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
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

  const selection = useRowSelection(paged, (item) => item.id);
  const feedback = useCrudFeedback();

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))

  const columns = useMemo<DataTableColumn<CustomerRecord>[]>(() => [
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
  ], [])

  const columnsWithCheckbox = useMemo<DataTableColumn<CustomerRecord>[]>(() => [
    { key: '_select', header: '✅', width: '40px', render: (item: CustomerRecord) => (
      <input type="checkbox" checked={selection.selectedIds.has(item.id)} 
        onChange={() => selection.toggle(item.id)} onClick={(e) => e.stopPropagation()}
        style={{ cursor: 'pointer', width: 16, height: 16 }} />
    )}, ...columns,
  ], [columns, selection.selectedIds, selection.toggle]);

  const batchActions: BatchAction[] = useMemo(() => [
    { key: 'batch-tag', label: '批量打标', icon: '🏷️', variant: 'primary',
      onClick: () => { feedback.success(`已为 ${selection.selectedCount} 位客户打标`); selection.clear(); } },
    { key: 'batch-reachout', label: '批量触达', icon: '📨', variant: 'primary',
      onClick: () => { feedback.success(`已向 ${selection.selectedCount} 位客户发送触达`); selection.clear(); } },
    { key: 'batch-export', label: '导出选中', icon: '📤', variant: 'default',
      onClick: () => { feedback.info(`正在导出 ${selection.selectedCount} 位客户...`); selection.clear(); } },
  ], [selection, feedback]);

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
          onClick={() => handleRefresh()}
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

      <ListToolbar
        matchedCount={filtered.length}
        searchInput={<SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索姓名/手机号/城市" />}
        leftExtra={
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as CustomerStatus | 'all'); setPage(0); }}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(15,23,42,0.6)', color: '#e2e8f0', fontSize: 14 }}>
              <option value="all">全部状态</option>
              {CUSTOMER_STATUSES.map((s) => (<option key={s} value={s}>{CUSTOMER_STATUS_MAP[s].label}</option>))}
            </select>
            <select value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value as MemberLevel | 'all'); setPage(0); }}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(15,23,42,0.6)', color: '#e2e8f0', fontSize: 14 }}>
              <option value="all">全部等级</option>
              {MEMBER_LEVELS.map((l) => (<option key={l} value={l}>{MEMBER_LEVEL_MAP[l].label}</option>))}
            </select>
          </div>
        }
      />

      {selection.selectedCount > 0 && (
        <BatchOperationsBar
          selectedCount={selection.selectedCount}
          totalCount={filtered.length}
          actions={batchActions}
          onClearSelection={selection.clear}
          itemLabel="客户"
        />
      )}

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
          <DataTable columns={columnsWithCheckbox} items={paged} rowKey={(record) => record.id} striped />
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
