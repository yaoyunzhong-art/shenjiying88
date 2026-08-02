'use client'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useMemo, useState, useCallback, type CSSProperties } from 'react'

import {
  ACTION_TYPE_LABEL,
  RESULT_BG,
  RESULT_COLOR,
  RESULT_LABEL,
  type AuditLogsPageSnapshot,
} from './audit-logs-data'
import {
  DataTable,
  PageShell,
  SearchFilterInput,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';
import ListToolbar from '../../components/shell/ListToolbar';

const cardStyle: CSSProperties = {
  borderRadius: 12,
  background: 'rgba(15,23,42,0.4)',
  border: '1px solid rgba(148,163,184,0.1)',
  padding: 16,
}

export default function AuditLogsClient({
  snapshot,
}: {
  snapshot: AuditLogsPageSnapshot
}) {
  const { isRefreshing, handleRefresh } = useSnapshotRefresh()
  const [tab, setTab] = useState<'all' | 'failure'>('all')

  const searchFields = useMemo<(keyof typeof snapshot.logs[number])[]>(() => ['operator', 'target', 'actionType'] as any, []);
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(snapshot.logs, searchFields as any);

  const tabFiltered = useMemo(() => tab === 'all' ? filteredItems : filteredItems.filter((log) => log.result === 'failure'), [filteredItems, tab]);

  const columns: DataTableColumn<any>[] = useMemo(() => [
    { key: 'time', title: '时间', dataKey: 'time', sortable: true, render: (item: any) => (<span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 12 }}>{item.time}</span>) },
    { key: 'operator', title: '操作人', dataKey: 'operator', sortable: true, render: (item: any) => (<span style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: 12 }}>{item.operator}</span>) },
    { key: 'actionType', title: '操作类型', dataKey: 'actionType', sortable: true, render: (item: any) => (<span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, background: 'rgba(148,163,184,0.1)', color: '#94a3b8' }}>{ACTION_TYPE_LABEL[item.actionType]}</span>) },
    { key: 'target', title: '目标', dataKey: 'target', sortable: true, render: (item: any) => (<span style={{ color: '#cbd5e1', fontSize: 12, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{item.target}</span>) },
    { key: 'ip', title: 'IP', dataKey: 'ip', sortable: true, render: (item: any) => (<span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 11 }}>{item.ip}</span>) },
    { key: 'result', title: '结果', sortable: true, sortValue: (item: any) => item.result, render: (item: any) => (<span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500, background: RESULT_BG[item.result], color: RESULT_COLOR[item.result] }}>{RESULT_LABEL[item.result]}</span>) },
  ], []);

  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const sortedItems = useSortedItems(tabFiltered, columns, sortConfig);

  const triggerRefresh = useCallback(() => {
    handleRefresh()
  }, [handleRefresh])

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell title="审计日志" subtitle="已切换为 E54 三层壳。筛选与搜索由客户端承接。">
        {/* 统计卡片 */}
        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            marginBottom: 20,
          }}
        >
          <div style={cardStyle}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>总日志数</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'monospace', color: '#60a5fa' }}>
              {snapshot.stats.total}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>今日日志</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'monospace', color: '#34d399' }}>
              {snapshot.stats.today}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>今日失败</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'monospace', color: '#f87171' }}>
              {snapshot.stats.todayFailures}
            </div>
          </div>
        </div>

        {/* 操作栏：Tab + 刷新 */}
        <div
          style={{
            ...cardStyle,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setTab('all')}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                fontSize: 13,
                cursor: 'pointer',
                border:
                  tab === 'all'
                    ? '1px solid rgba(59,130,246,0.5)'
                    : '1px solid rgba(148,163,184,0.2)',
                background: tab === 'all' ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: tab === 'all' ? '#60a5fa' : '#94a3b8',
              }}
            >
              全部 ({snapshot.logs.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('failure')}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                fontSize: 13,
                cursor: 'pointer',
                border:
                  tab === 'failure'
                    ? '1px solid rgba(239,68,68,0.5)'
                    : '1px solid rgba(148,163,184,0.2)',
                background: tab === 'failure' ? 'rgba(239,68,68,0.15)' : 'transparent',
                color: tab === 'failure' ? '#f87171' : '#94a3b8',
              }}
            >
              失败 ({snapshot.failureCount})
            </button>
          </div>
          <button
            type="button"
            onClick={triggerRefresh}
            disabled={isRefreshing}
            style={{
              padding: '8px 14px',
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: 6,
              color: '#60a5fa',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </button>
        </div>

        <ListToolbar
          matchedCount={sortedItems.length}
          searchInput={
            <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索操作人/目标/操作类型..." />
          }
        />

        {tabFiltered.length === 0 ? (
          <div style={cardStyle}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '64px 24px',
                color: '#94a3b8',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 42, marginBottom: 12 }}>🧾</div>
              <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8, color: '#cbd5e1' }}>暂无审计日志</p>
              <p style={{ fontSize: 13, marginBottom: 20, maxWidth: 360, lineHeight: 1.6 }}>
                审计日志会记录所有管理员操作。本轮页面先以结构化样本呈现，后续可替换为真实快照。
              </p>
              <button
                type="button"
                onClick={triggerRefresh}
                style={{
                  padding: '8px 20px',
                  background: 'rgba(59,130,246,0.15)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59,130,246,0.3)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {isRefreshing ? '刷新中...' : '刷新快照'}
              </button>
            </div>
          </div>
        ) : (
          <DataTable columns={columns} items={sortedItems} rowKey={(item) => item.id} sort={sortConfig} onSortChange={setSortConfig} striped compact />
        )}
      </PageShell>
    </main>
  )
}
