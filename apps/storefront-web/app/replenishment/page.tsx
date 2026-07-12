/**
 * 补货管理 — Replenishment (storefront-web)
 * 角色视角: 👔店长 / 🛒前台
 * 功能: 补货列表、优先级、状态、分类筛选、搜索、快速下单、历史统计
 */
'use client';

import React, { useState, useMemo } from 'react';

/* ── 类型 ── */
type ReplenishmentItem = {
  id: string;
  name: string;
  category: string;
  qty: number;
  unit: string;
  priority: '高' | '中' | '低';
  status: '待采购' | '已下单' | '配送中' | '已完成' | '已取消';
  supplier: string;
  cost: number;
  createdBy: string;
  createdAt: string;
  expectedAt?: string;
  remark?: string;
};

/* ── Mock 数据 (20+) ── */
const ALL_ITEMS: ReplenishmentItem[] = [
  { id: 'RE-001', name: '奶茶珍珠', category: '食品原料', qty: 5, unit: '袋', priority: '高', status: '待采购', supplier: '亿达食品', cost: 225, createdBy: '李娟', createdAt: '2026-07-13', remark: '已断货' },
  { id: 'RE-002', name: '冰激凌机原料', category: '食品原料', qty: 4, unit: '桶', priority: '高', status: '待采购', supplier: '亿达食品', cost: 480, createdBy: '张主管', createdAt: '2026-07-13', remark: '预计本周到货' },
  { id: 'RE-003', name: '彩票打印纸', category: '耗材', qty: 5, unit: '箱', priority: '高', status: '待采购', supplier: '鑫宇耗材', cost: 300, createdBy: '王小明', createdAt: '2026-07-12' },
  { id: 'RE-004', name: '可口可乐(箱)', category: '饮品', qty: 15, unit: '箱', priority: '中', status: '已下单', supplier: '饮品速配', cost: 720, createdBy: '李娟', createdAt: '2026-07-12', expectedAt: '2026-07-14' },
  { id: 'RE-005', name: '游戏币', category: '游戏消耗', qty: 3000, unit: '枚', priority: '中', status: '已下单', supplier: '华强游戏设备', cost: 1500, createdBy: '王小明', createdAt: '2026-07-11', expectedAt: '2026-07-15' },
  { id: 'RE-006', name: '橙汁(箱)', category: '饮品', qty: 10, unit: '箱', priority: '中', status: '配送中', supplier: '饮品速配', cost: 420, createdBy: '李娟', createdAt: '2026-07-11', expectedAt: '2026-07-13', remark: '预计今天到货' },
  { id: 'RE-007', name: '抹布(包)', category: '清洁用品', qty: 10, unit: '包', priority: '低', status: '待采购', supplier: '康洁清洁', cost: 120, createdBy: '张主管', createdAt: '2026-07-10' },
  { id: 'RE-008', name: '毛绒公仔-中号', category: '礼品', qty: 30, unit: '个', priority: '中', status: '已下单', supplier: '欢乐谷礼品', cost: 1050, createdBy: '王小明', createdAt: '2026-07-10', expectedAt: '2026-07-16' },
  { id: 'RE-009', name: '一次性杯盖', category: '耗材', qty: 8, unit: '箱', priority: '低', status: '已完成', supplier: '鑫宇耗材', cost: 160, createdBy: '李娟', createdAt: '2026-07-09', remark: '已到货入库' },
  { id: 'RE-010', name: '零食大礼包', category: '食品', qty: 20, unit: '袋', priority: '中', status: '配送中', supplier: '新鲜食品', cost: 900, createdBy: '王小明', createdAt: '2026-07-09', expectedAt: '2026-07-14' },
  { id: 'RE-011', name: '碳酸饮料(箱)', category: '饮品', qty: 15, unit: '箱', priority: '低', status: '已完成', supplier: '饮品速配', cost: 570, createdBy: '李娟', createdAt: '2026-07-08' },
  { id: 'RE-012', name: '一次性纸杯', category: '耗材', qty: 10, unit: '箱', priority: '低', status: '已完成', supplier: '鑫宇耗材', cost: 180, createdBy: '张主管', createdAt: '2026-07-08' },
  { id: 'RE-013', name: '西瓜味糖浆', category: '食品原料', qty: 4, unit: '桶', priority: '低', status: '已完成', supplier: '亿达食品', cost: 272, createdBy: '李娟', createdAt: '2026-07-07' },
  { id: 'RE-014', name: '抓娃娃机礼品', category: '礼品', qty: 80, unit: '个', priority: '中', status: '已取消', supplier: '欢乐谷礼品', cost: 640, createdBy: '王小明', createdAt: '2026-07-07', remark: '库存调整，取消补货' },
  { id: 'RE-015', name: '投篮机弹簧', category: '设备配件', qty: 15, unit: '个', priority: '低', status: '已完成', supplier: '乐玩娱乐', cost: 225, createdBy: '张主管', createdAt: '2026-07-06' },
  { id: 'RE-016', name: '清洁消毒液', category: '清洁用品', qty: 8, unit: '瓶', priority: '低', status: '已完成', supplier: '康洁清洁', cost: 200, createdBy: '李娟', createdAt: '2026-07-06' },
  { id: 'RE-017', name: 'VR手柄', category: '设备配件', qty: 5, unit: '个', priority: '低', status: '已完成', supplier: '乐玩娱乐', cost: 900, createdBy: '王小明', createdAt: '2026-07-05' },
  { id: 'RE-018', name: '酸奶(箱)', category: '饮品', qty: 8, unit: '箱', priority: '低', status: '已完成', supplier: '饮品速配', cost: 320, createdBy: '李娟', createdAt: '2026-07-05' },
  { id: 'RE-019', name: '飞镖盘', category: '设备', qty: 3, unit: '个', priority: '低', status: '已完成', supplier: '华强游戏设备', cost: 474, createdBy: '张主管', createdAt: '2026-07-04' },
  { id: 'RE-020', name: '彩票', category: '游戏消耗', qty: 1500, unit: '张', priority: '低', status: '已完成', supplier: '天诚广告', cost: 1500, createdBy: '王小明', createdAt: '2026-07-04' },
];

const CATEGORY_OPTIONS = ['全部', '饮品', '食品', '礼品', '耗材', '设备', '设备配件', '食品原料', '清洁用品', '游戏消耗'];
const STATUS_OPTIONS = ['全部', '待采购', '已下单', '配送中', '已完成', '已取消'];
const PRIORITY_OPTIONS = ['全部', '高', '中', '低'];
const STATUS_COLORS: Record<string, string> = {
  '待采购': '#f87171', '已下单': '#fbbf24', '配送中': '#60a5fa', '已完成': '#34d399', '已取消': '#94a3b8',
};
const PRIORITY_COLORS: Record<string, string> = { '高': '#f87171', '中': '#fbbf24', '低': '#94a3b8' };

/* ── 子组件: 统计卡片 ── */
function ReplenishStats({ items }: { items: ReplenishmentItem[] }) {
  const pending = items.filter(i => i.status === '待采购');
  const ordered = items.filter(i => i.status === '已下单' || i.status === '配送中');
  const done = items.filter(i => i.status === '已完成');
  const totalCost = items.reduce((s, i) => s + i.cost, 0);
  const pendingCost = pending.reduce((s, i) => s + i.cost, 0);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
      {[
        { label: '申请总数', count: items.length, color: '#94a3b8', sub: `¥${(totalCost).toFixed(0)}` },
        { label: '待采购', count: pending.length, color: '#f87171', sub: `¥${(pendingCost).toFixed(0)}` },
        { label: '进行中', count: ordered.length, color: '#60a5fa', sub: `${ordered.length} 单` },
        { label: '已完成', count: done.length, color: '#34d399', sub: `${((done.length / items.length) * 100).toFixed(0)}%` },
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

/* ── 主组件 ── */
export default function ReplenishmentPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [priorityFilter, setPriorityFilter] = useState('全部');
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return ALL_ITEMS.filter(item => {
      if (statusFilter !== '全部' && item.status !== statusFilter) return false;
      if (priorityFilter !== '全部' && item.priority !== priorityFilter) return false;
      if (categoryFilter !== '全部' && item.category !== categoryFilter) return false;
      if (kw && !item.name.toLowerCase().includes(kw) && !item.supplier.toLowerCase().includes(kw) && !item.id.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [search, statusFilter, priorityFilter, categoryFilter]);

  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  React.useEffect(() => { setPage(1); setExpandedId(null); }, [search, statusFilter, priorityFilter, categoryFilter]);

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* ── 标题 ── */}
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 16 }}>补货管理</h1>

        {/* ── 统计卡片 ── */}
        <ReplenishStats items={ALL_ITEMS} />

        {/* ── 搜索与筛选 ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="🔍 搜索商品/供应商/单号..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 130, padding: '9px 12px', borderRadius: 10,
              background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)',
              color: '#e2e8f0', fontSize: 13, outline: 'none',
            }}
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p === '全部' ? '全部' : `${p}优先`}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
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
            <div style={{ color: '#94a3b8', fontSize: 15, marginBottom: 4 }}>暂无匹配的补货申请</div>
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
                      background: PRIORITY_COLORS[item.priority],
                    }} />
                    <span style={{ color: '#e2e8f0', fontWeight: 500, fontSize: 14 }}>{item.name}</span>
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 4,
                      background: `${PRIORITY_COLORS[item.priority]}20`,
                      color: PRIORITY_COLORS[item.priority],
                    }}>
                      {item.priority}优先
                    </span>
                  </div>
                  <span style={{
                    padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: `${STATUS_COLORS[item.status]}20`,
                    color: STATUS_COLORS[item.status],
                  }}>
                    {item.status}
                  </span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>
                  {item.qty} {item.unit} · {item.supplier}
                </div>
                <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
                  金额 ¥{item.cost} · {item.createdBy} · {item.createdAt}
                </div>

                {/* ── 展开详情 ── */}
                {expandedId === item.id && (
                  <div style={{
                    marginTop: 10, padding: '12px', borderRadius: 8,
                    background: 'rgba(15,23,42,0.5)',
                    border: '1px solid rgba(148,163,184,0.08)',
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                      <div>单号: <span style={{ color: '#e2e8f0' }}>{item.id}</span></div>
                      <div>品类: <span style={{ color: '#e2e8f0' }}>{item.category}</span></div>
                      <div>供应商: <span style={{ color: '#e2e8f0' }}>{item.supplier}</span></div>
                      <div>金额: <span style={{ color: '#e2e8f0' }}>¥{item.cost}</span></div>
                      <div>创建人: <span style={{ color: '#e2e8f0' }}>{item.createdBy}</span></div>
                      <div>创建时间: <span style={{ color: '#e2e8f0' }}>{item.createdAt}</span></div>
                      {item.expectedAt && (
                        <div>预计到货: <span style={{ color: '#e2e8f0' }}>{item.expectedAt}</span></div>
                      )}
                    </div>
                    {item.remark && (
                      <div style={{ fontSize: 12, color: '#60a5fa', marginTop: 2 }}>📌 {item.remark}</div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      {item.status === '待采购' && (
                        <button
                          style={{
                            padding: '6px 14px', borderRadius: 6,
                            background: '#3b82f6', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer',
                          }}
                          onClick={e => { e.stopPropagation(); alert(`📦 提交 ${item.name} 采购单 (${item.qty}${item.unit})`); }}
                        >
                          📦 提交采购
                        </button>
                      )}
                      {item.status === '已下单' && (
                        <button
                          style={{
                            padding: '6px 14px', borderRadius: 6,
                            background: '#fbbf24', border: 'none', color: '#0f172a', fontSize: 11, cursor: 'pointer',
                          }}
                          onClick={e => { e.stopPropagation(); alert(`📬 催单: ${item.name} (${item.supplier})`); }}
                        >
                          📬 催单
                        </button>
                      )}
                      <button
                        style={{
                          padding: '6px 14px', borderRadius: 6,
                          background: '#8b5cf6', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer',
                        }}
                        onClick={e => { e.stopPropagation(); alert(`📊 查看 ${item.name} 补货记录 (模拟操作)`); }}
                      >
                        历史记录
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
          <span>共 {filtered.length} 条补货申请</span>
          <span>总计 ¥{filtered.reduce((s, i) => s + i.cost, 0).toFixed(0)}</span>
        </div>
      </div>
    </main>
  );
}
