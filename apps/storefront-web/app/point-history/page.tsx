/**
 * 积分历史 — Point History (storefront-web)
 * 角色视角: 👤会员 / 👔店长
 * 功能: 积分总览、历史记录列表、按类型筛选、搜索、分页、空/错状态
 */
'use client';

import React, { useState, useMemo } from 'react';

/* ── 类型 ── */
type PointRecord = {
  id: string;
  date: string;
  desc: string;
  points: number;
  type: 'earn' | 'spend' | 'expire' | 'adjust';
  category: string;
  orderNo?: string;
};

/* ── Mock 数据 (35+) ── */
const ALL_RECORDS: PointRecord[] = [
  { id: 'P001', date: '2026-07-12 14:32', desc: '消费获得', points: 168, type: 'earn', category: '消费', orderNo: 'ORD20260712001' },
  { id: 'P002', date: '2026-07-12 10:15', desc: '生日双倍积分', points: 200, type: 'earn', category: '活动' },
  { id: 'P003', date: '2026-07-11 18:00', desc: '兑换满减优惠券', points: -200, type: 'spend', category: '兑换' },
  { id: 'P004', date: '2026-07-10 16:45', desc: '消费获得', points: 85, type: 'earn', category: '消费', orderNo: 'ORD20260710003' },
  { id: 'P005', date: '2026-07-10 09:30', desc: '签到奖励', points: 5, type: 'earn', category: '签到' },
  { id: 'P006', date: '2026-07-09 12:00', desc: '积分到期清零', points: -50, type: 'expire', category: '系统' },
  { id: 'P007', date: '2026-07-08 20:00', desc: '生日赠送', points: 500, type: 'earn', category: '活动' },
  { id: 'P008', date: '2026-07-07 15:20', desc: '消费获得', points: 42, type: 'earn', category: '消费', orderNo: 'ORD20260707012' },
  { id: 'P009', date: '2026-07-06 11:10', desc: '系统补录调整', points: 30, type: 'adjust', category: '系统' },
  { id: 'P010', date: '2026-07-05 14:00', desc: '兑换礼品-公仔', points: -150, type: 'spend', category: '兑换' },
  { id: 'P011', date: '2026-07-04 19:30', desc: '消费获得', points: 96, type: 'earn', category: '消费', orderNo: 'ORD20260704008' },
  { id: 'P012', date: '2026-07-03 08:00', desc: '每日签到', points: 3, type: 'earn', category: '签到' },
  { id: 'P013', date: '2026-07-02 13:45', desc: '邀请好友奖励', points: 100, type: 'earn', category: '活动' },
  { id: 'P014', date: '2026-07-01 10:00', desc: '活动赠送积分', points: 50, type: 'earn', category: '活动' },
  { id: 'P015', date: '2026-06-30 17:30', desc: '兑换饮品券', points: -80, type: 'spend', category: '兑换' },
  { id: 'P016', date: '2026-06-29 12:15', desc: '消费获得', points: 75, type: 'earn', category: '消费', orderNo: 'ORD20260629022' },
  { id: 'P017', date: '2026-06-28 09:00', desc: '积分到期清零', points: -120, type: 'expire', category: '系统' },
  { id: 'P018', date: '2026-06-27 15:00', desc: '兑换游戏币', points: -300, type: 'spend', category: '兑换' },
  { id: 'P019', date: '2026-06-26 20:20', desc: '消费获得', points: 210, type: 'earn', category: '消费', orderNo: 'ORD20260626015' },
  { id: 'P020', date: '2026-06-25 11:00', desc: '任务奖励', points: 20, type: 'earn', category: '任务' },
  { id: 'P021', date: '2026-06-24 09:45', desc: '消费获得', points: 55, type: 'earn', category: '消费', orderNo: 'ORD20260624006' },
  { id: 'P022', date: '2026-06-23 14:30', desc: '周末积分翻倍', points: 44, type: 'earn', category: '活动' },
  { id: 'P023', date: '2026-06-22 18:00', desc: '兑换优惠券包', points: -100, type: 'spend', category: '兑换' },
  { id: 'P024', date: '2026-06-21 10:10', desc: '消费获得', points: 130, type: 'earn', category: '消费', orderNo: 'ORD20260621003' },
  { id: 'P025', date: '2026-06-20 08:00', desc: '每日签到', points: 5, type: 'earn', category: '签到' },
  { id: 'P026', date: '2026-06-19 16:20', desc: '消费获得', points: 38, type: 'earn', category: '消费', orderNo: 'ORD20260619011' },
  { id: 'P027', date: '2026-06-18 12:00', desc: '积分商城兑换', points: -500, type: 'spend', category: '兑换' },
  { id: 'P028', date: '2026-06-17 09:30', desc: '消费获得', points: 92, type: 'earn', category: '消费', orderNo: 'ORD20260617005' },
  { id: 'P029', date: '2026-06-16 15:00', desc: '系统返还', points: 10, type: 'adjust', category: '系统' },
  { id: 'P030', date: '2026-06-15 11:00', desc: '消费获得', points: 67, type: 'earn', category: '消费', orderNo: 'ORD20260615009' },
  { id: 'P031', date: '2026-06-14 20:00', desc: '评论返积分', points: 15, type: 'earn', category: '任务' },
  { id: 'P032', date: '2026-06-13 14:10', desc: '兑换饮品', points: -60, type: 'spend', category: '兑换' },
  { id: 'P033', date: '2026-06-12 09:50', desc: '消费获得', points: 45, type: 'earn', category: '消费', orderNo: 'ORD20260612020' },
  { id: 'P034', date: '2026-06-11 10:00', desc: '分享得积分', points: 8, type: 'earn', category: '任务' },
  { id: 'P035', date: '2026-06-10 16:00', desc: '消费获得', points: 103, type: 'earn', category: '消费', orderNo: 'ORD20260610018' },
];

const TYPE_OPTIONS = ['全部', 'earn', 'spend', 'expire', 'adjust'] as const;
const TYPE_LABELS: Record<string, string> = { earn: '获得', spend: '支出', expire: '过期', adjust: '调整' };
const TYPE_COLORS: Record<string, string> = { earn: '#34d399', spend: '#f87171', expire: '#fbbf24', adjust: '#60a5fa' };
const CATEGORY_OPTIONS = ['全部', '消费', '活动', '兑换', '签到', '系统', '任务'];
const PAGE_SIZE = 10;

/* ── 子组件: 积分统计卡片 ── */
function PointSummary({ records }: { records: PointRecord[] }) {
  const totalEarn = records.filter(r => r.type === 'earn').reduce((s, r) => s + r.points, 0);
  const totalSpent = records.filter(r => r.type === 'spend' || r.type === 'expire').reduce((s, r) => s + Math.abs(r.points), 0);
  const balance = totalEarn - totalSpent;
  return (
    <div style={{
      marginBottom: 16, padding: '16px 20px', borderRadius: 14,
      background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))',
      border: '1px solid rgba(251,191,36,0.2)',
      display: 'flex', justifyContent: 'space-around', textAlign: 'center',
    }}>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#fbbf24' }}>{balance.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>当前积分</div>
      </div>
      <div style={{ width: 1, background: 'rgba(148,163,184,0.15)' }} />
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#34d399' }}>+{totalEarn.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>累计获得</div>
      </div>
      <div style={{ width: 1, background: 'rgba(148,163,184,0.15)' }} />
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#f87171' }}>-{totalSpent.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>累计支出</div>
      </div>
    </div>
  );
}

/* ── 子组件: 记录行 ── */
function RecordRow({ record }: { record: PointRecord }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 16px', borderRadius: 10, marginBottom: 6,
      background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.08)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{
            display: 'inline-block', padding: '1px 6px', borderRadius: 4,
            fontSize: 10, fontWeight: 600,
            background: `${TYPE_COLORS[record.type]}20`, color: TYPE_COLORS[record.type],
          }}>
            {TYPE_LABELS[record.type]}
          </span>
          <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 500 }}>{record.desc}</span>
        </div>
        <div style={{ color: '#64748b', fontSize: 11 }}>
          {record.date}
          {record.orderNo && <span> · {record.orderNo}</span>}
        </div>
      </div>
      <span style={{
        color: record.points > 0 ? '#34d399' : '#f87171',
        fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap',
      }}>
        {record.points > 0 ? '+' : ''}{record.points.toLocaleString()}
      </span>
    </div>
  );
}

/* ── 主组件 ── */
export default function PointHistoryPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('全部');
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [page, setPage] = useState(1);
  const [showError, setShowError] = useState(false);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return ALL_RECORDS.filter(r => {
      if (typeFilter !== '全部' && r.type !== typeFilter) return false;
      if (categoryFilter !== '全部' && r.category !== categoryFilter) return false;
      if (kw && !r.desc.toLowerCase().includes(kw) && !(r.orderNo || '').toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [search, typeFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  // 当筛选变时重置页码
  React.useEffect(() => { setPage(1); }, [search, typeFilter, categoryFilter]);

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* ── 标题 ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>积分历史</h1>
          <button
            onClick={() => setShowError(!showError)}
            style={{
              padding: '4px 12px', borderRadius: 6,
              background: '#ef444420', border: '1px solid #ef444430',
              color: '#fca5a5', fontSize: 11, cursor: 'pointer',
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
            <div style={{ color: '#fca5a5', fontWeight: 600, marginBottom: 4 }}>⚠️ 加载失败</div>
            <div style={{ color: '#fca5a580', fontSize: 13 }}>积分数据加载异常，请下拉刷新重试 (模拟错误状态)</div>
          </div>
        )}

        {!showError && (
          <>
            {/* ── 积分摘要 ── */}
            <PointSummary records={ALL_RECORDS} />

            {/* ── 搜索与筛选 ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="🔍 搜索描述或订单号..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, minWidth: 150, padding: '9px 12px', borderRadius: 10,
                  background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)',
                  color: '#e2e8f0', fontSize: 13, outline: 'none',
                }}
              />
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t === '全部' ? '全部类型' : TYPE_LABELS[t]}</option>)}
              </select>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* ── 记录列表 / 空状态 ── */}
            {paginated.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '50px 20px',
                borderRadius: 14, background: 'rgba(30,41,59,0.4)',
                border: '1px dashed rgba(148,163,184,0.15)',
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                <div style={{ color: '#94a3b8', fontSize: 15, marginBottom: 4 }}>暂无积分记录</div>
                <div style={{ color: '#64748b', fontSize: 12 }}>消费或参与活动即可获得积分</div>
              </div>
            ) : (
              <>
                {paginated.map(r => <RecordRow key={r.id} record={r} />)}

                {/* ── 分页 ── */}
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
              </>
            )}

            {/* ── 底部统计 ── */}
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(30,41,59,0.3)', border: '1px solid rgba(148,163,184,0.06)',
              display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 11,
            }}>
              <span>共 {filtered.length} 条记录</span>
              <span>本页 {paginated.length} 条</span>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
