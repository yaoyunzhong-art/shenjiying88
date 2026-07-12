/**
 * 补货管理 — Replenishment (storefront-web)
 * 角色视角: 👔店长 / 💳采购
 * 功能: 补货预警、采购下单、供应商管理、到货跟踪、历史记录、搜索筛选
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
  priority: '高' | '中' | '低';
  supplier: string;
  estimatedDelivery: string;
  orderedAt: string;
  amount: number;
  reason: string;
};

/* ── Mock 数据 ── */
const ALL_ITEMS: ReplenishmentItem[] = [
  { id: '1', name: '打印纸', qty: 5, unit: '箱', status: 'pending', priority: '高', supplier: '得力办公', estimatedDelivery: '2026-07-15', orderedAt: '', amount: 375, reason: '库存告急' },
  { id: '2', name: '饮品-可乐', qty: 20, unit: '箱', status: 'pending', priority: '中', supplier: '华润饮料', estimatedDelivery: '2026-07-16', orderedAt: '', amount: 600, reason: '日常补货' },
  { id: '3', name: '游戏币', qty: 2000, unit: '枚', status: 'ordered', priority: '中', supplier: '华立科技', estimatedDelivery: '2026-07-14', orderedAt: '2026-07-11', amount: 400, reason: '库存偏低' },
  { id: '4', name: '纸巾-抽纸', qty: 10, unit: '箱', status: 'ordered', priority: '高', supplier: '清风纸业', estimatedDelivery: '2026-07-13', orderedAt: '2026-07-10', amount: 250, reason: '即将用完' },
  { id: '5', name: '零食-坚果', qty: 15, unit: '包', status: 'pending', priority: '低', supplier: '良品铺子', estimatedDelivery: '2026-07-18', orderedAt: '', amount: 285, reason: '季节性补货' },
  { id: '6', name: '一次性纸杯', qty: 500, unit: '只', status: 'received', priority: '中', supplier: '日用品批发', estimatedDelivery: '2026-07-10', orderedAt: '2026-07-08', amount: 75, reason: '常规补货' },
  { id: '7', name: '清洁剂-地板', qty: 8, unit: '瓶', status: 'pending', priority: '高', supplier: '蓝月亮', estimatedDelivery: '2026-07-14', orderedAt: '', amount: 320, reason: '库存告急' },
  { id: '8', name: '礼品袋-大号', qty: 50, unit: '个', status: 'cancelled', priority: '低', supplier: '包装材料厂', estimatedDelivery: '', orderedAt: '2026-07-09', amount: 200, reason: '评估后暂缓' },
  { id: '9', name: '饮品-矿泉水', qty: 40, unit: '箱', status: 'ordered', priority: '中', supplier: '华润饮料', estimatedDelivery: '2026-07-15', orderedAt: '2026-07-12', amount: 320, reason: '夏季热销' },
  { id: '10', name: '消毒湿巾', qty: 20, unit: '包', status: 'pending', priority: '高', supplier: '滴露', estimatedDelivery: '2026-07-14', orderedAt: '', amount: 260, reason: '卫生要求' },
  { id: '11', name: '吸尘器配件', qty: 3, unit: '套', status: 'pending', priority: '低', supplier: '戴森授权', estimatedDelivery: '2026-07-20', orderedAt: '', amount: 540, reason: '维护更换' },
  { id: '12', name: '游戏币盒', qty: 30, unit: '个', status: 'received', priority: '中', supplier: '华立科技', estimatedDelivery: '2026-07-09', orderedAt: '2026-07-05', amount: 150, reason: '损耗补充' },
  { id: '13', name: '零食-巧克力', qty: 10, unit: '盒', status: 'ordered', priority: '低', supplier: '良品铺子', estimatedDelivery: '2026-07-17', orderedAt: '2026-07-12', amount: 350, reason: '热卖补货' },
  { id: '14', name: '礼品-玩偶', qty: 20, unit: '个', status: 'pending', priority: '中', supplier: '玩具城', estimatedDelivery: '2026-07-16', orderedAt: '', amount: 780, reason: '活动备货' },
  { id: '15', name: '收银纸卷', qty: 30, unit: '卷', status: 'pending', priority: '高', supplier: '得力办公', estimatedDelivery: '2026-07-14', orderedAt: '', amount: 90, reason: '临近用完' },
];

/* ── 供应商列表 ── */
const SUPPLIERS = ['全部', '得力办公', '华润饮料', '华立科技', '清风纸业', '良品铺子', '蓝月亮', '滴露', '戴森授权', '玩具城', '日用品批发', '包装材料厂'];

/* ── 状态常亮 ── */
function statusColor(status: ReplenishmentItem['status']): string {
  switch (status) {
    case 'pending': return '#fbbf24';
    case 'ordered': return '#60a5fa';
    case 'received': return '#34d399';
    case 'cancelled': return '#94a3b8';
  }
}

function statusLabel(status: ReplenishmentItem['status']): string {
  switch (status) {
    case 'pending': return '待采购';
    case 'ordered': return '已下单';
    case 'received': return '已到货';
    case 'cancelled': return '已取消';
  }
}

export default function ReplenishmentPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const PAGE_SIZE = 10;

  /* ── 统计数据 ── */
  const stats = useMemo(() => ({
    total: ALL_ITEMS.length,
    pending: ALL_ITEMS.filter(i => i.status === 'pending').length,
    ordered: ALL_ITEMS.filter(i => i.status === 'ordered').length,
    received: ALL_ITEMS.filter(i => i.status === 'received').length,
    cancelled: ALL_ITEMS.filter(i => i.status === 'cancelled').length,
    highPriority: ALL_ITEMS.filter(i => i.priority === '高' && i.status !== 'received' && i.status !== 'cancelled').length,
    totalAmount: ALL_ITEMS.filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.amount, 0),
  }), []);

  /* ── 供应商统计 ── */
  const supplierStats = useMemo(() => {
    const map = new Map<string, { orders: number; totalAmount: number }>();
    ALL_ITEMS.forEach(i => {
      const prev = map.get(i.supplier) ?? { orders: 0, totalAmount: 0 };
      map.set(i.supplier, { orders: prev.orders + 1, totalAmount: prev.totalAmount + i.amount });
    });
    return map;
  }, []);

  /* ── 过滤 + 分页 ── */
  const filtered = useMemo(() => {
    let result = [...ALL_ITEMS];
    if (search) result = result.filter(i => i.name.includes(search) || i.supplier.includes(search));
    if (statusFilter) result = result.filter(i => i.status === statusFilter);
    if (priorityFilter) result = result.filter(i => i.priority === priorityFilter);
    if (supplierFilter) result = result.filter(i => i.supplier === supplierFilter);
    return result;
  }, [search, statusFilter, priorityFilter, supplierFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = () => {
    setLoading(true);
    setPage(1);
    setTimeout(() => setLoading(false), 300);
  };

  const handleReset = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setSupplierFilter('');
    setPage(1);
  };

  const simulateOrder = () => {
    if (stats.pending === 0) { alert('✅ 暂无待采购项'); return; }
    alert(`📝 已提交 ${stats.pending} 项采购申请，金额合计 ¥${stats.pending > 0 ? ALL_ITEMS.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0).toLocaleString() : 0}`);
  };

  const simulateExport = () => {
    alert('📄 正在导出补货清单...');
  };

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>
        {/* 标题 + 操作 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>
            📦 补货管理
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={simulateExport}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
              📥 导出
            </button>
            <button onClick={simulateOrder}
              style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              🛒 批量采购
            </button>
          </div>
        </div>

        {/* 指标看板 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #64748b20, #47556920)', border: '1px solid #64748b40' }}>
            <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 4 }}>总补货项</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>{stats.total}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #f9731620, #ea580c20)', border: '1px solid #f9731640' }}>
            <div style={{ fontSize: 13, color: '#fdba74', marginBottom: 4 }}>⏳ 待采购</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ffedd5' }}>{stats.pending}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #60a5fa20, #3b82f620)', border: '1px solid #60a5fa40' }}>
            <div style={{ fontSize: 13, color: '#93c5fd', marginBottom: 4 }}>📦 已下单</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#dbeafe' }}>{stats.ordered}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #22c55e20, #16a34a20)', border: '1px solid #22c55e40' }}>
            <div style={{ fontSize: 13, color: '#86efac', marginBottom: 4 }}>✅ 已到货</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#dcfce7' }}>{stats.received}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #a855f720, #9333ea20)', border: '1px solid #a855f740' }}>
            <div style={{ fontSize: 13, color: '#d8b4fe', marginBottom: 4 }}>🔴 高优先</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f3e8ff' }}>{stats.highPriority}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #0ea5e920, #0284c720)', border: '1px solid #0ea5e940' }}>
            <div style={{ fontSize: 13, color: '#7dd3fc', marginBottom: 4 }}>采购总额</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#e0f2fe' }}>¥{stats.totalAmount.toLocaleString()}</div>
          </div>
        </div>

        {/* 供应商概览 */}
        <div style={{ borderRadius: 12, border: '1px solid #1e293b', padding: 14, marginBottom: 16, background: '#0f172a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontSize: 14, color: '#94a3b8' }}>🏭 供应商概览</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Array.from(supplierStats.entries()).map(([name, s]) => (
              <div key={name} style={{ padding: '6px 12px', borderRadius: 6, background: '#1e293b', border: '1px solid #334155', fontSize: 12 }}>
                <span style={{ color: '#94a3b8' }}>{name}</span>
                <span style={{ color: '#e2e8f0', marginLeft: 6, fontWeight: 600 }}>{s.orders}单</span>
                <span style={{ color: '#64748b', marginLeft: 4 }}>¥{s.totalAmount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 筛选工具栏 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <input placeholder="搜索品名/供应商…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid #334155', borderRadius: 6, fontSize: 14, background: '#1e293b', color: '#e2e8f0', minWidth: 200 }} />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: '7px 12px', border: '1px solid #334155', borderRadius: 6, fontSize: 14, background: '#1e293b', color: '#e2e8f0' }}>
            <option value="">全部状态</option>
            <option value="pending">待采购</option>
            <option value="ordered">已下单</option>
            <option value="received">已到货</option>
            <option value="cancelled">已取消</option>
          </select>
          <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
            style={{ padding: '7px 12px', border: '1px solid #334155', borderRadius: 6, fontSize: 14, background: '#1e293b', color: '#e2e8f0' }}>
            <option value="">全部优先级</option>
            <option value="高">高</option>
            <option value="中">中</option>
            <option value="低">低</option>
          </select>
          <select value={supplierFilter} onChange={e => { setSupplierFilter(e.target.value); setPage(1); }}
            style={{ padding: '7px 12px', border: '1px solid #334155', borderRadius: 6, fontSize: 14, background: '#1e293b', color: '#e2e8f0' }}>
            {SUPPLIERS.map(s => <option key={s} value={s === '全部' ? '' : s}>{s}</option>)}
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

        {/* 统计条 */}
        <div style={{ marginBottom: 8, fontSize: 13, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
          <span>共 <strong style={{ color: '#94a3b8' }}>{stats.total}</strong> 项 · 显示 <strong style={{ color: '#94a3b8' }}>{filtered.length}</strong> 条</span>
          <span style={{ fontSize: 12, color: '#475569' }}>第 {page} / {totalPages} 页</span>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 48, color: '#64748b', fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔄</div>
            <div>处理中...</div>
          </div>
        )}

        {/* 列表 */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pagedItems.map(item => (
              <div key={item.id} style={{
                padding: '14px 16px', borderRadius: 10,
                background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.08)',
                transition: 'background 0.15s',
              }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1e293b'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(30,41,59,0.6)'}>
                {/* 第一行：名称 + 数量 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 15 }}>{item.name}</span>
                    <span style={{
                      display: 'inline-block', padding: '1px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                      background: item.priority === '高' ? '#f8717120' : item.priority === '中' ? '#fbbf2420' : '#64748b20',
                      color: item.priority === '高' ? '#f87171' : item.priority === '中' ? '#fbbf24' : '#94a3b8',
                      border: `1px solid ${item.priority === '高' ? '#f8717140' : item.priority === '中' ? '#fbbf2440' : '#64748b40'}`,
                    }}>
                      {item.priority}优先
                    </span>
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: 14 }}>
                    {item.qty.toLocaleString()} {item.unit}
                    <span style={{ color: '#64748b', marginLeft: 8, fontSize: 13 }}>¥{item.amount.toLocaleString()}</span>
                  </span>
                </div>
                {/* 第二行：状态、供应商、日期 */}
                <div style={{ display: 'flex', gap: 16, fontSize: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{
                    padding: '1px 10px', borderRadius: 999, fontWeight: 600,
                    background: statusColor(item.status) + '18',
                    color: statusColor(item.status),
                    border: `1px solid ${statusColor(item.status)}30`,
                    fontSize: 11,
                  }}>
                    {statusLabel(item.status)}
                  </span>
                  <span style={{ color: '#64748b' }}>
                    🏭 {item.supplier}
                  </span>
                  {item.status === 'ordered' && (
                    <span style={{ color: '#fbbf24' }}>
                      📬 预计 {item.estimatedDelivery}
                    </span>
                  )}
                  {item.status === 'pending' && (
                    <span style={{ color: '#60a5fa' }}>
                      ⏰ 预估 {item.estimatedDelivery}
                    </span>
                  )}
                  {item.orderedAt && (
                    <span style={{ color: '#475569' }}>下单: {item.orderedAt}</span>
                  )}
                  <span style={{ color: '#475569', marginLeft: 'auto' }}>
                    📝 {item.reason}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 空状态 */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 15, color: '#94a3b8' }}>没有匹配的补货记录</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>请调整筛选条件或添加新的补货需求</div>
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
