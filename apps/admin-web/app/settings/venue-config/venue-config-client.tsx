'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useMemo, useTransition } from 'react'
import type { VenueConfigSnapshot, VenueFacilityStatus } from './venue-config-data'
import { summarizeVenueConfig } from './venue-config-data'

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
  section: {
    borderRadius: 16,
    border: '1px solid rgba(148, 163, 184, 0.12)',
    background: 'rgba(15, 23, 42, 0.45)',
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 12 },
  sectionText: { fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginBottom: 16 },
  configList: { display: 'grid', gap: 12 },
  configItem: {
    display: 'grid',
    gridTemplateColumns: '220px minmax(0, 1fr)',
    gap: 12,
    paddingBottom: 12,
    borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
  },
  configKey: { fontSize: 13, color: '#cbd5e1', fontWeight: 600 },
  configValue: { fontSize: 13, color: '#f8fafc' },
  configHint: { fontSize: 12, color: '#64748b', marginTop: 4 },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#64748b', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' },
  td: { padding: '10px 12px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' },
} as const

function buildStatusBadge(status: VenueFacilityStatus) {
  const color = status === 'operating' ? '#22c55e' : '#eab308'
  const label = status === 'operating' ? '运营中' : '维护中'
  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: 999,
        padding: '4px 10px',
        fontSize: 11,
        fontWeight: 600,
        color,
        background: `${color}15`,
      }}
    >
      {label}
    </span>
  )
}

export default function VenueConfigClient({ snapshot }: { snapshot: VenueConfigSnapshot }) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const summary = useMemo(() => summarizeVenueConfig(snapshot.facilities), [snapshot.facilities])

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>场馆配置</h1>
          <p style={styles.subtitle}>
            营业时间、预约约束与设施运行状态均来自服务端快照。客户端仅负责展示，刷新动作统一回到
            `loadVenueConfigSnapshot()`。
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
          <div style={styles.cardLabel}>设施总容量</div>
          <div style={styles.cardValue}>{summary.totalFacilityCount}</div>
          <div style={styles.cardHint}>按场地和设备数量汇总本地场馆样本。</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>运营设施类型</div>
          <div style={styles.cardValue}>{summary.operatingCount}</div>
          <div style={styles.cardHint}>保持开放状态的设施类型数。</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>维护设施类型</div>
          <div style={styles.cardValue}>{summary.maintenanceCount}</div>
          <div style={styles.cardHint}>当前需检修或停用的设施类型数。</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>营业规则条目</div>
          <div style={styles.cardValue}>{snapshot.operationWindows.length}</div>
          <div style={styles.cardHint}>覆盖营业、预约和取消约束。</div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>营业时间与预约规则</h2>
        <p style={styles.sectionText}>规则由本地场馆配置快照提供，用于校验当前 settings 页壳层结构和来源态透明化。</p>
        <div style={styles.configList}>
          {snapshot.operationWindows.map((item) => (
            <div key={item.key} style={styles.configItem}>
              <div style={styles.configKey}>{item.key}</div>
              <div style={styles.configValue}>
                <div>{item.value}</div>
                <div style={styles.configHint}>{item.hint}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>设施列表</h2>
        <p style={styles.sectionText}>用于展示设施数量、责任人和运行态，后续真实链路可替换为场馆中台或 IoT 设备控制面快照。</p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>设施名称</th>
              <th style={styles.th}>数量</th>
              <th style={styles.th}>状态</th>
              <th style={styles.th}>负责人</th>
              <th style={styles.th}>利用率</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.facilities.map((facility) => (
              <tr key={facility.name}>
                <td style={{ ...styles.td, fontWeight: 600 }}>{facility.name}</td>
                <td style={styles.td}>{facility.count}</td>
                <td style={styles.td}>{buildStatusBadge(facility.status)}</td>
                <td style={styles.td}>{facility.manager}</td>
                <td style={styles.td}>{facility.utilization}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
