'use client'

import { useMemo, useState, useTransition, type CSSProperties, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'

import {
  ACTION_TYPE_LABEL,
  RESULT_BG,
  RESULT_COLOR,
  RESULT_LABEL,
  filterLogs,
  type AuditLogsPageSnapshot,
} from './audit-logs-data'

const shellStyle: CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: 32,
  minHeight: '100vh',
}

const cardStyle: CSSProperties = {
  borderRadius: 12,
  background: 'rgba(15,23,42,0.4)',
  border: '1px solid rgba(148,163,184,0.1)',
  padding: 16,
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'rgba(15,23,42,0.5)',
  border: '1px solid rgba(148,163,184,0.2)',
  borderRadius: 6,
  color: '#e2e8f0',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
}

const thStyle: CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  color: '#64748b',
  fontSize: 11,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

const tdStyle: CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'middle',
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
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
      <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8, color: '#cbd5e1' }}>{title}</p>
      <p style={{ fontSize: 13, marginBottom: 20, maxWidth: 360, lineHeight: 1.6 }}>{description}</p>
      <button
        type="button"
        onClick={onAction}
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
        {actionLabel}
      </button>
    </div>
  )
}

export default function AuditLogsClient({
  snapshot,
}: {
  snapshot: AuditLogsPageSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [tab, setTab] = useState<'all' | 'failure'>('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLogs = useMemo(
    () => filterLogs(snapshot.logs, tab, searchQuery),
    [snapshot.logs, tab, searchQuery],
  )

  const triggerRefresh = () => {
    startRefresh(() => router.refresh())
  }

  const submitSearch = () => {
    setSearchQuery(searchInput)
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
  }

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      submitSearch()
    }
  }

  return (
    <main style={shellStyle}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>审计日志</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
          已切换为 E54 三层壳。筛选与搜索由客户端承接，刷新按钮仅通过 `router.refresh()`
          回源服务端快照。
        </p>
      </header>

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
            onClick={() => {
              setTab('all')
              clearSearch()
            }}
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
            onClick={() => {
              setTab('failure')
              clearSearch()
            }}
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

        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="按操作人搜索..."
            style={inputStyle}
          />
          {searchInput ? (
            <button
              type="button"
              onClick={clearSearch}
              style={{
                position: 'absolute',
                right: 78,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              ✕
            </button>
          ) : null}
          <button
            type="button"
            onClick={submitSearch}
            style={{
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(59,130,246,0.2)',
              border: 'none',
              borderRadius: 4,
              color: '#60a5fa',
              cursor: 'pointer',
              fontSize: 12,
              padding: '4px 8px',
            }}
          >
            搜索
          </button>
        </div>

        <button
          type="button"
          onClick={triggerRefresh}
          style={{
            padding: '8px 14px',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 6,
            color: '#60a5fa',
            cursor: 'pointer',
            fontSize: 13,
          }}
          disabled={isRefreshing}
        >
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>

      {filteredLogs.length === 0 ? (
        <div style={cardStyle}>
          {searchQuery ? (
            <EmptyState
              title="未找到匹配日志"
              description={`搜索 "${searchQuery}" 未找到相关记录，请尝试其他关键词或清空搜索条件。`}
              actionLabel="清除搜索"
              onAction={clearSearch}
            />
          ) : (
            <EmptyState
              title="暂无审计日志"
              description="审计日志会记录所有管理员操作。本轮页面先以结构化样本呈现，后续可替换为真实快照。"
              actionLabel={isRefreshing ? '刷新中...' : '刷新快照'}
              onAction={triggerRefresh}
            />
          )}
        </div>
      ) : (
        <div style={cardStyle}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.15)' }}>
                  <th style={thStyle}>时间</th>
                  <th style={thStyle}>操作人</th>
                  <th style={thStyle}>操作类型</th>
                  <th style={thStyle}>目标</th>
                  <th style={thStyle}>IP</th>
                  <th style={thStyle}>结果</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                    <td style={tdStyle}>
                      <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 12 }}>
                        {log.time}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: 12 }}>
                        {log.operator}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          background: 'rgba(148,163,184,0.1)',
                          color: '#94a3b8',
                        }}
                      >
                        {ACTION_TYPE_LABEL[log.actionType]}
                      </span>
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        maxWidth: 240,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span style={{ color: '#cbd5e1', fontSize: 12 }}>{log.target}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 11 }}>
                        {log.ip}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          background: RESULT_BG[log.result],
                          color: RESULT_COLOR[log.result],
                        }}
                      >
                        {RESULT_LABEL[log.result]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ paddingTop: 10, textAlign: 'right', fontSize: 12, color: '#64748b' }}>
              共 {filteredLogs.length} 条记录
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
