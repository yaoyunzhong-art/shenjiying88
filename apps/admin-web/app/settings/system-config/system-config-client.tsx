'use client'

import { useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { SystemConfigSnapshotDelivery } from './system-config-data'

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, maxWidth: 1120, margin: '0 auto' },
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
  error: {
    marginBottom: 16,
    borderRadius: 12,
    border: '1px solid rgba(245, 158, 11, 0.35)',
    background: 'rgba(245, 158, 11, 0.12)',
    padding: '12px 16px',
    fontSize: 13,
    color: '#fde68a',
  },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginBottom: 20 },
  card: {
    borderRadius: 14,
    border: '1px solid rgba(148, 163, 184, 0.12)',
    background: 'rgba(15, 23, 42, 0.45)',
    padding: 18,
  },
  cardLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  cardValue: { fontSize: 26, fontWeight: 700, color: '#f8fafc' },
  cardHint: { fontSize: 12, color: '#64748b', marginTop: 8 },
  categoryBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    padding: '14px 16px',
    borderRadius: 14,
    border: '1px solid rgba(148, 163, 184, 0.12)',
    background: 'rgba(15, 23, 42, 0.35)',
  },
  categoryTag: {
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 12,
    color: '#cbd5e1',
    background: 'rgba(59, 130, 246, 0.12)',
    border: '1px solid rgba(96, 165, 250, 0.2)',
  },
  group: {
    marginBottom: 18,
    borderRadius: 16,
    border: '1px solid rgba(148, 163, 184, 0.12)',
    background: 'rgba(15, 23, 42, 0.45)',
    overflow: 'hidden',
  },
  groupHeader: { padding: '18px 20px 14px', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' },
  groupTitle: { fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 6 },
  groupDescription: { fontSize: 13, color: '#94a3b8', lineHeight: 1.6 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    padding: '12px 20px',
    fontSize: 12,
    color: '#64748b',
    borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
  },
  td: {
    padding: '14px 20px',
    fontSize: 13,
    color: '#cbd5e1',
    borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
    verticalAlign: 'top',
  },
  keyText: { fontWeight: 600, color: '#f8fafc', marginBottom: 4 },
  descText: { color: '#94a3b8', lineHeight: 1.6 },
  valuePill: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 999,
    background: 'rgba(34, 197, 94, 0.12)',
    color: '#86efac',
    fontSize: 12,
    fontWeight: 600,
  },
  empty: { padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 },
}

export default function SystemConfigClient({
  snapshot,
}: {
  snapshot: SystemConfigSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()

  const summary = useMemo(() => {
    const totalItems = snapshot.groups.reduce((sum, group) => sum + group.items.length, 0)
    const booleanItems = snapshot.groups.reduce(
      (sum, group) => sum + group.items.filter((item) => item.valueType === 'boolean').length,
      0
    )
    return {
      totalItems,
      categoryCount: snapshot.categories.length,
      booleanItems,
    }
  }, [snapshot])

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>系统配置</h1>
          <p style={styles.subtitle}>
            服务端快照统一汇总系统治理参数、限流策略、SSO 配置和通知总开关；客户端仅负责渲染与刷新，避免首屏来源态被客户端假加载掩盖。
          </p>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          style={{ ...styles.refreshButton, opacity: isRefreshing ? 0.7 : 1 }}
        >
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>

      {snapshot.error && <div style={styles.error}>{snapshot.error}</div>}

      <div style={styles.cards}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>配置项总数</div>
          <div style={styles.cardValue}>{summary.totalItems}</div>
          <div style={styles.cardHint}>来自当前快照合同的系统治理项</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>分类数量</div>
          <div style={styles.cardValue}>{summary.categoryCount}</div>
          <div style={styles.cardHint}>按服务端分类维度进行聚合</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>布尔型开关</div>
          <div style={styles.cardValue}>{summary.booleanItems}</div>
          <div style={styles.cardHint}>可直接观察启停策略数量</div>
        </div>
      </div>

      <div style={styles.categoryBar}>
        {snapshot.categories.map((category) => (
          <span key={category} style={styles.categoryTag}>
            {category}
          </span>
        ))}
      </div>

      {snapshot.groups.map((group) => (
        <section key={group.key} style={styles.group}>
          <div style={styles.groupHeader}>
            <div style={styles.groupTitle}>{group.title}</div>
            <div style={styles.groupDescription}>{group.description}</div>
          </div>
          {group.items.length === 0 ? (
            <div style={styles.empty}>暂无配置项</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>配置项</th>
                  <th style={styles.th}>当前值</th>
                  <th style={styles.th}>类型</th>
                  <th style={styles.th}>更新时间</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => (
                  <tr key={item.key}>
                    <td style={styles.td}>
                      <div style={styles.keyText}>{item.label}</div>
                      <div style={styles.descText}>{item.key}</div>
                      <div style={styles.descText}>{item.description}</div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.valuePill}>{item.value}</span>
                    </td>
                    <td style={styles.td}>{item.valueType}</td>
                    <td style={styles.td}>{item.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}
    </div>
  )
}
