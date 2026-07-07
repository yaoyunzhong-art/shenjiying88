'use client';

import React, { useMemo, useState } from 'react';

// ============================================================
//  Types (mirrored from page.test.ts)
// ============================================================

interface SalesTransaction {
  id: string;
  date: string;
  customer: string;
  amount: number;
  items: number;
  store: string;
  channel: 'online' | 'offline';
}

type PeriodFilter = '7d' | '30d' | '90d';

interface PeriodMetrics {
  total: number;
  avg: number;
  orderCount: number;
  offlineTotal: number;
  onlineTotal: number;
}

interface ForecastDataPoint {
  label: string;
  predicted: number;
  optimistic: number;
  pessimistic: number;
  actual?: number;
}

// ============================================================
//  Mock 数据
// ============================================================

const MOCK_TRANSACTIONS: SalesTransaction[] = [
  { id: 'T001', date: '2026-06-24 18:32', customer: '张三', amount: 568, items: 3, store: '旗舰店', channel: 'offline' },
  { id: 'T002', date: '2026-06-24 17:15', customer: '李四', amount: 1299, items: 5, store: '旗舰店', channel: 'offline' },
  { id: 'T003', date: '2026-06-24 16:40', customer: '王五', amount: 89, items: 1, store: '旗舰店', channel: 'online' },
  { id: 'T004', date: '2026-06-24 15:00', customer: '赵六', amount: 450, items: 2, store: '社区店', channel: 'offline' },
  { id: 'T005', date: '2026-06-24 14:22', customer: '陈七', amount: 780, items: 4, store: '旗舰店', channel: 'online' },
  { id: 'T006', date: '2026-06-24 12:08', customer: '刘八', amount: 220, items: 1, store: '社区店', channel: 'offline' },
  { id: 'T007', date: '2026-06-24 10:45', customer: '孙九', amount: 1340, items: 6, store: '旗舰店', channel: 'offline' },
  { id: 'T008', date: '2026-06-24 09:30', customer: '周十', amount: 320, items: 2, store: '社区店', channel: 'offline' },
];

const NOW = new Date();

function generateForecastDays(count: number): ForecastDataPoint[] {
  const points: ForecastDataPoint[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(NOW);
    d.setDate(d.getDate() + i - 3);
    const label = d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    const predicted = 48000 + Math.round(Math.sin(i * 0.8 + 0.5) * 12000 + (Math.random() - 0.5) * 3000);
    const actual = i < 3 ? predicted + Math.round((Math.random() - 0.5) * 6000) : undefined;
    const optimistic = Math.round(predicted * (1.08 + Math.random() * 0.06));
    const pessimistic = Math.round(predicted * (0.85 + Math.random() * 0.05));
    points.push({ label, predicted, optimistic, pessimistic, actual });
  }
  return points;
}

// ============================================================
//  Helper functions (mirrored from page.test.ts)
// ============================================================

function computePeriodMetrics(transactions: SalesTransaction[]): PeriodMetrics {
  const total = transactions.reduce((s, t) => s + t.amount, 0);
  const avg = transactions.length > 0 ? total / transactions.length : 0;
  const orderCount = transactions.length;
  const offlineTotal = transactions.filter((t) => t.channel === 'offline').reduce((s, t) => s + t.amount, 0);
  const onlineTotal = transactions.filter((t) => t.channel === 'online').reduce((s, t) => s + t.amount, 0);
  return { total, avg, orderCount, offlineTotal, onlineTotal };
}

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN')}`;
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

// ============================================================
//  Sales Performance Page
// ============================================================

export default function SalesPerformancePage() {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('7d');
  const [currentTime] = useState(() => new Date().toLocaleTimeString('zh-CN', { hour12: false }));

  const metrics = useMemo(() => computePeriodMetrics(MOCK_TRANSACTIONS), []);
  const forecastData = useMemo(() => generateForecastDays(10), []);
  const channelRatio = useMemo(() => {
    const total = metrics.total || 1;
    return {
      offline: Math.round((metrics.offlineTotal / total) * 100),
      online: Math.round((metrics.onlineTotal / total) * 100),
    };
  }, [metrics]);

  const periodFilters: PeriodFilter[] = ['7d', '30d', '90d'];

  return (
    <div style={pageStyles.container}>
      {/* 页面标题 */}
      <div style={pageStyles.header}>
        <div>
          <h1 style={pageStyles.title}>📊 销售业绩</h1>
          <p style={pageStyles.subtitle}>
            Shenjiying 旗舰店 · 门店实时销售数据与趋势分析 · {currentTime}
          </p>
        </div>
      </div>

      {/* 时段筛选 */}
      <div style={pageStyles.filterRow}>
        {periodFilters.map((p) => (
          <button
            key={p}
            onClick={() => setPeriodFilter(p)}
            style={{
              ...pageStyles.filterBtn,
              ...(periodFilter === p ? pageStyles.filterBtnActive : {}),
            }}
          >
            {p === '7d' ? '近7天' : p === '30d' ? '近30天' : '近90天'}
          </button>
        ))}
      </div>

      {/* 核心指标 */}
      <div style={pageStyles.metricsRow}>
        <div style={pageStyles.metricCard}>
          <div style={pageStyles.metricLabel}>总销售额</div>
          <div style={pageStyles.metricValue}>{formatCurrency(metrics.total)}</div>
        </div>
        <div style={pageStyles.metricCard}>
          <div style={pageStyles.metricLabel}>订单数</div>
          <div style={pageStyles.metricValue}>{metrics.orderCount}</div>
        </div>
        <div style={pageStyles.metricCard}>
          <div style={pageStyles.metricLabel}>平均客单价</div>
          <div style={pageStyles.metricValue}>{formatCurrency(Math.round(metrics.avg))}</div>
        </div>
        <div style={pageStyles.metricCard}>
          <div style={pageStyles.metricLabel}>线下占比</div>
          <div style={pageStyles.metricValue}>{channelRatio.offline}%</div>
          <div style={pageStyles.metricSub}>线上 {channelRatio.online}%</div>
        </div>
      </div>

      {/* 线上/线下分拆 */}
      <div style={pageStyles.splitRow}>
        <div style={{ ...pageStyles.splitCard, borderLeft: '4px solid #4ade80' }}>
          <div style={pageStyles.splitLabel}>🛒 线下渠道</div>
          <div style={pageStyles.splitValue}>{formatCurrency(metrics.offlineTotal)}</div>
          <div style={pageStyles.splitSub}>{metrics.orderCount - MOCK_TRANSACTIONS.filter(t => t.channel === 'online').length} 单</div>
        </div>
        <div style={{ ...pageStyles.splitCard, borderLeft: '4px solid #60a5fa' }}>
          <div style={pageStyles.splitLabel}>📱 线上渠道</div>
          <div style={pageStyles.splitValue}>{formatCurrency(metrics.onlineTotal)}</div>
          <div style={pageStyles.splitSub}>{MOCK_TRANSACTIONS.filter(t => t.channel === 'online').length} 单</div>
        </div>
      </div>

      {/* 交易明细表 */}
      <div style={pageStyles.sectionTitle}>📋 交易明细</div>
      <div style={pageStyles.table}>
        <div style={pageStyles.tableHeader}>
          <span style={pageStyles.th}>单号</span>
          <span style={pageStyles.th}>时间</span>
          <span style={pageStyles.th}>顾客</span>
          <span style={pageStyles.th}>金额</span>
          <span style={pageStyles.th}>件数</span>
          <span style={pageStyles.th}>门店</span>
          <span style={pageStyles.th}>渠道</span>
        </div>
        {MOCK_TRANSACTIONS.map((tx) => (
          <div key={tx.id} style={pageStyles.tableRow}>
            <span style={pageStyles.td}>{tx.id}</span>
            <span style={pageStyles.td}>{tx.date}</span>
            <span style={pageStyles.td}>{tx.customer}</span>
            <span style={pageStyles.td}>{formatCurrency(tx.amount)}</span>
            <span style={pageStyles.td}>{tx.items}</span>
            <span style={pageStyles.td}>{tx.store}</span>
            <span style={pageStyles.td}>
              <span style={{
                ...pageStyles.channelBadge,
                background: tx.channel === 'online' ? 'rgba(96,165,250,0.2)' : 'rgba(74,222,128,0.2)',
                color: tx.channel === 'online' ? '#60a5fa' : '#4ade80',
              }}>
                {tx.channel === 'online' ? '线上' : '线下'}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* 预测概览 */}
      <div style={{ ...pageStyles.sectionTitle, marginTop: 32 }}>🔮 销售预测（未来 7 日）</div>
      <div style={pageStyles.forecastGrid}>
        {forecastData.slice(3).map((f, i) => (
          <div key={i} style={pageStyles.forecastCard}>
            <div style={pageStyles.forecastLabel}>{f.label}</div>
            <div style={pageStyles.forecastValue}>{formatCurrency(f.predicted)}</div>
            <div style={pageStyles.forecastRange}>
              区间 {formatCurrency(f.pessimistic)} ~ {formatCurrency(f.optimistic)}
            </div>
          </div>
        ))}
      </div>

      {/* 底部 */}
      <div style={pageStyles.footer}>
        <p>💡 销售数据每 15 分钟同步一次 · 预测数据仅供管理参考</p>
      </div>
    </div>
  );
}

// ============================================================
//  Styles
// ============================================================

const pageStyles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '32px 24px',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: '0 0 4px',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
  },
  filterRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 24,
  },
  filterBtn: {
    padding: '6px 16px',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.2)',
    background: 'rgba(15,23,42,0.3)',
    color: '#94a3b8',
    fontSize: 13,
    cursor: 'pointer',
  },
  filterBtnActive: {
    background: 'rgba(59,130,246,0.2)',
    borderColor: '#3b82f6',
    color: '#60a5fa',
  },
  metricsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    borderRadius: 12,
    padding: '16px 20px',
    background: 'rgba(15,23,42,0.35)',
    border: '1px solid rgba(148,163,184,0.1)',
  },
  metricLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 700,
    color: '#e2e8f0',
  },
  metricSub: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  splitRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    marginBottom: 32,
  },
  splitCard: {
    borderRadius: 12,
    padding: '16px 20px',
    background: 'rgba(15,23,42,0.35)',
    border: '1px solid rgba(148,163,184,0.1)',
  },
  splitLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 6,
  },
  splitValue: {
    fontSize: 24,
    fontWeight: 700,
    color: '#e2e8f0',
  },
  splitSub: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#e2e8f0',
    marginBottom: 16,
  },
  table: {
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid rgba(148,163,184,0.1)',
    background: 'rgba(15,23,42,0.25)',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '60px 1fr 80px 100px 50px 80px 60px',
    gap: 8,
    padding: '10px 16px',
    background: 'rgba(30,41,59,0.5)',
    borderBottom: '1px solid rgba(148,163,184,0.08)',
  },
  th: {
    fontSize: 12,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase' as const,
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '60px 1fr 80px 100px 50px 80px 60px',
    gap: 8,
    padding: '10px 16px',
    borderBottom: '1px solid rgba(148,163,184,0.05)',
    alignItems: 'center',
  },
  td: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  channelBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
  },
  forecastGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 12,
    marginBottom: 32,
  },
  forecastCard: {
    borderRadius: 10,
    padding: '12px 14px',
    background: 'rgba(15,23,42,0.35)',
    border: '1px solid rgba(148,163,184,0.08)',
  },
  forecastLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  forecastValue: {
    fontSize: 17,
    fontWeight: 700,
    color: '#e2e8f0',
  },
  forecastRange: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    color: '#475569',
    padding: '16px 0',
  },
};
