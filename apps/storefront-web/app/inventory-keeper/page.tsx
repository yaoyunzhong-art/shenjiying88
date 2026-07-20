/**
 * 库存看板 — Inventory Keeper (storefront-web)
 * 角色视角: 👔店长 / 🛒前台
 * 功能: 库存看板、预警、补货建议、分类筛选、搜索、入库/出库趋势
 */
'use client';

import React, { useState, useMemo } from 'react';

/* ── 类型 ── */
type InventoryItem = {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  min: number;
  max: number;
  cost: number;
  updatedAt: string;
  location: string;
  supplier: string;
  status: 'normal' | 'low' | 'overstock' | 'critical';
};

/* ── Mock 数据 (20+) ── */
const ALL_ITEMS: InventoryItem[] = [
  { id: 'INV-001', name: '游戏币', category: '游戏消耗', stock: 4980, unit: '枚', min: 1000, max: 10000, cost: 0.5, updatedAt: '2026-07-13', location: '主库-A01', supplier: '华强游戏设备', status: 'normal' },
  { id: 'INV-002', name: '可口可乐(箱)', category: '饮品', stock: 56, unit: '箱', min: 20, max: 80, cost: 48, updatedAt: '2026-07-12', location: '冷库-B02', supplier: '饮品速配', status: 'normal' },
  { id: 'INV-003', name: '毛绒公仔-中号', category: '礼品', stock: 48, unit: '个', min: 10, max: 80, cost: 35, updatedAt: '2026-07-11', location: '礼品架-C03', supplier: '欢乐谷礼品', status: 'normal' },
  { id: 'INV-004', name: '彩票打印纸', category: '耗材', stock: 3, unit: '箱', min: 5, max: 20, cost: 60, updatedAt: '2026-07-13', location: '耗材柜-D01', supplier: '鑫宇耗材', status: 'low' },
  { id: 'INV-005', name: 'VR手柄', category: '设备配件', stock: 8, unit: '个', min: 5, max: 30, cost: 180, updatedAt: '2026-07-10', location: '配件柜-E02', supplier: '乐玩娱乐', status: 'normal' },
  { id: 'INV-006', name: '一次性杯盖', category: '耗材', stock: 12, unit: '箱', min: 8, max: 25, cost: 20, updatedAt: '2026-07-12', location: '耗材柜-D02', supplier: '鑫宇耗材', status: 'normal' },
  { id: 'INV-007', name: '冰激凌机原料', category: '食品原料', stock: 2, unit: '桶', min: 3, max: 10, cost: 120, updatedAt: '2026-07-13', location: '冷库-A03', supplier: '亿达食品', status: 'low' },
  { id: 'INV-008', name: '奶茶珍珠', category: '食品原料', stock: 1, unit: '袋', min: 3, max: 12, cost: 45, updatedAt: '2026-07-13', location: '冷库-A04', supplier: '亿达食品', status: 'critical' },
  { id: 'INV-009', name: '全自动咖啡机', category: '设备', stock: 2, unit: '台', min: 1, max: 5, cost: 2800, updatedAt: '2026-07-08', location: '设备库-F01', supplier: '华强游戏设备', status: 'normal' },
  { id: 'INV-010', name: '桌游卡牌', category: '礼品', stock: 65, unit: '副', min: 10, max: 60, cost: 28, updatedAt: '2026-07-11', location: '礼品架-C01', supplier: '欢乐谷礼品', status: 'overstock' },
  { id: 'INV-011', name: '橙汁(箱)', category: '饮品', stock: 18, unit: '箱', min: 10, max: 50, cost: 42, updatedAt: '2026-07-12', location: '冷库-B01', supplier: '饮品速配', status: 'normal' },
  { id: 'INV-012', name: '飞镖盘', category: '设备', stock: 5, unit: '个', min: 3, max: 15, cost: 158, updatedAt: '2026-07-09', location: '设备库-F02', supplier: '华强游戏设备', status: 'normal' },
  { id: 'INV-013', name: '投篮机弹簧', category: '设备配件', stock: 20, unit: '个', min: 5, max: 30, cost: 15, updatedAt: '2026-07-10', location: '配件柜-E01', supplier: '乐玩娱乐', status: 'normal' },
  { id: 'INV-014', name: '一次性纸杯', category: '耗材', stock: 28, unit: '箱', min: 10, max: 30, cost: 18, updatedAt: '2026-07-12', location: '耗材柜-D03', supplier: '鑫宇耗材', status: 'normal' },
  { id: 'INV-015', name: '西瓜味糖浆', category: '食品原料', stock: 4, unit: '桶', min: 2, max: 8, cost: 68, updatedAt: '2026-07-11', location: '冷库-A05', supplier: '亿达食品', status: 'normal' },
  { id: 'INV-016', name: '抓娃娃机礼品-小号', category: '礼品', stock: 120, unit: '个', min: 20, max: 150, cost: 8, updatedAt: '2026-07-12', location: '礼品架-C02', supplier: '欢乐谷礼品', status: 'normal' },
  { id: 'INV-017', name: '清洁消毒液', category: '清洁用品', stock: 6, unit: '瓶', min: 5, max: 20, cost: 25, updatedAt: '2026-07-10', location: '清洁区-G01', supplier: '康洁清洁', status: 'normal' },
  { id: 'INV-018', name: '抹布(包)', category: '清洁用品', stock: 2, unit: '包', min: 5, max: 15, cost: 12, updatedAt: '2026-07-12', location: '清洁区-G02', supplier: '康洁清洁', status: 'low' },
  { id: 'INV-019', name: '蓝牙音箱', category: '设备', stock: 3, unit: '台', min: 2, max: 8, cost: 350, updatedAt: '2026-07-08', location: '设备库-F03', supplier: '华强游戏设备', status: 'normal' },
  { id: 'INV-020', name: '彩票', category: '游戏消耗', stock: 2000, unit: '张', min: 500, max: 5000, cost: 1, updatedAt: '2026-07-13', location: '主库-A02', supplier: '天诚广告', status: 'normal' },
  { id: 'INV-021', name: '零食大礼包', category: '食品', stock: 15, unit: '袋', min: 10, max: 40, cost: 45, updatedAt: '2026-07-10', location: '货架-H01', supplier: '新鲜食品', status: 'normal' },
  { id: 'INV-022', name: '碳酸饮料(箱)', category: '饮品', stock: 32, unit: '箱', min: 15, max: 60, cost: 38, updatedAt: '2026-07-13', location: '冷库-B03', supplier: '饮品速配', status: 'normal' },
];

const CATEGORY_OPTIONS = ['全部', '游戏消耗', '饮品', '礼品', '耗材', '设备', '设备配件', '食品原料', '食品', '清洁用品'];
const STATUS_OPTIONS = ['全部', 'normal', 'low', 'critical', 'overstock'];
const STATUS_LABELS: Record<string, string> = { normal: '正常', low: '偏少', critical: '严重不足', overstock: '偏多' };
const STATUS_COLORS: Record<string, string> = { normal: '#34d399', low: '#fbbf24', critical: '#f87171', overstock: '#60a5fa' };

/* ── 子组件: 统计卡片 ── */
function InventoryStats({ items }: { items: InventoryItem[] }) {
  const totalItems = items.length;
  const totalStock = items.reduce((s, i) => s + i.stock, 0);
  const lowCount = items.filter(i => i.status === 'low' || i.status === 'critical').length;
  const overstockCount = items.filter(i => i.status === 'overstock').length;
  const totalValue = items.reduce((s, i) => s + i.stock * i.cost, 0);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
      {[
        { label: '品类总数', count: totalItems, color: '#94a3b8', sub: `${totalStock} 件` },
        { label: '库存总额', count: `¥${(totalValue / 10000).toFixed(1)}万`, color: '#94a3b8', sub: `${(totalValue / totalItems).toFixed(0)} 元/品` },
        { label: '预警商品', count: lowCount, color: lowCount > 0 ? '#f87171' : '#34d399', sub: `短缺+严重` },
        { label: '过剩商品', count: overstockCount, color: overstockCount > 0 ? '#60a5fa' : '#34d399', sub: '库存偏多' },
      ].map((s, i) => (
        <div key={i} style={{
          padding: '12px', borderRadius: 10, textAlign: 'center',
          background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.08)',
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.count}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ── 子组件: 补货建议条 ── */
function RestockBar({ item }: { item: InventoryItem }) {
  if (item.status === 'normal' || item.status === 'overstock') return null;
  const suggested = Math.min(item.max, item.min * 3 - item.stock);
  return (
    <div style={{
      marginTop: 8, padding: '8px 12px', borderRadius: 8,
      background: item.status === 'critical' ? '#ef444415' : '#fbbf2415',
      border: `1px solid ${item.status === 'critical' ? '#ef444430' : '#fbbf2430'}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div>
        <span style={{ fontSize: 12, color: item.status === 'critical' ? '#fca5a5' : '#fde68a' }}>
          {item.status === 'critical' ? '🔴 严重短缺' : '🟡 库存偏低'}
        </span>
        <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>建议补货: {suggested} {item.unit}</span>
      </div>
      <button
        style={{
          padding: '4px 10px', borderRadius: 6,
          background: '#3b82f6', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer',
        }}
        onClick={e => { e.stopPropagation(); alert(`📦 发起 ${item.name} 补货申请 (${suggested}${item.unit})`); }}
      >
        补货
      </button>
    </div>
  );
}

/* ── 子组件: 进度条 ── */
function StockBar({ stock, min, max }: { stock: number; min: number; max: number }) {
  const pct = Math.min(100, Math.max(0, ((stock - min) / (max - min)) * 100));
  const color = stock < min ? '#f87171' : stock > max ? '#60a5fa' : '#34d399';
  return (
    <div style={{ width: '100%', height: 6, background: 'rgba(148,163,184,0.12)', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
    </div>
  );
}

/* ── 主组件 ── */
export default function InventoryKeeperPage() {
  const [loading, _setLoading] = useState(false);
  const [error, _setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', padding: 48, color: '#94a3b8' }}>
          加载中...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', padding: 48, color: '#f87171' }}>
          数据获取失败: {error}
        </div>
      </main>
    );
  }

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return ALL_ITEMS.filter(item => {
      if (categoryFilter !== '全部' && item.category !== categoryFilter) return false;
      if (statusFilter !== '全部' && item.status !== statusFilter) return false;
      if (kw && !item.name.toLowerCase().includes(kw) && !item.category.toLowerCase().includes(kw) && !item.location.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [search, categoryFilter, statusFilter]);

  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  React.useEffect(() => { setPage(1); setExpandedId(null); }, [search, categoryFilter, statusFilter]);

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* ── 标题 ── */}
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 16 }}>库存看板</h1>

        {/* ── 统计卡片 ── */}
        <InventoryStats items={ALL_ITEMS} />

        {/* ── 搜索与筛选 ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="🔍 搜索商品/分类/库位..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 150, padding: '9px 12px', borderRadius: 10,
              background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)',
              color: '#e2e8f0', fontSize: 13, outline: 'none',
            }}
          />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
          </select>
        </div>

        {/* ── 空状态 ── */}
        {paginated.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '50px 20px',
            borderRadius: 14, background: 'rgba(30,41,59,0.4)',
            border: '1px dashed rgba(148,163,184,0.15)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
            <div style={{ color: '#94a3b8', fontSize: 15, marginBottom: 4 }}>暂无匹配的库存商品</div>
            <div style={{ color: '#64748b', fontSize: 12 }}>请调整筛选条件后重试</div>
          </div>
        ) : (
          <>
            {/* ── 列表 ── */}
            {paginated.map(item => (
              <div key={item.id} style={{
                padding: '14px 16px', borderRadius: 10, marginBottom: 6,
                background: 'rgba(30,41,59,0.6)',
                border: `1px solid ${expandedId === item.id ? 'rgba(59,130,246,0.3)' : 'rgba(148,163,184,0.08)'}`,
                cursor: 'pointer',
              }}
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
                      background: STATUS_COLORS[item.status],
                    }} />
                    <span style={{ color: '#e2e8f0', fontWeight: 500, fontSize: 14 }}>{item.name}</span>
                  </div>
                  <span style={{
                    padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: `${STATUS_COLORS[item.status]}20`,
                    color: STATUS_COLORS[item.status],
                  }}>
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>{item.category} · {item.location}</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>
                    {item.stock} {item.unit}
                  </span>
                </div>
                <StockBar stock={item.stock} min={item.min} max={item.max} />

                {/* ── 补货建议 ── */}
                <RestockBar item={item} />

                {/* ── 展开详情 ── */}
                {expandedId === item.id && (
                  <div style={{
                    marginTop: 10, padding: '12px', borderRadius: 8,
                    background: 'rgba(15,23,42,0.5)',
                    border: '1px solid rgba(148,163,184,0.08)',
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                      <div>库存范围: <span style={{ color: '#e2e8f0' }}>{item.min} ~ {item.max} {item.unit}</span></div>
                      <div>进货单价: <span style={{ color: '#e2e8f0' }}>¥{item.cost}</span></div>
                      <div>库存价值: <span style={{ color: '#e2e8f0' }}>¥{(item.stock * item.cost).toLocaleString()}</span></div>
                      <div>供应商: <span style={{ color: '#e2e8f0' }}>{item.supplier}</span></div>
                      <div>更新时间: <span style={{ color: '#e2e8f0' }}>{item.updatedAt}</span></div>
                      <div>编号: <span style={{ color: '#e2e8f0' }}>{item.id}</span></div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button
                        style={{
                          padding: '6px 14px', borderRadius: 6,
                          background: '#3b82f6', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer',
                        }}
                        onClick={e => { e.stopPropagation(); alert(`📊 查看 ${item.name} 出入库记录 (模拟操作)`); }}
                      >
                        出入库记录
                      </button>
                      <button
                        style={{
                          padding: '6px 14px', borderRadius: 6,
                          background: '#8b5cf6', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer',
                        }}
                        onClick={e => { e.stopPropagation(); alert(`✏️ 调整 ${item.name} 库存量 (模拟操作)`); }}
                      >
                        调整库存
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* ── 分页 ── */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
                marginTop: 16, color: '#94a3b8', fontSize: 13,
              }}>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.12)', color: page <= 1 ? '#475569' : '#e2e8f0', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>
                  上一页
                </button>
                <span>{page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.12)', color: page >= totalPages ? '#475569' : '#e2e8f0', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>
                  下一页
                </button>
              </div>
            )}
          </>
        )}

        {/* ── 底部统计 ── */}
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 10,
          background: 'rgba(30,41,59,0.3)', border: '1px solid rgba(148,163,184,0.06)',
          display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 11,
        }}>
          <span>共 {filtered.length} 种商品</span>
          <span>本页 {paginated.length} 种</span>
        </div>
      </div>
    </main>
  );
}
