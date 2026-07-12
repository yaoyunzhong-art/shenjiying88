/**
 * 供应商 — Suppliers (storefront-web)
 * 角色视角: 💳采购 / 👔店长
 * 功能: 供应商列表、搜索、分类筛选、星级评价、联系人详情、最近交易、空/错状态
 */
'use client';

import React, { useState, useMemo } from 'react';

/* ── 类型 ── */
type Supplier = {
  id: string;
  name: string;
  shortName: string;
  contact: string;
  phone: string;
  altPhone?: string;
  category: string;
  rating: number; // 1-5
  status: 'active' | 'paused' | 'blacklisted';
  cooperationYear: number;
  lastOrder?: string;
  lastOrderAmount?: number;
  address?: string;
  remark?: string;
};

/* ── Mock 数据 (20+) ── */
const ALL_SUPPLIERS: Supplier[] = [
  { id: 'S001', name: '华强游戏设备有限公司', shortName: '华强游戏', contact: '张经理', phone: '13800001111', altPhone: '0755-88886666', category: '游戏设备', rating: 5, status: 'active', cooperationYear: 3, lastOrder: '2026-07-10', lastOrderAmount: 16800, address: '深圳市南山区科技园', remark: '主力供应商' },
  { id: 'S002', name: '欢乐谷礼品供应有限公司', shortName: '欢乐谷礼品', contact: '李主管', phone: '13800002222', altPhone: '020-83336666', category: '礼品玩具', rating: 4, status: 'active', cooperationYear: 2, lastOrder: '2026-07-08', lastOrderAmount: 5600, address: '广州市天河区' },
  { id: 'S003', name: '饮品速配有限公司', shortName: '饮品速配', contact: '王总', phone: '13800003333', category: '饮品', rating: 4, status: 'active', cooperationYear: 4, lastOrder: '2026-07-12', lastOrderAmount: 3200, address: '东莞市长安镇' },
  { id: 'S004', name: '鑫达食品供应链', shortName: '鑫达食品', contact: '刘经理', phone: '13900001111', category: '食品零食', rating: 3, status: 'active', cooperationYear: 1, lastOrder: '2026-06-28', lastOrderAmount: 1800, remark: '新供应商试用期' },
  { id: 'S005', name: '天宇设备维修服务', shortName: '天宇维修', contact: '陈师傅', phone: '13900002222', altPhone: '13600003333', category: '维修服务', rating: 5, status: 'active', cooperationYear: 5, lastOrder: '2026-07-11', lastOrderAmount: 2500, address: '深圳市龙华区', remark: '长期合作伙伴' },
  { id: 'S006', name: '广源打印耗材批发', shortName: '广源耗材', contact: '赵主管', phone: '13900003333', category: '耗材', rating: 4, status: 'active', cooperationYear: 3, lastOrder: '2026-07-05', lastOrderAmount: 800, address: '广州市白云区' },
  { id: 'S007', name: '鲜美冷饮原料厂', shortName: '鲜美原料', contact: '周厂长', phone: '13700001111', category: '食品原料', rating: 4, status: 'paused', cooperationYear: 2, lastOrder: '2026-06-15', lastOrderAmount: 4200, remark: '因质检问题暂停合作' },
  { id: 'S008', name: '环球游戏卡牌公司', shortName: '环球卡牌', contact: '吴经理', phone: '13700002222', category: '游戏设备', rating: 3, status: 'active', cooperationYear: 1, lastOrder: '2026-07-01', lastOrderAmount: 9800, address: '上海市浦东新区' },
  { id: 'S009', name: '优品清洁用品', shortName: '优品清洁', contact: '郑女士', phone: '13600001111', category: '清洁用品', rating: 5, status: 'active', cooperationYear: 2, lastOrder: '2026-07-09', lastOrderAmount: 450, address: '深圳市宝安区' },
  { id: 'S010', name: '鑫鑫文具礼品店', shortName: '鑫鑫文具', contact: '孙老板', phone: '13600002222', category: '礼品玩具', rating: 3, status: 'active', cooperationYear: 1, lastOrder: '2026-06-20', lastOrderAmount: 1200, remark: '小型供应商' },
  { id: 'S011', name: '鸿运设备租赁', shortName: '鸿运租赁', contact: '黄经理', phone: '13500001111', category: '设备租赁', rating: 4, status: 'active', cooperationYear: 3, lastOrder: '2026-07-06', lastOrderAmount: 15000, address: '东莞市塘厦镇' },
  { id: 'S012', name: '宏达纸业有限公司', shortName: '宏达纸业', contact: '林主管', phone: '13500002222', category: '耗材', rating: 4, status: 'active', cooperationYear: 4, lastOrder: '2026-07-03', lastOrderAmount: 650 },
  { id: 'S013', name: '速达物流配送', shortName: '速达物流', contact: '何总', phone: '13400001111', category: '物流配送', rating: 3, status: 'active', cooperationYear: 2, lastOrder: '2026-07-12', lastOrderAmount: 3800, address: '深圳市龙岗区', remark: '旺季配送延迟较多' },
  { id: 'S014', name: '海达电子配件', shortName: '海达电子', contact: '马工', phone: '13400002222', category: '设备配件', rating: 5, status: 'active', cooperationYear: 3, lastOrder: '2026-07-08', lastOrderAmount: 5200, address: '深圳市福田区' },
  { id: 'S015', name: '绿色环保清洁', shortName: '绿色清洁', contact: '范经理', phone: '13300001111', category: '清洁用品', rating: 3, status: 'blacklisted', cooperationYear: 0, lastOrder: '2026-05-10', lastOrderAmount: 600, remark: '多次违约，已列入黑名单' },
  { id: 'S016', name: '嘉年华活动策划', shortName: '嘉年华策划', contact: '蔡总监', phone: '13300002222', category: '活动策划', rating: 4, status: 'active', cooperationYear: 2, lastOrder: '2026-07-05', lastOrderAmount: 22000, address: '广州市海珠区' },
  { id: 'S017', name: '新口味食品', shortName: '新口味', contact: '魏主管', phone: '13200001111', category: '食品零食', rating: 5, status: 'active', cooperationYear: 1, lastOrder: '2026-07-10', lastOrderAmount: 2800, remark: '新品口味反馈好' },
  { id: 'S018', name: '恒达信息技术', shortName: '恒达信息', contact: '冯工', phone: '13200002222', category: '信息技术', rating: 4, status: 'active', cooperationYear: 3, lastOrder: '2026-06-25', lastOrderAmount: 12000, address: '深圳市南山区' },
  { id: 'S019', name: '阳光装饰工程', shortName: '阳光装饰', contact: '杨工', phone: '13100001111', category: '装修工程', rating: 4, status: 'paused', cooperationYear: 2, lastOrder: '2026-04-20', lastOrderAmount: 58000, remark: '工程验收后暂停合作' },
  { id: 'S020', name: '悦心花艺绿植', shortName: '悦心花艺', contact: '唐小姐', phone: '13100002222', category: '装饰绿植', rating: 5, status: 'active', cooperationYear: 1, lastOrder: '2026-07-08', lastOrderAmount: 380 },
];

const CATEGORY_OPTIONS = ['全部', '游戏设备', '礼品玩具', '饮品', '食品零食', '食品原料', '耗材', '设备配件', '维修服务', '清洁用品', '物流配送', '设备租赁', '活动策划', '信息技术', '装修工程', '装饰绿植'];
const STATUS_OPTIONS = ['全部', 'active', 'paused', 'blacklisted'];
const STATUS_LABELS: Record<string, string> = { active: '合作中', paused: '暂停合作', blacklisted: '已拉黑' };
const STATUS_COLORS: Record<string, string> = { active: '#34d399', paused: '#fbbf24', blacklisted: '#f87171' };
const PAGE_SIZE = 8;

/* ── 子组件: Star Rating ── */
function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#fbbf24', fontSize: 13 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

/* ── 子组件: 统计摘要 ── */
function SupplierStats({ suppliers }: { suppliers: Supplier[] }) {
  const active = suppliers.filter(s => s.status === 'active').length;
  const paused = suppliers.filter(s => s.status === 'paused').length;
  const blacklisted = suppliers.filter(s => s.status === 'blacklisted').length;
  const totalAmount = suppliers.reduce((s, item) => s + (item.lastOrderAmount || 0), 0);
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16,
    }}>
      {[
        { label: '全部供应商', count: suppliers.length, color: '#94a3b8' },
        { label: '合作中', count: active, color: '#34d399' },
        { label: '暂停', count: paused, color: '#fbbf24' },
        { label: '近期交易额', count: `¥${(totalAmount / 10000).toFixed(1)}w`, color: '#60a5fa' },
      ].map((s, i) => (
        <div key={i} style={{
          padding: '12px', borderRadius: 10, textAlign: 'center',
          background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.08)',
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{typeof s.count === 'number' ? s.count : s.count}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── 主组件 ── */
export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return ALL_SUPPLIERS.filter(s => {
      if (statusFilter !== '全部' && s.status !== statusFilter) return false;
      if (category !== '全部' && s.category !== category) return false;
      if (kw && !s.name.toLowerCase().includes(kw) && !s.shortName.toLowerCase().includes(kw) && !s.contact.toLowerCase().includes(kw) && !s.phone.includes(kw)) return false;
      return true;
    });
  }, [search, category, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  React.useEffect(() => { setPage(1); }, [search, category, statusFilter]);

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* ── 标题 ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>供应商管理</h1>
          <button
            onClick={() => setError(!error)}
            style={{
              padding: '4px 12px', borderRadius: 6,
              background: '#ef444420', border: '1px solid #ef444430',
              color: '#fca5a5', fontSize: 11, cursor: 'pointer',
            }}
          >
            {error ? '恢复' : '模拟加载失败'}
          </button>
        </div>

        {/* ── 错误状态 ── */}
        {error && (
          <div style={{
            padding: '16px 18px', marginBottom: 16, borderRadius: 12,
            background: '#ef444415', border: '1px solid #ef444430',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={{ color: '#fca5a5', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>数据加载失败</div>
              <div style={{ color: '#fca5a580', fontSize: 13 }}>供应商信息获取异常，请稍后重试</div>
              <button
                onClick={() => { setError(false); }}
                style={{
                  marginTop: 8, padding: '6px 16px', borderRadius: 6,
                  background: '#3b82f6', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer',
                }}
              >重新加载</button>
            </div>
          </div>
        )}

        {!error && (
          <>
            {/* ── 统计 ── */}
            <SupplierStats suppliers={ALL_SUPPLIERS} />

            {/* ── 搜索与筛选 ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="🔍 搜索供应商/联系人/电话..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, minWidth: 150, padding: '9px 12px', borderRadius: 10,
                  background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)',
                  color: '#e2e8f0', fontSize: 13, outline: 'none',
                }}
              />
              <select value={category} onChange={e => setCategory(e.target.value)}
                style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 12, outline: 'none', maxWidth: 120 }}>
                <option value="全部">全部分类</option>
                {CATEGORY_OPTIONS.filter(c => c !== '全部').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
                <option value="全部">全部状态</option>
                {STATUS_OPTIONS.filter(s => s !== '全部').map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>

            {/* ── 列表 / 空状态 ── */}
            {paginated.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '50px 20px',
                borderRadius: 14, background: 'rgba(30,41,59,0.4)',
                border: '1px dashed rgba(148,163,184,0.15)',
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                <div style={{ color: '#94a3b8', fontSize: 15, marginBottom: 4 }}>未找到匹配的供应商</div>
                <div style={{ color: '#64748b', fontSize: 12 }}>尝试修改搜索条件或筛选分类</div>
              </div>
            ) : (
              <>
                {paginated.map(s => (
                  <div key={s.id} style={{
                    padding: '16px 20px', borderRadius: 14, marginBottom: 10,
                    background: 'rgba(30,41,59,0.8)',
                    border: '1px solid rgba(148,163,184,0.12)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: 15 }}>{s.name}</span>
                        <span style={{ color: '#64748b', fontSize: 11, marginLeft: 8 }}>{s.shortName}</span>
                      </div>
                      <span style={{
                        padding: '2px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                        background: `${STATUS_COLORS[s.status]}20`,
                        color: STATUS_COLORS[s.status],
                      }}>
                        {STATUS_LABELS[s.status]}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ color: '#64748b', fontSize: 11 }}>{s.category}</span>
                      <span style={{ color: '#334155', fontSize: 11 }}>|</span>
                      <StarRating rating={s.rating} />
                      <span style={{ color: '#64748b', fontSize: 11 }}>合作 {s.cooperationYear} 年</span>
                    </div>

                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#94a3b8', marginBottom: 4, flexWrap: 'wrap' }}>
                      <span>📞 {s.contact} · {s.phone}</span>
                      {s.altPhone && <span style={{ color: '#64748b', fontSize: 11 }}>备用: {s.altPhone}</span>}
                    </div>

                    {s.lastOrder && (
                      <div style={{ color: '#64748b', fontSize: 11 }}>
                        最近订单: {s.lastOrder}
                        {s.lastOrderAmount ? ` · ¥${s.lastOrderAmount.toLocaleString()}` : ''}
                        {s.address && ` · ${s.address}`}
                      </div>
                    )}

                    {s.remark && (
                      <div style={{
                        marginTop: 6, padding: '4px 10px', borderRadius: 6,
                        background: '#3b82f610', border: '1px solid #3b82f620',
                        color: '#60a5fa', fontSize: 11,
                      }}>
                        📌 {s.remark}
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
              <span>共 {filtered.length} 家供应商</span>
              <span>本页 {paginated.length} 家</span>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
