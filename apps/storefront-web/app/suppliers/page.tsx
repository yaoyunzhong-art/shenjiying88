/**
 * 供应商 — Suppliers (storefront-web)
 * 角色视角: 👔店长 / 👤管理员
 * 功能: 供应商列表、合作状态管理、联系方式、商品类别、近期采购统计、搜索/筛选、详情面板、空/错/加载态
 */
'use client';

import React, { useState, useMemo } from 'react';

/* ── 类型 ── */
type Supplier = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  category: string;
  status: 'active' | 'paused' | 'terminated';
  rating: number;
  since: string;
  recentGoods: string[];
  recentPurchases: number;
};

/* ── Mock 数据 (18+) ── */
const ALL_SUPPLIERS: Supplier[] = [
  { id: 'S001', name: '华强游戏设备有限公司', contact: '张经理', phone: '13800001111', email: 'zhang@hqgame.com', address: '深圳市宝安区西乡大道88号', category: '游戏设备', status: 'active', rating: 4.8, since: '2024-03', recentGoods: ['游戏币', '抓娃娃机配件', '彩票纸'], recentPurchases: 28500 },
  { id: 'S002', name: '欢乐谷礼品供应', contact: '李主管', phone: '13800002222', email: 'li@happytoy.com', address: '东莞市长安镇工业路12号', category: '礼品', status: 'active', rating: 4.5, since: '2024-05', recentGoods: ['公仔', '钥匙扣', '徽章', '文化衫'], recentPurchases: 18200 },
  { id: 'S003', name: '饮品速配有限公司', contact: '王总', phone: '13800003333', email: 'wang@drinkexpress.com', address: '广州市白云区物流园B区', category: '饮品', status: 'active', rating: 4.3, since: '2024-06', recentGoods: ['可乐', '橙汁', '矿泉水', '绿茶'], recentPurchases: 9600 },
  { id: 'S004', name: '大众零食批发', contact: '赵主管', phone: '13800004444', email: 'zhao@snacks.com', address: '佛山市南海区平洲工业区', category: '零食', status: 'active', rating: 4.0, since: '2024-07', recentGoods: ['薯片', '坚果', '巧克力', '饼干'], recentPurchases: 12400 },
  { id: 'S005', name: '天天办公用品', contact: '陈经理', phone: '13800005555', email: 'chen@office.com', address: '深圳市龙华区民治大道66号', category: '办公耗材', status: 'paused', rating: 3.8, since: '2024-04', recentGoods: ['打印纸', '硒鼓', '收银纸'], recentPurchases: 3200 },
  { id: 'S006', name: '鲜果之恋', contact: '刘总', phone: '13800006666', email: 'liu@fresh.com', address: '惠州市惠城区桥东水东街', category: '饮品', status: 'active', rating: 4.6, since: '2024-08', recentGoods: ['鲜榨果汁', '椰子水'], recentPurchases: 7800 },
  { id: 'S007', name: '游乐设备工程', contact: '孙工', phone: '13800007777', email: 'sun@amuse.com', address: '广州市番禺区南村镇', category: '游戏设备', status: 'active', rating: 4.7, since: '2024-02', recentGoods: ['模拟设备', '投篮机配件'], recentPurchases: 42000 },
  { id: 'S008', name: '礼品包装精品', contact: '周经理', phone: '13800008888', email: 'zhou@giftpack.com', address: '东莞市厚街镇家具大道', category: '礼品', status: 'terminated', rating: 3.2, since: '2024-09', recentGoods: ['包装盒', '礼品袋'], recentPurchases: 0 },
  { id: 'S009', name: '优品日用百货', contact: '吴主管', phone: '13800009999', email: 'wu@goodlife.com', address: '深圳市罗湖区莲塘', category: '日用百货', status: 'paused', rating: 3.5, since: '2024-10', recentGoods: ['毛巾', '纸巾', '清洁用品'], recentPurchases: 1500 },
  { id: 'S010', name: '昆仑饮品集团', contact: '郑总', phone: '13800001000', email: 'zheng@kunlun.com', address: '珠海市香洲区前山', category: '饮品', status: 'active', rating: 4.2, since: '2024-11', recentGoods: ['矿泉水', '功能饮料', '气泡水'], recentPurchases: 14000 },
  { id: 'S011', name: '新潮玩具有限公司', contact: '马主管', phone: '13800001100', email: 'ma@newtoy.com', address: '深圳市南山区科技园', category: '礼品', status: 'active', rating: 4.4, since: '2025-01', recentGoods: ['盲盒', '手办', '潮玩'], recentPurchases: 32000 },
  { id: 'S012', name: '绿野鲜蔬配送', contact: '黄经理', phone: '13800001200', email: 'huang@greenfield.com', address: '东莞市万江区农批市场', category: '食品', status: 'active', rating: 4.1, since: '2025-02', recentGoods: ['水果拼盘', '蔬菜沙拉'], recentPurchases: 5200 },
  { id: 'S013', name: '天元食品有限公司', contact: '林主管', phone: '13800001300', email: 'lin@tianyuan.com', address: '广州市荔湾区芳村', category: '零食', status: 'active', rating: 4.6, since: '2025-03', recentGoods: ['坚果礼盒', '进口零食'], recentPurchases: 18600 },
  { id: 'S014', name: '恒远包装材料', contact: '郭经理', phone: '13800001400', email: 'guo@hengyuan.com', address: '佛山市顺德区容桂', category: '包装', status: 'paused', rating: 3.6, since: '2025-04', recentGoods: ['塑料袋', '纸箱', '胶带'], recentPurchases: 2800 },
  { id: 'S015', name: '智慧科技游戏', contact: '高总', phone: '13800001500', email: 'gao@smartgame.com', address: '深圳市宝安区新安街道', category: '游戏设备', status: 'active', rating: 4.9, since: '2025-05', recentGoods: ['VR设备', '体感机'], recentPurchases: 86000 },
  { id: 'S016', name: '宏达印刷厂', contact: '张经理', phone: '13800001600', email: 'zhang@hongda.com', address: '东莞市虎门镇印刷工业园', category: '印刷品', status: 'active', rating: 4.0, since: '2025-06', recentGoods: ['优惠券', '宣传单', '积分卡'], recentPurchases: 6200 },
  { id: 'S017', name: '味美思食品', contact: '陈主管', phone: '13800001700', email: 'chen@weimeisi.com', address: '广州市番禺区大石', category: '食品', status: 'active', rating: 4.3, since: '2025-07', recentGoods: ['爆米花', '棉花糖', '冰淇淋'], recentPurchases: 15800 },
  { id: 'S018', name: '电玩配件之家', contact: '杨经理', phone: '13800001800', email: 'yang@arcadeparts.com', address: '深圳市龙岗区坂田', category: '游戏设备', status: 'active', rating: 4.7, since: '2025-08', recentGoods: ['摇杆', '按钮', '主板', '屏幕'], recentPurchases: 34000 },
];

const STATUS_OPTIONS = ['全部', 'active', 'paused', 'terminated'] as const;
const STATUS_LABELS: Record<string, string> = { active: '合作中', paused: '暂停合作', terminated: '已终止' };
const STATUS_COLORS: Record<string, string> = { active: '#34d399', paused: '#fbbf24', terminated: '#f87171' };
const CATEGORY_OPTIONS = ['全部', '游戏设备', '礼品', '饮品', '零食', '食品', '办公耗材', '包装', '印刷品', '日用百货'];
const PAGE_SIZE = 8;

/* ── 子组件: 星级评分 ── */
function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ color: '#fbbf24', fontSize: 12 }}>
      {'★'.repeat(full)}{half ? '☆' : ''} <span style={{ color: '#94a3b8', fontSize: 11, marginLeft: 2 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

/* ── 子组件: 供应商详情弹窗 ── */
function SupplierDetail({ item, onClose }: { item: Supplier; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 380, maxWidth: '90vw', padding: 24, borderRadius: 16,
        background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ color: '#f8fafc', fontSize: 17, fontWeight: 600 }}>供应商详情</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ fontSize: 13, lineHeight: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>名称</span>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{item.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>联系人</span>
            <span style={{ color: '#e2e8f0' }}>{item.contact}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>电话</span>
            <span style={{ color: '#e2e8f0' }}>{item.phone}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>邮箱</span>
            <span style={{ color: '#e2e8f0' }}>{item.email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>地址</span>
            <span style={{ color: '#e2e8f0', textAlign: 'right', maxWidth: 220 }}>{item.address}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>类别</span>
            <span style={{ color: '#e2e8f0' }}>{item.category}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>评分</span>
            <StarRating rating={item.rating} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>合作起始</span>
            <span style={{ color: '#e2e8f0' }}>{item.since}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>最近采购</span>
            <span style={{ color: '#34d399', fontWeight: 600 }}>¥{item.recentPurchases.toLocaleString()}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid rgba(148,163,184,0.1)', margin: '10px 0' }} />
          <div style={{ color: '#94a3b8', marginBottom: 4 }}>供货品类</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {item.recentGoods.map(g => (
              <span key={g} style={{
                padding: '2px 8px', borderRadius: 6, fontSize: 11,
                background: 'rgba(96,165,250,0.15)', color: '#93c5fd',
              }}>
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 子组件: 供应商卡片 ── */
function SupplierCard({ item, onClick }: { item: Supplier; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px 20px', borderRadius: 14, marginBottom: 10,
        background: 'rgba(30,41,59,0.8)', border: `1px solid ${STATUS_COLORS[item.status]}20`,
        cursor: 'pointer', transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(30,41,59,0.95)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(30,41,59,0.8)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{item.name}</div>
          <StarRating rating={item.rating} />
        </div>
        <span style={{
          padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
          background: `${STATUS_COLORS[item.status]}18`, color: STATUS_COLORS[item.status],
          whiteSpace: 'nowrap',
        }}>
          {STATUS_LABELS[item.status]}
        </span>
      </div>
      <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>
        {item.contact} · {item.phone}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          padding: '1px 6px', borderRadius: 4, fontSize: 10,
          background: 'rgba(148,163,184,0.12)', color: '#94a3b8',
        }}>
          {item.category}
        </span>
        <span style={{ color: '#34d399', fontSize: 12, fontWeight: 600 }}>
          本月 ¥{item.recentPurchases.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

/* ── 主组件 ── */
export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('全部');
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [page, setPage] = useState(1);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showError, setShowError] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'purchases'>('rating');

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return ALL_SUPPLIERS
      .filter(s => {
        if (statusFilter !== '全部' && s.status !== statusFilter) return false;
        if (categoryFilter !== '全部' && s.category !== categoryFilter) return false;
        if (kw && !s.name.toLowerCase().includes(kw) && !s.contact.toLowerCase().includes(kw) && !s.phone.includes(kw)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'purchases') return b.recentPurchases - a.recentPurchases;
        return b.rating - a.rating;
      });
  }, [search, statusFilter, categoryFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  React.useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter, sortBy]);

  const activeCount = ALL_SUPPLIERS.filter(s => s.status === 'active').length;
  const pausedCount = ALL_SUPPLIERS.filter(s => s.status === 'paused').length;
  const totalPurchases = ALL_SUPPLIERS.reduce((s, i) => s + i.recentPurchases, 0);

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* ── 标题 ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>供应商管理</h1>
          <button
            onClick={() => setShowError(!showError)}
            style={{
              padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
              background: '#ef444420', border: '1px solid #ef444430',
              color: '#fca5a5', fontSize: 11,
            }}
          >
            {showError ? '恢复数据' : '模拟错误'}
          </button>
        </div>

        {/* ── 概览统计 ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16,
        }}>
          <div style={{ textAlign: 'center', padding: '10px 4px', borderRadius: 10, background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.1)' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>{ALL_SUPPLIERS.length}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>全部</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 4px', borderRadius: 10, background: '#34d39910', border: '1px solid #34d39920' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#34d399' }}>{activeCount}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>合作中</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 4px', borderRadius: 10, background: '#fbbf2410', border: '1px solid #fbbf2420' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fbbf24' }}>{pausedCount}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>暂停</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 4px', borderRadius: 10, background: '#60a5fa10', border: '1px solid #60a5fa20' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#60a5fa' }}>¥{(totalPurchases / 10000).toFixed(1)}万</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>本月采购</div>
          </div>
        </div>

        {/* ── 错误状态 ── */}
        {showError && (
          <div style={{
            padding: '14px 16px', marginBottom: 16, borderRadius: 10,
            background: '#ef444415', border: '1px solid #ef444430',
          }}>
            <div style={{ color: '#fca5a5', fontWeight: 600, marginBottom: 4 }}>⚠️ 数据加载异常</div>
            <div style={{ color: '#fca5a580', fontSize: 13 }}>供应商数据获取失败，请稍后重试</div>
          </div>
        )}

        {!showError && (
          <>
            {/* ── 搜索与筛选 ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="🔍 搜索供应商或联系人..."
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
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === '全部' ? '全部状态' : STATUS_LABELS[s]}</option>)}
              </select>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
                <option value="rating">按评分</option>
                <option value="purchases">按采购额</option>
                <option value="name">按名称</option>
              </select>
            </div>

            {/* ── 列表 / 空状态 ── */}
            {paginated.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '50px 20px', borderRadius: 14,
                background: 'rgba(30,41,59,0.4)', border: '1px dashed rgba(148,163,184,0.15)',
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🏢</div>
                <div style={{ color: '#94a3b8', fontSize: 15, marginBottom: 4 }}>暂无匹配的供应商</div>
                <div style={{ color: '#64748b', fontSize: 12 }}>尝试调整筛选条件或搜索词</div>
              </div>
            ) : (
              <>
                {paginated.map(s => (
                  <SupplierCard key={s.id} item={s} onClick={() => setSelectedSupplier(s)} />
                ))}

                {/* ── 分页 ── */}
                <div style={{
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
                  marginTop: 16, color: '#94a3b8', fontSize: 13,
                }}>
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                    style={{
                      padding: '6px 14px', borderRadius: 8, background: 'rgba(30,41,59,0.6)',
                      border: '1px solid rgba(148,163,184,0.12)',
                      color: page <= 1 ? '#475569' : '#e2e8f0',
                      cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    }}>
                    上一页
                  </button>
                  <span>{page} / {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                    style={{
                      padding: '6px 14px', borderRadius: 8, background: 'rgba(30,41,59,0.6)',
                      border: '1px solid rgba(148,163,184,0.12)',
                      color: page >= totalPages ? '#475569' : '#e2e8f0',
                      cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    }}>
                    下一页
                  </button>
                </div>

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
          </>
        )}
      </div>

      {/* ── 详情弹窗 ── */}
      {selectedSupplier && <SupplierDetail item={selectedSupplier} onClose={() => setSelectedSupplier(null)} />}
    </main>
  );
}
