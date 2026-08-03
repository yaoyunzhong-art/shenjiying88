'use client'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import type { LogisticsOrderStatus, LogisticsSnapshot } from './logistics-data'
import {
  LOGISTICS_STATUS_LABEL,
  LOGISTICS_URGENCY_LABEL,
  computeLogisticsStats,
  filterLogisticsOrders,
} from './logistics-data'

const styles = {
  page: { padding: 32, maxWidth: 1180, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, color: '#f8fafc', margin: 0 },
  subtitle: { fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginTop: 8, maxWidth: 820 },
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
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' as const },
  chips: { display: 'flex', gap: 8, flexWrap: 'wrap' as const },
  chip: (active: boolean) => ({
    padding: '6px 14px',
    borderRadius: 999,
    fontSize: 13,
    cursor: 'pointer',
    border: `1px solid ${active ? '#3b82f6' : 'rgba(148, 163, 184, 0.2)'}`,
    background: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
    color: active ? '#60a5fa' : '#94a3b8',
  }),
  input: { width: 280, padding: '8px 12px', fontSize: 14, background: '#0f172a', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: 8, color: '#f1f5f9' },
  section: { borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.45)', padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 12 },
  sectionText: { fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#64748b', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' },
  td: { padding: '10px 12px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 },
  detailCard: { borderRadius: 12, background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(148, 163, 184, 0.12)', padding: 16 },
  detailLabel: { fontSize: 12, color: '#64748b', marginBottom: 6 },
  detailValue: { fontSize: 14, color: '#f8fafc', fontWeight: 600 },
  empty: { padding: 32, textAlign: 'center' as const, color: '#94a3b8' },
} as const

function buildBadge(label: string, color: string) {
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

export default function LogisticsClient({ snapshot }: { snapshot: LogisticsSnapshot }) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [activeStatus, setActiveStatus] = useState<LogisticsOrderStatus | 'all'>('all')
  const [searchText, setSearchText] = useState('')
  const [activeOrderId, setActiveOrderId] = useState<string | null>(snapshot.orders[0]?.id ?? null)

  const stats = useMemo(() => computeLogisticsStats(snapshot.orders), [snapshot.orders])
  const filteredOrders = useMemo(
    () => filterLogisticsOrders(snapshot.orders, activeStatus, searchText),
    [activeStatus, searchText, snapshot.orders],
  )
  const activeOrder = useMemo(
    () => filteredOrders.find((item) => item.id === activeOrderId) ?? filteredOrders[0] ?? null,
    [activeOrderId, filteredOrders],
  )

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>后勤配送管理</h1>
          <p style={styles.subtitle}>
            配送订单、状态摘要和右侧详情卡均基于服务端快照首屏返回。客户端仅承接筛选、搜索与本地选中态，刷新动作统一回到
            `loadLogisticsSnapshot()`。
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
          <div style={styles.cardLabel}>配送单总数</div>
          <div style={styles.cardValue}>{stats.total}</div>
          <div style={styles.cardHint}>当前快照内用于验收壳层结构的配送样本总量。</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>待确认</div>
          <div style={styles.cardValue}>{stats.pending}</div>
          <div style={styles.cardHint}>待仓配确认的订单数量。</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>配送中</div>
          <div style={styles.cardValue}>{stats.inTransit}</div>
          <div style={styles.cardHint}>仍在履约链路中的运输单量。</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>配送总额</div>
          <div style={styles.cardValue}>{stats.totalAmount.toLocaleString()}</div>
          <div style={styles.cardHint}>按本地订单样本汇总金额。</div>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.chips}>
          {(['all', 'pending', 'confirmed', 'shipped', 'in_transit', 'delivered', 'returned', 'cancelled'] as const).map((status) => (
            <span key={status} style={styles.chip(activeStatus === status)} onClick={() => setActiveStatus(status)}>
              {status === 'all' ? '全部' : LOGISTICS_STATUS_LABEL[status]}
            </span>
          ))}
        </div>
        <input
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="搜索配送单号 / 供应商 / 联系人 / 部门..."
          style={styles.input}
        />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>配送订单列表</h2>
        <p style={styles.sectionText}>单击表格行可查看当前订单的地址、金额和履约备注。</p>
        {filteredOrders.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>配送单号</th>
                <th style={styles.th}>供应商</th>
                <th style={styles.th}>状态</th>
                <th style={styles.th}>紧急程度</th>
                <th style={styles.th}>金额</th>
                <th style={styles.th}>预计到货</th>
                <th style={styles.th}>部门</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setActiveOrderId(order.id)}
                  style={{ background: activeOrderId === order.id ? 'rgba(59, 130, 246, 0.08)' : 'transparent', cursor: 'pointer' }}
                >
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 600 }}>{order.orderNo}</td>
                  <td style={styles.td}>{order.supplierName}</td>
                  <td style={styles.td}>{buildBadge(LOGISTICS_STATUS_LABEL[order.status], '#60a5fa')}</td>
                  <td style={styles.td}>
                    {buildBadge(LOGISTICS_URGENCY_LABEL[order.urgency], order.urgency === 'normal' ? '#22c55e' : '#f59e0b')}
                  </td>
                  <td style={styles.td}>{order.totalAmount.toLocaleString()}</td>
                  <td style={styles.td}>{order.expectedDelivery}</td>
                  <td style={styles.td}>{order.department}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.empty}>当前筛选条件下暂无配送订单</div>
        )}
      </div>

      {activeOrder ? (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>配送详情</h2>
          <div style={styles.detailGrid}>
            <div style={styles.detailCard}>
              <div style={styles.detailLabel}>配送单号</div>
              <div style={styles.detailValue}>{activeOrder.orderNo}</div>
            </div>
            <div style={styles.detailCard}>
              <div style={styles.detailLabel}>联系人</div>
              <div style={styles.detailValue}>{activeOrder.contactPerson}</div>
            </div>
            <div style={styles.detailCard}>
              <div style={styles.detailLabel}>配送地址</div>
              <div style={styles.detailValue}>{activeOrder.deliveryAddress}</div>
            </div>
            <div style={styles.detailCard}>
              <div style={styles.detailLabel}>备注</div>
              <div style={styles.detailValue}>{activeOrder.remark}</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
