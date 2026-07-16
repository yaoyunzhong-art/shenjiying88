/**
 * 积分历史 — Point History (storefront-web)
 * 角色视角: 👤会员 / 👔店长
 * 功能: 积分总览、历史记录列表、按类型筛选、搜索、分页、空/错状态、统计面板
 */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PageShell, StatusBadge } from '@m5/ui';

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
  { id: 'P036', date: '2026-06-09 14:00', desc: '积分商城兑换', points: -200, type: 'spend', category: '兑换' },
  { id: 'P037', date: '2026-06-08 08:30', desc: '每日签到', points: 5, type: 'earn', category: '签到' },
  { id: 'P038', date: '2026-06-07 16:00', desc: '消费获得', points: 78, type: 'earn', category: '消费', orderNo: 'ORD20260607021' },
];

const TYPE_OPTIONS = ['全部', 'earn', 'spend', 'expire', 'adjust'] as const;
const TYPE_LABELS: Record<string, string> = { earn: '获得', spend: '支出', expire: '过期', adjust: '调整' };
const TYPE_COLORS: Record<string, string> = { earn: '#34d399', spend: '#f87171', expire: '#fbbf24', adjust: '#60a5fa' };
const CATEGORY_OPTIONS = ['全部', '消费', '活动', '兑换', '签到', '系统', '任务'];
const PAGE_SIZE = 10;

/* ── 子组件: 积分统计卡片 ── */
function PointSummary({ records, onClick }: { records: PointRecord[]; onClick?: () => void }) {
  const totalEarn = records.filter(r => r.type === 'earn').reduce((s, r) => s + r.points, 0);
  const totalSpent = records.filter(r => r.type === 'spend' || r.type === 'expire').reduce((s, r) => s + Math.abs(r.points), 0);
  const balance = totalEarn - totalSpent;
  return (
    <div style={{
      marginBottom: 16, padding: '14px 20px', borderRadius: 14,
      background: '#fefce8', border: '1px solid #fde68a',
      display: 'flex', justifyContent: 'space-around', textAlign: 'center',
    }}>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>{balance.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: '#6b7280' }}>当前积分</div>
      </div>
      <div style={{ width: 1, background: '#e5e7eb' }} />
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>+{totalEarn.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: '#6b7280' }}>累计获得</div>
      </div>
      <div style={{ width: 1, background: '#e5e7eb' }} />
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#dc2626' }}>-{totalSpent.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: '#6b7280' }}>累计支出</div>
      </div>
      <div style={{ width: 1, background: '#e5e7eb' }} />
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#6b7280' }}>{records.length}</div>
        <div style={{ fontSize: 11, color: '#6b7280' }}>总记录</div>
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
      background: '#fff', border: '1px solid #f3f4f6',
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
          <span style={{ color: '#374151', fontSize: 14, fontWeight: 500 }}>{record.desc}</span>
          {record.category && <span style={{ color: '#9ca3af', fontSize: 11, marginLeft: 4 }}>({record.category})</span>}
        </div>
        <div style={{ color: '#9ca3af', fontSize: 11 }}>
          {record.date}
          {record.orderNo && <span> · {record.orderNo}</span>}
        </div>
      </div>
      <span style={{
        color: record.points > 0 ? '#059669' : '#dc2626',
        fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap',
      }}>
        {record.points > 0 ? '+' : ''}{record.points.toLocaleString()}
      </span>
    </div>
  );
}

/* ── 统计图表面板 ── */
function StatsPanel({ records }: { records: PointRecord[] }) {
  const stats = useMemo(() => {
    const byCategory: Record<string, { earned: number; spent: number }> = {};
    records.forEach(r => {
      const cat = r.category;
      if (!byCategory[cat]) byCategory[cat] = { earned: 0, spent: 0 };
      const entry = byCategory[cat];
      if (entry) {
        if (r.type === 'earn') entry.earned += r.points;
        else if (r.type === 'spend' || r.type === 'expire') entry.spent += Math.abs(r.points);
      }
    });
    return byCategory;
  }, [records]);

  return (
    <div style={{ marginTop: 16, marginBottom: 16, padding: 16, background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>📊 分类统计</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
        {Object.entries(stats).map(([category, data]) => (
          <div key={category} style={{ padding: 10, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{category}</div>
            <div style={{ fontSize: 11, color: '#059669' }}>获得: +{data.earned.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: '#dc2626' }}>支出: -{data.spent.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
              净: {data.earned > data.spent ? '+' : ''}{(data.earned - data.spent).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
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
  const [showStats, setShowStats] = useState(false);

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

  // 筛选变化时重置页码
  useEffect(() => { setPage(1); }, [search, typeFilter, categoryFilter]);

  return (
    <PageShell title="积分历史" description="会员积分获取和使用记录明细">
      <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
        {/* 标题 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>🎯 积分历史</h1>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
              共 {ALL_RECORDS.length} 条记录 · 查看积分获取和使用明细
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setShowStats(!showStats)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff',
                cursor: 'pointer', fontSize: 12, color: showStats ? '#2563eb' : '#374151',
              }}
            >
              {showStats ? '隐藏统计' : '📊 统计'}
            </button>
            <button
              onClick={() => setShowError(!showError)}
              style={{
                padding: '6px 14px', borderRadius: 8,
                background: '#fef2f2', border: '1px solid #fecaca',
                color: '#dc2626', fontSize: 11, cursor: 'pointer',
              }}
            >
              {showError ? '恢复数据' : '模拟错误'}
            </button>
          </div>
        </div>

        {/* 错误状态 */}
        {showError && (
          <div style={{ padding: 16, marginBottom: 16, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
            <div style={{ color: '#dc2626', fontWeight: 600, marginBottom: 4 }}>⚠️ 加载失败</div>
            <div style={{ color: '#fca5a5', fontSize: 13 }}>积分数据加载异常，请稍后刷新重试 (模拟错误状态)</div>
            <button
              onClick={() => setShowError(false)}
              style={{ marginTop: 8, padding: '4px 12px', borderRadius: 6, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: 12 }}
            >
              重试
            </button>
          </div>
        )}

        {!showError && (
          <>
            {/* 积分摘要 */}
            <PointSummary records={ALL_RECORDS} />

            {/* 分类统计面板 */}
            {showStats && <StatsPanel records={ALL_RECORDS} />}

            {/* 搜索与筛选 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="🔍 搜索描述或订单号..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, minWidth: 150, padding: '9px 12px', borderRadius: 10,
                  border: '1px solid #d1d5db', color: '#374151', fontSize: 13, outline: 'none',
                }}
              />
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                style={{ padding: '9px 10px', borderRadius: 10, border: '1px solid #d1d5db', color: '#374151', fontSize: 12 }}>
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t === '全部' ? '全部类型' : TYPE_LABELS[t]}</option>)}
              </select>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                style={{ padding: '9px 10px', borderRadius: 10, border: '1px solid #d1d5db', color: '#374151', fontSize: 12 }}>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto' }}>
                {filtered.length} 条
              </span>
            </div>

            {/* 记录列表 / 空状态 */}
            {paginated.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '50px 20px',
                borderRadius: 14, border: '1px dashed #d1d5db', background: '#f9fafb',
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                <div style={{ color: '#6b7280', fontSize: 15, marginBottom: 4 }}>暂无积分记录</div>
                <div style={{ color: '#9ca3af', fontSize: 12 }}>消费或参与活动即可获得积分</div>
              </div>
            ) : (
              <>
                {paginated.map(r => <RecordRow key={r.id} record={r} />)}

                {/* 分页 */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 13 }}>
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                      style={{
                        padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db',
                        background: page <= 1 ? '#f3f4f6' : '#fff',
                        color: page <= 1 ? '#9ca3af' : '#374151',
                        cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: 13,
                      }}
                    >
                      ← 上一页
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                      const p = start + i;
                      if (p > totalPages) return null;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          style={{
                            padding: '6px 12px', borderRadius: 8, border: 'none',
                            background: p === page ? '#2563eb' : '#f3f4f6',
                            color: p === page ? '#fff' : '#374151',
                            cursor: 'pointer', fontSize: 13, fontWeight: p === page ? 700 : 400,
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                      style={{
                        padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db',
                        background: page >= totalPages ? '#f3f4f6' : '#fff',
                        color: page >= totalPages ? '#9ca3af' : '#374151',
                        cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: 13,
                      }}
                    >
                      下一页 →
                    </button>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                      {page}/{totalPages}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* 底部统计 */}
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 10,
              background: '#f9fafb', border: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'space-between',
              color: '#6b7280', fontSize: 11,
            }}>
              <span>共 {filtered.length} 条记录</span>
              <span>本页 {paginated.length} 条</span>
              <span>页码 {page}/{totalPages}</span>
            </div>

            {/* 积分变动趋势 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#0369a1' }}>📈 近30天积分趋势</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, gap: 4, padding: '8px 4px' }}>
                {Array.from({ length: 14 }, (_, i) => {
                  const day = i + 1;
                  const earn = Math.floor(Math.random() * 150) + 10;
                  const spend = Math.floor(Math.random() * 100);
                  const max = 180;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <div style={{ width: '60%', background: '#f87171', borderRadius: '2px 2px 0 0', height: `${(spend / max) * 100}%`, minHeight: 2 }} />
                        <div style={{ width: '60%', background: '#34d399', borderRadius: '2px 2px 0 0', height: `${(earn / max) * 100}%`, minHeight: 2 }} />
                      </div>
                      <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 4 }}>{day}日</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#34d399', marginRight: 4 }} />获得</span>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#f87171', marginRight: 4 }} />支出</span>
              </div>
            </div>

            {/* 积分等级对照 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#faf5ff', border: '1px solid #e9d5ff' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#7c3aed' }}>🏆 会员等级与权益</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { name: '银卡', min: 0, color: '#94a3b8', benefits: '基础累计·生日优惠' },
                  { name: '金卡', min: 1000, color: '#f59e0b', benefits: '1.2x加速·优先排队' },
                  { name: '钻石', min: 5000, color: '#06b6d4', benefits: '1.5x加速·专属活动·VIP' },
                  { name: '至尊', min: 20000, color: '#a855f7', benefits: '2x加速·1v1客服·年度礼' },
                ].map((tier, i) => (
                  <div key={i} style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: tier.color }}>{tier.name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>≥{tier.min.toLocaleString()}分</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{tier.benefits}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 积分任务攻略 */}
            <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#fefce8', border: '1px solid #fde68a' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#92400e' }}>🎯 积分任务攻略</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                {[
                  { name: '每日签到', points: 5, limit: '每天1次', done: true },
                  { name: '到店消费', points: '¥1=1分', limit: '无上限', done: false },
                  { name: '评价晒单', points: 20, limit: '每单1次', done: true },
                  { name: '推荐好友', points: 200, limit: '月10人', done: false },
                  { name: '生日祝福', points: 500, limit: '年1次', done: false },
                  { name: '活动参与', points: '50~500', limit: '按规则', done: false },
                ].map((t, i) => (
                  <div key={i} style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', opacity: t.done ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: t.done ? '#9ca3af' : '#374151', textDecoration: t.done ? 'line-through' : 'none' }}>{t.name}</span>
                      {t.done && <span style={{ fontSize: 10, color: '#059669' }}>✓ 已完成</span>}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>+{t.points}积分</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{t.limit}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 积分使用排行榜 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#ecfeff', border: '1px solid #a5f3fc' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#0e7490' }}>🎯 本月积分达人榜</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  { rank: 1, name: '张伟', earned: 1250, spent: 350 },
                  { rank: 2, name: '李芳', earned: 980, spent: 500 },
                  { rank: 3, name: '王强', earned: 720, spent: 200 },
                  { rank: 4, name: '赵敏', earned: 680, spent: 450 },
                  { rank: 5, name: '陈浩', earned: 520, spent: 180 },
                ].map((u, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, color: u.rank <= 3 ? '#0e7490' : '#6b7280', minWidth: 20 }}>#{u.rank}</span>
                      <span>{u.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ color: '#059669' }}>+{u.earned}</span>
                      <span style={{ color: '#dc2626' }}>-{u.spent}</span>
                      <span style={{ fontWeight: 700, color: '#0e7490' }}>{u.earned - u.spent}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 积分月统计 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#166534' }}>📊 本月积分概览</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                {[
                  { label: '总获得', value: '12,850', trend: '+8%', color: '#16a34a' },
                  { label: '总消耗', value: '8,420', trend: '+12%', color: '#dc2626' },
                  { label: '当前余额', value: '248,600', change: '+4,430', color: '#2563eb' },
                  { label: '即将到期', value: '3,200', change: '30天内', color: '#d97706' },
                ].map(function(s, i) {
                  return (
                    <div key={i} style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #dcfce7', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{s.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: s.trend ? '#059669' : '#d97706' }}>{s.trend || s.change}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 积分获取/消耗对比 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#5b21b6' }}>🔄 积分获取 vs 消耗趋势</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80, padding: '4px 0' }}>
                {[
                  { month: '2月', earn: 75, spend: 45 },
                  { month: '3月', earn: 82, spend: 55 },
                  { month: '4月', earn: 70, spend: 62 },
                  { month: '5月', earn: 88, spend: 50 },
                  { month: '6月', earn: 95, spend: 68 },
                ].map(function(m, i) {
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 65 }}>
                        <div style={{ width: 12, height: m.earn + 'px', borderRadius: '2px 2px 0 0', background: '#16a34a' }} />
                        <div style={{ width: 12, height: m.spend + 'px', borderRadius: '2px 2px 0 0', background: '#dc2626' }} />
                      </div>
                      <div style={{ fontSize: 9, color: '#6b7280' }}>{m.month}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                <span><span style={{ color: '#16a34a' }}>■</span> 获取</span>
                <span><span style={{ color: '#dc2626' }}>■</span> 消耗</span>
              </div>
            </div>

            {/* 积分到期日历 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#9a3412' }}>⏰ 积分到期提醒</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  { batch: '2026年1月获得', points: 1200, expireDate: '2026-07-31', daysLeft: 14, priority: 'urgent' },
                  { batch: '2026年2月获得', points: 800, expireDate: '2026-08-31', daysLeft: 45, priority: 'warning' },
                  { batch: '2026年3月获得', points: 1200, expireDate: '2026-09-30', daysLeft: 75, priority: 'normal' },
                ].map(function(b, i) {
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: '#fff', border: '1px solid #fed7aa' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{b.batch}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{b.expireDate} 到期</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: b.priority === 'urgent' ? '#dc2626' : b.priority === 'warning' ? '#d97706' : '#6b7280' }}>{b.points}<span style={{ fontSize: 10, fontWeight: 400 }}>分</span></div>
                        <div style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: b.priority === 'urgent' ? '#fef2f2' : b.priority === 'warning' ? '#fff7ed' : '#f3f4f6', color: b.priority === 'urgent' ? '#dc2626' : b.priority === 'warning' ? '#d97706' : '#6b7280' }}>剩{b.daysLeft}天</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 积分排行榜 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#9a3412' }}>🏅 积分排行榜 (本月TOP5)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  { rank: 1, name: '张伟', avatar: '🧑‍💼', tier: '钻石', points: 2850, color: '#f59e0b' },
                  { rank: 2, name: '李娜', avatar: '👩‍💼', tier: '钻石', points: 2320, color: '#a855f7' },
                  { rank: 3, name: '王强', avatar: '👨‍🔧', tier: '金卡', points: 1880, color: '#06b6d4' },
                  { rank: 4, name: '赵敏', avatar: '👩‍🎓', tier: '金卡', points: 1560, color: '#22c55e' },
                  { rank: 5, name: '陈龙', avatar: '👨‍💻', tier: '银卡', points: 1220, color: '#f97316' },
                ].map(function(m, i) {
                  var medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i];
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, background: '#fff', border: '1px solid #fed7aa' }}>
                      <span style={{ fontSize: 16, minWidth: 24 }}>{medal}</span>
                      <span style={{ fontSize: 14 }}>{m.avatar}</span>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#374151' }}>{m.name}</span>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: m.tier === '钻石' ? '#fffbeb' : m.tier === '金卡' ? '#fef9c3' : '#f3f4f6', color: m.tier === '钻石' ? '#b45309' : m.tier === '金卡' ? '#854d0e' : '#6b7280' }}>{m.tier}</span>
                      <div style={{ flex: '0 0 80px', height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                        <div style={{ width: Math.min(100, (m.points / 2850) * 100) + '%', height: '100%', borderRadius: 3, background: m.color }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#9a3412', minWidth: 50, textAlign: 'right' }}>{m.points}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: '#92400e', textAlign: 'center' }}>
                🏆 本月总排行TOP5 · TOP1额外奖励 <span style={{ fontWeight: 600 }}>500积分</span>
              </div>
              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, fontSize: 10 }}>
                <div style={{ padding: '4px 6px', borderRadius: 4, background: '#fffbeb', border: '1px solid #fed7aa', textAlign: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#9a3412' }}>总积分</span> 9,830
                </div>
                <div style={{ padding: '4px 6px', borderRadius: 4, background: '#fffbeb', border: '1px solid #fed7aa', textAlign: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#9a3412' }}>参与人数</span> 156人
                </div>
                <div style={{ padding: '4px 6px', borderRadius: 4, background: '#fffbeb', border: '1px solid #fed7aa', textAlign: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#9a3412' }}>平均</span> 63分/人
                </div>
              </div>
            </div>

            {/* 积分兑换推荐 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#ecfeff', border: '1px solid #a5f3fc' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#0e7490' }}>🎯 热门兑换推荐</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { item: '免费游戏币20枚', points: 200, exchangeRate: '10分/枚', hot: 92 },
                  { item: '单人畅玩卡', points: 500, exchangeRate: '省¥30', hot: 85 },
                  { item: '生日派对套餐', points: 2000, exchangeRate: '省¥120', hot: 78 },
                  { item: 'VIP月卡', points: 3000, exchangeRate: '省¥200', hot: 72 },
                ].map(function(r, i) {
                  return (
                    <div key={i} style={{ flex: '1 1 120px', padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #a5f3fc', textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0e7490' }}>{r.item}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0891b2' }}>{r.points}<span style={{ fontSize: 10, fontWeight: 400 }}>分</span></div>
                      <div style={{ fontSize: 10, color: '#059669' }}>{r.exchangeRate}</div>
                      <div style={{ fontSize: 10, color: '#6b7280' }}>热度 {r.hot}%</div>
                      <div style={{ marginTop: 2, height: 3, borderRadius: 2, background: '#e5e7eb', overflow: 'hidden' }}>
                        <div style={{ width: r.hot + '%', height: '100%', borderRadius: 2, background: '#06b6d4' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 积分增长路径推荐 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#0369a1' }}>🚀 积分增长路径推荐</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { target: 500, title: '快速积累500分', desc: '适合新会员解锁基础兑换', duration: '7~50天' },
                  { target: 1000, title: '冲刺1000分', desc: '适合金卡门槛冲刺', duration: '15~90天' },
                  { target: 2000, title: '挑战2000分', desc: '适合银卡升级与权益解锁', duration: '30~180天' },
                ].map(function(path, i) {
                  var ways = [
                    { target: 500, items: ['每日签到 × 50天 (250分)', '到店消费 × ¥500 (500分)', '推荐好友 × 10人 (2000分)'], rec: '每日签到 + 小额消费' },
                    { target: 1000, items: ['签到30天 + 消费¥300 (580分)', '参与活动 × 5次 (250~2500分)', '推荐好友 × 3人 (600分)'], rec: '签到 + 消费组合' },
                    { target: 2000, items: ['升级银卡 (2000分起)', '大额充值 (¥2000=2000分)', '参与季度活动(500~3000分)'], rec: '升级银卡 + 活动参与' },
                  ];
                  var w = ways[i];
                  if (!w) return null;
                  return (
                    <div key={i} style={{ padding: 12, borderRadius: 8, background: '#fff', border: '1px solid #bae6fd' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#0369a1' }}>🎯 {path.title}</span>
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#e0f2fe', color: '#0284c7' }}>预计{path.duration}</span>
                      </div>
                      <ul style={{ margin: '0 0 6px', padding: '0 0 0 16px', fontSize: 12, color: '#374151', lineHeight: 1.7 }}>
                        {w.items.map(function(item, j) {
                          return <li key={j}>{item}</li>;
                        })}
                      </ul>
                      <div style={{ fontSize: 11, color: '#0891b2', background: '#f0f9ff', padding: '4px 8px', borderRadius: 4 }}>
                        💡 推荐路径：{w.rec}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 积分兑换统计 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#fefce8', border: '1px solid #fde68a' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#92400e' }}>🏅 本月最受欢迎兑换 TOP3</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { item: '免费游戏币20枚', count: 120, rate: 92 },
                  { item: '单人畅玩卡', count: 85, rate: 85 },
                  { item: '零食套餐', count: 68, rate: 72 },
                ].map(function(t, i) {
                  return (
                    <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', border: '1px solid #fde68a' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: i === 0 ? '#d97706' : i === 1 ? '#6b7280' : '#a16207', minWidth: 20 }}>#{i + 1}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{t.item}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#d97706' }}>{t.count}</span>
                          <span style={{ fontSize: 10, color: '#9ca3af' }}> 次</span>
                        </div>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: '#fef3c7', overflow: 'hidden', marginBottom: 2 }}>
                        <div style={{ height: '100%', borderRadius: 4, background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#a16207', width: t.rate + '%', transition: 'width 0.3s ease' }} />
                      </div>
                      <div style={{ fontSize: 10, color: '#6b7280', textAlign: 'right' }}>热度 {t.rate}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 积分预警设置 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#faf5ff', border: '1px solid #e9d5ff' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#7c3aed' }}>🔔 积分预警设置</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: '⏰', title: '积分即将到期提醒', desc: '当积分即将过期时推送通知', options: ['7天', '15天', '30天'] },
                  { icon: '📉', title: '积分余额达阈值提醒', desc: '当积分余额低于设定值时提醒', options: ['100分', '500分', '1000分'] },
                  { icon: '📈', title: '获得大额积分提醒', desc: '当单次获得积分超过设定值', options: ['100分', '500分', '1000分'] },
                ].map(function(w, i) {
                  return (
                    <div key={i} style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #e9d5ff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 18 }}>{w.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{w.title}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{w.desc}</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {w.options.map(function(opt, j) {
                          return (
                            <span key={j} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#f3e8ff', color: '#7c3aed', border: '1px solid #d8b4fe', cursor: 'pointer' }}>
                              {opt}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: '#6b7280', textAlign: 'center' }}>
                💡 点击预警值可快速选中，保存后系统将在满足条件时推送通知
              </div>
            </div>

            {/* 积分过期策略说明 */}
            {function ExpireStrategy() {
              var expireRules = [
                { icon: '📅', label: '积分有效期', desc: '获得日起 365 天' },
                { icon: '📱', label: '过期前30天', desc: '短信提醒' },
                { icon: '📲', label: '过期前7天', desc: 'APP推送提醒' },
                { icon: '🪟', label: '过期当天', desc: '弹窗提醒' },
                { icon: '🔄', label: '可续期条件', desc: '30天内任意消费可续期全部积分' },
                { icon: '❌', label: '无法续期', desc: '过期超过60天的积分无法恢复' },
              ];
              var expireStats = [
                { month: '4月', points: 2350, renewRate: 68 },
                { month: '5月', points: 3120, renewRate: 72 },
                { month: '6月', points: 4580, renewRate: 65 },
              ];
              return (
                <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#fff1f2', border: '1px solid #fecdd3' }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#9f1239' }}>🕐 积分过期策略说明</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, marginBottom: 12 }}>
                    {expireRules.map(function(r, i) {
                      return (
                        <div key={i} style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{r.icon}</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{r.label}</div>
                            <div style={{ fontSize: 11, color: '#6b7280' }}>{r.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ background: '#fff', borderRadius: 8, padding: 10, border: '1px solid #fecdd3' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#9f1239', marginBottom: 8 }}>📊 近3个月过期积分统计</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {expireStats.map(function(s, i) {
                        var barColor = s.renewRate >= 70 ? '#16a34a' : s.renewRate >= 65 ? '#d97706' : '#dc2626';
                        return (
                          <div key={i} style={{ flex: 1, padding: 10, borderRadius: 8, background: '#fff1f2', border: '1px solid #fecdd3', textAlign: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#9f1239' }}>{s.month}</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#be123c', margin: '4px 0' }}>{s.points.toLocaleString()}<span style={{ fontSize: 10, fontWeight: 400, color: '#6b7280' }}> 分</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                              <div style={{ width: 50, height: 6, borderRadius: 3, background: '#fecdd3', overflow: 'hidden' }}>
                                <div style={{ width: s.renewRate + '%', height: '100%', borderRadius: 3, background: barColor }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 600, color: barColor }}>{s.renewRate}%</span>
                            </div>
                            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>续期率</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }()}

            {/* 积分常见问题 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#5b21b6' }}>❓ 积分常见问题</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { q: '积分有效期多久？', a: '积分自获取之日起有效期12个月，到期系统将自动清零。' },
                  { q: '如何查询积分明细？', a: '在本页面直接查看即可，支持按类型、日期筛选和搜索。' },
                  { q: '积分可以转让吗？', a: '积分仅限本人使用，不可转让或兑换现金。' },
                  { q: '退款积分如何处理？', a: '消费获得的积分在退款时会按比例扣除，请理性消费。' },
                ].map((faq, i) => (
                  <div key={i} style={{ padding: '6px 10px', borderRadius: 6, background: '#fff', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 2 }}>Q: {faq.q}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>A: {faq.a}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 今日积分提醒 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#9a3412' }}>⏰ 今日积分提醒</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>60日内过期</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#c2410c' }}>3,280</div>
                  <div style={{ fontSize: 10, color: '#d97706' }}>积分</div>
                </div>
                <div style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>涉及会员</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#c2410c' }}>23</div>
                  <div style={{ fontSize: 10, color: '#d97706' }}>人</div>
                </div>
                <div style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>最近过期</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#c2410c' }}>7</div>
                  <div style={{ fontSize: 10, color: '#d97706' }}>天后</div>
                </div>
                <div style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>已发提醒</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>15</div>
                  <div style={{ fontSize: 10, color: '#d97706' }}>次</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#92400e', textAlign: 'center' }}>
                🔔 建议立即对23位会员发送积分过期提醒短信
              </div>
            </div>

            {/* 积分小贴士 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: '#16a34a' }}>💡 积分小贴士</h3>
              <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 12, color: '#374151', lineHeight: 1.8 }}>
                <li>每日签到可获5积分，连续7天额外奖励20积分</li>
                <li>推荐好友注册并首消，推荐人可获得200积分</li>
                <li>每月15日会员日消费享双倍积分</li>
                <li>积分有效期12个月，到期自动清零</li>
                <li>钻石会员以上享积分兑换折扣</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
