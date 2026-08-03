'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import type { CSSProperties } from 'react'
import { useMemo, useTransition } from 'react'
import type { PaymentConfigSnapshotDelivery } from './payment-config-data'

function statusLabel(status: 'normal' | 'degraded' | 'offline'): string {
  if (status === 'normal') return '正常'
  if (status === 'degraded') return '降级'
  return '离线'
}

function statusColor(status: 'normal' | 'degraded' | 'offline'): CSSProperties {
  if (status === 'normal') {
    return { color: '#86efac', background: 'rgba(34, 197, 94, 0.12)' }
  }
  if (status === 'degraded') {
    return { color: '#fde68a', background: 'rgba(245, 158, 11, 0.12)' }
  }
  return { color: '#fca5a5', background: 'rgba(239, 68, 68, 0.12)' }
}

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
  td: { padding: '14px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' },
  status: { display: 'inline-block', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 },
  ruleList: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 },
  ruleCard: { borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.1)', padding: '14px 16px', background: 'rgba(15, 23, 42, 0.35)' },
  ruleKey: { fontSize: 13, color: '#94a3b8', marginBottom: 6 },
  ruleValue: { fontSize: 15, color: '#f8fafc', fontWeight: 600 },
}

export default function PaymentConfigClient({
  snapshot,
}: {
  snapshot: PaymentConfigSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const summary = useMemo(() => {
    const enabledChannels = snapshot.channels.filter((channel) => channel.enabled).length
    const degradedChannels = snapshot.channels.filter((channel) => channel.status !== 'normal').length
    return {
      totalChannels: snapshot.channels.length,
      enabledChannels,
      degradedChannels,
      settlementRules: snapshot.settlementRules.length,
    }
  }, [snapshot])

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>支付配置</h1>
          <p style={styles.subtitle}>
            支付配置首屏已改为服务端快照驱动，当前仍透出本地样本的通道状态、费率和结算规则，避免原有客户端假加载掩盖真实来源。
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
          <div style={styles.cardLabel}>支付通道</div>
          <div style={styles.cardValue}>{summary.totalChannels}</div>
          <div style={styles.cardHint}>首屏快照中纳管的通道总量</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>已启用</div>
          <div style={styles.cardValue}>{summary.enabledChannels}</div>
          <div style={styles.cardHint}>当前允许运营使用的通道数</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>异常通道</div>
          <div style={styles.cardValue}>{summary.degradedChannels}</div>
          <div style={styles.cardHint}>需后续接真实支付中台健康信号</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>结算规则</div>
          <div style={styles.cardValue}>{summary.settlementRules}</div>
          <div style={styles.cardHint}>统一由快照层提供，不再在客户端硬编码状态机</div>
        </div>
      </div>

      <section style={styles.section}>
        <div style={styles.sectionTitle}>通道概览</div>
        <div style={styles.sectionText}>显式展示通道状态、费率、结算周期和限额信息。</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>通道名称</th>
              <th style={styles.th}>提供方</th>
              <th style={styles.th}>状态</th>
              <th style={styles.th}>费率</th>
              <th style={styles.th}>结算周期</th>
              <th style={styles.th}>日限额</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.channels.map((channel) => (
              <tr key={channel.id}>
                <td style={styles.td}>{channel.name}</td>
                <td style={styles.td}>{channel.provider}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.status, ...statusColor(channel.status) }}>
                    {statusLabel(channel.status)}
                  </span>
                </td>
                <td style={styles.td}>{channel.feeRate}</td>
                <td style={styles.td}>{channel.settlementCycle}</td>
                <td style={styles.td}>{channel.dailyLimit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionTitle}>结算规则</div>
        <div style={styles.sectionText}>当前规则仍来自本地配置样本，后续可由真实配置接口替换。</div>
        <div style={styles.ruleList}>
          {snapshot.settlementRules.map((rule) => (
            <div key={rule.key} style={styles.ruleCard}>
              <div style={styles.ruleKey}>{rule.key}</div>
              <div style={styles.ruleValue}>{rule.value}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
