/**
 * 库存管理 — Inventory Keeper (storefront-web)
 * 角色视角: 👔店长 / 🛒前台 / 💳采购
 * 功能: 库存看板、预警提示、补货建议、搜索过滤、分类统计、空/加载状态
 */
'use client';

import React, { useState, useMemo } from 'react';

/* ── 类型 ── */
type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  unit: string;
  min: number;
  max: number;
  status: 'normal' | 'low' | 'critical' | 'overstocked';
  category: string;
  dailyUsage?: number;
  lastRestock: string;
  location: string;
};

/* ── Mock 数据 (20+) ── */
const ALL_ITEMS: InventoryItem[] = [
  { id: '1', name: '游戏币', stock: 4980, unit: '枚', min: 1000, max: 10000, status: 'normal', category: '游戏耗材', dailyUsage: 200, lastRestock: '2026-07-10', location: '前台抽屉' },
  { id: '2', name: '饮料-可乐', stock: 56, unit: '箱', min: 20, max: 120, status: 'normal', category: '饮品', dailyUsage: 4, lastRestock: '2026-07-08', location: '冷柜A' },
  { id: '3', name: '礼品-玩偶', stock: 48, unit: '个', min: 10, max: 80, status: 'normal', category: '礼品', dailyUsage: 2, lastRestock: '2026-07-05', location: '礼品柜' },
  { id: '4', name: '打印纸', stock: 3, unit: '箱', min: 5, max: 20, status: 'low', category: '办公耗材', dailyUsage: 0.5, lastRestock: '2026-06-20', location: '仓库货架B' },
  { id: '5', name: '饮品-橙汁', stock: 12, unit: '箱', min: 15, max: 60, status: 'low', category: '饮品', dailyUsage: 2, lastRestock: '2026-06-28', location: '冷柜B' },
  { id: '6', name: '一次性纸杯', stock: 200, unit: '只', min: 100, max: 1000, status: 'normal', category: '办公耗材', dailyUsage: 30, lastRestock: '2026-07-01', location: '吧台' },
  { id: '7', name: 'VR手柄', stock: 2, unit: '个', min: 4, max: 15, status: 'critical', category: '设备', dailyUsage: 0, lastRestock: '2026-06-15', location: '设备柜' },
  { id: '8', name: '清洁湿巾', stock: 5, unit: '包', min: 10, max: 50, status: 'low', category: '清洁用品', dailyUsage: 1, lastRestock: '2026-06-25', location: '清洁站' },
  { id: '9', name: '吸尘器滤袋', stock: 1, unit: '个', min: 3, max: 10, status: 'critical', category: '清洁用品', dailyUsage: 0, lastRestock: '2026-06-10', location: '清洁间' },
  { id: '10', name: '礼品-徽章', stock: 300, unit: '个', min: 50, max: 200, status: 'overstocked', category: '礼品', dailyUsage: 5, lastRestock: '2026-07-12', location: '仓库' },
  { id: '11', name: '零食-薯片', stock: 38, unit: '包', min: 20, max: 100, status: 'normal', category: '零食', dailyUsage: 6, lastRestock: '2026-07-09', location: '零食架A' },
  { id: '12', name: '零食-巧克力', stock: 5, unit: '盒', min: 10, max: 40, status: 'low', category: '零食', dailyUsage: 2, lastRestock: '2026-06-30', location: '零食架B' },
  { id: '13', name: '饮品-矿泉水', stock: 80, unit: '瓶', min: 30, max: 200, status: 'normal', category: '饮品', dailyUsage: 8, lastRestock: '2026-07-07', location: '冷柜A' },
  { id: '14', name: '游戏币盒', stock: 12, unit: '个', min: 5, max: 30, status: 'normal', category: '游戏耗材', dailyUsage: 1, lastRestock: '2026-07-06', location: '前台' },
  { id: '15', name: '礼品袋', stock: 150, unit: '个', min: 30, max: 200, status: 'normal', category: '礼品', dailyUsage: 3, lastRestock: '2026-07-11', location: '仓库' },
  { id: '16', name: '除尘掸', stock: 4, unit: '把', min: 3, max: 10, status: 'normal', category: '清洁用品', dailyUsage: 0, lastRestock: '2026-07-02', location: '清洁间' },
  { id: '17', name: '收银纸卷', stock: 48, unit: '卷', min: 10, max: 80, status: 'normal', category: '办公耗材', dailyUsage: 2, lastRestock: '2026-07-04', location: '前台收银台' },
  { id: '18', name: '礼品-钥匙扣', stock: 2, unit: '个', min: 10, max: 50, status: 'critical', category: '礼品', dailyUsage: 1, lastRestock: '2026-06-18', location: '仓库' },
  { id: '19', name: '耳机', stock: 25, unit: '副', min: 5, max: 30, status: 'normal', category: '设备', dailyUsage: 0, lastRestock: '2026-06-22', location: '设备柜' },
  { id: '20', name: '消毒喷雾', stock: 8, unit: '瓶', min: 5, max: 20, status: 'normal', category: '清洁用品', dailyUsage: 0.3, lastRestock: '2026-07-03', location: '清洁站' },
];

/* ── 分类列表 ── */
const CATEGORIES = ['全部', '游戏耗材', '饮品', '礼品', '办公耗材', '设备', '清洁用品', '零食'];

/* ── Helpers ── */
function statusColor(status: InventoryItem['status']): string {
  switch (status) {
    case 'normal': return '#34d399';
    case 'low': return '#fbbf24';
    case 'critical': return '#f87171';
    case 'overstocked': return '#818cf8';
  }
}

function statusLabel(status: InventoryItem['status']): string {
  switch (status) {
    case 'normal': return '正常';
    case 'low': return '偏低';
    case 'critical': return '告急';
    case 'overstocked': return '过剩';
  }
}

export default function InventoryKeeperPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  /* ── 过滤 ── */
  const filtered = useMemo(() => {
    let result = [...ALL_ITEMS];
    if (search) result = result.filter(i => i.name.includes(search) || i.category.includes(search) || i.location.includes(search));
    if (categoryFilter) result = result.filter(i => i.category === categoryFilter);
    if (statusFilter) result = result.filter(i => i.status === statusFilter);
    return result;
  }, [search, categoryFilter, statusFilter]);

  /* ── 看板统计 ── */
  const stats = useMemo(() => ({
    totalItems: ALL_ITEMS.length,
    totalStock: ALL_ITEMS.reduce((s, i) => s + i.stock, 0),
    lowItems: ALL_ITEMS.filter(i => i.status === 'low' || i.status === 'critical').length,
    overstockedItems: ALL_ITEMS.filter(i => i.status === 'overstocked').length,
    needsRestock: ALL_ITEMS.filter(i => i.stock < i.min).map(i => ({ name: i.name, shortBy: i.min - i.stock, unit: i.unit })),
  }), []);

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 300);
  };

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* 标题 */}
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>📊 库存看板</h1>

        {/* 核心看板卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #0ea5e920, #0284c720)', border: '1px solid #0ea5e940' }}>
            <div style={{ fontSize: 13, color: '#7dd3fc', marginBottom: 4 }}>库存品项</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#e0f2fe' }}>{stats.totalItems}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #22c55e20, #16a34a20)', border: '1px solid #22c55e40' }}>
            <div style={{ fontSize: 13, color: '#86efac', marginBottom: 4 }}>库存总量</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#dcfce7' }}>{stats.totalStock.toLocaleString()}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #f9731620, #ea580c20)', border: '1px solid #f9731640' }}>
            <div style={{ fontSize: 13, color: '#fdba74', marginBottom: 4 }}>⚠️ 需补货</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ffedd5' }}>{stats.lowItems}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #a855f720, #9333ea20)', border: '1px solid #a855f740' }}>
            <div style={{ fontSize: 13, color: '#d8b4fe', marginBottom: 4 }}>库存积压</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f3e8ff' }}>{stats.overstockedItems}</div>
          </div>
        </div>

        {/* 补货建议 */}
        {stats.needsRestock.length > 0 && (
          <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, background: '#7f1d1d40', border: '1px solid #f8717140' }}>
            <div style={{ color: '#fca5a5', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>⚠️ 以下商品库存不足，建议尽快补货：</div>
            {stats.needsRestock.map((item, i) => (
              <div key={i} style={{ color: '#fecaca', fontSize: 12, marginBottom: 4 }}>
                {item.name}：缺 {item.shortBy} {item.unit}
              </div>
            ))}
          </div>
        )}

        {/* 筛选工具栏 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <input
            placeholder="搜索品名/分类/位置…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid #334155', borderRadius: 6, fontSize: 14, background: '#1e293b', color: '#e2e8f0', minWidth: 200 }}
          />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid #334155', borderRadius: 6, fontSize: 14, background: '#1e293b', color: '#e2e8f0' }}>
            {CATEGORIES.map(c => <option key={c} value={c === '全部' ? '' : c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid #334155', borderRadius: 6, fontSize: 14, background: '#1e293b', color: '#e2e8f0' }}>
            <option value="">全部状态</option>
            <option value="normal">正常</option>
            <option value="low">偏低</option>
            <option value="critical">告急</option>
            <option value="overstocked">过剩</option>
          </select>
          <button onClick={handleSearch}
            style={{ padding: '7px 18px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            搜索
          </button>
          <button onClick={() => { setSearch(''); setCategoryFilter(''); setStatusFilter(''); }}
            style={{ padding: '7px 18px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            重置
          </button>
        </div>

        {/* 表格头部统计 */}
        <div style={{ marginBottom: 10, fontSize: 13, color: '#64748b' }}>
          共 <strong style={{ color: '#94a3b8' }}>{ALL_ITEMS.length}</strong> 项 · 显示 <strong style={{ color: '#94a3b8' }}>{filtered.length}</strong> 条
        </div>

        {/* 加载状态 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 24, color: '#64748b', fontSize: 14 }}>
            🔄 搜索中...
          </div>
        )}

        {/* 表格渲染 */}
        {!loading && (
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #1e293b' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 750 }}>
              <thead>
                <tr style={{ background: '#1e293b' }}>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'left' }}>品名</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'left' }}>分类</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>库存量</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>阈值</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>状态</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'left' }}>存放位置</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'left' }}>最近补货</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #1e293b' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1e293b'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                    <td style={{ padding: '10px 14px', color: '#e2e8f0', fontWeight: 500, fontSize: 14 }}>{item.name}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 13 }}>{item.category}</td>
                    <td style={{ padding: '10px 14px', color: '#e2e8f0', fontWeight: 600, fontSize: 14, textAlign: 'right' }}>
                      {item.stock.toLocaleString()} {item.unit}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 13, textAlign: 'right' }}>
                      {item.min} ~ {item.max}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: statusColor(item.status) + '20', color: statusColor(item.status), border: `1px solid ${statusColor(item.status)}40` }}>
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 13 }}>{item.location}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 13 }}>{item.lastRestock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 空状态 */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 15, color: '#94a3b8' }}>没有匹配的库存项</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>请调整筛选条件后重试</div>
          </div>
        )}
      </div>
    </main>
  );
}
