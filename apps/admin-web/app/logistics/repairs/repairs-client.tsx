'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import type { RepairStatus, RepairsSnapshot } from './repairs-data'
import { REPAIR_STATUS_LABEL, filterRepairRecords, summarizeRepairRecords } from './repairs-data'

const styles = {
  page: { padding: 32, maxWidth: 1080, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, color: '#f8fafc', margin: 0 },
  subtitle: { fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginTop: 8, maxWidth: 760 },
  refreshButton: {
    border: '1px solid rgba(148, 163, 184, 0.25)',
    background: 'rgba(15, 23, 42, 0.45)',
    color: '#e2e8f0',
    borderRadius: 10,
    padding: '10px 16px',
    cursor: 'pointer',
  },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 24 },
  card: { borderRadius: 14, border: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.45)', padding: 18 },
  cardLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  cardValue: { fontSize: 24, fontWeight: 700, color: '#f8fafc' },
  cardHint: { fontSize: 12, color: '#64748b', marginTop: 8 },
  chips: { display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 20 },
  chip: (active: boolean) => ({
    padding: '6px 14px',
    borderRadius: 999,
    fontSize: 13,
    cursor: 'pointer',
    border: `1px solid ${active ? '#3b82f6' : 'rgba(148, 163, 184, 0.2)'}`,
    background: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
    color: active ? '#60a5fa' : '#94a3b8',
  }),
  section: { borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.45)', padding: 20 },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#64748b', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' },
  td: { padding: '10px 12px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' },
  link: { color: '#93c5fd', textDecoration: 'underline' },
} as const

export default function RepairsClient({ snapshot }: { snapshot: RepairsSnapshot }) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [activeStatus, setActiveStatus] = useState<RepairStatus | 'all'>('all')

  const summary = useMemo(() => summarizeRepairRecords(snapshot.records), [snapshot.records])
  const filteredRecords = useMemo(
    () => filterRepairRecords(snapshot.records, activeStatus),
    [activeStatus, snapshot.records],
  )

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>维修工单</h1>
          <p style={styles.subtitle}>
            维修工单列表、状态分布和详情跳转能力均来自服务端快照。客户端仅负责筛选与刷新交互，刷新动作统一回到
            `loadRepairsSnapshot()`。
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleRefresh()}
          disabled={isRefreshing}
          style={{ ...styles.refreshButton, opacity: isRefreshing ? 0.7 : 1 }}
        >
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>

      <div style={styles.cards}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>工单总数</div>
          <div style={styles.cardValue}>{summary.total}</div>
          <div style={styles.cardHint}>本地快照内的维修工单总量。</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>待指派</div>
          <div style={styles.cardValue}>{summary.pending}</div>
          <div style={styles.cardHint}>等待维修人员认领或调度。</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>维修中</div>
          <div style={styles.cardValue}>{summary.inProgress}</div>
          <div style={styles.cardHint}>仍在处理中的故障单量。</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>待验收</div>
          <div style={styles.cardValue}>{summary.pendingVerify}</div>
          <div style={styles.cardHint}>等待门店或运营复核的工单。</div>
        </div>
      </div>

      <div style={styles.chips}>
        {(['all', 'pending', 'assigned', 'in_progress', 'completed', 'pending_verify', 'verified'] as const).map((status) => (
          <span key={status} style={styles.chip(activeStatus === status)} onClick={() => setActiveStatus(status)}>
            {status === 'all' ? '全部' : REPAIR_STATUS_LABEL[status]}
          </span>
        ))}
      </div>

      <div style={styles.section}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>工单号</th>
              <th style={styles.th}>门店</th>
              <th style={styles.th}>设备</th>
              <th style={styles.th}>问题描述</th>
              <th style={styles.th}>状态</th>
              <th style={styles.th}>维修人</th>
              <th style={styles.th}>详情</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record.id}>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 600 }}>{record.id}</td>
                <td style={styles.td}>{record.storeName}</td>
                <td style={styles.td}>{record.equipmentName}</td>
                <td style={styles.td}>{record.issueDescription}</td>
                <td style={styles.td}>{REPAIR_STATUS_LABEL[record.status]}</td>
                <td style={styles.td}>{record.assigneeName ?? '待指派'}</td>
                <td style={styles.td}>
                  <Link href={`/logistics/repairs/${record.id}`} style={styles.link}>
                    查看详情
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
