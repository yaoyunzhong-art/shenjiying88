'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import type { CSSProperties } from 'react'
import { useMemo, useTransition } from 'react'
import type { NotificationsSettingsSnapshotDelivery } from './notifications-data'

const styles: Record<string, CSSProperties> = {
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
  cards: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 20 },
  card: { borderRadius: 14, border: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.45)', padding: 18 },
  cardLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  cardValue: { fontSize: 24, fontWeight: 700, color: '#f8fafc' },
  cardHint: { fontSize: 12, color: '#64748b', marginTop: 8 },
  section: { borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.45)', padding: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 8 },
  sectionText: { fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 14px', fontSize: 12, color: '#64748b', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' },
  td: { padding: '14px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid rgba(148, 163, 184, 0.06)', verticalAlign: 'top' },
  tag: { display: 'inline-block', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 },
  channelGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 },
  channelCard: { borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.1)', padding: '14px 16px', background: 'rgba(15, 23, 42, 0.35)' },
  channelName: { fontSize: 14, color: '#f8fafc', fontWeight: 600, marginBottom: 6 },
  channelDesc: { fontSize: 13, color: '#94a3b8', lineHeight: 1.6 },
  channelCoverage: { marginTop: 10, fontSize: 12, color: '#64748b' },
}

function statusStyle(enabled: boolean): CSSProperties {
  return enabled
    ? { color: '#86efac', background: 'rgba(34, 197, 94, 0.12)' }
    : { color: '#fca5a5', background: 'rgba(239, 68, 68, 0.12)' }
}

export default function NotificationsClient({
  snapshot,
}: {
  snapshot: NotificationsSettingsSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const summary = useMemo(() => {
    const enabledRules = snapshot.rules.filter((rule) => rule.enabled).length
    const criticalRules = snapshot.rules.filter((rule) => rule.severity === 'critical').length
    const totalChannels = snapshot.rules.reduce((count, rule) => count + rule.channels.length, 0)
    return {
      totalRules: snapshot.rules.length,
      enabledRules,
      criticalRules,
      totalChannels,
    }
  }, [snapshot])

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>通知设置</h1>
          <p style={styles.subtitle}>
            当前首屏通知治理配置来自本地快照样本，显式展示频率上限、静默时段和可用渠道，避免旧版客户端假加载掩盖来源态。
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
          <div style={styles.cardLabel}>通知规则</div>
          <div style={styles.cardValue}>{summary.totalRules}</div>
          <div style={styles.cardHint}>纳入本次快照合同的规则总数</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>已启用规则</div>
          <div style={styles.cardValue}>{summary.enabledRules}</div>
          <div style={styles.cardHint}>当前允许运行的通知策略数</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>高优先级规则</div>
          <div style={styles.cardValue}>{summary.criticalRules}</div>
          <div style={styles.cardHint}>支付与安全等不可静默规则</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>渠道挂载</div>
          <div style={styles.cardValue}>{summary.totalChannels}</div>
          <div style={styles.cardHint}>规则绑定的推送渠道总量</div>
        </div>
      </div>

      <section style={styles.section}>
        <div style={styles.sectionTitle}>通知规则</div>
        <div style={styles.sectionText}>显式展示每类通知的渠道组合、频率上限、静默时段与启停状态。</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>类别</th>
              <th style={styles.th}>推送渠道</th>
              <th style={styles.th}>频率上限</th>
              <th style={styles.th}>静默时段</th>
              <th style={styles.th}>状态</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.rules.map((rule) => (
              <tr key={rule.id}>
                <td style={styles.td}>{rule.category}</td>
                <td style={styles.td}>{rule.channels.join(', ')}</td>
                <td style={styles.td}>{rule.maxPerHour} 次/小时</td>
                <td style={styles.td}>{rule.quietPeriod}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.tag, ...statusStyle(rule.enabled) }}>
                    {rule.enabled ? '启用' : '停用'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionTitle}>推送渠道</div>
        <div style={styles.sectionText}>渠道卡片仍为本地治理样本，仅用于说明当前规则可挂载的推送边界。</div>
        <div style={styles.channelGrid}>
          {snapshot.channels.map((channel) => (
            <div key={channel.key} style={styles.channelCard}>
              <div style={styles.channelName}>{channel.name}</div>
              <div style={styles.channelDesc}>{channel.description}</div>
              <div style={styles.channelCoverage}>覆盖范围: {channel.coverage}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
