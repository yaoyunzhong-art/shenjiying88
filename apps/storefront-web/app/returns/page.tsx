/**
 * 退换货 — Returns (storefront-web)
 * 角色视角: 👤会员 / 👔店长
 * 功能: 退换货申请列表、状态追踪、按状态/日期筛选、搜索订单号、详情弹窗、空/错/加载态
 */
'use client';

import React, { useState, useMemo } from 'react';

/* ── 类型 ── */
type ReturnItem = {
  id: string;
  product: string;
  qty: number;
  reason: string;
  detail: string;
  status: '处理中' | '已完成' | '已拒绝' | '待审核';
  date: string;
  amount: number;
};

type StatusKey = ReturnItem['status'] | '全部';

/* ── Mock 数据 (25+) ── */
const ALL_RETURNS: ReturnItem[] = [
  { id: 'TH20260712001', product: '游戏币(袋装)', qty: 2, reason: '包装破损', detail: '收到时外包装已破裂，内部有少量漏出', status: '处理中', date: '2026-07-12', amount: 60 },
  { id: 'TH20260710003', product: '饮品-橙汁', qty: 1, reason: '临近保质期', detail: '距离保质期仅3天，不符合新鲜供应标准', status: '已完成', date: '2026-07-10', amount: 18 },
  { id: 'TH20260708002', product: '兑换奖品-公仔', qty: 1, reason: '颜色发错', detail: '下单的是蓝色款，收到为粉色款', status: '待审核', date: '2026-07-08', amount: 88 },
  { id: 'TH20260705011', product: '饮料-可乐', qty: 2, reason: '漏气', detail: '瓶盖密封不严，已完全没气了', status: '已完成', date: '2026-07-05', amount: 12 },
  { id: 'TH20260703006', product: '零食-薯片', qty: 3, reason: '过期', detail: '已过保质期5天，无法食用', status: '已拒绝', date: '2026-07-03', amount: 45 },
  { id: 'TH20260701009', product: '杯具', qty: 1, reason: '破损', detail: '快递运输途中破损，已碎裂', status: '处理中', date: '2026-07-01', amount: 29 },
  { id: 'TH20260628015', product: '游戏币(盒装)', qty: 1, reason: '数量不对', detail: '下单100枚，实际收到仅80枚', status: '已完成', date: '2026-06-28', amount: 50 },
  { id: 'TH20260625003', product: '饮料-奶茶', qty: 4, reason: '口味不符', detail: '标注是原味但实际口感偏苦', status: '已完成', date: '2026-06-25', amount: 40 },
  { id: 'TH20260622008', product: '礼品-钥匙扣', qty: 2, reason: '质量问题', detail: '印刷模糊，掉色严重', status: '已拒绝', date: '2026-06-22', amount: 36 },
  { id: 'TH20260619007', product: '饮品-矿泉水', qty: 1, reason: '封装问题', detail: '瓶盖已被开启过', status: '待审核', date: '2026-06-19', amount: 6 },
  { id: 'TH20260616004', product: '奖品-手办', qty: 1, reason: '瑕疵', detail: '手办表面有明显划痕和色差', status: '处理中', date: '2026-06-16', amount: 158 },
  { id: 'TH20260613010', product: '饮料-汽水', qty: 6, reason: '包装变形', detail: '运输挤压导致多瓶变形', status: '已完成', date: '2026-06-13', amount: 30 },
  { id: 'TH20260610002', product: '兑换券-A', qty: 1, reason: '不可用', detail: '兑换码无法在机器上使用', status: '已完成', date: '2026-06-10', amount: 100 },
  { id: 'TH20260607012', product: '零食-饼干', qty: 2, reason: '发霉', detail: '打开后发现有霉变', status: '待审核', date: '2026-06-07', amount: 24 },
  { id: 'TH20260604006', product: '饮品-椰子水', qty: 3, reason: '口感异常', detail: '酸败味，疑似已经变质', status: '处理中', date: '2026-06-04', amount: 39 },
  { id: 'TH20260601009', product: '礼品-徽章', qty: 5, reason: '设计错误', detail: 'logo印反了', status: '已完成', date: '2026-06-01', amount: 50 },
  { id: 'TH20260528011', product: '饮料-果汁', qty: 1, reason: '瓶爆', detail: '运输过程中瓶子爆裂', status: '已完成', date: '2026-05-28', amount: 15 },
  { id: 'TH20260525007', product: '零食-巧克力', qty: 2, reason: '融化', detail: '高温运输导致完全融化变形', status: '已拒绝', date: '2026-05-25', amount: 56 },
  { id: 'TH20260522003', product: '赠品-纸巾', qty: 1, reason: '缺失', detail: '订单标注含赠品但实际未收到', status: '已完成', date: '2026-05-22', amount: 0 },
  { id: 'TH20260519014', product: '饮品-气泡水', qty: 2, reason: '口味不对', detail: '口味与标签标注不一致', status: '待审核', date: '2026-05-19', amount: 20 },
  { id: 'TH20260516008', product: '游戏币(桶装)', qty: 1, reason: '桶破损', detail: '塑料桶有裂缝，币散落', status: '处理中', date: '2026-05-16', amount: 150 },
  { id: 'TH20260513002', product: '饮料-绿茶', qty: 4, reason: '浑浊', detail: '液体浑浊有沉淀物', status: '已完成', date: '2026-05-13', amount: 32 },
  { id: 'TH20260510011', product: '礼品-文化衫', qty: 1, reason: '尺码偏大', detail: '购买M码但实际约等于XXL', status: '已拒绝', date: '2026-05-10', amount: 128 },
  { id: 'TH20260507006', product: '饮品-功能饮料', qty: 3, reason: '漏液', detail: '多瓶瓶盖处有漏液痕迹', status: '已完成', date: '2026-05-07', amount: 45 },
  { id: 'TH20260504003', product: '零食-坚果', qty: 1, reason: '受潮', detail: '包装密封不好，坚果已变软', status: '已完成', date: '2026-05-04', amount: 32 },
  { id: 'TH20260501010', product: '饮料-酸奶', qty: 2, reason: '胀包', detail: '包装已明显胀气，疑已变质', status: '待审核', date: '2026-05-01', amount: 24 },
];

const STATUS_OPTIONS: StatusKey[] = ['全部', '待审核', '处理中', '已完成', '已拒绝'];
const REASON_OPTIONS = ['全部', '包装破损', '质量问题', '过期/临期', '数量不对', '发错', '其他'];
const PAGE_SIZE = 10;

const STATUS_COLORS: Record<string, string> = {
  '待审核': '#60a5fa',
  '处理中': '#fbbf24',
  '已完成': '#34d399',
  '已拒绝': '#f87171',
};

/* ── 子组件: 状态统计卡片 ── */
function ReturnStats({ items }: { items: ReturnItem[] }) {
  const counts = useMemo(() => {
    const pending = items.filter(i => i.status === '待审核').length;
    const processing = items.filter(i => i.status === '处理中').length;
    const done = items.filter(i => i.status === '已完成').length;
    const rejected = items.filter(i => i.status === '已拒绝').length;
    const total = items.length;
    return { pending, processing, done, rejected, total };
  }, [items]);
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 16,
    }}>
      {(['total', 'pending', 'processing', 'done', 'rejected'] as const).map(k => {
        const labels: Record<string, string> = { total: '全部', pending: '待审核', processing: '处理中', done: '已完成', rejected: '已拒绝' };
        const colors: Record<string, string> = { total: '#94a3b8', pending: '#60a5fa', processing: '#fbbf24', done: '#34d399', rejected: '#f87171' };
        return (
          <div key={k} style={{
            textAlign: 'center', padding: '10px 4px', borderRadius: 10,
            background: `${colors[k]}10`, border: `1px solid ${colors[k]}20`,
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: colors[k] }}>{counts[k]}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{labels[k]}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── 子组件: 详情面板 ── */
function DetailModal({ item, onClose }: { item: ReturnItem; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 360, maxWidth: '90vw', padding: 24, borderRadius: 16,
        background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ color: '#f8fafc', fontSize: 17, fontWeight: 600 }}>退换货详情</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span>单号</span>
            <span style={{ color: '#e2e8f0' }}>{item.id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span>商品</span>
            <span style={{ color: '#e2e8f0' }}>{item.product} × {item.qty}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span>金额</span>
            <span style={{ color: '#e2e8f0' }}>¥{item.amount.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span>原因</span>
            <span style={{ color: '#e2e8f0' }}>{item.reason}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span>状态</span>
            <span style={{ color: STATUS_COLORS[item.status] || '#94a3b8' }}>{item.status}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span>日期</span>
            <span style={{ color: '#e2e8f0' }}>{item.date}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid rgba(148,163,184,0.1)', margin: '10px 0' }} />
          <div style={{ color: '#94a3b8', marginBottom: 4 }}>详细描述</div>
          <div style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.6 }}>{item.detail}</div>
        </div>
      </div>
    </div>
  );
}

/* ── 子组件: 单行 ── */
function ReturnRow({ item, onClick }: { item: ReturnItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 16px', borderRadius: 10, marginBottom: 6,
        background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.08)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(30,41,59,0.8)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(30,41,59,0.6)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{item.product} × {item.qty}</span>
        <span style={{
          padding: '1px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
          background: `${STATUS_COLORS[item.status]}18`, color: STATUS_COLORS[item.status],
        }}>
          {item.status}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#94a3b8', fontSize: 12 }}>#{item.id} · {item.reason}</span>
        <span style={{ color: '#64748b', fontSize: 12 }}>{item.date}</span>
      </div>
    </div>
  );
}

/* ── 主组件 ── */
export default function ReturnsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusKey>('全部');
  const [reasonFilter, setReasonFilter] = useState('全部');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<ReturnItem | null>(null);
  const [showError, setShowError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return ALL_RETURNS.filter(r => {
      if (statusFilter !== '全部' && r.status !== statusFilter) return false;
      if (reasonFilter !== '全部' && r.reason !== reasonFilter) return false;
      if (kw && !r.id.toLowerCase().includes(kw) && !r.product.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [search, statusFilter, reasonFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  React.useEffect(() => { setPage(1); }, [search, statusFilter, reasonFilter]);

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* ── 标题 + 操作 ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>退换货管理</h1>
          <button
            onClick={() => { setShowError(!showError); }}
            style={{
              padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
              background: '#ef444420', border: '1px solid #ef444430',
              color: '#fca5a5', fontSize: 11,
            }}
          >
            {showError ? '恢复数据' : '模拟错误'}
          </button>
        </div>

        {/* ── 错误状态 ── */}
        {showError && (
          <div style={{
            padding: '14px 16px', marginBottom: 16, borderRadius: 10,
            background: '#ef444415', border: '1px solid #ef444430',
          }}>
            <div style={{ color: '#fca5a5', fontWeight: 600, marginBottom: 4 }}>⚠️ 数据加载异常</div>
            <div style={{ color: '#fca5a580', fontSize: 13 }}>退换货记录获取失败，请检查网络后重试</div>
          </div>
        )}

        {!showError && (
          <>
            {/* ── 统计卡片 ── */}
            <ReturnStats items={ALL_RETURNS} />

            {/* ── 筛选栏 ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="🔍 搜索单号或商品名..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, minWidth: 130, padding: '9px 12px', borderRadius: 10,
                  background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)',
                  color: '#e2e8f0', fontSize: 13, outline: 'none',
                }}
              />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusKey)}
                style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={reasonFilter} onChange={e => setReasonFilter(e.target.value)}
                style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
                {REASON_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button
                onClick={() => { setIsLoading(!isLoading); setTimeout(() => setIsLoading(false), 1200); }}
                style={{
                  padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                  background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)',
                  color: '#94a3b8', fontSize: 12,
                }}
              >
                {isLoading ? '加载中...' : '模拟加载'}
              </button>
            </div>

            {/* ── 加载中 ── */}
            {isLoading ? (
              <div style={{
                padding: '40px 20px', textAlign: 'center', borderRadius: 14,
                background: 'rgba(30,41,59,0.4)', border: '1px dashed rgba(148,163,184,0.1)',
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
                <div style={{ color: '#94a3b8', fontSize: 14 }}>正在加载退换货数据...</div>
              </div>
            ) : paginated.length === 0 ? (
              /* ── 空状态 ── */
              <div style={{
                textAlign: 'center', padding: '50px 20px', borderRadius: 14,
                background: 'rgba(30,41,59,0.4)', border: '1px dashed rgba(148,163,184,0.15)',
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
                <div style={{ color: '#94a3b8', fontSize: 15, marginBottom: 4 }}>暂无退换货记录</div>
                <div style={{ color: '#64748b', fontSize: 12 }}>您还没有提交过退换货申请</div>
              </div>
            ) : (
              <>
                {paginated.map(r => (
                  <ReturnRow key={r.id} item={r} onClick={() => setSelectedItem(r)} />
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
                  <span>共 {filtered.length} 条退换货记录</span>
                  <span>本页 {paginated.length} 条</span>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ── 详情弹窗 ── */}
      {selectedItem && <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </main>
  );
}
