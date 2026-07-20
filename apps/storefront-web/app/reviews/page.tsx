/**
 * 评价展示页 — Reviews Page (Next.js App Router Page)
 * B-页面: 面向C端用户的评价浏览
 * 角色: 🛒 前台消费者视角
 *
 * 功能: 查看门店评价、评分分布、按评分/时间排序、标签筛选
 */
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  MOCK_REVIEWS,
  RATING_LABELS,
  RATING_SHORT_LABELS,
  SORT_LABELS,
  DEFAULT_PAGE_SIZE,
  computeReviewStats,
  filterByStore,
  filterByRating,
  filterWithImages,
  sortReviews,
  paginateReviews,
  formatReviewTime,
  renderStars,
  computeAverageRating,
  type Review,
  type ReviewFilter,
  type Rating,
} from './reviews-data';

// ============================================================
// 门店Tab配置
// ============================================================

const STORE_TABS = [
  { storeCode: '', storeName: '全部' },
  { storeCode: 'store-001', storeName: '旗舰店（国贸）' },
  { storeCode: 'store-002', storeName: '社区店（望京）' },
  { storeCode: 'store-003', storeName: '卫星店（中关村）' },
  { storeCode: 'store-004', storeName: '新店（通州万达）' },
];

// ============================================================
// 评价展示页面
// ============================================================

export default function ReviewsPage() {
  const [loading, _setLoading] = useState(false);
  const [error, _setError] = useState<string | null>(null);
  const [activeStore, setActiveStore] = useState('');
  const [ratingFilter, setRatingFilter] = useState<Rating | 0>(0);
  const [hasImageOnly, setHasImageOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'highest' | 'lowest'>('latest');
  const [page, setPage] = useState(1);

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>加载中...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#f87171', fontSize: 14 }}>数据获取失败: {error}</div>
      </main>
    );
  }

  if (!MOCK_REVIEWS || MOCK_REVIEWS.length === 0) {
    return (
      <main style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <div>暂无数据</div>
          <div style={{ fontSize: 13, color: '#475569', marginTop: 8 }}>当前暂无用户评价</div>
        </div>
      </main>
    );
  }

  // 过滤逻辑
  const filteredReviews = useMemo(() => {
    let result = [...MOCK_REVIEWS];

    // 按门店过滤
    if (activeStore) {
      result = filterByStore(result, activeStore);
    }

    // 按评分过滤
    if (ratingFilter > 0) {
      result = filterByRating(result, ratingFilter as Rating);
    }

    // 是否有图
    if (hasImageOnly) {
      result = filterWithImages(result);
    }

    // 排序
    result = sortReviews(result, sortBy);

    return result;
  }, [activeStore, ratingFilter, hasImageOnly, sortBy]);

  // 综合统计（基于全部数据或当前门店）
  const stats = useMemo(() => {
    let allReviews = [...MOCK_REVIEWS];
    if (activeStore) {
      allReviews = filterByStore(allReviews, activeStore);
    }
    return computeReviewStats(allReviews);
  }, [activeStore]);

  // 分页
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / DEFAULT_PAGE_SIZE));
  const pagedReviews = useMemo(
    () => paginateReviews(filteredReviews, page, DEFAULT_PAGE_SIZE),
    [filteredReviews, page]
  );

  const handleStoreChange = useCallback((storeCode: string) => {
    setActiveStore(storeCode);
    setPage(1);
    setRatingFilter(0);
  }, []);

  const handleRatingFilter = useCallback((rating: Rating | 0) => {
    setRatingFilter(rating === ratingFilter ? 0 : rating);
    setPage(1);
  }, [ratingFilter]);

  const handleSortChange = useCallback((sort: 'latest' | 'highest' | 'lowest') => {
    setSortBy(sort);
    setPage(1);
  }, []);

  const toggleImageFilter = useCallback(() => {
    setHasImageOnly((prev) => !prev);
    setPage(1);
  }, []);

  const currentStoreName = activeStore
    ? STORE_TABS.find((t) => t.storeCode === activeStore)?.storeName || '门店评价'
    : '全部评价';

  return (
    <main style={{ minHeight: '100vh', background: '#0f172a', paddingBottom: 80 }}>
      {/* 头部 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        padding: '16px',
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', margin: 0, textAlign: 'center' }}>
          用户评价
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0', textAlign: 'center' }}>
          {currentStoreName} · {stats.totalReviews}条评价
        </p>
      </header>

      {/* 门店Tab导航 */}
      <div style={{
        display: 'flex', gap: 8, padding: '12px 16px',
        overflowX: 'auto', borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
      }}>
        {STORE_TABS.map((tab) => {
          const isActive = tab.storeCode === activeStore;
          return (
            <button
              key={tab.storeCode}
              onClick={() => handleStoreChange(tab.storeCode)}
              style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                border: isActive ? '1px solid #3b82f6' : '1px solid rgba(148, 163, 184, 0.15)',
                background: isActive ? '#1e3a5f' : '#1e293b',
                color: isActive ? '#60a5fa' : '#94a3b8',
                fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {tab.storeName}
            </button>
          );
        })}
      </div>

      {/* 评分概览 */}
      <section style={{
        padding: 16, margin: '0 16px 16px',
        borderRadius: 12, background: '#1e293b',
        border: '1px solid rgba(148, 163, 184, 0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#f59e0b' }}>
              {stats.averageRating}
            </div>
            <div style={{ fontSize: 16, color: '#f59e0b', letterSpacing: 2 }}>
              {renderStars(Math.round(stats.averageRating) as Rating)}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              {stats.totalReviews}条评价
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 2 }}>
              好评率 {stats.positiveRate}%
            </div>
            <div style={{
              width: '100%', height: 6, borderRadius: 3,
              background: '#334155', overflow: 'hidden',
            }}>
              <div style={{
                width: `${stats.positiveRate}%`, height: '100%',
                borderRadius: 3, background: 'linear-gradient(90deg, #10b981, #22c55e)',
              }} />
            </div>
          </div>
        </div>

        {/* 评分分布条 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {([5, 4, 3, 2, 1] as Rating[]).map((r) => {
            const dist = stats.distribution.find((d) => d.rating === r);
            const count = dist?.count || 0;
            const pct = dist?.percentage || 0;
            return (
              <button
                key={r}
                onClick={() => handleRatingFilter(r)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '2px 4px', borderRadius: 4,
                  opacity: ratingFilter === 0 || ratingFilter === r ? 1 : 0.5,
                }}
              >
                <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 32 }}>
                  {r}分
                </span>
                <div style={{
                  flex: 1, height: 8, borderRadius: 4,
                  background: '#334155', overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    borderRadius: 4, background: '#f59e0b',
                    transition: 'width 0.3s',
                  }} />
                </div>
                <span style={{ fontSize: 12, color: '#64748b', minWidth: 28, textAlign: 'right' }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 排序和筛选工具栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px 12px', gap: 8, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['latest', 'highest', 'lowest'] as const).map((sort) => (
            <button
              key={sort}
              onClick={() => handleSortChange(sort)}
              style={{
                padding: '5px 12px', borderRadius: 16,
                border: sortBy === sort ? '1px solid #3b82f6' : '1px solid rgba(148, 163, 184, 0.12)',
                background: sortBy === sort ? '#1e3a5f' : '#1e293b',
                color: sortBy === sort ? '#60a5fa' : '#94a3b8',
                fontSize: 12, cursor: 'pointer',
              }}
            >
              {SORT_LABELS[sort]}
            </button>
          ))}
        </div>
        <button
          onClick={toggleImageFilter}
          style={{
            padding: '5px 12px', borderRadius: 16,
            border: hasImageOnly ? '1px solid #3b82f6' : '1px solid rgba(148, 163, 184, 0.12)',
            background: hasImageOnly ? '#1e3a5f' : '#1e293b',
            color: hasImageOnly ? '#60a5fa' : '#94a3b8',
            fontSize: 12, cursor: 'pointer',
          }}
        >
          {hasImageOnly ? '✓ 有图' : '有图'}
        </button>
      </div>

      {/* 评价列表 */}
      <section style={{ padding: '0 16px' }}>
        {pagedReviews.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: '#64748b', fontSize: 14,
          }}>
            暂无符合条件的评价
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pagedReviews.map((review) => (
              <ReviewCard key={review.reviewId} review={review} />
            ))}
          </div>
        )}
      </section>

      {/* 分页 */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
          padding: '20px 16px',
        }}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            style={{
              padding: '8px 16px', borderRadius: 8,
              border: '1px solid rgba(148, 163, 184, 0.15)',
              background: page > 1 ? '#1e293b' : '#1a1f2e',
              color: page > 1 ? '#94a3b8' : '#475569',
              cursor: page > 1 ? 'pointer' : 'not-allowed',
              fontSize: 13,
            }}
          >
            上一页
          </button>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            style={{
              padding: '8px 16px', borderRadius: 8,
              border: '1px solid rgba(148, 163, 184, 0.15)',
              background: page < totalPages ? '#1e293b' : '#1a1f2e',
              color: page < totalPages ? '#94a3b8' : '#475569',
              cursor: page < totalPages ? 'pointer' : 'not-allowed',
              fontSize: 13,
            }}
          >
            下一页
          </button>
        </div>
      )}
    </main>
  );
}

// ============================================================
// 单条评价卡片组件
// ============================================================

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const contentTruncated = review.content.length > 80;

  return (
    <div style={{
      padding: 14, borderRadius: 12,
      background: '#1e293b', border: '1px solid rgba(148, 163, 184, 0.08)',
    }}>
      {/* 头部：用户信息 + 评分 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#334155', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 14, color: '#94a3b8',
            fontWeight: 600, overflow: 'hidden',
          }}>
            {review.author.nickname.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
              {review.author.nickname}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              {review.author.memberTier && `${review.author.memberTier}会员`}
              {review.productName && ` · ${review.productName}`}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, color: '#f59e0b', letterSpacing: 1 }}>
            {renderStars(review.rating)}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            {formatReviewTime(review.createdAt)}
          </div>
        </div>
      </div>

      {/* 标签 */}
      {review.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {review.tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: '2px 8px', borderRadius: 10,
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#60a5fa', fontSize: 11,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 评价内容 */}
      <p style={{
        fontSize: 14, color: '#cbd5e1', lineHeight: 1.6,
        margin: '0 0 8px', wordBreak: 'break-word',
      }}>
        {expanded || !contentTruncated ? review.content : `${review.content.slice(0, 80)}...`}
        {contentTruncated && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none', border: 'none', color: '#3b82f6',
              cursor: 'pointer', fontSize: 12, marginLeft: 4, padding: 0,
            }}
          >
            {expanded ? '收起' : '全文'}
          </button>
        )}
      </p>

      {/* 图片 */}
      {review.images.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, overflowX: 'auto' }}>
          {review.images.map((img, idx) => (
            <div
              key={idx}
              style={{
                width: 72, height: 72, borderRadius: 8,
                background: '#334155', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: '#475569',
              }}
            >
              📷
            </div>
          ))}
        </div>
      )}

      {/* 底部：点赞 + 门店 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: '#64748b' }}>
          👍 {review.likes}
        </div>
        <div style={{ fontSize: 11, color: '#475569' }}>
          {review.storeName}
        </div>
      </div>

      {/* 商家回复 */}
      {review.reply && (
        <div style={{
          marginTop: 10, padding: 10, borderRadius: 8,
          background: '#1a1f2e', border: '1px solid rgba(148, 163, 184, 0.05)',
        }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>商家回复：</div>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>{review.reply}</p>
          {review.repliedAt && (
            <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
              {formatReviewTime(review.repliedAt)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
