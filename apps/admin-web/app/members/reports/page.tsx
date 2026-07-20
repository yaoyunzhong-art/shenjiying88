// @ts-nocheck
'use client';

/**
 * 会员报表首页 - Member Reports Dashboard
 * 角色: 📊运营管理 / 👔店长 / 🎯运行专员
 * 功能: 会员增长趋势、消费分析、活跃度、留存率、RFM分析
 */

import { useState, useMemo } from 'react';

import {
  DataTable, Pagination, SearchFilterInput, StatusBadge, PageShell, Tabs, FilterChips, StatCard, usePagination, useSearchFilter, type DataTableColumn, type DataTableSortConfig, InfoRow } from '@m5/ui';

// ---- 类型 ----

interface MemberMetrics {
  date: string;
  newMembers: number;
  totalMembers: number;
  activeMembers: number;
  activeRate: number;
  newRevenue: number;
  repeatRevenue: number;
  totalRevenue: number;
  avgRecharge: number;
  avgSpend: number;
  churnRate: number;
  retentionRate: number;
  ltv30: number;
  ltv90: number;
}

interface RFMSegment {
  segment: string;
  count: number;
  avgRecency: number;
  avgFrequency: number;
  avgMonetary: number;
  totalValue: number;
  pctOfRevenue: number;
  color: string;
}

interface MemberActivity {
  period: string;
  dailyActive: number;
  weeklyActive: number;
  monthlyActive: number;
  avgSessionMinutes: number;
  avgVisitsPerWeek: number;
  peakDay: string;
  peakHour: string;
}

// ---- Mock ----

function generateMetrics(): MemberMetrics[] {
  const data: MemberMetrics[] = [];
  let total = 2800;
  for (let i = 89; i >= 0; i--) {
    const d = new Date(2026, 3, 11 + i);
    const newM = 3 + Math.floor(Math.random() * 8);
    const active = Math.floor(total * (0.45 + Math.random() * 0.15));
    const churn = Math.round((0.03 + Math.random() * 0.05) * 100) / 100;
    total += newM - Math.floor(total * churn);
    const newRev = Math.round((newM * (80 + Math.random() * 120)) * 100) / 100;
    const repeatRev = Math.round((active * (40 + Math.random() * 80)) * 100) / 100;
    data.push({
      date: d.toISOString().split('T')[0], newMembers: newM, totalMembers: total, activeMembers: active, activeRate: Math.round((active / total) * 10000) / 100, newRevenue: newRev, repeatRevenue: repeatRev, totalRevenue: Math.round((newRev + repeatRev) * 100) / 100, avgRecharge: Math.round((150 + Math.random() * 200) * 100) / 100, avgSpend: Math.round((55 + Math.random() * 45) * 100) / 100, churnRate: churn, retentionRate: Math.round((1 - churn) * 10000) / 100, ltv30: Math.round((180 + Math.random() * 120) * 100) / 100, ltv90: Math.round((400 + Math.random() * 300) * 100) / 100,
    });
  }
  return data;
}

function generateRFM(): RFMSegment[] {
  return [
    { segment: '重要价值会员', count: 245, avgRecency: 2, avgFrequency: 8.5, avgMonetary: 850, totalValue: 208250, pctOfRevenue: 28, color: '#22c55e' },
    { segment: '重要发展会员', count: 380, avgRecency: 5, avgFrequency: 4.2, avgMonetary: 420, totalValue: 159600, pctOfRevenue: 22, color: '#3b82f6' },
    { segment: '重要保持会员', count: 210, avgRecency: 15, avgFrequency: 3.8, avgMonetary: 380, totalValue: 79800, pctOfRevenue: 11, color: '#8b5cf6' },
    { segment: '重要挽留会员', count: 156, avgRecency: 30, avgFrequency: 2.1, avgMonetary: 350, totalValue: 54600, pctOfRevenue: 7.5, color: '#f97316' },
    { segment: '一般价值会员', count: 420, avgRecency: 7, avgFrequency: 3.5, avgMonetary: 180, totalValue: 75600, pctOfRevenue: 10.5, color: '#06b6d4' },
    { segment: '一般发展会员', count: 345, avgRecency: 10, avgFrequency: 2.8, avgMonetary: 150, totalValue: 51750, pctOfRevenue: 7, color: '#eab308' },
    { segment: '一般保持会员', count: 280, avgRecency: 20, avgFrequency: 2.0, avgMonetary: 120, totalValue: 33600, pctOfRevenue: 4.5, color: '#6b7280' },
    { segment: '流失会员', count: 509, avgRecency: 60, avgFrequency: 1.5, avgMonetary: 90, totalValue: 45810, pctOfRevenue: 6.5, color: '#ef4444' },
  ];
}

function generateActivity(): MemberActivity {
  return {
    period: '近30天', dailyActive: 320, weeklyActive: 980, monthlyActive: 1876, avgSessionMinutes: 68, avgVisitsPerWeek: 2.4, peakDay: '星期六', peakHour: '19:00-21:00',
  };
}

const metricsCache: MemberMetrics[] = generateMetrics();

function formatMoney(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

export default function MemberReportsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const metrics = useMemo(() => metricsCache, []);
  const rfm = useMemo(() => generateRFM(), []);
  const activity = useMemo(() => generateActivity(), []);
  const [tab, setTab] = useState<'overview' | 'rfm' | 'trend'>('overview');

  if (loading) return <div>加载中...</div>
  if (error) return <div>数据获取失败: {error}</div>
  if (!metrics || metrics.length === 0) return <div>暂无数据</div>

  const latest = metrics[0]!;
  const totals = useMemo(() => ({
    totalNewMembers: metrics.reduce((s, m) => s + m.newMembers, 0), avgActiveRate: metrics.reduce((s, m) => s + m.activeRate, 0) / metrics.length, totalRevenue: metrics.reduce((s, m) => s + m.totalRevenue, 0), avgChurn: metrics.reduce((s, m) => s + m.churnRate, 0) / metrics.length, avgLTV30: metrics.reduce((s, m) => s + m.ltv30, 0) / metrics.length,
  }), [metrics]);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell title="会员数据报告" subtitle="增长分析 · RFM分群 · 活跃度 · 留存与LTV">
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>当前会员总数</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#8b5cf6' }}>{latest.totalMembers.toLocaleString()}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#22c55e' }}>活跃: {latest.activeMembers.toLocaleString()} ({latest.activeRate}%)</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>总营收</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{formatMoney(totals.totalRevenue)}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>近90天累计</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均留存率</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: totals.avgChurn < 0.05 ? '#22c55e' : '#eab308' }}>
              {(100 - totals.avgChurn * 100).toFixed(1)}%
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>流失率: {(totals.avgChurn * 100).toFixed(1)}%</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均30日LTV</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{formatMoney(totals.avgLTV30)}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>90日: {formatMoney(metrics.reduce((s, m) => s + m.ltv90, 0) / metrics.length)}</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Tabs items={[
            { key: 'overview', label: '📊 概览' },
            { key: 'rfm', label: '🎯 RFM分群' },
            { key: 'trend', label: '📈 趋势' },
          ]} activeKey={tab} onChange={(t) => setTab(t as typeof tab)} variant="pills" />
        </div>

        {tab === 'overview' && (
          <>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginBottom: 20 }}>
              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>日活跃(DAU)</div>
                <div style={{ marginTop: 6, fontSize: 32, fontWeight: 700, color: '#3b82f6' }}>{activity.dailyActive}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>占总数 {((activity.dailyActive / latest.totalMembers) * 100).toFixed(1)}%</div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>周活跃(WAU)</div>
                <div style={{ marginTop: 6, fontSize: 32, fontWeight: 700, color: '#8b5cf6' }}>{activity.weeklyActive}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>人均到店 {activity.avgVisitsPerWeek}次/周</div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>月活跃(MAU)</div>
                <div style={{ marginTop: 6, fontSize: 32, fontWeight: 700, color: '#22c55e' }}>{activity.monthlyActive}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>日均时长: {activity.avgSessionMinutes}min</div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr', marginBottom: 20 }}>
              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 8 }}>会员行为洞察</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  <InfoRow label="最活跃日" value={activity.peakDay} />
                  <InfoRow label="最活跃时段" value={activity.peakHour} />
                  <InfoRow label="平均停留" value={`${activity.avgSessionMinutes}分钟`} />
                  <InfoRow label="周均到店" value={`${activity.avgVisitsPerWeek}次`} />
                </div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 8 }}>昨日数据</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  <InfoRow label="新增会员" value={`${latest.newMembers}人`} />
                  <InfoRow label="营收" value={formatMoney(latest.totalRevenue)} helper={`充值:${formatMoney(latest.avgRecharge)}`} />
                  <InfoRow label="客单价" value={formatMoney(latest.avgSpend)} />
                  <InfoRow label="30日LTV" value={formatMoney(latest.ltv30)} helper={`90日: ${formatMoney(latest.ltv90)}`} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button style={btnStyle}>📥 导出报告(PDF)</button>
              <button style={{ ...btnStyle, background: 'rgba(139,92,246,0.14)', color: '#c4b5fd' }}>📊 RFM分群分析</button>
            </div>
          </>
        )}

        {tab === 'rfm' && (
          <>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 16px' }}>
              基于近90天数据的RFM分析 · 总会员 {rfm.reduce((s, r) => s + r.count, 0).toLocaleString()}
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              {rfm.map(r => (
                <div key={r.segment} style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(15,23,42,0.3)', border: `1px solid ${r.color}33` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: r.color }} />
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{r.segment}</span>
                      <span style={{ color: '#94a3b8', fontSize: 13 }}>{r.count.toLocaleString()}人</span>
                    </div>
                    <span style={{ color: r.color, fontWeight: 700, fontSize: 16 }}>{formatMoney(r.totalValue)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#cbd5e1' }}>
                    <span>距离上次: {r.avgRecency}天</span>
                    <span>频次: {r.avgFrequency}次</span>
                    <span>客单价: {formatMoney(r.avgMonetary)}</span>
                    <span>营收占比: {r.pctOfRevenue}%</span>
                  </div>
                  <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.12)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${r.pctOfRevenue * 4}%`, borderRadius: 3, background: r.color }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'trend' && (
          <>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginBottom: 20 }}>
              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>累计新增(90d)</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{totals.totalNewMembers.toLocaleString()}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>日均: {Math.round(totals.totalNewMembers / 90)}</div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均活跃率</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{totals.avgActiveRate.toFixed(1)}%</div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>最新活跃率</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: latest.activeRate > 55 ? '#22c55e' : '#eab308' }}>{latest.activeRate}%</div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>日期</th>
                    <th style={thStyle}>新增</th>
                    <th style={thStyle}>总数</th>
                    <th style={thStyle}>活跃</th>
                    <th style={thStyle}>活跃率</th>
                    <th style={thStyle}>营收</th>
                    <th style={thStyle}>客单价</th>
                    <th style={thStyle}>流失率</th>
                    <th style={thStyle}>留存率</th>
                    <th style={thStyle}>LTV30</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.slice(0, 30).map(m => (
                    <tr key={m.date}>
                      <td style={tdStyle}>{m.date}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#22c55e' }}>{m.newMembers}</td>
                      <td style={tdStyle}>{m.totalMembers.toLocaleString()}</td>
                      <td style={tdStyle}>{m.activeMembers.toLocaleString()}</td>
                      <td style={tdStyle}>{m.activeRate}%</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#22c55e' }}>{formatMoney(m.totalRevenue)}</td>
                      <td style={tdStyle}>{formatMoney(m.avgSpend)}</td>
                      <td style={{ ...tdStyle, color: m.churnRate > 0.05 ? '#ef4444' : '#22c55e' }}>{(m.churnRate * 100).toFixed(1)}%</td>
                      <td style={{ ...tdStyle, color: m.retentionRate > 95 ? '#22c55e' : '#eab308' }}>{m.retentionRate}%</td>
                      <td style={tdStyle}>{formatMoney(m.ltv30)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </PageShell>
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  borderRadius: 16, padding: 18, background: 'rgba(15,23,42,0.38)', border: '1px solid rgba(148,163,184,0.18)',
};

const btnStyle: React.CSSProperties = {
  borderRadius: 10, padding: '10px 18px', background: 'rgba(59,130,246,0.14)', color: '#93c5fd', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
};

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 14px', color: '#94a3b8', fontSize: 12, borderBottom: '1px solid rgba(148,163,184,0.18)',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 14px', color: '#e2e8f0', fontSize: 13, borderBottom: '1px solid rgba(148,163,184,0.1)',
};
