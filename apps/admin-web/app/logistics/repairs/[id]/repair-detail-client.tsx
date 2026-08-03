'use client'
import { useSnapshotRefresh } from '../../../components/use-snapshot-refresh'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import type { RepairStatus } from '../repairs-data'
import type { RepairDetailSnapshot } from './repair-detail-data'
import { getRepairActionLabel } from './repair-detail-data'

const styles = {
  page: { maxWidth: 960, margin: '0 auto', padding: 32 },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 },
  backLink: { color: '#93c5fd', textDecoration: 'underline' },
  refreshButton: {
    border: '1px solid rgba(148, 163, 184, 0.25)',
    background: 'rgba(15, 23, 42, 0.45)',
    color: '#e2e8f0',
    borderRadius: 10,
    padding: '10px 16px',
    cursor: 'pointer',
  },
  title: { fontSize: 24, fontWeight: 700, color: '#f8fafc', margin: 0 },
  subtitle: { fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginTop: 8, marginBottom: 20 },
  section: { borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.45)', padding: 20, marginBottom: 20 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 },
  item: { borderRadius: 12, background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(148, 163, 184, 0.12)', padding: 16 },
  label: { fontSize: 12, color: '#64748b', marginBottom: 6 },
  value: { fontSize: 14, color: '#f8fafc', fontWeight: 600 },
  actionRow: { display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginTop: 16 },
  actionButton: {
    borderRadius: 10,
    border: '1px solid rgba(96, 165, 250, 0.35)',
    background: 'rgba(59, 130, 246, 0.12)',
    color: '#bfdbfe',
    padding: '10px 16px',
    cursor: 'pointer',
  },
} as const

function getStatusLabel(status: RepairStatus) {
  if (status === 'pending') return '待指派'
  if (status === 'assigned') return '已指派'
  if (status === 'in_progress') return '维修中'
  if (status === 'completed') return '已完成'
  if (status === 'pending_verify') return '待验收'
  return '已验收'
}

export default function RepairDetailClient({ snapshot }: { snapshot: RepairDetailSnapshot }) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [currentStatus, setCurrentStatus] = useState<RepairStatus>(snapshot.detail.status)

  const nextStatuses = useMemo(() => {
    if (currentStatus === snapshot.detail.status) return snapshot.nextStatuses
    if (currentStatus === 'pending') return ['assigned'] as RepairStatus[]
    if (currentStatus === 'assigned') return ['in_progress'] as RepairStatus[]
    if (currentStatus === 'in_progress') return ['completed'] as RepairStatus[]
    if (currentStatus === 'completed') return ['pending_verify'] as RepairStatus[]
    if (currentStatus === 'pending_verify') return ['verified'] as RepairStatus[]
    return []
  }, [currentStatus, snapshot.detail.status, snapshot.nextStatuses])

  return (
    <div style={styles.page}>
      <div style={styles.toolbar}>
        <Link href="/logistics/repairs" style={styles.backLink}>
          返回工单列表
        </Link>
        <button
          type="button"
          onClick={() => handleRefresh()}
          disabled={isRefreshing}
          style={{ ...styles.refreshButton, opacity: isRefreshing ? 0.7 : 1 }}
        >
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>

      <h1 style={styles.title}>{snapshot.detail.id}</h1>
      <p style={styles.subtitle}>
        门店: {snapshot.detail.storeName} · 设备: {snapshot.detail.equipmentName} · 当前状态: {getStatusLabel(currentStatus)}
      </p>

      <div style={styles.section}>
        <div style={styles.grid}>
          <div style={styles.item}>
            <div style={styles.label}>报修人</div>
            <div style={styles.value}>{snapshot.detail.reporterName}</div>
          </div>
          <div style={styles.item}>
            <div style={styles.label}>联系电话</div>
            <div style={styles.value}>{snapshot.detail.reporterPhone}</div>
          </div>
          <div style={styles.item}>
            <div style={styles.label}>设备编号</div>
            <div style={styles.value}>{snapshot.detail.equipmentId}</div>
          </div>
          <div style={styles.item}>
            <div style={styles.label}>维修人员</div>
            <div style={styles.value}>{snapshot.detail.assigneeName ?? '待指派'}</div>
          </div>
          <div style={styles.item}>
            <div style={styles.label}>创建时间</div>
            <div style={styles.value}>{snapshot.detail.createdAt}</div>
          </div>
          <div style={styles.item}>
            <div style={styles.label}>完成时间</div>
            <div style={styles.value}>{snapshot.detail.completedAt ?? '未完成'}</div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.label}>问题描述</div>
        <div style={styles.value}>{snapshot.detail.issueDescription}</div>
        <div style={{ ...styles.label, marginTop: 16 }}>维修备注</div>
        <div style={styles.value}>{snapshot.detail.note}</div>
        <div style={styles.actionRow}>
          {nextStatuses.map((status) => (
            <button key={status} type="button" style={styles.actionButton} onClick={() => setCurrentStatus(status)}>
              {getRepairActionLabel(status)}
            </button>
          ))}
          {nextStatuses.length === 0 ? <span style={styles.value}>工单已完成验收闭环</span> : null}
        </div>
      </div>
    </div>
  )
}
