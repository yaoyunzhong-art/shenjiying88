// @ts-nocheck
'use client'

/**
 * 营收报表 — Revenue Report
 *
 * 每日营收趋势与同比环比分析：
 * - 营收总览：今日营收/月累计/年累计/同比增长
 * - 每日营收柱状图（近30天）
 * - 收入来源分布（会籍/游戏/商品/其他）
 * - 同比环比对比
 */

import React, { useState, useMemo } from 'react';
import {
  PageShell,
  StatCard,
  DataTable,
  Tabs,
  usePagination,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

// ============================================================
// 类型
// ============================================================

interface DailyRevenue {
  date: string;
  revenue: number;
  membership: number;
  games: number;
  merchandise: number;
  other: number;
  orders: number;
  prevYearRevenue: number;
}

type RevenueSource = 'membership' | 'games' | 'merchandise' | 'other';

// ============================================================
// Mock 数据
// ============================================================

const generateDaily = (days: number): DailyRevenue[] =>
  Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    const base = 12000 + Math.sin(i * 0.4) * 3000 + Math.random() * 2000;
    const revenue = Math.round(base);
    return {
      date: dateStr,
      revenue,
      membership: Math.round(revenue * (0.25 + Math.random() * 0.1)),
      games: Math.round(revenue * (0.35 + Math.random() * 0.1)),
      merchandise: Math.round(revenue * (0.2 + Math.random() * 0.08)),
      other: revenue - Math.round(revenue * 0.8),
      orders: Math.round(35 + Math.sin(i * 0.3) * 10 + Math.random() * 5),
      prevYearRevenue: Math.round(base * (0.85 + Math.random() * 0.2)),
    };
  });

const MOCK_DATA = generateDaily(30);

const TODAY = MOCK_DATA[MOCK_DATA.length - 1]!;
const YESTERDAY = MOCK_DATA[MOCK_DATA.length - 2]!;
const MONTH_TOTAL = MOCK_DATA.reduce((s, d) => s + d.revenue, 0);
const PREV_MONTH = MOCK_DATA.slice(0, 15).reduce((s, d) => s + d.revenue, 0);
const PREV_YEAR_MONTH = MOCK_DATA.slice(0, 20).reduce((s, d) => s + d.prevYearRevenue, 0);

const SOURCE_CONFIG: Record<RevenueSource, { label: string; color: string }> = {
  membership: { label: '会籍收入', color: '#3b82f6' },
  games: { label: '游戏收入', color: '#22c55e' },
  merchandise: { label: '商品收入', color: '#f97316' },
  other: { label: '其他', color: '#8b5cf6' },
};

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
  return n >= 10000 ? `¥${(n / 10000).toFixed(1)}万` : `¥${n.toLocaleString()}`;
}

function calcPercent(a: number, b: number): string {
  if (!b) return '—';
  const v = ((a - b) / b) * 100;
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
}

// ============================================================
// 柱状图组件（纯CSS）
// ============================================================

function RevenueBarChart({ data }: { data: DailyRevenue[] }) {
  const maxR = Math.max(...data.map(d => d.revenue));
  const h = 200;
  return (
    <div style={{ width: '100%', height: h, display: 'flex', alignItems: 'flex-end', gap: 3, padding: '0 4px', position: 'relative' }}>
      {data.map((d, i) => {
        const pct = (d.revenue / maxR) * 100;
        const showLabel = i % 5 === 0 || i === data.length - 1;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ height: pct * (h - 40) / 100, borderRadius: '3px 3px 0 0', background: `linear-gradient(180deg, #22c55e, #22c55e44)`, width: '100%', minHeight: 1 }} />
            {showLabel && <span style={{ fontSize: 9, color: '#64748b', transform: 'rotate(-45deg)', marginTop: 4 }}>{d.date}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================

export default function RevenuePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30);

  if (loading) return <div>加载中...</div>
  if (error) return <div>数据获取失败: {error}</div>
  if (!MOCK_DATA || MOCK_DATA.length === 0) return <div>暂无数据</div>


  const data = MOCK_DATA.slice(-days);
  const dailyChange = calcPercent(TODAY.revenue, YESTERDAY.revenue);
  const monthChange = calcPercent(MONTH_TOTAL, PREV_MONTH);
  const yearChange = calcPercent(MONTH_TOTAL, PREV_YEAR_MONTH);

  return (
    <PageShell title="📈 营收报表" subtitle="每日营收趋势与同比环比分析">
      {/* 统计卡片 */}
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <StatCard label="今日营收" value={formatMoney(TODAY.revenue)} trend={{ value: dailyChange, positive: dailyChange.startsWith('+') }} />
        <StatCard label="月累计" value={formatMoney(MONTH_TOTAL)} trend={{ value: monthChange, positive: monthChange.startsWith('+') }} helper={`本月 ${MOCK_DATA.length} 天`} />
        <StatCard label="同比(去年同月)" value={formatMoney(PREV_YEAR_MONTH)} trend={{ value: yearChange, positive: yearChange.startsWith('+') }} />
        <StatCard label="今日订单" value={TODAY.orders.toString()} helper={`昨日 ${YESTERDAY.orders} 单`} />
      </div>

      {/* 营收柱状图 */}
      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={SECTION_TITLE}>📊 每日营收趋势</h3>
          <Tabs
            items={[
              { key: 7, label: '7天' },
              { key: 30, label: '30天' },
            ]}
            activeKey={days}
            onChange={k => setDays(k as number)}
            variant="pills"
          />
        </div>
        <RevenueBarChart data={data} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#64748b' }}>
          <span>最低: {formatMoney(Math.min(...data.map(d => d.revenue)))}</span>
          <span>最高: {formatMoney(Math.max(...data.map(d => d.revenue)))}</span>
          <span>日均: {formatMoney(Math.round(data.reduce((s, d) => s + d.revenue, 0) / data.length))}</span>
        </div>
      </div>

      {/* 收入来源分布 */}
      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr 1fr', marginBottom: 24 }}>
        <div style={CARD}>
          <h3 style={SECTION_TITLE}>💰 收入来源（今日）</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(['membership', 'games', 'merchandise', 'other'] as RevenueSource[]).map(src => {
              const amount = TODAY[src];
              const pct = TODAY.revenue > 0 ? ((amount / TODAY.revenue) * 100).toFixed(1) : '0';
              const cfg = SOURCE_CONFIG[src];
              return (
                <div key={src} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: cfg.color, flexShrink: 0 }} />
                  <span style={{ width: 80, color: '#cbd5e1', fontSize: 13 }}>{cfg.label}</span>
                  <div style={{ flex: 1, height: 20, borderRadius: 10, background: 'rgba(148,163,184,0.1)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 10, background: cfg.color, minWidth: pct > 5 ? 20 : 0, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                      <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{pct}%</span>
                    </div>
                  </div>
                  <span style={{ width: 80, textAlign: 'right', color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>{formatMoney(amount)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={CARD}>
          <h3 style={SECTION_TITLE}>📊 同比环比分析</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(148,163,184,0.1)' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>今日 vs 昨日</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: dailyChange.startsWith('+') ? '#22c55e' : '#ef4444' }}>{dailyChange}</div>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(148,163,184,0.1)' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>月累计 vs 上半月</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: monthChange.startsWith('+') ? '#22c55e' : '#ef4444' }}>{monthChange}</div>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(148,163,184,0.1)' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>月累计 vs 去年同月</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: yearChange.startsWith('+') ? '#22c55e' : '#ef4444' }}>{yearChange}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 每日明细表 */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>📋 每日营收明细</h3>
        <div style={{ overflowX: 'auto', maxHeight: 300, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 10px', textAlign: 'left', color: '#64748b', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>日期</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>营收</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>会籍</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>游戏</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>商品</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>订单</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>同比</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().slice(0, 15).map((d, i) => {
                const yoy = calcPercent(d.revenue, d.prevYearRevenue);
                return (
                  <tr key={i}>
                    <td style={{ padding: '6px 10px', color: '#94a3b8' }}>{d.date}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#22c55e', fontWeight: 600 }}>{formatMoney(d.revenue)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#93c5fd' }}>{formatMoney(d.membership)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#86efac' }}>{formatMoney(d.games)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#fdba74' }}>{formatMoney(d.merchandise)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#e2e8f0' }}>{d.orders}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: yoy.startsWith('+') ? '#22c55e' : '#ef4444' }}>{yoy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.1)', fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
        数据来源: 各门店系统自动上报 | 更新时间: 每日 08:00 | 同比数据基于去年同月同期
      </div>
    </PageShell>
  );
}
