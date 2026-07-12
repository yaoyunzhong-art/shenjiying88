/**
 * 门店评分 — Store Ratings (storefront-web)
 * 角色: 顾客 / 👔店长
 * 功能: 综合评分、维度评分、评分分布、近期评价、筛选、排序、回复评价、趋势
 */
'use client';

import React, { useState, useMemo } from 'react';

/* ── 类型 ── */
type RatingDimension = {
  name: string;
  icon: string;
  score: number;
  description: string;
};

type Review = {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  content: string;
  tags: string[];
  reply?: string;
  likes: number;
};

/* ── 维度评分 ── */
const DIMENSIONS: RatingDimension[] = [
  { name: '环境', icon: '🏠', score: 4.8, description: '空间整洁、氛围舒适' },
  { name: '服务', icon: '🤝', score: 4.6, description: '店员态度、响应速度' },
  { name: '设备', icon: '🎮', score: 4.7, description: '设备完好率、体验流畅度' },
  { name: '性价比', icon: '💰', score: 4.5, description: '价格合理、物有所值' },
  { name: '卫生', icon: '🧹', score: 4.9, description: '清洁度、消毒措施' },
];

/* ── 近期评价 ── */
const REVIEWS: Review[] = [
  { id: '1', author: 'Alex', avatar: '🎮', rating: 5, date: '2026-07-12', content: '环境特别好，设备也很新，前台小姐姐服务态度超好！', tags: ['环境好', '设备新', '服务好'], likes: 12 },
  { id: '2', author: 'Betty', avatar: '🎀', rating: 4, date: '2026-07-12', content: '和朋友一起来的，玩得挺开心。就是游戏币有点贵，希望能优惠点。', tags: ['氛围好', '价格偏高'], reply: '感谢您的反馈，后续会推出会员优惠活动！', likes: 8 },
  { id: '3', author: 'Charlie', avatar: '🐱', rating: 5, date: '2026-07-11', content: '非常干净！看到工作人员一直在消毒设备，疫情期间让人放心。', tags: ['干净卫生', '安全措施到位'], likes: 15 },
  { id: '4', author: 'Diana', avatar: '🌸', rating: 3, date: '2026-07-11', content: '周末人太多了，排队等了好久。有些机器出故障了没有及时维修。', tags: ['人多', '设备故障'], reply: '抱歉给您带来不好的体验，周末确实客流较集中，我们会加强设备巡检。', likes: 6 },
  { id: '5', author: 'Evan', avatar: '🦊', rating: 4, date: '2026-07-10', content: '新来的VR设备体验感很棒！下次带朋友来二刷。', tags: ['VR体验', '新鲜有趣'], likes: 10 },
  { id: '6', author: 'Fiona', avatar: '🦋', rating: 5, date: '2026-07-10', content: '办了会员卡，性价比很高。每周都来！', tags: ['会员划算', '常客'], likes: 7 },
  { id: '7', author: 'George', avatar: '🐻', rating: 4, date: '2026-07-09', content: '店里各种饮品零食很齐全，玩累了随时补给。', tags: ['设施齐全', '方便'], likes: 5 },
  { id: '8', author: 'Hannah', avatar: '🦄', rating: 3, date: '2026-07-09', content: '空调有点冷，希望能调一下温度。其他都挺好。', tags: ['温度问题'], reply: '收到您的建议，我们会根据天气灵活调节温度。', likes: 3 },
  { id: '9', author: 'Ivan', avatar: '🦁', rating: 5, date: '2026-07-08', content: '带孩子来玩的，有很多适合小朋友的设备，很赞！', tags: ['亲子友好', '儿童设备'], likes: 11 },
  { id: '10', author: 'Julia', avatar: '🐰', rating: 4, date: '2026-07-08', content: '礼品兑换很丰富，攒够了游戏币换了个大玩偶，开心！', tags: ['礼品丰富', '有趣'], likes: 9 },
  { id: '11', author: 'Kevin', avatar: '🐶', rating: 5, date: '2026-07-07', content: '完美！无可挑剔，每次来都有新设备体验。', tags: ['体验完美', '设备更新快'], likes: 14 },
  { id: '12', author: 'Linda', avatar: '🦊', rating: 3, date: '2026-07-07', content: '前台排队时间太长，建议增加一个收银台。', tags: ['排队久'], reply: '感谢建议，我们已经增加了高峰时段的人手安排。', likes: 4 },
];

/* ── 标签云 ── */
const ALL_TAGS = Array.from(new Set(REVIEWS.flatMap(r => r.tags)));

/* ── 星级渲染 ── */
function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#fbbf24', fontSize: 16, letterSpacing: 2 }}>
      {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
    </span>
  );
}

export default function StoreRatingsPage() {
  const [filterStars, setFilterStars] = useState(0);
  const [sortOrder, setSortOrder] = useState<'recent' | 'rating_high' | 'rating_low' | 'likes'>('recent');
  const [tagFilter, setTagFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const PAGE_SIZE = 6;

  /* ── 评分分布 ── */
  const distribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    REVIEWS.forEach(r => { if (r.rating >= 1 && r.rating <= 5) counts[r.rating as keyof typeof counts]++; });
    return counts;
  }, []);

  const average = useMemo(() =>
    REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length,
  []);

  const ratingCount = REVIEWS.filter(r => r.rating >= 4).length;
  const positiveRate = Math.round((ratingCount / REVIEWS.length) * 100);

  /* ── 过滤 + 排序 ── */
  const filtered = useMemo(() => {
    let result = [...REVIEWS];
    if (filterStars > 0) result = result.filter(r => r.rating === filterStars);
    if (tagFilter) result = result.filter(r => r.tags.includes(tagFilter));
    switch (sortOrder) {
      case 'recent': result.sort((a, b) => b.date.localeCompare(a.date)); break;
      case 'rating_high': result.sort((a, b) => b.rating - a.rating); break;
      case 'rating_low': result.sort((a, b) => a.rating - b.rating); break;
      case 'likes': result.sort((a, b) => b.likes - a.likes); break;
    }
    return result;
  }, [filterStars, sortOrder, tagFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedReviews = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleReset = () => {
    setFilterStars(0);
    setSortOrder('recent');
    setTagFilter('');
    setPage(1);
  };

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* 标题 */}
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>
          ⭐ 门店评价
        </h1>

        {/* 综合评分卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={{ borderRadius: 12, padding: '16px 20px', background: 'linear-gradient(135deg, #fbbf2420, #f59e0b20)', border: '1px solid #fbbf2440', gridColumn: 'span 1' }}>
            <div style={{ fontSize: 13, color: '#fcd34d', marginBottom: 2 }}>综合评分</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#fef3c7' }}>{average.toFixed(1)}</div>
            <div style={{ marginTop: 2 }}><Stars rating={Math.round(average)} /></div>
            <div style={{ fontSize: 11, color: '#fbbf2480', marginTop: 2 }}>{REVIEWS.length} 条评价</div>
          </div>
          <div style={{ borderRadius: 12, padding: '16px 20px', background: 'linear-gradient(135deg, #22c55e20, #16a34a20)', border: '1px solid #22c55e40' }}>
            <div style={{ fontSize: 13, color: '#86efac', marginBottom: 4 }}>好评率</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#dcfce7' }}>{positiveRate}%</div>
            <div style={{ fontSize: 11, color: '#4ade8050', marginTop: 2 }}>{ratingCount} 条 4~5星</div>
          </div>
          <div style={{ borderRadius: 12, padding: '16px 20px', background: 'linear-gradient(135deg, #64748b20, #47556920)', border: '1px solid #64748b40' }}>
            <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 4 }}>已回复</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>{REVIEWS.filter(r => r.reply).length}</div>
            <div style={{ fontSize: 11, color: '#64748b50', marginTop: 2 }}>门店回复率</div>
          </div>
          <div style={{ borderRadius: 12, padding: '16px 20px', background: 'linear-gradient(135deg, #a855f720, #9333ea20)', border: '1px solid #a855f740' }}>
            <div style={{ fontSize: 13, color: '#d8b4fe', marginBottom: 4 }}>互动热度</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f3e8ff' }}>{REVIEWS.reduce((s, r) => s + r.likes, 0)}</div>
            <div style={{ fontSize: 11, color: '#a855f750', marginTop: 2 }}>总点赞数</div>
          </div>
        </div>

        {/* 维度评分 + 分布 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {/* 维度评分 */}
          <div style={{ borderRadius: 12, border: '1px solid #1e293b', padding: 14, background: '#0f172a' }}>
            <h3 style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>📊 评分维度</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DIMENSIONS.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18, width: 26 }}>{d.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{d.name}</span>
                      <span style={{ color: '#fbbf24', fontSize: 13, fontWeight: 700 }}>{d.score}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: '#1e293b', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', width: `${(d.score / 5) * 100}%`, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 评分分布 */}
          <div style={{ borderRadius: 12, border: '1px solid #1e293b', padding: 14, background: '#0f172a' }}>
            <h3 style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>📈 评分分布</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {([5, 4, 3, 2, 1] as const).map(star => {
                const count = distribution[star];
                const pct = REVIEWS.length > 0 ? (count / REVIEWS.length) * 100 : 0;
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#fbbf24', fontSize: 12, minWidth: 40, textAlign: 'right' }}>
                      {star}星
                    </span>
                    <div style={{ flex: 1, height: 10, borderRadius: 5, background: '#1e293b', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 5,
                        background: star >= 4 ? '#22c55e' : star === 3 ? '#fbbf24' : '#f87171',
                        width: `${pct}%`, transition: 'width 0.4s',
                      }} />
                    </div>
                    <span style={{ color: '#64748b', fontSize: 11, minWidth: 30 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 标签云 */}
        <div style={{ borderRadius: 12, border: '1px solid #1e293b', padding: '10px 14px', marginBottom: 16, background: '#0f172a' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ALL_TAGS.map(tag => (
              <span key={tag} onClick={() => { setTagFilter(tag === tagFilter ? '' : tag); setPage(1); }}
                style={{
                  display: 'inline-block', padding: '3px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer',
                  background: tagFilter === tag ? '#2563eb' : '#1e293b',
                  color: tagFilter === tag ? '#fff' : '#94a3b8',
                  border: tagFilter === tag ? '1px solid #2563eb' : '1px solid #334155',
                  fontWeight: tagFilter === tag ? 600 : 400,
                  transition: 'all 0.15s',
                }}>
                🏷️ {tag}
              </span>
            ))}
            {tagFilter && (
              <span onClick={() => handleReset()}
                style={{ padding: '3px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer', background: '#1e293b', color: '#64748b', border: '1px solid #334155' }}>
                ✕ 清除
              </span>
            )}
          </div>
        </div>

        {/* 筛选 + 排序 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>星级:</span>
            <button onClick={() => { setFilterStars(0); setPage(1); }}
              style={{ padding: '4px 10px', borderRadius: 6, border: filterStars === 0 ? '1px solid #2563eb' : '1px solid #334155', background: filterStars === 0 ? '#2563eb' : '#1e293b', color: filterStars === 0 ? '#fff' : '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
              全部
            </button>
            {[5, 4, 3, 2, 1].map(star => (
              <button key={star} onClick={() => { setFilterStars(star); setPage(1); }}
                style={{ padding: '4px 10px', borderRadius: 6, border: filterStars === star ? '1px solid #2563eb' : '1px solid #334155', background: filterStars === star ? '#2563eb' : '#1e293b', color: filterStars === star ? '#fff' : '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
                {star}★
              </button>
            ))}
          </div>
          <select value={sortOrder} onChange={e => { setSortOrder(e.target.value as typeof sortOrder); setPage(1); }}
            style={{ padding: '5px 12px', border: '1px solid #334155', borderRadius: 6, fontSize: 13, background: '#1e293b', color: '#e2e8f0' }}>
            <option value="recent">最新</option>
            <option value="rating_high">评分最高</option>
            <option value="rating_low">评分最低</option>
            <option value="likes">最多赞</option>
          </select>
        </div>

        {/* 统计条 */}
        <div style={{ marginBottom: 10, fontSize: 13, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
          <span>共 <strong style={{ color: '#94a3b8' }}>{REVIEWS.length}</strong> 条评价 · 显示 <strong style={{ color: '#94a3b8' }}>{filtered.length}</strong> 条</span>
          <span style={{ fontSize: 12, color: '#475569' }}>第 {page}/{totalPages} 页</span>
        </div>

        {/* 评价列表 */}
        {pagedReviews.map(review => (
          <div key={review.id} style={{
            padding: '16px 18px', borderRadius: 12, marginBottom: 8,
            background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.08)',
            transition: 'background 0.15s',
          }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1e293b'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(30,41,59,0.6)'}>
            {/* 头部 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>{review.avatar}</span>
                <div>
                  <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{review.author}</span>
                  <span style={{ marginLeft: 8 }}><Stars rating={review.rating} /></span>
                </div>
              </div>
              <div style={{ color: '#64748b', fontSize: 12 }}>{review.date}</div>
            </div>
            {/* 内容 */}
            <p style={{ color: '#cbd5e1', fontSize: 14, margin: '6px 0', lineHeight: 1.6 }}>{review.content}</p>
            {/* 标签 */}
            {review.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 4, margin: '6px 0', flexWrap: 'wrap' }}>
                {review.tags.map(tag => (
                  <span key={tag} style={{ padding: '1px 8px', borderRadius: 999, fontSize: 11, background: '#2563eb15', color: '#60a5fa', border: '1px solid #2563eb25' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {/* 回复 */}
            {review.reply && (
              <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: '#1a2744', border: '1px solid #2563eb20' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ color: '#60a5fa', fontSize: 12, fontWeight: 600 }}>🏪 门店回复</span>
                  <span style={{ fontSize: 11, color: '#475569' }}>· 管理员</span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{review.reply}</p>
              </div>
            )}
            {/* 互动 */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: '#64748b' }}>
              <span style={{ cursor: 'pointer', color: '#94a3b8' }}>👍 {review.likes}</span>
              <span style={{ cursor: 'pointer', color: '#94a3b8' }}>💬 回复</span>
              {!review.reply && (
                <span style={{ marginLeft: 'auto', cursor: 'pointer', color: '#2563eb' }}>📝 回复评价</span>
              )}
            </div>
          </div>
        ))}

        {/* 空状态 */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⭐</div>
            <div style={{ fontSize: 15, color: '#94a3b8' }}>没有匹配的评价</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>请调整筛选条件后重试</div>
          </div>
        )}

        {/* 分页 */}
        {filtered.length > PAGE_SIZE && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 16 }}>
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: page <= 1 ? '#0f172a' : '#1e293b', color: page <= 1 ? '#334155' : '#94a3b8', fontSize: 13, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>
              ← 上一页
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ width: 32, height: 32, borderRadius: 6, border: p === page ? '1px solid #2563eb' : '1px solid #334155', background: p === page ? '#2563eb' : '#1e293b', color: p === page ? '#fff' : '#64748b', fontSize: 13, fontWeight: p === page ? 700 : 400, cursor: 'pointer' }}>
                {p}
              </button>
            ))}
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: page >= totalPages ? '#0f172a' : '#1e293b', color: page >= totalPages ? '#334155' : '#94a3b8', fontSize: 13, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>
              下一页 →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
