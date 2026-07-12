/**
 * 补货管理 — Replenishment (storefront-web)
 * 角色视角: 👔店长 / 💳采购
 * 功能: 补货列表、优先级排序、状态筛选、补货申请、快速下单、空/加载状态
 */
'use client';

import React, { useState, useMemo } from 'react';

/* ── 类型 ── */
type ReplenishmentItem = {
  id: string;
  name: string;
  qty: number;
  unit: string;
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  category: string;
  currentStock: number;
  minThreshold: number;
  suggestedQty: number;
  requester: string;
  requestedAt: string;
  supplier: string;
  expectedArrival?: string;
};

/* ── Mock 数据 (20+) ── */
const ALL_ITEMS: ReplenishmentItem[] = [
  { id: '1', name: '打印纸', qty: 5, unit: '箱', status: 'pending', priority: 'high', category: '办公耗材', currentStock: 3, minThreshold: 5, suggestedQty: 5, requester: '王小明', requestedAt: '2026-07-12 10:30', supplier: '日用百货批发商城', expectedArrival: '2026-07-15' },
  { id: '2', name: '饮品-可乐', qty: 20, unit: '箱', status: 'ordered', priority: 'medium', category: '饮品', currentStock: 12, minThreshold: 20, suggestedQty: 20, requester: '李娟', requestedAt: '2026-07-11 14:20', supplier: '饮品速配', expectedArrival: '2026-07-14' },
  { id: '3', name: '游戏币', qty: 2000, unit: '枚', status: 'ordered', priority: 'medium', category: '游戏耗材', currentStock: 400, minThreshold: 1000, suggestedQty: 2000, requester: '自动检测', requestedAt: '2026-07-10 09:00', supplier: '华强游戏设备有限公司', expectedArrival: '2026-07-13' },
  { id: '4', name: 'VR手柄', qty: 3, unit: '个', status: 'pending', priority: 'high', category: '设备', currentStock: 2, minThreshold: 4, suggestedQty: 3, requester: '王小明', requestedAt: '2026-07-12 08:15', supplier: '华强游戏设备有限公司' },
  { id: '5', name: '吸尘器滤袋', qty: 4, unit: '个', status: 'pending', priority: 'high', category: '清洁用品', currentStock: 1, minThreshold: 3, suggestedQty: 4, requester: '自动检测', requestedAt: '2026-07-11 16:00', supplier: '日用百货批发商城' },
  { id: '6', name: '饮品-橙汁', qty: 10, unit: '箱', status: 'received', priority: 'medium', category: '饮品', currentStock: 12, minThreshold: 15, suggestedQty: 10, requester: '李娟', requestedAt: '2026-07-08 11:30', supplier: '饮品速配', expectedArrival: '2026-07-10' },
  { id: '7', name: '清洁湿巾', qty: 10, unit: '包', status: 'pending', priority: 'medium', category: '清洁用品', currentStock: 5, minThreshold: 10, suggestedQty: 10, requester: '自动检测', requestedAt: '2026-07-10 14:00', supplier: '日用百货批发商城' },
  { id: '8', name: '零食-巧克力', qty: 10, unit: '盒', status: 'ordered', priority: 'low', category: '零食', currentStock: 5, minThreshold: 10, suggestedQty: 10, requester: '王小明', requestedAt: '2026-07-09 09:45', supplier: '欢乐谷礼品供应', expectedArrival: '2026-07-13' },
  { id: '9', name: '礼品-钥匙扣', qty: 20, unit: '个', status: 'pending', priority: 'medium', category: '礼品', currentStock: 2, minThreshold: 10, suggestedQty: 20, requester: '自动检测', requestedAt: '2026-07-09 08:00', supplier: '欢乐谷礼品供应' },
  { id: '10', name: '一次性纸杯', qty: 500, unit: '只', status: 'received', priority: 'low', category: '办公耗材', currentStock: 200, minThreshold: 100, suggestedQty: 500, requester: '李娟', requestedAt: '2026-07-06 16:30', supplier: '日用百货批发商城', expectedArrival: '2026-07-08' },
  { id: '11', name: '零食-薯片', qty: 20, unit: '包', status: 'cancelled', priority: 'low', category: '零食', currentStock: 38, minThreshold: 20, suggestedQty: 20, requester: '王小明', requestedAt: '2026-07-05 10:00', supplier: '欢乐谷礼品供应' },
  { id: '12', name: '饮品-矿泉水', qty: 24, unit: '瓶', status: 'ordered', priority: 'medium', category: '饮品', currentStock: 30, minThreshold: 30, suggestedQty: 24, requester: '自动检测', requestedAt: '2026-07-07 11:20', supplier: '饮品速配', expectedArrival: '2026-07-12' },
  { id: '13', name: '游戏币盒', qty: 10, unit: '个', status: 'pending', priority: 'low', category: '游戏耗材', currentStock: 12, minThreshold: 5, suggestedQty: 10, requester: '王小明', requestedAt: '2026-07-06 09:30', supplier: '华强游戏设备有限公司' },
  { id: '14', name: '礼品-玩偶', qty: 15, unit: '个', status: 'ordered', priority: 'medium', category: '礼品', currentStock: 48, minThreshold: 10, suggestedQty: 15, requester: '自动检测', requestedAt: '2026-07-05 14:15', supplier: '欢乐谷礼品供应', expectedArrival: '2026-07-11' },
  { id: '15', name: '消毒喷雾', qty: 6, unit: '瓶', status: 'received', priority: 'low', category: '清洁用品', currentStock: 8, minThreshold: 5, suggestedQty: 6, requester: '李娟', requestedAt: '2026-07-04 10:00', supplier: '日用百货批发商城', expectedArrival: '2026-07-06' },
];

/* ── 分类列表 ── */
const CATEGORIES = ['全部', '游戏耗材', '饮品', '礼品', '办公耗材', '设备', '清洁用品', '零食'];

function priorityColor(p: ReplenishmentItem['priority']): string {
  switch (p) {
    case 'high': return '#f87171';
    case 'medium': return '#fbbf24';
    case 'low': return '#94a3b8';
  }
}

function priorityLabel(p: ReplenishmentItem['priority']): string {
  switch (p) {
    case 'high': return '高优先级';
    case 'medium': return '中优先级';
    case 'low': return '低优先级';
  }
}

function statusColor(s: ReplenishmentItem['status']): string {
  switch (s) {
    case 'pending': return '#fbbf24';
    case 'ordered': return '#60a5fa';
    case 'received': return '#34d399';
    case 'cancelled': return '#64748b';
  }
}

function statusLabel(s: ReplenishmentItem['status']): string {
  switch (s) {
    case 'pending': return '待采购';
    case 'ordered': return '已下单';
    case 'received': return '已到货';
    case 'cancelled': return '已取消';
  }
}

export default function ReplenishmentPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  /* ── 排序: 高 > 中 > 低; 待采购 > 已下单 > 已到货 ── */
  const filtered = useMemo(() => {
    let result = [...ALL_ITEMS];
    if (search) result = result.filter(i => i.name.includes(search) || i.category.includes(search) || i.supplier.includes(search));
    if (categoryFilter) result = result.filter(i => i.category === categoryFilter);
    if (statusFilter) result = result.filter(i => i.status === statusFilter);
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const statusOrder = { pending: 0, ordered: 1, received: 2, cancelled: 3 };
    result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || statusOrder[a.status] - statusOrder[b.status]);
    return result;
  }, [search, categoryFilter, statusFilter]);

  /* ── 统计 ── */
  const stats = useMemo(() => ({
    pendingCount: ALL_ITEMS.filter(i => i.status === 'pending').length,
    orderedCount: ALL_ITEMS.filter(i => i.status === 'ordered').length,
    receivedCount: ALL_ITEMS.filter(i => i.status === 'received').length,
    highPriorityCount: ALL_ITEMS.filter(i => i.priority === 'high' && i.status !== 'received').length,
  }), []);

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 300);
  };

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* 标题 */}
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>🚚 补货管理</h1>

        {/* 核心看板卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #f9731620, #ea580c20)', border: '1px solid #f9731640' }}>
            <div style={{ fontSize: 13, color: '#fdba74', marginBottom: 4 }}>待采购</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ffedd5' }}>{stats.pendingCount}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #60a5fa20, #3b82f620)', border: '1px solid #60a5fa40' }}>
            <div style={{ fontSize: 13, color: '#93c5fd', marginBottom: 4 }}>已下单</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#dbeafe' }}>{stats.orderedCount}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #22c55e20, #16a34a20)', border: '1px solid #22c55e40' }}>
            <div style={{ fontSize: 13, color: '#86efac', marginBottom: 4 }}>已到货</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#dcfce7' }}>{stats.receivedCount}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #f8717120, #ef444420)', border: '1px solid #f8717140' }}>
            <div style={{ fontSize: 13, color: '#fca5a5', marginBottom: 4 }}>🔴 紧急待处理</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fecaca' }}>{stats.highPriorityCount}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: '#2563eb', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => alert('📋 已创建新的补货申请单')}>
            <div style={{ fontSize: 13, color: '#bfdbfe', marginBottom: 4 }}>+ 创建补货</div>
            <div style={{ fontSize: 18, color: '#fff', fontWeight: 600 }}>新建申请</div>
          </div>
        </div>

        {/* 筛选 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <input placeholder="搜索品名/分类/供应商…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid #334155', borderRadius: 6, fontSize: 14, background: '#1e293b', color: '#e2e8f0', minWidth: 200 }} />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid #334155', borderRadius: 6, fontSize: 14, background: '#1e293b', color: '#e2e8f0' }}>
            {CATEGORIES.map(c => <option key={c} value={c === '全部' ? '' : c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid #334155', borderRadius: 6, fontSize: 14, background: '#1e293b', color: '#e2e8f0' }}>
            <option value="">全部状态</option>
            <option value="pending">待采购</option>
            <option value="ordered">已下单</option>
            <option value="received">已到货</option>
            <option value="cancelled">已取消</option>
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

        {/* 统计 */}
        <div style={{ marginBottom: 10, fontSize: 13, color: '#64748b' }}>
          共 <strong style={{ color: '#94a3b8' }}>{ALL_ITEMS.length}</strong> 项 · 显示 <strong style={{ color: '#94a3b8' }}>{filtered.length}</strong> 条
        </div>

        {/* 加载 */}
        {loading && <div style={{ textAlign: 'center', padding: 24, color: '#64748b', fontSize: 14 }}>🔄 加载中...</div>}

        {/* 表格 */}
        {!loading && (
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #1e293b' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 850 }}>
              <thead>
                <tr style={{ background: '#1e293b' }}>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'left' }}>品名</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'left' }}>分类</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>当前库存</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>建议补货</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>优先级</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>状态</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'left' }}>供应商</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'left' }}>申请人</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8', textAlign: 'left' }}>申请时间</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #334155', fontSize: 12, color: '#94a3b8' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #1e293b' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1e293b'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                    <td style={{ padding: '10px 14px', color: '#e2e8f0', fontWeight: 500, fontSize: 14 }}>{item.name}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 13 }}>{item.category}</td>
                    <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 600, textAlign: 'right', color: item.currentStock < item.minThreshold ? '#f87171' : '#e2e8f0' }}>
                      {item.currentStock} {item.unit}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#93c5fd', fontWeight: 600, fontSize: 14, textAlign: 'right' }}>
                      {item.suggestedQty} {item.unit}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: priorityColor(item.priority) + '20', color: priorityColor(item.priority), border: `1px solid ${priorityColor(item.priority)}40` }}>
                        {priorityLabel(item.priority)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: statusColor(item.status) + '20', color: statusColor(item.status), border: `1px solid ${statusColor(item.status)}40` }}>
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 13 }}>{item.supplier}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 13 }}>{item.requester}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 13 }}>{item.requestedAt}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {item.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button style={{ padding: '3px 10px', borderRadius: 4, border: 'none', background: '#2563eb', color: '#fff', fontSize: 11, cursor: 'pointer' }}>下单</button>
                          <button style={{ padding: '3px 10px', borderRadius: 4, border: '1px solid #334155', background: 'transparent', color: '#f87171', fontSize: 11, cursor: 'pointer' }}>取消</button>
                        </div>
                      )}
                      {item.status === 'ordered' && (
                        <span style={{ color: '#64748b', fontSize: 12 }}>预计 {item.expectedArrival}</span>
                      )}
                      {(item.status === 'received' || item.status === 'cancelled') && (
                        <span style={{ color: '#64748b', fontSize: 12 }}>—</span>
                      )}
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
            <div style={{ fontSize: 36, marginBottom: 12 }}>🚚</div>
            <div style={{ fontSize: 15, color: '#94a3b8' }}>没有匹配的补货记录</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>请调整筛选条件后重试</div>
          </div>
        )}
      </div>
    </main>
  );
}
