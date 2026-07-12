/**
 * 盘点 — Stocktaking (storefront-web)
 * 角色视角: 👔店长 / 🛒前台
 * 功能: 盘点列表、差异对比、搜索过滤、分类统计、开始盘点、完成盘点、空/加载状态、分页、批量操作
 */
'use client';

import React, { useState, useMemo } from 'react';

/* ── 类型 ── */
type StocktakeItem = {
  id: string;
  name: string;
  expected: number;
  actual: number;
  diff: number;
  unit: string;
  category: string;
  status: 'pending' | 'done' | 'exception';
  lastStocktake: string;
  location: string;
};

/* ── Mock 数据 (22+) ── */
const ALL_ITEMS: StocktakeItem[] = [
  { id: '1', name: '游戏币', expected: 5000, actual: 4980, diff: -20, unit: '枚', category: '游戏耗材', status: 'done', lastStocktake: '2026-07-12', location: '前台抽屉' },
  { id: '2', name: '饮料(箱)', expected: 120, actual: 120, diff: 0, unit: '箱', category: '饮品', status: 'done', lastStocktake: '2026-07-12', location: '冷柜A' },
  { id: '3', name: '礼品玩偶', expected: 50, actual: 48, diff: -2, unit: '个', category: '礼品', status: 'done', lastStocktake: '2026-07-12', location: '礼品柜' },
  { id: '4', name: 'VR手柄', expected: 10, actual: 10, diff: 0, unit: '个', category: '设备', status: 'done', lastStocktake: '2026-07-12', location: '设备柜' },
  { id: '5', name: '打印纸', expected: 5, actual: 3, diff: -2, unit: '箱', category: '办公耗材', status: 'exception', lastStocktake: '2026-07-11', location: '仓库货架B' },
  { id: '6', name: '饮品-橙汁', expected: 15, actual: 12, diff: -3, unit: '箱', category: '饮品', status: 'exception', lastStocktake: '2026-07-11', location: '冷柜B' },
  { id: '7', name: '一次性纸杯', expected: 250, actual: 200, diff: -50, unit: '只', category: '办公耗材', status: 'done', lastStocktake: '2026-07-10', location: '吧台' },
  { id: '8', name: '清洁湿巾', expected: 10, actual: 5, diff: -5, unit: '包', category: '清洁用品', status: 'exception', lastStocktake: '2026-07-10', location: '清洁站' },
  { id: '9', name: '零食-薯片', expected: 40, actual: 38, diff: -2, unit: '包', category: '零食', status: 'done', lastStocktake: '2026-07-09', location: '零食架A' },
  { id: '10', name: '零食-巧克力', expected: 8, actual: 5, diff: -3, unit: '盒', category: '零食', status: 'done', lastStocktake: '2026-07-09', location: '零食架B' },
  { id: '11', name: '饮品-矿泉水', expected: 80, actual: 80, diff: 0, unit: '瓶', category: '饮品', status: 'done', lastStocktake: '2026-07-08', location: '冷柜A' },
  { id: '12', name: '游戏币盒', expected: 15, actual: 12, diff: -3, unit: '个', category: '游戏耗材', status: 'done', lastStocktake: '2026-07-08', location: '前台' },
  { id: '13', name: '礼品袋', expected: 150, actual: 150, diff: 0, unit: '个', category: '礼品', status: 'pending', lastStocktake: '2026-07-07', location: '仓库' },
  { id: '14', name: '除尘掸', expected: 5, actual: 4, diff: -1, unit: '把', category: '清洁用品', status: 'pending', lastStocktake: '2026-07-07', location: '清洁间' },
  { id: '15', name: '收银纸卷', expected: 50, actual: 48, diff: -2, unit: '卷', category: '办公耗材', status: 'done', lastStocktake: '2026-07-06', location: '前台收银台' },
  { id: '16', name: '礼品-徽章', expected: 300, actual: 300, diff: 0, unit: '个', category: '礼品', status: 'pending', lastStocktake: '2026-07-06', location: '仓库' },
  { id: '17', name: '耳机', expected: 25, actual: 25, diff: 0, unit: '副', category: '设备', status: 'done', lastStocktake: '2026-07-05', location: '设备柜' },
  { id: '18', name: '消毒喷雾', expected: 10, actual: 8, diff: -2, unit: '瓶', category: '清洁用品', status: 'done', lastStocktake: '2026-07-05', location: '清洁站' },
  { id: '19', name: '礼品-钥匙扣', expected: 5, actual: 2, diff: -3, unit: '个', category: '礼品', status: 'exception', lastStocktake: '2026-07-04', location: '仓库' },
  { id: '20', name: '吸尘器滤袋', expected: 3, actual: 1, diff: -2, unit: '个', category: '清洁用品', status: 'done', lastStocktake: '2026-07-04', location: '清洁间' },
  { id: '21', name: '零食-饼干', expected: 25, actual: 25, diff: 0, unit: '包', category: '零食', status: 'pending', lastStocktake: '2026-07-03', location: '零食架A' },
  { id: '22', name: '饮品-运动饮料', expected: 30, actual: 28, diff: -2, unit: '瓶', category: '饮品', status: 'done', lastStocktake: '2026-07-03', location: '冷柜B' },
];

/* ── 分类列表 ── */
const CATEGORIES = ['全部', '游戏耗材', '饮品', '礼品', '办公耗材', '设备', '清洁用品', '零食'];

const PAGE_SIZE = 10;

function statusColor(status: StocktakeItem['status']): string {
  switch (status) {
    case 'done': return '#34d399';
    case 'pending': return '#94a3b8';
    case 'exception': return '#f87171';
  }
}

function statusLabel(status: StocktakeItem['status']): string {
  switch (status) {
    case 'done': return '已盘点';
    case 'pending': return '待盘点';
    case 'exception': return '异常';
  }
}

export default function StocktakingPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'report'>('list');

  /* ── 统计数据 ── */
  const stats = useMemo(() => ({
    totalItems: ALL_ITEMS.length,
    doneItems: ALL_ITEMS.filter(i => i.status === 'done').length,
    pendingItems: ALL_ITEMS.filter(i => i.status === 'pending').length,
    exceptionItems: ALL_ITEMS.filter(i => i.status === 'exception').length,
    totalDiff: ALL_ITEMS.filter(i => i.diff !== 0).length,
    diffValue: ALL_ITEMS.filter(i => i.diff < 0).reduce((s, i) => s + Math.abs(i.diff), 0),
  }), []);

  /* ── 分类统计 ── */
  const categoryStats = useMemo(() => {
    const map = new Map<string, { count: number; total: number; diffCount: number }>();
    ALL_ITEMS.forEach(i => {
      const prev = map.get(i.category) ?? { count: 0, total: 0, diffCount: 0 };
      map.set(i.category, {
        count: prev.count + 1,
        total: prev.total + i.expected,
        diffCount: prev.diffCount + (i.diff !== 0 ? 1 : 0),
      });
    });
    return map;
  }, []);

  /* ── 趋势数据 ── */
  const trends = useMemo(() => {
    const counts: Record<string, { total: number; diff: number }> = {};
    ALL_ITEMS.forEach(i => {
      const date = i.lastStocktake;
      if (!counts[date]) counts[date] = { total: 0, diff: 0 };
      counts[date].total += i.expected;
      counts[date].diff += Math.abs(i.diff);
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7);
  }, []);

  /* ── 过滤 + 分页 ── */
  const filtered = useMemo(() => {
    let result = [...ALL_ITEMS];
    if (search) result = result.filter(i => i.name.includes(search) || i.category.includes(search) || i.location.includes(search));
    if (categoryFilter) result = result.filter(i => i.category === categoryFilter);
    if (statusFilter) result = result.filter(i => i.status === statusFilter);
    return result;
  }, [search, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── 重置分页 ── */
  const handleReset = () => {
    setSearch('');
    setCategoryFilter('');
    setStatusFilter('');
    setPage(1);
    setSelectedIds(new Set());
  };

  const handleSearch = () => {
    setLoading(true);
    setPage(1);
    setTimeout(() => setLoading(false), 300);
  };

  /* ── 全选/反选 ── */
  const toggleAll = () => {
    if (selectedIds.size === pagedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pagedItems.map(i => i.id)));
    }
  };

  const toggleItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const simulateStartStocktake = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('✅ 已发起新一轮盘点，请逐一核对实际库存数量');
    }, 500);
  };

  const simulateExport = () => {
    alert('📄 正在导出盘点报告...');
  };

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>
        {/* 标题 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>
            📋 库存盘点
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setViewMode(viewMode === 'list' ? 'report' : 'list')}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
              {viewMode === 'list' ? '📊 报表视图' : '📋 列表视图'}
            </button>
            <button onClick={simulateExport}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
              📥 导出报告
            </button>
          </div>
        </div>

        {/* 核心看板卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #22c55e20, #16a34a20)', border: '1px solid #22c55e40' }}>
            <div style={{ fontSize: 13, color: '#86efac', marginBottom: 4 }}>已盘点</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#dcfce7' }}>{stats.doneItems}</div>
            <div style={{ fontSize: 11, color: '#4ade8050', marginTop: 2 }}>完成率 {Math.round(stats.doneItems / stats.totalItems * 100)}%</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #64748b20, #47556920)', border: '1px solid #64748b40' }}>
            <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 4 }}>待盘点</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>{stats.pendingItems}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #f9731620, #ea580c20)', border: '1px solid #f9731640' }}>
            <div style={{ fontSize: 13, color: '#fdba74', marginBottom: 4 }}>⚠️ 异常</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ffedd5' }}>{stats.exceptionItems}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #a855f720, #9333ea20)', border: '1px solid #a855f740' }}>
            <div style={{ fontSize: 13, color: '#d8b4fe', marginBottom: 4 }}>差异项数</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f3e8ff' }}>{stats.totalDiff}</div>
            <div style={{ fontSize: 11, color: '#a855f750', marginTop: 2 }}>累计差异 {stats.diffValue} 件</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #0ea5e920, #0284c720)', border: '1px solid #0ea5e940', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <button onClick={simulateStartStocktake}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              + 开始盘点
            </button>
          </div>
        </div>

        {/* 报表视图：分类统计 + 趋势 */}
        {viewMode === 'report' && (
          <div style={{ marginBottom: 20 }}>
            {/* 分类盘点统计 */}
            <div style={{ borderRadius: 12, border: '1px solid #1e293b', padding: 16, marginBottom: 12, background: '#0f172a' }}>
              <h3 style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>📊 分类盘点概况</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {Array.from(categoryStats.entries()).map(([cat, cs]) => (
                  <div key={cat} style={{ padding: '10px 14px', borderRadius: 8, background: '#1e293b', border: '1px solid #334155' }}>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 2 }}>{cat}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>{cs.count} 项</div>
                    <div style={{ fontSize: 11, color: cs.diffCount > 0 ? '#f87171' : '#34d399' }}>
                      {cs.diffCount > 0 ? `⚠️ ${cs.diffCount} 项异常` : '✓ 全部正常'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* 趋势图简化版 */}
            <div style={{ borderRadius: 12, border: '1px solid #1e293b', padding: 16, background: '#0f172a' }}>
              <h3 style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>📈 盘点趋势（近7次）</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80, padding: '8px 0' }}>
                {trends.map(([date, d]) => {
                  const maxDiff = Math.max(...trends.map(([, v]) => v.diff), 1);
                  const height = Math.max((d.diff / maxDiff) * 60, 4);
                  const maxTotal = Math.max(...trends.map(([, v]) => v.total), 1);
                  const totalH = Math.max((d.total / maxTotal) * 60, 4);
                  return (
                    <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontSize: 10, color: '#f87171', marginBottom: 2 }}>{d.diff}</div>
                      <div style={{ width: '70%', background: 'linear-gradient(to top, #f87171, #ef4444)', borderRadius: '4px 4px 0 0', height, minHeight: 4, transition: 'height 0.3s' }} />
                      <div style={{ width: '70%', background: 'linear-gradient(to top, #22c55e, #16a34a)', borderRadius: '4px 4px 0 0', height: totalH, minHeight: 4, marginTop: 2, transition: 'height 0.3s' }} />
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{date.slice(5)}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#64748b', marginTop: 4 }}>
                <span><span style={{ color: '#f87171' }}>■</span> 差异数</span>
                <span><span style={{ color: '#22c55e' }}>■</span> 盘点量</span>
              </div>
            </div>
          </div>
        )}

        {/* 筛选工具栏 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <input placeholder="搜索品名/分类/位置…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid #334155', borderRadius: 6, fontSize: 14, background: '#1e293b', color: '#e2e8f0', minWidth: 200 }} />
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            style={{ padding: '7px 12px', border: '1px solid #334155', borderRadius: 6, fontSize: 14, background: '#1e293b', color: '#e2e8f0' }}>
            {CATEGORIES.map(c => <option key={c} value={c === '全部' ? '' : c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: '7px 12px', border: '1px solid #334155', borderRadius: 6, fontSize: 14, background: '#1e293b', color: '#e2e8f0' }}>
            <option value="">全部状态</option>
            <option value="done">已盘点</option>
            <option value="pending">待盘点</option>
            <option value="exception">异常</option>
          </select>
          <button onClick={handleSearch}
            style={{ padding: '7px 18px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            搜索
          </button>
          <button onClick={handleReset}
            style={{ padding: '7px 18px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            重置
          </button>
        </div>

        {/* 批量操作栏 */}
        {selectedIds.size > 0 && (
          <div style={{ padding: '8px 14px', borderRadius: 8, background: '#1e293b', border: '1px solid #2563eb40', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
            <span style={{ color: '#94a3b8' }}>已选 <strong style={{ color: '#e2e8f0' }}>{selectedIds.size}</strong> 项</span>
            <button style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #22c55e', background: '#22c55e20', color: '#4ade80', fontSize: 12, cursor: 'pointer' }}>
              ✅ 标记为已盘点
            </button>
            <button style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #f87171', background: '#f8717120', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>
              📝 批量录入实盘
            </button>
            <button onClick={() => setSelectedIds(new Set())} style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #334155', background: 'transparent', color: '#64748b', fontSize: 12, cursor: 'pointer', marginLeft: 'auto' }}>
              取消选择
            </button>
          </div>
        )}

        {/* 统计条 */}
        <div style={{ marginBottom: 8, fontSize: 13, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
          <span>共 <strong style={{ color: '#94a3b8' }}>{ALL_ITEMS.length}</strong> 项 · 显示 <strong style={{ color: '#94a3b8' }}>{filtered.length}</strong> 条</span>
          <span style={{ fontSize: 12, color: '#475569' }}>第 {page} / {totalPages} 页</span>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 48, color: '#64748b', fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔄</div>
            <div>处理中...</div>
          </div>
        )}

        {/* 表格 */}
        {!loading && (
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #1e293b' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
              <thead>
                <tr style={{ background: '#1e293b' }}>
                  <th style={{ padding: '10px 8px', borderBottom: '1px solid #334155', width: 36 }}>
                    <input type="checkbox"
                      checked={selectedIds.size === pagedItems.length && pagedItems.length > 0}
                      onChange={toggleAll}
                      style={{ accentColor: '#2563eb', cursor: 'pointer' }} />
                  </th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'left' }}>品名</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'left' }}>分类</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>账存</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>实盘</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>差异</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>状态</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'left' }}>存放位置</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'left' }}>上次盘点</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #1e293b', background: selectedIds.has(item.id) ? '#1a2744' : undefined }}
                    onMouseEnter={e => { if (!selectedIds.has(item.id)) (e.currentTarget as HTMLElement).style.background = '#1e293b'; }}
                    onMouseLeave={e => { if (!selectedIds.has(item.id)) (e.currentTarget as HTMLElement).style.background = ''; }}>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <input type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleItem(item.id)}
                        style={{ accentColor: '#2563eb', cursor: 'pointer' }} />
                    </td>
                    <td style={{ padding: '10px 14px', color: '#e2e8f0', fontWeight: 500, fontSize: 14 }}>{item.name}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 13 }}>{item.category}</td>
                    <td style={{ padding: '10px 14px', color: '#e2e8f0', fontWeight: 600, fontSize: 14, textAlign: 'right' }}>{item.expected.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px', color: '#e2e8f0', fontWeight: 600, fontSize: 14, textAlign: 'right' }}>{item.actual.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 700, textAlign: 'right', color: item.diff === 0 ? '#34d399' : '#f87171' }}>
                      {item.diff === 0 ? '✓' : `${item.diff > 0 ? '+' : ''}${item.diff} ${item.unit}`}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: statusColor(item.status) + '20', color: statusColor(item.status), border: `1px solid ${statusColor(item.status)}40` }}>
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 13 }}>{item.location}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 13 }}>{item.lastStocktake}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button style={{ padding: '3px 10px', borderRadius: 4, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
                        {item.status === 'pending' ? '录入' : '查看'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 空状态 */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 15, color: '#94a3b8' }}>没有匹配的盘点记录</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>请调整筛选条件后重试</div>
          </div>
        )}

        {/* 分页 */}
        {!loading && filtered.length > PAGE_SIZE && (
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
      </div>
    </main>
  );
}
