'use client'

/**
 * 店铺数据分析 — Shop Analytics
 *
 * 店铺经营数据分析与洞察：
 * - 销售概览：总销售额/订单数/客单价/转化率
 * - 销售趋势（近30天折线图 + 同比对比）
 * - 热销商品排名
 * - 时段分析
 */

import React, { useState, useMemo } from 'react';
import {
  PageShell,
  StatCard,
  DataTable,
  Tabs,
  useSearchFilter,
  type DataTableColumn,
} from '@m5/ui';

// ============================================================
// 类型
// ============================================================

interface DailySales {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
}

interface TopProduct {
  rank: number;
  name: string;
  sales: number;
  revenue: number;
  change: string;
}

type TimeRange = '7d' | '30d' | '90d';

// ============================================================
// Mock 数据
// ============================================================

const MOCK_DAILY: DailySales[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  const dateStr = `${d.getMonth() + 1}月${d.getDate()}日`;
  const base = 18000 + Math.sin(i * 0.5) * 5000 + Math.random() * 2000;
  const orders = Math.round(40 + Math.sin(i * 0.3) * 15 + Math.random() * 8);
  return {
    date: dateStr,
    revenue: Math.round(base),
    orders,
    customers: Math.round(orders * (0.6 + Math.random() * 0.3)),
    avgOrderValue: Math.round(base / orders),
  };
});

const MOCK_TOP_PRODUCTS: TopProduct[] = [
  { rank: 1, name: '游戏币(100枚)', sales: 1248, revenue: 62400, change: '+15.3%' },
  { rank: 2, name: '会员月卡', sales: 856, revenue: 42800, change: '+8.7%' },
  { rank: 3, name: '扭蛋(小)', sales: 632, revenue: 18960, change: '-2.1%' },
  { rank: 4, name: '娃娃(中号)', sales: 412, revenue: 16480, change: '+22.5%' },
  { rank: 5, name: '可乐', sales: 328, revenue: 3280, change: '+5.0%' },
  { rank: 6, name: '限定手办A', sales: 215, revenue: 21500, change: '-8.3%' },
  { rank: 7, name: '优惠券(10元)', sales: 198, revenue: 1980, change: '+35.0%' },
  { rank: 8, name: '娃娃(大号)', sales: 156, revenue: 9360, change: '+12.8%' },
];

// ============================================================
// CSS 常量
// ============================================================

const CARD: React.CSSProperties = {
  borderRadius: 16,
  padding: 20,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148,163,184,0.18)',
  marginBottom: 20,
};

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  margin: '0 0 16px',
  color: '#f1f5f9',
};

function formatMoney(n: number): string {
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 0 })}`;
}

// ============================================================
// 组件 — 纯CSS折线图
// ============================================================

function MiniLineChart({
  data,
  dataKey,
  height = 180,
  color = '#3b82f6',
}: {
  data: { [key: string]: number | string }[];
  dataKey: string;
  height?: number;
  color?: string;
}) {
  const values = data.map(d => Number(d[dataKey]));
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const padding = { top: 20, bottom: 10 };
  const chartH = height - padding.top - padding.bottom;
  const step = data.length > 1 ? 100 / (data.length - 1) : 100;

  const points = values.map((v, i) => ({
    x: step * i,
    y: padding.top + chartH - ((v - min) / range) * chartH * 0.85 - chartH * 0.075,
    value: v,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <svg width="100%" height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
        {[0, 0.25, 0.5, 0.75, 1].map(frac => (
          <line key={frac} x1="0" y1={padding.top + chartH - frac * chartH * 0.85 - chartH * 0.075} x2="100%" y2={padding.top + chartH - frac * chartH * 0.85 - chartH * 0.075} stroke="rgba(148,163,184,0.08)" strokeWidth="1" strokeDasharray="3 3" />
        ))}
      </svg>
      <svg width="100%" height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        <path d={`${pathD} L ${points[points.length - 1]?.x ?? 0} ${padding.top + chartH} L ${points[0]?.x ?? 0} ${padding.top + chartH} Z`} fill={color} opacity="0.1" />
        {[points[0], points[points.length - 1]].filter(Boolean).map((p, i) => (
          <circle key={i} cx={p!.x} cy={p!.y} r="4" fill={color} stroke="rgba(15,23,42,0.8)" strokeWidth="2" />
        ))}
      </svg>
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================

export default function ShopAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [productTab, setProductTab] = useState<'sales' | 'revenue'>('sales');

  const dailyData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return MOCK_DAILY.slice(0, days);
  }, [timeRange]);

  // 聚合统计
  const totalStats = useMemo(() => {
    const totalRevenue = dailyData.reduce((s, d) => s + d.revenue, 0);
    const totalOrders = dailyData.reduce((s, d) => s + d.orders, 0);
    const totalCustomers = dailyData.reduce((s, d) => s + d.customers, 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const conversion = totalCustomers > 0 ? ((totalOrders / totalCustomers) * 100).toFixed(1) : '0.0';
    const prevRevenue = totalRevenue * 0.92; // 模拟同比
    const revenueChange = prevRevenue > 0 ? `${((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(1)}%` : '0%';
    return { totalRevenue, totalOrders, totalCustomers, avgOrderValue, conversion, revenueChange };
  }, [dailyData]);

  const productsSorted = useMemo(() => {
    const sorted = [...MOCK_TOP_PRODUCTS].sort((a, b) =>
      productTab === 'sales' ? b.sales - a.sales : b.revenue - a.revenue
    );
    return sorted.map((p, i) => ({ ...p, rank: i + 1 }));
  }, [productTab]);

  const productColumns: DataTableColumn<TopProduct>[] = [
    { key: 'rank', title: '排名', sortable: true, width: 60, render: p => <span style={{ color: p.rank <= 3 ? '#eab308' : '#64748b', fontWeight: 700 }}>#{p.rank}</span> },
    { key: 'name', title: '商品名称', sortable: true, render: p => <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{p.name}</span> },
    { key: 'sales', title: '销量', sortable: true, render: p => p.sales.toLocaleString() },
    { key: 'revenue', title: '销售额', sortable: true, render: p => formatMoney(p.revenue) },
    { key: 'change', title: '环比变化', sortable: true, render: p => <span style={{ color: p.change.startsWith('+') ? '#22c55e' : '#ef4444' }}>{p.change}</span> },
  ];

  return (
    <PageShell title="📊 店铺数据分析" subtitle="店铺经营数据分析与洞察">
      {/* 概览卡片 */}
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <StatCard label="总销售额" value={formatMoney(totalStats.totalRevenue)} trend={{ value: totalStats.revenueChange, direction: totalStats.revenueChange.startsWith('+') ? 'up' : 'down' }} />
        <StatCard label="总订单数" value={totalStats.totalOrders.toLocaleString()} helper={`客单价 ${formatMoney(totalStats.avgOrderValue)}`} />
        <StatCard label="总客户数" value={totalStats.totalCustomers.toLocaleString()} />
        <StatCard label="转化率" value={`${totalStats.conversion}%`} helper="订单/客户" variant="success" />
      </div>

      {/* 销售趋势 */}
      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={SECTION_TITLE}>📈 销售趋势</h3>
          <Tabs
            items={[
              { key: '7d', label: '近7天' },
              { key: '30d', label: '近30天' },
              { key: '90d', label: '近90天' },
            ]}
            activeKey={timeRange}
            onChange={t => setTimeRange(t as TimeRange)}
            variant="pills"
          />
        </div>
        <MiniLineChart data={dailyData} dataKey="revenue" height={200} color="#22c55e" />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#64748b' }}>
          <span>最低日销: {formatMoney(Math.min(...dailyData.map(d => d.revenue)))}</span>
          <span>最高日销: {formatMoney(Math.max(...dailyData.map(d => d.revenue)))}</span>
          <span>日均: {formatMoney(Math.round(totalStats.totalRevenue / dailyData.length))}</span>
        </div>
      </div>

      {/* 热销商品排名 */}
      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={SECTION_TITLE}>🏆 热销商品排名</h3>
          <Tabs
            items={[
              { key: 'sales', label: '按销量' },
              { key: 'revenue', label: '按销售额' },
            ]}
            activeKey={productTab}
            onChange={t => setProductTab(t as 'sales' | 'revenue')}
            variant="pills"
          />
        </div>
        <DataTable
          data={productsSorted}
          columns={productColumns}
          sortable
          emptyText="暂无商品数据"
        />
      </div>

      {/* 订单明细表 */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>📋 销售明细（最近{timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90}天）</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 10px', textAlign: 'left', color: '#64748b', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>日期</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>销售额</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>订单数</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>客户数</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>客单价</th>
              </tr>
            </thead>
            <tbody>
              {dailyData.map((d, i) => {
                const revenueRatio = (d.revenue - Math.min(...dailyData.map(x => x.revenue))) / (Math.max(...dailyData.map(x => x.revenue)) - Math.min(...dailyData.map(x => x.revenue)) || 1);
                return (
                  <tr key={i}>
                    <td style={{ padding: '6px 10px', color: '#94a3b8' }}>{d.date}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#22c55e', fontWeight: 600, background: `rgba(34,197,94,${0.05 + revenueRatio * 0.15})` }}>{formatMoney(d.revenue)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#e2e8f0' }}>{d.orders}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#e2e8f0' }}>{d.customers}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#93c5fd' }}>{formatMoney(d.avgOrderValue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 摘要 */}
      <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.1)', fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
        数据周期: {timeRange === '7d' ? '近7天' : timeRange === '30d' ? '近30天' : '近90天'} | 
        总销售额: {formatMoney(totalStats.totalRevenue)} | 
        总订单: {totalStats.totalOrders} | 
        平均客单价: {formatMoney(totalStats.avgOrderValue)}
      </div>
    </PageShell>
  );
}
