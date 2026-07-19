/**
 * 门店排名 — Store Rank Dashboard (storefront-web)
 * 角色: 👔 店长 / 🎯 运营总监
 * 功能: 门店综合排名、各维度KPI排名、趋势数据、排行升降
 */
'use client';

import React, { useState, useMemo } from 'react';

// ---- 类型定义 ----

type SortField = 'rank' | 'name' | 'revenue' | 'rating' | 'attendance' | 'growth';
type SortDir = 'asc' | 'desc';
type Period = 'daily' | 'weekly' | 'monthly';

interface StoreRankItem {
  id: string;
  rank: number;
  prevRank: number;
  name: string;
  revenue: number;
  rating: number;
  attendance: number;
  growth: number;
  orderCount: number;
  avgOrderValue: number;
}

interface KpiSummary {
  totalRevenue: number;
  avgRating: number;
  avgAttendance: number;
  avgGrowth: number;
  totalOrders: number;
  topStore: string;
}

// ---- Mock 数据 ----

const MOCK_STORES: StoreRankItem[] = [
  { id: 'S001', rank: 1, prevRank: 2, name: '旗舰店', revenue: 286500, rating: 4.9, attendance: 1560, growth: 12.5, orderCount: 423, avgOrderValue: 677 },
  { id: 'S002', rank: 2, prevRank: 1, name: '天河城店', revenue: 251200, rating: 4.7, attendance: 1430, growth: 8.3, orderCount: 387, avgOrderValue: 649 },
  { id: 'S003', rank: 3, prevRank: 3, name: '万象城店', revenue: 198400, rating: 4.8, attendance: 1120, growth: 15.1, orderCount: 312, avgOrderValue: 636 },
  { id: 'S004', rank: 4, prevRank: 5, name: '宝安中心店', revenue: 165800, rating: 4.6, attendance: 980, growth: 5.2, orderCount: 256, avgOrderValue: 648 },
  { id: 'S005', rank: 5, prevRank: 7, name: '龙岗万达店', revenue: 143200, rating: 4.5, attendance: 870, growth: 18.7, orderCount: 218, avgOrderValue: 657 },
  { id: 'S006', rank: 6, prevRank: 4, name: '南山科技园店', revenue: 138900, rating: 4.4, attendance: 820, growth: -2.3, orderCount: 205, avgOrderValue: 678 },
  { id: 'S007', rank: 7, prevRank: 6, name: '福田CBD店', revenue: 121600, rating: 4.3, attendance: 760, growth: -1.5, orderCount: 189, avgOrderValue: 643 },
  { id: 'S008', rank: 8, prevRank: 8, name: '盐田店', revenue: 98700, rating: 4.2, attendance: 620, growth: 3.8, orderCount: 152, avgOrderValue: 649 },
  { id: 'S009', rank: 9, prevRank: 10, name: '光明新区店', revenue: 82300, rating: 4.1, attendance: 540, growth: 22.4, orderCount: 134, avgOrderValue: 614 },
  { id: 'S010', rank: 10, prevRank: 9, name: '大鹏店', revenue: 69600, rating: 3.9, attendance: 460, growth: -4.7, orderCount: 108, avgOrderValue: 644 },
  { id: 'S011', rank: 11, prevRank: 12, name: '坪山店', revenue: 59800, rating: 4.0, attendance: 380, growth: 6.1, orderCount: 92, avgOrderValue: 650 },
  { id: 'S012', rank: 12, prevRank: 11, name: '深汕合作区店', revenue: 47500, rating: 3.8, attendance: 310, growth: -8.2, orderCount: 75, avgOrderValue: 633 },
];

// ---- 排名箭头和趋势 ----

function RankChange({ prevRank, rank }: { prevRank: number; rank: number }) {
  if (prevRank === rank) return <span style={{ color: '#94a3b8' }}>—</span>;
  if (prevRank > rank) return <span style={{ color: '#22c55e' }}>↑{prevRank - rank}</span>;
  return <span style={{ color: '#ef4444' }}>↓{rank - prevRank}</span>;
}

function formatCurrency(v: number): string {
  return `¥${v.toLocaleString('zh-CN')}`;
}

// ---- 过滤与排序 ----

function filterAndSort(
  stores: StoreRankItem[],
  search: string,
  sortField: SortField,
  sortDir: SortDir,
): StoreRankItem[] {
  let filtered = stores;
  if (search) {
    const q = search.toLowerCase();
    filtered = stores.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  }
  const sorted = [...filtered];
  sorted.sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'rank': cmp = a.rank - b.rank; break;
      case 'name': cmp = a.name.localeCompare(b.name); break;
      case 'revenue': cmp = a.revenue - b.revenue; break;
      case 'rating': cmp = a.rating - b.rating; break;
      case 'attendance': cmp = a.attendance - b.attendance; break;
      case 'growth': cmp = a.growth - b.growth; break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

// ---- KPI 汇总 ----

function computeKpiSummary(stores: StoreRankItem[]): KpiSummary {
  const len = stores.length;
  if (len === 0) return { totalRevenue: 0, avgRating: 0, avgAttendance: 0, avgGrowth: 0, totalOrders: 0, topStore: '' };
  const totalRevenue = stores.reduce((s, st) => s + st.revenue, 0);
  const avgRating = Math.round((stores.reduce((s, st) => s + st.rating, 0) / len) * 10) / 10;
  const totalOrders = stores.reduce((s, st) => s + st.orderCount, 0);
  const avgAttendance = Math.round(stores.reduce((s, st) => s + st.attendance, 0) / len);
  const avgGrowth = Math.round((stores.reduce((s, st) => s + st.growth, 0) / len) * 10) / 10;
  const topStore = stores.reduce((best, st) => st.revenue > best.revenue ? st : best, stores[0]).name;
  return { totalRevenue, avgRating, avgAttendance, avgGrowth, totalOrders, topStore };
}

// ---- 分页 ----

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  if (page < 1) throw new Error('page must be >= 1');
  if (pageSize < 1) throw new Error('pageSize must be >= 1');
  return items.slice((page - 1) * pageSize, page * pageSize);
}

// ---- 页面组件 ----

export default function StoreRankPage() {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [period, setPeriod] = useState<Period>('monthly');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const summary = useMemo(() => computeKpiSummary(MOCK_STORES), []);

  const filtered = useMemo(
    () => filterAndSort(MOCK_STORES, search, sortField, sortDir),
    [search, sortField, sortDir],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = paginate(filtered, page, pageSize);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>
          🏆 门店排名
        </h1>

        {/* KPI 摘要卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={{ borderRadius: 12, padding: '14px 16px', background: 'linear-gradient(135deg, #22c55e20, #16a34a20)', border: '1px solid #22c55e40' }}>
            <div style={{ fontSize: 12, color: '#86efac' }}>总营收</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#dcfce7' }}>{formatCurrency(summary.totalRevenue)}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 16px', background: 'linear-gradient(135deg, #fbbf2420, #f59e0b20)', border: '1px solid #fbbf2440' }}>
            <div style={{ fontSize: 12, color: '#fcd34d' }}>平均评分</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fef3c7' }}>{summary.avgRating}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 16px', background: 'linear-gradient(135deg, #60a5fa20, #3b82f620)', border: '1px solid #60a5fa40' }}>
            <div style={{ fontSize: 12, color: '#93c5fd' }}>总客流量</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#dbeafe' }}>{summary.totalOrders}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 16px', background: 'linear-gradient(135deg, #a855f720, #9333ea20)', border: '1px solid #a855f740' }}>
            <div style={{ fontSize: 12, color: '#d8b4fe' }}>平均增长</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f3e8ff' }}>{summary.avgGrowth}%</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 16px', background: 'linear-gradient(135deg, #64748b20, #47556920)', border: '1px solid #64748b40' }}>
            <div style={{ fontSize: 12, color: '#cbd5e1' }}>榜首门店</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{summary.topStore}</div>
          </div>
        </div>

        {/* 时间周期和筛选 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
              <button key={p} onClick={() => { setPeriod(p); setPage(1); }}
                style={{
                  padding: '4px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                  border: period === p ? '1px solid #2563eb' : '1px solid #334155',
                  background: period === p ? '#2563eb' : '#1e293b',
                  color: period === p ? '#fff' : '#94a3b8',
                  fontWeight: period === p ? 600 : 400,
                }}>
                {p === 'daily' ? '日榜' : p === 'weekly' ? '周榜' : '月榜'}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="搜索门店名称…"
            style={{
              flex: 1, minWidth: 180, padding: '6px 12px', borderRadius: 6,
              border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0',
              fontSize: 13, outline: 'none',
            }}
          />
        </div>

        {/* 统计条 */}
        <div style={{ marginBottom: 10, fontSize: 13, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
          <span>共 <strong style={{ color: '#94a3b8' }}>{filtered.length}</strong> 家门店</span>
          <span style={{ fontSize: 12, color: '#475569' }}>第 {page}/{totalPages} 页</span>
        </div>

        {/* 排名表 */}
        {paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🏪</div>
            <div style={{ fontSize: 15, color: '#94a3b8' }}>没有匹配的门店</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>请调整搜索条件后重试</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    <th onClick={() => toggleSort('rank')} style={thStyle}>排名{sortIndicator('rank')}</th>
                    <th onClick={() => toggleSort('name')} style={{ ...thStyle, cursor: 'pointer' }}>门店{sortIndicator('name')}</th>
                    <th onClick={() => toggleSort('revenue')} style={{ ...thStyle, cursor: 'pointer' }}>营收{sortIndicator('revenue')}</th>
                    <th onClick={() => toggleSort('rating')} style={{ ...thStyle, cursor: 'pointer' }}>评分{sortIndicator('rating')}</th>
                    <th onClick={() => toggleSort('attendance')} style={{ ...thStyle, cursor: 'pointer' }}>客流{sortIndicator('attendance')}</th>
                    <th onClick={() => toggleSort('growth')} style={{ ...thStyle, cursor: 'pointer' }}>增长{sortIndicator('growth')}</th>
                    <th style={thStyle}>趋势</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(store => (
                    <tr key={store.id} style={{ borderBottom: '1px solid #1e293b', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1e293b'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 28, height: 28, borderRadius: 6,
                          background: store.rank <= 3 ? '#fbbf24' : (store.rank <= 5 ? '#94a3b8' : '#1e293b'),
                          color: store.rank <= 3 ? '#0f172a' : '#94a3b8',
                          fontWeight: 700, fontSize: 13,
                        }}>
                          {store.rank}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{store.name}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#22c55e', fontWeight: 600 }}>{formatCurrency(store.revenue)}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: store.rating >= 4.5 ? '#fbbf24' : (store.rating >= 4.0 ? '#94a3b8' : '#f87171') }}>
                          {'★'.repeat(Math.floor(store.rating))}{store.rating % 1 >= 0.5 ? '½' : ''}
                        </span>
                        <span style={{ color: '#64748b', marginLeft: 4, fontSize: 12 }}>{store.rating}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#60a5fa' }}>{store.attendance}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: store.growth >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                          {store.growth >= 0 ? '+' : ''}{store.growth}%
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <RankChange prevRank={store.prevRank} rank={store.rank} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {filtered.length > pageSize && (
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
  cursor: 'pointer', userSelect: 'none',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 10px', fontSize: 14,
};
