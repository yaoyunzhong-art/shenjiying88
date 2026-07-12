/**
 * 门店评分 — Store Ratings (storefront-web)
 * 角色: 顾客 / 👔店长
 * 功能: 综合评分、维度评分、最近评价列表、趋势图(模拟)、评分分布、搜索筛选、空/错状态
 */
'use client';

import React, { useState, useMemo } from 'react';

/* ── 类型 ── */
type RatingDimension = {
  name: string;
  score: number;
  icon: string;
  max: number;
  trend: 'up' | 'down' | 'stable';
  change: string;
};

type Review = {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  content: string;
  tags: string[];
  date: string;
  likes: number;
  reply?: string;
};

/* ── 评分维度 ── */
const DIMENSIONS: RatingDimension[] = [
  { name: '环境', score: 4.8, icon: '🏠', max: 5, trend: 'up', change: '+0.1' },
  { name: '服务', score: 4.6, icon: '👋', max: 5, trend: 'stable', change: '±0.0' },
  { name: '设备', score: 4.7, icon: '🕹️', max: 5, trend: 'up', change: '+0.2' },
  { name: '性价比', score: 4.5, icon: '💰', max: 5, trend: 'down', change: '-0.1' },
  { name: '舒适度', score: 4.6, icon: '🛋️', max: 5, trend: 'stable', change: '±0.0' },
  { name: '卫生', score: 4.9, icon: '✨', max: 5, trend: 'up', change: '+0.1' },
  { name: '交通便利', score: 4.3, icon: '🚇', max: 5, trend: 'stable', change: '±0.0' },
  { name: '活动丰富', score: 4.4, icon: '🎪', max: 5, trend: 'down', change: '-0.2' },
];

/* ── Mock 评价 (20+) ── */
const ALL_REVIEWS: Review[] = [
  { id: 'RV001', user: '游戏爱好者小王', avatar: '🎮', rating: 5, content: '环境很好，设备很新，抓娃娃机特别好抓！', tags: ['环境好', '设备新', '娃娃好抓'], date: '2026-07-12', likes: 28, reply: '感谢您的评价，我们会继续努力！' },
  { id: 'RV002', user: '周末玩家', avatar: '🎯', rating: 4, content: '新增加了VR体验区，很好玩，就是排队时间有点长。', tags: ['VR好玩', '排队久'], date: '2026-07-12', likes: 15 },
  { id: 'RV003', user: '带娃宝妈', avatar: '👶', rating: 5, content: '孩子特别喜欢来这里，儿童区安全又好玩，家长也能休息。', tags: ['亲子友好', '安全', '孩子喜欢'], date: '2026-07-11', likes: 42, reply: '我们很自豪能为家庭提供愉快的娱乐体验！' },
  { id: 'RV004', user: '大学生小李', avatar: '🎓', rating: 4, content: '价格合理，和同学聚会的好地方。饮品选择可以再多一些。', tags: ['价格合理', '适合聚会'], date: '2026-07-11', likes: 22 },
  { id: 'RV005', user: '街机达人', avatar: '🕹️', rating: 5, content: '拳皇系列很全，高手很多，每周都来切磋。', tags: ['街机经典', '高手多'], date: '2026-07-10', likes: 35, reply: '每周六有街机比赛，欢迎参加！' },
  { id: 'RV006', user: '情侣约会', avatar: '💑', rating: 5, content: '约会圣地！双人游戏超有趣，赢积分换礼物超浪漫~', tags: ['约会推荐', '双人游戏', '浪漫'], date: '2026-07-10', likes: 56 },
  { id: 'RV007', user: '常客张先生', avatar: '👨', rating: 4, content: '经常来，会员积分挺实用的。希望增加更多兑换礼品。', tags: ['会员积分', '礼品兑换'], date: '2026-07-09', likes: 18, reply: '感谢反馈，7月底将上线新礼品！' },
  { id: 'RV008', user: '学生党', avatar: '🎒', rating: 3, content: '周末人太多，有些机器要等很久。平时来体验更好。', tags: ['周末人多', '排队久'], date: '2026-07-08', likes: 12 },
  { id: 'RV009', user: '奶爸一枚', avatar: '🍼', rating: 5, content: '亲子套餐很划算，宝宝玩得不肯走。停车也方便。', tags: ['亲子套餐', '停车方便'], date: '2026-07-08', likes: 31, reply: '亲子套餐持续优惠中，欢迎常来！' },
  { id: 'RV010', user: '摄影达人', avatar: '📸', rating: 4, content: '装修风格很潮，适合拍照打卡。灯光效果不错。', tags: ['装修潮', '适合拍照'], date: '2026-07-07', likes: 24 },
  { id: 'RV011', user: '游戏主播', avatar: '🎙️', rating: 4, content: '直播经常来，环境好网络也快。建议增加一些新游戏。', tags: ['适合直播', '网络好'], date: '2026-07-07', likes: 20 },
  { id: 'RV012', user: '上班族', avatar: '💼', rating: 4, content: '下班后来放松的好地方。投篮机够专业，还能和同事比赛。', tags: ['下班放松', '投篮机'], date: '2026-07-06', likes: 14 },
  { id: 'RV013', user: '资深玩家', avatar: '🧙', rating: 5, content: '十几年老店了，一直在进步。服务越来越好了。', tags: ['老店', '服务好', '进步快'], date: '2026-07-06', likes: 45, reply: '感谢多年支持！我们会继续提升品质！' },
  { id: 'RV014', user: '闺蜜聚餐', avatar: '👩‍👩‍👧', rating: 5, content: '和姐妹一起来超开心，拍照玩游戏两不误！', tags: ['闺蜜必去', '好玩好拍'], date: '2026-07-05', likes: 38 },
  { id: 'RV015', user: '夜猫子', avatar: '🦉', rating: 4, content: '营业到很晚，加班后也能玩一场，太棒了。', tags: ['营业晚', '解压'], date: '2026-07-04', likes: 16 },
  { id: 'RV016', user: '外地游客', avatar: '🧳', rating: 5, content: '来旅游搜到的，比预期好太多！满满童年回忆。', tags: ['旅游必去', '童年回忆'], date: '2026-07-03', likes: 33, reply: '欢迎下次再来！' },
  { id: 'RV017', user: '桌游爱好者', avatar: '🎲', rating: 3, content: '桌游种类还可以，但有些热门桌游缺货了。', tags: ['桌游', '缺货'], date: '2026-07-02', likes: 7 },
  { id: 'RV018', user: '公司团建', avatar: '🏢', rating: 4, content: '公司团建选这里，大家都玩得很开心。场地够大。', tags: ['团建推荐', '场地大'], date: '2026-06-30', likes: 29, reply: '团建套餐多样，欢迎下次再来！' },
  { id: 'RV019', user: '电竞少年', avatar: '💻', rating: 5, content: '有电竞区，屏幕和主机配置都很高。和兄弟们开黑爽。', tags: ['电竞区', '配置高', '开黑'], date: '2026-06-28', likes: 27 },
  { id: 'RV020', user: '退休大爷', avatar: '👴', rating: 5, content: '带孙子来，没想到自己也上瘾了。老游戏都有。', tags: ['老少皆宜', '经典游戏'], date: '2026-06-25', likes: 50, reply: '欢迎常来，每周有老年优惠时段！' },
  { id: 'RV021', user: '奶茶控', avatar: '🧋', rating: 4, content: '店里的饮品很好喝，特别是奶茶，比外面饮品店还好。', tags: ['饮品好喝', '奶茶推荐'], date: '2026-06-22', likes: 19 },
];

const OVERALL_SCORE = (DIMENSIONS.reduce((s, d) => s + d.score, 0) / DIMENSIONS.length);
const REVIEW_COUNTS = [ALL_REVIEWS.filter(r => r.rating === 5).length, ALL_REVIEWS.filter(r => r.rating === 4).length, ALL_REVIEWS.filter(r => r.rating === 3).length, ALL_REVIEWS.filter(r => r.rating === 2).length, ALL_REVIEWS.filter(r => r.rating === 1).length];
const TOTAL_REVIEWS = ALL_REVIEWS.length;

const PAGE_SIZE = 8;

/* ── 子组件: 星级评分条 ── */
function StarBar({ rating, count, total }: { rating: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
      <span style={{ color: '#94a3b8', fontSize: 12, width: 40 }}>{rating}星</span>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(148,163,184,0.1)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: '#fbbf24', transition: 'width 0.3s' }} />
      </div>
      <span style={{ color: '#64748b', fontSize: 11, width: 30, textAlign: 'right' }}>{count}</span>
    </div>
  );
}

/* ── 子组件: 评价卡片 ── */
function ReviewCard({ review }: { review: Review }) {
  const [showReply, setShowReply] = useState(false);
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 10, marginBottom: 8,
      background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 28 }}>{review.avatar}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#e2e8f0', fontWeight: 500, fontSize: 14 }}>{review.user}</span>
            <span style={{ color: '#fbbf24', fontSize: 12 }}>
              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
            </span>
          </div>
          <div style={{ color: '#64748b', fontSize: 11 }}>{review.date}</div>
        </div>
        <span style={{ color: '#94a3b8', fontSize: 11 }}>👍 {review.likes}</span>
      </div>

      <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.5, marginBottom: 6 }}>{review.content}</div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
        {review.tags.map((t, i) => (
          <span key={i} style={{
            padding: '2px 8px', borderRadius: 6,
            background: '#3b82f610', border: '1px solid #3b82f620',
            color: '#60a5fa', fontSize: 10,
          }}>
            #{t}
          </span>
        ))}
      </div>

      {review.reply && (
        <div>
          <button
            onClick={() => setShowReply(!showReply)}
            style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 11, cursor: 'pointer', padding: '2px 0' }}
          >
            {showReply ? '收起回复' : '查看回复'}
          </button>
          {showReply && (
            <div style={{
              marginTop: 6, padding: '8px 12px', borderRadius: 8,
              background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.06)',
              color: '#94a3b8', fontSize: 12,
            }}>
              🏪 商家回复: {review.reply}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── 主组件 ── */
export default function StoreRatingsPage() {
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'likes'>('recent');
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    let items = ALL_REVIEWS.filter(r => {
      if (minRating > 0 && r.rating < minRating) return false;
      if (kw && !r.content.toLowerCase().includes(kw) && !r.user.toLowerCase().includes(kw) && !r.tags.some(t => t.includes(kw))) return false;
      return true;
    });

    if (sortBy === 'rating') items.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'likes') items.sort((a, b) => b.likes - a.likes);
    else items.sort((a, b) => b.date.localeCompare(a.date));

    return items;
  }, [search, minRating, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  React.useEffect(() => { setPage(1); }, [search, minRating, sortBy]);

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* ── 标题 ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>门店评分</h1>
          <button onClick={() => setError(!error)}
            style={{ padding: '4px 12px', borderRadius: 6, background: '#ef444420', border: '1px solid #ef444430', color: '#fca5a5', fontSize: 11, cursor: 'pointer' }}>
            {error ? '恢复' : '模拟错误'}
          </button>
        </div>

        {/* ── 错误状态 ── */}
        {error && (
          <div style={{ padding: '16px 18px', marginBottom: 16, borderRadius: 12, background: '#ef444415', border: '1px solid #ef444430', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={{ color: '#fca5a5', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>评分数据获取失败</div>
              <div style={{ color: '#fca5a580', fontSize: 13 }}>评价系统暂时不可用，请稍后重试</div>
              <button onClick={() => setError(false)} style={{ marginTop: 8, padding: '6px 16px', borderRadius: 6, background: '#3b82f6', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer' }}>重新加载</button>
            </div>
          </div>
        )}

        {!error && (
          <>
            {/* ── 综合评分卡片 ── */}
            <div style={{
              marginBottom: 16, padding: '20px', borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(251,191,36,0.03))',
              border: '1px solid rgba(251,191,36,0.2)',
              display: 'flex', gap: 20,
            }}>
              <div style={{ textAlign: 'center', minWidth: 100 }}>
                <div style={{ fontSize: 48, fontWeight: 700, color: '#fbbf24', lineHeight: 1 }}>{OVERALL_SCORE.toFixed(1)}</div>
                <div style={{ color: '#fbbf24', fontSize: 18, marginTop: 2 }}>{'★'.repeat(Math.round(OVERALL_SCORE))}{'☆'.repeat(5 - Math.round(OVERALL_SCORE))}</div>
                <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>{TOTAL_REVIEWS} 条评价</div>
              </div>
              <div style={{ flex: 1 }}>
                {[5, 4, 3, 2, 1].map(rating => (
                  <StarBar key={rating} rating={rating} count={REVIEW_COUNTS[5 - rating]} total={TOTAL_REVIEWS} />
                ))}
              </div>
            </div>

            {/* ── 维度评分 ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {DIMENSIONS.map(d => (
                <div key={d.name} style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.08)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{d.icon}</span>
                    <div>
                      <div style={{ color: '#e2e8f0', fontSize: 13 }}>{d.name}</div>
                      <div style={{ display: 'flex', gap: 4, fontSize: 11, marginTop: 1 }}>
                        <span style={{ color: '#fbbf24' }}>
                          {'★'.repeat(Math.round(d.score))}{'☆'.repeat(5 - Math.round(d.score))}
                        </span>
                        <span style={{ color: d.trend === 'up' ? '#34d399' : d.trend === 'down' ? '#f87171' : '#64748b', fontSize: 10 }}>
                          {d.change} {d.trend === 'up' ? '↑' : d.trend === 'down' ? '↓' : '→'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span style={{ color: '#fbbf24', fontSize: 18, fontWeight: 700 }}>{d.score}</span>
                </div>
              ))}
            </div>

            {/* ── 搜索与排序 ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <input placeholder="🔍 搜索评价内容/用户/标签..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, minWidth: 150, padding: '9px 12px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 13, outline: 'none' }} />
              <select value={minRating} onChange={e => setMinRating(Number(e.target.value))}
                style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
                <option value={0}>全部评分</option>
                <option value={5}>★★★★★</option>
                <option value={4}>★★★★及以上</option>
                <option value={3}>★★★及以上</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
                <option value="recent">最新</option>
                <option value="rating">评分最高</option>
                <option value="likes">最多点赞</option>
              </select>
            </div>

            {/* ── 评价列表 / 空状态 ── */}
            {paginated.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', borderRadius: 14, background: 'rgba(30,41,59,0.4)', border: '1px dashed rgba(148,163,184,0.15)' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📝</div>
                <div style={{ color: '#94a3b8', fontSize: 15, marginBottom: 4 }}>暂无匹配的评价</div>
                <div style={{ color: '#64748b', fontSize: 12 }}>调整筛选条件或等待新的评价</div>
              </div>
            ) : (
              <>
                {paginated.map(r => <ReviewCard key={r.id} review={r} />)}

                {/* ── 分页 ── */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12, color: '#94a3b8', fontSize: 13 }}>
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
              <span>共 {filtered.length} 条评价 · 本页 {paginated.length} 条</span>
              <span>推荐率 {Math.round(ALL_REVIEWS.filter(r => r.rating >= 4).length / ALL_REVIEWS.length * 100)}%</span>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
