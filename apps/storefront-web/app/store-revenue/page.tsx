/**
 * 门店营收 — Store Revenue Dashboard (storefront-web)
 * 角色: 👔 店长 / 💰 财务 / 🎯 运营总监
 * 功能: 营收总览、趋势对比、渠道分析、日/周/月切换
 */
'use client';

import React, { useState, useMemo } from 'react';

// ---- 类型定义 ----

type RevenuePeriod = 'daily' | 'weekly' | 'monthly';
type RevenueChannel = 'all' | 'offline' | 'online' | 'membership';

interface RevenueRecord {
  id: string;
  date: string;
  total: number;
  offline: number;
  online: number;
  membership: number;
  orderCount: number;
  avgOrderValue: number;
}

interface RevenueSummary {
  totalRevenue: number;
  avgDaily: number;
  maxDaily: number;
  minDaily: number;
  offlineRatio: number;
  onlineRatio: number;
  membershipRatio: number;
  totalOrders: number;
  avgOrderValue: number;
  growth: number;
}

// ---- Mock 数据 ----

const MOCK_REVENUE: RevenueRecord[] = [
  { id: 'R01', date: '2026-07-13', total: 48200, offline: 28500, online: 12500, membership: 7200, orderCount: 86, avgOrderValue: 560 },
  { id: 'R02', date: '2026-07-14', total: 51300, offline: 30200, online: 13800, membership: 7300, orderCount: 92, avgOrderValue: 558 },
  { id: 'R03', date: '2026-07-15', total: 46800, offline: 26800, online: 12400, membership: 7600, orderCount: 84, avgOrderValue: 557 },
  { id: 'R04', date: '2026-07-16', total: 55600, offline: 33800, online: 14200, membership: 7600, orderCount: 98, avgOrderValue: 567 },
  { id: 'R05', date: '2026-07-17', total: 61200, offline: 37800, online: 15800, membership: 7600, orderCount: 105, avgOrderValue: 583 },
  { id: 'R06', date: '2026-07-18', total: 58900, offline: 35200, online: 15100, membership: 8600, orderCount: 102, avgOrderValue: 577 },
  { id: 'R07', date: '2026-07-19', total: 44500, offline: 25800, online: 11500, membership: 7200, orderCount: 78, avgOrderValue: 570 },
  { id: 'R08', date: '2026-07-20', total: 49800, offline: 29500, online: 12800, membership: 7500, orderCount: 88, avgOrderValue: 566 },
  { id: 'R09', date: '2026-07-21', total: 52400, offline: 31500, online: 13600, membership: 7300, orderCount: 91, avgOrderValue: 576 },
  { id: 'R10', date: '2026-07-22', total: 56100, offline: 34100, online: 14500, membership: 7500, orderCount: 96, avgOrderValue: 584 },
  { id: 'R11', date: '2026-07-23', total: 63500, offline: 39800, online: 16200, membership: 7500, orderCount: 108, avgOrderValue: 588 },
  { id: 'R12', date: '2026-07-24', total: 67200, offline: 41800, online: 17200, membership: 8200, orderCount: 112, avgOrderValue: 600 },
  { id: 'R13', date: '2026-07-25', total: 59800, offline: 36200, online: 15400, membership: 8200, orderCount: 103, avgOrderValue: 581 },
  { id: 'R14', date: '2026-07-26', total: 48600, offline: 27800, online: 12600, membership: 8200, orderCount: 85, avgOrderValue: 572 },
];

// ---- 工具函数 ----

function formatCurrency(v: number): string {
  return `¥${v.toLocaleString('zh-CN')}`;
}

function computeRevenueSummary(records: RevenueRecord[]): RevenueSummary {
  if (records.length === 0) {
    return { totalRevenue: 0, avgDaily: 0, maxDaily: 0, minDaily: 0, offlineRatio: 0, onlineRatio: 0, membershipRatio: 0, totalOrders: 0, avgOrderValue: 0, growth: 0 };
  }
  const totalRevenue = records.reduce((s, r) => s + r.total, 0);
  const totalOrders = records.reduce((s, r) => s + r.orderCount, 0);
  const totalOffline = records.reduce((s, r) => s + r.offline, 0);
  const totalOnline = records.reduce((s, r) => s + r.online, 0);
  const totalMembership = records.reduce((s, r) => s + r.membership, 0);
  const avgDaily = Math.round(totalRevenue / records.length);
  const maxDaily = Math.max(...records.map(r => r.total));
  const minDaily = Math.min(...records.map(r => r.total));
  const offlineRatio = totalRevenue > 0 ? Math.round((totalOffline / totalRevenue) * 100) : 0;
  const onlineRatio = totalRevenue > 0 ? Math.round((totalOnline / totalRevenue) * 100) : 0;
  const membershipRatio = totalRevenue > 0 ? Math.round((totalMembership / totalRevenue) * 100) : 0;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // 增长率: 与上周同期对比 (前7天 vs 后7天)
  const mid = Math.floor(records.length / 2);
  const firstHalf = records.slice(0, mid).reduce((s, r) => s + r.total, 0);
  const secondHalf = records.slice(mid, records.length).reduce((s, r) => s + r.total, 0);
  const growth = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;

  return { totalRevenue, avgDaily, maxDaily, minDaily, offlineRatio, onlineRatio, membershipRatio, totalOrders, avgOrderValue, growth };
}

function filterByChannel(records: RevenueRecord[], channel: RevenueChannel): RevenueRecord[] {
  if (channel === 'all') return records;
  return records.map(r => ({
    ...r,
    total: channel === 'offline' ? r.offline : channel === 'online' ? r.online : r.membership,
    offline: channel === 'offline' ? r.offline : 0,
    online: channel === 'online' ? r.online : 0,
    membership: channel === 'membership' ? r.membership : 0,
  }));
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  if (page < 1) throw new Error('page must be >= 1');
  if (pageSize < 1) throw new Error('pageSize must be >= 1');
  return items.slice((page - 1) * pageSize, page * pageSize);
}

// ---- 页面组件 ----

export default function StoreRevenuePage() {
  const [period, setPeriod] = useState<RevenuePeriod>('daily');
  const [channel, setChannel] = useState<RevenueChannel>('all');
  const [page, setPage] = useState(1);
  const pageSize = 7;

  const channelFiltered = useMemo(() => filterByChannel(MOCK_REVENUE, channel), [channel]);
  const summary = useMemo(() => computeRevenueSummary(channelFiltered), [channelFiltered]);
  const totalPages = Math.max(1, Math.ceil(channelFiltered.length / pageSize));
  const paged = paginate(channelFiltered, page, pageSize);

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>
          💰 门店营收
        </h1>

        {/* KPI 摘要卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={{ borderRadius: 12, padding: '14px 16px', background: 'linear-gradient(135deg, #22c55e20, #16a34a20)', border: '1px solid #22c55e40' }}>
            <div style={{ fontSize: 12, color: '#86efac' }}>总营收</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#dcfce7' }}>{formatCurrency(summary.totalRevenue)}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 16px', background: 'linear-gradient(135deg, #60a5fa20, #3b82f620)', border: '1px solid #60a5fa40' }}>
            <div style={{ fontSize: 12, color: '#93c5fd' }}>日均营收</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#dbeafe' }}>{formatCurrency(summary.avgDaily)}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 16px', background: 'linear-gradient(135deg, #a855f720, #9333ea20)', border: '1px solid #a855f740' }}>
            <div style={{ fontSize: 12, color: '#d8b4fe' }}>营收增长</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: summary.growth >= 0 ? '#dcfce7' : '#fecaca' }}>
              {summary.growth >= 0 ? '+' : ''}{summary.growth}%
            </div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 16px', background: 'linear-gradient(135deg, #fbbf2420, #f59e0b20)', border: '1px solid #fbbf2440' }}>
            <div style={{ fontSize: 12, color: '#fcd34d' }}>总订单</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fef3c7' }}>{summary.totalOrders}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 16px', background: 'linear-gradient(135deg, #64748b20, #47556920)', border: '1px solid #64748b40' }}>
            <div style={{ fontSize: 12, color: '#cbd5e1' }}>平均客单价</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>{formatCurrency(summary.avgOrderValue)}</div>
          </div>
        </div>

        {/* 渠道占比 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ borderRadius: 8, padding: '10px 14px', border: '1px solid #22c55e30', background: '#22c55e10' }}>
            <div style={{ fontSize: 11, color: '#86efac' }}>线下占比</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#dcfce7' }}>{summary.offlineRatio}%</div>
          </div>
          <div style={{ borderRadius: 8, padding: '10px 14px', border: '1px solid #60a5fa30', background: '#60a5fa10' }}>
            <div style={{ fontSize: 11, color: '#93c5fd' }}>线上占比</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#dbeafe' }}>{summary.onlineRatio}%</div>
          </div>
          <div style={{ borderRadius: 8, padding: '10px 14px', border: '1px solid #fbbf2430', background: '#fbbf2410' }}>
            <div style={{ fontSize: 11, color: '#fcd34d' }}>会员占比</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fef3c7' }}>{summary.membershipRatio}%</div>
          </div>
        </div>

        {/* 筛选 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['daily', 'weekly', 'monthly'] as RevenuePeriod[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{
                  padding: '4px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                  border: period === p ? '1px solid #2563eb' : '1px solid #334155',
                  background: period === p ? '#2563eb' : '#1e293b',
                  color: period === p ? '#fff' : '#94a3b8',
                  fontWeight: period === p ? 600 : 400,
                }}>
                {p === 'daily' ? '日' : p === 'weekly' ? '周' : '月'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['all', 'offline', 'online', 'membership'] as RevenueChannel[]).map(c => (
              <button key={c} onClick={() => { setChannel(c); setPage(1); }}
                style={{
                  padding: '4px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                  border: channel === c ? '1px solid #2563eb' : '1px solid #334155',
                  background: channel === c ? '#2563eb' : '#1e293b',
                  color: channel === c ? '#fff' : '#94a3b8',
                  fontWeight: channel === c ? 600 : 400,
                }}>
                {c === 'all' ? '全部' : c === 'offline' ? '线下' : c === 'online' ? '线上' : '会员'}
              </button>
            ))}
          </div>
        </div>

        {/* 统计条 */}
        <div style={{ marginBottom: 10, fontSize: 13, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
          <span>共 <strong style={{ color: '#94a3b8' }}>{channelFiltered.length}</strong> 条记录</span>
          <span style={{ fontSize: 12, color: '#475569' }}>第 {page}/{totalPages} 页</span>
        </div>

        {/* 营收表格 */}
        {paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 15, color: '#94a3b8' }}>暂无营收数据</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    <th style={thStyle}>日期</th>
                    <th style={thStyle}>总营收</th>
                    <th style={thStyle}>线下</th>
                    <th style={thStyle}>线上</th>
                    <th style={thStyle}>会员</th>
                    <th style={thStyle}>订单数</th>
                    <th style={thStyle}>客单价</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(record => (
                    <tr key={record.id} style={{ borderBottom: '1px solid #1e293b', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1e293b'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <td style={tdStyle}>
                        <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{record.date}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#22c55e', fontWeight: 600 }}>{formatCurrency(record.total)}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#94a3b8' }}>{formatCurrency(record.offline)}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#60a5fa' }}>{formatCurrency(record.online)}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#fbbf24' }}>{formatCurrency(record.membership)}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#cbd5e1' }}>{record.orderCount}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#a78bfa' }}>{formatCurrency(record.avgOrderValue)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {channelFiltered.length > pageSize && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 16 }}>
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: page <= 1 ? '#0f172a' : '#1e293b', color: page <= 1 ? '#334155' : '#94a3b8', fontSize: 13, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>
                  ← 上一页
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: 32, height: 32, borderRadius: 6, border: p === page ? '1px solid #2563eb' : '1px solid #334155', background: p === page ? '#2563eb' : '#1e293b', color: p === page ? '#fff' : '#64748b', fontSize: 13, fontWeight: p === page ? 700 : 400, cursor: 'pointer' }}>
                    {p}
                  </button>
                ))}
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: page >= totalPages ? '#0f172a' : '#1e293b', color: page >= totalPages ? '#334155' : '#94a3b8', fontSize: 13, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>
                  下一页 →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '8px 10px', fontSize: 12, color: '#64748b',
  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
  userSelect: 'none',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 10px', fontSize: 14,
};
