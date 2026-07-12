/**
 * 门店评分 — Store Ratings (storefront-web)
 * 角色: 顾客 / 👔店长
 * 功能: 评分概览、维度详情、历史趋势、评论列表、筛选、空/加载状态
 */
'use client';

import React, { useState, useMemo } from 'react';

/* ── 类型 ── */
type RatingDimension = {
  name: string;
  score: number;
  maxScore: number;
  icon: string;
};

type ReviewItem = {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  content: string;
  date: string;
  tags: string[];
  dimensionScores: { name: string; score: number }[];
};

/* ── 模拟数据 ── */
const DIMENSIONS: RatingDimension[] = [
  { name: '环境', score: 4.8, maxScore: 5, icon: '🏛️' },
  { name: '服务', score: 4.6, maxScore: 5, icon: '🤝' },
  { name: '设备', score: 4.7, maxScore: 5, icon: '🎮' },
  { name: '性价比', score: 4.5, maxScore: 5, icon: '💰' },
  { name: '卫生', score: 4.9, maxScore: 5, icon: '🧹' },
];

const ALL_REVIEWS: ReviewItem[] = [
  { id: '1', user: '小明玩游戏', avatar: '😊', rating: 5, content: '环境非常好，空调很足，设备也很新，周末带朋友来玩很开心！', date: '2026-07-12', tags: ['环境好', '设备新'], dimensionScores: [{ name: '环境', score: 5 }, { name: '服务', score: 5 }, { name: '设备', score: 5 }] },
  { id: '2', user: '游戏达人王', avatar: '🎮', rating: 4, content: '整体不错，就是周末人太多需要排队。前台小姐姐服务态度很好！', date: '2026-07-11', tags: ['服务好', '人多'], dimensionScores: [{ name: '环境', score: 4 }, { name: '服务', score: 5 }, { name: '设备', score: 4 }] },
  { id: '3', user: '周末玩家', avatar: '😎', rating: 5, content: '性价比超高的电玩城，会员价很划算，推荐大家来体验VR项目！', date: '2026-07-10', tags: ['性价比高', 'VR体验'], dimensionScores: [{ name: '性价比', score: 5 }, { name: '设备', score: 5 }, { name: '卫生', score: 5 }] },
  { id: '4', user: '老顾客阿强', avatar: '👨', rating: 4, content: '从开业就来玩了，现在设备越来越多了，希望继续保持！', date: '2026-07-09', tags: ['老顾客', '设备丰富'], dimensionScores: [{ name: '服务', score: 4 }, { name: '卫生', score: 5 }, { name: '性价比', score: 4 }] },
  { id: '5', user: '学生党小李', avatar: '🧑‍🎓', rating: 5, content: '学生证的优惠力度很大，和同学聚会首选！抓娃娃机很好玩。', date: '2026-07-08', tags: ['学生优惠', '抓娃娃'], dimensionScores: [{ name: '性价比', score: 5 }, { name: '服务', score: 4 }, { name: '环境', score: 5 }] },
  { id: '6', user: '家庭主妇张姐', avatar: '👩', rating: 4, content: '带孩子来玩的，有很多适合小朋友的项目，很满意！', date: '2026-07-07', tags: ['适合亲子', '安全'], dimensionScores: [{ name: '环境', score: 4 }, { name: '卫生', score: 5 }, { name: '服务', score: 4 }] },
  { id: '7', user: '情侣约会控', avatar: '💑', rating: 3, content: '约会来的，环境还不错但是周末人太多了，双人套餐可以再多一些选择。', date: '2026-07-06', tags: ['人多', '双人套餐'], dimensionScores: [{ name: '环境', score: 4 }, { name: '服务', score: 3 }, { name: '性价比', score: 3 }] },
  { id: '8', user: '电玩发烧友', avatar: '🔥', rating: 5, content: '舞立方和太鼓达人是最爱！每次来都能玩一下午，推荐推荐！', date: '2026-07-05', tags: ['舞立方', '音乐游戏'], dimensionScores: [{ name: '设备', score: 5 }, { name: '环境', score: 5 }, { name: '服务', score: 4 }] },
  { id: '9', user: '团建组织者', avatar: '👔', rating: 4, content: '公司团建来的，包场体验很好，前台做了很好的安排，感谢！', date: '2026-07-04', tags: ['团建', '包场'], dimensionScores: [{ name: '服务', score: 5 }, { name: '环境', score: 4 }, { name: '设备', score: 4 }] },
  { id: '10', user: '深夜玩家', avatar: '🌙', rating: 5, content: '营业到很晚，夜猫子福音！凌晨去玩人少体验感拉满。', date: '2026-07-03', tags: ['营业时间长', '人少'], dimensionScores: [{ name: '服务', score: 5 }, { name: '卫生', score: 5 }, { name: '性价比', score: 5 }] },
  { id: '11', user: '抓娃娃高手', avatar: '🐻', rating: 4, content: '娃娃机设置都很合理，不像有些地方抓力太松，已经抓了好几个了。', date: '2026-07-02', tags: ['抓娃娃', '体验好'], dimensionScores: [{ name: '设备', score: 4 }, { name: '性价比', score: 4 }, { name: '环境', score: 4 }] },
  { id: '12', user: '外卖小哥', avatar: '🛵', rating: 5, content: '等单间隙来玩一把，几块钱就能开心很久，墙裂推荐！', date: '2026-07-01', tags: ['方便', '便宜'], dimensionScores: [{ name: '性价比', score: 5 }, { name: '环境', score: 4 }, { name: '服务', score: 5 }] },
];

/* ── 评分对应的星星 ── */
function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  return '⭐'.repeat(full) + (half ? '✨' : '');
}

export default function StoreRatingsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  /* ── 综合评分 ── */
  const overallScore = useMemo(() => {
    const avg = DIMENSIONS.reduce((s, d) => s + d.score, 0) / DIMENSIONS.length;
    return Math.round(avg * 10) / 10;
  }, []);

  const filteredReviews = useMemo(() => {
    let result = [...ALL_REVIEWS];
    if (ratingFilter > 0) result = result.filter(r => r.rating >= ratingFilter && r.rating < ratingFilter + 1);
    if (search) result = result.filter(r => r.content.includes(search) || r.user.includes(search) || r.tags.some(t => t.includes(search)));
    return result;
  }, [ratingFilter, search]);

  const handleFilter = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 250);
  };

  /* ── 评分分布 ── */
  const distribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ALL_REVIEWS.forEach(r => { const key = Math.floor(r.rating) as keyof typeof counts; if (counts[key] !== undefined) counts[key]++; });
    return counts;
  }, []);

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 750, margin: '0 auto' }}>
        {/* 标题 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>⭐ 门店评分</h1>
          <span style={{ fontSize: 14, color: '#64748b' }}>{ALL_REVIEWS.length} 条评价</span>
        </div>

        {/* 综合评分卡片 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', borderRadius: 14, background: 'linear-gradient(135deg, #78350f, #92400e)', border: '1px solid #b45309', marginBottom: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: '#fbbf24' }}>{overallScore}</div>
            <div style={{ fontSize: 22, color: '#fde68a' }}>⭐⭐⭐⭐⭐</div>
            <div style={{ fontSize: 12, color: '#fbbf24', marginTop: 4 }}>综合评分</div>
          </div>
          <div style={{ flex: 1 }}>
            {DIMENSIONS.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#fde68a', minWidth: 50 }}>{d.icon} {d.name}</span>
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#4a3a1a' }}>
                  <div style={{ width: `${(d.score / d.maxScore) * 100}%`, height: '100%', borderRadius: 4, background: '#fbbf24' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', minWidth: 32, textAlign: 'right' }}>{d.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tab 切换 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setActiveTab('overview')}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', background: activeTab === 'overview' ? '#fbbf24' : '#1e293b', color: activeTab === 'overview' ? '#0f172a' : '#94a3b8' }}>
            📊 评分概览
          </button>
          <button onClick={() => setActiveTab('reviews')}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', background: activeTab === 'reviews' ? '#fbbf24' : '#1e293b', color: activeTab === 'reviews' ? '#0f172a' : '#94a3b8' }}>
            💬 评价列表
          </button>
        </div>

        {/* Tab: 评分概览 */}
        {activeTab === 'overview' && (
          <>
            {/* 评分分布 */}
            <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.08)', marginBottom: 14 }}>
              <h3 style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>评分分布</h3>
              {([5, 4, 3, 2, 1] as const).map(star => {
                const count = distribution[star];
                const pct = ALL_REVIEWS.length > 0 ? (count / ALL_REVIEWS.length) * 100 : 0;
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: '#94a3b8', minWidth: 50 }}>{'⭐'.repeat(star)}</span>
                    <div style={{ flex: 1, height: 10, borderRadius: 5, background: '#1e293b' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 5, background: '#fbbf24' }} />
                    </div>
                    <span style={{ fontSize: 13, color: '#94a3b8', minWidth: 24, textAlign: 'right' }}>{count}</span>
                  </div>
                );
              })}
            </div>

            {/* 各维度详情 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 14 }}>
              {DIMENSIONS.map(d => (
                <div key={d.name} style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.08)', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{d.icon}</div>
                  <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 2 }}>{d.name}</div>
                  <div style={{ color: '#fbbf24', fontSize: 24, fontWeight: 700 }}>{d.score}</div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>/{d.maxScore}</div>
                </div>
              ))}
            </div>

            {/* 热门标签 */}
            <div style={{ padding: '14px 20px', borderRadius: 12, background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.08)' }}>
              <h3 style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 600, marginBottom: 10 }}>🏷️ 热门标签</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['环境好', '设备新', '服务好', '性价比高', 'VR体验', '抓娃娃', '适合亲子', '团建', '学生优惠', '营业时间长', '人少'].map(tag => (
                  <span key={tag} style={{ padding: '4px 12px', borderRadius: 999, background: '#fbbf2420', color: '#fbbf24', fontSize: 12, border: '1px solid #fbbf2440' }}>
                    # {tag}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Tab: 评价列表 */}
        {activeTab === 'reviews' && (
          <>
            {/* 筛选 */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <input placeholder="搜索评价内容/用户/标签…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ padding: '7px 12px', border: '1px solid #334155', borderRadius: 6, fontSize: 14, background: '#1e293b', color: '#e2e8f0', minWidth: 200 }} />
              <select value={ratingFilter} onChange={e => setRatingFilter(Number(e.target.value))}
                style={{ padding: '7px 12px', border: '1px solid #334155', borderRadius: 6, fontSize: 14, background: '#1e293b', color: '#e2e8f0' }}>
                <option value={0}>全部评分</option>
                <option value={5}>5 星</option>
                <option value={4}>4 星</option>
                <option value={3}>3 星</option>
                <option value={2}>2 星</option>
                <option value={1}>1 星</option>
              </select>
              <button onClick={handleFilter}
                style={{ padding: '7px 18px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                搜索
              </button>
              <button onClick={() => { setSearch(''); setRatingFilter(0); }}
                style={{ padding: '7px 18px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                重置
              </button>
            </div>

            {/* 统计 */}
            <div style={{ marginBottom: 10, fontSize: 13, color: '#64748b' }}>
              共 <strong style={{ color: '#94a3b8' }}>{ALL_REVIEWS.length}</strong> 条 · 显示 <strong style={{ color: '#94a3b8' }}>{filteredReviews.length}</strong> 条
            </div>

            {/* 加载 */}
            {loading && <div style={{ textAlign: 'center', padding: 24, color: '#64748b', fontSize: 14 }}>🔄 加载中...</div>}

            {/* 评价卡片 */}
            {!loading && filteredReviews.map(r => (
              <div key={r.id} style={{ padding: '14px 18px', borderRadius: 12, marginBottom: 8, background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{r.avatar}</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{r.user}</span>
                    <span style={{ color: '#fbbf24', fontSize: 13 }}>{renderStars(r.rating)}</span>
                  </div>
                  <span style={{ color: '#64748b', fontSize: 12 }}>{r.date}</span>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.5, marginBottom: 6 }}>{r.content}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {r.tags.map(tag => (
                    <span key={tag} style={{ padding: '2px 8px', borderRadius: 6, background: '#2563eb20', color: '#93c5fd', fontSize: 11 }}>#{tag}</span>
                  ))}
                </div>
                {r.dimensionScores.length > 0 && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 12, color: '#64748b' }}>
                    {r.dimensionScores.map(d => (
                      <span key={d.name}>{d.name}: {'⭐'.repeat(d.score)}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* 空状态 */}
            {!loading && filteredReviews.length === 0 && (
              <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
                <div style={{ fontSize: 15, color: '#94a3b8' }}>没有匹配的评价</div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>请调整筛选条件后重试</div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
