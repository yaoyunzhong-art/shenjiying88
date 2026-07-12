/**
 * 补货管理 — Replenishment (storefront-web)
 * 角色视角: 💳采购 / 👔店长
 * 功能: 补货列表、优先级排序、补货申请、历史订单追踪、搜索筛选、空/错状态
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
  currentStock: number;
  minThreshold: number;
  status: 'pending' | 'ordered' | 'partial' | 'completed' | 'cancelled';
  priority: '高' | '中' | '低';
  supplier?: string;
  requestedBy?: string;
  requestedAt?: string;
  expectedArrival?: string;
  remark?: string;
};

/* ── Mock 数据 (25+) ── */
const ALL_ITEMS: ReplenishmentItem[] = [
  { id: 'RP001', name: '彩票打印纸', category: '耗材', qty: 10, unit: '卷', currentStock: 2, minThreshold: 10, status: 'pending', priority: '高', supplier: '广源耗材', requestedBy: '王小明', requestedAt: '2026-07-13 08:30', expectedArrival: '2026-07-14', remark: '即将用完' },
  { id: 'RP002', name: '冰激凌杯', category: '耗材', qty: 10, unit: '箱', currentStock: 0, minThreshold: 5, status: 'pending', priority: '高', supplier: '鑫达食品', requestedBy: '李娟', requestedAt: '2026-07-13 08:45', expectedArrival: '2026-07-15', remark: '已完全断货' },
  { id: 'RP003', name: '打印纸-A4', category: '耗材', qty: 5, unit: '箱', currentStock: 3, minThreshold: 5, status: 'pending', priority: '高', supplier: '广源耗材', requestedBy: '王小明', requestedAt: '2026-07-12 16:00', expectedArrival: '2026-07-14' },
  { id: 'RP004', name: '可乐(箱)', category: '饮品', qty: 20, unit: '箱', currentStock: 56, minThreshold: 20, status: 'ordered', priority: '中', supplier: '饮品速配', requestedBy: '李娟', requestedAt: '2026-07-12 14:00', expectedArrival: '2026-07-14' },
  { id: 'RP005', name: '橙汁(箱)', category: '饮品', qty: 15, unit: '箱', currentStock: 38, minThreshold: 15, status: 'ordered', priority: '中', supplier: '饮品速配', requestedBy: '李娟', requestedAt: '2026-07-12 14:00', expectedArrival: '2026-07-14' },
  { id: 'RP006', name: '游戏币', category: '游戏道具', qty: 2000, unit: '枚', currentStock: 4980, minThreshold: 1000, status: 'ordered', priority: '中', supplier: '华强游戏', requestedBy: '张主管', requestedAt: '2026-07-11 10:00', expectedArrival: '2026-07-15' },
  { id: 'RP007', name: '巧克力能量棒', category: '食品零食', qty: 10, unit: '箱', currentStock: 6, minThreshold: 10, status: 'pending', priority: '高', supplier: '新口味食品', requestedBy: '王小明', requestedAt: '2026-07-13 09:00', expectedArrival: '2026-07-16' },
  { id: 'RP008', name: '一次性杯盖', category: '耗材', qty: 5, unit: '箱', currentStock: 8, minThreshold: 10, status: 'partial', priority: '中', supplier: '鑫达食品', requestedBy: '李娟', requestedAt: '2026-07-10 11:00', remark: '已到货3箱，待2箱' },
  { id: 'RP009', name: '奶茶珍珠(冷冻)', category: '食品原料', qty: 5, unit: '箱', currentStock: 3, minThreshold: 5, status: 'pending', priority: '高', supplier: '鲜美冷饮', requestedBy: '李娟', requestedAt: '2026-07-13 09:15', remark: '库存即将耗尽' },
  { id: 'RP010', name: '毛绒公仔(大)', category: '礼品', qty: 10, unit: '个', currentStock: 12, minThreshold: 5, status: 'completed', priority: '低', supplier: '欢乐谷礼品', requestedBy: '张主管', requestedAt: '2026-07-08 15:00', expectedArrival: '2026-07-10', remark: '已全部到货' },
  { id: 'RP011', name: '玻尿酸保湿面霜', category: '护肤品', qty: 30, unit: '瓶', currentStock: 15, minThreshold: 30, status: 'pending', priority: '高', supplier: '华强游戏', requestedBy: '前台账', requestedAt: '2026-07-13 08:00', expectedArrival: '2026-07-16' },
  { id: 'RP012', name: '哑光散粉', category: '彩妆', qty: 20, unit: '盒', currentStock: 0, minThreshold: 15, status: 'pending', priority: '高', supplier: '欢乐谷礼品', requestedBy: '前台账', requestedAt: '2026-07-12 17:00', expectedArrival: '2026-07-15', remark: '已断货多日' },
  { id: 'RP013', name: '眉笔(三色)', category: '彩妆', qty: 25, unit: '支', currentStock: 12, minThreshold: 30, status: 'pending', priority: '中', requestedBy: '前台账', requestedAt: '2026-07-13 08:00' },
  { id: 'RP014', name: '矿泉水(箱)', category: '饮品', qty: 30, unit: '箱', currentStock: 62, minThreshold: 20, status: 'pending', priority: '低', requestedBy: '李娟', requestedAt: '2026-07-13 09:30', remark: '夏日备货' },
  { id: 'RP015', name: '护发精油', category: '头发护理', qty: 15, unit: '瓶', currentStock: 5, minThreshold: 15, status: 'pending', priority: '中', requestedBy: '前台账', requestedAt: '2026-07-13 08:00', expectedArrival: '2026-07-18' },
  { id: 'RP016', name: '花香调淡香水 30ml', category: '香水', qty: 10, unit: '瓶', currentStock: 8, minThreshold: 15, status: 'ordered', priority: '中', supplier: '华强游戏', requestedBy: '张主管', requestedAt: '2026-07-11 14:00', expectedArrival: '2026-07-16' },
  { id: 'RP017', name: '护手霜礼盒', category: '身体护理', qty: 10, unit: '盒', currentStock: 2, minThreshold: 10, status: 'ordered', priority: '高', supplier: '新口味食品', requestedBy: '前台账', requestedAt: '2026-07-11 16:00', expectedArrival: '2026-07-14' },
  { id: 'RP018', name: '薯片(混合)', category: '食品零食', qty: 15, unit: '箱', currentStock: 25, minThreshold: 10, status: 'completed', priority: '低', supplier: '新口味食品', requestedBy: '李娟', requestedAt: '2026-07-06 10:00', expectedArrival: '2026-07-08', remark: '已全部到货' },
  { id: 'RP019', name: '修复洗发水', category: '头发护理', qty: 15, unit: '瓶', currentStock: 8, minThreshold: 20, status: 'cancelled', priority: '中', supplier: '饮品速配', requestedBy: '前台账', requestedAt: '2026-07-09 09:00', remark: '供应商缺货，已取消' },
  { id: 'RP020', name: '充电线(多型号)', category: '设备配件', qty: 50, unit: '根', currentStock: 55, minThreshold: 20, status: 'pending', priority: '低', requestedBy: '张主管', requestedAt: '2026-07-13 10:00', remark: '备货用' },
  { id: 'RP021', name: '液体糖浆(多种)', category: '食品原料', qty: 50, unit: '瓶', currentStock: 600, minThreshold: 30, status: 'cancelled', priority: '低', requestedBy: '李娟', requestedAt: '2026-07-10 11:00', remark: '库存充足，无需补货' },
  { id: 'RP022', name: '咖啡豆(意式)', category: '食品原料', qty: 5, unit: '袋', currentStock: 8, minThreshold: 5, status: 'completed', priority: '中', supplier: '新口味食品', requestedBy: '李娟', requestedAt: '2026-07-05 14:00', expectedArrival: '2026-07-07', remark: '已全部到货' },
  { id: 'RP023', name: '抓娃娃机夹子', category: '设备配件', qty: 20, unit: '个', currentStock: 30, minThreshold: 10, status: 'partial', priority: '低', supplier: '海达电子', requestedBy: '张主管', requestedAt: '2026-07-08 16:00', remark: '已到10个，待10个' },
  { id: 'RP024', name: '清洁剂(浓缩)', category: '清洁用品', qty: 10, unit: '瓶', currentStock: 15, minThreshold: 5, status: 'completed', priority: '低', supplier: '优品清洁', requestedBy: '李娟', requestedAt: '2026-07-03 09:00', expectedArrival: '2026-07-05', remark: '已全部到货' },
  { id: 'RP025', name: '矿泉水(箱)', category: '饮品', qty: 40, unit: '箱', currentStock: 62, minThreshold: 20, status: 'ordered', priority: '低', supplier: '饮品速配', requestedBy: '李娟', requestedAt: '2026-07-12 14:00', expectedArrival: '2026-07-14', remark: '夏日备货增加' },
];

const CATEGORY_OPTIONS = ['全部', '饮品', '耗材', '食品零食', '食品原料', '礼品', '设备配件', '清洁用品', '游戏道具', '护肤品', '彩妆', '香水', '头发护理', '身体护理'];
const STATUS_OPTIONS = ['全部', 'pending', 'ordered', 'partial', 'completed', 'cancelled'];
const PRIORITY_OPTIONS = ['全部', '高', '中', '低'];
const STATUS_LABELS: Record<string, string> = {
  pending: '待采购', ordered: '已下单', partial: '部分到货', completed: '已完成', cancelled: '已取消',
};
const STATUS_COLORS: Record<string, string> = {
  pending: '#fbbf24', ordered: '#60a5fa', partial: '#a78bfa', completed: '#34d399', cancelled: '#64748b',
};
const PRIORITY_COLORS = { '高': '#f87171', '中': '#fbbf24', '低': '#94a3b8' };
const PAGE_SIZE = 10;

/* ── 统计 ── */
function ReplenishStats({ items }: { items: ReplenishmentItem[] }) {
  const pending = items.filter(i => i.status === 'pending').length;
  const ordered = items.filter(i => i.status === 'ordered').length;
  const highPriority = items.filter(i => i.priority === '高' && i.status !== 'completed' && i.status !== 'cancelled').length;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
      {[
        { label: '全部补货单', count: items.length, color: '#94a3b8' },
        { label: '待采购', count: pending, color: '#fbbf24' },
        { label: '已下单', count: ordered, color: '#60a5fa' },
        { label: '高优先待处理', count: highPriority, color: '#f87171' },
      ].map((s, i) => (
        <div key={i} style={{ padding: '12px', borderRadius: 10, textAlign: 'center', background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.08)' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.count}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── 主组件 ── */
export default function ReplenishmentPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [priorityFilter, setPriorityFilter] = useState('全部');
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority');
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    let items = ALL_ITEMS.filter(i => {
      if (statusFilter !== '全部' && i.status !== statusFilter) return false;
      if (category !== '全部' && i.category !== category) return false;
      if (priorityFilter !== '全部' && i.priority !== priorityFilter) return false;
      if (kw && !i.name.toLowerCase().includes(kw) && !(i.supplier || '').toLowerCase().includes(kw) && !(i.requestedBy || '').toLowerCase().includes(kw)) return false;
      return true;
    });

    // 排序: 优先级的待采购＞已下单＞已完成
    if (sortBy === 'priority') {
      const priorityOrder = { '高': 0, '中': 1, '低': 2 };
      const statusOrder = { pending: 0, ordered: 1, partial: 2, completed: 3, cancelled: 4 };
      items.sort((a, b) => {
        if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    }
    return items;
  }, [search, category, statusFilter, priorityFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  React.useEffect(() => { setPage(1); }, [search, category, statusFilter, priorityFilter]);

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* ── 标题 ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 2 }}>补货管理</h1>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              共有 {ALL_ITEMS.length} 条补货记录 · 其中待处理 {ALL_ITEMS.filter(i => i.status === 'pending').length} 条
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setError(!error)}
              style={{ padding: '4px 12px', borderRadius: 6, background: '#ef444420', border: '1px solid #ef444430', color: '#fca5a5', fontSize: 11, cursor: 'pointer' }}>
              {error ? '恢复' : '模拟错误'}
            </button>
            <button
              onClick={() => alert('创建新补货申请 (模拟)')}
              style={{ padding: '4px 12px', borderRadius: 6, background: '#3b82f620', border: '1px solid #3b82f640', color: '#60a5fa', fontSize: 11, cursor: 'pointer' }}>
              + 创建补货
            </button>
          </div>
        </div>

        {/* ── 错误状态 ── */}
        {error && (
          <div style={{ padding: '16px 18px', marginBottom: 16, borderRadius: 12, background: '#ef444415', border: '1px solid #ef444430', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🌐</span>
            <div>
              <div style={{ color: '#fca5a5', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>补货数据同步失败</div>
              <div style={{ color: '#fca5a580', fontSize: 13 }}>无法获取采购系统数据，请检查 ERP 连接</div>
              <button onClick={() => setError(false)} style={{ marginTop: 8, padding: '6px 16px', borderRadius: 6, background: '#3b82f6', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer' }}>重新同步</button>
            </div>
          </div>
        )}

        {!error && (
          <>
            {/* ── 统计 ── */}
            <ReplenishStats items={ALL_ITEMS} />

            {/* ── 搜索与筛选 ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <input placeholder="🔍 搜索商品/供应商/申请人..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, minWidth: 150, padding: '9px 12px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 13, outline: 'none' }} />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
                <option value="全部">全部状态</option>
                {STATUS_OPTIONS.filter(s => s !== '全部').map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
              <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
                style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>优先: {p}</option>)}
              </select>
              <select value={category} onChange={e => setCategory(e.target.value)}
                style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 12, outline: 'none', maxWidth: 100 }}>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c === '全部' ? '全部分类' : c}</option>)}
              </select>
              <button onClick={() => setSortBy(sortBy === 'priority' ? 'date' : 'priority')}
                style={{ padding: '9px 12px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#94a3b8', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {sortBy === 'priority' ? '按优先级排序' : '按日期排序'}
              </button>
            </div>

            {/* ── 列表 / 空状态 ── */}
            {paginated.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', borderRadius: 14, background: 'rgba(30,41,59,0.4)', border: '1px dashed rgba(148,163,184,0.15)' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
                <div style={{ color: '#94a3b8', fontSize: 15, marginBottom: 4 }}>暂无符合条件的补货记录</div>
                <div style={{ color: '#64748b', fontSize: 12 }}>所有补货已处理完毕或调整筛选条件</div>
              </div>
            ) : (
              <>
                {paginated.map(item => (
                  <div key={item.id} style={{
                    padding: '14px 16px', borderRadius: 10, marginBottom: 6,
                    background: 'rgba(30,41,59,0.6)',
                    border: `1px solid ${item.status === 'pending' && item.priority === '高' ? 'rgba(248,113,113,0.2)' : 'rgba(148,163,184,0.08)'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#e2e8f0', fontWeight: 500, fontSize: 14 }}>{item.name}</span>
                        <span style={{
                          padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                          background: `${PRIORITY_COLORS[item.priority]}20`,
                          color: PRIORITY_COLORS[item.priority],
                        }}>
                          {item.priority}优先级
                        </span>
                      </div>
                      <span style={{
                        padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                        background: `${STATUS_COLORS[item.status]}20`, color: STATUS_COLORS[item.status],
                      }}>
                        {STATUS_LABELS[item.status]}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#94a3b8', flexWrap: 'wrap' }}>
                      <span>补货量: <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{item.qty} {item.unit}</span></span>
                      <span>当前库存: <span style={{ color: item.currentStock < item.minThreshold ? '#f87171' : '#e2e8f0' }}>{item.currentStock}</span></span>
                      {item.supplier && <span>供应商: {item.supplier}</span>}
                    </div>

                    <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#64748b', marginTop: 4, flexWrap: 'wrap' }}>
                      <span>申请人: {item.requestedBy || '-'}</span>
                      <span>申请时间: {item.requestedAt || '-'}</span>
                      {item.expectedArrival && <span>预计到货: {item.expectedArrival}</span>}
                    </div>

                    {item.remark && (
                      <div style={{
                        marginTop: 6, padding: '4px 10px', borderRadius: 6,
                        background: '#3b82f610', border: '1px solid #3b82f620',
                        color: '#60a5fa', fontSize: 11,
                      }}>
                        📌 {item.remark}
                      </div>
                    )}

                    {item.status === 'pending' && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                        <button onClick={() => alert(`下单: ${item.name} (模拟)`)}
                          style={{ padding: '6px 14px', borderRadius: 6, background: '#3b82f6', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer' }}>
                          确认下单
                        </button>
                        <button onClick={() => alert(`取消: ${item.name} (模拟)`)}
                          style={{ padding: '6px 14px', borderRadius: 6, background: '#ef444420', border: '1px solid #ef444430', color: '#fca5a5', fontSize: 11, cursor: 'pointer' }}>
                          取消
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* ── 分页 ── */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16, color: '#94a3b8', fontSize: 13 }}>
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

            {/* ── 底部 ── */}
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(30,41,59,0.3)', border: '1px solid rgba(148,163,184,0.06)', display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 11 }}>
              <span>共 {filtered.length} 条 · 本页 {paginated.length} 条</span>
              <span>高优先级:{ALL_ITEMS.filter(i=>i.priority==='高'&&(i.status==='pending'||i.status==='ordered')).length} · 中:{ALL_ITEMS.filter(i=>i.priority==='中'&&(i.status==='pending'||i.status==='ordered')).length} · 低:{ALL_ITEMS.filter(i=>i.priority==='低'&&(i.status==='pending'||i.status==='ordered')).length}</span>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
