/**
 * 供应商 — Suppliers (storefront-web)
 * 角色视角: 👔店长 / 🛒前台
 * 功能: 供应商列表、评级、联系方式、合作状态、筛选、搜索、快速联系
 */
'use client';

import React, { useState, useMemo } from 'react';

/* ── 类型 ── */
type SupplierItem = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  category: string;
  rating: number;
  cooperation: '合作中' | '暂停合作' | '终止合作';
  since: string;
  totalOrders: number;
  totalAmount: number;
  address?: string;
  remark?: string;
};

/* ── Mock 数据 (15+) ── */
const ALL_SUPPLIERS: SupplierItem[] = [
  { id: 'SP-001', name: '华强游戏设备有限公司', contact: '张经理', phone: '13800001111', email: 'zhang@huaqiang.com', category: '游戏设备', rating: 4.8, cooperation: '合作中', since: '2024-01', totalOrders: 36, totalAmount: 258000, address: '深圳市南山区科技园路8号' },
  { id: 'SP-002', name: '欢乐谷礼品供应', contact: '李主管', phone: '13800002222', email: 'li@huanlegu.com', category: '礼品', rating: 4.5, cooperation: '合作中', since: '2024-03', totalOrders: 24, totalAmount: 95000, address: '广州市海珠区江南大道中88号' },
  { id: 'SP-003', name: '饮品速配有限公司', contact: '王总', phone: '13800003333', email: 'wang@yinpinsupai.com', category: '饮品', rating: 4.6, cooperation: '合作中', since: '2024-02', totalOrders: 68, totalAmount: 187000, address: '东莞市长安镇乌沙工业区' },
  { id: 'SP-004', name: '新鲜食品供应链', contact: '陈经理', phone: '13800004444', email: 'chen@freshfood.com', category: '食品', rating: 4.3, cooperation: '合作中', since: '2024-04', totalOrders: 42, totalAmount: 120000, remark: '生鲜冷链配送，时效好' },
  { id: 'SP-005', name: '鑫宇耗材批发', contact: '赵主管', phone: '13800005555', email: 'zhao@xinyu.com', category: '耗材', rating: 4.2, cooperation: '合作中', since: '2024-05', totalOrders: 18, totalAmount: 32000, address: '佛山市顺德区陈村镇白陈路' },
  { id: 'SP-006', name: '宏达设备维修', contact: '刘工', phone: '13800006666', email: 'liu@hongda.com', category: '维修服务', rating: 4.0, cooperation: '合作中', since: '2024-06', totalOrders: 12, totalAmount: 45000 },
  { id: 'SP-007', name: '亿达食品原料公司', contact: '黄总', phone: '13800007777', email: 'huang@yida.com', category: '食品原料', rating: 4.4, cooperation: '暂停合作', since: '2024-02', totalOrders: 8, totalAmount: 28000, remark: '因质量问题暂停合作' },
  { id: 'SP-008', name: '天诚广告物料', contact: '周经理', phone: '13800008888', email: 'zhou@tiancheng.com', category: '广告物料', rating: 4.1, cooperation: '合作中', since: '2024-07', totalOrders: 6, totalAmount: 15000, address: '东莞市南城区莞太路' },
  { id: 'SP-009', name: '乐玩娱乐科技', contact: '吴主管', phone: '13800009999', email: 'wu@lewan.com', category: '设备配件', rating: 4.7, cooperation: '合作中', since: '2024-03', totalOrders: 15, totalAmount: 78000, remark: '配件品类齐全，响应快速' },
  { id: 'SP-010', name: '康洁清洁用品', contact: '郑经理', phone: '13800001000', email: 'zheng@kangjie.com', category: '清洁用品', rating: 3.8, cooperation: '合作中', since: '2024-08', totalOrders: 9, totalAmount: 12000, address: '惠州市惠城区河南岸镇' },
  { id: 'SP-011', name: '瑞丰物流有限公司', contact: '林主管', phone: '13800001112', email: 'lin@ruifeng.com', category: '物流', rating: 4.3, cooperation: '合作中', since: '2024-04', totalOrders: 45, totalAmount: 89000 },
  { id: 'SP-012', name: '创艺装饰设计', contact: '许经理', phone: '13800001113', email: 'xu@chuangyi.com', category: '装修维护', rating: 4.0, cooperation: '暂停合作', since: '2024-05', totalOrders: 4, totalAmount: 55000, remark: '合同到期待续签' },
  { id: 'SP-013', name: '北冰洋冷饮供应', contact: '孙总', phone: '13800001114', email: 'sun@iceocean.com', category: '饮品', rating: 4.5, cooperation: '合作中', since: '2024-06', totalOrders: 22, totalAmount: 65000 },
  { id: 'SP-014', name: '安信安防设备', contact: '于主管', phone: '13800001115', email: 'yu@anxin.com', category: '安防设备', rating: 4.2, cooperation: '合作中', since: '2024-09', totalOrders: 3, totalAmount: 28000 },
  { id: 'SP-015', name: '华美收银系统', contact: '谭经理', phone: '13800001116', email: 'tan@huamei.com', category: 'IT服务', rating: 4.6, cooperation: '合作中', since: '2024-01', totalOrders: 10, totalAmount: 135000, remark: '系统运维响应及时' },
];

const COOP_OPTIONS = ['全部', '合作中', '暂停合作', '终止合作'];
const CATEGORY_OPTIONS = ['全部', '游戏设备', '礼品', '饮品', '食品', '食品原料', '耗材', '设备配件', '维修服务', '广告物料', '清洁用品', '物流', '装修维护', '安防设备', 'IT服务'];
const COOP_COLORS: Record<string, string> = { '合作中': '#34d399', '暂停合作': '#fbbf24', '终止合作': '#f87171' };

/* ── 子组件: 评分星星 ── */
function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const stars = '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
  return <span style={{ color: '#fbbf24', fontSize: 12 }}>{stars} {rating.toFixed(1)}</span>;
}

/* ── 子组件: 统计卡片 ── */
function SupplierStats({ items }: { items: SupplierItem[] }) {
  const active = items.filter(i => i.cooperation === '合作中');
  const paused = items.filter(i => i.cooperation === '暂停合作');
  const totalOrders = items.reduce((s, i) => s + i.totalOrders, 0);
  const totalAmount = items.reduce((s, i) => s + i.totalAmount, 0);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
      {[
        { label: '全部供应商', count: items.length, color: '#94a3b8', sub: `${totalOrders} 单` },
        { label: '合作中', count: active.length, color: '#34d399', sub: `¥${(totalAmount / 10000).toFixed(1)}万` },
        { label: '暂停合作', count: paused.length, color: '#fbbf24', sub: '待处理' },
        { label: '平均评分', count: (items.reduce((s, i) => s + i.rating, 0) / items.length).toFixed(1), color: '#fbbf24', sub: '综合评分' },
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
export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [coopFilter, setCoopFilter] = useState('全部');
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return ALL_SUPPLIERS.filter(s => {
      if (coopFilter !== '全部' && s.cooperation !== coopFilter) return false;
      if (categoryFilter !== '全部' && s.category !== categoryFilter) return false;
      if (kw && !s.name.toLowerCase().includes(kw) && !s.contact.toLowerCase().includes(kw) && !s.phone.includes(kw) && !s.category.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [search, coopFilter, categoryFilter]);

  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  React.useEffect(() => { setPage(1); setExpandedId(null); }, [search, coopFilter, categoryFilter]);

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* ── 标题 ── */}
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 16 }}>供应商管理</h1>

        {/* ── 统计卡片 ── */}
        <SupplierStats items={ALL_SUPPLIERS} />

        {/* ── 搜索与筛选 ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="🔍 搜索名称/联系人/电话/品类..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 150, padding: '9px 12px', borderRadius: 10,
              background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)',
              color: '#e2e8f0', fontSize: 13, outline: 'none',
            }}
          />
          <select value={coopFilter} onChange={e => setCoopFilter(e.target.value)}
            style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
            {COOP_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
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
            <div style={{ fontSize: 36, marginBottom: 10 }}>🏢</div>
            <div style={{ color: '#94a3b8', fontSize: 15, marginBottom: 4 }}>暂无匹配供应商</div>
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
                    <span style={{ color: '#e2e8f0', fontWeight: 500, fontSize: 14 }}>{item.name}</span>
                    <StarRating rating={item.rating} />
                  </div>
                  <span style={{
                    padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: `${COOP_COLORS[item.cooperation]}20`,
                    color: COOP_COLORS[item.cooperation],
                  }}>
                    {item.cooperation}
                  </span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>
                  {item.contact} · {item.phone} · {item.category}
                </div>
                <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
                  加入时间: {item.since} · 累计 {item.totalOrders} 单
                </div>

                {/* ── 展开详情 ── */}
                {expandedId === item.id && (
                  <div style={{
                    marginTop: 10, padding: '12px', borderRadius: 8,
                    background: 'rgba(15,23,42,0.5)',
                    border: '1px solid rgba(148,163,184,0.08)',
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                      <div>编号: <span style={{ color: '#e2e8f0' }}>{item.id}</span></div>
                      <div>邮箱: <span style={{ color: '#e2e8f0' }}>{item.email}</span></div>
                      <div>累计金额: <span style={{ color: '#e2e8f0' }}>¥{item.totalAmount.toLocaleString()}</span></div>
                      <div>{item.address ? '' : '备注'}</div>
                    </div>
                    {item.address && (
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>📍 {item.address}</div>
                    )}
                    {item.remark && (
                      <div style={{ fontSize: 12, color: '#60a5fa', marginTop: 2 }}>📌 {item.remark}</div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        style={{
                          padding: '6px 14px', borderRadius: 6,
                          background: '#3b82f6', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer',
                        }}
                        onClick={e => { e.stopPropagation(); alert(`📞 拨打 ${item.contact}(${item.phone}) (模拟操作)`); }}
                      >
                        📞 联系
                      </button>
                      <button
                        style={{
                          padding: '6px 14px', borderRadius: 6,
                          background: '#6366f1', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer',
                        }}
                        onClick={e => { e.stopPropagation(); alert(`📧 发送邮件至 ${item.email} (模拟操作)`); }}
                      >
                        ✉️ 发邮件
                      </button>
                      <button
                        style={{
                          padding: '6px 14px', borderRadius: 6,
                          background: '#8b5cf6', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer',
                        }}
                        onClick={e => { e.stopPropagation(); alert(`📋 查看 ${item.name} 采购记录 (模拟操作)`); }}
                      >
                        采购记录
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
          <span>共 {filtered.length} 家供应商</span>
          <span>本页 {paginated.length} 家</span>
        </div>
      </div>
    </main>
  );
}
